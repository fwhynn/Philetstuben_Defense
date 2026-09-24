/* Dekorativer Hintergrund für Hauptmenü, Loadout und Arsenal: Spielmodelle locker verteilt, langsam drehend, halbtransparent.
   Rein optisch. Rendert nur, solange eines dieser Fenster sichtbar ist; ohne WebGL bleibt der reine Farbverlauf. */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const FILES=['towers/tower_archer','towers/tower_catapult','towers/tower_chain','towers/tower_freeze','towers/tower_mine','towers/tower_ballista','towers/tower_flame',
  'enemies/enemy_normal','enemies/enemy_armored','enemies/enemy_warded','enemies/enemy_swarm','enemies/enemy_boss',
  'landmarks/landmark_shrine','landmarks/landmark_treasure','buildings/building_house','buildings/building_forge','buildings/building_market',
  'tiles/tile_straight','tiles/tile_bigCurve','tiles/tile_tee','tiles/tile_village','tiles/tile_grove'];
const WATCHED=['mainMenu','loadoutOverlay','arsenalOverlay','saveOverlay','playModeOverlay','menuRulesOverlay'];

const backdrop=document.createElement('div');backdrop.id='menuBackdrop';
const canvas=document.createElement('canvas');backdrop.append(canvas);document.body.insertBefore(backdrop,document.body.firstChild);
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});}catch{renderer=null;}

document.documentElement.classList.add('menuBackdropOn');
const overlays=WATCHED.map(id=>document.getElementById(id)).filter(Boolean);
const anyOpen=()=>overlays.some(o=>!o.classList.contains('hidden'));

if(renderer){
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,200);
  camera.position.set(0,11,15);camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight('#e6f1ff','#6b7a4c',1.4));
  const sun=new THREE.DirectionalLight('#fff1d0',2.2);sun.position.set(6,12,8);scene.add(sun);

  const items=[];let running=false,last=0,loaded=false,loadGeneration=0;
  const inventory=fetch('assets/index.json').then(r=>r.ok?r.json():null).catch(()=>null);
  const rnd=(a,b)=>a+Math.random()*(b-a);

  function normalized(gltfScene,size){
    const box=new THREE.Box3().setFromObject(gltfScene),dim=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
    const holder=new THREE.Group(),scale=size/Math.max(dim.x,dim.y,dim.z,.001);
    gltfScene.position.sub(center).add(new THREE.Vector3(0,dim.y/2,0));holder.add(gltfScene);holder.scale.setScalar(scale);return holder;
  }
  function populate(models){
    // gestörtes Raster über die Bühne; die Mitte bleibt etwas freier, damit das Menü ruhig wirkt
    const cols=9,rows=5;
    for(let i=0;i<cols;i++) for(let j=0;j<rows;j++){
      const x=(i-(cols-1)/2)*3.9+rnd(-1,1),z=(j-(rows-1)/2)*3.6+rnd(-.9,.9);
      if(Math.abs(x)<5.2&&Math.abs(z)<3.8&&Math.random()<.8) continue;
      const m=models[Math.floor(Math.random()*models.length)],obj=m.template.clone(true);
      const wrap=new THREE.Group();wrap.add(obj);
      wrap.position.set(x,0,z);wrap.rotation.y=rnd(0,Math.PI*2);wrap.scale.setScalar(rnd(.85,1.3)*(m.tile?1.15:1));
      items.push({wrap,spin:rnd(.08,.22)*(Math.random()<.5?-1:1),phase:rnd(0,6.28),base:0});scene.add(wrap);
    }
  }
  function load(){
    if(loaded) return;loaded=true;const loader=new GLTFLoader(),models=[],edition=typeof HexAssetEdition!=='undefined'?HexAssetEdition:null,generation=++loadGeneration;
    // Sakura-Edition: vorhandene Sakura-Datei, sonst die normale.
    const one=(f,available)=>new Promise(done=>{const queue=(edition?edition.paths(f+'.glb',available):[f+'.glb']).filter(p=>!available||available.has(p));
      const attempt=()=>{const src=queue.shift();if(!src)return done();loader.load('assets/'+src,g=>{models.push({template:normalized(g.scene,f.startsWith('tiles/')?2.2:f.startsWith('towers/')?2.4:1.9),tile:f.startsWith('tiles/')});done();},undefined,attempt);};attempt();});
    inventory.then(list=>Promise.all(FILES.map(f=>one(f,list&&new Set(list)))))
      .then(()=>{if(generation===loadGeneration&&models.length) populate(models);});
  }
  function resize(){const w=backdrop.clientWidth||innerWidth,h=backdrop.clientHeight||innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  function frame(now){
    if(!running) return;requestAnimationFrame(frame);
    const dt=Math.min((now-last)/1000,.05);last=now;
    if(!reduce) for(const it of items){it.wrap.rotation.y+=it.spin*dt;it.phase+=dt*.6;it.wrap.position.y=Math.sin(it.phase)*.12;}
    renderer.render(scene,camera);
  }
  const reduce=matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function sync(){
    const open=anyOpen();backdrop.classList.toggle('on',open);
    if(open&&!running){running=true;load();resize();last=performance.now();requestAnimationFrame(frame);}
    else if(!open) running=false;
  }
  new ResizeObserver(()=>{if(running) resize();}).observe(backdrop);
  (typeof HexAssetEdition!=='undefined'?HexAssetEdition:null)?.onChange(()=>{for(const it of items) scene.remove(it.wrap);items.length=0;loaded=false;if(running) load();});
  const observer=new MutationObserver(sync);for(const o of overlays) observer.observe(o,{attributes:true,attributeFilter:['class']});
  sync();
}else{
  const observer=new MutationObserver(()=>backdrop.classList.toggle('on',anyOpen()));
  for(const o of overlays) observer.observe(o,{attributes:true,attributeFilter:['class']});
  backdrop.classList.toggle('on',anyOpen());
}
