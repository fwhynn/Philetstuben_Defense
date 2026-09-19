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
    watchtower: [[20,-28],[2,32]],
    royalVillage: [[-14,-24]],
    warCross: [[-14,-24],[14,24]]
  };
  // Unrotierte Turmplatz-Offsets einer Hexart. Unbekannte Arten fallen auf die alte Standardlage zurück.
  function slotOffsets(type,count){
    const layout=SLOT_LAYOUTS[type];if(layout) return layout.slice(0,count).map(([x,y])=>({x,y}));
    if(count===1) return [{x:0,y:-21}];
    if(count===2) return [{x:-18,y:-20},{x:18,y:18}];
    return [];
  }
  function slotPositions(tile){
    const c=axialToWorld(tile.q,tile.r);
    const angle=-(tile.rotation||0)*Math.PI/3;
    return slotOffsets(tile.type,tile.slots||0).map(p=>({x:c.x+p.x*Math.cos(angle)-p.y*Math.sin(angle),y:c.y+p.x*Math.sin(angle)+p.y*Math.cos(angle)}));
  }

  function buildingPosition(tile){const c=axialToWorld(tile.q,tile.r),angle=-(tile.rotation||0)*Math.PI/3;return {x:c.x-30*Math.sin(angle),y:c.y+30*Math.cos(angle)};}
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
      if(thisRoad&&neighborRoad&&existing) connects=true;
    }
    if(!connects) return false;
    // Validate the resulting reachable network, without mutating the actual map.
    const candidate=new Map(map);candidate.set(key(q,r),{q,r,roads,type:card.id});
    const graph=buildGraph(candidate),queue=[key(0,0)],visited=new Set(queue);
    for(let i=0;i<queue.length;i++){
      const tile=candidate.get(queue[i]);if(!tile) continue;
      if(tile.type!=='base'&&queue[i]!==key(0,0)&&tile.roads.some(d=>{const n=neighbor(tile.q,tile.r,d);return !candidate.has(key(n.q,n.r))&&Array.from({length:6},(_,side)=>neighbor(n.q,n.r,side)).some(next=>!candidate.has(key(next.q,next.r)));})) return true;
      for(const next of graph.get(queue[i])||[]) if(!visited.has(next)){visited.add(next);queue.push(next);}
    }
    return false;
  }
  function rescue(map,landmarks){
    for(const tile of map.values()) for(const direction of tile.roads||[]){
      const target=neighbor(tile.q,tile.r,direction);if(map.has(key(target.q,target.r))) continue;
      if(landmarks?.get(key(target.q,target.r))?.prefab) continue;
      const roads=[],free=[];
      for(let d=0;d<6;d++){const n=neighbor(target.q,target.r,d),fixed=landmarks?.get(key(n.q,n.r)),other=map.get(key(n.q,n.r))||(!fixed?.claimed?fixed?.prefab:null);if(!other) free.push(d);else if((other.roads||[]).includes(OPP(d))) roads.push(d);}
      for(const exit of free){const card={id:'rescue',name:'Rettungshex',rarity:'Common',roads:[...roads,exit],slots:0,rescue:true,desc:'Nur bei blockiertem Deck. Passende Anschlüsse, keine Turmplätze.'};if(canPlace(map,target.q,target.r,card,0,landmarks)) return card;}
    }
    return null;
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
  const LONGROAD_CENTERLINE=[[46.8,0],[45,0.2],[43.3,0.4],[41.5,0.5],[39.7,0.8],[37.4,1.3],[34.5,2.4],[31.3,3.8],[28,5.1],[24.6,5.8],[20.3,5.8],[15.4,4.8],[10.3,3.2],[5.1,1.5],[0,0],[-5.1,-1.5],[-10.3,-3.2],[-15.4,-4.8],[-20.3,-5.8],[-24.6,-5.8],[-28,-5.1],[-31.3,-3.8],[-34.5,-2.4],[-37.4,-1.3],[-39.7,-0.8],[-41.5,-0.5],[-43.3,-0.4],[-45,-0.2],[-46.8,0]];
  const MODEL_ROADS={bigCurve:{roads:[0,2],line:CURVE_CENTERLINE},village:{roads:[0,2],line:CURVE_CENTERLINE},grove:{roads:[0,2],line:CURVE_CENTERLINE},watchtower:{roads:[0,2],line:CURVE_CENTERLINE},longRoad:{roads:[0,3],line:LONGROAD_CENTERLINE}};
  function modelRoadLegs(center,type,roads){
    const model=MODEL_ROADS[type];if(!model||roads.length!==2) return null;
    const want=[...roads].sort().join();let rot=-1;
    for(let r=0;r<6;r++) if(model.roads.map(d=>(d+r)%6).sort().join()===want){rot=r;break;}
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
    const center=axialToWorld(tile.q,tile.r),roads=tile.roads||[];
    const modeled=modelRoadLegs(center,tile.type,roads);if(modeled) return modeled;
    let hub={...center};
    if(roads.length===2&&['smallCurve'].includes(tile.type)){
      const edges=roads.map(d=>edgePoint(center.x,center.y,d,1));
      const bias=tile.type==='smallCurve'?.5:-.45;
      hub={x:center.x+((edges[0].x+edges[1].x)/2-center.x)*bias,y:center.y+((edges[0].y+edges[1].y)/2-center.y)*bias};
    }
    const legs=new Map();
    for(const d of roads){
      const edge=edgePoint(center.x,center.y,d,1),points=[hub];
      if(tile.type==='longRoad'){
        const dx=edge.x-hub.x,dy=edge.y-hub.y,length=Math.hypot(dx,dy);
        for(const [t,offset] of [[.28,14],[.6,-14]]) points.push({x:hub.x+dx*t-dy/length*offset,y:hub.y+dy*t+dx/length*offset});
      }else if(roads.length===2&&['smallCurve'].includes(tile.type)){
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
    const distances=new Map([[key(0,0),0]]),visited=new Set();
    while(true){
      let current=null,best=Infinity;
      for(const [id,distance] of distances) if(!visited.has(id)&&distance<best){current=id;best=distance;}
      if(current===null) break;visited.add(current);
      for(const edge of graph.get(current)||[]){const candidate=best+edge.cost;if(candidate<(distances.get(edge.next)??Infinity)) distances.set(edge.next,candidate);}
    }
    return {graph,geometry,distances};
  }
  return {SQRT3,HEX,OPP,key,axialToWorld,hexPoints,edgePoint,neighbor,rotatedRoads,canPlace,rescue,buildGraph,pathToBase,roadGeometry,routeGraph,length,slotOffsets,slotPositions,buildingPosition,axialToPixel:axialToWorld};
})();


