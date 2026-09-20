const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
test('free slot hints disappear when disabled or occupied',()=>{
  const {renderer,svg,state}=setup();state.phase='build';state.hand=[];
  const tile={q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[null]};state.map.set('1,0',tile);
  const hints=()=>svg.children[2].children.filter(p=>p.attributes['data-slot-hint']);
  renderer.render(state);assert.equal(hints().length,1);state.showSlotHints=false;renderer.render(state);assert.equal(hints().length,0);
  state.showSlotHints=true;tile.towers[0]={type:'archer'};renderer.render(state);assert.equal(hints().length,0);
});
test('grid and building highlights toggle independently and building hover emits commands',()=>{
  const {renderer,svg,calls,state}=setup();
  state.map.set('1,0',{q:1,r:0,type:'village',rotation:0,roads:[0,2],slots:0,towers:[],buildingSlots:1,buildings:[{type:'forge'}]});
  state.selectedBuilding={q:1,r:0,index:0};state.showHexGrid=true;renderer.render(state);
  const overlays=kind=>svg.children[3].children.filter(p=>p.attributes['data-overlay']===kind);
  assert.ok(overlays('grid').length>0);assert.equal(overlays('building').length,2);
  const slot=svg.children[2].children.find(p=>p.listeners.pointerenter&&p.listeners.pointerleave);
  slot.listeners.pointerenter();slot.listeners.pointerleave();
  assert.equal(calls[0][0],'hoverBuilding');assert.deepEqual(JSON.parse(JSON.stringify(calls[0][1])),{q:1,r:0,index:0});assert.deepEqual(calls[1],['hoverBuilding',null]);
  state.showHexGrid=false;renderer.render(state);assert.equal(overlays('grid').length,0);assert.equal(overlays('building').length,2);
  state.selectedBuilding=null;renderer.render(state);assert.equal(overlays('building').length,0);
});
function setup(){
  function element(){return {attributes:{},style:{},children:[],listeners:{},textContent:'',set innerHTML(value){this.children=[];},setAttribute(name,value){this.attributes[name]=value;},appendChild(child){this.children.push(child);child.parent=this;},addEventListener(name,fn){this.listeners[name]=fn;},removeEventListener(name,fn){if(this.listeners[name]===fn) delete this.listeners[name];},remove(){this.parent.children=this.parent.children.filter(child=>child!==this);}};}
  const context={document:{createElementNS:element}};
  for(const file of ['biomes.js','data.js','map.js','buildings.js','exploration.js','camera.js','svg-renderer.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../'+file),'utf8'),context);
  vm.runInNewContext('globalThis.adapter=HexSvgRenderer;',context);
  const svg=element(),calls=[],commands={};for(const name of ['placeTile','selectSlot','selectTower','selectBuilding','clearSelection','hoverPlacement','leavePlacement','hoverBuilding']) commands[name]=(...args)=>calls.push([name,...args]);
  const renderer=context.adapter.create(svg,commands),state={map:new Map([['0,0',{q:0,r:0,type:'base',roads:[0],slots:0,towers:[],income:0}]]),landmarks:new Map(),phase:'place',waveRunning:false,hand:['straight'],selectedCard:0,rotation:0,hoveredPlacement:null,selectedSlot:null,selectedTower:null,selectedBuilding:null,previewTower:null,hp:20,gold:70,enemies:[],projectiles:[]};
  return {renderer,svg,calls,state};
}
test('rendering and picking do not mutate frozen gameplay state and emit logical actions',()=>{
  const {renderer,svg,calls,state}=setup();Object.freeze(state);Object.freeze(state.map.get('0,0'));renderer.render(state,[{q:1,r:0,legal:true}]);
  const hit=svg.children[1].children.find(child=>child.listeners.pointerenter);assert.ok(hit);
  hit.listeners.pointerenter();hit.listeners.pointerleave();hit.listeners.click();svg.listeners.click();
  assert.deepEqual(calls,[['hoverPlacement','1,0'],['leavePlacement','1,0'],['placeTile',1,0],['clearSelection']]);assert.equal(state.hoveredPlacement,null);assert.equal(state.map.size,1);
});
test('renderer reset rebuilds objects for a new run and destroy releases its layers',()=>{
  const {renderer,svg,state}=setup();renderer.render(state);const old=svg.children[2].children[0];renderer.reset();renderer.render(state);assert.notEqual(svg.children[2].children[0],old);
  renderer.destroy();assert.equal(svg.children.length,0);assert.equal(svg.listeners.click,undefined);
});
test('projection hides SVG details behind local screen coordinates',()=>{
  const {renderer,svg}=setup();assert.equal(renderer.project({x:10,y:20}),null);
  svg.getScreenCTM=()=>({});svg.createSVGPoint=()=>({matrixTransform(){return {x:this.x*2+100,y:this.y*2+200};}});svg.parentElement={getBoundingClientRect:()=>({left:100,top:200,width:900,height:600})};
  const screen=renderer.project({x:10,y:20});assert.equal(screen.x,20);assert.equal(screen.y,40);assert.equal(screen.width,900);assert.equal(screen.height,600);
});
test('renderer owns camera reset and releases camera listeners',()=>{
  const {renderer,svg}=setup();renderer.zoom(.5);assert.equal(renderer.getView().w,550);renderer.reset();assert.equal(renderer.getView().w,1100);assert.equal(svg.attributes.viewBox,'-545 -375 1100 760');
  renderer.destroy();assert.equal(Object.keys(svg.listeners).length,0);
});



test('rotate hint belongs to the hover-only placement preview',()=>{
  const {renderer,svg,state}=setup();renderer.render(state,[{q:1,r:0,legal:true}]);const preview=svg.children[1].children.find(child=>child.children.some(text=>text.textContent==='R / Mausrad-Klick · Drehen'));assert.ok(preview);assert.equal(preview.style.display,'none');const hit=svg.children[1].children.find(child=>child.listeners.pointerenter);hit.listeners.pointerenter();assert.equal(preview.style.display,'');hit.listeners.pointerleave();assert.equal(preview.style.display,'none');
});
