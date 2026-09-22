const HexBuildings=(()=>{
  const definitions={house:{radius:0,color:'#f1d477',name:'Haus',cost:30,income:3,icon:'H',desc:'+3 Gold nach jeder überlebten Wave, zusätzlich zum automatischen Hex-Einkommen.'},forge:{radius:1,color:'#ffad66',damage:1.2,name:'Schmiede',cost:40,icon:'S',desc:'+20 % Tower-Schaden auf diesem und direkt benachbarten Hexen. Nicht stapelbar.'},market:{radius:1,color:'#6ddac9',discount:.85,name:'Markt',cost:35,icon:'M',desc:'15 % Rabatt auf Towerbau und Upgrades auf diesem und direkt benachbarten Hexen. Nicht stapelbar, keine Gebäuderabatte.'}};
  definitions.portal={radius:0,color:'#c991ff',name:'Gegnerportal',cost:250,icon:'◉',desc:'Ein zusätzlicher Gegnereingang. Die feste Gegnerzahl wird auf alle Eingänge verteilt. Bau und Verkauf nur zwischen Wellen.'};
  const allowedTypes=tile=>tile?.type==='deadEnd'?['portal']:['house','forge','market'];
  const upgrades={house:[{cost:40,income:5},{cost:65,income:8}],forge:[{cost:45,damage:1.25},{cost:70,damage:1.3}],market:[{cost:45,discount:.8},{cost:70,discount:.75}]};
  const specials={house:{name:'Patrizierhaus',cost:120,desc:'+16 Gold je Wave statt +8.'},forge:{name:'Fernschmiede',cost:90,desc:'Zusätzlich ein frei wählbares gelegtes Hex mit +30 % Schaden versorgen.'},market:{name:'Handelsnetz',cost:90,desc:'Zusätzlich ein frei wählbares gelegtes Hex mit 25 % Rabatt versorgen.'}};
  function definition(building){if(!building||!definitions[building.type])return null;if(building.type==='portal')return {...definitions.portal};const def={...definitions[building.type],...(upgrades[building.type][Math.min(3,building.level||1)-2]||{})};if(building.type==='house'&&building.special)def.income=16;def.desc=building.type==='house'?'+'+def.income+' Gold je Wave.':building.type==='forge'?'+'+Math.round((def.damage-1)*100)+' % Turmschaden auf diesem und benachbarten Hexen. Nicht stapelbar.':Math.round((1-def.discount)*100)+' % Rabatt auf Turmbau und Upgrades auf diesem und benachbarten Hexen. Nicht stapelbar.';return def;}
  function applies(source,target,building,def=definition(building)){if(!def)return false;const dq=source.q-target.q,dr=source.r-target.r;return Math.max(Math.abs(dq),Math.abs(dr),Math.abs(dq+dr))<=def.radius||(building.special&&building.target===target.q+','+target.r);}
  function nextUpgrade(state,building){if(!building||!upgrades[building.type])return null;const level=building.level||1;if(level<3)return upgrades[building.type][level-1];if(!building.special&&state.buildingUnlocks?.includes('building:'+building.type))return specials[building.type];return null;}
  function upgrade(state,slot){const tile=slot&&state.map.get(slot.q+','+slot.r),b=tile?.buildings?.[slot.index],next=nextUpgrade(state,b);if(!next||state.hp<=0||!['build','wave'].includes(state.phase)||state.gold<next.cost)return false;const before=definition(b);if((b.level||1)<3)b.level=(b.level||1)+1;else b.special=true;b.paid+=next.cost;state.gold-=next.cost;state.income+=(definition(b).income||0)-(before.income||0);state.buildingVersion=(state.buildingVersion||0)+1;refresh(state);return true;}
  function canTarget(state,slot,target){const source=slot&&state.map.get(slot.q+','+slot.r),b=source?.buildings?.[slot.index],tile=state.map.get(target);if(!b?.special||b.type==='house'||!tile)return false;if(b.type==='forge')for(const t of state.map.values())for(const other of t.buildings||[])if(other?.type==='forge'&&applies(t,tile,other))return false;return true;}
  function setTarget(state,slot,target){const source=slot&&state.map.get(slot.q+','+slot.r),b=source?.buildings?.[slot.index];if(!canTarget(state,slot,target)||state.hp<=0||!['build','wave'].includes(state.phase))return false;b.target=target;state.buildingVersion=(state.buildingVersion||0)+1;refresh(state);return true;}
  function effects(map,target){
    let damage=1,discount=1;if(!target) return {damage,discount};
    for(const tile of map.values()){
      const dq=tile.q-target.q,dr=tile.r-target.r;
      const distance=Math.max(Math.abs(dq),Math.abs(dr),Math.abs(dq+dr));
      for(const building of tile.buildings||[]){const def=definition(building);if(!def||!(distance<=def.radius||building.special&&building.target===target.q+','+target.r))continue;damage=Math.max(damage,def.damage||1);discount=Math.min(discount,def.discount||1);}
    }
    return {damage,discount};
  }
  function currentTarget(state,building){return building?.special&&building.target&&state.map.has(building.target)?{currentTiles:[state.map.get(building.target)],currentColor:building.type==='forge'?'#ff6b1a':'#00e7c0'}:{currentTiles:[]};}
  function highlight(state){
    if(state.buildingTarget){const slot=state.buildingTarget,b=state.map.get(slot.q+','+slot.r)?.buildings?.[slot.index];if(b?.special&&b.type!=='house')return {tiles:[...state.map.values()].filter(t=>canTarget(state,slot,t.q+','+t.r)),color:definitions[b.type].color,...currentTarget(state,b)};}
    const preview=state.previewBuilding,selected=state.selectedBuilding,validPreview=preview&&selected&&preview.q===selected.q&&preview.r===selected.r&&preview.index===selected.index&&!state.map.get(preview.q+','+preview.r)?.buildings?.[preview.index];
    const slot=validPreview?preview:state.hoverBuilding||selected,source=slot&&state.map.get(slot.q+','+slot.r),building=validPreview?{type:preview.type,level:1}:source?.buildings?.[slot.index],def=definition(building);
    if(!def)return {tiles:[],color:null};
    const tiles=[...state.map.values()].filter(tile=>applies(source,tile,building,def));
    const covered=new Map();if(building.type!=='house')for(const t of state.map.values())for(const other of t.buildings||[])if(other&&other!==building&&other.type===building.type){const otherDef=definition(other);for(const target of state.map.values())if(applies(t,target,other,otherDef))covered.set(target.q+','+target.r,target);}
    return {...currentTarget(state,building),tiles,color:def.color,otherTiles:[...covered.values()],otherColor:building.type==='forge'?'#b8a5db':'#83a8df'};
  }
  function cost(state,slot,base){return Math.ceil(base*effects(state.map,slot).discount);}
  // Shared by all quick-build prices; recomputed so purchases, sales and remote
  // market targets always take effect immediately.
  function freeSlotDiscount(map){
    const markets=[];
    for(const tile of map.values())for(const building of tile.buildings||[])
      if(building?.type==='market'){const def=definition(building);markets.push({tile,building,def,discount:def.discount});}
    let best=Infinity;
    for(const tile of map.values()){
      let free=false;for(let i=0;i<(tile.slots||0);i++)if(!tile.towers?.[i]){free=true;break;}
      if(!free)continue;
      best=Math.min(best,1);
      for(const market of markets)if(market.discount<best&&applies(market.tile,tile,market.building,market.def))best=market.discount;
    }
    return best;
  }
  function refresh(state){for(const tile of state.map.values()){if(!tile.towers?.some(Boolean))continue;const damage=effects(state.map,tile).damage;for(const tower of tile.towers)if(tower)tower.supportDamage=damage;}}
  function buy(state,slot,type){
    const def=definitions[type],tile=slot?state.map.get(slot.q+','+slot.r):null;
    if(!def||!tile||!allowedTypes(tile).includes(type)||(type==='portal'&&state.phase!=='build')||!['build','wave'].includes(state.phase)||state.hp<=0||state.gold<def.cost||slot.index<0||slot.index>=(tile.buildingSlots||0)) return false;
    tile.buildings??=Array(tile.buildingSlots).fill(null);
    if(tile.buildings[slot.index]) return false;
    tile.buildings[slot.index]={type,level:1,paid:def.cost,builtOnWave:state.phase==='build'?state.wave:null};state.gold-=def.cost;state.income+=def.income||0;state.buildingVersion=(state.buildingVersion||0)+1;refresh(state);return true;
  }
  function refund(state,building){if(building?.type==='portal'&&state.phase!=='build')return null;return HexData.towerRefund(state,building);}
  function sell(state,slot){
    const tile=slot&&state.map.get(slot.q+','+slot.r),building=tile?.buildings?.[slot.index],value=refund(state,building);
    if(!value)return false;
    tile.buildings[slot.index]=null;state.gold+=value.amount;state.income-=definition(building).income||0;
    state.buildingVersion=(state.buildingVersion||0)+1;refresh(state);return true;
  }
  return {allowedTypes,upgrades,specials,definition,nextUpgrade,upgrade,canTarget,setTarget,definitions,highlight,buy,effects,cost,freeSlotDiscount,refresh,refund,sell};
})();
