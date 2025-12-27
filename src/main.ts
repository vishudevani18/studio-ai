import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import helmet from 'helmet';
import * as compression from 'compression';
import * as bodyParser from 'body-parser';
// AppModule is dynamically imported after secrets are loaded to ensure ConfigModule validation happens after env vars are set
import { ValidationErrorUtil } from './common/utils/validation-error.util';
import { API_PREFIX, API_VERSION, ROUTES } from './common/constants';
import { createSuperAdmin } from './database/seeds/create-super-admin.seed';
import { loadEnvFromSecretManager } from './config/secret-loader';

async function bootstrap() {
  // Load environment variables from GCP Secret Manager in production
  // This MUST happen BEFORE NestFactory.create() because ConfigModule runs during AppModule initialization
  if (process.env.NODE_ENV === 'production') {
    try {
      await loadEnvFromSecretManager();
    } catch (error) {
      console.error('Failed to load environment variables from Secret Manager:', error.message);
      console.error('Application cannot start without the "env" secret in production');
      process.exit(1);
    }
  }

  // Dynamically import AppModule after secrets are loaded
  // This ensures ConfigModule.forRoot() runs AFTER secrets are loaded
  const { AppModule } = await import('./app.module');

  // Create the NestJS application
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Create super admin on startup
  try {
    const dataSource = app.get(DataSource);
    await createSuperAdmin(dataSource);
  } catch (error) {
    console.error('Failed to create super admin:', error.message);
  }

  // Increase body limit for Base64 images
  app.use(bodyParser.json({ limit: '20mb' }));
  app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));

  // Security middleware
  if (configService.get('app.security.helmetEnabled')) {
    app.use(helmet());
  }

  // Compression middleware
  app.use(compression());

  // CORS configuration
  const corsOrigins = configService.get<string[]>('app.cors.origin') || [];
  const isDevelopment = configService.get('app.nodeEnv') === 'development';
  
  // In development, allow all localhost origins for easier development
  const origin = isDevelopment
    ? (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow all localhost origins in development
        if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          callback(null, true);
        } else if (corsOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      }
    : corsOrigins;

  app.enableCors({
    origin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global validation pipe with custom exception factory for better error formatting
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      // Skip validation for undefined/null values and custom decorators
      skipMissingProperties: false,
      skipNullProperties: false,
      skipUndefinedProperties: false,
      exceptionFactory: errors => {
        const formattedErrors = ValidationErrorUtil.format(errors);

        return new BadRequestException({
          message: formattedErrors.message,
          errors: formattedErrors.errors,
          errorCount: formattedErrors.errorCount,
        });
      },
    }),
  );

  // API versioning
  app.setGlobalPrefix(API_PREFIX);

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('SaaS Backend API')
    .setDescription('Production-ready SaaS backend boilerplate with NestJS')
    .setVersion(API_VERSION)

    // Access Token (Bearer)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter Access Token: Bearer <token>',
        in: 'header',
      },
      'bearer',
    )

    // Refresh Token (Custom Header)
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'Enter Refresh Token: Refresh <token>',
      },
      'refresh-token',
    )

    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${API_PREFIX}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get('app.port') || 8080;
  await app.listen(port);

  const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

  console.log(`🚀 Application is running on: ${baseUrl}`);
  console.log(`📚 Swagger documentation: ${baseUrl}/${API_PREFIX}/docs`);
  console.log(`🏥 Health check: ${baseUrl}/${API_PREFIX}/${ROUTES.HEALTH.BASE}`);
}

bootstrap();
