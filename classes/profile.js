const HexProfile=(()=>{
  const STORAGE_KEY='hex-bastion-profile-v1';
  const START_TOWERS=['archer','catapult','chain','freeze','mine'];
  const TOWER_UNLOCKS={ballista:{cost:20},flame:{cost:35},element:{cost:45},necromancer:{cost:55}};
  const ULTIMATE_UNLOCKS={element:{cost:35},necromancer:{cost:40},archer:{cost:20},catapult:{cost:20},chain:{cost:20},freeze:{cost:20},mine:{cost:20},ballista:{cost:30},flame:{cost:30}};
  const ULTIMATE_BRANCHES={"archer":["volley","marksman"],"catapult":["siege","barrage"],"chain":["storm","overload"],"freeze":["deepFrost","frostField"],"mine":["demolition","minefield"],"ballista":["harpoon","repeater"],"flame":["inferno","wildfire"],"element":["elementFire","elementWater","elementWind"],"necromancer":["soulChoir","soulKeeper"]};
  function ownsUltimate(profile,type,branch){return profile.unlocks.includes('ultimate:'+type)||profile.unlocks.includes('ultimate:'+type+':'+branch);}
  function activeUltimate(profile,type){const owned=(ULTIMATE_BRANCHES[type]||[]).filter(branch=>ownsUltimate(profile,type,branch));return owned.includes(profile.activeUltimates?.[type])?profile.activeUltimates[type]:owned[0];}
  function runUnlocks(profile){return [...profile.unlocks.filter(id=>!id.startsWith('ultimate:')),...Object.keys(ULTIMATE_BRANCHES).flatMap(type=>{const branch=activeUltimate(profile,type);return branch?['ultimate:'+type+':'+branch]:[];})];}
  function activateUltimate(profile,id,definitions){const [type,branch]=id.split(':');if(!ULTIMATE_BRANCHES[type]?.includes(branch)||!ownsUltimate(profile,type,branch))return null;return save({...profile,activeUltimates:{...profile.activeUltimates,[type]:branch}},definitions);}
  const BUILDING_UNLOCKS={house:{cost:40},forge:{cost:40},market:{cost:40}};
  function unlockBuilding(profile,id,definitions){const clean=normalize(profile,definitions),offer=BUILDING_UNLOCKS[id],key='building:'+id;if(!offer||clean.unlocks.includes(key)||clean.diamonds<offer.cost)return null;return save({...clean,diamonds:clean.diamonds-offer.cost,unlockCosts:{...clean.unlockCosts,[key]:offer.cost},unlocks:[...clean.unlocks,key]},definitions);}
  function affordableUnlocks(profile){return Object.entries(TOWER_UNLOCKS).filter(([id,o])=>!profile.unlockedTowers.includes(id)&&profile.diamonds>=o.cost).length+Object.entries(ULTIMATE_UNLOCKS).reduce((sum,[id,o])=>sum+(profile.unlockedTowers.includes(id)&&profile.diamonds>=o.cost?ULTIMATE_BRANCHES[id].filter(branch=>!ownsUltimate(profile,id,branch)).length:0),0)+Object.entries(BUILDING_UNLOCKS).filter(([id,o])=>!profile.unlocks.includes('building:'+id)&&profile.diamonds>=o.cost).length;}
  function resetValue(profile){let amount=0;for(const [kind,offers] of [['tower',TOWER_UNLOCKS],['ultimate',ULTIMATE_UNLOCKS],['building',BUILDING_UNLOCKS]])for(const [id,offer] of Object.entries(offers)){const key=kind+':'+id,owned=kind==='tower'?profile.unlockedTowers.includes(id):profile.unlocks.includes(key);if(owned){const paid=profile.unlockCosts?.[key];amount+=Number.isFinite(paid)&&paid>=0?paid:offer.cost;}}for(const key of profile.unlocks){const [kind,type,branch]=key.split(':');if(kind==='ultimate'&&ULTIMATE_BRANCHES[type]?.includes(branch))amount+=profile.unlockCosts?.[key]??ULTIMATE_UNLOCKS[type].cost;}return amount;}
  function resetUnlocks(profile,definitions){const clean=normalize(profile,definitions),refund=resetValue(clean);return {refund,profile:save({...clean,diamonds:clean.diamonds+refund,unlockedTowers:[...START_TOWERS],activeLoadout:[...START_TOWERS],loadoutPresets:defaults().loadoutPresets,unlocks:clean.unlocks.filter(id=>!['tower:','ultimate:','building:'].some(prefix=>id.startsWith(prefix))),unlockCosts:{},activeUltimates:{}},definitions)};}
  function heroUnlocked(profile,id){return id==='standard'||id==='builder'&&profile.milestones?.includes('standard35')||id==='merchant'&&profile.milestones?.includes('dual35')||false;}
  function defaults(){const loadout=[...START_TOWERS];return {version:1,activeHero:'standard',diamonds:0,unlockedTowers:loadout,activeLoadout:[...loadout],loadoutPresets:Array.from({length:3},(_,i)=>({name:`Preset ${i+1}`,towers:[...loadout]})),unlocks:[],milestones:[],settledRuns:[],records:{highestWave:0,bossesKilled:0,runsPlayed:0},lifetime:{normalKills:0,diamondsEarned:0,towers:{}}};}
  function validIds(ids,definitions){return [...new Set(Array.isArray(ids)?ids:[])].filter(id=>definitions[id]);}
  function normalize(raw,definitions){
    const base=defaults(),source=raw&&typeof raw==='object'?raw:{};
    let unlocked=validIds(source.unlockedTowers,definitions);
    for(const id of START_TOWERS) if(definitions[id]&&!unlocked.includes(id)) unlocked.push(id);
    let active=validIds(source.activeLoadout,definitions).filter(id=>unlocked.includes(id));
    for(const id of unlocked) if(active.length<5&&!active.includes(id)) active.push(id);
    active=active.slice(0,5);
    const presets=Array.from({length:3},(_,i)=>{const item=source.loadoutPresets?.[i],ids=validIds(item?.towers||item,definitions).filter(id=>unlocked.includes(id));return {name:String(item?.name||`Preset ${i+1}`).slice(0,30),towers:ids.length===5?ids:[...active]};});
    return {...base,...source,duoSettledRuns:Array.isArray(source.duoSettledRuns)?source.duoSettledRuns.filter(id=>typeof id==='string'&&/^[a-f0-9]{64}$/.test(id)):[],version:1,difficulty:source.difficulty==='dual'&&source.milestones?.includes('standard35')?'dual':'normal',activeHero:heroUnlocked(source,source.activeHero)?source.activeHero:'standard',diamonds:Math.max(0,Number(source.diamonds)||0),unlockedTowers:unlocked,activeLoadout:active,
      loadoutPresets:presets,unlocks:[...new Set(Array.isArray(source.unlocks)?source.unlocks:[])],milestones:Array.isArray(source.milestones)?source.milestones:[],settledRuns:Array.isArray(source.settledRuns)?source.settledRuns.slice(-100):[],
      records:{...base.records,...(source.records||{})},lifetime:{...base.lifetime,...(source.lifetime||{}),towers:{...(source.lifetime?.towers||{})}}};
  }
  function load(definitions){
    try{return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'),definitions);}
    catch(error){return normalize(null,definitions);}
  }
  function save(profile,definitions){
    const clean=normalize(profile,definitions);try{localStorage.setItem(STORAGE_KEY,JSON.stringify(clean));}catch(error){}return clean;
  }
  function setLoadout(profile,ids,definitions){
    const selected=validIds(ids,definitions);
    if(selected.length!==5||selected.some(id=>!profile.unlockedTowers.includes(id))) return null;
    return save({...profile,activeLoadout:selected},definitions);
  }
  function renamePreset(profile,index,name,definitions){
    const clean=normalize(profile,definitions);if(!Number.isInteger(index)||index<0||index>=3||typeof name!=='string')return null;
    name=name.trim().replace(/\s+/g,' ').slice(0,30);if(!name)return null;
    return save({...clean,loadoutPresets:clean.loadoutPresets.map((preset,i)=>i===index?{...preset,name}:preset)},definitions);
  }
  function savePreset(profile,index,ids,definitions){
    const clean=normalize(profile,definitions),selected=validIds(ids,definitions);if(index<0||index>2||selected.length!==5||selected.some(id=>!clean.unlockedTowers.includes(id)))return null;
    const presets=clean.loadoutPresets.map((preset,i)=>i===index?{...preset,towers:selected}:preset);return save({...clean,loadoutPresets:presets},definitions);
  }
  function runReward(clean,summary){
    const wave=Math.max(0,Math.floor(Number(summary.wave)||0)),periodic=Math.max(0,Math.floor(Number(summary.periodicBosses)||0)),exploration=Math.max(0,Math.floor(Number(summary.explorationBosses)||0));
    const waveDiamonds=wave>=2?Math.floor(wave/2):0,bossDiamonds=periodic*5+exploration*3,oldBest=Math.max(0,Number(clean.records.highestWave)||0);
    let milestoneDiamonds=0;for(let mark=10;mark<=wave;mark+=10)if(mark>oldBest)milestoneDiamonds+=2;
    const total=waveDiamonds+bossDiamonds+milestoneDiamonds;
    return {wave:waveDiamonds,bosses:bossDiamonds,milestones:milestoneDiamonds,total};
  }
  function settleDuo(profile,receipt,definitions){
    const clean=normalize(profile,definitions);
    if(!receipt||!/^[a-f0-9]{64}$/.test(receipt.id)||!Number.isSafeInteger(receipt.diamonds)||receipt.diamonds<0||receipt.diamonds>100000)throw Error('Ungültige Duo-Abrechnung');
    if(clean.duoSettledRuns.includes(receipt.id))return clean;
    const next=normalize({...clean,diamonds:clean.diamonds+receipt.diamonds,duoSettledRuns:[...clean.duoSettledRuns,receipt.id],lifetime:{...clean.lifetime,diamondsEarned:clean.lifetime.diamondsEarned+receipt.diamonds}},definitions);localStorage.setItem(STORAGE_KEY,JSON.stringify(next));return next;
  }
  function settleRun(profile,summary,definitions){
    const clean=normalize(profile,definitions),runId=String(summary.runId||'');
    if(!runId||clean.settledRuns.includes(runId)) return {profile:clean,reward:{wave:0,bosses:0,milestones:0,total:0,duplicate:true}};
    const reward=runReward(clean,summary),{wave:waveDiamonds,bosses:bossDiamonds,milestones:milestoneDiamonds,total}=reward;
    const wave=Math.max(0,Math.floor(Number(summary.wave)||0)),periodic=Math.max(0,Math.floor(Number(summary.periodicBosses)||0)),exploration=Math.max(0,Math.floor(Number(summary.explorationBosses)||0));
    const oldBest=Math.max(0,Number(clean.records.highestWave)||0);
    const towers={...clean.lifetime.towers};for(const [id,usage] of Object.entries(summary.towers||{})){const old=towers[id]||{builds:0,upgrades:0,runsUsed:0,highestWave:0};towers[id]={builds:old.builds+Math.max(0,usage.builds||0),upgrades:old.upgrades+Math.max(0,usage.upgrades||0),runsUsed:old.runsUsed+(usage.builds>0?1:0),highestWave:Math.max(old.highestWave||0,usage.builds>0?wave:0)};}
    const next={...clean,diamonds:clean.diamonds+total,settledRuns:[...clean.settledRuns,runId].slice(-100),records:{...clean.records,highestWave:Math.max(oldBest,wave),bossesKilled:clean.records.bossesKilled+periodic+exploration,runsPlayed:clean.records.runsPlayed+1},lifetime:{...clean.lifetime,normalKills:clean.lifetime.normalKills+Math.max(0,Math.floor(Number(summary.normalKills)||0)),diamondsEarned:clean.lifetime.diamondsEarned+total,towers}};
    return {profile:save(next,definitions),reward:{wave:waveDiamonds,bosses:bossDiamonds,milestones:milestoneDiamonds,total,duplicate:false}};
  }
  function unlockTower(profile,id,definitions){
    const offer=TOWER_UNLOCKS[id],clean=normalize(profile,definitions);
    if(!offer||!definitions[id]||clean.unlockedTowers.includes(id)||clean.diamonds<offer.cost)return null;
    return save({...clean,diamonds:clean.diamonds-offer.cost,unlockCosts:{...clean.unlockCosts,['tower:'+id]:offer.cost},unlockedTowers:[...clean.unlockedTowers,id],unlocks:[...clean.unlocks,'tower:'+id]},definitions);
  }
  function unlockUltimate(profile,id,definitions){const [type,branch]=id.split(':'),offer=ULTIMATE_UNLOCKS[type],clean=normalize(profile,definitions),key='ultimate:'+id;if(!offer||branch&&!ULTIMATE_BRANCHES[type]?.includes(branch)||!clean.unlockedTowers.includes(type)||(branch?ownsUltimate(clean,type,branch):clean.unlocks.includes(key))||clean.diamonds<offer.cost)return null;return save({...clean,diamonds:clean.diamonds-offer.cost,unlockCosts:{...clean.unlockCosts,[key]:offer.cost},unlocks:[...clean.unlocks,key],activeUltimates:{...clean.activeUltimates,...(!activeUltimate(clean,type)&&branch?{[type]:branch}:{})}},definitions);}
  function settleDaily(profile,day,wave,definitions){
    const clean=normalize(profile,definitions),results={...(clean.dailyResults||{})},old=results[day]||{},won=wave>=20,reward=won&&!old.won?10:0;
    results[day]={best:Math.max(Number(old.best)||0,wave),won:!!old.won||won};
    return {profile:save({...clean,dailyResults:results,diamonds:clean.diamonds+reward,lifetime:{...clean.lifetime,diamondsEarned:clean.lifetime.diamondsEarned+reward}},definitions),reward};
  }
  function exportFile(profile,definitions){return JSON.stringify({format:'autohex-profile',version:1,exportedAt:new Date().toISOString(),profile:normalize(profile,definitions)},null,2);}
  function readFile(text,definitions){
    if(typeof text!=='string'||text.length>2000000)throw new Error('Datei zu groß (maximal 2 MB).');
    let file;try{file=JSON.parse(text,(key,value)=>{if(['__proto__','prototype','constructor'].includes(key))throw new Error();return value;});}catch{throw new Error('Keine gültige Spielstanddatei.');}
    if(file?.format!=='autohex-profile'||file.version!==1||file.profile?.version!==1)throw new Error('Unbekanntes oder neueres Spielstandformat.');
    const p=file.profile;
    if(!Number.isSafeInteger(p.diamonds)||p.diamonds<0||!Array.isArray(p.unlockedTowers)||!Array.isArray(p.activeLoadout)||!Array.isArray(p.unlocks)||!p.records||!p.lifetime)throw new Error('Der Spielstand ist unvollständig oder beschädigt.');
    function check(value,depth=0){if(depth>30)throw new Error('Spielstand zu stark verschachtelt.');if(typeof value==='number'&&(!Number.isFinite(value)||value<0||value>Number.MAX_SAFE_INTEGER))throw new Error('Ungültiger Zahlenwert im Spielstand.');if(value&&typeof value==='object')for(const child of Object.values(value))check(child,depth+1);}
    check(p);
    const invalid=()=>{throw new Error('Ungültige Profildaten.');},object=v=>v&&typeof v==='object'&&!Array.isArray(v),numbers=v=>{if(!object(v)||Object.values(v).some(n=>!Number.isSafeInteger(n)||n<0))invalid();};
    for(const key of ['unlockedTowers','activeLoadout','unlocks','settledRuns','duoSettledRuns'])if(p[key]!==undefined&&(!Array.isArray(p[key])||p[key].some(id=>typeof id!=='string')))invalid();
    numbers(p.records);for(const key of ['highestWave','bossesKilled','runsPlayed'])if(!Number.isSafeInteger(p.records[key]))invalid();
    for(const key of ['normalKills','diamondsEarned'])if(!Number.isSafeInteger(p.lifetime[key]))invalid();
    if(!object(p.lifetime.towers))invalid();for(const entry of Object.values(p.lifetime.towers))numbers(entry);
    if(p.activeUltimates!==undefined&&(!object(p.activeUltimates)||Object.entries(p.activeUltimates).some(([type,branch])=>!ULTIMATE_BRANCHES[type]?.includes(branch))))invalid();
    if(p.unlockCosts!==undefined)numbers(p.unlockCosts);
    if(p.loadoutPresets!==undefined&&(!Array.isArray(p.loadoutPresets)||p.loadoutPresets.some(v=>!object(v)||typeof v.name!=='string'||!Array.isArray(v.towers)||v.towers.some(id=>typeof id!=='string'))))invalid();
    if(p.dailyResults!==undefined){if(!object(p.dailyResults))invalid();for(const [day,result] of Object.entries(p.dailyResults))if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!object(result)||!Number.isSafeInteger(result.best)||result.best<0||typeof result.won!=='boolean')invalid();}
    const allowed=['version','activeHero','difficulty','diamonds','unlockedTowers','activeLoadout','loadoutPresets','unlocks','milestones','settledRuns','records','lifetime','unlockCosts','dailyResults','duoSettledRuns','activeUltimates'];
    return normalize(Object.fromEntries(allowed.filter(key=>p[key]!==undefined).map(key=>[key,p[key]])),definitions);
  }
  function importFile(text,definitions){
    const next=readFile(text,definitions),previous=localStorage.getItem(STORAGE_KEY);
    // Fail visibly before replacing the profile if storage or the backup is unavailable.
    if(previous!==null)localStorage.setItem(STORAGE_KEY+'-before-import',previous);
    localStorage.setItem(STORAGE_KEY,JSON.stringify(next));return next;
  }
  return {ULTIMATE_BRANCHES,ownsUltimate,activeUltimate,runUnlocks,activateUltimate,settleDuo,heroUnlocked,exportFile,readFile,importFile,resetValue,resetUnlocks,affordableUnlocks,BUILDING_UNLOCKS,unlockBuilding,STORAGE_KEY,START_TOWERS,TOWER_UNLOCKS,ULTIMATE_UNLOCKS,defaults,normalize,load,save,setLoadout,renamePreset,savePreset,runReward,settleRun,settleDaily,unlockTower,unlockUltimate};
})();
