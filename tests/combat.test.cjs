const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
function setup() {
  const context = {};
  for (const file of ['data.js', 'waves.js', 'combat.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../classes', file), 'utf8'), context);
  vm.runInNewContext('globalThis.step=HexCombat.step;globalThis.towers=HexData.TOWERS;', context);
  const state = { mineRandom: () => 0, hp: 20, gold: 0, goldEarned: { kills: 0 }, waveKills: 0, enemies: [], projectiles: [] };
  return { state, step: context.step, towers: context.towers };
}
function enemy(x, y = 0, hp = 100) { return { x, y, hp, alive: true, index: 0, t: 0, speed: 0, points: [{ x, y }, { x: x + 500, y }] }; }
test('catapult piercing hits only the first three enemies along the shot, independent of array order', () => {
  const { state, step, towers } = setup(); state.enemies = [enemy(80), enemy(20), enemy(60), enemy(40), enemy(30, 50)];
  step(state, [{ tw: { type: 'catapult', lastShot: 0 }, pos: { x: 0, y: 0 } }], towers, 0, 2000);
  assert.deepEqual(state.enemies.map(e => e.hp), [100, 82, 82, 82, 100]);
});
test('mine layer places mines before enemies arrive and detonates when one crosses it', () => {
  const { state, step, towers } = setup(), tower = { type: 'mine', lastShot: 0 }, ref = { tw: tower, pos: { x: 0, y: 0 }, roadPoints: [{ x: 20, y: 0 }, { x: 80, y: 0 }] };
  step(state, [ref], towers, 0, 2000); assert.equal(state.mines.length, 1); assert.equal(state.projectiles.length, 0);
  state.enemies = [enemy(20), enemy(50), enemy(100)]; step(state, [ref], towers, 0, 2100);
  assert.equal(state.enemies[0].hp, 73.6); assert.equal(state.enemies[1].hp, 73.6); assert.equal(state.enemies[2].hp, 100); assert.equal(state.mines.length, 0); assert.equal(state.projectiles[0].kind, 'blast');
});
test('periodic bosses resist extreme freeze but recover full speed outside the aura', () => {
  const { state, step, towers } = setup(), e = enemy(0); e.speed = 20; e.minSpeedFactor = .6; state.enemies = [e];
  step(state, [{ tw: { type: 'freeze', branch: 'deepFrost', finalUpgrade: 'absoluteZero' }, pos: { x: 0, y: 0 } }], towers, 1, 1000);
  assert.equal(e.x, 12); assert.equal(e.slowFactor, .6); step(state, [], towers, 1, 2000); assert.equal(e.x, 32);
});
test('constant travel speed crosses segments with different lengths', () => {
  const { state, step, towers } = setup(), e = enemy(0); e.speed = 30; e.points = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 100, y: 0 }]; state.enemies = [e];
  step(state, [], towers, 1, 1000); assert.equal(e.x, 30); assert.equal(e.index, 1);
  step(state, [], towers, 1, 2000); assert.equal(e.x, 60);
});
test('lightning jumps from the last victim and never hits a disconnected target', () => {
  const { state, step, towers } = setup(); state.enemies = [enemy(130), enemy(190), enemy(300)];
  step(state, [{ tw: { type: 'chain', lastShot: 0 }, pos: { x: 0, y: 0 } }], towers, 0, 1000);
  assert.equal(state.enemies[0].hp, 92); assert.ok(state.enemies[1].hp < 100); assert.equal(state.enemies[2].hp, 100);
});
test('freeze aura slows all nearby enemies without damage, shots or stacking', () => {
  const { state, step, towers } = setup(), e = enemy(0); e.speed = 20; state.enemies = [e];
  const refs = [{ tw: { type: 'freeze', lastShot: 0 }, pos: { x: 0, y: 0 } }, { tw: { type: 'freeze', lastShot: 0 }, pos: { x: 0, y: 0 } }];
  step(state, refs, towers, 1, 1000); assert.equal(e.hp, 100); assert.equal(e.x, 10); assert.equal(state.projectiles.length, 0);
  step(state, [], towers, 1, 2000); assert.equal(e.x, 30);
});

