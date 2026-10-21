const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs');

test('designer showcase builds corrected tiles, ultimate towers and a boss wave with real commands',()=>{
  const {a,upgradeSelectedTower,storage}=load({firstPlayerTest:true,developerScenario:'showcase',initialProfile:{diamonds:300}});
  const real=storage.get('hex-bastion-profile-v1');
  assert.equal(a.applyDeveloperScenario(),true);
  const tiles=[...a.state.map.values()],types=tiles.map(t=>t.type);
  for(const type of ['royalBend','bigCurve','watchtower','mirrorJunction','fanJunction','sideCross','deadEnd'])assert.ok(types.includes(type),type);
  assert.equal(a.state.phase,'build');assert.equal(a.state.heroId,'standard');assert.equal(a.state.difficulty,'normal');
  const towers=tiles.flatMap(t=>t.towers||[]).filter(Boolean);
  assert.equal(towers.length,12);assert.equal(towers.filter(t=>t.ultimate).length,11);
  const slot=a.state.selectedTower,flame=()=>a.state.map.get(`${slot.q},${slot.r}`).towers[slot.index];
  assert.equal(flame().type,'flame');assert.equal(flame().finalUpgrade,'sunfire');assert.equal(flame().ultimate,undefined);
  upgradeSelectedTower('ultimate:flame');assert.equal(flame().ultimate,'flame');assert.ok(a.state.gold<1000);
  a.startWave();assert.equal(a.state.devEnemyWave,1);assert.equal(a.state.pendingSpawns,3);
  a.update(5);assert.deepEqual([...a.state.enemies.map(e=>e.bossKind)].sort(),['hunter','iron','summoner']);
  assert.equal(storage.get('hex-bastion-profile-v1'),real);
});
