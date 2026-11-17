const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {load}=require('./helpers/game.cjs');
test('custom restart dialog cancels without mutation and pays once on acceptance',()=>{
 const {a,elements,storage,documentListeners}=load({initialStorage:{'tutorial-v1':''},confirm:()=>{throw Error('native confirmation forbidden');}});
 Object.assign(a.state,{wave:25,lastCompletedWave:24,earnedMeta:{normalKills:10,periodicBosses:1,explorationBosses:0}});
 const id=a.state.runId;elements.get('newRunBtn').listeners.click();assert.equal(a.state.runId,id);
 assert.equal(elements.get('restartRunWave').textContent,'Welle 25');assert.equal(elements.get('restartRunDiamonds').textContent,'+21 ◆');
 documentListeners.keydown({key:'Escape',preventDefault(){}});assert.equal(elements.get('restartRunOverlay').classList.contains('hidden'),true);
 assert.equal(a.state.runId,id);assert.equal(JSON.parse(storage.get('hex-bastion-profile-v1')).diamonds,0);
 elements.get('newRunBtn').listeners.click();elements.get('confirmRestartRunBtn').listeners.click();assert.notEqual(a.state.runId,id);
 elements.get('confirmRestartRunBtn').listeners.click();const profile=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(profile.diamonds,21);assert.equal(profile.settledRuns.filter(run=>run===id).length,1);
});
test('saved run remains intact until the in-game restart confirmation is accepted',()=>{
 const original=load();Object.assign(original.a.state,{wave:25,phase:'wave',waveRunning:true,enemies:[],pendingSpawns:0,spawnQueue:[]});original.a.endWave();
 const view=load({bootToMenu:true,initialStorage:Object.fromEntries(original.storage)});
 view.elements.get('menuPlayBtn').listeners.click();view.elements.get('standardModeBtn').listeners.click();assert.equal(view.elements.get('restartRunWave').textContent,'Welle 25');
 assert.ok(view.storage.get('autohex-solo-autosave-v1'));view.elements.get('cancelRestartRunBtn').listeners.click();assert.ok(view.storage.get('autohex-solo-autosave-v1'));
 view.elements.get('standardModeBtn').listeners.click();view.elements.get('confirmRestartRunBtn').listeners.click();
 assert.ok(JSON.parse(view.storage.get('hex-bastion-profile-v1')).settledRuns.includes(original.a.state.runId));assert.equal(view.storage.get('autohex-solo-autosave-v1'),'');
});

test('audio persists volume, stores mute as 0 % and accepts bounded account settings',()=>{
 const storage=new Map();function boot(){const nodes=new Map();const document={getElementById(id){if(!nodes.has(id))nodes.set(id,{checked:true,value:'35',listeners:{},addEventListener(name,fn){this.listeners[name]=fn;}});return nodes.get(id);},addEventListener(){}};
 const context={document,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}};vm.runInNewContext(fs.readFileSync(require.resolve('../classes/sound.js'),'utf8')+'\nglobalThis.audio=HexAudio;',context);return {nodes,audio:context.audio};}
 const first=boot();first.nodes.get('soundVolume').value='12';first.nodes.get('soundVolume').listeners.input();first.nodes.get('soundEnabled').checked=false;first.nodes.get('soundEnabled').listeners.change();
 // Ohne eigenen Schalter wird „aus“ als 0 % gespeichert.
 const next=boot();assert.equal(next.nodes.get('soundVolume').value,'0');assert.equal(next.nodes.get('soundEnabled').checked,true);
 next.audio.applySettings({volume:200});assert.equal(next.audio.settings().volume,100);
 next.audio.applySettings({volume:50,enabled:false});assert.equal(next.audio.settings().volume,0);assert.equal(next.audio.settings().enabled,true);
});

test('background music loops after the first input, pauses in a hidden tab and persists its own settings',()=>{
 const storage=new Map(),tracks=[];
 class FakeAudio{constructor(src){this.src=src;this.paused=true;this.loop=false;this.volume=1;tracks.push(this);}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}}
 function boot(){const nodes=new Map(),docListeners={};const document={hidden:false,getElementById(id){if(!nodes.has(id))nodes.set(id,{checked:true,value:id==='musicVolume'?'40':'35',listeners:{},addEventListener(name,fn){this.listeners[name]=fn;}});return nodes.get(id);},addEventListener(name,fn){docListeners[name]=fn;}};
  const context={document,window:{},Audio:FakeAudio,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}};vm.runInNewContext(fs.readFileSync(require.resolve('../classes/sound.js'),'utf8')+'\nglobalThis.audio=HexAudio;',context);return {nodes,document,docListeners,audio:context.audio};}
 const first=boot();assert.equal(tracks.length,0,'kein Autoplay vor der ersten Eingabe');
 first.docListeners.pointerdown();assert.equal(tracks.length,1);const track=tracks[0];
 assert.match(track.src,/assets\/audio\/music\/.+\.mp3$/);assert.equal(track.loop,true);assert.equal(track.paused,false);assert.ok(Math.abs(track.volume-.24)<1e-9);
 first.document.hidden=true;first.docListeners.visibilitychange();assert.equal(track.paused,true);
 first.document.hidden=false;first.docListeners.visibilitychange();assert.equal(track.paused,false);
 first.nodes.get('musicVolume').value='10';first.nodes.get('musicVolume').listeners.input();assert.ok(Math.abs(track.volume-.06)<1e-9);
 first.nodes.get('musicEnabled').checked=false;first.nodes.get('musicEnabled').listeners.change();assert.equal(track.paused,true);
 const next=boot();assert.equal(next.nodes.get('musicEnabled').checked,true);assert.equal(next.nodes.get('musicVolume').value,'0');
 next.audio.applySettings({musicEnabled:true,musicVolume:500});assert.deepEqual({...next.audio.settings()},{enabled:true,volume:35,musicEnabled:true,musicVolume:100});
});


test('restart confirmation pauses the current wave and cancellation resumes without catching up',()=>{
 let now=0;const {a,elements}=load({now:()=>now});a.state.waveRunning=true;a.state.pendingSpawns=1;now=100;a.advanceClock(now);
 const before=a.state.elapsedMs;elements.get('newRunBtn').listeners.click();now=60000;a.advanceClock(now);assert.equal(a.state.elapsedMs,before);
 elements.get('cancelRestartRunBtn').listeners.click();a.advanceClock(now);assert.equal(a.state.elapsedMs,before);now+=100;a.advanceClock(now);assert.ok(a.state.elapsedMs>before&&a.state.elapsedMs<before+251);
});
