'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),loadCore=require('../headless-core.cjs'),reference=require('../scripts/duo-load-reference.cjs'),{fixture}=require('../scripts/duo-load.cjs');
function referenceCore(){
 const module={exports:{}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'headless-core.cjs'),'utf8'),{module,__dirname:root,require:name=>name==='node:fs'?{...fs,readFileSync(file,...args){const source=fs.readFileSync(file,...args);return file===path.join(root,'classes/combat.js')?reference(source):source;}}:require(name)});
 return module.exports();
}
for(const scenario of ['load fixture','mixed towers and priorities','spores, shields and split deaths'])test('range-first targeting preserves every checkpoint: '+scenario,()=>{
 const next=loadCore(),old=referenceCore(),match=next.duo.restore(fixture(1).snapshot.rooms[0].room.match);
 if(scenario!=='load fixture')for(const {state:s}of match.boards){
  const types=Object.keys(next.data.TOWERS),priorities=['closestBase','furthestBase','mostHealth','leastHealth','mostArmor','mostMagic','closestTower','furthestTower','boss','healer'];let i=0;
  for(const tile of s.map.values())for(const tower of tile.towers||[])if(tower){tower.type=types[i%types.length];tower.targetPriority=[priorities[i%priorities.length],'closestBase'];tower.lastShot=0;i++;}
  if(scenario.startsWith('spores'))s.enemies.forEach((e,i)=>{if(i%4===0){e.type='mushroomColossus';e.hp=1;e.armorHp=e.magicHp=0;}if(i%4===1)e.shieldHits=2;if(i%4===2){e.splitOnDeath=true;e.hp=1;e.armorHp=e.magicHp=0;}});
 }
 const checkpoint=next.duo.capture(match),expected=old.duo.restore(checkpoint);
 for(let tick=0;tick<200;tick++){
  next.duo.tick(match);old.duo.tick(expected);
  // Includes RNG, projectile order, target/aim, pools, gold, all transient state.
  if(tick%20===19)assert.equal(JSON.stringify(next.duo.capture(match)),JSON.stringify(old.duo.capture(expected)),'tick '+tick);
 }
});
