const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const { load } = require('./helpers/game.cjs');

test('all rotations agree with neighbor direction and reciprocal road connections', () => {
  const { a } = load();
  for (let d = 0; d < 6; d++) {
    a.state.map.clear(); a.state.map.set('0,0', { q: 0, r: 0, type: 'base', roads: [d], slots: 0, towers: [] });
    const n = a.neighbor(0, 0, d), c = a.axialToPixel(0, 0), p = a.axialToPixel(n.q, n.r), edge = a.edgePoint(c.x, c.y, d);
    assert.ok(Math.abs((p.x - c.x) * (edge.y - c.y) - (p.y - c.y) * (edge.x - c.x)) < 1e-8);
    for (const card of Object.values(a.CARD_LIBRARY)) for (let rot = 0; rot < 6; rot++) {
      assert.equal(a.canPlace(n.q, n.r, card, rot), a.rotatedRoads(card, rot).includes((d + 3) % 6));
    }
  }
});

test('multiple neighbors must all match; occupied fields are rejected', () => {
  const { a } = load(); a.state.map.clear();
  a.state.map.set('0,0', { q: 0, r: 0, roads: [0] });
  a.state.map.set('2,0', { q: 2, r: 0, roads: [] });
  assert.equal(a.canPlace(1, 0, a.CARD_LIBRARY.straight, 0), false);
  a.state.map.get('2,0').roads = [0, 3];
  assert.equal(a.canPlace(1, 0, a.CARD_LIBRARY.straight, 0), true);
  assert.equal(a.canPlace(0, 0, a.CARD_LIBRARY.straight, 0), false);
});

test('loops use the shortest legal path; each open edge spawns at the boundary', () => {
  const { a } = load(); a.state.map.clear();
  for (const tile of [{ q: 0, r: 0, type: 'base', roads: [0, 5] }, { q: 1, r: 0, roads: [3, 4, 0, 1] }, { q: 0, r: 1, roads: [2, 1] }]) a.state.map.set(`${tile.q},${tile.r}`, tile);
  assert.equal(a.pathToBase('1,0', a.buildGraph()).length, 2);
  const sources = a.spawnSources(); assert.equal(sources.length, 2);
  for (const s of sources) { const c = a.axialToPixel(s.tile.q, s.tile.r); assert.ok(Math.abs(Math.hypot(s.points[0].x - c.x, s.points[0].y - c.y) - 54 * Math.sqrt(3) / 2 * 1.02) < 1e-8); }
});

test('roads meet at the shared hex edge in every direction', () => {
  const { a } = load(), c = a.axialToPixel(0, 0);
  for (let d = 0; d < 6; d++) {
    const n = a.neighbor(0, 0, d), nc = a.axialToPixel(n.q, n.r);
    const first = a.edgePoint(c.x, c.y, d, 1), second = a.edgePoint(nc.x, nc.y, (d + 3) % 6, 1);
    assert.ok(Math.hypot(first.x - second.x, first.y - second.y) < 1e-8);
    assert.ok(Math.hypot(first.x - (c.x + nc.x) / 2, first.y - (c.y + nc.y) / 2) < 1e-8);
  }
});

test('turret slots rotate with the tile and return after a full turn', () => {
  const { a, slotPositions } = load(), c = a.axialToPixel(0, 0);
  const start = slotPositions({ q: 0, r: 0, slots: 2, rotation: 0 });
  const rotated = slotPositions({ q: 0, r: 0, slots: 2, rotation: 1 });
  assert.notEqual(start[0].x, rotated[0].x);
  for (let i = 0; i < 2; i++) {
    assert.ok(Math.abs(Math.hypot(start[i].x - c.x, start[i].y - c.y) - Math.hypot(rotated[i].x - c.x, rotated[i].y - c.y)) < 1e-8);
    const full = slotPositions({ q: 0, r: 0, slots: 2, rotation: 6 })[i];
    assert.ok(Math.hypot(full.x - start[i].x, full.y - start[i].y) < 1e-8);
  }
});

test('new run cancels timers and even stale callbacks cannot mutate it', () => {
  const { a, timers } = load(); a.state.map.set('1,0', { q: 1, r: 0, type: 'straight', roads: [0, 3], slots: 0, towers: [] }); a.state.phase = 'build'; a.startWave();
  const old = a.state.spawnQueue.map(spawn => spawn.callback); assert.equal(old.length, 5);
  a.newRun(); assert.equal(timers.size, 0); old.forEach(fn => fn());
  assert.equal(a.state.enemies.length, 0); assert.equal(a.state.wave, 0); assert.equal(a.state.phase, 'place');
});

test('wave waits for pending spawns and ends in an explicit reward phase', () => {
  const { a } = load(); a.state.phase = 'wave'; a.state.waveRunning = true; a.state.wave = 2; a.state.pendingSpawns = 1;
  a.update(0, 0); assert.equal(a.state.waveRunning, true);
  a.state.projectiles = [{ ttl: .1 }]; a.state.pendingSpawns = 0; a.update(0, 0); assert.equal(a.state.phase, 'reward'); assert.equal(a.state.waveRunning, false); assert.equal(a.state.projectiles.length, 0);
});
test('untriggered mines are cleared when a wave ends', () => {
  const { a } = load(); a.state.phase = 'wave'; a.state.waveRunning = true; a.state.wave = 1; a.state.pendingSpawns = 0; a.state.enemies = []; a.state.mines = [{ id: 1, x: 0, y: 0 }, { id: 2, x: 0, y: 0 }]; a.update(0, 0); assert.equal(a.state.mines.length, 0); assert.equal(a.state.waveRunning, false);
});

