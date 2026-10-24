const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../headless-core.cjs'),{load}=require('./helpers/game.cjs');
const day='2026-11-15',json=x=>JSON.parse(JSON.stringify(x)),loc=(q,r)=>({q,r,index:0});
function setup(){const c=core();return {c,...c.session.create({seed:'powerGrid-v1|'+day,runId:'power-test',challengeDay:day,loadout:['archer','catapult','chain','freeze','mine'],unlocks:['ultimate:archer','building:market']})};}
function configure(c,s,keys){for(const id of [...s.powerGrid.enabled])assert.ok(c.powerGrid.toggleField(s,id));for(const id of keys)assert.ok(c.powerGrid.toggleField(s,id));}
function tower(r,q,z,type='archer'){assert.ok(r.c.towers.buy(r.state,type,[loc(q,z)]).ok);return r.state.map.get(q+','+z).towers[0];}
test('fixed mission initializes two generators, limited relays, valid geometry and isolated bonuses',()=>{
 const {c,state:s}=setup();assert.equal(s.challengeTarget,12);assert.equal(s.gold,150);assert.equal(s.phase,'build');assert.equal(s.map.size,15);assert.equal(s.powerGrid.enabled.length,4);assert.equal(s.powerGrid.limit,6);assert.equal(c.powerGrid.evaluate(s).capacity,6);
 assert.equal(s.ultimateUnlocks.length,0);assert.equal(s.buildingUnlocks.length,0);assert.equal(s.hand.length,0);assert.equal(c.heroes.buy(s,'walls'),false);assert.equal(c.runtime.rescueTunnel(s),false);assert.equal(c.placement.canPlace(s,3,4,c.data.CARD_LIBRARY.straight,0),false);
 for(const t of s.map.values())assert.equal(c.map.slotPositions(t).length,t.slots);
 assert.equal(c.powerGrid.toggleField(s,'missing'),false);assert.equal(c.powerGrid.toggleField(s,'0,0'),false);assert.ok(c.powerGrid.toggleField(s,'3,0'));assert.ok(c.powerGrid.toggleField(s,'3,1'));assert.equal(c.powerGrid.toggleField(s,'3,2'),false);assert.equal(s.powerGrid.enabled.length,6);
});
test('isolated fields do not supply towers; relays join generators and share capacity',()=>{
 const r=setup(),{c,state:s}=r;s.gold=1000;
 configure(c,s,['1,0','1,1','1,2','1,3','1,4','0,4']);
 const slots=[[1,0],[1,2],[1,4],[0,4],[2,4]],towers=slots.map(([q,z])=>tower(r,q,z));let net=c.powerGrid.evaluate(s);assert.equal(net.components.length,1);assert.equal(net.components[0].capacity,6);assert.equal(net.used,5);
 assert.ok(c.powerGrid.toggleField(s,'1,3'));net=c.powerGrid.evaluate(s);assert.equal(net.components.filter(x=>x.capacity).length,2);assert.equal(net.used,5);
 assert.ok(c.powerGrid.toggleField(s,'1,1'));net=c.powerGrid.evaluate(s);assert.equal(net.status.get(towers[1].statId),'disconnected');assert.equal(net.used,4);
});
test('component capacity uses stable build order; switching a tower off releases one unit',()=>{
 const r=setup(),{c,state:s}=r;s.gold=1000;assert.ok(c.powerGrid.toggleField(s,'0,3'));
 const slots=[[2,4],[1,4],[0,4],[0,3]],towers=slots.map(([q,z])=>tower(r,q,z));let net=c.powerGrid.evaluate(s);assert.equal(net.used,3);assert.equal(net.status.get(towers[3].statId),'capacity');
 assert.ok(c.powerGrid.toggleTower(s,loc(2,4)));net=c.powerGrid.evaluate(s);assert.equal(net.status.get(towers[0].statId),'off');assert.equal(net.status.get(towers[3].statId),'powered');
 const expected=[...net.active].sort();s.map=new Map([...s.map].reverse());s.powerGrid.enabled.reverse();assert.deepEqual([...c.powerGrid.evaluate(s).active].sort(),expected);
 const restored=c.snapshot.restore(json(c.snapshot.capture(s,r.random)));assert.deepEqual([...c.powerGrid.evaluate(restored.state).active].sort(),expected);
});
test('wave start locks allocation and all supply-changing commands, including paused combat',()=>{
 const r=setup(),{c,state:s}=r;const tw=tower(r,1,0);assert.ok(c.flow.start(s,r.random));const allocation=json(s.powerGrid.battlePowerIds),gold=s.gold;assert.deepEqual(allocation,[tw.statId]);
 for(const paused of [false,true]){s.paused=paused;assert.equal(c.powerGrid.toggleField(s,'1,0'),false);assert.equal(c.powerGrid.toggleTower(s,loc(1,0)),false);assert.equal(c.towers.buy(s,'archer',[loc(2,0)]).ok,false);assert.equal(c.towers.upgrade(s,loc(1,0),'volley'),false);assert.equal(c.data.towerRefund(s,tw),null);assert.deepEqual(json(c.data.runUpgrades(s,tw)),[]);}
 assert.equal(s.gold,gold);assert.deepEqual(json(s.powerGrid.battlePowerIds),allocation);
 s.spawnQueue=[];s.pendingSpawns=0;s.enemies=[];assert.ok(c.session.finish(s,r.random));assert.ok(c.powerGrid.toggleTower(s,loc(1,0)));assert.equal(s.powerGrid.battlePowerIds.length,0);
});
test('unpowered damage towers, frost auras and mine production are genuinely inactive',()=>{
 for(const type of ['archer','freeze','mine']){
  for(const enabled of [false,true]){const r=setup(),{c,state:s}=r;const tw=tower(r,2,4,type);if(!enabled)assert.ok(c.powerGrid.toggleTower(s,loc(2,4)));assert.ok(c.flow.start(s,r.random));
   for(let i=0;i<180;i++)c.runtime.advance(s,r.random,.05);
   if(type==='archer')assert.equal((s.runTowerDetails[tw.statId].damage||0)>0,enabled);
   if(type==='mine')assert.equal(tw.lastShot!==-Infinity,enabled);
   if(type==='freeze'){assert.ok(s.enemies.length>0);assert.equal(s.enemies.some(e=>e.slowFactor<1),enabled);}
  }
 }
});
test('snapshot preserves switch configuration and frozen allocation with identical resumed combat',()=>{
 const r=setup(),{c,state:s}=r;tower(r,2,4);tower(r,1,4,'freeze');c.flow.start(s,r.random);c.runtime.advance(s,r.random,1);
 const checkpoint=json(c.snapshot.capture(s,r.random)),restored=c.snapshot.restore(checkpoint);assert.deepEqual(json(restored.state.powerGrid),json(s.powerGrid));
 for(let i=0;i<150;i++){c.runtime.advance(s,r.random,.05);c.runtime.advance(restored.state,restored.random,.05);}
 assert.deepEqual(json(restored.state.enemies),json(s.enemies));assert.equal(restored.state.hp,s.hp);assert.deepEqual(json(restored.state.powerGrid),json(s.powerGrid));
});
test('real mixed defense wins twelve waves at the actual daily seed without extra gold',()=>{
 const r=setup(),{c,state:s}=r;assert.ok(c.powerGrid.toggleField(s,'3,0'));const build=[['catapult',1,4],['freeze',0,4],['ballista',2,4],['archer',1,0],['catapult',2,0],['mine',3,0]];
 for(let wave=1;wave<=12;wave++){
  for(const [type,q,z]of build)if(!s.map.get(q+','+z).towers[0])c.towers.buy(s,type,[loc(q,z)]);
  for(const [,q,z]of build){const tw=s.map.get(q+','+z).towers[0];if(tw)for(const [id]of c.data.runUpgrades(s,tw).slice(0,1))c.towers.upgrade(s,loc(q,z),id);}
  assert.ok(c.flow.start(s,r.random));let result,steps=0;do{result=c.session.advance(s,r.random,.05);}while(result==='running'&&++steps<20000);
  assert.equal(result,'complete','wave '+wave);c.session.acknowledge(s);assert.ok(c.powerGrid.evaluate(s).used<=6);assert.ok(s.gold>=0);assert.equal(s.bossRewards.length,0);
 }
 assert.equal(s.phase,'victory');assert.equal(s.hp,20);assert.equal(s.earnedMeta.periodicBosses,1);assert.equal(c.session.endless(s,r.random),false);assert.equal(c.session.finish(s,r.random),null);
});
test('controller exposes switches and locks, saves off state and grants daily diamonds only once',()=>{
 const regular=load(),before=regular.a.state;regular.elements.get('devPowerStart').listeners.click();assert.equal(regular.a.state,before);
 const preview=load({firstPlayerTest:true});preview.elements.get('devPowerStart').listeners.click();assert.equal(preview.a.state.challengeKind,'powerGrid');
 const h=load(),{a,elements,storage}=h;a.newRun(undefined,undefined,undefined,day);h.selectSlot(1,0,0);h.buyTower('archer');a.rendererCommands.selectTower(1,0,0);elements.get('powerTowerBtn').listeners.click();assert.equal(a.state.map.get('1,0').towers[0].powerOff,true);
 const button=elements.get('powerFields').children[0];a.renderAll();assert.equal(elements.get('powerFields').children[0],button);button.listeners.click();assert.ok(!a.state.powerGrid.enabled.includes('1,0'));
 a.restoreRunCheckpoint(json(a.captureRunCheckpoint()));assert.equal(a.state.map.get('1,0').towers[0].powerOff,true);assert.ok(!a.state.powerGrid.enabled.includes('1,0'));a.startWave();assert.ok(elements.get('powerFields').children.every(b=>b.disabled));assert.equal(elements.get('powerTowerBtn').disabled,true);
 a.state.waveRunning=false;a.state.enemies=[];a.state.pendingSpawns=0;a.state.spawnQueue=[];a.state.wave=12;a.endWave();let p=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(p.diamonds,10);assert.equal(p.records.highestWave,0);assert.ok(elements.get('endlessBtn').classList.contains('hidden'));
 elements.get('retryLoadoutBtn').listeners.click();a.state.wave=12;a.endWave();p=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(p.diamonds,10);
});
test('rotation keeps previously assigned missions and adds Stromnetz only at the new cutover',()=>{
 const c=core();for(const [date,id]of [['2026-11-01','detour'],['2026-11-08','villages'],['2026-11-14','detour'],['2026-11-15','powerGrid'],['2026-11-16','villages'],['2026-11-17','detour'],['2026-11-18','greed'],['2026-11-19','caravan'],['2026-11-20','garrison']])assert.equal(c.waves.daily(date).id,id);
});

test('large power manager toggles a tower independently of its field, explains disconnection and locks in combat',()=>{
 const h=load({labMission:'powerGrid'}),{a,elements}=h;h.selectSlot(1,0,0);h.buyTower('archer');a.renderAll();
 const tower=a.state.map.get('1,0').towers[0];let button=elements.get('powerTowers').children[0];assert.match(button.textContent,/Versorgt.*Ausschalten/);
 button.listeners.click();assert.equal(tower.powerOff,true);assert.match(elements.get('powerTowers').children[0].textContent,/Ausgeschaltet.*Einschalten/);
 elements.get('powerTowers').children[0].listeners.click();assert.equal(tower.powerOff,false);
 elements.get('powerFields').children[0].listeners.click();assert.match(elements.get('powerTowers').children[0].textContent,/Keine Verbindung/);
 a.startWave();assert.ok(elements.get('powerTowers').children[0].disabled);assert.match(elements.get('powerHint').textContent,/Welle läuft/);assert.equal(tower.powerOff,false);
 h.document.getElementById('powerEditor').open=true;elements.get('powerCloseBtn').listeners.click();assert.equal(elements.get('powerEditor').open,false);
});
