const HexCombat=(()=>{
  const DEFAULT_PRIORITY=['closestBase','mostHealth','boss'];
  const pool=(e,name)=>Math.max(0,Number(e[name])||0);
  const durability=e=>pool(e,'hp')+pool(e,'armorHp')+pool(e,'magicHp');
  function remainingDistance(e){let value=0;if(!e.points?.length)return Infinity;if(e.index<e.points.length-1){const a=e.points[e.index],b=e.points[e.index+1];value+=Math.hypot(b.x-a.x,b.y-a.y)*(1-(e.t||0));}for(let i=e.index+1;i<e.points.length-1;i++)value+=Math.hypot(e.points[i+1].x-e.points[i].x,e.points[i+1].y-e.points[i].y);return value;}
  function targetByPriority(candidates,tower,pos){
    const priorities=Array.isArray(tower.targetPriority)&&tower.targetPriority.length?tower.targetPriority:DEFAULT_PRIORITY;
    for(const priority of priorities){
      let eligible=candidates;if(priority==='boss')eligible=candidates.filter(e=>e.type==='boss');if(priority==='mostArmor')eligible=candidates.filter(e=>pool(e,'armorHp')>0);if(priority==='mostMagic')eligible=candidates.filter(e=>pool(e,'magicHp')>0);if(!eligible.length)continue;
      const value=e=>priority==='mostArmor'?pool(e,'armorHp'):priority==='mostMagic'?pool(e,'magicHp'):priority==='mostHealth'?pool(e,'hp'):priority==='leastHealth'?-pool(e,'hp'):priority==='furthestBase'?remainingDistance(e):priority==='closestBase'?-remainingDistance(e):priority==='furthestTower'?Math.hypot(e.x-pos.x,e.y-pos.y):-Math.hypot(e.x-pos.x,e.y-pos.y);
      return eligible.reduce((best,e)=>value(e)>value(best)?e:best);
    }
    return candidates[0];
  }
  function damageEnemy(e,raw,def,state,emit=()=>{}){
    let budget=raw*(e.type==='boss'?(def.bossMultiplier||1):1);
    for(const [field,kind] of [['armorHp','armor'],['magicHp','magic'],['hp','hp']]){if(budget<=0||pool(e,field)<=0)continue;const multiplier=def.damageMultipliers?.[kind]??1,amount=Math.min(pool(e,field),budget*multiplier);e[field]=pool(e,field)-amount;budget-=amount/multiplier;}
    if(durability(e)<=1e-8&&e.alive){e.hp=e.armorHp=e.magicHp=0;e.alive=false;const gold=e.killGold??HexWaves.economy.kill;state.gold+=gold;if(e.type==='boss'){state.goldEarned.boss=(state.goldEarned.boss||0)+gold;const landmark=state.landmarks?.get(e.landmarkId);if(landmark)landmark.status='defeated';(state.bossRewards??=[]).push(e.landmarkId);if(state.earnedMeta){if(String(e.landmarkId).startsWith('wave:'))state.earnedMeta.periodicBosses++;else state.earnedMeta.explorationBosses++;}emit('collect');}else{state.goldEarned.kills+=gold;state.waveKills++;if(state.earnedMeta)state.earnedMeta.normalKills++;emit('kill');}}
  }
  function mineCandidates(state,ref,range){
    if(ref.roadPoints)return ref.roadPoints.filter(p=>Math.hypot(p.x-ref.pos.x,p.y-ref.pos.y)<=range);if(typeof HexMap==='undefined'||!state.map)return [];
    const unique=new Map();for(const tile of state.map.values())for(const points of HexMap.roadGeometry(tile).legs.values())for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],length=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.max(1,Math.ceil(length/24));for(let j=0;j<steps;j++){const t=(j+.5)/steps,p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};if(Math.hypot(p.x-ref.pos.x,p.y-ref.pos.y)<=range)unique.set(`${Math.round(p.x)},${Math.round(p.y)}`,p);}}return [...unique.values()];
  }
  function layMine(state,ref,def,time){
    state.mines??=[];const owner=ref.tw.mineId??=`mine-tower-${state.nextMineTowerId=(state.nextMineTowerId||0)+1}`;if(time-ref.tw.lastShot<def.cooldown*1000)return;
    const candidates=mineCandidates(state,ref,def.range);if(!candidates.length)return;const index=(ref.tw.mineCursor||0)%candidates.length,p=candidates[index];ref.tw.mineCursor=index+1;ref.tw.lastShot=time;state.mines.push({id:state.nextMineId=(state.nextMineId||0)+1,owner,x:p.x,y:p.y,damage:def.damage,splash:def.splash,color:def.color,damageMultipliers:def.damageMultipliers});
  }
  function triggerMines(state,emit){
    state.mines??=[];const remaining=[];for(const mine of state.mines){const trigger=state.enemies.find(e=>e.alive&&durability(e)>0&&Math.hypot(e.x-mine.x,e.y-mine.y)<=14);if(!trigger){remaining.push(mine);continue;}const def={damageMultipliers:mine.damageMultipliers};state.enemies.filter(e=>e.alive&&Math.hypot(e.x-mine.x,e.y-mine.y)<=mine.splash).forEach(e=>damageEnemy(e,mine.damage,def,state,emit));state.projectiles.push({kind:'blast',x:mine.x,y:mine.y,r:mine.splash,ttl:.22,color:mine.color});emit('mine');}state.mines=remaining;
  }
  // Nur für die Darstellung: Kennung, Turmtyp, Trefferpositionen und Lebensdauer eines Geschosses. Der Schaden wird sofort beim Schuss verrechnet.
  const nextProjectileId=state=>state.nextProjectileId=(state.nextProjectileId||0)+1;
  const FLIGHT_TTL={archer:.24,ballista:.3};   // sichtbare Flugzeit von Pfeil und Bolzen (Sekunden)
  const FOLLOW_MIN=12,FOLLOW_GAP=18;   // Mindestabstand und Beginn der Bremszone zwischen Gegnern (Weltmaß)
  function step(state,towerRefs,definitions,dt,time,emit=()=>{}){
    const TOWERS=definitions;state.mines??=[];const arrive=e=>{e.alive=false;state.hp-=e.baseDamage??1;const landmark=state.landmarks?.get(e.landmarkId);if(landmark)landmark.status='escaped';emit('hit');};
    // Abstand halten: Nachfolger bremsen vor dem Vordermann, damit Gegner nicht ineinander laufen (Bosse ausgenommen).
    const progress=new Map();for(const e of state.enemies) if(e.alive&&e.type!=='boss') progress.set(e,remainingDistance(e));
    const followFactor=e=>{
      const mine=progress.get(e);if(mine===undefined||!Number.isFinite(mine)) return 1;
      let factor=1;
      for(const [other,rest] of progress){
        if(other===e||!other.alive||mine-rest<=.5) continue;
        const gap=Math.hypot(other.x-e.x,other.y-e.y);
        if(gap<FOLLOW_GAP) factor=Math.min(factor,Math.max(0,(gap-FOLLOW_MIN)/(FOLLOW_GAP-FOLLOW_MIN)));
      }
      return factor;
    };
    for(const e of state.enemies){if(!e.alive)continue;if(e.index>=e.points.length-1){arrive(e);continue;}e.slowFactor=1;for(const ref of towerRefs){const def=HexData.towerDefinition(ref.tw,TOWERS);if(def.aura&&Math.hypot(e.x-ref.pos.x,e.y-ref.pos.y)<=def.range)e.slowFactor=Math.min(e.slowFactor,def.slow);}e.slowFactor=Math.max(e.minSpeedFactor||0,e.slowFactor);let distance=e.speed*dt*e.slowFactor*followFactor(e);while(e.index<e.points.length-1){const a=e.points[e.index],b=e.points[e.index+1],length=Math.hypot(b.x-a.x,b.y-a.y),remaining=length*(1-e.t);if(length>0&&distance<remaining){e.t+=distance/length;break;}distance-=remaining;e.t=0;e.index++;if(e.index>=e.points.length-1){arrive(e);break;}}if(e.alive){const a=e.points[e.index],b=e.points[e.index+1];e.x=a.x+(b.x-a.x)*e.t;e.y=a.y+(b.y-a.y)*e.t;}}
    triggerMines(state,emit);state.enemies=state.enemies.filter(e=>e.alive&&durability(e)>0);
    for(const ref of towerRefs){const def=HexData.towerDefinition(ref.tw,TOWERS);if(def.aura)continue;if(def.mine){layMine(state,ref,def,time);continue;}if(time-ref.tw.lastShot<def.cooldown*1000)continue;const inRange=state.enemies.filter(e=>e.alive&&durability(e)>0&&Math.hypot(e.x-ref.pos.x,e.y-ref.pos.y)<=def.range);if(!inRange.length)continue;const primary=targetByPriority(inRange,ref.tw,ref.pos);ref.tw.lastShot=time;emit(ref.tw.type);
      if(def.chain){const hit=[primary];while(hit.length<def.chain){const last=hit.at(-1),next=state.enemies.filter(e=>e.alive&&durability(e)>0&&!hit.includes(e)&&Math.hypot(e.x-last.x,e.y-last.y)<=def.jumpRange).sort((a,b)=>Math.hypot(a.x-last.x,a.y-last.y)-Math.hypot(b.x-last.x,b.y-last.y))[0];if(!next)break;hit.push(next);}hit.forEach((e,i)=>damageEnemy(e,def.damage*Math.max(.25,1-i*.18),def,state,emit));state.projectiles.push({kind:'chain',pts:[ref.pos,...hit.map(e=>({x:e.x,y:e.y}))],ttl:.24,max:.24,color:def.color,tower:ref.tw.type,id:nextProjectileId(state),hits:hit.map(e=>e.id),hitAt:hit.map(e=>({x:e.x,y:e.y}))});}
      else if(def.pierce){const vx=primary.x-ref.pos.x,vy=primary.y-ref.pos.y,mag=Math.hypot(vx,vy)||1,ux=vx/mag,uy=vy/mag,hit=[];for(const e of state.enemies){if(!e.alive||durability(e)<=0)continue;const ex=e.x-ref.pos.x,ey=e.y-ref.pos.y,along=ex*ux+ey*uy,perp=Math.abs(ex*uy-ey*ux);if(along>0&&along<def.range&&perp<20)hit.push({enemy:e,along});}const struck=hit.sort((a,b)=>a.along-b.along).slice(0,def.pierceTargets||3);struck.forEach(({enemy})=>damageEnemy(enemy,def.damage,def,state,emit));state.projectiles.push({kind:'line',x1:ref.pos.x,y1:ref.pos.y,x2:ref.pos.x+ux*def.range,y2:ref.pos.y+uy*def.range,ttl:.38,max:.38,color:def.color,tower:ref.tw.type,id:nextProjectileId(state),hits:struck.map(h=>h.enemy.id),hitAt:struck.map(h=>({x:h.enemy.x,y:h.enemy.y,along:h.along/def.range}))});}
      else{const hit=def.splash?state.enemies.filter(e=>e.alive&&Math.hypot(e.x-primary.x,e.y-primary.y)<=def.splash):[primary];const life=FLIGHT_TTL[ref.tw.type]||.1;hit.forEach(e=>damageEnemy(e,def.damage,def,state,emit));state.projectiles.push({kind:'line',x1:ref.pos.x,y1:ref.pos.y,x2:primary.x,y2:primary.y,ttl:life,max:life,color:def.color,tower:ref.tw.type,id:nextProjectileId(state),hits:hit.map(e=>e.id),hitAt:[{x:primary.x,y:primary.y}]});}
    }
    state.projectiles.forEach(p=>p.ttl-=dt);state.projectiles=state.projectiles.filter(p=>p.ttl>0);state.enemies=state.enemies.filter(e=>e.alive&&durability(e)>0);
  }
  return {step,durability,remainingDistance,targetByPriority};
})();
