const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function load(){const c={};for(const name of ['biomes','data','map','waves','combat'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../'+name+'.js'),'utf8'),c);return vm.runInNewContext('({biomes:HexBiomes,data:HexData,map:HexMap,combat:HexCombat})',c);}
test('seeded biome regions preserve the grassland start and reveal all three types independently of visit order',()=>{
  const {biomes:b,map}=load(),cells=[];for(let q=-8;q<=8;q++)for(let r=-8;r<=8;r++)cells.push({q,r});
  const first=new Map(cells.map(p=>[p.q+','+p.r,b.at('world',p.q,p.r)]));assert.equal(new Set(first.values()).size,4);
  for(const p of cells.reverse()){
    assert.equal(b.at('world',p.q,p.r),first.get(p.q+','+p.r));
    if(Math.max(Math.abs(p.q),Math.abs(p.r),Math.abs(p.q+p.r))<=2)assert.equal(b.at('world',p.q,p.r),'grass');
    const world=map.axialToWorld(p.q,p.r);assert.equal(b.atWorld({biomeSeed:'world'},world.x,world.y),b.at('world',p.q,p.r));
    assert.equal(b.forTile({biomeSeed:'world',challengeDay:'2026-09-20'},p),'grass');
  }
  assert.ok(cells.some(p=>b.at('world',p.q,p.r)!==b.at('another',p.q,p.r)));
});
test('biome tower modifiers compose with upgrades and do not mutate definitions',()=>{
  const {data:d}=load(),def=(type,biome,extra={})=>d.towerDefinition({type,biome,...extra});
  assert.equal(def('archer','desert').range,128);assert.equal(def('archer','grass').range,150);
  assert.equal(def('chain','storm').jumpRange,93.75);assert.equal(def('element','storm',{branch:'elementWind',finalUpgrade:'elementTempest'}).pierceTargets,6);
  assert.equal(def('ballista','storm').cooldown,1.9/.85);
  assert.equal(def('element','ash',{branch:'elementFire'}).damage,24);
  assert.equal(def('element','ash',{branch:'elementWater'}).slowDuration,1.5);
  assert.equal(def('freeze','ash').range,123);assert.equal(d.TOWERS.freeze.range,145);
  assert.equal(def('archer','desert',{tileType:'signalCross'}).range,153);
});
test('desert movement slow is local and ends when an enemy leaves the biome',()=>{
  const {biomes:b,map,combat,data}=load();let cell;
  for(let q=-5;q<=5;q++)for(let r=-5;r<=5;r++)if(b.at('world',q,r)==='desert')cell={q,r};
  const p=map.axialToWorld(cell.q,cell.r),e={x:p.x,y:p.y,hp:100,alive:true,index:0,t:0,speed:10,points:[p,{x:p.x+500,y:p.y}]};
  const state={biomeSeed:'world',hp:20,gold:0,goldEarned:{kills:0},waveKills:0,enemies:[e],projectiles:[]};
  combat.step(state,[],data.TOWERS,.1,100);assert.ok(Math.abs(e.x-p.x-.85)<1e-8);
  Object.assign(e,{x:0,y:0,index:0,t:0,points:[{x:0,y:0},{x:100,y:0}]});
  combat.step(state,[],data.TOWERS,.1,200);assert.equal(e.x,1);
});
