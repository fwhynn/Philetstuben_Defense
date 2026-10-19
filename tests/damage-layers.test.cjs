const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function combat(){const c={};for(const f of ['data','waves','combat'])vm.runInNewContext(fs.readFileSync(`classes/${f}.js`,'utf8').replace('return {step,durability,','return {damageEnemy,step,durability,'),c);return vm.runInNewContext('HexCombat',c);}
test('all damage types must exhaust MR before armor and life, including overflow',()=>{
  const api=combat();
  for(const multipliers of [{magic:1,armor:1,hp:1},{magic:.5,armor:2,hp:1},{magic:2,armor:.5,hp:1}]){
    const e={alive:true,hp:100,armorHp:20,magicHp:10},s={};
    api.damageEnemy(e,5/multipliers.magic,{damageMultipliers:multipliers},s);
    assert.equal(e.magicHp,5);assert.equal(e.armorHp,20);assert.equal(e.hp,100);
    api.damageEnemy(e,5/multipliers.magic+10/multipliers.armor,{damageMultipliers:multipliers},s);
    assert.equal(e.magicHp,0);assert.equal(e.armorHp,10);assert.equal(e.hp,100);
    api.damageEnemy(e,10/multipliers.armor+5,{damageMultipliers:multipliers},s);
    assert.equal(e.armorHp,0);assert.equal(e.hp,95);
  }
});
test('missing MR layer goes directly to armor',()=>{const e={alive:true,hp:100,armorHp:20};combat().damageEnemy(e,5,{},{});assert.equal(e.armorHp,15);assert.equal(e.hp,100);});
