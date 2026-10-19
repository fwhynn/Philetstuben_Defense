const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {load}=require('./helpers/game.cjs');
test('first-player test ignores legacy progress, settings and cloud login; leaves real profile untouched',async()=>{
 let calls=0;const api={clearPresence(){calls++;},pulsePresence(){calls++;return Promise.resolve();},isLoggedIn(){calls++;return true;},async currentUser(){calls++;return {username:'real'};},async putSave(){calls++;}};
 const {a,storage,elements}=load({firstPlayerTest:true,accountApi:api,initialProfile:{diamonds:300,records:{runsPlayed:4}},initialStorage:{'tutorial-v1':'done',gameSpeed:'8'}});
 const before=storage.get('hex-bastion-profile-v1');assert.equal(a.state.towerLoadout.length,2);assert.equal(a.state.introduction.bestWave,0);assert.equal(a.state.gold,70);
 elements.get('openMainMenuBtn').listeners.click();assert.equal(elements.get('dailyModeBtn').classList.contains('hidden'),true);assert.equal(elements.get('menuAccountBtn').classList.contains('hidden'),true);
 elements.get('menuPlayBtn').listeners.click();assert.equal(a.state.towerLoadout.length,2);a.state.wave=5;a.endWave();await new Promise(r=>setImmediate(r));
 assert.equal(storage.get('hex-bastion-profile-v1'),before);assert.equal(storage.get('tutorial-v1'),'done');assert.equal(calls,0);assert.equal(JSON.parse(storage.get('autohex-first-player-test:hex-bastion-profile-v1')).introduction.bestWave,5);
});

test('developer upgrade fixtures use the real upgrade command and reset deterministically',()=>{
 for(const scenario of ['upgrade','upgrade-poor']){
  const {a,upgradeSelectedTower,elements,storage}=load({firstPlayerTest:true,developerScenario:scenario,initialProfile:{diamonds:300},initialStorage:{'hex-bastion-auth-token':'private'}});
  const real=storage.get('hex-bastion-profile-v1');
  assert.equal(a.applyDeveloperScenario(),true);
  const slot=a.state.selectedTower,tower=()=>a.state.map.get(`${slot.q},${slot.r}`).towers[slot.index];
  assert.equal(a.state.phase,'build');assert.equal(tower().type,'archer');assert.equal(tower().level,1);
  assert.equal(a.tutorial.active,false);assert.equal(elements.get('mainMenu').classList.contains('hidden'),true);
  const gold=scenario==='upgrade'?200:0;assert.equal(a.state.gold,gold);
  upgradeSelectedTower('volley');assert.equal(tower().level,scenario==='upgrade'?2:1);
  assert.equal(a.state.gold,scenario==='upgrade'?165:0);
  a.applyDeveloperScenario();assert.equal(tower().level,1);assert.equal(a.state.gold,gold);
  assert.equal(storage.get('hex-bastion-profile-v1'),real);assert.equal(storage.get('hex-bastion-auth-token'),'private');
 }
});

test('developer tutorial resets progress and normal gameplay has no scenario access',()=>{
 const {a}=load({firstPlayerTest:true,developerScenario:'tutorial'});
 a.applyDeveloperScenario();assert.equal(a.tutorial.active,true);assert.equal(a.tutorial.step,0);
 assert.equal(a.state.map.size,1);assert.equal(a.state.phase,'place');assert.equal(a.state.gold,70);
 a.state.wave=5;a.endWave();a.applyDeveloperScenario();
 assert.equal(a.state.introduction.bestWave,0);assert.equal(a.tutorial.step,0);assert.equal(a.state.wave,0);
 const normal=load();const before=normal.a.state;assert.equal(normal.a.applyDeveloperScenario(),false);assert.equal(normal.a.state,before);
});

