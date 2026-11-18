const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('49 new stages ship with pivots, bounded geometry, icons and correct weapon direction in all editions',async()=>{
 const {models}=await import('../scripts/generate-new-tower-models.mjs'),T=await import('three'),{GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');assert.equal(models.length,49);
 for(const edition of ['','sakura/','halloween/'])for(const m of models){
  const file=path.join(__dirname,'../assets',edition,'towers/tower_'+m.id+'.glb'),buf=fs.readFileSync(file),gltf=await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'');gltf.scene.updateMatrixWorld(true);
  assert.ok(gltf.scene.getObjectByName('turret'));const bounds=new T.Box3().setFromObject(gltf.scene);assert.ok(bounds.min.y>=-.001&&bounds.max.y<.66,m.id);assert.ok(Math.max(bounds.max.x,-bounds.min.x,bounds.max.z,-bounds.min.z)<.36,m.id);
  let triangles=0;gltf.scene.traverse(n=>{if(n.isMesh)triangles+=(n.geometry.index?.count??n.geometry.attributes.position.count)/3;});assert.ok(triangles>50&&triangles<7000,m.id+' '+triangles);
  if(m.type==='laser'){let lens;gltf.scene.traverse(n=>{if(!lens&&n.name.startsWith('lens_glass'))lens=n;});assert.ok(lens.getWorldPosition(new T.Vector3()).x>.1,'barrels face +X like the renderer');}
 }
 for(const type of [...new Set(models.map(m=>m.type))])assert.ok(fs.existsSync(path.join(__dirname,'../assets/uidesign/towers/icon_tower_'+type+'.svg')));
});
