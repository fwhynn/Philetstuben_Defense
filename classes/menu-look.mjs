/* „Pracht“-Look für den Hauptmenü-Hintergrund (classes/menu-backdrop.js), nur im Menü, die Spielkacheln bleiben unverändert.
   Stufe 1: goldene Stunde mit weichen Schatten, Fackeln und warmes Licht an der Festung, Bloom, Farbkorrektur und Vignette.
   Stufe 2: Wiese mit Waldrand, Felsen und Büschen um die Karten; dahinter Berge im Dunst, Himmelsverlauf, Sonne und Wolken.
   Der Hintergrund (Himmel, Berge, Wolken) ist eine eigene Szene mit waagerechter Kamera; die Menü-Kamera schaut steil auf die
   Karten, darum liegt der Horizont als „Kulisse“ hinter dem Waldrand. Die Kulisse wird je Bild in eine eigene Textur gerendert
   und ist der Hintergrund der Kartenszene. Jedes Ziel wird pro Bild nur einmal beschrieben: three.js verwirft den MSAA-Puffer
   nach jedem Rendern, ein zweiter Durchgang in dasselbe Ziel (oder Bloom darauf) zeichnete sonst auf verworfenen Inhalt.
   Die Nachbearbeitung läuft deshalb ohne MSAA und glättet am Ende mit SMAA. Schwache Geräte bekommen dasselbe Bild ohne Nachbearbeitung. */
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {SMAAPass} from 'three/addons/postprocessing/SMAAPass.js';
import {gradeShader} from './grade-shader.mjs?v=8387605f19c28ee8';

const DECOR=['pine_l','pine_m','pine_s','tree_a','tree_b','rock_a','rock_b','bush','grass','flowers','torch'];
export const LOOK_FILES=DECOR.map(name=>'decor/deco_'+name);
// Wiese: x ±GROUND_X, z von GROUND_BACK (Waldrand) bis GROUND_FRONT (unter dem unteren Bildrand).
export const GROUND_X=32,GROUND_BACK=-4.6,GROUND_FRONT=10.5;
// Horizont der Kulisse: so weit über der Bildmitte, dass die Bergfüße hinter dem Waldrand liegen (Menü-Kamera 0,11,15 → 0,0,0).
const HORIZON_PITCH=THREE.MathUtils.degToRad(8);
const HAZE='#e9dcc0';

export function rng(seed){let a=seed>>>0;return ()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}

/* Streuung für Wald, Felsen und Büsche. islands: [{x,z,r}] in Weltkoordinaten. Ergebnis: [{kind,x,z,scale,turn}].
   Rein rechnerisch (ohne three.js), damit der Test prüfen kann, dass nichts auf einer Karte steht. */
export function scatterDecor(islands,seed=11){
  const rnd=rng(seed),out=[],free=(x,z,pad)=>islands.every(i=>Math.hypot(x-i.x,z-i.z)>i.r+pad);
  const add=(kind,x,z,scale,pad=.15)=>{if(Math.abs(x)>GROUND_X-.5||z<GROUND_BACK-.6||z>GROUND_FRONT-.3||!free(x,z,pad))return;out.push({kind,x,z,scale,turn:rnd()*Math.PI*2});};
  const pick=list=>list[Math.floor(rnd()*list.length)];
  // Waldrand hinten: dichte, nach hinten größere Nadelbäume
  for(let row=0;row<4;row++)for(let x=-GROUND_X+.4;x<GROUND_X;x+=.5+rnd()*.25)
    add(pick(row<2?['pine_l','pine_l','pine_m','tree_b']:['pine_l','pine_m','tree_a','tree_b']),x+(rnd()-.5)*.3,GROUND_BACK+.1+row*.5+rnd()*.35,(3.3-row*.35)*(.85+rnd()*.3),.25);
  // Lockerer Wald und Lichtungen davor, nach vorn dünner
  for(let i=0;i<260;i++){const z=GROUND_BACK+2+rnd()**1.6*(GROUND_FRONT-GROUND_BACK-2),x=(rnd()*2-1)*GROUND_X,depth=(z-GROUND_BACK)/(GROUND_FRONT-GROUND_BACK);
    if(rnd()<.55-depth*.35)add(pick(['pine_l','pine_m','pine_s','tree_a','tree_b']),x,z,(2.6-depth)*(.8+rnd()*.4),.35);
    else if(rnd()<.5)add(pick(['rock_a','rock_b']),x,z,2+rnd()*2.4);
    else add(pick(['bush','bush','flowers','grass']),x,z,2+rnd()*1.2);}
  // Kranz aus Felsen, Büschen und kleinen Bäumen direkt um jede Karte, damit sie in der Landschaft steht
  for(const island of islands)for(let a=0;a<Math.PI*2;a+=.22+rnd()*.18){
    const r=island.r+.25+rnd()*.9,x=island.x+Math.cos(a)*r,z=island.z+Math.sin(a)*r,roll=rnd();
    add(roll<.3?pick(['rock_a','rock_b']):roll<.6?pick(['bush','grass','flowers']):pick(['pine_m','pine_s','tree_a']),x,z,roll<.6?1.8+rnd()*1.4:1.8+rnd()*.8,.1);
  }
  return out;
}

