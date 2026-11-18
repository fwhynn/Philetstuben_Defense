const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs'),{createRoom}=require('../server/duo-room.cjs');
function setup(options={}){
 const duo={real:true,calls:[]},ui=load({duo,...options}),room=createRoom({seed:'wait-ui',loadouts:Array(2).fill(['archer','catapult','chain','freeze','mine'])}),seat=room.connect(0);room.connect(1);
 const view=room.view(seat.token);duo.receive(structuredClone(view));return {duo,ui,view};
}
test('Duo keeps animating an already finished board until the last effect expires',()=>{
 let clock=1000;const {duo,view}=setup({now:()=>clock});
 const publish=(time,phase,ttl)=>{clock=time;view.frameTime=time;view.revision++;view.phase='combat';view.wave=1;const b=view.boards[0];b.wave=1;b.phase=phase;b.elapsedMs=time-1000;b.projectiles=ttl?[{kind:'blast',x:0,y:0,r:10,ttl,max:.4}]:[];view.boards[1].phase='wave';duo.receive(structuredClone(view));};
 publish(1100,'wave',.4);publish(1200,'duoWait',.3);publish(1300,'duoWait',.2);
 assert.equal(duo.api.getState().waveRunning,false);
 clock=1350;duo.bridge.animate(clock);assert.ok(duo.api.getState().projectiles.length);const ttl=duo.api.getState().projectiles[0].ttl;
 clock=1400;assert.ok(duo.bridge.animate(clock));assert.ok(duo.api.getState().projectiles[0].ttl<ttl);
 publish(1500,'duoWait',0);clock=1700;duo.bridge.animate(clock);assert.equal(duo.api.getState().projectiles.length,0);assert.equal(view.boards[1].phase,'wave');
});
test('building a tower opens that tower directly; failed purchases leave selection usable',()=>{
 const ui=load(),s=ui.a.state,slot={q:1,r:0,index:0};s.phase='build';s.gold=0;s.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[null]});
 ui.selectSlot(1,0,0);ui.buyTower('archer');assert.equal(s.selectedSlot.index,0);assert.equal(s.map.get('1,0').towers[0],null);
 s.gold=200;ui.buyTower('archer');assert.equal(s.selectedSlot,null);assert.deepEqual(JSON.parse(JSON.stringify(s.selectedTower)),slot);assert.ok(ui.elements.get('towerDrawer').classList.contains('hidden'));assert.equal(ui.elements.get('towerPanel').classList.contains('hidden'),false);
 ui.upgradeSelectedTower('marksman');assert.equal(s.map.get('1,0').towers[0].level,2);
});
test('confirmed Duo builds open the new tower while finished-wave upgrades stay enabled',()=>{
 const {duo,ui,view}=setup(),slot={q:1,r:0,index:0},b=view.boards[0];
 b.phase='duoWait';b.gold=122;view.phase='combat';view.boards[1].phase='wave';b.map.push({q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[{type:'freeze',level:3,branch:'deepFrost',finalUpgrade:'absoluteZero',paid:125,statId:1}]});b.ultimateUnlocks=['ultimate:freeze:deepFrost'];view.revision++;
 duo.receive(view);duo.api.commandAccepted('tower',{slots:[slot]});
 assert.deepEqual(JSON.parse(JSON.stringify(duo.api.getState().selectedTower)),slot);
 assert.equal(ui.elements.get('towerDrawer').classList.contains('hidden'),true);
 const candidates=ui.elements.get('towerUpgrades').children;const find=(items)=>items.flatMap(n=>[n,...find(n.children||[])]);const buy=find(candidates).find(n=>n._baseCost===95);
 assert.ok(buy);assert.equal(buy.disabled,false);buy.listeners.click();assert.equal(duo.calls.at(-1).action,'upgrade');assert.equal(duo.calls.at(-1).payload.upgrade,'ultimate:freeze');assert.equal(ui.elements.get('startWaveBtn').disabled,true);
});
test('victory emphasizes endless, keeps consent reversible and returns to ordinary rewards afterwards',()=>{
 const {duo,ui,view}=setup();view.wave=35;view.result={id:'result',outcome:'victory',wave:35,players:[{diamonds:32},{diamonds:32}]};view.phase='victory';view.endlessVotes=[false,false];for(const b of view.boards){b.wave=35;b.phase='victory';}view.revision++;duo.receive(view);
 const actions=()=>ui.elements.get('rewardChoices').children.filter(n=>n.className?.includes('duoResultAction'));
 assert.equal(actions()[0].textContent,'Endlos weiterspielen');assert.match(actions()[0].className,/primary/);actions()[0].listeners.click();assert.deepEqual(JSON.parse(JSON.stringify(duo.calls.at(-1))),{action:'endless',payload:{value:true}});
 view.endlessVotes=[true,false];view.revision++;duo.receive(view);assert.match(ui.elements.get('rewardDescription').textContent,/Warte auf deinen Partner/);actions()[0].listeners.click();assert.equal(duo.calls.at(-1).payload.value,false);
 duo.api.reward(null);assert.equal(ui.elements.get('rewardOverlay').classList.contains('duoResult'),false);
});
test('the simplified team menu has no dependency on removed controls and leaving stays in settings',()=>{
 const removed=['duoOwnMap','duoPartnerMap','duoTurnTitle','duoTurnText','duoPartnerStatus','duoGifts','duoGiftHistory','duoGiftReceived','towerBudget'];
 const {ui}=setup({missingIds:removed});assert.equal(ui.elements.get('duoLeave').classList.contains('hidden'),false);
 ui.elements.get('duoSupportShortcut').listeners.click();assert.equal(ui.elements.get('duoHud').open,true);
 ui.documentListeners.keydown({key:'Escape',preventDefault(){}});assert.equal(ui.elements.get('duoHud').open,false);
});
