const accessKey = 'ak_1767958064_334e41e2273de69be6ef94b9d9933769';
const host = 'https://wwzd303c6l.execute-api.ap-northeast-1.amazonaws.com';
import { asyncDeduplicator } from '../../utils/dedupe';
export async function alive() {
  const url = `${host}/default/lambda-runner/health`;
  return asyncDeduplicator.call('health', async () => {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'x-api-key': accessKey },
    });
    return response.ok;
  });
}
