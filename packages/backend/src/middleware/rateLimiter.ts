import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { ApiResponse } from '@dr-assessment/shared';

export const apiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  } as ApiResponse,
  standardHeaders: true,
  legacyHeaders: false
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_ATTEMPTS',
      message: 'Too many login attempts, please try again after 15 minutes'
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  } as ApiResponse
});

export const pdfLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 PDF generations per hour
  message: {
    success: false,
    error: {
      code: 'PDF_LIMIT_EXCEEDED',
      message: 'PDF generation limit exceeded, please try again later'
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  } as ApiResponse
});
