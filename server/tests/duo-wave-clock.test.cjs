const {test}=require('node:test'),assert=require('node:assert/strict');
const {createRoom,payloadValid}=require('../duo-room.cjs');
const loadouts=Array(2).fill(['archer','catapult','chain','freeze','mine']);
function command(room,seat,action,payload){const v=room.view(seat.token);return room.receive(seat.token,{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[seat.player].phase,action,payload});}
function opening(room,seat){const board=room.view(seat.token).boards[seat.player];for(let index=0;index<board.placements.length;index++)for(let rotation=0;rotation<6;rotation++){const cell=board.placements[index][rotation].find(c=>c.legal);if(cell)return {q:cell.q,r:cell.r,index,rotation};}throw Error('No legal opening');}
test('new waves and resuming a long pause use a fresh motion timestamp without ticking ahead',()=>{
 let clock=1000;const room=createRoom({seed:'wave-clock',loadouts,now:()=>clock}),seats=[room.connect(0),room.connect(1)];
 for(const a of seats)assert.ok(command(room,a,'place',opening(room,a)).ok);
 clock+=60000;for(const a of seats)room.touch(a.token);
 assert.ok(command(room,seats[0],'ready',{value:true}).ok);assert.ok(command(room,seats[1],'ready',{value:true}).ok);
 const start=room.view(seats[0].token);assert.equal(start.frameTime,clock);assert.equal(start.wave,1);
 clock+=50;room.tick();const first=room.view(seats[0].token);assert.equal(first.frameTime,clock);assert.ok(first.boards[0].enemies.length);
 assert.ok(command(room,seats[0],'pause',{value:true}).ok);const paused=room.view(seats[0].token);
 clock+=45000;for(const a of seats)room.touch(a.token);assert.ok(command(room,seats[0],'pause',{value:false}).ok);
 const resumed=room.view(seats[0].token);assert.equal(resumed.frameTime,clock);assert.deepEqual(resumed.boards[0].enemies,paused.boards[0].enemies,'resuming does not simulate the pause');
 clock+=50;room.tick();assert.equal(room.view(seats[0].token).frameTime,clock);
});
test('retired partner portal and reinforcement commands are rejected at the network boundary',()=>{
 for(const action of ['portal','reinforcement'])for(const slot of [null,{q:1,r:0,index:0}])assert.equal(payloadValid(action,{slot}),false);
});
