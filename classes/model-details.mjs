// Geometry additions use model-local coordinates; gameplay and hit timing are unchanged.
import * as T from 'three';
const material=(color,glow=false)=>new T.MeshStandardMaterial({color,flatShading:true,metalness:.35,roughness:.65,...(glow?{emissive:color,emissiveIntensity:.55}:{})});
function part(root,name,geometry,position,color,glow=false){const m=new T.Mesh(geometry,material(color,glow));m.name=name;m.position.set(...position);m.castShadow=true;root.add(m);return m;}
export function flameDetails(tower,height=.5){
  const g=new T.Group();g.name='flame-upgrade-details';
  if(!tower.finalUpgrade&&!tower.ultimate)return g;
  const sun=tower.finalUpgrade==='sunfire',color=sun?'#ffc94f':'#ff6838';
  const ring=part(g,'stage-three-crown',new T.TorusGeometry(.14,.018,5,12),[0,height*.72,0],color,true);ring.rotation.x=Math.PI/2;
  for(let i=0;i<(sun?6:4);i++){const a=i*Math.PI*2/(sun?6:4);part(g,'stage-three-flame',new T.ConeGeometry(.035,sun?.13:.19,5),[Math.cos(a)*.13,height*.84,Math.sin(a)*.13],color,true);}
  if(tower.ultimate){
    part(g,'phoenix-core',new T.OctahedronGeometry(.075),[0,height+.1,0],'#fff2a3',true);
    for(const sign of [-1,1])for(let i=0;i<3;i++){const feather=part(g,'phoenix-wing',new T.ConeGeometry(.045,.24-i*.035,4),[sign*(.08+i*.055),height+.05+i*.025,0],i===2?'#ff7236':'#ffd369',true);feather.rotation.z=-sign*(.6+i*.2);}
  }
  return g;
}
// identity:false, wenn ein eigenes Bossmodell (enemy_boss_<kind>) die Gestalt schon zeigt; dann nur die Biom-Akzente.
export function bossDetails(kind,biome,height,{identity=true}={}){
  const g=new T.Group();g.name='boss-identity-'+kind;
  const h=height||.6,color={iron:'#78838d',hunter:'#627875',summoner:'#9468ad'}[kind]||'#78838d';
  if(identity){
  if(kind==='iron')for(const sign of [-1,1]){
    part(g,'iron-shoulder',new T.BoxGeometry(h*.42,h*.25,h*.45),[0,h*.72,sign*h*.28],color);
    part(g,'iron-rivet',new T.ConeGeometry(h*.08,h*.16,4),[0,h*.92,sign*h*.28],'#c6cbd0');
  }
  if(kind==='hunter')for(const sign of [-1,1]){
    const horn=part(g,'hunter-horn',new T.ConeGeometry(h*.06,h*.35,5),[0,h*1.03,sign*h*.17],'#d4cfb5');horn.rotation.x=sign*.4;
    part(g,'hunter-blade',new T.ConeGeometry(h*.07,h*.42,4),[h*.16,h*.43,sign*h*.32],'#b4ddd2');
  }
  if(kind==='summoner'){
    part(g,'soul-mantle',new T.ConeGeometry(h*.35,h*.66,8),[0,h*.34,0],color);
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;part(g,'soul-crown',new T.ConeGeometry(h*.035,h*.23,4),[Math.cos(a)*h*.13,h,Math.sin(a)*h*.13],'#d0a9ec',true);}
  }
  }
  // Biome details supplement every identity, never replace it with a guardian.
  const accent={storm:'#abeced',ash:'#ed763e',desert:'#e6bd68'}[biome];
  if(accent)for(const sign of [-1,1]){
    const geo=biome==='storm'?new T.BoxGeometry(h*.07,h*.11,h*.42):biome==='ash'?new T.OctahedronGeometry(h*.09):new T.BoxGeometry(h*.3,h*.07,h*.2);
    const m=part(g,'biome-'+biome,geo,[-h*.08,h*.78,sign*h*.33],accent,biome==='ash');m.rotation.x=sign*.35;
  }
  return g;
}
