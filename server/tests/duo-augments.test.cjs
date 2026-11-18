const {test}=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const core=require('../../headless-core.cjs')(),{createLobbies}=require('../duo-lobbies.cjs'),{createTransport}=require('../duo-transport.cjs'),{createAccountAugments}=require('../duo-account-augments.cjs');
const profile=()=>({diamonds:100,unlocks:['tower:flame'],records:{highestWave:36},unlockedTowers:['archer','chain'],augmentCards:{...core.augmentCards.clean(null),cards:{archer:[1,0,0,0,0],chain:[0,1,0,0,0]},equipped:['archer','chain']}});
function command(r,s,action,payload){const v=r.view(s.token);return r.receive(s.token,{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[s.player].phase,action,payload});}
function setup(){const room=createLobbies({now:()=>0}),a=room.create({requestId:randomUUID()}),b=room.join({requestId:randomUUID(),code:a.code});return {room,a,b};}

test('both seats see verified names and can independently choose owned augments before ready',()=>{
 let {room,a,b}=setup();const host={...profile(),_duoIdentity:{id:1,username:'Phil'}},mate={...profile(),_duoIdentity:{id:2,username:'Partner'}};
 const original=JSON.stringify([host,mate]);room.applyAugments(a.token,host);room.applyAugments(b.token,mate);
 for(const seat of [a,b])assert.deepEqual(room.view(seat.token).lobbyState.names,['Phil','Partner']);
 assert.ok(command(room,b,'lobbyReady',{value:true}).ok);
 assert.ok(command(room,a,'lobbyAugments',{cards:['chain']}).ok);assert.deepEqual(room.view(b.token).lobbyState.augments[0],[{id:'chain',tier:1}]);assert.deepEqual(room.view(a.token).lobbyState.ready,[false,true]);
 assert.equal(command(room,a,'lobbyAugments',{cards:['mine']}).ok,false);assert.equal(command(room,a,'lobbyAugments',{cards:['chain','chain']}).ok,false);
 room.applyAugments(a.token,host);assert.deepEqual(room.view(a.token).lobbyState.augments[0],[{id:'chain',tier:1}],'account refresh retains party selection');
 room=createLobbies({now:()=>0,snapshot:JSON.parse(JSON.stringify(room.checkpoint()))});room.touch(a.token);room.touch(b.token);
 assert.deepEqual(room.view(b.token).lobbyState.names,['Phil','Partner']);assert.deepEqual(room.view(b.token).lobbyState.augments[0],[{id:'chain',tier:1}]);
 assert.ok(command(room,b,'lobbyAugments',{cards:['archer']}).ok);assert.deepEqual(room.view(a.token).lobbyState.ready,[false,false]);
 assert.equal(JSON.stringify([host,mate]),original,'selection never mutates an account profile');
 command(room,b,'lobbyReady',{value:true});command(room,a,'lobbyStart',{});assert.equal(command(room,a,'lobbyAugments',{cards:[]}).ok,false);
});

