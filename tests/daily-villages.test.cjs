const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../headless-core.cjs'),{load}=require('./helpers/game.cjs');
const day='2026-11-08',json=x=>JSON.parse(JSON.stringify(x));
function setup(seed='villages-v1|'+day){const c=core();return {c,...c.session.create({seed,runId:'villages-test',challengeDay:day,loadout:['archer','catapult','chain','freeze','mine'],unlocks:['ultimate:archer','building:market']})};}
const slot=(g,offset=3,index=0)=>({q:g.q+offset,r:g.r,index});
function point(c,g){return c.map.axialToWorld(g.q,g.r);}
function finish(r){let result,steps=0;do{result=r.c.session.advance(r.state,r.random,.05);}while(result==='running'&&++steps<20000);return result;}
test('three fixed villages, valid tower slots, no personal bonuses or road expansion',()=>{
 const {c,state:s}=setup();assert.equal(s.gold,180);assert.equal(s.maxHp,45);assert.equal(s.hp,45);assert.equal(s.phase,'build');assert.equal(s.map.size,32);assert.equal(s.challengeTarget,12);assert.equal(s.ultimateUnlocks.length,0);assert.equal(s.buildingUnlocks.length,0);
 assert.deepEqual(json(s.villages.goals.map(g=>g.hp)),[15,15,15]);assert.equal(c.placement.canPlace(s,9,0,c.data.CARD_LIBRARY.straight,0),false);assert.equal(c.runtime.rescueTunnel(s),false);assert.equal(c.heroes.buy(s,'walls'),false);assert.equal(c.combat.buyConsumable(s,'caltrops'),false);
 for(const tile of s.map.values())assert.equal(c.map.slotPositions(tile).length,tile.slots);
});
test('announced targets match entrances and actual endpoints, with balanced spawn counts',()=>{
 const {c,state:s,random}=setup();const expected=[[0],[1],[2],[0],[1],[2],[0,1],[1,2],[0,2],[0,1,2],[0,1,2],[0,1,2]];
 for(let wave=1;wave<=12;wave++){
  s.wave=wave-1;s.phase='build';s.waveRunning=false;s.enemies=[];s.pendingSpawns=0;s.spawnQueue=[];const sources=c.runtime.spawnSources(s);assert.deepEqual(json(sources.map(x=>x.villageId)),expected[wave-1]);
  assert.deepEqual(json(c.waves.plan(wave,0,true,s).villageTargets),expected[wave-1]);
  for(const source of sources){const points=c.runtime.nextSourcePoints(s,random,source);assert.ok(points.length>2);assert.deepEqual(json(points.at(-1)),json(point(c,s.villages.goals[source.villageId])));}
  assert.ok(c.flow.start(s,random));const counts=sources.map(x=>s.spawnQueue.filter(j=>j.source.q===x.tile.q&&j.source.r===x.tile.r).length);assert.ok(Math.max(...counts)-Math.min(...counts)<=1);
  c.runtime.advance(s,random,.01);assert.ok(s.enemies.every(e=>expected[wave-1].includes(e.villageId)));
 }
 assert.equal(s.enemies.find(e=>e.type==='boss').landmarkId,'wave:12');
});
test('leaks damage only the assigned village; one lost village ends the run despite healthy neighbors',()=>{
 const {c,state:s,random}=setup();s.phase='wave';s.waveRunning=true;s.wave=1;s.spawnQueue=[];s.pendingSpawns=0;
 const leak=(id,damage)=>{const p=point(c,s.villages.goals[id]);s.enemies=[{id:s.nextEnemyId++,villageId:id,type:'normal',alive:true,hp:10,maxHp:10,points:[p],index:0,t:0,x:p.x,y:p.y,baseDamage:damage}];return c.runtime.advance(s,random,.01);};
 leak(2,4);assert.deepEqual(json(s.villages.goals.map(g=>g.hp)),[15,15,11]);assert.equal(s.hp,41);
 leak(0,2);assert.deepEqual(json(s.villages.goals.map(g=>g.hp)),[13,15,11]);assert.equal(leak(1,15),'defeat');assert.equal(s.hp,0);assert.equal(c.flow.finish(s),null);
});
test('summoned and split enemies inherit their village target across checkpoints',()=>{
 const r=setup(),{c,state:s}=r;s.wave=1;s.phase='wave';s.waveRunning=true;const p=point(c,s.villages.goals[2]),points=[{x:p.x+100,y:p.y},p];
 s.enemies=[{id:1,villageId:2,type:'boss',alive:true,hp:100,maxHp:100,speed:1,points,index:0,t:0,x:p.x+100,y:p.y,summonInterval:100,summonLimit:1,nextSummonAt:0}];c.runtime.advance(s,r.random,.01);assert.equal(s.enemies.find(e=>e.summoned).villageId,2);
 const restored=c.snapshot.restore(json(c.snapshot.capture(s,r.random)));assert.equal(restored.state.enemies.find(e=>e.summoned).villageId,2);
 // Force a real damage tick against a splitting enemy beside a purchased tower.
 s.waveRunning=false;s.phase='build';const loc=slot(s.villages.goals[1]);assert.ok(c.towers.buy(s,'archer',[loc]).ok);const pos=c.map.slotPositions(s.map.get(c.map.key(loc.q,loc.r)))[0];
 s.enemies=[{id:8,villageId:1,type:'armored',alive:true,hp:.01,maxHp:20,speed:1,points:[pos,{x:pos.x+100,y:pos.y}],index:0,t:0,x:pos.x,y:pos.y,splitOnDeath:true,killGold:3}];s.waveRunning=true;s.phase='wave';
 for(let i=0;i<100&&!s.enemies.some(e=>e.type==='shard');i++)c.runtime.advance(s,r.random,.05);
 assert.equal(s.enemies.filter(e=>e.type==='shard').length,2);assert.ok(s.enemies.filter(e=>e.type==='shard').every(e=>e.villageId===1));
});
test('two free relocations preserve identity, upgrades, focus, cooldowns, paid gold and statistics',()=>{
 const {c,state:s}=setup(),[a,b,d]=s.villages.goals,from=slot(a),to=slot(b),third=slot(d);assert.ok(c.towers.buy(s,'archer',[from]).ok);assert.ok(c.towers.upgrade(s,from,'marksman'));
 const tw=s.map.get(c.map.key(from.q,from.r)).towers[0];tw.targetPriority='strongest';tw.lastShot=1200;const before=json(tw),gold=s.gold;
 assert.ok(c.villages.move(s,from,to));assert.equal(s.gold,gold);assert.equal(s.map.get(c.map.key(from.q,from.r)).towers[0],null);assert.deepEqual(json(s.map.get(c.map.key(to.q,to.r)).towers[0]),before);assert.equal(s.runTowerDetails[tw.statId].r,to.r);
 assert.equal(c.villages.move(s,to,to),false);assert.equal(c.villages.move(s,to,{...third,index:-1}),false);assert.equal(s.villages.moves,1);
 assert.ok(c.villages.move(s,to,third));assert.equal(c.villages.move(s,third,from),false);c.villages.prepare(s);assert.equal(s.villages.moves,0);
 s.wave=1;c.villages.prepare(s);assert.equal(s.villages.moves,2);s.waveRunning=true;assert.equal(c.villages.move(s,third,from),false);s.waveRunning=false;s.celebrationActive=true;assert.equal(c.villages.move(s,third,from),false);
});
test('health, relocation budget and simultaneous attacks survive restoration deterministically',()=>{
 const {c,state:s,random}=setup();s.wave=9;c.villages.prepare(s);const from=slot(s.villages.goals[0]),to=slot(s.villages.goals[2]);c.towers.buy(s,'archer',[from]);c.villages.move(s,from,to);c.villages.damage(s,1,3);
 const plan=c.snapshot.restore(json(c.snapshot.capture(s,random)));assert.deepEqual(json(plan.state.villages),json(s.villages));assert.ok(c.flow.start(s,random));c.runtime.advance(s,random,1);
 const restored=c.snapshot.restore(json(c.snapshot.capture(s,random)));for(let i=0;i<120;i++){c.runtime.advance(s,random,.05);c.runtime.advance(restored.state,restored.random,.05);}
 assert.deepEqual(json(restored.state.enemies),json(s.enemies));assert.deepEqual(json(restored.state.villages),json(s.villages));assert.deepEqual(json(restored.state.spawnQueue),json(s.spawnQueue));
});
test('a paid mixed defense survives all twelve real waves including the final boss without resource cheats',()=>{
 const r=setup(),{c,state:s}=r;
 const build=[['archer',8,-2,0],['freeze',8,-2,1],['archer',7,-1,0],['archer',7,-1,1],['catapult',8,0,0],['archer',6,0,0],['ballista',6,-3,0],...s.villages.goals.flatMap(g=>[['catapult',g.q+3,g.r,0],['freeze',g.q+3,g.r,1],['ballista',g.q+2,g.r,0],['archer',g.q+2,g.r,1]])];
 for(let wave=1;wave<=12;wave++){
  for(const [type,q,z,index]of build){const t=s.map.get(q+','+z);if(t&&index<t.slots&&!t.towers[index])c.towers.buy(s,type,[{q,r:z,index}]);}
  for(const [,q,z,index]of build){const tw=s.map.get(q+','+z)?.towers[index];if(tw)for(const [id]of c.data.runUpgrades(s,tw).slice(0,1))c.towers.upgrade(s,{q,r:z,index},id);}
  assert.ok(c.flow.start(s,r.random));assert.equal(finish(r),'complete','wave '+wave);assert.ok(!s.celebrationActive);assert.ok(!s.pendingCelebration);c.session.acknowledge(s);assert.equal(s.bossRewards.length,0);assert.ok(s.gold>=0);
 }
 assert.equal(s.phase,'victory');assert.ok(s.villages.goals.every(v=>v.hp>0));assert.equal(s.earnedMeta.periodicBosses,1);assert.equal(c.session.endless(s,r.random),false);assert.equal(c.session.finish(s,r.random),null);
});
test('no defense loses the mission rather than advancing forever',()=>{
 const r=setup();for(let i=0;i<12;i++){assert.ok(r.c.flow.start(r.state,r.random));if(finish(r)==='defeat')break;r.c.session.acknowledge(r.state);}assert.equal(r.state.phase,'gameover');assert.ok(r.state.villages.goals.some(v=>v.hp===0));assert.equal(r.state.challengeWon,undefined);
});
test('controller relocation, cancellation, isolated preview and once-per-day reward',()=>{
 const regular=load(),before=regular.a.state;regular.elements.get('devVillagesStart').listeners.click();assert.equal(regular.a.state,before);
 const preview=load({firstPlayerTest:true});preview.elements.get('devVillagesStart').listeners.click();assert.equal(preview.a.state.challengeKind,'villages');
 const h=load(),{a,elements,storage}=h;a.newRun(undefined,undefined,undefined,day);const [north,middle]=a.state.villages.goals,from=slot(north),to=slot(middle);h.selectSlot(from.q,from.r,0);h.buyTower('archer');a.rendererCommands.selectTower(from.q,from.r,0);elements.get('villageMoveBtn').listeners.click();assert.ok(a.state.villageMove);h.selectSlot(to.q,to.r,0);assert.equal(a.state.villages.moves,1);assert.ok(a.state.map.get(to.q+','+to.r).towers[0]);
 elements.get('villageMoveBtn').listeners.click();h.documentListeners.keydown({key:'Escape',preventDefault(){},target:{tagName:'BODY'}});assert.equal(a.state.villageMove,null);
 a.restoreRunCheckpoint(json(a.captureRunCheckpoint()));assert.equal(a.state.villages.moves,1);assert.equal(a.state.discard.length,0);
 a.state.wave=12;a.endWave();let p=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(p.diamonds,10);assert.equal(p.records.highestWave,0);assert.ok(elements.get('endlessBtn').classList.contains('hidden'));
 elements.get('retryLoadoutBtn').listeners.click();a.state.wave=12;a.endWave();p=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(p.diamonds,10);
});
test('only future rotation changes, older daily assignments stay intact',()=>{
 const c=core();for(const [date,id]of [['2026-10-25','greed'],['2026-11-01','detour'],['2026-11-07','caravan'],['2026-11-08','villages'],['2026-11-09','detour'],['2026-11-10','greed'],['2026-11-11','caravan'],['2026-11-12','garrison']])assert.equal(c.waves.daily(date).id,id);
});

