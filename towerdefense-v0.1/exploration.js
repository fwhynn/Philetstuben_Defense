const HexExploration=(()=>{
  const clearRadius=2,fogRadius=6,treasureGold=20;
  const distance=(a,b)=>Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r),Math.abs(a.q+a.r-b.q-b.r));
  function create(random){
    const landmarks=new Map();
    landmarks.seed=Math.floor(random()*4294967296);landmarks.surveyed=new Set();
    expand(landmarks,new Map([['0,0',{q:0,r:0}]]));
    return landmarks;
  }
  function hash(seed,q,r){let h=seed^Math.imul(q,374761393)^Math.imul(r,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
  function region(map){
    const cells=new Map();
    for(const tile of map.values()) for(let q=-fogRadius;q<=fogRadius;q++) for(let r=Math.max(-fogRadius,-q-fogRadius);r<=Math.min(fogRadius,-q+fogRadius);r++){
      const position={q:tile.q+q,r:tile.r+r},id=position.q+','+position.r,clear=distance({q,r},{q:0,r:0})<=clearRadius;
      if(!cells.has(id)||clear) cells.set(id,{...position,visibility:clear?'clear':'fog'});
    }
    return cells;
  }
  function expand(landmarks,map){
    const cells=region(map);landmarks.surveyed??=new Set();
    for(const [id,cell] of cells){
      if(landmarks.surveyed.has(id)) continue;landmarks.surveyed.add(id);
      const baseDistance=distance(cell,{q:0,r:0});if(baseDistance<3||map.has(id)||landmarks.has(id)) continue;
      const roll=hash(landmarks.seed||0,cell.q,cell.r);
      if(roll<.045){const kind=hash((landmarks.seed||0)^1234567,cell.q,cell.r),type=kind<.55?'treasure':kind<.85?'shrine':'boss';if(type==='boss'&&baseDistance<=4)continue;landmarks.set(id,{q:cell.q,r:cell.r,type,claimed:false,prefab:prefab(landmarks.seed||0,cell,type)});}
    }
    return cells;
  }
  function bossProfile(wave){const hp=240+wave*36;return {type:'boss',name:'Wächter',hp,armorHp:Math.round(hp*.25),magicHp:Math.round(hp*.2),speed:24,baseDamage:5,killGold:50};}
  function prefab(seed,position,type){
    const shapes=[['straight',[0,3]],['smallCurve',[0,1]],['bigCurve',[0,2]],['tee',[0,2,4]],['tJunction',[0,2,3]]];
    const rotation=Math.floor(hash(seed^97531,position.q,position.r)*6),shape=shapes[Math.floor(hash(seed^86420,position.q,position.r)*shapes.length)];
    return {type:type==='boss'?'fullCross':shape[0],roads:type==='boss'?[0,1,2,3,4,5]:shape[1].map(d=>(d+rotation)%6),rotation:type==='boss'?0:rotation,slots:type==='boss'?0:1};
  }
  function attach(state){
    const result={gold:0,count:0,bosses:0};let changed=true;
    while(changed){changed=false;
      for(const landmark of state.landmarks.values()){
        if(landmark.claimed||!landmark.prefab) continue;const p=landmark.prefab,id=landmark.q+','+landmark.r;
        if(!HexMap.canPlace(state.map,landmark.q,landmark.r,{id:p.type,roads:p.roads},0,state.landmarks)) continue;
        state.map.set(id,{q:landmark.q,r:landmark.r,...p,buildingSlots:0,buildings:[],towers:Array(p.slots).fill(null),income:0});
        result.gold+=claim(state,landmark.q,landmark.r);result.count++;if(landmark.type==='boss') result.bosses++;changed=true;
      }
    }
    return result;
  }
  function shrineEffect(landmarks,id){
    const landmark=landmarks.get(id);if(landmark.shrineEffect) return landmark.shrineEffect;
    const roll=hash((landmarks.seed||0)^987654321,landmark.q,landmark.r);
    return roll<.3?'remove':roll<.6?'card':roll<.9?'epic':'legendary';
  }
  function bossRewardRarity(seed,id){const landmark=id.startsWith('wave:')?[-Number(id.slice(5)),0]:id.split(',').map(Number);let value=0;for(const char of String(seed)) value=Math.imul(value,31)+char.charCodeAt(0)|0;return hash(value^246813579,landmark[0],landmark[1])<.1?'Legendary':'Epic';}
  function visibility(map,position){
    let nearest=Infinity;for(const tile of map.values()) nearest=Math.min(nearest,distance(tile,position));
    return nearest<=clearRadius?'clear':nearest<=fogRadius?'fog':'hidden';
  }
  function claim(state,q,r){
    const id=q+','+r,landmark=state.landmarks?.get(id);
    if(!landmark||landmark.claimed||!state.map.has(id)) return 0;
    const tile=state.map.get(id);
    if(!(tile.roads||[]).some(d=>{const n=HexMap.neighbor(q,r,d),other=state.map.get(HexMap.key(n.q,n.r));return other&&(other.roads||[]).includes(HexMap.OPP(d));})) return 0;
    landmark.claimed=true;
    if(landmark.type==='shrine'){if(state.pendingShrine)(state.shrineQueue??=[]).push(id);else state.pendingShrine=id;return 0;}
    if(landmark.type==='boss'){landmark.status='ready';return 0;}
    state.gold+=treasureGold;state.goldEarned.treasure=(state.goldEarned.treasure||0)+treasureGold;return treasureGold;
  }
  return {clearRadius,fogRadius,treasureGold,distance,create,region,expand,visibility,claim,bossProfile,shrineEffect,bossRewardRarity,prefab,attach};
})();
