/* Dekorativer Hintergrund für Hauptmenü, Loadout und Arsenal: regelkonforme Spielkarten aus den echten Spielkacheln (classes/menu-maps.mjs),
   mit Festung, fünf Türmen auf Bauplätzen, Gebäuden und Gegnern, die auf der Straße zur Festung laufen. Im Hauptmenü kräftig, sonst gedämpft.
   Entwürfe (classes/menu-variant.js): „insel“ eine Karte links und rechts, „seite“ Menü links und Karte rechts, „gespiegelt“ umgekehrt.
   Look (classes/menu-variant.js): „pracht“ (Standard) mit Licht, Schatten, Fackeln, Bloom und Landschaft aus menu-look.mjs, „klassisch“ wie bisher.
   Rein optisch. Rendert nur, solange eines dieser Fenster sichtbar ist; ohne WebGL bleibt der reine Farbverlauf. */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MENU_MAPS} from './menu-maps.mjs';
import {MODEL_ENEMIES,isEnemyJoint,enemyPose} from './enemy-motion.mjs';
import {createMenuLook,LOOK_FILES} from './menu-look.mjs';

const WATCHED=['mainMenu','loadoutOverlay','arsenalOverlay','saveOverlay','playModeOverlay'];
const TILE=1.1,STEP=Math.PI/3,SQRT3=Math.sqrt(3);
const axialToWorld=(q,r)=>({x:TILE*SQRT3*(q+r/2),z:TILE*1.5*r});
// Spiel-Bausteine sind „const“ in klassischen Skripten: über ihren Namen erreichbar, aber nicht über globalThis.
const game=name=>{try{return {HexData,HexMap,HexModelMap}[name]??null;}catch{return null;}};

const backdrop=document.createElement('div');backdrop.id='menuBackdrop';
const canvas=document.createElement('canvas');backdrop.append(canvas);document.body.insertBefore(backdrop,document.body.firstChild);
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});}catch{renderer=null;}

document.documentElement.classList.add('menuBackdropOn');
const overlays=WATCHED.map(id=>document.getElementById(id)).filter(Boolean),mainMenu=document.getElementById('mainMenu');
const anyOpen=()=>overlays.some(o=>!o.classList.contains('hidden'));
const vivid=()=>!!mainMenu&&!mainMenu.classList.contains('hidden');
const variant=document.documentElement.dataset.menuVariant||'insel',stage=variant==='seite'||variant==='gespiegelt';
const reduce=matchMedia?.('(prefers-reduced-motion: reduce)').matches;
// Schwache Geräte und ?low bzw. Grafik „low“ (wie im Spiel-Renderer): Pracht-Look ohne Nachbearbeitung.
const lite=(()=>{try{if(new URLSearchParams(location.search).has('low')||localStorage.getItem('hexQuality')==='low')return true;}catch{}return (navigator.hardwareConcurrency||8)<=4||/Mobi|Android/i.test(navigator.userAgent||'');})();

