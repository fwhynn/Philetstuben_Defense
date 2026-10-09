'use strict';
const path = require('node:path'), os = require('node:os'), fs = require('node:fs'), { createStore } = require('./duo-store.cjs'), { createTransport } = require('./duo-transport.cjs'), { createVisits, createAdminCheck } = require('./site-visits.cjs');
const root = path.resolve(__dirname, '..');
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const original of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = original.trim().replace(/^export\s+/, '');
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, '').trim();
    process.env[match[1]] = value;
  }
}
loadEnv(path.join(root, '.env'));
const saveFile = path.resolve(process.env.DUO_SAVE_FILE || path.join(os.homedir(), '.autohex-duo/checkpoint.json'));
const rooms = createStore(saveFile, { maintenance: process.env.DUO_MAINTENANCE === '1' });
// Page view counter for the admin dashboard; stored next to the Duo checkpoint.
const visits = createVisits(path.resolve(process.env.DUO_VISITS_FILE || path.join(path.dirname(saveFile), 'visits.json')), { timeZone: process.env.DUO_VISITS_TIME_ZONE || 'Europe/Berlin' });
visits.startAutosave();
const accountApi = process.env.DUO_ACCOUNT_API_URL || process.env.API_BASE_URL || 'https://api.autohextd.zlyfer.net';
const verifyAdmin = createAdminCheck(accountApi);
console.log('Besucherzähler aktiv · Admin-Prüfung über ' + accountApi + '/me');
const server = createTransport(rooms, { browser: true, autoTick: true, publicOrigin: process.env.DUO_PUBLIC_ORIGIN || null, liveSecret: process.env.DUO_LIVE_SECRET || null, visits, verifyAdmin, trustProxy: process.env.DUO_TRUST_PROXY === '1' });
server.listen(Number(process.env.DUO_PORT) || 8090, process.env.DUO_HOST || '127.0.0.1', () => console.log('Duo-Lobby: http://127.0.0.1:' + server.address().port + '/ · Automatische Speicherung aktiv.'));
let administration = null; if (process.stdin.isTTY) { const readline = administration = require('node:readline').createInterface({ input: process.stdin }); console.log('Lokale Verwaltung: maintenance on / maintenance off / status'); readline.on('line', line => { const command = line.trim(); try { if (command === 'maintenance on' || command === 'maintenance off') { rooms.setMaintenance(command.endsWith('on')); console.log(rooms.maintenance ? 'Wartung aktiv; Partien pausiert und gespeichert.' : 'Wartung beendet.'); } else if (command === 'status') console.log(rooms.healthy ? (rooms.maintenance ? 'Wartung aktiv.' : 'Server bereit.') : 'Speicherfehler; Server gesperrt.'); } catch { console.error('Verwaltungsaktion fehlgeschlagen; Speicherstatus prüfen.'); } }); }
let closing = false; function stop() { if (closing) return; closing = true; administration?.close(); if (process.stdin.isTTY) process.stdin.pause(); server.quiesce(); try { rooms.backup(); } catch { console.error('Duo checkpoint could not be saved.'); process.exitCode = 1; } try { visits.close(); } catch { console.error('Besucherzähler konnte nicht gespeichert werden.'); } server.close(); server.closeAllConnections(); }
process.on('SIGINT', stop); process.on('SIGTERM', stop);
