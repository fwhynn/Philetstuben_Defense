const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs'),loadCore=require('../headless-core.cjs');

test('selected forge extra hex stays strongly marked during hover and reassignment, without becoming eligible',()=>{
  const {a,elements}=load(),c=loadCore();a.state.phase='build';
  a.state.map.set('1,0',{q:1,r:0,type:'buildingPlot',roads:[],slots:0,towers:[],buildingSlots:1,buildings:[{type:'forge',level:3,special:true,target:'4,0',paid:200}]});
  a.state.map.set('4,0',{q:4,r:0,type:'straight',roads:[0,3],slots:1,towers:[null]});
  a.rendererCommands.selectBuilding(1,0,0);
  const choose=elements.get('buildingOptions').children.at(-1);choose.listeners.pointerenter();
  let h=c.buildings.highlight(a.state);assert.equal(h.currentTiles[0].q,4);assert.notEqual(h.currentColor,h.color);
  choose.listeners.click();h=c.buildings.highlight(a.state);
  assert.equal(h.currentTiles[0].q,4);assert.ok(!h.tiles.some(t=>t.q===4&&t.r===0));
  assert.equal(a.state.map.get('1,0').buildings[0].target,'4,0');
});

test('tower build offers name the strongest damage category and do not claim damage for freeze',()=>{
  const {a,elements}=load();a.state.phase='build';a.state.towerLoadout=['archer','chain','catapult','mine','freeze'];a.renderAll();
  const cards=elements.get('towerMenu').children;
  for(const [index,category] of [[0,'Leben'],[1,'Magieresistenz'],[2,'Rüstung'],[3,'Rüstung']])assert.ok(cards[index].innerHTML.includes('besonders gut gegen '+category));
  assert.ok(!cards[4].innerHTML.includes('besonders gut gegen'));
});
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
  assert.equal(elements.get('sellTowerBtn').classList.contains('confirmSale'),true);documentListeners.keydown({key:'Escape'});assert.equal(elements.get('sellTowerBtn').classList.contains('confirmSale'),false);assert.ok(a.state.map.get('1,0').towers[0]);
  elements.get('sellTowerBtn').listeners.click();elements.get('sellTowerBtn').listeners.click();assert.equal(a.state.map.get('1,0').towers[0],null);assert.equal(a.state.gold,gold+25);
  elements.get('sellTowerBtn').listeners.click();assert.equal(a.state.gold,gold+25);
});
test('building sale re-confirms changed refund and cannot apply across a new run',()=>{
  const {a,elements}=load();a.state.phase='build';a.state.map.get('0,0').buildingSlots=1;a.state.map.get('0,0').buildings=[{type:'house',level:1,paid:30,builtOnWave:0}];a.state.income=3;
  a.rendererCommands.selectBuilding(0,0,0);elements.get('sellBuildingBtn').listeners.click();const gold=a.state.gold;
  a.state.phase='wave';a.state.wave=1;elements.get('sellBuildingBtn').listeners.click();assert.ok(a.state.map.get('0,0').buildings[0]);assert.match(elements.get('sellBuildingBtn').textContent,/15 Gold/);
  elements.get('sellBuildingBtn').listeners.click();assert.equal(a.state.gold,gold+15);assert.equal(a.state.income,0);
  a.newRun();elements.get('sellBuildingBtn').listeners.click();assert.equal(a.state.gold,70);
});

test('special forge and market target an explored hex by map click; Escape cancels without changing target',()=>{
 for(const type of ['forge','market']){const {a,elements,documentListeners}=load();a.state.phase='build';const tile=a.state.map.get('0,0');tile.buildingSlots=1;tile.buildings=[{type,level:3,special:true,paid:100}];a.state.map.set('2,0',{q:2,r:0,type:'straight',roads:[0,3],slots:1,towers:[null]});
 a.rendererCommands.selectBuilding(0,0,0);const content=elements.get('buildingOptions');const find=node=>node.textContent?.includes('Zusatz-Hex auf')?node:(node.children||[]).map(find).find(Boolean);const button=find(content);assert.ok(button);button.listeners.click();assert.ok(a.state.buildingTarget);a.rendererCommands.placeTile(2,0);assert.equal(tile.buildings[0].target,'2,0');assert.equal(a.state.buildingTarget,null);
 a.state.buildingTarget={q:0,r:0,index:0};documentListeners.keydown({key:'Escape'});assert.equal(a.state.buildingTarget,null);assert.equal(tile.buildings[0].target,'2,0');}
});
test('new ballista prioritizes its strongest damage pool and keeps editable priorities',()=>{
 const {a,selectSlot,buyTower}=load();a.state.phase='build';a.state.gold=1000;a.state.towerLoadout.push('ballista');a.state.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[null]});selectSlot(1,0,0);buyTower('ballista');assert.equal(a.state.map.get('1,0').towers[0].targetPriority[0],'mostHealth');
});

test('remote forge target excludes its own radius and all existing forge coverage including remote targets',()=>{
 const c=loadCore(),map=new Map();for(let q=0;q<9;q++)map.set(q+',0',{q,r:0,buildings:[],towers:[]});const forge={type:'forge',level:3,special:true,paid:100},other={type:'forge',level:3,special:true,target:'7,0'};map.get('0,0').buildings=[forge];map.get('4,0').buildings=[other];const s={map,hp:20,phase:'build'},slot={q:0,r:0,index:0};
 for(const id of ['0,0','1,0','3,0','4,0','5,0','7,0'])assert.equal(c.buildings.setTarget(s,slot,id),false,id);
 assert.equal(c.buildings.setTarget(s,slot,'2,0'),true);assert.equal(forge.target,'2,0');assert.equal(c.buildings.setTarget(s,slot,'7,0'),false);assert.equal(forge.target,'2,0');assert.equal(c.buildings.setTarget(s,slot,'8,0'),true);assert.equal(c.buildings.effects(map,map.get('2,0')).damage,1);
});

test('building hover distinguishes active coverage from other buildings of the same kind',()=>{
 const c=loadCore();for(const type of ['forge','market']){const map=new Map();for(let q=0;q<6;q++)map.set(q+',0',{q,r:0,buildings:[],towers:[]});map.get('0,0').buildings=[{type}];map.get('4,0').buildings=[{type}];const h=c.buildings.highlight({map,hoverBuilding:{q:0,r:0,index:0}});assert.ok(h.tiles.some(t=>t.q===1));assert.ok(h.otherTiles.some(t=>t.q===5));assert.notEqual(h.color,h.otherColor);assert.ok(!h.tiles.some(t=>t.q===5));}
});
