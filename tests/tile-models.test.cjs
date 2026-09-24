const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');

// Baked tile roads must leave the hex through the same edges as the card's roads, otherwise
// enemies walk where no road is drawn (e.g. Königsbogen once shipped a small instead of a big curve).
const IDENTITY=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function localMatrix(n){if(n.matrix)return n.matrix;const T=n.translation||[0,0,0],Q=n.rotation||[0,0,0,1],S=n.scale||[1,1,1];const [x,y,z,w]=Q;return [(1-2*(y*y+z*z))*S[0],2*(x*y+z*w)*S[0],2*(x*z-y*w)*S[0],0,2*(x*y-z*w)*S[1],(1-2*(x*x+z*z))*S[1],2*(y*z+x*w)*S[1],0,2*(x*z+y*w)*S[2],2*(y*z-x*w)*S[2],(1-2*(x*x+y*y))*S[2],0,T[0],T[1],T[2],1];}
function multiply(a,b){const o=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;}
/** Hex edges (0 = east, counter-clockwise, as in data.js) reached by vertices of the 'road' material. */
function bakedRoadEdges(file){
  const b=fs.readFileSync(file),jsonLength=b.readUInt32LE(12),gltf=JSON.parse(b.slice(20,20+jsonLength).toString()),bin=b.slice(20+jsonLength+8),edges=new Set();
  (function visit(index,parent){
    const node=gltf.nodes[index],world=multiply(parent,localMatrix(node));
    if(node.mesh!==undefined)for(const primitive of gltf.meshes[node.mesh].primitives){
      if(gltf.materials?.[primitive.material]?.name!=='road')continue;
      const accessor=gltf.accessors[primitive.attributes.POSITION],view=gltf.bufferViews[accessor.bufferView],stride=view.byteStride||12,offset=(view.byteOffset||0)+(accessor.byteOffset||0);
      for(let v=0;v<accessor.count;v++){
        const x=bin.readFloatLE(offset+v*stride),y=bin.readFloatLE(offset+v*stride+4),z=bin.readFloatLE(offset+v*stride+8);
        const X=world[0]*x+world[4]*y+world[8]*z+world[12],Z=world[2]*x+world[6]*y+world[10]*z+world[14];
        if(Math.hypot(X,Z)>=.82)edges.add(((Math.round(Math.atan2(-Z,X)/(Math.PI/3))%6)+6)%6);
      }
    }
    (node.children||[]).forEach(child=>visit(child,world));
  })(gltf.scenes[gltf.scene||0].nodes[0],IDENTITY);
  return [...edges].sort((a,b)=>a-b);
}

test('named tiles with baked roads match their card road edges',()=>{
  const context={};vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../classes/data.js'),'utf8')+';globalThis.HexData=HexData;',context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../classes/model-map.js'),'utf8')+';globalThis.HexModelMap=HexModelMap;',context);
  const {NAMED_TILES,PROCEDURAL_ROAD_TILES,TILE_MODELS}=context.HexModelMap;
  // Spezial-Tiles mit eigener Straße sowie Grundformen/Sonderfelder mit eigenem Modell und Kartendaten.
  const types=[...NAMED_TILES.filter(t=>!PROCEDURAL_ROAD_TILES.includes(t)),...TILE_MODELS.filter(t=>context.HexData.CARD_LIBRARY[t]?.roads)];
  for(const type of types){
    const expected=[...context.HexData.CARD_LIBRARY[type].roads].sort((a,b)=>a-b);
    // Normale Edition und, falls vorhanden, Sakura-Edition (assets/sakura/) müssen dieselben Straßen haben.
    for(const dir of ['../assets/tiles/','../assets/sakura/tiles/']){
      const file=path.join(__dirname,dir+'tile_'+type+'.glb');
      if(dir.includes('sakura')&&!fs.existsSync(file))continue;
      assert.deepEqual(bakedRoadEdges(file),expected,dir+type);
    }
  }
});
