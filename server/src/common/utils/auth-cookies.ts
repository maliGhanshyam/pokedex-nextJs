import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

function parseDurationToMs(duration: string, fallbackMs: number): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return fallbackMs;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * (multipliers[unit] ?? 1000);
}

export function getCookieOptions(configService: ConfigService) {
  const isProduction = configService.get('NODE_ENV') === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
  };
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  configService: ConfigService,
): void {
  const base = getCookieOptions(configService);
  const accessMaxAge = parseDurationToMs(
    configService.get('JWT_ACCESS_TOKEN_EXPIRATION', '15m'),
    15 * 60 * 1000,
  );
  const refreshMaxAge = parseDurationToMs(
    configService.get('JWT_REFRESH_TOKEN_EXPIRATION', '7d'),
    7 * 24 * 60 * 60 * 1000,
  );

  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...base,
    maxAge: accessMaxAge,
  });

  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...base,
    maxAge: refreshMaxAge,
  });
}

export function clearAuthCookies(res: Response, configService: ConfigService): void {
  const base = getCookieOptions(configService);
  res.clearCookie(ACCESS_TOKEN_COOKIE, base);
  res.clearCookie(REFRESH_TOKEN_COOKIE, base);
}
