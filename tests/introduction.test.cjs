const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const loadCore=require('../headless-core.cjs'),{load}=require('./helpers/game.cjs');
const fresh={version:1,bestWave:0,skipped:false,legacy:false};
function profileFixture(){const storage=new Map(),context={localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)}};vm.runInNewContext(fs.readFileSync('classes/profile.js','utf8')+';globalThis.profile=HexProfile;',context);return {p:context.profile,storage,defs:loadCore().data.TOWERS};}
function learningRun(c,bestWave=0){return c.runtime.create({seed:'introduction-test',runId:'intro',loadout:['archer','catapult'],introduction:{...fresh,bestWave}});}
const plain=v=>JSON.parse(JSON.stringify(v));
test('guest milestones persist, never accumulate across runs, and export to another browser',()=>{
 const {p,storage,defs}=profileFixture();let profile=p.load(defs);assert.deepEqual(plain(profile.activeLoadout),['archer','catapult']);assert.equal(p.learning(profile),true);
 for(let i=0;i<4;i++)profile=p.recordIntroduction(profile,3,defs);assert.equal(profile.introduction.bestWave,3);assert.equal(profile.activeLoadout.length,2);
 profile=p.recordIntroduction(profile,5,defs);assert.ok(profile.activeLoadout.includes('freeze'));assert.ok(!profile.activeLoadout.includes('chain'));
 assert.equal(p.load(defs).introduction.bestWave,5);const exported=p.exportFile(profile,defs),other=profileFixture();assert.equal(other.p.importFile(exported,other.defs).introduction.bestWave,5);
 assert.equal(storage.has(p.STORAGE_KEY),true);
});
test('skip grants starter towers but not purchases, fortress achievements or daily/Duo access',()=>{
 const {p,defs}=profileFixture();let profile=p.skipIntroduction(p.load(defs),defs);assert.equal(p.learning(profile),false);assert.equal(profile.activeLoadout.length,5);assert.equal(p.modesUnlocked(profile),false);assert.equal(profile.diamonds,0);assert.equal(profile.unlocks.length,0);assert.equal(p.heroUnlocked(profile,'builder'),false);
 profile=p.recordIntroduction(profile,34,defs);assert.equal(p.modesUnlocked(profile),false);profile=p.recordIntroduction(profile,35,defs);assert.equal(p.modesUnlocked(profile),true);
 const legacy=p.normalize({version:1,diamonds:70},defs);assert.equal(p.modesUnlocked(legacy),true);assert.equal(p.learning(legacy),false);assert.equal(legacy.diamonds,70);assert.equal(legacy.activeLoadout.length,5);
});
test('new towers enter the current run only after successful waves 5, 10 and 15, exactly once',()=>{
 const c=loadCore(),{state:s}=learningRun(c);assert.equal(s.towerLoadout.length,2);
 for(const [wave,count] of [[4,2],[5,3],[9,3],[10,4],[14,4],[15,5]]){s.wave=wave;s.waveRunning=true;assert.ok(c.flow.finish(s));assert.equal(s.towerLoadout.length,count);assert.equal(c.flow.finish(s),null);}
 assert.deepEqual(plain(s.introduction.notices),['freeze','chain','mine']);
 const failed=learningRun(c).state;failed.wave=5;failed.hp=0;assert.equal(c.flow.finish(failed),null);assert.equal(failed.towerLoadout.length,2);
 const pending=learningRun(c).state;pending.wave=5;pending.pendingSpawns=1;assert.equal(c.flow.finish(pending),null);assert.equal(pending.towerLoadout.length,2);
 assert.deepEqual(plain(learningRun(c,10).state.towerLoadout),['archer','catapult','freeze','chain']);
});
test('learning biome changes begin after completed wave 20 and preserve every previously visible cell',()=>{
 const c=loadCore(),run=learningRun(c),s=run.state;
 s.map.set('9,0',{q:9,r:0,type:'straight',roads:[0,3],towers:[],slots:0});
 for(let q=-20;q<=20;q++)for(let r=-20;r<=20;r++)assert.equal(c.biomes.forTile(s,{q,r}),'grass');
 s.wave=19;c.flow.finish(s);assert.equal(s.introduction.biomeUnlocked,false);
 const visible=c.biomes.visibleTiles(s);s.wave=20;c.flow.finish(s);assert.equal(s.introduction.biomeUnlocked,true);for(const tile of visible)assert.equal(c.biomes.forTile(s,tile),'grass');
 const colors=new Set();for(let q=-20;q<=20;q++)for(let r=-20;r<=20;r++)colors.add(c.biomes.forTile(s,{q,r}));assert.deepEqual([...colors].sort(),['desert','grass']);
 const restored=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(s,run.random)))).state;assert.equal(restored.landmarks.sparse,true);for(const tile of visible)assert.equal(c.biomes.forTile(restored,tile),'grass');
});
test('learning landmarks are fewer, spaced out, include all event types and are exploration-order independent',()=>{
 const c=loadCore(),seed='intro-events';let normalCount=0,sparseCount=0;const kinds=new Set();
 for(let i=0;i<8;i++){
  const normal=c.exploration.create(c.random.create(seed+i)),sparse=c.exploration.create(c.random.create(seed+i),{sparse:true});const map=new Map();for(let q=-12;q<=12;q+=3)for(let r=-12;r<=12;r+=3)map.set(q+','+r,{q,r});
  c.exploration.expand(normal,map);c.exploration.expand(sparse,map);normalCount+=normal.size;sparseCount+=sparse.size;const entries=[...sparse.values()];
  for(let a=0;a<entries.length;a++){kinds.add(entries[a].type);for(let b=a+1;b<entries.length;b++){const x=entries[a],y=entries[b];assert.ok(Math.max(Math.abs(x.q-y.q),Math.abs(x.r-y.r),Math.abs(x.q+x.r-y.q-y.r))>=4);}}
  const reverse=c.exploration.create(c.random.create(seed+i),{sparse:true});c.exploration.expand(reverse,new Map([...map].reverse()));assert.equal(JSON.stringify([...sparse].sort()),JSON.stringify([...reverse].sort()));
 }
 assert.ok(sparseCount<normalCount*.6);assert.deepEqual([...kinds].sort(),['boss','shrine','treasure']);
});
test('controller saves completed-wave progress immediately and acknowledgement preserves open construction UI',()=>{
 const {a,elements,storage,documentListeners}=load({initialStorage:{'tutorial-v1':''}});elements.get('skipTutorialBtn').listeners.click();elements.get('mainMenu').classList.add('hidden');elements.get('settingsDrawer').classList.add('hidden');
 a.state.wave=5;a.state.waveRunning=true;a.state.selectedSlot={q:0,r:0,index:0};a.endWave();
 assert.equal(JSON.parse(storage.get('hex-bastion-profile-v1')).introduction.bestWave,5);assert.ok(a.state.towerLoadout.includes('freeze'));
 a.state.phase='build';a.state.celebrationActive=false;elements.get('rewardOverlay').classList.add('hidden');a.renderAll();assert.equal(elements.get('introductionNotice').classList.contains('hidden'),false);
 const selection=a.state.selectedSlot;elements.get('towerMenu').classList.remove('hidden');documentListeners.pointerdown({button:0,target:{closest:selector=>selector.includes('#introductionNotice')}});elements.get('introductionNoticeClose').listeners.click();assert.equal(a.state.selectedSlot,selection);assert.equal(elements.get('towerMenu').classList.contains('hidden'),false);assert.equal(elements.get('introductionNotice').classList.contains('hidden'),true);
 const reloaded=load({initialStorage:Object.fromEntries(storage)});assert.ok(reloaded.a.state.towerLoadout.includes('freeze'));assert.equal(reloaded.a.state.towerLoadout.length,3);
});
test('learning hints wait for reward dialogs and suppress the legacy hotkey and biome popups',()=>{
 const {a,elements}=load({initialStorage:{'tutorial-v1':''}});elements.get('skipTutorialBtn').listeners.click();elements.get('mainMenu').classList.add('hidden');elements.get('settingsDrawer').classList.add('hidden');a.state.wave=10;a.endWave();a.state.hotkeyHintStarted=true;a.renderAll();
 assert.equal(elements.get('introductionNotice').classList.contains('hidden'),true);assert.equal(elements.get('hotkeyTip').classList.contains('hidden'),true);assert.equal(a.state.biomeIntro,null);assert.ok(!a.state.pendingCelebration);
});
test('fresh guests can enter a Duo invitation without a five-tower local profile',()=>{
 const duo={};load({duo,initialStorage:{'tutorial-v1':''}});assert.ok(duo.api);assert.equal(duo.api.getState().introduction,undefined);assert.equal(duo.api.getState().towerLoadout.length,5);
});

test('fresh menu starts Standard directly and hides locked modes until a successful wave 35',()=>{
 const {a,elements}=load({initialStorage:{'tutorial-v1':''}});elements.get('openMainMenuBtn').listeners.click();
 for(const id of ['dailyModeBtn','duoModeBtn'])assert.equal(elements.get(id).classList.contains('hidden'),true);
 assert.equal(elements.get('skipIntroductionBtn').classList.contains('hidden'),false);elements.get('menuPlayBtn').listeners.click();assert.equal(a.state.towerLoadout.length,2);assert.equal(elements.get('playModeOverlay')?.classList.contains('hidden')??true,true);
 a.state.wave=35;a.endWave();elements.get('openMainMenuBtn').listeners.click();for(const id of ['dailyModeBtn','duoModeBtn'])assert.equal(elements.get(id).classList.contains('hidden'),false);assert.equal(elements.get('skipIntroductionBtn').classList.contains('hidden'),true);
});
