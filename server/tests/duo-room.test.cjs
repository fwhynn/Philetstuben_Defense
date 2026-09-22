const {test}=require('node:test'),assert=require('node:assert/strict');
const {createRoom}=require('../duo-room.cjs'),{createTransport}=require('../duo-transport.cjs');
const loadout=['archer','catapult','chain','freeze','mine'];
function setup(){const room=createRoom({seed:'private-seed',loadouts:[loadout,loadout]});const seats=[room.connect(0),room.connect(1)];return {room,seats};}
function packet(room,seat,action,payload){const v=room.view(seat.token);return {epoch:seat.epoch,sequence:v.next,wave:v.wave,phase:v.boards[seat.player].phase,action,payload};}
function place(room,seat){const v=room.view(seat.token),core=require('../../towerdefense-v0.1/headless-core.cjs')();for(const [index,id] of v.boards[seat.player].hand.entries())for(let rotation=0;rotation<6;rotation++)if(core.map.rotatedRoads(core.data.CARD_LIBRARY[id],rotation).includes(3))return packet(room,seat,'place',{q:1,r:0,index,rotation});throw Error('No opening');}
test('binding, malformed payloads, stale phases and sequence retries protect authoritative state',()=>{
 const {room,seats:[a,b]}=setup();assert.throws(()=>room.connect(0));assert.equal(room.receive('wrong',{}).reason,'unauthorized');
 const cmd=place(room,a),before=room.view(a.token);for(const payload of [null,[],{},'x',{slots:'bad'}])assert.equal(room.receive(a.token,{...cmd,action:'tower',payload}).ok,false);
 assert.deepEqual(room.view(a.token),before);assert.equal(room.receive(a.token,{...cmd,player:1}).reason,'invalid');
 assert.equal(room.receive(a.token,cmd).ok,true);assert.equal(room.receive(a.token,cmd).duplicate,true);assert.equal(room.view(b.token).boards[1].map.length,1);assert.equal(room.view(a.token).boards[0].map.length,2);
 assert.equal(room.receive(a.token,{...cmd,sequence:2}).reason,'stale');assert.equal(room.view(a.token).next,3);
 const buy=packet(room,a,'tower',{type:'archer',slots:[{q:1,r:0,index:0}]});assert.equal(room.receive(a.token,buy).ok,true);assert.equal(room.receive(a.token,buy).duplicate,true);assert.equal(room.view(a.token).boards[0].gold,45);
 assert.equal(room.receive(a.token,cmd).reason,'sequence');
});
test('network views omit random streams, draw order, partner hand and unrevealed event details; returned data cannot mutate the room',()=>{
 const {room,seats:[a]}=setup(),view=room.view(a.token),encoded=JSON.stringify(view);assert.ok(!encoded.includes('private-seed'));for(const field of ['drawPile','spawnQueue','biomeSeed','random','settledRuns'])assert.ok(!encoded.includes('"'+field+'"'));assert.equal(view.boards[1].hand,undefined);assert.equal(view.boards[1].rewardOffer,undefined);view.boards[0].map[0].roads.push(99);assert.ok(!room.view(a.token).boards[0].map[0].roads.includes(99));assert.ok(view.boards.flatMap(b=>b.landmarks).filter(l=>!l.type).every(l=>Object.keys(l).length===2));
});
test('two real HTTP clients share a server match and may only build on their own board',async t=>{
 const {room,seats:[a,b]}=setup(),server=createTransport(room);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));const url='http://127.0.0.1:'+server.address().port;
 const command=(seat,cmd)=>fetch(url+'/command',{method:'POST',headers:{Authorization:'Bearer '+seat.token},body:JSON.stringify(cmd)}).then(r=>r.json());
 assert.equal((await fetch(url+'/state')).status,401);assert.equal((await command(a,place(room,a))).ok,true);assert.equal((await command(b,place(room,b))).ok,true);
 assert.equal((await command(a,packet(room,a,'ready',{value:true}))).ok,true);assert.equal(room.view(a.token).wave,0);assert.equal((await command(b,packet(room,b,'ready',{value:true}))).ok,true);assert.equal(room.view(a.token).wave,1);room.tick();
 const av=await fetch(url+'/state',{headers:{Authorization:'Bearer '+a.token}}).then(r=>r.json()),bv=await fetch(url+'/state',{headers:{Authorization:'Bearer '+b.token}}).then(r=>r.json());assert.equal(av.hp,bv.hp);assert.equal(av.wave,bv.wave);assert.equal(av.player,0);assert.equal(bv.player,1);
});

test('rate limiting and foreign match epochs reject commands without affecting the match',()=>{
 const {room,seats:[a]}=setup(),before=room.view(a.token),cmd=place(room,a);assert.equal(room.receive(a.token,{...cmd,epoch:'another-match'}).reason,'invalid');let result;for(let i=0;i<50;i++)result=room.receive(a.token,{...cmd,payload:null});assert.equal(result.reason,'rate-limit');assert.deepEqual(room.view(a.token),before);
});
