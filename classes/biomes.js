/* Seeded, contiguous regions. Independent of discovery order and reward RNG. */
const HexBiomes=(()=>{
  const definitions={
    grass:{name:'Grasland',color:'#688653',description:'Keine Biommodifikatoren.'},
    desert:{name:'Dünenmeer',color:'#e2bd69',description:'Gegner hier 15 % langsamer; Türme hier −15 % Reichweite. Wächter aus diesem Biom: Verlangsamungen wirken nur halb so stark.'},
    storm:{name:'Sturmhochland',color:'#7e8da9',description:'Kettenblitz +25 % Sprungweite; Wind +1 Durchschlagziel; Archer/Balliste −15 % Angriffsrate. Wächter: 50 % weniger Blitz- und Windschaden.'},
    ash:{name:'Aschelande',color:'#bd6047',description:'Feuer +20 % Schaden; Freeze −15 % Reichweite; Verlangsamung durch Wasser wirkt 25 % kürzer. Wächter: 50 % weniger Feuerschaden.'}
  };
  function legacyAt(seed,q,r){
    if(seed==null||Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r))<=3)return 'grass';
    let hash=2166136261;for(const c of String(seed))hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
    const angle=Math.atan2(r*1.5,Math.sqrt(3)*(q+r/2)),rotation=hash/4294967296*Math.PI*2;
    const radius=Math.hypot(q+r/2,r*.866),bend=.18*Math.sin(radius*.32+rotation);
    const sector=Math.floor(((angle+rotation+bend)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)/(Math.PI*2/3));
    return ['desert','storm','ash'][sector];
  }
  // Variable 3–5-cell bands, bent sideways by at most one cell. Four-color
  // parity prevents adjacent regions joining into an unbounded same-biome strip.
  const worlds=new Map();
  function hash(value){let h=2166136261;for(const c of String(value))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;return h>>>0;}
  function world(seed){if(worlds.has(seed))return worlds.get(seed);const colors=['grass','desert','storm','ash'];for(let i=3;i>0;i--){const j=hash(seed+'|color|'+i)%(i+1);[colors[i],colors[j]]=[colors[j],colors[i]];}const result={colors,turn:hash(seed+'|turn')%6,cells:new Map(),bands:new Map()};if(worlds.size>=4)worlds.delete(worlds.keys().next().value);worlds.set(seed,result);return result;}
  function band(w,seed,axis,n){const group=Math.floor(n/12),key=axis+group;let widths=w.bands.get(key);if(!widths){widths=[3,4,5];for(let i=2;i>0;i--){const j=hash(seed+'|'+key+'|'+i)%(i+1);[widths[i],widths[j]]=[widths[j],widths[i]];}if(w.bands.size>=512)w.bands.clear();w.bands.set(key,widths);}let offset=n-group*12,index=0;while(offset>=widths[index])offset-=widths[index++];return group*3+index;}
  function rawAt(w,seed,q,r){
    if(Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r))<=3)return 'grass';
    let x=q,y=r;for(let i=0;i<w.turn;i++)[x,y]=[-y,x+y];
    const knot=Math.floor(y/4),fraction=(y-knot*4)/4,left=hash(seed+'|bend|'+knot)%3-1,right=hash(seed+'|bend|'+(knot+1))%3-1;
    const bend=Math.round(left+(right-left)*fraction);
    const a=band(w,seed,'q',x-bend),b=band(w,seed,'r',y),parity=n=>((n%2)+2)%2;
    return w.colors[parity(a)+2*parity(b)];
  }
  function at(seed,q,r){
    if(seed==null)return 'grass';
    const w=world(String(seed)),key=q+','+r;if(w.cells.has(key))return w.cells.get(key);
    let result=rawAt(w,seed,q,r);const cells=[[q,r]],seen=new Set([key]);
    // Clipping at the safe start must not leave tiny non-grass islands.
    if(result!=='grass'&&Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r))<=10){
      for(let i=0;i<cells.length;i++)for(const [dq,dr] of [[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]]){const [x,y]=cells[i],nq=x+dq,nr=y+dr,id=nq+','+nr;if(!seen.has(id)&&rawAt(w,seed,nq,nr)===result){seen.add(id);cells.push([nq,nr]);}}
      if(cells.length<9)result='grass';
    }
    if(w.cells.size>=8192)w.cells.clear();for(const [x,y] of cells)w.cells.set(x+','+y,result);return result;
  }
  const forTile=(state,tile)=>state.remoteView?(tile.biome||state.visibleBiomes?.[tile.q+','+tile.r]||'grass'):(state.biomeLayoutVersion===1?legacyAt:at)(state.challengeDay?null:state.biomeSeed,tile.q,tile.r);
  function visibleTiles(state){
    const cells=new Map(state.map);if(state.remoteView){for(const [id,biome] of Object.entries(state.visibleBiomes||{})){const [q,r]=id.split(',').map(Number);if(!cells.has(id))cells.set(id,{q,r,biome});}return [...cells.values()];}
    for(const tile of state.map.values())for(let d=0;d<6;d++){const n=HexMap.neighbor(tile.q,tile.r,d),id=HexMap.key(n.q,n.r);if(!cells.has(id)&&(!state.landmarks?.has(id)||state.landmarks.get(id).claimed))cells.set(id,n);}
    // Revealed special tiles show biome terrain even before the road reaches them.
    // Keep fog silhouettes excluded, matching the renderer's discovery boundary.
    for(const landmark of state.landmarks?.values()||[]){
      if(landmark.claimed||!landmark.prefab||HexExploration.visibility(state.map,landmark)!=='clear')continue;
      const id=HexMap.key(landmark.q,landmark.r);if(!cells.has(id))cells.set(id,landmark);
    }
    return [...cells.values()];
  }
  function introIds(state){return [...new Set(Array.isArray(state.biomeIntro)?state.biomeIntro:state.biomeIntro?[state.biomeIntro]:[])].filter(id=>id!=='grass'&&Object.hasOwn(definitions,id));}
  function introAcknowledged(state){return Array.isArray(state.biomeIntroAcknowledgedIds)&&state.biomeIntroAcknowledgedIds.some(id=>id!=='grass'&&Object.hasOwn(definitions,id));}
  function acknowledgeIntro(state){const ids=introIds(state);if(!ids.length)return false;state.biomeIntroAcknowledgedIds=ids;state.biomeIntroAcknowledged=true;state.biomeIntro=null;return true;}
  function highlight(state){
    const intro=!(state.selectedBuilding||state.hoverBuilding||state.buildingTarget||state.previewBuilding)?introIds(state):[];
    const ids=new Set([...intro,...(state.highlightBiome?[state.highlightBiome]:[])]);
    if(!ids.size)return null;
    const tiles=visibleTiles(state).filter(t=>ids.has(forTile(state,t)));
    return {color:'#ffffff',tiles,tileColors:Object.fromEntries(tiles.map(t=>[t.q+','+t.r,definitions[forTile(state,t)].color]))};
  }
  function atWorld(state,x,y){
    const r=y/(HexMap.HEX*1.5),q=x/(HexMap.HEX*Math.sqrt(3))-r/2,s=-q-r;
    let rq=Math.round(q),rr=Math.round(r),rs=Math.round(s);
    const dq=Math.abs(rq-q),dr=Math.abs(rr-r),ds=Math.abs(rs-s);
    if(dq>dr&&dq>ds)rq=-rr-rs;else if(dr>ds)rr=-rq-rs;
    return forTile(state,{q:rq,r:rr});
  }
  function apply(def,tower){
    if(tower.biome==='desert')def.range*=.85;
    if(tower.biome==='storm'){
      if(tower.type==='chain')def.jumpRange*=1.25;
      if(tower.branch==='elementWind')def.pierceTargets++;
      if(['archer','ballista'].includes(tower.type))def.cooldown/=.85;
    }
    if(tower.biome==='ash'){
      if(tower.type==='flame'||tower.branch==='elementFire')def.damage*=1.2;
      if(tower.type==='freeze')def.range*=.85;
      if(tower.branch==='elementWater')def.slowDuration*=.75;
    }
    return def;
  }
  function guardian(state,tile){const originBiome=forTile(state,tile);return {originBiome,resistances:originBiome==='ash'?{fire:.5}:originBiome==='storm'?{lightning:.5,wind:.5}:{},slowResistance:originBiome==='desert'?.5:0};}
  // Nur Darstellung (Sakura-Edition): jedes Biom als eigene japanische Jahreszeit. Grasland behält den Kirschblüten-Frühling.
  const sakuraSeasons={
    desert:{name:'Zen-Sommer',ground:'#e6cf98',soil:'#a3824f',foliage:'#8c9450',blossom:'#f1dfa8',blossomLight:'#fbf0cf',particles:'sand'},
    storm:{name:'Glyzinienregen',ground:'#8e9ab0',soil:'#4c5569',foliage:'#3e6a63',blossom:'#9a7fd0',blossomLight:'#c6b3ee',particles:'rain'},
    ash:{name:'Momiji-Herbst',ground:'#7d3a2c',soil:'#3c1d17',foliage:'#c0482b',blossom:'#d8412a',blossomLight:'#ef7a3a',particles:'maple'}
  };
  function groundColor(biome,sakura=false){return sakura&&biome==='grass'?'#eab3c3':definitions[biome].color;}
  const sakuraAmbient={grass:'petals',desert:'sand',storm:'rain',ash:'maple'};
  return {groundColor,introAcknowledged,acknowledgeIntro,introIds,visibleTiles,highlight,guardian,definitions,at,forTile,atWorld,apply,sakuraSeasons,sakuraAmbient};
})();
