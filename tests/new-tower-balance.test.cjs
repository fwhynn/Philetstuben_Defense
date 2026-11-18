const {test}=require('node:test'),assert=require('node:assert/strict'),{arena,makeTower}=require('../scripts/balance-new-towers.cjs');
const damage=(type,branch,count=1,kind='normal',duration=20)=>arena([makeTower(type,branch,4)],{stationary:true,count,kind,spacing:0,duration}).netDamage/duration;
test('charged laser and ballista occupy a comparable sustained boss-damage budget; ballista wins short exposure',()=>{
 const laser=makeTower('laser',0,4),ballista=makeTower('ballista',0,4),ratio=(damage('laser',0,1,'boss')/laser.paid)/(damage('ballista',0,1,'boss')/ballista.paid);
 assert.ok(ratio>.9&&ratio<1.2,ratio);
 assert.ok(damage('laser',0,1,'boss',3)<damage('ballista',0,1,'boss',3));
});
test('multi-laser trades single target strength for coverage with less combined peak output',()=>{
 const focus=damage('laser',0),singleSplit=damage('laser',1),fullSplit=damage('laser',1,3);
 assert.ok(singleSplit<focus*.4);assert.ok(fullSplit>focus*.65&&fullSplit<focus*.9);
});
test('poison paths retain distinct boss and group roles without stacking past three global doses',()=>{
 assert.ok(damage('poison',0,1,'boss')>damage('poison',1,1,'boss')*2);
 assert.ok(damage('poison',1,6)>damage('poison',0,6)*1.4);
 const one=arena([makeTower('poison',0,4)],{stationary:true,duration:20,count:1}).netDamage;
 const many=arena(Array(4).fill(makeTower('poison',0,4)),{stationary:true,duration:20,count:1}).netDamage;
 assert.ok(many<one*1.5,'more poison towers cannot quadruple capped single-target poison');
});
test('gamble risk has a bounded average gain over the safe branch across fixed independent seeds',()=>{
 const mean=branch=>Array.from({length:32},(_,i)=>arena([makeTower('gamble',branch,4)],{stationary:true,duration:20,count:1,seed:'luck-sample-'+i}).netDamage/20).reduce((a,b)=>a+b)/32;
 const safe=mean(0),risk=mean(1);assert.ok(safe>80&&safe<125);assert.ok(risk>safe&&risk<safe*1.3,JSON.stringify({safe,risk}));
});
