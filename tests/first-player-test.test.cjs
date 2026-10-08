const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {load}=require('./helpers/game.cjs');
test('first-player test ignores legacy progress, settings and cloud login; leaves real profile untouched',async()=>{
 let calls=0;const api={isLoggedIn(){calls++;return true;},async currentUser(){calls++;return {username:'real'};},async putSave(){calls++;}};
 const {a,storage,elements}=load({firstPlayerTest:true,accountApi:api,initialProfile:{diamonds:300,records:{runsPlayed:4}},initialStorage:{'tutorial-v1':'done',gameSpeed:'8'}});
 const before=storage.get('hex-bastion-profile-v1');assert.equal(a.state.towerLoadout.length,2);assert.equal(a.state.introduction.bestWave,0);assert.equal(a.state.gold,70);
 elements.get('openMainMenuBtn').listeners.click();assert.equal(elements.get('dailyModeBtn').classList.contains('hidden'),true);assert.equal(elements.get('menuAccountBtn').classList.contains('hidden'),true);
 elements.get('menuPlayBtn').listeners.click();assert.equal(a.state.towerLoadout.length,2);a.state.wave=5;a.endWave();await new Promise(r=>setImmediate(r));
 assert.equal(storage.get('hex-bastion-profile-v1'),before);assert.equal(storage.get('tutorial-v1'),'done');assert.equal(calls,0);assert.equal(JSON.parse(storage.get('autohex-first-player-test:hex-bastion-profile-v1')).introduction.bestWave,5);
});
test('first-player reset clears only its own namespace and is unavailable on the public host',()=>{
 for(const hostname of ['localhost','autohextd.autophil.lol']){
  const values=new Map([['hex-bastion-profile-v1','real'],['autohex-first-player-test:profile','test'],['hex-bastion-auth-token','private']]);let destination=null;
  const context={URL,URLSearchParams,location:{hostname,search:'?first-player-test=1',hash:'',href:'http://'+hostname+'/?first-player-test=1',assign:url=>destination=url},localStorage:{get length(){return values.size;},key:i=>[...values.keys()][i],getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}};
  vm.runInNewContext(fs.readFileSync('classes/first-player-test.js','utf8'),context);context.HexFirstPlayerTest.start();assert.equal(values.get('hex-bastion-profile-v1'),'real');assert.equal(values.get('hex-bastion-auth-token'),'private');assert.equal(context.HexFirstPlayerTest.active,hostname==='localhost');assert.equal(values.has('autohex-first-player-test:profile'),hostname!=='localhost');assert.equal(!!destination,hostname==='localhost');
 }
});
test('every new Standard run resets a stored Sakura style to Normal',()=>{
 let edition='sakura';const {a}=load({assetEdition:{get:()=>edition,set:value=>edition=value}});assert.equal(edition,'normal');edition='sakura';a.newRun();assert.equal(edition,'normal');
});
