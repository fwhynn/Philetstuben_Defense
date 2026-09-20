/* Run-specific heroes and base upgrades. No DOM or persistence. */
const HexHeroes=(()=>{
  const definitions={
    standard:{name:'Standardfestung',hp:20,gold:70,income:0,costFactor:1,maxLevel:2,weaponFactor:1,desc:'20 HP · 70 Gold. Ausgewogener Start; zwei Stufen je Base-Ausbau.'},
    builder:{name:'Festungsbauer',hp:20,gold:55,income:0,costFactor:.75,maxLevel:3,weaponFactor:1,desc:'20 HP · 55 Gold. Base-Upgrades 25 % günstiger und eine zusätzliche dritte Stufe.'},
    merchant:{name:'Händlerstadt',hp:15,gold:90,income:2,costFactor:1,maxLevel:2,weaponFactor:.75,desc:'15 HP · 90 Gold · +2 Gold je überlebter Wave. Base-Waffe verursacht 25 % weniger Schaden.'}
  };
  const upgrades={walls:[{cost:35,hp:5},{cost:60,hp:5},{cost:90,hp:10}],weapon:[{cost:45,damage:12,range:150,cooldown:1},{cost:80,damage:24,range:165,cooldown:.9},{cost:120,damage:38,range:180,cooldown:.8}]};
  const hero=id=>definitions[id]||definitions.standard;
  function initialize(state,id){
    state.heroId=Object.hasOwn(definitions,id)?id:'standard';const h=hero(state.heroId);
    state.hp=state.maxHp=h.hp;state.gold=h.gold;state.income=h.income;
    state.baseUpgrades={walls:0,weapon:0};state.baseWeapon={type:'archer',lastShot:-Infinity};state.selectedBase=false;
  }
  function offer(state,kind){
    const level=state.baseUpgrades?.[kind],h=hero(state.heroId);
    if(!Number.isInteger(level)||level>=h.maxLevel||!upgrades[kind]?.[level])return null;
    return {...upgrades[kind][level],level:level+1,cost:Math.ceil(upgrades[kind][level].cost*h.costFactor)};
  }
  function buy(state,kind){
    const next=offer(state,kind);
    if(blockReason(state,kind))return false;
    state.gold-=next.cost;state.baseUpgrades[kind]++;
    // Strengthening restores only the HP gained by the upgrade, not all damage.
    if(kind==='walls'){state.maxHp+=next.hp;state.hp=Math.min(state.maxHp,state.hp+next.hp);}
    return true;
  }
  function blockReason(state,kind){
    if(state.hp<=0||state.phase==='gameover')return 'Der Run ist beendet.';
    const next=offer(state,kind);if(!next)return 'Maximalstufe erreicht.';
    if(!['place','build','wave'].includes(state.phase))return 'Schließe zuerst die offene Belohnung oder Auswahl ab.';
    if(state.gold<next.cost)return `Noch ${next.cost-state.gold} Gold nötig.`;
    return '';
  }
  function weapon(state,level=state.baseUpgrades?.weapon){
    const stats=upgrades.weapon[level-1];if(!stats)return null;
    return {...stats,damage:stats.damage*hero(state.heroId).weaponFactor,color:'#f1d477',damageMultipliers:{hp:1,armor:1,magic:1}};
  }
  function combatRef(state){const definition=weapon(state);return definition?{tw:state.baseWeapon,pos:{x:0,y:0},definition}:null;}
  return {definitions,hero,initialize,offer,buy,blockReason,weapon,combatRef};
})();
