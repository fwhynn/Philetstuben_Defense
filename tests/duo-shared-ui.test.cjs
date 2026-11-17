const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs'),{createRoom}=require('../server/duo-room.cjs'),{presentation}=require('../duo-client.js');
test('Duo boots the real singleplayer interface and forwards actions without running the local simulation',()=>{
 const calls=[],bridge={render(){},send(action,payload){calls.push({action,payload});},ready(){calls.push({action:'ready'});},pause(){},priorities(){},offerKey:null};
 const ui=load({duo:bridge}),room=createRoom({seed:'shared-screen',loadouts:Array(2).fill(['archer','catapult','chain','freeze','mine'])}),seat=room.connect(0);room.connect(1);
 const state=presentation(room.view(seat.token)).boards[0].state;Object.assign(state,{runTowerStats:{},runTowerDetails:{},drawPile:[],discard:[],goldEarned:{kills:0,completion:0,income:0}});
 bridge.api.accept(state,true);assert.equal(ui.elements.get('mainMenu').classList.contains('hidden'),true);assert.equal(ui.elements.get('hand').children.length,3);assert.equal(ui.elements.get('hp').textContent,'40/40');assert.equal(ui.elements.get('towerMenu').children.length,5);
 const current=bridge.api.getState();current.selectedSlot={q:1,r:0,index:0};current.selectedSlots=[current.selectedSlot];ui.elements.get('towerMenu').children[0].listeners.click();assert.equal(current.gold,70);assert.equal(calls.at(-1).action,'tower');
 ui.elements.get('baseWallsBtn').listeners.click();assert.equal(calls.at(-1).action,'baseUpgrade');assert.equal(current.gold,70);
 ui.elements.get('startWaveBtn').listeners.click();assert.equal(calls.at(-1).action,'ready');assert.equal(current.wave,0);
});
test('remote snapshots preserve tower identity for open menus and range previews',()=>{
 const {mergeBoard}=require('../classes/duo-game.js'),tower={type:'archer',statId:1,level:1},old={map:new Map([['1,0',{towers:[tower],buildings:[]}]])},next={map:new Map([['1,0',{towers:[{type:'archer',statId:1,level:2}],buildings:[]}]])};
 mergeBoard(old,next);assert.equal(next.map.get('1,0').towers[0],tower);assert.equal(tower.level,2);
});
test('real Duo adapter keeps selections across snapshots and makes the partner map read-only',async()=>{
 const duo={real:true,calls:[]},ui=load({duo}),room=createRoom({seed:'adapter',loadouts:Array(2).fill(['archer','catapult','chain','freeze','mine'])}),seat=room.connect(0);room.connect(1);
 const v=room.view(seat.token);let placement;v.boards[0].placements.some((rotations,index)=>rotations.some((cells,rotation)=>{const cell=cells.find(c=>c.legal);if(cell)placement={q:cell.q,r:cell.r,index,rotation};return !!cell;}));
 room.receive(seat.token,{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[0].phase,action:'place',payload:placement});
 const refresh=()=>duo.receive(room.view(seat.token));refresh();
 assert.ok(Object.keys(duo.api.getState().visibleBiomes).length>duo.api.getState().map.size,'visible neighbouring terrain is included without exposing the map seed');
 const state=duo.api.getState(),tile=[...state.map.values()].find(t=>t.slots>0),slot={q:tile.q,r:tile.r,index:0};state.selectedSlot=slot;state.selectedSlots=[slot];state.selectedCard=1;state.rotation=2;
 refresh();assert.equal(state.selectedSlot,slot);assert.equal(state.selectedCard,1);assert.equal(state.rotation,2);
 ui.elements.get('duoReservePortal').listeners.click();assert.equal(duo.calls.at(-1).action,'portal');
 state.buildingTarget=slot;ui.elements.get('duoPartnerMap').listeners.click();assert.equal(state.buildingTarget,null);assert.equal(state.selectedSlot,null);assert.equal(ui.elements.get('startWaveBtn').disabled,true);
 const count=duo.calls.length;await duo.bridge.send('baseUpgrade',{kind:'walls'});assert.equal(duo.calls.length,count);
 ui.elements.get('duoOwnMap').listeners.click();assert.equal(state.map.has(tile.q+','+tile.r),true);assert.equal(ui.elements.get('duoMapLabel').textContent,'Deine Karte');
 const gift=room.view(seat.token);gift.boards[0].phase='duoDelivery';gift.delivery={offers:[{id:'gift',index:null,choices:[{kind:'gold',amount:20}]},{index:null}]};duo.receive(gift);
 assert.equal(ui.elements.get('rewardTitle').textContent,'Geschenk für deinen Partner');ui.elements.get('rewardChoices').children[0].listeners.click();assert.equal(duo.calls.at(-1).action,'delivery');assert.equal(duo.calls.at(-1).payload.offerId,'gift');
});

