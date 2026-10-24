const {test}=require('node:test'),assert=require('node:assert/strict');
const core=require('../headless-core.cjs'),{load}=require('./helpers/game.cjs');
const loadout=['archer','chain','freeze','mine','catapult'];
test('hover and click orient a card legally; rotation skips invalid angles in both directions',()=>{
 const {a}=load();const s=a.state;s.map=new Map([['0,0',{q:0,r:0,type:'base',roads:[0],slots:0,towers:[]}]]);s.landmarks=new Map();s.phase='place';s.hand=['smallCurve'];s.selectedCard=0;s.rotation=0;s.openingRemaining=0;
 const card=a.CARD_LIBRARY.smallCurve;const valid=Array.from({length:6},(_,r)=>r).filter(r=>a.canPlace(1,0,card,r));assert.ok(valid.length>1);assert.ok(valid.length<6);
 a.rendererCommands.hoverPlacement('1,0');assert.ok(valid.includes(s.rotation));const visited=new Set();for(let i=0;i<6;i++){a.rendererCommands.rotatePlacement();assert.ok(valid.includes(s.rotation));visited.add(s.rotation);}assert.equal(visited.size,valid.length);
 s.rotation=Array.from({length:6},(_,r)=>r).find(r=>!valid.includes(r));a.placeTile(1,0);assert.ok(s.map.has('1,0'));assert.ok(valid.includes(s.map.get('1,0').rotation));
});
test('enemy speed grows at most five percent after opening while health takes moderate extra scaling',()=>{
 const c=core();const first=c.waves.plan(1);assert.equal(first.hp,35);const early=c.waves.plan(3),late=c.waves.plan(50);assert.ok(late.speed/early.speed<1.05);
 for(const wave of [10,24,35,50]){const p=c.waves.plan(wave),oldHp=(28+wave*7)*Math.pow(1.1,Math.max(0,wave-3));assert.ok(p.hp>=oldHp-1);assert.ok(p.hp<=oldHp*1.18+1);}
});
test('purchased portals really spawn enemies in all six orientations, including restored runs',()=>{
 for(let d=0;d<6;d++){
 const c=core(),run=c.runtime.create({seed:'portal-live-'+d,runId:'portal-live',loadout}),s=run.state,p=c.map.neighbor(0,0,d),id=c.map.key(p.q,p.r);s.map.get('0,0').roads=[d];s.map.set(id,{...p,type:'deadEnd',rotation:c.map.OPP(d),roads:[c.map.OPP(d)],slots:0,towers:[],buildingSlots:1,buildings:[null]});s.phase='build';s.gold=500;s.landmarks=new Map();
 assert.ok(c.buildings.buy(s,{...p,index:0},'portal'));const restored=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(s,run.random))));assert.ok(c.flow.start(restored.state,restored.random));assert.equal(restored.state.spawnQueue.length,5);assert.ok(restored.state.spawnQueue.every(j=>j.source.dir===6));c.runtime.advance(restored.state,restored.random,.01);assert.equal(restored.state.enemies.length,1);assert.equal(restored.state.enemies[0].points.at(-1).x,0);assert.equal(restored.state.enemies[0].points.at(-1).y,0);
 }
});

test('more entrances than enemies do not permanently starve later portals; rotation survives save/load',()=>{
 const c=core(),run=c.runtime.create({seed:'many-fronts',runId:'many-fronts',loadout});let s=run.state;s.phase='build';
 const sources=Array.from({length:20},(_,q)=>({tile:{q,r:0},dir:q===19?6:0}));const enemies=Array.from({length:5},()=>({speed:25})),seen=new Set();
 for(let wave=0;wave<4;wave++){c.runtime.schedule(s,sources,enemies);assert.equal(s.spawnQueue.length,5);for(const job of s.spawnQueue)seen.add(job.source.q);s=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(s,run.random)))).state;}
 assert.equal(seen.size,20);assert.ok(seen.has(19));
});
