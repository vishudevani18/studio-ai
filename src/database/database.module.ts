import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ImageCleanupSubscriber } from './subscribers/image-cleanup.subscriber';
import { GeneratedImageCleanupSubscriber } from './subscribers/generated-image-cleanup.subscriber';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const host = configService.get('app.database.host');
        const isCloudSql = host && host.startsWith('/cloudsql/');
        
        return {
          type: 'postgres',
          host: host,
          port: configService.get('app.database.port'),
          username: configService.get('app.database.username'),
          password: configService.get('app.database.password'),
          database: configService.get('app.database.database'),
          /**
           * ✅ Automatically load all entities (from dist or src)
           */
          autoLoadEntities: true,
          synchronize: configService.get('app.nodeEnv') === 'development',
          logging: configService.get('app.nodeEnv') === 'development',
          // ✅ IMPORTANT: Cloud SQL Unix socket does NOT use SSL
          ssl: false,
          extra: {
            // ✅ IMPORTANT: Disable SSL in extra config for Cloud SQL
            ssl: false,
            max: 10,
            min: 2,
            acquire: 30000,
            idle: 10000,
            evict: 1000,
            handleDisconnects: true,
            statement_timeout: 30000,
          },
        };
      },
      inject: [ConfigService],
    }),
    StorageModule,
  ],
  providers: [ImageCleanupSubscriber, GeneratedImageCleanupSubscriber],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
