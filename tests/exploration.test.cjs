const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
function load() { const context = {}; for (const file of ['random.js', 'map.js', 'exploration.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../classes', file), 'utf8'), context); vm.runInNewContext('globalThis.mapRules=HexMap;globalThis.rules=HexExploration;globalThis.random=HexRandom.create;', context); return context; }
test('adjacent events connect on both sides, including across later exploration boundaries', () => {
  const { rules, random, mapRules: m } = load(); let pairs = 0, boundaryPairs = 0;
  for (let seed = 0; seed < 100; seed++) {
    const landmarks = rules.create(random('adjacent-' + seed)), old = new Map([...landmarks].map(([id, l]) => [id, JSON.stringify(l.prefab)]));
    rules.expand(landmarks, new Map([['6,0', { q: 6, r: 0 }], ['-6,0', { q: -6, r: 0 }]]));
    for (const [id, geometry] of old) assert.equal(JSON.stringify(landmarks.get(id).prefab), geometry);
    for (const [id, l] of landmarks) for (let d = 0; d < 6; d++) {
      const n = m.neighbor(l.q, l.r, d), nid = m.key(n.q, n.r), other = landmarks.get(nid); if (!other) continue;
      pairs++; if (old.has(id) !== old.has(nid)) boundaryPairs++;
      assert.ok(l.prefab.roads.includes(d), `seed ${seed}: ${id} must connect to ${nid}`);
      assert.ok(other.prefab.roads.includes(m.OPP(d)));
    }
    const reverse = rules.create(random('adjacent-' + seed));
    rules.expand(reverse, new Map([['-6,0', { q: -6, r: 0 }], ['6,0', { q: 6, r: 0 }]]));
    for (const [id, l] of landmarks) assert.equal(JSON.stringify(reverse.get(id)), JSON.stringify(l));
  }
  assert.ok(pairs > 0); assert.ok(boundaryPairs > 0);
});
test('landmarks are distinct, seeded and outside the starting clear area', () => {
  const { rules, random } = load(), first = rules.create(random('exploration')), second = rules.create(random('exploration'));
  assert.ok(first.size > 0); assert.equal(JSON.stringify([...first]), JSON.stringify([...second]));
  for (const landmark of first.values()) { const distance = rules.distance(landmark, { q: 0, r: 0 }); assert.ok(distance >= 3 && distance <= 6); if (landmark.type === 'boss') assert.ok(distance >= 5); }
});
test('guardian events never generate within four hexes of the base', () => {
  const { rules, random } = load(); let bosses = 0; for (let seed = 0; seed < 100; seed++)for (const landmark of rules.create(random('guard-' + seed)).values()) if (landmark.type === 'boss') { bosses++; assert.ok(rules.distance(landmark, { q: 0, r: 0 }) >= 5); } assert.ok(bosses > 0);
});
test('map growth reveals fog landmarks before identifying them', () => {
  const { rules } = load(), map = new Map([['0,0', { q: 0, r: 0 }]]);
  assert.equal(rules.visibility(map, { q: 5, r: 0 }), 'fog'); assert.equal(rules.visibility(map, { q: 3, r: 0 }), 'fog');
  map.set('2,0', { q: 2, r: 0 }); assert.equal(rules.visibility(map, { q: 3, r: 0 }), 'clear');
});
test('treasures pay once only after a tile is placed at their location', () => {
  const { rules } = load(), state = { map: new Map(), landmarks: new Map([['3,0', { q: 3, r: 0, claimed: false }]]), gold: 70, goldEarned: {} };
  assert.equal(rules.claim(state, 3, 0), 0); state.map.set('3,0', { q: 3, r: 0, roads: [3] }); assert.equal(rules.claim(state, 3, 0), 0); state.map.set('2,0', { q: 2, r: 0, roads: [0] }); assert.equal(rules.claim(state, 3, 0), 15); assert.equal(state.gold, 85); assert.equal(state.goldEarned.treasure, 15);
  assert.equal(rules.claim(state, 3, 0), 0); assert.equal(state.gold, 85);
});


