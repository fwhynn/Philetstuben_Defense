/* Four successive destinations; the same fortress health and tower objects survive each move. */
const HexMovingFortress=(()=>{
 const planning=s=>s.challengeKind==='movingFortress'&&s.hp>0&&s.phase==='build'&&!s.waveRunning&&!s.celebrationActive;
 function initialize(s){
  Object.assign(s,{gold:150,income:0,difficulty:'normal',openingRemaining:0,baseExits:[0],landmarks:new Map(),vision:[],deck:[],drawPile:[],discard:[],hand:[],phase:'build',consumablesLocked:true});
  s.map=new Map();s.movingFortress={stage:0,preparedWave:-1,relocation:false,stations:[]};
  for(let i=0;i<4;i++){
   const q=-2*i,r=8*i,station={q,r,name:'Station '+(i+1),path:[]};s.movingFortress.stations.push(station);
   s.map.set(HexMap.key(q,r),{q,r,type:i===0?'base':'empty',roads:[0],slots:0,towers:[],buildingSlots:0,buildings:[],income:0,fortressStation:i});
   const patterns=[[0,0,0,5,5,0,1,0],[0,0,0,1,1,0,5,0],[0,0,0,5,0,1,1,0],[0,0,0,1,0,5,5,0]],directions=patterns[(i+(s.dailyVariant||0))%4];let p={q,r};
   for(let n=0;n<directions.length;n++){
    p=HexMap.neighbor(p.q,p.r,directions[n]);station.path.push({...p});const roads=[HexMap.OPP(directions[n]),directions[n+1]??0];let type='straight',rotation=0;
    for(const id of ['straight','smallCurve','bigCurve'])for(let rot=0;rot<6;rot++)if(HexMap.rotatedRoads(HexData.CARD_LIBRARY[id],rot).slice().sort().join()===roads.slice().sort().join()){type=id;rotation=rot;}
    const slots=HexData.CARD_LIBRARY[type].slots;station.path[station.path.length-1].slots=slots;
    s.map.set(HexMap.key(p.q,p.r),{...p,type,roads,rotation,slots,towers:Array(slots).fill(null),buildingSlots:0,buildings:[],income:0,fortressLane:i});
   }
  }
 }
 function target(s){const g=s.movingFortress.stations[s.movingFortress.stage];return HexMap.key(g.q,g.r);}
 function prepare(s){
  const f=s.movingFortress;s.phase='build';s.hand=[];
  if(f.preparedWave===s.wave)return 'ready';
  const stage=Math.min(3,Math.floor(s.wave/3));f.relocation=stage!==f.stage;
  if(f.relocation){
   s.map.get(target(s)).type='empty';f.stage=stage;s.map.get(target(s)).type='base';
   s.buildingVersion=(s.buildingVersion||0)+1;s.selectedBase=false;s.selectedTower=null;s.selectedTowers=[];s.selectedSlot=null;s.selectedSlots=[];s.villageMove=null;
   // Combat is over before changing destinations. No projectile or mine may carry into a new route.
   s.enemies=[];s.enemyZones=[];s.splitChildren=[];s.spawnQueue=[];s.pendingSpawns=0;s.mines=[];s.projectiles=[];
  }
  f.preparedWave=s.wave;return 'ready';
 }
 function sources(s){
  const g=s.movingFortress.stations[s.movingFortress.stage],id=target(s),routes=HexMap.routeGraph(s.map,id),tile=s.map.get(HexMap.key(g.path?.at(-1)?.q??g.q+8,g.path?.at(-1)?.r??g.r)),center=HexMap.axialToWorld(tile.q,tile.r);
  return [{tile,dir:0,target:id,routes,points:[HexMap.edgePoint(center.x,center.y,0,1.02),...routes.geometry.get(HexMap.key(tile.q,tile.r)).legs.get(0).slice().reverse()]}];
 }
 function move(s,from,to){
  if(!planning(s)||!s.movingFortress.relocation)return false;
  const valid=x=>x&&Number.isInteger(x.q)&&Number.isInteger(x.r)&&Number.isInteger(x.index)&&x.index>=0;
  if(!valid(from)||!valid(to))return false;
  const a=s.map.get(HexMap.key(from.q,from.r)),b=s.map.get(HexMap.key(to.q,to.r)),tw=a?.towers?.[from.index];
  if(!tw||tw.guestOwner!==undefined||!b||to.index>=b.slots||b.towers[to.index]||b.fortressLane!==s.movingFortress.stage)return false;
  a.towers[from.index]=null;b.towers[to.index]=tw;tw.tileType=b.type;tw.biome=HexBiomes.forTile(s,b);
  const detail=s.runTowerDetails[tw.statId];if(detail)Object.assign(detail,{q:to.q,r:to.r,index:to.index});HexBuildings.refresh(s);return true;
 }
 return {initialize,prepare,target,sources,planning,move};
})();
