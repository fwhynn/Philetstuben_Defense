'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {io}=require('socket.io-client'),{createRoom}=require('../duo-room.cjs'),{createTransport}=require('../duo-transport.cjs');
const client=require('../../duo-client.js');
const loadout=['archer','catapult','chain','freeze','mine'];
async function listen(t,room){const server=createTransport(room,{browser:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.quiesce();server.closeAllConnections();server.close(resolve);}));return 'http://127.0.0.1:'+server.address().port;}
const until=async(predicate,ms=3000)=>{const end=Date.now()+ms;while(!predicate()){if(Date.now()>end)throw Error('timeout');await new Promise(r=>setTimeout(r,20));}};

test('invite field accepts a pasted invite link as well as the bare code',()=>{
 assert.equal(client.inviteCode('https://autohextd.autophil.lol/duo-lobby.html#join=ab12CD34ef'),'AB12CD34EF');
 assert.equal(client.inviteCode('AB12CD34EF'),'AB12CD34EF');
 assert.equal(client.inviteCode('  ab12 cd34-ef '),'AB12CD34EF');
 for(const bad of ['https://au','#join=AB12CD34EF1','XYZ','',null,undefined])assert.equal(client.inviteCode(bad),'',String(bad));
 const html=fs.readFileSync(path.join(__dirname,'../../duo-lobby.html'),'utf8'),input=html.match(/<input id="code"[^>]*>/)[0];
 assert.doesNotMatch(input,/maxlength|pattern/,'A pasted link must not be truncated or blocked by browser validation');
});

test('HTTP adapter reports an expired session once and stops polling instead of retrying forever',async t=>{
 const room=createRoom({loadouts:[loadout,loadout]});room.connect(0);const origin=await listen(t,room);
 let requests=0;const statuses=[];
 const adapter=client.create({token:'f'.repeat(64),clientId:crypto.randomUUID(),fetchImpl:(p,o)=>{requests++;return fetch(origin+p,o);},onStatus:(text,session)=>statuses.push(session)});
 adapter.start();t.after(()=>adapter.stop());
 await until(()=>statuses.length);const seen=requests;await new Promise(r=>setTimeout(r,250));
 assert.deepEqual(statuses,[{invalid:true}]);assert.equal(requests,seen);
});

test('Socket.IO adapter treats a rejected unknown token as an expired session',async t=>{
 const room=createRoom({loadouts:[loadout,loadout]});room.connect(0);const url=await listen(t,room);const statuses=[];
 const adapter=client.create({token:'e'.repeat(64),clientId:crypto.randomUUID(),ioFactory:options=>io(url,{...options,extraHeaders:{Origin:url},forceNew:true}),onStatus:(text,session)=>statuses.push(session)});
 adapter.start();t.after(()=>adapter.stop());
 await until(()=>statuses.some(s=>s?.invalid));
});
