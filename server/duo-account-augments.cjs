'use strict';
// The URL is server configuration, never supplied by the browser. Tokens are never persisted.
function createAccountAugments(apiBase, request = fetch) {
  const url = new URL('/saves', apiBase);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1','localhost','[::1]'].includes(url.hostname))) throw Error('Unsafe account API URL');
  return async token => {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) throw Error('Invalid account token');
    const response = await request(url, { headers: { Authorization: 'Bearer '+token, Accept: 'application/json' }, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw Error('Account API unavailable');
    const data = await response.json();
    if (data.augmentProtocol !== 1) throw Error('Account API needs augment update');
    return data.data?.profile || null;
  };
}
module.exports={createAccountAugments};
