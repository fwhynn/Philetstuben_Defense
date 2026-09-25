const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function setup(){
  const context=vm.createContext({});
  for(const file of ['data','waves'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../classes',file+'.js'),'utf8'),context);
  const source=fs.readFileSync(path.join(__dirname,'../classes/combat.js'),'utf8').replace('function remainingDistance(e){','function remainingDistance(e){distanceCalls++;');
  vm.runInContext('let distanceCalls=0;'+source,context);
  return vm.runInContext('({combat:HexCombat,towers:HexData.TOWERS,get calls(){return distanceCalls;}})',context);
}
function reference(candidates,priorities,pos,distance){
  const pool=(e,key)=>Math.max(0,Number(e[key])||0);
  for(const priority of priorities){
    let eligible=candidates;
    if(priority==='boss')eligible=candidates.filter(e=>e.type==='boss');
    if(priority==='mostArmor')eligible=candidates.filter(e=>pool(e,'armorHp')>0);
    if(priority==='mostMagic')eligible=candidates.filter(e=>pool(e,'magicHp')>0);
    if(!eligible.length)continue;
    const value=e=>priority==='boss'?1:priority==='mostArmor'?pool(e,'armorHp'):priority==='mostMagic'?pool(e,'magicHp'):priority==='mostHealth'?pool(e,'hp'):priority==='leastHealth'?-pool(e,'hp'):priority==='furthestBase'?distance(e):priority==='closestBase'?-distance(e):priority==='furthestTower'?Math.hypot(e.x-pos.x,e.y-pos.y):-Math.hypot(e.x-pos.x,e.y-pos.y);
    const sorted=[...eligible].sort((a,b)=>value(b)-value(a));candidates=sorted.filter(e=>value(e)===value(sorted[0]));if(candidates.length===1)return candidates[0];
  }
  return candidates[0];
}
test('target optimization follows lexicographic priorities, fallbacks and final equal-score order',()=>{
  const {combat}=setup(),pos={x:10,y:20};
  const enemies=Array.from({length:30},(_,id)=>({id,type:id%7===0?'boss':'normal',hp:id%4*10,armorHp:id%3*5,magicHp:id%5*3,x:id%6*10,y:id%2*20,index:0,t:(id%3)/4,points:[{x:0,y:0},{x:50,y:0},{x:100,y:10,tunnel:id%3===0}]}));
  for(const candidates of [enemies,[...enemies].reverse(),enemies.filter(e=>e.type!=='boss'),enemies.slice(0,1),[],[enemies[1],{...enemies[1],id:99}]]){
    for(const priority of ['boss','mostArmor','mostMagic','mostHealth','leastHealth','furthestBase','closestBase','furthestTower','closestTower']){
      const priorities=[priority,'closestBase'];
      assert.equal(combat.targetByPriority(candidates,{targetPriority:priorities},pos),reference(candidates,priorities,pos,combat.remainingDistance));
    }
  }
});
test('base distances are reused between towers only within the same simulation step',()=>{
  const api=setup(),enemies=Array.from({length:3},(_,i)=>({id:i,x:20+i*10,y:0,hp:10000,alive:true,index:0,t:0,speed:1,points:[{x:20+i*10,y:0},{x:500,y:0}]}));
  const state={hp:20,gold:0,goldEarned:{kills:0},enemies,projectiles:[]};
  const refs=Array.from({length:4},()=>({tw:{type:'archer',lastShot:0},pos:{x:0,y:0}}));
  let referenceCalls=0;
  for(const ref of refs)reference(enemies,['closestBase','mostHealth','boss'],ref.pos,()=>{referenceCalls++;return 1;});
  assert.ok(referenceCalls>enemies.length);
  api.combat.step(state,refs,api.towers,.05,2000);
  assert.equal(api.calls,3,'one path distance per enemy, not per tower/comparison');
  state.enemies[0].t=.1;
  api.combat.step(state,refs,api.towers,.05,4000);
  assert.equal(api.calls,6,'next step must use fresh positions');
});
test('health-based targeting observes damage from the previous tower in the same step',()=>{
  const api=setup(),state={hp:20,gold:0,goldEarned:{kills:0},projectiles:[],enemies:[100,95].map((hp,id)=>({id,x:30,y:0,hp,alive:true,index:0,t:0,speed:0,points:[{x:30,y:0},{x:300,y:0}]}))};
  const refs=Array.from({length:2},()=>({tw:{type:'archer',lastShot:0,targetPriority:['mostHealth']},pos:{x:0,y:0}}));
  api.combat.step(state,refs,api.towers,0,2000);
  assert.deepEqual(Array.from(state.projectiles,p=>p.hits[0]),[0,1]);
  assert.equal(api.calls,0,'health priorities do not calculate path distances');
});
