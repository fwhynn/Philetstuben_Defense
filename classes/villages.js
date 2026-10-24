/* Three independent goals on a fixed daily map; no UI or persistence dependencies. */
const HexVillages=(()=>{
  const names=['Norddorf','Mitteldorf','Süddorf'];
  function targets(wave){
    const n=Math.max(0,Math.floor(wave)-1);
    if(n<6)return [n%3];
    if(n<9)return [[0,1],[1,2],[0,2]][n-6];
    return [0,1,2];
  }
  function initialize(state){
    Object.assign(state,{gold:180,income:0,hp:45,maxHp:45,difficulty:'normal',openingRemaining:0,baseExits:[0],landmarks:new Map(),vision:[],deck:[],drawPile:[],discard:[],hand:[],phase:'build',consumablesLocked:true});
    state.villages={goals:[],preparedWave:-1,moves:0,layoutVersion:2,entrances:[{q:10,r:-3,dir:1},{q:10,r:-1,dir:0},{q:9,r:1,dir:0}]};state.map=new Map();
    for(let i=0;i<3;i++){
      const q=(i-1)*-2,r=(i-1)*4;
      const goal={id:i,name:names[i],q,r,hp:15,maxHp:15};state.villages.goals.push(goal);
      state.map.set(HexMap.key(q,r),{q,r,type:'base',roads:[0],slots:0,towers:[],buildingSlots:0,buildings:[],income:0,villageId:i});
      for(let j=1;j<=4;j++)state.map.set(HexMap.key(q+j,r),{q:q+j,r,type:'empty',rotation:0,roads:[],slots:2,towers:[null,null],buildingSlots:0,buildings:[],income:0});
    }
    // Three winding approaches meet at a shared junction, then branch to three entrances.
    const paths=[[[2,-4],[3,-4],[4,-4],[5,-4],[6,-4],[6,-3],[6,-2],[7,-2]],[[0,0],[1,0],[2,0],[3,0],[4,0],[5,-1],[6,-2]], [[-2,4],[-1,4],[0,4],[1,4],[2,4],[3,3],[4,2],[5,1],[6,0],[7,-1],[7,-2]],[[7,-2],[8,-2],[9,-2],[9,-1],[8,0],[8,1],[9,1]],[[9,-2],[10,-3]],[[9,-1],[10,-1]]];
    function tile(q,r){const k=HexMap.key(q,r);if(!state.map.has(k))state.map.set(k,{q,r,type:'villageRoad',roads:[],slots:2,towers:[null,null],buildingSlots:0,buildings:[],income:0});return state.map.get(k);}
    for(const path of paths)for(let i=1;i<path.length;i++){const [q,r]=path[i-1],[nq,nr]=path[i],a=tile(q,r),b=tile(nq,nr),d=Array.from({length:6},(_,d)=>d).find(d=>{const n=HexMap.neighbor(q,r,d);return n.q===nq&&n.r===nr;});if(d===undefined)throw Error('Invalid village road');if(!a.roads.includes(d))a.roads.push(d);if(!b.roads.includes(HexMap.OPP(d)))b.roads.push(HexMap.OPP(d));}
    for(const e of state.villages.entrances)tile(e.q,e.r).roads.push(e.dir);
    for(const t of state.map.values())if(t.type!=='base'){
      let match=null;
      for(const id of ['empty','smallCurve','bigCurve','tee','tJunction','cross','fullCross'])for(let rotation=0;rotation<6;rotation++)if(!match&&HexMap.rotatedRoads(HexData.CARD_LIBRARY[id],rotation).sort().join()===t.roads.slice().sort().join())match={id,rotation};
      t.type=match?.id||'rescue';t.rotation=match?.rotation||0;t.slots=match?HexData.CARD_LIBRARY[t.type].slots:0;t.towers=Array(t.slots).fill(null);
    }
    // Extra tower islands change daily without rotating north away from the top.
    const rng=HexRandom.create(state.seed+'|village-sites'),candidates=[[5,-3],[7,-3],[5,0],[6,1],[3,2],[8,-3],[4,3],[1,-1]];
    for(let n=0;n<3;n++){const i=Math.floor(rng()*candidates.length),[q,r]=candidates.splice(i,1)[0],key=HexMap.key(q,r);if(!state.map.has(key))state.map.set(key,{q,r,type:'empty',roads:[],slots:1,towers:[null],buildingSlots:0,buildings:[],income:0});}
  }
  function planning(state){return state.challengeKind==='villages'&&state.hp>0&&state.phase==='build'&&!state.waveRunning&&!state.celebrationActive;}
  function prepare(state){
    if(state.villages.preparedWave!==state.wave){state.villages.preparedWave=state.wave;state.villages.moves=2;}
    state.hand=[];state.phase='build';return 'ready';
  }
  function sources(state){
    const wave=state.waveRunning?state.wave:state.wave+1;
    return targets(wave).map(id=>{
      const goal=state.villages.goals[id],entrance=state.villages.entrances?.[id]||{q:goal.q+6,r:goal.r,dir:0},target=HexMap.key(goal.q,goal.r),routes=HexMap.routeGraph(state.map,target),tile=state.map.get(HexMap.key(entrance.q,entrance.r)),center=HexMap.axialToWorld(tile.q,tile.r),dir=entrance.dir;
      return {tile,dir,villageId:id,target,routes,points:[HexMap.edgePoint(center.x,center.y,dir,1.02),...routes.geometry.get(HexMap.key(tile.q,tile.r)).legs.get(dir).slice().reverse()]};
    });
  }
  function damage(state,id,amount){
    const goal=state.villages.goals.find(v=>v.id===id);
    if(!goal)throw new Error('Enemy has no village target');
    goal.hp=Math.max(0,goal.hp-Math.max(0,amount));state.hp=state.villages.goals.some(v=>v.hp<=0)?0:state.villages.goals.reduce((sum,v)=>sum+v.hp,0);
  }
  function slot(state,s){
    if(!s||!Number.isInteger(s.q)||!Number.isInteger(s.r)||!Number.isInteger(s.index)||s.index<0)return null;
    const tile=state.map.get(HexMap.key(s.q,s.r));return tile&&s.index<tile.slots?tile:null;
  }
  function move(state,from,to){
    if(!planning(state)||state.villages.moves<=0)return false;
    const source=slot(state,from),dest=slot(state,to),tower=source?.towers[from.index];
    if(!tower||!dest||dest.towers[to.index]||tower.guestOwner!==undefined)return false;
    source.towers[from.index]=null;dest.towers[to.index]=tower;state.villages.moves--;
    tower.tileType=dest.type;tower.biome=HexBiomes.forTile(state,dest);
    const detail=state.runTowerDetails?.[tower.statId];if(detail)Object.assign(detail,{q:to.q,r:to.r,index:to.index});
    HexBuildings.refresh(state);return true;
  }
  function markers(state){
    if(!state.villages||state.hp<=0||['gameover','victory'].includes(state.phase))return [];
    const wave=state.waveRunning?state.wave:state.wave+1;
    return targets(wave).flatMap(id=>{const g=state.villages.goals[id],e=state.villages.entrances?.[id]||{q:g.q+6,r:g.r,dir:0},p=HexMap.axialToWorld(e.q,e.r),edge=HexMap.edgePoint(p.x,p.y,e.dir,1.1),goal=HexMap.axialToWorld(g.q,g.r);return [{id:'spawn'+id,...edge,text:'⚔ '+(state.waveRunning?'Angriff':'Nächster Angriff')+' → '+g.name},{id:'goal'+id,...goal,text:'⚑ '+g.name+' · Ziel Welle '+wave}];});
  }
  return {names,targets,initialize,planning,prepare,sources,damage,move,markers};
})();
