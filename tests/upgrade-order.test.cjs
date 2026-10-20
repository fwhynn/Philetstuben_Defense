const {test}=require('node:test'),assert=require('node:assert/strict'),load=require('../headless-core.cjs');
test('group-oriented upgrades precede focused branches without changing path progression',()=>{
  const {data}=load();
  for(const [type,expected] of Object.entries({archer:['volley','marksman'],catapult:['barrage','siege'],chain:['storm','overload'],freeze:['frostField','deepFrost'],mine:['minefield','demolition'],flame:['inferno','wildfire'],necromancer:['soulChoir','soulKeeper'],element:['elementFire','elementWind','elementWater']})){
    assert.deepEqual(Array.from(data.availableUpgrades({type}),([id])=>id),expected);
    for(const branch of expected){const next=data.availableUpgrades({type,branch});assert.equal(next.length,1);assert.equal(next[0][1].requires,branch);assert.equal(data.availableUpgrades({type,branch,finalUpgrade:next[0][0]}).length,0);}
  }
});
