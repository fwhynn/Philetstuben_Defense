const {test}=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const {createLobbies}=require('../duo-lobbies.cjs'),{createStore}=require('../duo-store.cjs');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
function packet(l,seat,action,payload){const v=l.view(seat.token);return {epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[seat.player].phase,action,payload};}
function start(l,seats){require('./start-lobby.cjs')(l,seats);let last;for(const seat of seats){const board=l.view(seat.token).boards[seat.player];let p;for(let index=0;index<board.placements.length&&!p;index++)for(let rotation=0;rotation<6&&!p;rotation++){const n=board.placements[index][rotation].find(x=>x.legal);if(n)p={q:n.q,r:n.r,index,rotation};}assert.ok(l.receive(seat.token,packet(l,seat,'place',p)).ok);last=packet(l,seat,'ready',{value:true});assert.ok(l.receive(seat.token,last).ok);}return last;}

test('maintenance freezes both combats and reconnect clocks; duplicate ACK survives the pause',()=>{
 let time=0;const l=createLobbies({now:()=>time}),a=l.create({requestId:randomUUID()}),b=l.join({requestId:randomUUID(),code:a.code}),last=start(l,[a,b]);l.tick();
 const before=l.view(a.token);l.setMaintenance(true);time+=4*60*60*1000;for(let i=0;i<20;i++)l.tick();
 const paused=l.view(a.token);assert.equal(paused.connection.maintenance,true);assert.equal(paused.connection.paused,true);assert.equal(paused.connection.expired,false);assert.deepEqual(paused.boards,before.boards);
 assert.equal(l.receive(b.token,last).duplicate,true);assert.equal(l.receive(a.token,packet(l,a,'ready',{value:false})).reason,'maintenance');
 assert.equal(l.create({requestId:randomUUID()}).reason,'maintenance');assert.equal(l.join({requestId:randomUUID(),code:a.code}).reason,'maintenance');
 l.setMaintenance(false);assert.equal(l.view(a.token).connection.paused,false);l.tick();assert.equal(l.view(a.token).boards[0].elapsedMs,before.boards[0].elapsedMs+50);
});

test('maintenance keeps existing lobby-request retries idempotent and preserves waiting seats',()=>{
 let time=0;const l=createLobbies({now:()=>time}),request={requestId:randomUUID()},a=l.create(request);l.setMaintenance(true);time=3*60*60*1000;
 assert.equal(l.create(request).token,a.token);assert.equal(l.join({requestId:randomUUID(),code:a.code}).reason,'maintenance');
 l.setMaintenance(false);assert.ok(l.join({requestId:randomUUID(),code:a.code}).ok);
});

test('maintenance checkpoints resume through disk restart without elapsed-time catch-up',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'autohex-maintenance-')),file=path.join(dir,'checkpoint.json');
 t.after(()=>{for(const name of ['checkpoint.json','checkpoint.json.tmp']){const target=path.join(dir,name);if(fs.existsSync(target))fs.unlinkSync(target);}fs.rmdirSync(dir);});
 let time=0,store=createStore(file,{now:()=>time});const a=store.create({requestId:randomUUID()}),b=store.join({requestId:randomUUID(),code:a.code});start(store,[a,b]);store.tick();store.setMaintenance(true);const before=store.view(a.token);
 time=600000;store=createStore(file,{now:()=>time,maintenance:true});assert.equal(store.create({requestId:randomUUID()}).reason,'maintenance');time+=1000000;store.tick();store.touch(a.token);store.touch(b.token);
 assert.equal(store.view(a.token).connection.maintenance,true);assert.equal(store.view(a.token).connection.expired,false);assert.equal(JSON.stringify(store.view(a.token).boards),JSON.stringify(before.boards));
 store.setMaintenance(false);store.tick();assert.equal(store.view(a.token).boards[0].elapsedMs,before.boards[0].elapsedMs+50);
});
