const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { load } = require('./helpers/game.cjs');
function layout() { const context = {}; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../classes/ui-layout.js'), 'utf8') + ';globalThis.rules=HexUiLayout;', context); return context.rules; }
test('oversized popups stay clear of controls across desktop and compact layouts', () => {
  const rules = layout(); for (const [width, height] of [[1440, 900], [1000, 620], [700, 560], [390, 700]]) {
    const controls = [{ top: 14, bottom: 90, width: width - 32, height: 76 }, { top: height - 210, bottom: height - 12, width: 300, height: 198 }, { top: height - 95, bottom: height - 16, width: 230, height: 79 }, { top: 110, bottom: 145, width: 160, height: 35 }];
    const area = rules.safeArea(width, height, controls), panel = rules.fit(area, 400, 600, width - 50, height - 50);
    assert.ok(panel.x >= 12); assert.ok(panel.x + panel.width <= width - 12); assert.ok(panel.y >= area.top); assert.ok(panel.y + panel.height <= area.bottom);
    for (const r of controls) assert.ok(panel.y + panel.height <= r.top || panel.y >= r.bottom);
    assert.ok(panel.height < 600);
  }
});
test('base buying is consistent during placement, building and waves and explains blocked states', () => {
  const { a, elements } = load();
  for (const phase of ['place', 'build', 'wave']) { a.newRun(); a.state.phase = phase; a.state.gold = 100; a.renderAll(); assert.equal(elements.get('baseWallsBtn').disabled, false); elements.get('baseWallsBtn').listeners.click(); assert.equal(a.state.maxHp, 25); assert.equal(a.state.gold, 65); }
  a.newRun(); a.state.gold = 0; a.renderAll(); assert.equal(elements.get('baseWallsBtn').disabled, true); assert.match(elements.get('baseWallsBtn').textContent, /35 Gold nötig/);
  a.state.gold = 100; a.state.phase = 'reward'; a.renderAll(); assert.match(elements.get('baseWallsBtn').textContent, /offene Belohnung/);
});
test('first-run tutorial follows real actions, suppresses auto-start and persists completion', () => {
  const { a, elements, documentListeners, selectSlot, buyTower, upgradeSelectedTower, storage, timers } = load({ initialStorage: { 'tutorial-v1': 'new' } });
  assert.match(elements.get('tutorialTitle').textContent, /1\/7/);
  a.state.selectedCard=0;documentListeners.keydown({ key: 'r' }); assert.match(elements.get('tutorialTitle').textContent, /2\/7/);
  a.state.hand = ['straight']; a.state.selectedCard = 0; a.state.rotation = 0; elements.get('autoStart').checked = true; a.placeTile(1, 0);
  assert.match(elements.get('tutorialTitle').textContent, /3\/7/); assert.equal(timers.size, 0); assert.equal(a.state.waveRunning, false);
  selectSlot(1, 0, 0); assert.match(elements.get('tutorialTitle').textContent, /4\/7/);
  buyTower('archer'); assert.match(elements.get('tutorialTitle').textContent, /5\/7/); assert.equal(elements.get('towerDrawer').classList.contains('hidden'),true);
  a.rendererCommands.selectTower(1,0,0);upgradeSelectedTower('marksman');assert.match(elements.get('tutorialTitle').textContent,/6\/7/);assert.equal(a.state.selectedTower,null);assert.equal(elements.get('towerPanel').classList.contains('hidden'),true);
  elements.get('tutorialNextBtn').listeners.click();assert.match(elements.get('tutorialTitle').textContent,/7\/7/);
  a.startWave(); assert.equal(storage.get('tutorial-v1'), 'done');
});
test('tutorial skip/restart and slot visibility settings persist without resetting the run', () => {
  const { a, elements, storage } = load({ initialStorage: { 'tutorial-v1': 'new' } }), run = a.state;
  elements.get('skipTutorialBtn').listeners.click(); assert.equal(storage.get('tutorial-v1'), 'done');
  elements.get('restartTutorialBtn').listeners.click(); assert.equal(a.state, run); assert.match(elements.get('tutorialTitle').textContent, /1\/7/);
  elements.get('slotHints').checked = false; elements.get('slotHints').listeners.change(); assert.equal(a.state.showSlotHints, false); assert.equal(storage.get('slotHints'), 'false'); a.newRun(); assert.equal(a.state.showSlotHints, false);
});

test('drag hit areas match displayed screen circles and choose the nearest slot at all zooms', () => {
  const rules = layout();
  for (const scale of [.2, .73, 1, 2, 4]) {
    const slots = [{ q: 1, r: 0, index: 0, x: 150 * scale, y: 100 * scale }, { q: 1, r: 0, index: 1, x: 200 * scale, y: 100 * scale }];
    const first = slots[0], last = slots[1]; assert.equal(rules.pickScreenSlot(slots, first.x, first.y, 1200, 800).index, 0); assert.equal(rules.pickScreenSlot(slots, last.x, last.y, 1200, 800).index, 1);
    assert.equal(rules.pickScreenSlot([first], first.x, first.y + rules.dropRadius, 1200, 800).index, 0); assert.equal(rules.pickScreenSlot([first], first.x, first.y + rules.dropRadius + .1, 1200, 800), null);
  }
  assert.equal(rules.pickScreenSlot([{ q: 0, r: 0, index: 0, x: 0, y: 0 }], -1, 0, 1200, 800), null); assert.equal(rules.pickScreenSlot([], 100, 100, 1200, 800), null);
});

test('invalid placement remains visible below the active tutorial and clears after valid placement',()=>{
 const {a,elements}=load({initialStorage:{'tutorial-v1':'new'}});a.state.hand=['straight'];a.state.selectedCard=0;a.state.rotation=1;a.placeTile(1,0);assert.equal(elements.get('tutorialPanel').classList.contains('hidden'),false);assert.equal(elements.get('tutorialFeedback').classList.contains('hidden'),false);assert.match(elements.get('tutorialFeedback').textContent,/Nicht erlaubt/);
 a.state.rotation=0;a.placeTile(1,0);assert.equal(elements.get('tutorialFeedback').classList.contains('hidden'),true);
});

test('life and wave tutorial steps position the spotlight using current target bounds',()=>{
 const {a,elements,document,selectSlot,buyTower,upgradeSelectedTower}=load({initialStorage:{'tutorial-v1':'new'}});document.getElementById('healthStat');a.state.phase='build';a.state.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[null]});selectSlot(1,0,0);buyTower('archer');
 elements.get('healthStat').getBoundingClientRect=()=>({left:900,top:20,width:100,height:44});elements.get('startWaveBtn').getBoundingClientRect=()=>({left:1000,top:700,width:200,height:50});a.rendererCommands.selectTower(1,0,0);upgradeSelectedTower('marksman');assert.equal(elements.get('tutorialSpotlight').style.left,'896px');assert.equal(elements.get('tutorialSpotlight').classList.contains('hidden'),false);
 elements.get('tutorialNextBtn').listeners.click();assert.equal(elements.get('tutorialSpotlight').style.top,'696px');a.startWave();a.renderAll();assert.equal(elements.get('tutorialSpotlight').classList.contains('hidden'),true);
});

