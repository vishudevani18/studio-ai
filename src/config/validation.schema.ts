import * as Joi from 'joi';
import {
  DEFAULT_NODE_ENV,
  DEFAULT_PORT,
  DEFAULT_DB_HOST,
  DEFAULT_DB_PORT,
  DEFAULT_JWT_EXPIRES_IN,
  DEFAULT_JWT_REFRESH_EXPIRES_IN,
  DEFAULT_CORS_ORIGIN,
  DEFAULT_THROTTLE_TTL,
  DEFAULT_THROTTLE_LIMIT,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_UPLOAD_PATH,
  DEFAULT_GEMINI_API_URL,
  DEFAULT_LOG_LEVEL,
  DEFAULT_LOG_FILE,
  DEFAULT_CSRF_ENABLED,
  DEFAULT_HELMET_ENABLED,
} from 'src/common/constants/config.constants';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default(DEFAULT_NODE_ENV),
  PORT: Joi.number().default(DEFAULT_PORT),

  // Database
  DB_HOST: Joi.string().default(DEFAULT_DB_HOST),
  DB_PORT: Joi.number().default(DEFAULT_DB_PORT),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default(DEFAULT_JWT_EXPIRES_IN),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default(DEFAULT_JWT_REFRESH_EXPIRES_IN),

  // CORS
  CORS_ORIGIN: Joi.string().default(DEFAULT_CORS_ORIGIN),

  // Rate Limiting
  THROTTLE_TTL: Joi.number().default(DEFAULT_THROTTLE_TTL),
  THROTTLE_LIMIT: Joi.number().default(DEFAULT_THROTTLE_LIMIT),

  // File Upload
  MAX_FILE_SIZE: Joi.number().default(DEFAULT_MAX_FILE_SIZE),
  UPLOAD_PATH: Joi.string().default(DEFAULT_UPLOAD_PATH),

  // Gemini API (Optional - has default, but AI features won't work without it)
  GEMINI_API_KEY: Joi.string().optional(),
  GEMINI_API_URL: Joi.string().default(DEFAULT_GEMINI_API_URL),
  GEMINI_IMAGE_MODEL: Joi.string().optional(),
  IMAGE_RETENTION_HOURS: Joi.number().default(6),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default(DEFAULT_LOG_LEVEL),
  LOG_FILE: Joi.string().default(DEFAULT_LOG_FILE),

  // Security
  CSRF_ENABLED: Joi.boolean().default(DEFAULT_CSRF_ENABLED),
  HELMET_ENABLED: Joi.boolean().default(DEFAULT_HELMET_ENABLED),

  // Stripe (Optional - only required if using payment features)
  STRIPE_SECRET_KEY: Joi.string().optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional(),

  // WhatsApp Business API - Optional
  WHATSAPP_PROVIDER: Joi.string().valid('meta-direct', 'msg91', 'gupshup').optional(),
  WHATSAPP_API_URL: Joi.string().uri().optional(),
  WHATSAPP_ACCESS_TOKEN: Joi.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: Joi.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: Joi.string().optional(),
  WHATSAPP_APP_ID: Joi.string().optional(),
  WHATSAPP_APP_SECRET: Joi.string().optional(),
  // BSP Credentials
  MSG91_API_KEY: Joi.string().optional(),
  MSG91_SENDER_ID: Joi.string().optional(),
  GUPSHUP_API_KEY: Joi.string().optional(),
  GUPSHUP_APP_NAME: Joi.string().optional(),
  // Templates
  WHATSAPP_OTP_SIGNUP_TEMPLATE: Joi.string().optional(),
  WHATSAPP_OTP_RESET_TEMPLATE: Joi.string().optional(),

  // Super Admin (Optional - only needed for initial setup)
  SUPER_ADMIN_EMAIL: Joi.string().email().optional(),
  SUPER_ADMIN_PASSWORD: Joi.string().min(8).optional(),

  // GCS Configuration
  GCS_BUCKET_NAME: Joi.string().optional(),
  GCS_PROJECT_ID: Joi.string().optional(),
  GCS_CDN_BASE_URL: Joi.string().uri().optional(),
});