test('armor is a separate health pool and towers deal their listed armor damage', () => {
  const { state, step, towers } = setup(), e = enemy(10); e.armorHp = e.maxArmorHp = 10; state.enemies = [e];
  step(state, [{ tw: { type: 'archer', lastShot: 0 }, pos: { x: 0, y: 0 } }], towers, 0, 1000); assert.equal(e.hp, 100); assert.equal(e.armorHp, 1);
  step(state, [{ tw: { type: 'chain', lastShot: 0 }, pos: { x: 0, y: 0 } }], towers, 0, 2000); assert.equal(e.armorHp, 0); assert.ok(e.hp < 100);
});

test('mine layer has no placement cap and permits stacked mines', () => {
  const { state, step, towers } = setup(), ref = { tw: { type: 'mine', lastShot: 0 }, pos: { x: 0, y: 0 }, roadPoints: [{ x: 20, y: 0 }] };
  for (const time of [2000, 4000, 6000, 8000, 10000]) step(state, [ref], towers, 0, time);
  assert.equal(state.mines.length, 5); assert.ok(state.mines.every(m => m.x === 20 && m.y === 0));
});

test('ordered priorities fall back only when the requested resistance is absent', () => {
  const { state, step, towers } = setup(), plain = enemy(10, 0, 80), warded = enemy(20, 0, 20); warded.magicHp = warded.maxMagicHp = 12; state.enemies = [plain, warded];
  step(state, [{ tw: { type: 'archer', lastShot: 0, targetPriority: ['mostMagic', 'mostHealth', 'boss'] }, pos: { x: 0, y: 0 } }], towers, 0, 1000); assert.ok(warded.magicHp < 12); assert.equal(plain.hp, 80);
  warded.magicHp = 0; step(state, [{ tw: { type: 'archer', lastShot: 0, targetPriority: ['mostMagic', 'mostHealth', 'boss'] }, pos: { x: 0, y: 0 } }], towers, 0, 2000); assert.ok(plain.hp < 80);
});
test('archer branches change combat behavior: splash and extended single target range', () => {
  const { state, step, towers } = setup(); state.enemies = [enemy(10), enemy(30), enemy(100)];
  step(state, [{ tw: { type: 'archer', branch: 'volley', lastShot: 0 }, pos: { x: 0, y: 0 } }], towers, 0, 1000);
  assert.equal(state.enemies[0].hp, 91.25); assert.equal(state.enemies[1].hp, 91.25); assert.equal(state.enemies[2].hp, 100);
  state.enemies = [enemy(180)]; step(state, [{ tw: { type: 'archer', branch: 'marksman', lastShot: 0 }, pos: { x: 0, y: 0 } }], towers, 0, 2000); assert.equal(state.enemies[0].hp, 72.5);
});

test('catapult and lightning branches apply their distinct attack profiles', () => {
  const { state, step, towers } = setup(); state.enemies = [enemy(210)];
  step(state, [{ tw: { type: 'catapult', branch: 'siege', lastShot: 0 }, pos: { x: 0, y: 0 } }], towers, 0, 2000); assert.equal(state.enemies[0].hp, 64);
  state.enemies = [enemy(20), enemy(40), enemy(60), enemy(80), enemy(100)];
  step(state, [{ tw: { type: 'chain', branch: 'storm', lastShot: 0 }, pos: { x: 0, y: 0 } }], towers, 0, 3000); assert.ok(state.enemies.every(e => e.hp < 100));
  state.enemies = [enemy(20), enemy(40), enemy(60)];
  step(state, [{ tw: { type: 'chain', branch: 'overload', lastShot: 0 }, pos: { x: 0, y: 0 } }], towers, 0, 4000); assert.equal(state.enemies[0].hp, 82); assert.equal(state.enemies[2].hp, 100);
});

test('final lightning network damages all seven targets without negative damage', () => {
  const { state, step, towers } = setup(); state.enemies = Array.from({ length: 7 }, (_, i) => enemy(10 + i * 10));
  step(state, [{ tw: { type: 'chain', branch: 'storm', finalUpgrade: 'tempest', lastShot: 0 }, pos: { x: 0, y: 0 } }], towers, 0, 1000);
  assert.ok(state.enemies.every(e => e.hp < 100 && e.hp > 0));
});