test('each placed hex reveals landmarks at exactly two hex distance', () => {
  const { rules } = load(), map = new Map([['0,0', { q: 0, r: 0 }], ['5,0', { q: 5, r: 0 }]]);
  assert.equal(rules.visibility(map, { q: 7, r: 0 }), 'clear'); assert.equal(rules.visibility(map, { q: 8, r: 0 }), 'fog');
});
test('rescue matches occupied neighbors and preserves an expandable entrance', () => {
  const { mapRules: m } = load(), map = new Map([['0,0', { q: 0, r: 0, type: 'base', roads: [0] }]]);
  for (const d of [1, 2, 4, 5]) { const n = m.neighbor(1, 0, d); map.set(m.key(n.q, n.r), { ...n, roads: [] }); }
  const card = m.rescue(map); assert.ok(card); assert.equal(card.slots, 0); assert.deepEqual(Array.from(card.roads), [3, 0]); assert.equal(m.canPlace(map, 1, 0, card, 0), true);
  const n = m.neighbor(1, 0, 0); map.set(m.key(n.q, n.r), { ...n, roads: [] }); assert.equal(m.rescue(map), null);
});

test('shrine activation requires a road connection, gives no gold and happens once', () => {
  const { rules } = load(), state = { map: new Map([['1,0', { q: 1, r: 0, roads: [3] }]]), landmarks: new Map([['1,0', { q: 1, r: 0, type: 'shrine', claimed: false }]]), gold: 70, goldEarned: {} };
  rules.claim(state, 1, 0); assert.equal(state.pendingShrine, undefined);
  state.map.set('0,0', { q: 0, r: 0, roads: [0] }); assert.equal(rules.claim(state, 1, 0), 0); assert.equal(state.pendingShrine, '1,0'); assert.equal(state.gold, 70);
  state.pendingShrine = null; rules.claim(state, 1, 0); assert.equal(state.pendingShrine, null);
});


test('fog is finite and new discoveries expand reproducibly without rerolling old cells', () => {
  const { rules, random } = load(), a = rules.create(random('world')), b = rules.create(random('world')), map = new Map([['0,0', { q: 0, r: 0 }]]);
  assert.equal(rules.visibility(map, { q: 2, r: 0 }), 'clear'); assert.equal(rules.visibility(map, { q: 6, r: 0 }), 'fog'); assert.equal(rules.visibility(map, { q: 7, r: 0 }), 'hidden');
  const old = JSON.stringify([...a]), size = a.size; rules.expand(a, map); assert.equal(JSON.stringify([...a]), old);
  map.set('12,0', { q: 12, r: 0 }); const region = rules.expand(a, map); rules.expand(b, map); assert.ok(a.size > size); assert.equal(JSON.stringify([...a]), JSON.stringify([...b])); assert.equal(region.get('14,0').visibility, 'clear'); assert.equal(region.get('18,0').visibility, 'fog'); assert.equal(region.has('19,0'), false);
});
test('connecting boss activates it without gold or an automatic enemy spawn', () => {
  const { rules } = load(), boss = { q: 1, r: 0, type: 'boss', claimed: false }, state = { map: new Map([['0,0', { q: 0, r: 0, roads: [0] }], ['1,0', { q: 1, r: 0, roads: [3, 0] }]]), landmarks: new Map([['1,0', boss]]), gold: 70, goldEarned: {} };
  assert.equal(rules.claim(state, 1, 0), 0); assert.equal(state.gold, 70); assert.equal(boss.status, 'ready'); assert.equal(rules.claim(state, 1, 0), 0);
});



