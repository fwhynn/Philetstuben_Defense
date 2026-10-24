/* Deterministic connected components and fixed per-wave power allocation. */
const HexPowerGrid=(()=>{
  function initialize(state){
    Object.assign(state,{gold:150,income:0,difficulty:'normal',openingRemaining:0,baseExits:[0],landmarks:new Map(),vision:[],deck:[],drawPile:[],discard:[],hand:[],phase:'build',consumablesLocked:true});
    state.map=new Map([['0,0',{q:0,r:0,type:'base',roads:[0],slots:0,towers:[],buildingSlots:0,buildings:[],income:0}]]);
    const nodes=[{key:'0,0',name:'Generator A',capacity:3}],directions=[0,0,0,5,5,3,3,3,5,5,0,0];let p={q:0,r:0};
    for(let i=0;i<directions.length;i++){
      p=HexMap.neighbor(p.q,p.r,directions[i]);const roads=[HexMap.OPP(directions[i]),directions[i+1]??directions[i]];
      let type='straight',rotation=0;
      for(const id of ['straight','smallCurve','bigCurve'])for(let rot=0;rot<6;rot++)if(HexMap.rotatedRoads(HexData.CARD_LIBRARY[id],rot).slice().sort().join()===roads.slice().sort().join()){type=id;rotation=rot;}
      const key=HexMap.key(p.q,p.r),slots=HexData.CARD_LIBRARY[type].slots||0;
      state.map.set(key,{...p,type,rotation,roads,slots,towers:Array(slots).fill(null),buildingSlots:0,buildings:[],income:0});
      nodes.push({key,name:i===11?'Generator B':'Leitfeld '+(i+1),capacity:i===11?3:0});
    }
    for(const [q,r,name] of [[1,1,'Relais Nord'],[1,3,'Relais Süd']]){
      const key=HexMap.key(q,r);state.map.set(key,{q,r,type:'buildingPlot',roads:[],slots:0,towers:[],buildingSlots:0,buildings:[],income:0});nodes.push({key,name,capacity:0});
    }
    state.powerGrid={version:2,nodes,enabled:[nodes[1].key,nodes[2].key,nodes[10].key,nodes[11].key],limit:6,battlePowerIds:[]};
  }
  const planning=state=>state.challengeKind==='powerGrid'&&state.hp>0&&state.phase==='build'&&!state.waveRunning&&!state.celebrationActive;
  function prepare(state){state.hand=[];state.phase='build';state.powerGrid.battlePowerIds=[];return 'ready';}
  function evaluate(state){
    const grid=state.powerGrid,conducting=new Set(grid.nodes.filter(n=>n.capacity||grid.enabled.includes(n.key)).map(n=>n.key)),seen=new Set(),components=[],status=new Map(),active=new Set();
    const nodes=new Map(grid.nodes.map(n=>[n.key,n]));
    for(const start of [...conducting].sort()){
      if(seen.has(start))continue;const queue=[start],keys=[],towers=[];let capacity=0;seen.add(start);
      for(let i=0;i<queue.length;i++){
        const key=queue[i],tile=state.map.get(key);keys.push(key);capacity+=nodes.get(key).capacity;
        for(const tw of tile?.towers||[])if(tw)towers.push(tw);
        for(let d=0;d<6;d++){const p=HexMap.neighbor(tile.q,tile.r,d),next=HexMap.key(p.q,p.r);if(conducting.has(next)&&!seen.has(next)){seen.add(next);queue.push(next);}}
      }
      // Stable build-ID priority; traversal order and reloads never reassign capacity.
      towers.sort((a,b)=>a.statId-b.statId);let used=0;
      for(const tw of towers){const reason=grid.version!==2&&tw.powerOff?'off':!capacity?'disconnected':grid.version!==2&&used>=capacity?'capacity':'powered';status.set(tw.statId,reason);if(reason==='powered'){active.add(tw.statId);used++;}}
      components.push({keys,capacity,used});
    }
    for(const tile of state.map.values())for(const tw of tile.towers||[])if(tw&&!status.has(tw.statId))status.set(tw.statId,grid.version!==2&&tw.powerOff?'off':'disconnected');
    return {components,status,active,used:active.size,capacity:grid.nodes.reduce((n,g)=>n+g.capacity,0)};
  }
  function toggleField(state,key){
    if(!planning(state)||!state.powerGrid.nodes.some(n=>n.key===key&&!n.capacity))return false;
    const g=state.powerGrid,index=g.enabled.indexOf(key);
    if(index>=0)g.enabled.splice(index,1);else{if(g.enabled.length>=g.limit)return false;g.enabled.push(key);}return true;
  }
  function toggleTower(state,slot){
    if(state.powerGrid.version===2||!planning(state)||!slot||!Number.isInteger(slot.q)||!Number.isInteger(slot.r)||!Number.isInteger(slot.index)||slot.index<0)return false;
    const tw=state.map.get(HexMap.key(slot.q,slot.r))?.towers?.[slot.index];if(!tw)return false;tw.powerOff=!tw.powerOff;return true;
  }
  function lock(state){state.powerGrid.battlePowerIds=[...evaluate(state).active].sort((a,b)=>a-b);}
  function activeIds(state){return state.waveRunning?new Set(state.powerGrid.battlePowerIds):evaluate(state).active;}
  function label(state,key){const n=state.powerGrid.nodes.find(n=>n.key===key);return n?n.name+(n.capacity?' · '+n.capacity+' Strom':state.powerGrid.enabled.includes(key)?' · EIN':' · AUS'):'';}
  const reasons={powered:'Versorgt',off:'Ausgeschaltet',disconnected:'Keine Verbindung',capacity:'Kapazität belegt'};
  return {initialize,planning,prepare,evaluate,toggleField,toggleTower,lock,activeIds,label,reasons};
})();
