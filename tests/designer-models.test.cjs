const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');

// Abnahme der Designer-Lieferungen (docs/ASSET_SPEC.md, Abschnitte 0, 3.5, 5 und 6).
const root=path.join(__dirname,'..'),EDITIONS=['','sakura/','halloween/'];
function context(files){const c={};vm.createContext(c);for(const f of files)vm.runInContext(fs.readFileSync(path.join(root,'classes',f),'utf8'),c);return c;}
async function loadScene(file){
  const THREE=await import('three'),{GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
  const b=fs.readFileSync(file),{scene}=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
  scene.updateMatrixWorld(true);return {THREE,scene};
}

test('ultimate towers and boss identities are registered and ship in every edition',()=>{
  const {ULTIMATE_MODELS,ALL_MODELS}=vm.runInContext('HexModelMap',context(['model-map.js']));
  assert.equal(ULTIMATE_MODELS.length,19);
  assert.ok(ULTIMATE_MODELS.includes('flame_sunfire_ultimate')&&ULTIMATE_MODELS.includes('element_elementTempest_ultimate'));
  for(const id of ULTIMATE_MODELS)assert.ok(ALL_MODELS.towers.includes(id),id);
  for(const kind of ['iron','hunter','summoner'])assert.ok(ALL_MODELS.enemies.includes('boss_'+kind));
  for(const edition of EDITIONS){
    for(const id of ULTIMATE_MODELS)assert.ok(fs.existsSync(path.join(root,'assets',edition+'towers/tower_'+id+'.glb')),edition+id);
    for(const kind of ['iron','hunter','summoner'])assert.ok(fs.existsSync(path.join(root,'assets',edition+'enemies/enemy_boss_'+kind+'.glb')),edition+kind);
  }
});

test('ultimate tower models turn like towers and keep the tower size limits',async()=>{
  const {ULTIMATE_MODELS}=vm.runInContext('HexModelMap',context(['model-map.js']));
  for(const edition of EDITIONS)for(const id of ULTIMATE_MODELS){
    const label=edition+id,{THREE,scene}=await loadScene(path.join(root,'assets',edition+'towers/tower_'+id+'.glb'));
    assert.ok(scene.getObjectByName('turret'),label+' turret');
    const box=new THREE.Box3().setFromObject(scene);
    assert.ok(box.min.y>-.02,label+' on ground');assert.ok(box.max.y<=(id.startsWith('ballista_')?.9:.66),label+' height '+box.max.y.toFixed(2));
    assert.ok(Math.max(box.max.x,-box.min.x,box.max.z,-box.min.z)<=.36,label+' footprint');   // wie die Endstufen (Sakura-Adlerauge 0,34)
  }
});

test('boss identity models walk like the standard boss',async()=>{
  for(const edition of EDITIONS)for(const kind of ['iron','hunter','summoner']){
    const label=edition+kind,{THREE,scene}=await loadScene(path.join(root,'assets',edition+'enemies/enemy_boss_'+kind+'.glb'));
    for(const limb of ['leg_l','leg_r','arm_l','arm_r'])assert.ok(scene.getObjectByName(limb),label+' '+limb);
    const box=new THREE.Box3().setFromObject(scene);assert.ok(box.max.y>.5&&box.max.y<.8,label+' boss height');
  }
});

test('own boss model keeps only the biome accents, not the generic identity parts',async()=>{
  const {bossDetails}=await import('../classes/model-details.mjs');
  for(const [kind,marker] of [['iron','iron-shoulder'],['hunter','hunter-horn'],['summoner','soul-mantle']]){
    const g=bossDetails(kind,'storm',.6,{identity:false});
    assert.equal(g.getObjectByName(marker),undefined,kind);assert.ok(g.getObjectByName('biome-storm'),kind);
  }
  const source=fs.readFileSync(path.join(root,'classes/three-renderer.js'),'utf8');
  assert.match(source,/_ultimate`,'tower'\)/);assert.match(source,/templates\.get\('enemy_boss_'\+e\.bossKind\)/);
});

test('tile models put their tower slots where the game builds towers, in every edition',async()=>{
  const c=context(['data.js','map.js','model-map.js']),{HexData,HexMap,HexModelMap}=vm.runInContext('({HexData,HexMap,HexModelMap})',c);
  for(const type of [...HexModelMap.TILE_MODELS,...HexModelMap.NAMED_TILES]){
    const card=HexData.CARD_LIBRARY[type],expected=HexMap.slotOffsets(type,card.slots||0);
    for(const edition of EDITIONS){
      const label=edition+type,{THREE,scene}=await loadScene(path.join(root,'assets',edition+'tiles/tile_'+type+'.glb')),slots=[];
      scene.traverse(n=>{if(/^tower_slot_\d+$/.test(n.name)){const center=new THREE.Box3().setFromObject(n).getCenter(new THREE.Vector3());slots.push({name:n.name,x:center.x*54,y:center.z*54});}});
      slots.sort((a,b)=>a.name.localeCompare(b.name));
      assert.equal(slots.length,expected.length,label+' slot count');
      slots.forEach((slot,i)=>assert.ok(Math.hypot(slot.x-expected[i].x,slot.y-expected[i].y)<3.5,`${label} ${slot.name}`));
    }
  }
});
