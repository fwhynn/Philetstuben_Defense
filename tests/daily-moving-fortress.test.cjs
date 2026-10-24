const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../headless-core.cjs'),{load}=require('./helpers/game.cjs');
const day='2026-12-07',json=x=>JSON.parse(JSON.stringify(x));
function setup(){const c=core();return {c,...c.session.create({seed:'movingFortress-v1|'+day,runId:'fortress-test',challengeDay:day,loadout:['archer','catapult','chain','freeze','mine']})};}
const slot=(g,n=3,index=0)=>({q:g.q+n,r:g.r,index});
function finish(r){let result,steps=0;do{result=r.c.session.advance(r.state,r.random,.05);}while(result==='running'&&++steps<20000);return result;}
test('four stations have valid slots and each stage routes actual enemies to the relocated base',()=>{
 const r=setup(),{c,state:s}=r;assert.equal(s.map.size,36);assert.equal(s.hp,20);assert.equal(s.gold,150);
 for(const tile of s.map.values())assert.equal(c.map.slotPositions(tile).length,tile.slots);
 for(let stage=0;stage<4;stage++){
  s.wave=stage*3;s.waveRunning=false;s.phase='build';s.enemies=[];s.spawnQueue=[];s.pendingSpawns=0;c.movingFortress.prepare(s);const g=s.movingFortress.stations[stage];
  assert.equal(s.movingFortress.stage,stage);assert.equal([...s.map.values()].filter(t=>t.type==='base').length,1);assert.equal(s.map.get(g.q+','+g.r).type,'base');
  const sources=c.runtime.spawnSources(s);assert.equal(sources.length,1);assert.equal(sources[0].target,g.q+','+g.r);const path=c.runtime.nextSourcePoints(s,r.random,sources[0]);assert.deepEqual(json(path.at(-1)),json(sources[0].routes.geometry.get(sources[0].target).hub));
  assert.ok(c.flow.start(s,r.random));c.runtime.advance(s,r.random,.05);assert.ok(s.enemies.length);assert.deepEqual(json(s.enemies[0].points.at(-1)),json(path.at(-1)));
 }
});
test('stage transitions preserve life, towers, stats and upgrades; free moves are atomic and restricted',()=>{
 const r=setup(),{c,state:s}=r,g=s.movingFortress.stations,from=slot(g[0]),to=slot(g[1]);assert.ok(c.towers.buy(s,'archer',[from]).ok);const tw=s.map.get(from.q+','+from.r).towers[0];assert.ok(c.towers.upgrade(s,from,'volley'));tw.lastShot=123;tw.targetPriority=['boss'];s.hp=13;
 assert.equal(c.movingFortress.move(s,from,to),false);s.wave=3;c.movingFortress.prepare(s);const gold=s.gold,paid=tw.paid;assert.equal(s.hp,13);assert.equal(c.movingFortress.move(s,from,{...to,index:99}),false);assert.ok(c.movingFortress.move(s,from,to));assert.equal(s.gold,gold);assert.equal(tw.paid,paid);assert.equal(tw.branch,'volley');assert.equal(tw.lastShot,123);assert.deepEqual(json(tw.targetPriority),['boss']);assert.equal(s.runTowerDetails[tw.statId].r,to.r);
 assert.equal(c.movingFortress.move(s,from,to),false);assert.equal(c.movingFortress.move(s,to,slot(g[2])),false);assert.ok(c.movingFortress.move(s,to,slot(g[1],4)));c.movingFortress.prepare(s);assert.equal(s.movingFortress.relocation,true);
 assert.ok(c.flow.start(s,r.random));for(const paused of [false,true]){s.paused=paused;assert.equal(c.movingFortress.move(s,slot(g[1],4),to),false);assert.equal(c.towers.buy(s,'archer',[to]).ok,false);assert.equal(c.data.towerRefund(s,tw),null);}s.waveRunning=false;s.phase='build';s.wave=4;c.movingFortress.prepare(s);assert.equal(s.movingFortress.relocation,false);
});
test('a paid mixed defense can relocate through all four stages and win twelve waves',()=>{
 const r=setup(),{c,state:s}=r;let oldStage=0;const build=[['catapult',3,0],['freeze',4,0],['ballista',5,0],['archer',3,1],['mine',4,1],['catapult',5,1]];
 for(let w=1;w<=12;w++){
  const f=s.movingFortress,g=f.stations[f.stage];if(f.stage!==oldStage){for(const [,n,i]of build){const from=slot(f.stations[oldStage],n,i);if(s.map.get(from.q+','+from.r).towers[i])assert.ok(c.movingFortress.move(s,from,slot(g,n,i)));}oldStage=f.stage;}
  for(const [type,n,i]of build){const p=slot(g,n,i);if(!s.map.get(p.q+','+p.r).towers[i])c.towers.buy(s,type,[p]);}
  for(const [,n,i]of build){const p=slot(g,n,i),tw=s.map.get(p.q+','+p.r).towers[i];if(tw){const up=c.data.runUpgrades(s,tw)[0];if(up)c.towers.upgrade(s,p,up[0]);}}
  assert.ok(c.flow.start(s,r.random));assert.equal(finish(r),'complete','wave '+w);c.session.acknowledge(s);
 }
 assert.equal(s.phase,'victory');assert.equal(s.movingFortress.stage,3);assert.equal(s.challengeWon,true);assert.equal(c.session.endless(s,r.random),false);
});
test('saved relocation and combat resume with the same destination and enemies',()=>{
 const r=setup(),{c,state:s}=r;s.wave=6;c.movingFortress.prepare(s);const g=s.movingFortress.stations[2];c.towers.buy(s,'catapult',[slot(g)]);const saved=c.snapshot.restore(json(c.snapshot.capture(s,r.random)));c.movingFortress.prepare(saved.state);assert.equal(saved.state.movingFortress.relocation,true);assert.deepEqual(json(saved.state.movingFortress),json(s.movingFortress));
 c.flow.start(s,r.random);c.flow.start(saved.state,saved.random);for(let i=0;i<150;i++){c.runtime.advance(s,r.random,.05);c.runtime.advance(saved.state,saved.random,.05);}assert.deepEqual(json(saved.state.enemies),json(s.enemies));assert.equal(saved.state.hp,s.hp);
});
test('no defense loses, and fixed-map restrictions cannot be bypassed',()=>{
 const r=setup(),{c,state:s}=r;assert.equal(c.runtime.rescueTunnel(s),false);assert.equal(c.heroes.buy(s,'walls'),false);assert.equal(c.combat.buyConsumable(s,'caltrops'),false);assert.equal(c.placement.canPlace(s,9,0,c.data.CARD_LIBRARY.straight,0),false);
 for(let w=0;w<12;w++){c.flow.start(s,r.random);if(finish(r)==='defeat')break;c.session.acknowledge(s);}assert.equal(s.phase,'gameover');assert.ok(s.hp<=0);assert.equal(s.challengeWon,undefined);
});