test('Duo support can be selected button-first and quick map switch stays available',()=>{
 const duo={real:true,calls:[]},ui=load({duo}),room=createRoom({seed:'pick-support',loadouts:Array(2).fill(['archer','catapult','chain','freeze','mine'])}),seat=room.connect(0);room.connect(1);duo.receive(room.view(seat.token));
 const s=duo.api.getState();s.phase='build';s.map.set('1,0',{q:1,r:0,type:'straight',slots:2,towers:[{type:'archer',level:1,statId:1},null]});s.selectedSlot=s.selectedTower=null;
 ui.elements.get('duoReservePortal').listeners.click();ui.rendererCommands.selectSlot(1,0,1);assert.equal(duo.calls.at(-1).action,'portal');assert.equal(duo.calls.at(-1).payload.slot.index,1);
 ui.elements.get('duoSendTower').listeners.click();ui.rendererCommands.selectTower(1,0,0);assert.equal(duo.calls.at(-1).action,'reinforcement');
 assert.equal(ui.elements.get('duoQuickMap').classList.contains('hidden'),false);ui.elements.get('duoQuickMap').listeners.click();assert.equal(ui.elements.get('duoMapLabel').textContent,'Partnerkarte');
});

test('partner gifts are inspectable without acting for the partner and received gifts remain visible',()=>{
 const duo={real:true,calls:[]},ui=load({duo}),room=createRoom({seed:'gift-preview',loadouts:Array(2).fill(['archer','catapult','chain','freeze','mine'])}),seat=room.connect(0);room.connect(1);
 const view=room.view(seat.token);view.boards[0].phase='duoDelivery';view.delivery={wave:5,offers:[{id:'own',index:null,choices:[{kind:'gold',amount:50}]},{index:null,choices:[{kind:'gold',amount:50},{kind:'card',cardId:'smallCurve'},{kind:'card',cardId:'bigCurve'}]}]};duo.receive(view);
 const preview=ui.elements.get('duoGiftPreview');assert.equal(preview.classList.contains('hidden'),false);assert.equal(preview.children[2].children.length,3);assert.equal(preview.children[2].children[1].children[1].textContent,'Kleine Kurve');
 const first=preview.children[2];view.revision++;duo.receive(JSON.parse(JSON.stringify(view)));assert.equal(preview.children[2],first,'unchanged snapshots do not replace gift cards');
 view.delivery.offers[1].index=1;view.revision++;duo.receive(view);assert.match(ui.elements.get('duoGiftReceived').textContent,/Kleine Kurve/);assert.equal(ui.elements.get('duoGiftReceived').classList.contains('hidden'),false);
 view.boards[0].phase='place';view.delivery.offers[0].index=0;view.revision++;duo.receive(view);assert.equal(preview.classList.contains('hidden'),true);assert.match(ui.elements.get('duoGiftHistory').children.at(-1).textContent,/50 Gold/);assert.equal(duo.calls.length,0);
});

test('automatic readiness follows the local build transition once and leaves manual withdrawal available',()=>{
 const duo={real:true,calls:[]},ui=load({duo});
 const room=createRoom({seed:'auto-ready',loadouts:Array(2).fill(['archer','catapult','chain','freeze','mine'])});
 const a=room.connect(0);room.connect(1);
 const view=room.view(a.token);duo.receive(view);
 const autoStart=ui.elements.get('autoStart');assert.equal(!!autoStart.disabled,false);autoStart.checked=true;
 function show(phase,options={}){
   const next=structuredClone(view);next.revision++;
   Object.assign(next.boards[0],{phase,openingRemaining:0},options);duo.receive(next);
 }
 show('build',{openingRemaining:1});assert.equal(duo.calls.length,0);
 show('build');assert.equal(duo.calls.length,1);assert.equal(duo.calls[0].action,'ready');assert.equal(duo.calls[0].payload.value,true);
 show('build');assert.equal(duo.calls.length,1);
 autoStart.checked=false;show('place');show('build');assert.equal(duo.calls.length,1);
});

