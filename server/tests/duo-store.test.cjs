const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{randomUUID}=require('node:crypto');
const {createStore}=require('../duo-store.cjs'),{createTransport}=require('../duo-transport.cjs');
function file(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'autohex-duo-store-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return path.join(dir,'checkpoint.json');}
function packet(store,seat,action,payload){const v=store.view(seat.token);return {epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[seat.player].phase,action,payload};}
function place(store,seat){const b=store.view(seat.token).boards[seat.player];for(let index=0;index<b.placements.length;index++)for(let rotation=0;rotation<6;rotation++){const p=b.placements[index][rotation].find(p=>p.legal);if(p)return {q:p.q,r:p.r,index,rotation};}throw Error('Missing opening');}
test('disk restart retains lobby, seats, gold and lost acknowledgement; both players must return',t=>{
 const target=file(t);let time=0,store=createStore(target,{now:()=>time});const request={requestId:randomUUID()},a=store.create(request),b=store.join({requestId:randomUUID(),code:a.code});
 require('./start-lobby.cjs')(store,[a,b]);const positions=[a,b].map(seat=>{const p=place(store,seat);assert.ok(store.receive(seat.token,packet(store,seat,'place',p)).ok);return p;});
 const buy=packet(store,a,'tower',{type:'archer',slots:[{q:positions[0].q,r:positions[0].r,index:0}]});assert.ok(store.receive(a.token,buy).ok);const before=store.view(a.token);
 time=60000;store=createStore(target,{now:()=>time});assert.equal(store.view(a.token).connection.paused,true);assert.equal(store.create(request).token,a.token);assert.equal(JSON.stringify(store.view(a.token).boards),JSON.stringify(before.boards));assert.notEqual(store.view(a.token).serverId,before.serverId);
 store.touch(a.token);assert.equal(store.view(a.token).connection.paused,true);store.touch(b.token);assert.equal(store.view(a.token).connection.paused,false);assert.equal(store.receive(a.token,buy).duplicate,true);assert.equal(store.view(a.token).boards[0].gold,before.boards[0].gold);
 for(const seat of [a,b])assert.ok(store.receive(seat.token,packet(store,seat,'ready',{value:true})).ok);
 for(let i=0;i<6;i++)store.tick();store.flush();const combat=store.view(a.token);time+=100000;store=createStore(target,{now:()=>time});store.tick();assert.equal(JSON.stringify(store.view(a.token).boards),JSON.stringify(combat.boards));store.touch(a.token);store.touch(b.token);store.tick();assert.equal(store.view(a.token).boards[0].elapsedMs,combat.boards[0].elapsedMs+50);
});
test('unsupported or damaged checkpoints fail without overwriting the existing save',t=>{
 const target=file(t);for(const data of ['{broken',JSON.stringify({format:'autohex-lobbies',version:99,rooms:[],attempts:[]})]){fs.writeFileSync(target,data);assert.throws(()=>createStore(target));assert.equal(fs.readFileSync(target,'utf8'),data);}
});
test('storage failure stops commands and serves a service error instead of acknowledging an unsaved action',async t=>{
 const target=file(t),store=createStore(target,{write(){throw Error('Disk full');}});assert.throws(()=>store.create({requestId:randomUUID()}));assert.equal(store.healthy,false);assert.throws(()=>store.flush());assert.doesNotThrow(()=>store.tick());
 const server=createTransport(store);await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{server.closeAllConnections();server.close(r);}));const response=await fetch('http://127.0.0.1:'+server.address().port+'/state');assert.equal(response.status,503);assert.equal((await response.json()).error,'storage-unavailable');
});
