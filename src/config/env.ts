/**
 * Environment configuration with type safety
 * All environment variables should be accessed through this module
 */

interface EnvConfig {
  // App
  APP_NAME: string;
  APP_VERSION: string;
  APP_BUILD: string;

  // Feature flags
  IS_DEV: boolean;
  IS_PROD: boolean;
  IS_TEST: boolean;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = import.meta.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

const IS_DEV = import.meta.env.DEV;
const IS_PROD = !IS_DEV && location.hostname === 'form.jppa.jp';
const IS_TEST = !IS_DEV && location.hostname !== 'form.jppa.jp';
export const env: EnvConfig = {
  // App
  APP_NAME: getEnvVar('VITE_APP_NAME', 'Form Management'),
  APP_VERSION: getEnvVar('VITE_APP_VERSION', '0.0.0'),
  APP_BUILD: getEnvVar('VITE_APP_BUILD', 'dev'),

  // Feature flags
  IS_DEV,
  IS_PROD,
  IS_TEST,
};