test('game over cancels pending spawns and disables the run', () => {
  const { a, timers, elements } = load(); a.state.map.set('1,0', { q: 1, r: 0, type: 'straight', roads: [0, 3], slots: 0, towers: [] }); a.state.phase = 'build'; a.startWave(); a.state.hp = 0; a.update(0, 0);
  assert.equal(a.state.phase, 'gameover'); assert.equal(timers.size, 0); assert.equal(a.state.waveRunning, false);
  assert.match(elements.get('gameOverResult').textContent, /Wave 1/); assert.match(elements.get('diamondBreakdown').innerHTML, /Wave-Fortschritt/); assert.equal(a.state.metaSettled, true);
});

test('game over pays accumulated run progress once', () => {
  const { a, elements } = load(); a.state.phase = 'wave'; a.state.waveRunning = true; a.state.wave = 23; a.state.hp = 0; a.state.earnedMeta = { normalKills: 99, periodicBosses: 2, explorationBosses: 1 };
  a.update(0, 0); assert.match(elements.get('diamondBreakdown').innerHTML, /\+11/); assert.match(elements.get('diamondBreakdown').innerHTML, /\+13/); assert.match(elements.get('diamondBreakdown').innerHTML, /\+4/); assert.equal(elements.get('gameOverDiamonds').textContent, 28);
  a.update(0, 0); assert.equal(elements.get('gameOverDiamonds').textContent, 28);
});

test('a deck with no legal placement advances to building without losing cards', () => {
  const { a } = load(); a.state.map.get('0,0').roads = []; const before = a.state.drawPile.length + a.state.discard.length + a.state.hand.length;
  a.state.discard.push(...a.state.hand); a.drawHand();
  assert.equal(a.state.phase, 'build'); assert.equal(a.state.drawPile.length + a.state.discard.length + a.state.hand.length, before);
});

test('each enemy chooses independently among every non-cyclic branch that can reach base', () => {
  const { a, nextSourcePoints } = load();
  const graph = new Map([['1,1', ['0,1', '1,0', '2,1']], ['0,1', ['0,0']], ['1,0', ['0,0']], ['2,1', ['2,0']], ['2,0', ['1,0']], ['0,0', []]]);
  const routes = new Map([...graph].map(([id, nexts]) => [id, nexts.map(next => { const [q, r] = id.split(',').map(Number), [nq, nr] = next.split(',').map(Number); return { next, cost: 1, points: [a.axialToPixel(q, r), a.axialToPixel(nq, nr)] }; })]));
  const makeSource = () => ({ tile: { q: 1, r: 1 }, points: [{ x: 0, y: 0 }, a.axialToPixel(1, 1)], routes: { graph: routes, distances: new Map([['1,1', 2], ['0,1', 1], ['1,0', 1], ['2,1', 3], ['2,0', 2], ['0,0', 0]]) }, branchCounts: new Map() });
  const source = makeSource(), left = a.axialToPixel(0, 1), right = a.axialToPixel(1, 0), detour = a.axialToPixel(2, 1), seen = new Set();
  for (let i = 0; i < 120; i++) { const points = nextSourcePoints(source); assert.ok(points.length >= 4); assert.deepEqual(points.at(-1), a.axialToPixel(0, 0)); if (points.some(p => p.x === left.x && p.y === left.y)) seen.add('left'); if (points.some(p => p.x === right.x && p.y === right.y)) seen.add('right'); if (points.some(p => p.x === detour.x && p.y === detour.y)) seen.add('detour'); }
  assert.deepEqual([...seen].sort(), ['detour', 'left', 'right']);
});

test('construction undo refunds exactly once and allows rebuilding in the same phase', () => {
  const { a, buyTower, sellSelectedTower } = load();
  const tile = { q: 1, r: 0, type: 'straight', roads: [0, 3], slots: 1, towers: [null] };
  a.state.map.set('1,0', tile); a.state.phase = 'build'; a.state.selectedSlot = { q: 1, r: 0, index: 0 };
  buyTower('archer'); a.state.selectedTower = { q: 1, r: 0, index: 0 }; assert.equal(a.state.gold, 45); assert.equal(tile.towers[0].paid, 25);
  sellSelectedTower(); assert.equal(a.state.gold, 70); assert.equal(tile.towers[0], null);
  sellSelectedTower(); assert.equal(a.state.gold, 70);
  buyTower('chain'); assert.equal(a.state.gold, 25); assert.equal(tile.towers[0].type, 'chain');
});

test('sale refunds half during waves and later phases, never twice', () => {
  const { a, buyTower, sellSelectedTower } = load();
  const tile = { q: 1, r: 0, type: 'straight', roads: [0, 3], slots: 1, towers: [null] };
  a.state.map.set('1,0', tile); a.state.phase = 'build'; a.state.selectedSlot = { q: 1, r: 0, index: 0 }; buyTower('archer'); a.state.selectedTower = { q: 1, r: 0, index: 0 };
  a.state.phase = 'wave'; a.state.waveRunning = true; sellSelectedTower(); assert.equal(a.state.gold, 57); assert.equal(tile.towers[0], null);
  a.state.phase = 'build'; a.state.waveRunning = false; a.state.wave = 1; sellSelectedTower(); assert.equal(a.state.gold, 57); assert.equal(tile.towers[0], null);
});

