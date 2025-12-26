/**
 * Authentication utilities
 */

const AUTH_KEY = '__X_USER_ACCESS_KEY__';
const USER_NAME_KEY = '__X_USER_NAME__';
const EMAIL_KEY = '__X_USER_EMAIL__';

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
}