if(renderer){
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,1,80);
  camera.position.set(0,11,15);camera.lookAt(0,0,0);
  let look=null;
  if(document.documentElement.dataset.menuLook!=='klassisch'){try{look=createMenuLook({renderer,scene,camera,tile:TILE,lite,reduce});}catch{look=null;}}
  if(!look){
    scene.add(new THREE.HemisphereLight('#e6f1ff','#4f5f38',1.35));
    const sun=new THREE.DirectionalLight('#fff1d0',2.4);sun.position.set(6,12,8);scene.add(sun);
    const rim=new THREE.DirectionalLight('#9fd0ff',.6);rim.position.set(-8,6,-10);scene.add(rim);
  }

  const islands=[];let running=false,last=0,loaded=false,loadGeneration=0;
  const inventory=fetch('assets/index.json').then(r=>r.ok?r.json():null).catch(()=>null);
  // Bei „gespiegelt“ steht die Karte links (side −1), das Menü rechts.
  const MAP_PLACEMENTS=stage?[{map:MENU_MAPS.stage,side:variant==='gespiegelt'?-1:1,tilt:0}]:[{map:MENU_MAPS.left,side:-1,tilt:.28},{map:MENU_MAPS.right,side:1,tilt:-.28}];
  function mapFiles(){
    const set=new Set(['tiles/tile_base_standard','bases/base_standard_walls_1','bases/base_standard_weapon_1','tiles/tile_fog']);
    for(const {map} of MAP_PLACEMENTS){for(const t of map.tiles)if(t.type!=='base')set.add('tiles/tile_'+t.type);for(const t of map.towers)set.add('towers/tower_'+t.model);for(const b of map.buildings)set.add('buildings/building_'+b.model);for(const e of map.enemies||[])set.add('enemies/enemy_'+e);}
    if(look)for(const f of LOOK_FILES)set.add(f);
    return [...set];
  }
  // Wie im Spiel-Renderer: Modell und Drehung aus HexModelMap, Türme auf HexMap.slotPositions, Gebäude auf HexMap.buildingPosition.
  function buildMap(models,{map,side,tilt}){
    const group=new THREE.Group(),inner=new THREE.Group();group.add(inner);
    const lib=game('HexData')?.CARD_LIBRARY||{},hexMap=game('HexMap'),modelMap=game('HexModelMap'),toMenu=v=>v/(hexMap?.HEX||54)*TILE;
    const put=(file,x,y,z,rotation=0)=>{const model=models.get(file);if(!model)return;const obj=model.clone(true);obj.position.set(x,y,z);obj.rotation.y=rotation;obj.scale.setScalar(TILE);inner.add(obj);};
    for(const tile of map.tiles){
      const p=axialToWorld(tile.q,tile.r),spin=tile.rotation*STEP;
      if(tile.type==='base'){for(const file of ['tiles/tile_base_standard','bases/base_standard_walls_1','bases/base_standard_weapon_1'])put(file,p.x,0,p.z,spin);continue;}
      const spec=modelMap?.modelFor({...tile,roads:(lib[tile.type]?.roads||[]).map(d=>(d+tile.rotation)%6)})||{name:tile.type,rotation:tile.rotation};
      put('tiles/tile_'+spec.name,p.x,0,p.z,(spec.rotation||0)*STEP);
    }
    if(hexMap)for(const t of map.towers){
      const tile=map.tiles.find(x=>x.q===t.q&&x.r===t.r),pos=hexMap.slotPositions({...tile,slots:lib[tile.type]?.slots||0})[t.index];
      if(pos)put('towers/tower_'+t.model,toMenu(pos.x),.006,toMenu(pos.y));
    }
    if(hexMap)for(const b of map.buildings){
      const tile=map.tiles.find(x=>x.q===b.q&&x.r===b.r),pos=hexMap.buildingPosition(tile,b.index);
      put('buildings/building_'+b.model,toMenu(pos.x),.006,toMenu(pos.y));
    }
    for(const f of map.fog){const p=axialToWorld(f.q,f.r);put('tiles/tile_fog',p.x,0,p.z,0);}
    const walkers=[],path=route(map,lib,hexMap,toMenu);
    if(path)(map.enemies||[]).forEach((type,i,list)=>{
      const model=models.get('enemies/enemy_'+type);if(!model)return;
      // Gliedmaßen wie im Spiel: benannte Knoten (leg_l … bzw. rig_*) mit ihrer Ausgangslage; der Körper wippt im Schritt.
      const obj=model.clone(true),body=new THREE.Group(),limbs=[];body.add(obj);body.scale.setScalar(TILE);inner.add(body);
      obj.traverse(node=>{if(LIMBS.includes(node.name)||isEnemyJoint(node.name))limbs.push({node,name:node.name,pos:node.position.clone(),rot:node.rotation.clone(),scale:node.scale.clone()});});
      walkers.push({obj:body,inner:obj,type,limbs,articulated:MODEL_ENEMIES.includes(type),phase:i*1.7,s:path.total*i/list.length});
    });
    for(const walker of walkers)walk(walker,path,0);
    // Grundfläche der Karte (Mittelpunkt bis äußerste Kachel), damit Wald und Felsen nicht auf ihr stehen.
    const radius=Math.max(...[...map.tiles,...map.fog].map(t=>{const p=axialToWorld(t.q,t.r);return Math.hypot(p.x,p.z);}))+TILE;
    const island={group,inner,side,phase:side>0?Math.PI:0,walkers,path,radius};
    look?.decorate(island,models,map);
    group.rotation.y=tilt;scene.add(group);islands.push(island);
  }
  // Gegnerweg wie im Spiel: vom entferntesten Feld über die Straßen zur Festung, entlang HexMap.roadGeometry (folgt auch Kurven).
  function route(map,lib,hexMap,toMenu){
    if(!hexMap?.roadGeometry)return null;
    const DIRS=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]],id=(q,r)=>q+','+r,tiles=new Map();
    for(const t of map.tiles)tiles.set(id(t.q,t.r),{...t,roads:t.type==='base'?[t.rotation]:(lib[t.type]?.roads||[]).map(d=>(d+t.rotation)%6)});
    const parent=new Map([['0,0',null]]),queue=['0,0'];let far='0,0';
    while(queue.length){const cur=queue.shift(),t=tiles.get(cur);far=cur;for(const d of t.roads){const n=id(t.q+DIRS[d][0],t.r+DIRS[d][1]);if(tiles.has(n)&&!parent.has(n)){parent.set(n,{from:cur,edge:(d+3)%6});queue.push(n);}}}
    const chain=[];for(let cur=far;cur;cur=parent.get(cur)?.from)chain.push(cur);
    if(chain.length<2)return null;
    const points=[];let enter=null;
    for(let i=0;i<chain.length;i++){
      const t=tiles.get(chain[i]),legs=hexMap.roadGeometry(t).legs,next=chain[i+1],exit=next?parent.get(chain[i]).edge:null;
      const center=hexMap.axialToWorld(t.q,t.r);
      const part=[...(enter===null?[center]:[...(legs.get(enter)||[center])].reverse()),...(exit===null?[center]:legs.get(exit)||[center])];
      for(const p of part){const x=toMenu(p.x),z=toMenu(p.y),last=points.at(-1);if(!last||Math.hypot(last.x-x,last.z-z)>.01)points.push({x,z});}
      if(next)enter=(exit+3)%6;
    }
    const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(points[i].x-points[i-1].x,points[i].z-points[i-1].z));
    return {points,lengths,total:lengths.at(-1)};
  }
  function walk(walker,path,ds){
    walker.s=(walker.s+ds)%path.total;
    let i=1;while(i<path.lengths.length-1&&path.lengths[i]<walker.s)i++;
    const a=path.points[i-1],b=path.points[i],k=(walker.s-path.lengths[i-1])/Math.max(1e-6,path.lengths[i]-path.lengths[i-1]);
    walker.obj.position.set(a.x+(b.x-a.x)*k,.006,a.z+(b.z-a.z)*k);walker.obj.rotation.y=Math.atan2(-(b.z-a.z),b.x-a.x);
    animate(walker,ds);
  }
  // Laufanimation wie im Spiel-Renderer: Schrittphase wächst mit der Strecke (0,14 je Spieleinheit), Gelenke nach enemy-motion.mjs.
  const LIMBS=['leg_l','leg_r','arm_l','arm_r'],STEP_PER_UNIT=.14*(54/TILE);
  function animate(walker,ds){
    walker.phase+=ds*STEP_PER_UNIT;
    if(walker.articulated){
      for(const limb of walker.limbs){const p=enemyPose(walker.type,limb.name,walker.phase,{});
        limb.node.position.set(limb.pos.x+p.x,limb.pos.y+p.y,limb.pos.z+p.z);limb.node.rotation.set(limb.rot.x+p.rx,limb.rot.y+p.ry,limb.rot.z+p.rz);
        limb.node.scale.set(limb.scale.x*p.sx,limb.scale.y*p.sy,limb.scale.z*p.sz);limb.node.visible=p.visible;}
      return;
    }
    const swing=Math.sin(walker.phase)*.7;walker.inner.position.y=Math.abs(Math.sin(walker.phase))*1.6/54;
    for(const limb of walker.limbs){const turn=limb.name==='leg_l'?swing:limb.name==='leg_r'?-swing:limb.name==='arm_l'?-swing*.8:swing*.8;limb.node.rotation.set(limb.rot.x,limb.rot.y,limb.rot.z+turn);}
  }
  function load(){
    if(loaded) return;loaded=true;const loader=new GLTFLoader(),models=new Map(),edition=typeof HexAssetEdition!=='undefined'?HexAssetEdition:null,generation=++loadGeneration;
    // Editionen: vorhandene Editionsdatei, sonst die normale.
    const one=(f,available)=>new Promise(done=>{const queue=(edition?edition.paths(f+'.glb',available):[f+'.glb']).filter(p=>!available||available.has(p));
      const attempt=()=>{const src=queue.shift();if(!src)return done();loader.load('assets/'+src,g=>{models.set(f,g.scene);done();},undefined,attempt);};attempt();});
    inventory.then(list=>Promise.all(mapFiles().map(f=>one(f,list&&new Set(list)))))
      .then(()=>{if(generation===loadGeneration&&models.size){look?.setModels(models);for(const placement of MAP_PLACEMENTS)buildMap(models,placement);place();}});
  }
  // „insel“: Karten rahmen das Menü an den Bildrändern. „seite“/„gespiegelt“: eine Bildhälfte; im Hochformat unter dem Menü.
  function place(){
    const portrait=camera.aspect<1,z=portrait?4.8:2.6,distance=Math.hypot(camera.position.y,camera.position.z-z);
    const halfWidth=distance*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect;
    for(const island of islands){
      if(stage&&portrait){island.group.position.set(0,0,4.4);island.group.scale.setScalar(.62);}
      else if(stage){island.group.position.set(island.side*halfWidth*.5,0,1.2);island.group.scale.setScalar(Math.min(1.05,halfWidth*.42/4.6));}
      else{island.group.position.set(island.side*Math.max(4,halfWidth-3.2),0,z);island.group.scale.setScalar(.82);}
    }
    look?.layout(islands);
  }
  function resize(){const w=backdrop.clientWidth||innerWidth,h=backdrop.clientHeight||innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();look?.resize(w,h,renderer.getPixelRatio());place();}
  function frame(now){
    if(!running) return;requestAnimationFrame(frame);
    const dt=Math.min((now-last)/1000,.05);last=now;
    if(!reduce)for(const island of islands){
      // Im Pracht-Look stehen die Karten in der Landschaft, daher ohne Schweben.
      if(!look){island.phase+=dt*.5;island.inner.position.y=Math.sin(island.phase)*.05;}
      if(stage)island.group.rotation.y+=dt*.08*island.side;
      for(const walker of island.walkers)walk(walker,island.path,dt*.4);
    }
    if(look)look.render(dt);else renderer.render(scene,camera);
  }
  function sync(){
    const open=anyOpen();backdrop.classList.toggle('on',open);backdrop.classList.toggle('vivid',open&&vivid());
    if(open&&!running){running=true;load();resize();last=performance.now();requestAnimationFrame(frame);}
    else if(!open) running=false;
  }
  new ResizeObserver(()=>{if(running) resize();}).observe(backdrop);
  (typeof HexAssetEdition!=='undefined'?HexAssetEdition:null)?.onChange(()=>{for(const island of islands) scene.remove(island.group);islands.length=0;loaded=false;if(running) load();});
  const observer=new MutationObserver(sync);for(const o of overlays) observer.observe(o,{attributes:true,attributeFilter:['class']});
  sync();
}else{
  const sync=()=>{backdrop.classList.toggle('on',anyOpen());backdrop.classList.toggle('vivid',anyOpen()&&vivid());};
  const observer=new MutationObserver(sync);
  for(const o of overlays) observer.observe(o,{attributes:true,attributeFilter:['class']});
  sync();
}
