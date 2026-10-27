/* Turmporträts fürs Turmfenster: das echte Turmmodell (assets/towers, je Edition) auf einem Gras-Hex-Sockel, als Bild gerendert.
   Kamera wie im Briefing (#18): 39,6° Sichtfeld, 30° Neigung, Blick auf (0; 0,24; 0). Ergebnisse werden je Modell und Edition zwischengespeichert.
   Schnittstelle: HexTowerPortraits.url(['tower_archer_volley','tower_archer']) → Promise<string|null> (erstes vorhandene Modell). */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const SIZE=192,cache=new Map(),models=new Map(),loader=new GLTFLoader();
// HexAssetEdition ist „const“ in einem klassischen Skript: über den Namen erreichbar, nicht über globalThis.
const editionName=()=>typeof HexAssetEdition!=='undefined'?HexAssetEdition.get():'normal';
let renderer=null,scene=null,camera=null,stand=null;
function setup(){
  if(renderer)return true;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});}catch{return false;}
  renderer.setSize(SIZE,SIZE,false);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(39.6,1,.1,20);camera.position.set(0,1.34,1.91);camera.lookAt(0,.24,0);
  scene.add(new THREE.HemisphereLight('#eef6ff','#5b6b3f',1.5));
  const key=new THREE.DirectionalLight('#fff1d6',2.6);key.position.set(1.6,2.4,1.8);scene.add(key);
  const back=new THREE.DirectionalLight('#a9c98f',.9);back.position.set(-1.8,1.2,-1.6);scene.add(back);
  // Sockel im Stil der Kartenbilder: Wiese mit hellem Rand, darunter Erde.
  stand=new THREE.Group();
  const grass=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.05,6),new THREE.MeshStandardMaterial({color:'#8fc25a',flatShading:true,roughness:.9}));grass.position.y=-.025;
  const rim=new THREE.Mesh(new THREE.CylinderGeometry(.44,.44,.035,6),new THREE.MeshStandardMaterial({color:'#5f8f3c',flatShading:true}));rim.position.y=-.06;
  const earth=new THREE.Mesh(new THREE.CylinderGeometry(.43,.38,.2,6),new THREE.MeshStandardMaterial({color:'#8b6a45',flatShading:true,roughness:1}));earth.position.y=-.175;
  stand.add(grass,rim,earth);scene.add(stand);
  return true;
}
function paths(name){
  const edition=typeof HexAssetEdition!=='undefined'?HexAssetEdition:null,file='towers/'+name+'.glb';
  return edition?edition.paths(file):[file];
}
function loadModel(name){
  const id=name+'|'+editionName();
  if(!models.has(id))models.set(id,new Promise(done=>{const queue=paths(name);const next=()=>{const src=queue.shift();if(!src)return done(null);loader.load('assets/'+src,g=>done(g.scene),undefined,next);};next();}));
  return models.get(id);
}
async function render(name){
  const model=await loadModel(name);if(!model||!setup())return null;
  const holder=model.clone(true);scene.add(holder);
  renderer.render(scene,camera);const url=renderer.domElement.toDataURL('image/png');
  scene.remove(holder);return url;
}
function url(names){
  const id=names.join('|')+'|'+editionName();
  if(!cache.has(id))cache.set(id,(async()=>{for(const name of names){const result=await render(name);if(result)return result;}return null;})());
  return cache.get(id);
}
globalThis.HexTowerPortraits={url};
globalThis.dispatchEvent?.(new Event('hexportraitsready'));
