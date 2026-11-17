'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{randomUUID}=require('node:crypto'),{Worker}=require('node:worker_threads');
const {createRoomPool}=require('../duo-room-pool.cjs'),{readCheckpoint}=require('../duo-partitioned-storage.cjs'),{createStore}=require('../duo-store.cjs'),{fixture}=require('../../scripts/duo-load.cjs');
function file(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'duo-pool-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return path.join(dir,'checkpoint.json');}
test('pool migrates existing games without changing simulation, tokens, receipts or restored boards',async t=>{
 const target=file(t),original=fixture(2),text=JSON.stringify(original.snapshot);fs.writeFileSync(target,text);
 const reference=require('../duo-lobbies.cjs').createLobbies({snapshot:JSON.parse(text)});let pool=createRoomPool(target);await pool.ready;t.after(()=>pool.close());
 assert.equal(fs.readFileSync(target+'.before-pool','utf8'),text);
 for(const seat of original.seats.flat()){reference.touch(seat.token);await pool.touch(seat.token);}
 for(let i=0;i<25;i++){reference.tick();await pool.tick();}
 for(const seat of original.seats.flat())assert.equal(JSON.stringify((await pool.view(seat.token)).boards),JSON.stringify(reference.view(seat.token).boards));
 await pool.stopTicks();const before=await Promise.all(original.seats.flat().map(s=>pool.view(s.token)));await pool.backup();await pool.close();
 const backup=JSON.parse(fs.readFileSync(target+'.before-update'));assert.equal(backup.format,'autohex-lobbies');assert.equal(backup.rooms.length,2);
 pool=createRoomPool(target);await pool.ready;
 for(const [i,seat]of original.seats.flat().entries())assert.equal(JSON.stringify((await pool.view(seat.token)).boards),JSON.stringify(before[i].boards));
 assert.equal(readCheckpoint(target).snapshot.rooms.length,2);
});
test('lobby creation stays globally bounded and retry-safe across workers and restart',async t=>{
 const target=file(t);let pool=createRoomPool(target);await pool.ready;t.after(()=>pool.close());
 const request={requestId:randomUUID()},same=await Promise.all([pool.create(request),pool.create(request)]);assert.deepEqual(same[0],same[1]);
 const join={requestId:randomUUID(),code:same[0].code},joined=await pool.join(join);assert.ok(joined.ok);
 assert.equal((await pool.join({requestId:request.requestId,code:same[0].code})).reason,'invalid');
 const more=await Promise.all(Array.from({length:8},()=>pool.create({requestId:randomUUID()})));assert.equal(more.filter(r=>r.ok).length,7);assert.equal(more.filter(r=>r.reason==='capacity').length,1);
 assert.equal((await pool.live()).rooms,8);assert.equal((await pool.live()).capacity,16);
 await pool.close();pool=createRoomPool(target);await pool.ready;assert.deepEqual(await pool.create(request),same[0]);assert.deepEqual(await pool.join(join),joined);
 await pool.setMaintenance(true);assert.equal((await pool.create({requestId:randomUUID()})).reason,'maintenance');await pool.setMaintenance(false);
});
test('a blocked room worker does not block commands or ticks in another room',async t=>{
 const target=file(t),original=fixture(2);fs.writeFileSync(target,JSON.stringify(original.snapshot));
 const entry=path.resolve(__dirname,'../duo-store-worker.cjs'),storeModule=path.resolve(__dirname,'../duo-store.cjs');let slowWorker;
 const pool=createRoomPool(target,{workerFactory:options=>{
  if(!options.workerData.file.endsWith('slot-0.json'))return new Worker(entry,options);
  return slowWorker=new Worker(`const {workerData,parentPort}=require('node:worker_threads');const mod=require(workerData.storeModule),create=mod.createStore;mod.createStore=(...args)=>{const s=create(...args),view=s.view;s.view=(...args)=>{parentPort.postMessage({blocked:true});Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,1500);return view(...args);};return s;};require(workerData.entry);`,{eval:true,workerData:{...options.workerData,entry,storeModule}});
 }});await pool.ready;t.after(()=>pool.close());
 for(const s of original.seats.flat())await pool.touch(s.token);
 await pool.startTicks();
 const blocked=new Promise(resolve=>slowWorker.on('message',m=>{if(m.blocked)resolve();}));let done=false;
 const slow=pool.view(original.seats[0][0].token).then(()=>done=true);await blocked;
 const fastSeat=original.seats[1][0],v=await pool.view(fastSeat.token);
 const result=await pool.receive(fastSeat.token,{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[0].phase,action:'speed',payload:{value:1}});
 assert.ok(result.ok);assert.equal(done,false,'unrelated durable command finishes while other room is blocked');
 await new Promise(resolve=>setTimeout(resolve,150));const next=await pool.view(fastSeat.token);assert.ok(next.boards[0].elapsedMs>v.boards[0].elapsedMs);assert.equal(done,false);await slow;
});

test('partitioned saves migrate with standalone rollback data and release compatibility',async t=>{
 const target=file(t),old=createStore(target,{partitioned:true}),a=old.create({requestId:randomUUID()}),b=old.join({requestId:randomUUID(),code:a.code});
 const previous=readCheckpoint(target).snapshot,bytes=fs.readFileSync(target,'utf8');const pool=createRoomPool(target);await pool.ready;t.after(()=>pool.close());
 assert.equal(fs.readFileSync(target+'.before-pool','utf8'),bytes);
 assert.deepEqual(JSON.parse(fs.readFileSync(target+'.before-pool-export')),previous);
 for(const seat of [a,b])assert.equal(JSON.stringify((await pool.view(seat.token)).boards),JSON.stringify(old.view(seat.token).boards));
 const {compatibleRuleset}=require('../duo-room.cjs');for(const version of ['1.2.8','1.2.9','1.3.0'])assert.equal(compatibleRuleset(version,'1.3.1'),true);
});
test('missing pool files fail closed and pool backup remains standalone',async t=>{
 const target=file(t),pool=createRoomPool(target);await pool.ready;await pool.create({requestId:randomUUID()});await pool.close();
 const destination=target+'.export';require('../backup.cjs').backup(target,destination);assert.equal(JSON.parse(fs.readFileSync(destination)).format,'autohex-lobbies');assert.equal(createStore(destination).live().rooms,1);
 fs.renameSync(path.join(target+'.pool','slot-0.json'),path.join(target+'.pool','missing.json'));assert.throws(()=>readCheckpoint(target));
 const broken=createRoomPool(target);await assert.rejects(broken.ready);await broken.close();
});

test('a simulation worker failure fails closed without replacing the saved game',async t=>{
 const target=file(t),handles=[],entry=path.resolve(__dirname,'../duo-store-worker.cjs');
 const pool=createRoomPool(target,{workerFactory:options=>{const worker=new Worker(entry,options);handles.push(worker);return worker;}});await pool.ready;t.after(()=>pool.close().catch(()=>{}));
 const a=await pool.create({requestId:randomUUID()});const before=readCheckpoint(target).snapshot;
 await handles[0].terminate();assert.equal(pool.healthy,false);await assert.rejects(pool.view(a.token));await assert.rejects(pool.create({requestId:randomUUID()}));
 assert.deepEqual(readCheckpoint(target).snapshot,before);
});
