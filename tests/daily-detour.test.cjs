const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../headless-core.cjs'),{load}=require('./helpers/game.cjs');
const day='2026-11-01',json=x=>JSON.parse(JSON.stringify(x));
function setup(){const c=core();return {c,...c.session.create({seed:'detour-test',runId:'detour-test',challengeDay:day,loadout:['archer','catapult','chain','freeze','mine']})};}
function place(r,q,z,id='straight',rotation=0){return r.c.session.place(r.state,r.random,{q,r:z,index:r.state.hand.indexOf(id),rotation});}
const route=[[[1,0],[2,0],[3,0],[4,0,'smallCurve',3],[3,1,'smallCurve',0],[4,1,'smallCurve',3]],[[3,2,'straight',1],[2,3,'smallCurve',0]],[[3,3],[4,3,'smallCurve',2]],[[4,2,'smallCurve',5],[5,2]],[[6,2],[7,2,'smallCurve',2]]];
test('every legal detour placement connects roads and never points into a roadless island',()=>{
 const r=setup(),{c,state:s}=r;place(r,1,0);place(r,2,0);let legal=0;
 for(let q=-2;q<9;q++)for(let z=-3;z<5;z++)for(const id of s.hand)for(let rotation=0;rotation<6;rotation++){
  const card=c.data.CARD_LIBRARY[id];if(!c.detour.canPlace(s,q,z,card,rotation))continue;legal++;const roads=c.map.rotatedRoads(card,rotation);let connected=false;
  for(let d=0;d<6;d++){const n=c.map.neighbor(q,z,d),tile=s.map.get(c.map.key(n.q,n.r));if(!tile)continue;const back=tile.roads.includes(c.map.OPP(d));assert.equal(roads.includes(d),back);connected||=back;}
  assert.ok(connected);
 }
 assert.ok(legal>0);assert.equal(c.detour.canPlace(s,7,-1,c.data.CARD_LIBRARY.straight,0),false);
});
test('a straight road past the towers loses while the winding reference route remains winnable',()=>{
 const r=setup(),{c,state:s}=r;
 for(let wave=0;wave<5;wave++){
  for(const q of wave===0?[1,2,3]:[wave+3])assert.ok(place(r,q,0));
  assert.ok(c.detour.finishPlanning(s));assert.ok(c.flow.start(s,r.random));let result,steps=0;
  do{result=c.session.advance(s,r.random,.05);}while(result==='running'&&++steps<20000);
  if(result==='defeat')break;assert.equal(result,'complete');c.session.acknowledge(s);
 }
 assert.equal(s.phase,'gameover');assert.equal(s.hp,0);
});
test('a unique curve orientation gives feedback and retains its legal orientation',()=>{
 const h=load();h.a.newRun(undefined,undefined,undefined,day);const s=h.a.state;
 // At the first road slot the base is west and a roadless island is north.
 s.selectedCard=s.hand.indexOf('smallCurve');s.hoveredPlacement='1,0';
 const legal=Array.from({length:6},(_,rot)=>rot).filter(rot=>h.a.canPlace(1,0,h.a.CARD_LIBRARY.smallCurve,rot));assert.equal(legal.length,1);s.rotation=legal[0];
 h.elements.get('rotateHexBtn').listeners.click();assert.equal(s.rotation,legal[0]);assert.match(h.elements.get('messageText').textContent,/Nur diese Ausrichtung/);
});
test('detour has fixed towers, finite stock and guards all tower changes',()=>{
 const r=setup(),{c,state:s}=r;assert.equal(s.challengeKind,'detour');assert.equal(s.challengeTarget,15);assert.equal(s.gold,0);assert.equal(s.detour.remaining,6);
 const towers=[...s.map.values()].flatMap(t=>t.towers);assert.equal(towers.length,10);assert.ok(towers.every(t=>t.level===3&&t.finalUpgrade));assert.deepEqual(json(s.towerLoadout),towers.map(t=>t.type));
 assert.ok(!c.flow.start(s,r.random));assert.equal(place(r,1,0,'straight',NaN),null);assert.ok(place(r,1,0));assert.equal(c.detour.ready(s),false);assert.ok(place(r,2,0));assert.ok(c.detour.ready(s));
 assert.equal(s.map.get('1,0').slots,0);s.gold=99999;assert.equal(c.towers.buy(s,'archer',[{q:1,r:0,index:0}]).ok,false);assert.equal(c.towers.upgrade(s,{q:1,r:-1,index:0},'ultimate:archer'),false);assert.equal(c.data.towerRefund(s,towers[0]),null);assert.deepEqual(json(c.data.runUpgrades(s,towers[0])),[]);
 assert.equal(c.runtime.rescueTunnel(s),false);
});
test('undo refunds stock and budget exactly; old road remodelling is limited to two',()=>{
 const r=setup(),{c,state:s}=r;for(const p of route[0])assert.ok(place(r,...p));assert.equal(s.phase,'build');assert.equal(s.detour.remaining,0);
 assert.ok(c.detour.undo(s));assert.equal(s.detour.remaining,1);assert.ok(place(r,...route[0][5]));
 s.wave=1;c.detour.prepare(s);const stock=json(s.detour.stock);c.detour.prepare(s);assert.deepEqual(json(s.detour.stock),stock);assert.equal(s.detour.remaining,2);
 assert.ok(c.detour.undo(s));assert.ok(c.detour.undo(s));assert.equal(c.detour.undo(s),false);assert.equal(s.detour.remaining,4);assert.equal(s.detour.oldUndos,2);
 assert.ok(place(r,...route[0][4]));assert.ok(c.detour.undo(s));assert.equal(s.detour.oldUndos,2);assert.equal(s.map.get('1,-1').towers.length,1);
 const restored=c.snapshot.restore(json(c.snapshot.capture(s,r.random)));assert.deepEqual(json(restored.state.detour),json(s.detour));assert.equal(c.detour.undo(restored.state),false);
});
test('planning and active combat survive snapshots without stock changes or divergent combat',()=>{
 const r=setup(),{c,state:s}=r;for(const p of route[0])assert.ok(place(r,...p));const saved=c.snapshot.restore(json(c.snapshot.capture(s,r.random)));assert.deepEqual(json(saved.state.detour),json(s.detour));assert.equal(saved.state.map.size,s.map.size);
 assert.ok(c.flow.start(s,r.random));assert.equal(c.detour.undo(s),false);c.runtime.advance(s,r.random,.2);const resumed=c.snapshot.restore(json(c.snapshot.capture(s,r.random)));
 for(let i=0;i<100;i++){c.runtime.advance(s,r.random,.05);c.runtime.advance(resumed.state,resumed.random,.05);}assert.deepEqual(json(resumed.state.enemies),json(s.enemies));assert.equal(resumed.state.hp,s.hp);assert.deepEqual(json(resumed.state.detour),json(s.detour));
});
test('a planned opening survives five real attacks without ending the fifteen-wave mission',()=>{
 const r=setup(),{c,state:s}=r;
 for(let wave=0;wave<5;wave++){
  for(const p of route[wave])assert.ok(place(r,...p));assert.ok(c.detour.finishPlanning(s));assert.ok(c.flow.start(s,r.random));let result,steps=0;
  do{result=c.runtime.advance(s,r.random,.05);}while(result==='running'&&++steps<10000);
  assert.equal(result,'complete');const finish=c.session.finish(s,r.random);assert.equal(finish.victory,false);c.session.acknowledge(s);assert.equal(s.gold,0);assert.equal(s.bossRewards.length,0);
 }
 assert.ok(s.hp>0);assert.equal(s.phase,'place');assert.equal(c.session.endless(s,r.random),false);
});
test('a short unplanned route does not automatically win',()=>{
 const r=setup(),{c,state:s}=r;place(r,1,0);place(r,2,0);let lost=false;
 for(let wave=0;wave<5;wave++){assert.ok(c.detour.finishPlanning(s));assert.ok(c.flow.start(s,r.random));let result,steps=0;do{result=c.session.advance(s,r.random,.05);}while(result==='running'&&++steps<10000);if(result==='defeat'){lost=true;break;}assert.equal(result,'complete');c.session.acknowledge(s);}
 assert.ok(lost,'a minimal route must lose, not merely lose a few hit points');
});
test('local preview is isolated; controller supports planning and one-time daily settlement',()=>{
 const regular=load(),before=regular.a.state;regular.elements.get('devDetourStart').listeners.click();assert.equal(regular.a.state,before);
 const h=load({firstPlayerTest:true});h.elements.get('devDetourStart').listeners.click();assert.equal(h.a.state.challengeKind,'detour');assert.equal(h.a.state.detour.remaining,6);
 const {a,elements,storage}=load();a.newRun(undefined,undefined,undefined,day);a.state.wave=15;a.endWave();let p=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(p.diamonds,10);assert.equal(p.records.highestWave,0);
 elements.get('retryLoadoutBtn').listeners.click();a.state.wave=15;a.endWave();p=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(p.diamonds,10);
});
test('rotation preserves earlier challenges and introduces four distinct future days',()=>{
 const c=core();for(const [day,id]of [['2026-10-25','greed'],['2026-10-31','greed'],['2026-11-01','detour'],['2026-11-02','greed'],['2026-11-03','caravan'],['2026-11-04','garrison']])assert.equal(c.waves.daily(day).id,id);
});
test('normal start button ends planning and checkpoint retains inventory without undo buttons',()=>{
 const {a,elements}=load();a.newRun(undefined,undefined,undefined,day);for(const q of [1,2]){a.state.selectedCard=a.state.hand.indexOf('straight');a.placeTile(q,0);}assert.equal(elements.get('startWaveBtn').disabled,false);
 const stock=json(a.state.detour.stock),checkpoint=json(a.captureRunCheckpoint());a.restoreRunCheckpoint(checkpoint);assert.deepEqual(json(a.state.detour.stock),stock);a.startWave();assert.equal(a.state.wave,1);assert.equal(a.state.phase,'wave');
});
test('new road kinds arrive once at milestones and survive save restore',()=>{const {c,state:s,random}=setup();for(const [wave,id]of [[3,'longRoad'],[6,'tee'],[9,'sideCross']]){s.wave=wave;c.detour.prepare(s);assert.ok(s.hand.includes(id));const stock=json(s.detour.stock);c.detour.prepare(s);assert.deepEqual(json(s.detour.stock),stock);const restored=c.snapshot.restore(json(c.snapshot.capture(s,random)));assert.deepEqual(json(restored.state.hand),json(s.hand));}s.wave=15;s.enemies=[];s.pendingSpawns=0;assert.equal(c.flow.finish(s).victory,true);});
