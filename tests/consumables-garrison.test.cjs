const {test}=require('node:test'),assert=require('node:assert/strict'),load=require('../headless-core.cjs');
const loadout=['archer','ballista','catapult','freeze','mine'];
function setup(day=null){const c=load(),run=c.session.create({seed:'test',runId:'consumables-test',loadout,challengeDay:day});const s=run.state;s.phase='build';s.openingRemaining=0;s.gold=1200;if(!s.map.has('1,0'))s.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:2,towers:[],income:0});return {c,s,run};}
function enemy(c,id,hp){const p=c.map.axialToWorld(1,0);return {id,type:'normal',hp,maxHp:hp,armorHp:0,magicHp:0,alive:true,x:p.x,y:p.y,points:[p,{x:0,y:0}],index:0,t:0,speed:1};}

test('consumable hover validation is read-only and agrees with purchases and overload locks',()=>{
 const {c,s}=setup(),point=c.map.axialToWorld(1,0),slot={q:1,r:0,index:0,...point};
 for(const kind of ['spikes','resin']){
  const before=JSON.stringify(s);assert.equal(c.combat.buyConsumable(s,kind,slot,true),true);assert.equal(JSON.stringify(s),before);
  assert.equal(c.combat.buyConsumable(s,kind,{...slot,y:10000},true),false);
  const gold=s.gold;s.gold=0;assert.equal(c.combat.buyConsumable(s,kind,slot,true),false);s.gold=gold;
 }
 c.towers.buy(s,'archer',[slot]);const before=JSON.stringify(s);
 assert.equal(c.combat.buyConsumable(s,'overload',slot,true),true);assert.equal(JSON.stringify(s),before);
 assert.equal(c.combat.buyConsumable(s,'overload',slot),true);assert.equal(c.combat.buyConsumable(s,'overload',slot,true),false);
});

test('cursor preview changes validity without spending and persists after placement and disappears on cancellation',()=>{
 const {a,elements,document,documentListeners}=require('./helpers/game.cjs').load();
 a.state.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:2,towers:[]});
 elements.get('mainMenu').classList.add('hidden');
 const point={x:0,y:0,matrixTransform(){return this;}},board=elements.get('board');board.parentElement={getBoundingClientRect:()=>({left:0,top:0,width:800,height:600})};board.getScreenCTM=()=>({inverse:()=>({})});board.createSVGPoint=()=>({...point});
 document.querySelector=selector=>selector==='.boardWrap'?{getBoundingClientRect:()=>({left:0,top:0,width:800,height:600})}:null;
 const target={closest:s=>s==='.boardWrap'?{}:null},p=a.axialToPixel(1,0),ghost=elements.get('consumableGhost');
 elements.get('buySpikes').listeners.click();const gold=a.state.gold;
 assert.match(elements.get('consumableTargets').innerHTML,/<polyline/);
 documentListeners.pointermove({clientX:p.x,clientY:p.y+100,target});assert.equal(ghost.classList.contains('valid'),false);
 documentListeners.pointermove({clientX:p.x,clientY:p.y,target});assert.equal(ghost.classList.contains('valid'),true);assert.equal(a.state.gold,gold);
 a.rendererCommands.consumePoint(p);assert.equal(ghost.classList.contains('hidden'),false);a.state.gold=100;a.rendererCommands.consumePoint(p);assert.equal(a.state.consumables.length,2);
 elements.get('buyResin').listeners.click();elements.get('cancelConsumable').listeners.click();assert.equal(ghost.classList.contains('hidden'),true);assert.equal(elements.get('consumableTargets').classList.contains('hidden'),true);
 a.state.gold=1000;a.state.map.get('1,0').towers=[{type:'archer',level:1,lastShot:0}];a.state.map.set('2,0',{q:2,r:0,type:'straight',roads:[0,3],slots:1,towers:[{type:'freeze',level:1,lastShot:0}]});
 elements.get('buyOverload').listeners.click();assert.equal((elements.get('consumableTargets').innerHTML.match(/<circle/g)||[]).length,1);
 a.state.map.get('1,0').towers[0].overloadPending=true;a.renderAll();assert.equal(elements.get('consumableTargets').innerHTML,'');
});