/* Fackelplätze auf der Festungskachel: zwei am Tor (Straßenausgang), zwei an der Rückseite. exit: Kantenrichtung 0–5. */
export function torchSpots(exit,tile=1.1){
  const DIRS=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]],[q,r]=DIRS[exit],x=Math.sqrt(3)*(q+r/2),z=1.5*r,base=Math.atan2(z,x),R=.74*tile;
  return [base-.5,base+.5,base+Math.PI-.75,base+Math.PI+.75].map(a=>({x:Math.cos(a)*R,z:Math.sin(a)*R}));
}


function gradientTexture(stops,width=4,height=512){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d'),g=ctx.createLinearGradient(0,0,0,height);
  for(const [at,color] of stops)g.addColorStop(at,color);ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
function glowTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(128,128,0,128,128,128);
  g.addColorStop(0,'rgba(255,246,214,1)');g.addColorStop(.12,'rgba(255,222,150,.95)');g.addColorStop(.4,'rgba(255,180,90,.35)');g.addColorStop(1,'rgba(255,160,80,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,256,256);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
// Low-Poly-Berg: Kegel mit verrauschten Ecken, Farbe nach Höhe (Wald, Fels, Schnee).
function mountain(rnd,radius,height,palette){
  const geo=new THREE.ConeGeometry(radius,height,6+Math.floor(rnd()*3),3).toNonIndexed(),pos=geo.attributes.position,colors=[];
  const jitter=new Map(),key=(x,y,z)=>x.toFixed(2)+','+y.toFixed(2)+','+z.toFixed(2);
  for(let i=0;i<pos.count;i++){
    const k=key(pos.getX(i),pos.getY(i),pos.getZ(i));if(!jitter.has(k)){const top=pos.getY(i)>height/2-1e-3;jitter.set(k,top?[0,0,0]:[(rnd()-.5)*radius*.35,(rnd()-.5)*height*.12,(rnd()-.5)*radius*.35]);}
    const [jx,jy,jz]=jitter.get(k);pos.setXYZ(i,pos.getX(i)+jx,pos.getY(i)+jy+height/2,pos.getZ(i)+jz);
  }
  for(let i=0;i<pos.count;i+=3){
    const h=(pos.getY(i)+pos.getY(i+1)+pos.getY(i+2))/3/height,c=new THREE.Color(h>palette.snow?palette.top:h>palette.rock?palette.mid:palette.low).offsetHSL(0,0,(rnd()-.5)*.05);
    for(let k=0;k<3;k++)colors.push(c.r,c.g,c.b);
  }
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  return new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1}));
}
// Mehrteiliges Modell als InstancedMesh je Teil (eine Zeichnung pro Teil statt pro Baum).
function instancer(model,capacity){
  model.updateMatrixWorld(true);const parts=[];model.traverse(o=>{if(o.isMesh)parts.push({o,local:o.matrixWorld.clone()});});
  const group=new THREE.Group(),meshes=parts.map(({o})=>{const m=new THREE.InstancedMesh(o.geometry,o.material,capacity);m.castShadow=m.receiveShadow=true;m.count=0;group.add(m);return m;});
  const tmp=new THREE.Matrix4();
  return {group,set(i,matrix){meshes.forEach((m,k)=>{tmp.multiplyMatrices(matrix,parts[k].local);m.setMatrixAt(i,tmp);});},
    commit(n){for(const m of meshes){m.count=n;m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();}}};
}

