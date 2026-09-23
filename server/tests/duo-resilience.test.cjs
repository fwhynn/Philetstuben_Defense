const {test}=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const {createRoom}=require('../duo-room.cjs'),{createTransport}=require('../duo-transport.cjs'),{createLobbies}=require('../duo-lobbies.cjs');
const loadout=['archer','catapult','chain','freeze','mine'];
function command(room,seat,action,payload){const v=room.view(seat.token);return {epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[seat.player].phase,action,payload};}
function opening(room,seat){const b=room.view(seat.token).boards[seat.player];for(let index=0;index<b.placements.length;index++)for(let rotation=0;rotation<6;rotation++){const p=b.placements[index][rotation].find(p=>p.legal);if(p)return {q:p.q,r:p.r,index,rotation};}throw Error('No opening');}
async function start(t,room){const server=createTransport(room);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));return 'http://127.0.0.1:'+server.address().port;}
test('parallel identical commands, invalid JSON, oversized packets and reconnecting HTTP clients preserve a single purchase',async t=>{
 const room=createRoom({loadouts:[loadout,loadout]}),a=room.connect(0);room.connect(1);const url=await start(t,room),headers={Authorization:'Bearer '+a.token};
 const post=body=>fetch(url+'/command',{method:'POST',headers,body});
 assert.equal((await post('{')).status,400);assert.equal((await post('x'.repeat(9000))).status,413);
 const place=command(room,a,'place',opening(room,a));assert.ok((await post(JSON.stringify(place)).then(r=>r.json())).ok);
 const buy=command(room,a,'tower',{type:'archer',slots:[{q:place.payload.q,r:place.payload.r,index:0}]}),before=room.view(a.token).boards[0].gold;
 const replies=await Promise.all(Array.from({length:8},()=>post(JSON.stringify(buy)).then(r=>r.json())));assert.ok(replies.every(r=>r.ok));assert.equal(replies.filter(r=>r.duplicate).length,7);assert.equal(room.view(a.token).boards[0].gold,before-25);
 // A new HTTP connection with the same token sees the original seat and command sequence.
 const resumed=await fetch(url+'/state',{headers:{...headers,Connection:'close'}}).then(r=>r.json());assert.equal(resumed.player,0);assert.equal(resumed.next,buy.sequence+1);assert.equal(resumed.boards[0].gold,before-25);
 const altered=await post(JSON.stringify({...buy,payload:{...buy.payload,type:'mine'}})).then(r=>r.json());assert.equal(altered.reason,'sequence');assert.equal(room.view(a.token).boards[0].gold,before-25);
});
test('malformed action corpus cannot crash or mutate the room',()=>{
 let now=0;const room=createRoom({loadouts:[loadout,loadout],now:()=>now}),seat=room.connect(0);room.connect(1);
 const corpus=[null,true,[],{},'bad',0,{q:NaN,r:Infinity,index:-1},{slots:[null]},{slot:{q:1,r:0,index:999999}},{type:'__proto__',slots:[{q:1,r:0,index:0}]},{type:'constructor',slots:[{q:1,r:0,index:0}]}];
 for(const action of ['tower','upgrade','building','buildingUpgrade','place','portal','reinforcement','reward','delivery','ready','unknown'])for(const payload of corpus){now+=1000;const before=room.view(seat.token),packet=command(room,seat,action,payload);let result;assert.doesNotThrow(()=>result=room.receive(seat.token,packet));assert.equal(result.ok,false);const after=room.view(seat.token);assert.deepEqual(after.boards,before.boards);assert.equal(after.hp,before.hp);}
});
test('independent lobby sessions and expired invitation retries never cross rooms',()=>{
 let now=0;const rooms=createLobbies({now:()=>now}),request={requestId:randomUUID()},a=rooms.create(request),b=rooms.create({requestId:randomUUID()});rooms.join({requestId:randomUUID(),code:a.code});const av=rooms.view(a.token),bv=rooms.view(b.token);assert.notEqual(av.epoch,bv.epoch);
 const rejected=rooms.receive(a.token,{epoch:bv.epoch,sequence:1,wave:0,phase:'place',action:'ready',payload:{value:true}});assert.equal(rejected.reason,'invalid');assert.equal(rooms.view(b.token).lobby.players,1);
 now=121*60000;assert.equal(rooms.view(a.token),null);const fresh=rooms.create(request);assert.ok(fresh.ok);assert.notEqual(fresh.token,a.token);assert.equal(rooms.view(a.token),null);
});
test('automated players complete multiple waves across seeded matches without bypassing commands',t=>{
 const results=[];
 for(const seed of ['soak-a','soak-b','soak-c']){
  let now=0;const room=createRoom({seed,loadouts:[loadout,loadout],now:()=>now}),seats=[room.connect(0),room.connect(1)];let ticks=0,completed=0;
  const send=(seat,action,payload)=>{now+=60;const result=room.receive(seat.token,command(room,seat,action,payload));assert.ok(result.ok,JSON.stringify({action,result}));};
  for(let turn=0;turn<150;turn++){
   let v=room.view(seats[0].token);if(v.phase==='gameover'||v.wave>=12){results.push({seed,wave:v.wave,phase:v.phase,hp:v.hp,ticks});break;}
   if(v.phase==='combat'){for(let i=0;i<400;i++){for(const seat of seats)room.touch(seat.token);room.tick();now+=50;ticks++;}continue;}
   for(const seat of seats){v=room.view(seat.token);const b=v.boards[seat.player];if(v.ready[seat.player])continue;
    if(b.celebration){send(seat,'acknowledge',{});continue;}
    if(b.phase==='duoDelivery'&&v.boards.every(board=>board.phase==='duoDelivery')&&v.delivery?.offers[seat.player]?.index===null){send(seat,'delivery',{offerId:v.delivery.offers[seat.player].id,index:0});continue;}
    if(b.rewardOffer){send(seat,'reward',{offerId:b.rewardOffer.id,index:b.rewardOffer.skippable?null:0});continue;}
    if(b.phase==='place'){const candidates=[];b.placements.forEach((rotations,index)=>rotations.forEach((cells,rotation)=>cells.filter(p=>p.legal).forEach(p=>candidates.push({q:p.q,r:p.r,index,rotation}))));candidates.sort((a,b)=>Math.hypot(b.q,b.r)-Math.hypot(a.q,a.r));assert.ok(candidates.length);send(seat,'place',candidates[0]);continue;}
    if(b.phase==='build'){for(const tile of b.map)for(let index=0;index<tile.slots;index++){if(!tile.towers[index]&&room.view(seat.token).boards[seat.player].gold>=25)send(seat,'tower',{type:'archer',slots:[{q:tile.q,r:tile.r,index}]});}send(seat,'ready',{value:true});completed=Math.max(completed,v.wave);}
   }
  }
  assert.ok(completed>=2,'Bots must traverse reward and preparation boundaries');assert.ok(results.some(r=>r.seed===seed),'Bounded run must reach defeat or wave 12');
 }
 t.diagnostic(JSON.stringify(results));
});

