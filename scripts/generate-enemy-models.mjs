// Reproducible, texture-free low-poly models based on assets/enemies-concepts/*.png.
// Run: node scripts/generate-enemy-models.mjs. GLBs can be imported and edited in Blender.
import * as T from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {MODEL_ENEMIES,isEnemyJoint,enemyPose,applyEnemyPose} from '../classes/enemy-motion.mjs';

const materials=new Map();
function mat(color,name=color,metal=0){
  const key=name+color;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({name,color,roughness:metal?.32:.85,metalness:metal,flatShading:true}));return materials.get(key);
}
const C={iron:'#535761',steel:'#90969e',dark:'#302d2d',wood:'#925931',woodLight:'#b67d43',leather:'#573c29',olive:'#737744',ivory:'#e2d1aa',gold:'#d9a346',red:'#a04430',amber:'#e6a334',cream:'#e4d7b7'};
function group(root,name,pos=[0,0,0]){const g=new T.Group();g.name=name;g.position.fromArray(pos);root.add(g);return g;}
let serial=0;
function mesh(root,geo,pos,scale,color,name,metal=0){const m=new T.Mesh(geo,mat(color,name||color,metal));m.name=(name||'part')+'_'+serial++;m.position.fromArray(pos);m.scale.fromArray(scale);root.add(m);return m;}
const ico=(r,p,s,c,n)=>mesh(r,new T.IcosahedronGeometry(1,0),p,s,c,n);
const ell=(r,p,s,c,n)=>mesh(r,new T.SphereGeometry(1,10,6),p,s,c,n);
const box=(r,p,s,c,n)=>mesh(r,new T.BoxGeometry(1,1,1),p,s,c,n);
function cone(r,p,radius,height,c,n,top=0){return mesh(r,new T.CylinderGeometry(top,radius,height,7),p,[1,1,1],c,n);}
function link(r,a,b,width,c,n,endWidth=width){const va=new T.Vector3(...a),vb=new T.Vector3(...b),mid=va.clone().add(vb).multiplyScalar(.5);const m=mesh(r,new T.CylinderGeometry(endWidth,width,va.distanceTo(vb),6),mid.toArray(),[1,1,1],c,n);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),vb.sub(va).normalize());return m;}
function eyes(r,x,y,z,size=.045,color=C.amber){for(const sign of [-1,1]){ell(r,[x,y,sign*z],[size*.65,size,size],color,'eye');ell(r,[x+size*.5,y,sign*z],[size*.35,size*.7,size*.5],C.dark,'pupil');}}
function human(root,{armor=false,mask=false,mushroom=false}={}){
  const body=group(root,'rig_body',[0,.55,0]);
  ell(body,[0,.15,0],[mushroom?.32:.20,mushroom?.38:.27,.22],mushroom?C.cream:armor?C.iron:mask?C.red:C.olive,'torso');
  if(!mushroom){box(body,[0,-.05,0],[.34,.075,.42],C.leather,'belt');box(body,[.185,-.05,0],[.025,.08,.1],C.steel,'buckle');}
  for(const [side,z] of [['l',-.13],['r',.13]]){
    const leg=group(root,'rig_leg_'+side,[0,.36,z]);
    link(leg,[0,0,0],[-.035,-.18,0],.075,armor?C.iron:mushroom?C.cream:C.leather,'thigh');
    ico(leg,[-.02,-.17,0],[.085,.09,.085],armor?C.steel:mushroom?C.cream:C.leather,'knee');
    link(leg,[-.035,-.18,0],[.015,-.29,0],.07,armor?C.iron:C.leather,'shin');
    ell(leg,[.06,-.30,0],[.14,.06,.09],armor?C.iron:C.leather,'boot');
    const arm=group(root,'rig_arm_'+side,[0,.82,side==='l'?-.29:.29]);
    ico(arm,[0,0,0],[.13,.14,.13],armor?C.steel:mushroom?C.cream:mask?C.red:C.olive,'shoulder');
    link(arm,[0,-.05,0],[.01,-.28,0],.07,armor?C.iron:C.leather,'arm');
    ico(arm,[.025,-.29,0],[.075,.095,.08],armor?C.steel:C.leather,'hand');
  }
  return body;
}
function shieldbearer(r){
  const b=human(r);ell(b,[0,.46,0],[.16,.19,.15],C.leather,'head');box(b,[.14,.45,0],[.07,.1,.13],C.ivory,'face');
  cone(b,[0,.56,0],.21,.20,C.iron,'helmet',.095);cone(b,[0,.48,0],.25,.045,C.iron,'brim',.22);
  box(b,[.15,.60,0],[.025,.16,.035],C.steel,'helmet_band');
  for(const hits of [3,2,1]){
    const shield=group(r,'rig_shield_'+hits,[.20,.53,-.23]);shield.visible=hits===3;
    for(let i=0;i<5;i++){if(hits===1&&(i===0||i===4))continue;box(shield,[.04,hits===3?0:(i%2?-.04:.03),(i-2)*.09],[.08,(.72-Math.abs(i-2)*.025)*(hits===3?1:i%2?.65:.85),.087],i%2?C.wood:C.woodLight,'shield_plank');}
    for(const y of hits===3?[-.28,0,.28]:hits===2?[-.23,0]:[0]){box(shield,[.09,y,0],[.025,.055,hits===1?.27:.47],C.iron,'shield_band');for(const z of hits===1?[-.08,.08]:[-.18,0,.18])ico(shield,[.109,y,z],[.018,.018,.018],C.steel,'rivet');}
    if(hits<3)for(let i=0;i<4-hits;i++){const crack=box(shield,[.085,.12-i*.1,(i-1)*.07],[.008,.19,.014],C.dark,'crack');crack.rotation.x=.5;}
  }
  const hand=r.getObjectByName('rig_arm_r');link(hand,[-.25,-.25,0],[.55,-.25,0],.022,C.wood,'spear');
  const spear=cone(hand,[.64,-.25,0],.055,.20,C.steel,'spear_tip');spear.rotation.z=-Math.PI/2;
}
function maskRunner(r){
  const b=human(r,{mask:true});ell(b,[-.025,.38,0],[.22,.29,.22],C.red,'hood');
  ico(b,[.16,.38,0],[.075,.25,.19],C.ivory,'mask');
  for(const z of [-.085,.085]){const eye=box(b,[.222,.40,z],[.012,.065,.045],C.dark,'mask_eye');eye.rotation.x=z>0?.25:-.25;}
  cone(b,[0,-.015,0],.30,.23,C.red,'tunic',.18);
  const cape=group(r,'rig_cape',[-.13,.84,0]);
  for(const z of [-.13,0,.13])link(cape,[0,0,z],[-.40,-.25,z*1.6],.09,C.red,'cape_tail',.025);
  link(b,[-.08,.56,0],[-.30,.52,0],.09,C.red,'hood_tip',.015);
}
function insectLegs(r){
  for(const side of ['l','r'])for(let i=0;i<3;i++){
    const sign=side==='l'?-1:1,g=group(r,`rig_leg_${side}${i}`,[.30-i*.29,.25,sign*.22]);
    link(g,[0,0,0],[.06,.02,sign*.20],.055,C.leather,'upper_leg');ico(g,[.06,.02,sign*.20],[.075,.07,.07],C.olive,'joint');
    link(g,[.06,.02,sign*.20],[.13,-.19,sign*.32],.045,C.leather,'lower_leg',.016);
    ico(g,[.13,-.20,sign*.32],[.06,.025,.06],C.dark,'foot');
  }
}
function moltingBeetle(r){
  insectLegs(r);const b=group(r,'rig_body',[0,.31,0]);ell(b,[-.06,.02,0],[.49,.26,.29],C.amber,'soft_abdomen');
  for(const side of ['l','r']){
    const z=side==='l'?-.17:.17,g=group(r,'rig_shell_'+side,[-.10,.40,z]);
    ell(g,[0,.04,0],[.46,.20,.19],C.ivory,'shell_rim');ell(g,[0,.065,0],[.43,.20,.17],C.olive,'shell_plate');
  }
  ell(b,[.40,0,0],[.23,.18,.23],C.olive,'head');eyes(b,.575,.045,.105,.025);
  for(const sign of [-1,1]){link(b,[.53,-.07,sign*.12],[.68,-.1,sign*.16],.045,C.ivory,'mandible');link(b,[.68,-.1,sign*.16],[.73,-.08,sign*.075],.026,C.ivory,'mandible_tip',.004);}
  for(let i=0;i<3;i++)ico(b,[.22-i*.23,.24,0],[.15,.06,.20],C.ivory,'ridge');
}
function ramBeetle(r){
  insectLegs(r);const b=group(r,'rig_body',[0,.32,0]);ell(b,[-.1,.04,0],[.47,.30,.33],C.dark,'body');
  for(const sign of [-1,1]){ell(b,[-.12,.10,sign*.16],[.45,.29,.18],C.red,'carapace');
    for(const x of [-.35,.10])ell(b,[x,.11,sign*.18],[.055,.28,.16],C.gold,'shell_band');}
  ico(b,[.39,.015,0],[.24,.22,.25],C.red,'head');eyes(b,.56,-.01,.13,.026);
  link(b,[.51,.10,0],[.78,.16,0],.13,C.ivory,'horn_root',.11);link(b,[.78,.16,0],[.92,.36,0],.11,C.ivory,'horn',.008);
}
function thornToad(r){
  const b=group(r,'rig_body',[0,.25,0]);ell(b,[-.08,.02,0],[.38,.25,.31],C.olive,'body');ell(b,[.21,-.01,0],[.22,.19,.26],C.gold,'throat');ell(b,[.20,.14,0],[.25,.12,.28],C.olive,'head');
  eyes(b,.34,.20,.19,.065);box(b,[.425,.06,0],[.012,.017,.33],C.dark,'mouth');
  for(let i=0;i<4;i++)cone(b,[-.29+i*.15,.25,0],.06,.18+(3-i)*.025,C.ivory,'spine');
  for(const side of ['l','r'])for(let i=0;i<2;i++){
    const sign=side==='l'?-1:1,g=group(r,`rig_leg_${side}${i}`,[i?-.24:.21,.19,sign*.23]);
    ell(g,[-.03,-.015,sign*.055],[i?.17:.07,.11,.10],C.olive,'haunch');link(g,[-.03,-.04,sign*.07],[.08,-.13,sign*.16],.05,C.olive,'foreleg');
    for(let j=-1;j<=1;j++)link(g,[.08,-.13,sign*.16],[.20,-.15,sign*(.16+j*.05)],.023,C.olive,'toe',.006);
  }
}
function tarSnail(r){
  const b=group(r,'rig_body',[0,.07,0]);ell(b,[0,0,0],[.52,.07,.23],C.woodLight,'foot');ell(b,[.34,.10,0],[.19,.17,.20],C.woodLight,'head');eyes(b,.48,.13,.12,.033,C.dark);
  const shell=group(r,'rig_shell',[-.10,.29,0]);ell(shell,[0,.08,0],[.34,.34,.25],C.iron,'shell');
  // Spiral ridges on both sides of the shell; geometry, not a picture mapped onto a plane.
  for(const sign of [-1,1])for(let i=0;i<22;i++){
    const a=i*.40,aa=(i+1)*.40,rad=.025+i*.010,rr=.025+(i+1)*.010;
    link(shell,[Math.cos(a)*rad,.08+Math.sin(a)*rad,sign*(.25-rad*.11)],[Math.cos(aa)*rr,.08+Math.sin(aa)*rr,sign*(.25-rr*.11)],.016,i%5===0?C.gold:C.dark,'spiral');
  }
  for(const [side,sign] of [['l',-1],['r',1]]){const g=group(r,'rig_antenna_'+side,[.39,.22,sign*.1]);link(g,[0,0,0],[.06,.18,sign*.05],.02,C.woodLight,'antenna',.012);ico(g,[.06,.18,sign*.05],[.035,.035,.035],C.gold,'tip');}
}
function mushroomColossus(r){
  const b=human(r,{mushroom:true});
  // Low-poly lathed cap with an underside and a broad red rim.
  const points=[[0,0],[.15,.02],[.35,.08],[.50,.18],[.47,.27],[.30,.38],[0,.43]].map(([x,y])=>new T.Vector2(x,y));
  const cap=mesh(b,new T.LatheGeometry(points,12),[0,.39,0],[1,1,1],C.red,'cap');
  cone(b,[0,.41,0],.45,.03,C.cream,'gills',.43);
  for(const [x,z,size] of [[.25,.13,.09],[-.19,.22,.08],[.06,-.24,.10],[-.24,-.12,.07],[0,0,.09]])ell(b,[x,.835-Math.hypot(x,z)*.22,z],[size,.019,size*.8],C.cream,'cap_spot');
  eyes(b,.26,.26,.09,.028,C.dark);
  for(let i=0;i<3;i++)ell(b,[-.10,.22-i*.10,.28],[.12,.035,.10],C.gold,'shelf_fungus');
}
const builders={shieldbearer,maskRunner,thornToad,moltingBeetle,tarSnail,mushroomColossus,ramBeetle};
export function buildEnemy(type){
  const scene=new T.Group();scene.name='enemy_'+type;scene.userData={concept:`assets/enemies-concepts/${type}.png`,forward:'+X',animation:'rigid-joint low-poly'};serial=0;builders[type](scene);
  // Bake mesh transforms locally, then scale coordinates, leaving unit-scale joint pivots.
  const factor=type==='mushroomColossus'?.34:type==='ramBeetle'?.30:.29;
  scene.traverse(n=>{n.position.multiplyScalar(factor);if(n.isMesh){n.geometry.scale(n.scale.x*factor,n.scale.y*factor,n.scale.z*factor);n.scale.setScalar(1);}});
  scene.updateMatrixWorld(true);return scene;
}
export function clipsFor(scene,type){
  const joints=[];scene.traverse(n=>{if(isEnemyJoint(n.name))joints.push({n,base:n.position.clone()});});
  const clips=[];
  for(const kind of ['Walk',...(type==='thornToad'?['Jump']:type==='maskRunner'?['Sprint']:type==='ramBeetle'?['Charge']:[])]){
    const tracks=[];
    for(const {n,base} of joints){
      const times=[],positions=[],rotations=[],scales=[];
      for(let frame=0;frame<=24;frame++){
        const t=frame/24,state=kind==='Jump'?{crouching:t<.25,leaping:t>=.25&&t<.7}:kind==='Charge'?{charge:1}:{};
        applyEnemyPose(n,base,enemyPose(type,n.name,t*Math.PI*2,state));times.push(t);positions.push(...n.position);rotations.push(...n.quaternion);scales.push(...n.scale);
      }
      tracks.push(new T.VectorKeyframeTrack(n.name+'.position',times,positions),new T.QuaternionKeyframeTrack(n.name+'.quaternion',times,rotations),new T.VectorKeyframeTrack(n.name+'.scale',times,scales));
      n.position.copy(base);n.rotation.set(0,0,0);n.scale.setScalar(1);
    }
    const clip=new T.AnimationClip(kind,1,tracks);if(kind==='Sprint'){clip.tracks.forEach(t=>t.scale(.6));clip.resetDuration();}clips.push(clip);
  }
  return clips;
}
export async function generate(){
  globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
  const out=new URL('../assets/enemies/',import.meta.url);mkdirSync(out,{recursive:true});
  for(const type of MODEL_ENEMIES){const scene=buildEnemy(type),animations=clipsFor(scene,type),data=await new GLTFExporter().parseAsync(scene,{binary:true,animations,onlyVisible:false});writeFileSync(new URL(`enemy_${type}.glb`,out),Buffer.from(data));console.log(type,Math.round(data.byteLength/1024)+' KiB');}
}
if(process.argv[1]===fileURLToPath(import.meta.url))await generate();