test('scenario URLs are allowlisted, local-only, excluded from Duo and removed on exit',()=>{
 for(const hostname of ['localhost','127.0.0.1','[::1]','autohextd.autophil.lol'])for(const duo of [false,true]){
  const values=new Map([['autohex-dev-enabled','true'],['autohex-first-player-test:profile','test'],['hex-bastion-profile-v1','real']]);let destination=null;
  const href=`http://${hostname}/?svg&first-player-test=1&dev-scenario=upgrade${duo?'#duo=token':''}`;
  const url=new URL(href),context={URL,URLSearchParams,location:{hostname,search:url.search,hash:url.hash,href,assign:value=>destination=value},localStorage:{get length(){return values.size;},key:i=>[...values.keys()][i],getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}};
  vm.runInNewContext(fs.readFileSync('classes/first-player-test.js','utf8'),context);
  const allowed=hostname!=='autohextd.autophil.lol'&&!duo;
  assert.equal(context.HexFirstPlayerTest.scenario,allowed?'upgrade':null);
  context.HexFirstPlayerTest.start('upgrade-poor');assert.equal(!!destination,allowed);
  assert.equal(values.get('hex-bastion-profile-v1'),'real');
  if(allowed){assert.equal(new URL(destination).searchParams.get('dev-scenario'),'upgrade-poor');assert.equal(values.has('autohex-first-player-test:profile'),false);context.HexFirstPlayerTest.start('invalid');assert.equal(new URL(destination).searchParams.has('dev-scenario'),false);context.HexFirstPlayerTest.exit();assert.equal(new URL(destination).searchParams.has('dev-scenario'),false);assert.equal(new URL(destination).searchParams.has('first-player-test'),false);assert.equal(new URL(destination).searchParams.has('svg'),true);}
 }
});
test('first-player reset clears only its own namespace and is unavailable on the public host',()=>{
 for(const hostname of ['localhost','autohextd.autophil.lol']){
  const values=new Map([['autohex-dev-enabled','true'],['hex-bastion-profile-v1','real'],['autohex-first-player-test:profile','test'],['hex-bastion-auth-token','private']]);let destination=null;
  const context={URL,URLSearchParams,location:{hostname,search:'?first-player-test=1',hash:'',href:'http://'+hostname+'/?first-player-test=1',assign:url=>destination=url},localStorage:{get length(){return values.size;},key:i=>[...values.keys()][i],getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}};
  vm.runInNewContext(fs.readFileSync('classes/first-player-test.js','utf8'),context);context.HexFirstPlayerTest.start();assert.equal(values.get('hex-bastion-profile-v1'),'real');assert.equal(values.get('hex-bastion-auth-token'),'private');assert.equal(context.HexFirstPlayerTest.active,hostname==='localhost');assert.equal(values.has('autohex-first-player-test:profile'),hostname!=='localhost');assert.equal(!!destination,hostname==='localhost');
 }
});
test('new Standard runs preserve the chosen graphics style',()=>{
 let edition='sakura';const {a}=load({assetEdition:{get:()=>edition,set:value=>edition=value}});assert.equal(edition,'sakura');a.newRun();assert.equal(edition,'sakura');
});

test('Dev is off by default, gates URL scenarios and cannot be enabled on a public host',()=>{
 for(const hostname of ['localhost','autohextd.autophil.lol']){
  const values=new Map(),destinations=[],context={URL,URLSearchParams,location:{hostname,search:'?first-player-test=1&dev-scenario=upgrade',hash:'',href:'http://'+hostname+'/?first-player-test=1&dev-scenario=upgrade',assign:url=>destinations.push(url)},localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}};
  const source=fs.readFileSync('classes/first-player-test.js','utf8');vm.runInNewContext(source,context);
  assert.equal(context.HexFirstPlayerTest.enabled,false);assert.equal(context.HexFirstPlayerTest.active,false);context.HexFirstPlayerTest.start();assert.equal(destinations.length,0);
  context.HexFirstPlayerTest.toggle();assert.equal(context.HexFirstPlayerTest.enabled,hostname==='localhost');
  vm.runInNewContext(source,context);assert.equal(context.HexFirstPlayerTest.active,hostname==='localhost');
  context.HexFirstPlayerTest.toggle();assert.equal(context.HexFirstPlayerTest.enabled,false);
  if(hostname==='localhost'){assert.equal(new URL(destinations[0]).searchParams.has('first-player-test'),false);}
 }
});

test('first-player start button is hidden when local Dev mode is switched off',()=>{
 const view=load({firstPlayerTest:true});view.elements.get('openMainMenuBtn').listeners.click();assert.equal(view.elements.get('firstPlayerTestBtn').classList.contains('hidden'),false);
 view.elements.get('devToggleBtn').listeners.click();assert.equal(view.elements.get('firstPlayerTestBtn').classList.contains('hidden'),true);assert.equal(view.elements.get('menuDeveloperTools').classList.contains('hidden'),true);
});