test('same run seed reproduces the hand, draw pile and card rewards after restart', () => {
  const { a, elements } = load(); elements.get('runSeed').value = 'Hex-Bastion-Test';
  function snapshot() {
    a.newRun();
    const cards = JSON.stringify({ hand: a.state.hand, pile: a.state.drawPile });
    elements.get('rewardChoices').children = []; a.showRewards();
    return { cards, rewards: elements.get('rewardChoices').children.map(e => e.innerHTML).join('|') };
  }
  const first = snapshot(), second = snapshot(); assert.deepEqual(first, second);
  assert.equal(a.state.seed, 'Hex-Bastion-Test');
  elements.get('runSeed').value = 'Different seed'; assert.notDeepEqual(snapshot(), first);
});

test('seeded random generator reproduces a long sequence in the interval [0,1)', () => {
  const context = {}; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../classes/random.js'), 'utf8') + ';globalThis.create=HexRandom.create;', context);
  const first = context.create('seed'), second = context.create('seed'), other = context.create('other');
  let different = false;
  for (let i = 0; i < 1000; i++) {
    const value = first(); assert.equal(value, second()); assert.ok(value >= 0 && value < 1);
    if (value !== other()) different = true;
  }
  assert.ok(different);
});

test('a tower can be selected and bought during a wave and immediately participates in combat', () => {
  const { a, selectSlot, buyTower, slotPositions, sellSelectedTower } = load();
  const tile = { q: 1, r: 0, type: 'straight', roads: [0, 3], slots: 1, towers: [null] };
  a.state.map.set('1,0', tile); a.state.phase = 'wave'; a.state.waveRunning = true; a.state.wave = 1; a.state.pendingSpawns = 1;
  selectSlot(1, 0, 0); buyTower('archer'); a.state.selectedTower = { q: 1, r: 0, index: 0 }; assert.equal(a.state.gold, 45); assert.ok(tile.towers[0]);
  const p = slotPositions(tile)[0];
  const enemy = { alive: true, hp: 35, maxHp: 35, index: 0, t: 0, speed: 0, points: [p, { x: p.x + 10, y: p.y }], x: p.x, y: p.y };
  a.state.enemies.push(enemy); a.update(0, 1000); assert.equal(enemy.hp, 23.75);
  a.state.phase = 'build'; a.state.waveRunning = false; sellSelectedTower(); assert.equal(a.state.gold, 57); assert.equal(tile.towers[0], null);
});

test('tower purchases remain blocked in placement, reward and game over phases', () => {
  const { a, buyTower } = load(), tile = { q: 1, r: 0, slots: 1, towers: [null] }; a.state.map.set('1,0', tile);
  for (const phase of ['place', 'reward', 'gameover']) {
    a.state.phase = phase; a.state.selectedSlot = { q: 1, r: 0, index: 0 }; buyTower('archer'); a.state.selectedTower = { q: 1, r: 0, index: 0 }; assert.equal(tile.towers[0], null); assert.equal(a.state.gold, 70);
  }
});

test('wave animation keeps slot click targets and gold changes keep purchase buttons', () => {
  const { a, elements } = load();
  const tile = { q: 1, r: 0, type: 'straight', roads: [0, 3], slots: 1, towers: [null] };
  a.state.map.set('1,0', tile); a.state.phase = 'wave'; a.state.waveRunning = true; a.state.pendingSpawns = 1;
  a.update(0, 0);
  const objects = elements.get('board').children[2];
  const slot = objects.children.findLast(e => e.attributes.r === 12);
  const before = objects.children.length; a.update(0, 100);
  assert.equal(objects.children.length, before); assert.ok(objects.children.includes(slot));
  slot.listeners.click();
  const button = elements.get('towerMenu').children[0];
  a.state.gold += 3; a.update(0, 200);
  assert.equal(elements.get('towerMenu').children[0], button);
  button.listeners.click(); assert.equal(tile.towers[0].type, 'archer'); assert.equal(a.state.gold, 48);
});

test('every run has exactly five tower choices and rejects towers outside its loadout', () => {
  const { a, elements, buyTower } = load();
  assert.deepEqual(Array.from(a.state.towerLoadout), ['archer', 'catapult', 'chain', 'freeze', 'mine']);
  assert.equal(elements.get('towerMenu').children.length, 5);
  const tile = { q: 1, r: 0, type: 'straight', roads: [0, 3], slots: 1, towers: [null] }; a.state.map.set('1,0', tile); a.state.phase = 'build'; a.state.selectedSlot = { q: 1, r: 0, index: 0 };
  a.state.towerLoadout = ['archer', 'catapult', 'chain', 'freeze', 'mine']; buyTower('unknown'); assert.equal(tile.towers[0], null);
  a.newRun(['archer', 'archer']); assert.equal(a.state.towerLoadout.length, 5); assert.equal(new Set(a.state.towerLoadout).size, 5);
});

test('forecast uses the same wave and gold rules as actual spawning and completion', () => {
  const context = {}; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../classes/waves.js'), 'utf8') + ';globalThis.plan=HexWaves.plan;', context);
  const first = context.plan(1, 4); assert.equal(first.count, 5); assert.equal(first.hp, 35); assert.equal(first.killGold, 15); assert.equal(first.maxGold, 29);
  const late = context.plan(100, 0); assert.equal(late.count, 205); assert.equal(late.maxGold, 625);
  const { a, elements } = load(); a.state.income = 4; a.state.wave = 1; a.state.phase = 'wave'; a.state.waveRunning = true; a.state.pendingSpawns = 0;
  a.update(0, 0); assert.equal(a.state.gold, 84); assert.equal(a.state.goldEarned.completion, 10); assert.equal(a.state.goldEarned.income, 4);
  assert.ok(elements.get('goldForecast').textContent.includes('Maximal +41 Gold'));
});

