const {test}=require('node:test'),assert=require('node:assert/strict');
test('thousands of mines share model parts, preserve transforms and only update after changes',async()=>{
  const T=await import('three'),{MineBatches}=await import('../classes/mine-batches.mjs');
  const parent=new T.Group(),batch=new MineBatches(T,parent),geometry=new T.BoxGeometry(),material=new T.MeshStandardMaterial();
  const model={parts:[{geometry,material},{geometry,material}]};
  const mines=Array.from({length:5000},(_,id)=>({id,x:id-2500,y:id%11}));
  batch.sync(mines,model);assert.equal(parent.children.length,2);
  const mesh=parent.children[0],matrix=new T.Matrix4();assert.equal(mesh.count,5000);mesh.getMatrixAt(4999,matrix);
  assert.equal(matrix.elements[12],2499);assert.equal(matrix.elements[14],4999%11);assert.equal(matrix.elements[0],54);
  const version=mesh.instanceMatrix.version;batch.sync(mines,model);assert.equal(mesh.instanceMatrix.version,version);
  mesh.instanceMatrix.clearUpdateRanges();
  mines.push({id:5000,x:-4,y:7});batch.sync(mines,model);assert.equal(mesh.count,5001);
  assert.deepEqual(mesh.instanceMatrix.updateRanges,[{start:5000*16,count:16}]);
  mesh.instanceMatrix.clearUpdateRanges();
  batch.sync(mines.slice(1),model);mesh.getMatrixAt(0,matrix);assert.equal(matrix.elements[12],-4);
  assert.deepEqual(mesh.instanceMatrix.updateRanges,[{start:0,count:16}]);
  for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);assert.ok(mesh.boundingSphere.containsPoint(new T.Vector3().setFromMatrixPosition(matrix)));}
  batch.sync([],model);assert.equal(mesh.count,0);
  const many=Array.from({length:9000},(_,i)=>({x:i,y:0}));
  batch.sync(many,model);assert.notEqual(parent.children[0],mesh);assert.equal(parent.children.length,2);assert.equal(parent.children[0].count,9000);
  batch.sync(many,{parts:[{geometry,material}]});assert.equal(parent.children.length,1);assert.equal(parent.children[0].count,9000);
  let disposed=false;geometry.addEventListener('dispose',()=>disposed=true);batch.clear();assert.equal(parent.children.length,0);assert.equal(disposed,false);
  batch.sync([{x:2,y:3,color:'#ff0000'}]);const fallback=parent.children[0];fallback.getMatrixAt(0,matrix);assert.equal(matrix.elements[13],2);
  const color=new T.Color();fallback.getColorAt(0,color);assert.equal(color.getHexString(),'ff0000');
  batch.clear();geometry.dispose();material.dispose();
});
test('incremental removal preserves every remaining model position and conservative bounds',async()=>{
  const T=await import('three'),{MineBatches}=await import('../classes/mine-batches.mjs');
  const batch=new MineBatches(T,new T.Group()),geometry=new T.BoxGeometry(),material=new T.MeshStandardMaterial(),model={parts:[{geometry,material}]};
  let mines=Array.from({length:1000},(_,id)=>({x:id*2,y:-id}));
  const matrix=new T.Matrix4();
  for(let tick=0;tick<20;tick++){
    mines=mines.filter((_,i)=>(i+tick)%11!==0);mines.push({x:-tick-1,y:tick+1});
    batch.sync(mines,model);const mesh=batch.meshes[0],actual=[];
    for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);actual.push([matrix.elements[12],matrix.elements[14]]);assert.ok(mesh.boundingSphere.containsPoint(new T.Vector3().setFromMatrixPosition(matrix)));}
    assert.deepEqual(actual.sort((a,b)=>a[0]-b[0]),mines.map(m=>[m.x,m.y]).sort((a,b)=>a[0]-b[0]));
  }
  batch.clear();geometry.dispose();material.dispose();
});
