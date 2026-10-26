// Read-only numerical audit of actual standard wave plans. No profile or network access.
const core = require('../headless-core.cjs')();
const rows = [];
for (let wave = 1; wave <= 100; wave++) {
  const samples = [];
  for (let seed = 0; seed < 100; seed++) {
    const plan = core.waves.plan(wave, 0, false, {
      seed: 'late-audit-' + seed,
      towerLoadout: ['archer', 'catapult', 'freeze', 'flame', 'chain']
    });
    const pools = enemy => (enemy.hp || 0) + (enemy.armorHp || 0) + (enemy.magicHp || 0);
    // Include splitter children; exclude conditional healing, shields, resistances,
    // spore concealment and summoned boss minions. This is not a win-rate simulation.
    const durability = plan.enemies.reduce((sum, enemy) => sum + pools(enemy)
      + (enemy.splitOnDeath ? 2 * Math.round(enemy.hp * .25) : 0), 0)
      + (plan.boss ? pools(plan.boss) : 0);
    const state = { elapsedMs: 0 };
    core.runtime.schedule(state, [{ tile: { q: 1, r: 0 }, dir: 0 }], plan.enemies, 20);
    samples.push({ durability, spawnSeconds: state.spawnQueue.at(-1).due / 1000 });
  }
  const plan = core.waves.plan(wave);
  rows.push({ wave, normalHp: plan.hp, enemies: plan.count, normalSpeed: plan.speed,
    boss: plan.boss?.name || null, bossHp: plan.boss?.hp || 0,
    durabilityMean: Math.round(samples.reduce((sum, s) => sum + s.durability, 0) / samples.length),
    durabilityMin: Math.min(...samples.map(s => s.durability)),
    durabilityMax: Math.max(...samples.map(s => s.durability)),
    spawnSecondsMean: samples.reduce((sum, s) => sum + s.spawnSeconds, 0) / samples.length,
    goldWithoutBuildings: plan.maxGold });
}
console.log(JSON.stringify(rows, null, 2));
