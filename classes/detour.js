/* Finite road-planning mission. All mutations are shared by UI and headless play. */
const HexDetour=(()=>{
  const cards=['straight','smallCurve','bigCurve','longRoad','tee','sideCross'];
  const unlocks={longRoad:3,tee:6,sideCross:9};
  function initialize(state){
    Object.assign(state,{gold:0,income:0,difficulty:'normal',openingRemaining:0,baseExits:[0],landmarks:new Map(),vision:[],deck:[],drawPile:[],discard:[],hand:[],phase:'place',consumablesLocked:true});
    state.map=new Map([['0,0',{q:0,r:0,type:'base',roads:[0],slots:0,towers:[],buildingSlots:0,buildings:[],income:0}]]);
    state.detour={preparedWave:-1,remaining:0,oldUndos:0,stock:{straight:3,smallCurve:3,bigCurve:3},history:[]};
    const towers=[[1,-1,'archer','marksman'],[2,1,'flame','inferno'],[4,-1,'catapult','barrage'],[5,1,'freeze','deepFrost'],[6,-1,'ballista','repeater'],[8,2,'chain','storm'],[10,0,'archer','volley'],[11,3,'catapult','siege'],[13,1,'freeze','frostField'],[14,4,'flame','wildfire']];
    const rng=HexRandom.create(state.seed+'|detour-towers');
    // Preserve an approachable opening; later islands and their defenses vary daily.
    for(let i=5;i<towers.length;i++){towers[i][1]+=Math.floor(rng()*2);const j=5+Math.floor(rng()*5);[towers[i][2],towers[j][2]]=[towers[j][2],towers[i][2]];[towers[i][3],towers[j][3]]=[towers[j][3],towers[i][3]];}
    state.detour.layoutVersion=2;
    state.towerLoadout=towers.map(t=>t[2]);
    for(const [q,r,type,branch] of towers){
      // Derive the final ID from the catalog so a display-name change cannot break a fixed tower.
      const final=Object.keys(HexData.UPGRADES).find(id=>HexData.UPGRADES[id].requires===branch);
      const tw={type,branch,finalUpgrade:final,level:3,paid:0,lastShot:-Infinity,biome:'grass',tileType:'empty',rangeFactor:1,targetPriority:HexData.defaultTargetPriority({type}),statId:++state.nextTowerStatId};
      state.runTowerDetails[tw.statId]={type,q,r,index:0,damage:0,kills:0,buildGold:0,upgradeGold:0,refundGold:0};
      state.map.set(HexMap.key(q,r),{q,r,type:'empty',roads:[],slots:1,towers:[tw],buildingSlots:0,buildings:[],income:0});
    }
  }
  function planning(state){return state.challengeKind==='detour'&&state.detour&&state.hp>0&&!state.waveRunning&&!state.celebrationActive&&['place','build'].includes(state.phase);}
  function sync(state){
    state.deck=cards.flatMap(id=>Array(state.detour.stock[id]||0).fill(id));state.drawPile=[];state.discard=[];
    state.hand=state.phase==='place'&&state.detour.remaining>0?cards.filter(id=>state.detour.stock[id]>0):[];
    state.selectedCard=null;state.rotation=0;state.hoveredPlacement=null;
  }
  function prepare(state){
    const d=state.detour;
    if(d.preparedWave!==state.wave){
      if(state.wave>0)for(const id of cards){if(unlocks[id]!==undefined&&state.wave<unlocks[id])continue;d.stock[id]=(d.stock[id]||0)+1;}
      d.newCards=cards.filter(id=>unlocks[id]===state.wave);
      d.remaining=state.wave===0?6:state.wave<5?2:3;d.oldUndos=0;d.preparedWave=state.wave;
    }
    state.phase=d.remaining>0?'place':'build';sync(state);return 'ready';
  }
  function canPlace(state,q,r,card,rotation){
    return planning(state)&&state.phase==='place'&&state.detour.remaining>0&&cards.includes(card?.id)&&state.detour.stock[card.id]>0&&HexMap.canPlace(state.map,q,r,card,rotation,state.landmarks);
  }
  function place(state,{q,r,index,rotation}){
    if(!Number.isInteger(index)||index<0||index>=state.hand.length)return null;
    const id=state.hand[index],card=HexData.CARD_LIBRARY[id];
    if(!Number.isInteger(q)||!Number.isInteger(r)||!Number.isInteger(rotation)||rotation<0||rotation>5||!canPlace(state,q,r,card,rotation))return null;
    state.map.set(HexMap.key(q,r),{q,r,type:id,rotation,roads:HexMap.rotatedRoads(card,rotation),slots:0,towers:[],buildingSlots:0,buildings:[],income:0});
    state.detour.stock[id]--;state.detour.remaining--;state.detour.history.push({q,r,id,wave:state.wave});
    state.phase=state.detour.remaining>0?'place':'build';sync(state);
    return {opening:false,connected:{gold:0,bosses:0},treasure:0};
  }
  function canUndo(state){const d=state.detour,last=d?.history.at(-1);return !!(planning(state)&&last&&(last.wave===state.wave||d.oldUndos<2));}
  function undo(state){
    if(!canUndo(state))return false;
    const d=state.detour,last=d.history.pop();state.map.delete(HexMap.key(last.q,last.r));d.stock[last.id]++;d.remaining++;
    if(last.wave!==state.wave)d.oldUndos++;state.phase='place';sync(state);return true;
  }
  function ready(state){return !!(planning(state)&&state.detour.history.length>=2&&HexRunRuntime.spawnSources(state).length);}
  function finishPlanning(state){if(!ready(state))return false;state.phase='build';sync(state);return true;}
  function resumePlanning(state){if(!planning(state))return false;state.phase='place';sync(state);return true;}
  return {initialize,prepare,planning,canPlace,place,canUndo,undo,ready,finishPlanning,resumePlanning};
})();
