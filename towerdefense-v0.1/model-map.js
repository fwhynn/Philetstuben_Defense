/* Renderer-unabhängige Zuordnung Spielzustand -> 3D-Modell. Kein DOM, kein Three.js. */
const HexModelMap=(()=>{
  // Straßenkanten der Grundformen bei Rotation 0 (wie in ASSET_SPEC.md / data.js).
  const SHAPES={straight:[0,3],smallCurve:[0,1],bigCurve:[0,2],tee:[0,2,4],tJunction:[0,2,3],cross:[0,1,3,4],fullCross:[0,1,2,3,4,5]};
  const TILE_MODELS=['straight','smallCurve','bigCurve','tee','tJunction','cross','fullCross','village','empty','longRoad','highGround','grove','treasury','citadel','battlefield','watchtower','royalVillage','warCross'];
  const ALL_MODELS={
    tiles:['base','rescue','fog',...TILE_MODELS],
    landmarks:['boss','shrine','treasure'],
    towers:['archer','catapult','chain','freeze']
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
   * zwischen zwei Kanten, möglichst weit von Straßen und dem Turmplatz (Norden, 90°) entfernt.
   */
  function propAngle(shape){
    const roads=(SHAPES[shape]||[]).map(d=>d*60);let best=null;
    for(let k=0;k<6;k++){
      const angle=30+60*k;if(angleGap(angle,90)<35) continue;
      const score=roads.length?Math.min(...roads.map(r=>angleGap(angle,r))):180;
      if(!best||score>best.score||(score===best.score&&angle===270)) best={angle,score};
    }
    return best.angle;
  }
  return {SHAPES,TILE_MODELS,ALL_MODELS,matchShape,modelFor,propAngle};
})();
