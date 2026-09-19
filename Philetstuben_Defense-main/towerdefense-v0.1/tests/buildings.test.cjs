const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
test('houses require a free building slot and gold and add recurring income once',()=>{
  const context={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../buildings.js'),'utf8')+';globalThis.buy=HexBuildings.buy;',context);
  const state={phase:'build',hp:20,gold:70,income:2,map:new Map([['1,0',{buildingSlots:1,buildings:[null]}]])},slot={q:1,r:0,index:0};
  assert.equal(context.buy(state,slot,'house'),true);assert.equal(state.gold,40);assert.equal(state.income,5);
  assert.equal(context.buy(state,slot,'house'),false);assert.equal(state.gold,40);assert.equal(state.income,5);
  assert.equal(context.buy(state,{q:1,r:0,index:1},'house'),false);
  state.map.set('2,0',{buildingSlots:1,buildings:[null]});state.phase='wave';state.gold=29;assert.equal(context.buy(state,{q:2,r:0,index:0},'house'),false);
  state.gold=30;assert.equal(context.buy(state,{q:2,r:0,index:0},'house'),true);assert.equal(state.income,8);
});

test('forge and market affect only the same or adjacent hexes and do not stack',()=>{
  const context={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../buildings.js'),'utf8')+';globalThis.rules=HexBuildings;',context);
  const map=new Map([['0,0',{q:0,r:0,buildings:[{type:'forge'},{type:'market'}]}],['0,1',{q:0,r:1,buildings:[{type:'forge'},{type:'market'}]}]]);
  const nearby=context.rules.effects(map,{q:1,r:0});assert.equal(nearby.damage,1.2);assert.equal(nearby.discount,.85);
  const far=context.rules.effects(map,{q:3,r:0});assert.equal(far.damage,1);assert.equal(far.discount,1);
  assert.equal(context.rules.cost({map},{q:1,r:0},25),22);assert.equal(context.rules.cost({map},{q:1,r:0},35),30);
});
test('a forge refreshes existing tower bonuses without adding passive income',()=>{
  const context={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../buildings.js'),'utf8')+';globalThis.rules=HexBuildings;',context);
  const tower={type:'archer'},state={hp:20,phase:'build',gold:70,income:2,map:new Map([['0,0',{q:0,r:0,buildingSlots:1,buildings:[null],towers:[]}],['1,0',{q:1,r:0,towers:[tower]}]])};
  assert.ok(context.rules.buy(state,{q:0,r:0,index:0},'forge'));assert.equal(tower.supportDamage,1.2);assert.equal(state.income,2);assert.equal(state.gold,30);
});
