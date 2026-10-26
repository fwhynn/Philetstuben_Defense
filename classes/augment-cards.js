/* Meta cards: deterministic domain operations, separate from temporary exploration augments. */
const HexAugmentCards=(()=>{
 const rarities=['Gewöhnlich','Ungewöhnlich','Selten','Episch','Legendär'];
 const weights=[60,25,10,4,1],cost=50;
 const catalog={
  mine:{name:'Nachbeben',icon:'✹',values:[.15,.25,.35,.45,.6],text:n=>'Zweite Explosion nach 1 Sekunde: '+Math.round(n*100)+' % Minenschaden.'},
  flame:{name:'Brandöl',icon:'♨',values:[.1,.15,.2,.25,.35],text:n=>'Brand: '+Math.round(n*100)+' % Trefferschaden pro Sekunde für 3 Sekunden. Erneuert sich, stapelt nicht.'},
  freeze:{name:'Kälteschock',icon:'❄',values:[.2,.3,.4,.5,.6],text:n=>'Nach 3 Sekunden in Frostreichweite: '+n+' Sekunden einfrieren. 5 Sekunden Wiederholungssperre.'},
  ballista:{name:'Durchschlagbolzen',icon:'➶',values:[1,2,3,4,5],text:n=>'Bolzen durchschlagen '+n+' zusätzliche Ziele.'},
  chain:{name:'Leitfunke',icon:'ϟ',values:[1,2,3,4,5],text:n=>'Blitze springen auf '+n+' zusätzliche Ziele.'},
  necromancer:{name:'Seelenerbe',icon:'☾',values:[1,2,3,4,6],text:n=>'Geister bleiben '+n+' Sekunden länger.'},
  catapult:{name:'Splittergeschoss',icon:'✦',values:[.1,.15,.2,.25,.35],text:n=>'Splitter verursachen '+Math.round(n*100)+' % Schaden im äußeren Ring der Explosion.'},
  archer:{name:'Jagdfieber',icon:'➹',values:[.03,.04,.05,.06,.08],text:n=>'Je Folgetreffer auf dasselbe Ziel +'+Math.round(n*100)+' % Angriffstempo, maximal 5 Stapel.'},
  element:{name:'Elementare Resonanz',icon:'✧',values:[.2,.35,.5,.75,1],text:n=>'Jeder fünfte Treffer: zusätzlicher Treffer desselben Elements mit '+Math.round(n*100)+' % Schaden. Kein zusätzlicher Schildabbau.'},
  base:{name:'Notversorgung',icon:'♜',values:[1,1.5,2,2.5,3],text:n=>'Einmal pro Run bei höchstens 25 % Basis-LP: '+n+' Sekunden Schutz vor weiteren Treffern.'},
  house:{name:'Vorratskammer',icon:'⌂',values:[1,2,3,4,5],text:n=>'+'+n+' Gold pro abgeschlossenem Angriff mit mindestens einem Haus. Nicht pro Haus.'},
  market:{name:'Erstkundschaft',icon:'⚖',values:[1,2,3,4,5],text:n=>'Beim ersten bezahlten Turmbau je Welle mit einem Markt: '+n+' Gold Rabatt, maximal der Baupreis.'},
  forge:{name:'Weitsicht',icon:'⚒',values:[.02,.04,.06,.08,.1],text:n=>'Von einer Schmiede verstärkte Türme erhalten +'+Math.round(n*100)+' % Reichweite. Nicht stapelbar.'}
 };
 const legendary={
  mine:'Legendär: zweite Explosion hat 20 % mehr Radius.',
  flame:'Legendär: Brand hält 5 statt 3 Sekunden.',
  freeze:'Legendär: alle 5 Sekunden Frostimpuls statt Aufbau; Bosse frieren halb so lang ein.',
  ballista:'Legendär: jeder fünfte Schuss verursacht 25 % zusätzlichen Schaden.',
  chain:'Legendär: 20 % mehr Sprungweite.',
  necromancer:'Legendär: ein zusätzlicher Geist gleichzeitig.',
  catapult:'Legendär: Splitterring reicht 60 statt 35 Einheiten weiter.',
  archer:'Legendär: bis zu 8 Stapel.',
  base:'Legendär: beim Auslösen zusätzlich 2 LP heilen.',
  house:'Legendär: zusätzlich 1 Gold pro Welle.',
  market:'Legendär: zusätzlich 1 Gold Rabatt.',
  forge:'Legendär: zusätzlich 2 % Reichweite.'
 };
 function clean(raw){
  const out={version:1,cards:{},equipped:[],packs:0,pity:0,unlocked:false,introSeen:false,bestWave:0,settledBestWave:0,lastPack:[]};
  if(raw==null)return out;
  if(raw.version!==1||!raw.cards||typeof raw.cards!=='object'||Array.isArray(raw.cards))throw Error('Unbekannte oder beschädigte Augment-Sammlung.');
  for(const [id,a] of Object.entries(raw.cards))if(!catalog[id]||!Array.isArray(a)||a.length!==5||a.some(n=>!Number.isSafeInteger(n)||n<0||n>1000000))throw Error('Ungültige Augment-Karten.');
  for(const id of Object.keys(catalog)){
   const a=raw.cards?.[id];
   if(Array.isArray(a)&&a.length===5&&a.every(n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000))out.cards[id]=[...a];
  }
  out.equipped=[...new Set(Array.isArray(raw.equipped)?raw.equipped:[])].filter(id=>out.cards[id]?.some(n=>n>0)).slice(0,5);
  for(const k of ['packs','pity','bestWave','settledBestWave'])if(Number.isSafeInteger(raw[k])&&raw[k]>=0)out[k]=Math.min(raw[k],1000000);
  out.unlocked=raw.unlocked===true;out.introSeen=raw.introSeen===true;
  out.lastPack=(Array.isArray(raw.lastPack)?raw.lastPack:[]).filter(c=>catalog[c.id]&&Number.isInteger(c.tier)&&c.tier>=0&&c.tier<5).slice(0,2).map(c=>({id:c.id,tier:c.tier}));
  return out;
 }
 function progress(p){return Math.max(clean(p.augmentCards).bestWave,p.introduction?.bestWave||0,Math.max(0,(p.records?.highestWave||0)-1),p.milestones?.includes('standard35')?35:0);}
 function unlocked(p){const a=clean(p.augmentCards),completed=Math.max(a.settledBestWave,Math.min(progress(p),Math.max(0,(p.records?.highestWave||0)-1)));return a.unlocked||(completed>=15&&(p.unlocks||[]).some(id=>/^(tower|building|ultimate):/.test(id)));}
 function slots(p){return !unlocked(p)?0:1+[20,25,35,50].filter(w=>progress(p)>=w).length;}
 function tier(cards,id){return (cards[id]||[]).findLastIndex(n=>n>0);}
 function describe(id,t){return catalog[id].text(catalog[id].values[t])+(t===4&&legendary[id]?' '+legendary[id]:'');}
 function buy(p,random){
  if(!unlocked(p)||p.diamonds<cost)throw Error('Booster nicht verfügbar.');
  const a=clean(p.augmentCards);a.unlocked=true;
  const available=Object.keys(catalog).filter(id=>['base','house','market','forge'].includes(id)||p.unlockedTowers.includes(id));
  const draw=()=>{const n=random();if(!Number.isFinite(n)||n<0||n>=1)throw Error('Ungültiger Zufallswert.');return n;};
  const result=[];let pool=[...available];
  for(let i=0;i<2;i++){
   const id=pool.splice(Math.floor(draw()*pool.length),1)[0];let roll=draw()*100,t=0;
   while(t<4&&roll>=weights[t])roll-=weights[t++];
   if(i===1&&a.pity>=9&&!result.some(c=>c.tier>=2))t=Math.max(2,t);
   (a.cards[id]??=[0,0,0,0,0])[t]++;result.push({id,tier:t});
  }
  a.pity=result.some(c=>c.tier>=2)?0:a.pity+1;a.packs++;a.lastPack=result;
  return {...p,diamonds:p.diamonds-cost,augmentCards:a};
 }
 function fuse(p,id,t){
  const a=clean(p.augmentCards);if(!unlocked(p)||!Number.isInteger(t)||t<0||t>=4||(a.cards[id]?.[t]||0)<3)throw Error('Drei gleiche Karten dieser Seltenheit benötigt.');
  a.unlocked=true;a.cards[id][t]-=3;a.cards[id][t+1]++;return {...p,augmentCards:a};
 }
 function equip(p,id){
  const a=clean(p.augmentCards);if(!unlocked(p)||tier(a.cards,id)<0)throw Error('Karte nicht verfügbar.');
  if(a.equipped.includes(id))a.equipped=a.equipped.filter(x=>x!==id);
  else {if(a.equipped.length>=slots(p))throw Error('Alle Augment-Plätze belegt.');a.equipped.push(id);}
  a.unlocked=true;return {...p,augmentCards:a};
 }
 function run(p,loadout){const a=clean(p.augmentCards);return {version:1,cards:unlocked(p)?a.equipped.slice(0,slots(p)).filter(id=>!['mine','flame','freeze','ballista','chain','necromancer','catapult','archer','element'].includes(id)||loadout.includes(id)).map(id=>({id,tier:tier(a.cards,id)})):[]};}
 function label(id,t){return catalog[id].icon+' '+catalog[id].name+' · '+rarities[t];}
 function activeDescription(s,id){const t=level(s,id);return t<0?'':'Augment · '+label(id,t)+': '+describe(id,t);}
 function hasBuilding(s,id){return [...s.map.values()].some(tile=>tile.buildings?.some(b=>b?.type===id));}
 function marketDiscount(s){return value(s,'market')&&s.augmentMarketWave!==s.wave&&hasBuilding(s,'market')?value(s,'market')+(level(s,'market')===4?1:0):0;}
 function level(s,id){const t=s.metaAugments?.version===1?s.metaAugments.cards?.find(c=>c.id===id)?.tier:undefined;return Number.isInteger(t)&&t>=0&&t<5?t:-1;}
 function value(s,id){const t=level(s,id);return t<0?0:catalog[id].values[t];}
 function definition(s,tower,base){
  const d={...base},t=level(s,tower.type);if(t>=0){const n=value(s,tower.type);
   if(tower.type==='ballista'){d.pierce=true;d.pierceTargets=(base.pierce?(base.pierceTargets||3):1)+n;if(t===4&&(tower.augmentShots||0)%5===4)d.damage*=1.25;}
   if(tower.type==='chain'){d.chain=(d.chain||1)+n;if(t===4)d.jumpRange*=1.2;}
   if(tower.type==='necromancer'){d.soulDuration+=n;if(t===4)d.soulLimit++;}
   if(tower.type==='archer')d.cooldown/=1+Math.min(t===4?8:5,tower.augmentStreak||0)*n;
  }
  if(tower.supportDamage>1&&value(s,'forge'))d.range*=1+value(s,'forge')+(level(s,'forge')===4?.02:0);
  return d;
 }
 return {label,activeDescription,hasBuilding,marketDiscount,catalog,rarities,weights,cost,clean,progress,unlocked,slots,tier,describe,buy,fuse,equip,run,level,value,definition};
})();
