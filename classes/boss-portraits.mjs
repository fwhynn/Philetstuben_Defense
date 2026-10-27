/* Bossporträts für die Podest-Medaillen der Bestenliste: die echten Bossmodelle (assets/enemies, je Edition), freigestellt
   und schräg von vorn gerendert. Der Rahmen passt sich jedem Modell an (Hüllquader), damit große und kleine Bosse gleich wirken.
   Schnittstelle: HexBossPortraits.url('boss_storm') → Promise<string|null>; BOSSES listet die verfügbaren Bosse. */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export const BOSSES=['boss','boss_storm','boss_ash','boss_desert','boss_iron','boss_hunter','boss_summoner'];
const SIZE=256,cache=new Map(),loader=new GLTFLoader();
const editionName=()=>typeof HexAssetEdition!=='undefined'?HexAssetEdition.get():'normal';
let renderer=null,scene=null,camera=null;
function setup(){
  if(renderer)return true;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});}catch{return false;}
  renderer.setSize(SIZE,SIZE,false);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(30,1,.01,50);
  scene.add(new THREE.HemisphereLight('#f2f7ff','#5b4a2c',1.6));
  const key=new THREE.DirectionalLight('#ffe2b0',3.2);key.position.set(2,3,2.5);scene.add(key);
  const rim=new THREE.DirectionalLight('#9cc8ff',1.4);rim.position.set(-2.5,1.5,-2);scene.add(rim);
  return true;
}
function load(name){
  const file='enemies/enemy_'+name+'.glb',edition=typeof HexAssetEdition!=='undefined'?HexAssetEdition:null,queue=edition?edition.paths(file):[file];
  return new Promise(done=>{const next=()=>{const src=queue.shift();if(!src)return done(null);loader.load('assets/'+src,g=>done(g.scene),undefined,next);};next();});
}
// Gegner schauen im Spiel entlang +x; die Kamera steht schräg davor und etwas erhöht.
async function render(name){
  const model=await load(name);if(!model||!setup())return null;
  const holder=model.clone(true);scene.add(holder);holder.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(holder),center=box.getCenter(new THREE.Vector3()),radius=box.getSize(new THREE.Vector3()).length()/2||1;
  const distance=radius/Math.sin(THREE.MathUtils.degToRad(camera.fov/2))*.74,dir=new THREE.Vector3(.78,.38,.5).normalize();
  camera.position.copy(center).addScaledVector(dir,distance);camera.near=distance/50;camera.far=distance*4;camera.updateProjectionMatrix();camera.lookAt(center);
  renderer.render(scene,camera);const url=renderer.domElement.toDataURL('image/png');
  scene.remove(holder);return url;
}
export function url(name){
  const id=name+'|'+editionName();
  if(!cache.has(id))cache.set(id,render(name).catch(()=>null));
  return cache.get(id);
}
globalThis.HexBossPortraits={url,BOSSES};
globalThis.dispatchEvent?.(new Event('hexbossportraitsready'));
