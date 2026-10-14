const test = require('node:test');
const assert = require('node:assert/strict');
const { createLeaderboard } = require('../leaderboard.cjs');
const admin = { id: 'moderator', isAdmin: true };
const token = 'a'.repeat(64);
const result = (id, extra = {}) => ({ runId: id, ruleset: '1.0.0', fronts: 1, wave: 35, kills: 100, account: { id, name: id }, ...extra });
const accept = (board, id) => board.review(id, 'accepted', 'Geprüfter Lauf', admin);

test('new entries require moderation; wave, kills and shared ranks determine public order', () => {
  const b = createLeaderboard();
  b.record(result('a')); b.record(result('b', { kills: 120 })); b.record(result('c', { wave: 36, kills: 1 })); b.record(result('d', { kills: 120 }));
  assert.equal(b.list().total, 0);
  for (const id of ['a','b','c','d']) accept(b, id);
  assert.deepEqual(b.list().entries.map(r => [r.username, r.rank]), [['c',1],['b',2],['d',2],['a',4]]);
  b.review('b', 'rejected', 'Fehlentscheidung korrigiert', admin);
  assert.equal(b.list().total, 3);
  assert.equal(b.checkpoint().results.find(r => r.runId === 'b').reviews.length, 2);
});

test('guests can preview rank and claim exactly once with credential and verified account', () => {
  const b = createLeaderboard(); b.record(result('a')); accept(b, 'a');
  const preview = b.record(result('guest', { account: null, claimToken: token, kills: 101 }));
  assert.equal(preview.rank, 1); assert.equal(preview.provisional, true); assert.equal(b.list().total, 1);
  assert.throws(() => b.claim('guest', 'b'.repeat(64), { id: 'new', name: 'New' }), /Unauthorized/);
  const claimed = b.claim('guest', token, { id: 'new', name: 'New' });
  assert.equal(claimed.status, 'pending'); assert.equal(b.list().total, 1);
  b.claim('guest', token, { id: 'new', name: 'New' });
  assert.throws(() => b.claim('guest', token, { id: 'other', name: 'Other' }), /Unauthorized/);
  accept(b, 'guest'); assert.equal(b.list().entries[0].username, 'New');
  assert.doesNotMatch(JSON.stringify(b.list()), /claimHash|adminId|"account"/);
});

test('one personal best per starting variant; versions do not split seasons', () => {
  const b = createLeaderboard();
  b.record(result('old')); accept(b, 'old');
  b.record(result('new', { account: { id: 'old', name: 'Old' }, ruleset: '2.0.0', kills: 110 })); accept(b, 'new');
  b.record(result('dual', { account: { id: 'old', name: 'Old' }, fronts: 2 })); accept(b, 'dual');
  assert.equal(b.list().total, 1); assert.equal(b.list().entries[0].runId, 'new');
  assert.equal(b.list({ fronts: 2 }).entries[0].runId, 'dual');
  b.changeSeason('season-two'); assert.equal(b.list().total, 0); assert.equal(b.list({ season: 'initial' }).total, 1);
  assert.equal(createLeaderboard({ snapshot: b.checkpoint() }).season, 'season-two');
});

test('duplicate results cannot overwrite scores and failed writes never publish a change', () => {
  let fail = false; const b = createLeaderboard({ persist() { if (fail) throw Error('disk full'); } });
  b.record(result('a')); b.record(result('a')); assert.equal(b.checkpoint().results.length, 1);
  assert.throws(() => b.record(result('a', { wave: 999 })), /Conflicting/);
  assert.throws(() => b.review('a', 'accepted', 'yes', { id: 'fake' }), /Administrator/);
  fail = true; assert.throws(() => accept(b, 'a'), /disk full/); assert.equal(b.list().total, 0);
  assert.throws(() => b.record(result('bad', { kills: NaN })), /Invalid/);
});

test('review queue is admin-only and excludes unclaimed guests and decided results', () => {
  const b = createLeaderboard(); b.record(result('a')); b.record(result('b'));
  b.record(result('guest', { account: null, claimToken: token }));
  assert.throws(() => b.pending({ id: 'a', isAdmin: false }), /Administrator/);
  assert.equal(b.pending(admin).total, 2);
  accept(b, 'a'); assert.deepEqual(b.pending(admin).entries.map(r => r.runId), ['b']);
  assert.doesNotMatch(JSON.stringify(b.pending(admin)), /claimHash|"account"/);
});

test('moderation and guest claim survive restart without publishing pending entries', () => {
  const b = createLeaderboard(); b.record(result('guest', { account: null, claimToken: token }));
  b.claim('guest', token, { id: 'a', name: 'A' });
  const restored = createLeaderboard({ snapshot: b.checkpoint() });
  assert.equal(restored.list().total, 0); accept(restored, 'guest');
  assert.equal(restored.list().entries[0].username, 'A');
  assert.throws(() => restored.claim('guest', token, { id: 'b', name: 'B' }), /Unauthorized/);
});
