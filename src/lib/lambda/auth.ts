import { getEmail, setAccessKey, setEmail, setUserName } from '@/utils/auth';

import { fetchLambda } from './_helper';

export async function login(email: string, password: string) {
  const response = await fetchLambda<{ accessKey: string; user: { name: string } }>({
    path: 'auth/login',
    method: 'POST',
    body: { email, password },
  });
  if (response.accessKey) {
    setUserName(response.user.name);
    setEmail(email);
    setAccessKey(response.accessKey);
    return { success: true, accessKey: response.accessKey };
  }
  return { success: false, message: 'Failed to login' };
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const email = getEmail();
  if (!email) {
    return { success: false, message: 'Email not found' };
  }
  await fetchLambda<{ success: boolean; message: string }>({
    path: 'auth/change-password',
    method: 'POST',
    body: { email, currentPassword, newPassword },
  });
}