test('Duo speed hotkey uses shared speed, queues rapid presses and disconnect dims the game',async()=>{
 const duo={real:true,calls:[]},ui=load({duo}),room=createRoom({seed:'shared-speed',loadouts:Array(2).fill(['archer','catapult','chain','freeze','mine'])}),a=room.connect(0);room.connect(1);const v=room.view(a.token);v.speed=5;duo.receive(v);
 const key=()=>ui.documentListeners.keydown({key:'f',target:{tagName:'BUTTON'},preventDefault(){}});key();key();key();assert.deepEqual(duo.calls.map(c=>c.payload.value),[6,7,8]);await new Promise(r=>setImmediate(r));v.speed=8;duo.receive(v);key();assert.equal(duo.calls.at(-1).payload.value,1);
 v.connection.paused=true;duo.receive(v);assert.ok(ui.elements.get('app').classList.contains('duoDisconnected'));assert.match(ui.elements.get('app').dataset.pauseMessage,/Warte auf Partner/);
 v.connection.paused=false;duo.receive(v);assert.equal(ui.elements.get('app').classList.contains('paused'),false);duo.status('offline',{offline:true});assert.ok(ui.elements.get('app').classList.contains('paused'));duo.status('Verbunden',{});assert.equal(ui.elements.get('app').classList.contains('paused'),false);
});

test('partner deck and hand are visible and a changed hand refreshes without revealing draw order',()=>{
 const duo={real:true,calls:[]},ui=load({duo}),room=createRoom({seed:'partner-hand',loadouts:Array(2).fill(['archer','catapult','chain','freeze','mine'])}),seat=room.connect(0);room.connect(1);const v=room.view(seat.token);duo.receive(v);ui.elements.get('duoPartnerMap').listeners.click();
 ui.elements.get('deckDropdown').open=true;ui.elements.get('deckDropdown').listeners.toggle();const sections=()=>ui.elements.get('deckOverview').children;assert.equal(sections().length,2);assert.match(sections()[0].children[0].textContent,/Deck deines Partners/);assert.match(sections()[1].children[0].textContent,/Hand deines Partners/);
 v.revision++;v.boards[1].hand=['straight'];duo.receive(v);assert.equal(sections()[1].children[0].textContent,'Hand deines Partners (1)');assert.equal(v.boards[1].drawPile,undefined);
});

test('gift wishes are clickable, visible to the sender and remain available after sending',()=>{
 const duo={real:true,calls:[]},ui=load({duo}),room=createRoom({seed:'wish-ui',loadouts:Array(2).fill(['archer','catapult','chain','freeze','mine'])}),seat=room.connect(0);room.connect(1);
 const v=room.view(seat.token);v.boards[0].phase='duoDelivery';v.delivery={wave:5,offers:[{id:'own',index:null,wish:1,choices:[{kind:'gold',amount:50},{kind:'card',cardId:'smallCurve'}]},{id:'partner',index:null,choices:[{kind:'gold',amount:50},{kind:'card',cardId:'smallCurve'}]}]};duo.receive(v);
 assert.ok(ui.elements.get('rewardChoices').children[1].classList.contains('duoGiftWished'));
 const preview=ui.elements.get('duoGiftPreview'),cards=()=>preview.children[2].children;cards()[1].listeners.click();assert.equal(duo.calls.at(-1).action,'deliveryWish');assert.equal(duo.calls.at(-1).payload.offerId,'partner');assert.equal(duo.calls.at(-1).payload.index,1);
 v.delivery.offers[1].wish=1;v.revision++;duo.receive(v);assert.equal(cards()[1].attributes['aria-pressed'],'true');cards()[1].listeners.click();assert.equal(duo.calls.at(-1).payload.index,null);
 v.delivery.offers[0].index=0;v.revision++;duo.receive(v);assert.equal(ui.elements.get('rewardTitle').textContent,'Geschenk verschickt');assert.equal(preview.classList.contains('hidden'),false);assert.ok(ui.elements.get('rewardChoices').children.every(b=>b.disabled));assert.equal(cards()[1].disabled,false);
 v.delivery.offers[1].index=1;v.revision++;duo.receive(v);assert.ok(cards().every(b=>b.disabled));assert.equal(ui.elements.get('duoGiftNotice').classList.contains('hidden'),false);assert.match(ui.elements.get('duoGiftNoticeContent').children[0].children[1].children[0].textContent,/Kleine Kurve/);
 ui.elements.get('duoGiftNoticeClose').listeners.click();duo.receive(v);assert.equal(ui.elements.get('duoGiftNotice').classList.contains('hidden'),true,'snapshots do not replay dismissed receipts');
});

