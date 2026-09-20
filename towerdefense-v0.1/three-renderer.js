/* Three.js-Adapter mit derselben Schnittstelle wie HexSvgRenderer. Liest den Spielzustand, meldet logische Aktionen an den Controller.
   Weltkoordinaten des Spiels (x, y) liegen auf der Bodenebene (x, z); Modelle haben Hexradius 1 und werden mit 54 skaliert. */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const S=54,STEP=Math.PI/3,TILT=55*Math.PI/180,PITCH_MIN=12*Math.PI/180,PITCH_MAX=88*Math.PI/180,DIST_MIN=220,DIST_MAX=3400,DIST_START=950,SKY='#a9cbd8';
const PREFIX={tiles:'tile',landmarks:'landmark',towers:'tower',enemies:'enemy',buildings:'building',effects:'mine'};
const LIMBS=['leg_l','leg_r','arm_l','arm_r'];
const LANDMARK_LABEL={shrine:'Shrine · Bonus unbekannt',boss:'Wächter · inaktiv',treasure:'Schatz +20 · ungesammelt'};
const STATUS_LABEL={ready:'☠ bereit',fighting:'☠ Kampf',defeated:'☠ besiegt',escaped:'☠ entkommen'};
const ENEMY_COLOR={boss:'#934f9e',armored:'#78818c',warded:'#477da4',swarm:'#b87832',normal:'#8d3c34'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/** Fasst alle Meshes unterhalb von root je Material zu einem Mesh zusammen (Koordinaten relativ zu root). */
function bake(root,skip){
  root.updateMatrixWorld(true);
  const inverse=new THREE.Matrix4().copy(root.matrixWorld).invert(),groups=new Map(),relative=new THREE.Matrix4();
  (function walk(node){
    if(skip&&skip(node)) return;
    if(node.isMesh){
      const geometry=node.geometry.index?node.geometry.toNonIndexed():node.geometry.clone();
      for(const name of Object.keys(geometry.attributes)) if(name!=='position'&&name!=='normal') geometry.deleteAttribute(name);
      geometry.applyMatrix4(relative.multiplyMatrices(inverse,node.matrixWorld));
      (groups.get(node.material)||groups.set(node.material,[]).get(node.material)).push(geometry);
    }
    node.children.forEach(walk);
  })(root);
  return [...groups].map(([material,geometries])=>({material,geometry:mergeGeometries(geometries,false)}));
}
function worldPosition(node){return node.getWorldPosition(new THREE.Vector3());}
function boundsOf(parts){const box=new THREE.Box3();for(const part of parts){part.geometry.computeBoundingBox();box.union(part.geometry.boundingBox);}return box;}

function makeTemplate(name,scene,kind){
  scene.updateMatrixWorld(true);
  const isSlot=n=>/^tower_slot_\d+$/.test(n.name),isPad=n=>n.name==='building_pad',template={name};
  if(kind==='enemies'){                                              // Gliedmaßen (optional) als eigene Teile für die Laufanimation
    const limbs=[];scene.traverse(n=>{if(LIMBS.includes(n.name)) limbs.push({name:n.name,pos:worldPosition(n),parts:bake(n)});});
    template.parts=bake(scene,n=>LIMBS.includes(n.name));template.limbs=limbs;
    template.height=boundsOf([...template.parts,...limbs.flatMap(l=>l.parts)]).max.y;
    return template;
  }
  if(kind==='towers'){
    const part=id=>{let node;scene.traverse(n=>{if(n.name===id&&!node) node=n;});return node?{pos:worldPosition(node),parts:bake(node)}:null;};
    template.turret=part('turret');template.aura=part('aura');template.parts=bake(scene,n=>n.name==='turret'||n.name==='aura');
    return template;
  }
  const slotNodes=[],padNodes=[];scene.traverse(n=>{if(isSlot(n)) slotNodes.push(n);else if(isPad(n)) padNodes.push(n);});
  const skip=n=>isSlot(n)||isPad(n);
  template.parts=bake(scene,skip);
  if(name==='tile_rescue'||name==='tile_base') template.noRoad=bake(scene,n=>skip(n)||n.name==='road');
  template.slots=slotNodes.sort((a,b)=>a.name.localeCompare(b.name)).map(n=>({pos:worldPosition(n),parts:bake(n)}));
  template.pad=padNodes[0]?{pos:worldPosition(padNodes[0]),parts:bake(padNodes[0])}:null;
  if(kind==='landmarks'&&name!=='landmark_boss'){                    // Deko separat, damit sie auf jede Straßenform passt
    // Hauptobjekt (Schatztruhe bzw. Shrine) plus nahe Kisten. Bezugspunkt ist die Mitte des Hauptobjekts, nicht die aller Deko,
    // sonst rutscht die Truhe bei weit verstreuten Kisten aus dem Hex. Weit entfernte Kisten (auf der anderen Straßenseite) entfallen.
    const root=scene.children[0]||scene,main=/^(shrine|treasure)/;
    const mainNode=root.children.find(n=>main.test(n.name)),mainCenter=mainNode?new THREE.Box3().setFromObject(mainNode).getCenter(new THREE.Vector3()):new THREE.Vector3();
    const near=n=>{const c=new THREE.Box3().setFromObject(n).getCenter(new THREE.Vector3());return Math.hypot(c.x-mainCenter.x,c.z-mainCenter.z)<=.45;};
    template.props=bake(root,n=>n.parent===root&&!(main.test(n.name)||(/^crate/.test(n.name)&&near(n))));
    template.propCenter=mainCenter;
  }
  return template;
}

function create(host0,commands){
    const {HEX,key,axialToWorld,slotPositions,buildingPosition,neighbor}=HexMap;
  const {CARD_LIBRARY}=HexData;
  // Qualität: 'high' oder 'low'. ?low bzw. ?high in der Adresse erzwingt eine Stufe; sonst gilt die zuletzt gespeicherte.
  // Bricht die Bildrate während einer Wave dauerhaft ein, schaltet der Renderer selbst auf 'low' (siehe loop).
  const readQuality=()=>{const q=new URLSearchParams(location.search);if(q.has('low')) return 'low';if(q.has('high')) return 'high';try{return localStorage.getItem('hexQuality')==='low'?'low':'high';}catch{return 'high';}};
  let quality=readQuality();
  const gl=new THREE.WebGLRenderer({antialias:quality==='high',powerPreference:'high-performance'});gl.setPixelRatio(quality==='high'?Math.min(devicePixelRatio||1,1.5):1);   // wirft ohne WebGL -> Controller fällt auf SVG zurück
  const wrap=host0.parentElement;wrap.classList.add('is3d');
  const hintText=wrap.querySelector('.mapControls span'),oldHint=hintText?.textContent;
  if(hintText) hintText.textContent='Mausrad: Zoom · links ziehen: verschieben · rechts ziehen: drehen und kippen';
  host0.style.display='none';
  const host=document.createElement('div');host.className='board3d';host.style.cssText='position:absolute;inset:0;touch-action:none;background:'+SKY;
  wrap.insertBefore(host,wrap.firstChild);
  const labelLayer=document.createElement('div');labelLayer.style.cssText='position:absolute;inset:0;overflow:hidden;pointer-events:none';
  const loading=document.createElement('div');loading.textContent='Lade 3D-Modelle …';loading.style.cssText='position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);padding:10px 16px;border-radius:10px;background:rgba(20,30,24,.85);color:#eee1c2;font:14px Inter,system-ui,sans-serif';
  const rotateHint=document.createElement('div');rotateHint.textContent='R / Mausrad-Klick · Drehen';rotateHint.style.cssText='position:absolute;display:none;transform:translate(-50%,0);padding:2px 9px;border-radius:6px;background:rgba(23,39,30,.95);border:1px solid #718a6c;color:#eee1c2;font:600 11px Inter,system-ui,sans-serif;pointer-events:none;white-space:nowrap';
  labelLayer.append(rotateHint);

  gl.shadowMap.enabled=true;gl.shadowMap.type=THREE.PCFShadowMap;gl.toneMapping=THREE.ACESFilmicToneMapping;
  host.append(gl.domElement,labelLayer,loading);
  const dom=gl.domElement,scene=new THREE.Scene();scene.background=new THREE.Color(SKY);scene.fog=new THREE.Fog(SKY,2600,6500);
  const camera=new THREE.PerspectiveCamera(35,1,20,12000);
  scene.add(new THREE.HemisphereLight('#dff0ff','#6b7a4c',1.15));
  const sun=new THREE.DirectionalLight('#fff1d0',2.5);sun.castShadow=true;sun.shadow.mapSize.set(quality==='high'?2048:1024,quality==='high'?2048:1024);sun.shadow.bias=-.0004;
  Object.assign(sun.shadow.camera,{left:-1100,right:1100,top:1100,bottom:-1100,near:100,far:3500});scene.add(sun,sun.target);

  // ---- Kamera: Blick von schräg oben, verschieben (rechte/mittlere Maustaste) und zoomen (Mausrad) ----
  const cam={x:0,z:0,dist:DIST_START,yaw:0,pitch:TILT};
  function applyCamera(){
    const flat=Math.cos(cam.pitch)*cam.dist;
    camera.position.set(cam.x+Math.sin(cam.yaw)*flat,Math.sin(cam.pitch)*cam.dist,cam.z+Math.cos(cam.yaw)*flat);camera.lookAt(cam.x,0,cam.z);camera.updateMatrixWorld();
    sun.target.position.set(cam.x,0,cam.z);sun.position.set(cam.x+650,1100,cam.z+450);
  }
  const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),ground=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  function setRay(event){const r=dom.getBoundingClientRect();ndc.set((event.clientX-r.left)/r.width*2-1,-((event.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);}
  function groundPoint(event){setRay(event);return ray.ray.intersectPlane(ground,new THREE.Vector3());}
  function zoom(factor,event){
    if(!Number.isFinite(factor)||factor<=0) return;
    const before=event&&groundPoint(event);cam.dist=clamp(cam.dist*factor,DIST_MIN,DIST_MAX);applyCamera();
    const after=event&&groundPoint(event);if(before&&after){cam.x+=before.x-after.x;cam.z+=before.z-after.z;applyCamera();}
    commands.viewChanged?.();
  }
  function rotateView(direction){cam.yaw+=direction*Math.PI/18;applyCamera();commands.viewChanged?.();}
  function resetView(notify=true){cam.x=0;cam.z=0;cam.dist=DIST_START;cam.yaw=0;cam.pitch=TILT;applyCamera();if(notify) commands.viewChanged?.();}
  function getView(){return {x:cam.x,y:cam.z,w:cam.dist,h:cam.dist,yaw:cam.yaw,pitch:cam.pitch};}

  // ---- Modelle laden ----
  const templates=new Map();let ready=false,destroyed=false;
  const loader=new GLTFLoader();
  const wanted=Object.entries(HexModelMap.ALL_MODELS).flatMap(([kind,names])=>names.map(name=>({kind,id:`${PREFIX[kind]}_${name}`})));
  const inventory=fetch('assets/index.json').then(r=>r.ok?r.json():null).catch(()=>null);   // nur vom mitgelieferten Server; sonst wird alles versucht
  inventory.then(list=>{const available=list&&new Set(list);return Promise.all(wanted.filter(({kind,id})=>!available||available.has(`${kind}/${id}.glb`)).map(({kind,id})=>new Promise(done=>loader.load(`assets/${kind}/${id}.glb`,gltf=>{try{templates.set(id,makeTemplate(id,gltf.scene,kind));}catch(e){console.warn('Modell unbrauchbar:',id,e);}done();},undefined,e=>{console.warn('Modell fehlt:',id,e?.message||e);done();}))));}).then(()=>{ready=true;loading.remove();rebuildAll();if(state) render(state,targetList);});

  // ---- gemeinsame Ressourcen ----
  const invisible=new THREE.MeshBasicMaterial({visible:false});
  const hexPickGeometry=new THREE.CylinderGeometry(HEX-2,HEX-2,4,6).translate(0,2,0);
  const hexPad=new THREE.CylinderGeometry(HEX*.94,HEX*.94,8,6).translate(0,-4,0);
  const flatHex=new THREE.CylinderGeometry(HEX-4,HEX-4,1.2,6).translate(0,1,0);
  const slotPick=new THREE.CylinderGeometry(16,16,10,10).translate(0,5,0),towerPick=new THREE.CylinderGeometry(17,17,48,8).translate(0,24,0),buildingPick=new THREE.BoxGeometry(32,40,32).translate(0,20,0);
  const ringGeometry=(outer,inner)=>{const shape=new THREE.Shape(),hole=new THREE.Path();for(let i=0;i<6;i++){const a=Math.PI/6+i*STEP;(i?shape.lineTo:shape.moveTo).call(shape,Math.cos(a)*outer,Math.sin(a)*outer);(i?hole.lineTo:hole.moveTo).call(hole,Math.cos(a)*inner,Math.sin(a)*inner);}shape.holes.push(hole);return new THREE.ShapeGeometry(shape).rotateX(-Math.PI/2).translate(0,2.5,0);};
  const outline=ringGeometry(HEX-3,HEX-7),circle=new THREE.CircleGeometry(1,64).rotateX(-Math.PI/2),circleRing=new THREE.RingGeometry(.985,1,64).rotateX(-Math.PI/2);
  const torus=new THREE.TorusGeometry(1,.09,6,28).rotateX(Math.PI/2),slotDiamondGeometry=new THREE.OctahedronGeometry(5),hintGeometry=new THREE.ConeGeometry(5,11,6),beam=new THREE.CylinderGeometry(1,1,1,6);
  const basic=(color,opacity=1)=>new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity>=1});
  const std=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.85,metalness:0,...extra});
  // ---- Effekt-Pools: alle Strahlen, Spitzen, Blitze und Funken laufen über wenige InstancedMeshes (kaum Draw-Calls) ----
  const additive=()=>new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  function makePool(geometry,max,material){
    const mesh=new THREE.InstancedMesh(geometry,material,max);mesh.frustumCulled=false;mesh.count=0;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const m=new THREE.Matrix4(),c=new THREE.Color(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),d=new THREE.Vector3(),pos=new THREE.Vector3(),sc=new THREE.Vector3();
    mesh.setColorAt(0,c.set('#ffffff'));   // Farbpuffer von Anfang an anlegen, sonst kompiliert der Shader ohne Instanzfarben
    const put=(color,fade)=>{mesh.setMatrixAt(mesh.count,m);mesh.setColorAt(mesh.count,c.set(color).multiplyScalar(fade));mesh.count++;};
    return {mesh,
      begin(){mesh.count=0;},
      segment(ax,ay,az,bx,by,bz,radius,color,fade=1){if(mesh.count>=max) return;d.set(bx-ax,by-ay,bz-az);const len=Math.max(d.length(),.01);q.setFromUnitVectors(up,d.divideScalar(len));pos.set((ax+bx)/2,(ay+by)/2,(az+bz)/2);sc.set(radius,len,radius);m.compose(pos,q,sc);put(color,fade);},
      ball(x,y,z,radius,color,fade=1){if(mesh.count>=max) return;q.identity();pos.set(x,y,z);sc.setScalar(radius);m.compose(pos,q,sc);put(color,fade);},
      cone(x,y,z,dx,dy,dz,length,radius,color){if(mesh.count>=max) return;d.set(dx,dy,dz).normalize();q.setFromUnitVectors(up,d);pos.set(x,y,z);sc.set(radius,length,radius);m.compose(pos,q,sc);put(color,1);},
      end(){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor) mesh.instanceColor.needsUpdate=true;}};
  }
  const fx={solid:makePool(new THREE.CylinderGeometry(1,1,1,6),700,new THREE.MeshBasicMaterial({color:'#ffffff'})),
    glow:makePool(new THREE.CylinderGeometry(1,1,1,6),700,additive()),
    tips:makePool(new THREE.ConeGeometry(1,1,6).translate(0,-.5,0),160,new THREE.MeshBasicMaterial({color:'#ffffff'})),   // Spitze zeigt in +Y, Ursprung an der Spitze
    flash:makePool(new THREE.SphereGeometry(1,10,8),220,additive()),
    rocks:makePool(new THREE.IcosahedronGeometry(1,0),48,new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.95,metalness:0}))};
  const mats={empty:std('#ffffff',{transparent:true,opacity:.6}),legal:basic('#7fcf6a',.25),illegal:basic('#c0594c',.16),outlineLegal:basic('#a9dc93'),outlineIllegal:basic('#ba6b60'),
    hint:basic('#ffe39a'),slot:basic('#f4d36d',.9),select:basic('#f4d36d',.9),bar:basic('#321a18'),hp:basic('#78b95f'),armor:basic('#df8b3a'),magic:basic('#69aee8')};
  const enemyGeometry={small:new THREE.SphereGeometry(9,14,10),boss:new THREE.SphereGeometry(15,16,12)},barGeometry=new THREE.PlaneGeometry(1,1);
  const ghostMaterials=new Map(),biomeMaterials=new Map();
  function ghostMaterial(material,legal){
    const id=material.uuid+legal;if(!ghostMaterials.has(id)){const m=material.clone();m.transparent=false;m.opacity=1;if(m.color){const g=m.color.r*.3+m.color.g*.59+m.color.b*.11;m.color.lerp(new THREE.Color(g,g,g),.5);}ghostMaterials.set(id,m);}
    return ghostMaterials.get(id);
  }
  function addParts(group,parts,ghost,legal){for(const part of parts||[]){const mesh=new THREE.Mesh(part.geometry,ghost?ghostMaterial(part.material,legal):part.material);mesh.castShadow=!ghost;mesh.receiveShadow=true;group.add(mesh);}}
  const fallbackMaterial=std('#688653');

  // ---- Szene ----
  const layer={tiles:new THREE.Group(),landmarks:new THREE.Group(),empty:new THREE.Group(),objects:new THREE.Group(),targets:new THREE.Group(),dynamic:new THREE.Group(),ghost:new THREE.Group(),overlays:new THREE.Group()};
  Object.values(layer).forEach(g=>scene.add(g));
  let state,targetList=[],hoverPick=null;
  const tileRecords=new Map(),landmarkRecords=new Map(),objectRecords=new Map(),labels=new Map(),usedLabels=new Set();
  let emptySig='',targetSig='',ghostSig='',pickables=[],pickDirty=true,runToken=null;
  const enemyObjects=new Map(),mineObjects=new Map(),rangeFill=new THREE.Mesh(circle,basic('#ffffff',.13)),rangeRing=new THREE.Mesh(circleRing,basic('#ffffff',.65)),selectRing=new THREE.Mesh(torus,mats.select);
  for(const mesh of [rangeFill,rangeRing]){mesh.material.depthTest=false;mesh.material.depthWrite=false;mesh.renderOrder=20;}
  rangeFill.visible=rangeRing.visible=selectRing.visible=false;layer.dynamic.add(rangeFill,rangeRing,selectRing,...Object.values(fx).map(pool=>pool.mesh));

  const windPool=makePool(new THREE.CylinderGeometry(1,1,1,5),240,new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.35,depthWrite:false}));
  const mistPool=makePool(new THREE.SphereGeometry(1,8,4),60,new THREE.MeshBasicMaterial({color:'#dce8ee',transparent:true,opacity:.07,depthWrite:false}));
  layer.dynamic.add(windPool.mesh,mistPool.mesh);
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  function animateBiomeWind(now){
    windPool.begin();mistPool.begin();
    if(state&&ready&&!reducedMotion.matches){
      const tiles=[...state.map.values(),...[...state.landmarks.values()].filter(l=>!l.claimed&&HexExploration.visibility(state.map,l)==='clear')].filter(tile=>HexBiomes.forTile(state,tile)==='storm').map(tile=>({...tile,p:axialToWorld(tile.q,tile.r)})).sort((a,b)=>Math.hypot(a.p.x-cam.x,a.p.y-cam.z)-Math.hypot(b.p.x-cam.x,b.p.y-cam.z)).slice(0,quality==='high'?60:20);
      for(const tile of tiles){const phase=tile.q*1.7+tile.r*2.3;
        for(let i=0;i<3;i++){const t=((now*.00018+phase+i/3)%1+1)%1,x=tile.p.x-27+t*48,z=tile.p.y+(i-1)*13+Math.sin(t*5+phase)*3,y=9+i*3;windPool.segment(x,y,z,x+9,y,z+2,.55,'#e6f5ff',.6+Math.sin(t*Math.PI)*.4);}
        mistPool.ball(tile.p.x+Math.sin(now*.0002+phase)*16,8,tile.p.y+Math.cos(phase)*14,12,'#dce8ee',1);
      }
    }
    windPool.end();mistPool.end();
  }
  function clearGroup(group){for(const child of [...group.children]) group.remove(child);}
  function rebuildAll(){for(const [map,group] of [[tileRecords,layer.tiles],[landmarkRecords,layer.landmarks],[objectRecords,layer.objects]]){map.clear();clearGroup(group);}emptySig=targetSig=ghostSig='';pickDirty=true;}

  const gridGeometry=ringGeometry(HEX-.5,HEX-1.7),buffGeometry=new THREE.CircleGeometry(HEX-3,6).rotateZ(Math.PI/6).rotateX(-Math.PI/2);
  const gridMaterial=basic('#d4e7d2',.7),buffMaterial=basic('#ffffff',.18),buffBorderMaterial=basic('#ffffff',.95);
  for(const material of [gridMaterial,buffMaterial,buffBorderMaterial]){material.depthTest=false;material.depthWrite=false;}
  let overlaySig='';
  function clearOverlays(){for(const mesh of [...layer.overlays.children]){layer.overlays.remove(mesh);mesh.dispose();}overlaySig='';}
  function syncTileOverlays(){
    const highlight=HexBuildings.highlight(state),cells=state.showHexGrid?HexExploration.gridCells(state.map,state.landmarks):[];
    const sig=JSON.stringify([cells.map(t=>key(t.q,t.r)),highlight.color,highlight.tiles.map(t=>key(t.q,t.r))]);if(sig===overlaySig)return;
    clearOverlays();overlaySig=sig;
    const add=(tiles,geometry,material,order)=>{if(!tiles.length)return;const mesh=new THREE.InstancedMesh(geometry,material,tiles.length),matrix=new THREE.Matrix4();tiles.forEach((tile,i)=>{const p=axialToWorld(tile.q,tile.r);matrix.makeTranslation(p.x,3,p.y);mesh.setMatrixAt(i,matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.renderOrder=order;layer.overlays.add(mesh);};
    add(cells,gridGeometry,gridMaterial,10);
    if(highlight.color){buffMaterial.color.set(highlight.color);buffBorderMaterial.color.set(highlight.color);add(highlight.tiles,buffGeometry,buffMaterial,11);add(highlight.tiles,outline,buffBorderMaterial,12);}
  }

  // ---- Tiles ----
  function modelTemplate(name,kind='tile'){return templates.get(`${kind}_${name}`);}
  function buildTile(spec,tile,{ghost=false,legal=true,slotCount=tile.slots||0,buildingSlots=tile.buildingSlots||0,prop=null}={}){
    const holder=new THREE.Group(),model=new THREE.Group(),c=axialToWorld(tile.q,tile.r);
    holder.position.set(c.x,0,c.y);model.scale.setScalar(S);model.rotation.y=(spec.rotation||0)*STEP;holder.add(model);
    const template=spec.kind==='landmark'?modelTemplate(spec.name,'landmark'):modelTemplate(spec.name);
    if(!template){const mesh=new THREE.Mesh(hexPad,fallbackMaterial);mesh.scale.setScalar(1);holder.add(mesh);return holder;}
    addParts(model,spec.proceduralRoads&&template.noRoad?template.noRoad:template.parts,ghost,legal);
    const biome=spec.name==='fog'?'grass':HexBiomes.forTile(state,tile);
    if(biome!=='grass')model.traverse(mesh=>{if(!mesh.isMesh||!/(grass|foliage|soil)/i.test(mesh.material.name||''))return;const id=mesh.material.uuid+'|'+biome;let material=biomeMaterials.get(id);if(!material){material=mesh.material.clone();material.vertexColors=false;material.color.set(HexBiomes.definitions[biome].color);if(/soil/i.test(material.name))material.color.multiplyScalar(.6);else if(/foliage/i.test(material.name))material.color.multiplyScalar(.8);biomeMaterials.set(id,material);}mesh.material=material;});
    // Turmplätze liegen an den Spielpositionen (HexMap.slotOffsets), nicht an den im Modell gespeicherten.
    HexMap.slotOffsets(tile.type,slotCount).forEach((offset,i)=>{
      const slot=template.slots[i]||template.slots[0];if(!slot) return;
      const group=new THREE.Group();group.position.set(offset.x/S,slot.pos.y,offset.y/S);addParts(group,slot.parts,ghost,legal);model.add(group);
    });
    if(buildingSlots&&template.pad){const group=new THREE.Group();group.position.copy(template.pad.pos);addParts(group,template.pad.parts,ghost,legal);model.add(group);}
    if(prop){
      const template2=modelTemplate(prop.name,'landmark');
      if(template2?.props){                            // Hauptobjekt auf Radius .55 in Richtung prop.angle, Kisten behalten ihre Lage relativ dazu (Modell: Hauptobjekt liegt im Süden, +Z)
        const a=prop.angle*Math.PI/180,outer=new THREE.Group(),inner=new THREE.Group();
        outer.position.set(Math.cos(a)*.55,0,-Math.sin(a)*.55);outer.rotation.y=Math.atan2(Math.cos(a),-Math.sin(a));
        inner.position.set(-template2.propCenter.x,0,-template2.propCenter.z);addParts(inner,template2.props,false,true);outer.add(inner);model.add(outer);
      }
    }
    if(spec.proceduralRoads){
      const roadBase=template.parts.find(p=>p.material.name==='road')?.material||fallbackMaterial,road=ghost?ghostMaterial(roadBase,true):roadBase;
      for(const points of HexMap.roadGeometry(tile).legs.values()) holder.add(ribbon(points.map(p=>({x:p.x-c.x,y:p.y-c.y})),road));
    }
    return holder;
  }
  function ribbon(points,material,width=18){
    const positions=[],indices=[];
    points.forEach((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len*width/2,ny=dx/len*width/2;positions.push(p.x+nx,1,p.y+ny,p.x-nx,1,p.y-ny);if(i) indices.push(2*i-2,2*i-1,2*i,2*i-1,2*i+1,2*i);});
    // Von oben sichtbare Vorderseite: Die X/Z-Ebene benötigt die umgekehrte Wicklung.
    for(let i=0;i<indices.length;i+=3) [indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,material);mesh.receiveShadow=true;return mesh;
  }
  function tileSpec(tile){
    const landmark=state.landmarks?.get(key(tile.q,tile.r));
    if(landmark?.type==='boss'&&landmark.status!=='defeated') return {kind:'landmark',name:'boss',rotation:0};
    return {kind:'tile',...HexModelMap.modelFor(tile)};
  }
  function syncTiles(){
    const seen=new Set();
    for(const tile of state.map.values()){
      const id=key(tile.q,tile.r),spec=tileSpec(tile),sig=[spec.kind,spec.name,spec.rotation,tile.slots,tile.buildingSlots,(tile.roads||[]).join('')].join('|');seen.add(id);
      const record=tileRecords.get(id);if(record?.sig===sig) continue;
      if(record) layer.tiles.remove(record.holder);
      const holder=buildTile(spec,tile);layer.tiles.add(holder);tileRecords.set(id,{sig,holder});
    }
    for(const [id,record] of [...tileRecords]) if(!seen.has(id)){layer.tiles.remove(record.holder);tileRecords.delete(id);}
  }

  // ---- Sonderfelder (noch nicht angeschlossen) und Nebel ----
  function syncLandmarks(){
    const seen=new Set();
    for(const landmark of state.landmarks?.values()||[]){
      if(landmark.claimed) continue;
      const visibility=HexExploration.visibility(state.map,landmark);if(visibility==='hidden') continue;
      const id=key(landmark.q,landmark.r),c=axialToWorld(landmark.q,landmark.r),p=landmark.prefab,clear=visibility==='clear'&&p;
      const sig=[visibility,landmark.type,p?.type,p?.rotation].join('|');seen.add(id);
      let record=landmarkRecords.get(id);
      if(record?.sig!==sig){
        if(record) layer.landmarks.remove(record.holder);
        const tile={q:landmark.q,r:landmark.r,type:p?.type,roads:p?.roads||[],slots:p?.slots||0,rotation:p?.rotation||0};
        let holder;
        if(!clear) holder=buildTile({kind:'tile',name:'fog',rotation:0},{...tile,slots:0});
        else if(landmark.type==='boss') holder=buildTile({kind:'landmark',name:'boss',rotation:0},{...tile,slots:0});
        else holder=buildTile({kind:'tile',...HexModelMap.modelFor(tile)},tile,{prop:{name:landmark.type,angle:HexModelMap.propAngle(p.type,HexMap.slotOffsets(p.type,p.slots))}});
        layer.landmarks.add(holder);record={sig,holder};landmarkRecords.set(id,record);
      }
      label(`lm:${id}`,c.x,c.y,clear?LANDMARK_LABEL[landmark.type]:'?',clear?'':'big',clear?30:0);
    }
    for(const [id,record] of [...landmarkRecords]) if(!seen.has(id)){layer.landmarks.remove(record.holder);landmarkRecords.delete(id);}
  }
  function syncEmpty(){
    const landmarkVisible=[...state.landmarks?.values()||[]].filter(l=>!l.claimed&&HexExploration.visibility(state.map,l)!=='hidden').map(l=>key(l.q,l.r));
    const sig=state.map.size+'|'+landmarkVisible.join(';');if(sig===emptySig) return;emptySig=sig;clearGroup(layer.empty);
    const adjacent=new Map();
    for(const tile of state.map.values()) for(let d=0;d<6;d++){const n=neighbor(tile.q,tile.r,d),id=key(n.q,n.r);if(!state.map.has(id)&&!landmarkVisible.includes(id)) adjacent.set(id,n);}
    const mesh=new THREE.InstancedMesh(hexPad,mats.empty,Math.max(1,adjacent.size)),matrix=new THREE.Matrix4();let i=0;
    for(const n of adjacent.values()){const c=axialToWorld(n.q,n.r);mesh.setMatrixAt(i,matrix.makeTranslation(c.x,0,c.y));mesh.setColorAt(i++,new THREE.Color(HexBiomes.definitions[HexBiomes.forTile(state,n)].color));}
    mesh.count=adjacent.size;mesh.receiveShadow=true;layer.empty.add(mesh);
  }

  // ---- Türme, Gebäude, Turmplätze ----
  function towerObject(tile,index,tower){
    const template=modelTemplate(tower.type,'tower'),def=HexData.towerDefinition(tower),p=slotPositions(tile)[index],holder=new THREE.Group(),obj={holder,def,tower,tile,index,pos:p,angle:0};
    holder.position.set(p.x,0,p.y);
    const model=new THREE.Group();model.scale.setScalar(S);holder.add(model);
    if(template){
      addParts(model,template.parts);
      if(template.turret){obj.turret=new THREE.Group();obj.turret.position.copy(template.turret.pos);obj.turretBase=obj.turret.position.clone();addParts(obj.turret,template.turret.parts);model.add(obj.turret);}
      if(template.aura){obj.auraModel=new THREE.Group();obj.auraModel.position.copy(template.aura.pos);addParts(obj.auraModel,template.aura.parts);model.add(obj.auraModel);}
    }else if(tower.type==='element'||tower.type==='necromancer'){
      const plinth=new THREE.Mesh(new THREE.CylinderGeometry(10,15,24,6).translate(0,12,0),std(tower.type==='element'?'#646383':'#4d5a51'));plinth.castShadow=true;holder.add(plinth);
      const core=new THREE.Mesh(tower.type==='element'?new THREE.OctahedronGeometry(11):new THREE.SphereGeometry(8,8,6),std(def.color,{emissive:def.color,emissiveIntensity:.35}));core.position.y=36;holder.add(core);
      if(tower.type==='necromancer')for(const x of [-12,12]){const spire=new THREE.Mesh(new THREE.ConeGeometry(4,27,5),std('#c4c8b1'));spire.position.set(x,29,0);holder.add(spire);}
      else{const ring=new THREE.Mesh(torus,basic(def.color));ring.scale.setScalar(16);ring.position.y=27;holder.add(ring);}
    }else{const mesh=new THREE.Mesh(new THREE.CylinderGeometry(12,14,40,8).translate(0,20,0),std(def.color));mesh.castShadow=true;holder.add(mesh);}
    const visual=HexData.BRANCH_VISUALS[tower.branch];
    if(visual){const ring=new THREE.Mesh(torus,basic(visual.color));ring.scale.setScalar(20);ring.position.y=2;holder.add(ring);
      if(tower.finalUpgrade){const gold=new THREE.Mesh(torus,basic(tower.ultimate?'#8de8ff':'#ffe39a'));gold.scale.setScalar(tower.ultimate?28:24);gold.position.y=2;holder.add(gold);}}
    if(def.aura){const fill=new THREE.Mesh(circle,basic(def.color,.06)),edge=new THREE.Mesh(circleRing,basic(def.color,.22));for(const m of [fill,edge]){m.scale.setScalar(def.range);m.position.set(0,1.5,0);holder.add(m);}}
    obj.hint=new THREE.Mesh(hintGeometry,mats.hint);obj.hint.position.y=66;obj.hint.visible=false;holder.add(obj.hint);
    const pick=new THREE.Mesh(towerPick,invisible);pick.userData.pick={kind:'tower',q:tile.q,r:tile.r,index};holder.add(pick);obj.pick=pick;
    return obj;
  }
  function buildingObject(tile,index,building){
    const p=buildingPosition(tile),group=new THREE.Group(),type=building?.type;group.position.set(p.x,0,p.y);
    const model=building&&templates.get('building_'+type);
    if(model){const g=new THREE.Group();g.scale.setScalar(S);addParts(g,model.parts);group.add(g);}
    else if(building){
      const palette={house:['#c9a066','#a94a3a'],forge:['#6b6e75','#3d3f45'],market:['#d8c48a','#b8443a']}[type]||['#bc914d','#7a5a2c'];
      const body=new THREE.Mesh(new THREE.BoxGeometry(26,18,22).translate(0,9,0),std(palette[0])),roof=new THREE.Mesh(new THREE.ConeGeometry(21,13,4).rotateY(Math.PI/4).translate(0,24.5,0),std(palette[1]));
      body.castShadow=roof.castShadow=true;group.add(body,roof);
      if(type==='forge'){const chimney=new THREE.Mesh(new THREE.BoxGeometry(6,14,6).translate(8,26,-4),std('#3d3f45'));chimney.castShadow=true;group.add(chimney);}
    }
    const pick=new THREE.Mesh(buildingPick,invisible);pick.userData.pick={kind:'building',q:tile.q,r:tile.r,index};group.add(pick);
    return {group,pick};
  }
  function objectSig(tile){return JSON.stringify([tile.slots,tile.buildingSlots,tile.type,tile.rotation,(tile.towers||[]).map(t=>t&&[t.type,t.branch,t.finalUpgrade,t.ultimate,t.level,t.tileType]),(tile.buildings||[]).map(b=>b&&b.type)]);}
  function syncObjects(){
    const seen=new Set();
    for(const tile of state.map.values()){
      const id=key(tile.q,tile.r),sig=objectSig(tile);seen.add(id);
      const record=objectRecords.get(id);if(record?.sig===sig) continue;
      if(record) layer.objects.remove(record.group);
      const group=new THREE.Group(),towers=[],picks=[],slotHints=[],slots=slotPositions(tile);
      if(tile.type==='base'){const pick=new THREE.Mesh(buildingPick,invisible);pick.scale.set(2,2,2);pick.userData.pick={kind:'base'};group.add(pick);picks.push(pick);}
      (tile.towers||[]).forEach((tower,i)=>{
        if(tower){const obj=towerObject(tile,i,tower);group.add(obj.holder);towers.push(obj);picks.push(obj.pick);}
        else if(slots[i]){const glow=new THREE.Mesh(slotDiamondGeometry,mats.slot);glow.material.depthTest=false;glow.renderOrder=14;glow.position.set(slots[i].x,22,slots[i].y);group.add(glow);slotHints.push(glow);const pick=new THREE.Mesh(slotPick,invisible);pick.position.set(slots[i].x,0,slots[i].y);pick.userData.pick={kind:'slot',q:tile.q,r:tile.r,index:i};group.add(pick);picks.push(pick);}
      });
      for(let i=0;i<(tile.buildingSlots||0);i++){const b=buildingObject(tile,i,tile.buildings?.[i]);group.add(b.group);picks.push(b.pick);}
      layer.objects.add(group);objectRecords.set(id,{sig,group,towers,picks,slotHints});pickDirty=true;
    }
    for(const [id,record] of [...objectRecords]) if(!seen.has(id)){layer.objects.remove(record.group);objectRecords.delete(id);pickDirty=true;}
  }

  // ---- Platzierung: klickbare Felder, Vorschau ----
  function syncTargets(){
    const sig=targetList.map(t=>t.q+','+t.r+(t.legal?'+':'-')).join(';');if(sig===targetSig) return;targetSig=sig;clearGroup(layer.targets);pickDirty=true;
    for(const target of targetList){
      const c=axialToWorld(target.q,target.r),group=new THREE.Group();group.position.set(c.x,0,c.y);
      const glow=new THREE.Mesh(flatHex,target.legal?mats.legal:mats.illegal);glow.renderOrder=1;glow.userData.glow=key(target.q,target.r);group.add(glow);
      const pick=new THREE.Mesh(hexPickGeometry,invisible);pick.userData.pick={kind:'target',q:target.q,r:target.r,legal:target.legal};group.add(pick);layer.targets.add(group);
    }
  }
  function syncGhost(){
    const hovered=state.hoveredPlacement,target=targetList.find(t=>key(t.q,t.r)===hovered),card=CARD_LIBRARY[state.hand?.[state.selectedCard]];
    const show=target&&card&&state.phase==='place'&&!state.waveRunning;
    const sig=show?[target.q,target.r,card.id,state.rotation,target.legal].join('|'):'';
    if(sig!==ghostSig){
      ghostSig=sig;clearGroup(layer.ghost);
      if(show){
        const tile={q:target.q,r:target.r,type:card.id,rotation:state.rotation,roads:HexMap.rotatedRoads(card,state.rotation),slots:card.slots||0,buildingSlots:card.buildingSlots||0},spec={kind:'tile',...HexModelMap.modelFor(tile)};
        layer.ghost.add(buildTile(spec,tile,{ghost:true,legal:target.legal}));
        const c=axialToWorld(target.q,target.r),ring=new THREE.Mesh(outline,target.legal?mats.outlineLegal:mats.outlineIllegal);ring.position.set(c.x,0,c.y);layer.ghost.add(ring);
      }
    }
    for(const g of layer.targets.children) for(const m of g.children) if(m.userData.glow) m.visible=!(show&&m.userData.glow===hovered);
    if(show){const c=axialToWorld(target.q,target.r),screen=project({x:c.x,y:c.y+HEX+8},0);if(screen){rotateHint.style.display='block';rotateHint.style.left=screen.x+'px';rotateHint.style.top=screen.y+'px';}}
    else rotateHint.style.display='none';
  }

  // ---- Auswahl, Reichweite, Upgrade-Hinweise ----
  function syncSelection(){
    for(const record of objectRecords.values())for(const hint of record.slotHints||[])hint.visible=state.showSlotHints!==false&&['build','wave'].includes(state.phase)&&state.hp>0;
    const selected=state.selectedTower||state.hoverTower||(state.previewTower?state.selectedSlot:null);
    const tile=selected&&state.map.get(key(selected.q,selected.r)),tower=tile?.towers[selected.index],type=tower?.type||state.previewTower;
    if(tile&&type){
      const p=slotPositions(tile)[selected.index],def=HexData.towerDefinition(tower||{type,biome:HexBiomes.forTile(state,tile),rangeFactor:state.challengeDay?.85:1,tileType:tile.type});
      for(const m of [rangeFill,rangeRing]){m.visible=true;m.position.set(p.x,.8,p.y);m.scale.setScalar(def.range);m.material.color.set(def.color);}
    }else rangeFill.visible=rangeRing.visible=false;
    if(state.selectedBase&&!state.hoverTower){const weapon=HexHeroes.weapon(state);if(weapon)for(const mesh of [rangeFill,rangeRing]){mesh.visible=true;mesh.position.set(0,.8,0);mesh.scale.setScalar(weapon.range);mesh.material.color.set(weapon.color);}}
    const marked=state.selectedTower||state.selectedSlot,markedTile=marked&&state.map.get(key(marked.q,marked.r)),markedPos=markedTile&&slotPositions(markedTile)[marked.index];
    if(markedPos){selectRing.visible=true;selectRing.position.set(markedPos.x,3,markedPos.y);selectRing.scale.setScalar(state.selectedTower?24:18);}else selectRing.visible=false;
    const canHint=['build','wave'].includes(state.phase)&&state.hp>0;
    for(const record of objectRecords.values()) for(const obj of record.towers) obj.hint.visible=canHint&&HexData.availableUpgrades(obj.tower).some(([,u])=>state.gold>=HexBuildings.cost(state,obj.tile,u.cost));
  }

  // ---- Gegner und Geschosse ----
  const model0=m=>m.isGroup;
  function makeEnemy(e){
    const type=ENEMY_COLOR[e.type]?e.type:'normal',boss=type==='boss',template=templates.get('enemy_'+type),group=new THREE.Group(),bar=new THREE.Group();
    const obj={group,bar,radius:boss?15:9,phase:0,angle:0,targetAngle:0,last:null,slowed:false,limbs:[],barY:0};
    if(template){
      obj.pivot=new THREE.Group();const model=new THREE.Group();model.scale.setScalar(S);obj.pivot.add(model);addParts(model,template.parts);
      for(const limb of template.limbs){const g=new THREE.Group();g.position.copy(limb.pos);addParts(g,limb.parts);model.add(g);obj.limbs.push({name:limb.name,g});}
      obj.ice=new THREE.Mesh(torus,basic('#79cdd9'));obj.ice.scale.setScalar(obj.radius+4);obj.ice.position.y=2;obj.ice.visible=false;
      group.add(obj.pivot,obj.ice);obj.barY=template.height*S+12;obj.baseY=0;
    }else{                                                             // Fallback ohne Modell: farbige Kugel
      obj.body=new THREE.Mesh(boss?enemyGeometry.boss:enemyGeometry.small,std(ENEMY_COLOR[type]));obj.body.castShadow=true;obj.color=ENEMY_COLOR[type];
      group.add(obj.body);obj.barY=obj.radius*2+14;obj.baseY=obj.radius+3;
    }
    obj.fgs={};obj.barBgs={};[['hp',mats.hp,0],['armorHp',mats.armor,5],['magicHp',mats.magic,10]].forEach(([field,material,offset])=>{const bg=new THREE.Mesh(barGeometry,mats.bar),fg=new THREE.Mesh(barGeometry,material);bg.scale.set(26,3,1);fg.scale.set(26,3,1);fg.position.z=.1;bg.position.y=fg.position.y=offset;bar.add(bg,fg);obj.fgs[field]=fg;obj.barBgs[field]=bg;});bar.position.y=obj.barY;group.add(bar);
    layer.dynamic.add(group);return obj;
  }
  function syncEnemies(){
    const alive=new Set();
    for(const e of state.enemies){
      alive.add(e.id);let obj=enemyObjects.get(e.id);if(!obj){obj=makeEnemy(e);enemyObjects.set(e.id,obj);}
      const slowed=e.slowFactor<1;
      if(slowed!==obj.slowed){obj.slowed=slowed;if(obj.body) obj.body.material.color.set(slowed?'#79cdd9':obj.color);if(obj.ice) obj.ice.visible=slowed;}
      if(obj.last){const dx=e.x-obj.last.x,dy=e.y-obj.last.y,moved=Math.hypot(dx,dy);   // Laufrichtung und Schrittphase aus der Bewegung
        if(moved>.05){obj.targetAngle=Math.atan2(-dy,dx);obj.phase+=moved*.14;if(!obj.oriented){obj.angle=obj.targetAngle;obj.oriented=true;}}}
      obj.last={x:e.x,y:e.y};
      obj.group.position.set(e.x,obj.baseY,e.y);for(const [field,max] of [['hp','maxHp'],['armorHp','maxArmorHp'],['magicHp','maxMagicHp']]){const fg=obj.fgs[field],visible=e[max]>0,ratio=visible?clamp((e[field]||0)/e[max],0,1):0;fg.visible=obj.barBgs[field].visible=visible;fg.scale.x=Math.max(.001,26*ratio);fg.position.x=-13*(1-ratio);}
    }
    for(const [id,obj] of [...enemyObjects]) if(!alive.has(id)){layer.dynamic.remove(obj.group);obj.body?.material.dispose();enemyObjects.delete(id);}
  }
  function syncMines(){
    const alive=new Set();for(const mine of state.mines||[]){alive.add(mine.id);let mesh=mineObjects.get(mine.id);if(!mesh){const model=templates.get('mine_pickup');if(model){mesh=new THREE.Group();const g=new THREE.Group();g.scale.setScalar(S);addParts(g,model.parts);mesh.add(g);}else{mesh=new THREE.Mesh(new THREE.CylinderGeometry(7,7,3,10),std(mine.color||'#e6a75f',{metalness:.25}));mesh.castShadow=true;}layer.dynamic.add(mesh);mineObjects.set(mine.id,mesh);}mesh.position.set(mine.x,model0(mesh)?0:2,mine.y);}
    for(const [id,mesh] of [...mineObjects])if(!alive.has(id)){layer.dynamic.remove(mesh);if(mesh.isMesh){mesh.geometry.dispose();mesh.material.dispose();}mineObjects.delete(id);}
  }
  // ---- Geschosse und Treffereffekte (nur Darstellung; der Schaden ist beim Schuss schon verrechnet) ----
  const seenShots=new Map();                                          // Geschoss-Id -> bereits ausgelöste Effekte (Rückstoß, Trefferpop)
  const rnd=(i,seed)=>{const v=Math.sin(i*127.1+seed*311.7)*43758.5453;return v-Math.floor(v);};
  const lerp=(a,b,t)=>a+(b-a)*t,clamp01=t=>Math.max(0,Math.min(1,t));
  const SRC_H=34,DST_H=12,MUZZLE='#ffe9a8';
  function towerAt(x,y){for(const record of objectRecords.values()) for(const obj of record.towers) if(Math.abs(obj.pos.x-x)<.5&&Math.abs(obj.pos.y-y)<.5) return obj;return null;}
  function popEnemy(id){const obj=enemyObjects.get(id);if(obj) obj.pop=1;}
  function lightning(p,a,b,seed,fade,high){                           // gezackter Blitz zwischen zwei Punkten, flackert etwa 22-mal pro Sekunde
    const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1,px=-dz/len,pz=dx/len,amp=Math.min(7,len*.2),N=8;
    let last=a;
    for(let i=1;i<=N;i++){
      const t=i/N,edge=i===N?0:Math.sin(Math.PI*t),j=(rnd(i,seed)-.5)*2*amp*edge,v=(rnd(i+40,seed)-.5)*amp*.7*edge;
      const cur={x:lerp(a.x,b.x,t)+px*j,y:lerp(a.y,b.y,t)+v,z:lerp(a.z,b.z,t)+pz*j};
      if(high) fx.glow.segment(last.x,last.y,last.z,cur.x,cur.y,cur.z,3.4,p.color||'#93a5ff',.55*fade);
      fx.solid.segment(last.x,last.y,last.z,cur.x,cur.y,cur.z,.9*fade,'#f2f5ff');
      last=cur;
    }
  }
  function syncProjectiles(){
    const high=quality==='high',now=performance.now();
    for(const pool of Object.values(fx)) pool.begin();
    const live=new Set();
    for(const p of state.projectiles){
      if(p.kind==='spirit'){fx.flash.ball(p.x,32,p.y,p.r,p.color,.7);fx.solid.ball(p.x,32,p.y,2,p.color,1);continue;}
      if(p.kind==='blast'){                                            // Explosionsring wie bisher
        for(let i=0;i<12;i++){const a=i*Math.PI/6,b=(i+1)*Math.PI/6;fx.solid.segment(p.x+Math.cos(a)*p.r,34,p.y+Math.sin(a)*p.r,p.x+Math.cos(b)*p.r,34,p.y+Math.sin(b)*p.r,1.6,p.color||'#ffffff');}
        continue;
      }
      if(p.id===undefined||!p.max){                                    // ältere Geschosse ohne Effektdaten (z. B. Flammenturm): einfacher Strahl
        if(p.kind==='chain') for(let i=0;i<p.pts.length-1;i++) fx.solid.segment(p.pts[i].x,34,p.pts[i].y,p.pts[i+1].x,34,p.pts[i+1].y,1.6,p.color||'#ffffff');
        else fx.solid.segment(p.x1,34,p.y1,p.x2,34,p.y2,1.6,p.color||'#ffffff');
        continue;
      }
      live.add(p.id);const t=clamp01(1-p.ttl/p.max),done=seenShots.get(p.id)||seenShots.set(p.id,{}).get(p.id);
      const src=p.kind==='chain'?p.pts[0]:{x:p.x1,y:p.y1},dst=p.kind==='chain'?p.pts.at(-1):{x:p.x2,y:p.y2};
      if(!done.kick){done.kick=true;const tower=towerAt(src.x,src.y);if(tower) tower.kick=1;}   // Rückstoß des Turms
      const dirx=dst.x-src.x,diry=dst.y-src.y,dlen=Math.hypot(dirx,diry)||1,ux=dirx/dlen,uy=diry/dlen;
      if(t<.3){const k=1-t/.3;fx.flash.ball(src.x+ux*7,SRC_H+2,src.y+uy*7,1.5+3*k,MUZZLE,k*.9);}   // Mündungsblitz
      if(p.kind==='chain'){
        const fade=1-t*.8,seed=p.id*13+Math.floor(now/45);
        for(let i=0;i<p.pts.length-1;i++){
          const a={x:p.pts[i].x,y:i?DST_H:SRC_H,z:p.pts[i].y},b={x:p.pts[i+1].x,y:DST_H,z:p.pts[i+1].y};
          lightning(p,a,b,seed+i*7,fade,high);
        }
        if(t<.5){const k=1-t/.5;p.pts.slice(1).forEach(pt=>fx.flash.ball(pt.x,DST_H,pt.y,2+3.5*k,p.color||'#93a5ff',k*.8));}   // Funken an jedem getroffenen Gegner
        if(!done.hit){done.hit=true;(p.hits||[]).forEach(popEnemy);}
      }else if(p.tower==='element'||p.tower==='necromancer'){
        const f=clamp01(t/.8),x=lerp(src.x,dst.x,f),z=lerp(src.y,dst.y,f),y=lerp(SRC_H,DST_H,f);
        fx.flash.ball(x,y,z,5,p.color,.7);fx.solid.ball(x,y,z,2,p.color,1);
        fx.glow.segment(src.x,SRC_H,src.y,x,y,z,1.5,p.color,(1-t)*.5);
        if(f===1&&!done.hit){done.hit=true;(p.hits||[]).forEach(popEnemy);}
      }else if(p.tower==='catapult'){                                   // Felsbrocken rollt und hüpft die Schusslinie entlang
        const f=clamp01(t/.9),x=lerp(src.x,dst.x,f),y=lerp(src.y,dst.y,f),hop=Math.abs(Math.sin(f*Math.PI*5))*9*(1-f*.4)+5;
        if(f<1){fx.rocks.ball(x,hop,y,5.5,'#9a8f7e');if(high) fx.glow.segment(lerp(src.x,x,.75),hop,lerp(src.y,y,.75),x,hop,y,2,'#d8c9a3',.25);
        }
        (p.hitAt||[]).forEach((h,i)=>{const start=(h.along??1)*.9,k=(t-start)/.35;if(k>=0&&k<1) fx.flash.ball(h.x,6,h.y,4+7*k,'#d9c7a0',(1-k)*.6);   // Staubwolke am Einschlag
          const key='pop'+i;if(t>=start&&!done[key]){done[key]=true;popEnemy(p.hits[i]);}});
      }else{                                                            // Pfeil (Archer) und Bolzen (Balliste)
        const bolt=p.tower==='ballista',f=clamp01(t/.8),arc=bolt?3:12,length=bolt?15:9,radius=bolt?1.1:.65;
        const at=u=>({x:lerp(src.x,dst.x,u),y:lerp(SRC_H,DST_H,u)+Math.sin(Math.PI*u)*arc,z:lerp(src.y,dst.y,u)});
        if(f<1){
          const head=at(f),before=at(Math.max(0,f-.06)),vx=head.x-before.x,vy=head.y-before.y,vz=head.z-before.z,vl=Math.hypot(vx,vy,vz)||1,nx=vx/vl,ny=vy/vl,nz=vz/vl;
          const tail={x:head.x-nx*length,y:head.y-ny*length,z:head.z-nz*length};
          fx.solid.segment(tail.x,tail.y,tail.z,head.x,head.y,head.z,radius,bolt?'#5b4a36':'#8b6b43');
          fx.tips.cone(head.x+nx*2.5,head.y+ny*2.5,head.z+nz*2.5,nx,ny,nz,bolt?7:5,radius*2.2,bolt?'#c9ced6':'#d9dde3');
          fx.solid.segment(tail.x-nx*.5,tail.y-ny*.5,tail.z-nz*.5,tail.x+nx*length*.28,tail.y+ny*length*.28,tail.z+nz*length*.28,radius*2.4,'#e9e2cf');   // Federn
          if(high){const back=at(Math.max(0,f-.35));fx.glow.segment(back.x,back.y,back.z,tail.x,tail.y,tail.z,bolt?1.6:.9,p.color||'#f5d06e',.5);}
        }else{
          const k=clamp01((t-.8)/.2),h=at(1);fx.flash.ball(h.x,h.y,h.z,2+4.5*k,bolt?'#ffb060':'#ffe08a',(1-k)*.85);   // Aufprallfunke
          if(!done.hit){done.hit=true;(p.hits||[]).forEach(popEnemy);}
        }
      }
    }
    for(const id of [...seenShots.keys()]) if(!live.has(id)) seenShots.delete(id);
    for(const pool of Object.values(fx)) pool.end();
  }

  // ---- Beschriftungen (HTML über der Szene) ----
  function label(id,x,z,text,cls='',lift=0){
    usedLabels.add(id);let entry=labels.get(id);
    if(!entry){const el=document.createElement('div');el.style.cssText='position:absolute;transform:translate(-50%,-50%);color:#fff4c3;text-shadow:0 1px 3px #000,0 0 2px #000;font:700 11px Inter,system-ui,sans-serif;white-space:nowrap;pointer-events:none';labelLayer.appendChild(el);entry={el,pos:new THREE.Vector3()};labels.set(id,entry);}
    if(entry.text!==text||entry.cls!==cls){entry.text=text;entry.cls=cls;entry.el.textContent=text;entry.el.style.fontSize=cls==='big'?'26px':'11px';entry.el.style.color=cls==='big'?'#e6ecf2':'#fff4c3';}
    entry.pos.set(x,lift+6,z);
  }
  function syncLabels(){
    for(const e of state.enemies)if(e.alive&&e.caravan)label('caravan:'+e.id,e.x,e.y,'◆ Kasse +15 / −10','',55);
    for(const tile of state.map.values()){
      const c=axialToWorld(tile.q,tile.r),terrain=CARD_LIBRARY[tile.type],id=key(tile.q,tile.r);
      if(tile.income) label(`inc:${id}`,c.x,c.y+44,'+'+tile.income+' Gold');
      const biome=HexBiomes.forTile(state,tile);if(biome!=='grass')label('biome:'+id,c.x,c.y-32,HexBiomes.definitions[biome].name);
      const bonus=terrain?.towerRange?'+'+Math.round((terrain.towerRange-1)*100)+' % Reichweite':terrain?.towerDamage?'+'+Math.round((terrain.towerDamage-1)*100)+' % Schaden':terrain?.archerDamage?'+25 % Archer':null;
      if(bonus) label(`bon:${id}`,c.x,c.y+35,bonus);
    }
    for(const landmark of state.landmarks?.values()||[]) if(landmark.status){const c=axialToWorld(landmark.q,landmark.r);label(`st:${key(landmark.q,landmark.r)}`,c.x,c.y+35,STATUS_LABEL[landmark.status]);}
    for(const [id,entry] of [...labels]) if(!usedLabels.has(id)){entry.el.remove();labels.delete(id);}
    usedLabels.clear();
  }
  const tmp=new THREE.Vector3();
  function placeLabels(){
    const w=host.clientWidth,h=host.clientHeight;
    for(const entry of labels.values()){tmp.copy(entry.pos).project(camera);const visible=tmp.z<1;entry.el.style.display=visible?'':'none';if(visible){entry.el.style.left=(tmp.x+1)/2*w+'px';entry.el.style.top=(1-tmp.y)/2*h+'px';}}
  }

  // ---- render(): vom Controller je Frame aufgerufen ----
  function render(nextState,placementTargets=[]){
    if(state!==nextState){if(state) rebuildAll();state=nextState;}
    targetList=placementTargets;if(!ready) return;
    syncTileOverlays();syncTiles();syncLandmarks();syncEmpty();syncObjects();syncTargets();syncGhost();syncSelection();syncMines();syncEnemies();syncProjectiles();syncLabels();
    if(pickDirty){pickables=[...objectRecords.values()].flatMap(r=>r.picks).concat(layer.targets.children.map(g=>g.children[1]));pickDirty=false;}
  }
  function project(position,height=30){
    tmp.set(position.x,height,position.y).project(camera);if(tmp.z>1) return null;
    const box=host.getBoundingClientRect(),outer=wrap.getBoundingClientRect();
    return {x:(tmp.x+1)/2*box.width+box.left-outer.left,y:(1-tmp.y)/2*box.height+box.top-outer.top,width:outer.width,height:outer.height};
  }
  function reset(){clearOverlays();hoverBuildingKey=null;seenShots.clear();rebuildAll();for(const obj of enemyObjects.values()) layer.dynamic.remove(obj.group);enemyObjects.clear();for(const mesh of mineObjects.values())layer.dynamic.remove(mesh);mineObjects.clear();state=null;hoverPick=null;resetView(false);}

  // ---- Animation ----
  let last=performance.now(),raf=0,lastDraw=0,slowFrames=0;
  function lowerQuality(){
    if(quality==='low') return;quality='low';
    try{localStorage.setItem('hexQuality','low');}catch{/* Speichern nicht möglich */}
    gl.setPixelRatio(1);gl.setSize(Math.max(1,host.clientWidth),Math.max(1,host.clientHeight));
    sun.shadow.mapSize.set(1024,1024);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}
    console.info('Autohex TD: Grafik automatisch auf "niedrig" gestellt (?high in der Adresse stellt sie zurück).');
  }
  function loop(now){
    for(const record of objectRecords.values())for(const diamond of record.slotHints||[])if(diamond.visible){diamond.rotation.y=now*.0006;diamond.position.y=22+Math.sin(now*.0022+diamond.position.x)*3;}
    raf=requestAnimationFrame(loop);
    // Bildrate begrenzen: 60/s während einer Wave, sonst 30/s. Schont vor allem 120/144-Hz-Bildschirme und Laptops.
    const running=!!state?.waveRunning,interval=running?1000/60:1000/30;
    if(now-lastDraw<interval-2) return;
    const frame=now-lastDraw;lastDraw=now;
    if(quality==='high'&&running){                                     // dauerhaft unter ca. 30 Bildern/s in einer Wave: Grafik senken
      if(frame>34) slowFrames++;else slowFrames=Math.max(0,slowFrames-2);
      if(slowFrames>90) lowerQuality();
    }else slowFrames=0;
    const dt=Math.min((now-last)/1000,.1);last=now;
    if(state&&ready){
      const enemies=state.enemies||[];
      for(const record of objectRecords.values()) for(const obj of record.towers){
        if(obj.auraModel) obj.auraModel.rotation.y+=dt*.8;
        if(obj.hint.visible) obj.hint.position.y=66+Math.sin(now/220)*3;
        if(!obj.turret||obj.def.aura) continue;
        let best=null,bestDistance=obj.def.range;
        for(const e of enemies){const d=Math.hypot(e.x-obj.pos.x,e.y-obj.pos.y);if(d<=bestDistance){best=e;bestDistance=d;}}
        if(best){const wanted=Math.atan2(-(best.y-obj.pos.y),best.x-obj.pos.x),diff=Math.atan2(Math.sin(wanted-obj.angle),Math.cos(wanted-obj.angle));obj.angle+=diff*Math.min(1,dt*10);obj.turret.rotation.y=obj.angle;}
        if(obj.kick>0){obj.kick=Math.max(0,obj.kick-dt*9);const k=obj.kick*obj.kick*.045;obj.turret.position.set(obj.turretBase.x-Math.cos(obj.angle)*k,obj.turretBase.y,obj.turretBase.z+Math.sin(obj.angle)*k);}   // Rückstoß entgegen der Schussrichtung
      }
      for(const obj of enemyObjects.values()){
        obj.bar.quaternion.copy(camera.quaternion);
        if(!obj.pivot) continue;
        const diff=Math.atan2(Math.sin(obj.targetAngle-obj.angle),Math.cos(obj.targetAngle-obj.angle));obj.angle+=diff*Math.min(1,dt*10);obj.pivot.rotation.y=obj.angle;
        if(obj.pop>0){obj.pop=Math.max(0,obj.pop-dt*7);obj.pivot.scale.setScalar(1+.2*obj.pop);}else if(obj.pivot.scale.x!==1) obj.pivot.scale.setScalar(1);   // kurzes Aufplustern beim Treffer
        const swing=Math.sin(obj.phase)*.7;obj.pivot.position.y=Math.abs(Math.sin(obj.phase))*1.6;
        for(const limb of obj.limbs) limb.g.rotation.z=limb.name==='leg_l'?swing:limb.name==='leg_r'?-swing:limb.name==='arm_l'?-swing*.8:swing*.8;
      }
    }
    animateBiomeWind(now);placeLabels();gl.render(scene,camera);
  }

  // ---- Eingabe ----
  let drag=null,press=null,hoverTowerKey=null,hoverBuildingKey=null;
  function pick(event){setRay(event);const hit=ray.intersectObjects(pickables,false)[0];return hit?.object.userData.pick||null;}
  function updateHover(event){
    const found=pick(event),id=found?.kind==='target'?key(found.q,found.r):null;
    if(id!==hoverPick){if(hoverPick) commands.leavePlacement(hoverPick);if(id) commands.hoverPlacement(id);hoverPick=id;render(state,targetList);}
    const tw=found?.kind==='tower'?{q:found.q,r:found.r,index:found.index}:null,twKey=tw?tw.q+','+tw.r+','+tw.index:null;   // Reichweite beim Überfahren eines Turms
    if(twKey!==hoverTowerKey){hoverTowerKey=twKey;state.hoverTower=tw;render(state,targetList);}
    const building=found?.kind==='building'?{q:found.q,r:found.r,index:found.index}:null,buildingKey=building?`${building.q},${building.r},${building.index}`:null;
    if(buildingKey!==hoverBuildingKey){hoverBuildingKey=buildingKey;commands.hoverBuilding?.(building);}
    dom.style.cursor=found?(found.kind==='target'&&!found.legal?'not-allowed':'pointer'):'';
  }
  const capture=e=>{try{dom.setPointerCapture(e.pointerId);}catch{/* Zeiger nicht mehr aktiv */}};
  const on=(name,fn,options)=>{dom.addEventListener(name,fn,options);return [name,fn,options];};
  const listeners=[
    on('wheel',e=>{e.preventDefault();zoom(Math.exp(clamp(e.deltaY,-200,200)*.0015),e);},{passive:false}),
    on('contextmenu',e=>e.preventDefault()),
    on('auxclick',e=>{if(e.button===1)e.preventDefault();}),
    on('pointerdown',e=>{
      if(e.button===1&&commands.rotatePlacement?.()){e.preventDefault();return;}
      if(e.button===2||e.button===1){hoverBuildingKey=null;commands.hoverBuilding?.(null);e.preventDefault();drag={mode:'orbit',id:e.pointerId,x:e.clientX,y:e.clientY};capture(e);dom.style.cursor='grabbing';}
      else if(e.button===0) press={x:e.clientX,y:e.clientY};
    }),
    on('pointermove',e=>{
      if(drag&&drag.id===e.pointerId){
        if(drag.mode==='orbit'){
          cam.yaw-=(e.clientX-drag.x)*.006;cam.pitch=clamp(cam.pitch+(e.clientY-drag.y)*.005,PITCH_MIN,PITCH_MAX);drag.x=e.clientX;drag.y=e.clientY;
          applyCamera();commands.viewChanged?.();
        }else{const p=groundPoint(e);if(p){cam.x+=drag.p.x-p.x;cam.z+=drag.p.z-p.z;applyCamera();commands.viewChanged?.();}}
        return;
      }
      if(press&&!(e.buttons&1)) press=null;
      if(press&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>5){          // linke Taste gezogen: Karte verschieben statt klicken
        const p=groundPoint({clientX:press.x,clientY:press.y});press=null;
        if(p){drag={mode:'pan',id:e.pointerId,p};capture(e);dom.style.cursor='grabbing';
          if(hoverPick){commands.leavePlacement(hoverPick);hoverPick=null;if(state&&ready) render(state,targetList);}}
        return;
      }
      if(state&&ready) updateHover(e);
    }),
    on('pointerup',e=>{
      if(drag&&drag.id===e.pointerId){drag=null;dom.style.cursor='';return;}
      if(e.button!==0||!press) return;const moved=Math.hypot(e.clientX-press.x,e.clientY-press.y);press=null;if(moved>5||!state||!ready) return;
      const hit=pick(e);
      if(!hit) commands.clearSelection();
      else if(hit.kind==='target') commands.placeTile(hit.q,hit.r);
      else if(hit.kind==='slot') commands.selectSlot(hit.q,hit.r,hit.index);
      else if(hit.kind==='tower') commands.selectTower(hit.q,hit.r,hit.index);
      else if(hit.kind==='base') commands.selectBase?.();
      else if(hit.kind==='building') commands.selectBuilding(hit.q,hit.r,hit.index);
    }),
    on('pointercancel',()=>{hoverBuildingKey=null;commands.hoverBuilding?.(null);drag=null;press=null;dom.style.cursor='';}),
    on('pointerleave',()=>{hoverBuildingKey=null;commands.hoverBuilding?.(null);if(hoverPick){commands.leavePlacement(hoverPick);hoverPick=null;if(state&&ready) render(state,targetList);}})
  ];
  const resize=new ResizeObserver(()=>{const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);gl.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();if(state) commands.viewChanged?.();});
  resize.observe(host);applyCamera();raf=requestAnimationFrame(loop);

  return {render,reset,project,rotateView,zoom:factor=>zoom(factor),resetView:()=>resetView(true),getView,
    destroy(){
      destroyed=true;cancelAnimationFrame(raf);resize.disconnect();for(const [name,fn,options] of listeners) dom.removeEventListener(name,fn,options);
      windPool.mesh.geometry.dispose();windPool.mesh.material.dispose();windPool.mesh.dispose();mistPool.mesh.geometry.dispose();mistPool.mesh.material.dispose();mistPool.mesh.dispose();
      clearOverlays();slotDiamondGeometry.dispose();gridGeometry.dispose();buffGeometry.dispose();gridMaterial.dispose();buffMaterial.dispose();buffBorderMaterial.dispose();
      for(const material of biomeMaterials.values())material.dispose();biomeMaterials.clear();
      gl.dispose();host.remove();wrap.classList.remove('is3d');if(hintText) hintText.textContent=oldHint;host0.style.display='';
    }};
}

globalThis.HexThreeRenderer={create};
