const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {load}=require('./helpers/game.cjs');
test('introduction restart confirms exact reward, cancels without mutation and pays once on acceptance',()=>{
 let accept=false;const prompts=[],view=load({initialStorage:{'tutorial-v1':''},confirm:text=>{prompts.push(text);return accept;}});
 const {a,elements,storage}=view;Object.assign(a.state,{wave:25,earnedMeta:{normalKills:10,periodicBosses:1,explorationBosses:0}});
 const id=a.state.runId;elements.get('newRunBtn').listeners.click();assert.equal(a.state.runId,id);assert.match(prompts[0],/Welle 25.*21 Diamanten/);
 assert.equal(JSON.parse(storage.get('hex-bastion-profile-v1')).diamonds,0);
 accept=true;elements.get('newRunBtn').listeners.click();assert.notEqual(a.state.runId,id);
 const profile=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(profile.diamonds,21);assert.equal(profile.settledRuns.filter(run=>run===id).length,1);
});
test('saved run is also confirmed and paid before starting again after reload',()=>{
 const original=load();Object.assign(original.a.state,{wave:25,phase:'wave',waveRunning:true,enemies:[],pendingSpawns:0,spawnQueue:[]});original.a.endWave();
 const prompts=[],view=load({bootToMenu:true,initialStorage:Object.fromEntries(original.storage),confirm:text=>{prompts.push(text);return true;}});
 view.elements.get('menuPlayBtn').listeners.click();assert.match(prompts[0],/Welle 25/);
 assert.ok(JSON.parse(view.storage.get('hex-bastion-profile-v1')).settledRuns.includes(original.a.state.runId));
 assert.equal(view.storage.get('autohex-solo-autosave-v1'),'');
});
test('audio persists volume and mute across reload and accepts bounded account settings',()=>{
 const storage=new Map();function boot(){const nodes=new Map();const document={getElementById(id){if(!nodes.has(id))nodes.set(id,{checked:true,value:'35',listeners:{},addEventListener(name,fn){this.listeners[name]=fn;}});return nodes.get(id);},addEventListener(){}};
 const context={document,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}};vm.runInNewContext(fs.readFileSync(require.resolve('../classes/sound.js'),'utf8')+'\nglobalThis.audio=HexAudio;',context);return {nodes,audio:context.audio};}
 const first=boot();first.nodes.get('soundVolume').value='12';first.nodes.get('soundVolume').listeners.input();first.nodes.get('soundEnabled').checked=false;first.nodes.get('soundEnabled').listeners.change();
 const next=boot();assert.equal(next.nodes.get('soundVolume').value,'12');assert.equal(next.nodes.get('soundEnabled').checked,false);assert.equal(next.nodes.get('menuSound').checked,false);
 next.audio.applySettings({volume:200,enabled:false});assert.equal(next.audio.settings().volume,100);
});
