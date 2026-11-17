const {test}=require('node:test'),assert=require('node:assert/strict');
const {createRoom}=require('../duo-room.cjs'),{createLobbies}=require('../duo-lobbies.cjs'),{randomUUID}=require('node:crypto');
const loadout=['archer','catapult','chain','freeze','mine'];

test('presence, countdown and ownership updates persist without recapturing unchanged combat',()=>{
 const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),loadCore=require('../../headless-core.cjs');
 const filename=path.resolve(__dirname,'../duo-room.cjs'),isolated=new Module(filename,module);isolated.filename=filename;isolated.paths=Module._nodeModulePaths(path.dirname(filename));
 const originalRequire=isolated.require.bind(isolated);let captures=0;
 isolated.require=id=>id==='../headless-core.cjs'?()=>{const core=loadCore(),stringify=core.duo.stringify;core.duo.stringify=match=>{captures++;return stringify(match);};return core;}:originalRequire(id);
 isolated._compile(fs.readFileSync(filename,'utf8'),filename);
 let time=0;const room=isolated.exports.createRoom({now:()=>time,seed:'presence-cache',loadouts:[loadout,loadout]}),a=room.connect(0),b=room.connect(1);
 const check=()=>assert.equal(room.serializeCheckpoint(),JSON.stringify(room.checkpoint()));
 check();assert.equal(captures,1);room.claim(a.token,randomUUID());check();
 for(let i=0;i<5;i++){time=11000+i*1000;room.presence();room.tick();check();}
 room.touch(a.token);room.touch(b.token);check();room.setMaintenance(true);check();time+=10000;room.setMaintenance(false);check();assert.equal(captures,1);
 const v=room.view(a.token);room.receive(a.token,{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[0].phase,action:'speed',payload:{value:2}});check();assert.equal(captures,2);
});
test('serialized checkpoints remain byte-identical after commands, rejection, retries, heartbeat, ticks and maintenance',()=>{
 let time=0;const room=createRoom({seed:'cache-safety',loadouts:[loadout,loadout],now:()=>time}),a=room.connect(0),b=room.connect(1);
 const check=()=>{assert.equal(room.serializeCheckpoint(),JSON.stringify(room.checkpoint()));assert.equal(room.serializeCheckpoint(),JSON.stringify(room.checkpoint()));};
 const send=(seat,action,payload)=>{const v=room.view(seat.token),p={epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[seat.player].phase,action,payload};room.receive(seat.token,p);check();room.receive(seat.token,p);check();};
 check();for(const seat of [a,b]){
  const board=room.view(seat.token).boards[seat.player];let target;
  board.placements.some((rotations,index)=>rotations.some((cells,rotation)=>{const p=cells.find(p=>p.legal);if(p)target={q:p.q,r:p.r,index,rotation};return !!p;}));
  send(seat,'place',target);send(seat,'baseUpgrade',{kind:'walls'});send(seat,'ready',{value:true});
 }
 for(let i=0;i<60;i++){time+=50;room.tick();check();}
 send(a,'tower',{type:'missing',slots:[{q:0,r:0,index:0}]});
 time+=200;room.touch(a.token);check();room.claim(a.token,randomUUID());check();
 room.setMaintenance(true);check();time+=20000;room.setMaintenance(false);check();
 time+=200000;room.presence();assert.equal(room.serializeCheckpoint(),null);
});
test('lobby serialization preserves the original format across multiple rooms and removal',()=>{
 let time=0;const rooms=createLobbies({now:()=>time});
 const check=()=>assert.equal(rooms.serializeCheckpoint(),JSON.stringify(rooms.checkpoint()));
 const a=rooms.create({requestId:randomUUID()});check();rooms.create({requestId:randomUUID()});check();
 rooms.join({requestId:randomUUID(),code:a.code});check();rooms.receive(a.token,{});check();
 rooms.leave(a.token);check();time=70000;check();
});
test('board views stay private and detached, including after rejected commands',()=>{
 const room=createRoom({seed:'view-cache',loadouts:[loadout,loadout],now:()=>0}),a=room.connect(0),b=room.connect(1);
 const before=room.view(a.token),other=room.view(b.token),expected=JSON.stringify(before.boards);
 assert.ok(before.boards[0].placements);assert.equal(before.boards[1].placements,undefined);
 assert.equal(other.boards[0].placements,undefined);assert.ok(other.boards[1].placements);
 before.boards[0].map[0].type='corrupted';before.boards[1].map.length=0;
 assert.equal(JSON.stringify(room.view(a.token).boards),expected);
 const v=room.view(a.token);room.receive(a.token,{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[0].phase,action:'tower',payload:{type:'missing',slots:[{q:0,r:0,index:0}]}});
 assert.equal(room.view(a.token).next,v.next+1);assert.equal(JSON.stringify(room.view(a.token).boards),expected);
});
