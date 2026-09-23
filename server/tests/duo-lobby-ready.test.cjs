const {test}=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const {createLobbies}=require('../duo-lobbies.cjs'),{createTransport}=require('../duo-transport.cjs');
function command(room,seat,action,payload){const v=room.view(seat.token);return room.receive(seat.token,{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[seat.player].phase,action,payload});}
test('both lobby seats must explicitly confirm before gameplay; readiness persists and cannot be bypassed',()=>{
 let room=createLobbies({now:()=>0});const a=room.create({requestId:randomUUID()}),b=room.join({requestId:randomUUID(),code:a.code});
 assert.equal(command(room,a,'pause',{value:true}).reason,'lobby-not-ready');
 assert.ok(command(room,a,'lobbyReady',{value:true}).ok);assert.equal(room.view(a.token).lobbyState.started,false);room.tick();assert.equal(room.view(a.token).wave,0);
 assert.ok(command(room,a,'lobbyReady',{value:false}).ok);assert.deepEqual(room.view(a.token).lobbyState.ready,[false,false]);
 assert.ok(command(room,a,'lobbyReady',{value:true}).ok);room=createLobbies({now:()=>0,snapshot:JSON.parse(JSON.stringify(room.checkpoint()))});room.touch(a.token);room.touch(b.token);
 assert.deepEqual(room.view(b.token).lobbyState.ready,[true,false]);assert.ok(command(room,b,'lobbyReady',{value:true}).ok);assert.equal(room.view(a.token).lobbyState.started,true);
 assert.equal(room.view(a.token).wave,0,'enter preparation together, not the first combat wave');assert.ok(command(room,a,'pause',{value:true}).ok);assert.equal(room.view(b.token).paused,true);assert.ok(command(room,b,'pause',{value:false}).ok);
 assert.ok(command(room,a,'speed',{value:4}).ok);assert.equal(room.view(b.token).speed,4);assert.equal(command(room,a,'speed',{value:99}).ok,false);
 assert.ok(command(room,a,'baseUpgrade',{kind:'walls'}).ok);assert.equal(room.view(b.token).maxHp,45);assert.equal(room.view(a.token).boards[0].gold,35);
});
test('local Duo server serves the shared game, 3D dependencies and lobby while private files remain inaccessible',async t=>{
 const server=createTransport(createLobbies(),{browser:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{server.closeAllConnections();server.close(r);}));const base='http://127.0.0.1:'+server.address().port;
 for(const file of ['/index.html','/duo.css','/style.css','/classes/game.js','/classes/duo-game.js','/node_modules/three/build/three.module.js','/duo-lobby.html']){const r=await fetch(base+file);assert.equal(r.status,200,file);if(file.endsWith('.css'))assert.match(r.headers.get('content-type'),/text\/css/);}
 for(const file of ['/server/duo-store.cjs','/.git/config','/assets/%2e%2e/server/duo-store.cjs'])assert.notEqual((await fetch(base+file)).status,200,file);
});
test('shared-screen targeting and sale affect only the authenticated board and survive restore',()=>{
 let room=createLobbies({now:()=>0});const a=room.create({requestId:randomUUID()}),b=room.join({requestId:randomUUID(),code:a.code});
 command(room,a,'lobbyReady',{value:true});command(room,b,'lobbyReady',{value:true});
 const board=room.view(a.token).boards[0];let placement;
 board.placements.some((rotations,index)=>rotations.some((cells,rotation)=>{const cell=cells.find(c=>c.legal);if(cell)placement={q:cell.q,r:cell.r,index,rotation};return !!cell;}));
 assert.ok(command(room,a,'place',placement).ok);
 const tile=room.view(a.token).boards[0].map.find(t=>t.slots>0),slot={q:tile.q,r:tile.r,index:0};
 assert.ok(command(room,a,'tower',{type:'archer',slots:[slot]}).ok);
 assert.ok(command(room,a,'targetPriority',{slot,priorities:['healer','boss','closestBase']}).ok);
 assert.equal(command(room,b,'sellTower',{slot}).ok,false);
 room=createLobbies({now:()=>0,snapshot:JSON.parse(JSON.stringify(room.checkpoint()))});room.touch(a.token);room.touch(b.token);
 const own=()=>room.view(a.token).boards[0],built=()=>own().map.find(t=>t.q===slot.q&&t.r===slot.r).towers[0];
 assert.deepEqual(built().targetPriority,['healer','boss','closestBase']);
 const gold=own().gold;assert.ok(command(room,a,'sellTower',{slot}).ok);assert.equal(own().gold,gold+25);assert.equal(built(),null);
 assert.equal(command(room,a,'sellTower',{slot}).ok,false,'sale cannot pay twice');
});
