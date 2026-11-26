const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');

test('enemy health bars retain their geometry and skip writes only while all six health values match',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../classes/three-renderer.js'),'utf8');
 const fn=source.match(/  function syncEnemyBars\(obj,e\)\{[\s\S]*?\n  \}/)[0];
 const context={clamp:(v,min,max)=>Math.max(min,Math.min(max,v))};vm.runInNewContext(fn+';globalThis.sync=syncEnemyBars;',context);
 let writes=0;const track=o=>new Proxy(o,{set(target,key,value){writes++;target[key]=value;return true;}});
 const mesh=()=>track({position:track({x:0,y:0}),scale:track({x:26})});
 const obj={fgs:{hp:mesh(),armorHp:mesh(),magicHp:mesh()},barBgs:{hp:mesh(),armorHp:mesh(),magicHp:mesh()}};
 const enemy={hp:50,maxHp:100,armorHp:0,maxArmorHp:100,magicHp:20,maxMagicHp:40};context.sync(obj,enemy);
 assert.equal(obj.fgs.hp.scale.x,13);assert.equal(obj.fgs.hp.position.x,-6.5);assert.equal(obj.fgs.hp.position.y,0);
 assert.equal(obj.fgs.armorHp.visible,false);assert.equal(obj.fgs.magicHp.visible,true);assert.equal(obj.fgs.magicHp.position.y,5);
 writes=0;for(let i=0;i<60;i++)context.sync(obj,{...enemy,x:i,y:i});assert.equal(writes,0);
 context.sync(obj,{...enemy,armorHp:10,maxArmorHp:20});assert.ok(writes>0);assert.equal(obj.fgs.armorHp.scale.x,13);assert.equal(obj.fgs.magicHp.position.y,10);
 context.sync(obj,{...enemy,hp:0,maxMagicHp:0});assert.equal(obj.fgs.hp.scale.x,.001);assert.equal(obj.fgs.hp.visible,true);assert.equal(obj.fgs.magicHp.visible,false);
 context.sync(obj,{...enemy,maxHp:200});assert.equal(obj.fgs.hp.scale.x,6.5);
});
test('placement hint follows camera movement and hides when its tile leaves the view',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../classes/three-renderer.js'),'utf8');
 const cameraFn=source.match(/  function applyCamera\(\)\{[\s\S]*?\n  \}/)[0],hintFn=source.match(/  function positionRotateHint\(\)\{[\s\S]*?\n  \}/)[0];
 const box={left:0,top:0,width:800,height:600},context={rotateAnchor:{x:200,y:200},HEX:30,rotateHint:{style:{}},HexCompact:{touch:()=>true},cam:{x:0,z:0,dist:100,yaw:0,pitch:.5},camera:{position:{set(){}},lookAt(){},updateMatrixWorld(){}},sun:{target:{position:{set(){}}},position:{set(){}}},host:{getBoundingClientRect:()=>box},wrap:{getBoundingClientRect:()=>box}};
 context.project=p=>({x:p.x-context.cam.x,y:p.y-context.cam.z});
 context.state={};context.targetList=[];context.key=(q,r)=>q+','+r;
 vm.runInNewContext(hintFn+cameraFn+';globalThis.move=applyCamera;',context);
 context.move();const before=parseFloat(context.rotateHint.style.top);assert.equal(context.rotateHint.style.left,'200px');assert.doesNotMatch(context.rotateHint.textContent,/Mausrad/);
 context.cam.x=50;context.cam.z=40;context.move();assert.equal(context.rotateHint.style.left,'150px');assert.equal(parseFloat(context.rotateHint.style.top),before-40);
 context.cam.x=1000;context.move();assert.equal(context.rotateHint.style.display,'none');
 context.cam.x=0;context.state={buildingTarget:{q:0,r:0,index:0},hoveredPlacement:'4,0'};context.targetList=[{q:4,r:0,legal:true}];context.move();assert.equal(context.rotateHint.textContent,'✓ Zusatz-Hex wählen');
 context.targetList[0].legal=false;context.move();assert.equal(context.rotateHint.textContent,'✕ Hier nicht möglich');
});