test('lane placements preserve exact positions, reject off-road input and stack damage at that position',()=>{
 const {c,s,run}=setup(),tile=s.map.get('1,0'),center=c.map.axialToWorld(1,0),point={x:center.x+35,y:center.y};
 for(const bad of [{x:NaN,y:0},{x:Infinity,y:0},{x:point.x,y:point.y+80}]){const gold=s.gold;assert.equal(c.combat.buyConsumable(s,'spikes',{q:1,r:0,...bad}),false);assert.equal(s.gold,gold);}
 for(let i=0;i<2;i++)assert.ok(c.combat.buyConsumable(s,'spikes',{q:1,r:0,...point}));
 assert.equal(s.consumables.length,2);assert.ok(Math.abs(s.consumables[0].x-point.x)<.01);
 s.enemies=[enemy(c,1,500)];c.combat.applyConsumables(s,0,()=>{});assert.equal(s.enemies[0].hp,500);
 const restored=c.snapshot.restore(c.snapshot.capture(s,run.random)).state;assert.equal(restored.consumables[0].x,point.x);
 s.enemies[0].x=point.x;c.combat.applyConsumables(s,0,()=>{});assert.equal(s.enemies[0].hp,300);assert.equal(s.consumables.length,0);
 for(let rotation=0;rotation<6;rotation++){const curved={...tile,type:'smallCurve',rotation,roads:c.map.rotatedRoads(c.data.CARD_LIBRARY.smallCurve,rotation)};const leg=[...c.map.roadGeometry(curved).legs.values()][0],p=leg[Math.floor(leg.length/2)],snap=c.combat.lanePoint(curved,p);assert.ok(Math.hypot(snap.x-p.x,snap.y-p.y)<.01);}
});

test('controller places consumables at a clicked lane point and keeps invalid clicks unspent',()=>{
 const {a,elements}=require('./helpers/game.cjs').load();a.state.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:2,towers:[]});
 const p=a.axialToPixel(1,0);elements.get('buySpikes').listeners.click();const gold=a.state.gold;
 assert.equal(a.rendererCommands.consumePoint({x:p.x,y:p.y+100}),true);assert.equal(a.state.gold,gold);
 a.rendererCommands.consumePoint({x:p.x+25,y:p.y});assert.equal(a.state.gold,gold-25);assert.equal(a.state.consumables[0].x,p.x+25);
});
test('right click cancels every consumable selection without spending gold',()=>{
 const {a,elements,documentListeners}=require('./helpers/game.cjs').load();const gold=a.state.gold;
 for(const id of ['buySpikes','buyResin','buyOverload']){
  elements.get(id).listeners.click();assert.ok(a.state.consumablePickUI);assert.match(elements.get('messageText').textContent,/Escape \/ Rechtsklick/);assert.equal(elements.get('message').classList.contains('consumableActive'),true);
  let prevented=false;documentListeners.contextmenu({preventDefault(){prevented=true;}});
  assert.equal(prevented,true);assert.equal(elements.get('message').classList.contains('consumableActive'),false);assert.equal(a.state.consumablePickUI,null);assert.equal(a.state.gold,gold);
  assert.equal(elements.get('consumableGhost').classList.contains('hidden'),true);
 }
 let prevented=false;documentListeners.contextmenu({preventDefault(){prevented=true;}});assert.equal(prevented,false);
});