test('real road branches include longer valid detours without allowing loops', () => {
  const { a, nextSourcePoints } = load(); a.state.map.clear();
  for (const tile of [{ q: 0, r: 0, type: 'base', roads: [0, 5] }, { q: 0, r: 1, type: 'empty', roads: [0, 2] }, { q: 1, r: 0, type: 'empty', roads: [3, 5] }, { q: 1, r: 1, type: 'tee', roads: [2, 3, 5] }]) a.state.map.set(`${tile.q},${tile.r}`, tile);
  let source = a.spawnSources()[0];
  const left = a.axialToPixel(0, 1), right = a.axialToPixel(1, 0);
  const contains = (points, p) => points.some(v => Math.hypot(v.x - p.x, v.y - p.y) < 1e-8);
  let usesLeft = false, usesRight = false; for (let i = 0; i < 80; i++) { const points = nextSourcePoints(source); usesLeft ||= contains(points, left); usesRight ||= contains(points, right); } assert.ok(usesLeft && usesRight);
  a.state.map.get('1,0').type = 'longRoad'; source = a.spawnSources()[0];
  usesLeft = false; usesRight = false; for (let i = 0; i < 80; i++) { const points = nextSourcePoints(source); usesLeft ||= contains(points, left); usesRight ||= contains(points, right); } assert.ok(usesLeft && usesRight);
});

test('all road geometries meet exact edges and the long road really increases travel distance', () => {
  const context = {}; for (const file of ['map.js', 'data.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../classes', file), 'utf8'), context);
  vm.runInNewContext('globalThis.map=HexMap;globalThis.cards=HexData.CARD_LIBRARY;', context);
  const m = context.map, c = m.axialToPixel(0, 0);
  for (const card of Object.values(context.cards)) for (let rotation = 0; rotation < 6; rotation++) {
    const geometry = m.roadGeometry({ q: 0, r: 0, type: card.id, roads: m.rotatedRoads(card, rotation) });
    for (const [direction, points] of geometry.legs) { const edge = m.edgePoint(c.x, c.y, direction, 1); assert.ok(Math.hypot(points.at(-1).x - edge.x, points.at(-1).y - edge.y) < 1e-8); assert.ok(m.length(points) > 0); }
  }
  const distance = type => [...m.roadGeometry({ q: 0, r: 0, type, roads: [0, 3] }).legs.values()].reduce((sum, p) => sum + m.length(p), 0);
  assert.ok(distance('longRoad') > distance('empty') * 1.03);   // Weg folgt der Mittellinie des 3D-Modells, das nur leicht geschlängelt ist
});

test('wave profiles are predictable and introduce swarm and armor gradually', () => {
  const context = {}; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../classes/waves.js'), 'utf8') + ';globalThis.plan=HexWaves.plan;', context);
  assert.ok(context.plan(1).enemies.every(e => e.type === 'normal'));
  assert.ok(context.plan(3).enemies.some(e => e.type === 'swarm')); assert.ok(!context.plan(3).enemies.some(e => e.armor));
  const fourth = context.plan(4); assert.equal(fourth.enemies.length, fourth.count); assert.ok(fourth.enemies.some(e => e.armorHp > 0)); assert.equal(fourth.maxGold, fourth.count * 3 + 10);
  assert.ok(context.plan(5).enemies.some(e => e.magicHp > 0));
});

test('branch choice charges once and same-phase undo includes the upgrade purchase', () => {
  const { a, buyTower, upgradeSelectedTower, sellSelectedTower, selectSlot } = load();
  const tile = { q: 1, r: 0, type: 'straight', roads: [0, 3], slots: 1, towers: [null] }; a.state.map.set('1,0', tile); a.state.phase = 'build';
  selectSlot(1, 0, 0); buyTower('archer'); a.state.selectedTower = { q: 1, r: 0, index: 0 }; upgradeSelectedTower('marksman'); assert.equal(a.state.gold, 10); assert.equal(tile.towers[0].branch, 'marksman');
  upgradeSelectedTower('volley'); assert.equal(a.state.gold, 10); assert.equal(tile.towers[0].branch, 'marksman');
  sellSelectedTower(); assert.equal(a.state.gold, 70); assert.equal(tile.towers[0], null);
});

test('buying a tower leaves its menu closed; clicking the placed tower selects it', () => {
  const { a, buyTower, selectSlot, elements } = load();
  a.state.map.set('1,0', { q: 1, r: 0, type: 'straight', roads: [0, 3], slots: 1, towers: [null] }); a.state.phase = 'build';
  selectSlot(1, 0, 0); buyTower('archer'); assert.equal(a.state.selectedTower, null);
  const objects = elements.get('board').children[2], tower = objects.children.findLast(e => e.listeners.click && e.children.some(c => String(c.textContent).includes('Archer')));
  assert.ok(tower); tower.listeners.click({ stopPropagation() { } }); assert.equal(a.state.selectedTower.q, 1); assert.equal(a.state.selectedTower.index, 0);
});

test('tower panel exposes three ordered target priorities and swaps duplicate choices', () => {
  const { a, elements, selectSlot, buyTower } = load(); const tile = { q: 1, r: 0, type: 'straight', roads: [0, 3], slots: 1, towers: [null] }; a.state.map.set('1,0', tile); a.state.phase = 'build'; selectSlot(1, 0, 0); buyTower('archer'); a.state.selectedTower = { q: 1, r: 0, index: 0 }; a.renderAll();
  const targeting = elements.get('towerUpgrades').children[0]; assert.equal(targeting.className, 'targetPriorities'); assert.equal(targeting.children.length, 3);
  const first = targeting.children[0].children[0]; first.value = 'mostHealth'; first.listeners.change(); assert.deepEqual(Array.from(tile.towers[0].targetPriority), ['mostHealth', 'closestBase', 'boss']);
});

