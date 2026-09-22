const { test } = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
function rules() { const c = {}; for (const name of ['random', 'map', 'run-runtime']) vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../classes', name + '.js'), 'utf8'), c); return vm.runInNewContext('({rng:HexRandom,runtime:HexRunRuntime})', c); }
test('saved random streams resume exactly, including an independent mine stream', () => {
  const { rng } = rules(), main = rng.create('duo-a'), mine = rng.create('duo-a|mines');
  for (let i = 0; i < 123; i++)main(); for (let i = 0; i < 19; i++)mine();
  const snapshot = JSON.parse(JSON.stringify({ main: main.snapshot(), mine: mine.snapshot() })), a = rng.restore(snapshot.main), b = rng.restore(snapshot.mine);
  for (let i = 0; i < 1000; i++) { assert.equal(a(), main()); assert.equal(b(), mine()); }
  for (const value of [-1, 0x100000000, .5, NaN]) assert.throws(() => rng.restore({ version: 1, value }));
  assert.throws(() => rng.restore({ version: 2, value: 0 }));
});
test('two independent headless spawn queues survive JSON checkpoints with identical order and timing', () => {
  const { runtime: r } = rules(), sources = [{ tile: { q: 1, r: 0 }, dir: 0 }, { tile: { q: 0, r: -1 }, dir: 2 }], enemies = Array.from({ length: 8 }, () => ({ speed: 25 }));
  const a = { elapsedMs: 100, waveRunning: true }, b = { elapsedMs: 500, waveRunning: true }; r.schedule(a, sources, enemies); r.schedule(b, sources, enemies);
  const first = []; r.drain(a, 100, job => first.push(job.index)); assert.deepEqual(first, [0]); assert.equal(b.pendingSpawns, 8);
  const restored = JSON.parse(JSON.stringify(a)), originalJobs = [], restoredJobs = [];
  for (let time = 200; time < 7000; time += 50) { r.drain(a, time, job => originalJobs.push(JSON.stringify(job))); r.drain(restored, time, job => restoredJobs.push(JSON.stringify(job))); }
  assert.deepEqual(originalJobs, restoredJobs); assert.equal(a.pendingSpawns, 0); assert.equal(restored.pendingSpawns, 0); assert.equal(b.pendingSpawns, 8);
  b.waveRunning = false; r.drain(b, 10000, () => assert.fail('paused run spawned'));
  assert.equal(b.pendingSpawns, 8);
});
