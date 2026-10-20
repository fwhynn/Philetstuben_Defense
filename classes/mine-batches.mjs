// One draw call per model part instead of one per part per mine.
// Geometry/materials supplied by the asset loader remain owned by that loader.
export class MineBatches {
  constructor(THREE, parent, scale=54) { Object.assign(this,{THREE,parent,scale,meshes:[],capacity:0,slots:[],slotByMine:new Map()}); }
  clear() {
    for(const mesh of this.meshes){this.parent.remove(mesh);mesh.dispose();}
    if(this.owned){this.owned.geometry.dispose();this.owned.material.dispose();}
    this.owned=null;this.meshes=[];this.capacity=0;this.array=null;this.length=-1;this.slots=[];this.slotByMine.clear();
  }
  sync(mines, model) {
    if(this.array===mines&&this.length===mines.length&&this.model===model)return;
    const T=this.THREE;
    if(this.model!==model||mines.length>this.capacity){
      this.clear();this.model=model;this.capacity=Math.max(64,2**Math.ceil(Math.log2(Math.max(1,mines.length))));
      let parts=model?.parts;
      if(!parts){this.owned={geometry:new T.CylinderGeometry(7,7,3,10),material:new T.MeshStandardMaterial({color:'#ffffff',metalness:.25})};parts=[this.owned];}
      for(const part of parts){const mesh=new T.InstancedMesh(part.geometry,part.material,this.capacity);mesh.castShadow=true;mesh.receiveShadow=true;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.parent.add(mesh);this.meshes.push(mesh);}
    }
    const changed=new Set();
    // Appending is the usual case. Removal swaps only the last visible instance
    // into the vacated slot; simulation order and mine identities are untouched.
    if(this.array!==mines||mines.length<this.length){
      const alive=new Set(mines);
      for(let i=this.slots.length-1;i>=0;i--)if(!alive.has(this.slots[i])){
        this.slotByMine.delete(this.slots[i]);const last=this.slots.pop();
        if(i<this.slots.length){this.slots[i]=last;this.slotByMine.set(last,i);changed.add(i);}
      }
    }
    const appendOnly=this.array===mines&&mines.length>=this.length;
    for(let i=appendOnly?Math.max(0,this.length):0;i<mines.length;i++)if(!this.slotByMine.has(mines[i])){
      const slot=this.slots.length;this.slots.push(mines[i]);this.slotByMine.set(mines[i],slot);changed.add(slot);
    }
    const matrix=new T.Matrix4(),scale=model?this.scale:1,color=new T.Color(),sphere=new T.Sphere();
    for(const mesh of this.meshes){
      mesh.count=this.slots.length;let wrote=false;
      if(!mesh.geometry.boundingSphere)mesh.geometry.computeBoundingSphere();
      mesh.boundingSphere??=new T.Sphere().makeEmpty();
      for(const i of changed){
        if(i>=this.slots.length)continue;const mine=this.slots[i];
        matrix.makeScale(scale,scale,scale);matrix.setPosition(mine.x,model?0:2,mine.y);mesh.setMatrixAt(i,matrix);mesh.instanceMatrix.addUpdateRange(i*16,16);
        if(!model){mesh.setColorAt(i,color.set(mine.color||'#e6a75f'));mesh.instanceColor.addUpdateRange(i*3,3);}
        // Conservative bounds stay valid on removals, expand only for changed
        // instances. Avoid rescanning thousands of matrices for each new mine.
        sphere.copy(mesh.geometry.boundingSphere).applyMatrix4(matrix);mesh.boundingSphere.union(sphere);wrote=true;
      }
      if(wrote){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
    }
    this.array=mines;this.length=mines.length;this.model=model;
  }
}
