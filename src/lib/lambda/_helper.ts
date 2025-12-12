import { getAccessKey } from '@/utils/auth';

const baseUrl = 'https://wwzd303c6l.execute-api.ap-northeast-1.amazonaws.com/default/lambda-runner';
const xApiKey = 'ak_1767958064_334e41e2273de69be6ef94b9d9933769';

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
    'Content-Type': 'application/json',
    'X-Api-Key': xApiKey,
  };
  const xUserAccessKey = getAccessKey();
  if (xUserAccessKey) {
    headers['X-User-Access-Key'] = xUserAccessKey;
  }
  return fetch(`${baseUrl}/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response.json() as Promise<T>;
  });
}