test('final upgrade requires the chosen branch, charges once and prevents further upgrades', () => {
  const { a, buyTower, selectSlot, upgradeSelectedTower, sellSelectedTower } = load();
  a.state.gold = 200; const tile = { q: 1, r: 0, type: 'straight', roads: [0, 3], slots: 1, towers: [null] }; a.state.map.set('1,0', tile); a.state.phase = 'build';
  selectSlot(1, 0, 0); buyTower('archer'); a.state.selectedTower = { q: 1, r: 0, index: 0 };
  upgradeSelectedTower('eagleEye'); assert.equal(a.state.gold, 175); assert.equal(tile.towers[0].level, 1);
  upgradeSelectedTower('marksman'); upgradeSelectedTower('arrowRain'); assert.equal(a.state.gold, 140); assert.equal(tile.towers[0].level, 2);
  upgradeSelectedTower('eagleEye'); assert.equal(a.state.gold, 80); assert.equal(tile.towers[0].level, 3); assert.equal(tile.towers[0].branch, 'marksman');
  upgradeSelectedTower('eagleEye'); assert.equal(a.state.gold, 80); sellSelectedTower(); assert.equal(a.state.gold, 200);
});

test('fourth tower stage is blocked by meta progression and costs run gold after unlock', () => {
  const { a, data, selectSlot, buyTower, upgradeSelectedTower } = load(); a.state.gold = 400; const tile = { q: 1, r: 0, type: 'straight', roads: [0, 3], slots: 1, towers: [null] }; a.state.map.set('1,0', tile); a.state.phase = 'build'; selectSlot(1, 0, 0); buyTower('archer'); a.state.selectedTower = { q: 1, r: 0, index: 0 }; upgradeSelectedTower('marksman'); upgradeSelectedTower('eagleEye'); const before = a.state.gold;
  upgradeSelectedTower('ultimate:archer'); assert.equal(tile.towers[0].level, 3); assert.equal(a.state.gold, before);
  a.state.ultimateUnlocks.push('ultimate:archer'); upgradeSelectedTower('ultimate:archer'); assert.equal(tile.towers[0].level, 4); assert.equal(a.state.gold, before - data.ULTIMATES.archer.cost); assert.equal(tile.towers[0].ultimate, 'archer'); assert.ok(data.towerDefinition(tile.towers[0]).damage > data.towerDefinition({ ...tile.towers[0], ultimate: null }).damage);
});

test('towers offer two branches (three elements) and each branch exactly one final upgrade', () => {
  const context = {}; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../classes/data.js'), 'utf8') + ';globalThis.data=HexData;', context);
  const data = context.data;
  for (const type of Object.keys(data.TOWERS)) {
    assert.ok(data.ULTIMATES[type]); assert.ok(data.ULTIMATES[type].cost > 0);
    const initial = data.availableUpgrades({ type }); assert.equal(initial.length, type === 'element' ? 3 : 2);
    for (const [branch] of initial) {
      assert.ok(data.BRANCH_VISUALS[branch]); const next = data.availableUpgrades({ type, branch }); assert.equal(next.length, 1);
      const finalUpgrade = next[0][0], def = data.towerDefinition({ type, branch, finalUpgrade }); assert.ok(def.range > 0);
      assert.equal(data.availableUpgrades({ type, branch, finalUpgrade }).length, 0);
      if (type === 'freeze') { assert.equal(def.damage, 0); assert.ok(def.aura); assert.ok(def.slow > 0 && def.slow < 1); }
    }
  }
});

test('sixth wave reward offers optional removal before drawing and preserves map and deck accounting', () => {
  const { a, elements } = load(); a.state.discard.push(...a.state.hand); a.state.hand = []; a.state.wave = 6; a.showRewards();
  elements.get('rewardChoices').children.at(-1).listeners.click(); assert.equal(a.state.phase, 'removal'); assert.equal(a.state.deck.length, 6);
  elements.get('rewardChoices').children.at(-1).listeners.click(); assert.equal(a.state.phase, 'place'); assert.equal(a.state.deck.length, 5); assert.equal(a.state.map.size, 1);
  assert.equal(a.state.hand.length + a.state.drawPile.length + a.state.discard.length, 5);
});

test('deck thinning sorts cards from Common through Legendary regardless of deck order', () => {
  const { a, elements } = load(); a.state.deck = ['citadel', 'battlefield', 'cross', 'tee', 'straight']; a.showRemoval();
  const labels = elements.get('rewardChoices').children.map(card => (card.className.match(/rarity-([^ ]+)/) || [])[1]);
  assert.deepEqual(labels, ['common', 'uncommon', 'rare', 'epic', 'legendary']);
});

test('placement cannot close the last base-connected entrance but may form a loop with another exit', () => {
  const { a } = load(); a.state.map.clear(); a.state.map.set('0,0', { q: 0, r: 0, type: 'base', roads: [0, 5] }); a.state.map.set('0,1', { q: 0, r: 1, type: 'tee', roads: [1, 2] });
  assert.equal(a.canPlace(1, 0, a.CARD_LIBRARY.smallCurve, 3), false);
  a.state.map.get('0,1').roads.push(5); assert.equal(a.canPlace(1, 0, a.CARD_LIBRARY.smallCurve, 3), true);
});