test('spikes consume only lethal charges and leftovers damage the next enemy',()=>{
 const {c,s}=setup();assert.equal(c.combat.buyConsumable(s,'spikes',{q:1,r:0}),true);const gold=s.gold;s.enemies=[enemy(c,1,50)];c.combat.applyConsumables(s,0,()=>{});
 assert.equal(s.gold,gold);assert.equal(s.goldEarned.kills,0);assert.equal(s.waveKills,1);
 assert.equal(s.enemies[0].alive,false);assert.equal(s.consumables[0].charges,10);
 s.enemies.push(enemy(c,2,200));c.combat.applyConsumables(s,0,()=>{});assert.equal(s.enemies[1].hp,150);assert.equal(s.consumables.length,0);
});
test('resin stacks on the same lane and each patch uses one charge per enemy',()=>{
 const {c,s}=setup();assert.ok(c.combat.buyConsumable(s,'resin',{q:1,r:0}));const gold=s.gold;
 assert.equal(c.combat.buyConsumable(s,'resin',{q:1,r:0}),true);assert.equal(s.gold,gold-30);
 s.enemies=[enemy(c,1,50)];c.combat.applyConsumables(s,100,()=>{});c.combat.applyConsumables(s,200,()=>{});
 assert.equal(s.consumables[0].charges,11);assert.equal(s.enemies[0].slowEffects.length,2);assert.equal(s.enemies[0].slowEffects[0].until,4100);
});
test('overload begins in combat, rejects auras and expires without changing base stats',()=>{
 const {c,s}=setup();assert.ok(c.towers.buy(s,'archer',[{q:1,r:0,index:0}]).ok);assert.ok(c.towers.buy(s,'freeze',[{q:1,r:0,index:1}]).ok);
 const tower=s.map.get('1,0').towers[0],before=c.data.towerDefinition(tower).cooldown;
 assert.equal(c.combat.buyConsumable(s,'overload',{q:1,r:0,index:1}),false);assert.ok(c.combat.buyConsumable(s,'overload',{q:1,r:0,index:0}));assert.equal(tower.overloadPending,true);
 assert.equal(c.combat.buyConsumable(s,'overload',{q:1,r:0,index:0}),false);
 const pos=c.map.slotPositions(s.map.get('1,0'))[0];c.combat.step(s,[{tw:tower,pos,tile:s.map.get('1,0')}],c.data.TOWERS,0,1000);assert.equal(tower.overloadUntil,13000);assert.equal(c.data.towerDefinition(tower).cooldown,before);
 c.combat.clearConsumables(s);assert.equal(tower.overloadUntil,undefined);
});
test('wave completion clears consumables and checkpoint preserves pending purchases',()=>{
 const {c,s,run}=setup();c.combat.buyConsumable(s,'spikes',{q:1,r:0});const restored=c.snapshot.restore(c.snapshot.capture(s,run.random)).state;
 assert.equal(restored.consumables[0].charges,20);Object.assign(restored,{wave:1,phase:'wave',waveRunning:true,enemies:[],pendingSpawns:0});c.flow.finish(restored);assert.equal(restored.consumables.length,0);
});
test('daily rotation alternates at UTC midnight and returns every 48 hours',()=>{
 const {c}=setup();assert.equal(c.waves.daily('2026-09-22').id,'caravan');assert.equal(c.waves.daily('2026-09-23').id,'garrison');assert.equal(c.waves.daily('2026-09-24').id,'caravan');
});
test('garrison has a connected fixed map, no placement and no income for all three waves',()=>{
 const {c,s,run}=setup('2026-09-23');assert.equal(s.challengeKind,'garrison');assert.equal(s.gold,1200);assert.equal(s.phase,'build');assert.equal(s.hand.length,0);assert.equal(s.landmarks.size,0);
 const sources=c.runtime.spawnSources(s);assert.equal(sources.length,1);assert.ok(c.runtime.nextSourcePoints(s,run.random,sources[0]).length>12);
 for(const t of s.map.values())if(t.type!=='base')assert.deepEqual([...c.map.rotatedRoads(c.data.CARD_LIBRARY[t.type],t.rotation)].sort(),[...t.roads].sort());
 for(let w=1;w<=3;w++){const p=c.waves.plan(w,999,true,s);assert.equal(p.maxGold,0);assert.ok(p.enemies.every(e=>e.killGold===0&&!e.caravan));Object.assign(s,{wave:w,phase:'wave',waveRunning:true,enemies:[],pendingSpawns:0});c.session.finish(s,run.random);assert.equal(s.gold,1200);assert.equal(s.phase,w===3?'victory':'build');assert.equal(s.rewardOffer,undefined);}
 assert.equal(s.challengeWon,true);assert.equal(c.data.towerRefund(s,{paid:100}),null);
});
test('garrison kills including consumable kills do not earn gold',()=>{
 const {c,s}=setup('2026-09-23');c.combat.buyConsumable(s,'spikes',{q:1,r:0});const before=s.gold;s.enemies=[enemy(c,1,50)];c.combat.applyConsumables(s,0,()=>{});assert.equal(s.gold,before);assert.equal(s.goldEarned.kills,0);
});
test('garrison UI grants the daily reward once for three waves and retry retains mission',()=>{
 const {a,elements,storage}=require('./helpers/game.cjs').load();a.newRun(undefined,undefined,undefined,'2026-09-23');a.state.wave=3;a.endWave();assert.equal(a.state.phase,'victory');assert.match(elements.get('campaignVictoryTitle').textContent,/Garnison/);assert.equal(JSON.parse(storage.get('hex-bastion-profile-v1')).diamonds,10);
 elements.get('retryLoadoutBtn').listeners.click();assert.equal(a.state.challengeKind,'garrison');assert.equal(a.state.gold,1200);a.state.wave=3;a.endWave();assert.equal(JSON.parse(storage.get('hex-bastion-profile-v1')).diamonds,10);
});
test('overload increases real attack rate only during its duration',()=>{
 const run=boost=>{const {c,s}=setup();const tower={type:'archer',lastShot:0,tileType:'straight'},pos=c.map.axialToWorld(1,0);s.enemies=[enemy(c,1,100000)];if(boost)tower.overloadUntil=12000;for(let time=10;time<=12000;time+=10)c.combat.step(s,[{tw:tower,pos}],c.data.TOWERS,0,time);const damage=100000-s.enemies[0].hp;return {c,s,tower,pos,damage};};
 const normal=run(false),boosted=run(true);assert.ok(boosted.damage>normal.damage*1.4);assert.ok(boosted.damage<normal.damage*1.6);
 boosted.tower.lastShot=12000;const hp=boosted.s.enemies[0].hp;boosted.c.combat.step(boosted.s,[{tw:boosted.tower,pos:boosted.pos}],boosted.c.data.TOWERS,0,12000+boosted.c.data.TOWERS.archer.cooldown*1000*.8);assert.equal(boosted.s.enemies[0].hp,hp);
});
test('Duo validates purchases, charges once and restores remaining consumables',()=>{
 const {createLobbies}=require('../server/duo-lobbies.cjs'),{randomUUID}=require('node:crypto');let rooms=createLobbies({now:()=>0});const a=rooms.create({requestId:randomUUID()}),b=rooms.join({requestId:randomUUID(),code:a.code});
 const command=(seat,action,payload)=>{const v=rooms.view(seat.token);return rooms.receive(seat.token,{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[seat.player].phase,action,payload});};
 command(a,'lobbyReady',{value:true});command(b,'lobbyReady',{value:true});let placement;rooms.view(a.token).boards[0].placements.some((rotations,index)=>rotations.some((cells,rotation)=>{const cell=cells.find(c=>c.legal);if(cell)placement={q:cell.q,r:cell.r,index,rotation};return !!cell;}));assert.ok(command(a,'place',placement).ok);
 const core=load(),tile=rooms.view(a.token).boards[0].map.find(t=>t.q===placement.q&&t.r===placement.r),point=[...core.map.roadGeometry(tile).legs.values()][0][1];
 const slot={q:placement.q,r:placement.r,index:0,x:point.x,y:point.y},before=rooms.view(a.token).boards[0].gold;
 assert.equal(command(a,'consumable',{kind:'spikes',slot:{...slot,x:NaN}}).ok,false);
 assert.equal(command(a,'consumable',{kind:'spikes',slot:{...slot,x:1e6}}).ok,false);
 assert.equal(rooms.view(a.token).boards[0].gold,before);
 assert.equal(command(a,'consumable',{kind:'spikes',slot:{q:0,r:0,index:0}}).ok,false);
 assert.ok(command(a,'consumable',{kind:'spikes',slot}).ok);assert.equal(rooms.view(a.token).boards[0].gold,before-25);assert.equal(command(a,'consumable',{kind:'spikes',slot}).ok,true);
 rooms=createLobbies({now:()=>0,snapshot:JSON.parse(JSON.stringify(rooms.checkpoint()))});rooms.touch(a.token);rooms.touch(b.token);assert.equal(rooms.view(a.token).boards[0].consumables[0].charges,20);assert.equal(rooms.view(b.token).boards[1].consumables?.length||0,0);
 assert.equal(command(a,'consumable',{kind:'__proto__',slot}).ok,false);
});