test('3D extra-hex preview highlights the hovered target even during combat with no hand cards',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../classes/three-renderer.js'),'utf8'),fn=source.match(/  function syncGhost\(\)\{[\s\S]*?\n  \}/)[0];
 class Mesh{constructor(geometry,material){this.geometry=geometry;this.material=material;this.position={set:(...values)=>{this.xyz=values;}};}}
 const context={THREE:{Mesh},state:{phase:'wave',waveRunning:true,buildingTarget:{q:0,r:0,index:0},hoveredPlacement:'4,0',hand:[],selectedCard:0},targetList:[{q:4,r:0,legal:true}],CARD_LIBRARY:{},key:(q,r)=>q+','+r,ghostSig:'',rotateAnchor:null,flatHex:'fill',outline:'outline',mats:{targetHover:{name:'gold'},targetBlocked:{name:'red'},targetOutline:{},blockedOutline:{}},layer:{ghost:{children:[],add(m){this.children.push(m);}},targets:{children:[]}},clearGroup:g=>{g.children=[];},axialToWorld:(q,r)=>({x:q*100,y:r*100}),positionRotateHint(){}};
 vm.runInNewContext(fn+';globalThis.draw=syncGhost;',context);context.draw();assert.equal(context.layer.ghost.children.length,2);assert.equal(context.layer.ghost.children[0].material.name,'gold');assert.equal(context.layer.ghost.children[0].material.depthTest,false);
 context.targetList[0].legal=false;context.draw();assert.equal(context.layer.ghost.children[0].material.name,'red');context.state.hoveredPlacement=null;context.draw();assert.equal(context.layer.ghost.children.length,0);assert.equal(context.rotateAnchor,null);
});

test('3D extra-hex hit testing keeps a tower above the tile from swallowing the selection',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../classes/three-renderer.js'),'utf8'),fn=source.match(/  function pick\(event\)\{[^\n]+/)[0];
 const tower={kind:'tower',q:4,r:0,index:0},target={kind:'target',q:4,r:0,legal:true},context={state:{buildingTarget:{}},setRay(){},pickables:[],ray:{intersectObjects:()=>[tower,target].map(pick=>({object:{userData:{pick}}}))}};
 vm.runInNewContext(fn+';globalThis.hit=pick;',context);assert.equal(context.hit({}),target);context.state.buildingTarget=null;assert.equal(context.hit({}),tower);
});
test('free slot hints disappear when disabled or occupied', () => {
  const { renderer, svg, state } = setup(); state.phase = 'build'; state.hand = [];
  const tile = { q: 1, r: 0, type: 'straight', roads: [0, 3], slots: 1, towers: [null] }; state.map.set('1,0', tile);
  const hints = () => svg.children[2].children.filter(p => p.attributes['data-slot-hint']);
  renderer.render(state); assert.equal(hints().length, 1); state.showSlotHints = false; renderer.render(state); assert.equal(hints().length, 0);
  state.showSlotHints = true; tile.towers[0] = { type: 'archer' }; renderer.render(state); assert.equal(hints().length, 0);
});

