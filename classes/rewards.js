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
  function offer(state,kind,random){
    const phase={normal:'reward',boss:'bossReward',shrine:'shrineReward',removal:'removal'}[kind];
    if(!phase||state.phase!==phase)throw new Error('Invalid reward phase');
    const context=kind==='boss'?state.bossRewards[0]:kind==='shrine'||kind==='removal'&&state.removalSource==='shrine'?state.pendingShrine:String(state.wave);
    const old=state.rewardOffer;
    if(old&&old.kind===kind&&old.context===context&&old.wave===state.wave)return old;
    let choices=[],skippable=kind!=='normal';
    if(kind==='removal')choices=[...new Set(state.deck)].map(cardId=>({kind:'remove',cardId}));
    else {
      const effect=kind==='shrine'?HexExploration.shrineEffect(state.landmarks,state.pendingShrine):null;
      if(effect==='repair'||effect==='upgrade'){
        skippable=false;
        choices=effect==='upgrade'?upgradeChoices(state).map(choice=>({kind:'upgrade',choice})):[];
        if(!choices.length)choices=[{kind:'blessing',blessing:effect==='repair'?'repair':'supplies'}];
      }else{
        const rarity=kind==='boss'?HexExploration.bossRewardRarity(state.seed,context):({epic:'Epic',legendary:'Legendary'})[effect];
        const library=rarity?Object.fromEntries(Object.entries(HexData.CARD_LIBRARY).filter(([,card])=>card.rarity===rarity)):HexData.CARD_LIBRARY;
        const rng=kind==='boss'?HexRandom.create(state.seed+'|bossloot|'+context):kind==='shrine'?HexRandom.create(state.seed+'|shrine|'+context):random;
        choices=HexDeck.rewards(HexDeck.forLoadout(library,state.towerLoadout),rng).map(cardId=>({kind:'card',cardId}));
        if(kind==='boss')choices.push({kind:'blessing',blessing:'bastion'},{kind:'blessing',blessing:'income'});
      }
    }
    state.nextRewardOfferId=(state.nextRewardOfferId||0)+1;
    return state.rewardOffer={id:state.runId+':reward:'+state.nextRewardOfferId,kind,phase,context,wave:state.wave,skippable,choices};
  }
  function choose(state,offerId,index){
    const offer=state.rewardOffer;
    if(!offer||offer.id!==offerId||offer.phase!==state.phase||offer.wave!==state.wave||state.hp<=0)return false;
    if(offer.kind==='boss'&&offer.context!==state.bossRewards[0])return false;
    if((offer.kind==='shrine'||offer.kind==='removal'&&state.removalSource==='shrine')&&offer.context!==state.pendingShrine)return false;
    if(index===null){if(!offer.skippable)return false;}
    else{
      if(!Number.isInteger(index)||index<0||index>=offer.choices.length)return false;
      const choice=offer.choices[index];
      if(choice.kind==='card'){state.deck.push(choice.cardId);state.discard.push(choice.cardId);}
      else if(choice.kind==='remove'){if(!HexDeck.remove(state,choice.cardId))return false;}
      else if(choice.kind==='upgrade'){if(!upgrade(state,choice.choice))return false;}
      else if(choice.kind==='blessing'){if(!blessing(state,choice.blessing))return false;}
      else return false;
    }
    state.rewardOffer=null;return true;
  }
  return {offer,choose,upgradeChoices,upgrade,blessing};
})();
