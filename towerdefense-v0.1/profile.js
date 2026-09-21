const HexProfile=(()=>{
  const STORAGE_KEY='hex-bastion-profile-v1';
  const START_TOWERS=['archer','catapult','chain','freeze','mine'];
  const TOWER_UNLOCKS={ballista:{cost:20},flame:{cost:35},element:{cost:45},necromancer:{cost:55}};
  const ULTIMATE_UNLOCKS={element:{cost:35},necromancer:{cost:40},archer:{cost:20},catapult:{cost:20},chain:{cost:20},freeze:{cost:20},mine:{cost:20},ballista:{cost:30},flame:{cost:30}};
  const BUILDING_UNLOCKS={house:{cost:40},forge:{cost:40},market:{cost:40}};
  function unlockBuilding(profile,id,definitions){const clean=normalize(profile,definitions),offer=BUILDING_UNLOCKS[id],key='building:'+id;if(!offer||clean.unlocks.includes(key)||clean.diamonds<offer.cost)return null;return save({...clean,diamonds:clean.diamonds-offer.cost,unlockCosts:{...clean.unlockCosts,[key]:offer.cost},unlocks:[...clean.unlocks,key]},definitions);}
  function affordableUnlocks(profile){return Object.entries(TOWER_UNLOCKS).filter(([id,o])=>!profile.unlockedTowers.includes(id)&&profile.diamonds>=o.cost).length+Object.entries(ULTIMATE_UNLOCKS).filter(([id,o])=>profile.unlockedTowers.includes(id)&&!profile.unlocks.includes('ultimate:'+id)&&profile.diamonds>=o.cost).length+Object.entries(BUILDING_UNLOCKS).filter(([id,o])=>!profile.unlocks.includes('building:'+id)&&profile.diamonds>=o.cost).length;}
  function resetValue(profile){let amount=0;for(const [kind,offers] of [['tower',TOWER_UNLOCKS],['ultimate',ULTIMATE_UNLOCKS],['building',BUILDING_UNLOCKS]])for(const [id,offer] of Object.entries(offers)){const key=kind+':'+id,owned=kind==='tower'?profile.unlockedTowers.includes(id):profile.unlocks.includes(key);if(owned){const paid=profile.unlockCosts?.[key];amount+=Number.isFinite(paid)&&paid>=0?paid:offer.cost;}}return amount;}
  function resetUnlocks(profile,definitions){const clean=normalize(profile,definitions),refund=resetValue(clean);return {refund,profile:save({...clean,diamonds:clean.diamonds+refund,unlockedTowers:[...START_TOWERS],activeLoadout:[...START_TOWERS],loadoutPresets:defaults().loadoutPresets,unlocks:clean.unlocks.filter(id=>!['tower:','ultimate:','building:'].some(prefix=>id.startsWith(prefix))),unlockCosts:{}},definitions)};}
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
    return {...base,...source,version:1,difficulty:source.difficulty==='dual'?'dual':'normal',activeHero:['standard','builder','merchant'].includes(source.activeHero)?source.activeHero:'standard',diamonds:Math.max(0,Number(source.diamonds)||0),unlockedTowers:unlocked,activeLoadout:active,
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
  function unlockUltimate(profile,id,definitions){const offer=ULTIMATE_UNLOCKS[id],clean=normalize(profile,definitions),key='ultimate:'+id;if(!offer||!clean.unlockedTowers.includes(id)||clean.unlocks.includes(key)||clean.diamonds<offer.cost)return null;return save({...clean,diamonds:clean.diamonds-offer.cost,unlockCosts:{...clean.unlockCosts,[key]:offer.cost},unlocks:[...clean.unlocks,key]},definitions);}
  function settleDaily(profile,day,wave,definitions){
    const clean=normalize(profile,definitions),results={...(clean.dailyResults||{})},old=results[day]||{},won=wave>=20,reward=won&&!old.won?10:0;
    results[day]={best:Math.max(Number(old.best)||0,wave),won:!!old.won||won};
    return {profile:save({...clean,dailyResults:results,diamonds:clean.diamonds+reward,lifetime:{...clean.lifetime,diamondsEarned:clean.lifetime.diamondsEarned+reward}},definitions),reward};
  }
  return {resetValue,resetUnlocks,affordableUnlocks,BUILDING_UNLOCKS,unlockBuilding,STORAGE_KEY,START_TOWERS,TOWER_UNLOCKS,ULTIMATE_UNLOCKS,defaults,normalize,load,save,setLoadout,savePreset,runReward,settleRun,settleDaily,unlockTower,unlockUltimate};
})();