test('main menu account button opens the account dialog; back and Escape close it',()=>{
 const {elements,documentListeners}=load();elements.get('openMainMenuBtn').listeners.click();const menu=elements.get('mainMenu'),account=elements.get('accountOverlay');
 elements.get('menuAccountBtn').listeners.click();assert.equal(account.classList.contains('hidden'),false);assert.equal(menu.classList.contains('hidden'),false);
 elements.get('closeAccountBtn').listeners.click();assert.equal(account.classList.contains('hidden'),true);assert.equal(menu.classList.contains('hidden'),false);
 elements.get('menuAccountBtn').listeners.click();documentListeners.keydown({key:'Escape'});assert.equal(account.classList.contains('hidden'),true);
});

test('save transfer stays open on backdrop click and closes through its back button',()=>{
 const {elements}=load();elements.get('openMainMenuBtn').listeners.click();const menu=elements.get('mainMenu'),save=elements.get('saveOverlay');elements.get('menuSaveBtn').listeners.click();assert.equal(menu.classList.contains('hidden'),false);assert.equal(save.classList.contains('hidden'),false);save.listeners.click?.({target:save});assert.equal(save.classList.contains('hidden'),false);elements.get('closeSaveBtn').listeners.click();assert.equal(save.classList.contains('hidden'),true);assert.equal(menu.classList.contains('hidden'),false);
});

test('short landscape menus can use the free rectangle beside the hand instead of a collapsed band',()=>{
 const rules=layout(),rect=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height,width,height});
 const controls=[rect(12,12,820,44),rect(532,176,300,90),rect(12,288,820,90),rect(12,76,110,44),rect(684,76,148,44)];
 const area=rules.freeArea(844,390,controls),panel=rules.fit(area,320,400);
 assert.ok(panel.width>=240);assert.ok(panel.height>=100);
 for(const b of controls)assert.ok(panel.x+panel.width<=b.left||panel.x>=b.right||panel.y+panel.height<=b.top||panel.y>=b.bottom);
});

