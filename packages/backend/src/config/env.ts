import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),

  // Server
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX: z.string().default('100'),

  // Email (Optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // PDF
  PDF_OUTPUT_DIR: z.string().default('./reports'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Security
  BCRYPT_ROUNDS: z.string().default('12'),
  SESSION_SECRET: z.string().min(32).optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Environment variable validation failed:', parsed.error.format());
  process.exit(1);
}

export const env = {
  database: {
    url: parsed.data.DATABASE_URL
  },
  redis: {
    url: parsed.data.REDIS_URL
  },
  jwt: {
    secret: parsed.data.JWT_SECRET,
    refreshSecret: parsed.data.JWT_REFRESH_SECRET
  },
  server: {
    port: parseInt(parsed.data.PORT, 10),
    nodeEnv: parsed.data.NODE_ENV
  },
  cors: {
    origin: parsed.data.CORS_ORIGIN.split(',').map((o) => o.trim())
  },
  rateLimit: {
    windowMs: parseInt(parsed.data.RATE_LIMIT_WINDOW_MS, 10),
    max: parseInt(parsed.data.RATE_LIMIT_MAX, 10)
  },
  email: {
    host: parsed.data.SMTP_HOST,
    port: parsed.data.SMTP_PORT ? parseInt(parsed.data.SMTP_PORT, 10) : undefined,
    secure: parsed.data.SMTP_SECURE === 'true',
    user: parsed.data.SMTP_USER,
    pass: parsed.data.SMTP_PASS,
    from: parsed.data.EMAIL_FROM || 'noreply@dr-assessment.com'
  },
  pdf: {
    outputDir: parsed.data.PDF_OUTPUT_DIR
  },
  logging: {
    level: parsed.data.LOG_LEVEL
  },
  security: {
    bcryptRounds: parseInt(parsed.data.BCRYPT_ROUNDS, 10),
    sessionSecret: parsed.data.SESSION_SECRET
  }
};
