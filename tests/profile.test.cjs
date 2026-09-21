const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
test('live diamond forecast equals settlement without writing the profile',()=>{
  const {profile,definitions,storage}=setup(),data=profile.defaults();data.records.highestWave=10;
  const summary={runId:'forecast',wave:21,periodicBosses:2,explorationBosses:1};
  const before=JSON.stringify(data),reward=profile.runReward(data,summary);
  assert.equal(reward.total,25);assert.equal(JSON.stringify(data),before);assert.equal(storage.size,0);
  assert.equal(profile.settleRun(data,summary,definitions).reward.total,reward.total);
});
function setup(value){
  const storage=new Map();if(value!==undefined)storage.set('hex-bastion-profile-v1',value);
  const context={localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,item)=>storage.set(key,String(item))}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../classes/profile.js'),'utf8')+';globalThis.profile=HexProfile;',context);
  const definitions={archer:{},catapult:{},chain:{},freeze:{},mine:{},necro:{},ballista:{},flame:{}};
  return {profile:context.profile,definitions,storage};
}
test('new profile starts with five unique towers and a complete loadout',()=>{
  const {profile,definitions}=setup(),data=profile.load(definitions);
  assert.deepEqual(Array.from(data.unlockedTowers),['archer','catapult','chain','freeze','mine']);
  assert.deepEqual(Array.from(data.activeLoadout),['archer','catapult','chain','freeze','mine']);
});
test('profile repair removes duplicates, unknown towers and fills missing slots safely',()=>{
  const raw=JSON.stringify({diamonds:-9,unlockedTowers:['archer','archer','hacker'],activeLoadout:['hacker','archer']});
  const {profile,definitions}=setup(raw),data=profile.load(definitions);
  assert.equal(data.diamonds,0);assert.equal(data.unlockedTowers.length,5);assert.equal(new Set(data.activeLoadout).size,5);
  assert.ok(data.activeLoadout.every(id=>data.unlockedTowers.includes(id)));
});
test('loadout requires five unlocked unique known towers and persists valid choices',()=>{
  const {profile,definitions,storage}=setup(),data=profile.load(definitions);data.unlockedTowers.push('necro');
  assert.equal(profile.setLoadout(data,['archer','archer','chain','freeze','mine'],definitions),null);
  assert.equal(profile.setLoadout(data,['archer','catapult','chain','mine','necro'],definitions).activeLoadout[4],'necro');
  assert.match(storage.get(profile.STORAGE_KEY),/necro/);
});
test('run settlement pays waves, both boss kinds and new ten-wave milestones exactly once',()=>{
  const {profile,definitions}=setup(),data=profile.load(definitions),summary={runId:'run-1',wave:23,periodicBosses:2,explorationBosses:1,normalKills:99};
  const first=profile.settleRun(data,summary,definitions);
  assert.deepEqual({...first.reward},{wave:11,bosses:13,milestones:4,total:28,duplicate:false});
  assert.equal(first.profile.diamonds,28);assert.equal(first.profile.records.highestWave,23);assert.equal(first.profile.records.bossesKilled,3);assert.equal(first.profile.lifetime.normalKills,99);
  const duplicate=profile.settleRun(first.profile,summary,definitions);assert.equal(duplicate.reward.total,0);assert.equal(duplicate.reward.duplicate,true);assert.equal(duplicate.profile.diamonds,28);
});
test('short abandoned runs give no diamonds and old milestones are not paid again',()=>{
  const {profile,definitions}=setup();let data=profile.load(definitions);
  let result=profile.settleRun(data,{runId:'short',wave:1},definitions);assert.equal(result.reward.total,0);assert.equal(result.profile.records.runsPlayed,1);
  result=profile.settleRun(result.profile,{runId:'record',wave:20},definitions);assert.equal(result.reward.milestones,4);
  result=profile.settleRun(result.profile,{runId:'lower',wave:15},definitions);assert.equal(result.reward.milestones,0);
});
test('arsenal unlock spends diamonds once and adds a sixth loadout choice',()=>{
  const {profile,definitions}=setup();let data=profile.load(definitions);data.diamonds=30;
  const unlocked=profile.unlockTower(data,'ballista',definitions);assert.equal(unlocked.diamonds,10);assert.ok(unlocked.unlockedTowers.includes('ballista'));assert.ok(unlocked.unlocks.includes('tower:ballista'));
  assert.equal(profile.unlockTower(unlocked,'ballista',definitions),null);assert.equal(profile.unlockTower(unlocked,'necro',definitions),null);assert.equal(profile.unlockTower(unlocked,'flame',definitions),null);
  const loadout=profile.setLoadout(unlocked,['archer','catapult','chain','mine','ballista'],definitions);assert.ok(loadout);assert.equal(loadout.activeLoadout.length,5);
});
test('three loadout presets persist valid five-tower selections',()=>{
  const {profile,definitions}=setup();let data=profile.load(definitions);assert.equal(data.loadoutPresets.length,3);data.unlockedTowers.push('ballista');
  const saved=profile.savePreset(data,1,['archer','catapult','chain','mine','ballista'],definitions);assert.deepEqual(Array.from(saved.loadoutPresets[1].towers),['archer','catapult','chain','mine','ballista']);assert.equal(profile.savePreset(saved,3,saved.activeLoadout,definitions),null);
});
test('ultimate unlocks require tower ownership, spend diamonds once and persist',()=>{
  const {profile,definitions}=setup();let data=profile.load(definitions);data.diamonds=50;
  const unlocked=profile.unlockUltimate(data,'archer',definitions);assert.equal(unlocked.diamonds,30);assert.ok(unlocked.unlocks.includes('ultimate:archer'));assert.equal(profile.unlockUltimate(unlocked,'archer',definitions),null);assert.equal(profile.unlockUltimate(unlocked,'ballista',definitions),null);
});
test('settled runs aggregate local tower usage statistics',()=>{
  const {profile,definitions}=setup();const data=profile.load(definitions),first=profile.settleRun(data,{runId:'stats-1',wave:12,towers:{archer:{builds:3,upgrades:4},mine:{builds:1,upgrades:2}}},definitions).profile;
  const second=profile.settleRun(first,{runId:'stats-2',wave:8,towers:{archer:{builds:1,upgrades:1}}},definitions).profile;assert.deepEqual({...second.lifetime.towers.archer},{builds:4,upgrades:5,runsUsed:2,highestWave:12});assert.equal(second.lifetime.towers.mine.runsUsed,1);
});