test('hidden shrine effects are seeded per coordinate and cover all six bonus kinds', () => {
  const { rules } = load(), landmarks = new Map(), counts = { remove: 0, card: 0, epic: 0, legendary: 0, repair: 0, upgrade: 0 }; landmarks.seed = 56789;
  for (let q = 0; q < 100; q++) for (let r = 0; r < 100; r++) { const id = q + ',' + r; landmarks.set(id, { q, r, type: 'shrine' }); const effect = rules.shrineEffect(landmarks, id); assert.equal(effect, rules.shrineEffect(landmarks, id)); counts[effect]++; }
  for (const type of ['remove', 'card', 'epic']) assert.ok(counts[type] > 1700 && counts[type] < 2300); assert.ok(counts.legendary > 700 && counts.legendary < 1300); for (const type of ['repair', 'upgrade']) assert.ok(counts[type] > 1200 && counts[type] < 1800);
});


test('boss loot rarity is seeded with mostly epic and occasional legendary rewards', () => {
  const { rules } = load(), counts = { Epic: 0, Legendary: 0 }; for (let q = 0; q < 100; q++) for (let r = 0; r < 100; r++) { const id = q + ',' + r, rarity = rules.bossRewardRarity('boss-loot', id); assert.equal(rarity, rules.bossRewardRarity('boss-loot', id)); counts[rarity]++; } assert.ok(counts.Legendary > 700 && counts.Legendary < 1300); assert.ok(counts.Epic > 8700);
});

test('prefab geometry is seeded and every boss has six fixed exits', () => {
  const { rules } = load(); for (let q = 3; q < 20; q++) { const position = { q, r: 2 }; assert.equal(JSON.stringify(rules.prefab(123, position, 'shrine')), JSON.stringify(rules.prefab(123, position, 'shrine'))); assert.deepEqual(Array.from(rules.prefab(123, position, 'boss').roads), [0, 1, 2, 3, 4, 5]); }
});
test('fixed special fields attach through matching neighboring roads and pay once', () => {
  const { rules } = load(), landmark = { q: 2, r: 0, type: 'treasure', claimed: false, prefab: { type: 'straight', roads: [0, 3], rotation: 0, slots: 1 } }, state = { map: new Map([['0,0', { q: 0, r: 0, type: 'base', roads: [0] }], ['1,0', { q: 1, r: 0, type: 'straight', roads: [0, 3] }]]), landmarks: new Map([['2,0', landmark]]), gold: 70, goldEarned: {} };
  const result = rules.attach(state); assert.equal(result.count, 1); assert.equal(result.gold, 10); assert.equal(state.map.get('2,0').type, 'straight'); assert.deepEqual(Array.from(state.map.get('2,0').roads), [0, 3]); assert.equal(state.gold, 80); assert.equal(rules.attach(state).count, 0); assert.equal(state.gold, 80);
});
test('placement respects fixed special roads and disconnected specials stay inactive', () => {
  const { rules, mapRules: m } = load(), landmark = { q: 2, r: 0, type: 'boss', claimed: false, prefab: rules.prefab(1, { q: 2, r: 0 }, 'boss') }, map = new Map([['0,0', { q: 0, r: 0, type: 'base', roads: [0] }]]), landmarks = new Map([['2,0', landmark]]);
  assert.equal(m.canPlace(map, 1, 0, { id: 'straight', roads: [0, 3] }, 0, landmarks), true); assert.equal(m.canPlace(map, 1, 0, { id: 'smallCurve', roads: [2, 3] }, 0, landmarks), false);
  const state = { map, landmarks, gold: 70, goldEarned: {} }; assert.equal(rules.attach(state).count, 0); assert.equal(landmark.claimed, false);
});

test('treasure value uses direct hex distance equally in every direction',()=>{const {rules}=load();for(const p of [{q:4,r:0},{q:0,r:4},{q:-4,r:4},{q:-4,r:0},{q:0,r:-4},{q:4,r:-4}])assert.equal(rules.treasureReward(p),20);assert.equal(rules.treasureReward({q:3,r:2}),25);});
