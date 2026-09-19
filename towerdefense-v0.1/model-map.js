/* Renderer-unabhängige Zuordnung Spielzustand -> 3D-Modell. Kein DOM, kein Three.js. */
const HexModelMap=(()=>{
  // Straßenkanten der Grundformen bei Rotation 0 (wie in ASSET_SPEC.md / data.js).
  const SHAPES={straight:[0,3],smallCurve:[0,1],bigCurve:[0,2],tee:[0,2,4],tJunction:[0,2,3],cross:[0,1,3,4],fullCross:[0,1,2,3,4,5]};
  const TILE_MODELS=['straight','smallCurve','bigCurve','tee','tJunction','cross','fullCross','village','empty','longRoad','highGround','grove','treasury','citadel','battlefield','watchtower','royalVillage','warCross'];
  const ALL_MODELS={
    tiles:['base','rescue','fog',...TILE_MODELS],
    landmarks:['boss','shrine','treasure'],
    towers:['archer','catapult','chain','freeze','mine','ballista','flame'],
    enemies:['normal','armored','warded','swarm','boss'],   // optional: ohne Datei zeichnet der Renderer Kugeln
    buildings:['house','forge','market'],                   // optional: ohne Datei Platzhalter
    effects:['pickup']                                      // optional: assets/effects/mine_pickup.glb (Mine auf der Straße)
  };
  const sameRoads=(a,b)=>a.length===b.length&&[...a].sort().join()===[...b].sort().join();
  function matchShape(roads){
    for(const [name,base] of Object.entries(SHAPES)) for(let r=0;r<6;r++) if(sameRoads(base.map(d=>(d+r)%6),roads)) return {name,rotation:r};
    return null;
  }
  /** Modell + Drehschritte (60° gegen den Uhrzeigersinn) für ein gelegtes Tile. */
  function modelFor(tile){
    if(tile.type==='base') return {name:'base',rotation:0};
    if(TILE_MODELS.includes(tile.type)) return {name:tile.type,rotation:tile.rotation||0};
    // Rettungshex und unbekannte Typen: Straßenform bestimmt das Modell.
    const match=matchShape(tile.roads||[]);
    if(match) return {name:match.name==='straight'?'rescue':match.name,rotation:match.rotation};
    return {name:'rescue',rotation:0,proceduralRoads:true};
  }
  const angleGap=(a,b)=>{const d=Math.abs(a-b)%360;return Math.min(d,360-d);};
  /**
   * Winkel (Grad, 0 = Osten, gegen den Uhrzeigersinn) für Deko auf einem Sonderfeld:
   * zwischen zwei Kanten, weit weg von Straßen und Turmplätzen (slots: unrotierte Offsets, y nach unten).
   */
  function propAngle(shape,slots=[{x:0,y:-21}]){
    const roads=(SHAPES[shape]||[]).map(d=>d*60),slotAngles=slots.map(p=>Math.atan2(-p.y,p.x)*180/Math.PI);let best=null;
    for(let k=0;k<6;k++){
      const angle=30+60*k,slotGap=slotAngles.length?Math.min(...slotAngles.map(s=>angleGap(angle,s))):180;
      if(slotGap<40) continue;
      const score=roads.length?Math.min(...roads.map(r=>angleGap(angle,r))):180;
      if(!best||score>best.score||(score===best.score&&slotGap>best.slotGap)) best={angle,score,slotGap};
    }
    return best?best.angle:270;
  }
  return {SHAPES,TILE_MODELS,ALL_MODELS,matchShape,modelFor,propAngle};
})();
