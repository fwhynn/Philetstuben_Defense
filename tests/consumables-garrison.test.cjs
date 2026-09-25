const {test}=require('node:test'),assert=require('node:assert/strict'),load=require('../headless-core.cjs');
const loadout=['archer','ballista','catapult','freeze','mine'];
function setup(day=null){const c=load(),run=c.session.create({seed:'test',runId:'consumables-test',loadout,challengeDay:day});const s=run.state;s.phase='build';s.openingRemaining=0;s.gold=1200;if(!s.map.has('1,0'))s.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:2,towers:[],income:0});return {c,s,run};}
function enemy(c,id,hp){const p=c.map.axialToWorld(1,0);return {id,type:'normal',hp,maxHp:hp,armorHp:0,magicHp:0,alive:true,x:p.x,y:p.y,points:[p,{x:0,y:0}],index:0,t:0,speed:1};}
test('spikes consume only lethal charges and leftovers damage the next enemy',()=>{
 const {c,s}=setup();assert.equal(c.combat.buyConsumable(s,'spikes',{q:1,r:0}),true);s.enemies=[enemy(c,1,50)];c.combat.applyConsumables(s,0,()=>{});
 assert.equal(s.enemies[0].alive,false);assert.equal(s.consumables[0].charges,10);
 s.enemies.push(enemy(c,2,200));c.combat.applyConsumables(s,0,()=>{});assert.equal(s.enemies[1].hp,150);assert.equal(s.consumables.length,0);
});
test('resin uses one charge per enemy and cannot stack on the same tile',()=>{
 const {c,s}=setup();assert.ok(c.combat.buyConsumable(s,'resin',{q:1,r:0}));const gold=s.gold;
 assert.equal(c.combat.buyConsumable(s,'resin',{q:1,r:0}),false);assert.equal(s.gold,gold);
 s.enemies=[enemy(c,1,50)];c.combat.applyConsumables(s,100,()=>{});c.combat.applyConsumables(s,200,()=>{});
 assert.equal(s.consumables[0].charges,11);assert.equal(s.enemies[0].slowEffects.length,1);assert.equal(s.enemies[0].slowEffects[0].until,4100);
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
 const slot={q:placement.q,r:placement.r,index:0},before=rooms.view(a.token).boards[0].gold;
 assert.equal(command(a,'consumable',{kind:'spikes',slot:{q:0,r:0,index:0}}).ok,false);
 assert.ok(command(a,'consumable',{kind:'spikes',slot}).ok);assert.equal(rooms.view(a.token).boards[0].gold,before-25);assert.equal(command(a,'consumable',{kind:'spikes',slot}).ok,false);
 rooms=createLobbies({now:()=>0,snapshot:JSON.parse(JSON.stringify(rooms.checkpoint()))});rooms.touch(a.token);rooms.touch(b.token);assert.equal(rooms.view(a.token).boards[0].consumables[0].charges,20);assert.equal(rooms.view(b.token).boards[1].consumables?.length||0,0);
 assert.equal(command(a,'consumable',{kind:'__proto__',slot}).ok,false);
});
