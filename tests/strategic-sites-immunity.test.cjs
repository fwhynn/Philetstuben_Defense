const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../headless-core.cjs');
function combat(){const vm=require('node:vm'),fs=require('node:fs'),ctx=vm.createContext({});for(const n of ['data','waves','combat'])vm.runInContext(fs.readFileSync('classes/'+n+'.js','utf8'),ctx);return vm.runInContext('HexCombat',ctx);}
const setup=()=>{const c=core(),run=c.runtime.create({seed:'strategic',runId:'sites',loadout:['archer','catapult','chain','freeze','mine']});return {c,run,s:run.state};};
test('immune enemies never consume targeted shots, chain jumps or piercing slots',()=>{
 for(const type of ['flame','chain','catapult','necromancer']){
  const {c,s}=setup(),def=c.data.towerDefinition({type}),tw={type,lastShot:-Infinity,targetPriority:['mostHealth']};
  const enemy=(id,x,immune)=>({id,x,y:0,hp:immune?1000:100,alive:true,index:0,t:0,speed:0,points:[{x,y:0},{x:500,y:0}],immunity:immune?def.damageType:null});
  s.enemies=[enemy(1,10,true),enemy(2,40,false)];s.projectiles=[];
  combat().step(s,[{tw,pos:{x:0,y:0}}],c.data.TOWERS,0,2000);
  assert.equal(s.enemies[0].hp,1000,type);assert.ok(s.enemies[1].hp<100,type);
  const shot=tw.lastShot;s.enemies=[enemy(3,10,true)];combat().step(s,[{tw,pos:{x:0,y:0}}],c.data.TOWERS,0,10000);assert.equal(tw.lastShot,shot,type);
 }
});
test('trade posts retain distance gold, pay connected income only and cap at 20',()=>{
 const {c,s}=setup();s.map.clear();s.landmarks.clear();s.income=0;s.map.set('0,0',{q:0,r:0,type:'base',roads:[0],slots:0,towers:[]});
 for(let q=1;q<=12;q++){s.map.set(q+',0',{q,r:0,type:'straight',roads:[0,3],slots:0,towers:[]});s.landmarks.set(q+',0',{q,r:0,type:'treasure',claimed:false});assert.equal(c.exploration.claim(s,q,0),q*5);assert.equal(c.exploration.claim(s,q,0),0);}
 assert.equal(s.income,20);c.buildings.refresh(s);assert.equal(s.income,20);
 s.map.get('0,0').roads=[];c.buildings.refresh(s);assert.equal(s.income,0);
});
test('shrine choices persist and equal auras do not stack; guardian grants precisely one special slot',()=>{
 const {c,s,run}=setup();s.map.clear();s.landmarks.clear();
 for(const q of [0,1,2])s.map.set(q+',0',{q,r:0,type:'straight',roads:[0,3],slots:1,towers:[{type:'archer'}]});
 for(const q of [0,1]){s.map.get(q+',0').site='shrine';s.landmarks.set(q+',0',{q,r:0,type:'shrine',strategic:true,claimed:true});assert.ok(c.exploration.activateShrine(s,q+',0','range'));}
 assert.equal(s.map.get('1,0').towers[0].supportRange,1.15);
 assert.equal(c.exploration.activateShrine(s,'0,0','damage'),false);
 s.landmarks.set('2,0',{q:2,r:0,type:'boss',status:'defeated'});c.exploration.defeatGuardian(s,'2,0');c.exploration.defeatGuardian(s,'2,0');assert.equal(s.map.get('2,0').slots,2);
 s.map.get('2,0').towers[1]={type:'archer'};c.buildings.refresh(s);assert.equal(s.map.get('2,0').towers[0].supportRange,1.15);assert.equal(s.map.get('2,0').towers[1].supportRange,1.15*1.2);
 const restored=c.snapshot.restore(c.snapshot.capture(s,run.random)).state;assert.equal(restored.map.get('0,0').siteEffect,'range');assert.equal(restored.map.get('2,0').siteSlot,1);
 s.pendingShrine='0,0';s.phase='shrineReward';assert.equal(c.rewards.offer(s,'shrine',run.random).choices[0].kind,'site');
});


