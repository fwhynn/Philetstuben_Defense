const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
// Pflicht-Gelenke laut docs/ASSET_SPEC.md 6.4; das Spiel posiert sie selbst, eingebettete Animationen werden nicht genutzt.
const LEGS=n=>['l','r'].flatMap(side=>Array.from({length:n},(_,i)=>`rig_leg_${side}${i}`));
const REQUIRED_JOINTS={
  shieldbearer:['rig_body','rig_leg_l','rig_leg_r','rig_arm_l','rig_arm_r','rig_shield_1','rig_shield_2','rig_shield_3'],
  thornToad:['rig_body',...LEGS(2)],
  moltingBeetle:['rig_body',...LEGS(3),'rig_shell_l','rig_shell_r'],
  tarSnail:['rig_body','rig_shell','rig_antenna_l','rig_antenna_r'],
  mushroomColossus:['rig_body','rig_leg_l','rig_leg_r','rig_arm_l','rig_arm_r'],
  ramBeetle:['rig_body',...LEGS(3)]
};
test('all six enemies ship real GLB geometry with the spec joints in every edition',async()=>{
  const THREE=await import('three'),{GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
  const {MODEL_ENEMIES,isEnemyJoint}=await import('../classes/enemy-motion.mjs');
  const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'classes/model-map.js'),'utf8')+';globalThis.models=HexModelMap.ALL_MODELS;',ctx);
  assert.deepEqual(Object.keys(REQUIRED_JOINTS).sort(),[...MODEL_ENEMIES].sort());
  for(const type of MODEL_ENEMIES)for(const folder of ['assets/enemies','assets/sakura/enemies','assets/halloween/enemies']){
    assert.ok(ctx.models.enemies.includes(type),type+' registered');
    const file=path.join(root,folder,'enemy_'+type+'.glb'),label=folder+'/'+type;
    if(folder!=='assets/enemies'&&!fs.existsSync(file))continue;
    const b=fs.readFileSync(file);
    const json=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());assert.equal(json.images,undefined,label+' has no PNG billboards');
    const {scene}=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
    const joints=[],meshes=[];scene.traverse(n=>{if(isEnemyJoint(n.name))joints.push(n);if(n.isMesh)meshes.push(n);});
    assert.deepEqual(joints.map(n=>n.name).sort(),[...REQUIRED_JOINTS[type]].sort(),label+' joints');
    for(const joint of joints){for(let p=joint.parent;p;p=p.parent)assert.ok(!isEnemyJoint(p.name),label+' '+joint.name+' nested in '+p.name);let parts=0;joint.traverse(n=>{if(n.isMesh)parts++;});assert.ok(parts>0,label+' '+joint.name+' has geometry');}
    assert.ok(meshes.length>=10,label+' volumetric parts');
    scene.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(scene),size=box.getSize(new THREE.Vector3());
    assert.ok(size.x>.1&&size.y>.1&&size.z>.1,label+' volume');assert.ok(Math.max(size.x,size.y,size.z)<.55,label+' game scale');assert.ok(box.min.y>-.02,label+' on ground');
    for(const m of meshes){const p=m.geometry.attributes.position;assert.ok([...p.array].every(Number.isFinite));}
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
