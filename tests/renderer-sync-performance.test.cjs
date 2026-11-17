const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../classes/three-renderer.js'),'utf8');
test('cached model signatures preserve every original field and in-place edit',()=>{
 let base='one';const begin=source.indexOf('  const objectSignatures='),end=source.indexOf('  function syncObjects()',begin);
 const signature=Function('baseUpgradeParts',source.slice(begin,end)+'return objectSig;')(()=>({key:base}));
 const reference=t=>JSON.stringify([t.type==='base'?base:'',t.slots,t.buildingSlots,t.type,t.rotation,(t.towers||[]).map(t=>t&&[t.type,t.branch,t.finalUpgrade,t.ultimate,t.level,t.tileType,t.supportRange,t.rangeFactor,t.biome]),(t.buildings||[]).map(b=>b&&b.type)]);
 const tile={type:'base',slots:2,buildingSlots:1,rotation:0,towers:[{type:'archer'},null],buildings:[{type:'forge'}]};
 const check=()=>{assert.equal(signature(tile),reference(tile));assert.equal(signature(tile),reference(tile));};check();base='two';check();
 for(const field of ['type','branch','finalUpgrade','ultimate','level','tileType','supportRange','rangeFactor','biome']){tile.towers[0][field]='changed';check();delete tile.towers[0][field];check();}
 for(const field of ['slots','buildingSlots','type','rotation']){tile[field]='changed';check();}
 tile.buildings[0].type='market';check();tile.buildings.push(null);check();tile.towers.reverse();check();tile.towers=[];check();
});
test('landmark visibility is computed once per render and refreshed for map edits and reveals',()=>{
 const core=require('../headless-core.cjs')(),map=new Map([['0,0',{q:0,r:0}]]),landmark={q:4,r:0};let calls=0;
 const context={state:{map},HexExploration:{visibility(m,p){calls++;return core.exploration.visibility(m,p);}}};
 const begin=source.indexOf('  let landmarkVisibilityCache='),end=source.indexOf('  function clearOverlays()',begin);
 vm.runInNewContext(source.slice(begin,end)+';globalThis.visible=landmarkVisibility;globalThis.reset=()=>landmarkVisibilityCache=new WeakMap();',context);
 assert.equal(context.visible(landmark),'fog');context.visible(landmark);context.visible(landmark);assert.equal(calls,1);
 map.set('3,0',{q:3,r:0});context.reset();assert.equal(context.visible(landmark),'clear');assert.equal(calls,2);
 map.clear();map.set('20,0',{q:20,r:0});context.reset();assert.equal(context.visible(landmark),'hidden');
 landmark.relicId='relic';landmark.relicLocated=true;context.reset();assert.equal(context.visible(landmark),'fog');
 const landmarks=new Map([['4,0',landmark]]),direct=core.exploration.gridCells(map,landmarks),cached=core.exploration.gridCells(map,landmarks,context.visible);
 assert.equal(JSON.stringify(cached),JSON.stringify(direct));
 assert.match(source,/targetList=placementTargets;if\(!ready\) return;\s*landmarkVisibilityCache=new WeakMap\(\);/);
});
