const HexDeck=(()=>{
  const rarityWeights={Common:55,Uncommon:30,Rare:12,Epic:3,Legendary:1};
  // The run loadout is validated against profile unlocks (or explicitly granted by its challenge).
  function forLoadout(library,loadout=[]){return Object.fromEntries(Object.entries(library).filter(([,card])=>!card.requiredTower||loadout.includes(card.requiredTower)));}
  function rewards(library,random,count=3){
    const remaining=Object.keys(library).filter(id=>!library[id].rescue),picks=[];
    while(picks.length<count&&remaining.length){
      const rarities=[...new Set(remaining.map(id=>library[id].rarity))];
      let roll=random()*rarities.reduce((sum,r)=>sum+(rarityWeights[r]||1),0);
      let rarity=rarities.at(-1);
      for(const r of rarities){roll-=rarityWeights[r]||1;if(roll<0){rarity=r;break;}}
      const pool=remaining.filter(id=>library[id].rarity===rarity),id=pool[Math.floor(random()*pool.length)];
      picks.push(id);remaining.splice(remaining.indexOf(id),1);
    }
    return picks;
  }
  function remove(state,id){
    if(state.deck.length<=5) return false;
    const deckIndex=state.deck.indexOf(id);if(deckIndex<0) return false;
    const pile=[state.discard,state.drawPile,state.hand].find(cards=>cards.includes(id));if(!pile) return false;
    pile.splice(pile.indexOf(id),1);state.deck.splice(deckIndex,1);return true;
  }
  return {rarityWeights,rewards,remove,forLoadout};
})();
