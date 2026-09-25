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
    async putSave(text) { const data = JSON.parse(text); this.puts.push(data); this.server = data; return { updatedAt: 'now' }; } };
}
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
