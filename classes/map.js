const HexMap=(()=>{
  const SQRT3 = Math.sqrt(3);
  const HEX = 54;
  // Base at world origin; the camera handles screen projection.
  const DIRS = [
    [1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]
  ];
  const OPP = d => (d + 3) % 6;
  const key = (q,r) => `${q},${r}`;

  function axialToWorld(q,r){
    return {x:HEX*SQRT3*(q + r/2), y:HEX*1.5*r};
  }
  function hexPoints(cx,cy,size=HEX){
    const pts=[];
    for(let i=0;i<6;i++){
      const a=(Math.PI/180)*(60*i-30);
      pts.push(`${cx+size*Math.cos(a)},${cy+size*Math.sin(a)}`);
    }
    return pts.join(' ');
  }
  function edgePoint(cx,cy,d,scale=.94){
    // Axial direction 1 is north-east on our pointy-top grid, so SVG angles rotate clockwise negatively.
    const angle=(Math.PI/180)*(-60*d);
    return {x:cx+Math.cos(angle)*HEX*SQRT3/2*scale,y:cy+Math.sin(angle)*HEX*SQRT3/2*scale};
  }
  function neighbor(q,r,d){return {q:q+DIRS[d][0],r:r+DIRS[d][1]};}
  function rotatedRoads(card,rot){return card.roads.map(d=>(d+rot)%6);}

  // Turmplätze je Hexart bei Rotation 0 (Weltmaß, y nach unten, relativ zur Hexmitte). Berechnet so, dass Türme (Radius ~11) neben der Straße (Halbbreite 9) stehen.
  const SLOT_LAYOUTS = {
    supplyRoad:[[-14,-24]],
    signalCross:[[-14,-24],[14,24]],
    straight: [[-14,-24]],
    smallCurve: [[-6,-4]],
    bigCurve: [[2,32]],
    tee: [[14,-24],[14,24]],
    tJunction: [[-30,24],[-4,24]],
    fullCross: [[0,-42],[0,42]],
    cross: [[-14,-24],[14,24]],
    village: [[4,-40]],
    empty: [[-14,-24],[-30,24]],
    longRoad: [[12,-32],[-12,32]],
    highGround: [[14,-24]],
    grove: [[2,32]],
    citadel: [[14,-24],[14,24]],
    battlefield: [[-14,-24]],
    watchtower: [[20,-28],[-8.6,14]],   // zweiter Platz neben der Turmruine des Modells, nicht darauf
    royalVillage: [[-14,-24]],
    warCross: [[-14,-24],[14,24]]
  };
  // Unrotierte Turmplatz-Offsets einer Hexart. Unbekannte Arten fallen auf die alte Standardlage zurück.
  function slotOffsets(type,count){
    const custom=typeof HexData!=='undefined'&&HexData.CARD_LIBRARY[type]?.slotLayout;
    const layout=custom||SLOT_LAYOUTS[(typeof HexData!=='undefined'&&HexData.CARD_LIBRARY[type]?.model)||type];if(layout) return layout.slice(0,count).map(([x,y])=>({x,y}));
    if(count===1) return [{x:0,y:-21}];
    if(count===2) return [{x:-18,y:-20},{x:18,y:18}];
    return [];
  }
  function slotPositions(tile){
    const c=axialToWorld(tile.q,tile.r);
    const angle=-(tile.rotation||0)*Math.PI/3;
    return slotOffsets(tile.type,tile.slots||0).map(p=>({x:c.x+p.x*Math.cos(angle)-p.y*Math.sin(angle),y:c.y+p.x*Math.sin(angle)+p.y*Math.cos(angle)}));
  }

  function buildingPosition(tile,index=0){
    const c=axialToWorld(tile.q,tile.r),angle=-(tile.rotation||0)*Math.PI/3;
    const [x,y]=(typeof HexData!=='undefined'&&HexData.CARD_LIBRARY[tile.type]?.buildingLayout?.[index])||[0,30];
    return {x:c.x+x*Math.cos(angle)-y*Math.sin(angle),y:c.y+x*Math.sin(angle)+y*Math.cos(angle)};
  }
  function canPlace(map,q,r,card,rot,landmarks){
    if(map.has(key(q,r))) return false;
    const roads=rotatedRoads(card,rot);
    let connects=false;
    for(let d=0;d<6;d++){
      const n=neighbor(q,r,d); const existing=map.get(key(n.q,n.r)),fixed=landmarks?.get(key(n.q,n.r));
      const nt=existing||(!fixed?.claimed&&fixed?.prefab?fixed.prefab:null);
      if(!nt) continue;
      const thisRoad=roads.includes(d);
      const neighborRoad=(nt.roads||[]).includes(OPP(d));
      if(thisRoad!==neighborRoad) return false;
      if(existing&&((thisRoad&&neighborRoad)||(!roads.length&&card.buildingSlots))) connects=true;
    }
    if(!connects) return false;
    // Validate the resulting reachable network, without mutating the actual map.
    const candidate=new Map(map);candidate.set(key(q,r),{q,r,roads,type:card.id});
    if(card.rescue&&card.minExits){const outside=exterior(candidate,landmarks),exits=roads.filter(d=>{const n=neighbor(q,r,d);return outside.has(key(n.q,n.r));}).length;if(card.minExits===2?exits<2:exits!==1)return false;}
    return hasExteriorFront(candidate,landmarks);
  }
  function exterior(map,landmarks){
    const blocked=new Set(map.keys());for(const [id,l] of landmarks||[])if(!l.claimed&&l.prefab)blocked.add(id);
    const cells=[...map.values(),...[...(landmarks?.values()||[])].filter(l=>!l.claimed&&l.prefab)];
    const minQ=Math.min(0,...cells.map(t=>t.q))-2,maxQ=Math.max(0,...cells.map(t=>t.q))+2,minR=Math.min(0,...cells.map(t=>t.r))-2,maxR=Math.max(0,...cells.map(t=>t.r))+2;
    const queue=[{q:minQ,r:minR}],seen=new Set([key(minQ,minR)]);
    for(let i=0;i<queue.length;i++)for(let d=0;d<6;d++){const n=neighbor(queue[i].q,queue[i].r,d),id=key(n.q,n.r);if(n.q<minQ||n.q>maxQ||n.r<minR||n.r>maxR||blocked.has(id)||seen.has(id))continue;seen.add(id);queue.push(n);}
    return seen;
  }
  function reachable(map){const graph=buildGraph(map),queue=['0,0'],seen=new Set(queue);for(let i=0;i<queue.length;i++)for(const id of graph.get(queue[i])||[])if(!seen.has(id)){seen.add(id);queue.push(id);}return seen;}
  function hasExteriorFront(map,landmarks){
    const network=new Map(map);for(const [id,l] of landmarks||[])if(!network.has(id)&&!l.claimed&&l.prefab)network.set(id,{...l.prefab,q:l.q,r:l.r});
    const outside=exterior(map,landmarks),connected=reachable(network);
    for(const tile of network.values())if(tile.type!=='base'&&connected.has(key(tile.q,tile.r)))for(const d of tile.roads||[]){const n=neighbor(tile.q,tile.r,d);if(!network.has(key(n.q,n.r))&&outside.has(key(n.q,n.r))){
        // An empty pocket beside a road is not an expandable front unless a
        // continuation can leave it toward the exterior without another tile.
        for(let exit=0;exit<6;exit++){const next=neighbor(n.q,n.r,exit);if(!network.has(key(next.q,next.r))&&outside.has(key(next.q,next.r)))return true;}
      }}
    return false;
  }
  function tunnelPlan(map,landmarks,allowExterior=false){
    if(!allowExterior&&hasExteriorFront(map,landmarks))return null;
    const connected=reachable(map),sources=[...map.values()].filter(t=>t.type!=='base'&&connected.has(key(t.q,t.r))&&(t.roads||[]).some(d=>{const n=neighbor(t.q,t.r,d);return !map.has(key(n.q,n.r));}));
    if(!sources.length)return null;
    const outside=exterior(map,landmarks),options=[];
    for(const id of outside){const [q,r]=id.split(',').map(Number);if(Array.from({length:6},(_,d)=>neighbor(q,r,d)).some(n=>map.has(key(n.q,n.r))||landmarks?.get(key(n.q,n.r))?.prefab))continue;
      for(const source of sources){const distance=Math.max(Math.abs(q-source.q),Math.abs(r-source.r),Math.abs(q+r-source.q-source.r));options.push({q,r,source:key(source.q,source.r),distance});}}
    options.sort((a,b)=>a.distance-b.distance||a.q-b.q||a.r-b.r||a.source.localeCompare(b.source));
    const chosen=options[0];if(!chosen)return null;
    const distance=(a,b)=>Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r),Math.abs(a.q+a.r-b.q-b.r));
    chosen.dir=Array.from({length:6},(_,d)=>({d,score:Math.min(...[...map.values()].map(t=>distance(neighbor(chosen.q,chosen.r,d),t)))})).sort((a,b)=>b.score-a.score||a.d-b.d)[0].d;
    return chosen;
  }
  function rescue(map,landmarks,minExits=1){
    let best=null;
    for(const tile of map.values()) for(const direction of tile.roads||[]){
      const target=neighbor(tile.q,tile.r,direction);if(map.has(key(target.q,target.r))) continue;
      if(landmarks?.get(key(target.q,target.r))?.prefab) continue;
      const roads=[],free=[];
      for(let d=0;d<6;d++){const n=neighbor(target.q,target.r,d),fixed=landmarks?.get(key(n.q,n.r)),other=map.get(key(n.q,n.r))||(!fixed?.claimed?fixed?.prefab:null);if(!other) free.push(d);else if((other.roads||[]).includes(OPP(d))) roads.push(d);}
      const exits=minExits===2?free.flatMap((a,i)=>free.slice(i+1).map(b=>[a,b])):free.map(d=>[d]);
      for(const outgoing of exits){const card={id:'rescue',name:'Rettungshex',rarity:'Common',roads:[...roads,...outgoing],slots:0,rescue:true,minExits,desc:minExits===2?'Rettungsstraße mit zwei offenen Ausgängen. Keine Turmplätze.':'Nur bei blockiertem Deck. Passende Anschlüsse, keine Turmplätze.'};if(canPlace(map,target.q,target.r,card,0,landmarks)&&(!best||card.roads.length<best.roads.length))best=card;}
    }
    return best;
  }
  function randomBaseExits(random){
    const first=Math.floor(random()*6),other=Math.floor(random()*5);
    return [first,other>=first?other+1:other].sort((a,b)=>a-b);
  }
  function canPlaceOpening(map,q,r,card,rot,remaining,exits){
    const targets=exits.map(d=>neighbor(0,0,d)).filter(n=>!map.has(key(n.q,n.r)));
    if(!targets.some(n=>n.q===q&&n.r===r)||!canPlace(map,q,r,card,rot))return false;
    const next=new Map(map);next.set(key(q,r),{q,r,type:card.id,roads:rotatedRoads(card,rot)});
    return targets.filter(n=>n.q!==q||n.r!==r).every(n=>remaining.some(candidate=>Array.from({length:6},(_,rotation)=>rotation).some(rotation=>canPlace(next,n.q,n.r,candidate,rotation))));
  }
  function buildGraph(map){
    const graph=new Map();
    for(const tile of map.values()) graph.set(key(tile.q,tile.r),[]);
    for(const tile of map.values()){
      for(const d of tile.roads||[]){
        const n=neighbor(tile.q,tile.r,d); const nt=map.get(key(n.q,n.r));
        if(nt && (nt.roads||[]).includes(OPP(d))) graph.get(key(tile.q,tile.r)).push(key(n.q,n.r));
      }
    }
    for(const tile of map.values())for(const target of tile.tunnels||[])if(map.has(target))graph.get(key(tile.q,tile.r)).push(target);
    return graph;
  }

  function pathToBase(startKey,graph){
    const q=[startKey],prev=new Map([[startKey,null]]);
    while(q.length){
      const cur=q.shift(); if(cur===key(0,0)) break;
      for(const nxt of graph.get(cur)||[]) if(!prev.has(nxt)){prev.set(nxt,cur);q.push(nxt);}
    }
    if(!prev.has(key(0,0))) return null;
    const path=[]; let cur=key(0,0);
    while(cur!==null){path.push(cur);cur=prev.get(cur);} path.reverse();
    return path;
  }

  // Straßenmittellinien der 3D-Modelle (Rotation 0, Weltmaß, y nach unten, relativ zur Hexmitte), von der ersten zur zweiten Straßenkante.
  // Gegner sollen genau auf der gezeichneten Straße laufen. Die Kurven-Tiles teilen sich eine Form; Lange Straße ist punktsymmetrisch.
  const CURVE_CENTERLINE=[[46.8,0],[41.6,-0.1],[36.7,-0.5],[31.8,-1.1],[27.1,-2],[22.6,-3.1],[18.2,-4.5],[13.9,-6.1],[9.8,-8],[5.8,-10.1],[2,-12.5],[-1.7,-15.1],[-5.2,-18],[-8.6,-21.1],[-11.8,-24.5],[-14.9,-28.1],[-17.9,-32],[-20.7,-36.1],[-23.4,-40.5]];
  // Zickzack wie im Modell tile_longRoad.glb: gerade Abschnitte mit gerundeten Knicken bei x=±27 und ±14.
  const LONGROAD_CENTERLINE=[[46.8,0],[27,0],[14,-10.8],[0,0],[-14,10.8],[-27,0],[-46.8,0]];
  // Eigener Zickzack wie im Modell tile_mineRoad.glb: große Zacke nach Norden, kurze nach Süden (bewusst anders als die lange Straße).
  const MINEROAD_CENTERLINE=[[46.8,0],[30.2,0],[8.6,-21.6],[-9.7,0],[-21.6,9.2],[-32.4,0],[-46.8,0]];
  const MODEL_ROADS={bigCurve:{roads:[0,2],line:CURVE_CENTERLINE},village:{roads:[0,2],line:CURVE_CENTERLINE},grove:{roads:[0,2],line:CURVE_CENTERLINE},watchtower:{roads:[0,2],line:CURVE_CENTERLINE},longRoad:{roads:[0,3],line:LONGROAD_CENTERLINE},mineRoad:{roads:[0,3],line:MINEROAD_CENTERLINE}};
  function modelRoadLegs(center,type,roads,rotation){
    const model=MODEL_ROADS[(typeof HexData!=='undefined'&&HexData.CARD_LIBRARY[type]?.model)||type];if(!model||roads.length!==2) return null;
    const want=[...roads].sort().join();let rot=-1;
    // Nicht punktsymmetrische Formen (z. B. Minenstraße): die tatsächliche Drehung des Tiles hat Vorrang, wenn sie passt.
    const fits=r=>model.roads.map(d=>(d+r)%6).sort().join()===want;
    if(Number.isInteger(rotation)&&fits(((rotation%6)+6)%6)) rot=((rotation%6)+6)%6;
    else for(let r=0;r<6;r++) if(fits(r)){rot=r;break;}
    if(rot<0) return null;
    const theta=-Math.PI/3*rot,cos=Math.cos(theta),sin=Math.sin(theta);
    const line=model.line.map(([x,y])=>({x:center.x+x*cos-y*sin,y:center.y+x*sin+y*cos}));
    const a=(model.roads[0]+rot)%6,b=(model.roads[1]+rot)%6;
    line[0]=edgePoint(center.x,center.y,a,1);line[line.length-1]=edgePoint(center.x,center.y,b,1);   // Enden exakt auf die Hexkante
    const mid=Math.floor(line.length/2),legs=new Map();
    legs.set(a,line.slice(0,mid+1).reverse());legs.set(b,line.slice(mid));
    return {hub:line[mid],legs};
  }
  function roadGeometry(tile){
    const type=(typeof HexData!=='undefined'&&HexData.CARD_LIBRARY[tile.type]?.model)||tile.type;
    const center=axialToWorld(tile.q,tile.r),roads=tile.roads||[];
    const modeled=modelRoadLegs(center,tile.type,roads,tile.rotation);if(modeled) return modeled;
    let hub={...center};
    if(roads.length===2&&['smallCurve'].includes(type)){
      const edges=roads.map(d=>edgePoint(center.x,center.y,d,1));
      const bias=type==='smallCurve'?.5:-.45;
      hub={x:center.x+((edges[0].x+edges[1].x)/2-center.x)*bias,y:center.y+((edges[0].y+edges[1].y)/2-center.y)*bias};
    }
    const legs=new Map();
    for(const d of roads){
      const edge=edgePoint(center.x,center.y,d,1),points=[hub];
      if(type==='longRoad'){
        const dx=edge.x-hub.x,dy=edge.y-hub.y,length=Math.hypot(dx,dy);
        for(const [t,offset] of [[.28,14],[.6,-14]]) points.push({x:hub.x+dx*t-dy/length*offset,y:hub.y+dy*t+dx/length*offset});
      }else if(roads.length===2&&['smallCurve'].includes(type)){
        const control={x:(hub.x+edge.x)/2+(center.x-hub.x)*.5,y:(hub.y+edge.y)/2+(center.y-hub.y)*.5};
        for(let i=1;i<12;i++){const t=i/12,u=1-t;points.push({x:u*u*hub.x+2*u*t*control.x+t*t*edge.x,y:u*u*hub.y+2*u*t*control.y+t*t*edge.y});}
      }
      points.push(edge);legs.set(d,points);
    }
    return {hub,legs};
  }
  function length(points){return points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-points[i].x,p.y-points[i].y),0);}
  function routeGraph(map){
    const graph=new Map(),geometry=new Map();
    for(const [id,tile] of map){geometry.set(id,roadGeometry(tile));graph.set(id,[]);}
    for(const [id,tile] of map) for(const d of tile.roads||[]){
      const n=neighbor(tile.q,tile.r,d),next=key(n.q,n.r),other=geometry.get(next);
      if(!other?.legs.has(OPP(d))) continue;
      const points=[...geometry.get(id).legs.get(d),...other.legs.get(OPP(d)).slice().reverse().slice(1)];
      graph.get(id).push({next,cost:length(points),points});
    }
    for(const [id,tile] of map)for(const next of tile.tunnels||[])if(geometry.has(next))graph.get(id).push({next,cost:0,points:[geometry.get(id).hub,{...geometry.get(next).hub,tunnel:true}]});
    const distances=new Map([[key(0,0),0]]),visited=new Set();
    while(true){
      let current=null,best=Infinity;
      for(const [id,distance] of distances) if(!visited.has(id)&&distance<best){current=id;best=distance;}
      if(current===null) break;visited.add(current);
      for(const edge of graph.get(current)||[]){const candidate=best+edge.cost;if(candidate<(distances.get(edge.next)??Infinity)) distances.set(edge.next,candidate);}
    }
    return {graph,geometry,distances};
  }
  return {exterior,hasExteriorFront,tunnelPlan,SQRT3,HEX,OPP,key,axialToWorld,hexPoints,edgePoint,neighbor,rotatedRoads,canPlace,canPlaceOpening,randomBaseExits,rescue,buildGraph,pathToBase,roadGeometry,routeGraph,length,slotOffsets,slotPositions,buildingPosition,axialToPixel:axialToWorld};
})();


