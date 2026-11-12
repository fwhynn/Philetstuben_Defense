/* Shared turn flow: no DOM, profile persistence or wall-clock timers. */
const HexRunFlow=(()=>{
  const {key}=HexMap;
  function shuffle(arr,random){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function drawHand(state,random){
    if(state.challengeKind==='movingFortress')return HexMovingFortress.prepare(state);
    if(state.challengeKind==='towerDraft')return HexTowerDraft.prepare(state);
    if(state.challengeKind==='detour')return HexDetour.prepare(state);
    if(state.challengeKind==='villages')return HexVillages.prepare(state);
    if(state.challengeKind==='powerGrid')return HexPowerGrid.prepare(state);
    if(state.challengeKind==='expedition')return HexExpedition.prepare(state);
    if(state.challengeKind==='garrison'){state.hand=[];state.phase='build';return 'ready';}
    const {CARD_LIBRARY}=HexData;
    function ensurePlayableHand(){
      const targets=new Map(),checked=new Map(),deck=new Set(state.deck);
      for(const tile of state.map.values())for(const d of tile.roads||[]){
        const n=HexMap.neighbor(tile.q,tile.r,d),id=key(n.q,n.r);
        if(!state.map.has(id))targets.set(id,n);
      }
      function playable(id){
        if(checked.has(id))return checked.get(id);
        const card=CARD_LIBRARY[id];
        // A building plot or a dead end cannot guarantee road progress.
        let fits=false;
        if(deck.has(id)&&card?.roads?.length>=2){
          for(let rotation=0;rotation<6&&!fits;rotation++)for(const n of targets.values()){
            if(!HexPlacementCommands.canPlace(state,n.q,n.r,card,rotation))continue;
            if(state.openingRemaining){
              // The two-front opening has its own placement rules, without landmarks.
              const next=new Map(state.map);next.set(key(n.q,n.r),{...n,type:id,roads:HexMap.rotatedRoads(card,rotation)});
              if(!HexMap.hasExteriorFront(next,state.landmarks))continue;
            }
            fits=true;break;
          }
        }
        checked.set(id,fits);return fits;
      }
      if(state.hand.some(playable))return true;
      for(const pile of [state.drawPile,state.discard]){
        const index=pile.findIndex(playable);if(index<0)continue;
        const [id]=pile.splice(index,1);
        if(state.hand.length)state.discard.push(state.hand.pop());
        state.hand.push(id);return true;
      }
      return false;
    }

    HexDeck.recoverMissing(state);
    state.discard.push(...state.hand.filter(id=>id!=='rescue'));
    state.hand=[];
    const handSize=state.openingRemaining===2?5:state.augments?.includes('fourthCard')?4:3;
    while(state.hand.length<handSize){
      if(!state.drawPile.length){state.drawPile=shuffle(state.discard,random);state.discard=[];}
      if(!state.drawPile.length)break;
      state.hand.push(state.drawPile.pop());
    }
    state.tunnelOffer=null;state.tunnelConfirmed=false;
    if((state.map.size<=1||HexMap.hasExteriorFront(state.map,state.landmarks))&&ensurePlayableHand())return 'ready';

    state.discard.push(...state.hand);
    state.rescueCard=HexMap.rescue(state.map,state.landmarks,state.difficulty==='dual'?2:1);
    state.hand=state.rescueCard?['rescue']:[];
    if(state.rescueCard)return 'rescue';

    state.phase='build';
    state.tunnelOffer=HexMap.tunnelPlan(state.map,state.landmarks,true);
    return state.tunnelOffer?'tunnel':'blocked';
  }
  function start(state,random){
    if(state.challengeKind==='greed'&&state.greedContract?.wave!==state.wave+1)return null;
    if(state.hp<=0||state.waveRunning||state.phase!=='build'||state.openingRemaining||state.celebrationActive) return;
    if(state.challengeKind==='detour'&&!HexDetour.ready(state))return null;
    if(state.challengeKind==='towerDraft'&&state.towerDraft.picks)return null;
    const sources=HexRunRuntime.spawnSources(state);
    if(!sources.length)return null;
    if(state.challengeKind==='powerGrid')HexPowerGrid.lock(state);
    state.waveRunning=true;state.wave++;
    state.phase='wave';

    const wavePlan=HexWaves.plan(state.wave,state.income,!!state.challengeDay,state),count=wavePlan.count;
    state.waveKills=0;
    state.pendingSpawns=count;
    HexRunRuntime.schedule(state,sources,wavePlan.enemies,20);
    const bosses=wavePlan.dev?0:spawnReadyBosses(state,random);
    const waveBoss=HexWaves.plan(state.wave,state.income,!!state.challengeDay,state).boss;
    if(waveBoss){
      // Separate seeded stream: choosing an entrance must not alter card rewards.
      const pick=HexRandom.create(state.seed+'|waveboss|'+state.wave);
      const source=sources[Math.floor(pick()*sources.length)],points=HexRunRuntime.nextSourcePoints(state,random,source),start=points[0];
      state.enemies.push({id:state.nextEnemyId++,...waveBoss,...HexBiomes.guardian(state,source.tile),...(source.villageId===undefined?{}:{villageId:source.villageId}),landmarkId:'wave:'+state.wave,points,index:0,t:0,maxHp:waveBoss.hp,maxArmorHp:waveBoss.armorHp||0,maxMagicHp:waveBoss.magicHp||0,alive:true,x:start.x,y:start.y});
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
      const profile=HexExploration.bossProfile(state.wave);if(state.challengeDay&&(!state.challengeKind||state.challengeKind==='caravan'))profile.speed*=.85;const start=points[0];landmark.status='fighting';
      state.enemies.push({id:state.nextEnemyId++,...profile,...HexBiomes.guardian(state,landmark),landmarkId:id,points,index:0,t:0,maxHp:profile.hp,maxArmorHp:profile.armorHp||0,maxMagicHp:profile.magicHp||0,alive:true,x:start.x,y:start.y});count++;
    }
    return count;
  }


  function finish(state){
    if(state.hp<=0||state.wave<1||state.pendingSpawns>0||state.enemies.some(e=>e.alive)||state.lastCompletedWave===state.wave)return null;
    state.lastCompletedWave=state.wave;state.waveRunning=false;HexRunRuntime.advanceIntroduction(state);
    if(typeof HexAugmentCards!=='undefined'&&HexAugmentCards.value(state,'house')&&HexAugmentCards.hasBuilding(state,'house')){const gold=HexAugmentCards.value(state,'house')+(HexAugmentCards.level(state,'house')===4?1:0);state.gold+=gold;state.goldEarned.income+=gold;}
    if(state.augmentEchoes)state.augmentEchoes=[];
    HexWaves.settleGreed(state);
    HexCombat.clearConsumables(state);
    if(!['garrison','detour','towerDraft'].includes(state.challengeKind))state.gold+=HexWaves.economy.completion+state.income;state.projectiles=[];state.mines=[];
    for(const tile of state.map.values())for(const tower of tile.towers||[])if(tower)tower.souls=[];
    if(!['garrison','detour','towerDraft'].includes(state.challengeKind)){state.goldEarned.completion+=HexWaves.economy.completion;state.goldEarned.income+=state.income;}state.phase='place';
    if(['detour','villages','powerGrid','expedition','towerDraft','movingFortress'].includes(state.challengeKind))state.bossRewards=[];
    if(state.challengeKind==='expedition'&&HexExpedition.complete(state)&&!state.challengeWon){state.challengeTarget=state.wave;state.challengeWon=true;state.phase='victory';return {victory:true};}
    if(state.challengeKind==='expedition'&&state.wave===12&&!HexExpedition.complete(state)){state.expedition.failed=true;state.phase='gameover';return {victory:false,objectiveFailed:true};}
    if(state.challengeKind==='greed'){state.greedScore=HexWaves.greedGold(state);if(state.wave===35&&state.greedGold35===undefined)state.greedGold35=state.greedScore;}
    if(state.challengeDay&&state.wave===(state.challengeTarget||20)&&!state.challengeWon){state.challengeWon=true;state.phase='victory';return {victory:true};}
    return {victory:false};
  }
  return {shuffle,drawHand,start,finish};
})();
