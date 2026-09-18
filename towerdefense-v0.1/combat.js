const HexCombat=(()=>{
  function step(state,towerRefs,definitions,dt,time,emit=()=>{}){
    const TOWERS=definitions;
  function damageEnemy(e,dmg,type){
    e.hp-=dmg*(e.armor&&type==='archer'?.5:1);
    if(e.hp<=0&&e.alive){e.alive=false;const gold=e.killGold??HexWaves.economy.kill;state.gold+=gold;
      if(e.type==='boss'){state.goldEarned.boss=(state.goldEarned.boss||0)+gold;const landmark=state.landmarks?.get(e.landmarkId);if(landmark) landmark.status='defeated';(state.bossRewards??=[]).push(e.landmarkId);emit('collect');}
      else {state.goldEarned.kills+=gold;state.waveKills++;}emit('kill');}
  }
  function arrive(e){e.alive=false;state.hp-=e.baseDamage??1;const landmark=state.landmarks?.get(e.landmarkId);if(landmark) landmark.status='escaped';emit('hit');}

    for(const e of state.enemies){
      if(!e.alive) continue;
      if(e.index>=e.points.length-1){arrive(e);continue;}
      e.slowFactor=1;
      for(const ref of towerRefs){const def=HexData.towerDefinition(ref.tw,TOWERS);if(def.aura&&Math.hypot(e.x-ref.pos.x,e.y-ref.pos.y)<=def.range) e.slowFactor=Math.min(e.slowFactor,def.slow);}
      let distance=e.speed*dt*e.slowFactor;
      while(e.index<e.points.length-1){
        const a=e.points[e.index],b=e.points[e.index+1],length=Math.hypot(b.x-a.x,b.y-a.y);
        const remaining=length*(1-e.t);
        if(length>0&&distance<remaining){e.t+=distance/length;break;}
        distance-=remaining;e.t=0;e.index++;
        if(e.index>=e.points.length-1){arrive(e);break;}
      }
      if(!e.alive) continue;
      const ca=e.points[e.index], cb=e.points[e.index+1];
      e.x=ca.x+(cb.x-ca.x)*e.t; e.y=ca.y+(cb.y-ca.y)*e.t;
    }
    state.enemies=state.enemies.filter(e=>e.alive&&e.hp>0);

    for(const ref of towerRefs){
      const def=HexData.towerDefinition(ref.tw,TOWERS);
      if(def.aura) continue;
      if(time-ref.tw.lastShot < def.cooldown*1000) continue;
      const targets=state.enemies.filter(e=>e.alive&&e.hp>0&&Math.hypot(e.x-ref.pos.x,e.y-ref.pos.y)<=def.range).sort((a,b)=>a.hp-b.hp);
      if(!targets.length) continue;
      ref.tw.lastShot=time;
      emit(ref.tw.type);
      if(def.chain){
        const hit=[targets[0]];
        while(hit.length<def.chain){
          const last=hit[hit.length-1];
          const next=state.enemies.filter(e=>e.alive&&e.hp>0&&!hit.includes(e)&&Math.hypot(e.x-last.x,e.y-last.y)<=def.jumpRange).sort((a,b)=>Math.hypot(a.x-last.x,a.y-last.y)-Math.hypot(b.x-last.x,b.y-last.y))[0];
          if(!next) break;hit.push(next);
        }
        hit.forEach((e,i)=>damageEnemy(e,def.damage*Math.max(.25,1-i*.18),ref.tw.type));
        state.projectiles.push({kind:'chain',pts:[{x:ref.pos.x,y:ref.pos.y},...hit.map(e=>({x:e.x,y:e.y}))],ttl:.14,color:def.color});
      } else if(def.pierce){
        const primary=targets[0]; const vx=primary.x-ref.pos.x,vy=primary.y-ref.pos.y,mag=Math.hypot(vx,vy)||1; const ux=vx/mag,uy=vy/mag;
        const hit=[];
        for(const e of state.enemies){
          if(!e.alive||e.hp<=0) continue;
          const ex=e.x-ref.pos.x,ey=e.y-ref.pos.y; const along=ex*ux+ey*uy; const perp=Math.abs(ex*uy-ey*ux);
          if(along>0&&along<def.range&&perp<20){hit.push(e);damageEnemy(e,def.damage,ref.tw.type);}
        }
        state.projectiles.push({kind:'line',x1:ref.pos.x,y1:ref.pos.y,x2:ref.pos.x+ux*def.range,y2:ref.pos.y+uy*def.range,ttl:.16,color:def.color});
      } else {
        const e=targets[0];
        const hit=def.splash?state.enemies.filter(other=>other.alive&&Math.hypot(other.x-e.x,other.y-e.y)<=def.splash):[e];
        hit.forEach(other=>damageEnemy(other,def.damage,ref.tw.type));
        state.projectiles.push({kind:'line',x1:ref.pos.x,y1:ref.pos.y,x2:e.x,y2:e.y,ttl:.1,color:def.color});
      }
    }
    state.projectiles.forEach(p=>p.ttl-=dt); state.projectiles=state.projectiles.filter(p=>p.ttl>0);
    state.enemies=state.enemies.filter(e=>e.alive&&e.hp>0);
  }
  return {step};
})();