test('village roads connect reciprocally, bend and share a real approach',()=>{
 const {c,state:s,random}=setup();let bends=0,junctions=0;
 for(const t of s.map.values()){
  if(t.roads.length===2&&c.map.OPP(t.roads[0])!==t.roads[1])bends++;
  if(t.roads.length>2)junctions++;
  for(const d of t.roads){const n=c.map.neighbor(t.q,t.r,d),other=s.map.get(c.map.key(n.q,n.r));if(other)assert.ok(other.roads.includes(c.map.OPP(d)));else assert.ok(s.villages.entrances.some(e=>e.q===t.q&&e.r===t.r&&e.dir===d));}
 }
 assert.ok(bends>=6);assert.ok(junctions>=3);
 s.wave=9;const paths=c.villages.sources(s).map(src=>c.runtime.nextSourcePoints(s,random,src));
 assert.ok(paths[0].some(p=>paths[1].some(q=>p.x===q.x&&p.y===q.y)&&paths[2].some(q=>p.x===q.x&&p.y===q.y)));
});

test('map markers identify next and current attacks and disappear at victory',()=>{
 const {c,state:s}=setup();let markers=c.villages.markers(s);
 assert.equal(markers.length,2);assert.match(markers[0].text,/Nächster Angriff.*Norddorf/);
 s.wave=1;s.waveRunning=true;assert.match(c.villages.markers(s)[0].text,/^⚔ Angriff.*Norddorf/);
 s.waveRunning=false;assert.match(c.villages.markers(s)[0].text,/Mitteldorf/);
 s.wave=9;assert.equal(c.villages.markers(s).length,6);
 s.phase='victory';assert.deepEqual(json(c.villages.markers(s)),[]);
});

