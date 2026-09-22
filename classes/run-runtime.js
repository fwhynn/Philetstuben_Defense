/* DOM-free simulation foundations shared by local play and the future Duo server.
 * Persist queue entries as JSON; callbacks belong to the adapter, never the state.
 */
const HexRunRuntime=(()=>{
  const VERSION=1;
  function create({seed,runId,loadout,unlocks=[],heroId='standard',difficulty='normal',challengeDay=null}){
    if(typeof seed!=='string'||!seed||typeof runId!=='string'||!runId)throw new Error('Seed and run ID required');
    if(!Array.isArray(loadout)||loadout.length!==5||new Set(loadout).size!==5||loadout.some(id=>!Object.hasOwn(HexData.TOWERS,id)))throw new Error('Invalid run loadout');
    if(challengeDay){difficulty='dual';heroId='standard';}
    const state={hp:20,gold:HexWaves.economy.startGold,wave:0,goldEarned:{kills:0,completion:0,income:0},waveKills:0,map:new Map(),deck:['straight','straight','smallCurve','bigCurve','tee'],drawPile:[],discard:[],hand:[],phase:'place',enemies:[],mines:[],projectiles:[],waveRunning:false,bossRewards:[],towerLoadout:[...loadout],buildingUnlocks:unlocks.filter(id=>id.startsWith('building:')),ultimateUnlocks:unlocks.filter(id=>id.startsWith('ultimate:')),runTowerStats:{},runTowerDetails:{},nextTowerStatId:0,runId,earnedMeta:{normalKills:0,periodicBosses:0,explorationBosses:0},metaSettled:false,income:0,nextEnemyId:1,pendingSpawns:0,elapsedMs:0,spawnQueue:[],seed,challengeDay,biomeSeed:challengeDay?null:seed};
    if(challengeDay){state.deck=['straight','straight','longRoad','treasury','village'];state.ultimateUnlocks=[];state.buildingUnlocks=[];state.towerLoadout=['archer','ballista','catapult','mine','freeze'];}
    state.difficulty=difficulty==='dual'?'dual':'normal';state.openingRemaining=state.difficulty==='dual'?2:0;
    state.baseExits=state.difficulty==='dual'?HexMap.randomBaseExits(HexRandom.create(seed+'|base-exits')):[0];HexHeroes.initialize(state,heroId);delete state.selectedBase;
    state.landmarks=HexExploration.create(HexRandom.create(seed+'|exploration'));
    state.vision=HexExploration.expand(state.landmarks,new Map([['0,0',{q:0,r:0}]]));
    state.map.set('0,0',{q:0,r:0,type:'base',roads:state.baseExits,slots:0,towers:[],income:0});
    return {state,random:HexRandom.create(seed)};
  }
  function schedule(state,sources,enemies,spacing=20){
    if(!sources.length)throw new Error('Spawn sources required');
    let due=state.elapsedMs;
    state.spawnQueue=enemies.map((enemy,index)=>{
      if(index>0)due+=Math.max(320,spacing/enemy.speed*1000);
      const source=sources[index%sources.length];
      return {due,index,source:{q:source.tile.q,r:source.tile.r,dir:source.dir}};
    });
    state.pendingSpawns=state.spawnQueue.length;
  }
  function drain(state,time,spawn){
    if(!state.waveRunning)return;
    while(state.spawnQueue.length&&state.spawnQueue[0].due<=time){
      const job=state.spawnQueue[0];
      spawn(job);
      state.spawnQueue.shift();state.pendingSpawns=state.spawnQueue.length;
    }
  }
  const {key,neighbor,axialToWorld,edgePoint}=HexMap;
  function spawnSources(state){
    const routes=HexMap.routeGraph(state.map),sources=[];
    for(const tile of state.map.values()){
      const id=key(tile.q,tile.r);if(tile.type==='base'||!routes.distances.has(id)) continue;
      if(tile.type==='deadEnd'&&tile.buildings?.some(b=>b?.type==='portal'))sources.push({tile,dir:6,points:[routes.geometry.get(id).hub],routes,branchCounts:new Map()});
      for(const d of tile.roads||[]){
        const n=neighbor(tile.q,tile.r,d);if(state.map.has(key(n.q,n.r))) continue;
        const c=axialToWorld(tile.q,tile.r),spawn=edgePoint(c.x,c.y,d,1.02);
        const points=[spawn,...routes.geometry.get(id).legs.get(d).slice().reverse()];
        sources.push({tile,dir:d,points,routes,branchCounts:new Map()});
      }
    }
    return sources;
  }
  function nextSourcePoints(state,random,source){
    if(source.routes){
      const points=source.points.slice(),{graph}=source.routes,visited=new Set();
      let current=key(source.tile.q,source.tile.r);
      while(current!==key(0,0)){
        visited.add(current);
        const canReachBase=start=>{const queue=[start],seen=new Set(visited);seen.add(start);for(let i=0;i<queue.length;i++){const id=queue[i];if(id===key(0,0))return true;for(const edge of graph.get(id)||[])if(!seen.has(edge.next)){seen.add(edge.next);queue.push(edge.next);}}return false;};
        const choices=(graph.get(current)||[]).filter(edge=>!visited.has(edge.next)&&canReachBase(edge.next));
        if(!choices.length)return [];
        const edge=choices[Math.floor(random()*choices.length)];points.push(...edge.points.slice(1));current=edge.next;
      }
      return points;
    }
    return [];
  }


  function spawnEnemy(state,points,idx){
    if(state.hp<=0) return;
    const plan=HexWaves.plan(state.wave,state.income,!!state.challengeDay),profile=plan.enemies[idx||0],hp=profile.hp;
    const start=points[0];
    state.enemies.push({id:state.nextEnemyId++,...profile,points,index:0,t:0,hp,maxHp:hp,maxArmorHp:profile.armorHp||0,maxMagicHp:profile.magicHp||0,alive:true,x:start.x,y:start.y});
  }

  function advance(state,random,dt,emit=()=>{}){
    if(!Number.isFinite(dt)||dt<0)throw new Error('Invalid simulation delta');
    if(!state.waveRunning)return 'idle';
    state.elapsedMs+=dt*1000;const time=state.elapsedMs;let sources;
    drain(state,time,job=>{sources??=spawnSources(state);const source=sources.find(s=>s.tile.q===job.source.q&&s.tile.r===job.source.r&&s.dir===job.source.dir);if(!source)throw new Error('Spawn source missing');spawnEnemy(state,nextSourcePoints(state,random,source),job.index);});
    for(const boss of [...state.enemies]){if(!boss.alive||!boss.summonInterval||(boss.summoned||0)>=boss.summonLimit)continue;boss.nextSummonAt??=time+boss.summonInterval;if(time<boss.nextSummonAt)continue;boss.nextSummonAt=time+boss.summonInterval;boss.summoned=(boss.summoned||0)+1;const hp=Math.round(boss.maxHp*.025);state.projectiles.push({kind:'blast',x:boss.x,y:boss.y,r:24,ttl:1,max:1,color:'#c598ff'});state.enemies.push({id:state.nextEnemyId++,type:'swarm',name:'Seelendiener',summoned:true,hp,maxHp:hp,armorHp:0,magicHp:0,speed:boss.speed*.8,killGold:0,baseDamage:1,alive:true,points:boss.points.map(p=>({...p})),index:boss.index,t:boss.t,x:boss.x,y:boss.y});}
    const refs=[];for(const tile of state.map.values()){const slots=HexMap.slotPositions(tile);(tile.towers||[]).forEach((tw,i)=>{if(tw)refs.push({tw,pos:slots[i],tile});});}
    const base=HexHeroes.combatRef(state);if(base)refs.push(base);
    HexCombat.step(state,refs,HexData.TOWERS,dt,time,emit);
    return state.hp<=0?'defeat':state.pendingSpawns===0&&state.enemies.length===0?'complete':'running';
  }
  function rescueTunnel(state){
    if(state.phase!=='build'||state.waveRunning||state.hp<=0)return false;
    const plan=HexMap.tunnelPlan(state.map,state.landmarks);if(!plan)return false;
    const id=key(plan.q,plan.r),source=state.map.get(plan.source),number=state.nextTunnelId=(state.nextTunnelId||0)+1;
    source.tunnels??=[];source.tunnels.push(id);source.tunnelLabel='Tunnel '+number;
    state.map.set(id,{q:plan.q,r:plan.r,type:'rescueTunnel',roads:[plan.dir],rotation:plan.dir,slots:0,towers:[],buildingSlots:0,buildings:[],income:0,tunnels:[plan.source],tunnelLabel:'Tunnel '+number});
    state.vision=HexExploration.expand(state.landmarks,state.map);state.tunnelOffer=null;state.tunnelConfirmed=false;return true;
  }
  return {rescueTunnel,VERSION,create,schedule,drain,spawnSources,nextSourcePoints,spawnEnemy,advance};
})();
