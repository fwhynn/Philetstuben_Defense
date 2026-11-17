const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{randomUUID}=require('node:crypto'),{Worker}=require('node:worker_threads');
const {createStore}=require('../duo-store.cjs'),{createWorkerStore}=require('../duo-worker-client.cjs'),{readCheckpoint}=require('../duo-partitioned-storage.cjs'),{createTransport}=require('../duo-transport.cjs');
function directory(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'duo-worker-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;}
async function command(store,seat,action,payload){const v=await store.view(seat.token),packet={epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[seat.player].phase,action,payload};return {packet,result:await store.receive(seat.token,packet)};}
async function listen(store){const server=createTransport(store,{browser:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));return server;}

test('encoded push keeps authorization, unchanged-revision suppression and exact public JSON',async t=>{
 const store=createWorkerStore(path.join(directory(t),'checkpoint.json'));await store.ready;t.after(()=>store.close());
 const a=await store.create({requestId:randomUUID()}),b=await store.join({requestId:randomUUID(),code:a.code}),client=randomUUID();
 await store.touch(a.token);await store.touch(b.token);const state=await store.access(a.token,client,'/state');
 const push=await store.encodedPush(a.token,client,{});assert.equal(push.status,200);assert.equal(push.body.json,JSON.stringify(state.body));
 assert.equal(push.body.key,state.body.serverId+state.body.epoch+':'+state.body.revision+':'+state.body.next);
 assert.deepEqual(await store.encodedPush(a.token,client,{lastKey:push.body.key}),{status:200,body:null});
 assert.equal((await store.encodedPush(a.token,randomUUID(),{})).status,409);
 assert.equal((await store.encodedPush('invalid',client,{})).status,401);
});
test('worker ticks and commands reproduce the synchronous simulation and resume exactly after restart',async t=>{
 const dir=directory(t),legacy=path.join(dir,'legacy.json'),target=path.join(dir,'worker.json');let reference=createStore(legacy),a=reference.create({requestId:randomUUID()}),b=reference.join({requestId:randomUUID(),code:a.code});
 require('./start-lobby.cjs')(reference,[a,b]);
 for(const seat of [a,b]){const board=reference.view(seat.token).boards[seat.player];let target;board.placements.some((rotations,index)=>rotations.some((cells,rotation)=>{const p=cells.find(p=>p.legal);if(p)target={q:p.q,r:p.r,index,rotation};return !!p;}));await command(reference,seat,'place',target);await command(reference,seat,'tower',{type:'archer',slots:[{q:target.q,r:target.r,index:0}]});}
 fs.copyFileSync(legacy,target);reference=createStore(legacy);let worker=createWorkerStore(target);await worker.ready;
 t.after(async()=>worker.close());
 for(const seat of [a,b]){reference.touch(seat.token);await worker.touch(seat.token);}
 for(const seat of [a,b]){const {packet,result}=await command(reference,seat,'ready',{value:true});assert.deepEqual(await worker.receive(seat.token,packet),result);}
 await worker.startTicks();await new Promise(r=>setTimeout(r,160));await worker.stopTicks();
 const elapsed=(await worker.view(a.token)).boards[0].elapsedMs,stepMs=require('../../headless-core.cjs')().runtime.PLAYBACK_RATE*50;
 assert.ok(elapsed>=stepMs);assert.equal(elapsed%stepMs,0);for(let i=0;i<elapsed/stepMs;i++)reference.tick();
 await new Promise(r=>setTimeout(r,70));assert.equal((await worker.view(a.token)).boards[0].elapsedMs,elapsed);
 for(let tick=0;tick<100;tick++){
  reference.tick();await worker.tick();
  if(tick%10===0)assert.equal(JSON.stringify((await worker.view(a.token)).boards),JSON.stringify(reference.view(a.token).boards));
 }
 reference.flush();await worker.flush();assert.deepEqual(readCheckpoint(target).snapshot.rooms[0].room.match,JSON.parse(fs.readFileSync(legacy)).rooms[0].room.match);
 const before=await worker.view(a.token);await worker.backup();await worker.close();worker=createWorkerStore(target);await worker.ready;
 assert.equal(JSON.stringify((await worker.view(a.token)).boards),JSON.stringify(before.boards));assert.equal((await worker.view(a.token)).connection.paused,true);
 assert.equal(JSON.parse(fs.readFileSync(target+'.before-update')).format,'autohex-lobbies');
});
test('worker authorization and command persistence stay atomic across takeover and lost acknowledgements',async t=>{
 const target=path.join(directory(t),'checkpoint.json'),store=createWorkerStore(target);await store.ready;t.after(()=>store.close());
 const a=await store.create({requestId:randomUUID()});await store.join({requestId:randomUUID(),code:a.code});
 const old=randomUUID(),next=randomUUID(),v=(await store.access(a.token,old,'/state')).body;
 const packet={epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[0].phase,action:'lobbyLoadout',payload:{towers:['archer','catapult','chain','freeze','mine']}};
 const [accepted,takeover,denied]=await Promise.all([store.access(a.token,old,'/command',packet,true),store.access(a.token,next,'/session',{action:'takeover'}),store.access(a.token,old,'/command',packet,true)]);
 assert.equal(accepted.body.ok,true);assert.equal(takeover.status,200);assert.equal(denied.status,409);
 const replay=await store.access(a.token,next,'/command',packet,true);assert.equal(replay.body.duplicate,true);
 assert.equal(readCheckpoint(target).snapshot.rooms[0].room.seats[0].next,replay.body.state.next);
});
test('real HTTP and Socket.IO clients use the worker and only receive durable command acknowledgements',async t=>{
 const target=path.join(directory(t),'checkpoint.json'),store=createWorkerStore(target);await store.ready;const server=await listen(store),url='http://127.0.0.1:'+server.address().port;
 let socket;t.after(async()=>{socket?.close();await server.quiesce();await new Promise(r=>{server.closeAllConnections();server.close(r);});await store.close();});
 const response=await fetch(url+'/lobby/create',{method:'POST',body:JSON.stringify({requestId:randomUUID()})}),a=await response.json();assert.equal(response.status,200);assert.ok(a.ok);
 const auth={token:a.token,clientId:randomUUID()},v=await(await fetch(url+'/state',{headers:{Authorization:'Bearer '+a.token,'X-Duo-Client':auth.clientId}})).json();assert.equal(v.player,0);
 socket=require('socket.io-client').io(url,{auth,extraHeaders:{Origin:url},reconnection:false,forceNew:true});await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);});
 const packet={epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[0].phase,action:'lobbyLoadout',payload:{towers:['archer','catapult','chain','freeze','mine']}};
 const ack=await socket.timeout(3000).emitWithAck('request',{path:'/command',packet,withState:true});assert.equal(ack.status,200);assert.equal(ack.body.ok,true);
 assert.equal(readCheckpoint(target).snapshot.rooms[0].room.seats[0].next,ack.body.state.next);
});
test('slow durable writes run off the main event loop and are awaited before success',async t=>{
 const target=path.join(directory(t),'checkpoint.json'),entry=path.resolve(__dirname,'../duo-store-worker.cjs');
 const store=createWorkerStore(target,{workerFactory:options=>new Worker(`const fs=require('node:fs'),{workerData}=require('node:worker_threads');const write=fs.writeFileSync;fs.writeFileSync=function(...args){Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,120);return write.apply(this,args);};require(workerData.entry);`,{eval:true,workerData:{...options.workerData,entry}})});
 await store.ready;t.after(()=>store.close());let beats=0;const timer=setInterval(()=>beats++,10);
 try{const a=await store.create({requestId:randomUUID()});assert.ok(a.ok);assert.ok(beats>=5,'main thread remains responsive during worker disk delay');assert.equal(readCheckpoint(target).snapshot.rooms[0].room.seats[0].token,a.token);}finally{clearInterval(timer);}
});
test('worker crash rejects operations and HTTP reports unavailable without accepting a command',async t=>{
 let worker;const target=path.join(directory(t),'checkpoint.json'),store=createWorkerStore(target,{workerFactory:options=>(worker=new Worker(path.resolve(__dirname,'../duo-store-worker.cjs'),options))});await store.ready;
 const a=await store.create({requestId:randomUUID()}),before=fs.readFileSync(target,'utf8'),server=await listen(store),url='http://127.0.0.1:'+server.address().port;
 t.after(async()=>{await server.quiesce()?.catch(()=>{});await new Promise(r=>{server.closeAllConnections();server.close(r);});await store.close().catch(()=>{});});
 await worker.terminate();assert.equal(store.healthy,false);await assert.rejects(store.receive(a.token,{}));
 assert.equal((await fetch(url+'/healthz')).status,503);assert.equal(fs.readFileSync(target,'utf8'),before);
});
test('production launcher waits for worker readiness and drains to a complete backup on shutdown',async t=>{
 const dir=directory(t),file=path.join(dir,'checkpoint.json'),runner=path.join(dir,'launcher.cjs'),entry=path.resolve(__dirname,'../start-duo.cjs');
 // Use an ephemeral listening port and an IPC-triggered SIGTERM event on Windows.
 fs.writeFileSync(runner,`const http=require('node:http'),listen=http.Server.prototype.listen;http.Server.prototype.listen=function(port,host,callback){this.once('listening',()=>process.send({port:this.address().port}));return listen.call(this,0,host,callback);};process.on('message',m=>{if(m==='stop'){process.disconnect();process.emit('SIGTERM');}});require(${JSON.stringify(entry)});`);
 const child=require('node:child_process').fork(runner,{silent:true,env:{...process.env,DUO_SAVE_FILE:file,DUO_VISITS_FILE:path.join(dir,'visits.json'),DUO_HOST:'127.0.0.1',DUO_MAINTENANCE:'0',DUO_PUBLIC_ORIGIN:''}});
 t.after(()=>{if(child.exitCode===null)child.kill();});
 const exited=new Promise((resolve,reject)=>{child.once('exit',code=>resolve(code));child.once('error',reject);});
 const port=await new Promise((resolve,reject)=>{child.once('message',m=>resolve(m.port));child.once('exit',()=>reject(Error('Launcher exited before ready')));child.once('error',reject);});
 const url='http://127.0.0.1:'+port,health=await fetch(url+'/healthz');assert.equal(health.status,200);assert.equal((await health.json()).simulationWorkers,8);
 const a=await(await fetch(url+'/lobby/create',{method:'POST',body:JSON.stringify({requestId:randomUUID()})})).json();assert.ok(a.ok);
 child.send('stop');assert.equal(await exited,0);const backup=JSON.parse(fs.readFileSync(file+'.before-update','utf8'));
 assert.equal(backup.format,'autohex-lobbies');assert.equal(backup.rooms[0].room.seats[0].token,a.token);
 assert.deepEqual(backup,readCheckpoint(file).snapshot);
});
