const test = require('node:test'), assert = require('node:assert/strict'), { Readable } = require('node:stream');
const { createLeaderboardHandler } = require('../leaderboard-http.cjs');
const { createLeaderboard } = require('../leaderboard.cjs');
const guest = 'a'.repeat(64);
function setup() {
  const board = createLeaderboard();
  board.record({ runId: 'run-1', season: 'initial', ruleset: '1.0.0', fronts: 1, wave: 35, kills: 123, claimToken: guest });
  const handler = createLeaderboardHandler({ leaderboard: board, verifyAccount: async token => token === 'admin' ? { id: 'admin', name: 'Admin', isAdmin: true } : token === 'user' ? { id: 'user', name: 'Player' } : null });
  return { board, call: (url, options) => call(handler, url, options) };
}
async function call(handler, url, { method = 'GET', token, runToken, body } = {}) {
  const req = Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))]);
  Object.assign(req, { url, method, socket: { remoteAddress: '127.0.0.1' }, headers: { ...(token ? { authorization: 'Bearer ' + token } : {}), ...(runToken ? { 'x-run-token': runToken } : {}) } });
  let result; const handled = await handler(req, (status, data) => { result = { status, data }; }); return { handled, ...result };
}
test('disabled backend is explicit; unrelated routes are untouched', async () => {
  const handler = createLeaderboardHandler();
  assert.equal((await call(handler, '/rankings')).status, 503);
  assert.equal((await call(handler, '/state')).handled, false);
});
test('guest result is private, claim uses verified account, moderation gates public entry', async () => {
  const f = setup();
  assert.equal((await f.call('/rankings/results/run-1')).status, 403);
  assert.equal((await f.call('/rankings/results/run-1', { runToken: guest })).data.wave, 35);
  assert.equal((await f.call('/rankings/results/run-1/claim', { method: 'POST', runToken: guest, body: {} })).status, 401);
  assert.equal((await f.call('/rankings/results/run-1/claim', { method: 'POST', runToken: guest, token: 'user', body: {} })).data.username, 'Player');
  assert.equal((await f.call('/rankings')).data.total, 0);
  assert.equal((await f.call('/rankings/results/run-1', { runToken: guest })).status, 403);
  assert.equal((await f.call('/rankings/results/run-1', { token: 'user' })).status, 200);
  assert.equal((await f.call('/rankings/pending', { token: 'user' })).status, 403);
  assert.equal((await f.call('/rankings/pending', { token: 'admin' })).data.total, 1);
  assert.equal((await f.call('/rankings/results/run-1/review', { method: 'POST', token: 'user', body: { decision: 'accepted', reason: 'ok' } })).status, 403);
  assert.equal((await f.call('/rankings/results/run-1/review', { method: 'POST', token: 'admin', body: { decision: 'accepted', reason: 'Geprüft' } })).status, 200);
  assert.equal((await f.call('/rankings')).data.entries[0].rank, 1);
});
test('forged identities and scores cannot be posted; malformed pagination is rejected', async () => {
  const f = setup();
  assert.equal((await f.call('/rankings/results/run-1/claim', { method: 'POST', token: 'user', runToken: guest, body: { account: { id: 'admin' }, wave: 999 } })).status, 400);
  assert.equal((await f.call('/rankings/results/run-1/score', { method: 'POST', token: 'user', body: { wave: 999 } })).status, 404);
  assert.equal((await f.call('/rankings?fronts=NaN')).status, 400);
  assert.equal((await f.call('/rankings?offset=-1')).status, 400);
});
test('account verifier errors fail closed and request floods are bounded', async () => {
  const handler = createLeaderboardHandler({ leaderboard: setup().board, now: () => 0, verifyAccount: async () => { throw Error('offline'); } });
  assert.equal((await call(handler, '/rankings/pending', { token: 'admin' })).status, 502);
  for (let i = 1; i < 120; i++) assert.equal((await call(handler, '/rankings')).status, 200);
  assert.equal((await call(handler, '/rankings')).status, 429);
});