test('all eight supported lobbies advance independently under concurrent polling',async t=>{
 const rooms=createLobbies(),pairs=[];for(let i=0;i<8;i++){const host=rooms.create({requestId:randomUUID()}),guest=rooms.join({requestId:randomUUID(),code:host.code});assert.ok(host.ok&&guest.ok);pairs.push([host,guest]);}
 assert.equal(rooms.create({requestId:randomUUID()}).reason,'capacity');
 for(const pair of pairs)require('./start-lobby.cjs')(rooms,pair);
 for(const pair of pairs)for(const seat of pair){assert.ok(rooms.receive(seat.token,command(rooms,seat,'place',opening(rooms,seat))).ok);assert.ok(rooms.receive(seat.token,command(rooms,seat,'ready',{value:true})).ok);}
 const url=await start(t,rooms),durations=[];for(let i=0;i<40;i++){const start=performance.now();rooms.tick();durations.push(performance.now()-start);}
 const snapshots=await Promise.all(pairs.flat().map(seat=>fetch(url+'/state',{headers:{Authorization:'Bearer '+seat.token}}).then(r=>r.json())));
 for(let i=0;i<8;i++){const a=snapshots[i*2],b=snapshots[i*2+1];assert.equal(a.epoch,b.epoch);assert.equal(a.wave,1);assert.equal(a.hp,b.hp);assert.ok(a.boards.every(board=>board.elapsedMs===2000));if(i)assert.notEqual(a.epoch,snapshots[(i-1)*2].epoch);}
 durations.sort((a,b)=>a-b);t.diagnostic('8 kleine Maps-Paare, 40 gemeinsame Ticks: p95 '+durations[Math.floor(durations.length*.95)].toFixed(2)+' ms; 16 HTTP-Zustandsabfragen erfolgreich. Kein Langzeit-Lastnachweis.');
});