test('double speed advances simulation and spawn timing twice as fast', () => {
  const { a, elements } = load(); a.state.phase = 'wave'; a.state.waveRunning = true; a.state.pendingSpawns = 1;
  let calls = 0; a.state.spawnQueue = [{ due: 200, callback() { calls++; } }];
  elements.get('doubleSpeed').value = '1'; elements.get('doubleSpeed').listeners.input(); a.update(.1, 100); assert.equal(a.state.elapsedMs, 100); assert.equal(calls, 0);
  elements.get('doubleSpeed').value = '2'; elements.get('doubleSpeed').listeners.input(); a.update(.05, 150); assert.equal(a.state.elapsedMs, 200); assert.equal(calls, 1);
});

test('market discounts are charged and refunded at the actual purchase price', () => {
  const { a, selectSlot, buyTower, upgradeSelectedTower, sellSelectedTower } = load();
  a.state.map.get('0,0').buildings = [{ type: 'market' }]; a.state.map.set('1,0', { q: 1, r: 0, type: 'straight', roads: [0, 3], slots: 1, towers: [null] }); a.state.phase = 'build';
  selectSlot(1, 0, 0); buyTower('archer'); assert.equal(a.state.gold, 48); a.state.selectedTower = { q: 1, r: 0, index: 0 }; upgradeSelectedTower('marksman'); assert.equal(a.state.gold, 18);
  sellSelectedTower(); assert.equal(a.state.gold, 70);
});


test('connecting a shrine pauses auto-start and returns to building without drawing a new hand', () => {
  const { a, elements, timers } = load(); a.state.map.clear(); a.state.map.set('0,0', { q: 0, r: 0, type: 'base', roads: [0], towers: [], slots: 0 });
  a.state.landmarks = new Map([['1,0', { q: 1, r: 0, type: 'shrine', shrineEffect: 'remove', claimed: false }]]); a.state.hand = ['straight']; a.state.selectedCard = 0; a.state.rotation = 0; a.state.phase = 'place';
  elements.get('autoStart').checked = true; const gold = a.state.gold; a.placeTile(1, 0);
  assert.equal(a.state.phase, 'removal'); assert.equal(a.state.removalSource, 'shrine'); assert.equal(a.state.gold, gold); assert.equal(timers.size, 0);
  const draw = JSON.stringify(a.state.drawPile); a.finishRemoval(); assert.equal(a.state.phase, 'build'); assert.equal(a.state.hand.length, 0); assert.equal(JSON.stringify(a.state.drawPile), draw); assert.equal(a.state.pendingShrine, null); assert.equal(timers.size, 1);
});

test('shrine removal deletes one copy and preserves the placed hex and build phase', () => {
  const { a, elements } = load(); a.state.map.clear(); a.state.map.set('0,0', { q: 0, r: 0, type: 'base', roads: [0], towers: [], slots: 0 });
  a.state.landmarks = new Map([['1,0', { q: 1, r: 0, type: 'shrine', shrineEffect: 'remove', claimed: false }]]); a.state.deck = ['straight', 'straight', 'smallCurve', 'bigCurve', 'tee', 'cross']; a.state.drawPile = ['straight', 'smallCurve', 'bigCurve', 'tee', 'cross']; a.state.discard = []; a.state.hand = ['straight']; a.state.selectedCard = 0; a.state.rotation = 0; a.state.phase = 'place';
  a.placeTile(1, 0); const choices = elements.get('rewardChoices').children; choices.at(-5).listeners.click();
  assert.equal(a.state.deck.length, 5); assert.equal(a.state.deck.filter(id => id === 'straight').length, 1); assert.equal(a.state.phase, 'build'); assert.equal(a.state.map.has('1,0'), true); assert.equal(a.state.drawPile.length + a.state.discard.length + a.state.hand.length, 5);
});


test('boss joins the normal next wave and starts on its own triggered hex', () => {
  const { a } = load(); a.state.map.set('1,0', { q: 1, r: 0, type: 'straight', roads: [0, 3], slots: 0, towers: [] });
  const landmark = { q: 1, r: 0, type: 'boss', claimed: true, status: 'ready' }; a.state.landmarks = new Map([['1,0', landmark]]); a.state.phase = 'build';
  assert.equal(a.state.enemies.length, 0); a.startWave(); assert.equal(a.state.wave, 1); assert.equal(landmark.status, 'fighting');
  const boss = a.state.enemies.find(e => e.type === 'boss'); assert.ok(boss); const spawn = a.axialToPixel(1, 0); assert.equal(boss.x, spawn.x); assert.equal(boss.y, spawn.y); assert.equal(boss.landmarkId, '1,0'); assert.equal(boss.maxHp, 276); assert.equal(boss.maxArmorHp, 69); assert.equal(boss.maxMagicHp, 55); assert.equal(boss.baseDamage, 5); assert.equal(boss.killGold, 50); assert.equal(a.state.pendingSpawns, 5);
  const base = a.axialToPixel(0, 0); assert.equal(boss.points.at(-1).x, base.x); assert.equal(boss.points.at(-1).y, base.y);
  a.startWave(); assert.equal(a.state.enemies.length, 1);
});


