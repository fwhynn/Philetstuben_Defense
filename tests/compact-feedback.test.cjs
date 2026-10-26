const test=require('node:test'),assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs');
test('touch controls hide keyboard labels without changing narrow desktop controls',()=>{
 for(const touch of [true,false]){
  const {a,elements}=load({compact:{small:()=>true,touch:()=>touch,open(){}}});a.state.phase='build';a.renderAll();
  assert.equal(elements.get('startWaveBtn').textContent.includes('Leertaste'),!touch);
  assert.equal(elements.get('rotateHexBtn').textContent.includes('(R)'),!touch);
  a.state.phase='place';a.renderAll();assert.equal(elements.get('handHint').textContent.includes(' R'),!touch);
  a.state.openingRemaining=2;a.renderAll();assert.equal(elements.get('handHint').textContent.includes(' R'),!touch);
 }
});
test('compact tower tray closes only after a successful purchase',()=>{
 const opened=[],{a,selectSlot,buyTower,elements}=load({compact:{small:()=>true,open:name=>opened.push(name)}});
 a.state.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[null]});a.state.phase='build';
 selectSlot(1,0,0);a.state.gold=0;buyTower('archer');assert.equal(elements.get('towerDrawer').classList.contains('hidden'),false);
 a.state.gold=100;buyTower('archer');assert.ok(a.state.map.get('1,0').towers[0]);assert.equal(elements.get('towerDrawer').classList.contains('hidden'),true);assert.equal(opened.at(-1),'');
});
test('compact gold feedback lives outside the hidden HUD and expires even without animationend',()=>{
 const {a,elements,timers}=load({compact:{small:()=>true,open(){}}});a.renderAll();a.state.gold+=17;a.renderAll();
 const floats=elements.get('app').children.filter(c=>c.className==='goldFloat goldFloatCompact');assert.equal(floats.length,1);assert.equal(floats[0].textContent,'+17 🪙');
 let removed=false;floats[0].remove=()=>{removed=true;};for(const fn of [...timers.values()])fn();assert.equal(removed,true);
 a.renderAll();assert.equal(elements.get('app').children.filter(c=>c.className==='goldFloat goldFloatCompact').length,1);
});

test('disabled onboarding leaves no empty start message',()=>{
 const {a,elements}=load({initialStorage:{onboardingHints:'false','tutorial-v1':''}});a.newRun();
 assert.equal(elements.get('messageText').textContent,'');assert.equal(elements.get('message').classList.contains('show'),false);
});
test('arsenal is visible after the first lost run while introduction remains active',()=>{
 const {a,elements,storage}=load({initialStorage:{'tutorial-v1':''}});elements.get('openMainMenuBtn').listeners.click();assert.equal(elements.get('menuArsenalBtn').classList.contains('hidden'),true);
 a.state.hp=0;a.state.phase="wave";a.state.waveRunning=true;a.update(0,0);elements.get('openMainMenuBtn').listeners.click();
 assert.equal(elements.get('menuArsenalBtn').classList.contains('hidden'),false);assert.equal(elements.get('skipIntroductionBtn').classList.contains('hidden'),false);
 const reloaded=load({initialStorage:Object.fromEntries(storage)});reloaded.elements.get('openMainMenuBtn').listeners.click();assert.equal(reloaded.elements.get('menuArsenalBtn').classList.contains('hidden'),false);
});

test('first settled Duo run also exposes Arsenal without changing Solo records',()=>{
 const initialProfile={version:1,introduction:{version:1,bestWave:0,skipped:false,legacy:false},records:{runsPlayed:0,highestWave:0,bossesKilled:0},duoSettledRuns:['a'.repeat(64)]};
 const {elements}=load({initialProfile,initialStorage:{'tutorial-v1':''}});elements.get('openMainMenuBtn').listeners.click();
 assert.equal(elements.get('menuArsenalBtn').classList.contains('hidden'),false);
});

test('mobile Hilfen button opens and closes the consumable menu on successive taps',()=>{
 const {elements}=load({compact:{small:()=>true,open(){}}});const menu=elements.get('consumableMenu'),button=elements.get('compactConsumables');menu.open=false;
 button.listeners.click();assert.equal(menu.open,true);button.listeners.click();assert.equal(menu.open,false);
});
