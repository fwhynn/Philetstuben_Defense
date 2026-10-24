/* Seeded offers and consumable inventory for the tower-draft daily. */
const HexTowerDraft=(()=>{
 const types=['archer','catapult','ballista','chain','freeze','mine','flame','necromancer'];
 const planning=s=>s.challengeKind==='towerDraft'&&s.hp>0&&s.phase==='build'&&!s.waveRunning&&!s.celebrationActive;
 function initialize(s){
  // Use the proven fixed winding road; this mission has no electricity system.
  HexPowerGrid.initialize(s);for(const [id,t]of s.map)if(t.type==='buildingPlot')s.map.delete(id);delete s.powerGrid;
  s.gold=0;s.towerLoadout=[...types];s.towerDraft={preparedWave:-1,picks:0,serial:0,offers:[],inventory:{},upgrades:0};
 }
 function eligible(s){return [...s.map.values()].some(t=>(t.towers||[]).some(tw=>tw&&HexData.availableUpgrades(tw).length));}
 function offer(s){
  const d=s.towerDraft,r=HexRandom.create(s.seed+'|draft|'+s.wave+'|'+d.serial++);
  const pool=s.wave===0?types.filter(t=>t!=='freeze'):types;
  const shuffled=pool.map(t=>({t,n:r()})).sort((a,b)=>a.n-b.n).map(x=>x.t);
  d.offers=shuffled.slice(0,3).map(type=>({kind:'tower',type}));
  if(s.wave>0&&eligible(s)&&d.upgrades<2)d.offers[2]={kind:'upgrade'};
  if(s.wave>0&&s.hp<20&&s.wave%3===0)d.offers[1]={kind:'repair'};
 }
 function prepare(s){const d=s.towerDraft;s.phase='build';s.hand=[];s.drawPile=[];s.discard=[];if(d.preparedWave!==s.wave){d.preparedWave=s.wave;d.picks=s.wave===0?3:1;offer(s);}return 'ready';}
 function choose(s,index){const d=s.towerDraft;if(!planning(s)||!d.picks||!Number.isInteger(index)||index<0||index>=d.offers.length)return false;const o=d.offers[index];
  if(o.kind==='tower')d.inventory[o.type]=(d.inventory[o.type]||0)+1;
  else if(o.kind==='upgrade'){if(!eligible(s))return false;d.upgrades++;}
  else if(o.kind==='repair')s.hp=Math.min(20,s.hp+5);else return false;
  d.picks--;d.offers=[];if(d.picks)offer(s);return true;
 }
 const canBuild=(s,type,count=1)=>planning(s)&&Number.isSafeInteger(count)&&count>0&&(s.towerDraft.inventory[type]||0)>=count;
 const canUpgrade=s=>planning(s)&&s.towerDraft.upgrades>0;
 return {initialize,prepare,choose,planning,canBuild,canUpgrade,eligible,types};
})();
