const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {load}=require('./helpers/game.cjs'),loadCore=require('../headless-core.cjs');
function combat(original){
  let distances=0;const math=Object.create(Math);math.hypot=(...args)=>{distances++;return Math.hypot(...args);};
  const context=vm.createContext({Math:math});for(const name of ['data','waves'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../classes',name+'.js'),'utf8'),context);
  let source=fs.readFileSync(path.join(__dirname,'../classes/combat.js'),'utf8');
  if(original)source=source.replace('nextChainTarget(state.enemies,hit,last,def.jumpRange)',require('./helpers/chain-target-reference.cjs'));
  vm.runInContext(source,context);return {step:vm.runInContext('HexCombat.step',context),get distances(){return distances;}};
}
test('linear chain search preserves complete damage and projectile results, including equidistant targets',()=>{
  let before=0,after=0;
  for(let seed=0;seed<15;seed++){
    const results=[];
    for(const original of [true,false]){
      const api=combat(original),state={hp:20,gold:0,goldEarned:{kills:0},waveKills:0,projectiles:[],enemies:Array.from({length:125},(_,id)=>{const x=(id%25)*8-96,y=(Math.floor(id/25)-2)*12;return {id,x,y,hp:10+((id+seed)%9)*10,alive:true,index:0,t:0,speed:0,points:[{x,y},{x:x+1000,y}]};})};
      const events=[];api.step(state,[{tw:{type:'chain',lastShot:0,targetPriority:['closestTower']},pos:{x:0,y:0},definition:{damage:30,range:500,cooldown:.1,chain:10,jumpRange:50,color:'#fff'}}],{},0,2000,e=>events.push(e));
      results.push(JSON.stringify({state,events}));if(original)before+=api.distances;else after+=api.distances;
    }
    assert.equal(results[0],results[1]);
  }
  assert.ok(after<before,`${after} vs ${before} distance calculations`);
});
test('multiple summoners retain independent timing, IDs and summon limits without an enemy-array copy',()=>{
  const c=loadCore(),run=c.session.create({seed:'two-summoners',runId:'two',loadout:['archer','chain','catapult','freeze','mine']}),s=run.state;
  const boss=id=>({...c.waves.bossProfile(35),id,maxHp:1000,hp:1000,alive:true,points:[{x:10000,y:0},{x:20000,y:0}],x:10000,y:0,index:0,t:0,nextSummonAt:0});
  Object.assign(s,{wave:35,phase:'wave',waveRunning:true,enemies:[boss(1),boss(2)],nextEnemyId:3});
  c.runtime.advance(s,run.random,0);assert.deepEqual(Array.from(s.enemies,e=>e.id),[1,2,3,4]);
  c.runtime.advance(s,run.random,0);assert.equal(s.enemies.length,4);
  for(let i=0;i<10;i++)c.runtime.advance(s,run.random,6);
  assert.equal(s.enemies.filter(e=>e.summoned===true).length,12);assert.equal(s.nextEnemyId,15);
});
test('multi-build shares discounts but rounds each slot separately and keeps affordability live',()=>{
  const {a,elements,buildings}=load(),s=a.state;s.phase='build';s.gold=41;
  for(const [q,level] of [[1,1],[8,3]])s.map.set(q+',0',{q,r:0,type:'straight',roads:[0,3],slots:1,towers:[null],buildings:[{type:'market',level}]});
  s.selectedSlots=[{q:1,r:0,index:0},{q:8,r:0,index:0}];s.selectedSlot=s.selectedSlots[1];a.renderAll();
  const button=elements.get('towerMenu').children[0];assert.match(button.innerHTML,/41 🪙/);assert.equal(button.disabled,false);
  const effects=buildings.effects;let calls=0;buildings.effects=(...args)=>{calls++;return effects(...args);};
  a.renderAll();assert.equal(calls,2,'one discount lookup per selected slot');
  s.gold=40;a.renderAll();assert.equal(button.disabled,true);
  s.map.get('1,0').buildings[0].level=2;s.buildingVersion=(s.buildingVersion||0)+1;a.renderAll();
  assert.match(elements.get('towerMenu').children[0].innerHTML,/39 🪙/);assert.equal(elements.get('towerMenu').children[0].disabled,false);
});
