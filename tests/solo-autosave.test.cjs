const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs');
const key='autohex-solo-autosave-v1';
function completed(wave=1){
 const view=load();Object.assign(view.a.state,{wave,waveRunning:true,phase:'wave',enemies:[],pendingSpawns:0,spawnQueue:[]});view.a.endWave();return view;
}
test('wave completion saves a resumable run and reload offers it without starting combat',()=>{
 const original=completed(),saved=original.a.readRunAutosave();assert.ok(saved);
 const next=load({bootToMenu:true,initialStorage:Object.fromEntries(original.storage)});
 assert.equal(next.elements.get('menuContinueBtn').classList.contains('hidden'),false);
 assert.equal(next.elements.get('mainMenu').classList.contains('hidden'),false);
 next.elements.get('menuContinueBtn').listeners.click();
 assert.equal(next.a.state.runId,original.a.state.runId);assert.equal(next.a.state.lastCompletedWave,1);
 assert.equal(next.a.state.gold,original.a.state.gold);assert.equal(next.a.state.map.size,original.a.state.map.size);
 assert.equal(next.a.state.waveRunning,false);assert.equal(next.elements.get('mainMenu').classList.contains('hidden'),true);
 assert.deepEqual(JSON.parse(JSON.stringify(next.a.captureRunCheckpoint().random)),JSON.parse(JSON.stringify(saved.checkpoint.random)));
});
test('pending card rewards resume without granting completion income a second time',()=>{
 const original=completed(2),offer=JSON.stringify(original.a.state.rewardOffer),gold=original.a.state.gold;
 assert.ok(original.a.state.rewardOffer);
 const next=load({bootToMenu:true,initialStorage:Object.fromEntries(original.storage)});next.elements.get('menuContinueBtn').listeners.click();
 assert.equal(JSON.stringify(next.a.state.rewardOffer),offer);assert.equal(next.a.state.gold,gold);assert.equal(next.elements.get('rewardOverlay').classList.contains('hidden'),false);
});
test('losing or starting a new run clears the previous autosave',()=>{
 for(const action of ['lose','new']){const view=completed();assert.ok(view.storage.get(key));
  if(action==='new')view.a.newRun();else {Object.assign(view.a.state,{hp:0,waveRunning:true,phase:'wave'});view.a.update(0,0);}
  assert.equal(view.storage.get(key),'');assert.equal(view.a.readRunAutosave(),null);
 }
});
test('corrupt and incompatible autosaves do not prevent opening the main menu',()=>{
 for(const raw of ['{broken',JSON.stringify({checkpoint:{version:999}})]){
  const view=load({bootToMenu:true,initialStorage:{[key]:raw}});
  assert.equal(view.elements.get('menuContinueBtn').classList.contains('hidden'),true);
  assert.equal(view.elements.get('mainMenu').classList.contains('hidden'),false);
 }
});
test('an unfinished wave never overwrites the last completed-wave checkpoint',()=>{
 const view=completed(),before=view.storage.get(key);view.a.state.waveRunning=true;view.a.state.phase='wave';view.a.update(0,0);
 assert.equal(view.storage.get(key),before);
});
test('campaign victory can be resumed and continued in endless mode',()=>{
 const original=completed(35),next=load({bootToMenu:true,initialStorage:Object.fromEntries(original.storage)});
 next.elements.get('menuContinueBtn').listeners.click();assert.equal(next.a.state.phase,'victory');
 assert.equal(next.elements.get('campaignVictory').classList.contains('hidden'),false);
 next.elements.get('endlessBtn').listeners.click();assert.equal(next.a.state.endless,true);assert.notEqual(next.a.state.phase,'victory');
});
test('isolated first-player runs never overwrite the normal browser autosave',()=>{
 const original=completed(),raw=original.storage.get(key),view=load({firstPlayerTest:true,initialStorage:{[key]:raw}});
 Object.assign(view.a.state,{wave:1,waveRunning:true,phase:'wave',enemies:[],pendingSpawns:0,spawnQueue:[]});view.a.endWave();
 assert.equal(view.storage.get(key),raw);assert.ok(view.a.readRunAutosave());
});