test('controller previews locally, relocates and cancels, preserves checkpoint and awards once',()=>{
 const regular=load(),before=regular.a.state;regular.elements.get('devFortressStart').listeners.click();assert.equal(regular.a.state,before);
 const preview=load({firstPlayerTest:true});preview.elements.get('devFortressStart').listeners.click();assert.equal(preview.a.state.challengeKind,'movingFortress');
 const h=load(),{a,elements,storage}=h;a.newRun(undefined,undefined,undefined,day);const from=slot(a.state.movingFortress.stations[0]),to=slot(a.state.movingFortress.stations[1]);h.selectSlot(from.q,from.r,0);h.buyTower('archer');a.state.wave=3;a.endWave();assert.equal(a.state.movingFortress.stage,1);a.rendererCommands.selectTower(from.q,from.r,0);elements.get('villageMoveBtn').listeners.click();assert.ok(a.state.villageMove);h.selectSlot(to.q,to.r,0);assert.ok(a.state.map.get(to.q+','+to.r).towers[0]);
 elements.get('villageMoveBtn').listeners.click();h.documentListeners.keydown({key:'Escape',preventDefault(){},target:{tagName:'BODY'}});assert.equal(a.state.villageMove,null);a.restoreRunCheckpoint(json(a.captureRunCheckpoint()));assert.equal(a.state.movingFortress.stage,1);assert.ok(a.state.movingFortress.relocation);
 a.state.wave=12;a.endWave();let p=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(p.diamonds,10);assert.equal(p.records.highestWave,0);assert.ok(elements.get('endlessBtn').classList.contains('hidden'));assert.match(elements.get('campaignVictoryTitle').textContent,/Festung/);
 elements.get('retryLoadoutBtn').listeners.click();a.state.wave=12;a.endWave();p=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(p.diamonds,10);
});
test('calendar retains the full previous draft cycle before adding the fortress',()=>{
 const c=core();for(const [d,id]of [['2026-11-29','towerDraft'],['2026-12-06','garrison'],[day,'movingFortress'],['2026-12-08','towerDraft']])assert.equal(c.waves.daily(d).id,id);
});
