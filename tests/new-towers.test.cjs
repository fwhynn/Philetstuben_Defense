const {test}=require('node:test'),assert=require('node:assert/strict'),load=require('../headless-core.cjs');
const types=['gravity','wind','poison','meteor','laser','gamble','portal'],baseLoadout=['archer','catapult','chain','freeze','mine'];
const json=x=>JSON.parse(JSON.stringify(x));
function tower(c,type,branch=0,level=1){const tw={type,lastShot:-Infinity,level,statId:1};if(level>1){tw.branch=c.data.availableUpgrades(tw)[branch][0];if(level>2)tw.finalUpgrade=c.data.availableUpgrades(tw)[0][0];if(level>3)tw.ultimate=type;}return tw;}
function enemy(id=1,options={}){const points=options.points||[{x:-500,y:0},{x:500,y:0}],t=options.t??.5;return {id,type:'normal',alive:true,hp:10000,maxHp:10000,armorHp:0,magicHp:0,index:0,t,speed:0,points,originPoints:points,x:points[0].x+(points[1].x-points[0].x)*t,y:points[0].y+(points[1].y-points[0].y)*t,...options};}
function fixture(type,branch=0,level=1){const c=load(),run=c.runtime.create({seed:'new-tower-test',runId:'test',loadout:baseLoadout}),s=run.state,tw=tower(c,type,branch,level);Object.assign(s,{phase:'wave',wave:10,waveRunning:true,enemies:[enemy()]});s.map.get('0,0').towers=[tw];const refs=[{tw,pos:{x:-35,y:30},roadPoints:[{x:0,y:0}]}];const tick=(seconds=.05)=>{s.elapsedMs+=seconds*1000;c.combat.step(s,refs,c.data.TOWERS,seconds,s.elapsedMs);};const advance=n=>{for(let i=0;i<Math.round(n/.05);i++)tick();};return {c,run,s,tw,refs,tick,advance};}
test('all seven towers unlock, offer exactly two paths, and charge all four stages in solo',()=>{
 const c=load();for(const type of types)for(let branch=0;branch<2;branch++){
  const run=c.runtime.create({seed:'purchase',runId:'purchase',loadout:[type,...baseLoadout.slice(0,4)]}),s=run.state;Object.assign(s,{phase:'build',gold:2000});const tile=s.map.get('0,0');tile.slots=1;tile.towers=[null];const slot={q:0,r:0,index:0};
  assert.ok(c.profile.TOWER_UNLOCKS[type]);assert.ok(c.towers.buy(s,type,[slot]).ok);const tw=tile.towers[0],choices=c.data.availableUpgrades(tw);assert.equal(choices.length,2);
  const id=choices[branch][0];assert.ok(c.towers.upgrade(s,slot,id));assert.equal(c.towers.upgrade(s,slot,choices[1-branch][0]),false);
  const final=c.data.availableUpgrades(tw)[0][0];assert.ok(c.towers.upgrade(s,slot,final));assert.equal(c.towers.upgrade(s,slot,'ultimate:'+type),false);
  s.ultimateUnlocks=['ultimate:'+type+':'+id];assert.ok(c.towers.upgrade(s,slot,'ultimate:'+type));assert.equal(tw.level,4);assert.equal(c.data.runUpgrades(s,tw).length,0);assert.equal(tw.paid,2000-s.gold);assert.ok(Number.isFinite(c.data.towerDefinition(tw).damage));
 }
});
test('new towers and both ultimate paths are available through authoritative Duo commands on either board',()=>{
 const c=load();let seq=0;for(const type of types)for(let branch=0;branch<2;branch++){
  const m=c.duo.create('new-duo',Array(2).fill([type,...baseLoadout.slice(0,4)]));
  for(let p=0;p<2;p++){const s=m.boards[p].state;s.phase='build';s.gold=2000;const tile=s.map.get('0,0');tile.slots=1;tile.towers=[null];const slot={q:0,r:0,index:0},send=(action,payload)=>c.duo.command(m,p,{id:String(seq++),wave:0,action,payload});
   assert.ok(send('tower',{type,slots:[slot]}));const tw=tile.towers[0],id=c.data.availableUpgrades(tw)[branch][0];assert.ok(send('upgrade',{slot,upgrade:id}));assert.ok(send('upgrade',{slot,upgrade:c.data.availableUpgrades(tw)[0][0]}));s.ultimateUnlocks=['ultimate:'+type+':'+id];assert.ok(send('upgrade',{slot,upgrade:'ultimate:'+type}));assert.equal(tw.level,4);
  }assert.notEqual(m.boards[0].state.map,m.boards[1].state.map);
 }
});
test('gravity pulls along the road, obeys its target cap and never displaces bosses',()=>{
 const h=fixture('gravity');h.tw.targetPriority=['furthestBase','mostHealth','boss'];h.s.enemies=Array.from({length:8},(_,i)=>enemy(i+1,{t:.5+i*.005,x:i*5}));h.tick();assert.equal(h.s.enemies.filter(e=>e.hp<10000).length,5);h.advance(.25);assert.ok(h.s.enemies[4].x<20);assert.equal(h.s.enemies[4].y,0);
 const b=fixture('gravity',0,4);b.s.enemies=[enemy(1,{type:'boss',t:.6,x:100})];b.refs[0].pos={x:100,y:25};b.tick();b.advance(.25);assert.equal(b.s.enemies[0].x,100);assert.ok(b.s.enemies[0].controlUntil<=450);
});
test('control chains share the 2-second budget in a rolling 8-second interval',()=>{
 const h=fixture('gravity',0,4),e=h.s.enemies[0];for(let i=0;i<140;i++){h.tw.lastShot=-Infinity;h.tick();}
 const used=e.controlHistory.reduce((n,x)=>n+x.end-x.start,0);assert.ok(used<=2000.00001);assert.ok(e.controlUntil<3000);
});
test('wind travels, hits each target once and limits a shared three-tornado fan to eight',()=>{
 const h=fixture('wind',0,4);h.tw.weaponShots=3;h.refs[0].pos={x:-100,y:0};h.s.enemies=Array.from({length:12},(_,i)=>enemy(i+1,{x:i*3,t:.5+i*.003}));h.tick();assert.equal(h.s.enemies[0].hp,10000);h.advance(.9);assert.equal(h.s.enemies.filter(e=>e.hp<10000).length,8);assert.equal(Math.min(...h.s.enemies.map(e=>e.hp)),10000-38);
});
test('poison has three global doses, one area dose, no defense bypass, and shields block application',()=>{
 const h=fixture('poison');h.advance(10);const e=h.s.enemies[0];assert.equal(e.poisons.length,3);assert.ok(e.hp<9950);
 const area=fixture('poison',1,4);area.s.enemies[0].armorHp=1000;area.advance(8);assert.equal(area.s.enemies[0].poisons.length,1);assert.equal(area.s.enemies[0].hp,10000);assert.ok(area.s.enemies[0].armorHp<1000);
});
test('poison application is stopped by shields and cannot replace stronger doses',()=>{
 const h=fixture('poison');h.s.enemies[0].shieldHits=2;h.tick();assert.equal(h.s.enemies[0].shieldHits,1);assert.equal(h.s.enemies[0].poisons,undefined);
});
test('meteor has a telegraph, can miss, and caps persistent craters at two per tower',()=>{
 const h=fixture('meteor',0,4);h.tick();assert.equal(h.s.enemies[0].hp,10000);h.s.enemies[0].x=200;h.s.enemies[0].t=.7;h.advance(.8);assert.equal(h.s.enemies[0].hp,10000);
 h.s.enemies[0].x=0;h.s.enemies[0].t=.5;for(let i=0;i<60;i++){h.tw.lastShot=-Infinity;h.tick();}assert.ok(h.s.enemies[0].hp<10000);assert.ok(h.s.towerEffects.filter(e=>e.kind==='crater').length<=2);
});
test('laser charges on a target, resets when switching, and multi-beams never focus one enemy',()=>{
 const h=fixture('laser',0,4);h.advance(.6);assert.equal(h.s.enemies[0].hp,10000);h.advance(5);assert.ok(h.tw.laserBeams[0].charge>=4.5);const e=enemy(2);h.s.enemies=[e];h.tick();assert.equal(h.tw.laserBeams[0].charge,0);h.advance(.5);assert.equal(e.hp,10000);h.advance(.3);assert.ok(e.hp<10000&&e.hp>9900);
 const multi=fixture('laser',1,4);multi.advance(5);assert.equal(multi.tw.laserBeams.filter(b=>b.target!==undefined).length,1);
 multi.s.enemies.push(enemy(2),enemy(3));multi.advance(4);assert.equal(new Set(multi.tw.laserBeams.map(b=>b.target)).size,3);
});
test('laser consumes at most one shield stack per beam every half second',()=>{
 const h=fixture('laser');h.s.enemies[0].shieldHits=100;h.advance(2);assert.ok(h.s.enemies[0].shieldHits>=97);assert.equal(h.s.enemies[0].hp,10000);
});
test('gamble jackpot is damage-capped; healing cannot resurrect or duplicate rewards',()=>{
 const h=fixture('gamble');h.s.weaponRandom=()=>.91;h.tick();assert.equal(h.s.enemies[0].hp,10000-160);
 h.s.enemies=[enemy(2,{type:'boss'})];h.tw.lastShot=-Infinity;h.tick();assert.equal(h.s.enemies[0].hp,10000-60);
 h.s.weaponRandom=()=>.94;h.s.enemies=[enemy(3,{hp:1,maxHp:100})];h.tw.lastShot=-Infinity;h.tick();assert.equal(h.s.enemies[0].hp,6);assert.equal(h.s.waveKills,0);
 const safe=fixture('gamble',0,4);safe.s.weaponRandom=()=>.99;safe.tick();assert.ok(safe.s.enemies[0].hp<10000);
});
test('portals reset to the original route once, preserving all pools and applying elite charge costs',()=>{
 const h=fixture('portal');const e=h.s.enemies[0];e.armorHp=200;e.magicHp=100;e.shieldHits=3;h.tick();h.tick();assert.equal(e.x,-500);assert.equal(e.portalUsed,true);assert.equal(e.hp,10000);assert.equal(e.armorHp,200);assert.equal(e.shieldHits,3);
 e.x=0;e.t=.5;h.tw.lastShot=-Infinity;h.advance(9);assert.equal(e.x,0);
 const elite=fixture('portal');elite.s.enemies=[enemy(1,{type:'shieldbearer'}),enemy(2,{type:'healer'})];elite.tick();elite.tick();assert.equal(elite.s.enemies.filter(e=>e.portalUsed).length,1);
});
test('bosses are slowed, never reset; split children inherit reset and displacement limits',()=>{
 const h=fixture('portal');const boss=enemy(1,{type:'boss'});h.s.enemies=[boss];h.tick();h.tick();assert.equal(boss.x,0);assert.equal(boss.portalUsed,undefined);assert.ok(boss.slowEffects.some(e=>e.source==='portal'));
 const split=fixture('gamble');split.s.weaponRandom=()=>0;split.s.enemies=[enemy(1,{hp:1,maxHp:100,type:'splitter',splitOnDeath:true,portalUsed:true,displacedDistance:240,displaceReady:9000})];split.s.nextEnemyId=2;split.tick();assert.equal(split.s.enemies.length,2);for(const e of split.s.enemies){assert.equal(e.portalUsed,true);assert.equal(e.displacedDistance,240);assert.equal(e.displaceReady,9000);}
});
test('every new weapon resumes mid-combat identically, including RNG, poison, casts and charge',()=>{
 for(const type of types)for(const branch of [0,1]){
  const h=fixture(type,branch,4);h.s.enemies=Array.from({length:5},(_,i)=>enemy(i+1,{t:.5+i*.01,x:i*10}));h.advance(2.35);
  const second=load(),copy=second.snapshot.restore(json(h.c.snapshot.capture(h.s,h.run.random))),tw=copy.state.map.get('0,0').towers[0];
  for(let i=0;i<100;i++){h.tick();copy.state.elapsedMs+=50;second.combat.step(copy.state,[{tw,pos:h.refs[0].pos}],second.data.TOWERS,.05,copy.state.elapsedMs);}
  assert.deepEqual(json(h.c.snapshot.capture(h.s,h.run.random)),json(second.snapshot.capture(copy.state,copy.random)),type+' '+branch);
 }
});
test('support damage scales secondary effects exactly once and range buffs apply to all new weapons',()=>{
 const c=load();for(const type of types){const tw=tower(c,type,0,4),a=c.data.towerDefinition(tw),b=c.data.towerDefinition({...tw,supportDamage:1.2,supportRange:1.1});assert.equal(b.range,Math.round(a.range*1.1));for(const field of ['damage','poisonDps','beamMax','burnDps'])if(a[field])assert.ok(Math.abs(b[field]-a[field]*1.2)<.02,type+' '+field);}
});
test('Umleitung chooses a connected adjacent road with a longer route and respects the shared displacement cap',()=>{
 const h=fixture('wind',1,4),{c,s,tw,refs}=h;s.map.clear();
 for(let q=0;q<4;q++)for(let r=0;r<2;r++)s.map.set(q+','+r,{q,r,type:q===0&&r===0?'base':'fullCross',roads:[0,1,2,3,4,5],slots:0,towers:[]});
 const graph=c.map.routeGraph(s.map),points=[...graph.graph.get('2,0').find(e=>e.next==='1,0').points,...graph.graph.get('1,0').find(e=>e.next==='0,0').points.slice(1)];
 const at=points.findIndex(p=>Math.hypot(p.x-graph.geometry.get('1,0').hub.x,p.y-graph.geometry.get('1,0').hub.y)<.01),p=points[at];
 const e=enemy(1,{points,originPoints:points,index:at,t:0,x:p.x,y:p.y});s.enemies=[e];refs[0].pos={x:e.x-20,y:e.y};tw.weaponShots=4;const before=c.combat.remainingDistance(e);h.tick();h.advance(.3);
 assert.ok(e.motionRevision>0);assert.ok(c.combat.remainingDistance(e)>before);assert.ok(e.displacedDistance<=180);assert.ok(e.points.some(p=>p.y!==0),'alternative road, not only the original lane');assert.equal(e.points.at(-1).x,graph.geometry.get('0,0').hub.x);assert.equal(e.points.at(-1).y,graph.geometry.get('0,0').hub.y);
 const after=c.combat.remainingDistance(e);tw.lastShot=-Infinity;h.tick();h.advance(.3);assert.equal(c.combat.remainingDistance(e),after,'eight-second shared lock');
 e.displacedDistance=240;s.elapsedMs+=9000;tw.lastShot=-Infinity;tw.weaponShots=4;refs[0].pos={x:e.x-20,y:e.y};h.tick();h.advance(.3);assert.equal(e.displacedDistance,240);
});
test('poison death spread lasts only for the original remaining duration and cannot cascade',()=>{
 const h=fixture('poison',1,4),a=enemy(1),b=enemy(2,{t:.53,x:30}),c=enemy(3,{t:.59,x:90});h.s.enemies=[a];h.tick();const dose=a.poisons[0];h.s.enemies.push(b,c);a.hp=1;h.tw.lastShot=1e9;h.advance(1.1);
 const recipient=h.s.enemies.find(e=>e.id===2);assert.ok(recipient.poisons?.length);assert.ok(recipient.poisons.every(p=>p.spreadUsed&&p.until===dose.until));
 recipient.hp=1;const fourth=enemy(4,{t:.58,x:80});h.s.enemies.push(fourth);h.advance(1.1);assert.equal(fourth.poisons,undefined,'secondary spread must not chain');
});
test('portal keeps a rewritten enemy route tied to its original entrance',()=>{
 const h=fixture('portal'),e=h.s.enemies[0];e.originPoints=e.points;e.points=[{x:-100,y:0},{x:500,y:0}];e.t=1/6;e.x=0;h.tick();h.tick();assert.equal(e.x,-500);assert.equal(e.points[0].x,-500);
});
test('laser overload increases real damage and wave cleanup removes all lingering casts and charge',()=>{
 const a=fixture('laser'),b=fixture('laser');b.tw.overloadUntil=20000;a.advance(8);b.advance(8);assert.ok(10000-b.s.enemies[0].hp>(10000-a.s.enemies[0].hp)*1.4);
 b.s.towerEffects=[{kind:'meteor',at:1e8}];b.c.combat.clearConsumables(b.s);assert.equal(b.s.towerEffects.length,0);assert.equal(b.tw.laserBeams,undefined);
});
test('a bound toad cannot start a shortcut jump while gravity is holding it',()=>{
 const h=fixture('gravity'),e=h.s.enemies[0];e.type='thornToad';e.spawnedAt=0;e.controlUntil=6500;h.s.elapsedMs=5700;h.tw.lastShot=100000;h.tick();
 assert.equal(e.lastHop,undefined);assert.equal(e.shortcutFlight,undefined);assert.equal(e.x,0);
});
