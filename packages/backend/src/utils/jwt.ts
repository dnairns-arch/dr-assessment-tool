import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JWTPayload } from '@dr-assessment/shared';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, env.jwt.secret) as JWTPayload;
}

export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as JWTPayload;
}
