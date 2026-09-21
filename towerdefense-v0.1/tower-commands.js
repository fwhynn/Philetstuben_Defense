/* Shared local/server tower commands. Targets and prices are validated before mutation. */
const HexTowerCommands=(()=>{
  const TOWERS=HexData.TOWERS,key=HexMap.key;
  function validSlot(slot){return slot&&Number.isInteger(slot.q)&&Number.isInteger(slot.r)&&Number.isInteger(slot.index)&&slot.index>=0;}
  function buy(state,type,selectedSlots){
    if(!['build','wave'].includes(state.phase)||state.hp<=0||!Object.hasOwn(TOWERS,type)||!state.towerLoadout.includes(type)||!Array.isArray(selectedSlots)||!selectedSlots.length)return {ok:false,reason:'invalid'};
    const seen=new Set();
    for(const s of selectedSlots){if(!validSlot(s))return {ok:false,reason:'invalid'};const tile=state.map.get(key(s.q,s.r)),id=s.q+','+s.r+':'+s.index;if(!tile||s.index>=tile.slots||tile.towers[s.index]||seen.has(id))return {ok:false,reason:'invalid'};seen.add(id);}
    const tdef=TOWERS[type],total=selectedSlots.reduce((sum,slot)=>sum+HexBuildings.cost(state,slot,tdef.cost),0);
    if(state.gold<total)return {ok:false,reason:'gold'};
    for(const selected of selectedSlots){
    const tile=state.map.get(key(selected.q,selected.r)),price=HexBuildings.cost(state,selected,tdef.cost);
    tile.towers[selected.index]={type,biome:HexBiomes.forTile(state,tile),rangeFactor:state.challengeDay?.85:1,tileType:tile.type,level:1,lastShot:-Infinity,targetPriority:type==='ballista'?['boss','closestBase','mostHealth']:['closestBase','mostHealth','boss'],builtOnWave:state.phase==='build'?state.wave:null,paid:price};
    const built=tile.towers[selected.index];built.statId=++state.nextTowerStatId;state.runTowerDetails[built.statId]={type,q:tile.q,r:tile.r,index:selected.index,damage:0,buildGold:0,upgradeGold:0,refundGold:0};HexData.recordTowerStat(state,built,'buildGold',price);
    const usage=state.runTowerStats[type]||{builds:0,upgrades:0};usage.builds++;state.runTowerStats[type]=usage;
    state.gold-=price;}HexBuildings.refresh(state);
    return {ok:true,total};
  }
  function upgrade(state,selected,branch){
    if(!['build','wave'].includes(state.phase)||state.hp<=0||!validSlot(selected))return false;
    const tower=state.map.get(key(selected.q,selected.r))?.towers?.[selected.index];if(!tower||tower.guestOwner!==undefined)return false;
    const ultimateId='ultimate:'+tower.type,isUltimate=branch===ultimateId,upgrade=isUltimate?HexData.ULTIMATES[tower.type]:HexData.UPGRADES[branch];
    const allowed=isUltimate?tower.finalUpgrade&&!tower.ultimate&&state.ultimateUnlocks.includes(ultimateId):HexData.availableUpgrades(tower).some(([id])=>id===branch),price=upgrade?HexBuildings.cost(state,selected,upgrade.cost):Infinity;
    if(!allowed||state.gold<price)return false;
    if(isUltimate){tower.ultimate=tower.type;tower.level=4;}else if(upgrade.requires){tower.finalUpgrade=branch;tower.level=3;}else{tower.branch=branch;tower.level=2;}
    tower.paid+=price;state.gold-=price;HexData.recordTowerStat(state,tower,'upgradeGold',price);
    const usage=state.runTowerStats[tower.type]||{builds:0,upgrades:0};usage.upgrades++;state.runTowerStats[tower.type]=usage;

    return true;
  }
  return {buy,upgrade};
})();
