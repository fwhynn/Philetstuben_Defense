const {test}=require('node:test'),assert=require('node:assert/strict');
const loadCore=require('../headless-core.cjs'),{load}=require('./helpers/game.cjs');
const prices=[25,45,40,30,35];
function oldPrices(buildings,map){return prices.map(base=>{let best=Infinity;for(const tile of map.values())if(Array.from({length:tile.slots},(_,i)=>tile.towers[i]).some(t=>!t))best=Math.min(best,buildings.cost({map},tile,base));return best;});}
test('shared quick-build discount matches original prices across occupancy, upgrades and remote markets',()=>{
  const {buildings}=loadCore();
  for(let seed=0;seed<100;seed++){
    const map=new Map(Array.from({length:20},(_,i)=>[i+',0',{q:i,r:0,slots:2,towers:[(i+seed)%3?null:{type:'archer'},(i+seed)%4?{type:'mine'}:null],buildings:i%4===0?[{type:['market','forge','house'][(i+seed)%3],level:1+(i+seed)%3,special:true,target:((i+seed+7)%20)+',0'}]:[]} ]));
    assert.deepEqual(prices.map(base=>Math.ceil(base*buildings.freeSlotDiscount(map))),oldPrices(buildings,map));
    for(const tile of map.values())tile.towers=[{},{}];assert.equal(buildings.freeSlotDiscount(map),Infinity);
  }
});
test('quick-build pricing traverses the map twice instead of scanning it separately for every offer and slot',()=>{
  const {buildings}=loadCore(),map=new Map(Array.from({length:60},(_,q)=>[q+',0',{q,r:0,slots:1,towers:[null],buildings:q%10===0?[{type:'market',level:1}]:[]}]));
  const values=map.values.bind(map);let visits=0;map.values=function*(){for(const tile of values()){visits++;yield tile;}};
  const expected=oldPrices(buildings,map),before=visits;visits=0;
  const discount=buildings.freeSlotDiscount(map),actual=prices.map(base=>Math.ceil(base*discount));
  assert.deepEqual(actual,expected);assert.equal(before,18300);assert.equal(visits,120);
});
test('quick buttons immediately follow gold, occupied slots and market target changes',()=>{
  const {a,elements}=load(),s=a.state;
  s.phase='build';s.gold=19;s.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[null],buildings:[]});
  const market={type:'market',level:3,special:true,target:'1,0'};s.map.set('8,0',{q:8,r:0,type:'empty',roads:[],slots:0,towers:[],buildings:[market]});
  a.renderAll();const button=elements.get('quickLoadout').children[0];
  assert.match(button._priceLabel,/19/);assert.equal(button.disabled,false);
  s.gold=18;a.renderAll();assert.equal(button.disabled,true);
  s.gold=25;market.target='8,0';a.renderAll();assert.match(button._priceLabel,/25/);assert.equal(button.disabled,false);
  s.map.get('1,0').towers[0]={type:'archer',lastShot:0};a.renderAll();assert.equal(button.disabled,true);assert.match(button.title,/Kein freier Turmplatz/);
  s.map.get('1,0').towers[0]=null;a.renderAll();assert.equal(button.disabled,false);
});
