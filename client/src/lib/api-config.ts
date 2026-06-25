/** Shared API configuration for all client HTTP clients */

const isBrowser = typeof window !== 'undefined';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (isBrowser
    ? window.location.origin.replace(/:\d+$/, ':3001')
    : 'http://localhost:3001');

/** Render free tier cold starts can take 30–60s */
export const API_TIMEOUT = parseInt(
  process.env.NEXT_PUBLIC_API_TIMEOUT || '60000',
  10,
);

export const isProductionApi =
  process.env.NODE_ENV === 'production' ||
  API_BASE_URL.startsWith('https://');
