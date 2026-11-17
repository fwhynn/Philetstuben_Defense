const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{randomUUID}=require('node:crypto');
const {createStore,atomicWrite}=require('../duo-store.cjs'),{readCheckpoint}=require('../duo-partitioned-storage.cjs');
function file(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'duo-partition-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return path.join(dir,'checkpoint.json');}
function command(store,a,action,payload){const v=store.view(a.token);return {epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[a.player].phase,action,payload};}
test('complete orphan files are durably republished before an index can reference them',t=>{
 const target=file(t),dir=target+'.rooms',text='{"saved":"complete but possibly not synced"}',code='ABCDEF1234',name=code+'-'+require('node:crypto').createHash('sha256').update(text).digest('hex')+'.json';
 fs.mkdirSync(dir);fs.writeFileSync(path.join(dir,name),text);const writes=[];
 const storage=require('../duo-partitioned-storage.cjs').createPartitionedStorage(target,{}, {write:(file,text)=>{writes.push(file);atomicWrite(file,text);}});
 storage.commit({rooms:[{code,text}],settlements:[],attempts:[]});assert.deepEqual(writes,[path.join(dir,name),target]);
});
test('legacy migration preserves original bytes, restores seats and exports a self-contained backup',t=>{
 const target=file(t);let time=0,old=createStore(target,{now:()=>time});const a=old.create({requestId:randomUUID()}),b=old.join({requestId:randomUUID(),code:a.code});require('./start-lobby.cjs')(old,[a,b]);
 const packet=command(old,a,'speed',{value:4});assert.ok(old.receive(a.token,packet).ok);const previous=fs.readFileSync(target,'utf8'),before=old.view(a.token);
 time=1000;const store=createStore(target,{now:()=>time,partitioned:true});
 assert.equal(fs.readFileSync(target+'.before-partition','utf8'),previous);assert.equal(JSON.parse(fs.readFileSync(target)).format,'autohex-lobby-index');
 assert.equal(JSON.stringify(store.view(a.token).boards),JSON.stringify(before.boards));assert.equal(store.view(a.token).next,before.next);
 store.touch(a.token);store.touch(b.token);assert.equal(store.receive(a.token,packet).duplicate,true);
 store.backup();const backup=JSON.parse(fs.readFileSync(target+'.before-update','utf8'));assert.equal(backup.format,'autohex-lobbies');
 assert.deepEqual(backup,readCheckpoint(target).snapshot);assert.equal(createStore(target+'.before-update').view(a.token).next,before.next);
 const exported=target+'.export.json';require('../backup.cjs').backup(target,exported);
 assert.deepEqual(JSON.parse(fs.readFileSync(exported)),readCheckpoint(target).snapshot);
 assert.equal(createStore(exported).view(a.token).next,before.next);
});
test('only changed rooms are written; current and previous indexes remain complete',t=>{
 const target=file(t),writes=[],store=createStore(target,{now:()=>0,partitioned:true,write:(file,text)=>{writes.push(file);atomicWrite(file,text);}});
 const a=store.create({requestId:randomUUID()}),b=store.create({requestId:randomUUID()});const before=JSON.parse(fs.readFileSync(target));writes.length=0;
 store.receive(a.token,command(store,a,'lobbyLoadout',{towers:['archer','catapult','chain','freeze','mine']}));
 const roomWrites=writes.filter(f=>path.dirname(f)===target+'.rooms');assert.equal(roomWrites.length,1);assert.ok(path.basename(roomWrites[0]).startsWith(a.code));
 const after=JSON.parse(fs.readFileSync(target));assert.equal(after.rooms.find(r=>r.code===b.code).file,before.rooms.find(r=>r.code===b.code).file);
 for(const r of [...before.rooms,...after.rooms])assert.ok(fs.existsSync(path.join(target+'.rooms',r.file)));
 writes.length=0;store.flush();assert.deepEqual(writes,[]);
});
test('failed index publication does not expose a partially saved transaction',t=>{
 const target=file(t);let fail=false;const store=createStore(target,{now:()=>0,partitioned:true,write:(file,text)=>{if(fail&&file===target)throw Error('Interrupted commit');atomicWrite(file,text);}});
 const a=store.create({requestId:randomUUID()}),before=readCheckpoint(target).snapshot,index=fs.readFileSync(target,'utf8');fail=true;
 assert.throws(()=>store.receive(a.token,command(store,a,'lobbyLoadout',{towers:['archer','catapult','chain','freeze','mine']})));
 assert.equal(store.healthy,false);assert.equal(fs.readFileSync(target,'utf8'),index);assert.deepEqual(readCheckpoint(target).snapshot,before);
 const restored=createStore(target,{now:()=>1000});assert.equal(restored.view(a.token).next,before.rooms[0].room.seats[0].next);
});
test('missing, damaged or unsafe room references fail closed without overwriting data',t=>{
 const target=file(t),store=createStore(target,{partitioned:true}),a=store.create({requestId:randomUUID()}),index=fs.readFileSync(target,'utf8'),saved=JSON.parse(index),blob=path.join(target+'.rooms',saved.rooms[0].file),bytes=fs.readFileSync(blob,'utf8');
 for(const corrupt of ['{broken',bytes+' ']){fs.writeFileSync(blob,corrupt);assert.throws(()=>createStore(target));assert.equal(fs.readFileSync(target,'utf8'),index);}
 fs.unlinkSync(blob);assert.throws(()=>createStore(target));fs.writeFileSync(blob,bytes);
 saved.rooms[0].file='../outside.json';fs.writeFileSync(target,JSON.stringify(saved));assert.throws(()=>createStore(target));assert.ok(a.token);
});
test('interruption after index publication restores the complete command and its lost acknowledgement',t=>{
 const target=file(t);let interrupt=false;const store=createStore(target,{now:()=>0,partitioned:true,write:(file,text)=>{atomicWrite(file,text);if(interrupt&&file===target)throw Error('Crash after commit');}});
 const a=store.create({requestId:randomUUID()}),packet=command(store,a,'lobbyLoadout',{towers:['archer','catapult','chain','freeze','mine']});interrupt=true;
 assert.throws(()=>store.receive(a.token,packet));assert.equal(store.healthy,false);
 const restored=createStore(target,{now:()=>1000});restored.touch(a.token);assert.equal(restored.receive(a.token,packet).duplicate,true);assert.equal(restored.view(a.token).next,packet.sequence+1);
});
test('removing a room preserves settlement receipts and collects only unreferenced generations',t=>{
 const target=file(t),legacy=createStore(target,{now:()=>0}),a=legacy.create({requestId:randomUUID()}),snapshot=JSON.parse(fs.readFileSync(target)),receipt={id:'a'.repeat(64),outcome:'victory',wave:35,diamonds:17};snapshot.settlements=[[a.token,[receipt]]];fs.writeFileSync(target,JSON.stringify(snapshot));
 const store=createStore(target,{now:()=>0,partitioned:true});store.leave(a.token);store.flush();
 assert.equal(readCheckpoint(target).snapshot.rooms.length,0);assert.deepEqual(createStore(target).receipts(a.token),[receipt]);
 fs.writeFileSync(path.join(target+'.rooms','unrelated.txt'),'preserve');
 for(let i=0;i<4;i++){const b=store.create({requestId:randomUUID()});store.leave(b.token);}
 const current=JSON.parse(fs.readFileSync(target)),previous=JSON.parse(fs.readFileSync(target+'.previous')),kept=new Set([...current.rooms,...previous.rooms].map(r=>r.file));
 const blobs=fs.readdirSync(target+'.rooms').filter(f=>f.endsWith('.json'));assert.deepEqual(new Set(blobs),kept);assert.equal(fs.readFileSync(path.join(target+'.rooms','unrelated.txt'),'utf8'),'preserve');
});
