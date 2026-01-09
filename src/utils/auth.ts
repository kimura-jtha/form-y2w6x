/**
 * Authentication utilities
 */
import { sha256 } from 'js-sha256';

const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;
const AUTH_KEY = '__X_USER_ACCESS_KEY__';
const USER_NAME_KEY = '__X_USER_NAME__';
const EMAIL_KEY = '__X_USER_EMAIL__';
const PASSWORD_KEY = '__X_PASSWORD__';

/**
 * Check if user is logged in
 */
export function isAuthenticated(): boolean {
  try {
    const authKey = localStorage.getItem(AUTH_KEY);
    const expired = Number(authKey?.split('_')[2] ?? '0') * 1e3;
    if (expired > Date.now()) {
      return !!authKey;
    }
    clearAuth();
    return false;
  } catch {
    clearAuth();
    return false;
  }
}

export function getUserName(): string | null {
  return localStorage.getItem(USER_NAME_KEY);
}

/**
 * Get email from session storage
 */
export function getEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY);
}

/**
 * Get access key from session storage
 */
export function getAccessKey(): string | null {
  return localStorage.getItem(AUTH_KEY);
}

/**
 * Set user name in session storage
 */
export function setUserName(userName: string): void {
  localStorage.setItem(USER_NAME_KEY, userName);
}

/**
 * Set email in session storage
 */
export function setEmail(email: string): void {
  localStorage.setItem(EMAIL_KEY, email);
}

/**
 * Set access key in session storage
 */
export function setAccessKey(accessKey: string): void {
  localStorage.setItem(AUTH_KEY, accessKey);
}

/**
 * Remove access key from session storage (logout)
 */
export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_NAME_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(PASSWORD_KEY);
}

export function generatePasswordV2(): string {
  const mark = new Date(`2026-01-01T00:00:00.000Z`);
  const limit = Math.floor((Date.now() + 3 * ONE_HOUR - mark.getTime()) / 60e3).toString(36);
  let counter = 0;
  do {
    counter++;
    const rnd = Math.random().toString(24).slice(4, 6);
    const pwd = `${rnd}${limit}`;
    if (validatePasswordV2(pwd)) {
      return pwd;
    }
  } while (counter < 100000);
  throw new Error('Failed to generate password');
}

export function validatePasswordV2(password: string): boolean {
  const hashed = sha256(password).toString();
  if (!hashed?.endsWith('a1')) {
    return false;
  }
  const mark = new Date(`2026-01-01T00:00:00.000Z`);
  console.log(password.slice(2, 6));
  const limit = Number.parseInt(password.slice(2, 6), 36) * 60e3 + mark.getTime();
  console.log(limit, new Date(limit).toISOString(), new Date().toISOString());
  return Date.now() < limit;
}

/**
 * @deprecated Use generatePasswordV2 instead
 */
export async function generatePassword(wait = 1000): Promise<string> {
  const start = Date.now();
  const limit = Date.now() + ONE_HOUR;
  const specialChars = '!@#$%^&*()';
  const normalChars = 'abcdefghijklmnopqrstuvwABCDEFGHIJKLMNOPQRSTUVW0123456789';

  const base = Array.from(
    { length: 10 },
    () => normalChars[Math.floor(Math.random() * normalChars.length)],
  ).join('');
  const special = Array.from(
    { length: 4 },
    () => specialChars[Math.floor(Math.random() * specialChars.length)],
  ).join('');
  const password =
    `${base}${special}`
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('') +
    'z' +
    limit.toString(36);

  let counter = 0;
  do {
    counter++;
    const rnd = Math.random().toString(24).slice(2, 6);
    const pwd = `${rnd}${password}`;
    if (validatePassword(pwd, limit)) {
      const duration = Date.now() - start;
      await new Promise((resolve) => setTimeout(resolve, Math.max(100, wait - duration)));
      return pwd;
    }
  } while (counter < 100000);

  throw new Error('Failed to generate password');
}

/**
 * @deprecated Use validatePasswordV2 instead
 */
export function validatePassword(password: string, limit?: number): boolean {
  if (!limit) {
    limit = Number.parseInt(password.split('z')[1], 36);
    if (isNaN(limit)) {
      return false;
    }
  }
  if (limit < Date.now()) {
    return false;
  }
  const hashed = sha256(`${password}:${limit}`).toString();
  return hashed?.endsWith('a1') ?? false;
}