test('terrain bonuses affect attacks after specialization and aura range', () => {
  const { state, step, towers } = setup(); state.enemies = [enemy(10)];
  step(state, [{ tw: { type: 'archer', tileType: 'grove', branch: 'marksman', lastShot: 0 }, pos: { x: 0, y: 0 } }], towers, 0, 1000); assert.equal(state.enemies[0].hp, 65.625);
  state.enemies = [enemy(175)];
  step(state, [{ tw: { type: 'freeze', tileType: 'highGround', lastShot: 0 }, pos: { x: 0, y: 0 } }], towers, 0, 2000); assert.equal(state.enemies[0].slowFactor, .5); assert.equal(state.enemies[0].hp, 100);
});

test('boss kill awards loot once without altering normal wave kill accounting', () => {
  const { state, step, towers } = setup(), e = { ...enemy(10, 0, 1), type: 'boss', killGold: 50, landmarkId: '1,0' }; state.landmarks = new Map([['1,0', { status: 'fighting' }]]); state.enemies = [e]; const events = [];
  step(state, [{ tw: { type: 'chain', lastShot: 0 }, pos: { x: 0, y: 0 } }], towers, 0, 1000, name => events.push(name)); assert.equal(state.gold, 50); assert.equal(state.goldEarned.boss, 50); assert.equal(state.waveKills, 0); assert.equal(state.landmarks.get('1,0').status, 'defeated'); assert.ok(events.includes('collect'));
  step(state, [], towers, 1, 2000); assert.equal(state.gold, 50);
});
test('boss and normal kills are recorded for meta progression by source', () => {
  const { state, step, towers } = setup(); state.earnedMeta = { normalKills: 0, periodicBosses: 0, explorationBosses: 0 }; state.bossRewards = [];
  state.enemies = [{ ...enemy(10, 0, 1), type: 'boss', killGold: 50, landmarkId: 'wave:10' }]; step(state, [{ tw: { type: 'chain', lastShot: 0 }, pos: { x: 0, y: 0 } }], towers, 0, 1000);
  state.enemies = [{ ...enemy(10, 0, 1), type: 'boss', killGold: 50, landmarkId: '3,2' }]; step(state, [{ tw: { type: 'chain', lastShot: 0 }, pos: { x: 0, y: 0 } }], towers, 0, 2000);
  state.enemies = [enemy(10, 0, 1)]; step(state, [{ tw: { type: 'chain', lastShot: 0 }, pos: { x: 0, y: 0 } }], towers, 0, 3000);
  assert.deepEqual(state.earnedMeta, { normalKills: 1, periodicBosses: 1, explorationBosses: 1 });
});
test('boss reaching base deals five damage and escapes without loot', () => {
  const { state, step, towers } = setup(), e = { ...enemy(0), type: 'boss', baseDamage: 5, landmarkId: '1,0', speed: 100, points: [{ x: 0, y: 0 }, { x: 1, y: 0 }] }; state.landmarks = new Map([['1,0', { status: 'fighting' }]]); state.enemies = [e]; step(state, [], towers, 1, 1000); assert.equal(state.hp, 15); assert.equal(state.gold, 0); assert.equal(state.landmarks.get('1,0').status, 'escaped');
});

test('damage terrain composes with upgrades and forge while freeze remains harmless', () => {
  const { state, step, towers } = setup(), e = enemy(10, 0, 1000); state.enemies = [e]; step(state, [{ tw: { type: 'archer', tileType: 'warCross', branch: 'marksman', supportDamage: 1.2, lastShot: 0 }, pos: { x: 0, y: 0 } }], towers, 0, 1000); assert.ok(Math.abs(e.hp - (1000 - 42.9)) < 1e-8);
  const fresh = enemy(10); state.enemies = [fresh]; state.projectiles = []; step(state, [{ tw: { type: 'freeze', tileType: 'battlefield', lastShot: 0 }, pos: { x: 0, y: 0 } }], towers, 0, 2000); assert.equal(fresh.hp, 100); assert.equal(state.projectiles.length, 0);
});
test('all enemy types pass through stationary units and faster enemies overtake', () => {
  for (const type of ['normal', 'swarm', 'armored', 'warded', 'boss']) {
    const { state, step, towers } = setup(), path = [{ x: 0, y: 0 }, { x: 600, y: 0 }];
    const ahead = Object.assign(enemy(5), { points: path, t: 5 / 600, speed: 0 });
    const moving = Object.assign(enemy(0), { type, points: path, speed: 60 });
    state.enemies = [ahead, moving]; step(state, [], towers, .1, 100); assert.equal(moving.x, 6);
    ahead.speed = 20; for (let i = 0; i < 20; i++)step(state, [], towers, .1, 200 + i * 100);
    assert.ok(moving.x > ahead.x); assert.ok(Math.abs(moving.x - 126) < 1e-8);
  }
});
test('enemies on crossing paths do not stop each other at junctions', () => {
  const { state, step, towers } = setup();
  const a = Object.assign(enemy(-5), { speed: 10, points: [{ x: -5, y: 0 }, { x: 100, y: 0 }] });
  const b = Object.assign(enemy(0, -5), { speed: 20, points: [{ x: 0, y: -5 }, { x: 0, y: 100 }] });
  state.enemies = [a, b]; step(state, [], towers, 1, 1000); assert.equal(a.x, 5); assert.equal(b.y, 15);
});


