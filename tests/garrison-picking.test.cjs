const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),core=require('../headless-core.cjs');
test('3D picking exposes every prebuilt garrison slot even when the tower array is empty',async()=>{
 const THREE=await import('three');
 const c=core(),{state}=c.runtime.create({seed:'garrison-picks',runId:'g',challengeDay:'2026-09-23',loadout:['archer','catapult','chain','freeze','mine']});assert.equal(state.challengeKind,'garrison');
 const material=new THREE.MeshBasicMaterial(),geometry=new THREE.BoxGeometry(1,1,1);
 const ctx={THREE,state,key:c.map.key,slotPositions:c.map.slotPositions,objectRecords:new Map(),layer:{objects:new THREE.Group()},objectSig:JSON.stringify,slotDiamondGeometry:geometry,slotPick:geometry,buildingPick:geometry,invisible:material,mats:{slot:material},slotLift:()=>0,pickDirty:false};
 const source=fs.readFileSync(require.resolve('../classes/three-renderer.js'),'utf8'),start=source.indexOf('  function syncObjects(){'),end=source.indexOf('  // ---- Platzierung:',start);
 vm.runInNewContext(source.slice(start,end)+'\nsyncObjects();',ctx);
 for(const tile of state.map.values()){
  const slots=ctx.objectRecords.get(c.map.key(tile.q,tile.r)).picks.filter(p=>p.userData.pick.kind==='slot');
  assert.equal(slots.length,tile.slots);for(const [index,pick] of slots.entries())assert.equal(pick.userData.pick.index,index);
 }
});

test('3D touch input previews a target before placement and never places after a pinch',()=>{
 const c=core(),events={},actions=[],zooms=[],state={phase:'place',hoveredPlacement:null},dom={style:{},addEventListener:(name,fn)=>events[name]=fn,setPointerCapture(){}};
 const ctx={dom,state,key:c.map.key,commands:{hoverPlacement(id){state.hoveredPlacement=id;},leavePlacement(){},placeTile(q,r){actions.push([q,r]);},hoverBuilding(){}},zoom:(factor)=>zooms.push(factor),setRay(){},ray:{intersectObjects:()=>[{object:{userData:{pick:{kind:'target',q:1,r:0,legal:true}}}}]},pickables:[],hoverPick:null,render(){},ready:true,targetList:[],groundPoint:e=>({x:e.clientX,z:e.clientY}),cam:{x:0,z:0},applyCamera(){}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../classes/camera.js'),'utf8'),ctx);
 const source=fs.readFileSync(require.resolve('../classes/three-renderer.js'),'utf8'),start=source.indexOf('  // ---- Eingabe ----'),end=source.indexOf('  const resize=',start);vm.runInContext(source.slice(start,end),ctx);
 const touch=(id,x)=>({pointerType:'touch',pointerId:id,button:0,buttons:1,clientX:x,clientY:0,preventDefault(){}});
 events.pointerdown(touch(1,10));events.pointerup(touch(1,10));assert.equal(actions.length,0);assert.equal(state.hoveredPlacement,'1,0');
 events.pointerdown(touch(1,10));events.pointerup(touch(1,10));assert.deepEqual(actions,[[1,0]]);
 events.pointerdown(touch(1,0));events.pointerdown(touch(2,100));events.pointermove(touch(2,200));events.pointerup(touch(2,200));events.pointerup(touch(1,0));assert.equal(zooms[0],.5);assert.equal(actions.length,1);
});

test('revealed event hexes share terrain depth before connection while fog stays in the background',async()=>{
 const THREE=await import('three'),c=core(),scene=new THREE.Scene(),landmark={q:2,r:0,type:'treasure',claimed:false,prefab:{type:'straight',rotation:0,roads:[0,3],slots:1}};
 let visibility='fog';const ctx={THREE,scene,gl:{},state:{map:new Map(),landmarks:new Map([['2,0',landmark]])},landmarkRecords:new Map(),key:c.map.key,axialToWorld:c.map.axialToWorld,HexMap:c.map,HexExploration:{visibility:()=>visibility,treasureReward:()=>25},HexModelMap:{modelFor:()=>({name:'straight'}),propAngle:()=>0},buildTile:()=>new THREE.Group(),label(){},LANDMARK_LABEL:{}};
 const source=fs.readFileSync(require.resolve('../classes/three-renderer.js'),'utf8');vm.createContext(ctx);
 vm.runInContext(source.slice(source.indexOf('  const layer={'),source.indexOf('  let state,targetList=')),ctx);
 const start=source.indexOf('  function syncLandmarks(){'),end=source.indexOf('  function syncEmpty(){',start);
 vm.runInContext(source.slice(start,end)+'\nsyncLandmarks();',ctx);
 const fog=ctx.landmarkRecords.get('2,0').holder;assert.equal(fog.parent.parent,vm.runInContext('backgroundScene',ctx));
 visibility='clear';vm.runInContext('syncLandmarks();',ctx);const revealed=ctx.landmarkRecords.get('2,0').holder;
 assert.equal(fog.parent,null);assert.equal(revealed.parent.parent,scene);assert.equal(revealed.parent,vm.runInContext('layer.landmarks',ctx));
 landmark.claimed=true;vm.runInContext('syncLandmarks();',ctx);assert.equal(revealed.parent,null);assert.equal(ctx.landmarkRecords.size,0);
});
