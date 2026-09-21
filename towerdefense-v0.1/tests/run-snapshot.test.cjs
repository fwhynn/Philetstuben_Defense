const {test}=require('node:test'),assert=require('node:assert/strict');
const loadCore=require('../headless-core.cjs');
const {load}=require('./helpers/game.cjs');
const loadout=['archer','catapult','chain','freeze','mine'];
const json=value=>JSON.parse(JSON.stringify(value));
function combatRun(core,id='a'){
  const run=core.runtime.create({seed:'checkpoint',runId:id,loadout});
  const s=run.state;s.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[{type:'mine',lastShot:-Infinity,paid:35}]});
  s.phase='wave';s.wave=3;s.waveRunning=true;
  core.runtime.schedule(s,core.runtime.spawnSources(s),core.waves.plan(s.wave,0).enemies);
  return run;
}
test('headless combat resumes mid-wave exactly with mines, routes, cooldowns and exploration metadata',()=>{
  const core=loadCore(),a=combatRun(core);
  for(let i=0;i<43;i++)core.runtime.advance(a.state,a.random,.05);
  assert.ok(a.state.enemies.length);assert.ok(a.state.spawnQueue.length);assert.equal(typeof a.state.mineRandom,'function');
  a.state.selectedTower={q:1,r:0,index:0};a.state.hoverBuilding={q:0,r:0};
  const checkpoint=json(core.snapshot.capture(a.state,a.random)),otherCore=loadCore(),b=otherCore.snapshot.restore(checkpoint);
  assert.equal(b.state.selectedTower,undefined);assert.equal(b.state.hoverBuilding,undefined);
  assert.equal(b.state.baseWeapon.lastShot,-Infinity);assert.equal(b.state.landmarks.seed,a.state.landmarks.seed);
  assert.deepEqual([...b.state.landmarks.surveyed],[...a.state.landmarks.surveyed]);
  let outcome;
  for(let i=0;i<2500;i++){
    outcome=core.runtime.advance(a.state,a.random,.05);
    assert.equal(otherCore.runtime.advance(b.state,b.random,.05),outcome);
    assert.deepEqual(json(core.snapshot.capture(a.state,a.random)),json(otherCore.snapshot.capture(b.state,b.random)));
    if(outcome!=='running')break;
  }
  assert.equal(outcome,'complete');
  core.exploration.expand(a.state.landmarks,new Map([['7,0',{q:7,r:0}]]));
  otherCore.exploration.expand(b.state.landmarks,new Map([['7,0',{q:7,r:0}]]));
  assert.deepEqual(json(core.snapshot.capture(a.state,a.random)),json(otherCore.snapshot.capture(b.state,b.random)));
});
test('independent run factories do not share mutable state or consume each others random stream',()=>{
  const core=loadCore(),a=combatRun(core,'a'),b=combatRun(core,'b');
  const before=json(core.snapshot.capture(b.state,b.random));core.runtime.advance(a.state,a.random,.05);a.state.towerLoadout.pop();a.state.map.get('0,0').roads.push(3);
  assert.deepEqual(json(core.snapshot.capture(b.state,b.random)),before);
  assert.throws(()=>core.runtime.advance(b.state,b.random,-1),/delta/);
});
test('checkpoint rejects unsupported phases and versions without changing the run',()=>{
  const core=loadCore(),run=combatRun(core);const checkpoint=json(core.snapshot.capture(run.state,run.random));
  assert.throws(()=>core.snapshot.restore({...checkpoint,version:99}),/Incompatible/);
  for(const phase of ['reward','removal','bossReward']){run.state.phase=phase;assert.throws(()=>core.snapshot.capture(run.state,run.random),/Checkpoint/);}
});
test('solo controller uses the same simulation and restores a JSON checkpoint',()=>{
  const {a}=load();a.state.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:0,towers:[]});a.state.phase='build';a.startWave();a.update(.2,200,false);
  const checkpoint=json(a.captureRunCheckpoint());a.update(.5,700,false);const future=json(a.captureRunCheckpoint());
  a.restoreRunCheckpoint(checkpoint);a.update(.5,700,false);
  assert.deepEqual(json(a.captureRunCheckpoint()),future);
});
