const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs');
test('Play opens a mode choice without starting a run; standard opens preparation and daily starts separately',()=>{
  const {a,elements}=load();const initial=a.state;
  elements.get('menuPlayBtn').listeners.click();assert.equal(a.state,initial);
  elements.get('standardModeBtn').listeners.click();assert.equal(a.state,initial);assert.equal(elements.get('difficultyChoices').children.length,2);
  elements.get('confirmLoadoutBtn').listeners.click();assert.notEqual(a.state,initial);assert.equal(a.state.challengeDay,null);
  const normal=a.state;elements.get('menuPlayBtn').listeners.click();elements.get('dailyModeBtn').listeners.click();assert.equal(a.state,normal);
  elements.get('dailyStartBtn').listeners.click();assert.ok(a.state.challengeDay);
});
test('daily uses fixed seeded conditions and lends towers without changing profile ownership',()=>{
  const {a,elements,storage,selectSlot,buyTower,data}=load();
  elements.get('dailyStartBtn').listeners.click();const seed=a.state.seed,hand=[...a.state.hand],exits=[...a.state.baseExits];
  assert.equal(a.state.deck.length,5);assert.ok(a.state.deck.includes('treasury'));assert.equal(a.state.heroId,'standard');assert.equal(a.state.ultimateUnlocks.length,0);
  assert.ok(a.state.towerLoadout.includes('ballista'));elements.get('retryLoadoutBtn').listeners.click();assert.equal(a.state.seed,seed);assert.deepEqual([...a.state.hand],hand);assert.deepEqual([...a.state.baseExits],exits);
  a.state.phase='build';a.state.gold=100;a.state.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[null]});selectSlot(1,0,0);buyTower('ballista');assert.equal(data.towerDefinition(a.state.map.get('1,0').towers[0]).range,200);
  a.state.wave=20;a.endWave();let profile=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(profile.diamonds,10);assert.ok(!profile.unlockedTowers.includes('ballista'));assert.equal(profile.records.highestWave,0);assert.equal(a.state.phase,'gameover');
  elements.get('retryLoadoutBtn').listeners.click();a.state.wave=20;a.endWave();profile=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(profile.diamonds,10);
  a.newRun();assert.equal(a.state.challengeDay,null);assert.ok(!a.state.towerLoadout.includes('ballista'));
});
test('every tenth enemy across waves carries gold and the storm affects normal enemies and bosses',()=>{
  const {waves}=load();let total=0,carriers=0;
  for(let w=1;w<=20;w++){const normal=waves.plan(w),daily=waves.plan(w,0,true);
    daily.enemies.forEach((e,i)=>{total++;assert.equal(!!e.caravan,total%10===0);assert.equal(e.speed,normal.enemies[i].speed*.85);if(e.caravan){carriers++;assert.equal(e.killGold,18);assert.equal(e.goldLoss,10);}});
    assert.equal(daily.killGold,daily.enemies.reduce((sum,e)=>sum+(e.killGold||3),0));if(daily.boss)assert.equal(daily.boss.speed,normal.boss.speed*.85);
  }
  assert.equal(carriers,Math.floor(total/10));
});
