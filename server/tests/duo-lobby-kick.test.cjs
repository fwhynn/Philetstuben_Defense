'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createLobbies}=require('../duo-lobbies.cjs'),{access}=require('../duo-access.cjs');
const packet=(v,action,payload)=>({epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[v.player].phase,action,payload});
function setup(options){const l=createLobbies(options),a=l.create({requestId:randomUUID()}),join={requestId:randomUUID(),code:a.code},b=l.join(join);return {l,a,b,join};}
function kick(l,a,seatId=l.view(a.token).lobbyState.seatIds[1]){return packet(l.view(a.token),'lobbyKick',{seatId});}

test('only the owning host session can remove a partner from an unstarted lobby',()=>{
 const {l,a,b}=setup(),clientId=randomUUID();assert.equal(l.claim(a.token,clientId).ok,true);
 assert.equal(access(l,a.token,randomUUID(),'/command',kick(l,a)).status,409);
 assert.equal(l.receive(b.token,kick(l,b)).ok,false);
 assert.equal(l.receive(a.token,packet(l.view(a.token),'lobbyKick',{})).reason,'invalid');
 assert.equal(l.receive(a.token,packet(l.view(a.token),'lobbyKick',{seatId:b.token})).ok,false,'a private token is not the public seat identity');
 assert.equal(l.view(a.token).lobby.players,2);
 const v=l.view(b.token);assert.equal(l.receive(b.token,packet(v,'lobbyReady',{value:true})).ok,true);
 assert.equal(l.receive(a.token,packet(l.view(a.token),'lobbyStart',{})).ok,true);
 assert.equal(l.receive(a.token,kick(l,a,'a'.repeat(64))).ok,false,'no removal after the game starts');
 assert.equal(l.hasSeat(b.token),true);
});

test('removal resets guest readiness, identity, unlocks and augments while retaining host preparation',()=>{
 const {l,a,b}=setup(),core=require('../../headless-core.cjs')();
 const profile={_duoIdentity:{id:1,username:'Partner'},records:{highestWave:36},milestones:['standard35'],activeHero:'builder',unlocks:['tower:flame','ultimate:archer:volley'],activeUltimates:{archer:'volley'},augmentCards:{...core.augmentCards.clean(null),cards:{archer:[1,0,0,0,0]},equipped:['archer']}};
 assert.equal(l.applyAugments(a.token,{...profile,_duoIdentity:{id:2,username:'Host'}}).ok,true);assert.equal(l.applyAugments(b.token,profile).ok,true);
 assert.equal(l.receive(b.token,packet(l.view(b.token),'lobbyReady',{value:true})).ok,true);
 const before=l.view(a.token),own=before.boards[0];assert.equal(before.lobbyState.augments[1].length,1);
 assert.equal(l.receive(a.token,kick(l,a)).ok,true);const after=l.view(a.token);
 assert.equal(after.lobby.players,1);assert.deepEqual(after.lobbyState.ready,[false,false]);assert.deepEqual(after.connection.players,['connected','waiting']);
 assert.equal(after.lobbyState.names[1],'Gast 2');assert.equal(after.lobbyState.seatIds[1],null);assert.deepEqual(after.lobbyState.augments[1],[]);
 assert.equal(after.boards[1].heroId,'standard');assert.deepEqual(after.lobbyState.loadouts[1],Array.from(core.profile.START_TOWERS));
 for(const field of ['heroId','difficulty','loadout','ultimateUnlocks','buildingUnlocks','metaAugments','map','hand','deckCounts'])assert.deepEqual(after.boards[0][field],own[field],field+' retained for host');
 assert.equal(l.hasSeat(b.token),false);assert.equal(l.view(b.token),null);assert.equal(l.touch(b.token),false);assert.equal(l.claim(b.token,randomUUID(),true).reason,'unauthorized');assert.equal(l.applyAugments(b.token,profile).reason,'unauthorized');
 assert.equal(JSON.stringify(after).includes(b.token),false);
 const replacement=l.join({requestId:randomUUID(),code:a.code});assert.equal(replacement.ok,true);assert.deepEqual(l.view(replacement.token).boards[1].ultimateUnlocks,[]);assert.deepEqual(l.view(replacement.token).boards[1].buildingUnlocks,[]);
});

for(const time of [20000,140000])test('host can remove an offline guest after '+time+' ms without leaving a paused lobby',()=>{
 let now=0;const {l,a,b}=setup({now:()=>now});now=time;l.touch(a.token);assert.equal(l.view(a.token).connection.paused,true);
 assert.equal(l.receive(a.token,kick(l,a)).ok,true);assert.equal(l.view(a.token).connection.paused,false);assert.equal(l.view(a.token).connection.expired,false);assert.equal(l.hasSeat(b.token),false);
 const c=l.join({requestId:randomUUID(),code:a.code});assert.equal(c.ok,true);assert.equal(l.receive(c.token,packet(l.view(c.token),'lobbyReady',{value:true})).ok,true);assert.equal(l.receive(a.token,packet(l.view(a.token),'lobbyStart',{})).ok,true);
});