test('placing a boss hex then auto-starting includes the boss once', () => {
  const { a, elements, timers } = load(); a.state.map.clear(); a.state.map.set('0,0', { q: 0, r: 0, type: 'base', roads: [0], towers: [], slots: 0 });
  a.state.landmarks = new Map([['1,0', { q: 1, r: 0, type: 'boss', claimed: false }]]); a.state.hand = ['straight']; a.state.selectedCard = 0; a.state.rotation = 0; a.state.phase = 'place'; elements.get('autoStart').checked = true;
  a.placeTile(1, 0); assert.equal(a.state.landmarks.get('1,0').status, 'ready'); assert.ok(elements.get('waveForecast').textContent.includes('276 Leben + 69 Rüstung + 55 Magieresistenz')); assert.ok(elements.get('goldForecast').textContent.includes('Bossloot +50'));
  const callback = [...timers.values()][0]; callback(); assert.equal(a.state.enemies.filter(e => e.type === 'boss').length, 1); callback(); assert.equal(a.state.enemies.filter(e => e.type === 'boss').length, 1);
});
test('all activated bosses spawn on their own tiles in the same next wave', () => {
  const { a } = load(); for (const q of [1, 2]) a.state.map.set(q + ',0', { q, r: 0, type: 'straight', roads: [0, 3], slots: 0, towers: [] });
  a.state.landmarks = new Map([1, 2].map(q => [q + ',0', { q, r: 0, type: 'boss', claimed: true, status: 'ready' }])); a.state.phase = 'build'; a.startWave();
  const bosses = a.state.enemies.filter(e => e.type === 'boss'); assert.equal(bosses.length, 2); for (const boss of bosses) { const q = Number(boss.landmarkId.split(',')[0]), position = a.axialToPixel(q, 0); assert.equal(boss.x, position.x); assert.equal(boss.y, position.y); }
});
test('question marks are rendered only within six hexes of placed tiles', () => {
  const { a, elements } = load(); a.state.landmarks = new Map([6, 7, 10].map(q => [q + ',0', { q, r: 0, type: 'treasure', claimed: false }])); elements.get('board').children[1].children = []; a.renderAll();
  const questions = () => elements.get('board').children[1].children.filter(e => e.textContent === '?'); assert.equal(questions().length, 1);
  a.state.map.set('4,0', { q: 4, r: 0, type: 'straight', roads: [0, 3], slots: 0, towers: [] }); elements.get('board').children[1].children = []; a.renderAll();
  const visible = questions().map(e => Number(e.attributes.x)); assert.ok(visible.includes(a.axialToPixel(7, 0).x)); assert.ok(visible.includes(a.axialToPixel(10, 0).x));
});



for (const effect of ['card', 'epic', 'legendary']) test('shrine ' + effect + ' reward adds one card once and returns to build without redrawing', () => {
  const { a, elements, timers } = load(); a.state.map.clear(); a.state.map.set('0,0', { q: 0, r: 0, type: 'base', roads: [0], towers: [], slots: 0 });
  a.state.landmarks = new Map([['1,0', { q: 1, r: 0, type: 'shrine', shrineEffect: effect, claimed: false }]]); a.state.hand = ['straight']; a.state.selectedCard = 0; a.state.rotation = 0; a.state.phase = 'place'; elements.get('autoStart').checked = true;
  const deck = a.state.deck.length, draw = JSON.stringify(a.state.drawPile), gold = a.state.gold, before = elements.get('rewardChoices').children.length; a.placeTile(1, 0);
  assert.equal(a.state.phase, 'shrineReward'); assert.equal(timers.size, 0); assert.ok(elements.get('rewardTitle').textContent.includes(effect === 'legendary' ? 'Legendary-Karte' : effect === 'epic' ? 'Epic-Karte' : 'Zusätzliche Karte'));
  const choice = elements.get('rewardChoices').children[before]; choice.listeners.click(); assert.equal(a.state.deck.length, deck + 1); assert.equal(a.state.phase, 'build'); assert.equal(a.state.gold, gold); assert.equal(a.state.hand.length, 0); assert.equal(JSON.stringify(a.state.drawPile), draw); assert.equal(timers.size, 1);
  if (effect !== 'card') assert.equal(a.CARD_LIBRARY[a.state.deck.at(-1)].rarity, effect === 'legendary' ? 'Legendary' : 'Epic'); choice.listeners.click(); assert.equal(a.state.deck.length, deck + 1);
});
test('skipping a shrine card reward consumes it without changing the deck', () => {
  const { a, elements } = load(); a.state.landmarks = new Map([['1,0', { q: 1, r: 0, type: 'shrine', shrineEffect: 'card', claimed: false }]]); a.state.hand = ['straight']; a.state.selectedCard = 0; a.state.rotation = 0; a.state.phase = 'place'; const count = a.state.deck.length;
  a.placeTile(1, 0); elements.get('skipRemovalBtn').listeners.click(); assert.equal(a.state.phase, 'build'); assert.equal(a.state.deck.length, count); assert.equal(a.state.pendingShrine, null); assert.equal(a.state.landmarks.get('1,0').claimed, true);
});



test('boss loot waits for wave end and preserves the normal even-wave reward', () => {
  const { a, elements } = load(); a.state.wave = 2; a.state.phase = 'wave'; a.state.waveRunning = true; a.state.bossRewards = ['1,0']; const count = a.state.deck.length, before = elements.get('rewardChoices').children.length;
  a.endWave(); assert.equal(a.state.phase, 'bossReward'); assert.equal(a.state.waveRunning, false); const choice = elements.get('rewardChoices').children[before]; choice.listeners.click();
  assert.equal(a.state.deck.length, count + 1); assert.ok(['Epic', 'Legendary'].includes(a.CARD_LIBRARY[a.state.deck.at(-1)].rarity)); assert.equal(a.state.bossRewards.length, 0); assert.equal(a.state.phase, 'reward'); choice.listeners.click(); assert.equal(a.state.deck.length, count + 1);
});
test('multiple boss rewards are offered sequentially and skip returns to odd-wave placement', () => {
  const { a, elements } = load(); a.state.wave = 1; a.state.phase = 'wave'; a.state.waveRunning = true; a.state.bossRewards = ['1,0', '2,0']; const count = a.state.deck.length;
  a.endWave(); assert.equal(a.state.phase, 'bossReward'); elements.get('skipRemovalBtn').listeners.click(); assert.equal(a.state.phase, 'bossReward'); assert.equal(a.state.bossRewards[0], '2,0'); elements.get('skipRemovalBtn').listeners.click(); assert.equal(a.state.phase, 'place'); assert.equal(a.state.bossRewards.length, 0); assert.equal(a.state.deck.length, count);
});




