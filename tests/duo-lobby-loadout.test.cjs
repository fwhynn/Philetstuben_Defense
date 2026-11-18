const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {createLobbies}=require('../server/duo-lobbies.cjs'),{randomUUID}=require('node:crypto'),core=require('../headless-core.cjs')();

for(const player of [0,1])test('seat '+player+' recovers failed account loading, shows both names and selects its own augments',async()=>{
 const lobby=createLobbies(),a=lobby.create({requestId:randomUUID()}),b=lobby.join({requestId:randomUUID(),code:a.code}),seat=[a,b][player],other=[b,a][player],nodes=new Map(),timers=[];
 const p=i=>({_duoIdentity:{id:i+1,username:['Phil','Mate'][i]},records:{highestWave:36},unlocks:['tower:flame'],augmentCards:{...core.augmentCards.clean(null),cards:{archer:[1,0,0,0,0],chain:[0,1,0,0,0]},equipped:['archer']}});
 lobby.applyAugments(other.token,p(1-player));let requests=0;
 const element=()=>({children:[],listeners:{},attributes:{},dataset:{},appendChild(n){this.children.push(n);return n;},replaceChildren(...n){this.children=n;},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,f){this.listeners[k]=f;}});
 const doc={getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},createElement:element},storage=new Map();
 const context={document:doc,URLSearchParams,location:{hash:'#session='+seat.token,origin:'http://localhost',assign(){}},crypto:{randomUUID},Date,setTimeout:fn=>timers.push(fn),sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},localStorage:{getItem:()=>null},addEventListener(){},HexBuildings:core.buildings,HexHeroes:core.heroes,HexAugmentCards:core.augmentCards,HexData:core.data,HexArsenal:{icon:()=>''},HexProfile:{load:()=>({unlockedTowers:[]}),modesUnlocked:()=>true},HexApi:{async applyDuoAugments(token){if(++requests===1)throw Error('Vorübergehend nicht erreichbar');return lobby.applyAugments(token,p(player));}},HexDuoClient:{inviteCode:()=>'',create(o){return {start(){o.onView(lobby.view(seat.token));},stop(){},async send(action,payload){const v=lobby.view(seat.token);assert.ok(lobby.receive(seat.token,{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[player].phase,action,payload}).ok);o.onView(lobby.view(seat.token));}};}}};
 const settle=()=>new Promise(r=>setImmediate(r));await vm.runInNewContext(fs.readFileSync('duo-lobby.js','utf8'),context);await settle();
 assert.equal(nodes.get('lobbyReady').disabled,true);assert.ok(nodes.get('lobbyAugments').children.some(n=>n.textContent==='Account erneut laden'));
 timers.shift()();await settle();if(timers.length){timers.shift()();await settle();}
 assert.equal(requests,2);assert.match(nodes.get('friendName').textContent,new RegExp(player?'Phil':'Mate'));assert.match(nodes.get('ownName').textContent,new RegExp(player?'Mate':'Phil'));
 const row=()=>nodes.get('lobbyAugments').children[0],chain=row().children.find(n=>n.dataset.augment==='chain');assert.equal(chain.disabled,false);await chain.listeners.click();
 assert.deepEqual(lobby.view(other.token).lobbyState.augments[player],[{id:'archer',tier:0},{id:'chain',tier:1}]);assert.deepEqual(lobby.view(seat.token).lobbyState.augments[1-player],[{id:'archer',tier:0}]);
 assert.equal(row().children.find(n=>n.dataset.augment==='chain').attributes['aria-pressed'],'true');
});
test('lobby UI selects five towers, applies on server, reflects partner and prevents edits when ready',async()=>{
 const lobby=createLobbies(),a=lobby.create({requestId:randomUUID()}),b=lobby.join({requestId:randomUUID(),code:a.code});const nodes=new Map(),calls=[];let callbacks;
 function node(tag='div'){return {tag,children:[],listeners:{},attributes:{},dataset:{},value:'',hidden:false,disabled:false,textContent:'',appendChild(n){this.children.push(n);return n;},replaceChildren(...n){this.children=n;},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,f){this.listeners[k]=f;},querySelector(){return node('button');},focus(){},remove(){}};}
 const doc={getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},createElement:node};
 const storage=new Map(),context={document:doc,URLSearchParams,location:{hash:'#session='+a.token,origin:'http://localhost',pathname:'/duo-lobby.html',assign(){}},history:{replaceState(){}},crypto:{randomUUID},Date,setTimeout:cb=>setImmediate(cb),sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},localStorage:{getItem:()=>null},addEventListener(){},HexBuildings:core.buildings,HexHeroes:core.heroes,HexAugmentCards:core.augmentCards,HexApi:{async applyDuoAugments(token){calls.push({action:"accountAugments"});assert.equal(token,a.token);const result=lobby.applyAugments(token,{records:{highestWave:36},unlocks:['tower:flame'],unlockedTowers:['flame'],milestones:['standard35'],augmentCards:{...core.augmentCards.clean(null),cards:{archer:[1,0,0,0,0]},equipped:['archer']}});assert.equal(result.ok,true);return result;}},HexData:core.data,HexArsenal:{icon:()=>'<svg></svg>'},HexProfile:{load:()=>({unlockedTowers:Object.keys(core.data.TOWERS)}),modesUnlocked:()=>true},HexDuoClient:{inviteCode:()=>'',create(options){callbacks=options;return {start(){options.onView(lobby.view(a.token));},stop(){},async send(action,payload){calls.push({action,payload});const v=lobby.view(a.token),result=lobby.receive(a.token,{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[0].phase,action,payload});assert.ok(result.ok);options.onView(lobby.view(a.token));}};}}};
 await vm.runInNewContext(fs.readFileSync('duo-lobby.js','utf8'),context);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls.length,1);assert.equal(calls[0].action,'accountAugments');
 assert.deepEqual(lobby.view(b.token).lobbyState.augments[0],[{id:'archer',tier:0}]);
 assert.equal(nodes.get('lobbyAugments').children[0].children[1].dataset.augment,'archer');
 assert.deepEqual(lobby.view(b.token).lobbyState.ready,[false,false]);
 const choices=()=>nodes.get('lobbyLoadoutChoices').children,choose=id=>choices()[Object.keys(core.data.TOWERS).indexOf(id)];assert.equal(nodes.get('lobbyLoadoutCount').textContent,'5/5');assert.equal(nodes.get('lobbyPartnerLoadout').children.length,5);

 const settle=async()=>{for(let i=0;i<4;i++)await new Promise(resolve=>setImmediate(resolve));};
 choose('archer').listeners.click();assert.equal(nodes.get('lobbyLoadoutCount').textContent,'4/5');assert.equal(nodes.get('lobbyReady').disabled,true);choose('flame').listeners.click();await settle();
 assert.ok(lobby.view(b.token).lobbyState.loadouts[0].includes('flame'));assert.deepEqual(lobby.view(b.token).lobbyState.augments[0],[]);
 const hero=nodes.get('lobbyHero');hero.value='builder';hero.listeners.change();await settle();
 const fronts=nodes.get('lobbyFronts');fronts.value='dual';fronts.listeners.change();await settle();
 assert.equal(lobby.view(b.token).boards[0].heroId,'builder');assert.equal(lobby.view(b.token).boards[0].openingRemaining,2);assert.equal(lobby.view(b.token).boards[1].difficulty,'dual');
 const selected=choices()[0];callbacks.onView(lobby.view(a.token));assert.equal(choices()[0],selected,'network refresh preserves unchanged button nodes');
 assert.equal(nodes.get('lobbyReady').disabled,true,'host waits until partner is ready');
 const v=lobby.view(b.token);assert.ok(lobby.receive(b.token,{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[1].phase,action:'lobbyReady',payload:{value:true}}).ok);
 callbacks.onView(lobby.view(a.token));assert.equal(nodes.get('lobbyReady').textContent,'Spiel starten');assert.equal(nodes.get('lobbyReady').disabled,false);
 await nodes.get('lobbyReady').listeners.click();assert.equal(calls.at(-1).action,'lobbyStart');assert.ok(lobby.view(a.token).lobbyState.started);assert.equal(nodes.has('lobbyApplyLoadout'),false);
});
