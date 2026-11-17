'use strict';
const fs = require('node:fs'), path = require('node:path'), { createLobbies } = require('./duo-lobbies.cjs');
// Private server data, never a downloadable profile or a public static asset.
function createStore(file, { now = () => Date.now(), write = atomicWrite, maintenance = false, partitioned = false, limit = 8 } = {}) {
	const loaded = require('./duo-partitioned-storage.cjs').readCheckpoint(file), {text,snapshot} = loaded;
	if(loaded.pool)throw Error('Use the worker pool for this checkpoint');
	partitioned = partitioned || !!loaded.index;
	const rooms = createLobbies({ now, snapshot, maintenance, limit }); let failed = false, lastSaved = now(), lastText = text;
	const storage = partitioned ? require('./duo-partitioned-storage.cjs').createPartitionedStorage(file, loaded, {write}) : null;
	// Matches saved by another release are dropped on start; keep the untouched original next to it.
	if (rooms.discarded) { atomicWrite(file + '.incompatible-' + new Date(now()).toISOString().replace(/[:.]/g, '-'), loaded.index ? JSON.stringify(snapshot) : text); console.warn('Duo: ' + rooms.discarded + ' Partie(n) aus einer anderen Version verworfen; alte Datei gesichert.'); }
	function flush() { if (failed) throw Error('Duo storage unavailable'); try { if(storage)storage.commit(rooms.checkpointParts());else { const next = rooms.serializeCheckpoint(); if (next !== lastText) { write(file, next); lastText = next; } } lastSaved = now(); } catch (error) { failed = true; throw error; } }
	const change = (method, ...args) => { if (failed) throw Error('Duo storage unavailable'); const result = rooms[method](...args); flush(); return result; };
	if (rooms.discarded || partitioned && !loaded.index) flush();
	return { routing:()=>rooms.routing(), applyAugments:(token,profile,guest)=>change('applyAugments',token,profile,guest), hasSeat:token=>rooms.hasSeat(token), pushKey:token=>rooms.pushKey(token), discarded: rooms.discarded, receipts: token => rooms.receipts(token), get maintenance() { return rooms.maintenance; }, setMaintenance: enabled => change('setMaintenance', enabled), get healthy() { return !failed; }, flush, backup() { flush(); const saved = require('./duo-partitioned-storage.cjs').readCheckpoint(file); atomicWrite(file + '.before-update', saved.index ? JSON.stringify(saved.snapshot) : saved.text); }, live: () => rooms.live(), claim(token, clientId, takeover) { if (failed) throw Error('Duo storage unavailable'); const result = rooms.claim(token, clientId, takeover); if (result.changed) flush(); return result; }, leave: token => change('leave', token), create: (...args) => change('create', ...args), join: body => change('join', body), receive: (token, packet) => change('receive', token, packet), view: token => rooms.view(token), touch: token => rooms.touch(token), tick() { if (failed) return; const settled = rooms.tick(); if (settled || now() - lastSaved >= 1000) try { flush(); } catch { console.error('Duo storage failed; simulation stopped.'); } } };
}
function atomicWrite(file, data) {
	fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
	const temporary = file + '.tmp', fd = fs.openSync(temporary, 'w', 0o600);
	try { fs.writeFileSync(fd, data, 'utf8'); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
	fs.renameSync(temporary, file);
	// Persist the rename as well as the file contents on Linux.
	if (process.platform !== 'win32') { const dir = fs.openSync(path.dirname(file), 'r'); try { fs.fsyncSync(dir); } finally { fs.closeSync(dir); } }
}
module.exports = { createStore, atomicWrite };
