const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs');
function add(elements,id,count=1){elements.get('devEnemyType').value=id;elements.get('devEnemyCount').value=String(count);elements.get('devEnemyAdd').listeners.click();}
test('isolated enemy scenario schedules the selected enemies in order, once, and preserves real profile',()=>{
  const {a,elements,storage}=load({firstPlayerTest:true,developerScenario:'enemies',initialProfile:{diamonds:123}});
  const real=storage.get('hex-bastion-profile-v1');a.applyDeveloperScenario();
  assert.equal(a.state.map.size,6);assert.equal(a.state.phase,'build');assert.equal([...a.state.map.values()].flatMap(t=>t.towers).filter(Boolean).length,0);
  add(elements,'moltingBeetle',2);add(elements,'ramBeetle');a.startWave();
  assert.equal(a.state.pendingSpawns,3);assert.equal(a.state.devEnemyWave,1);
  a.update(1);assert.equal(a.state.enemies[0].type,'moltingBeetle');
  a.update(3);assert.deepEqual(Array.from(a.state.enemies,e=>e.type),['moltingBeetle','moltingBeetle','ramBeetle']);
  assert.ok(elements.get('devEnemyQueue').textContent.includes('Keine Auswahl'));
  a.state.waveRunning=false;a.state.enemies=[];a.state.phase='build';a.startWave();assert.equal(a.state.pendingSpawns,9);
  assert.equal(storage.get('hex-bastion-profile-v1'),real);
});
test('every listed enemy can be produced; boss waves and guardians are replaced in test waves',()=>{
  const {a,elements,waves}=load({firstPlayerTest:true,developerScenario:'enemies'});a.applyDeveloperScenario();
  for(const option of elements.get('devEnemyType').children){add(elements,option.value);}
  a.state.wave=14;a.startWave();const plan=waves.plan(15,0,false,a.state);
  assert.equal(plan.dev,true);assert.equal(plan.count,elements.get('devEnemyType').children.length);assert.equal(plan.boss,null);assert.equal(a.state.enemies.length,0);
  assert.ok(plan.enemies.every(e=>e.type&&e.hp>0&&Number.isFinite(e.speed)));
  assert.ok(plan.enemies.some(e=>e.bossKind==='summoner'));assert.ok(plan.enemies.some(e=>e.originBiome==='ash'));
});
test('normal profiles cannot inject dev rosters or use the selection controls',()=>{
  const {a,elements,waves}=load();a.state.devEnemyWave=1;a.state.devEnemyRoster=[{id:'ramBeetle',count:20}];
  add(elements,'ramBeetle',20);assert.equal(waves.plan(1,0,false,a.state).count,5);assert.equal(waves.plan(1,0,false,a.state).dev,undefined);
});
test('clearing cancels selection; bounds and snapshot restoration preserve valid test plans',()=>{
  const {a,elements,waves}=load({firstPlayerTest:true,developerScenario:'enemies'});a.applyDeveloperScenario();
  add(elements,'tarSnail',999);elements.get('devEnemyClear').listeners.click();a.startWave();assert.equal(a.state.pendingSpawns,5);
  a.state.waveRunning=false;a.state.enemies=[];a.state.phase='build';add(elements,'tarSnail',999);a.startWave();assert.equal(a.state.pendingSpawns,20);
  const checkpoint=a.captureRunCheckpoint();a.restoreRunCheckpoint(checkpoint);assert.equal(waves.plan(2,0,false,a.state).enemies[0].type,'tarSnail');
});
