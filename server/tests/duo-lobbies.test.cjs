const {test}=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const {createLobbies}=require('../duo-lobbies.cjs'),{createTransport}=require('../duo-transport.cjs');
test('lobbies isolate sessions, block play before join, and reject a third player',()=>{
 const l=createLobbies(),a=l.create({requestId:randomUUID()}),other=l.create({requestId:randomUUID()});assert.ok(a.ok);assert.notEqual(a.code,other.code);assert.equal(l.view(a.token).lobby.players,1);assert.equal(l.receive(a.token,{}).reason,'waiting-for-partner');const b=l.join({requestId:randomUUID(),code:a.code});assert.ok(b.ok);assert.equal(b.player,1);assert.equal(l.view(a.token).lobby.players,2);assert.equal(l.view(other.token).lobby.players,1);assert.equal(l.join({requestId:randomUUID(),code:a.code}).reason,'full');assert.equal(l.view(b.token).epoch,l.view(a.token).epoch);
});
test('lost create/join responses can be retried without duplicate rooms or stolen seats',()=>{
 const l=createLobbies({limit:1}),request={requestId:randomUUID()},a=l.create(request);assert.deepEqual(l.create(request),a);const join={requestId:randomUUID(),code:a.code},b=l.join(join);assert.deepEqual(l.join(join),b);assert.equal(l.create({requestId:randomUUID()}).reason,'capacity');assert.equal(l.join({...join,code:'FFFFFFFFFF'}).reason,'invalid');assert.equal(l.view(a.token).player,0);assert.equal(l.view(b.token).player,1);
});
test('expired rooms revoke sessions and release capacity',()=>{
 let time=0;const l=createLobbies({now:()=>time,limit:1}),a=l.create({requestId:randomUUID()});time=31*60000;assert.equal(l.view(a.token),null);assert.equal(l.join({requestId:randomUUID(),code:a.code}).reason,'not-found');assert.ok(l.create({requestId:randomUUID()}).ok);
});
test('HTTP lobby flow creates and joins a private room, including concurrent join attempts',async t=>{
 const l=createLobbies(),server=createTransport(l,{browser:true,autoTick:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));const url='http://127.0.0.1:'+server.address().port;
 const post=(route,body)=>fetch(url+route,{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json());const page=await fetch(url+'/').then(r=>r.text());assert.ok(page.includes('Lobby erstellen'));
 const a=await post('/lobby/create',{requestId:randomUUID()});assert.ok(a.ok);const joins=await Promise.all([post('/lobby/join',{requestId:randomUUID(),code:a.code}),post('/lobby/join',{requestId:randomUUID(),code:a.code})]);assert.equal(joins.filter(j=>j.ok).length,1);assert.equal(joins.filter(j=>j.reason==='full').length,1);
 const state=await fetch(url+'/state',{headers:{Authorization:'Bearer '+a.token}}).then(r=>r.json());assert.equal(state.lobby.players,2);assert.ok(!JSON.stringify(state).includes(a.token));
});
