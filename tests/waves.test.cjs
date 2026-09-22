const {test}=require('node:test');
const assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs');
test('opening wave has five enemies and boss strength is shifted five waves later',()=>{
  const {waves}=load();assert.equal(waves.plan(1).count,5);assert.equal(waves.plan(2).count,9);
  assert.equal(waves.bossProfile(10),null);
  const first=waves.bossProfile(15);assert.equal(first.hp,1200);assert.equal(first.armorHp,720);assert.equal(first.magicHp,120);
  for(const wave of [15,25,35,45])assert.equal(waves.bossProfile(wave).hp,Math.round(1200*Math.pow((wave-5)/10,1.8)));
});
function prepare(wave,seed='boss-test'){
  const h=load();h.elements.get('runSeed').value=seed;h.a.newRun();
  h.a.state.map.set('1,0',{q:1,r:0,type:'fullCross',roads:[0,1,2,3,4,5],slots:0,towers:[]});
  h.a.state.wave=wave-1;h.a.state.phase='build';return h;
}
test('regular waves keep growing past the old cap and boss gold is forecast exactly once',()=>{
  const {waves}=load();
  for(const wave of [1,3,9,10,11,14,16,20,24,26,30])assert.equal(waves.plan(wave).boss,null);
  for(const wave of [15,25,35]){
    const p=waves.plan(wave,7);assert.ok(p.boss.hp>0);assert.equal(p.maxGold,p.killGold+10+7+50);
    assert.ok(waves.plan(wave+1).count>p.count);assert.ok(waves.plan(wave+1).hp>p.hp);
  }
  assert.ok(waves.plan(40).hp>waves.plan(20).hp*2);
});
test('wave 15 and every ten waves thereafter spawn one boss at a valid entrance with a route ending at base',()=>{
  for(const wave of [10,14,15,16,20,25,35]){
    const {a,waves}=prepare(wave),sources=a.spawnSources();a.startWave();a.startWave();
    const bosses=a.state.enemies.filter(e=>e.type==='boss');assert.equal(bosses.length,wave>=15&&(wave-15)%10===0?1:0);
    assert.equal(a.state.pendingSpawns,waves.plan(wave).count);
    if(bosses.length){const boss=bosses[0];assert.ok(sources.some(s=>s.points[0].x===boss.x&&s.points[0].y===boss.y));
      assert.equal(boss.landmarkId,'wave:'+wave);assert.equal(boss.points.at(-1).x,0);assert.equal(boss.points.at(-1).y,0);
      assert.equal(boss.hp,waves.plan(wave).boss.hp);
    }
  }
});
test('boss entrance repeats for a seed and varies across seeds',()=>{
  const positions=new Set();
  for(let i=0;i<20;i++){
    const pos=()=>{const {a}=prepare(15,'entrance-'+i);a.startWave();const e=a.state.enemies[0];return e.x+','+e.y;};
    const first=pos();assert.equal(pos(),first);positions.add(first);
  }
  assert.ok(positions.size>=4);
});
test('periodic and landmark bosses coexist; forecast accounts for both',()=>{
  const {a,elements}=prepare(15);
  a.state.landmarks.set('1,0',{q:1,r:0,type:'boss',status:'ready',claimed:true});a.renderAll();
  assert.match(elements.get('waveForecast').textContent,/Bosswelle/);
  assert.match(elements.get('goldForecast').textContent,/Maximal \+215 Gold/);
  a.startWave();assert.equal(a.state.enemies.filter(e=>e.type==='boss').length,2);
  assert.equal(a.state.landmarks.get('1,0').status,'fighting');
  a.newRun();assert.equal(a.state.enemies.length,0);assert.equal(a.state.bossRewards.length,0);
});
test('a defeated periodic boss grants gold and a working card reward only once',()=>{
  const {a,selectSlot,buyTower,elements}=prepare(15);
  const tile=a.state.map.get('1,0');tile.slots=1;tile.towers=[null];selectSlot(1,0,0);buyTower('chain');
  a.startWave();const boss=a.state.enemies[0];boss.hp=1;boss.armorHp=0;boss.magicHp=0;boss.speed=0;
  a.state.spawnQueue=[];a.state.pendingSpawns=0;
  const before=a.state.gold;a.update(0,0);
  assert.equal(a.state.gold,before+50+10);assert.equal(a.state.phase,'bossReward');assert.equal(a.state.goldEarned.boss,50);
  const deck=a.state.deck.length;elements.get('rewardChoices').children[0].listeners.click();
  assert.equal(a.state.deck.length,deck+1);assert.equal(a.state.phase,'place');
  a.update(0,0);assert.equal(a.state.goldEarned.boss,50);
});