test('base marker follows affordability and hint visibility without enlarging the base hit area',()=>{
 const {renderer,svg,state}=setup();Object.assign(state,{baseUpgrades:{walls:0,weapon:0},heroId:'standard',phase:'build',hand:[]});
 const markers=()=>svg.children.flatMap(layer=>layer.children||[]).filter(n=>n.attributes['data-base-upgrade']);
 renderer.render(state);assert.equal(markers().length,1);assert.equal(markers()[0].style.pointerEvents,'none');
 state.gold=0;renderer.render(state);assert.equal(markers().length,0);
 state.gold=100;state.showSlotHints=false;renderer.render(state);assert.equal(markers().length,1);assert.equal(markers()[0].textContent,'↑');
});
test('grid and building highlights toggle independently and building hover emits commands', () => {
  const { renderer, svg, calls, state } = setup();
  state.map.set('1,0', { q: 1, r: 0, type: 'village', rotation: 0, roads: [0, 2], slots: 0, towers: [], buildingSlots: 1, buildings: [{ type: 'forge' }] });
  state.selectedBuilding = { q: 1, r: 0, index: 0 }; state.showHexGrid = true; renderer.render(state);
  const overlays = kind => svg.children[3].children.filter(p => p.attributes['data-overlay'] === kind);
  assert.ok(overlays('grid').length > 0); assert.equal(overlays('building').length, 2);
  const slot = svg.children[2].children.find(p => p.listeners.pointerenter && p.listeners.pointerleave);
  slot.listeners.pointerenter(); slot.listeners.pointerleave();
  assert.equal(calls[0][0], 'hoverBuilding'); assert.deepEqual(JSON.parse(JSON.stringify(calls[0][1])), { q: 1, r: 0, index: 0 }); assert.deepEqual(calls[1], ['hoverBuilding', null]);
  state.showHexGrid = false; renderer.render(state); assert.equal(overlays('grid').length, 0); assert.equal(overlays('building').length, 2);
  state.selectedBuilding = null; renderer.render(state); assert.equal(overlays('building').length, 0);
});
function setup() {
  function element() { return { attributes: {}, style: {}, children: [], listeners: {}, textContent: '', set innerHTML(value) { this.children = []; }, setAttribute(name, value) { this.attributes[name] = value; }, appendChild(child) { this.children.push(child); child.parent = this; }, addEventListener(name, fn) { this.listeners[name] = fn; }, removeEventListener(name, fn) { if (this.listeners[name] === fn) delete this.listeners[name]; }, remove() { this.parent.children = this.parent.children.filter(child => child !== this); } }; }
  const context = { document: { createElementNS: element } };
  for (const file of ['heroes.js', 'biomes.js', 'data.js', 'waves.js', 'map.js', 'buildings.js', 'exploration.js', 'camera.js', 'svg-renderer.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../classes', file), 'utf8'), context);
  vm.runInNewContext('globalThis.adapter=HexSvgRenderer;', context);
  const svg = element(), calls = [], commands = {}; for (const name of ['placeTile', 'selectSlot', 'selectTower', 'selectBuilding', 'clearSelection', 'hoverPlacement', 'leavePlacement', 'hoverBuilding']) commands[name] = (...args) => calls.push([name, ...args]);
  const renderer = context.adapter.create(svg, commands), state = { map: new Map([['0,0', { q: 0, r: 0, type: 'base', roads: [0], slots: 0, towers: [], income: 0 }]]), landmarks: new Map(), phase: 'place', waveRunning: false, hand: ['straight'], selectedCard: 0, rotation: 0, hoveredPlacement: null, selectedSlot: null, selectedTower: null, selectedBuilding: null, previewTower: null, hp: 20, gold: 70, enemies: [], projectiles: [] };
  return { renderer, svg, calls, state };
}

test('model picking leaves gaps between nearby objects clickable and excludes effect meshes',async()=>{
 const THREE=await import('three'),source=fs.readFileSync(path.join(__dirname,'../classes/three-renderer.js'),'utf8');
 const fn=source.match(/  function modelPicks\(group,payload,exclude=null\)\{[\s\S]*?\n  \}/)[0],context={};vm.runInNewContext(fn+'\nglobalThis.collect=modelPicks;',context);
 const root=new THREE.Group(),material=new THREE.MeshBasicMaterial(),geometry=new THREE.BoxGeometry(10,30,10),picks=[];
 for(const [index,x] of [0,20].entries()){
  const holder=new THREE.Group(),body=new THREE.Mesh(geometry,material),effect=new THREE.Group();
  body.position.y=15;effect.add(new THREE.Mesh(new THREE.SphereGeometry(40),material));holder.add(body,effect);holder.position.x=x;root.add(holder);
  picks.push(...context.collect(holder,{kind:index?'building':'tower',index},effect));
 }
 root.updateMatrixWorld(true);const ray=new THREE.Raycaster();
 const at=x=>{ray.set(new THREE.Vector3(x,15,100),new THREE.Vector3(0,0,-1));return ray.intersectObjects(picks,false);};
 assert.equal(picks.length,2);assert.equal(at(0)[0].object.userData.pick.index,0);assert.equal(at(20)[0].object.userData.pick.index,1);assert.equal(at(10).length,0);assert.equal(at(-10).length,0);
});

