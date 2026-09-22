const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs');
const day='2026-09-22';
function complete(a,wave){Object.assign(a.state,{wave,phase:'wave',waveRunning:true,pendingSpawns:0,spawnQueue:[],enemies:[]});a.endWave();}
test('daily victory pays once, resumes into rewards and keeps the same run and rules',()=>{
  const {a,elements,storage}=load();a.newRun(undefined,undefined,undefined,day);
  const id=a.state.runId,map=a.state.map,deck=a.state.deck,oldGold=a.state.gold;
  complete(a,20);assert.equal(a.state.phase,'victory');assert.equal(a.state.challengeWon,true);
  assert.equal(a.state.gold,oldGold+10+a.state.income);
  let profile=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(profile.diamonds,10);assert.equal(profile.dailyResults[day].best,20);assert.deepEqual(profile.milestones,[]);
  elements.get('endlessBtn').listeners.click();assert.equal(a.state.endless,true);assert.equal(a.state.phase,'reward');
  assert.equal(a.state.runId,id);assert.equal(a.state.map,map);assert.equal(a.state.deck,deck);assert.equal(a.state.challengeDay,day);
  elements.get('endlessBtn').listeners.click();assert.equal(a.state.phase,'reward');
  elements.get('rewardChoices').children[0].listeners.click();assert.ok(['place','build'].includes(a.state.phase));
  complete(a,21);assert.notEqual(a.state.phase,'victory');
  Object.assign(a.state,{wave:22,hp:0,waveRunning:true,pendingSpawns:1});a.update(.01,1);
  profile=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(profile.diamonds,10);assert.equal(profile.dailyResults[day].best,21);
  assert.match(elements.get('gameOverResult').textContent,/Endlosmodus/);
});
test('daily victory restore and menu exit cannot duplicate payout or unlock the campaign',()=>{
  const {a,elements,storage}=load();a.newRun(undefined,undefined,undefined,day);complete(a,20);
  a.restoreRunCheckpoint(JSON.parse(JSON.stringify(a.captureRunCheckpoint())));
  assert.equal(a.state.phase,'victory');assert.equal(elements.get('campaignVictory').classList.contains('hidden'),false);
  elements.get('victoryMenuBtn').listeners.click();
  let profile=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(profile.diamonds,10);assert.deepEqual(profile.milestones,[]);
  a.newRun(undefined,undefined,undefined,day);complete(a,20);elements.get('endlessBtn').listeners.click();complete(a,35);
  assert.notEqual(a.state.phase,'victory');profile=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(profile.diamonds,10);assert.deepEqual(profile.milestones,[]);
});
test('failed daily wave 20 gives no victory or reward',()=>{
  const {a,elements,storage}=load();a.newRun(undefined,undefined,undefined,day);
  Object.assign(a.state,{wave:20,lastCompletedWave:19,hp:0,waveRunning:true,pendingSpawns:1});a.update(.01,1);
  assert.equal(a.state.phase,'gameover');assert.ok(!a.state.challengeWon);assert.equal(JSON.parse(storage.get('hex-bastion-profile-v1')).diamonds,0);
  elements.get('endlessBtn').listeners.click();assert.equal(a.state.phase,'gameover');
});
