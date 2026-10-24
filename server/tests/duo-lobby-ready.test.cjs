const { test } = require('node:test'), assert = require('node:assert/strict'), { randomUUID } = require('node:crypto');
const { createLobbies } = require('../duo-lobbies.cjs'), { createTransport } = require('../duo-transport.cjs');
function command(room, seat, action, payload) { const v = room.view(seat.token); return room.receive(seat.token, { epoch: v.epoch, sequence: v.next, wave: v.wave, phase: v.boards[seat.player].phase, action, payload }); }
test('both lobby seats must explicitly confirm before gameplay; readiness persists and cannot be bypassed', () => {
	let room = createLobbies({ now: () => 0 }); const a = room.create({ requestId: randomUUID() }), b = room.join({ requestId: randomUUID(), code: a.code });
	assert.equal(command(room, a, 'pause', { value: true }).reason, 'lobby-not-ready');
	assert.ok(command(room, a, 'lobbyReady', { value: true }).ok); assert.equal(room.view(a.token).lobbyState.started, false); room.tick(); assert.equal(room.view(a.token).wave, 0);
	assert.ok(command(room, a, 'lobbyReady', { value: false }).ok); assert.deepEqual(room.view(a.token).lobbyState.ready, [false, false]);
	assert.ok(command(room, a, 'lobbyReady', { value: true }).ok); room = createLobbies({ now: () => 0, snapshot: JSON.parse(JSON.stringify(room.checkpoint())) }); room.touch(a.token); room.touch(b.token);
	assert.deepEqual(room.view(b.token).lobbyState.ready, [true, false]); assert.ok(command(room, b, 'lobbyReady', { value: true }).ok); assert.equal(room.view(a.token).lobbyState.started, true);
	assert.equal(room.view(a.token).wave, 0, 'enter preparation together, not the first combat wave'); assert.ok(command(room, a, 'pause', { value: true }).ok); assert.equal(room.view(b.token).paused, true); assert.ok(command(room, b, 'pause', { value: false }).ok);
	assert.ok(command(room, a, 'speed', { value: 4 }).ok); assert.equal(room.view(b.token).speed, 4); assert.equal(command(room, a, 'speed', { value: 99 }).ok, false);
	assert.ok(command(room, a, 'baseUpgrade', { kind: 'walls' }).ok); assert.equal(room.view(b.token).maxHp, 45); assert.equal(room.view(a.token).boards[0].gold, 35);
});
test('local Duo server serves the shared game, 3D dependencies and lobby while private files remain inaccessible', async t => {
	const server = createTransport(createLobbies(), { browser: true }); await new Promise(r => server.listen(0, '127.0.0.1', r)); t.after(() => new Promise(r => { server.closeAllConnections(); server.close(r); })); const base = 'http://127.0.0.1:' + server.address().port;
	for (const file of ['/index.html', '/admin.html', '/runtime-config.js', '/admin.css', '/duo.css', '/style.css', '/classes/admin.js', '/classes/game.js', '/classes/duo-game.js', '/node_modules/three/build/three.module.js', '/duo-lobby.html']) { const r = await fetch(base + file); assert.equal(r.status, 200, file); if (file.endsWith('.css')) assert.match(r.headers.get('content-type'), /text\/css/); }
	for (const file of ['/server/duo-store.cjs', '/.git/config', '/assets/%2e%2e/server/duo-store.cjs']) assert.notEqual((await fetch(base + file)).status, 200, file);
});
test('shared-screen targeting and sale affect only the authenticated board and survive restore', () => {
	let room = createLobbies({ now: () => 0 }); const a = room.create({ requestId: randomUUID() }), b = room.join({ requestId: randomUUID(), code: a.code });
	command(room, a, 'lobbyReady', { value: true }); command(room, b, 'lobbyReady', { value: true });
	const board = room.view(a.token).boards[0]; let placement;
	board.placements.some((rotations, index) => rotations.some((cells, rotation) => { const cell = cells.find(c => c.legal); if (cell) placement = { q: cell.q, r: cell.r, index, rotation }; return !!cell; }));
	assert.ok(command(room, a, 'place', placement).ok);
	const tile = room.view(a.token).boards[0].map.find(t => t.slots > 0), slot = { q: tile.q, r: tile.r, index: 0 };
	assert.ok(command(room, a, 'tower', { type: 'archer', slots: [slot] }).ok);
	assert.ok(command(room, a, 'targetPriority', { slot, priorities: ['healer', 'boss', 'closestBase'] }).ok);
	assert.equal(command(room, b, 'sellTower', { slot }).ok, false);
	room = createLobbies({ now: () => 0, snapshot: JSON.parse(JSON.stringify(room.checkpoint())) }); room.touch(a.token); room.touch(b.token);
	const own = () => room.view(a.token).boards[0], built = () => own().map.find(t => t.q === slot.q && t.r === slot.r).towers[0];
	assert.deepEqual(built().targetPriority, ['healer', 'boss', 'closestBase']);
	const gold = own().gold; assert.ok(command(room, a, 'sellTower', { slot }).ok); assert.equal(own().gold, gold + 25); assert.equal(built(), null);
	assert.equal(command(room, a, 'sellTower', { slot }).ok, false, 'sale cannot pay twice');
});

