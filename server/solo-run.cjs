'use strict';

const crypto = require('node:crypto');
const loadCore = require('../headless-core.cjs');
const { payloadValid } = require('./duo-room.cjs');
const RULESET = require('../package.json').version;
const clone = value => JSON.parse(JSON.stringify(value));
const empty = value => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0;
const allowed = new Set(['place','reward','acknowledge','tower','upgrade','consumable','baseUpgrade','buildingTarget','sellBuilding','sellTower','targetPriority','building','buildingUpgrade','tunnel']);

// Internal adapter: options must be derived from VERIFIED server-side progress.
// This module deliberately has no public endpoint accepting a profile or score.
function createSoloRun({ options, season, account = null, now = Date.now, persist = () => {}, onResult = () => {}, checkpoint } = {}) {
  const core = loadCore();
  if (checkpoint && (checkpoint.format !== 'autohex-solo' || checkpoint.ruleset !== RULESET)) throw Error('Incompatible solo ruleset; preserve checkpoint for its original worker');
  if (!checkpoint && (!options || options.challengeDay || !['normal','dual'].includes(options.difficulty) || typeof season !== 'string' || !season)) throw Error('Standard run options required');
  const run = checkpoint ? core.snapshot.restore(checkpoint.run) : core.session.create({ ...options, seed: crypto.randomUUID(), runId: crypto.randomUUID() });
  let meta = checkpoint ? clone(checkpoint.meta) : { id: run.state.runId, season, account, fronts: options.difficulty === 'dual' ? 2 : 1,
    token: crypto.randomBytes(32).toString('hex'), next: 1, speed: 1, paused: false, last: null, result: null };
  let healthy = true, lastTick = now(), debt = 0;
  const snapshot = () => ({ format: 'autohex-solo', ruleset: RULESET, meta: clone(meta), run: core.snapshot.capture(run.state, run.random) });
  function save() { try { persist(snapshot()); } catch (error) { healthy = false; throw error; } }
  function finish() {
    const s = run.state;
    if (s.phase !== 'gameover' || meta.result) return;
    const earned = s.earnedMeta || {};
    meta.result = { runId: meta.id, season: meta.season, account: meta.account, claimToken: meta.token,
      ruleset: RULESET, fronts: meta.fronts, wave: s.lastCompletedWave || 0,
      kills: (earned.normalKills || 0) + (earned.periodicBosses || 0) + (earned.explorationBosses || 0) };
    save(); onResult(clone(meta.result));
  }
  function slotTower(slot) { return run.state.map.get(core.map.key(slot.q, slot.r))?.towers?.[slot.index]; }
  function apply(action, p) {
    const s = run.state;
    if (action === 'start') { core.flow.start(s, run.random); return s.waveRunning; }
    if (action === 'endless') return core.session.endless(s, run.random);
    if (action === 'pause') { meta.paused = p.value; return true; }
    if (action === 'speed') { meta.speed = p.value; return true; }
    if (action === 'place') return !!core.session.place(s, run.random, p);
    if (action === 'reward') return core.session.choose(s, run.random, p.offerId, p.index);
    if (action === 'acknowledge') return core.session.acknowledge(s);
    if (action === 'tower') return core.towers.buy(s, p.type, p.slots).ok;
    if (action === 'upgrade') return core.towers.upgrade(s, p.slot, p.upgrade);
    if (action === 'consumable') return core.combat.buyConsumable(s, p.kind, p.slot);
    if (action === 'baseUpgrade') return core.heroes.buy(s, p.kind);
    if (action === 'buildingTarget') return core.buildings.setTarget(s, p.slot, p.target);
    if (action === 'sellBuilding') return core.buildings.sell(s, p.slot);
    if (action === 'building') return core.buildings.buy(s, p.slot, p.type);
    if (action === 'buildingUpgrade') return core.buildings.upgrade(s, p.slot);
    if (action === 'tunnel') return core.runtime.rescueTunnel(s);
    if (action === 'targetPriority') { const tower = slotTower(p.slot); if (!tower) return false; tower.targetPriority = [...p.priorities]; return true; }
    if (action === 'sellTower') {
      const tower = slotTower(p.slot), refund = core.data.towerRefund(s, tower); if (!refund) return false;
      core.data.recordTowerStat(s, tower, 'refundGold', refund.amount);
      if (s.runTowerDetails[tower.statId]) s.runTowerDetails[tower.statId].sold = true;
      s.gold += refund.amount; s.map.get(core.map.key(p.slot.q, p.slot.r)).towers[p.slot.index] = null; return true;
    }
    return false;
  }
  function advance() {
    if (!healthy) return;
    const current = now(), elapsed = Math.max(0, Math.min(250, current - lastTick)); lastTick = current;
    if (meta.paused || meta.result || !run.state.waveRunning) { debt = 0; return; }
    debt += elapsed * meta.speed * core.runtime.PLAYBACK_RATE;
    while (debt >= 50 && run.state.waveRunning) { core.session.advance(run.state, run.random, .05); debt -= 50; }
    if (!run.state.waveRunning) debt = 0;
    finish();
  }
  function authorized(token) { return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token) && crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(meta.token, 'hex')); }
  if (!checkpoint) save();
  // Delivery is repeatable after a crash between persistence and ledger insertion.
  if (meta.result) onResult(clone(meta.result));
  return {
    credentials() { return { runId: meta.id, token: meta.token }; },
    checkpoint: snapshot,
    tick: advance,
    flush: save,
    get healthy() { return healthy; },
    receive(token, packet) {
      if (!authorized(token)) return { ok: false, reason: 'unauthorized' };
      if (!healthy) return { ok: false, reason: 'storage-unavailable' };
      if (!packet || Object.keys(packet).sort().join(',') !== 'action,payload,sequence' || !Number.isSafeInteger(packet.sequence)) return { ok: false, reason: 'invalid-command' };
      const fingerprint = JSON.stringify(packet);
      if (meta.last?.fingerprint === fingerprint) return { ...meta.last.reply, duplicate: true };
      if (packet.sequence !== meta.next) return { ok: false, reason: 'sequence', next: meta.next };
      const { action, payload } = packet;
      const valid = ['start','endless'].includes(action) ? empty(payload)
        : ['pause','speed'].includes(action) || allowed.has(action) ? payloadValid(action, payload) : false;
      if (!valid) return { ok: false, reason: 'invalid-command', next: meta.next };
      advance();
      const ok = !meta.result && !!apply(action, payload);
      const reply = { ok, reason: ok ? null : 'illegal', next: ++meta.next };
      meta.last = { fingerprint, reply }; save(); return reply;
    },
    view(token) {
      if (!authorized(token) || !healthy) return null;
      // Never expose the checkpoint, random stream, seed or claim credential.
      const s = run.state;
      return { runId: meta.id, ruleset: RULESET, season: meta.season, fronts: meta.fronts, next: meta.next,
        phase: s.phase, wave: s.wave, completedWave: s.lastCompletedWave || 0, gold: s.gold, hp: s.hp,
        speed: meta.speed, paused: meta.paused, result: meta.result ? { wave: meta.result.wave, kills: meta.result.kills } : null };
    }
  };
}

module.exports = { createSoloRun };