test('consumables scale for the upcoming wave and retain purchased values through checkpoints',()=>{
 const {c,s,run}=setup();const early=c.combat.consumableStats(s);s.wave=34;const late=c.combat.consumableStats(s);assert.equal(late.wave,35);assert.equal(early.spikeDamage,5);assert.equal(late.spikeDamage,137);assert.equal(late.resinCharges,30);assert.equal(late.resinDuration,7);assert.equal(late.overloadDuration,24);
 const slot={q:1,r:0,index:0};c.combat.buyConsumable(s,'spikes',slot);c.combat.buyConsumable(s,'resin',slot);c.towers.buy(s,'archer',[slot]);c.combat.buyConsumable(s,'overload',slot);
 const restored=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(s,run.random)))).state;
 assert.equal(restored.consumables[0].damage,late.spikeDamage);assert.equal(restored.consumables[1].duration,7000);assert.equal(restored.map.get('1,0').towers[0].overloadDuration,24000);
 s.wave=35;s.waveRunning=true;assert.deepEqual(c.combat.consumableStats(s),late);
 const e=enemy(c,1,late.spikeDamage*2);s.enemies=[e];c.combat.applyConsumables(s,0);assert.equal(e.alive,false);assert.equal(s.consumables[0].charges,18);
});
test('spikes remain supplemental instead of matching exponential enemy health',()=>{
 const {c}=setup();let previousShare=Infinity;
 for(const [wave,damage] of [[1,5],[10,18],[25,69],[35,137],[60,599]]){
   const stats=c.combat.consumableStats({wave,waveRunning:true});
   assert.equal(stats.spikeDamage,damage);
   const normalHp=Math.round((28+wave*7)*Math.pow(1.1,Math.max(0,wave-3))),share=20*damage/normalHp;
   assert.ok(share<previousShare);previousShare=share;
 }
});