test('building special unlocks persist and reject duplicates or insufficient diamonds',()=>{
  const {profile,definitions}=setup();let p=profile.defaults();assert.equal(profile.unlockBuilding(p,'forge',definitions),null);p.diamonds=100;p=profile.unlockBuilding(p,'forge',definitions);assert.equal(p.diamonds,60);assert.ok(profile.load(definitions).unlocks.includes('building:forge'));assert.equal(profile.unlockBuilding(p,'forge',definitions),null);p=profile.unlockBuilding(p,'market',definitions);assert.equal(p.diamonds,20);assert.equal(profile.unlockBuilding(p,'unknown',definitions),null);
});

test('reset refunds purchased meta once, repairs loadouts and preserves records and earnings',()=>{
  const {profile,definitions}=setup();let p=profile.defaults();p.diamonds=200;p.records.highestWave=25;p.lifetime.diamondsEarned=200;
  p=profile.unlockTower(p,'ballista',definitions);p=profile.unlockUltimate(p,'archer',definitions);p=profile.unlockBuilding(p,'house',definitions);assert.equal(p.diamonds,120);assert.equal(profile.resetValue(p),80);
  p.activeLoadout=['ballista','archer','catapult','chain','freeze'];const result=profile.resetUnlocks(p,definitions);assert.equal(result.refund,80);assert.equal(result.profile.diamonds,200);assert.equal(result.profile.records.highestWave,25);assert.equal(result.profile.lifetime.diamondsEarned,200);assert.ok(!result.profile.unlockedTowers.includes('ballista'));assert.deepEqual(Array.from(result.profile.activeLoadout),Array.from(profile.START_TOWERS));assert.equal(profile.resetUnlocks(result.profile,definitions).refund,0);
});

test('profile file transfers diamonds, unlock costs, presets and settlement receipts without merging',()=>{
 const {profile:p,definitions:d,storage}=setup();let source=p.defaults();source.diamonds=321;source.unlockCosts={'tower:flame':35};source.unlockedTowers.push('flame');source.unlocks=['tower:flame'];source.settledRuns=['paid-run'];source.loadoutPresets[0].name='<b>Mein Deck</b>';source.dailyResults={'2026-09-21':{best:20,won:true}};
 const file=p.exportFile(source,d),before=p.save({...p.defaults(),diamonds:7},d),old=storage.get(p.STORAGE_KEY);
 const preview=p.readFile(file,d);assert.equal(preview.diamonds,321);assert.equal(storage.get(p.STORAGE_KEY),old);
 const result=p.importFile(file,d);assert.equal(result.diamonds,321);assert.equal(result.unlockCosts['tower:flame'],35);assert.equal(result.loadoutPresets[0].name,source.loadoutPresets[0].name);assert.equal(result.dailyResults['2026-09-21'].won,true);assert.equal(storage.get(p.STORAGE_KEY+'-before-import'),old);
 assert.equal(p.settleRun(result,{runId:'paid-run',wave:10},d).reward.duplicate,true);
});
test('invalid profile files never overwrite the previous profile',()=>{
 const {profile:p,definitions:d,storage}=setup();p.save({...p.defaults(),diamonds:55},d);const before=storage.get(p.STORAGE_KEY),good=JSON.parse(p.exportFile(p.defaults(),d));
 const bad=[{}, {...good,version:99}, {...good,profile:{...good.profile,diamonds:-1}}, {...good,profile:{...good.profile,records:{highestWave:'oops'}}}, {...good,profile:{...good.profile,loadoutPresets:[{name:'x',towers:null}]}}];
 for(const file of bad){assert.throws(()=>p.importFile(JSON.stringify(file),d));assert.equal(storage.get(p.STORAGE_KEY),before);}
 assert.throws(()=>p.readFile('{"__proto__":{}}',d));assert.throws(()=>p.readFile('x'.repeat(2000001),d));
});
test('profile import reports storage failures and keeps previous data when backup fails',()=>{
 const {profile:p,definitions:d}=setup();const context={localStorage:{getItem:()=>'{"diamonds":9}',setItem(){throw new Error('storage full');}}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../classes/profile.js'),'utf8')+';globalThis.p=HexProfile;',context);
 assert.throws(()=>context.p.importFile(p.exportFile(p.defaults(),d),d),/storage full/);
});