test('depleted armor and magic bars disappear while health remains and active protection compacts',()=>{
 const {renderer,svg,state}=setup();state.enemies=[{id:1,type:'normal',x:30,y:30,hp:10,maxHp:20,armorHp:5,maxArmorHp:5,magicHp:8,maxMagicHp:8}];
 const bars=()=>{const all=[];function walk(node){all.push(node);for(const c of node.children||[])walk(c);}walk(svg);return all.filter(n=>['#78b95f','#df8b3a','#69aee8'].includes(n.attributes.fill));};
 renderer.render(state);assert.equal(bars().length,3);
 state.enemies[0].armorHp=0;renderer.render(state);assert.equal(bars().length,2);assert.equal(bars().find(n=>n.attributes.fill==='#69aee8').attributes.y,9);
 state.enemies[0].magicHp=0;renderer.render(state);assert.equal(bars().length,1);assert.equal(bars()[0].attributes.fill,'#78b95f');
});

test('3D cursor is refreshed by render after legality changes without another pointer move',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../classes/three-renderer.js'),'utf8');
 const render=source.match(/  function render\(nextState,placementTargets=\[\]\)\{[\s\S]*?\n  \}/)[0];
 const refresh=source.match(/  function refreshPointerCursor\(\)\{[\s\S]*?\n  \}/)[0];
 const state={},dom={style:{}},context={state,dom,ready:true,pickDirty:true,pickables:[],objectRecords:new Map(),targetList:[],pointerPosition:{clientX:20,clientY:20},drag:null,layer:{objects:{updateMatrixWorld(){}},targets:{children:[],updateMatrixWorld(){context.matricesReady=true;}}},pick(){assert.equal(context.matricesReady,true);return {kind:'target',legal:context.targetList[0].legal};}};
 context.tunnelVisuals={children:[],updateMatrixWorld(){}};
 for(const name of ['syncTileOverlays','syncTiles','syncLandmarks','syncEmpty','syncObjects','syncTargets','syncGhost','syncTunnelVisuals','syncSelection','syncMines','syncConsumables','syncEnemies','syncProjectiles','syncPowerVisuals','syncLabels'])context[name]=()=>{};
 vm.runInNewContext(render+'\n'+refresh+'\nglobalThis.draw=render;',context);
 context.draw(state,[{legal:false}]);assert.equal(dom.style.cursor,'not-allowed');
 context.pickDirty=true;context.matricesReady=false;context.draw(state,[{legal:true}]);assert.equal(dom.style.cursor,'pointer');
 context.draw(state,[{legal:false}]);assert.equal(dom.style.cursor,'not-allowed');
});
test('rendering and picking do not mutate frozen gameplay state and emit logical actions', () => {
  const { renderer, svg, calls, state } = setup(); Object.freeze(state); Object.freeze(state.map.get('0,0')); renderer.render(state, [{ q: 1, r: 0, legal: true }]);
  const hit = svg.children[1].children.find(child => child.listeners.pointerenter); assert.ok(hit);
  hit.listeners.pointerenter(); hit.listeners.pointerleave(); hit.listeners.click(); svg.listeners.click();
  assert.deepEqual(calls, [['hoverPlacement', '1,0'], ['leavePlacement', '1,0'], ['placeTile', 1, 0], ['clearSelection']]); assert.equal(state.hoveredPlacement, null); assert.equal(state.map.size, 1);
});
test('renderer reset rebuilds objects for a new run and destroy releases its layers', () => {
  const { renderer, svg, state } = setup(); renderer.render(state); const old = svg.children[2].children[0]; renderer.reset(); renderer.render(state); assert.notEqual(svg.children[2].children[0], old);
  renderer.destroy(); assert.equal(svg.children.length, 0); assert.equal(svg.listeners.click, undefined);
});
test('projection hides SVG details behind local screen coordinates', () => {
  const { renderer, svg } = setup(); assert.equal(renderer.project({ x: 10, y: 20 }), null);
  svg.getScreenCTM = () => ({}); svg.createSVGPoint = () => ({ matrixTransform() { return { x: this.x * 2 + 100, y: this.y * 2 + 200 }; } }); svg.parentElement = { getBoundingClientRect: () => ({ left: 100, top: 200, width: 900, height: 600 }) };
  const screen = renderer.project({ x: 10, y: 20 }); assert.equal(screen.x, 20); assert.equal(screen.y, 40); assert.equal(screen.width, 900); assert.equal(screen.height, 600);
});
test('renderer owns camera reset and releases camera listeners', () => {
  const { renderer, svg } = setup(); renderer.zoom(.5); assert.equal(renderer.getView().w, 550); renderer.reset(); assert.equal(renderer.getView().w, 1100); assert.equal(svg.attributes.viewBox, '-545 -375 1100 760');
  renderer.destroy(); assert.equal(Object.keys(svg.listeners).length, 0);
});



