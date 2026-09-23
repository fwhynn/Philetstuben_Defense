'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {io}=require('socket.io-client'),{createStore}=require('../duo-store.cjs'),{createTransport}=require('../duo-transport.cjs');
async function connect(url,auth,origin=url){const s=io(url,{auth,extraHeaders:{Origin:origin},reconnection:false,forceNew:true});await new Promise((resolve,reject)=>{s.once('connect',resolve);s.once('connect_error',error=>{s.close();reject(error);});});return s;}
async function listen(room){const s=createTransport(room,{browser:true});await new Promise(resolve=>s.listen(0,'127.0.0.1',resolve));return s;}
async function stop(server,store){server.quiesce();store.backup();await new Promise(resolve=>server.close(resolve));}
const request=(socket,path,packet)=>socket.timeout(2000).emitWithAck('request',{path,packet});
test('Socket.IO authenticates, rejects foreign origins, preserves commands and resumes saved rooms after update',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'autohex-socket-')),file=path.join(dir,'checkpoint.json');t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 let store=createStore(file),server=await listen(store);const url=()=>`http://127.0.0.1:${server.address().port}`;
 t.after(async()=>{if(server.listening)await stop(server,store);});
 const a=store.create({requestId:crypto.randomUUID()}),b=store.join({requestId:crypto.randomUUID(),code:a.code}),auth=[{token:a.token,clientId:crypto.randomUUID()},{token:b.token,clientId:crypto.randomUUID()}];
 await assert.rejects(connect(url(),{token:'bad',clientId:'bad'}));await assert.rejects(connect(url(),auth[0],'https://foreign.invalid'));
 let sockets=await Promise.all(auth.map(x=>connect(url(),x)));t.after(()=>sockets.forEach(s=>s.close()));
 for(const [i,seat] of [a,b].entries()){const v=store.view(seat.token);assert.equal((await request(sockets[i],'/command',{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[i].phase,action:'lobbyReady',payload:{value:true}})).body.ok,true);}
 const views=await Promise.all(sockets.map(s=>request(s,'/state')));assert.equal(views[0].status,200);
 const v=views[0].body,board=v.boards[0];let choice;for(let index=0;index<board.placements.length&&!choice;index++)for(let rotation=0;rotation<6&&!choice;rotation++){const target=board.placements[index][rotation].find(p=>p.legal);if(target)choice={index,rotation,q:target.q,r:target.r};}
 const packet={epoch:v.epoch,sequence:v.next,wave:v.wave,phase:board.phase,action:'place',payload:choice};assert.equal((await request(sockets[0],'/command',packet)).body.ok,true);
 let after=store.view(a.token);assert.equal((await request(sockets[0],'/command',packet)).body.ok,true);assert.equal(store.view(a.token).next,after.next);
 assert.equal((await request(sockets[0],'/session',{action:'invalid'})).status,400);
 for(const [i,seat] of [a,b].entries()){
  let v=store.view(seat.token);if(i===1){const board=v.boards[1];let p;for(let index=0;index<board.placements.length&&!p;index++)for(let rotation=0;rotation<6&&!p;rotation++){const target=board.placements[index][rotation].find(x=>x.legal);if(target)p={q:target.q,r:target.r,index,rotation};}assert.equal((await request(sockets[i],'/command',{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[i].phase,action:'place',payload:p})).body.ok,true);}
  v=store.view(seat.token);assert.equal((await request(sockets[i],'/command',{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[i].phase,action:'ready',payload:{value:true}})).body.ok,true);
 }
 for(let i=0;i<10;i++)store.tick();after=store.view(a.token);assert.equal(after.boards[0].phase,'wave');
 await stop(server,store);assert.ok(fs.existsSync(file+'.before-update'));store=createStore(file);server=await listen(store);sockets.forEach(s=>s.close());sockets=await Promise.all(auth.map(x=>connect(url(),x)));
 const resumed=await Promise.all(sockets.map(s=>request(s,'/state')));assert.equal(resumed[0].body.epoch,after.epoch);assert.equal(resumed[0].body.next,after.next);assert.deepEqual(resumed[0].body.boards[0].map,JSON.parse(JSON.stringify(after.boards[0].map)));assert.equal(store.view(a.token).connection.paused,false);assert.equal(resumed[0].body.boards[0].elapsedMs,after.boards[0].elapsedMs);assert.deepEqual(resumed[0].body.boards[0].enemies,JSON.parse(JSON.stringify(after.boards[0].enemies)));
});

 test('browser adapter reconnects automatically after transport drain and releases its socket on stop',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'autohex-reconnect-')),file=path.join(dir,'checkpoint.json');let store=createStore(file),server=await listen(store);const port=server.address().port,url=`http://127.0.0.1:${port}`;
 const a=store.create({requestId:crypto.randomUUID()}),b=store.join({requestId:crypto.randomUUID(),code:a.code});let current=null,rawSocket;
 const adapter=require('../../duo-client.js').create({token:a.token,ioFactory:options=>(rawSocket=io(url,{...options,extraHeaders:{Origin:url},reconnectionDelay:50})),onView:v=>current=v});
 t.after(async()=>{adapter.stop();if(server.listening)await stop(server,store);fs.rmSync(dir,{recursive:true,force:true});});adapter.start();
 const wait=async predicate=>{const end=Date.now()+5000;while(!predicate()){if(Date.now()>end)throw Error('Reconnect timeout');await new Promise(r=>setTimeout(r,25));}};
 await wait(()=>current);const epoch=current.epoch;await stop(server,store);current=null;store=createStore(file);server=createTransport(store,{browser:true});await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));await wait(()=>current);assert.equal(current.epoch,epoch);adapter.stop();assert.equal(rawSocket.connected,false);
 });
