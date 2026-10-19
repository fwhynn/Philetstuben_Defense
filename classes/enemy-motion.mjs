// Shared by the live renderer and the GLB authoring script. Coordinates are model units.
export const MODEL_ENEMIES=['shieldbearer','thornToad','moltingBeetle','tarSnail','mushroomColossus','ramBeetle'];
export const isEnemyJoint=name=>name.startsWith('rig_');
export function enemyPose(type,name,phase,state={}){
  const p={x:0,y:0,z:0,rx:0,ry:0,rz:0,sx:1,sy:1,sz:1,visible:true};
  const left=/_l\d*$/.test(name),side=left?1:-1,s=Math.sin(phase),c=Math.cos(phase);
  if(name.startsWith('rig_leg_')){
    if(type==='moltingBeetle'||type==='ramBeetle'){
      const index=Number(name.slice(-1)),step=Math.sin(phase+index*Math.PI+(!left?Math.PI:0));
      p.ry=step*.3;p.rx=side*Math.max(0,step)*.22;
    }else if(type==='thornToad'){
      p.rz=state.leaping?-.7:state.crouching?.45:s*side*.2;
    }else p.rz=s*side*(type==='maskRunner'?.85:.45);
  }
  if(name.startsWith('rig_arm_'))p.rz=-s*side*(type==='shieldbearer'&&left?.1:type==='mushroomColossus'?.22:.42);
  if(name==='rig_body'){
    p.y=Math.abs(s)*(type==='tarSnail'?.001:.004);
    p.rx=s*(type==='mushroomColossus'?.035:.015);
    if(type==='tarSnail'){p.sx=1+s*.035;p.sz=1-s*.025;}
    if(type==='thornToad'){p.y+=state.leaping?.04:state.crouching?-.018:0;p.sy=state.crouching?.85:1;}
    if(type==='ramBeetle')p.rz=-(state.charge||0)*.12;
  }
  if(name==='rig_cape'){p.rz=.08+c*.12;p.rx=s*.08;}
  if(name==='rig_shell'){p.rx=s*.025;p.ry=c*.015;}
  if(name.startsWith('rig_antenna_')){p.rz=s*.12;p.rx=side*c*.1;}
  if(name.startsWith('rig_shell_')&&type==='moltingBeetle')p.visible=!state.molted;
  if(name==='rig_shield')p.visible=(state.shieldHits??3)>0;
  if(name.startsWith('rig_shield_'))p.visible=(state.shieldHits??3)===Number(name.slice(-1));
  return p;
}
export function applyEnemyPose(joint,base,pose){
  joint.position.set(base.x+pose.x,base.y+pose.y,base.z+pose.z);
  joint.rotation.set(pose.rx,pose.ry,pose.rz);joint.scale.set(pose.sx,pose.sy,pose.sz);joint.visible=pose.visible;
}
