// import { asyncDeduplicator } from '../../utils/dedupe';
// import { fetchLambda } from './_helper';
export async function alive() {
  return Promise.resolve(true);
  // return asyncDeduplicator.call('health', async () => {
  //   const response = await fetchLambda<{ status: 'healthy' }>({
  //     path: 'health',
  //     method: 'GET',
  //   });
  //   return response.status === 'healthy';
  // });
}
