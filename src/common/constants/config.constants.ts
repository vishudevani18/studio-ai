export const DEFAULT_NODE_ENV = 'development';
export const DEFAULT_PORT = 8080;

export const DEFAULT_DB_HOST = 'localhost';
export const DEFAULT_DB_PORT = 5432;
export const DEFAULT_DB_USERNAME = 'dbuser';
export const DEFAULT_DB_PASSWORD = 'password';
export const DEFAULT_DB_DATABASE = 'ai_photo_studio_db';

export const DEFAULT_JWT_SECRET = 'default-secret';
export const DEFAULT_JWT_EXPIRES_IN = '15m';
export const DEFAULT_JWT_REFRESH_SECRET = 'default-refresh-secret';
export const DEFAULT_JWT_REFRESH_EXPIRES_IN = '7d';

export const DEFAULT_CORS_ORIGIN = 'http://localhost:8080';

export const DEFAULT_THROTTLE_TTL = 60;
export const DEFAULT_THROTTLE_LIMIT = 100;

export const DEFAULT_MAX_FILE_SIZE = 10485760; // 10MB
export const DEFAULT_UPLOAD_PATH = './uploads';

export const DEFAULT_GEMINI_API_KEY = 'AIzaSyBYDMNkOWla5DSPNkmBCnV_fizHgOuaZH0';
export const DEFAULT_GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta';
export const DEFAULT_GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';
export const DEFAULT_IMAGE_RETENTION_HOURS = 6;

export const DEFAULT_LOG_LEVEL = 'info';
export const DEFAULT_LOG_FILE = 'logs/app.log';

export const DEFAULT_CSRF_ENABLED = false;
export const DEFAULT_HELMET_ENABLED = true;

export const DEFAULT_STRIPE_SECRET_KEY = 'sk_test_mock_key';
export const DEFAULT_STRIPE_WEBHOOK_SECRET = 'whsec_mock_secret';

export const DEFAULT_REDIS_HOST = 'localhost';
export const DEFAULT_REDIS_PORT = 6379;
export const DEFAULT_REDIS_DB = 0;
export const DEFAULT_REDIS_DEFAULT_TTL = 3600;
export const DEFAULT_REDIS_MAX_ITEMS = 1000;

export const DEFAULT_STORAGE_PROVIDER = 'local';
export const DEFAULT_S3_BUCKET = 'your-s3-bucket';
export const DEFAULT_S3_REGION = 'us-east-1';
export const DEFAULT_S3_ACCESS_KEY_ID = 'your-access-key';
export const DEFAULT_S3_SECRET_ACCESS_KEY = 'your-secret-key';

export const DEFAULT_CLOUDINARY_CLOUD_NAME = 'your-cloud-name';
export const DEFAULT_CLOUDINARY_API_KEY = 'your-api-key';
export const DEFAULT_CLOUDINARY_API_SECRET = 'your-api-secret';

export const DEFAULT_GCS_BUCKET_NAME = 'your-gcs-bucket';
export const DEFAULT_GCS_PROJECT_ID = 'your-gcs-project-id';
export const DEFAULT_GCS_CDN_BASE_URL = 'https://storage.googleapis.com';

export const DEFAULT_BASE_URL = 'http://localhost:8080';

// WhatsApp Business API Defaults
export const DEFAULT_WHATSAPP_PROVIDER = 'meta-direct';
export const DEFAULT_WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
export const DEFAULT_WHATSAPP_OTP_SIGNUP_TEMPLATE = 'otp_signup';
export const DEFAULT_WHATSAPP_OTP_RESET_TEMPLATE = 'otp_reset_password';
