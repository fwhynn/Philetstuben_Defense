const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function load(){const context={};for(const file of ['map.js','camera.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../'+file),'utf8'),context);vm.runInNewContext('globalThis.map=HexMap;globalThis.camera=HexCamera;globalThis.svgCamera=HexSvgCamera;',context);return context;}
test('world origin is independent of camera and routes use world positions',()=>{
  const {map,camera}=load(),origin=map.axialToWorld(0,0);assert.equal(origin.x,0);assert.equal(origin.y,0);
  const tiles=new Map([['0,0',{q:0,r:0,type:'base',roads:[0]}],['1,0',{q:1,r:0,type:'straight',roads:[0,3]}]]),routes=map.routeGraph(tiles),before=JSON.stringify([...routes.geometry]);
  const view=camera.create();view.zoom(.5);view.pan(200,-300);assert.equal(JSON.stringify([...map.routeGraph(tiles).geometry]),before);
  assert.ok(Math.abs(routes.distances.get('1,0')-54*Math.sqrt(3))<1e-8);assert.equal(routes.geometry.get('0,0').hub.x,0);assert.equal(routes.geometry.get('0,0').hub.y,0);
});
test('zoom keeps the chosen world point at the same relative screen position',()=>{
  const {camera}=load(),model=camera.create(),before=model.getView(),anchor={x:230,y:-100};model.zoom(.7,anchor);const after=model.getView();
  assert.ok(Math.abs((anchor.x-before.x)/before.w-(anchor.x-after.x)/after.w)<1e-12);assert.ok(Math.abs((anchor.y-before.y)/before.h-(anchor.y-after.y)/after.h)<1e-12);
});
test('camera clamps zoom, preserves aspect ratio, returns copies and resets pan',()=>{
  const {camera}=load(),model=camera.create(),initial=model.getView();const external=model.getView();external.x=999;assert.equal(model.getView().x,initial.x);
  model.zoom(.000001);assert.equal(model.getView().w,330);assert.ok(Math.abs(model.getView().h/model.getView().w-initial.h/initial.w)<1e-12);
  model.zoom(1000000);assert.equal(model.getView().w,11000);const before=JSON.stringify(model.getView());model.zoom(-1);assert.equal(JSON.stringify(model.getView()),before);
  model.pan(123,-456);model.reset();assert.equal(JSON.stringify(model.getView()),JSON.stringify(initial));
});
test('SVG camera owns its input listeners and reports view changes',()=>{
  const {svgCamera}=load(),listeners={},board={style:{},attributes:{},addEventListener(name,fn){listeners[name]=fn;},removeEventListener(name,fn){if(listeners[name]===fn) delete listeners[name];},setAttribute(name,value){this.attributes[name]=value;},getScreenCTM(){return {inverse(){return {};}};},createSVGPoint(){return {matrixTransform(){return {x:this.x,y:this.y};}};}};let changes=0;
  const camera=svgCamera.create(board,()=>changes++);assert.equal(changes,0);assert.equal(board.attributes.viewBox,'-545 -375 1100 760');
  listeners.wheel({clientX:0,clientY:0,deltaY:-100,preventDefault(){}});assert.equal(changes,1);assert.ok(camera.getView().w<1100);
  camera.reset();assert.equal(changes,2);assert.equal(camera.getView().w,1100);camera.destroy();assert.equal(Object.keys(listeners).length,0);
});
