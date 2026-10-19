const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
test('all six enemies ship real GLB geometry, articulated joints and looping walk animations',async()=>{
  const THREE=await import('three'),{GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
  const {MODEL_ENEMIES,isEnemyJoint}=await import('../classes/enemy-motion.mjs');
  const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'classes/model-map.js'),'utf8')+';globalThis.models=HexModelMap.ALL_MODELS;',ctx);
  for(const type of MODEL_ENEMIES){
    assert.ok(ctx.models.enemies.includes(type),type+' registered');
    const b=fs.readFileSync(path.join(root,'assets/enemies/enemy_'+type+'.glb'));
    const json=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());assert.equal(json.images,undefined,type+' has no PNG billboards');
    const {scene,animations}=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
    const joints=[],meshes=[];scene.traverse(n=>{if(isEnemyJoint(n.name))joints.push(n);if(n.isMesh)meshes.push(n);});
    assert.ok(joints.length>=4,type+' joints');assert.ok(meshes.length>=10,type+' volumetric parts');
    scene.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(scene),size=box.getSize(new THREE.Vector3());
    assert.ok(size.x>.1&&size.y>.1&&size.z>.1,type+' volume');assert.ok(Math.max(size.x,size.y,size.z)<.55,type+' game scale');assert.ok(box.min.y>-.02,type+' on ground');
    for(const m of meshes){const p=m.geometry.attributes.position;assert.ok([...p.array].every(Number.isFinite));}
    const walk=animations.find(a=>a.name==='Walk');assert.ok(walk,type+' walk clip');
    const mixer=new THREE.AnimationMixer(scene),action=mixer.clipAction(walk);action.play();mixer.setTime(0);
    const pose=()=>joints.flatMap(n=>[...n.position,...n.quaternion,...n.scale]);const start=pose();mixer.setTime(.25);assert.notDeepEqual(pose(),start,type+' moving joints');mixer.setTime(1);
    pose().forEach((v,i)=>assert.ok(Math.abs(v-start[i])<1e-5,type+' seamless loop'));
    for(const [t,clip] of [['thornToad','Jump'],['maskRunner','Sprint'],['ramBeetle','Charge']])if(t===type)assert.ok(animations.some(a=>a.name===clip));
  }
});
test('ability poses show lost shield, molted armor, crouch, leap and charge without changing gameplay state',async()=>{
  const {enemyPose}=await import('../classes/enemy-motion.mjs');
  assert.equal(enemyPose('shieldbearer','rig_shield',0,{shieldHits:0}).visible,false);
  assert.equal(enemyPose('shieldbearer','rig_shield',0,{shieldHits:3}).visible,true);
  for(const hits of [0,1,2,3]){const visible=[1,2,3].filter(stage=>enemyPose('shieldbearer','rig_shield_'+stage,0,{shieldHits:hits}).visible);assert.deepEqual(visible,hits?[hits]:[]);}
  assert.equal(enemyPose('moltingBeetle','rig_shell_l',0,{molted:true}).visible,false);
  assert.equal(enemyPose('moltingBeetle','rig_shell_r',0,{molted:false}).visible,true);
  assert.ok(enemyPose('thornToad','rig_body',0,{crouching:true}).sy<1);
  assert.ok(enemyPose('thornToad','rig_body',0,{leaping:true}).y>0);
  assert.ok(enemyPose('ramBeetle','rig_body',0,{charge:1}).rz<0);
  const a=enemyPose('ramBeetle','rig_leg_l0',1),b=enemyPose('ramBeetle','rig_leg_r0',1);assert.ok(a.ry*b.ry<0,'alternating tripod gait');
});
test('3D renderer loads models and shares their pose implementation instead of creating enemy sprites',()=>{
  const source=fs.readFileSync(path.join(root,'classes/three-renderer.js'),'utf8');
  assert.ok(source.includes("from './enemy-motion.mjs'"));assert.ok(source.includes('isEnemyJoint(n.name)'));assert.ok(source.includes('applyEnemyPose(limb.g,limb.base'));
  assert.equal(source.includes('new THREE.Sprite('),false);
});