test('element fire splashes, wind pierces and water slow expires with boss resistance', () => {
  for (const [branch, count] of [['elementFire', 2], ['elementWind', 3]]) {
    const { state, step, towers } = setup(); const enemies = [enemy(20), enemy(40), enemy(100)]; state.enemies = enemies;
    step(state, [{ tw: { type: 'element', branch, lastShot: 0 }, pos: { x: 0, y: 0 } }], towers, 0, 2000);
    assert.equal(enemies.filter(e => e.hp < 100).length, count);
  }
  const { state, step, towers } = setup(), e = enemy(20); e.speed = 10; e.minSpeedFactor = .8; state.enemies = [e];
  step(state, [{ tw: { type: 'element', branch: 'elementWater', lastShot: 0 }, pos: { x: 0, y: 0 } }], towers, 0, 2000);
  step(state, [], towers, 1, 2500); assert.equal(e.slowFactor, .8); assert.equal(e.x, 28);
  step(state, [], towers, 1, 4100); assert.equal(e.slowFactor, 1); assert.equal(e.x, 38);
});

test('necromancers share each death once, cap souls, attack and expire them without extra loot', () => {
  const { state, step, towers } = setup(), near = { type: 'necromancer', lastShot: 0 }, far = { type: 'necromancer', lastShot: 0 };
  const refs = [{ tw: near, pos: { x: 0, y: 0 } }, { tw: far, pos: { x: 10, y: 0 } }];
  state.enemies = [enemy(1, 0, 1), enemy(2, 0, 1)]; step(state, refs, towers, 0, 2000);
  assert.equal(near.souls.length + far.souls.length, 2); assert.equal(state.waveKills, 2);
  const e = enemy(20, 0, 1000); state.enemies = [e]; near.lastShot = far.lastShot = 3000;
  step(state, refs, towers, 0, 3000); assert.equal(e.hp, 984); assert.equal(state.waveKills, 2);
  near.lastShot = far.lastShot = 9000; step(state, refs, towers, 0, 9000);
  assert.equal(near.souls.length + far.souls.length, 0); assert.equal(e.hp, 984);
  near.souls = Array.from({ length: 3 }, () => ({ until: 20000, lastShot: 10000 })); near.lastShot = 0;
  state.enemies = [enemy(1, 0, 1)]; step(state, [refs[0]], towers, 0, 10000); assert.equal(near.souls.length, 3);
});

test('escaped enemies do not provide souls', () => {
  const { state, step, towers } = setup(), tw = { type: 'necromancer', lastShot: 0 }, e = enemy(0); e.index = 1; state.enemies = [e];
  step(state, [{ tw, pos: { x: 0, y: 0 } }], towers, 0, 2000); assert.equal(tw.souls.length, 0); assert.equal(state.waveKills, 0);
});


test('caravan carriers pay once on kill and lose gold without going negative on escape', () => {
  const { state, step, towers } = setup(), carrier = enemy(20, 0, 1); carrier.killGold = 18; carrier.goldLoss = 10; state.enemies = [carrier];
  step(state, [{ tw: { type: 'archer', lastShot: 0 }, pos: { x: 0, y: 0 } }], towers, 0, 2000); assert.equal(state.gold, 18); assert.equal(state.goldEarned.kills, 18);
  step(state, [], towers, 0, 3000); assert.equal(state.gold, 18);
  const escape = enemy(0); escape.index = 1; escape.goldLoss = 10; state.gold = 4; state.enemies = [escape]; step(state, [], towers, 0, 4000);
  assert.equal(state.gold, 0); assert.equal(state.hp, 19); assert.equal(state.waveKills, 1);
});

