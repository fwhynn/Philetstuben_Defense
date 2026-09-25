const {test}=require('node:test'),assert=require('node:assert/strict'),{load}=require('./helpers/game.cjs');
test('touch rotation needs a selected card and matches R in six steps',()=>{
 const {a,elements,documentListeners}=load();const button=elements.get('rotateHexBtn');assert.equal(button.disabled,true);
 const rotation=a.state.rotation;button.listeners.click();assert.equal(a.state.rotation,rotation);
 a.state.selectedCard=0;a.renderAll();assert.equal(button.disabled,false);
 button.listeners.click();assert.equal(a.state.rotation,(rotation+1)%6);
 documentListeners.keydown({key:'r',preventDefault(){}});assert.equal(a.state.rotation,(rotation+2)%6);
 for(let n=0;n<4;n++)button.listeners.click();assert.equal(a.state.rotation,rotation);
});
test('tower buying and upgrading before placement preserve hand and block wave start',()=>{
 const {a,elements,selectSlot,buyTower,upgradeSelectedTower}=load();a.state.gold=200;
 const tile={q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[null]};a.state.map.set('1,0',tile);const hand=[...a.state.hand];
 selectSlot(1,0,0);buyTower('archer');a.state.selectedTower={q:1,r:0,index:0};upgradeSelectedTower('volley');
 assert.equal(tile.towers[0].branch,'volley');assert.equal(a.state.gold,140);assert.equal(a.state.phase,'place');assert.deepEqual([...a.state.hand],hand);
 a.renderAll();assert.equal(elements.get('startWaveBtn').disabled,true);assert.match(elements.get('startWaveBtn').textContent,/Hex legen/);a.startWave();assert.equal(a.state.waveRunning,false);assert.match(elements.get('messageText').textContent,/zuerst dein Hex/);
});
test('post-wave eleven guidance leads to hotkeys and is dismissed when they are opened',()=>{
 const {a,elements,documentListeners}=load();elements.get('mainMenu').classList.add('hidden');elements.get('settingsDrawer').classList.add('hidden');
 a.state.wave=9;a.renderAll();assert.equal(elements.get('hotkeyTip').classList.contains('hidden'),true);
 a.state.wave=10;a.state.phase='wave';a.state.waveRunning=true;a.renderAll();assert.equal(elements.get('hotkeyTip').classList.contains('hidden'),true);
 a.state.lastCompletedWave=10;a.state.waveRunning=false;a.state.phase='reward';a.renderAll();assert.equal(elements.get('hotkeyTip').classList.contains('hidden'),true);
 a.state.phase='place';a.state.celebrationActive=true;a.renderAll();assert.equal(elements.get('hotkeyTip').classList.contains('hidden'),true);
 a.state.celebrationActive=false;a.renderAll();assert.equal(elements.get('hotkeyTip').classList.contains('hidden'),true);
 a.state.wave=11;a.state.lastCompletedWave=11;a.renderAll();assert.equal(elements.get('hotkeyTip').classList.contains('hidden'),false);assert.equal(elements.get('settingsOpenBtn').classList.contains('hotkeyGuide'),true);
 elements.get('hotkeyTipOpen').listeners.click();assert.equal(elements.get('settingsDrawer').classList.contains('hidden'),false);assert.equal(elements.get('hotkeyHelpSummary').classList.contains('hotkeyGuide'),true);
 documentListeners.click({target:{closest:()=>null}});assert.equal(elements.get('hotkeyTip').classList.contains('hidden'),true);assert.ok(!a.state.hotkeyHintDone);
 a.state.wave=12;a.state.phase='wave';a.state.waveRunning=true;a.renderAll();assert.equal(elements.get('hotkeyTip').classList.contains('hidden'),true);assert.equal(elements.get('hotkeyHelpSummary').classList.contains('hotkeyGuide'),true);
 a.state.wave=11;a.state.phase='place';a.state.waveRunning=false;elements.get('hotkeyHelp').open=true;elements.get('hotkeyHelp').listeners.toggle();assert.equal(a.state.hotkeyHintDone,true);assert.equal(elements.get('hotkeyHelpSummary').classList.contains('hotkeyGuide'),false);
});
test('Escape opens settings only without an existing selection',()=>{
 const {a,elements,documentListeners,document}=load();elements.get('arsenalOverlay').classList.add('hidden');elements.get('mainMenu').classList.add('hidden');elements.get('settingsDrawer').classList.add('hidden');document.querySelectorAll=selector=>selector==='.drawer'?[elements.get('settingsDrawer')]:[];
 document.querySelector=selector=>selector.includes('.drawer:not')&&!elements.get('settingsDrawer').classList.contains('hidden')?elements.get('settingsDrawer'):null;
 documentListeners.keydown({key:'Escape',preventDefault(){}});assert.equal(elements.get('settingsDrawer').classList.contains('hidden'),false);
 documentListeners.keydown({key:'Escape',preventDefault(){}});assert.equal(elements.get('settingsDrawer').classList.contains('hidden'),true);
 a.state.selectedTower={q:0,r:0,index:0};documentListeners.keydown({key:'Escape',preventDefault(){}});assert.equal(a.state.selectedTower,null);assert.equal(elements.get('settingsDrawer').classList.contains('hidden'),true);
});
test('wave HUD shows upcoming wave in preparation and current wave in combat',()=>{
 const {a,elements}=load();a.state.wave=11;a.state.lastCompletedWave=11;a.state.phase='place';a.state.waveRunning=false;a.renderAll();assert.equal(Number(elements.get('wave').textContent),12);assert.match(elements.get('waveForecast').textContent,/Wave 12:/);
 a.state.wave=12;a.state.phase='wave';a.state.waveRunning=true;a.renderAll();assert.equal(Number(elements.get('wave').textContent),12);
});
test('selected construction slots use singular only for exactly one slot',()=>{
 const {a,elements,selectSlot}=load();a.state.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:2,towers:[null,null]});
 selectSlot(1,0,0);assert.match(elements.get('towerSelectionHint').textContent,/^1 Bauplatz gewählt/);
 selectSlot(1,0,1,true);assert.match(elements.get('towerSelectionHint').textContent,/^2 Bauplätze gewählt/);
});
