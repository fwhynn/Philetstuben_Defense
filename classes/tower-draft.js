/* Seeded offers and consumable inventory for the tower-draft daily. */
const HexTowerDraft=(()=>{
 const types=['archer','catapult','ballista','chain','freeze','mine','flame','necromancer'];
 const building=s=>s.challengeKind==='towerDraft'&&s.hp>0&&['build','wave'].includes(s.phase)&&!s.celebrationActive;
 const planning=s=>s.challengeKind==='towerDraft'&&s.hp>0&&s.phase==='build'&&!s.waveRunning&&!s.celebrationActive;
 function initialize(s){
  // Use the proven fixed winding road; this mission has no electricity system.
  HexPowerGrid.initialize(s);for(const [id,t]of s.map)if(t.type==='buildingPlot')s.map.delete(id);delete s.powerGrid;
  s.gold=0;s.towerLoadout=[...types];s.towerDraft={preparedWave:-1,picks:0,serial:0,offers:[],inventory:{},upgrades:0,mapStages:[],rulesVersion:4};grow(s,0);
 }
 function grow(s,stage){
  const d=s.towerDraft;d.mapStages??=[];if(d.mapStages.includes(stage))return;
  const random=HexRandom.create(s.seed+'|draft-map|'+stage);
  for(let step=0;step<(d.rulesVersion>=3?1:2);step++){
    const sources=HexRunRuntime.spawnSources(s),source=sources[sources.length-1];if(!source||source.dir===6)break;
    const previous=source.tile,p=HexMap.neighbor(previous.q,previous.r,source.dir);
    const choices=[source.dir,(source.dir+1)%6,(source.dir+5)%6].filter(dir=>{if(d.rulesVersion>=3&&![0,1,5].includes(dir))return false;const n=HexMap.neighbor(p.q,p.r,dir);return !s.map.has(HexMap.key(n.q,n.r));});
    const dir=choices[Math.floor(random()*choices.length)];if(dir===undefined)break;
    const roads=[HexMap.OPP(source.dir),dir];let type='straight',rotation=0;
    for(const id of ['straight','smallCurve','bigCurve'])for(let rot=0;rot<6;rot++)if(HexMap.rotatedRoads(HexData.CARD_LIBRARY[id],rot).slice().sort().join()===roads.slice().sort().join()){type=id;rotation=rot;}
    const slots=HexData.CARD_LIBRARY[type].slots||0;
    s.map.set(HexMap.key(p.q,p.r),{...p,type,rotation,roads,slots,towers:Array(slots).fill(null),buildingSlots:0,buildings:[],income:0});
  }
  d.mapStages.push(stage);
 }
 function eligible(s){return [...s.map.values()].some(t=>(t.towers||[]).some(tw=>tw&&HexData.availableUpgrades(tw).length));}
 function offer(s){
  const d=s.towerDraft,r=HexRandom.create(s.seed+'|draft|'+s.wave+'|'+d.serial++);
  const pool=s.wave===0?types.filter(t=>t!=='freeze'):types;
  const shuffled=pool.map(t=>({t,n:r()})).sort((a,b)=>a.n-b.n).map(x=>x.t);
  d.offers=shuffled.slice(0,3).map(type=>({kind:'tower',type}));
  if(d.rulesVersion>=3&&s.wave>0){
    const weighted=[...types.map(type=>({kind:'tower',type})),...Array.from({length:3},()=>({kind:'upgrade',count:s.wave>=24?3:s.wave>=12?2:1}))];
    if(d.rulesVersion>=4){
      // Draw without replacement across offers: every tower appears before a new bag starts.
      // Three ticket entries retain their weight; duplicate choices never waste an offer.
      if(s.hp<20)weighted.push({kind:'repair'});
      d.offers=[];d.offerBag??=[];
      while(d.offers.length<3){
        d.offerBag=d.offerBag.filter(o=>o.kind!=='repair'||s.hp<20);
        const unique=o=>!d.offers.some(x=>x.kind===o.kind&&x.type===o.type);
        if(!d.offerBag.some(unique))d.offerBag=weighted.map(o=>({...o}));
        const candidates=d.offerBag.map((o,i)=>({o,i})).filter(x=>unique(x.o)),selected=candidates[Math.floor(r()*candidates.length)];
        d.offerBag.splice(selected.i,1);d.offers.push({...selected.o,...(selected.o.kind==='upgrade'?{count:s.wave>=24?3:s.wave>=12?2:1}:{})});
      }
    }else{d.offers=[];while(d.offers.length<3){const index=Math.floor(r()*weighted.length);d.offers.push(weighted.splice(index,1)[0]);}}
    if(d.rulesVersion>=4){
      // Weighted tickets remain optional, but no random run can go indefinitely without an offer.
      d.upgradeMisses=d.offers.some(o=>o.kind==='upgrade')?0:(d.upgradeMisses||0)+1;
      if(d.upgradeMisses>=3){d.offerBag.push(d.offers[2]);const ticket=d.offerBag.findIndex(o=>o.kind==='upgrade');if(ticket>=0)d.offerBag.splice(ticket,1);d.offers[2]={kind:'upgrade',count:s.wave>=24?3:s.wave>=12?2:1};d.upgradeMisses=0;}
    }
  }else if(d.rulesVersion<3&&s.wave>0&&eligible(s)&&d.upgrades<2)d.offers[2]={kind:'upgrade',count:s.wave>=24?3:s.wave>=12?2:1};
  if(d.rulesVersion<4&&s.wave>0&&s.hp<20&&s.wave%3===0)d.offers[1]={kind:'repair'};
  if(d.rulesVersion>=4&&s.wave===0){
    const single=['archer','ballista'],area=['catapult','chain','mine','flame'];
    if(!d.offers.some(o=>single.includes(o.type)))d.offers[0]={kind:'tower',type:single[Math.floor(r()*single.length)]};
    if(!d.offers.some(o=>area.includes(o.type)))d.offers[1]={kind:'tower',type:area[Math.floor(r()*area.length)]};
  }
 }
 function prepare(s){const d=s.towerDraft;s.phase='build';s.hand=[];s.drawPile=[];s.discard=[];if(d.preparedWave!==s.wave){if(s.wave>0&&(d.rulesVersion>=3||s.wave%(d.rulesVersion===2?5:3)===0))grow(s,s.wave);d.preparedWave=s.wave;d.picks=s.wave===0?3:s.wave%2===0?1:0;if(d.picks)offer(s);else d.offers=[];}return 'ready';}
 function choose(s,index){const d=s.towerDraft;if(!planning(s)||!d.picks||!Number.isInteger(index)||index<0||index>=d.offers.length)return false;const o=d.offers[index];
  if(o.kind==='tower')d.inventory[o.type]=(d.inventory[o.type]||0)+1;
  else if(o.kind==='upgrade'){if(d.rulesVersion<3&&!eligible(s))return false;d.upgrades+=o.count||1;}
  else if(o.kind==='repair')s.hp=Math.min(20,s.hp+5);else return false;
  d.picks--;d.offers=[];if(d.picks)offer(s);return true;
 }
 const canBuild=(s,type,count=1)=>building(s)&&Number.isSafeInteger(count)&&count>0&&(s.towerDraft.inventory[type]||0)>=count;
 const canUpgrade=s=>s.challengeKind==='towerDraft'&&s.hp>0&&!s.celebrationActive&&['build','wave'].includes(s.phase)&&s.towerDraft.upgrades>0;
 return {initialize,prepare,choose,planning,building,canBuild,canUpgrade,eligible,types};
})();
