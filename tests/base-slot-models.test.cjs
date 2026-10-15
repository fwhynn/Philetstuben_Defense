const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');

// Base tower slots sit on the bastions of the weapon models: the game places the tower at
// slotOffsets('base'), the model must carry tower_slot_N at the same spot in both editions.
const IDENTITY=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function localMatrix(n){if(n.matrix)return n.matrix;const T=n.translation||[0,0,0],Q=n.rotation||[0,0,0,1],S=n.scale||[1,1,1];const [x,y,z,w]=Q;return [(1-2*(y*y+z*z))*S[0],2*(x*y+z*w)*S[0],2*(x*z-y*w)*S[0],0,2*(x*y-z*w)*S[1],(1-2*(x*x+z*z))*S[1],2*(y*z+x*w)*S[1],0,2*(x*z+y*w)*S[2],2*(y*z-x*w)*S[2],(1-2*(x*x+y*y))*S[2],0,T[0],T[1],T[2],1];}
function multiply(a,b){const o=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;}
/** tower_slot_N pivots in game world units (x east, y south), sorted by name. */
function modelSlots(file){
  const b=fs.readFileSync(file),jsonLength=b.readUInt32LE(12),gltf=JSON.parse(b.slice(20,20+jsonLength).toString()),slots=[];
  (function visit(index,parent){
    const node=gltf.nodes[index],world=multiply(parent,localMatrix(node));
    if(/^tower_slot_\d+$/.test(node.name||''))slots.push({name:node.name,x:world[12]*54,y:world[14]*54});
    (node.children||[]).forEach(child=>visit(child,world));
  })(gltf.scenes[gltf.scene||0].nodes[0],IDENTITY);
  return slots.sort((a,b)=>a.name.localeCompare(b.name));
}

test('base weapon models place their tower slots where the game builds base towers',()=>{
  const context={};vm.createContext(context);
  for(const file of ['data.js','map.js','heroes.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../classes',file),'utf8'),context);
  const {map,heroes}=vm.runInContext('({map:HexMap,heroes:HexHeroes})',context);
  for(const hero of ['standard','merchant','builder']){
    const state={heroId:hero,gold:9999,hp:20,maxHp:20,phase:'build',map:new Map([['0,0',{q:0,r:0,type:'base',slots:0,towers:[]}]])};
    heroes.initialize(state,hero);state.gold=9999;
    for(let level=1;heroes.buy(state,'weapon');level++){
      const count=state.map.get('0,0').slots,expected=map.slotOffsets('base',count);
      for(const folder of ['assets/bases','assets/sakura/bases']){
        const file=path.join(__dirname,'..',folder,`base_${hero}_weapon_${level}.glb`),slots=modelSlots(file);
        assert.equal(slots.length,count,file);
        slots.forEach((slot,i)=>{assert.ok(Math.hypot(slot.x-expected[i].x,slot.y-expected[i].y)<1,`${file} ${slot.name}`);});
      }
    }
    assert.equal(state.baseUpgrades.weapon,hero==='builder'?3:2);
  }
});

test('base towers stand on the model bastion and the grey placeholder only fills missing models',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../classes/three-renderer.js'),'utf8');
  const pick=(from,to)=>source.slice(source.indexOf(from),source.indexOf(to,source.indexOf(from)));
  const context={S:54,state:{heroId:'builder',baseUpgrades:{walls:0,weapon:2}},templates:new Map([['base_builder_weapon_1',{slotTops:[.32,.32]}]])};
  vm.createContext(context);
  vm.runInContext(pick('  function baseUpgradeParts(){','  function attachBaseUpgrades(')+pick('  function slotLift(','  function tileSpec('),context);
  const base={type:'base'};
  // Weapon 2 has no model here: the renderer falls back to level 1, which carries only two bastions.
  assert.ok(Math.abs(vm.runInContext('slotLift',context)(base,0)-.32*54)<1e-9);
  assert.equal(vm.runInContext('slotLift',context)(base,2),45);
  assert.equal(vm.runInContext('baseSlotTop',context)(2),null);
  context.templates.clear();
  assert.equal(vm.runInContext('slotLift',context)(base,0),45);
});

test('long road tower slots in code match the model in both editions',()=>{
  const context={};vm.createContext(context);
  for(const file of ['data.js','map.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../classes',file),'utf8'),context);
  const expected=vm.runInContext('HexMap',context).slotOffsets('longRoad',2);
  for(const folder of ['assets/tiles','assets/sakura/tiles']){
    const file=path.join(__dirname,'..',folder,'tile_longRoad.glb'),slots=modelSlots(file);
    assert.equal(slots.length,2,file);
    slots.forEach((slot,i)=>{assert.ok(Math.hypot(slot.x-expected[i].x,slot.y-expected[i].y)<1,`${file} ${slot.name}`);});
  }
});
