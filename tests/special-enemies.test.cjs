const {test}=require('node:test'),assert=require('node:assert/strict');
const load=require('../headless-core.cjs');
function setup(){const core=load(),run=core.runtime.create({seed:'special-enemies',runId:'test',loadout:['archer','chain','freeze','flame','element']});Object.assign(run.state,{wave:26,waveRunning:true,phase:'wave',spawnQueue:[],pendingSpawns:0});return {core,...run};}
function enemy(extra={}){return {id:1,type:'normal',hp:100,maxHp:100,armorHp:0,magicHp:0,alive:true,speed:0,x:0,y:0,index:0,t:0,points:[{x:0,y:0},{x:1000,y:0}],...extra};}
function tick(run,seconds=0){return run.core.runtime.advance(run.state,run.random,seconds);}
function tower(run,tw){run.state.map.set('0,0',{q:0,r:0,type:'straight',roads:[0,3],slots:1,towers:[{lastShot:-Infinity,...tw}]});}
test('special profiles replace normal slots, preserve reward budgets and are deterministic',()=>{
 const {core,state}=setup();for(const [wave,type] of [[12,'splitter'],[18,'healer'],[26,'elementCarrier']]){
 assert.equal(core.waves.plan(wave-1,0,false,state).enemies.some(e=>e.type===type),false);
 const plan=core.waves.plan(wave,0,false,state);assert.equal(plan.enemies.length,5+wave*2);assert.equal(plan.enemies.filter(e=>e.type===type).length,1);assert.equal(plan.killGold,plan.count*3);
 }
 for(let wave=26;wave<80;wave++){const plan=core.waves.plan(wave,0,true,state);assert.equal(new Set(plan.enemies.filter(e=>e.immunity).map(e=>e.immunity)).size,1);assert.notEqual(core.waves.elementFor(wave,state),core.waves.elementFor(wave+1,state));assert.deepEqual(plan,core.waves.plan(wave,0,true,JSON.parse(JSON.stringify({seed:state.seed,towerLoadout:state.towerLoadout}))));}
 assert.notEqual(core.waves.elementFor(26,{towerLoadout:['flame']}),'fire');assert.equal(core.waves.elementFor(26,{towerLoadout:['freeze']}),null);
});
test('splitting preserves position, remaining route, wave lifetime and exact total gold including caravan budgets',()=>{
 for(const budget of [3,4,18]){const run=setup(),s=run.state;s.gold=0;s.enemies=[enemy({type:'splitter',hp:1,maxHp:400,splitOnDeath:true,killGold:budget,index:0,t:.1,x:100})];tower(run,{type:'archer'});
 assert.equal(tick(run),'running');assert.equal(s.enemies.length,2);assert.equal(s.gold,budget-2*Math.floor(budget/3));
 for(const child of s.enemies){assert.equal(child.hp,100);assert.equal(child.x,100);assert.equal(child.t,.1);assert.equal(child.armorHp,0);assert.ok(!child.splitOnDeath);assert.ok(!child.goldLoss);}
 s.map.clear();s.mines=s.enemies.map(e=>({x:e.x,y:e.y,damage:1000,splash:10,color:'#fff'}));assert.equal(tick(run),'complete');assert.equal(s.gold,budget);
 }
});
test('escaped shards cost lives but grant no gold',()=>{const run=setup();run.state.enemies=[enemy({type:'shard',index:1,killGold:1}),enemy({id:2,type:'shard',index:1,killGold:1})];const before=run.state.gold;assert.equal(tick(run),'complete');assert.equal(run.state.hp,18);assert.equal(run.state.gold,before);});
test('healers have a small radius, three-second cadence, no self/peer healing or stacking, and preserve armor',()=>{
 const run=setup(),s=run.state;const healer=enemy({type:'healer',hp:50,healRadius:50,healInterval:3000}),near=enemy({id:3,hp:80,armorHp:7,magicHp:8,x:40,t:.04}),far=enemy({id:4,hp:50,x:51,t:.051});s.enemies=[healer,enemy({...healer,id:2}),near,far];tick(run);tick(run,2.9);assert.equal(near.hp,80);tick(run,.1);assert.equal(near.hp,85);assert.equal(healer.hp,50);assert.equal(s.enemies[1].hp,50);assert.equal(far.hp,50);assert.equal(near.armorHp,7);assert.equal(near.magicHp,8);near.hp=99;tick(run,3);assert.equal(near.hp,100);
});
test('element immunity blocks only matching damage and direct water slow, not frost auras',()=>{
 for(const [immunity,type,branch] of [['fire','flame'],['lightning','chain'],['water','element','elementWater']]){const run=setup(),s=run.state,e=enemy({type:'elementCarrier',immunity});s.enemies=[e];tower(run,{type,branch});tick(run);assert.equal(e.hp,100);assert.ok(!e.slowEffects.length);tower(run,{type:'archer'});tick(run);assert.ok(e.hp<100);tower(run,{type:'freeze'});tick(run);assert.equal(e.slowFactor,.5);}
});
test('ability timers and immunity survive checkpoint restore without reroll or extra heal',()=>{
 const run=setup();run.state.enemies=[enemy({type:'healer',healRadius:50,healInterval:3000}),enemy({id:2,type:'elementCarrier',hp:50,immunity:'water'})];tick(run);tick(run,3);
 const saved=JSON.parse(JSON.stringify(run.core.snapshot.capture(run.state,run.random))),restored={core:run.core,...run.core.snapshot.restore(saved)};tick(run,1);tick(restored,1);assert.deepEqual(JSON.parse(JSON.stringify(restored.state.enemies)),JSON.parse(JSON.stringify(run.state.enemies)));assert.equal(restored.state.enemies[1].hp,55);
});
test('small tower nerfs apply to every specialization while unrelated towers retain their stats',()=>{
 const {core}=setup();for(const type of ['freeze','flame'])for(const branch of [null,...core.data.availableUpgrades({type}).map(([id])=>id)]){const tw={type,branch},raw={...core.data.TOWERS[type],...(core.data.UPGRADES[branch]||{})},actual=core.data.towerDefinition(tw);if(type==='freeze')assert.equal(actual.range,Math.round(raw.range*.95));else assert.equal(actual.damage,Number((raw.damage*.95).toFixed(2)));}
 assert.equal(core.data.towerDefinition({type:'archer'}).damage,core.data.TOWERS.archer.damage);
});
