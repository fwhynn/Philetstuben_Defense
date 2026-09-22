const {test}=require('node:test'),assert=require('node:assert/strict');
const loadCore=require('../headless-core.cjs');
const loadout=['archer','catapult','chain','freeze','mine'];
const json=value=>JSON.parse(JSON.stringify(value));
test('combat computes slot geometry only for occupied tiles and follows sales and purchases immediately',()=>{
  const {core,state,random}=require('../scripts/mine-performance.cjs').fixture();
  const original=core.map.slotPositions;let calls=0;core.map.slotPositions=(...args)=>{calls++;return original(...args);};
  core.runtime.advance(state,random,2);assert.equal(calls,10,'41 tiles but only 10 occupied');
  for(const tile of state.map.values())tile.towers=(tile.towers||[]).map(()=>null);
  calls=0;core.runtime.advance(state,random,2);assert.equal(calls,0);
  state.map.get('1,0').towers[0]={type:'mine',lastShot:0};
  core.runtime.advance(state,random,2);assert.equal(calls,1);
});
function fixture(core){
  const run=core.runtime.create({seed:'route-cache',runId:'test',loadout});
  run.state.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:0,towers:[]});
  return run;
}
test('unchanged topology reuses the graph; roads, types, tunnels and replacement maps invalidate it',()=>{
  const core=loadCore(),{state}=fixture(core),original=core.map.routeGraph;let calls=0;
  core.map.routeGraph=(...args)=>{calls++;return original(...args);};
  const sources=()=>core.runtime.spawnSources(state);
  sources();sources();assert.equal(calls,1);
  state.map.get('1,0').roads.push(1);sources();assert.equal(calls,2);
  state.map.get('1,0').type='longRoad';sources();assert.equal(calls,3);
  state.map.get('1,0').tunnels=['0,0'];sources();assert.equal(calls,4);
  state.map=new Map(state.map);sources();assert.equal(calls,5);
  state.map.delete('1,0');sources();assert.equal(calls,6);
});
test('portal changes and tile replacement are read live without stale source objects',()=>{
  const core=loadCore(),{state}=fixture(core);
  state.map.set('1,0',{q:1,r:0,type:'deadEnd',roads:[3],slots:0,towers:[],buildings:[]});
  assert.equal(core.runtime.spawnSources(state).length,0);
  state.map.get('1,0').buildings.push({type:'portal'});
  assert.equal(core.runtime.spawnSources(state)[0].dir,6);
  const replacement={...state.map.get('1,0'),buildings:[{type:'portal'}]};state.map.set('1,0',replacement);
  assert.equal(core.runtime.spawnSources(state)[0].tile,replacement);
  replacement.buildings=[];assert.equal(core.runtime.spawnSources(state).length,0);
});
test('cached paths retain exact seeded choices on a branching map compared with fresh graphs',()=>{
  const core=loadCore(),a=fixture(core),b=fixture(core);
  for(const run of [a,b]){
    run.state.map.get('0,0').roads=[0,1,2,3,4,5];
    for(let d=0;d<6;d++){const p=core.map.neighbor(0,0,d);run.state.map.set(core.map.key(p.q,p.r),{...p,type:'cross',roads:[0,1,2,3,4,5],slots:0,towers:[]});}
  }
  for(let i=0;i<60;i++){
    b.state.map=new Map(b.state.map); // Force independent reconstruction.
    const x=core.runtime.spawnSources(a.state),y=core.runtime.spawnSources(b.state),index=i%x.length;
    assert.deepEqual(json(core.runtime.nextSourcePoints(a.state,a.random,x[index])),json(core.runtime.nextSourcePoints(b.state,b.random,y[index])));
    assert.deepEqual(json(a.random.snapshot()),json(b.random.snapshot()));
  }
});
test('spawn profiles are reused but refresh for wave, income, challenge and restored state',()=>{
  const core=loadCore(),{state,random}=fixture(core),original=core.waves.plan;let calls=0;
  core.waves.plan=(...args)=>{calls++;return original(...args);};
  state.wave=40;const points=[{x:100,y:0},{x:0,y:0}];
  const spawn=(s,index=0)=>core.runtime.spawnEnemy(s,points,index);
  spawn(state);spawn(state,1);assert.equal(calls,1);
  state.enemies[0].hp=1;spawn(state);assert.notEqual(state.enemies.at(-1).hp,1,'enemy damage must not modify cached profiles');
  state.wave++;spawn(state);assert.equal(calls,2);
  state.income++;spawn(state);assert.equal(calls,3);
  state.challengeDay='2026-09-22';spawn(state);assert.equal(calls,4);
  assert.equal(state.enemies.at(-1).speed,original(state.wave,state.income,true).enemies[0].speed);
  const restored=core.snapshot.restore(json(core.snapshot.capture(state,random)));
  spawn(restored.state);assert.equal(calls,5);
  assert.equal(core.runtime.spawnSources(restored.state).length,1);
});
