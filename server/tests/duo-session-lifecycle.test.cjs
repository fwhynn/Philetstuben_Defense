const {test}=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const {createLobbies}=require('../duo-lobbies.cjs'),{createTransport}=require('../duo-transport.cjs'),{createStore}=require('../duo-store.cjs');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');

test('HTTP seat takeover excludes the old tab; explicit leaving ends both boards idempotently',async t=>{
 const l=createLobbies(),a=l.create({requestId:randomUUID()}),b=l.join({requestId:randomUUID(),code:a.code});
 const server=createTransport(l);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
 const origin='http://127.0.0.1:'+server.address().port,first=randomUUID(),second=randomUUID(),partner=randomUUID();
 const req=(token,client,route,body)=>fetch(origin+route,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'X-Duo-Client':client},...(body?{body:JSON.stringify(body)}:{})});
 assert.equal((await req(a.token,first,'/state')).status,200);
 assert.equal((await req(a.token,second,'/state')).status,409);
 assert.equal((await req(a.token,second,'/session',{action:'leave'})).status,409);
 assert.equal((await req(a.token,second,'/session',{action:'takeover',extra:true})).status,400);
 assert.equal((await req(a.token,second,'/session',{action:'takeover'})).status,200);
 assert.equal((await req(a.token,second,'/session',{action:'takeover'})).status,200);
 assert.equal((await req(a.token,first,'/state')).status,409);
 assert.equal((await req(a.token,first,'/command',{})).status,409);
 assert.equal((await req(b.token,partner,'/state')).status,200);
 const view=await req(a.token,second,'/state').then(r=>r.json());
 assert.equal(view.player,0);assert.equal(view.next,1);assert.ok(!JSON.stringify(view).includes(second));
 const board=view.boards[0];let placement;
 for(let index=0;index<board.placements.length&&!placement;index++)for(let rotation=0;rotation<6&&!placement;rotation++){const n=board.placements[index][rotation].find(x=>x.legal);if(n)placement={q:n.q,r:n.r,index,rotation};}
 const command={epoch:view.epoch,sequence:view.next,wave:view.wave,phase:board.phase,action:'place',payload:placement};
 assert.equal((await req(a.token,second,'/command',command).then(r=>r.json())).ok,true);
 assert.equal((await req(a.token,second,'/command',command).then(r=>r.json())).duplicate,true);
 assert.equal((await req(a.token,second,'/session',{action:'leave'}).then(r=>r.json())).ok,true);
 assert.equal((await req(a.token,second,'/session',{action:'leave'}).then(r=>r.json())).duplicate,true);
 const after=await req(b.token,partner,'/state').then(r=>r.json());assert.equal(after.connection.ended.player,0);assert.equal(after.connection.paused,true);
 const elapsed=after.boards.map(x=>x.elapsedMs);for(let i=0;i<10;i++)l.tick();assert.deepEqual(l.view(b.token).boards.map(x=>x.elapsedMs),elapsed);
 assert.equal(l.checkpoint().rooms.length,0);
});

test('session ownership persists before acknowledgement and left matches never revive after restart',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'autohex-lifecycle-')),file=path.join(dir,'checkpoint.json');
 // Only test-owned files are removed, without recursive directory deletion.
 t.after(()=>{for(const name of ['checkpoint.json','checkpoint.json.tmp']){const target=path.join(dir,name);if(fs.existsSync(target))fs.unlinkSync(target);}fs.rmdirSync(dir);});
 let store=createStore(file);const a=store.create({requestId:randomUUID()}),b=store.join({requestId:randomUUID(),code:a.code}),old=randomUUID(),next=randomUUID();
 assert.equal(store.claim(a.token,old).ok,true);assert.equal(store.claim(a.token,next,true).ok,true);
 store=createStore(file);assert.equal(store.claim(a.token,old).reason,'session-replaced');assert.equal(store.claim(a.token,next).ok,true);
 store.touch(a.token);store.touch(b.token);assert.equal(store.view(a.token).connection.paused,false);
 assert.equal(store.leave(a.token).ok,true);store=createStore(file);assert.equal(store.view(a.token),null);assert.equal(store.view(b.token),null);
});

test('leaving a waiting lobby prevents a late join and releases capacity after notice period',()=>{
 let time=0;const l=createLobbies({now:()=>time,limit:1}),a=l.create({requestId:randomUUID()});
 assert.equal(l.leave(a.token).ok,true);assert.equal(l.join({requestId:randomUUID(),code:a.code}).reason,'expired');
 time=60001;assert.ok(l.create({requestId:randomUUID()}).ok);assert.equal(l.view(a.token),null);
});

test('two client adapters require explicit takeover and retry a lost leave response safely',{timeout:5000},async t=>{
 const client=require('../../duo-client.js'),l=createLobbies(),a=l.create({requestId:randomUUID()});l.join({requestId:randomUUID(),code:a.code});
 const server=createTransport(l);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
 const origin='http://127.0.0.1:'+server.address().port;let loseLeave=true;
 const fetchImpl=async(route,options)=>{const response=await fetch(origin+route,options);if(route==='/session'&&JSON.parse(options.body).action==='leave'&&loseLeave){loseLeave=false;await response.json();throw Error('Lost leave response');}return response;};
 let firstReady,secondConflict,firstConflict;const ready=new Promise(r=>firstReady=r),conflict=new Promise(r=>secondConflict=r),replaced=new Promise(r=>firstConflict=r);
 const first=client.create({token:a.token,fetchImpl,onView:()=>firstReady(),onStatus:(_,s)=>{if(s?.conflict)firstConflict();}});
 const second=client.create({token:a.token,fetchImpl,onStatus:(_,s)=>{if(s?.conflict)secondConflict();}});
 t.after(()=>{first.stop();second.stop();});first.start();await ready;second.start();await conflict;
 await assert.rejects(second.send('ready',{value:true}),/übernehmen/);
 await second.takeover();assert.equal(second.player,0);await replaced;
 await assert.rejects(first.send('ready',{value:true}),/übernehmen/);
 assert.equal((await second.leave()).ok,true);assert.equal(l.view(a.token).connection.ended.player,0);
});
