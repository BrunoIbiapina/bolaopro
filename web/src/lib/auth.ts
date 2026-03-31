import Cookies from 'js-cookie';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return Cookies.get(ACCESS_TOKEN_KEY) || null;
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return Cookies.get(REFRESH_TOKEN_KEY) || null;
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  // Set tokens with 7 day expiration for refresh token, 1 hour for access token
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, {
    expires: 1 / 24,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
    expires: 7,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
};

export const clearTokens = (): void => {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};
