const HexData=(()=>{
  const CARD_LIBRARY = {
    rescueTunnel:{id:'rescueTunnel',name:'Rettungstunnel',rarity:'Common',roads:[0],slots:0,rescue:true,procedural:true,desc:'Kostenloser Tunnelausgang ohne Bauplätze.'},
    buildingPlot:{id:'buildingPlot',name:'Baugrund',rarity:'Uncommon',roads:[],slots:0,buildingSlots:1,buildingLayout:[[0,0]],procedural:true,desc:'Straßenloses Hex mit 1 Gebäudeslot. Seitlich anbauen; offene Straßen bleiben frei.'},
    buildingQuarter:{id:'buildingQuarter',name:'Bauviertel',rarity:'Rare',roads:[],slots:0,buildingSlots:2,buildingLayout:[[-22,0],[22,0]],procedural:true,desc:'Straßenloses Hex mit 2 Gebäudeslots. Seitlich anbauen; offene Straßen bleiben frei.'},
    buildingDistrict:{id:'buildingDistrict',name:'Baubezirk',rarity:'Epic',roads:[],slots:0,buildingSlots:3,buildingLayout:[[-23,-14],[23,-14],[0,25]],procedural:true,desc:'Straßenloses Hex mit 3 Gebäudeslots. Seitlich anbauen; offene Straßen bleiben frei.'},
    deadEnd:{id:'deadEnd',name:'Bastionssackgasse',rarity:'Epic',roads:[0],slots:2,buildingSlots:1,buildingLayout:[[0,0]],procedural:true,slotLayout:[[-14,-24],[-14,24]],desc:'Schließt einen Weg mit zwei Turmplätzen ab. Eigener Gegnerportal-Platz: Ausbau für 250 Gold. Darf niemals das letzte offene Straßenende schließen.'},
    mirrorJunction:{"id":"mirrorJunction","name":"Spiegel-Abzweig","rarity":"Uncommon","roads":[0,3,4],"slots":2,"procedural":true,"slotLayout":[[-30,-24],[-4,-24]],"desc":"Gespiegelte T-Kreuzung: Durchgang mit Abzweig auf der anderen Seite."},
    fanJunction:{"id":"fanJunction","name":"Fächerkreuzung","rarity":"Uncommon","roads":[0,1,2],"slots":2,"procedural":true,"slotLayout":[[-22,25],[16,25]],"desc":"Drei Straßenenden auf einer Seite. Zwei Turmplätze im Rücken."},
    sideCross:{"id":"sideCross","name":"Seitenkreuzung","rarity":"Rare","roads":[0,1,2,3],"slots":2,"procedural":true,"slotLayout":[[-22,25],[16,25]],"desc":"Vier aufeinanderfolgende Straßenenden für neue Anschlüsse."},
    sentryBend:{"id":"sentryBend","name":"Späherbogen","rarity":"Epic","model":"smallCurve","roads":[0,1],"slots":1,"towerRange":1.3,"desc":"Kleine Kurve: +30 % Turmreichweite auf diesem Hex."},
    battleFork:{"id":"battleFork","name":"Veteranengabel","rarity":"Epic","model":"tee","roads":[0,2,4],"slots":2,"towerDamage":1.2,"desc":"Y-Kreuzung mit 2 Turmplätzen und +20 % Turmschaden."},
    goldRoad:{"id":"goldRoad","name":"Goldroute","rarity":"Epic","model":"straight","roads":[0,3],"slots":1,"income":4,"desc":"Gerade mit einem Turmplatz und +4 Gold je Wave."},
    warBend:{"id":"warBend","name":"Drachenbogen","rarity":"Legendary","model":"smallCurve","roads":[0,1],"slots":1,"towerDamage":1.4,"towerRange":1.2,"desc":"Kleine Kurve: +40 % Turmschaden und +20 % Reichweite."},
    crownCross:{"id":"crownCross","name":"Kronenkreuzung","rarity":"Legendary","model":"fullCross","roads":[0,1,2,3,4,5],"slots":2,"towerDamage":1.2,"towerRange":1.2,"desc":"Sechs Anschlüsse, 2 Turmplätze, +20 % Schaden und Reichweite."},
    royalBend:{"id":"royalBend","name":"Königsbogen","rarity":"Legendary","model":"village","roads":[0,2],"slots":1,"buildingSlots":1,"income":5,"towerRange":1.2,"desc":"Große Kurve: +5 Gold je Wave, Gebäudeslot und +20 % Turmreichweite."},
    siegeRoad:{"id":"siegeRoad","name":"Belagerungsgerade","rarity":"Rare","model":"straight","roads":[0,3],"slots":1,"requiredTower":"catapult","towerBonus":{"type":"catapult","damage":1.25},"desc":"+25 % Schaden für Katapult auf diesem Hex."},
    lightningFork:{"id":"lightningFork","name":"Blitzgabel","rarity":"Rare","model":"tee","roads":[0,2,4],"slots":2,"requiredTower":"chain","towerBonus":{"type":"chain","damage":1.25},"desc":"+25 % Schaden für Kettenblitz auf diesem Hex."},
    frostBend:{"id":"frostBend","name":"Frostbogen","rarity":"Rare","model":"smallCurve","roads":[0,1],"slots":1,"requiredTower":"freeze","towerBonus":{"type":"freeze","range":1.25},"desc":"+25 % Reichweite für Freeze auf diesem Hex."},
    mineRoad:{"id":"mineRoad","name":"Minenstraße","rarity":"Rare","model":"longRoad","roads":[0,3],"slots":2,"requiredTower":"mine","towerBonus":{"type":"mine","damage":1.25},"desc":"+25 % Schaden für Minenleger auf diesem Hex."},
    ballistaRoad:{"id":"ballistaRoad","name":"Schützenlinie","rarity":"Rare","model":"straight","roads":[0,3],"slots":1,"requiredTower":"ballista","towerBonus":{"type":"ballista","damage":1.25},"desc":"+25 % Schaden für Balliste auf diesem Hex."},
    emberBend:{"id":"emberBend","name":"Glutknick","rarity":"Rare","model":"smallCurve","roads":[0,1],"slots":1,"requiredTower":"flame","towerBonus":{"type":"flame","damage":1.25},"desc":"+25 % Schaden für Flammenturm auf diesem Hex."},
    elementCross:{"id":"elementCross","name":"Elementkreuzung","rarity":"Rare","model":"cross","roads":[0,1,3,4],"slots":2,"requiredTower":"element","towerBonus":{"type":"element","damage":1.25},"desc":"+25 % Schaden für Elementturm auf diesem Hex."},
    soulFork:{"id":"soulFork","name":"Seelenabzweig","rarity":"Rare","model":"tJunction","roads":[0,2,3],"slots":2,"requiredTower":"necromancer","towerBonus":{"type":"necromancer","damage":1.25},"desc":"+25 % Schaden für Nekromantenturm auf diesem Hex. Gilt auch für Geister."},

    supplyRoad:{id:'supplyRoad',name:'Versorgungsweg',rarity:'Rare',roads:[0,3],slots:1,income:2,desc:'+2 Gold je Wave, ein Turmplatz an einer geraden Straße.'},
    signalCross:{id:'signalCross',name:'Signalkreuzung',rarity:'Epic',roads:[0,1,3,4],slots:2,towerRange:1.2,desc:'+20 % Reichweite, zwei Turmplätze und vier Straßenenden.'},
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
    grove: {requiredTower:'archer',id:'grove',name:'Waldkurve',rarity:'Rare',roads:[0,2],slots:1,archerDamage:1.25,desc:'+25 % Archer-Schaden auf diesem Hex. Nur 1 Slot.'},
    treasury: {id:'treasury',name:'Handelsstraße',rarity:'Rare',roads:[0,3],slots:0,income:4,desc:'+4 Gold je Wave. Keine Turret-Slots.'},
    citadel: {id:'citadel',name:'Bastionskreuzung',rarity:'Legendary',roads:[0,2,4],slots:2,towerRange:1.4,income:2,desc:'+40 % Tower-Reichweite, 2 Turret-Slots und +2 Gold je Wave.'},
    battlefield: {id:'battlefield',name:'Kampfstraße',rarity:'Epic',roads:[0,3],slots:1,towerDamage:1.2,desc:'+20 % Schaden für alle Schadentürme auf diesem Hex.'},
    watchtower: {id:'watchtower',name:'Wachtkurve',rarity:'Epic',roads:[0,2],slots:2,towerRange:1.15,desc:'2 Turret-Slots und +15 % Tower-Reichweite.'},
    royalVillage: {id:'royalVillage',name:'Königsstraße',rarity:'Legendary',roads:[0,3],slots:1,buildingSlots:1,income:5,desc:'+5 Gold je Wave, 1 Turret-Slot und 1 Gebäudeslot.'},
    warCross: {id:'warCross',name:'Kriegskreuzung',rarity:'Legendary',roads:[0,1,3,4],slots:2,towerDamage:1.3,desc:'Vier Straßenenden, 2 Slots, +30 % Tower-Schaden.'}
  };

  const TOWERS = {
    archer: {name:'Archer',cost:25,range:150,damage:9,cooldown:0.55,color:'#e7d89b',damageMultipliers:{hp:1.25,armor:1,magic:.65},desc:'Schneller Single-Target-Schaden.'},
    catapult: {name:'Katapult',cost:40,range:190,damage:18,cooldown:1.35,color:'#c88954',damageMultipliers:{hp:1,armor:1.5,magic:.6},pierce:true,pierceTargets:3,desc:'Stein durchschlägt bis zu 3 Gegner in einer Linie.'},
    chain: {name:'Kettenblitz',cost:45,range:135,damage:8,cooldown:0.9,color:'#7fc6ff',damageMultipliers:{hp:1,armor:.65,magic:1.5},chain:3,jumpRange:75,desc:'Bis zu 3 Ziele, maximal 75 Abstand je Sprung.'},
    freeze: {name:'Freeze',cost:30,range:145,damage:0,cooldown:1,color:'#a4eef5',aura:true,slow:.5,role:'Support',desc:'Aura: halbiert das Tempo aller Gegner in Reichweite.'},
    mine: {name:'Minenleger',cost:35,range:150,damage:24,cooldown:1.4,color:'#e6a75f',damageMultipliers:{hp:1.1,armor:1.4,magic:.65},mine:true,splash:45,role:'Wegkontrolle',desc:'Legt dauerhaft stapelbare Sprengminen auf Straßen.'},
    ballista: {name:'Balliste',cost:55,range:235,damage:46,cooldown:1.9,color:'#d9c08b',damageMultipliers:{hp:1.45,armor:1.15,magic:.7},bossMultiplier:1.3,role:'Bosskiller',desc:'Extrem weitreichender Einzelschuss gegen Eliten und Bosse.'},
    flame: {name:'Flammenturm',cost:50,range:115,damage:14,cooldown:.7,splash:48,color:'#ff754b',damageMultipliers:{hp:1.35,armor:.55,magic:.8},role:'Flächenkontrolle',desc:'Kurze Reichweite, aber dauerhafter Schaden gegen dichte Gruppen.'},
    element:{name:'Elementturm',cost:50,range:155,damage:15,cooldown:1,color:'#b8a0ff',damageMultipliers:{hp:1,armor:.8,magic:1.3},role:'Elementwahl',desc:'Arkaner Angriff. Spezialisierung wählen: Feuer (Fläche), Wasser (Slow) oder Wind (Durchschlag).'},
    necromancer:{name:'Nekromantenturm',cost:60,range:150,damage:10,cooldown:1.2,color:'#a6edb4',damageMultipliers:{hp:1,armor:.7,magic:1.4},soulLimit:3,soulDuration:6,soulDamage:8,role:'Beschwörung',desc:'Tote Gegner in Reichweite werden zu bis zu 3 Geistern: 6 s Lebensdauer, ein Angriff pro Sekunde. Jeder Tod liefert nur eine Seele.'},
  };

  const UPGRADES={
    elementFire:{tower:'element',name:'Feuerkern',cost:40,damage:20,splash:48,color:'#ff8654',desc:'Feuer trifft Gruppen im Umkreis von 48.'},
    elementWater:{tower:'element',name:'Wasserkern',cost:40,damage:16,hitSlow:.65,slowDuration:2,color:'#69d8ff',desc:'Treffer verlangsamen 2 Sekunden lang um 35 %. Stärkster Slow zählt; Bossresistenz bleibt.'},
    elementWind:{tower:'element',name:'Windkern',cost:40,damage:18,range:210,pierce:true,pierceTargets:3,color:'#dbefae',desc:'Wind durchschlägt bis zu 3 Gegner auf einer Linie.'},
    elementVolcano:{tower:'element',requires:'elementFire',name:'Vulkanherz',cost:70,damage:34,splash:65,desc:'Stärkeres Feuer mit größerer Fläche.'},
    elementTide:{tower:'element',requires:'elementWater',name:'Gezeitenherz',cost:70,damage:26,hitSlow:.5,slowDuration:3,desc:'Halbiert das Tempo getroffener Gegner für 3 Sekunden.'},
    elementTempest:{tower:'element',requires:'elementWind',name:'Orkanherz',cost:70,damage:30,range:250,pierceTargets:5,desc:'Durchschlägt bis zu 5 Gegner mit großer Reichweite.'},
    soulChoir:{tower:'necromancer',name:'Seelenchor',cost:50,soulLimit:5,desc:'Bis zu 5 Geister gleichzeitig.'},
    soulKeeper:{tower:'necromancer',name:'Seelenhüter',cost:50,soulDamage:15,soulDuration:9,desc:'Stärkere Geister bleiben 9 Sekunden.'},
    soulLegion:{tower:'necromancer',requires:'soulChoir',name:'Geisterlegion',cost:80,soulLimit:8,soulDamage:11,desc:'Bis zu 8 Geister mit verstärkten Angriffen.'},
    soulLord:{tower:'necromancer',requires:'soulKeeper',name:'Lichfürst',cost:80,soulDamage:24,soulDuration:12,damage:20,desc:'Mächtige Geister bleiben 12 Sekunden.'},
    volley:{tower:'archer',name:'Salve',cost:35,damage:7,cooldown:.65,splash:55,desc:'Treffer schädigen Gegner im Umkreis von 55.'},
    marksman:{tower:'archer',name:'Scharfschütze',cost:35,damage:22,cooldown:.85,range:190,desc:'Mehr Einzelzielschaden und Reichweite.'},
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
    winter:{tower:'freeze',requires:'frostField',name:'Winterfeld',cost:60,slow:.5,range:250,desc:'50 % Slow auf großem Gebiet.'},
    demolition:{tower:'mine',name:'Sprengmeister',cost:40,damage:42,cooldown:1.8,range:170,splash:60,desc:'Langsam gelegte schwere Minen für robuste Gegner.'},
    minefield:{tower:'mine',name:'Minenfeld',cost:40,damage:16,cooldown:.75,range:140,splash:42,desc:'Legt schnell viele kleinere Minen gegen Gruppen.'},
    earthquake:{tower:'mine',requires:'demolition',name:'Erdbrecher',cost:65,damage:75,cooldown:1.9,range:185,splash:80,desc:'Finale Großmine mit gewaltigem Explosionsradius.'},
    carpet:{tower:'mine',requires:'minefield',name:'Minenteppich',cost:65,damage:24,cooldown:.5,range:155,splash:55,desc:'Finales dichtes Minenfeld für dauerhaften Flächenschaden.'},
    harpoon:{tower:'ballista',name:'Harpunenbolzen',cost:55,damage:72,cooldown:2.2,range:255,desc:'Massiver Treffer für Bosse und gepanzerte Ziele.'},
    repeater:{tower:'ballista',name:'Repetierwerk',cost:55,damage:30,cooldown:1.05,range:215,desc:'Schnellere Bolzen für verlässlichen Einzelzielschaden.'},
    dragonSlayer:{tower:'ballista',requires:'harpoon',name:'Drachentöter',cost:80,damage:125,cooldown:2.25,range:285,desc:'Finaler Fernschuss mit extremem Einzelschaden.'},
    boltStorm:{tower:'ballista',requires:'repeater',name:'Bolzensturm',cost:80,damage:48,cooldown:.72,range:235,desc:'Finales Repetierwerk mit hoher Feuerrate.'},
    inferno:{tower:'flame',name:'Inferno',cost:50,damage:25,cooldown:.85,range:125,splash:65,desc:'Größere, schwerere Feuerstöße für dichte Gruppen.'},
    wildfire:{tower:'flame',name:'Lauffeuer',cost:50,damage:10,cooldown:.38,range:120,splash:42,desc:'Sehr schnelle Flammenstöße halten Schwärme unter Druck.'},
    sunfire:{tower:'flame',requires:'inferno',name:'Sonnenfeuer',cost:75,damage:43,cooldown:.8,range:140,splash:82,desc:'Finaler großer Feuerbereich mit hohem Schaden.'},
    firestorm:{tower:'flame',requires:'wildfire',name:'Feuersturm',cost:75,damage:20,cooldown:.25,range:115,splash:52,desc:'Finales Flammenmeer mit kurzer Reichweite und extremer Angriffsdichte.'}
  };
  const ULTIMATES={
    element:{name:'Urkraft',cost:120,damageFactor:1.3,rangeFactor:1.1,desc:'Verstärkt das gewählte Element: +30 % Schaden und +10 % Reichweite.'},
    necromancer:{name:'Seelenkrone',cost:130,damageFactor:1.3,desc:'Verstärkt Turm und Geister um 30 % Schaden.'},
    archer:{name:'Großmeister',cost:100,damageFactor:1.3,rangeFactor:1.1,desc:'Vollendete Bogentechnik: mehr Schaden und Reichweite für beide Spezialisierungen.'},
    catapult:{name:'Titanenwerk',cost:110,damageFactor:1.35,rangeFactor:1.08,desc:'Verstärkt jede Katapult-Spezialisierung mit schwereren Geschossen.'},
    chain:{name:'Arkankern',cost:110,damageFactor:1.3,chainBonus:2,jumpBonus:15,desc:'Zusätzliche Blitzenergie, zwei weitere Ziele und größere Sprungweite.'},
    freeze:{name:'Permafrost',cost:95,rangeFactor:1.15,slowFactor:.8,desc:'Vergrößert die Aura und verstärkt ihre Verlangsamung.'},
    mine:{name:'Endloses Arsenal',cost:105,damageFactor:1.3,cooldownFactor:.8,splashBonus:15,desc:'Legt schneller und verstärkt jede Mine samt Explosionsradius.'},
    ballista:{name:'Apex-Bolzen',cost:125,damageFactor:1.35,rangeFactor:1.08,bossFactor:1.2,desc:'Maximale Durchschlagskraft mit zusätzlichem Bossschaden.'},
    flame:{name:'Phönixkern',cost:120,damageFactor:1.3,splashBonus:15,desc:'Verstärkt Schaden und Fläche beider Flammenspezialisierungen.'}
  };
  const BRANCH_VISUALS={marksman:{icon:'◎',color:'#f5d06e'},volley:{icon:'≋',color:'#96d47c'},siege:{icon:'◆',color:'#e99a5c'},barrage:{icon:'⋮',color:'#ffdca1'},storm:{icon:'ϟ',color:'#93a5ff'},overload:{icon:'✦',color:'#e2a1ff'},deepFrost:{icon:'❄',color:'#70d5ff'},frostField:{icon:'❆',color:'#c0f6ea'},demolition:{icon:'✹',color:'#ff9b55'},minefield:{icon:'••',color:'#d9bc72'},harpoon:{icon:'➶',color:'#e7d39e'},repeater:{icon:'»',color:'#d4b979'},inferno:{icon:'☀',color:'#ff7448'},wildfire:{icon:'≋',color:'#ff9b55'}};
  Object.assign(BRANCH_VISUALS,{elementFire:{icon:'♨',color:'#ff8654'},elementWater:{icon:'≈',color:'#69d8ff'},elementWind:{icon:'≋',color:'#dbefae'},soulChoir:{icon:'☽',color:'#a6edb4'},soulKeeper:{icon:'☠',color:'#c8a3ee'}});
  function recordTowerStat(state,tower,field,amount){
    if(!tower)return;if(tower.guestOwner!==undefined){if(field==='damage'){state.duoSupport??={};const totals=state.duoSupport[tower.guestOwner]??={};totals[tower.type]=(totals[tower.type]||0)+amount;}return;}if(tower===state.baseWeapon){if(field==='damage')state.baseDamage=(state.baseDamage||0)+amount;return;}
    state.runTowerStats??={};const usage=state.runTowerStats[tower.type]??={builds:0,upgrades:0};usage[field]=(usage[field]||0)+amount;
    const detail=state.runTowerDetails?.[tower.statId];if(detail)detail[field]=(detail[field]||0)+amount;
  }
  function runUpgrades(state,tower){
    if(!tower||tower.guestOwner!==undefined||tower.ultimate)return [];
    if(!tower.finalUpgrade)return availableUpgrades(tower);
    const id='ultimate:'+tower.type;
    return state.ultimateUnlocks?.includes(id)&&ULTIMATES[tower.type]?[[id,ultimateDefinition(tower)]]:[];
  }
  function upgradeStatus(state,tower){return runUpgrades(state,tower).length?'↑':'';}
  function ultimateDefinition(tower){const def=ULTIMATES[tower.type];if(tower.type!=='element')return def;return {...def,name:({elementFire:'Weltenbrand',elementWater:'Ozeanherz',elementWind:'Himmelssturm'})[tower.branch]||def.name};}
  function towerDefinition(tower,definitions=TOWERS){
    const def={...definitions[tower.type],...(tower.branch?UPGRADES[tower.branch]:{}),...(tower.finalUpgrade?UPGRADES[tower.finalUpgrade]:{})},terrain=CARD_LIBRARY[tower.tileType];
    const ultimate=tower.ultimate&&ultimateDefinition(tower);if(ultimate){def.name=ultimate.name;def.damage=(def.damage||0)*(ultimate.damageFactor||1);def.range=(def.range||0)*(ultimate.rangeFactor||1);def.cooldown=(def.cooldown||1)*(ultimate.cooldownFactor||1);if(def.slow)def.slow*=ultimate.slowFactor||1;if(def.splash)def.splash+=ultimate.splashBonus||0;if(def.chain)def.chain+=ultimate.chainBonus||0;if(def.jumpRange)def.jumpRange+=ultimate.jumpBonus||0;if(def.bossMultiplier)def.bossMultiplier*=ultimate.bossFactor||1;}
    if(typeof HexBiomes!=='undefined')HexBiomes.apply(def,tower);
    const bonus=terrain?.towerBonus?.type===tower.type?terrain.towerBonus:{};
    def.range=Math.round(def.range*(bonus.range||1)*(terrain?.towerRange||1)*(tower.rangeFactor||1));
    def.damage=def.damage*(bonus.damage||1)*(tower.type==='archer'?(terrain?.archerDamage||1):1)*(terrain?.towerDamage||1)*(tower.supportDamage||1);
    def.damage=Number(def.damage.toFixed(2));
    if(def.soulDamage)def.soulDamage*= (bonus.damage||1)* (terrain?.towerDamage||1)*(tower.supportDamage||1)*(ultimate?.damageFactor||1);
    def.damageType=({elementFire:'fire',elementWater:'water',elementWind:'wind'})[tower.branch]||({flame:'fire',chain:'lightning',necromancer:'spirit',element:'arcane'})[tower.type]||'physical';
    return def;
  }
  function availableUpgrades(tower){return Object.entries(UPGRADES).filter(([,upgrade])=>upgrade.tower===tower.type&&!tower.finalUpgrade&&(tower.branch?upgrade.requires===tower.branch:!upgrade.requires));}
  function towerRefund(state,tower){
    if(!tower||tower.guestOwner!==undefined||state.hp<=0||state.phase==='gameover') return null;
    const full=['place','build'].includes(state.phase)&&!state.waveRunning&&tower.builtOnWave===state.wave;
    return {amount:full?tower.paid:Math.floor(tower.paid*.5),percent:full?100:50};
  }
  function tileBonusLabel(terrain){
    if(!terrain)return null;
    const parts=[];
    if(terrain.towerBonus)parts.push('+25 % '+TOWERS[terrain.requiredTower].name+(terrain.towerBonus.range?' Reichweite':' Schaden'));
    if(terrain.towerDamage)parts.push('+'+Math.round((terrain.towerDamage-1)*100)+' % Schaden');
    if(terrain.towerRange)parts.push('+'+Math.round((terrain.towerRange-1)*100)+' % Reichweite');
    if(terrain.archerDamage)parts.push('+25 % Archer');
    return parts.join(' · ')||null;
  }
  return {tileBonusLabel,recordTowerStat,runUpgrades,upgradeStatus,ultimateDefinition,CARD_LIBRARY,TOWERS,UPGRADES,ULTIMATES,BRANCH_VISUALS,towerDefinition,availableUpgrades,towerRefund};
})();