test('lost replies and stale removal clicks cannot remove the replacement guest',()=>{
 const {l,a,b,join}=setup(),command=kick(l,a);assert.equal(l.receive(a.token,command).ok,true);
 assert.equal(l.receive(a.token,command).duplicate,true);assert.equal(l.join(join).reason,'expired');
 const replacement=l.join({requestId:randomUUID(),code:a.code});assert.equal(replacement.ok,true);
 assert.equal(l.receive(a.token,command).duplicate,true);assert.equal(l.hasSeat(replacement.token),true);
 assert.equal(l.receive(a.token,kick(l,a,command.payload.seatId)).ok,false);assert.equal(l.hasSeat(replacement.token),true);
 assert.equal(l.receive(b.token,packet(l.view(a.token),'lobbyStart',{})).reason,'unauthorized');
 l.setMaintenance(true);assert.equal(l.receive(a.token,kick(l,a)).reason,'maintenance');assert.equal(l.hasSeat(replacement.token),true);
});

test('worker pool durably revokes the old seat and admits a fresh partner after restart',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'duo-kick-')),file=path.join(dir,'checkpoint.json');
 const {createRoomPool}=require('../duo-room-pool.cjs');let pool=createRoomPool(file);t.after(async()=>{await pool.close();fs.rmSync(dir,{recursive:true,force:true});});await pool.ready;
 const a=await pool.create({requestId:randomUUID()}),b=await pool.join({requestId:randomUUID(),code:a.code}),clientId=randomUUID(),v=await pool.view(a.token),command=packet(v,'lobbyKick',{seatId:v.lobbyState.seatIds[1]});
 const result=await access(pool,a.token,clientId,'/command',command,true);assert.equal(result.body.ok,true);assert.equal(result.body.state.lobby.players,1);
 assert.equal((await access(pool,b.token,randomUUID(),'/state')).status,401);assert.equal((await pool.encodedPush(b.token,randomUUID(),{lastKey:null})).status,401);
 await pool.close();pool=createRoomPool(file);await pool.ready;assert.equal(await pool.hasSeat(b.token),false);assert.equal((await pool.view(a.token)).lobby.players,1);
 await pool.touch(a.token);const c=await pool.join({requestId:randomUUID(),code:a.code});assert.equal(c.ok,true);assert.notEqual(c.token,b.token);
 assert.equal((await access(pool,a.token,clientId,'/command',command)).body.duplicate,true);assert.equal(await pool.hasSeat(c.token),true);
 assert.equal((await pool.live()).seatsConnected,2);
});

test('real HTTP and existing socket access are revoked immediately when the host removes a guest',async t=>{
 const {l,a,b}=setup(),{createTransport}=require('../duo-transport.cjs'),{io}=require('socket.io-client'),server=createTransport(l,{browser:true});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,clientId=randomUUID();
 const socket=io(origin,{auth:{token:b.token,clientId},extraHeaders:{Origin:origin},reconnection:false,forceNew:true});
 t.after(async()=>{socket.close();server.quiesce();server.closeAllConnections();await new Promise(r=>server.close(r));});
 await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);});
 assert.equal((await socket.timeout(2000).emitWithAck('request',{path:'/state'})).status,200);
 const response=await fetch(origin+'/command',{method:'POST',headers:{Authorization:'Bearer '+a.token,'X-Duo-Client':randomUUID(),'Content-Type':'application/json',Origin:origin},body:JSON.stringify(kick(l,a))});assert.equal((await response.json()).ok,true);
 assert.equal((await socket.timeout(2000).emitWithAck('request',{path:'/state'})).status,401);
 assert.equal((await fetch(origin+'/state',{headers:{Authorization:'Bearer '+b.token,'X-Duo-Client':clientId}})).status,401);
 assert.equal(l.join({requestId:randomUUID(),code:a.code}).ok,true);
 assert.equal((await socket.timeout(2000).emitWithAck('request',{path:'/session',packet:{action:'takeover'}})).status,401);
});

test('network client permits a host removal during guest disconnection and retries a lost acknowledgement once',async t=>{
 let now=0;const {l,a,b}=setup({now:()=>now});now=20000;l.touch(a.token);let resolveView,lose=true;
 const initial=new Promise(resolve=>resolveView=resolve),{create}=require('../../duo-client.js');
 const client=create({token:a.token,ioFactory:null,onView:resolveView,fetchImpl:async(route,options)=>{
   const result=await access(l,a.token,options.headers['X-Duo-Client'],route,options.body?JSON.parse(options.body):undefined);
   if(route==='/command'&&lose){lose=false;throw Error('Lost acknowledgement');}
   return {ok:result.status===200,status:result.status,json:async()=>result.body};
 }});t.after(()=>client.stop());client.start();const v=await initial;
 assert.equal(v.connection.paused,true);const result=await client.send('lobbyKick',{seatId:v.lobbyState.seatIds[1]});assert.equal(result.duplicate,true);assert.equal(l.hasSeat(b.token),false);assert.equal(l.view(a.token).lobby.players,1);
});
