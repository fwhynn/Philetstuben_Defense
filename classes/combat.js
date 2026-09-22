const HexCombat=(()=>{
  const DEFAULT_PRIORITY=['closestBase','mostHealth','boss'];
  const pool=(e,name)=>Math.max(0,Number(e[name])||0);
  const durability=e=>pool(e,'hp')+pool(e,'armorHp')+pool(e,'magicHp');
  function remainingDistance(e){let value=0;if(!e.points?.length)return Infinity;if(e.index<e.points.length-1){const a=e.points[e.index],b=e.points[e.index+1];value+=(b.tunnel?0:Math.hypot(b.x-a.x,b.y-a.y))*(1-(e.t||0));}for(let i=e.index+1;i<e.points.length-1;i++)value+=e.points[i+1].tunnel?0:Math.hypot(e.points[i+1].x-e.points[i].x,e.points[i+1].y-e.points[i].y);return value;}
  function targetByPriority(candidates,tower,pos,distance=remainingDistance){
    const priorities=Array.isArray(tower.targetPriority)&&tower.targetPriority.length?tower.targetPriority:DEFAULT_PRIORITY;
    for(const priority of priorities){
      let eligible=candidates;if(priority==='boss')eligible=candidates.filter(e=>e.type==='boss');if(priority==='mostArmor')eligible=candidates.filter(e=>pool(e,'armorHp')>0);if(priority==='mostMagic')eligible=candidates.filter(e=>pool(e,'magicHp')>0);if(!eligible.length)continue;
      const value=e=>priority==='mostArmor'?pool(e,'armorHp'):priority==='mostMagic'?pool(e,'magicHp'):priority==='mostHealth'?pool(e,'hp'):priority==='leastHealth'?-pool(e,'hp'):priority==='furthestBase'?distance(e):priority==='closestBase'?-distance(e):priority==='furthestTower'?Math.hypot(e.x-pos.x,e.y-pos.y):-Math.hypot(e.x-pos.x,e.y-pos.y);
      if(eligible.length===1)return eligible[0];
      let best=eligible[0],bestValue=value(best);
      for(let i=1;i<eligible.length;i++){const candidate=eligible[i],score=value(candidate);if(score>bestValue){best=candidate;bestValue=score;}}
      return best;
    }
    return candidates[0];
  }
  function nextChainTarget(enemies,hit,last,range){
    let best=null,bestDistance=Infinity;
    for(const enemy of enemies){
      if(!enemy.alive||durability(enemy)<=0||hit.includes(enemy))continue;
      const distance=Math.hypot(enemy.x-last.x,enemy.y-last.y);
      // Strict comparison preserves the stable-sort winner for equal distances.
      if(distance<=range&&(!best||distance<bestDistance)){best=enemy;bestDistance=distance;}
    }
    return best;
  }
  function damageEnemy(e,raw,def,state,emit=()=>{},source=null){
    const before=durability(e);
    const resistance=Math.max(0,Math.min(.95,e.resistances?.[def.damageType]||0));
    let budget=raw*(1-resistance)*(e.type==='boss'?(def.bossMultiplier||1):1);
    for(const [field,kind] of [['armorHp','armor'],['magicHp','magic'],['hp','hp']]){if(budget<=0||pool(e,field)<=0)continue;const multiplier=def.damageMultipliers?.[kind]??1,amount=Math.min(pool(e,field),budget*multiplier);e[field]=pool(e,field)-amount;budget-=amount/multiplier;}
    HexData.recordTowerStat(state,source,'damage',Math.max(0,before-durability(e)));
    if(durability(e)<=1e-8&&e.alive){e.hp=e.armorHp=e.magicHp=0;e.alive=false;(state.soulDeaths??=[]).push({x:e.x,y:e.y});const gold=e.killGold??HexWaves.economy.kill;state.gold+=gold;if(e.type==='boss'){state.goldEarned.boss=(state.goldEarned.boss||0)+gold;const landmark=state.landmarks?.get(e.landmarkId);if(landmark)landmark.status='defeated';(state.bossRewards??=[]).push(e.landmarkId);if(state.earnedMeta){if(String(e.landmarkId).startsWith('wave:'))state.earnedMeta.periodicBosses++;else state.earnedMeta.explorationBosses++;}emit('collect');}else{state.goldEarned.kills+=gold;state.waveKills++;if(state.earnedMeta)state.earnedMeta.normalKills++;emit('kill');}}
  }
  // One derived range entry per live tower; never serialized or stored on it.
  const mineRangeCache=new WeakMap();
  function mineSegments(state,ref,range){
    const signature=JSON.stringify([...state.map].map(([id,t])=>[id,t.q,t.r,t.type,
      typeof HexData!=='undefined'?HexData.CARD_LIBRARY[t.type]?.model:null,t.roads||[]]));
    const cached=mineRangeCache.get(ref.tw);
    if(cached&&cached.map===state.map&&cached.signature===signature&&cached.x===ref.pos.x&&cached.y===ref.pos.y&&cached.range===range)return cached;
    const segments=[];let total=0;
    for(const tile of state.map.values())for(const points of HexMap.roadGeometry(tile).legs.values())for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,A=dx*dx+dy*dy;if(!A)continue;
      const ox=a.x-ref.pos.x,oy=a.y-ref.pos.y,B=2*(ox*dx+oy*dy),C=ox*ox+oy*oy-range*range,D=B*B-4*A*C;if(D<0)continue;
      const lo=Math.max(0,(-B-Math.sqrt(D))/(2*A)),hi=Math.min(1,(-B+Math.sqrt(D))/(2*A));if(hi<=lo)continue;
      const length=(hi-lo)*Math.sqrt(A);segments.push({a,dx,dy,lo,hi,length});total+=length;
    }
    const entry={map:state.map,signature,x:ref.pos.x,y:ref.pos.y,range,segments,total};
    if(ref.tw)mineRangeCache.set(ref.tw,entry);return entry;
  }
  function randomMinePoint(state,ref,range){
    const random=state.mineRandom??=(typeof HexRandom!=='undefined'?HexRandom.create((state.seed||'run')+'|mines'):Math.random);
    if(ref.roadPoints){const points=ref.roadPoints.filter(p=>Math.hypot(p.x-ref.pos.x,p.y-ref.pos.y)<=range);return points.length?points[Math.floor(random()*points.length)]:null;}
    if(typeof HexMap==='undefined'||!state.map)return null;
    const {segments,total}=mineSegments(state,ref,range);
    if(!total)return null;let roll=random()*total;for(const s of segments){if(roll<s.length)return {x:s.a.x+s.dx*(s.lo+(s.hi-s.lo)*roll/s.length),y:s.a.y+s.dy*(s.lo+(s.hi-s.lo)*roll/s.length)};roll-=s.length;}return null;
  }
  function layMine(state,ref,def,time){
    state.mines??=[];const owner=ref.tw.mineId??=`mine-tower-${state.nextMineTowerId=(state.nextMineTowerId||0)+1}`;if(time-ref.tw.lastShot<def.cooldown*1000)return;
    const p=randomMinePoint(state,ref,def.range);if(!p)return;ref.tw.lastShot=time;state.mines.push({id:state.nextMineId=(state.nextMineId||0)+1,owner,source:{type:ref.tw.type,statId:ref.tw.statId,guestOwner:ref.tw.guestOwner},x:p.x,y:p.y,damage:def.damage,splash:def.splash,color:def.color,damageMultipliers:def.damageMultipliers});
  }
  function triggerMines(state,emit){
    // Only enemies trigger mines. Explosions never trigger neighbouring mines.
    state.mines??=[];if(!state.mines.length||!state.enemies.length)return;
    let grid=null;
    // Small encounters keep the cheap direct scan. Only the boolean trigger
    // query uses cells; explosion damage still follows the original enemy order.
    const cellOf=e=>Math.floor(e.x/28)+','+Math.floor(e.y/28);
    // A cheap density hint avoids constructing a grid for compact swarms.
    // A false positive only chooses the original scan, never changes a result.
    const denseHint=state.enemies.length>=32&&cellOf(state.enemies[0])===cellOf(state.enemies.at(-1))&&cellOf(state.enemies[0])===cellOf(state.enemies[Math.floor(state.enemies.length/2)]);
    if(state.mines.length>=16&&state.enemies.length>=32&&!denseHint){
      grid=new Map();let largest=0;
      for(const e of state.enemies){
        if(!e.alive||durability(e)<=0)continue;
        if(!Number.isFinite(e.x)||!Number.isFinite(e.y)){grid=null;break;}
        const cell=cellOf(e),bucket=grid.get(cell)||[];
        bucket.push(e);grid.set(cell,bucket);largest=Math.max(largest,bucket.length);
      }
      // Dense swarms often match immediately; avoid extra cell lookups there.
      if(largest>state.enemies.length/2)grid=null;
    }
    const triggeredByEnemy=mine=>{
      const matches=e=>e.alive&&durability(e)>0&&Math.hypot(e.x-mine.x,e.y-mine.y)<=14;
      if(!grid||!Number.isSafeInteger(Math.floor(mine.x/28))||!Number.isSafeInteger(Math.floor(mine.y/28)))return state.enemies.some(matches);
      for(let x=Math.floor((mine.x-14)/28);x<=Math.floor((mine.x+14)/28);x++)
        for(let y=Math.floor((mine.y-14)/28);y<=Math.floor((mine.y+14)/28);y++)
          if(grid.get(x+','+y)?.some(matches))return true;
      return false;
    };
    // Capture every trigger before dealing damage: stacked mines all fire even
    // when the first one kills their shared triggering enemy.
    const triggered=new Set(grid?state.mines.filter(triggeredByEnemy):state.mines.filter(mine=>state.enemies.some(e=>e.alive&&durability(e)>0&&Math.hypot(e.x-mine.x,e.y-mine.y)<=14))),remaining=[];
    for(const mine of state.mines){const trigger=triggered.has(mine);if(!trigger){remaining.push(mine);continue;}const def={damageMultipliers:mine.damageMultipliers};state.enemies.filter(e=>e.alive&&Math.hypot(e.x-mine.x,e.y-mine.y)<=mine.splash).forEach(e=>damageEnemy(e,mine.damage,def,state,emit,mine.source||{type:'mine'}));state.projectiles.push({kind:'blast',x:mine.x,y:mine.y,r:mine.splash,ttl:.22,color:mine.color});emit('mine');}state.mines=remaining;
  }
  // Nur für die Darstellung: Kennung, Turmtyp, Trefferpositionen und Lebensdauer eines Geschosses. Der Schaden wird sofort beim Schuss verrechnet.
  const nextProjectileId=state=>state.nextProjectileId=(state.nextProjectileId||0)+1;
  const FLIGHT_TTL={archer:.24,ballista:.3};   // sichtbare Flugzeit von Pfeil und Bolzen (Sekunden)
  function step(state,towerRefs,definitions,dt,time,emit=()=>{}){
    // Tick-local values: upgrades and support/biome changes apply on the next step.
    towerRefs=towerRefs.map(ref=>({...ref,definition:ref.definition||HexData.towerDefinition(ref.tw,definitions)}));
    const auraRefs=towerRefs.filter(ref=>ref.definition.aura);
    // Movement finishes before targeting. Only path distance is shared: health,
    // armor and magic values must stay live between consecutive tower hits.
    const pathDistances=new Map();
    const targetDistance=e=>{if(!pathDistances.has(e))pathDistances.set(e,remainingDistance(e));return pathDistances.get(e);};
    const TOWERS=definitions;state.mines??=[];state.soulDeaths=[];const arrive=e=>{e.alive=false;state.hp-=e.baseDamage??1;if(e.goldLoss)state.gold=Math.max(0,state.gold-e.goldLoss);const landmark=state.landmarks?.get(e.landmarkId);if(landmark)landmark.status='escaped';emit('hit');};
    for(const e of state.enemies){if(!e.alive)continue;if(e.index>=e.points.length-1){arrive(e);continue;}e.slowEffects=(e.slowEffects||[]).filter(effect=>effect.until>time);e.slowFactor=Math.min(1,...e.slowEffects.map(effect=>effect.factor));for(const ref of auraRefs){const def=ref.definition;if(Math.hypot(e.x-ref.pos.x,e.y-ref.pos.y)<=def.range)e.slowFactor=Math.min(e.slowFactor,def.slow);}e.slowFactor=Math.max(e.minSpeedFactor||0,e.slowFactor);const terrainSpeed=typeof HexBiomes!=='undefined'&&state.biomeSeed!=null&&HexBiomes.atWorld(state,e.x,e.y)==='desert'?.85:1;const slowResistance=Math.max(0,Math.min(1,e.slowResistance||0));let distance=e.speed*dt*(1-(1-e.slowFactor*terrainSpeed)*(1-slowResistance));while(e.index<e.points.length-1){const a=e.points[e.index],b=e.points[e.index+1],length=b.tunnel?0:Math.hypot(b.x-a.x,b.y-a.y),remaining=length*(1-e.t);if(length>0&&distance<remaining){e.t+=distance/length;break;}distance-=remaining;e.t=0;e.index++;if(e.index>=e.points.length-1){arrive(e);break;}}if(e.alive){const a=e.points[e.index],b=e.points[e.index+1];e.x=a.x+(b.x-a.x)*e.t;e.y=a.y+(b.y-a.y)*e.t;}}
    triggerMines(state,emit);state.enemies=state.enemies.filter(e=>e.alive&&durability(e)>0);
    for(const ref of towerRefs){const def=ref.definition||HexData.towerDefinition(ref.tw,TOWERS);if(def.aura)continue;if(def.mine){layMine(state,ref,def,time);continue;}if(time-ref.tw.lastShot<def.cooldown*1000)continue;const inRange=state.enemies.filter(e=>e.alive&&durability(e)>0&&Math.hypot(e.x-ref.pos.x,e.y-ref.pos.y)<=def.range);if(!inRange.length)continue;const primary=targetByPriority(inRange,ref.tw,ref.pos,targetDistance);ref.tw.lastShot=time;emit(ref.tw.type);
      if(def.chain){const hit=[primary];while(hit.length<def.chain){const last=hit.at(-1),next=nextChainTarget(state.enemies,hit,last,def.jumpRange);if(!next)break;hit.push(next);}hit.forEach((e,i)=>damageEnemy(e,def.damage*Math.max(.25,1-i*.18),def,state,emit,ref.tw));state.projectiles.push({kind:'chain',pts:[ref.pos,...hit.map(e=>({x:e.x,y:e.y}))],ttl:.24,max:.24,color:def.color,tower:ref.tw.type,id:nextProjectileId(state),hits:hit.map(e=>e.id),hitAt:hit.map(e=>({x:e.x,y:e.y}))});}
      else if(def.pierce){const vx=primary.x-ref.pos.x,vy=primary.y-ref.pos.y,mag=Math.hypot(vx,vy)||1,ux=vx/mag,uy=vy/mag,hit=[];for(const e of state.enemies){if(!e.alive||durability(e)<=0)continue;const ex=e.x-ref.pos.x,ey=e.y-ref.pos.y,along=ex*ux+ey*uy,perp=Math.abs(ex*uy-ey*ux);if(along>0&&along<def.range&&perp<20)hit.push({enemy:e,along});}const struck=hit.sort((a,b)=>a.along-b.along).slice(0,def.pierceTargets||3);struck.forEach(({enemy})=>damageEnemy(enemy,def.damage,def,state,emit,ref.tw));state.projectiles.push({kind:'line',x1:ref.pos.x,y1:ref.pos.y,x2:ref.pos.x+ux*def.range,y2:ref.pos.y+uy*def.range,ttl:.38,max:.38,color:def.color,tower:ref.tw.type,id:nextProjectileId(state),hits:struck.map(h=>h.enemy.id),hitAt:struck.map(h=>({x:h.enemy.x,y:h.enemy.y,along:h.along/def.range}))});}
      else{const hit=def.splash?state.enemies.filter(e=>e.alive&&Math.hypot(e.x-primary.x,e.y-primary.y)<=def.splash):[primary];const life=FLIGHT_TTL[ref.tw.type]||.1;hit.forEach(e=>{damageEnemy(e,def.damage,def,state,emit,ref.tw);if(e.alive&&def.hitSlow){e.slowEffects??=[];const effect=e.slowEffects.find(item=>item.factor===def.hitSlow);if(effect)effect.until=time+def.slowDuration*1000;else e.slowEffects.push({factor:def.hitSlow,until:time+def.slowDuration*1000});}});state.projectiles.push({kind:'line',x1:ref.pos.x,y1:ref.pos.y,x2:primary.x,y2:primary.y,ttl:life,max:life,color:def.color,tower:ref.tw.type,id:nextProjectileId(state),hits:hit.map(e=>e.id),hitAt:[{x:primary.x,y:primary.y}]});}
    }
    // Geister gehören ihrem Turm, blockieren keine Wege und verschwinden am Wave-Ende.
    const necromancers=towerRefs.map(ref=>({...ref,def:ref.definition||HexData.towerDefinition(ref.tw,TOWERS)})).filter(ref=>ref.def.soulLimit);
    for(const ref of necromancers){
      ref.tw.souls=(ref.tw.souls||[]).filter(soul=>soul.until>time);
      for(const [index,soul] of ref.tw.souls.entries()){
        const angle=time*.001+index*Math.PI*2/ref.tw.souls.length,pos={x:ref.pos.x+Math.cos(angle)*22,y:ref.pos.y+Math.sin(angle)*22};
        state.projectiles.push({kind:'spirit',x:pos.x,y:pos.y,r:5,ttl:dt+.01,color:ref.def.color});
        if(time-soul.lastShot<1000)continue;
        const targets=state.enemies.filter(e=>e.alive&&durability(e)>0&&Math.hypot(e.x-ref.pos.x,e.y-ref.pos.y)<=ref.def.range);
        if(!targets.length)continue;const target=targetByPriority(targets,ref.tw,ref.pos,targetDistance);soul.lastShot=time;
        damageEnemy(target,ref.def.soulDamage,ref.def,state,emit,ref.tw);
        state.projectiles.push({kind:'line',x1:pos.x,y1:pos.y,x2:target.x,y2:target.y,ttl:.2,max:.2,color:ref.def.color,tower:'necromancer',id:nextProjectileId(state),hits:[target.id],hitAt:[{x:target.x,y:target.y}]});
      }
    }
    for(const death of state.soulDeaths){
      const owner=necromancers.filter(ref=>ref.tw.souls.length<ref.def.soulLimit&&Math.hypot(death.x-ref.pos.x,death.y-ref.pos.y)<=ref.def.range).sort((a,b)=>Math.hypot(death.x-a.pos.x,death.y-a.pos.y)-Math.hypot(death.x-b.pos.x,death.y-b.pos.y))[0];
      if(owner)owner.tw.souls.push({until:time+owner.def.soulDuration*1000,lastShot:time});
    }
    state.soulDeaths=[];
    state.projectiles.forEach(p=>p.ttl-=dt);state.projectiles=state.projectiles.filter(p=>p.ttl>0);state.enemies=state.enemies.filter(e=>e.alive&&durability(e)>0);
  }
  return {step,durability,remainingDistance,targetByPriority};
})();
