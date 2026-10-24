/* Optional run rewards; never unlock profile content or inflate sale refunds. */
const HexRewards=(()=>{
  const augments=Object.freeze({
    wayfinder:{label:'Wegweiser',desc:'Einmal je Welle die gesamte Kartenhand kostenlos neu ziehen.'},
    scout:{label:'Späher',desc:'Deckt unbekannte Inseln ein Hex früher auf. Keine zusätzliche Turmreichweite.'},
    seal:{label:'Schutzsiegel',desc:'Verhindert den ersten Punkt Basisschaden jeder Welle.'},
    refinement:{label:'Veredelung',desc:'Ersetzt eine Deckkarte durch eine passende Karte der nächsthöheren Seltenheit.'},
    freeHex:{label:'Freies Zusatzhex',desc:'Der nächste Zusatzhex-Kauf ab Welle 35 ist kostenlos.'},
    fourthCard:{label:'Mehr Auswahl',desc:'Ziehe vier statt drei Karten je Welle. Die Anzahl platzierbarer Hexe bleibt gleich.'},
    freeTowers:{label:'Bautrupp',desc:'Die nächsten drei neuen Türme sind kostenlos. Keine kostenlosen Upgrades oder Verkaufserlöse.'}
  });
  function refinement(state){
    const rarities=['Common','Uncommon','Rare','Epic','Legendary'],library=HexDeck.forLoadout(HexData.CARD_LIBRARY,state.towerLoadout);
    const shape=card=>Array.from({length:6},(_,r)=>card.roads.map(d=>(d+r)%6).sort().join(',')).sort()[0];
    for(const from of [...new Set(state.deck)].sort((a,b)=>rarities.indexOf(library[b]?.rarity)-rarities.indexOf(library[a]?.rarity))){
      const card=library[from];if(!card||card.rescue)continue;
      const to=Object.keys(library).find(id=>!library[id].rescue&&library[id].rarity===rarities[rarities.indexOf(card.rarity)+1]&&shape(library[id])===shape(card)&&(library[id].slots||0)>=(card.slots||0)&&(library[id].buildingSlots||0)>=(card.buildingSlots||0));
      if(to)return {from,to};
    }
    return null;
  }
  function augmentChoices(state,random){
    const pair=refinement(state),pool=Object.keys(augments).filter(id=>!state.augments?.includes(id)&&(id!=='refinement'||pair));
    return HexRunFlow.shuffle(pool,random).slice(0,3).map(id=>({kind:'augment',augment:id,...augments[id],...(id==='refinement'?{pair,desc:HexData.CARD_LIBRARY[pair.from].name+' → '+HexData.CARD_LIBRARY[pair.to].name+' · '+HexData.CARD_LIBRARY[pair.to].rarity}: {})}));
  }
  function applyAugment(state,choice){
    const id=choice.augment;if(!Object.hasOwn(augments,id)||state.augments?.includes(id))return false;
    if(id==='refinement'){
      const pair=refinement(state);if(!pair||pair.from!==choice.pair?.from||pair.to!==choice.pair?.to)return false;
      HexDeck.recoverMissing(state);const pile=[state.discard,state.drawPile,state.hand].find(p=>p.includes(pair.from));if(!pile)return false;
      pile[pile.indexOf(pair.from)]=pair.to;state.deck[state.deck.indexOf(pair.from)]=pair.to;
    }
    (state.augments??=[]).push(id);
    if(id==='scout')state.map.revealBonus=1;
    if(id==='freeHex')state.freeExtraHexes=(state.freeExtraHexes||0)+1;
    if(id==='freeTowers')state.freeTowerBuilds=(state.freeTowerBuilds||0)+3;
    return true;
  }
  function canRedraw(state){return state.augments?.includes('wayfinder')&&state.phase==='place'&&!state.waveRunning&&!state.openingRemaining&&!state.celebrationActive&&state.hp>0&&state.redrawWave!==state.wave&&!state.hand.includes('rescue');}
  function redraw(state,random){if(!canRedraw(state))return false;state.redrawWave=state.wave;state.drawResult=HexRunFlow.drawHand(state,random);return true;}
  const merchantOffers=Object.freeze({repair:{label:'Feldversorgung',desc:'Sofort bis zu 2 Basisleben wiederherstellen.',base:60},protection:{label:'Schutzvorrat',desc:'In der nächsten Welle insgesamt 2 Basisschaden verhindern.',base:80}});
  function merchantCounts(state,site){const purchases=state.merchantPurchases||{};const first=[...state.map.values()].find(t=>t.site==='merchant');return purchases[site]||(first&&site===first.q+','+first.r?purchases:{});}
  function merchantPrice(state,id,site){return merchantOffers[id]?merchantOffers[id].base*2**(merchantCounts(state,site)[id]||0):Infinity;}
  function canTrade(state,site,id){return !!merchantOffers[id]&&['place','build'].includes(state.phase)&&!state.waveRunning&&!state.celebrationActive&&state.hp>0&&state.map.get(site)?.site==='merchant'&&state.gold>=merchantPrice(state,id,site)&&(id==='repair'?state.hp<state.maxHp:state.merchantProtectionWave!==state.wave+1);}
  function trade(state,site,id){
    if(!canTrade(state,site,id))return false;state.gold-=merchantPrice(state,id,site);state.merchantPurchases??={};
    const purchases=state.merchantPurchases,first=[...state.map.values()].find(t=>t.site==='merchant');
    if(first&&(typeof purchases.repair==='number'||typeof purchases.protection==='number')){purchases[first.q+','+first.r]??={repair:purchases.repair||0,protection:purchases.protection||0};delete purchases.repair;delete purchases.protection;}
    purchases[site]??={};purchases[site][id]=(purchases[site][id]||0)+1;
    if(id==='repair')state.hp=Math.min(state.maxHp,state.hp+2);else{state.merchantProtectionWave=state.wave+1;state.merchantProtection=2;}return true;
  }
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
      if(effect==='augment'){skippable=false;choices=augmentChoices(state,HexRandom.create(state.seed+'|augment|'+context));if(!choices.length)choices=[{kind:'blessing',blessing:'supplies',label:'Vorräte',desc:'Keine weiteren passenden Augments verfügbar: +30 Gold.'}];}
      else if(effect==='aura'){skippable=false;choices=[{kind:'site',effect:'damage',label:'Schrein · +10 % Schaden',desc:'Dauerhaft auf diesem Hex und seinen Nachbarhexen. Gleiche Boni stapeln nicht.'},{kind:'site',effect:'range',label:'Schrein · +15 % Reichweite',desc:'Dauerhaft auf diesem Hex und seinen Nachbarhexen. Gleiche Boni stapeln nicht.'}];}
      else if(effect==='repair'||effect==='upgrade'){
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
      if(choice.kind==='augment'){if(!applyAugment(state,choice))return false;}
      else if(choice.kind==='site'){if(!HexExploration.activateShrine(state,offer.context,choice.effect))return false;}
      else if(choice.kind==='card'){HexDeck.addReward(state,choice.cardId);}
      else if(choice.kind==='remove'){if(!HexDeck.remove(state,choice.cardId))return false;}
      else if(choice.kind==='upgrade'){if(!upgrade(state,choice.choice))return false;}
      else if(choice.kind==='blessing'){if(!blessing(state,choice.blessing))return false;}
      else return false;
    }
    state.rewardOffer=null;return true;
  }
  return {augments,augmentChoices,refinement,applyAugment,canRedraw,redraw,merchantOffers,merchantPrice,canTrade,trade,offer,choose,upgradeChoices,upgrade,blessing};
})();
