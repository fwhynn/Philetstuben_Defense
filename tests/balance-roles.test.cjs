const {test}=require('node:test'),assert=require('node:assert/strict'),load=require('../headless-core.cjs');

// Exercise actual attacks, shields, bounce falloff and resistance layers rather
// than merely asserting catalog constants. Stationary targets isolate roles.
function arena(type,branch,count,{boss=false,ultimate=false,pool='hp'}={}){
 const c=load(),run=c.runtime.create({seed:'roles',runId:'roles',loadout:['archer','catapult','chain','freeze','mine']}),s=run.state;
 Object.assign(s,{wave:40,waveRunning:true,phase:'wave',elapsedMs:0,enemyZones:[]});
 s.enemies=Array.from({length:count},(_,i)=>({id:i+1,type:boss?'boss':'normal',alive:true,hp:1e8,maxHp:1e8,armorHp:pool==='armor'?1e8:0,magicHp:pool==='magic'?1e8:0,speed:0,x:20+i*8,y:0,index:0,t:0,points:[{x:20+i*8,y:0},{x:1000,y:0}]}));
 const finalUpgrade=Object.keys(c.data.UPGRADES).find(id=>c.data.UPGRADES[id].requires===branch),tw={type,branch,finalUpgrade,lastShot:-Infinity,biome:'grass',...(ultimate?{ultimate:type}:{})};
 for(let i=0;i<2400;i++){s.elapsedMs=i*25;c.combat.step(s,[{tw,pos:{x:0,y:0}}],c.data.TOWERS,.025,s.elapsedMs);}
 return s.runTowerStats[type].damage/60;
}
test('chain focus wins on one target; crowd branch wins on eight, including unlocked specializations and MR',()=>{
 for(const ultimate of [false,true])for(const pool of ['hp','magic']){
  assert.ok(arena('chain','overload',1,{ultimate,pool})>arena('chain','storm',1,{ultimate,pool})*1.3);
  assert.ok(arena('chain','storm',8,{ultimate,pool})>arena('chain','overload',8,{ultimate,pool}));
 }
});
test('ballista repeater wins sustained normal damage, harpoon wins boss damage and retains range',()=>{
 assert.ok(arena('ballista','repeater',1)>arena('ballista','harpoon',1));
 for(const ultimate of [false,true])assert.ok(arena('ballista','harpoon',1,{boss:true,ultimate})>arena('ballista','repeater',1,{boss:true,ultimate}));
 const c=load();assert.ok(c.data.towerDefinition({type:'ballista',branch:'harpoon'}).range>c.data.towerDefinition({type:'ballista',branch:'repeater'}).range);
});
test('opening waves and early bosses stay unchanged; late health is monotonic and bosses keep up',()=>{
 const c=load();let last=0;
 for(let w=1;w<=100;w++){
  const p=c.waves.plan(w),old=Math.round((28+7*w)*1.1**Math.max(0,w-3)*(1+Math.min(.18,Math.max(0,w-3)*.006)));
  assert.ok(p.hp>last);last=p.hp;
  if(w<=35)assert.equal(p.hp,old);else assert.ok(p.hp<old);
  if(p.boss&&w<=35)assert.equal(p.boss.hp,Math.round(1200*((w-5)/10)**1.8));
  if(p.boss&&w>=55)assert.ok(p.boss.hp>=p.hp);
  if(p.boss&&w>=75)assert.equal(p.boss.hp,2*p.hp);
 }
 const d=c.data.towerDefinition({type:'freeze',branch:'deepFrost',finalUpgrade:'absoluteZero',ultimate:'freeze'});
 assert.ok(Math.abs(d.slow-.28)<1e-10);
 // Reduced late health compensates part of reduced exposure, without buffing Frost itself.
 const w=75,old=(28+7*w)*1.1**(w-3)*1.18;
 assert.ok(c.waves.plan(w).hp/old<.5);
});
test('late healing is bounded, preserves layers and cannot stack or heal above max',()=>{
 const c=load(),s=c.runtime.create({seed:'heal',runId:'heal',loadout:['archer','catapult','chain','freeze','mine']}).state;
 Object.assign(s,{wave:75,waveRunning:true,phase:'wave',enemyZones:[]});
 const enemy=(id,extra)=>({id,type:'normal',alive:true,hp:100,maxHp:1e6,armorHp:7,magicHp:8,speed:0,x:0,y:0,index:0,t:0,points:[{x:0,y:0},{x:1000,y:0}],...extra});
 s.enemies=[enemy(1,{type:'healer',healRadius:50,healInterval:3000}),enemy(2,{type:'healer',healRadius:50,healInterval:3000}),enemy(3,{})];
 c.combat.step(s,[],c.data.TOWERS,0,0);c.combat.step(s,[],c.data.TOWERS,0,3000);
 assert.equal(s.enemies[2].hp,720);assert.equal(s.enemies[0].hp,100);assert.equal(s.enemies[2].armorHp,7);assert.equal(s.enemies[2].magicHp,8);
 s.enemies[2].hp=999999;c.combat.step(s,[],c.data.TOWERS,0,6000);assert.equal(s.enemies[2].hp,1e6);
});
test('choir keeps acquired souls between sparse kills, keeper retains stronger individual spirits',()=>{
 const c=load(),s=c.runtime.create({seed:'souls',runId:'souls',loadout:['archer','catapult','chain','freeze','mine']}).state;
 Object.assign(s,{wave:30,waveRunning:true,phase:'wave',enemyZones:[]});
 const tw={type:'necromancer',branch:'soulChoir',finalUpgrade:'soulLegion',lastShot:Infinity,souls:[{until:12000,lastShot:0}]};
 s.enemies=[{id:1,type:'normal',alive:true,hp:10000,maxHp:10000,armorHp:0,magicHp:0,speed:0,x:0,y:0,index:0,t:0,points:[{x:0,y:0},{x:1000,y:0}]}];
 c.combat.step(s,[{tw,pos:{x:0,y:0}}],c.data.TOWERS,0,9000);
 assert.equal(tw.souls.length,1);assert.ok(s.enemies[0].hp<10000);
 const choir=c.data.towerDefinition(tw),keeper=c.data.towerDefinition({type:'necromancer',branch:'soulKeeper',finalUpgrade:'soulLord'});
 assert.ok(keeper.soulDamage>choir.soulDamage);assert.ok(choir.soulLimit*choir.soulDamage>keeper.soulLimit*keeper.soulDamage*1.3);
 c.combat.step(s,[{tw,pos:{x:0,y:0}}],c.data.TOWERS,0,12000);assert.equal(tw.souls.length,0);
});
test('old building purchase amounts and income survive restore; upgrades charge new costs only',()=>{
 const c=load(),r=c.runtime.create({seed:'legacy',runId:'legacy',loadout:['archer','catapult','chain','freeze','mine']}),s=r.state;
 Object.assign(s,{phase:'build',gold:500,income:8});
 s.map.get('0,0').buildings=[{type:'house',level:3,paid:135},{type:'forge',level:1,paid:40}];s.map.get('0,0').buildingSlots=2;
 s.map.get('0,0').towers=[{type:'archer',supportDamage:1.2,paid:25}];
 const restored=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(s,r.random)))).state;
 assert.equal(restored.gold,500);assert.equal(restored.income,8);assert.equal(restored.map.get('0,0').buildings[0].paid,135);
 assert.equal(restored.map.get('0,0').towers[0].supportDamage,1.15);
 assert.ok(c.buildings.upgrade(restored,{q:0,r:0,index:1}));assert.equal(restored.gold,465);assert.equal(restored.map.get('0,0').buildings[1].paid,75);
 const house=c.buildings.nextUpgrade(restored,{type:'house',level:1});assert.equal(house.cost/(house.income-3),15);
 assert.equal(c.buildings.definition({type:'market',level:3}).discount,.65);
});
