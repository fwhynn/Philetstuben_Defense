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
 ui.elements.get('duoOwnMap').listeners.click();assert.equal(state.map.has(tile.q+','+tile.r),true);assert.equal(ui.elements.get('duoMapLabel').textContent,'Deine Festung');
 const gift=room.view(seat.token);gift.boards[0].phase='duoDelivery';gift.delivery={offers:[{id:'gift',index:null,choices:[{kind:'gold',amount:20}]},{index:null}]};duo.receive(gift);
 assert.equal(ui.elements.get('rewardTitle').textContent,'Geschenk für deinen Partner');ui.elements.get('rewardChoices').children[0].listeners.click();assert.equal(duo.calls.at(-1).action,'delivery');assert.equal(duo.calls.at(-1).payload.offerId,'gift');
});

test('Duo support can be selected button-first and quick map switch stays available',()=>{
 const duo={real:true,calls:[]},ui=load({duo}),room=createRoom({seed:'pick-support',loadouts:Array(2).fill(['archer','catapult','chain','freeze','mine'])}),seat=room.connect(0);room.connect(1);duo.receive(room.view(seat.token));
 const s=duo.api.getState();s.phase='build';s.map.set('1,0',{q:1,r:0,type:'straight',slots:2,towers:[{type:'archer',level:1,statId:1},null]});s.selectedSlot=s.selectedTower=null;
 ui.elements.get('duoReservePortal').listeners.click();ui.rendererCommands.selectSlot(1,0,1);assert.equal(duo.calls.at(-1).action,'portal');assert.equal(duo.calls.at(-1).payload.slot.index,1);
 ui.elements.get('duoSendTower').listeners.click();ui.rendererCommands.selectTower(1,0,0);assert.equal(duo.calls.at(-1).action,'reinforcement');
 assert.equal(ui.elements.get('duoQuickMap').classList.contains('hidden'),false);ui.elements.get('duoQuickMap').listeners.click();assert.equal(ui.elements.get('duoMapLabel').textContent,'Partnerkarte · Nur anschauen');
});