test('lobby loadouts are selectable before partner joins, shared, validated and persistent',()=>{
 let room=createLobbies({now:()=>0});const a=room.create({requestId:randomUUID()}),chosen=['flame','ballista','element','necromancer','freeze'];
 const before=room.view(a.token).boards[0];assert.ok(command(room,a,'lobbyLoadout',{towers:chosen}).ok);
 assert.deepEqual(room.view(a.token).lobbyState.loadouts[0],chosen);assert.equal(room.view(a.token).boards[0].gold,before.gold);
 const b=room.join({requestId:randomUUID(),code:a.code});assert.deepEqual(room.view(b.token).lobbyState.loadouts[0],chosen);
 command(room,a,'lobbyReady',{value:true});command(room,b,'lobbyLoadout',{towers:['archer','catapult','freeze','mine','flame']});assert.deepEqual(room.view(a.token).lobbyState.ready,[true,false]);
 for(const towers of [chosen.slice(1),[...chosen,'mine'],['mine','mine','mine','mine','mine'],['unknown',...chosen.slice(1)]])assert.equal(command(room,a,'lobbyLoadout',{towers}).ok,false);
 const checkpoint=room.checkpoint();room=createLobbies({now:()=>0,snapshot:JSON.parse(JSON.stringify(checkpoint))});room.touch(a.token);room.touch(b.token);assert.deepEqual(room.view(a.token).lobbyState.loadouts[0],chosen);
 command(room,a,'lobbyReady',{value:true});command(room,b,'lobbyReady',{value:true});assert.equal(command(room,a,'lobbyLoadout',{towers:chosen}).ok,false);assert.deepEqual(room.view(a.token).boards[0].loadout,chosen);
});

test('only the reviewed 1.2.0 to 1.2.1 room transition is compatible',()=>{const {compatibleRuleset}=require('../duo-room.cjs');assert.equal(compatibleRuleset('1.2.0','1.2.1'),true);assert.equal(compatibleRuleset('1.1.9','1.2.1'),false);assert.equal(compatibleRuleset('1.2.1','1.2.0'),false);});

test('release 1.2.1 restores a 1.2.0 wave-30 checkpoint without changing either board',()=>{
 const {createRoom}=require('../duo-room.cjs'),core=require('../../headless-core.cjs')(),room=createRoom({seed:'release-preservation',loadouts:Array(2).fill(['archer','catapult','chain','freeze','mine'])});room.connect(0);room.connect(1);
 const snapshot=room.checkpoint(),match=core.duo.restore(snapshot.match);match.wave=30;match.phase='combat';for(const run of match.boards){run.state.wave=30;run.state.phase='wave';run.state.waveRunning=true;run.state.gold=321;run.state.spawnQueue=[];run.state.pendingSpawns=0;}snapshot.match=core.duo.capture(match);snapshot.ruleset='1.2.0';
 const code="const p=require.resolve('./package.json');require(p);require.cache[p].exports={...require.cache[p].exports,version:'1.2.1'};const s=JSON.parse(require('fs').readFileSync(0,'utf8'));const r=require('./server/duo-room.cjs').createRoom({snapshot:s});process.stdout.write(JSON.stringify(r.checkpoint()));";
 const result=JSON.parse(require('node:child_process').execFileSync(process.execPath,['-e',code],{cwd:require('node:path').resolve(__dirname,'../..'),input:JSON.stringify(snapshot),encoding:'utf8'}));
 assert.equal(result.ruleset,'1.2.1');assert.deepEqual(result.match,JSON.parse(JSON.stringify(snapshot.match)));assert.deepEqual(result.seats.map(s=>s.token),snapshot.seats.map(s=>s.token));
});