test('rotate hint belongs to the hover-only placement preview', () => {
  const { renderer, svg, state } = setup(); renderer.render(state, [{ q: 1, r: 0, legal: true }]); const preview = svg.children[1].children.find(child => child.children.some(text => text.textContent === 'R / Mausrad-Klick · Drehen')); assert.ok(preview); assert.equal(preview.style.display, 'none'); const hit = svg.children[1].children.find(child => child.listeners.pointerenter); hit.listeners.pointerenter(); assert.equal(preview.style.display, ''); hit.listeners.pointerleave(); assert.equal(preview.style.display, 'none');
});

test('U marks upgradeable houses, forges and markets without requiring gold and hides completed buildings',()=>{
 const {renderer,svg,state}=setup();Object.assign(state,{phase:'build',gold:0,hp:20,hand:[],showUpgradeStatus:true,buildingUnlocks:['building:forge']});const buildings=[{type:'house',level:1},{type:'forge',level:3},{type:'market',level:3,special:true}];buildings.forEach((b,i)=>state.map.set((i+1)+',0',{q:i+1,r:0,type:'village',roads:[0,2],slots:0,towers:[],buildingSlots:1,buildings:[b]}));const arrows=()=>svg.children[3].children.filter(n=>n.attributes['aria-label']==='Gebäude ausbaubar');renderer.render(state);assert.equal(arrows().length,2);buildings[1].special=true;renderer.render(state);assert.equal(arrows().length,1);state.showUpgradeStatus=false;renderer.render(state);assert.equal(arrows().length,0);
});

test('ordinary building hints require affordable unlocked upgrades and disappear at maximum level',()=>{
 const {renderer,svg,state}=setup();Object.assign(state,{phase:'build',gold:45,hp:20,hand:[],showUpgradeStatus:false,buildingUnlocks:[]});const buildings=[{type:'house',level:1},{type:'forge',level:1},{type:'market',level:1}];buildings.forEach((b,i)=>state.map.set((i+1)+',0',{q:i+1,r:0,type:'village',roads:[0,2],slots:0,towers:[],buildingSlots:1,buildings:[b]}));const count=()=>{renderer.render(state);return svg.children[3].children.filter(n=>n.attributes['aria-label']==='Gebäude ausbaubar').length;};assert.equal(count(),3);state.gold=29;assert.equal(count(),0);state.gold=1000;buildings.forEach(b=>b.level=3);assert.equal(count(),0);state.buildingUnlocks=['building:forge'];assert.equal(count(),1);buildings[1].special=true;assert.equal(count(),0);
});

