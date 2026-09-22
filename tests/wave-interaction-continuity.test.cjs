const {test}=require('node:test'),assert=require('node:assert/strict'),{load}=require('./helpers/game.cjs');
function setup(wave){const h=load();h.a.state.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[null]});h.a.state.phase='wave';h.a.state.waveRunning=true;h.a.state.wave=wave;h.a.state.pendingSpawns=0;h.a.state.enemies=[];h.selectSlot(1,0,0);return h;}
test('wave completion retains selected slot, multi-selection and the same purchase buttons',()=>{
 const {a,elements,buyTower}=setup(1),slot=a.state.selectedSlot,slots=a.state.selectedSlots,button=elements.get('towerMenu').children[0];
 a.endWave();assert.equal(a.state.selectedSlot,slot);assert.equal(a.state.selectedSlots,slots);assert.equal(elements.get('towerMenu').children[0],button);assert.equal(button.disabled,false);
 buyTower('archer');assert.equal(a.state.map.get('1,0').towers[0].type,'archer');
});
test('reward interactions retain building targeting, armed quick build and construction selection',()=>{
 const {a,elements,documentListeners}=setup(2),slot=a.state.selectedSlot;a.state.dragTower='archer';a.state.buildingTarget={q:1,r:0,index:0};const target=a.state.buildingTarget;
 a.endWave();assert.equal(a.state.phase,'reward');assert.equal(a.state.selectedSlot,slot);assert.equal(a.state.buildingTarget,target);assert.equal(a.state.dragTower,'archer');
 documentListeners.pointercancel();assert.equal(a.state.dragTower,'archer');
 const event={button:0,target:{closest(selector){return selector.includes('#rewardOverlay')?{}:null;}}};documentListeners.pointerdown(event);
 assert.equal(a.state.selectedSlot,slot);assert.equal(a.state.dragTower,'archer');
 elements.get('rewardChoices').children[0].listeners.click();assert.equal(a.state.phase,'place');assert.equal(a.state.selectedSlot,slot);assert.equal(a.state.buildingTarget,target);assert.equal(a.state.dragTower,'archer');
});
test('preparation shows explicit lock reasons for difficulty and both locked fortresses',()=>{
 const {elements}=load();elements.get('standardModeBtn').listeners.click();
 const difficulty=elements.get('difficultyChoices').children.find(b=>b.disabled);assert.match(difficulty.innerHTML,/unlockRequirement.*Stufe 1: Welle 35/);
 const heroes=elements.get('heroChoices').children.filter(b=>b.disabled);assert.equal(heroes.length,2);assert.match(heroes[0].innerHTML,/unlockRequirement.*Stufe 1: Welle 35/);assert.match(heroes[1].innerHTML,/unlockRequirement.*Stufe 2 · Zwei Fronten: Welle 35/);
});