test('gift notifications show new paid gifts on either map without replaying old receipts on reconnect',()=>{
 const duo={real:true,calls:[]},ui=load({duo}),room=createRoom({seed:'receipt-ui',loadouts:Array(2).fill(['archer','catapult','chain','freeze','mine'])}),seat=room.connect(0);room.connect(1);
 const v=room.view(seat.token);v.hexGifts=[null,{count:1,wave:0,cardId:'straight'}];duo.receive(v);assert.equal(ui.document.getElementById('duoGiftNoticeContent').children.length,0,'initial snapshot is history');
 ui.elements.get('duoPartnerMap').listeners.click();v.hexGifts[1]={count:2,wave:1,cardId:'bigCurve'};v.revision++;duo.receive(v);assert.equal(ui.elements.get('duoGiftNotice').classList.contains('hidden'),false);
 const content=ui.elements.get('duoGiftNoticeContent').children[0];duo.receive(v);assert.equal(ui.elements.get('duoGiftNoticeContent').children[0],content);
 const timer=[...ui.timers.entries()].find(([,f])=>String(f).includes("notice.classList.add('hidden')"));assert.ok(timer);timer[1]();assert.equal(ui.elements.get('duoGiftNotice').classList.contains('hidden'),true);
});

test('the edge bar reuses wave planning, shows the actual partner name and keeps the shared wave while waiting',()=>{
 const duo={real:true,calls:[]},ui=load({duo}),room=createRoom({seed:'edge-bar',loadouts:Array(2).fill(['archer','catapult','chain','freeze','mine'])}),seat=room.connect(0);room.connect(1);
 const wave=ui.elements.get('waveDropdown');assert.ok(ui.elements.get('duoPhaseSlot').children.includes(wave));assert.ok(ui.elements.get('duoSupportMenu').children.includes(ui.elements.get('duoHud')));
 wave.open=true;const v=room.view(seat.token);v.lobbyState.names=['Phil','Ein sehr langer Partnername'];v.phase='combat';v.wave=24;v.hp=32;
 for(const [i,b] of v.boards.entries()){b.wave=24;b.phase=i?'wave':'duoWait';b.waveRunning=!!i;if(b.wavePlans)b.wavePlans=b.wavePlans.map((p,n)=>({...p,wave:24+n}));}
 duo.receive(v);assert.equal(wave.open,true,'moving the control retains its state');assert.equal(ui.elements.get('duoPartnerName').textContent,'Ein sehr langer Partnername');assert.match(ui.elements.get('duoSeatPartner').title,/Ein sehr langer Partnername/);assert.equal(ui.elements.get('duoTeamHp').textContent,'32/40');
 assert.equal(ui.elements.get('wave').textContent,24);assert.equal(ui.elements.get('phaseName').textContent,'Welle läuft');assert.match(ui.elements.get('waveHeadline').textContent,/Welle 24/);
 ui.elements.get('duoQuickMap').listeners.click();assert.equal(ui.elements.get('duoMapLabel').textContent,'Partnerkarte');assert.match(ui.elements.get('duoMapLabel').title,/Nur anschauen/);assert.equal(ui.elements.get('duoQuickMap').textContent,'Meine Karte');assert.equal(ui.elements.get('wave').textContent,24);
 ui.elements.get('duoQuickMap').listeners.click();v.phase='prepare';v.boards[0].phase='build';v.boards[1].phase='build';v.boards[1].waveRunning=false;v.revision++;duo.receive(v);assert.equal(ui.elements.get('wave').textContent,25);assert.match(ui.elements.get('waveHeadline').textContent,/Welle 25/);
});
