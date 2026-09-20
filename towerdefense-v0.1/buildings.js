const HexBuildings=(()=>{
  const definitions={house:{radius:0,color:'#f1d477',name:'Haus',cost:30,income:3,icon:'H',desc:'+3 Gold nach jeder überlebten Wave, zusätzlich zum automatischen Hex-Einkommen.'},forge:{radius:1,color:'#ffad66',damage:1.2,name:'Schmiede',cost:40,icon:'S',desc:'+20 % Tower-Schaden auf diesem und direkt benachbarten Hexen. Nicht stapelbar.'},market:{radius:1,color:'#6ddac9',discount:.85,name:'Markt',cost:35,icon:'M',desc:'15 % Rabatt auf Towerbau und Upgrades auf diesem und direkt benachbarten Hexen. Nicht stapelbar, keine Gebäuderabatte.'}};
  function effects(map,target){
    let damage=1,discount=1;if(!target) return {damage,discount};
    for(const tile of map.values()){
      const dq=tile.q-target.q,dr=tile.r-target.r;
      const distance=Math.max(Math.abs(dq),Math.abs(dr),Math.abs(dq+dr));
      for(const building of tile.buildings||[]){const def=definitions[building?.type];if(!def||distance>def.radius)continue;damage=Math.max(damage,def.damage||1);discount=Math.min(discount,def.discount||1);}
    }
    return {damage,discount};
  }
  function highlight(state){
    const slot=state.hoverBuilding||state.selectedBuilding,source=slot&&state.map.get(slot.q+','+slot.r),building=source?.buildings?.[slot.index],def=definitions[building?.type];
    if(!def)return {tiles:[],color:null};
    const tiles=[...state.map.values()].filter(tile=>{const dq=tile.q-source.q,dr=tile.r-source.r;return Math.max(Math.abs(dq),Math.abs(dr),Math.abs(dq+dr))<=def.radius;});
    return {tiles,color:def.color};
  }
  function cost(state,slot,base){return Math.ceil(base*effects(state.map,slot).discount);}
  function refresh(state){for(const tile of state.map.values()) for(const tower of tile.towers||[]) if(tower) tower.supportDamage=effects(state.map,tile).damage;}
  function buy(state,slot,type){
    const def=definitions[type],tile=slot?state.map.get(slot.q+','+slot.r):null;
    if(!def||!tile||!['build','wave'].includes(state.phase)||state.hp<=0||state.gold<def.cost||slot.index<0||slot.index>=(tile.buildingSlots||0)) return false;
    tile.buildings??=Array(tile.buildingSlots).fill(null);
    if(tile.buildings[slot.index]) return false;
    tile.buildings[slot.index]={type,paid:def.cost};state.gold-=def.cost;state.income+=def.income||0;state.buildingVersion=(state.buildingVersion||0)+1;refresh(state);return true;
  }
  return {definitions,highlight,buy,effects,cost,refresh};
})();
