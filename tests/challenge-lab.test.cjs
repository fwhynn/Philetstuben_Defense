const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {load}=require('./helpers/game.cjs'),core=require('../headless-core.cjs');
function bootstrap(id,hash=''){
 const values=new Map([['hex-bastion-profile-v1','REAL PROFILE'],['autohex-solo-autosave-v1','REAL RUN']]);
 const context={location:{search:'?challenge-lab='+id,hash},URLSearchParams,localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}};
 vm.runInNewContext(fs.readFileSync('classes/challenge-lab.js','utf8'),context);return {context,values,lab:context.HexChallengeLab};
}
test('all nine public mission links resolve to their actual daily rules',()=>{
 const c=core();for(const m of bootstrap('greed').lab.missions)assert.equal(c.waves.daily(m.day).id,m.id);
 assert.equal(bootstrap('unknown').lab.active,false);assert.equal(bootstrap('greed','#duo=room').lab.active,false);
});
test('practice storage and API cannot touch account tokens, saves or the real profile',()=>{
 const {context,values,lab}=bootstrap('greed');lab.storage.setItem('hex-bastion-profile-v1','TEST');lab.storage.setItem('autohex-solo-autosave-v1','TEST RUN');
 assert.equal(values.get('hex-bastion-profile-v1'),'REAL PROFILE');assert.equal(values.get('autohex-solo-autosave-v1'),'REAL RUN');
 context.localStorage.getItem=()=>{throw Error('Normal storage accessed');};
 vm.runInNewContext(fs.readFileSync('classes/api.js','utf8'),context);vm.runInNewContext(fs.readFileSync('classes/local-store.js','utf8'),context);
 assert.equal(context.HexApi,undefined);assert.equal(context.HexLocalStore,undefined);
});
for(const {id} of bootstrap('greed').lab.missions)test(id+': controller starts, saves, reloads and restarts without touching real progress',()=>{
 const h=load({labMission:id,initialStorage:{'hex-bastion-profile-v1':'REAL PROFILE','autohex-solo-autosave-v1':'REAL RUN'}});
 assert.equal(h.a.state.challengeKind,id);assert.equal(h.a.state.challengePractice,true);assert.equal(h.a.state.introduction,undefined);
 assert.ok(h.a.saveRunAutosave(true));const saved=h.a.readRunAutosave();assert.ok(saved);h.a.restoreRunCheckpoint(saved.checkpoint);assert.equal(h.a.state.challengeKind,id);
 h.a.newRun();assert.equal(h.a.state.challengeKind,id);assert.equal(h.storage.get('hex-bastion-profile-v1'),'REAL PROFILE');assert.equal(h.storage.get('autohex-solo-autosave-v1'),'REAL RUN');
});
test('practice victories award no diamonds, including repeat victories',()=>{
 const h=load({labMission:'towerDraft'});for(let i=0;i<2;i++){h.a.state.wave=12;h.a.endWave();const p=JSON.parse(h.storage.get('autohex-challenge-lab-v1:towerDraft:hex-bastion-profile-v1'));assert.equal(p.diamonds,0);assert.equal(p.records.highestWave,0);assert.equal(p.records.runsPlayed,0);assert.match(h.elements.get('campaignVictoryText').textContent,/Testlauf/);h.a.newRun();}
});
test('a practice checkpoint is rejected by the normal game and by another lab mission',()=>{
 const h=load({labMission:'towerDraft'});h.a.saveRunAutosave(true);
 const raw=h.storage.get('autohex-challenge-lab-v1:towerDraft:autohex-solo-autosave-v1');
 const normal=load({initialStorage:{'autohex-solo-autosave-v1':raw}});assert.equal(normal.a.readRunAutosave(),null);
 const other=load({labMission:'villages',initialStorage:{'autohex-challenge-lab-v1:villages:autohex-solo-autosave-v1':raw}});assert.equal(other.a.readRunAutosave(),null);
});
test('draft quick-build uses inventory at zero gold and cannot duplicate a tower',()=>{
 const h=load({labMission:'towerDraft'});while(h.a.state.towerDraft.picks)h.elements.get('draftOffers').children[0].listeners.click();
 const s=h.a.state,type=Object.keys(s.towerDraft.inventory).find(k=>s.towerDraft.inventory[k]>0),tile=[...s.map.values()].find(t=>t.slots>0),slot={q:tile.q,r:tile.r,index:0},count=s.towerDraft.inventory[type];
 assert.equal(s.gold,0);assert.equal(h.a.armQuickTower(type),true);assert.equal(h.a.dropQuickTower(type,slot),true);assert.equal(s.towerDraft.inventory[type],count-1);assert.equal(h.a.dropQuickTower(type,slot),false);assert.equal(s.towerDraft.inventory[type],count-1);
});
for(const m of bootstrap('greed').lab.missions)test(m.id+': three seeds finish actual first-wave combat identically after a checkpoint',()=>{
 for(let seed=0;seed<3;seed++){
  const c=core(),r=c.session.create({seed:m.id+'-audit-'+seed,runId:'audit',challengeDay:m.day,loadout:['archer','catapult','chain','freeze','mine']}),s=r.state;
  if(m.id==='towerDraft')while(s.towerDraft.picks)assert.ok(c.towerDraft.choose(s,0));
  for(let step=0;s.phase==='place'&&step<12;step++){
   let placed=false;
   outer:for(let q=-8;q<=12;q++)for(let z=-8;z<=12;z++)for(let index=0;index<s.hand.length;index++)for(let rotation=0;rotation<6;rotation++){
    if(c.session.place(s,r.random,{q,r:z,index,rotation})){placed=true;break outer;}
   }
   assert.ok(placed,m.id+' must have a legal opening');
   if(m.id==='detour')c.detour.finishPlanning(s);
   if(m.id==='expedition')c.expedition.finishPlanning(s);
  }
  if(m.id==='greed')assert.ok(c.waves.acceptGreed(s,['swarm','healers','elite'][seed]));
  assert.ok(c.flow.start(s,r.random));c.runtime.advance(s,r.random,.4);
  const restored=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(s,r.random))));
  let result='running',other='running',ticks=0;
  while(result==='running'&&ticks++<15000){result=c.runtime.advance(s,r.random,.1);other=c.runtime.advance(restored.state,restored.random,.1);assert.equal(result,other);}
  assert.notEqual(result,'running','wave must terminate, not softlock');
  assert.equal(restored.state.hp,s.hp);assert.equal(restored.state.gold,s.gold);assert.equal(restored.state.pendingSpawns,s.pendingSpawns);
  assert.deepEqual(JSON.parse(JSON.stringify(restored.state.enemies)),JSON.parse(JSON.stringify(s.enemies)));
 }
});
