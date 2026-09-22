const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs'),loadCore=require('../headless-core.cjs');
test('forge and market purchase hover/focus preview the same tiles as the built building',()=>{
  for(const type of ['forge','market']){
    const {a,elements}=load(),c=loadCore();a.state.phase='build';a.state.gold=200;
    a.state.map.set('1,0',{q:1,r:0,type:'buildingPlot',roads:[],slots:0,towers:[],buildingSlots:1,buildings:[null]});
    a.rendererCommands.selectBuilding(1,0,0);
    const button=elements.get('buildingOptions').children[type==='forge'?1:2];button.listeners.pointerenter();
    const preview=c.buildings.highlight(a.state);assert.ok(preview.tiles.length>=2);assert.equal(a.state.map.get('1,0').buildings[0],null);
    button.listeners.pointerleave();assert.equal(c.buildings.highlight(a.state).tiles.length,0);
    button.listeners.focus();assert.equal(a.state.previewBuilding.type,type);button.listeners.click();
    const built=c.buildings.highlight(a.state);assert.deepEqual(built.tiles.map(t=>t.q+','+t.r),preview.tiles.map(t=>t.q+','+t.r));assert.equal(built.color,preview.color);assert.equal(a.state.previewBuilding,null);
  }
});
test('tower sale requires confirmation; cancel and duplicate confirmation never sell or pay twice',()=>{
  const {a,elements,selectSlot,buyTower,documentListeners}=load();a.state.phase='build';a.state.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[null]});
  selectSlot(1,0,0);buyTower('archer');a.rendererCommands.selectTower(1,0,0);const gold=a.state.gold;
  elements.get('sellTowerBtn').listeners.click();assert.ok(a.state.map.get('1,0').towers[0]);assert.equal(a.state.gold,gold);
  documentListeners.keydown({key:'Escape'});elements.get('confirmSaleBtn').listeners.click();assert.ok(a.state.map.get('1,0').towers[0]);
  elements.get('sellTowerBtn').listeners.click();elements.get('confirmSaleBtn').listeners.click();assert.equal(a.state.map.get('1,0').towers[0],null);assert.equal(a.state.gold,gold+25);
  elements.get('confirmSaleBtn').listeners.click();assert.equal(a.state.gold,gold+25);
});
test('building sale re-confirms changed refund and cannot apply across a new run',()=>{
  const {a,elements}=load();a.state.phase='build';a.state.map.get('0,0').buildingSlots=1;a.state.map.get('0,0').buildings=[{type:'house',level:1,paid:30,builtOnWave:0}];a.state.income=3;
  a.rendererCommands.selectBuilding(0,0,0);elements.get('sellBuildingBtn').listeners.click();const gold=a.state.gold;
  a.state.phase='wave';a.state.wave=1;elements.get('confirmSaleBtn').listeners.click();assert.ok(a.state.map.get('0,0').buildings[0]);assert.match(elements.get('saleConfirmText').textContent,/15 Gold/);
  elements.get('confirmSaleBtn').listeners.click();assert.equal(a.state.gold,gold+15);assert.equal(a.state.income,0);
  a.newRun();elements.get('confirmSaleBtn').listeners.click();assert.equal(a.state.gold,70);
});

test('special forge and market target an explored hex by map click; Escape cancels without changing target',()=>{
 for(const type of ['forge','market']){const {a,elements,documentListeners}=load();a.state.phase='build';const tile=a.state.map.get('0,0');tile.buildingSlots=1;tile.buildings=[{type,level:3,special:true,paid:100}];a.state.map.set('2,0',{q:2,r:0,type:'straight',roads:[0,3],slots:1,towers:[null]});
 a.rendererCommands.selectBuilding(0,0,0);const content=elements.get('buildingOptions');const find=node=>node.textContent?.includes('Zusatz-Hex auf')?node:(node.children||[]).map(find).find(Boolean);const button=find(content);assert.ok(button);button.listeners.click();assert.ok(a.state.buildingTarget);a.rendererCommands.placeTile(2,0);assert.equal(tile.buildings[0].target,'2,0');assert.equal(a.state.buildingTarget,null);
 a.state.buildingTarget={q:0,r:0,index:0};documentListeners.keydown({key:'Escape'});assert.equal(a.state.buildingTarget,null);assert.equal(tile.buildings[0].target,'2,0');}
});
test('new ballista prioritizes bosses and keeps editable priorities',()=>{
 const {a,selectSlot,buyTower}=load();a.state.phase='build';a.state.gold=1000;a.state.towerLoadout.push('ballista');a.state.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[null]});selectSlot(1,0,0);buyTower('ballista');assert.equal(a.state.map.get('1,0').towers[0].targetPriority[0],'boss');
});
