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
    async logout() { this.loggedIn = false; },
    async currentUser() { return this.loggedIn ? { id: 1, username: 'phil' } : null; },
    async getSave() { return this.server; },
    async putSave(text) { const data = JSON.parse(text); this.puts.push(data); this.server = data; return { updatedAt: 'now' }; },
    exchanges: [], exchangeUser: { id: 3, username: 'streamer' },
    async exchangeCode(code) { this.exchanges.push(code); this.loggedIn = true; return this.exchangeUser; },
    twitchLoginUrl() { return 'https://api.test/auth/twitch'; },
    async twitchLinkUrl() { return 'https://api.test/auth/twitch?link=einmal'; } };
}
const twitchReturn = hash => ({ hash, pathname: '/', search: '', href: 'https://spiel.test/' + hash });
const flush = () => new Promise(resolve => setImmediate(resolve));
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
  assert.equal(elements.get('menuAccountBtn').textContent, '👤 neu');
  assert.equal(elements.get('accountStatus').dataset.kind, 'success');
});

test('without an account nothing is sent and the result screen suggests signing in', async () => {
  const api = fakeApi(), { a, elements } = load({ accountApi: api });
  endRun(a); await flush();
  assert.equal(api.puts.length, 0);
  assert.match(elements.get('cloudSaveNote').textContent, /Account/);
});

test('returning from Twitch exchanges the one-time code, strips the hash and signs in', async () => {
  const api = fakeApi(), location = twitchReturn('#twitch=einmalcode');
  const { elements } = load({ accountApi: api, location }); await flush(); await flush();
  assert.deepEqual(api.exchanges, ['einmalcode']);
  assert.equal(location.hash, '', 'Code bleibt nicht in der Adresse');
  assert.equal(location.replacedWith, '/');
  assert.equal(elements.get('accountOverlay').classList.contains('hidden'), false, 'Account-Fenster zeigt das Ergebnis');
  assert.equal(elements.get('menuAccountBtn').textContent, '👤 streamer');
  assert.equal(elements.get('accountStatus').dataset.kind, 'success');
  assert.equal(api.puts.length, 1, 'neuer Twitch-Account ohne Server-Stand bekommt den lokalen Fortschritt');
});

test('returning from Twitch to the same account reports the link instead of a new sign-in', async () => {
  const api = fakeApi(); api.loggedIn = true; api.exchangeUser = { id: 1, username: 'phil' };
  const { elements } = load({ accountApi: api, location: twitchReturn('#twitch=verknuepft') }); await flush(); await flush();
  assert.deepEqual(api.exchanges, ['verknuepft']);
  assert.match(elements.get('accountStatus').textContent, /verknüpft/);
});

test('a Twitch error reason is shown without contacting the server', async () => {
  const api = fakeApi(), location = twitchReturn('#twitch_error=twitch_in_use');
  const { elements } = load({ accountApi: api, location }); await flush();
  assert.equal(api.exchanges.length, 0);
  assert.equal(location.hash, '');
  assert.equal(elements.get('accountStatus').dataset.kind, 'error');
  assert.match(elements.get('accountStatus').textContent, /anderen Account/);
});

test('leaving for Twitch during a run needs a second click, linking fetches the link address first', async () => {
  const api = fakeApi(), location = twitchReturn('');
  const { elements, globalListeners } = load({ accountApi: api, location }); await flush();
  await elements.get('accountTwitchBtn').listeners.click();
  assert.equal(location.href, 'https://spiel.test/', 'erster Klick warnt nur');
  assert.match(elements.get('accountStatus').textContent, /laufende Spiel/);
  await elements.get('accountTwitchBtn').listeners.click();
  assert.equal(location.href, 'https://api.test/auth/twitch');
  assert.equal(elements.get('accountTwitchBtn').disabled, true, 'während der Weiterleitung gesperrt');
  globalListeners.pageshow({ persisted: true });   // per Zurück-Taste aus dem Cache
  assert.equal(elements.get('accountTwitchBtn').disabled, false);
  api.loggedIn = true; elements.get('menuAccountBtn').listeners.click(); await flush();
  await elements.get('accountTwitchLinkBtn').listeners.click(); await elements.get('accountTwitchLinkBtn').listeners.click();
  assert.equal(location.href, 'https://api.test/auth/twitch?link=einmal');
});
