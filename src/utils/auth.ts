/**
 * Authentication utilities
 */
import { env } from '@/config/env';
import seedrandom from 'seedrandom';

const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;
// const ONE_DAY = 24 * ONE_HOUR;
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

// function getMark() {
//   const d = new Date();
//   d.setHours(0, 0, 0, 0);
//   d.setDate(1);
//   let mark = d.getTime();
//   if (Date.now() - mark > 15 * ONE_DAY) {
//     mark += 15 * ONE_DAY;
//   }
//   return mark;
// }

const k = env.IS_PROD ? 20 : 200;

export function generatePasswordV3(force = false) {
  if (!force) {
    try {
      const data = localStorage.getItem(PASSWORD_KEY);
      const { password, limit } = JSON.parse(data ?? '{}') as { password: string; limit: number };
      if (password && limit && validatePasswordV3(password)) {
        return { password, limit };
      }
    } catch {
      // Ignore
    }
  }
  localStorage.removeItem(PASSWORD_KEY);
  const span = 10 * ONE_MINUTE;
  let now = Date.now() - 120 * ONE_MINUTE;
  now = now - (now % span);
  let limit = now + 3 * ONE_HOUR + span;
  const random = Math.floor(Math.random() * 1);
  const rng = seedrandom(`${random + k}.${now.toString(36)}`);
  const password = rng.int32().toString().slice(-4);
  localStorage.setItem(PASSWORD_KEY, JSON.stringify({ password, limit }));
  return { password, limit };
}

export function validatePasswordV3(pwd: string) {
  const span = 10 * ONE_MINUTE;
  let mark = Date.now() - 3 * ONE_HOUR;
  mark = mark - (mark % span);
  let end = Date.now();
  end = end - (end % span) + span + 1;

  do {
    for (let random = 0; random < 1; random++) {
      const rng = seedrandom(`${random + k}.${mark.toString(36)}`);
      const password = rng.int32().toString().slice(-4);
      if (password === pwd) {
        return true;
      }
    }
    mark += span;
  } while (mark < end);
  return false;

  // const random = 0;

  // for (let i = 0; i < 100000; i++) {
  //   const seed = (i + (now - (now % ONE_MINUTE)) / 1e3).toString(36);
  //   const rng = seedrandom(seed);
  //   const pwd = (rng.int32()).toString().slice(-4);
  //   if (pwd === password) {
  //     return true;
  //   }
  // }
  // return false;
}

// const now = new Date('2026-01-09T12:37:12.000Z').getTime();
// export function generatePasswordV2() {
//   const mark = getMark();
//   const limit = now + 3 * ONE_HOUR;
//   const suffix = Math.floor((limit - mark) / ONE_MINUTE).toString(36);
//   let counter = 0;
//   let skip = Math.floor(Math.random() * 20);
//   let lastValidPassword = '';
//   do {
//     counter++;
//     const rnd = Math.random().toString(24).slice(3, 6);
//     const pwd = `${rnd}${suffix}`;
//     if (validatePasswordV2(pwd)) {
//       // return { password: pwd, limit };
//       skip--;
//       if (skip < 0) {
//         return { password: pwd, limit };
//       }
//       lastValidPassword = pwd;
//     }
//   } while (counter < 100000);
//   if (lastValidPassword) {
//     return { password: lastValidPassword, limit };
//   }
//   throw new Error('Failed to generate password');
// }

// export function validatePasswordV2(password: string): boolean {
//   const hashed = sha256(password).toString();
//   const lastChar = hashed?.slice(-2);
//   if (lastChar !== 'a1' && lastChar !== 'a3') {
//     // console.log(password, hashed, lastChar);
//     return false;
//   }

//   const mark = getMark();
//   const limit = Number.parseInt(password.slice(3), 36) * ONE_MINUTE + mark;

//   // console.log(new Date(limit).toISOString(), new Date().toISOString());
//   return now < limit;
// }

// /**
//  * @deprecated Use generatePasswordV2 instead
//  */
// export async function generatePassword(wait = 1000): Promise<string> {
//   const start = Date.now();
//   const limit = Date.now() + ONE_HOUR;
//   const specialChars = '!@#$%^&*()';
//   const normalChars = 'abcdefghijklmnopqrstuvwABCDEFGHIJKLMNOPQRSTUVW0123456789';

//   const base = Array.from(
//     { length: 10 },
//     () => normalChars[Math.floor(Math.random() * normalChars.length)],
//   ).join('');
//   const special = Array.from(
//     { length: 4 },
//     () => specialChars[Math.floor(Math.random() * specialChars.length)],
//   ).join('');
//   const password =
//     `${base}${special}`
//       .split('')
//       .sort(() => Math.random() - 0.5)
//       .join('') +
//     'z' +
//     limit.toString(36);

//   let counter = 0;
//   do {
//     counter++;
//     const rnd = Math.random().toString(24).slice(2, 6);
//     const pwd = `${rnd}${password}`;
//     if (validatePassword(pwd, limit)) {
//       const duration = Date.now() - start;
//       await new Promise((resolve) => setTimeout(resolve, Math.max(100, wait - duration)));
//       return pwd;
//     }
//   } while (counter < 100000);

//   throw new Error('Failed to generate password');
// }

// /**
//  * @deprecated Use validatePasswordV2 instead
//  */
// export function validatePassword(password: string, limit?: number): boolean {
//   if (!limit) {
//     limit = Number.parseInt(password.split('z')[1], 36);
//     if (isNaN(limit)) {
//       return false;
//     }
//   }
//   if (limit < Date.now()) {
//     return false;
//   }
//   const hashed = sha256(`${password}:${limit}`).toString();
//   return hashed?.endsWith('a1') ?? false;
// }
