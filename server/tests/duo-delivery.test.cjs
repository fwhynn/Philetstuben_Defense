const {test}=require('node:test'),assert=require('node:assert/strict'),loadCore=require('../../headless-core.cjs');
const {createRoom}=require('../duo-room.cjs'),{createTransport}=require('../duo-transport.cjs');
const loadout=['archer','catapult','chain','freeze','mine'];
function fixture(){
 const initial=createRoom({seed:'private-deliveries',loadouts:[loadout,loadout]}),seats=[initial.connect(0),initial.connect(1)],snapshot=initial.checkpoint(),c=loadCore(),m=c.duo.restore(snapshot.match);
 m.wave=5;m.phase='combat';for(const {state:s} of m.boards){s.wave=5;s.phase='wave';s.waveRunning=true;s.spawnQueue=[];s.pendingSpawns=0;s.enemies=[];s.lastCompletedWave=4;}c.duo.tick(m);snapshot.match=c.duo.capture(m);
 const room=createRoom({snapshot});for(const seat of seats)room.touch(seat.token);return {room,seats};
}
function packet(room,seat,payload){const v=room.view(seat.token);return {epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[seat.player].phase,action:'delivery',payload};}
test('delivery protocol hides partner choices and rejects forged, cross-seat and repeated gifts',()=>{
 const {room,seats:[a,b]}=fixture(),av=room.view(a.token),bv=room.view(b.token),offer=av.delivery.offers[0],before=bv.boards[1].gold;
 assert.equal(av.delivery.offers[1].choices,undefined);assert.equal(av.delivery.offers[1].id,undefined);assert.ok(!JSON.stringify(av).includes('private-deliveries'));
 for(const payload of [{offerId:offer.id,index:0,amount:999},{offerId:offer.id,index:null},{offerId:bv.delivery.offers[1].id,index:0},{offerId:'forged',index:0}])assert.equal(room.receive(a.token,packet(room,a,payload)).ok,false);
 const gift=packet(room,a,{offerId:offer.id,index:0});assert.ok(room.receive(a.token,gift).ok);assert.equal(room.view(b.token).boards[1].gold,before+20);assert.equal(room.receive(a.token,gift).duplicate,true);
 assert.equal(room.receive(a.token,packet(room,a,gift.payload)).ok,false);assert.equal(room.view(b.token).boards[1].gold,before+20);
});
test('real HTTP delivery retry after checkpoint restart applies only once; partner can finish',async t=>{
 let {room,seats:[a,b]}=fixture();const server=createTransport(room);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));const url='http://127.0.0.1:'+server.address().port;
 const av=room.view(a.token),gift=packet(room,a,{offerId:av.delivery.offers[0].id,index:1}),card=av.delivery.offers[0].choices[1].cardId,before=room.view(b.token).boards[1].deckCounts[card]||0;
 const response=await fetch(url+'/command',{method:'POST',headers:{Authorization:'Bearer '+a.token},body:JSON.stringify(gift)});assert.ok((await response.json()).ok);
 room=createRoom({snapshot:JSON.parse(JSON.stringify(room.checkpoint()))});for(const seat of [a,b])room.touch(seat.token);
 assert.equal(room.receive(a.token,gift).duplicate,true);assert.equal(room.view(b.token).boards[1].deckCounts[card],before+1);assert.equal(room.view(a.token).boards[0].phase,'duoDelivery');
 const bv=room.view(b.token);assert.ok(room.receive(b.token,packet(room,b,{offerId:bv.delivery.offers[1].id,index:0})).ok);assert.ok(room.view(a.token).boards.every(board=>board.phase!=='duoDelivery'));
 assert.doesNotThrow(()=>createRoom({snapshot:room.checkpoint()}));
});
