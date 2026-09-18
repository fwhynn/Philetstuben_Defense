const HexData=(()=>{
  const CARD_LIBRARY = {
    straight: {id:'straight',name:'Gerade',rarity:'Common',roads:[0,3],slots:1,desc:'Zuverlässiger Weg.'},
    smallCurve: {id:'smallCurve',name:'Kleine Kurve',rarity:'Common',roads:[0,1],slots:1,desc:'Enge 60°-Kurve.'},
    bigCurve: {id:'bigCurve',name:'Große Kurve',rarity:'Common',roads:[0,2],slots:1,desc:'Weite Kurve, gut für Reichweite.'},
    tee: {id:'tee',name:'Y-Kreuzung',rarity:'Uncommon',roads:[0,2,4],slots:2,desc:'Drei gleichmäßig verteilte Straßenarme.'},
    tJunction: {id:'tJunction',name:'T-Kreuzung',rarity:'Uncommon',roads:[0,2,3],slots:2,desc:'Durchgehende Links-rechts-Straße mit Abzweig.'},
    fullCross: {id:'fullCross',name:'Sechserkreuzung',rarity:'Rare',roads:[0,1,2,3,4,5],slots:2,desc:'Straßenöffnungen in alle sechs Richtungen.'},
    cross: {id:'cross',name:'Kreuzung',rarity:'Rare',roads:[0,1,3,4],slots:2,desc:'Flexibel und gefährlich.'},
    village: {id:'village',name:'Dorfstraße',rarity:'Rare',roads:[0,2],slots:1,buildingSlots:1,desc:'+2 Gold nach jeder Wave.',income:2},
    empty: {id:'empty',name:'Weites Land',rarity:'Uncommon',roads:[0,3],slots:2,desc:'Einfaches Feld mit 2 Turret-Slots.'},
    longRoad: {id:'longRoad',name:'Lange Straße',rarity:'Uncommon',roads:[0,3],slots:2,desc:'Gewundener Weg: Gegner bleiben länger im Hex.'},
    highGround: {id:'highGround',name:'Höhenkreuzung',rarity:'Epic',roads:[0,2,4],slots:1,towerRange:1.25,desc:'+25 % Tower-Reichweite. Nur 1 Slot und drei Straßenenden.'},
    grove: {id:'grove',name:'Waldkurve',rarity:'Uncommon',roads:[0,2],slots:1,archerDamage:1.25,desc:'+25 % Archer-Schaden auf diesem Hex. Nur 1 Slot.'},
    treasury: {id:'treasury',name:'Handelsstraße',rarity:'Rare',roads:[0,3],slots:0,income:4,desc:'+4 Gold je Wave. Keine Turret-Slots.'},
    citadel: {id:'citadel',name:'Bastionskreuzung',rarity:'Legendary',roads:[0,2,4],slots:2,towerRange:1.4,income:2,desc:'+40 % Tower-Reichweite, 2 Turret-Slots und +2 Gold je Wave.'},
    battlefield: {id:'battlefield',name:'Kampfstraße',rarity:'Epic',roads:[0,3],slots:1,towerDamage:1.2,desc:'+20 % Schaden für alle Schadentürme auf diesem Hex.'},
    watchtower: {id:'watchtower',name:'Wachtkurve',rarity:'Epic',roads:[0,2],slots:2,towerRange:1.15,desc:'2 Turret-Slots und +15 % Tower-Reichweite.'},
    royalVillage: {id:'royalVillage',name:'Königsstraße',rarity:'Legendary',roads:[0,3],slots:1,buildingSlots:1,income:5,desc:'+5 Gold je Wave, 1 Turret-Slot und 1 Gebäudeslot.'},
    warCross: {id:'warCross',name:'Kriegskreuzung',rarity:'Legendary',roads:[0,1,3,4],slots:2,towerDamage:1.3,desc:'Vier Straßenenden, 2 Slots, +30 % Tower-Schaden.'}
  };

  const TOWERS = {
    archer: {name:'Archer',cost:25,range:150,damage:9,cooldown:0.55,color:'#e7d89b',desc:'Schneller Single-Target-Schaden.'},
    catapult: {name:'Katapult',cost:40,range:190,damage:18,cooldown:1.35,color:'#c88954',pierce:true,desc:'Stein fliegt geradlinig durch mehrere Gegner.'},
    chain: {name:'Kettenblitz',cost:45,range:135,damage:8,cooldown:0.9,color:'#7fc6ff',chain:3,jumpRange:75,desc:'Bis zu 3 Ziele, maximal 75 Abstand je Sprung.'},
    freeze: {name:'Freeze',cost:30,range:145,damage:0,cooldown:1,color:'#a4eef5',aura:true,slow:.5,desc:'Aura: halbiert das Tempo aller Gegner in Reichweite.'}
  };

  const UPGRADES={
    marksman:{tower:'archer',name:'Scharfschütze',cost:35,damage:22,cooldown:.85,range:190,desc:'Mehr Einzelzielschaden und Reichweite.'},
    volley:{tower:'archer',name:'Salven',cost:35,damage:7,cooldown:.65,splash:55,desc:'Treffer schädigen Gegner im Umkreis von 55.'},
    siege:{tower:'catapult',name:'Belagerung',cost:45,damage:36,cooldown:1.8,range:230,desc:'Schwere Steine mit mehr Schaden und Reichweite.'},
    barrage:{tower:'catapult',name:'Steinhagel',cost:45,damage:13,cooldown:.65,range:190,desc:'Schnelle durchschlagende Steine für gerade Killzones.'},
    storm:{tower:'chain',name:'Sturmnetz',cost:45,damage:7,chain:5,jumpRange:95,desc:'Bis zu fünf Ziele und weitere Sprünge.'},
    overload:{tower:'chain',name:'Überladung',cost:45,damage:18,chain:2,cooldown:1.1,range:155,desc:'Zwei starke Treffer für robuste Gegner.'},
    deepFrost:{tower:'freeze',name:'Tiefenfrost',cost:35,slow:.35,range:125,desc:'65 % Slow in kleinerem Radius.'},
    frostField:{tower:'freeze',name:'Frostfeld',cost:35,slow:.55,range:200,desc:'45 % Slow mit großem Wirkungsbereich.'},
    eagleEye:{tower:'archer',requires:'marksman',name:'Adlerauge',cost:60,damage:38,range:230,cooldown:.8,desc:'Finale Einzelziel-Spezialisierung.'},
    arrowRain:{tower:'archer',requires:'volley',name:'Pfeilregen',cost:60,damage:12,cooldown:.5,splash:75,desc:'Größere und schnellere Flächentreffer.'},
    fortressBreaker:{tower:'catapult',requires:'siege',name:'Festungsbrecher',cost:70,damage:60,range:260,cooldown:1.7,desc:'Finale schwere Belagerungssteine.'},
    rockStorm:{tower:'catapult',requires:'barrage',name:'Steinsturm',cost:70,damage:21,cooldown:.5,desc:'Finale schnelle Steinsalven.'},
    tempest:{tower:'chain',requires:'storm',name:'Gewitter',cost:70,damage:11,chain:7,jumpRange:110,desc:'Großes Blitznetz für dichte Gruppen.'},
    thunder:{tower:'chain',requires:'overload',name:'Donnerschlag',cost:70,damage:32,chain:3,range:175,desc:'Starke Blitze für robuste Ziele.'},
    absoluteZero:{tower:'freeze',requires:'deepFrost',name:'Eisstarre',cost:60,slow:.25,range:145,desc:'75 % Slow in der Killzone.'},
    winter:{tower:'freeze',requires:'frostField',name:'Winterfeld',cost:60,slow:.5,range:250,desc:'50 % Slow auf großem Gebiet.'}
  };
  const BRANCH_VISUALS={marksman:{icon:'◎',color:'#f5d06e'},volley:{icon:'≋',color:'#96d47c'},siege:{icon:'◆',color:'#e99a5c'},barrage:{icon:'⋮',color:'#ffdca1'},storm:{icon:'ϟ',color:'#93a5ff'},overload:{icon:'✦',color:'#e2a1ff'},deepFrost:{icon:'❄',color:'#70d5ff'},frostField:{icon:'❆',color:'#c0f6ea'}};
  function towerDefinition(tower,definitions=TOWERS){
    const def={...definitions[tower.type],...(tower.branch?UPGRADES[tower.branch]:{}),...(tower.finalUpgrade?UPGRADES[tower.finalUpgrade]:{})},terrain=CARD_LIBRARY[tower.tileType];
    def.range=Math.round(def.range*(terrain?.towerRange||1));
    def.damage=def.damage*(tower.type==='archer'?(terrain?.archerDamage||1):1)*(terrain?.towerDamage||1)*(tower.supportDamage||1);
    def.damage=Number(def.damage.toFixed(2));
    return def;
  }
  function availableUpgrades(tower){return Object.entries(UPGRADES).filter(([,upgrade])=>upgrade.tower===tower.type&&!tower.finalUpgrade&&(tower.branch?upgrade.requires===tower.branch:!upgrade.requires));}
  function towerRefund(state,tower){
    if(!tower||state.hp<=0||state.phase==='gameover') return null;
    const full=state.phase==='build'&&!state.waveRunning&&tower.builtOnWave===state.wave;
    return {amount:full?tower.paid:Math.floor(tower.paid*.5),percent:full?100:50};
  }
  return {CARD_LIBRARY,TOWERS,UPGRADES,BRANCH_VISUALS,towerDefinition,availableUpgrades,towerRefund};
})();
