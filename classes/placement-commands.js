/* Authoritative placement mutation; UI chooses an index and rotation only. */
const HexPlacementCommands=(()=>{
  const card=(state,id)=>id==='rescue'?state.rescueCard:HexData.CARD_LIBRARY[id];
  function canPlace(state,q,r,definition,rotation){
    if(!definition||!Number.isInteger(q)||!Number.isInteger(r)||!Number.isInteger(rotation)||rotation<0||rotation>5)return false;
    if(definition.rescue)definition={...definition,minExits:state.difficulty==='dual'?2:1};
    if(state.openingRemaining){const remaining=[...state.hand],index=remaining.indexOf(definition.id);if(index>=0)remaining.splice(index,1);return HexMap.canPlaceOpening(state.map,q,r,definition,rotation,remaining.map(id=>card(state,id)),state.baseExits);}
    if(state.landmarks.get(HexMap.key(q,r))?.prefab)return false;
    return HexMap.canPlace(state.map,q,r,definition,rotation,state.landmarks);
  }
  function failureMessage(state,definition){
    if(state.openingRemaining)return 'Erweitere einen freien Base-Ausgang. Straßen müssen passen; der zweite Ausgang muss mit der übrigen Hand bebaubar bleiben.';
    if(definition?.rescue&&state.difficulty==='dual')return 'Rettungshex: Straßen müssen passen. Zwei Straßenenden des neuen Hexes müssen nach außen ins freie Gelände führen. Anschlüsse an vorhandene Hexe zählen nicht als offene Ausgänge.';
    if(definition?.rescue)return 'Rettungshex: Straßen müssen passen. Genau ein Straßenende des neuen Hexes muss nach außen ins freie Gelände führen.';
    return 'Nicht erlaubt: Straßen müssen passen und mindestens eine Straße muss zum äußeren freien Raum führen.';
  }
  function place(state,{q,r,index,rotation}){
    if(state.phase!=='place'||state.waveRunning||state.celebrationActive||state.hp<=0||!Number.isInteger(index)||index<0||index>=state.hand.length)return null;
    const id=state.hand[index],definition=card(state,id);if(!canPlace(state,q,r,definition,rotation))return null;
    const tile={q,r,type:id,rotation,roads:HexMap.rotatedRoads(definition,rotation),slots:definition.slots||0,buildingSlots:definition.buildingSlots||0,buildings:Array(definition.buildingSlots||0).fill(null),towers:Array(definition.slots||0).fill(null),income:definition.income||0};
    state.map.set(HexMap.key(q,r),tile);
    const connected=HexExploration.attach(state);state.vision=HexExploration.expand(state.landmarks,state.map);state.income+=tile.income;HexBuildings.refresh(state);
    if(state.openingRemaining){state.openingRemaining--;state.discard.push(id);state.hand.splice(index,1);if(state.openingRemaining)return {opening:true,connected,treasure:0};}
    state.discard.push(...state.hand.filter(id=>!card(state,id)?.rescue));state.hand=[];state.phase='build';
    return {opening:false,connected,treasure:HexExploration.claim(state,q,r)};
  }
  return {card,canPlace,place,failureMessage};
})();
