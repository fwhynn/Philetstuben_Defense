const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {load}=require('./helpers/game.cjs');
function rules(){const c={};for(const f of ['data.js','deck.js','buildings.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../classes',f),'utf8'),c);return vm.runInNewContext('({data:HexData,deck:HexDeck,buildings:HexBuildings})',c);}
test('every tower has exactly one exclusive tile; only validated run loadout tiles enter rewards',()=>{
  const {data,deck}=rules();for(const type of Object.keys(data.TOWERS)){
    const cards=Object.values(data.CARD_LIBRARY).filter(c=>c.requiredTower===type);assert.equal(cards.length,1,type);
    assert.ok(deck.forLoadout(data.CARD_LIBRARY,[type])[cards[0].id]);assert.equal(deck.forLoadout(data.CARD_LIBRARY,[])[cards[0].id],undefined);
  }
  const {a}=load();a.newRun(['archer','ballista','catapult','mine','freeze']);assert.ok(!a.state.towerLoadout.includes('ballista'));
  assert.equal(deck.forLoadout(data.CARD_LIBRARY,a.state.towerLoadout).ballistaRoad,undefined);
  a.newRun(undefined,undefined,undefined,'2026-09-21');assert.ok(deck.forLoadout(data.CARD_LIBRARY,a.state.towerLoadout).ballistaRoad);
});
test('exclusive bonuses apply to their tower, upgraded branches and necromancer spirits only',()=>{
  const {data}=rules();for(const c of Object.values(data.CARD_LIBRARY).filter(c=>c.towerBonus)){
    const type=c.requiredTower,base=data.towerDefinition({type}),buff=data.towerDefinition({type,tileType:c.id});
    if(c.towerBonus.range)assert.equal(buff.range,Math.round(base.range*1.25));else assert.equal(buff.damage,base.damage*1.25);
    const other=data.towerDefinition({type:'archer',tileType:c.id});assert.equal(other.damage,data.TOWERS.archer.damage);assert.equal(other.range,data.TOWERS.archer.range);
    for(const [branch] of data.availableUpgrades({type})){const plain=data.towerDefinition({type,branch}),boost=data.towerDefinition({type,branch,tileType:c.id});if(c.towerBonus.damage)assert.equal(boost.damage,plain.damage*1.25);}
  }
  assert.equal(data.towerDefinition({type:'necromancer',tileType:'soulFork'}).soulDamage,10);
});
test('building sale refunds only once and removes income, damage and discounts immediately',()=>{
  const {buildings}=rules(),slot={q:0,r:0,index:0};
  for(const type of ['house','forge','market']){
    const tile={q:0,r:0,buildingSlots:1,buildings:[null],towers:[{type:'archer'}]},s={map:new Map([['0,0',tile]]),hp:20,gold:100,income:2,wave:0,phase:'build',waveRunning:false};
    assert.ok(buildings.buy(s,slot,type));assert.equal(buildings.refund(s,tile.buildings[0]).percent,100);assert.ok(buildings.sell(s,slot));assert.equal(s.gold,100);assert.equal(s.income,2);assert.equal(tile.towers[0].supportDamage,1);assert.equal(buildings.cost(s,slot,100),100);assert.equal(buildings.sell(s,slot),false);
    buildings.buy(s,slot,type);s.wave=1;s.phase='wave';s.waveRunning=true;assert.equal(buildings.refund(s,tile.buildings[0]).percent,50);buildings.sell(s,slot);assert.equal(s.gold,100-Math.ceil(buildings.definitions[type].cost/2));
    s.gold=100;buildings.buy(s,slot,type);s.hp=0;s.phase='gameover';assert.equal(buildings.sell(s,slot),false);
  }
});

test('building upgrades charge once per level, update income and retain the correct refund',()=>{
  const {buildings}=rules(),slot={q:0,r:0,index:0};
  const tile={q:0,r:0,buildingSlots:1,buildings:[null]},s={hp:20,gold:300,income:2,phase:'build',wave:0,map:new Map([['0,0',tile]])};
  buildings.buy(s,slot,'house');assert.equal(s.income,5);buildings.upgrade(s,slot);assert.equal(s.income,7);buildings.upgrade(s,slot);assert.equal(s.income,10);assert.equal(s.gold,165);assert.equal(buildings.upgrade(s,slot),false);assert.equal(buildings.refund(s,tile.buildings[0]).amount,135);
  s.wave=1;assert.equal(buildings.refund(s,tile.buildings[0]).amount,67);buildings.sell(s,slot);assert.equal(s.income,2);
});
test('meta building upgrades affect exactly one remote hex and retargeting removes the old effect',()=>{
  const {buildings}=rules(),slot={q:0,r:0,index:0};
  for(const type of ['forge','market']){
    const source={q:0,r:0,buildingSlots:1,buildings:[null]},a={q:4,r:0,towers:[{type:'archer'}]},b={q:5,r:0,towers:[{type:'archer'}]},s={hp:20,gold:1000,income:0,wave:0,phase:'build',map:new Map([['0,0',source],['4,0',a],['5,0',b]])};
    buildings.buy(s,slot,type);buildings.upgrade(s,slot);buildings.upgrade(s,slot);assert.equal(buildings.upgrade(s,slot),false);
    s.buildingUnlocks=['building:'+type];assert.ok(buildings.upgrade(s,slot));assert.equal(buildings.upgrade(s,slot),false);assert.equal(buildings.setTarget(s,slot,'missing'),false);
    buildings.setTarget(s,slot,'4,0');assert.ok(buildings.highlight({...s,selectedBuilding:slot}).tiles.includes(a));
    assert.equal(type==='forge'?a.towers[0].supportDamage:buildings.cost(s,a,100),type==='forge'?1.3:75);
    buildings.setTarget(s,slot,'5,0');assert.equal(type==='forge'?a.towers[0].supportDamage:buildings.cost(s,a,100),type==='forge'?1:100);
    buildings.sell(s,slot);assert.equal(type==='forge'?b.towers[0].supportDamage:buildings.cost(s,b,100),type==='forge'?1:100);
  }
});
test('building unlocks are captured for a run and disabled in the fixed daily challenge',()=>{
  const {a}=load({initialProfile:{unlocks:['building:forge','building:market']}});assert.equal(a.state.buildingUnlocks.length,2);a.newRun(undefined,undefined,undefined,'2026-09-21');assert.equal(a.state.buildingUnlocks.length,0);
});

test('patrician house doubles only its own income and sale removes its complete bonus',()=>{
  const {buildings}=rules(),slot={q:0,r:0,index:0},tile={q:0,r:0,buildingSlots:1,buildings:[null]},s={hp:20,gold:1000,income:2,wave:0,phase:'build',buildingUnlocks:['building:house'],map:new Map([['0,0',tile]])};buildings.buy(s,slot,'house');buildings.upgrade(s,slot);buildings.upgrade(s,slot);assert.equal(s.income,10);buildings.upgrade(s,slot);assert.equal(s.income,18);assert.equal(s.gold,745);assert.equal(buildings.upgrade(s,slot),false);assert.equal(buildings.refund(s,tile.buildings[0]).amount,255);buildings.sell(s,slot);assert.equal(s.income,2);assert.equal(s.gold,1000);
});
