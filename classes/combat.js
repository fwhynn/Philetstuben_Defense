const HexCombat=(()=>{
  const consumables={spikes:{name:'Krähenfüße',cost:25,description:'20 Spitzen × 5 Schaden. Reste verfallen am Wellenende.'},resin:{name:'Klebeharz',cost:30,description:'Die nächsten 12 Gegner: 35 % langsamer für 4 Sekunden. Bis Wellenende.'},overload:{name:'Überladung',cost:40,description:'+50 % Angriffsgeschwindigkeit für 12 Sekunden. Bis Wellenende; nicht stapelbar.'}};
  function consumableStats(state) {
    const wave=Math.max(1,Math.floor(Number(state.wave)||0)+(state.waveRunning?0:1));
    // Supplemental damage: grows more slowly than the enemies' 10% scaling.
    const hp=Math.round((28+wave*7)*Math.pow(1.04,Math.max(0,wave-3)));
    return {wave,spikeDamage:Math.max(5,Math.round(hp/7)),resinCharges:12+3*Math.floor((wave-1)/5),resinDuration:4+Math.min(4,Math.floor((wave-1)/10)),overloadDuration:12+Math.min(12,2*Math.floor((wave-1)/5))};
  }
  function buyConsumable(state,kind,slot,preview=false){
    if(['detour','villages','powerGrid'].includes(state.challengeKind))return false;
    const def=Object.hasOwn(consumables,kind)?consumables[kind]:null;
    if(!def||consumableRemaining(state,kind)<=0||state.hp<=0||!['place','build','wave'].includes(state.phase)||!Number.isInteger(slot?.q)||!Number.isInteger(slot?.r)||state.gold<def.cost)return false;
    const tile=state.map.get(slot.q+','+slot.r);if(!tile)return false;
    if(kind==='overload'){
      const tower=Number.isInteger(slot.index)&&tile.towers?.[slot.index];if(!tower||tower.guestOwner!==undefined||!HexData.towerDefinition(tower).cooldown||HexData.towerDefinition(tower).aura||tower.overloadPending||tower.overloadUntil>state.elapsedMs)return false;
      if(!preview){tower.overloadDuration=consumableStats(state).overloadDuration*1000;if(state.waveRunning)tower.overloadUntil=state.elapsedMs+tower.overloadDuration;else tower.overloadPending=true;}
    }else{
      if(tile.type==='base'||!tile.roads?.length)return false;
      const point=slot.x===undefined&&slot.y===undefined?HexMap.roadGeometry(tile).hub:lanePoint(tile,slot);
      if(!point)return false;
      if(!preview)(state.consumables??=[]).push({kind,q:slot.q,r:slot.r,x:point.x,y:point.y,charges:kind==='spikes'?20:consumableStats(state).resinCharges,damage:consumableStats(state).spikeDamage,duration:consumableStats(state).resinDuration*1000,seen:[]});
    }
    if(!preview){state.gold-=def.cost;const wave=consumableStats(state).wave;if(state.consumableUsage?.wave!==wave)state.consumableUsage={wave};state.consumableUsage[kind]=(state.consumableUsage[kind]||0)+1;}return true;
  }
  function consumableRemaining(state,kind){return Math.max(0,3-(state.consumableUsage?.wave===consumableStats(state).wave?state.consumableUsage[kind]||0:0));}
  function clearConsumables(state){state.towerEffects=[];for(const tile of state.map.values())for(const tw of tile.towers||[])if(tw){delete tw.laserBeams;delete tw.weaponShots;}state.enemyZones=[];state.consumables=[];for(const tile of state.map.values())for(const tower of tile.towers||[])if(tower){delete tower.overloadPending;delete tower.overloadUntil;delete tower.overloadDuration;}for(const e of state.enemies||[])e.slowEffects=(e.slowEffects||[]).filter(s=>s.source!=='resin');}
  // Snap a nearby click to the actual lane, including curved and model-specific roads.
  function lanePoint(tile,point){
    if(!Number.isFinite(point?.x)||!Number.isFinite(point?.y))return null;
    let best=null,distance=18;
    for(const points of HexMap.roadGeometry(tile).legs.values())for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
      const t=length?Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/length)):0;
      const p={x:a.x+t*dx,y:a.y+t*dy},d=Math.hypot(point.x-p.x,point.y-p.y);
      if(d<=distance){distance=d;best=p;}
    }
    return best;
  }
  function applyConsumables(state,time,emit){
    for(const c of state.consumables||[]){if(c.charges<=0)continue;const positioned=Number.isFinite(c.x)&&Number.isFinite(c.y),center=positioned?c:HexMap.axialToWorld(c.q,c.r);
      for(const e of state.enemies){if(!e.alive||c.charges<=0||c.seen.includes(e.id)||Math.hypot(e.x-center.x,e.y-center.y)>(positioned?16:HexMap.HEX*.9))continue;
        c.seen.push(e.id);
        if(c.kind==='spikes'){while(c.charges>0&&e.alive){c.charges--;damageEnemy(e,c.damage??5,{damageType:'physical',noKillGold:true},state,emit);}if(!e.alive)state.consumableKills=(state.consumableKills||0)+1;}
        else {c.charges--;e.slowEffects??=[];e.slowEffects.push({factor:.65,until:time+(c.duration??4000),source:'resin'});}
      }
    }
    state.consumables=(state.consumables||[]).filter(c=>c.charges>0);
  }
  const DEFAULT_PRIORITY=['closestBase','mostHealth','boss'];
  function straightSegment(e){
    // Road joins may contain coincident endpoints. They are not corners.
    const p=e.points,i=e.index,a=p[i],b=p[i+1];if(!a||!b||a.tunnel||b.tunnel)return false;
    let before=i-1,after=i+2;
    while(before>=0&&Math.hypot(p[before].x-a.x,p[before].y-a.y)<.001&&!p[before].tunnel)before--;
    while(after<p.length&&Math.hypot(p[after].x-b.x,p[after].y-b.y)<.001&&!p[after].tunnel)after++;
    if(Math.hypot(b.x-a.x,b.y-a.y)<.001)return before>=0&&after<p.length&&straightSegment({...e,points:[p[before],a,p[after]],index:0});
    const aligned=(u,v,w)=>{const x=v.x-u.x,y=v.y-u.y,xx=w.x-v.x,yy=w.y-v.y,l=Math.hypot(x,y)*Math.hypot(xx,yy);return l>0&&(x*xx+y*yy)/l>.99999;};
    return (before<0||aligned(p[before],a,b))&&(after>=p.length||aligned(a,b,p[after]));
  }
  function nearbyTile(state,p){let best=null,d=HexMap.HEX;for(const t of state.map.values()){const c=HexMap.axialToWorld(t.q,t.r),n=Math.hypot(p.x-c.x,p.y-c.y);if(n<d){best=t;d=n;}}return best;}
  function toadShortcut(state,e,range){
    const from=nearbyTile(state,e);if(!from)return;
    const currentDistance=remainingDistance(e);let best=currentDistance-20,route=null;
    const consider=path=>{const p=path[0],direct=Math.hypot(p.x-e.x,p.y-e.y);if(direct<8||direct>range)return;const to=nearbyTile(state,p);if(!to||to.type==='base'||!to.roads?.length)return;const dq=to.q-from.q,dr=to.r-from.r;if(Math.max(Math.abs(dq),Math.abs(dr),Math.abs(dq+dr))!==1)return;const cost=direct+HexMap.length(path);if(cost<best){best=cost;route=path;}};
    for(let j=e.index+1;j<e.points.length-1;j++){
      if(e.points[j].tunnel)break;consider(e.points.slice(j));
    }
    // Also search connected roads outside this enemy's originally chosen lane.
    const goal=state.villages?.goals.find(v=>v.id===e.villageId),target=goal?HexMap.key(goal.q,goal.r):state.challengeKind==='movingFortress'?HexMovingFortress.target(state):'0,0';
    const {graph,geometry,distances}=HexMap.routeGraph(state.map,target);
    function home(id){const path=[geometry.get(id).hub],seen=new Set();while(id!==target){if(seen.has(id))return null;seen.add(id);const edge=(graph.get(id)||[]).filter(x=>distances.has(x.next)&&!seen.has(x.next)).sort((a,b)=>(a.cost+distances.get(a.next))-(b.cost+distances.get(b.next)))[0];if(!edge)return null;path.push(...edge.points.slice(1));id=edge.next;}return path;}
    for(const [id,tile] of state.map){if(id===target||!tile.roads?.length||!distances.has(id))continue;const dq=tile.q-from.q,dr=tile.r-from.r;if(Math.max(Math.abs(dq),Math.abs(dr),Math.abs(dq+dr))!==1)continue;const tail=home(id);if(!tail)continue;consider(tail);for(const leg of geometry.get(id).legs.values())for(let i=1;i<leg.length;i++)consider([...leg.slice(0,i+1).reverse(),...tail.slice(1)]);}
    if(route){e.originPoints??=e.points;e.points=[{x:e.x,y:e.y},...route.map(p=>({...p}))];e.index=0;e.t=0;e.shortcutJump=true;e.shortcutFlight={start:state.elapsedMs,from:{x:e.x,y:e.y},to:{...route[0]}};}
  }
  const hiddenBySpores=(state,e)=> (state.enemyZones||[]).some(z=>z.kind==='spores'&&z.until>(state.elapsedMs||0)&&Math.hypot(e.x-z.x,e.y-z.y)<=z.r);
  // The headless VM otherwise resolves these globals for every pool of every
  // candidate. Capture the unchanged built-ins once, keeping coercion exact.
  const poolMax=Math.max,poolNumber=Number;
  const pool=(e,name)=>poolMax(0,poolNumber(e[name])||0);
  const durability=e=>pool(e,'hp')+pool(e,'armorHp')+pool(e,'magicHp');
  function remainingDistance(e){let value=0;if(!e.points?.length)return Infinity;if(e.index<e.points.length-1){const a=e.points[e.index],b=e.points[e.index+1];value+=(b.tunnel?0:Math.hypot(b.x-a.x,b.y-a.y))*(1-(e.t||0));}for(let i=e.index+1;i<e.points.length-1;i++)value+=e.points[i+1].tunnel?0:Math.hypot(e.points[i+1].x-e.points[i].x,e.points[i+1].y-e.points[i].y);return value;}
  function targetByPriority(candidates,tower,pos,distance=remainingDistance){
    const priorities=Array.isArray(tower.targetPriority)&&tower.targetPriority.length?tower.targetPriority:(tower.type&&HexData.TOWERS[tower.type]?HexData.defaultTargetPriority(tower):DEFAULT_PRIORITY);
    for(const priority of priorities){
      let eligible=candidates;if(priority==='healer')eligible=candidates.filter(e=>e.type==='healer');if(priority==='boss')eligible=candidates.filter(e=>e.type==='boss');if(priority==='mostArmor')eligible=candidates.filter(e=>pool(e,'armorHp')>0);if(priority==='mostMagic')eligible=candidates.filter(e=>pool(e,'magicHp')>0);if(!eligible.length)continue;
      const value=e=>priority==='boss'||priority==='healer'?1:priority==='mostArmor'?pool(e,'armorHp'):priority==='mostMagic'?pool(e,'magicHp'):priority==='mostHealth'?pool(e,'hp'):priority==='leastHealth'?-pool(e,'hp'):priority==='furthestBase'?distance(e):priority==='closestBase'?-distance(e):priority==='furthestTower'?Math.hypot(e.x-pos.x,e.y-pos.y):-Math.hypot(e.x-pos.x,e.y-pos.y);
      if(eligible.length===1)return eligible[0];
      let best=eligible[0],bestValue=value(best),ties=[best];
      for(let i=1;i<eligible.length;i++){const candidate=eligible[i],score=value(candidate);if(score>bestValue){best=candidate;bestValue=score;ties=[candidate];}else if(score===bestValue)ties.push(candidate);}
      if(ties.length===1)return best;candidates=ties;
    }
    return candidates[0];
  }
  // Frame-local broad phase for presentation. Exact distance and original array
  // order are retained, including target-priority ties and base-weapon ties.
  function presentationRange(enemies){
    const cells=new Map(),size=128;
    enemies.forEach((e,i)=>{if(!Number.isFinite(e.x)||!Number.isFinite(e.y))return;const key=Math.floor(e.x/size)+','+Math.floor(e.y/size);let cell=cells.get(key);if(!cell)cells.set(key,cell=[]);cell.push(i);});
    return (pos,range)=>{
      const exact=e=>Math.hypot(e.x-pos.x,e.y-pos.y)<=range;
      if(!Number.isFinite(range)||!Number.isFinite(pos.x)||!Number.isFinite(pos.y))return enemies.filter(exact);
      if(range<0)return [];
      const x0=Math.floor((pos.x-range)/size),x1=Math.floor((pos.x+range)/size),y0=Math.floor((pos.y-range)/size),y1=Math.floor((pos.y+range)/size);
      if((x1-x0+1)*(y1-y0+1)>enemies.length)return enemies.filter(exact);
      const indices=[];for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){const cell=cells.get(x+','+y);if(cell)for(const i of cell)indices.push(i);}
      indices.sort((a,b)=>a-b);return indices.map(i=>enemies[i]).filter(exact);
    };
  }
  function nextChainTarget(enemies,hit,last,range,damageType,state){
    let best=null,bestDistance=Infinity;
    for(const enemy of enemies){
      if(!enemy.alive||durability(enemy)<=0||hiddenBySpores(state,enemy)||hit.includes(enemy)||(enemy.immunity&&enemy.immunity===damageType))continue;
      const distance=Math.hypot(enemy.x-last.x,enemy.y-last.y);
      // Strict comparison preserves the stable-sort winner for equal distances.
      if(distance<=range&&(!best||distance<bestDistance)){best=enemy;bestDistance=distance;}
    }
    return best;
  }

  const cardValue=(s,id)=>typeof HexAugmentCards==='undefined'?0:HexAugmentCards.value(s,id);
  const cardLevel=(s,id)=>typeof HexAugmentCards==='undefined'?-1:HexAugmentCards.level(s,id);
  function queueEcho(state,mine){
    const factor=cardValue(state,'mine');if(!factor)return;
    (state.augmentEchoes??=[]).push({at:state.elapsedMs+1000,x:mine.x,y:mine.y,r:mine.splash*(cardLevel(state,'mine')===4?1.2:1),damage:mine.damage*factor,multipliers:mine.damageMultipliers,source:mine.source||{type:'mine'}});
  }
  // Build once per batch; keep original enemy order for shield, kill and reward semantics.
  function echoCandidates(enemies,due){
    const valid=e=>Number.isSafeInteger(Math.floor(e.x/128))&&Number.isSafeInteger(Math.floor(e.y/128));
    if(due.length<4||enemies.length<32||!enemies.every(valid))return ()=>enemies;
    const cells=new Map(),regions=new Map();enemies.forEach((enemy,order)=>{
      const key=Math.floor(enemy.x/128)+','+Math.floor(enemy.y/128);
      if(!cells.has(key))cells.set(key,[]);cells.get(key).push({enemy,order});
    });
    return echo=>{
      if(!valid(echo)||!Number.isFinite(echo.r)||echo.r<0||echo.r>512)return enemies;
      const x0=Math.floor((echo.x-echo.r)/128),x1=Math.floor((echo.x+echo.r)/128),y0=Math.floor((echo.y-echo.r)/128),y1=Math.floor((echo.y+echo.r)/128);
      if(![x0,x1,y0,y1].every(Number.isSafeInteger))return enemies;
      const region=x0+','+x1+','+y0+','+y1;
      if(regions.has(region))return regions.get(region);
      const near=[];for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(const entry of cells.get(x+','+y)||[])near.push(entry);
      near.sort((a,b)=>a.order-b.order);
      const ordered=near.map(entry=>entry.enemy);regions.set(region,ordered);return ordered;
    };
  }
  function augmentTicks(state,refs,dt,time,emit){
    const freezeDuration=cardValue(state,'freeze'),legendary=cardLevel(state,'freeze')===4;
    const pulse=legendary&&Math.floor(time/5000)>(state.augmentPulseCycle||0);
    if(legendary)state.augmentPulseCycle=Math.floor(time/5000);
    const echoes=state.augmentEchoes;
    if(echoes?.some(e=>e.at<=time)){
      const due=[],pending=[];
      for(const echo of echoes)(echo.at<=time?due:pending).push(echo);
      state.augmentEchoes=pending;
      const candidates=echoCandidates(state.enemies,due);
      for(const echo of due){
        for(const enemy of candidates(echo))if(enemy.alive&&withinMineRadius(enemy,echo,echo.r))damageEnemy(enemy,echo.damage,{damageType:'physical',damageMultipliers:echo.multipliers,augmentSecondary:true},state,emit,echo.source);
        state.projectiles.push({kind:'blast',x:echo.x,y:echo.y,r:echo.r,ttl:.3,max:.3,color:'#e8bc68'});
      }
    }
    for(const enemy of state.enemies){
      const burn=enemy.augmentBurn;
      if(burn){while(enemy.alive&&burn.next<=time&&burn.next<=burn.until){damageEnemy(enemy,burn.damage,{damageType:'fire',damageMultipliers:burn.multipliers,bossMultiplier:burn.bossMultiplier,augmentSecondary:true},state,emit,burn.source);burn.next+=1000;}if(time>=burn.until)delete enemy.augmentBurn;}
      if(!enemy.alive||!freezeDuration)continue;
      const inRange=refs.some(r=>r.tw.type==='freeze'&&Math.hypot(enemy.x-r.pos.x,enemy.y-r.pos.y)<=r.definition.range);
      if(!inRange){enemy.augmentCold=0;continue;}
      enemy.augmentCold=(enemy.augmentCold||0)+dt;
      if(time>=(enemy.augmentFreezeReady||0)&&(legendary?pulse:enemy.augmentCold>=3)){
        bindEnemy(enemy,time,freezeDuration*(enemy.type==='boss'?.5:1));enemy.augmentFrozen=enemy.controlUntil||time;
        enemy.augmentFreezeReady=time+5000;enemy.augmentCold=0;enemy.augmentPulse=Math.floor(time/5000);
        state.projectiles.push({kind:'blast',x:enemy.x,y:enemy.y,r:18,ttl:.25,max:.25,color:'#bceeff'});
      }
    }
  }
  function damageEnemy(e,raw,def,state,emit=()=>{},source=null){
    if(!e.alive||raw<=0)return;
    const time=state.elapsedMs||0,kind=def.damageType||'physical';
    if(e.immunity&&e.immunity===kind)return;
    // Count actual contacts per tower, including blocked hits, but never recurse.
    const resonance=source?.type==='element'&&!def.augmentSecondary&&cardValue(state,'element');
    if(resonance)source.augmentResonanceHits=((source.augmentResonanceHits||0)+1)%5;
    const echo=resonance&&source.augmentResonanceHits===0;
    // Every damaging hit consumes at most one stack, with no overflow into defenses or life.
    if(e.shieldHits>0){e.shieldHits--;return;}
    const before=durability(e);
    const resistance=Math.max(0,Math.min(.95,e.resistances?.[def.damageType]||0));
    let budget=raw*(1-resistance)*(e.type==='boss'?(def.bossMultiplier||1):1);
    // Allied tar protection never stacks and never protects its own producer.
    if((state.enemyZones||[]).some(z=>z.kind==='tar'&&z.until>time&&z.ownerId!==e.id&&Math.hypot(e.x-z.x,e.y-z.y)<=z.r))budget*=.8;
    for(const [field,kind] of [['magicHp','magic'],['armorHp','armor'],['hp','hp']]){if(budget<=0||pool(e,field)<=0)continue;const multiplier=def.damageMultipliers?.[kind]??1,amount=Math.min(pool(e,field),budget*multiplier);e[field]=pool(e,field)-amount;budget-=amount/multiplier;}
    if(e.type==='moltingBeetle'&&!e.molted&&pool(e,'armorHp')===0){e.molted=true;e.speed*=1.4;}
    if(e.alive&&durability(e)>0&&source?.type==='flame'&&!def.augmentSecondary&&cardValue(state,'flame')){
      const damage=raw*cardValue(state,'flame'),old=e.augmentBurn?.until>time?e.augmentBurn:null,keep=old&&old.damage>damage;
      e.augmentBurn={damage:Math.max(damage,old?.damage||0),next:old?.next||time+1000,until:Math.max(old?.until||0,time+(cardLevel(state,'flame')===4?5000:3000)),multipliers:keep?old.multipliers:def.damageMultipliers,bossMultiplier:keep?old.bossMultiplier:def.bossMultiplier,source:keep?old.source:{type:source.type,statId:source.statId,guestOwner:source.guestOwner}};
    }
    HexData.recordTowerStat(state,source,'damage',Math.max(0,before-durability(e)));
    if(durability(e)<=1e-8&&e.alive){e.hp=e.armorHp=e.magicHp=0;e.alive=false;HexData.recordTowerStat(state,source,'kills',1);(state.soulDeaths??=[]).push({x:e.x,y:e.y});let gold=e.killGold??HexWaves.economy.kill;
      if(e.type==='mushroomColossus')(state.enemyZones??=[]).push({kind:'spores',x:e.x,y:e.y,r:65,until:time+6000});
      spreadPoison(state,e,time);
      if(e.splitOnDeath){const childGold=Math.floor(gold/3);gold-=childGold*2;const hp=Math.max(1,Math.round(e.maxHp*.25));for(let i=0;i<2;i++)(state.splitChildren??=[]).push({id:state.nextEnemyId++,type:'shard',name:'Golemsplitter',...(e.villageId===undefined?{}:{villageId:e.villageId}),hp,maxHp:hp,armorHp:0,magicHp:0,maxArmorHp:0,maxMagicHp:0,speed:e.speed,killGold:childGold,baseDamage:1,alive:true,points:e.points,originPoints:e.originPoints,portalUsed:e.portalUsed,displaceReady:e.displaceReady,displacedDistance:e.displacedDistance,controlHistory:(e.controlHistory||[]).map(h=>({...h})),controlUntil:e.controlUntil,index:e.index,t:e.t,x:e.x,y:e.y});}
      if(['garrison','detour','towerDraft'].includes(state.challengeKind)||def.noKillGold)gold=0;state.gold+=gold;if(e.type==='boss'){state.goldEarned.boss=(state.goldEarned.boss||0)+gold;const landmark=state.landmarks?.get(e.landmarkId);if(landmark){landmark.status='defeated';if(typeof HexExploration!=='undefined')HexExploration.defeatGuardian(state,e.landmarkId);}if(!e.noBossReward)(state.bossRewards??=[]).push(e.landmarkId||'wave:'+state.wave);if(state.earnedMeta){if(String(e.landmarkId).startsWith('wave:'))state.earnedMeta.periodicBosses++;else state.earnedMeta.explorationBosses++;}emit('collect');}else{state.goldEarned.kills+=gold;state.waveKills++;if(state.earnedMeta)state.earnedMeta.normalKills++;emit('kill');}}
    if(echo&&e.alive){damageEnemy(e,raw*resonance,{...def,augmentSecondary:true},state,emit,source);state.projectiles.push({kind:'blast',x:e.x,y:e.y,r:18,ttl:.25,max:.25,color:def.color||'#b8a0ff'});}
  }
  // One derived range entry per live tower; never serialized or stored on it.
  const mineRangeCache=new WeakMap();
  function mineSegments(state,ref,range,layout){
    const signature=layout.signature??=JSON.stringify([...state.map].map(([id,t])=>[id,t.q,t.r,t.type,
      typeof HexData!=='undefined'?HexData.CARD_LIBRARY[t.type]?.model:null,t.rotation||0,t.roads||[]]));
    const cached=mineRangeCache.get(ref.tw);
    if(cached&&cached.map===state.map&&cached.signature===signature&&cached.x===ref.pos.x&&cached.y===ref.pos.y&&cached.range===range)return cached;
    const segments=[];let total=0;
    for(const points of (layout.legs??=[...state.map.values()].flatMap(tile=>[...HexMap.roadGeometry(tile).legs.values()])))for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,A=dx*dx+dy*dy;if(!A)continue;
      const ox=a.x-ref.pos.x,oy=a.y-ref.pos.y,B=2*(ox*dx+oy*dy),C=ox*ox+oy*oy-range*range,D=B*B-4*A*C;if(D<0)continue;
      const lo=Math.max(0,(-B-Math.sqrt(D))/(2*A)),hi=Math.min(1,(-B+Math.sqrt(D))/(2*A));if(hi<=lo)continue;
      const length=(hi-lo)*Math.sqrt(A);segments.push({a,dx,dy,lo,hi,length});total+=length;
    }
    const entry={map:state.map,signature,x:ref.pos.x,y:ref.pos.y,range,segments,total};
    if(ref.tw)mineRangeCache.set(ref.tw,entry);return entry;
  }
  function randomMinePoint(state,ref,range,layout={}){
    const random=state.mineRandom??=(typeof HexRandom!=='undefined'?HexRandom.create((state.seed||'run')+'|mines'):Math.random);
    if(ref.roadPoints){const points=ref.roadPoints.filter(p=>Math.hypot(p.x-ref.pos.x,p.y-ref.pos.y)<=range);return points.length?points[Math.floor(random()*points.length)]:null;}
    if(typeof HexMap==='undefined'||!state.map)return null;
    const {segments,total}=mineSegments(state,ref,range,layout);
    if(!total)return null;let roll=random()*total;for(const s of segments){if(roll<s.length)return {x:s.a.x+s.dx*(s.lo+(s.hi-s.lo)*roll/s.length),y:s.a.y+s.dy*(s.lo+(s.hi-s.lo)*roll/s.length)};roll-=s.length;}return null;
  }
  function layMine(state,ref,def,time,layout){
    state.mines??=[];const owner=ref.tw.mineId??=`mine-tower-${state.nextMineTowerId=(state.nextMineTowerId||0)+1}`;if(time-ref.tw.lastShot<def.cooldown*1000)return;
    const p=randomMinePoint(state,ref,def.range,layout);if(!p)return;ref.tw.lastShot=time;state.mines.push({id:state.nextMineId=(state.nextMineId||0)+1,owner,source:{type:ref.tw.type,statId:ref.tw.statId,guestOwner:ref.tw.guestOwner},x:p.x,y:p.y,damage:def.damage,splash:def.splash,color:def.color,damageMultipliers:def.damageMultipliers});
  }
  const mineTriggerCache=new WeakMap();
  function withinMineRadius(enemy,mine,radius){
    const dx=enemy.x-mine.x,dy=enemy.y-mine.y;
    return dx>=-radius&&dx<=radius&&dy>=-radius&&dy<=radius&&Math.hypot(dx,dy)<=radius;
  }
  function triggerMines(state,emit){
    // Only enemies trigger mines. Explosions never trigger neighbouring mines.
    state.mines??=[];if(!state.mines.length||!state.enemies.length)return;
    if(state.mines.length>=64){
      // Stationary mines retain their spatial index even after explosions.
      let index=mineTriggerCache.get(state.mines);
      if(!index||index.count>state.mines.length||index.last!==state.mines[index.count-1])index={grid:new Map(),count:0,valid:true,nextOrder:0};
      for(let i=index.count;i<state.mines.length;i++){
        const mine=state.mines[i];if(!Number.isSafeInteger(Math.floor(mine.x/28))||!Number.isSafeInteger(Math.floor(mine.y/28))){index.valid=false;continue;}
        const key=Math.floor(mine.x/28)+','+Math.floor(mine.y/28);let bucket=index.grid.get(key);if(!bucket)index.grid.set(key,bucket=[]);
        bucket.push({mine,key,order:index.nextOrder++});
      }
      index.count=state.mines.length;index.last=state.mines.at(-1);mineTriggerCache.set(state.mines,index);
      if(index.valid){
        const hits=new Set();
        for(const e of state.enemies){
          if(!e.alive||durability(e)<=0||!Number.isSafeInteger(Math.floor(e.x/28))||!Number.isSafeInteger(Math.floor(e.y/28)))continue;
          for(let x=Math.floor((e.x-14)/28);x<=Math.floor((e.x+14)/28);x++)for(let y=Math.floor((e.y-14)/28);y<=Math.floor((e.y+14)/28);y++)
            for(const record of index.grid.get(x+','+y)||[]){if(hits.has(record))continue;const m=record.mine;if(withinMineRadius(e,m,14))hits.add(record);}
        }
        if(!hits.size)return;
        // Broad phase for bursts: exact radius checks and original enemy order
        // remain authoritative (including deaths and shield changes from earlier hits).
        let enemiesByCell=null;
        if(hits.size>=4&&state.enemies.length>=32&&state.enemies.every(e=>Number.isSafeInteger(Math.floor(e.x/128))&&Number.isSafeInteger(Math.floor(e.y/128)))){
          enemiesByCell=new Map();state.enemies.forEach((enemy,order)=>{const key=Math.floor(enemy.x/128)+','+Math.floor(enemy.y/128);let bucket=enemiesByCell.get(key);if(!bucket)enemiesByCell.set(key,bucket=[]);bucket.push({enemy,order});});
        }
        const removed=new Set(),dirtyCells=new Set(),blastCandidates=new Map();
        for(const record of [...hits].sort((a,b)=>a.order-b.order)){
          const mine=record.mine,def={damageType:'physical',area:true,damageMultipliers:mine.damageMultipliers};let candidates=state.enemies;
          if(enemiesByCell&&Number.isFinite(mine.splash)&&mine.splash>=0&&mine.splash<=512){
            const x0=Math.floor((mine.x-mine.splash)/128),x1=Math.floor((mine.x+mine.splash)/128),y0=Math.floor((mine.y-mine.splash)/128),y1=Math.floor((mine.y+mine.splash)/128),key=[x0,x1,y0,y1].join(',');
            candidates=blastCandidates.get(key);
            if(!candidates){const nearby=[];
              for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(const record of enemiesByCell.get(x+','+y)||[])nearby.push(record);
              candidates=nearby.sort((a,b)=>a.order-b.order).map(r=>r.enemy);blastCandidates.set(key,candidates);
            }
          }
          for(const e of candidates)if(e.alive&&withinMineRadius(e,mine,mine.splash))damageEnemy(e,mine.damage,def,state,emit,mine.source||{type:'mine'});
          state.projectiles.push({kind:'blast',x:mine.x,y:mine.y,r:mine.splash,ttl:.22,color:mine.color});queueEcho(state,mine);emit('mine');removed.add(mine);dirtyCells.add(record.key);
        }
        for(const key of dirtyCells){const bucket=index.grid.get(key).filter(r=>!hits.has(r));if(bucket.length)index.grid.set(key,bucket);else index.grid.delete(key);}
        state.mines=state.mines.filter(m=>!removed.has(m));index.count=state.mines.length;index.last=state.mines.at(-1);mineTriggerCache.set(state.mines,index);return;
      }
    }
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
      const matches=e=>e.alive&&withinMineRadius(e,mine,14)&&durability(e)>0;
      if(!grid||!Number.isSafeInteger(Math.floor(mine.x/28))||!Number.isSafeInteger(Math.floor(mine.y/28)))return state.enemies.some(matches);
      for(let x=Math.floor((mine.x-14)/28);x<=Math.floor((mine.x+14)/28);x++)
        for(let y=Math.floor((mine.y-14)/28);y<=Math.floor((mine.y+14)/28);y++)
          if(grid.get(x+','+y)?.some(matches))return true;
      return false;
    };
    // Capture every trigger before dealing damage: stacked mines all fire even
    // when the first one kills their shared triggering enemy.
    let triggered;
    for(const mine of state.mines)if(triggeredByEnemy(mine))(triggered??=new Set()).add(mine);
    if(!triggered)return;
    const remaining=[];
    for(const mine of state.mines){const trigger=triggered.has(mine);if(!trigger){remaining.push(mine);continue;}const def={damageType:'physical',area:true,damageMultipliers:mine.damageMultipliers};state.enemies.filter(e=>e.alive&&withinMineRadius(e,mine,mine.splash)).forEach(e=>damageEnemy(e,mine.damage,def,state,emit,mine.source||{type:'mine'}));state.projectiles.push({kind:'blast',x:mine.x,y:mine.y,r:mine.splash,ttl:.22,color:mine.color});queueEcho(state,mine);emit('mine');}state.mines=remaining;
  }
  // Nur für die Darstellung: Kennung, Turmtyp, Trefferpositionen und Lebensdauer eines Geschosses. Der Schaden wird sofort beim Schuss verrechnet.
  const nextProjectileId=state=>state.nextProjectileId=(state.nextProjectileId||0)+1;
  const FLIGHT_TTL={archer:.24,ballista:.3,flame:.3,element:.32,necromancer:.34};   // sichtbare Flugzeit je Geschossart (Sekunden)
  // New weapons share the ordinary defense, kill, economy and damage-credit pipeline.
  const weaponSource=tw=>({type:tw.type,statId:tw.statId,guestOwner:tw.guestOwner});
  const aliveTarget=(s,e,d)=>e.alive&&durability(e)>0&&!hiddenBySpores(s,e)&&e.immunity!==d.damageType;
  const effectDef=d=>({damageType:d.damageType,damageMultipliers:d.damageMultipliers,bossMultiplier:d.bossMultiplier,augmentSecondary:true});
  const ordinary=e=>['normal','armored','warded','swarm','shard'].includes(e.type);
  function slowEnemy(e,factor,until,source){e.slowEffects??=[];const old=e.slowEffects.find(s=>s.source===source);if(old){old.factor=factor;old.until=Math.max(old.until,until);}else e.slowEffects.push({factor,until,source});}
  // Reserve disjoint intervals; overlapping freezes do not spend the budget twice.
  function bindEnemy(e,time,seconds){
    const cap=e.type==='boss'?500:2000;
    e.controlHistory=(e.controlHistory||[]).filter(h=>h.end>time-8000);
    const used=e.controlHistory.reduce((n,h)=>n+Math.max(0,Math.min(time,h.end)-Math.max(time-8000,h.start)),0);
    const current=Math.max(time,e.controlUntil||0,e.augmentFrozen||0),remaining=Math.max(0,cap-used-(current-time));
    const end=current+Math.min(Math.max(0,time+seconds*1000-current),remaining);
    if(end<=time)return false;
    const last=e.controlHistory.at(-1);if(last&&last.end>=time)last.end=Math.max(last.end,end);else e.controlHistory.push({start:time,end});
    e.controlUntil=end;return true;
  }
  function positionOnRoute(e){const a=e.points[e.index],b=e.points[e.index+1]||a;e.x=a.x+(b.x-a.x)*e.t;e.y=a.y+(b.y-a.y)*e.t;}
  // Signed path distance: positive moves towards the base, negative towards spawn.
  // A tunnel is a boundary, never an invitation to slide across the board.
  function moveOnRoute(e,amount){
    let left=Math.abs(amount),moved=0,forward=amount>0;
    while(left>1e-7&&e.index<e.points.length-1){
      const a=e.points[e.index],b=e.points[e.index+1];if(b.tunnel||a.tunnel)break;
      const length=Math.hypot(b.x-a.x,b.y-a.y),available=length*(forward?1-e.t:e.t),take=Math.min(left,available);
      if(length>0)e.t+=(forward?1:-1)*take/length;left-=take;moved+=take;
      if(left<=1e-7)break;
      if(forward){if(e.index>=e.points.length-2)break;e.index++;e.t=0;}
      else{if(e.index===0)break;e.index--;e.t=1;}
    }
    positionOnRoute(e);return moved;
  }
  function displace(e,amount,time){
    if(e.type==='boss'||e.shortcutFlight||time<(e.displaceReady||0))return 0;
    if(amount<0)amount=-Math.min(-amount,Math.max(0,240-(e.displacedDistance||0)));
    const moved=moveOnRoute(e,amount);if(moved){e.displaceReady=time+8000;e.displacedDistance=(e.displacedDistance||0)+(amount<0?moved:0);e.charge=0;e.motionRevision=(e.motionRevision||0)+1;}return moved;
  }
  function routeProjection(e,point){
    let best=null,offset=0,current=0;
    for(let i=0;i<e.points.length-1;i++){
      const a=e.points[i],b=e.points[i+1],dx=b.x-a.x,dy=b.y-a.y,len=b.tunnel?0:Math.hypot(dx,dy);
      if(i===e.index)current=offset+len*e.t;
      if(len&&!a.tunnel&&!b.tunnel){const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/(len*len))),distance=Math.hypot(point.x-a.x-t*dx,point.y-a.y-t*dy);if(!best||distance<best.distance)best={distance,at:offset+t*len};}
      offset+=len;
    }
    return best?{...best,delta:best.at-current}:null;
  }
  function gravityPull(e,anchor,def,time){
    if(e.type==='boss'){bindEnemy(e,time,def.bind*.25);return;}
    const projection=routeProjection(e,anchor);
    if(projection&&projection.distance<12&&time>=(e.displaceReady||0)&&!e.shortcutFlight){
      let distance=Math.max(-def.pull,Math.min(def.pull,projection.delta));
      if(distance<0)distance=-Math.min(-distance,Math.max(0,240-(e.displacedDistance||0)));
      if(distance){e.towerPull={remaining:distance,until:time+200};e.displaceReady=time+8200;}
    }
    bindEnemy(e,time,def.bind);
  }
  const windGraphCache=new WeakMap();
  function windGraph(map,target,time){
    let entry=windGraphCache.get(map);
    if(!entry||entry.time!==time){const signature=JSON.stringify([...map].map(([id,t])=>[id,t.q,t.r,t.type,t.rotation,t.roads,t.tunnels]));if(!entry||entry.signature!==signature){entry={signature,targets:new Map()};windGraphCache.set(map,entry);}entry.time=time;}
    if(!entry.targets.has(target))entry.targets.set(target,HexMap.routeGraph(map,target));return entry.targets.get(target);
  }
  function windReroute(state,e,time){
    if(e.type==='boss'||e.shortcutFlight||time<(e.displaceReady||0)||(e.displacedDistance||0)>=240||typeof HexMap==='undefined')return false;
    const from=nearbyTile(state,e);if(!from)return false;
    const goal=state.villages?.goals.find(v=>v.id===e.villageId),target=goal?HexMap.key(goal.q,goal.r):state.challengeKind==='movingFortress'?HexMovingFortress.target(state):'0,0';
    const {graph,geometry,distances}=windGraph(state.map,target,time),before=remainingDistance(e),limit=Math.min(180,240-(e.displacedDistance||0));let chosen=null;
    for(const [id,tile] of state.map){
      const dq=tile.q-from.q,dr=tile.r-from.r;if(id===target||Math.max(Math.abs(dq),Math.abs(dr),Math.abs(dq+dr))!==1||!tile.roads?.length||!distances.has(id))continue;
      let current=id,path=[{...geometry.get(id).hub}],seen=new Set();
      while(current!==target){if(seen.has(current)){path=null;break;}seen.add(current);const edge=(graph.get(current)||[]).filter(x=>distances.has(x.next)&&!seen.has(x.next)).sort((a,b)=>a.cost+distances.get(a.next)-b.cost-distances.get(b.next))[0];if(!edge||edge.points.some(p=>p.tunnel)){path=null;break;}path.push(...edge.points.slice(1).map(p=>({...p})));current=edge.next;}
      if(!path)continue;const extra=HexMap.length(path)-before;
      if(extra<=1||extra>limit||Math.hypot(e.x-path[0].x,e.y-path[0].y)>HexMap.HEX*2)continue;
      const novel=!(e.points||[]).some(p=>Math.hypot(p.x-path[0].x,p.y-path[0].y)<10);
      if(!chosen||novel&&!chosen.novel||novel===chosen.novel&&extra<chosen.extra)chosen={path,extra,novel};
    }
    if(!chosen)return false;
    e.originPoints??=e.points;e.points=chosen.path;e.index=0;e.t=0;positionOnRoute(e);e.displacedDistance=(e.displacedDistance||0)+chosen.extra;e.displaceReady=time+8000;e.motionRevision=(e.motionRevision||0)+1;e.charge=0;return true;
  }
  function addPoison(e,dose,time){
    if(!e.alive||e.immunity==='poison')return;
    e.poisons=(e.poisons||[]).filter(d=>d.until>time);
    const replace=dose.area?e.poisons.findIndex(d=>d.area):-1;
    const weakest=replace>=0?replace:e.poisons.length>=3?e.poisons.reduce((best,d,i)=>d.damage<e.poisons[best].damage||d.damage===e.poisons[best].damage&&d.until<e.poisons[best].until?i:best,0):-1;
    if(weakest>=0){if(e.poisons[weakest].damage>dose.damage)return;const old=e.poisons[weakest];e.poisons[weakest]={...dose,next:Math.min(old.next,dose.next)};}else e.poisons.push({...dose});
  }
  function spreadPoison(state,e,time){
    const dose=e.poisons?.filter(d=>d.spread&&!d.spreadUsed&&d.until>time).sort((a,b)=>b.damage-a.damage)[0];if(!dose)return;
    const nearby=state.enemies.filter(other=>other!==e&&other.alive&&other.immunity!=='poison'&&Math.hypot(other.x-e.x,other.y-e.y)<=65).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y)).slice(0,2);
    for(const other of nearby)addPoison(other,{...dose,spreadUsed:true,next:time+1000},time);
  }
  function applyBurn(e,damage,until,def,source,time){
    if(!e.alive||e.immunity==='fire')return;const old=e.augmentBurn?.until>time?e.augmentBurn:null,keep=old&&old.damage>damage;
    e.augmentBurn={damage:Math.max(damage,old?.damage||0),next:old?.next||time+1000,until:Math.max(until,old?.until||0),multipliers:keep?old.multipliers:def.damageMultipliers,bossMultiplier:keep?old.bossMultiplier:def.bossMultiplier,source:keep?old.source:source};
  }
  function weaponTicks(state,dt,time,emit){
    for(const e of state.enemies){
      for(const dose of e.poisons||[])while(e.alive&&dose.next<=time&&dose.next<=dose.until){damageEnemy(e,dose.damage,{damageType:'poison',damageMultipliers:dose.multipliers,bossMultiplier:dose.bossMultiplier,augmentSecondary:true},state,emit,dose.source);dose.next+=1000;}
      if(e.poisons)e.poisons=e.poisons.filter(d=>d.until>time);
      if(e.towerPull){const p=e.towerPull,part=p.remaining*Math.min(1,dt*1000/Math.max(dt*1000,p.until-time+dt*1000));const moved=moveOnRoute(e,part);if(part<0)e.displacedDistance=(e.displacedDistance||0)+moved;p.remaining-=Math.sign(part)*moved;e.motionRevision=(e.motionRevision||0)+1;if(time>=p.until||moved<Math.abs(part)-.001)delete e.towerPull;}
    }
    const effects=state.towerEffects||[];state.towerEffects=[];
    for(const fx of effects){
      if(fx.kind==='pulse'){
        if(time>=fx.at){for(const id of fx.ids){const e=state.enemies.find(e=>e.id===id);if(e?.alive)damageEnemy(e,fx.damage,fx.def,state,emit,fx.source);}state.projectiles.push({kind:'blast',x:fx.x,y:fx.y,r:fx.r,color:fx.color,ttl:.3,max:.3});}
        else state.towerEffects.push(fx);continue;
      }
      if(fx.kind==='meteor'){
        if(time<fx.at){for(const c of fx.centers)state.projectiles.push({kind:'meteorFall',...c,r:fx.r,fade:1-(fx.at-time)/750,color:fx.color,ttl:dt+.001,max:dt+.001});state.towerEffects.push(fx);continue;}
        const hit=new Set();for(const c of fx.centers){for(const e of state.enemies)if(!hit.has(e.id)&&aliveTarget(state,e,fx.def)&&Math.hypot(e.x-c.x,e.y-c.y)<=fx.r){hit.add(e.id);damageEnemy(e,fx.damage,fx.def,state,emit,fx.source);}state.projectiles.push({kind:'blast',...c,r:fx.r,color:fx.color,ttl:.3,max:.3});}
        const owned=state.towerEffects.filter(z=>z.kind==='crater'&&z.owner===fx.owner);
        for(const c of fx.centers.slice(0,2)){const crater={kind:'crater',owner:fx.owner,...c,r:fx.r,until:time+fx.craterDuration*1000,next:time,burnDps:fx.burnDps,burnDuration:fx.burnDuration,source:fx.source};owned.push(crater);state.towerEffects.push(crater);}
        const remove=new Set(owned.slice(0,-2));state.towerEffects=state.towerEffects.filter(z=>!remove.has(z));continue;
      }
      if(fx.until<=time)continue;
      if(fx.kind==='crater'){
        if(time>=fx.next){fx.next=time+200;for(const e of state.enemies)if(e.alive&&Math.hypot(e.x-fx.x,e.y-fx.y)<=fx.r)applyBurn(e,fx.burnDps,time+fx.burnDuration*1000,{damageMultipliers:{hp:1.2,armor:.4,magic:.5}},fx.source,time);}
        state.projectiles.push({kind:'crater',x:fx.x,y:fx.y,r:fx.r,color:'#ef8e42',ttl:dt+.001,max:dt+.001});
      }
      if(fx.kind==='portal'){
        for(const e of state.enemies){
          if(!e.alive||fx.seen.includes(e.id)||Math.hypot(e.x-fx.x,e.y-fx.y)>fx.r||time<(e.displaceReady||0))continue;
          const cost=e.type==='boss'||ordinary(e)?1:2;if(cost>fx.charges||e.portalUsed&&e.type!=='boss')continue;
          if(e.type==='boss'){slowEnemy(e,.8,time+1500,'portal');e.displaceReady=time+8000;}
          else{const origin=e.originPoints||e.points;if(origin.length<2||e.shortcutFlight)continue;e.originPoints??=e.points;e.points=origin;e.index=0;e.t=0;positionOnRoute(e);e.portalUsed=true;e.displaceReady=time+8000;e.motionRevision=(e.motionRevision||0)+1;e.charge=0;delete e.towerPull;}
          fx.charges-=cost;fx.seen.push(e.id);if(!fx.charges)break;
        }
        state.projectiles.push({kind:'portalGate',x:fx.x,y:fx.y,r:fx.r,color:'#75d4d2',ttl:dt+.001,max:dt+.001});if(!fx.charges)continue;
      }
      if(fx.kind==='tornado'){
        for(const ray of fx.rays){
          const from={x:ray.x,y:ray.y},distance=fx.speed*dt;ray.x+=ray.ux*distance;ray.y+=ray.uy*distance;
          const dx=ray.x-from.x,dy=ray.y-from.y,len=dx*dx+dy*dy;
          const candidates=state.enemies.filter(e=>!fx.seen.includes(e.id)&&aliveTarget(state,e,fx.def)).map(e=>({e,t:len?Math.max(0,Math.min(1,((e.x-from.x)*dx+(e.y-from.y)*dy)/len)):0})).filter(({e,t})=>Math.hypot(e.x-from.x-t*dx,e.y-from.y-t*dy)<=18).sort((a,b)=>a.t-b.t);
          for(const {e} of candidates){if(fx.seen.length>=fx.cap)break;fx.seen.push(e.id);damageEnemy(e,fx.damage,fx.def,state,emit,fx.source);if(!e.alive)continue;slowEnemy(e,e.type==='boss'?.8:.85,time+600,'wind');if(fx.reroute&&fx.rerouted<3&&windReroute(state,e,time))fx.rerouted++;else if(fx.push)displace(e,-fx.push,time);}
          state.projectiles.push({kind:'tornado',x:ray.x,y:ray.y,r:18,color:'#d9efce',ttl:dt+.001,max:dt+.001});
        }
        if(fx.seen.length>=fx.cap)continue;
      }
      state.towerEffects.push(fx);
    }
    // Pending casts and zones share a small per-owner budget, even after save/restore.
    const counts=new Map();state.towerEffects=state.towerEffects.reverse().filter(fx=>{if(fx.kind!=='crater')return true;const n=(counts.get(fx.owner)||0)+1;counts.set(fx.owner,n);return n<=2;}).reverse();
  }
  function laserAttack(state,ref,def,dt,time,emit,frame){
    const tw=ref.tw;tw.laserBeams??=[];tw.laserBeams.length=Math.min(tw.laserBeams.length,def.beams);
    while(tw.laserBeams.length<def.beams)tw.laserBeams.push({ready:time+def.swapDelay*1000,charge:0,next:time});
    const used=new Set(),byId=frame.enemies??=(new Map(state.enemies.map(e=>[e.id,e])));
    const valid=e=>e&&aliveTarget(state,e,def)&&withinMineRadius(e,ref.pos,def.range);let available;
    for(const beam of tw.laserBeams){
      let target=byId.get(beam.target);if(!valid(target)||used.has(target.id))target=null;
      if(!target&&beam.target!==undefined){beam.lostAt??=time;if(time-beam.lostAt<=200&&byId.get(beam.target)?.alive){used.add(beam.target);continue;}delete beam.target;beam.charge=0;beam.ready=time+def.swapDelay*1000;}
      if(time<beam.ready)continue;
      if(!target){available??=state.enemies.filter(valid);target=targetByPriority(available.filter(e=>!used.has(e.id)&&e.alive),tw,ref.pos);if(!target)continue;beam.target=target.id;beam.charge=0;beam.next=time;beam.shieldReady=time;}
      delete beam.lostAt;used.add(target.id);beam.charge+=dt;
      const strength=Math.min(1,beam.charge/def.beamRamp),damage=def.beamMin+(def.beamMax-def.beamMin)*strength;
      if(time>=beam.next){beam.next=time+200;if(!target.shieldHits||time>=(beam.shieldReady||0)){if(target.shieldHits)beam.shieldReady=time+500;damageEnemy(target,damage*.2*(.2/def.cooldown),def,state,emit,tw);}}
      tw.aim={x:target.x,y:target.y,time};tw.lastShot=time;
      state.projectiles.push({kind:'laserBeam',x1:ref.pos.x,y1:ref.pos.y,x2:target.x,y2:target.y,r:1+strength*2.5,color:def.color,fade:strength,ttl:dt+.001,max:dt+.001});
    }
  }
  function newWeaponAttack(state,ref,def,dt,time,emit,frame){
    const tw=ref.tw;if(def.weapon==='laser'){laserAttack(state,ref,def,dt,time,emit,frame);return;}
    if(time-(tw.lastShot??-Infinity)<def.cooldown*1000)return;
    let candidates=state.enemies.filter(e=>aliveTarget(state,e,def)&&withinMineRadius(e,ref.pos,def.range));
    if(def.weapon==='portal')candidates=candidates.filter(e=>(!e.portalUsed||e.type==='boss')&&time>=(e.displaceReady||0)&&remainingDistance(e)<HexMap.length(e.originPoints||e.points)-30&&(routeProjection(e,ref.pos)?.delta??0)<-def.range*.15);
    if(!candidates.length)return;
    if(def.weapon==='poison'&&!def.poisonArea&&(!tw.targetPriority||JSON.stringify(tw.targetPriority)===JSON.stringify(HexData.defaultTargetPriority(tw)))){const min=Math.min(...candidates.map(e=>(e.poisons||[]).filter(d=>d.until>time).length));candidates=candidates.filter(e=>(e.poisons||[]).filter(d=>d.until>time).length===min);}
    const primary=targetByPriority(candidates,tw,ref.pos),source=weaponSource(tw),damageDef=effectDef(def);tw.lastShot=time;tw.aim={x:primary.x,y:primary.y,time};tw.weaponShots=(tw.weaponShots||0)+1;
    const owner=tw.weaponId??=(state.nextWeaponId=(state.nextWeaponId||0)+1);state.towerEffects??=[];
    const near=radius=>state.enemies.filter(e=>aliveTarget(state,e,def)&&Math.hypot(e.x-primary.x,e.y-primary.y)<=radius).sort((a,b)=>Math.hypot(a.x-primary.x,a.y-primary.y)-Math.hypot(b.x-primary.x,b.y-primary.y));
    if(def.weapon==='gravity'){
      const group=near(def.effectRadius).slice(0,def.targetCap);for(const e of group){damageEnemy(e,def.damage,def,state,emit,tw);if(e.alive)gravityPull(e,primary,def,time);}
      state.projectiles.push({kind:'gravityWell',x:primary.x,y:primary.y,r:def.effectRadius,ttl:def.bind,max:def.bind,color:def.color});
      if(def.gravityEcho)state.towerEffects.push({kind:'pulse',at:time+800,ids:group.map(e=>e.id),damage:def.damage,def:damageDef,source,x:primary.x,y:primary.y,r:def.effectRadius,color:def.color});
    }else if(def.weapon==='wind'){
      const angle=Math.atan2(primary.y-ref.pos.y,primary.x-ref.pos.x),fan=def.windFan&&tw.weaponShots%4===0;
      state.towerEffects.push({kind:'tornado',until:time+1200,speed:def.range/1.2,rays:(fan?[-.25,0,.25]:[0]).map(offset=>({x:ref.pos.x,y:ref.pos.y,ux:Math.cos(angle+offset),uy:Math.sin(angle+offset)})),cap:fan?8:def.targetCap,seen:[],damage:def.damage,def:damageDef,source,push:def.push||0,reroute:def.windReroute&&tw.weaponShots%5===0,rerouted:0});
    }else if(def.weapon==='poison'){
      const targets=def.poisonArea?near(def.effectRadius).slice(0,def.targetCap):[primary];
      for(const e of targets){const blocked=e.shieldHits>0;damageEnemy(e,def.damage,def,state,emit,tw);if(!blocked&&e.alive)addPoison(e,{damage:def.poisonDps,until:time+def.poisonDuration*1000,next:time+1000,multipliers:def.damageMultipliers,bossMultiplier:def.poisonBoss||1,source,area:!!def.poisonArea,spread:!!def.poisonSpread},time);}
      state.projectiles.push({kind:'line',x1:ref.pos.x,y1:ref.pos.y,x2:primary.x,y2:primary.y,color:def.color,tower:'poison',splash:def.poisonArea?def.effectRadius:0,ttl:.3,max:.3,id:nextProjectileId(state),hits:targets.map(e=>e.id)});
      if(def.poisonArea)state.projectiles.push({kind:'blast',x:primary.x,y:primary.y,r:def.effectRadius,color:def.color,ttl:.3,max:.3});
    }else if(def.weapon==='meteor'){
      const centers=[{x:primary.x,y:primary.y}];for(const e of candidates)if(centers.length<(def.meteorCount||1)&&centers.every(c=>Math.hypot(c.x-e.x,c.y-e.y)>def.effectRadius))centers.push({x:e.x,y:e.y});
      state.towerEffects.push({kind:'meteor',owner,at:time+750,centers,r:def.effectRadius,damage:def.damage,def:damageDef,source,color:def.color,craterDuration:def.craterDuration,burnDps:def.burnDps,burnDuration:def.burnDuration});
    }else if(def.weapon==='portal')state.towerEffects.push({kind:'portal',source,x:primary.x,y:primary.y,r:def.effectRadius,until:time+def.portalDuration*1000,charges:def.portalCharges,seen:[]});
    else if(def.weapon==='gamble'){
      const random=state.weaponRandom??=HexRandom.create((state.seed||'run')+'|gamble'),roll=random()*100,risk=def.luck.startsWith('risk'),normal=risk?(def.luck==='risk4'?40:45):def.luck==='safe4'?63:def.luck==='safe3'?59:55,crit=normal+25,mega=crit+(risk?(def.luck==='risk4'?20:15):10),jack=mega+(risk?3:2);
      let damage=0,color=def.color;
      if(roll<normal)damage=def.damage;else if(roll<crit){damage=def.damage*(risk?3:2.5);color='#f4ce67';}else if(roll<mega){damage=def.damage*(risk?7:5);color='#f49b67';}else if(roll<jack){damage=def.damage*(ordinary(primary)?8:3);color='#fff4b2';}
      else if(!def.luck.startsWith('safe')){if(roll<jack+(risk?7:5)){primary.hp=Math.min(primary.maxHp||primary.hp,primary.hp+Math.min(def.damage*(risk?2:1.5),(primary.maxHp||primary.hp)*(primary.type==='boss'?.005:.05)));color='#93df9b';}else{primary.luckHaste={factor:primary.type==='boss'?1.05:risk?1.15:1.1,until:time+3000};color='#e985a1';}}
      if(damage)damageEnemy(primary,damage,def,state,emit,tw);
      state.projectiles.push({kind:'line',x1:ref.pos.x,y1:ref.pos.y,x2:primary.x,y2:primary.y,color,tower:'gamble',ttl:.3,max:.3,id:nextProjectileId(state),hits:damage?[primary.id]:[]});
    }
    emit(tw.type);
  }
  function step(state,towerRefs,definitions,dt,time,emit=()=>{}){
    state.enemyZones=(state.enemyZones||[]).filter(zone=>zone.until>time);
    for(const zone of state.enemyZones){
      state.projectiles.push({kind:zone.kind==='spores'?'enemySpores':'enemyTar',x:zone.x,y:zone.y,r:zone.r,ttl:dt+.001,max:dt+.001,fade:Math.min(1,(zone.until-time)/1000),color:'#30291f'});
    }
    // Tick-local values: upgrades and support/biome changes apply on the next step.
    towerRefs=towerRefs.map(ref=>{if(ref.tw.overloadPending){delete ref.tw.overloadPending;ref.tw.overloadUntil=time+(ref.tw.overloadDuration??12000);}let definition={...(ref.definition||HexData.towerDefinition(ref.tw,definitions))};if(typeof HexAugmentCards!=='undefined')definition=HexAugmentCards.definition(state,ref.tw,definition);if(ref.tw.overloadUntil>time)definition.cooldown/=1.5;return {...ref,definition};});
    state.soulDeaths=[];
    weaponTicks(state,dt,time,emit);
    augmentTicks(state,towerRefs,dt,time,emit);
    applyConsumables(state,time,emit);
    const auraRefs=towerRefs.filter(ref=>ref.definition.aura);
    // Movement finishes before targeting. Only path distance is shared: health,
    // armor and magic values must stay live between consecutive tower hits.
    const pathDistances=new Map();
    const targetDistance=e=>{if(!pathDistances.has(e))pathDistances.set(e,remainingDistance(e));return pathDistances.get(e);};
    const TOWERS=definitions;state.mines??=[];const arrive=e=>{e.alive=false;let damage=e.type==='ramBeetle'&&e.charge>=.95?3:(e.baseDamage??1);if(damage>0&&state.augments?.includes('seal')&&state.sealWave!==state.wave){state.sealWave=state.wave;damage--;}if(damage>0&&state.merchantProtectionWave===state.wave&&state.merchantProtection>0){const blocked=Math.min(damage,state.merchantProtection);state.merchantProtection-=blocked;damage-=blocked;}if(cardValue(state,'base')&&!state.augmentBaseUsed&&state.hp-damage<=(state.maxHp||20)*.25){state.augmentBaseUsed=true;state.augmentBaseUntil=time+cardValue(state,'base')*1000;if(cardLevel(state,'base')===4)state.hp=Math.min(state.maxHp||20,state.hp+2);}else if(state.augmentBaseUntil>time)damage=0;if(state.challengeKind==='villages')HexVillages.damage(state,e.villageId,damage);else state.hp-=damage;if(e.goldLoss)state.gold=Math.max(0,state.gold-e.goldLoss);const landmark=state.landmarks?.get(e.landmarkId);if(landmark)landmark.status='escaped';emit('hit');};
    for(const e of state.enemies){if(!e.alive)continue;if(e.index>=e.points.length-1){arrive(e);continue;}e.slowEffects=(e.slowEffects||[]).filter(effect=>effect.until>time);e.slowFactor=Math.min(1,...e.slowEffects.map(effect=>effect.factor));for(const ref of auraRefs){const def=ref.definition;if(Math.hypot(e.x-ref.pos.x,e.y-ref.pos.y)<=def.range)e.slowFactor=Math.min(e.slowFactor,def.slow);}e.slowFactor=Math.max(e.minSpeedFactor||0,e.slowFactor);const terrainSpeed=typeof HexBiomes!=='undefined'&&state.biomeSeed!=null&&HexBiomes.atWorld(state,e.x,e.y)==='desert'?.85:1;
      const slowResistance=Math.max(0,Math.min(1,e.slowResistance||0));
      e.spawnedAt??=time;const age=Math.max(0,time-e.spawnedAt),cycle=age%4000;let motion=1;
      if(e.type==='thornToad'){
        const hopCycle=age%1600,hop=Math.floor(age/1600);e.leaping=hopCycle>=900;e.crouching=hopCycle>=650&&!e.leaping;e.leapProgress=e.leaping?(hopCycle-900)/700:0;motion=e.leaping?1600/700:0;
        if(!e.shortcutFlight&&!e.towerPull&&!(e.controlUntil>time)&&!(e.augmentFrozen>time)&&e.leaping&&e.lastHop!==hop){e.lastHop=hop;e.shortcutJump=false;if(hop%4===3)toadShortcut(state,e,HexMap.HEX*Math.sqrt(3)*e.slowFactor);}
      }
      if(e.type==='ramBeetle'){e.charge=straightSegment(e)&&e.slowFactor>=.95?Math.min(1,(e.charge||0)+dt/1.5):0;motion=1+e.charge;}
      if(e.augmentFrozen>time||e.controlUntil>time){if(e.shortcutFlight)e.shortcutFlight.start+=dt*1000;e.slowFactor=0;continue;}
      if(e.shortcutFlight){const f=e.shortcutFlight,u=Math.min(1,Math.max(0,(time-f.start)/700));e.leaping=u<1;e.crouching=false;e.leapProgress=u;e.x=f.from.x+(f.to.x-f.from.x)*u;e.y=f.from.y+(f.to.y-f.from.y)*u;e.t=u;if(u===1){e.index=1;e.t=0;delete e.shortcutFlight;}continue;}
      if(motion===0||e.augmentFrozen>time)continue;
      const haste=e.luckHaste?.until>time?e.luckHaste.factor:1;
      let distance=e.speed*dt*motion*haste*(1-(1-e.slowFactor*terrainSpeed)*(1-slowResistance));while(e.index<e.points.length-1){const a=e.points[e.index],b=e.points[e.index+1],length=b.tunnel?0:Math.hypot(b.x-a.x,b.y-a.y),remaining=length*(1-e.t);if(length>0&&distance<remaining){e.t+=distance/length;break;}distance-=remaining;e.t=0;
        if(e.type==='ramBeetle'&&e.points[e.index+2]&&!straightSegment({...e,index:e.index+1})){distance/=1+(e.charge||0);e.charge=0;}
        e.index++;if(e.index>=e.points.length-1){arrive(e);break;}}if(e.alive){const a=e.points[e.index],b=e.points[e.index+1];e.x=a.x+(b.x-a.x)*e.t;e.y=a.y+(b.y-a.y)*e.t;}}
    for(const e of state.enemies){
      if(!e.alive)continue;
      if(e.type==='tarSnail'&&(!e.lastTar||Math.hypot(e.x-e.lastTar.x,e.y-e.lastTar.y)>=18)){
        e.lastTar={x:e.x,y:e.y};state.enemyZones.push({kind:'tar',ownerId:e.id,x:e.x,y:e.y,r:12,until:time+5000});
      }
    }
    for(const healer of state.enemies){
      if(!healer.alive||!healer.healInterval)continue;
      healer.nextHealAt??=time+healer.healInterval;if(time<healer.nextHealAt)continue;healer.nextHealAt=time+healer.healInterval;
      let healed=false;for(const target of state.enemies){if(!target.alive||target===healer||target.healInterval||target.hp>=target.maxHp||time-(target.lastHealedAt??-Infinity)<healer.healInterval||Math.hypot(target.x-healer.x,target.y-healer.y)>healer.healRadius)continue;target.hp=Math.min(target.maxHp,target.hp+Math.min(target.maxHp*.05,20+8*Math.max(1,state.wave||1)));target.lastHealedAt=time;healed=true;}
      if(healed)state.projectiles.push({kind:'blast',x:healer.x,y:healer.y,r:healer.healRadius,ttl:.4,max:.4,color:'#73e49c'});
    }
    triggerMines(state,emit);state.enemies=state.enemies.filter(e=>e.alive&&durability(e)>0);
    const mineLayout={},weaponFrame={}; // Shared lazily by all mine layers in this simulation step.
    // Reject distant enemies before inspecting their pools/zones. The same exact
    // hypot radius and array order still decide targeting; health stays live.
    for(const ref of towerRefs){const def=ref.definition||HexData.towerDefinition(ref.tw,TOWERS);if(def.weapon){newWeaponAttack(state,ref,def,dt,time,emit,weaponFrame);continue;}if(def.aura)continue;if(def.mine){layMine(state,ref,def,time,mineLayout);continue;}if(time-ref.tw.lastShot<def.cooldown*1000)continue;const inRange=state.enemies.filter(e=>e.alive&&withinMineRadius(e,ref.pos,def.range)&&durability(e)>0&&!hiddenBySpores(state,e)&&(!e.immunity||e.immunity!==def.damageType));if(!inRange.length)continue;const primary=targetByPriority(inRange,ref.tw,ref.pos,targetDistance);if(ref.tw.type==='archer'&&cardValue(state,'archer')){
        const max=cardLevel(state,'archer')===4?8:5,streak=Math.min(max,ref.tw.augmentStreak||0);
        if(ref.tw.augmentTarget!==primary.id){
          // The previous target's haste must not accelerate the first shot at a new target.
          def.cooldown*=1+streak*cardValue(state,'archer');ref.tw.augmentStreak=0;
          if(time-ref.tw.lastShot<def.cooldown*1000)continue;
          ref.tw.augmentTarget=primary.id;
        }else ref.tw.augmentStreak=Math.min(max,streak+1);
      }if(cardValue(state,'ballista')&&ref.tw.type==='ballista')ref.tw.augmentShots=(ref.tw.augmentShots||0)+1;ref.tw.lastShot=time;ref.tw.aim={x:primary.x,y:primary.y,time};emit(ref.tw.type);
      if(def.chain){const hit=[primary];while(hit.length<def.chain){const last=hit.at(-1),next=nextChainTarget(state.enemies,hit,last,def.jumpRange,def.damageType,state);if(!next)break;hit.push(next);}hit.forEach((e,i)=>damageEnemy(e,def.damage*Math.max(.25,1-i*.18),def,state,emit,ref.tw));state.projectiles.push({kind:'chain',pts:[ref.pos,...hit.map(e=>({x:e.x,y:e.y}))],ttl:.24,max:.24,color:def.color,tower:ref.tw.type,id:nextProjectileId(state),hits:hit.map(e=>e.id),hitAt:hit.map(e=>({x:e.x,y:e.y}))});}
      else if(def.pierce){const vx=primary.x-ref.pos.x,vy=primary.y-ref.pos.y,mag=Math.hypot(vx,vy)||1,ux=vx/mag,uy=vy/mag,hit=[];for(const e of state.enemies){if(!e.alive||durability(e)<=0||(e.immunity&&e.immunity===def.damageType))continue;const ex=e.x-ref.pos.x,ey=e.y-ref.pos.y,along=ex*ux+ey*uy,perp=Math.abs(ex*uy-ey*ux);if(along>0&&along<def.range&&perp<20)hit.push({enemy:e,along});}const struck=hit.sort((a,b)=>a.along-b.along).slice(0,def.pierceTargets||3);struck.forEach(({enemy})=>damageEnemy(enemy,def.damage,def,state,emit,ref.tw));state.projectiles.push({kind:'line',x1:ref.pos.x,y1:ref.pos.y,x2:ref.pos.x+ux*def.range,y2:ref.pos.y+uy*def.range,ttl:.38,max:.38,color:def.color,tower:ref.tw.type,variant:ref.tw.branch,id:nextProjectileId(state),hits:struck.map(h=>h.enemy.id),hitAt:struck.map(h=>({x:h.enemy.x,y:h.enemy.y,along:h.along/def.range}))});}
      else{const hit=def.splash?state.enemies.filter(e=>e.alive&&Math.hypot(e.x-primary.x,e.y-primary.y)<=def.splash):[primary];if(ref.tw.type==='catapult'&&cardValue(state,'catapult')){const radius=(def.splash||0)+(cardLevel(state,'catapult')===4?60:35);for(const e of state.enemies)if(e.alive&&Math.hypot(e.x-primary.x,e.y-primary.y)>(def.splash||0)&&Math.hypot(e.x-primary.x,e.y-primary.y)<=radius)damageEnemy(e,def.damage*cardValue(state,'catapult'),{...def,augmentSecondary:true},state,emit,ref.tw);state.projectiles.push({kind:'blast',x:primary.x,y:primary.y,r:radius,ttl:.2,max:.2,color:'#ddbd80'});}const life=FLIGHT_TTL[ref.tw.type]||.1;hit.forEach(e=>{damageEnemy(e,def.damage,def,state,emit,ref.tw);if(e.alive&&def.hitSlow&&e.immunity!==def.damageType){e.slowEffects??=[];const effect=e.slowEffects.find(item=>item.factor===def.hitSlow);if(effect)effect.until=time+def.slowDuration*1000;else e.slowEffects.push({factor:def.hitSlow,until:time+def.slowDuration*1000});}});state.projectiles.push({kind:'line',x1:ref.pos.x,y1:ref.pos.y,x2:primary.x,y2:primary.y,ttl:life,max:life,color:def.color,tower:ref.tw.type,variant:ref.tw.branch,splash:def.splash,id:nextProjectileId(state),hits:hit.map(e=>e.id),hitAt:[{x:primary.x,y:primary.y}]});}
    }
    // Geister gehören ihrem Turm, blockieren keine Wege und verschwinden am Wave-Ende.
    const necromancers=towerRefs.map(ref=>({...ref,def:ref.definition||HexData.towerDefinition(ref.tw,TOWERS)})).filter(ref=>ref.def.soulLimit);
    for(const ref of necromancers){
      ref.tw.souls=(ref.tw.souls||[]).filter(soul=>soul.until>time);
      for(const [index,soul] of ref.tw.souls.entries()){
        const angle=time*.001+index*Math.PI*2/ref.tw.souls.length,pos={x:ref.pos.x+Math.cos(angle)*22,y:ref.pos.y+Math.sin(angle)*22};
        state.projectiles.push({kind:'spirit',x:pos.x,y:pos.y,r:5,ttl:dt+.01,color:ref.def.color});
        if(time-soul.lastShot<1000)continue;
        const targets=state.enemies.filter(e=>e.alive&&withinMineRadius(e,ref.pos,ref.def.range)&&durability(e)>0&&!hiddenBySpores(state,e)&&(!e.immunity||e.immunity!==ref.def.damageType));
        if(!targets.length)continue;const target=targetByPriority(targets,ref.tw,ref.pos,targetDistance);soul.lastShot=time;
        damageEnemy(target,ref.def.soulDamage,ref.def,state,emit,ref.tw);
        state.projectiles.push({kind:'line',x1:pos.x,y1:pos.y,x2:target.x,y2:target.y,ttl:.2,max:.2,color:ref.def.color,tower:'necromancer',id:nextProjectileId(state),hits:[target.id],hitAt:[{x:target.x,y:target.y}]});
      }
    }
    for(const death of state.soulDeaths){
      const owner=necromancers.filter(ref=>ref.tw.souls.length<ref.def.soulLimit&&Math.hypot(death.x-ref.pos.x,death.y-ref.pos.y)<=ref.def.range).sort((a,b)=>Math.hypot(death.x-a.pos.x,death.y-a.pos.y)-Math.hypot(death.x-b.pos.x,death.y-b.pos.y))[0];
      if(owner)owner.tw.souls.push({until:time+owner.def.soulDuration*1000,lastShot:time});
    }
    for(const e of state.enemies)e.sporeHidden=hiddenBySpores(state,e);
    state.soulDeaths=[];
    // Spawn after every attack: the killing splash cannot also hit the children.
    if(state.splitChildren?.length){state.enemies.push(...state.splitChildren);state.splitChildren=[];}
    state.projectiles.forEach(p=>p.ttl-=dt);state.projectiles=state.projectiles.filter(p=>p.ttl>0);state.enemies=state.enemies.filter(e=>e.alive&&durability(e)>0);
  }
  return {step,durability,remainingDistance,targetByPriority,presentationRange,consumables,lanePoint,buyConsumable,clearConsumables,applyConsumables,consumableStats,consumableRemaining};
})();
