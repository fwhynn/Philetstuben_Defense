'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {io}=require('socket.io-client'),{createStore}=require('../duo-store.cjs'),{createTransport}=require('../duo-transport.cjs');
const temp=(t,name)=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),name));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return path.join(dir,'checkpoint.json');};
async function listen(t,store){const server=createTransport(store,{browser:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.quiesce();server.closeAllConnections();server.close(resolve);}));return 'http://127.0.0.1:'+server.address().port;}
async function connect(url,auth){const s=io(url,{auth,extraHeaders:{Origin:url},reconnection:false,forceNew:true});await new Promise((resolve,reject)=>{s.once('connect',resolve);s.once('connect_error',reject);});return s;}

test('a release with open lobbies drops only the incompatible matches, keeps receipts and backs up the old file',t=>{
 const file=temp(t,'autohex-release-'),store=createStore(file,{now:()=>Date.parse('2026-10-08T12:00:00Z')}),a=store.create({requestId:crypto.randomUUID()});store.join({requestId:crypto.randomUUID(),code:a.code});
 const data=JSON.parse(fs.readFileSync(file,'utf8')),receipt={id:'a'.repeat(64),outcome:'victory',wave:35,diamonds:12};
 data.rooms[0].room.ruleset='0.0.1';data.settlements=[[a.token,[receipt]]];fs.writeFileSync(file,JSON.stringify(data));
 const original=fs.readFileSync(file,'utf8');let restarted;
 assert.doesNotThrow(()=>restarted=createStore(file,{now:()=>Date.parse('2026-10-08T12:05:00Z')}));
 assert.equal(restarted.discarded,1);assert.equal(restarted.view(a.token),null);assert.deepEqual(restarted.receipts(a.token),[receipt]);
 const backups=fs.readdirSync(path.dirname(file)).filter(name=>name.startsWith('checkpoint.json.incompatible-'));
 assert.equal(backups.length,1);assert.equal(fs.readFileSync(path.join(path.dirname(file),backups[0]),'utf8'),original);
 assert.equal(JSON.parse(fs.readFileSync(file,'utf8')).rooms.length,0);
 assert.ok(restarted.create({requestId:crypto.randomUUID()}).ok,'The restarted server accepts new lobbies');
 // Damaged files still refuse to start instead of being overwritten.
 fs.writeFileSync(file,JSON.stringify({...data,format:'broken'}));assert.throws(()=>createStore(file));
});

test('an open socket keeps a silent player present; closing it pauses the match after the grace period',async t=>{
 let clock=Date.now();const store=createStore(temp(t,'autohex-presence-'),{now:()=>clock}),url=await listen(t,store);
 const a=store.create({requestId:crypto.randomUUID()}),b=store.join({requestId:crypto.randomUUID(),code:a.code});
 const sockets=await Promise.all([a,b].map(seat=>connect(url,{token:seat.token,clientId:crypto.randomUUID()})));t.after(()=>sockets.forEach(s=>s.close()));
 clock+=30000;await new Promise(r=>setTimeout(r,1300));
 assert.deepEqual(store.view(a.token).connection.players,['connected','connected'],'No /state polling needed while the socket is open');
 sockets[1].close();await new Promise(r=>setTimeout(r,200));clock+=11000;await new Promise(r=>setTimeout(r,1100));
 const status=store.view(a.token).connection;assert.deepEqual(status.players,['connected','disconnected']);assert.equal(status.paused,true);
});

test('board snapshots are compressed over HTTP and Socket.IO',async t=>{
 const store=createStore(temp(t,'autohex-compress-')),url=await listen(t,store),a=store.create({requestId:crypto.randomUUID()});store.join({requestId:crypto.randomUUID(),code:a.code});
 const raw=await new Promise((resolve,reject)=>require('node:http').get(url+'/state',{headers:{Authorization:'Bearer '+a.token,'Accept-Encoding':'gzip'}},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({res,body:Buffer.concat(chunks)}));}).on('error',reject));
 assert.equal(raw.res.statusCode,200);assert.equal(raw.res.headers['content-encoding'],'gzip');assert.equal(JSON.parse(require('node:zlib').gunzipSync(raw.body)).lobby.code,a.code);
 const socket=io(url,{auth:{token:a.token,clientId:crypto.randomUUID()},extraHeaders:{Origin:url},transports:['websocket'],reconnection:false,forceNew:true});t.after(()=>socket.close());
 await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);});
 assert.match(socket.io.engine.transport.ws.extensions,/permessage-deflate/);
});
