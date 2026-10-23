const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../headless-core.cjs'),{load}=require('./helpers/game.cjs');
function setup(){const c=core(),r=c.runtime.create({seed:'bugfix',runId:'bugfix',loadout:['archer','catapult','chain','mine','necromancer']});r.state.landmarks.clear();r.state.biomeSeed=null;return {c,...r};}
const enemy=(id,x,end=1000)=>({id,type:'normal',hp:1000,maxHp:1000,alive:true,speed:0,x,y:0,index:0,t:0,points:[{x,y:0},{x:end,y:0}]});
test('closest-base shot and visual aim agree, even when another enemy is closer to the turret',()=>{
 const {c,state:s}=setup(),near=enemy(1,5),urgent=enemy(2,80,0),tw={type:'ballista',lastShot:-Infinity,targetPriority:['closestBase']};
 s.enemies=[near,urgent];c.combat.step(s,[{tw,pos:{x:0,y:0}}],c.data.TOWERS,0,1000);
 assert.equal(s.projectiles[0].hits[0],2);assert.equal(tw.aim.x,80);assert.equal(tw.aim.time,1000);assert.equal(near.hp,1000);assert.ok(urgent.hp<1000);
});
test('ram gains visible speed across real straight road joins and duplicate points; turns reset it',()=>{
 const {c,state:s,random}=setup();s.map=new Map();for(let q=0;q<5;q++)s.map.set(q+',0',{q,r:0,type:q?'straight':'base',roads:q?[0,3]:[0],slots:0,towers:[]});
 const points=c.runtime.nextSourcePoints(s,random,c.runtime.spawnSources(s)[0]);points.splice(4,0,{...points[4]});
 const e={...enemy(1,points[0].x),type:'ramBeetle',points,speed:30};s.enemies=[e];
 for(let i=0;i<120;i++)c.combat.step(s,[],c.data.TOWERS,1/60,i*1000/60);
 assert.ok(e.charge>.95);assert.ok(points[0].x-e.x>85,'faster than the 60 units at base speed');
 e.points=[{x:e.x,y:0},{x:e.x-1,y:0},{x:e.x-1,y:100}];e.index=0;e.t=0;
 c.combat.step(s,[],c.data.TOWERS,.02,2100);assert.equal(e.charge,0);
});
test('consumable budget includes preparation, survives checkpoints and resets only for next wave',()=>{
 const {c,state:s,random}=setup();s.gold=10000;s.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:4,towers:Array.from({length:4},()=>({type:'archer'}))});
 for(const kind of ['spikes','resin','overload']){for(let i=0;i<3;i++)assert.equal(c.combat.buyConsumable(s,kind,{q:1,r:0,index:i}),true);assert.equal(c.combat.buyConsumable(s,kind,{q:1,r:0,index:3}),false);}
 s.wave=1;s.waveRunning=true;s.phase='wave';assert.equal(c.combat.consumableRemaining(s,'spikes'),0);
 s.waveRunning=false;s.phase='build';s.wave=0;const restored=c.snapshot.restore(c.snapshot.capture(s,random)).state;assert.equal(c.combat.consumableRemaining(restored,'overload'),0);
 s.wave=1;c.combat.clearConsumables(s);assert.equal(c.combat.consumableRemaining(s,'spikes'),3);
});
test('consumable kills supply souls and spirits deal attributed damage',()=>{
 const {c,state:s}=setup(),tw={type:'necromancer',lastShot:1000},ref={tw,pos:{x:0,y:0}};
 s.enemies=[{...enemy(1,0),hp:1}];s.consumables=[{kind:'spikes',x:0,y:0,charges:1,damage:5,seen:[]}];
 c.combat.step(s,[ref],c.data.TOWERS,0,1000);assert.equal(tw.souls.length,1);
 s.enemies=[enemy(2,20)];tw.lastShot=2000;c.combat.step(s,[ref],c.data.TOWERS,0,2000);
 assert.equal(s.enemies[0].hp,990);assert.equal(s.runTowerStats.necromancer.damage,10);
});
test('mobile base selection opens its hidden stats tray',()=>{
 let opened;const {a,elements}=load({compact:{small:()=>true,open:name=>opened=name}});a.rendererCommands.selectBase();assert.equal(opened,'stats');assert.equal(elements.get('baseDropdown').open,true);
});
test('the synthetic click following a touch does not immediately dismiss the base tray',()=>{
 const vm=require('node:vm'),fs=require('node:fs'),listeners={},root={dataset:{}};
 const context={document:{documentElement:root,querySelectorAll:()=>[],addEventListener:(name,fn)=>listeners[name]=fn},matchMedia:()=>({matches:true}),dispatchEvent(){},Event:class{},Math};
 vm.runInNewContext(fs.readFileSync('classes/compact-controls.js','utf8'),context);
 context.HexCompact.open('stats',{pointerType:'touch',clientX:100,clientY:200,timeStamp:1000});
 listeners.click({clientX:100,clientY:200,timeStamp:1010,target:{closest:()=>null}});assert.equal(root.dataset.compact,'stats');
 listeners.click({clientX:150,clientY:200,timeStamp:2000,target:{closest:()=>null}});assert.equal(root.dataset.compact,'');
});
test('copy and paste transfers only focus priorities, leaving upgrades and investment intact',()=>{
 const {a,elements,selectSlot,buyTower}=load();a.state.gold=1000;a.state.phase='build';
 for(const q of [1,2]){a.state.map.set(q+',0',{q,r:0,type:'straight',roads:[0,3],slots:1,towers:[null]});selectSlot(q,0,0);buyTower('archer');}
 const source=a.state.map.get('1,0').towers[0],target=a.state.map.get('2,0').towers[0];source.targetPriority=['boss','leastHealth','closestBase'];
 const select=q=>{a.state.selectedTower={q,r:0,index:0};a.state.selectedTowers=[{q,r:0,index:0}];a.renderAll();};
 const button=text=>elements.get('towerUpgrades').children.find(n=>n.textContent===text);
 select(1);button('Fokus kopieren').listeners.click();select(2);assert.equal(button('Fokus einfügen').disabled,false);
 const gold=a.state.gold,paid=target.paid;button('Fokus einfügen').listeners.click();assert.deepEqual([...target.targetPriority],[...source.targetPriority]);assert.notEqual(target.targetPriority,source.targetPriority);assert.equal(target.paid,paid);assert.equal(a.state.gold,gold);assert.equal(target.branch,undefined);
});
test('remote forge signals only redundant coverage of equal or greater strength',()=>{
 const {c,state:s}=setup(),remote={type:'forge',level:3,special:true,target:'3,0'},local={type:'forge',level:2};
 s.map.set('1,0',{q:1,r:0,buildings:[remote]});s.map.set('3,0',{q:3,r:0,buildings:[local]});
 assert.equal(c.buildings.redundantTarget(s,remote),false);local.level=3;assert.equal(c.buildings.redundantTarget(s,remote),true);
 s.map.get('3,0').buildings=[];assert.equal(c.buildings.redundantTarget(s,remote),false);
});
test('first wave is clearable without consumables, meta or flame by several damage towers',()=>{
 for(const type of ['catapult','chain','necromancer']){const {c,state:s,random}=setup();s.map=new Map();for(let q=0;q<2;q++)s.map.set(q+',0',{q,r:0,type:q?'straight':'base',roads:q?[0,3]:[0],slots:q?1:0,towers:q?[null]:[],buildings:[]});s.phase='build';
 assert.equal(c.towers.buy(s,type,[{q:1,r:0,index:0}]).ok,true);assert.ok(c.flow.start(s,random));let result;
 for(let i=0;i<7200;i++){result=c.runtime.advance(s,random,1/60);if(result!=='running')break;}
 assert.equal(result,'complete',type);assert.equal(s.hp,20,type);assert.equal(s.waveKills,5,type);}
});
