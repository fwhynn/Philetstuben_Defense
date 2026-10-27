const { test } = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path'), { load } = require('./helpers/game.cjs');

// Gültiger Profil-Export wie ihn der Server speichert.
function serverSave(fields) {
  const context = {}; vm.createContext(context);
  for (const file of ['data.js', 'profile.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../classes', file), 'utf8'), context);
  const { HexProfile, HexData } = vm.runInContext('({HexProfile,HexData})', context);
  return JSON.parse(HexProfile.exportFile({ ...HexProfile.normalize({}, HexData.TOWERS), ...fields }, HexData.TOWERS));
}

// Test-Server im Speicher: merkt sich Anmeldung, gespeicherten Stand und alle Uploads.
function fakeApi(serverSave = null) {
  return { loggedIn: false, server: serverSave, puts: [],
    isLoggedIn() { return this.loggedIn; },
    async login(username) { this.loggedIn = true; return { id: 1, username }; },
    async register(username) { this.loggedIn = true; return { id: 2, username }; },
    async pulsePresence() {},
    async logout() { this.loggedIn = false; },
    async currentUser() { return this.loggedIn ? { id: 1, username: 'phil' } : null; },
    async getSave() { return this.server; },
    async putSave(text) { const data = JSON.parse(text); this.puts.push(data); this.server = data; return { updatedAt: 'now' }; } };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
test('account UI distinguishes a saved profile from pending leaderboard statistics',async()=>{
 const api=fakeApi();api.statsStatus='pending';const r=load({accountApi:api,bootToMenu:true});await submit(r.document,'register');
 assert.match(r.elements.get('accountSyncInfo').textContent,/Spielstand gesichert.*Bestenliste/);
});
test('a newer unreadable run checkpoint survives cloud restore and subsequent settings upload',async()=>{
 const checkpoint={checkpoint:{version:999,rules:'future',state:{runId:'future-run'}},manual:true};
 const api=fakeApi({...serverSave({diamonds:100}),runAutosave:checkpoint});
 const r=load({accountApi:api,bootToMenu:true});await submit(r.document,'login');
 assert.deepEqual(JSON.parse(r.storage.get('autohex-solo-autosave-v1')),checkpoint);
 await r.elements.get('accountSaveServerBtn').listeners.click();
 assert.deepEqual(api.server.runAutosave,checkpoint);
});

test('a malformed local checkpoint stops upload instead of erasing the cloud checkpoint',async()=>{
 const api=fakeApi(),r=load({accountApi:api,bootToMenu:true});await submit(r.document,'register');
 const count=api.puts.length;r.storage.set('autohex-solo-autosave-v1','{broken');
 await r.elements.get('accountSaveServerBtn').listeners.click();
 assert.equal(api.puts.length,count);
 r.storage.set('autohex-solo-autosave-v1','');
 await r.elements.get('accountSaveServerBtn').listeners.click();assert.equal(api.puts.length,count+1);
});
test('an in-flight upload does not clear newer changes or start a parallel upload', async()=>{
 const api=fakeApi(),r=load({accountApi:api,bootToMenu:true});await submit(r.document,'register');
 let finish, calls=0;const original=api.putSave.bind(api);
 api.putSave=async text=>{calls++;await new Promise(resolve=>{finish=resolve});return original(text)};
 const first=r.elements.get('accountSaveServerBtn').listeners.click();await flush();
 const second=r.elements.get('accountSaveServerBtn').listeners.click();
 acknowledgeArsenal(r);finish();await Promise.all([first,second]);
 assert.equal(calls,1);assert.equal(r.storage.get('hex-cloud-dirty'),'1');
 api.putSave=original;await r.elements.get('accountSaveServerBtn').listeners.click();
 assert.equal(r.storage.get('hex-cloud-dirty'),undefined);
});
test('cloud conflict preserves local profile and stops automatic retries',async()=>{
 const api=fakeApi(),r=load({accountApi:api,bootToMenu:true,initialProfile:{diamonds:80}});await submit(r.document,'register');
 let calls=0;api.putSave=async()=>{calls++;throw Object.assign(Error('Neuerer Account-Spielstand vorhanden.'),{status:409})};
 await r.elements.get('accountSaveServerBtn').listeners.click();await r.elements.get('accountSaveServerBtn').listeners.click();
 assert.equal(calls,1);assert.ok(r.storage.get('hex-bastion-profile-backup'));assert.equal(r.storage.get('hex-cloud-dirty'),'1');
 assert.match(r.elements.get('accountStatus').textContent,/Neuerer/);
});
function acknowledgeArsenal(r){
 r.elements.get('menuArsenalBtn').listeners.click();
 for(const tab of r.elements.get('arsenalTabs').children.filter(e=>e.attributes.role==='tab'))tab.listeners.click();
}
test('arsenal acknowledgements upload automatically and follow the account to another browser',async()=>{
 const api=fakeApi(),first=load({accountApi:api,initialProfile:{diamonds:100}});
 await submit(first.document,'register');acknowledgeArsenal(first);
 assert.equal(first.elements.get('menuArsenalBtn').classList.contains('upgradeAvailable'),false);
 // Execute the debounced save like the browser timer.
 for(const callback of [...first.timers.values()])await callback();
 assert.ok(api.server.gameSettings.arsenalSeen.length>0);
 const remote=fakeApi(api.server),second=load({accountApi:remote,bootToMenu:true});
 await submit(second.document,'login');
 assert.equal(second.elements.get('menuArsenalBtn').classList.contains('upgradeAvailable'),false);
 assert.match(second.elements.get('menuArsenalDetail').textContent,/Upgrade verfügbar/);
 assert.deepEqual(JSON.parse(second.storage.get('hex-arsenal-seen-v1')),api.server.gameSettings.arsenalSeen);
});
test('arsenal acknowledgement survives deferred restore and remains local for guests',async()=>{
 const api=fakeApi(serverSave({diamonds:100})),r=load({accountApi:api,initialProfile:{diamonds:100}});
 await submit(r.document,'login');acknowledgeArsenal(r);
 const seen=JSON.parse(r.storage.get('hex-arsenal-seen-v1'));
 endRun(r.a);await flush();
 assert.deepEqual(api.server.gameSettings.arsenalSeen,seen);
 const guestApi=fakeApi(),guest=load({accountApi:guestApi,initialProfile:{diamonds:100}});
 acknowledgeArsenal(guest);await flush();assert.equal(guestApi.puts.length,0);
 const reload=load({initialProfile:{diamonds:100},initialStorage:Object.fromEntries(guest.storage)});
 assert.equal(reload.elements.get('menuArsenalBtn').classList.contains('upgradeAvailable'),false);
});
test('another account without acknowledgements does not inherit the browser seen list',async()=>{
 const guest=load({initialProfile:{diamonds:100}});acknowledgeArsenal(guest);
 const api=fakeApi(serverSave({diamonds:100})),r=load({accountApi:api,bootToMenu:true,initialStorage:Object.fromEntries(guest.storage)});
 await submit(r.document,'login');
 assert.equal(r.elements.get('menuArsenalBtn').classList.contains('upgradeAvailable'),true);
});
test('Duo account saves retain a suspended solo checkpoint',async()=>{
 const solo=load();solo.elements.get('openMainMenuBtn').listeners.click();const raw=solo.storage.get('autohex-solo-autosave-v1');assert.ok(raw);
 const api=fakeApi();api.loggedIn=true;const duo=load({duo:{},accountApi:api,initialStorage:Object.fromEntries(solo.storage)});
 await flush();await duo.elements.get('accountSaveServerBtn').listeners.click();
 assert.deepEqual(api.server.runAutosave,JSON.parse(raw));assert.equal(duo.storage.get('autohex-solo-autosave-v1'),raw);
});
async function submit(document, mode, username = 'phil', password = 'geheimes-passwort') {
  const el = id => document.getElementById(id);
  el(mode === 'register' ? 'accountTabRegister' : 'accountTabLogin').listeners.click();
  el('accountUsername').value = username; el('accountPassword').value = password;
  await el('accountForm').listeners.submit({ preventDefault() {} }); await flush();
}
function endRun(a) { a.state.hp = 0; a.state.waveRunning = true; a.state.pendingSpawns = 1; a.update(.01, 1); }

test('sign-in during a run applies the server save at game end, then backs up the settled progress', async () => {
  const api = fakeApi(serverSave({ diamonds: 77 }));
  const { a, elements, storage, document } = load({ accountApi: api, initialProfile: { diamonds: 5 } });
  await submit(document, 'login');
  assert.equal(JSON.parse(storage.get('hex-bastion-profile-v1')).diamonds, 5, 'laufendes Spiel: noch nicht übernommen');
  assert.match(elements.get('accountStatus').textContent, /nach dem laufenden Spiel/);
  endRun(a); await flush();
  const settled = JSON.parse(storage.get('hex-bastion-profile-v1'));
  assert.ok(settled.diamonds >= 77, 'Server-Stand wurde vor der Abrechnung übernommen');
  assert.equal(api.puts.at(-1).profile.diamonds, settled.diamonds, 'abgerechneter Stand wurde hochgeladen');
  assert.ok(storage.get('hex-bastion-profile-backup'), 'ersetzter lokaler Stand ist gesichert');
  assert.match(elements.get('cloudSaveNote').textContent, /gesichert/);
});

test('registering uploads the local progress and the menu shows the account name', async () => {
  const api = fakeApi(), { elements, document } = load({ accountApi: api });
  await submit(document, 'register', 'neu');
  assert.equal(api.puts.length, 1); assert.equal(api.puts[0].format, 'autohex-profile');
  assert.equal(elements.get('menuAccountLabel').textContent, 'neu');
  assert.equal(elements.get('accountStatus').dataset.kind, 'success');
});

test('without an account nothing is sent and the result screen suggests signing in', async () => {
  const api = fakeApi(), { a, elements } = load({ accountApi: api });
  endRun(a); await flush();
  assert.equal(api.puts.length, 0);
  assert.match(elements.get('cloudSaveNote').textContent, /Account/);
});

test('cloud restore retains higher guest learning milestones without transferring extra currency',async()=>{
 const introduction={version:1,bestWave:5,skipped:false,legacy:false};const api=fakeApi(serverSave({introduction,diamonds:7}));
 const {a,storage,document}=load({accountApi:api,initialProfile:{introduction:{...introduction,bestWave:15},diamonds:1},initialStorage:{'tutorial-v1':''}});
 await submit(document,'login');endRun(a);await flush();const profile=JSON.parse(storage.get('hex-bastion-profile-v1'));
 assert.equal(profile.introduction.bestWave,15);assert.equal(profile.introduction.legacy,false);assert.equal(profile.activeLoadout.length,5);assert.equal(profile.diamonds,7);assert.equal(api.puts.at(-1).profile.introduction.bestWave,15);
});

test('account upload includes completed-wave checkpoint and another browser can resume it',async()=>{
 const api=fakeApi(),view=load({accountApi:api});await submit(view.document,'register');
 Object.assign(view.a.state,{wave:2,phase:'wave',waveRunning:true,enemies:[],pendingSpawns:0,spawnQueue:[]});view.a.endWave();
 await view.elements.get('accountSaveServerBtn').listeners.click();assert.ok(api.server.runAutosave?.checkpoint);assert.equal(api.server.format,'autohex-profile');
 const remote=fakeApi(api.server),next=load({bootToMenu:true,accountApi:remote});await submit(next.document,'login');
 assert.equal(next.elements.get('menuContinueBtn').classList.contains('hidden'),false);next.elements.get('menuContinueBtn').listeners.click();
 assert.equal(next.a.state.runId,view.a.state.runId);assert.equal(next.a.state.lastCompletedWave,2);
});


test('game preferences persist locally, upload to the account and restore in another browser', async()=>{
 const api=fakeApi(), first=load({accountApi:api});
 const set=(id,value)=>{const el=first.elements.get(id);el.checked=value;el.listeners.change({target:el});};
 set('slotHints',false);set('onboardingHints',false);set('hexGrid',true);set('upgradeStatus',true);set('autoStart',true);
 await submit(first.document,'register');
 assert.deepEqual(api.server.gameSettings,{slotHints:false,onboardingHints:false,hexGrid:true,upgradeStatus:true,autoStart:true,arsenalSeen:[],gameSpeed:1});
 const reload=load({initialStorage:Object.fromEntries(first.storage)});
 for(const [key,value] of Object.entries(api.server.gameSettings))if(typeof value==='boolean')assert.equal(reload.elements.get(key).checked,value,key);
 const second=load({accountApi:api});await flush();await flush();
 assert.equal(second.a.state.showHexGrid,true);assert.equal(second.a.state.showSlotHints,false);assert.equal(second.elements.get('autoStart').checked,true);
 second.a.newRun();assert.equal(second.a.state.showUpgradeStatus,true);assert.equal(second.a.state.showHexGrid,true);
});

test('settings changed during a deferred account restore do not overwrite cloud progress or revert at game end',async()=>{
 const api=fakeApi({...serverSave({diamonds:77}),gameSettings:{slotHints:false,hexGrid:true}}),r=load({accountApi:api,initialProfile:{diamonds:5}});
 await submit(r.document,'login');assert.equal(r.a.state.showSlotHints,false);
 const el=r.elements.get('slotHints');el.checked=true;el.listeners.change();
 await r.elements.get('accountSaveServerBtn').listeners.click();assert.equal(api.server.profile.diamonds,77);assert.equal(api.server.gameSettings.slotHints,true);
 endRun(r.a);await flush();assert.equal(r.a.state.showSlotHints,true);assert.equal(api.puts.at(-1).gameSettings.slotHints,true);
});

test('legacy and malformed cloud settings preserve existing preferences; dev settings stay isolated',async()=>{
 const api=fakeApi({...serverSave({}),gameSettings:{slotHints:'false',hexGrid:null,gameSpeed:999,autoStart:true}}),r=load({accountApi:api,initialStorage:{slotHints:'false',hexGrid:'true'}});
 await submit(r.document,'login');assert.equal(r.a.state.showSlotHints,false);assert.equal(r.a.state.showHexGrid,true);assert.equal(r.elements.get('doubleSpeed').value,'1');
 const testApi=fakeApi();testApi.loggedIn=true;const isolated=load({accountApi:testApi,firstPlayerTest:true});const e=isolated.elements.get('slotHints');e.checked=false;e.listeners.change();await flush();
 assert.equal(testApi.puts.length,0);assert.equal(isolated.storage.has('hex-game-settings-v1'),false);assert.ok(isolated.storage.has('autohex-first-player-test:hex-game-settings-v1'));
});


test('registration after defeat, archer unlock and reload retain the account upgrade and usable main menu',async()=>{
 const api=fakeApi(),r=load({accountApi:api,initialProfile:{diamonds:40,introduction:{version:1,bestWave:25,skipped:false,legacy:false}}});
 r.a.state.wave=26;endRun(r.a);await flush();r.elements.get('gameOverMenuBtn').listeners.click();
 await submit(r.document,'register');r.elements.get('menuArsenalBtn').listeners.click();
 const find=(el)=>el.attributes?.['data-unlock']==='ultimate:archer:volley'?el:(el.children||[]).map(find).find(Boolean);
 const button=find(r.elements.get('arsenalChoices'));assert.ok(button);button.listeners.click();
 await r.elements.get('accountSaveServerBtn').listeners.click();
 const before=JSON.parse(r.storage.get('hex-bastion-profile-v1'));assert.ok(before.unlocks.includes('ultimate:archer:volley'));
 const reboot=load({accountApi:api,bootToMenu:true,initialStorage:Object.fromEntries(r.storage)});await flush();await flush();
 assert.equal(reboot.elements.get('mainMenu').classList.contains('hidden'),false);
 assert.ok(reboot.a.state.map.size>0);
 assert.ok(JSON.parse(reboot.storage.get('hex-bastion-profile-v1')).unlocks.includes('ultimate:archer:volley'));
 reboot.elements.get('menuArsenalBtn').listeners.click();assert.equal(reboot.elements.get('arsenalOverlay').classList.contains('hidden'),false);
});
