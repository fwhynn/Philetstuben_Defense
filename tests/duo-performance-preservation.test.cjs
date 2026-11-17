const {test}=require('node:test'),assert=require('node:assert/strict'),loadCore=require('../headless-core.cjs');
test('presentation range index returns exactly the brute-force candidates and ordering',()=>{
 const core=loadCore(),enemies=Array.from({length:700},(_,i)=>({id:i,x:(i*173)%2400-1200,y:(i*79)%1800-900,alive:true,hp:i%9}));
 enemies.push({id:700,x:128,y:0},{id:701,x:-128,y:0},{id:702,x:0,y:0});
 const query=core.combat.presentationRange(enemies);
 for(const pos of [{x:0,y:0},{x:-128,y:128},{x:300,y:-600}])for(const range of [0,1,128,256,500,5000,Infinity,-1,NaN]){
  const expected=enemies.filter(e=>Math.hypot(e.x-pos.x,e.y-pos.y)<=range),actual=query(pos,range);
  assert.deepEqual(Array.from(actual),expected);
  for(const priority of ['closestTower','furthestTower','mostHealth','leastHealth','boss'])assert.equal(core.combat.targetByPriority(actual,{targetPriority:[priority]},pos),core.combat.targetByPriority(expected,{targetPriority:[priority]},pos));
 }
});
test('slot geometry cache preserves full simulation and refreshes on geometry edits',()=>{
 const core=loadCore(),loadout=['archer','catapult','chain','freeze','mine'];
 const a=core.runtime.create({seed:'slot-equivalence',runId:'test',loadout}),b=core.runtime.create({seed:'slot-equivalence',runId:'test',loadout});
 for(const {state:s} of [a,b]){s.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[{type:'mine',lastShot:-Infinity,paid:35}]});s.phase='wave';s.wave=3;s.waveRunning=true;core.runtime.schedule(s,core.runtime.spawnSources(s),core.waves.plan(3,0).enemies);}
 for(let i=0;i<180;i++){
  if(i===30)for(const r of [a,b])r.state.map.get('1,0').rotation=2;
  if(i===60)for(const r of [a,b])r.state.map.get('1,0').towers[0]=null;
  if(i===90)for(const r of [a,b])r.state.map.get('1,0').towers[0]={type:'archer',lastShot:-Infinity,paid:25};
  b.state.map=new Map([...b.state.map].map(([id,tile])=>[id,{...tile}])); // Force fresh geometry.
  assert.equal(core.runtime.advance(a.state,a.random,.05),core.runtime.advance(b.state,b.random,.05));
  assert.equal(JSON.stringify(core.snapshot.capture(a.state,a.random)),JSON.stringify(core.snapshot.capture(b.state,b.random)));
 }
});