test('selling a fully upgraded older tower refunds half of all investment', () => {
  const { a, buyTower, selectSlot, upgradeSelectedTower, sellSelectedTower } = load(); a.state.gold = 200; const tile = { q: 1, r: 0, type: 'straight', roads: [0, 3], slots: 1, towers: [null] }; a.state.map.set('1,0', tile); a.state.phase = 'build'; selectSlot(1, 0, 0); buyTower('archer'); a.state.selectedTower = { q: 1, r: 0, index: 0 }; upgradeSelectedTower('marksman'); upgradeSelectedTower('eagleEye'); assert.equal(tile.towers[0].paid, 120); a.state.wave = 1;
  sellSelectedTower(); assert.equal(a.state.gold, 140); assert.equal(tile.towers[0], null); a.state.selectedTower = { q: 1, r: 0, index: 0 }; sellSelectedTower(); assert.equal(a.state.gold, 140);
});
test('sale uses discounted investment, rounds down and stays available in other live phases', () => {
  const context = {}; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../classes/data.js'), 'utf8') + ';globalThis.refund=HexData.towerRefund;', context);
  const tower = { paid: 103, builtOnWave: 0 }; for (const phase of ['place', 'wave', 'reward', 'removal', 'shrineReward', 'bossReward']) assert.equal(context.refund({ hp: 20, phase, wave: 0, waveRunning: phase === 'wave' }, tower).amount, 51);
  assert.equal(context.refund({ hp: 20, phase: 'build', wave: 0, waveRunning: false }, tower).amount, 103); assert.equal(context.refund({ hp: 0, phase: 'gameover', wave: 0 }, tower), null);
});

test('building a neighbor activates a fixed boss without placing a hand hex on it', () => {
  const { a } = load(); a.state.map.set('1,0', { q: 1, r: 0, type: 'straight', roads: [0, 3], slots: 1, towers: [null] }); const boss = { q: 3, r: 0, type: 'boss', claimed: false, prefab: { type: 'fullCross', roads: [0, 1, 2, 3, 4, 5], rotation: 0, slots: 0 } }; a.state.landmarks = new Map([['3,0', boss]]); a.state.hand = ['straight']; a.state.selectedCard = 0; a.state.rotation = 0; a.state.phase = 'place';
  assert.equal(a.canPlace(3, 0, a.CARD_LIBRARY.straight, 0), false); a.placeTile(2, 0); assert.equal(a.state.map.get('3,0').type, 'fullCross'); assert.deepEqual(Array.from(a.state.map.get('3,0').roads), [0, 1, 2, 3, 4, 5]); assert.equal(boss.status, 'ready'); a.startWave(); const enemy = a.state.enemies.find(e => e.type === 'boss'), position = a.axialToPixel(3, 0); assert.equal(enemy.x, position.x); assert.equal(enemy.y, position.y);
});

test('prefab chain connections process multiple shrines before auto-starting the wave', () => {
  const { a, elements, timers } = load(); a.state.map.set('1,0', { q: 1, r: 0, type: 'straight', roads: [0, 3], slots: 0, towers: [] }); a.state.landmarks = new Map([3, 4].map(q => [q + ',0', { q, r: 0, type: 'shrine', shrineEffect: 'remove', claimed: false, prefab: { type: 'straight', roads: [0, 3], rotation: 0, slots: 1 } }])); a.state.hand = ['straight']; a.state.selectedCard = 0; a.state.rotation = 0; a.state.phase = 'place'; elements.get('autoStart').checked = true;
  a.placeTile(2, 0); assert.equal(a.state.pendingShrine, '3,0'); assert.equal(a.state.map.has('4,0'), true); assert.equal(timers.size, 0); a.finishRemoval(); assert.equal(a.state.pendingShrine, '4,0'); assert.equal(a.state.phase, 'removal'); assert.equal(timers.size, 0); a.finishRemoval(); assert.equal(a.state.phase, 'build'); assert.equal(timers.size, 1);
});


test('curve tiles route enemies along the road of the 3D model, in every rotation', () => {
  const context = {}; for (const file of ['map.js', 'data.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../classes', file), 'utf8'), context);
  vm.runInNewContext('globalThis.map=HexMap;globalThis.cards=HexData.CARD_LIBRARY;', context);
  const m = context.map, c = m.axialToPixel(0, 0);
  // Die Mittellinie der Kurve läuft durch (5,-10) relativ zur Hexmitte (Rotation 0), nicht durch die Hexmitte oder die andere Seite.
  for (const type of ['bigCurve', 'village', 'grove', 'watchtower']) for (let rotation = 0; rotation < 6; rotation++) {
    const card = context.cards[type], theta = -Math.PI / 3 * rotation, expected = { x: c.x + 5.9 * Math.cos(theta) + 10.1 * Math.sin(theta), y: c.y + 5.9 * Math.sin(theta) - 10.1 * Math.cos(theta) };
    const legs = [...m.roadGeometry({ q: 0, r: 0, type, roads: m.rotatedRoads(card, rotation) }).legs.values()];
    const nearest = Math.min(...legs.flat().map(p => Math.hypot(p.x - expected.x, p.y - expected.y)));
    assert.ok(nearest < 1, `${type} rot ${rotation}: path misses the model road (${nearest.toFixed(1)})`);
  }
});
