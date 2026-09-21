const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {load}=require('./helpers/game.cjs');
function layout(){const context={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../classes/ui-layout.js'),'utf8')+';globalThis.rules=HexUiLayout;',context);return context.rules;}
test('oversized popups stay clear of controls across desktop and compact layouts',()=>{
  const rules=layout();for(const [width,height] of [[1440,900],[1000,620],[700,560],[390,700]]){
    const controls=[{top:14,bottom:90,width:width-32,height:76},{top:height-210,bottom:height-12,width:300,height:198},{top:height-95,bottom:height-16,width:230,height:79},{top:110,bottom:145,width:160,height:35}];
    const area=rules.safeArea(width,height,controls),panel=rules.fit(area,400,600,width-50,height-50);
    assert.ok(panel.x>=12);assert.ok(panel.x+panel.width<=width-12);assert.ok(panel.y>=area.top);assert.ok(panel.y+panel.height<=area.bottom);
    for(const r of controls)assert.ok(panel.y+panel.height<=r.top||panel.y>=r.bottom);
    assert.ok(panel.height<600);
  }
});
test('base buying is consistent during placement, building and waves and explains blocked states',()=>{
  const {a,elements}=load();
  for(const phase of ['place','build','wave']){a.newRun();a.state.phase=phase;a.state.gold=100;a.renderAll();assert.equal(elements.get('baseWallsBtn').disabled,false);elements.get('baseWallsBtn').listeners.click();assert.equal(a.state.maxHp,25);assert.equal(a.state.gold,65);}
  a.newRun();a.state.gold=0;a.renderAll();assert.equal(elements.get('baseWallsBtn').disabled,true);assert.match(elements.get('baseWallsBtn').textContent,/35 Gold nötig/);
  a.state.gold=100;a.state.phase='reward';a.renderAll();assert.match(elements.get('baseWallsBtn').textContent,/offene Belohnung/);
});
test('first-run tutorial follows real actions, suppresses auto-start and persists completion',()=>{
  const {a,elements,documentListeners,selectSlot,buyTower,storage,timers}=load({initialStorage:{'tutorial-v1':'new'}});
  assert.match(elements.get('tutorialTitle').textContent,/1\/5/);
  documentListeners.keydown({key:'r'});assert.match(elements.get('tutorialTitle').textContent,/2\/5/);
  a.state.hand=['straight'];a.state.selectedCard=0;a.state.rotation=0;elements.get('autoStart').checked=true;a.placeTile(1,0);
  assert.match(elements.get('tutorialTitle').textContent,/3\/5/);assert.equal(timers.size,0);assert.equal(a.state.waveRunning,false);
  selectSlot(1,0,0);assert.match(elements.get('tutorialTitle').textContent,/4\/5/);
  buyTower('archer');assert.match(elements.get('tutorialTitle').textContent,/5\/5/);
  a.startWave();assert.equal(storage.get('tutorial-v1'),'done');
});
test('tutorial skip/restart and slot visibility settings persist without resetting the run',()=>{
  const {a,elements,storage}=load({initialStorage:{'tutorial-v1':'new'}}),run=a.state;
  elements.get('skipTutorialBtn').listeners.click();assert.equal(storage.get('tutorial-v1'),'done');
  elements.get('restartTutorialBtn').listeners.click();assert.equal(a.state,run);assert.match(elements.get('tutorialTitle').textContent,/1\/5/);
  elements.get('slotHints').checked=false;elements.get('slotHints').listeners.change();assert.equal(a.state.showSlotHints,false);assert.equal(storage.get('slotHints'),'false');a.newRun();assert.equal(a.state.showSlotHints,false);
});
