/* Shared local/server tower commands. Targets and prices are validated before mutation. */
const HexTowerCommands=(()=>{
  const TOWERS=HexData.TOWERS,key=HexMap.key;
  function validSlot(slot){return slot&&Number.isInteger(slot.q)&&Number.isInteger(slot.r)&&Number.isInteger(slot.index)&&slot.index>=0;}
  function buildPrice(state,slot,base,index=0){if(state.challengeKind==='towerDraft')return 0;return (state.freeTowerBuilds||0)>index?0:Math.max(0,HexBuildings.cost(state,slot,base)-(typeof HexAugmentCards!=='undefined'&&index===(state.freeTowerBuilds||0)?HexAugmentCards.marketDiscount(state):0));}
  function buy(state,type,selectedSlots){
    if(state.challengeKind==='movingFortress'&&!HexMovingFortress.building(state))return {ok:false,reason:'locked'};
    if(state.challengeKind==='towerDraft'&&(!Array.isArray(selectedSlots)||!HexTowerDraft.canBuild(state,type,selectedSlots.length)))return {ok:false,reason:'inventory'};
    if(state.challengeKind==='powerGrid'&&!HexPowerGrid.planning(state))return {ok:false,reason:'powerLocked'};
    if(state.challengeKind==='detour')return {ok:false,reason:'fixed'};
    if(!['place','build','wave'].includes(state.phase)||state.hp<=0||!Object.hasOwn(TOWERS,type)||!state.towerLoadout.includes(type)||!Array.isArray(selectedSlots)||!selectedSlots.length)return {ok:false,reason:'invalid'};
    const seen=new Set();
    for(const s of selectedSlots){if(!validSlot(s))return {ok:false,reason:'invalid'};const tile=state.map.get(key(s.q,s.r)),id=s.q+','+s.r+':'+s.index;if(!tile||s.index>=tile.slots||tile.towers[s.index]||seen.has(id))return {ok:false,reason:'invalid'};seen.add(id);}
    const tdef=TOWERS[type],total=selectedSlots.reduce((sum,slot,index)=>sum+buildPrice(state,slot,tdef.cost,index),0);
    if(state.gold<total)return {ok:false,reason:'gold'};
    for(const selected of selectedSlots){
    const tile=state.map.get(key(selected.q,selected.r)),price=buildPrice(state,selected,tdef.cost);
    tile.towers[selected.index]={type,biome:HexBiomes.forTile(state,tile),rangeFactor:state.challengeDay&&(!state.challengeKind||state.challengeKind==='caravan')?.85:1,tileType:tile.type,level:1,lastShot:-Infinity,targetPriority:HexData.defaultTargetPriority({type}),builtOnWave:['place','build'].includes(state.phase)?state.wave:null,paid:price};
    if(typeof HexAugmentCards!=='undefined'&&!(state.freeTowerBuilds>0)&&HexAugmentCards.marketDiscount(state))state.augmentMarketWave=state.wave;
    const built=tile.towers[selected.index];built.statId=++state.nextTowerStatId;state.runTowerDetails[built.statId]={type,q:tile.q,r:tile.r,index:selected.index,damage:0,kills:0,buildGold:0,upgradeGold:0,refundGold:0};HexData.recordTowerStat(state,built,'buildGold',price);
    const usage=state.runTowerStats[type]||{builds:0,upgrades:0};usage.builds++;state.runTowerStats[type]=usage;
    if(state.freeTowerBuilds>0)state.freeTowerBuilds--;else HexBuildings.recordDiscount(state,selected,tdef.cost,price);state.gold-=price;}HexBuildings.refresh(state);
    if(state.challengeKind==='towerDraft')state.towerDraft.inventory[type]-=selectedSlots.length;
    return {ok:true,total};
  }
  function upgrade(state,selected,branch){
    if(state.challengeKind==='movingFortress'&&!HexMovingFortress.building(state))return false;
    if(state.challengeKind==='towerDraft'&&(!HexTowerDraft.canUpgrade(state)||String(branch).startsWith('ultimate:')))return false;
    if(state.challengeKind==='powerGrid'&&!HexPowerGrid.planning(state))return false;
    if(state.challengeKind==='detour')return false;
    if(!['place','build','wave'].includes(state.phase)||state.hp<=0||!validSlot(selected))return false;
    const tower=state.map.get(key(selected.q,selected.r))?.towers?.[selected.index];if(!tower||tower.guestOwner!==undefined)return false;
    const ultimateId='ultimate:'+tower.type,isUltimate=branch===ultimateId,upgrade=isUltimate?HexData.ultimateDefinition(tower):HexData.UPGRADES[branch];
    const allowed=isUltimate?tower.finalUpgrade&&!tower.ultimate&&HexData.ultimateAvailable(state,tower):HexData.availableUpgrades(tower).some(([id])=>id===branch),price=upgrade?HexBuildings.cost(state,selected,upgrade.cost):Infinity;
    if(!allowed||state.gold<price)return false;
    if(isUltimate){tower.ultimate=tower.type;tower.level=4;}else if(upgrade.requires){tower.finalUpgrade=branch;tower.level=3;}else{tower.branch=branch;tower.level=2;}
    HexBuildings.recordDiscount(state,selected,upgrade.cost,price);tower.paid+=price;state.gold-=price;HexData.recordTowerStat(state,tower,'upgradeGold',price);
    const usage=state.runTowerStats[tower.type]||{builds:0,upgrades:0};usage.upgrades++;
    if(state.challengeKind==='towerDraft')state.towerDraft.upgrades--;state.runTowerStats[tower.type]=usage;

    return true;
  }
  return {buy,upgrade,buildPrice};
})();
