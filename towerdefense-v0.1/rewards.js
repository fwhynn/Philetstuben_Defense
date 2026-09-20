/* Optional run rewards; never unlock profile content or inflate sale refunds. */
const HexRewards=(()=>{
  function upgradeChoices(state){
    const choices=[];
    for(const tile of state.map.values())(tile.towers||[]).forEach((tower,index)=>{
      if(!tower||!state.towerLoadout.includes(tower.type))return;
      for(const [upgrade,definition] of HexData.availableUpgrades(tower))choices.push({q:tile.q,r:tile.r,index,upgrade,type:tower.type,name:definition.name});
    });
    return choices;
  }
  function upgrade(state,choice){
    if(state.phase!=='shrineReward'||!state.pendingShrine||state.hp<=0)return false;
    const tower=state.map.get(choice.q+','+choice.r)?.towers?.[choice.index];
    if(!tower||tower.type!==choice.type||!state.towerLoadout.includes(tower.type)||!HexData.availableUpgrades(tower).some(([id])=>id===choice.upgrade))return false;
    const definition=HexData.UPGRADES[choice.upgrade];
    if(definition.requires){tower.finalUpgrade=choice.upgrade;tower.level=3;}else{tower.branch=choice.upgrade;tower.level=2;}
    const usage=state.runTowerStats[tower.type]||{builds:0,upgrades:0};usage.upgrades++;state.runTowerStats[tower.type]=usage;
    return true;
  }
  function blessing(state,kind){
    if(state.hp<=0)return false;
    if(kind==='repair'&&state.phase==='shrineReward'){
      if(state.hp<state.maxHp)state.hp=Math.min(state.maxHp,state.hp+5);else supplies(state);
    }else if(kind==='supplies'&&state.phase==='shrineReward')supplies(state);
    else if(kind==='bastion'&&state.phase==='bossReward'){state.maxHp+=5;state.hp+=5;}
    else if(kind==='income'&&state.phase==='bossReward'){state.income+=2;state.rewardIncome=(state.rewardIncome||0)+2;}
    else return false;
    return true;
  }
  function supplies(state){state.gold+=30;state.goldEarned.shrine=(state.goldEarned.shrine||0)+30;}
  return {upgradeChoices,upgrade,blessing};
})();