test('range preview keeps current and prospective circles with different opacity',()=>{
 const {renderer,svg,state}=setup(),tower={type:'archer'};state.phase='build';state.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[tower]});state.selectedTower={q:1,r:0,index:0};
 for(const range of [190,100]){state.previewUpgrade={tower,definition:{range,color:'#fff'}};renderer.render(state);const nodes=svg.children.flatMap(n=>n.children),preview=nodes.find(n=>n.attributes['data-upgrade-range']==='preview'),current=nodes.find(n=>n.attributes.r===150&&n.attributes['stroke-opacity']==='.85');assert.ok(current);assert.equal(preview.attributes.r,range);assert.ok(Number(current.attributes['fill-opacity'])>Number(preview.attributes['fill-opacity']));}
 state.previewUpgrade=null;renderer.render(state);assert.equal(svg.children.flatMap(n=>n.children).some(n=>n.attributes['data-upgrade-range']==='preview'),false);
});

test('new enemy art is rendered as an image with the real asset path and readable tooltip',()=>{
 const {renderer,svg,state}=setup();state.enemies=[{id:1,type:'shieldbearer',name:'Schildknecht',description:'Drei Treffer',abilityIcon:'▣',x:30,y:30,hp:10,maxHp:20}];renderer.render(state);
 const all=[];function walk(n){all.push(n);for(const c of n.children||[])walk(c);}walk(svg);
 const image=all.find(n=>n.attributes.href==='assets/enemies-concepts/shieldbearer.png');assert.ok(image);assert.ok(image.children.some(n=>n.textContent==='Schildknecht · Drei Treffer'));
});


test('power pylons mark all nodes including base and relays, cache geometry and dispose on changes',async()=>{
 const THREE=await import('three'),c=require('../headless-core.cjs')(),s=c.session.create({seed:'power-test',runId:'pylon-test',challengeDay:'2026-11-15',loadout:['archer','catapult','chain','freeze','mine']}).state;
 s.challengeKind='powerGrid';c.powerGrid.initialize(s);
 const source=fs.readFileSync(path.join(__dirname,'../classes/three-renderer.js'),'utf8'),block=source.slice(source.indexOf('  const powerVisuals='),source.indexOf('  // ---- Beschriftungen'));
 const ctx={THREE,state:s,scene:new THREE.Scene(),HexPowerGrid:c.powerGrid,HEX:c.map.HEX,axialToWorld:c.map.axialToWorld};
 vm.runInNewContext(block+';globalThis.power={sync:syncPowerVisuals,clear:clearPowerVisuals,group:powerVisuals}',ctx);
 ctx.power.sync();const first=ctx.power.group.children[0],count=ctx.power.group.children.length;assert.equal(count,s.powerGrid.nodes.length*7);ctx.power.sync();assert.equal(ctx.power.group.children[0],first);
 let disposed=0;first.geometry.addEventListener('dispose',()=>disposed++);c.powerGrid.toggleField(s,'1,0');ctx.power.sync();assert.equal(disposed,1);assert.equal(ctx.power.group.children.length,count);
 ctx.power.clear();assert.equal(ctx.power.group.children.length,0);
});

test('buffered Duo motion advances enemies and effects but synchronizes mines only when their frame changes',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../classes/three-renderer.js'),'utf8');
 const fn=source.match(/  function renderMotion\(\)\{[^\n]+\}/)[0];let updates=0,mines=0,effects=0;const context={state:{remoteView:true,mines:[],consumables:[]},motionMines:null,motionConsumables:null,ready:true,syncEnemies(){updates++;},syncMines(){mines++;},syncConsumables(){},syncProjectiles(){effects++;}};
 vm.runInNewContext(fn+';globalThis.move=renderMotion;',context);for(let i=0;i<60;i++)context.move();assert.equal(updates,60);assert.equal(effects,60);assert.equal(mines,1);context.state.mines=[];context.move();assert.equal(mines,2);context.ready=false;context.move();assert.equal(updates,61);
 const sync=source.match(/  function syncEnemies\(\)\{[\s\S]*?\n  function syncMines/)[0];assert.match(sync,/if\(state.remoteMotionBuffered\)obj.remoteMotion=null/);assert.match(sync,/state.remoteView&&!state.remoteMotionBuffered/);
});
