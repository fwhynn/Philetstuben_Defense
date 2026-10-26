const {test}=require('node:test'),assert=require('node:assert/strict');
const {waves}=require('../headless-core.cjs')();
const oldHp=w=>Math.round((28+w*7)*1.1**Math.max(0,Math.min(w,35)-3)*1.08**Math.max(0,w-35)*(1+Math.min(.18,Math.max(0,w-3)*.006)));
test('opening preserved, earlier pressure and gradual transition into unbounded endless growth',()=>{
 for(let w=1;w<=3;w++)assert.equal(waves.plan(w).hp,oldHp(w));
 for(const w of [10,15,20,25,30])assert.ok(waves.plan(w).hp>oldHp(w)*1.15);
 for(let w=4;w<=200;w++){
  const p=waves.plan(w),previous=waves.plan(w-1);
  assert.ok(p.hp>previous.hp);assert.equal(p.count,5+2*w);
  if(w>=45)assert.ok(p.hp/previous.hp<1.08,'no late health cliff at '+w);
  if(w>=51)assert.ok(p.hp/previous.hp>1.05,'endless never plateaus');
 }
 assert.ok(waves.plan(60).hp/waves.plan(50).hp<2);
 assert.ok(waves.plan(50).hp>=oldHp(50));
 assert.ok(waves.plan(80).hp>=190000&&waves.plan(80).hp<=210000);
 assert.ok(waves.plan(100).hp>waves.plan(50).hp*10);
 assert.ok(waves.plan(150).hp>waves.plan(100).hp*10);
});
test('boss health after campaign follows enemy growth without a second accelerating floor',()=>{
 const anchor=waves.bossProfile(35).hp;
 for(let w=45;w<=155;w+=10){
  const boss=waves.bossProfile(w);
  assert.ok(Math.abs(boss.hp-anchor*waves.plan(w).hp/waves.plan(35).hp)<=.5);
  assert.ok(boss.hp>waves.bossProfile(w-10).hp);
  if(w>=55)assert.ok(boss.hp/waves.bossProfile(w-10).hp<2.1);
 }
});
test('mission health budgets are isolated from the Standard and Duo curve',()=>{
 for(let wave=1;wave<=80;wave++){
  assert.equal(waves.plan(wave,0,true,{challengeKind:'caravan'}).hp,oldHp(wave));
  assert.equal(waves.plan(wave,0,false,{challengeKind:'greed'}).hp,oldHp(wave));
  if(wave<=12){
   const plan=waves.plan(wave,0,false,{challengeKind:'expedition',expedition:{rulesVersion:4}});
   assert.equal(plan.hp,oldHp(wave+2));
   assert.equal(plan.enemies.find(e=>e.type==='normal').hp,Math.ceil(oldHp(wave+2)*(1.3+wave*.12)));
  }
  if(wave<=35){
   const plan=waves.plan(wave,0,false,{challengeKind:'towerDraft',towerDraft:{rulesVersion:4}});
   assert.equal(plan.hp,oldHp(Math.max(4,3+Math.floor((wave-3)*.5))));
  }
 }
});