export function createMenuLook({renderer,scene,camera,tile=1.1,lite=false,reduce=false}){
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor('#bcd6e6',1);

  // --- Hauptszene: Licht der goldenen Stunde, Dunst, Wiese
  scene.fog=new THREE.Fog(HAZE,18,40);
  scene.add(new THREE.HemisphereLight('#cfe6ff','#5b4a2c',.95));
  const sun=new THREE.DirectionalLight('#ffd49a',3.1);sun.position.set(9,10,2.5);sun.target.position.set(0,0,1.5);
  sun.castShadow=true;sun.shadow.mapSize.set(lite?1024:2048,lite?1024:2048);sun.shadow.bias=-.0005;sun.shadow.normalBias=.02;
  Object.assign(sun.shadow.camera,{left:-22,right:22,top:14,bottom:-14,near:1,far:40});sun.shadow.camera.updateProjectionMatrix();
  const fill=new THREE.DirectionalLight('#9cc8ff',.45);fill.position.set(-8,5,8);
  scene.add(sun,sun.target,fill);
  const ground=new THREE.PlaneGeometry(GROUND_X*2,GROUND_FRONT-GROUND_BACK+1.4,64,18).toNonIndexed();ground.rotateX(-Math.PI/2);ground.translate(0,-.1,(GROUND_BACK+GROUND_FRONT)/2);
  {const pos=ground.attributes.position,colors=[],noise=(x,z)=>Math.sin(x*.9+z*.4)*.5+Math.sin(x*.23-z*1.3)*.35+Math.sin((x+z)*2.1)*.15,palette=['#4f8a33','#5f9a3c','#6ead45','#7cb84d'].map(c=>new THREE.Color(c));
    for(let i=0;i<pos.count;i++)pos.setY(i,-.1+noise(pos.getX(i)*1.7,pos.getZ(i)*1.7)*.035);
    for(let i=0;i<pos.count;i+=3){const x=(pos.getX(i)+pos.getX(i+1)+pos.getX(i+2))/3,z=(pos.getZ(i)+pos.getZ(i+1)+pos.getZ(i+2))/3,n=(noise(x,z)+1)/2,c=palette[Math.max(0,Math.min(3,Math.floor(n*4)))];for(let k=0;k<3;k++)colors.push(c.r,c.g,c.b);}
    ground.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));ground.computeVertexNormals();}
  const groundMesh=new THREE.Mesh(ground,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1}));groundMesh.receiveShadow=true;scene.add(groundMesh);
  const decorGroup=new THREE.Group();scene.add(decorGroup);

  // --- Kulisse: Himmel, Sonne, Berge, Wolken (eigene Szene, waagerechte Kamera)
  const sky=new THREE.Scene(),skyCamera=new THREE.PerspectiveCamera(camera.fov,1,1,600);skyCamera.position.set(0,4,0);skyCamera.rotation.x=-HORIZON_PITCH;
  const horizon=.5-.5*Math.tan(HORIZON_PITCH)/Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
  sky.background=gradientTexture([[0,'#2b7bc1'],[horizon*.5,'#4f9fd8'],[horizon*.85,'#a8d0ea'],[horizon,'#ffe1ae'],[Math.min(1,horizon+.08),'#ffcf96'],[1,'#ffcf96']]);
  sky.fog=new THREE.Fog('#dcdcd0',70,230);
  const skySun=new THREE.DirectionalLight('#ffd49a',2.6);skySun.position.set(9,6,-4);sky.add(new THREE.HemisphereLight('#cfe6ff','#55603f',1.1),skySun);
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture(),color:new THREE.Color(2.4,2.1,1.6),blending:THREE.AdditiveBlending,depthWrite:false,fog:false,transparent:true}));
  glow.position.set(110,22,-260);glow.scale.setScalar(80);sky.add(glow);
  {const rnd=rng(5);
    const ranges=[{dist:200,count:16,r:[34,52],h:[18,28],palette:{low:'#7f97ad',mid:'#8ea3b8',top:'#e6edf2',rock:.5,snow:.78}},
      {dist:140,count:15,r:[22,34],h:[13,20],palette:{low:'#4f6b55',mid:'#7c7f86',top:'#f2efe6',rock:.35,snow:.72}},
      {dist:95,count:18,r:[14,22],h:[7,11],palette:{low:'#2f5a35',mid:'#3d6a3e',top:'#55804a',rock:.6,snow:1.1}}];
    for(const range of ranges)for(let i=0;i<range.count;i++){
      const spread=range.dist*1.9,x=-spread+(i+rnd()*.8)*spread*2/range.count,z=-range.dist-rnd()*range.dist*.25;
      const m=mountain(rnd,range.r[0]+rnd()*(range.r[1]-range.r[0]),range.h[0]+rnd()*(range.h[1]-range.h[0]),range.palette);m.position.set(x,-4,z);m.rotation.y=rnd()*Math.PI;sky.add(m);
    }}
  const clouds=[];
  // Wolken: weiche Low-Poly-Haufen, von der Sonne warm angestrahlt und leicht selbstleuchtend, damit sie nicht grau wirken.
  {const rnd=rng(9),mat=new THREE.MeshStandardMaterial({color:'#ffffff',emissive:'#fff0dc',emissiveIntensity:.6,flatShading:true,roughness:1,fog:false});
    for(let i=0;i<9;i++){const cloud=new THREE.Group();for(let k=0;k<7;k++){const size=2.6+rnd()*2.6,puff=new THREE.Mesh(new THREE.IcosahedronGeometry(size,1),mat);puff.position.set((k-3)*3.2+rnd()*2,size*.25+rnd()*1.5-(Math.abs(k-3)*.6),rnd()*3);puff.scale.y=.62;cloud.add(puff);}
      const dist=170+rnd()*80;cloud.position.set(-260+i*60+rnd()*30,dist*Math.tan(THREE.MathUtils.degToRad(5+rnd()*5))+4,-dist);cloud.scale.setScalar(1+rnd()*.6);sky.add(cloud);clouds.push(cloud);}}

  // --- Nachbearbeitung: Kulisse, Karten, Bloom (Fackeln, Sonne), Farbkorrektur, Ausgabe mit Tonemapping.
  // Bloom-Schwelle 3 (HDR vor dem Tonemapping): sonnenbeschienene helle Flächen bleiben darunter, Flammen und Sonne liegen darüber.
  const skyTarget=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:4});scene.background=skyTarget.texture;
  let composer=null;
  if(!lite){try{
    composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType}));
    composer.addPass(new RenderPass(scene,camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(1,1),.6,.5,3));
    composer.addPass(new ShaderPass(gradeShader()));composer.addPass(new OutputPass());composer.addPass(new SMAAPass());
  }catch{composer=null;}}

  // --- Fackeln und Festungslicht je Karte
  const flames=[];let decorModels=null,instancers=null;
  function decorate(island,models,map){
    const torch=models.get('decor/deco_torch'),base=map.tiles.find(t=>t.type==='base');if(!base)return;
    torch?.traverse(o=>{if(o.isMesh&&/flame/.test(o.material?.name||'')){o.material.emissiveIntensity=12;o.castShadow=false;}});
    for(const spot of torchSpots(base.rotation,tile)){
      if(torch){const obj=torch.clone(true);obj.position.set(spot.x,.2*tile,spot.z);obj.scale.setScalar(tile*1.5);island.inner.add(obj);}
    }
    const keep=new THREE.PointLight('#ffb35c',5,5.5,1.6);keep.position.set(0,1.1,0);island.inner.add(keep);flames.push({light:keep,base:5,phase:Math.random()*9});
    const [a,b]=torchSpots(base.rotation,tile),gate=new THREE.PointLight('#ff9a3c',3,3.2,1.8);gate.position.set((a.x+b.x)/2,.75,(a.z+b.z)/2);island.inner.add(gate);flames.push({light:gate,base:3,phase:Math.random()*9});
    island.inner.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  }
  function setModels(models){
    decorModels=models;for(const child of [...decorGroup.children])decorGroup.remove(child);instancers=new Map();
    for(const name of DECOR){if(name==='torch')continue;const model=models.get('decor/deco_'+name);if(!model)continue;const inst=instancer(model,700);instancers.set(name,inst);decorGroup.add(inst.group);}
  }
  // Nach jeder Platzierung der Karten neu streuen (Fenstergröße ändert die Positionen).
  function layout(islands){
    if(!instancers)return;
    const spots=scatterDecor(islands.map(i=>({x:i.group.position.x,z:i.group.position.z,r:i.radius*i.group.scale.x})));
    const counts=new Map(),m=new THREE.Matrix4(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),s=new THREE.Vector3(),p=new THREE.Vector3();
    for(const spot of spots){const inst=instancers.get(spot.kind);if(!inst)continue;const n=counts.get(spot.kind)||0;if(n>=700)continue;
      q.setFromAxisAngle(up,spot.turn);s.setScalar(spot.scale*tile);p.set(spot.x,-.1,spot.z);m.compose(p,q,s);inst.set(n,m);counts.set(spot.kind,n+1);}
    for(const [kind,inst] of instancers)inst.commit(counts.get(kind)||0);
  }
  function resize(w,h,pixelRatio){skyCamera.aspect=w/h;skyCamera.updateProjectionMatrix();skyTarget.setSize(Math.round(w*pixelRatio),Math.round(h*pixelRatio));if(composer){composer.setPixelRatio(pixelRatio);composer.setSize(w,h);}}
  let time=0;
  function render(dt){
    time+=dt;
    if(!reduce){for(const f of flames)f.light.intensity=f.base*(.84+.1*Math.sin(time*11+f.phase)+.06*Math.sin(time*27+f.phase*2.3));
      for(const cloud of clouds){cloud.position.x+=dt*1.4;if(cloud.position.x>280)cloud.position.x=-280;}}
    renderer.setRenderTarget(skyTarget);renderer.render(sky,skyCamera);renderer.setRenderTarget(null);
    if(composer)composer.render(dt);else renderer.render(scene,camera);
  }
  return {decorate,setModels,layout,resize,render,get models(){return decorModels;},postprocessing:!!composer};
}
