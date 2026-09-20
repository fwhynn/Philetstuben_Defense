const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs');
test('Q and E rotate the camera in opposite directions without changing hex rotation',()=>{
  const turns=[],{a,documentListeners}=load({rotateView:direction=>turns.push(direction)});
  const key=key=>documentListeners.keydown({key,preventDefault(){}});
  key('q');key('E');assert.deepEqual(turns,[-1,1]);assert.equal(a.state.rotation,0);
  documentListeners.keydown({key:'q',target:{tagName:'INPUT'}});assert.equal(turns.length,2);
});
test('G toggles and saves the grid, ignores held repeats and text input',()=>{
  const {a,elements,storage,documentListeners}=load(),key=documentListeners.keydown;
  key({key:'g',preventDefault(){}});assert.equal(a.state.showHexGrid,true);assert.equal(elements.get('hexGrid').checked,true);assert.equal(storage.get('hexGrid'),'true');
  key({key:'g',repeat:true});assert.equal(a.state.showHexGrid,true);
  key({key:'g',target:{tagName:'INPUT'}});assert.equal(a.state.showHexGrid,true);
  key({key:'g',ctrlKey:true});assert.equal(a.state.showHexGrid,true);
  key({key:'G',preventDefault(){}});assert.equal(a.state.showHexGrid,false);assert.equal(storage.get('hexGrid'),'false');
});
test('grid setting persists and diamond HUD forecasts only unpaid run rewards',()=>{
  const {a,elements,storage}=load({initialStorage:{hexGrid:'true'}});
  assert.equal(a.state.showHexGrid,true);assert.equal(elements.get('hexGrid').checked,true);
  elements.get('hexGrid').checked=false;elements.get('hexGrid').listeners.change();
  assert.equal(a.state.showHexGrid,false);assert.equal(storage.get('hexGrid'),'false');
  a.newRun();assert.equal(a.state.showHexGrid,false);
  a.state.wave=10;a.state.earnedMeta.periodicBosses=1;a.state.earnedMeta.explorationBosses=1;
  a.renderAll();assert.equal(elements.get('runDiamonds').textContent,'(+15)');
  a.state.metaSettled=true;a.renderAll();assert.equal(elements.get('runDiamonds').textContent,'(+0)');
});

test('middle click rotates clockwise, R remains available, and building phase does not rotate',()=>{
  const {a,elements,documentListeners}=load();let prevented=0;
  const middle=()=>elements.get('board').listeners.pointerdown({button:1,preventDefault(){prevented++;}});
  assert.equal(a.state.rotation,0);middle();assert.equal(a.state.rotation,5);assert.equal(prevented,1);
  documentListeners.keydown({key:'r'});assert.equal(a.state.rotation,0);
  for(let i=0;i<6;i++)middle();assert.equal(a.state.rotation,0);
  a.state.phase='build';middle();assert.equal(a.state.rotation,0);
});

test('arsenal unlocks refresh an open loadout and both new towers can be taken into a run',()=>{
  const {a,elements,storage,selectSlot,buyTower}=load({initialProfile:{diamonds:100}});
  elements.get('newRunBtn').listeners.click();
  elements.get('openArsenalBtn').listeners.click();
  for(const index of [0,1])elements.get('arsenalChoices').children[index].children[0].listeners.click();
  assert.equal(elements.get('loadoutChoices').children.length,7);
  elements.get('closeArsenalBtn').listeners.click();
  const choices=()=>elements.get('loadoutChoices').children;
  choices()[5].listeners.click();assert.match(elements.get('loadoutWarning').textContent,/fünf Plätze/);
  choices()[0].listeners.click();choices()[5].listeners.click();
  choices()[1].listeners.click();choices()[6].listeners.click();
  elements.get('confirmLoadoutBtn').listeners.click();
  assert.ok(a.state.towerLoadout.includes('ballista'));assert.ok(a.state.towerLoadout.includes('flame'));
  const saved=JSON.parse(storage.get('hex-bastion-profile-v1'));
  assert.deepEqual(Array.from(a.state.towerLoadout),saved.activeLoadout);assert.equal(saved.diamonds,45);
  a.state.phase='build';a.state.gold=1000;
  a.state.map.set('1,0',{q:1,r:0,type:'cross',roads:[0,1,3,4],slots:2,towers:[null,null]});
  selectSlot(1,0,0);buyTower('ballista');selectSlot(1,0,1);buyTower('flame');
  assert.equal(a.state.map.get('1,0').towers[0].type,'ballista');
  assert.equal(a.state.map.get('1,0').towers[1].type,'flame');
  const reloaded=load({initialProfile:saved});assert.deepEqual(Array.from(reloaded.a.state.towerLoadout),saved.activeLoadout);
});