test('lobby choices enforce earned slots, compatible towers and guest isolation',()=>{
 const {room,a,b}=setup(),p=profile();p.records.highestWave=16;p.unlockedTowers.push('flame');room.applyAugments(a.token,p);room.applyAugments(b.token,null);
 assert.equal(room.view(a.token).lobbyState.setupOptions.augments.slots,1);
 assert.equal(command(room,a,'lobbyAugments',{cards:['archer','chain']}).ok,false);assert.equal(command(room,b,'lobbyAugments',{cards:['archer']}).ok,false);
 assert.ok(command(room,a,'lobbyLoadout',{towers:['flame','catapult','chain','freeze','mine']}).ok);assert.equal(command(room,a,'lobbyAugments',{cards:['archer']}).ok,false);
});
test('Duo freezes own account selection, retains partner readiness and persists across restore',()=>{
 let {room,a,b}=setup();command(room,b,'lobbyReady',{value:true});const p=profile();assert.equal(room.applyAugments(a.token,p).ok,true);p.augmentCards.cards.archer[4]=1;
 const before=room.view(a.token);assert.deepEqual(before.lobbyState.ready,[false,true]);assert.deepEqual(before.lobbyState.augments[0],[{id:'archer',tier:0},{id:'chain',tier:1}]);assert.deepEqual(before.lobbyState.augments[1],[]);
 room=createLobbies({now:()=>0,snapshot:JSON.parse(JSON.stringify(room.checkpoint()))});room.touch(a.token);room.touch(b.token);assert.deepEqual(room.view(a.token).lobbyState.augments,before.lobbyState.augments);
 assert.equal(command(room,a,'lobbyAugments',{cards:[{id:'mine',tier:4}]}).ok,false);
 command(room,a,'lobbyReady',{value:true});assert.equal(room.applyAugments(a.token,profile()).ok,false);
});
test('Duo authenticated profile lookup is fixed-origin and refuses legacy APIs or forged tokens',async()=>{
 const called=[];const load=createAccountAugments('https://api.example.test',async(url,options)=>{called.push({url:String(url),options});return {ok:true,json:async()=>String(url).endsWith('/me')?{user:{id:17,username:'Partner'}}:{augmentProtocol:1,data:{profile:profile()}}};});
 assert.equal((await load('a'.repeat(64))).diamonds,100);assert.deepEqual(called.map(c=>c.url),['https://api.example.test/saves','https://api.example.test/me']);assert.ok(called.every(c=>c.options.redirect==='error'));
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

test('each fortress, road layout and equipped Arsenal path is seat-specific through restart and rematch',()=>{
 let {room,a,b}=setup();
 const p={...profile(),activeHero:'merchant',difficulty:'dual',milestones:['standard35','dual35'],
   unlocks:['tower:flame','ultimate:archer','building:market'],activeUltimates:{archer:'marksman'}};
 room.applyAugments(a.token,p);room.applyAugments(b.token,null);
 const board=seat=>room.view(seat.token).boards[seat.player];
 assert.equal(board(a).heroId,'merchant');assert.equal(board(a).openingRemaining,2);assert.equal(board(a).hand.length,5);
 assert.equal(board(a).gold,90);assert.equal(board(a).income,2);assert.equal(board(b).gold,70);assert.equal(room.view(a.token).hp,35);
 assert.deepEqual(board(a).ultimateUnlocks,['ultimate:archer:marksman']);assert.deepEqual(board(b).buildingUnlocks,[]);
 assert.equal(command(room,b,'lobbyLoadout',{heroId:'merchant',difficulty:'dual',towers:board(b).loadout}).ok,false);
 assert.equal(command(room,a,'lobbyLoadout',{heroId:'builder',difficulty:'normal',towers:board(a).loadout}).ok,true);
 room.applyAugments(a.token,p);assert.equal(board(a).heroId,'builder');assert.equal(room.view(a.token).hp,40);
 command(room,a,'lobbyReady',{value:true});command(room,b,'lobbyReady',{value:true});
 const snapshot=room.checkpoint(),savedRoom=snapshot.rooms[0].room,match=core.duo.restore(savedRoom.match);
 for(const run of match.boards){
   const s=run.state;s.phase='build';s.gold=1000;
   s.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:2,buildingSlots:1,buildings:[{type:'market',level:3,paid:100}],towers:[
     {type:'archer',level:3,branch:'marksman',finalUpgrade:'eagleEye',paid:100},
     {type:'archer',level:3,branch:'volley',finalUpgrade:'arrowRain',paid:100}]});
 }
 savedRoom.match=core.duo.capture(match);room=createLobbies({now:()=>0,snapshot:JSON.parse(JSON.stringify(snapshot))});room.touch(a.token);room.touch(b.token);
 const slot={q:1,r:0,index:0},upgrade={slot,upgrade:'ultimate:archer'};
 assert.equal(command(room,a,'upgrade',upgrade).ok,true);assert.equal(command(room,b,'upgrade',upgrade).ok,false);
 assert.equal(command(room,a,'upgrade',{...upgrade,slot:{...slot,index:1}}).ok,false);
 assert.equal(command(room,a,'buildingUpgrade',{slot}).ok,true);assert.equal(command(room,b,'buildingUpgrade',{slot}).ok,false);
 const tile=board(a).map.find(t=>t.q===1&&t.r===0);assert.equal(tile.towers[0].level,4);assert.equal(tile.buildings[0].special,true);
 match.result={};match.phase='gameover';for(const i of [0,1])core.duo.command(match,i,{id:'again'+i,wave:0,action:'rematch',payload:{value:true}});
 assert.equal(match.boards[0].state.heroId,'builder');assert.deepEqual(Array.from(match.boards[0].state.ultimateUnlocks),['ultimate:archer:marksman']);
 assert.deepEqual(Array.from(match.boards[0].state.buildingUnlocks),['building:market']);assert.equal(match.hp,40);
});

test('guest Arsenal brings catalog unlocks and fortresses while account augments come only from the server',async t=>{
 const {room,a,b}=setup(),server=createTransport(room,{loadAugmentProfile:async()=>profile()});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>{server.closeAllConnections();return new Promise(resolve=>server.close(resolve));});
 const url='http://127.0.0.1:'+server.address().port+'/lobby/augments';
 const guest={hero:'merchant',difficulty:'dual',towers:core.profile.START_TOWERS,loadout:core.profile.START_TOWERS,
   unlocks:['ultimate:archer:marksman','building:market','building:unknown'],milestones:['standard35','dual35'],
   augmentCards:profile().augmentCards};
 async function sync(seat,headers={}){const r=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+seat.token,'X-Duo-Client':randomUUID(),...headers},body:JSON.stringify(guest)});assert.equal(r.status,200);return r.json();}
 const local=await sync(a);assert.deepEqual(local.cards,[]);assert.equal(local.heroId,'merchant');assert.equal(local.difficulty,'dual');
 assert.deepEqual(local.buildingUnlocks,['building:market']);assert.deepEqual(local.ultimateUnlocks,['ultimate:archer:marksman']);
 const account=await sync(b,{'X-Account-Token':'a'.repeat(64)});assert.equal(account.heroId,'standard');assert.equal(account.difficulty,'dual');
 assert.deepEqual(account.buildingUnlocks,[]);assert.deepEqual(account.ultimateUnlocks,[]);assert.deepEqual(account.cards,[{id:'archer',tier:0},{id:'chain',tier:1}]);
 assert.equal(room.view(b.token).hp,35);
});

test('an older waiting lobby keeps an already selected tower lineup on its first account sync',()=>{
 let {room,a,b}=setup();
 const towers=['flame','freeze','chain','catapult','archer'];
 assert.ok(command(room,a,'lobbyLoadout',{towers}).ok);
 const saved=room.checkpoint();delete saved.rooms[0].room.seats[0].loadoutChosen;
 room=createLobbies({snapshot:saved,now:()=>0});room.touch(a.token);room.touch(b.token);
 const account={...profile(),unlockedTowers:[...core.profile.START_TOWERS,'flame'],activeLoadout:core.profile.START_TOWERS};
 assert.deepEqual(room.applyAugments(a.token,account).loadout,towers);
});