test('daily milestones and settings coaching stay hidden while normal milestones still work',()=>{
 const {c,state:s}=setup();s.pendingCelebration={wave:10,messages:['Wave 10 geschafft!']};s.celebrationActive=true;
 c.session.promoteCelebration(s);assert.equal(s.pendingCelebration,null);assert.equal(s.celebrationActive,false);
 const normal=c.session.create({seed:'milestone',runId:'milestone',loadout:['archer','catapult','chain','freeze','mine']}).state;normal.phase='build';normal.pendingCelebration={wave:10,messages:['Wave 10 geschafft!']};c.session.promoteCelebration(normal);assert.equal(normal.celebrationActive,true);
 const {a,elements}=load();a.newRun(undefined,undefined,undefined,day);a.state.hotkeyTipActive=true;a.renderAll();
 assert.ok(elements.get('hotkeyTip').classList.contains('hidden'));assert.ok(!elements.get('settingsOpenBtn').classList.contains('hotkeyGuide'));
});

test('unbalanced spending on separate village defenses is not an automatic win',()=>{
 const r=setup(),{c,state:s}=r,build=s.villages.goals.flatMap(g=>[['catapult',g.q+3,g.r,0],['freeze',g.q+3,g.r,1],['ballista',g.q+2,g.r,0],['archer',g.q+2,g.r,1]]);
 for(let wave=1;wave<=12;wave++){
  for(const [type,q,z,index]of build){const t=s.map.get(q+','+z);if(t&&index<t.slots&&!t.towers[index])c.towers.buy(s,type,[{q,r:z,index}]);}
  for(const [,q,z,index]of build){const tw=s.map.get(q+','+z)?.towers[index];if(tw)for(const [id]of c.data.runUpgrades(s,tw).slice(0,1))c.towers.upgrade(s,{q,r:z,index},id);}
  assert.ok(c.flow.start(s,r.random));if(finish(r)==='defeat')break;c.session.acknowledge(s);
 }
 assert.equal(s.phase,'gameover');assert.ok(s.wave<12);
});


