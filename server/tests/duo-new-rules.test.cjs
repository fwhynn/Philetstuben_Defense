const {test}=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const core=require('../../headless-core.cjs')(),{createLobbies}=require('../duo-lobbies.cjs'),{createRoom}=require('../duo-room.cjs');
function command(room,seat,action,payload){const v=room.view(seat.token);return room.receive(seat.token,{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[seat.player].phase,action,payload});}
test('host owns shared fronts and start; partner readiness survives personal edits but not shared-front changes',()=>{
 const room=createLobbies({now:()=>0}),a=room.create({requestId:randomUUID()}),b=room.join({requestId:randomUUID(),code:a.code});
 const profile={milestones:['standard35'],_duoIdentity:{id:1,username:'Host Name'}};room.applyAugments(a.token,profile);room.applyAugments(b.token,{_duoIdentity:{id:2,username:'Partner Name'}});
 assert.deepEqual(room.view(a.token).lobbyState.names,['Host Name','Partner Name']);assert.equal(command(room,a,'lobbyStart',{}).ok,false);assert.equal(command(room,b,'lobbyStart',{}).ok,false);
 assert.ok(command(room,b,'lobbyReady',{value:true}).ok);assert.ok(command(room,a,'lobbyLoadout',{towers:core.profile.START_TOWERS,heroId:'standard',difficulty:'normal'}).ok);assert.equal(room.view(a.token).lobbyState.ready[1],true);
 assert.ok(command(room,a,'lobbyLoadout',{towers:core.profile.START_TOWERS,heroId:'standard',difficulty:'dual'}).ok);assert.deepEqual(room.view(a.token).boards.map(s=>s.difficulty),['dual','dual']);assert.equal(room.view(a.token).lobbyState.ready[1],false);
 assert.equal(command(room,b,'lobbyLoadout',{towers:core.profile.START_TOWERS,heroId:'standard',difficulty:'normal'}).ok,false);
 assert.ok(command(room,b,'lobbyReady',{value:true}).ok);assert.ok(command(room,a,'lobbyStart',{}).ok);assert.ok(room.view(a.token).lobbyState.started);
});
test('paid hex gifts charge once, raise price per sender, persist and cannot be bought in combat',()=>{
 let room=createRoom({now:()=>0,seed:'gifts',loadouts:[core.profile.START_TOWERS,core.profile.START_TOWERS]}),a=room.connect(0),b=room.connect(1);let saved=room.checkpoint(),match=core.duo.restore(saved.match);match.boards[0].state.gold=1000;match.boards[1].state.gold=1000;saved.match=core.duo.capture(match);room=createRoom({snapshot:saved,now:()=>0});room.touch(a.token);room.touch(b.token);
 const before=room.view(a.token),v=before,p={epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[0].phase,action:'giftHex',payload:{cardId:'straight'}};
 assert.ok(room.receive(a.token,p).ok);assert.ok(room.receive(a.token,p).ok);let after=room.view(a.token);assert.equal(after.boards[0].gold,925);assert.equal(after.boards[1].gold,1000);assert.equal(after.boards[1].deckCounts.straight,before.boards[1].deckCounts.straight+1);assert.equal(command(room,a,'giftHex',{cardId:'straight'}).ok,false);
 saved=room.checkpoint();match=core.duo.restore(saved.match);match.wave++;for(const {state} of match.boards)state.wave++;saved.match=core.duo.capture(match);room=createRoom({snapshot:saved,now:()=>0});room.touch(a.token);room.touch(b.token);assert.ok(command(room,a,'giftHex',{cardId:'smallCurve'}).ok);assert.equal(room.view(a.token).boards[0].gold,825);assert.ok(command(room,b,'giftHex',{cardId:'bigCurve'}).ok);assert.equal(room.view(a.token).boards[1].gold,925);
 saved=room.checkpoint();match=core.duo.restore(saved.match);match.phase='combat';for(const {state} of match.boards)state.phase='wave';saved.match=core.duo.capture(match);room=createRoom({snapshot:saved,now:()=>0});room.touch(a.token);room.touch(b.token);assert.equal(command(room,a,'giftHex',{cardId:'straight'}).ok,false);assert.equal(command(room,a,'giftHex',{cardId:'legendary'}).ok,false);
});

test('gift wishes pass through hashed offer IDs only to the partner and survive a room restart',()=>{
 let room=createRoom({now:()=>0,seed:'wish-room',loadouts:[core.profile.START_TOWERS,core.profile.START_TOWERS]}),a=room.connect(0),b=room.connect(1);
 const saved=room.checkpoint(),match=core.duo.restore(saved.match);match.wave=5;match.phase='combat';
 for(const {state:s} of match.boards)Object.assign(s,{wave:5,phase:'wave',waveRunning:true,spawnQueue:[],pendingSpawns:0,enemies:[],lastCompletedWave:4});
 core.duo.tick(match);saved.match=core.duo.capture(match);room=createRoom({snapshot:saved,now:()=>0});room.touch(a.token);room.touch(b.token);
 const v=room.view(a.token),own=v.delivery.offers[0],partner=v.delivery.offers[1];assert.match(partner.id,/^[a-f0-9]{64}$/);
 assert.equal(command(room,a,'deliveryWish',{offerId:own.id,index:0}).ok,false);assert.equal(command(room,a,'deliveryWish',{offerId:partner.id,index:3}).ok,false);
 assert.ok(command(room,a,'deliveryWish',{offerId:partner.id,index:2}).ok);assert.equal(room.view(b.token).delivery.offers[1].wish,2);assert.equal(room.view(b.token).delivery.offers[1].index,null);
 room=createRoom({snapshot:room.checkpoint(),now:()=>0});room.touch(a.token);room.touch(b.token);assert.equal(room.view(b.token).delivery.offers[1].wish,2);
 assert.equal(command(room,a,'delivery',{offerId:partner.id,index:2}).ok,false);
 assert.ok(command(room,b,'delivery',{offerId:partner.id,index:0}).ok);assert.equal(command(room,a,'deliveryWish',{offerId:partner.id,index:1}).ok,false);
});
