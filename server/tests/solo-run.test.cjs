const test = require('node:test');
const assert = require('node:assert/strict');
const { createSoloRun } = require('../solo-run.cjs');
const loadCore = require('../../headless-core.cjs');
const options = { difficulty: 'normal', heroId: 'standard', loadout: ['archer','catapult','chain','freeze','mine'] };

function fixture(extra = {}) {
  let time = 0;
  const run = createSoloRun({ options, season: 'initial', now: () => time, ...extra });
  const { token } = run.credentials();
  const send = (action, payload = {}) => run.receive(token, { sequence: run.view(token).next, action, payload });
  return { run, token, send, advance(ms) { time += ms; run.tick(); } };
}
function place(f) {
  const core = loadCore(), { state } = core.snapshot.restore(f.run.checkpoint().run);
  for (let index = 0; index < state.hand.length; index++) for (let rotation = 0; rotation < 6; rotation++)
    for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++)
      if (core.placement.canPlace(state, q, r, core.placement.card(state, state.hand[index]), rotation)) {
        assert.equal(f.send('place', { q, r, index, rotation }).ok, true); return;
      }
  assert.fail('No legal placement');
}

test('solo commands reject forged scores, gold, invalid credentials and reordering', () => {
  const f = fixture(), before = f.run.view(f.token);
  assert.equal(f.run.receive('0'.repeat(64), { sequence: 1, action: 'start', payload: {} }).reason, 'unauthorized');
  assert.equal(f.send('score', { wave: 999, kills: 999 }).reason, 'invalid-command');
  assert.equal(f.send('baseUpgrade', { kind: 'weapon', gold: 999 }).reason, 'invalid-command');
  assert.equal(f.run.receive(f.token, { sequence: 2, action: 'pause', payload: { value: true } }).reason, 'sequence');
  assert.deepEqual(f.run.view(f.token), before);
});

test('replayed purchases are idempotent; legal commands use real game prices', () => {
  const f = fixture(), before = f.run.view(f.token).gold;
  const packet = { sequence: 1, action: 'baseUpgrade', payload: { kind: 'weapon' } };
  assert.equal(f.run.receive(f.token, packet).ok, true);
  const after = f.run.view(f.token).gold; assert.ok(after < before);
  assert.equal(f.run.receive(f.token, packet).duplicate, true);
  assert.equal(f.run.view(f.token).gold, after);
});

test('only server time advances combat, pause freezes it and excessive speed is rejected', () => {
  const f = fixture(); place(f); assert.equal(f.send('start').ok, true);
  const elapsed = () => loadCore().snapshot.restore(f.run.checkpoint().run).state.elapsedMs;
  assert.equal(f.send('speed', { value: 999 }).reason, 'invalid-command');
  f.advance(100); assert.ok(elapsed() > 0); const before = elapsed();
  for (let i = 0; i < 20; i++) f.run.tick(); assert.equal(elapsed(), before);
  f.send('pause', { value: true }); f.advance(1000); assert.equal(elapsed(), before);
  f.send('pause', { value: false }); f.advance(100); assert.ok(elapsed() > before);
});

test('a real simulated defeat settles completed waves and kills once, with starting category', () => {
  const results = [], f = fixture({ onResult: r => results.push(r) }); place(f);
  // Trusted fixture checkpoint gives the base one HP; no public input can do this.
  const cp = f.run.checkpoint(), core = loadCore(), restored = core.snapshot.restore(cp.run);
  restored.state.hp = 1; cp.run = core.snapshot.capture(restored.state, restored.random);
  let time = 0; const run = createSoloRun({ checkpoint: cp, now: () => time, onResult: r => results.push(r) });
  const token = run.credentials().token;
  run.receive(token, { sequence: run.view(token).next, action: 'start', payload: {} });
  for (let i = 0; i < 2000 && !results.length; i++) { time += 250; run.tick(); }
  assert.equal(results.length, 1); assert.equal(results[0].wave, 0); assert.equal(results[0].kills, 0);
  assert.equal(results[0].fronts, 1); assert.equal(results[0].season, 'initial');
  run.tick(); assert.equal(results.length, 1);
  assert.doesNotMatch(JSON.stringify(run.view(token)), /claimToken|"token"|"seed"/);
});

test('restoration preserves version and sequence, incompatible workers cannot resume a run', () => {
  const f = fixture(); f.send('pause', { value: true });
  const cp = f.run.checkpoint(), restored = createSoloRun({ checkpoint: cp });
  assert.deepEqual(restored.view(f.token), f.run.view(f.token));
  assert.throws(() => createSoloRun({ checkpoint: { ...cp, ruleset: 'other' } }), /original worker/);
});

test('a persistence failure locks the run instead of acknowledging unsaved progress', () => {
  let fail = false;
  const f = fixture({ persist() { if (fail) throw Error('disk full'); } }); fail = true;
  assert.throws(() => f.send('pause', { value: true }), /disk full/);
  assert.equal(f.run.healthy, false); assert.equal(f.run.view(f.token), null);
  assert.equal(f.run.receive(f.token, { sequence: 1, action: 'start', payload: {} }).reason, 'storage-unavailable');
});
