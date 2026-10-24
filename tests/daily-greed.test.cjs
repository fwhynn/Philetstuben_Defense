const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../headless-core.cjs'),{load}=require('./helpers/game.cjs');
const day='2026-10-25',json=v=>JSON.parse(JSON.stringify(v));
function setup(){const c=core(),r=c.runtime.create({seed:'greed-v1|'+day,runId:'greed',loadout:['archer','catapult','chain','freeze','mine'],challengeDay:day});const s=r.state;s.phase='build';s.map.set('1,0',{q:1,r:0,type:'straight',rotation:0,roads:[0,3],slots:1,towers:[null],buildingSlots:0,buildings:[]});return {c,...r};}
test('daily schedule preserves history, rotates three missions and lends an isolated one-front loadout',()=>{
 const {c,state:s}=setup();assert.equal(c.waves.daily('2026-09-22').id,'caravan');assert.equal(c.waves.daily('2026-09-23').id,'garrison');assert.equal(c.waves.daily('2026-10-24').id,'caravan');
 for(const [date,id]of [['2026-10-25','greed'],['2026-10-26','caravan'],['2026-10-27','garrison'],['2026-10-28','greed']])assert.equal(c.waves.daily(date).id,id);
 assert.equal(s.challengeTarget,12);assert.equal(s.difficulty,'normal');assert.equal(s.baseExits.length,1);assert.equal(s.ultimateUnlocks.length,0);assert.equal(s.buildingUnlocks.length,0);
 c.towers.buy(s,'ballista',[{q:1,r:0,index:0}]);assert.equal(c.data.towerDefinition(s.map.get('1,0').towers[0]).range,235);
 const ordinary=c.waves.plan(1),daily=c.waves.plan(1,0,true,s);assert.equal(daily.enemies[0].speed,ordinary.enemies[0].speed);assert.ok(daily.enemies.every(e=>!e.caravan));
});
test('contracts grant gold exactly once, reject invalid phases and persist their additional spawn plan',()=>{
 for(const id of ['swarm','healers','elite']){
  const r=setup(),{c,state:s}=r,gold=s.gold,offer=c.waves.greedOffers(s).find(o=>o.id===id);
  assert.ok(c.waves.acceptGreed(s,id));assert.equal(s.gold,gold+offer.gold);assert.equal(c.waves.acceptGreed(s,id),false);assert.equal(c.waves.acceptGreed(s,'swarm'),false);
  const plan=c.waves.plan(1,0,true,s);assert.equal(plan.enemies.filter(e=>e.greed).length,offer.count);assert.equal(plan.count,5+offer.count);assert.equal(plan.killGold,15);
  const restored=c.snapshot.restore(json(c.snapshot.capture(s,r.random)));assert.deepEqual(json(c.waves.plan(1,0,true,restored.state)),json(plan));assert.equal(c.waves.acceptGreed(restored.state,id),false);
  assert.ok(c.flow.start(s,r.random));assert.equal(s.pendingSpawns,plan.count);assert.equal(c.waves.acceptGreed(s,id),false);
  c.runtime.advance(s,r.random,.01);const resumed=c.snapshot.restore(json(c.snapshot.capture(s,r.random)));
  for(let i=0;i<20;i++){c.runtime.advance(s,r.random,.05);c.runtime.advance(resumed.state,resumed.random,.05);}assert.deepEqual(json(resumed.state.enemies),json(s.enemies));
 }
 for(const phase of ['place','wave','victory','gameover']){const {c,state:s}=setup();s.phase=phase;assert.equal(c.waves.acceptGreed(s,'elite'),false);}
 const {c,state:s}=setup();assert.equal(c.waves.acceptGreed(s,'invalid'),false);s.challengeKind='caravan';assert.equal(c.waves.acceptGreed(s,'elite'),false);
});
test('only survived contracts score; a completed contract never spills into the following wave',()=>{
 const {c,state:s,random}=setup();assert.ok(c.waves.acceptGreed(s,'elite'));c.flow.start(s,random);assert.equal(c.flow.finish(s),null);assert.equal(s.greedScore,0);
 s.pendingSpawns=0;s.spawnQueue=[];s.enemies=[];assert.ok(c.flow.finish(s));assert.equal(s.greedScore,4);assert.equal(c.flow.finish(s),null);assert.equal(s.greedScore,4);
 assert.ok(c.waves.plan(2,0,true,s).enemies.every(e=>!e.greed));s.phase='build';assert.ok(c.waves.acceptGreed(s,'swarm'));
 s.wave=2;s.hp=0;assert.equal(c.flow.finish(s),null);assert.equal(s.greedScore,4);
});
test('all twelve contracts cap at 48; victory without contracts is valid; endless cannot farm contracts',()=>{
 for(const contracts of [false,true]){const {c,state:s}=setup();
  for(let wave=1;wave<=12;wave++){s.phase='build';if(contracts)assert.ok(c.waves.acceptGreed(s,'elite'));s.wave=wave;s.enemies=[];s.spawnQueue=[];s.pendingSpawns=0;const result=c.flow.finish(s);assert.equal(result.victory,wave===12);}
  assert.equal(s.greedScore,contracts?48:0);assert.equal(s.phase,'victory');s.phase='build';s.endless=true;assert.equal(c.waves.acceptGreed(s,'elite'),false);
 }
});
test('controller preview updates immediately, Escape closes choices, and optional contracts are not a start gate',()=>{
 const h=load(),{a,elements}=h;a.newRun(undefined,undefined,undefined,day);a.state.phase='build';a.state.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[null]});elements.get('mainMenu').classList.add('hidden');a.renderAll();
 elements.get('greedOpenBtn').listeners.click();assert.equal(elements.get('greedChoices').children.length,3);a.startWave();assert.equal(a.state.wave,0);
 h.documentListeners.keydown({key:'Escape',preventDefault(){},target:{tagName:'BODY'}});assert.ok(elements.get('greedOverlay').classList.contains('hidden'));elements.get('greedOpenBtn').listeners.click();
 elements.get('greedChoices').children[0].listeners.click();assert.equal(a.state.greedContract.id,'swarm');assert.ok(elements.get('greedOverlay').classList.contains('hidden'));
 a.startWave();assert.equal(a.state.wave,1);assert.equal(a.state.pendingSpawns,11);
 const plain=load();plain.a.newRun(undefined,undefined,undefined,day);plain.a.state.phase='build';plain.a.state.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[null]});plain.a.startWave();assert.equal(plain.a.state.wave,1);assert.equal(plain.a.state.pendingSpawns,5);
});
test('daily settlement records risk score in profile without duplicate diamonds or normal records',()=>{
 const {a,elements,storage}=load();a.newRun(undefined,undefined,undefined,day);a.state.wave=12;a.state.greedScore=40;a.endWave();
 let p=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(p.dailyResults[day].bestRiskScore,40);assert.equal(p.diamonds,10);assert.equal(p.records.highestWave,0);
 elements.get('retryLoadoutBtn').listeners.click();a.state.wave=12;a.state.greedScore=20;a.endWave();p=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(p.dailyResults[day].bestRiskScore,40);assert.equal(p.diamonds,10);
});
test('local preview is gated to the isolated profile and leaves normal player ownership untouched',()=>{
 const regular=load();const before=regular.a.state;regular.elements.get('devGreedStart').listeners.click();assert.equal(regular.a.state,before);
 const h=load({firstPlayerTest:true});h.elements.get('devGreedStart').listeners.click();assert.equal(h.a.state.challengeKind,'greed');assert.equal(h.a.state.challengeDay,day);
});
