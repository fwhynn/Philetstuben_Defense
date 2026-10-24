/* Objective-based daily exploration with a repeatable road kit, not random draws. */
const HexExpedition=(()=>{
  const cards=['straight','smallCurve','bigCurve','tJunction','tee'];
  function initialize(state){
    Object.assign(state,{gold:100,income:0,difficulty:'normal',openingRemaining:0,baseExits:[0],phase:'place',deck:[...cards],drawPile:[],discard:[],hand:[],landmarks:new Map()});
    state.map=new Map([['0,0',{q:0,r:0,type:'base',roads:[0],slots:0,towers:[],buildingSlots:0,buildings:[],income:0}]]);
    state.landmarks.fixed=true;state.expedition={preparedWave:-1,remaining:0,collected:[],failed:false,rulesVersion:2};
    const random=HexRandom.create(state.seed+'|relic-regions');const distance=()=>6+Math.floor(random()*3);
    for(const [id,name,q,r,rotation]of [['east','Relikt Ost',distance(),0,0],['north','Relikt Nord',1,-distance(),2],['south','Relikt Süd',2,distance(),2]]){
      const type=random()<.5?'straight':'tJunction';
      state.landmarks.set(HexMap.key(q,r),{q,r,type:'shrine',relicId:id,relicName:name,claimed:false,prefab:{type,roads:HexMap.rotatedRoads(HexData.CARD_LIBRARY[type],rotation),rotation,slots:HexData.CARD_LIBRARY[type].slots}});
    }
    [...state.landmarks.values()][0].relicLocated=true;
    state.vision=HexExploration.expand(state.landmarks,state.map);
  }
  const planning=s=>s.challengeKind==='expedition'&&s.hp>0&&!s.waveRunning&&!s.celebrationActive&&['place','build'].includes(s.phase);
  function sync(state){state.hand=state.phase==='place'&&state.expedition.remaining>0?[...cards]:[];state.drawPile=[];state.discard=[];state.selectedCard=null;state.rotation=0;state.hoveredPlacement=null;}
  function prepare(state){const e=state.expedition;if(e.preparedWave!==state.wave){e.preparedWave=state.wave;e.remaining=2;}state.phase=e.remaining>0?'place':'build';sync(state);return 'ready';}
  function canPlace(state,q,r,card,rotation){return planning(state)&&state.phase==='place'&&state.expedition.remaining>0&&cards.includes(card?.id)&&!state.landmarks.has(HexMap.key(q,r))&&HexMap.canPlace(state.map,q,r,card,rotation,state.landmarks);}
  function place(state,{q,r,index,rotation}){
    const id=state.hand[index],card=HexData.CARD_LIBRARY[id];if(!Number.isInteger(q)||!Number.isInteger(r)||!Number.isInteger(rotation)||rotation<0||rotation>5||!canPlace(state,q,r,card,rotation))return null;
    const before=new Map([...state.landmarks.values()].map(l=>[l.relicId,{visible:HexExploration.visibility(state.map,l)!=='hidden',claimed:l.claimed}]));
    state.map.set(HexMap.key(q,r),{q,r,type:id,rotation,roads:HexMap.rotatedRoads(card,rotation),slots:card.slots||0,towers:Array(card.slots||0).fill(null),buildingSlots:0,buildings:[],income:0});
    const connected=HexExploration.attach(state);if(state.expedition.collected.length){const next=[...state.landmarks.values()].find(l=>!l.claimed);if(next)next.relicLocated=true;}
    const relicEvents=[...state.landmarks.values()].flatMap(l=>l.claimed&&!before.get(l.relicId).claimed?[{kind:'claimed',q:l.q,r:l.r,name:l.relicName}]:!l.claimed&&!before.get(l.relicId).visible&&HexExploration.visibility(state.map,l)!=='hidden'?[{kind:'revealed',q:l.q,r:l.r,name:l.relicName}]:[]);
    state.vision=HexExploration.expand(state.landmarks,state.map);HexBuildings.refresh(state);
    state.expedition.remaining--;state.phase=state.expedition.remaining?'place':'build';sync(state);return {opening:false,connected,treasure:0,relicEvents};
  }
  function collect(state,landmark,tile){
    if(state.challengeKind!=='expedition'||landmark.claimed||state.wave>=12||state.waveRunning||!planning(state)||!HexMap.routeGraph(state.map).distances.has(HexMap.key(tile.q,tile.r)))return 0;
    landmark.claimed=true;tile.site='relic';tile.relicName=landmark.relicName;state.expedition.collected.push(landmark.relicId);state.gold+=25;state.goldEarned.relics=(state.goldEarned.relics||0)+25;return 25;
  }
  function complete(state){return [...state.landmarks.values()].filter(l=>l.relicId).length===3&&[...state.landmarks.values()].filter(l=>l.relicId).every(l=>l.claimed&&state.expedition.collected.includes(l.relicId)&&HexMap.routeGraph(state.map).distances.has(HexMap.key(l.q,l.r)));}
  function finishPlanning(state){if(!planning(state)||!HexRunRuntime.spawnSources(state).length)return false;state.phase='build';sync(state);return true;}
  function resumePlanning(state){if(!planning(state)||!state.expedition.remaining)return false;state.phase='place';sync(state);return true;}
  return {cards,initialize,planning,sync,prepare,canPlace,place,collect,complete,finishPlanning,resumePlanning};
})();
