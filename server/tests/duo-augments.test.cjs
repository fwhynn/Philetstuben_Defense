const {test}=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const core=require('../../headless-core.cjs')(),{createLobbies}=require('../duo-lobbies.cjs'),{createTransport}=require('../duo-transport.cjs'),{createAccountAugments}=require('../duo-account-augments.cjs');
const profile=()=>({diamonds:100,unlocks:['tower:flame'],records:{highestWave:36},unlockedTowers:['archer','chain'],augmentCards:{...core.augmentCards.clean(null),cards:{archer:[1,0,0,0,0],chain:[0,1,0,0,0]},equipped:['archer','chain']}});
function command(r,s,action,payload){const v=r.view(s.token);return r.receive(s.token,{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[s.player].phase,action,payload});}
function setup(){const room=createLobbies({now:()=>0}),a=room.create({requestId:randomUUID()}),b=room.join({requestId:randomUUID(),code:a.code});return {room,a,b};}
test('Duo freezes own account selection, retains partner readiness and persists across restore',()=>{
 let {room,a,b}=setup();command(room,b,'lobbyReady',{value:true});const p=profile();assert.equal(room.applyAugments(a.token,p).ok,true);p.augmentCards.cards.archer[4]=1;
 const before=room.view(a.token);assert.deepEqual(before.lobbyState.ready,[false,true]);assert.deepEqual(before.lobbyState.augments[0],[{id:'archer',tier:0},{id:'chain',tier:1}]);assert.deepEqual(before.lobbyState.augments[1],[]);
 room=createLobbies({now:()=>0,snapshot:JSON.parse(JSON.stringify(room.checkpoint()))});room.touch(a.token);room.touch(b.token);assert.deepEqual(room.view(a.token).lobbyState.augments,before.lobbyState.augments);
 assert.equal(command(room,a,'lobbyAugments',{cards:[{id:'mine',tier:4}]}).ok,false);
 command(room,a,'lobbyReady',{value:true});assert.equal(room.applyAugments(a.token,profile()).ok,false);
});
test('Duo authenticated profile lookup is fixed-origin and refuses legacy APIs or forged tokens',async()=>{
 let called;const load=createAccountAugments('https://api.example.test',async(url,options)=>{called={url:String(url),options};return {ok:true,json:async()=>({augmentProtocol:1,data:{profile:profile()}})};});
 assert.equal((await load('a'.repeat(64))).diamonds,100);assert.equal(called.url,'https://api.example.test/saves');assert.equal(called.options.redirect,'error');
 await assert.rejects(load('bad'));assert.throws(()=>createAccountAugments('http://untrusted.test'));
 await assert.rejects(createAccountAugments('https://api.example.test',async()=>({ok:true,json:async()=>({data:{profile:profile()}})}))('a'.repeat(64)));
});
test('Duo HTTP endpoint ignores client card payload and uses only the trusted account lookup',async t=>{
 const {room,a,b}=setup();let calls=0;
 const server=createTransport(room,{loadAugmentProfile:async token=>{assert.equal(token,'a'.repeat(64));calls++;return profile();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>{server.closeAllConnections();return new Promise(resolve=>server.close(resolve));});
 const url='http://127.0.0.1:'+server.address().port+'/lobby/augments',clientId=randomUUID();
 const response=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+a.token,'X-Duo-Client':clientId,'X-Account-Token':'a'.repeat(64)},body:JSON.stringify({cards:[{id:'mine',tier:4}]})});
 assert.equal(response.status,200);assert.equal(calls,1);assert.deepEqual(room.view(b.token).lobbyState.augments[0],[{id:'archer',tier:0},{id:'chain',tier:1}]);
 const bad=await fetch(url,{method:'POST',headers:{Authorization:'Bearer invalid','X-Account-Token':'a'.repeat(64)}});assert.equal(bad.status,401);assert.equal(calls,1);
 assert.ok(!JSON.stringify(room.checkpoint()).includes('a'.repeat(64)));
});