test('each early tutorial step highlights its actual cards, legal fields, slots, build menu and upgrade panel',()=>{
 const box={left:0,top:0,width:1200,height:800},game=load({initialStorage:{'tutorial-v1':'new'},boardBox:box,project:p=>({x:500+p.x,y:300+p.y})}),{a,document,elements,documentListeners,selectSlot,buyTower}=game;
 document.querySelector=selector=>{if(selector==='.boardWrap')return {getBoundingClientRect:()=>box};if(selector==='.handDock')return {getBoundingClientRect:()=>({left:350,top:600,width:500,height:120})};const id=selector.startsWith('#')?selector.slice(1).split(':')[0]:null;if(id&&elements.has(id)&&!elements.get(id).classList.contains('hidden'))return {getBoundingClientRect:()=>({left:30,top:170,width:330,height:300})};return null;};
 a.state.hand=['straight'];a.state.selectedCard=0;a.renderAll();assert.match(elements.get('tutorialTargets').innerHTML,/x="346" y="596"/);
 documentListeners.keydown({key:'r'});a.state.rotation=0;a.renderAll();assert.match(elements.get('tutorialTargets').innerHTML,/<polygon/);assert.doesNotMatch(elements.get('tutorialTargets').innerHTML,/<circle/);
 a.placeTile(1,0);assert.match(elements.get('tutorialTargets').innerHTML,/<circle/);
 selectSlot(1,0,0);assert.match(elements.get('tutorialTargets').innerHTML,/x="26" y="166"/);
 buyTower('archer');a.rendererCommands.selectTower(1,0,0);a.renderAll();assert.match(elements.get('tutorialTargets').innerHTML,/x="26" y="166"/);
 elements.get('skipTutorialBtn').listeners.click();assert.equal(elements.get('tutorialTargets').classList.contains('hidden'),true);
});

test('camera changes immediately reproject tutorial targets without waiting for another game action',()=>{
 let offset=0;const {a,elements,documentListeners}=load({initialStorage:{'tutorial-v1':'new'},boardBox:{left:0,top:0,width:1200,height:800},project:p=>({x:p.x+500+offset,y:p.y+300})});a.state.hand=['straight'];a.state.selectedCard=0;documentListeners.keydown({key:'r'});a.state.rotation=0;a.renderAll();const before=elements.get('tutorialTargets').innerHTML;offset=100;a.rendererCommands.viewChanged();const after=elements.get('tutorialTargets').innerHTML;assert.notEqual(after,before);assert.match(after,/<polygon/);
});

test('tutorial highlights only Archer in build menu, then its upgrades, and clears highlighting after upgrade',()=>{
 const {a,elements,selectSlot,buyTower,upgradeSelectedTower}=load({initialStorage:{'tutorial-v1':'new'}});a.state.phase='build';a.state.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[null]});selectSlot(1,0,0);
 const offers=elements.get('towerMenu').children;assert.ok(offers.every(b=>b.innerHTML.includes('towerBuildIcon')&&b.innerHTML.includes('<svg')));assert.equal(offers.filter(b=>b.classList.contains('tutorialChoice')).length,1);assert.ok(offers[0].classList.contains('tutorialChoice'));
 buyTower('archer');a.rendererCommands.selectTower(1,0,0);const upgrades=elements.get('towerUpgrades').children.filter(b=>b.listeners.click);assert.ok(upgrades.length);assert.equal(upgrades.filter(b=>b.classList.contains('tutorialChoice')).length,1);assert.match(upgrades.find(b=>b.classList.contains('tutorialChoice')).innerHTML,/Salve/);assert.match(elements.get('tutorialText').textContent,/Salve/);assert.equal(elements.get('towerMenu').children.some(b=>b.classList.contains('tutorialChoice')),false);
 upgradeSelectedTower('volley');assert.equal(elements.get('towerPanel').classList.contains('hidden'),true);
});

test('alternative tutorial tower explains upgrades and can continue without gold',()=>{
 const {a,elements,selectSlot,buyTower}=load({initialStorage:{'tutorial-v1':'new'}});a.state.phase='build';a.state.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[null]});selectSlot(1,0,0);buyTower('catapult');a.state.gold=0;a.renderAll();
 assert.match(elements.get('tutorialText').textContent,/kein Bogenschütze/);assert.equal(elements.get('towerDrawer').classList.contains('hidden'),true);assert.equal(elements.get('tutorialNextBtn').classList.contains('hidden'),false);
 elements.get('tutorialNextBtn').listeners.click();assert.match(elements.get('tutorialText').textContent,/Herzen/);elements.get('tutorialNextBtn').listeners.click();assert.match(elements.get('tutorialText').textContent,/Leertaste/);
});

test('tutorial puts Archer first while ordinary runs preserve chosen loadout order',()=>{
 const order=['chain','freeze','mine','catapult','archer'];const tutorial=load({initialStorage:{'tutorial-v1':'new'}});tutorial.a.newRun(order);assert.deepEqual(Array.from(tutorial.a.state.towerLoadout),['archer','chain','freeze','mine','catapult']);assert.deepEqual(order,['chain','freeze','mine','catapult','archer']);
 const normal=load();normal.a.newRun(order);assert.deepEqual(Array.from(normal.a.state.towerLoadout),order);
});
