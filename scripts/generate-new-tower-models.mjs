// Reproducible low-poly meshes based on the approved seven concept sheets.
// All stages are real geometry, with the existing turret pivot and asset naming.
import * as T from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
export const paths={gravity:[['gravityWell','gravityCore'],['gravityResonator','gravityTide']],wind:[['windCannon','windRotor'],['windGuide','windSwitch']],poison:[['poisonThorn','poisonGland'],['poisonSpore','poisonCauldron']],meteor:[['meteorCaller','meteorForge'],['meteorEmber','meteorMagma']],laser:[['laserFocus','laserPrism'],['laserSplitter','laserDouble']],gamble:[['gambleLoaded','gambleBank'],['gambleHigh','gambleFate']],portal:[['portalReturn','portalArch'],['portalTime','portalSluice']]};
const colors={gravity:'#9975c8',wind:'#d5e2ba',poison:'#91be4e',meteor:'#ed9850',laser:'#f5c960',gamble:'#be533d',portal:'#70d4d4'};
let serial=0,materials;
const C={stone:'#77796b',dark:'#333930',wood:'#805637',gold:'#b99150',cream:'#ece1be',iron:'#4c5851'};
function material(color,glow=false){const key=color+glow;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:.76,flatShading:true,...(glow?{emissive:color,emissiveIntensity:.28}:{})}));return materials.get(key);}
function mesh(root,geometry,p,color,name,glow=false){const m=new T.Mesh(geometry,material(color,glow));m.name=(name||'part')+'_'+serial++;m.position.fromArray(p);root.add(m);return m;}
function box(r,p,s,c,n){return mesh(r,new T.BoxGeometry(...s),p,c,n);}
function cylinder(r,p,top,bottom,height,c,n,sides=10){return mesh(r,new T.CylinderGeometry(top,bottom,height,sides),p,c,n);}
function orb(r,p,radius,c,n){return mesh(r,new T.IcosahedronGeometry(radius,1),p,c,n,true);}
function ring(r,p,radius,width,c,n,tilt=0){const m=mesh(r,new T.TorusGeometry(radius,width,5,18),p,c,n);m.rotation.x=Math.PI/2+tilt;return m;}
function rod(r,a,b,width,c,n){const va=new T.Vector3(...a),vb=new T.Vector3(...b),m=cylinder(r,va.clone().add(vb).multiplyScalar(.5).toArray(),width,width,va.distanceTo(vb),c,n,6);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),vb.sub(va).normalize());return m;}
function group(root,name,p=[0,0,0]){const g=new T.Group();g.name=name;g.position.fromArray(p);root.add(g);return g;}
function brassPosts(r,count,radius,top){for(let i=0;i<count;i++){const a=i*2*Math.PI/count;rod(r,[Math.cos(a)*radius,.19,Math.sin(a)*radius],[Math.cos(a)*radius*.75,top,Math.sin(a)*radius*.75],.022,C.gold,'claw');}}
function base(r,level){cylinder(r,[0,.035,0],.255,.28,.07,C.dark,'foot');cylinder(r,[0,.11,0],.225,.25,.09,C.stone,'stone');ring(r,[0,.16,0],.216,.016,C.gold,'rim');for(let i=0;i<8;i++){const a=i*Math.PI/4;box(r,[Math.cos(a)*.233,.10,Math.sin(a)*.233],[.025,.075,.025],C.dark,'mortar');}if(level>=3)for(let i=0;i<4;i++){const a=i*Math.PI/2;orb(r,[Math.cos(a)*.225,.175,Math.sin(a)*.225],.019,C.gold,'rivet');}}
function gravity(r,level,b){
  const y=b===1?.39:.35,size=.065+level*.009;orb(r,[0,y,0],size,'#13151e','black_hole');brassPosts(r,b===1?3:level===4?4:3,.16,y+.025);
  ring(r,[0,y,0],size+.025,.008,colors.gravity,'accretion',b===1?.15:0);
  if(b===0||level===1)for(let i=0;i<Math.max(1,level-1);i++){const m=ring(r,[0,y,0],.14+i*.025,.012,C.gold,'orbit');m.rotation.z=i*1.04+.4;}
  if(b===0&&level===4){ring(r,[0,y,0],.235,.024,C.gold,'event_horizon');ring(r,[0,y,0],.205,.014,colors.gravity,'event_light');}
  if(b===1){for(let i=0;i<level-1;i++)ring(r,[0,.26+i*.095,0],.19,.01,colors.gravity,'pulse');if(level>=3)for(const sign of [-1,1])orb(r,[sign*.14,y+.06,0],.028,colors.gravity,'satellite');}
}
function wind(r,level,b){
  box(r,[0,.245,0],[.15,.17,.14],C.wood,'mill');const rotor=group(r,'wind_rotor',[0,.40,.06]);
  if(b===1){rotor.rotation.z=-.45;ring(rotor,[0,0,0],.14+level*.008,.018,C.gold,'guide_ring',Math.PI/2);}
  cylinder(rotor,[0,0,0],.04,.04,.09,C.gold,'hub').rotation.x=Math.PI/2;
  for(let i=0;i<(b===0&&level>=3?6:4);i++){const blade=group(rotor,'sail_'+i);blade.rotation.z=i*Math.PI/(b===0&&level>=3?3:2);box(blade,[.09,0,0],[.17,.035,.025],C.wood,'spar');box(blade,[.105,.035,0],[.11,.07,.018],C.cream,'sail');}
  if(level>=2){for(const x of b===0&&level===4?[-.14,0,.14]:[0]){const m=cylinder(r,[x,.24,.17],.043,.06,.16,C.gold,'air_nozzle');m.rotation.x=Math.PI/2;ring(r,[x,.24,.25],.041,.008,C.dark,'nozzle_lip',Math.PI/2);}}
  if(b===1&&level>=3){box(r,[.19,.32,-.07],[.035,.15,.15],colors.wind,'deflector');if(level===4)ring(r,[0,.36,-.04],.22,.012,colors.wind,'redirect',Math.PI/2);}
}
function poison(r,level,b){
  const area=b===1;const tank=cylinder(r,[0,.26,0],area?.16:.09,area?.12:.08,.17,C.dark,'vessel');
  cylinder(r,[0,.30,0],area?.148:.081,area?.135:.079,.08,colors.poison,'venom');ring(r,[0,.35,0],area?.16:.09,.018,C.gold,'vessel_lip');
  if(!area){const barrel=rod(r,[0,.30,.03],[0,.39,.22],.022,C.gold,'needle');orb(r,[0,.38,.06],.055,colors.poison,'gland');if(level>=3)for(const x of [-.12,.12]){cylinder(r,[x,.26,-.03],.045,.045,.16,C.cream,'flask');orb(r,[x,.35,-.03],.042,colors.poison,'poison_reservoir');}if(level===4)for(let i=0;i<5;i++){const a=i*2*Math.PI/5;cylinder(r,[Math.cos(a)*.08,.45,Math.sin(a)*.08],0,.025,.09,C.gold,'crown');}}
  else for(let i=0;i<Math.min(3,level);i++){const a=i*2.094;const x=Math.cos(a)*.12,z=Math.sin(a)*.12;cylinder(r,[x,.42,z],.027,.04,.19,C.iron,'chimney');ring(r,[x,.52,z],.03,.012,C.gold,'vent');orb(r,[x,.54,z],.025+level*.003,colors.poison,'spore');}
}
function meteor(r,level,b){
  if(b!==1){brassPosts(r,3,.15,.39);orb(r,[0,.36,0],.073+level*.008,colors.meteor,'meteor');for(let i=0;i<Math.min(3,level);i++){const m=ring(r,[0,.36,0],.16+i*.013,.012,C.gold,'armillary');m.rotation.z=.5+i*.8;}if(level===4)for(let i=0;i<3;i++){const a=i*2.094;orb(r,[Math.cos(a)*.16,.46,Math.sin(a)*.16],.035,colors.meteor,'falling_star');}}
  else{cylinder(r,[0,.26,0],.18,.15,.2,C.dark,'crucible');cylinder(r,[0,.365,0],.15,.13,.025,colors.meteor,'lava');for(let i=0;i<6;i++){const a=i*Math.PI/3;const rock=orb(r,[Math.cos(a)*.17,.35,Math.sin(a)*.17],.065,C.iron,'basalt');rock.scale.y=1+(i%2)*.8;}orb(r,[0,.4,0],.05,colors.meteor,'ember');if(level>=3)ring(r,[0,.255,0],.185,.019,C.gold,'cauldron_band');if(level===4)for(const x of [-.10,.1])rod(r,[x,.18,.16],[x,.35,.18],.015,colors.meteor,'lava_channel');}
}
function laser(r,level,b){
  cylinder(r,[0,.24,0],.085,.12,.17,C.stone,'column');const count=b===1?(level===4?3:2):1;
  for(let i=0;i<count;i++){const x=(i-(count-1)/2)*.15,y=.34+(count===3&&i===1?.08:0);rod(r,[0,.23,0],[x,y,0],.025,C.gold,'lens_arm');const lens=group(r,'lens_'+i,[x,y,.07]);const tube=cylinder(lens,[0,0,0],b===1?.05:.055+level*.011,b===1?.055:.065+level*.011,.14,C.gold,'lens_housing');tube.rotation.x=Math.PI/2;ring(lens,[0,0,.075],b===1?.051:.06+level*.01,.012,C.iron,'focus_ring',Math.PI/2);const glass=orb(lens,[0,0,.08],b===1?.048:.053+level*.01,colors.laser,'lens_glass');glass.scale.z=.4;}
  if(b===0&&level>=3)for(const x of [-.13,.13])box(r,[x,.33,-.02],[.025,.16,.13],C.gold,'cooling_fin');if(level===4)ring(r,[0,.225,0],.15,.014,colors.laser,'energized_base');
}
function pip(r,x,y,z){const p=orb(r,[x,y,z],.012,C.cream,'pip');return p;}
function gamble(r,level,b){
  cylinder(r,[0,.22,0],.16,.19,.10,C.wood,'table');ring(r,[0,.28,0],.16,.018,C.gold,'roulette_rim');
  for(let i=0;i<12;i++){const a=i*Math.PI/6;const m=box(r,[Math.cos(a)*.12,.28,Math.sin(a)*.12],[.035,.014,.055],i%2?C.dark:colors.gamble,'pocket');m.rotation.y=-a;}
  if(b===0){const safe=box(r,[0,.36,-.04],[.19,.16,.14],C.iron,'vault');box(r,[0,.36,.04],[.15,.13,.025],C.gold,'vault_door');ring(r,[0,.36,.059],.038,.008,C.dark,'safe_lock',Math.PI/2);if(level>=3)for(const x of [-.075,.075])box(r,[x,.46,-.04],[.035,.04,.11],C.gold,'vault_crown');if(level===4){for(const x of [-.13,.13])box(r,[x,.37,-.04],[.055,.24,.14],C.gold,'bank_guard');ring(r,[0,.46,0],.12,.012,C.gold,'safe_halo');}}
  else{const dice=group(r,'dice',[0,.39,0]);dice.rotation.set(.3,.35,.3);const s=.09+level*.01;box(dice,[0,0,0],[s*2,s*2,s*2],b===1?colors.gamble:C.cream,'die');for(const x of [-.045,.045])for(const y of [-.045,.045])pip(dice,x,y,s+.005);pip(dice,0,s+.005,0);if(level>=3){const frame=ring(r,[0,.4,0],.20,.014,C.gold,'fate_ring');frame.rotation.z=.6;}if(level===4)ring(r,[0,.4,0],.23,.012,C.gold,'high_roller',Math.PI/2);}
}
function portal(r,level,b){
  const width=b===0?.14:.11,height=.36;for(const x of [-width,width]){box(r,[x,.32,0],[.065,.28,.075],C.stone,'arch_pillar');box(r,[x,.22,0],[.08,.04,.10],C.gold,'band');}
  const arch=ring(r,[0,.39,0],width,.027,C.gold,'arch',Math.PI/2);arch.scale.y=1.18;
  const core=mesh(r,new T.CircleGeometry(width-.018,18),[0,.36,.006],colors.portal,'portal_surface',true);core.scale.y=1.4;core.material.side=T.DoubleSide;
  if(b===0&&level>=3)for(const z of [-.09,.09])ring(r,[0,.37,z],.19,.019,C.gold,'return_arch',Math.PI/2);
  if(b===1)for(let i=0;i<level-1;i++){const m=ring(r,[0,.36,-.05-i*.035],.15,.012,C.iron,'time_gate',Math.PI/2);m.scale.y=1.3;}
  if(level===4){orb(r,[0,.565,0],.025,colors.portal,'keystone');if(b===1){for(const sign of [-1,1])cylinder(r,[0,.52,sign*.01],.025,0,.045,C.gold,'hourglass');}}
}
const builders={gravity,wind,poison,meteor,laser,gamble,portal};
export function buildTower(type,level=1,branch=0,edition=''){
  materials=new Map();serial=0;const root=new T.Group();root.name='tower_'+type;root.userData={concept:`artifacts/tower-concepts-2026-11-18/${type}.png`,level,branch};base(root,level);const turret=group(root,'turret'),weapon=group(turret,'weapon_orientation');weapon.rotation.y=Math.PI/2;builders[type](weapon,level,level===1?-1:branch);root.userData.forward='+X';
  if(edition){root.traverse(n=>{if(!n.isMesh)return;const c=n.material.color;if(c.equals(new T.Color(C.stone)))c.set(edition==='sakura'?'#a49d91':'#665e70');if(c.equals(new T.Color(C.gold)))c.set(edition==='sakura'?'#c6a36a':'#bb8c4b');});}
  root.updateMatrixWorld(true);return root;
}
export const models=Object.entries(paths).flatMap(([type,branches])=>[{id:type,type,level:1,branch:0},...branches.flatMap(([second,third],branch)=>[{id:type+'_'+second,type,level:2,branch},{id:type+'_'+third,type,level:3,branch},{id:type+'_'+third+'_ultimate',type,level:4,branch}])]);
export async function generate(){
  globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
  for(const edition of ['','sakura','halloween']){const out=new URL(`../assets/${edition?edition+'/':''}towers/`,import.meta.url);mkdirSync(out,{recursive:true});for(const model of models){const root=buildTower(model.type,model.level,model.branch,edition),data=await new GLTFExporter().parseAsync(root,{binary:true});writeFileSync(new URL('tower_'+model.id+'.glb',out),Buffer.from(data));}}
  console.log('Generated 49 tower stages in all 3 editions.');
}
if(process.argv[1]===fileURLToPath(import.meta.url))await generate();
