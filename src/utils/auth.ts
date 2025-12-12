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
  return !!sessionStorage.getItem(AUTH_KEY);
}

export function getUserName(): string | null {
  return sessionStorage.getItem(USER_NAME_KEY);
}

/**
 * Get email from session storage
 */
export function getEmail(): string | null {
  return sessionStorage.getItem(EMAIL_KEY);
}

/**
 * Get access key from session storage
 */
export function getAccessKey(): string | null {
  return sessionStorage.getItem(AUTH_KEY);
}

/**
 * Set user name in session storage
 */
export function setUserName(userName: string): void {
  sessionStorage.setItem(USER_NAME_KEY, userName);
}

/**
 * Set email in session storage
 */
export function setEmail(email: string): void {
  sessionStorage.setItem(EMAIL_KEY, email);
}

/**
 * Set access key in session storage
 */
export function setAccessKey(accessKey: string): void {
  sessionStorage.setItem(AUTH_KEY, accessKey);
}

/**
 * Remove access key from session storage (logout)
 */
export function clearAuth(): void {
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(USER_NAME_KEY);
  sessionStorage.removeItem(EMAIL_KEY);
}
