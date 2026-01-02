import { notifications } from '@mantine/notifications';
import i18next from 'i18next';

import { ROUTES } from '@/constants';
import { clearAuth, getAccessKey } from '@/utils/auth';

const baseUrl = 'https://wwzd303c6l.execute-api.ap-northeast-1.amazonaws.com/default/lambda-runner';
const xApiKey = 'ak_1798761598_18c02e2a5e77d665ed101f671ca154e0';

export function fetchLambda<T>({
  path,
  method,
  body,
}: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: unknown;
}) {
  const headers: Record<string, string> = {
    'X-Api-Key': xApiKey,
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  const xUserAccessKey = getAccessKey();
  if (xUserAccessKey) {
    headers['X-User-Access-Key'] = xUserAccessKey;
  }
  return fetch(`${baseUrl}/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (response) => {
    if (response.status === 401) {
      clearAuth();
      notifications.show({
        title: i18next.t('auth.notifications.sessionExpired.title'),
        message: i18next.t('auth.notifications.sessionExpired.message'),
        color: 'red',
      });
      window.location.href = ROUTES.AUTH.LOGIN;
    }
    if (!response.ok) {
      throw new Error(await response.text());
    }
    if (response.status === 204) {
      return { success: true } as T;
    }
    return response.json() as Promise<T>;
  });
}