test('random mines are uniform along road length, clipped to range and independent of segmentation', () => {
  const c = { HexMap: { roadGeometry: tile => ({ legs: new Map([[0, tile.points]]) }) } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../classes/combat.js'), 'utf8').replace('return {step,durability', 'return {randomMinePoint,step,durability') + ';globalThis.pick=HexCombat.randomMinePoint;', c);
  for (const roll of [0, .1, .3, .9, .999]) { const pick = points => c.pick({ mineRandom: () => roll, map: new Map([['0,0', { points }]]) }, { pos: { x: 0, y: 0 } }, 80); const a = pick([{ x: -120, y: 0 }, { x: 120, y: 0 }]), b = pick(Array.from({ length: 121 }, (_, i) => ({ x: -120 + i * 2, y: 0 }))); assert.ok(Math.abs(a.x - b.x) < 1e-8); assert.ok(Math.abs(a.x) <= 80); assert.ok(Math.abs(a.x - (-80 + 160 * roll)) < 1e-8); }
});
test('stacked mines all detonate together even if the first explosion kills the triggering enemy', () => {
  const { state, step, towers } = setup(); state.enemies = [enemy(20, 0, 1)]; state.mines = [1, 2, 3].map(id => ({ id, x: 20, y: 0, damage: 100, splash: 45 })); step(state, [], towers, 0, 2000); assert.equal(state.mines.length, 0); assert.equal(state.projectiles.filter(p => p.kind === 'blast').length, 3); assert.equal(state.waveKills, 1);
});

test('touching mines do not chain detonate from another mine explosion', () => {
  const { state, step, towers } = setup(); state.enemies = [enemy(0, 0, 1)];
  // Mine 2 touches mine 1 and lies inside its blast, but the enemy is outside its own trigger radius.
  state.mines = [{ id: 1, x: 10, y: 0, damage: 100, splash: 45 }, { id: 2, x: 20, y: 0, damage: 100, splash: 45 }, { id: 3, x: 30, y: 0, damage: 100, splash: 45 }];
  step(state, [], towers, 0, 2000); assert.deepEqual(Array.from(state.mines, m => m.id), [2, 3]); assert.equal(state.projectiles.filter(p => p.kind === 'blast').length, 1);
});

test('run damage statistics count actual shield and health loss without overkill, per tower', () => {
  const { state, step, towers } = setup(), tw = { type: 'archer', statId: 1, lastShot: 0 }; state.runTowerDetails = { 1: { type: 'archer', damage: 0 } };
  const target = enemy(20, 0, 3); target.armorHp = 10; target.magicHp = 5; state.enemies = [target];
  step(state, [{ tw, pos: { x: 0, y: 0 } }], { ...towers, archer: { ...towers.archer, damage: 100, damageMultipliers: { hp: 1, armor: 1, magic: 1 } } }, 0, 2000);
  assert.equal(state.runTowerStats.archer.damage, 18); assert.equal(state.runTowerDetails[1].damage, 18);
});
test('mine damage survives tower sale and base damage does not inflate archer statistics', () => {
  const { state, step, towers } = setup(); state.runTowerDetails = { 3: { type: 'mine', damage: 0, sold: true } }; state.enemies = [enemy(20, 0, 5)]; state.mines = [{ id: 1, x: 20, y: 0, damage: 100, splash: 45, source: { type: 'mine', statId: 3 } }]; step(state, [], towers, 0, 2000); assert.equal(state.runTowerStats.mine.damage, 5); assert.equal(state.runTowerDetails[3].damage, 5);
  const base = { type: 'archer', lastShot: 0 }; state.baseWeapon = base; state.enemies = [enemy(20, 0, 2)]; step(state, [{ tw: base, pos: { x: 0, y: 0 } }], towers, 0, 3000); assert.equal(state.baseDamage, 2); assert.equal(state.runTowerStats.archer, undefined);
});
test('necromancer statistics include spirit damage', () => {
  const { state, step, towers } = setup(), tw = { type: 'necromancer', statId: 4, lastShot: 2000, souls: [{ until: 10000, lastShot: 0 }] }; state.runTowerDetails = { 4: { type: 'necromancer', damage: 0 } }; state.enemies = [enemy(20, 0, 100)]; step(state, [{ tw, pos: { x: 0, y: 0 } }], towers, 0, 2000); assert.equal(state.runTowerStats.necromancer.damage, 8); assert.equal(state.runTowerDetails[4].damage, 8);
});
