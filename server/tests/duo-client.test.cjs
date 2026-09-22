const {test}=require('node:test'),assert=require('node:assert/strict');
const {createRoom}=require('../duo-room.cjs'),{createTransport}=require('../duo-transport.cjs');
const client=require('../../duo-client.js');
const loadout=['archer','catapult','chain','freeze','mine'];
test('browser adapter retries a lost acknowledgement with same sequence and uses only authoritative state',async t=>{
 const room=createRoom({seed:'network-adapter',loadouts:[loadout,loadout]}),seat=room.connect(0);room.connect(1);const server=createTransport(room,{browser:true,autoTick:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));const origin='http://127.0.0.1:'+server.address().port;
 assert.equal((await fetch(origin+'/duo-prototype.html')).status,200);assert.equal((await fetch(origin+'/duo-client.js')).status,200);assert.equal((await fetch(origin+'/state',{headers:{Authorization:'Bearer '+seat.token,Origin:'http://foreign.test'}})).status,403);
 let views=[],loseReply=true,first;const ready=new Promise(resolve=>first=resolve);
 const adapter=client.create({token:seat.token,fetchImpl:async(path,options)=>{const response=await fetch(origin+path,{...options,headers:{...options.headers,Origin:origin}});if(path==='/command'&&loseReply){loseReply=false;await response.json();throw Error('Lost reply');}return response;},onView:view=>{views.push(view);first();}});adapter.start();t.after(()=>adapter.stop());await ready;
 const before=views.at(-1),board=before.boards[0];let choice;for(let index=0;index<board.placements.length&&!choice;index++)for(let rotation=0;rotation<6&&!choice;rotation++){const target=board.placements[index][rotation].find(t=>t.legal);if(target)choice={q:target.q,r:target.r,index,rotation};}
 assert.ok(choice);await adapter.send('place',choice);assert.equal(room.view(seat.token).boards[0].map.length,2);assert.equal(room.view(seat.token).next,2);assert.equal(views.at(-1).boards[0].phase,'build');
 loseReply=true;const gold=room.view(seat.token).boards[0].gold;await adapter.send('tower',{type:'archer',slots:[{q:choice.q,r:choice.r,index:0}]});assert.equal(room.view(seat.token).boards[0].gold,gold-25);assert.equal(room.view(seat.token).next,3);
 const display=client.presentation(views.at(-1));display.boards[0].state.gold=99999;assert.notEqual(room.view(seat.token).boards[0].gold,99999);assert.ok(display.boards[0].state.map instanceof Map);
});
test('automatic server ticks advance combat while clients do not poll',async t=>{
 const room=createRoom({seed:'tick',loadouts:[loadout,loadout]}),seats=[room.connect(0),room.connect(1)];
 function send(seat,action,payload){const v=room.view(seat.token);return room.receive(seat.token,{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[seat.player].phase,action,payload});}
 for(const seat of seats){const b=room.view(seat.token).boards[seat.player];let p;for(let index=0;index<b.placements.length&&!p;index++)for(let rotation=0;rotation<6&&!p;rotation++){const target=b.placements[index][rotation].find(t=>t.legal);if(target)p={q:target.q,r:target.r,index,rotation};}assert.ok(send(seat,'place',p).ok);assert.ok(send(seat,'ready',{value:true}).ok);}
 const server=createTransport(room,{autoTick:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));await new Promise(resolve=>setTimeout(resolve,220));assert.ok(room.view(seats[0].token).boards.every(b=>b.elapsedMs>=100));
});

test('both sanitized board views render through the SVG adapter without secret state or browser',()=>{
 const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
 function element(){return {style:{},children:[],setAttribute(){},addEventListener(){},appendChild(e){this.children.push(e);return e;},remove(){}};}
 const context=vm.createContext({document:{createElementNS:element}});
 for(const name of ['biomes','data','map','heroes','exploration','buildings','camera','svg-renderer'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../../classes/'+name+'.js'),'utf8'),context);
 const room=createRoom({loadouts:[loadout,loadout]}),seat=room.connect(0);room.connect(1);const view=room.view(seat.token),model=client.presentation(view);
 const renderer=vm.runInContext('HexSvgRenderer',context).create(element(),{});
 for(const {state} of model.boards)assert.doesNotThrow(()=>renderer.render(state,state.placements?.[0]?.[0]||[]));
});

test('Duo pages serve every referenced script after the directory migration',async t=>{
 const room=createRoom({loadouts:[loadout,loadout]}),seat=room.connect(0);
 const server=createTransport(room,{browser:true});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
 const origin='http://127.0.0.1:'+server.address().port;
 for(const page of ['/duo-prototype.html','/duo-lobby.html']){
  const response=await fetch(origin+page);assert.equal(response.status,200);
  const html=await response.text(),sources=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)];
  assert.ok(sources.length>0);
  for(const [,source] of sources){
   const script=await fetch(new URL(source,origin+page));
   assert.equal(script.status,200,source);
   assert.match(script.headers.get('content-type'),/javascript/,source);
   assert.ok((await script.text()).length>0,source);
  }
 }
 assert.equal((await fetch(origin+'/server/duo-room.cjs',{headers:{Authorization:'Bearer '+seat.token}})).status,404);
});
