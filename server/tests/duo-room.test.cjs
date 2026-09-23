const {test}=require('node:test'),assert=require('node:assert/strict');
const {createRoom}=require('../duo-room.cjs'),{createTransport}=require('../duo-transport.cjs');
const loadout=['archer','catapult','chain','freeze','mine'];
function setup(){const room=createRoom({seed:'private-seed',loadouts:[loadout,loadout]});const seats=[room.connect(0),room.connect(1)];return {room,seats};}
function packet(room,seat,action,payload){const v=room.view(seat.token);return {epoch:seat.epoch,sequence:v.next,wave:v.wave,phase:v.boards[seat.player].phase,action,payload};}
function place(room,seat){const v=room.view(seat.token),core=require('../../headless-core.cjs')();for(const [index,id] of v.boards[seat.player].hand.entries())for(let rotation=0;rotation<6;rotation++)if(core.map.rotatedRoads(core.data.CARD_LIBRARY[id],rotation).includes(3))return packet(room,seat,'place',{q:1,r:0,index,rotation});throw Error('No opening');}
test('binding, malformed payloads, stale phases and sequence retries protect authoritative state',()=>{
 const {room,seats:[a,b]}=setup();assert.throws(()=>room.connect(0));assert.equal(room.receive('wrong',{}).reason,'unauthorized');
 const cmd=place(room,a),before=room.view(a.token);for(const payload of [null,[],{},'x',{slots:'bad'}])assert.equal(room.receive(a.token,{...cmd,action:'tower',payload}).ok,false);
 assert.deepEqual(room.view(a.token),before);assert.equal(room.receive(a.token,{...cmd,player:1}).reason,'invalid');
 assert.equal(room.receive(a.token,cmd).ok,true);assert.equal(room.receive(a.token,cmd).duplicate,true);assert.equal(room.view(b.token).boards[1].map.length,1);assert.equal(room.view(a.token).boards[0].map.length,2);
 assert.equal(room.receive(a.token,{...cmd,sequence:2}).reason,'stale');assert.equal(room.view(a.token).next,3);
 const buy=packet(room,a,'tower',{type:'archer',slots:[{q:1,r:0,index:0}]});assert.equal(room.receive(a.token,buy).ok,true);assert.equal(room.receive(a.token,buy).duplicate,true);assert.equal(room.view(a.token).boards[0].gold,45);
 assert.equal(room.receive(a.token,cmd).reason,'sequence');
});
test('network views omit random streams, partner draw order, partner hand and unrevealed event details; returned data cannot mutate the room',()=>{
 const {room,seats:[a]}=setup(),view=room.view(a.token),encoded=JSON.stringify(view);assert.ok(!encoded.includes('private-seed'));for(const field of ['spawnQueue','biomeSeed','random','settledRuns'])assert.ok(!encoded.includes('"'+field+'"'));assert.ok(Array.isArray(view.boards[0].drawPile));assert.equal(view.boards[1].drawPile,undefined);assert.equal(view.boards[1].hand,undefined);assert.equal(view.boards[1].rewardOffer,undefined);view.boards[0].map[0].roads.push(99);assert.ok(!room.view(a.token).boards[0].map[0].roads.includes(99));assert.ok(view.boards.flatMap(b=>b.landmarks).filter(l=>!l.type).every(l=>Object.keys(l).length===2));
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

 test('disconnect pauses both boards, reserves seats and resumes without catch-up or duplicate purchases',()=>{
 let time=0;const room=createRoom({seed:'return',loadouts:[loadout,loadout],now:()=>time}),a=room.connect(0),b=room.connect(1);
 for(const seat of [a,b])assert.equal(room.receive(seat.token,place(room,seat)).ok,true);
 const buy=packet(room,a,'tower',{type:'archer',slots:[{q:1,r:0,index:0}]});assert.equal(room.receive(a.token,buy).ok,true);
 for(const seat of [a,b])assert.equal(room.receive(seat.token,packet(room,seat,'ready',{value:true})).ok,true);
 room.tick();const before=room.view(a.token);time=10001;room.touch(a.token);room.tick();const paused=room.view(a.token);
 assert.equal(paused.connection.paused,true);assert.equal(paused.connection.players[1],'disconnected');assert.deepEqual(paused.boards,before.boards);assert.throws(()=>room.connect(1));assert.equal(room.touch('wrong'),false);
 assert.equal(room.receive(a.token,packet(room,a,'ready',{value:false})).reason,'disconnected');
 time=11000;room.touch(b.token);assert.equal(room.view(a.token).connection.paused,false);assert.equal(room.receive(a.token,buy).reason,'sequence');room.tick();assert.equal(room.view(a.token).boards[0].elapsedMs,before.boards[0].elapsedMs+50);assert.equal(room.view(a.token).boards[0].gold,before.boards[0].gold);
 });

 test('lost acknowledgement remains idempotent across reconnect; expired grace cannot resurrect a match',()=>{
 let time=0;const room=createRoom({loadouts:[loadout,loadout],now:()=>time}),a=room.connect(0),b=room.connect(1);const cmd=place(room,a);assert.equal(room.receive(a.token,cmd).ok,true);
 time=10001;room.touch(b.token);assert.equal(room.view(b.token).connection.paused,true);time=11000;room.touch(a.token);assert.equal(room.receive(a.token,cmd).duplicate,true);assert.equal(room.view(a.token).boards[0].map.length,2);
 time=141001;assert.equal(room.touch(a.token),false);assert.equal(room.view(a.token).connection.expired,true);const state=room.view(a.token).boards;room.tick();assert.deepEqual(room.view(a.token).boards,state);
 });

 test('waiting in a lobby does not consume the reconnect window before the partner joins',()=>{
 let time=0;const room=createRoom({loadouts:[loadout,loadout],now:()=>time}),a=room.connect(0);time=600000;room.connect(1);assert.equal(room.view(a.token).connection.expired,false);assert.equal(room.view(a.token).connection.paused,false);
 });

test('guardian votes are seat-bound, idempotent and visible to both players after restart',()=>{
 const initial=setup(),snapshot=initial.room.checkpoint(),core=require('../../headless-core.cjs')(),m=core.duo.restore(snapshot.match);m.boards[0].state.landmarks.set('1,0',{q:1,r:0,type:'boss',claimed:true,status:'pending',consent:[false,false]});snapshot.match=core.duo.capture(m);let room=createRoom({snapshot});const [a,b]=initial.seats;for(const seat of [a,b])room.touch(seat.token);
 const vote=packet(room,a,'guardian',{board:0,id:'1,0',value:true});assert.ok(room.receive(a.token,vote).ok);assert.equal(room.receive(a.token,vote).duplicate,true);let landmark=room.view(b.token).boards[0].landmarks.find(l=>l.q===1&&l.r===0);assert.deepEqual(landmark.consent,[true,false]);assert.equal(landmark.status,'pending');
 assert.equal(room.receive(b.token,packet(room,b,'guardian',{board:0,id:'1,0',value:true,player:0})).ok,false);room=createRoom({snapshot:room.checkpoint()});for(const seat of [a,b])room.touch(seat.token);assert.ok(room.receive(b.token,packet(room,b,'guardian',{board:0,id:'1,0',value:true})).ok);landmark=room.view(a.token).boards[0].landmarks.find(l=>l.q===1&&l.r===0);assert.equal(landmark.status,'ready');
});
