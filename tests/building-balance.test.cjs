const {test}=require('node:test'),assert=require('node:assert/strict'),load=require('../headless-core.cjs');
function setup(){const c=load(),run=c.runtime.create({seed:'building-balance',runId:'building-balance',loadout:['archer','catapult','chain','freeze','mine']});const s=run.state;s.phase='build';s.gold=10000;s.income=0;s.buildingUnlocks=['building:market','building:house','building:forge'];const base=s.map.get('0,0');base.buildingSlots=4;base.buildings=[null,null,null,null];s.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:4,towers:[null,null,null,null],buildings:[]});return {c,s,run,base,slot:{q:0,r:0,index:0},tower:{q:1,r:0,index:0}};}
test('market grants discounts only on successful purchases, avoids free rental, survives save/load',()=>{
 const {c,s,run,base,slot,tower}=setup();assert.ok(c.buildings.buy(s,slot,'market'));const market=base.buildings[0];
 for(let i=0;i<5;i++)c.buildings.cost(s,tower,25);assert.equal(market.discountGranted,undefined);
 const gold=s.gold;s.gold=0;assert.equal(c.towers.buy(s,'archer',[tower]).ok,false);assert.equal(market.discountGranted,undefined);s.gold=gold;
 assert.ok(c.towers.buy(s,'archer',[tower]).ok);assert.equal(market.discountGranted,3);assert.equal(c.buildings.refund(s,market).amount,32);
 assert.ok(c.towers.upgrade(s,tower,'volley'));assert.equal(market.discountGranted,8);
 assert.equal(c.towers.upgrade(s,tower,'volley'),false);assert.equal(market.discountGranted,8);
 const restored=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(s,run.random)))).state;
 assert.equal(restored.map.get('0,0').buildings[0].discountGranted,8);assert.equal(c.buildings.refund(restored,restored.map.get('0,0').buildings[0]).amount,27);
 const before=restored.gold;assert.ok(c.buildings.sell(restored,slot));assert.equal(restored.gold,before+27);assert.equal(c.buildings.sell(restored,slot),false);
});
test('overlapping markets attribute savings once to the strongest; sale never pays negative gold',()=>{
 const {c,s,base,slot,tower}=setup();c.buildings.buy(s,slot,'market');s.map.set('1,-1',{q:1,r:-1,buildingSlots:1,buildings:[null],towers:[]});const other={q:1,r:-1,index:0};c.buildings.buy(s,other,'market');c.buildings.upgrade(s,other);c.buildings.upgrade(s,other);
 const strong=s.map.get('1,-1').buildings[0];assert.ok(c.towers.buy(s,'mine',[tower]).ok);assert.equal(base.buildings[0].discountGranted,undefined);assert.equal(strong.discountGranted,12);
 for(let i=0;i<10;i++)c.buildings.recordDiscount(s,tower,100,65);
 assert.equal(c.buildings.refund(s,strong).amount,0);assert.equal(c.buildings.refund(s,base.buildings[0]).amount,35);
});
test('patrician network is capped, selling and repeated refresh reconcile income',()=>{
 const {c,s,base}=setup();for(let i=0;i<4;i++){const slot={q:0,r:0,index:i};c.buildings.buy(s,slot,'house');for(let j=0;j<3;j++)c.buildings.upgrade(s,slot);}
 assert.equal(s.income,80);c.buildings.refresh(s);assert.equal(s.income,80);assert.equal(c.buildings.definition(base.buildings[0],s).income,20);
 c.buildings.sell(s,{q:0,r:0,index:3});assert.equal(s.income,60);c.buildings.sell(s,{q:0,r:0,index:2});assert.equal(s.income,36);
 // A previous snapshot can contain the former uncapped network bonus.
 s.income=100;s.patricianBonusIncome=68;c.buildings.refresh(s);assert.equal(s.income,36);
});
test('max normal market pays back with two full mine investments; forge remains instant combat support',()=>{
 const {c,s,base,slot,tower}=setup();c.buildings.buy(s,slot,'market');c.buildings.upgrade(s,slot);c.buildings.upgrade(s,slot);
 const prices=[35,40,65,105],saved=prices.reduce((n,p)=>n+p-c.buildings.cost(s,tower,p),0);
 assert.equal(saved,84);assert.ok(2*saved>base.buildings[0].paid);assert.equal(base.buildings[0].paid,115);
 base.buildings[0]={type:'forge',level:3,paid:135};c.buildings.refresh(s);assert.equal(c.buildings.effects(s.map,tower).damage,1.3);
});
