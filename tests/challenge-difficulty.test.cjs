const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../headless-core.cjs'),{load}=require('./helpers/game.cjs');
const json=x=>JSON.parse(JSON.stringify(x));
test('late draft and fortress pressure grows smoothly without extra gold, speed or tougher opening waves',()=>{
 const c=core();
 for(const kind of ['towerDraft','movingFortress'])for(let wave=1;wave<=12;wave++){
  const normal=c.waves.plan(wave),p=c.waves.plan(wave,0,false,{challengeKind:kind}),factor=1+Math.max(0,wave-3)*(kind==='towerDraft'?.10:.08);
  assert.equal(p.count,normal.count);assert.equal(p.maxGold,normal.maxGold);assert.equal(p.wave,wave);
  for(let i=0;i<p.enemies.length;i++){assert.equal(p.enemies[i].speed,normal.enemies[i].speed);for(const field of ['hp','armorHp','magicHp'])if(normal.enemies[i][field])assert.equal(p.enemies[i][field],Math.ceil(normal.enemies[i][field]*factor));}
 }
});
test('village armor increase changes the actual armor health pool',()=>{
 const c=core(),p=c.waves.plan(4,0,false,{challengeKind:'villages'}),normal=c.waves.plan(5);
 assert.ok(p.enemies.some(e=>e.armorHp>0));for(let i=0;i<p.enemies.length;i++)if(normal.enemies[i].armorHp)assert.equal(p.enemies[i].armorHp,Math.ceil(normal.enemies[i].armorHp*1.25));
});
test('all practice missions expose the victory target and actionable rules',()=>{
 for(const id of ['greed','detour','villages','powerGrid','expedition','towerDraft','movingFortress','caravan','garrison']){
  const {a,elements}=load({labMission:id});a.renderAll();assert.ok(!elements.get('challengeGuide').classList.contains('hidden'));assert.match(elements.get('challengeGoal').textContent,new RegExp('0/'+a.state.challengeTarget));assert.ok(elements.get('challengeInstructions').textContent.length>80);
 }
 const {a,elements}=load();a.newRun();a.renderAll();assert.ok(elements.get('challengeGuide').classList.contains('hidden'));
});
test('underinvesting in upgrades loses the later fortress waves; checkpoint continuation stays identical',()=>{
 const c=core(),run=c.session.create({seed:'movingFortress-v1|2026-12-07',runId:'audit',challengeDay:'2026-12-07',loadout:['archer','catapult','chain','freeze','mine']}),s=run.state;
 const build=[['catapult',3,0],['freeze',4,0],['ballista',5,0],['archer',3,1],['mine',4,1],['catapult',5,1]];let previous=0;
 for(let wave=1;wave<=12;wave++){
  const f=s.movingFortress,g=f.stations[f.stage];if(f.stage!==previous){for(const [,n,index]of build){const old=f.stations[previous],from={q:old.q+n,r:old.r,index};if(s.map.get(from.q+','+from.r).towers[index])assert.ok(c.movingFortress.move(s,from,{q:g.q+n,r:g.r,index}));}previous=f.stage;}
  for(const [type,n,index]of build){const loc={q:g.q+n,r:g.r,index};if(!s.map.get(loc.q+','+loc.r).towers[index])c.towers.buy(s,type,[loc]);}
  assert.ok(c.flow.start(s,run.random));
  if(wave===7){c.runtime.advance(s,run.random,1);const saved=c.snapshot.restore(json(c.snapshot.capture(s,run.random)));for(let i=0;i<80;i++){c.runtime.advance(s,run.random,.05);c.runtime.advance(saved.state,saved.random,.05);}assert.deepEqual(json(s.enemies),json(saved.state.enemies));}
  let result,t=0;do{result=c.session.advance(s,run.random,.05);}while(result==='running'&&++t<20000);assert.ok(t<20000);if(result==='defeat')break;
 }
 assert.equal(s.phase,'gameover');assert.ok(s.wave>=7&&s.wave<=12);
});
