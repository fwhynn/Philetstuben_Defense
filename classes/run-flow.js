/* Shared turn flow: no DOM, profile persistence or wall-clock timers. */
const HexRunFlow=(()=>{
  const {key}=HexMap;
  function shuffle(arr,random){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function drawHand(state,random){
    const CARD_LIBRARY=HexData.CARD_LIBRARY;let result='ready';
    const shuffle=arr=>HexRunFlow.shuffle(arr,random);
    // A building plot or a closing road never satisfies the road-progress guarantee.
    function hasAnyPlacement(card,rotation){
      if((card?.roads?.length||0)<2)return false;
      const checked=new Set();
      for(const tile of state.map.values())for(let d=0;d<6;d++){
        const n=HexMap.neighbor(tile.q,tile.r,d),id=key(n.q,n.r);if(checked.has(id))continue;checked.add(id);
        if(!HexPlacementCommands.canPlace(state,n.q,n.r,card,rotation))continue;
        const roads=HexMap.rotatedRoads(card,rotation),candidate=new Map(state.map);candidate.set(id,{...n,type:card.id,roads});
        const outside=HexMap.exterior(candidate,state.landmarks);
        if(roads.some(dir=>{const next=HexMap.neighbor(n.q,n.r,dir);return outside.has(key(next.q,next.r));}))return true;
      }
      return false;
    }
  function refillDraw(){
    if(state.drawPile.length===0){state.drawPile=shuffle(state.discard);state.discard=[];}
  }
  function draw(){
    state.hand=[];
    let guard=0;
    while(state.hand.length<(state.openingRemaining===2?5:3) && guard<30){
      guard++;
      refillDraw();
      if(state.drawPile.length===0) break;
      state.hand.push(state.drawPile.pop());
    }
    state.tunnelOffer=null;state.tunnelConfirmed=false;
    const playable=(state.map.size<=1||HexMap.hasExteriorFront(state.map,state.landmarks))&&ensurePlayableHand();
    
    if(!playable){
      const rescue=HexMap.rescue(state.map,state.landmarks,state.difficulty==='dual'?2:1);
      if(rescue){state.discard.push(...state.hand);state.rescueCard=rescue;state.hand=['rescue'];result='rescue';}
      else {state.phase='build';state.tunnelOffer=HexMap.tunnelPlan(state.map,state.landmarks,state.difficulty==='dual');result=state.tunnelOffer?'tunnel':'blocked';}
    }
    return result;
  }
  function ensurePlayableHand(){
    const playableIds=new Set(state.deck.filter(id=>{
      for(let rot=0;rot<6;rot++) if(hasAnyPlacement(CARD_LIBRARY[id],rot)) return true;
      return false;
    }));
    if(!playableIds.size) return false;
    if(state.hand.some(id=>playableIds.has(id)))return true;
    // Replace only one card; preserve the other options, pile counts and opening hand size.
    const pile=[state.drawPile,state.discard].find(p=>p.some(id=>playableIds.has(id)));
    if(!pile)return false;
    const [id]=pile.splice(pile.findIndex(id=>playableIds.has(id)),1);
    if(state.hand.length)state.discard.push(state.hand.pop());
    state.hand.push(id);
    return true;
  }

    return draw();
  }
  function start(state,random){
    if(state.hp<=0||state.waveRunning||state.phase!=='build'||state.openingRemaining||state.celebrationActive) return;
    const sources=HexRunRuntime.spawnSources(state);
    if(!sources.length)return null;
    state.waveRunning=true;state.wave++;
    state.phase='wave';

    const wavePlan=HexWaves.plan(state.wave,state.income,!!state.challengeDay,state),count=wavePlan.count;
    state.waveKills=0;
    state.pendingSpawns=count;
    HexRunRuntime.schedule(state,sources,wavePlan.enemies,20);
    const bosses=spawnReadyBosses(state,random);
    const waveBoss=HexWaves.plan(state.wave,state.income,!!state.challengeDay,state).boss;
    if(waveBoss){
      // Separate seeded stream: choosing an entrance must not alter card rewards.
      const pick=HexRandom.create(state.seed+'|waveboss|'+state.wave);
      const source=sources[Math.floor(pick()*sources.length)],points=HexRunRuntime.nextSourcePoints(state,random,source),start=points[0];
      state.enemies.push({id:state.nextEnemyId++,...waveBoss,...HexBiomes.guardian(state,source.tile),landmarkId:'wave:'+state.wave,points,index:0,t:0,maxHp:waveBoss.hp,maxArmorHp:waveBoss.armorHp||0,maxMagicHp:waveBoss.magicHp||0,alive:true,x:start.x,y:start.y});
    }
    return {fronts:sources.length,bosses,waveBoss:!!waveBoss};
  }

  function spawnReadyBosses(state,random){
    const routes=HexMap.routeGraph(state.map);let count=0;
    for(const landmark of state.landmarks.values()){
      if(landmark.status!=='ready') continue;
      const id=key(landmark.q,landmark.r);if(!routes.distances.has(id)) continue;
      const source={tile:state.map.get(id),routes,points:[routes.geometry.get(id).hub],branchCounts:new Map()};
      const points=HexRunRuntime.nextSourcePoints(state,random,source);if(points.length<2) continue;
      const profile=HexExploration.bossProfile(state.wave);if(state.challengeDay)profile.speed*=.85;const start=points[0];landmark.status='fighting';
      state.enemies.push({id:state.nextEnemyId++,...profile,...HexBiomes.guardian(state,landmark),landmarkId:id,points,index:0,t:0,maxHp:profile.hp,maxArmorHp:profile.armorHp||0,maxMagicHp:profile.magicHp||0,alive:true,x:start.x,y:start.y});count++;
    }
    return count;
  }


  function finish(state){
    if(state.hp<=0||state.wave<1||state.pendingSpawns>0||state.enemies.some(e=>e.alive)||state.lastCompletedWave===state.wave)return null;
    state.lastCompletedWave=state.wave;state.waveRunning=false;
    state.gold+=HexWaves.economy.completion+state.income;state.projectiles=[];state.mines=[];
    for(const tile of state.map.values())for(const tower of tile.towers||[])if(tower)tower.souls=[];
    state.goldEarned.completion+=HexWaves.economy.completion;state.goldEarned.income+=state.income;state.phase='place';
    if(state.challengeDay&&state.wave===20&&!state.challengeWon){state.challengeWon=true;state.phase='victory';return {victory:true};}
    return {victory:false};
  }
  return {shuffle,drawHand,start,finish};
})();
