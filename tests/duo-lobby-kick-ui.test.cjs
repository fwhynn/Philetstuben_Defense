const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),{randomUUID}=require('node:crypto');
const {createLobbies}=require('../server/duo-lobbies.cjs'),core=require('../headless-core.cjs')();
const settle=async()=>{for(let i=0;i<3;i++)await new Promise(r=>setImmediate(r));};
async function setup(player=0){
 let now=0,callbacks;const l=createLobbies({now:()=>now}),a=l.create({requestId:randomUUID()}),b=l.join({requestId:randomUUID(),code:a.code}),seat=[a,b][player],nodes=new Map(),calls=[],control={},storage=new Map([['autohex-duo-session',seat.token]]);
 function node(){return {children:[],listeners:{},attributes:{},dataset:{},hidden:false,disabled:false,appendChild(n){this.children.push(n);return n;},replaceChildren(...n){this.children=n;},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,f){this.listeners[k]=f;},querySelector:node,remove(){this.removed=true;}};}
 const context={document:{getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},createElement:node},URLSearchParams,location:{hash:'#session='+seat.token,origin:'http://localhost',pathname:'/duo-lobby.html',assign(){}},history:{replaceState(){}},crypto:{randomUUID},Date,setTimeout,sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},localStorage:{getItem:k=>storage.get(k),removeItem:k=>storage.delete(k)},addEventListener(){},HexData:core.data,HexBuildings:core.buildings,HexHeroes:core.heroes,HexAugmentCards:core.augmentCards,HexArsenal:{icon:()=>''},HexProfile:{load:()=>({}),modesUnlocked:()=>true},HexApi:{applyDuoAugments:async token=>l.applyAugments(token,null)},HexDuoClient:{inviteCode:()=>'',create(o){callbacks=o;return {start(){o.onView(l.view(seat.token));},stop(){control.stopped=true;},async send(action,payload){calls.push({action,payload});if(control.delay)await control.delay;if(control.fail)throw Error('Verbindung unterbrochen');const v=l.view(seat.token),result=l.receive(seat.token,{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[player].phase,action,payload});assert.equal(result.ok,true);o.onView(l.view(seat.token));return result;}};}}};
 await vm.runInNewContext(fs.readFileSync('duo-lobby.js','utf8'),context);await settle();
 return {l,a,b,nodes,calls,control,storage,callbacks,offline(){now=20000;l.touch(a.token);callbacks.onView(l.view(seat.token));}};
}

test('host sees the remove action for an offline partner, duplicate clicks are suppressed and replacement seat is shown',async()=>{
 const h=await setup(),button=h.nodes.get('lobbyKick');h.offline();assert.equal(button.hidden,false);assert.equal(button.disabled,false);
 let done;h.control.delay=new Promise(r=>done=r);const removal=button.listeners.click();assert.equal(button.disabled,true);assert.equal(button.attributes['aria-busy'],'true');await button.listeners.click();assert.equal(h.calls.length,1);done();await removal;
 assert.equal(h.l.hasSeat(h.b.token),false);assert.equal(button.hidden,true);assert.equal(button.attributes['aria-busy'],'false');assert.equal(h.nodes.get('lobbyReady').disabled,true);assert.match(h.nodes.get('lobbyHint').textContent,/Link/);
 const c=h.l.join({requestId:randomUUID(),code:h.a.code});assert.equal(c.ok,true);h.callbacks.onView(h.l.view(h.a.token));assert.equal(button.hidden,false);assert.equal(button.disabled,false);assert.equal(h.nodes.get('friendReady').textContent,'Noch nicht bereit');
});

test('guest cannot use the remove action and a revoked session returns to the entry screen',async()=>{
 const h=await setup(1),button=h.nodes.get('lobbyKick');assert.equal(button.hidden,true);await button.listeners.click();assert.equal(h.calls.length,0);
 h.callbacks.onStatus('Sitzung ungültig',{invalid:true});assert.equal(h.control.stopped,true);assert.equal(h.storage.has('autohex-duo-session'),false);assert.equal(h.nodes.get('waitingLobby').hidden,true);assert.equal(h.nodes.get('lobbyEntry').hidden,false);assert.match(h.nodes.get('status').textContent,/Platz.*nicht mehr verfügbar/);
});

test('failed removal keeps the partner visible and offers the host another attempt',async()=>{
 const h=await setup(),button=h.nodes.get('lobbyKick');h.control.fail=true;await button.listeners.click();assert.equal(button.disabled,false);assert.equal(button.hidden,false);assert.equal(h.l.hasSeat(h.b.token),true);assert.match(h.nodes.get('status').textContent,/Verbindung unterbrochen/);
 h.control.fail=false;await button.listeners.click();assert.equal(h.l.hasSeat(h.b.token),false);
});
