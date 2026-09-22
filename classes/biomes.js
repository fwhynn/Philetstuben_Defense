/* Seeded, contiguous regions. Independent of discovery order and reward RNG. */
const HexBiomes=(()=>{
  const definitions={
    grass:{name:'Grasland',color:'#688653',description:'Keine Biommodifikatoren.'},
    desert:{name:'Dünenmeer',color:'#e2bd69',description:'Gegner hier 15 % langsamer; Türme hier −15 % Reichweite. Wächter aus diesem Biom: Verlangsamungen wirken nur halb so stark.'},
    storm:{name:'Sturmhochland',color:'#7e8da9',description:'Kettenblitz +25 % Sprungweite; Wind +1 Durchschlagziel; Archer/Balliste −15 % Angriffsrate. Wächter: 50 % weniger Blitz- und Windschaden.'},
    ash:{name:'Aschelande',color:'#bd6047',description:'Feuer +20 % Schaden; Freeze −15 % Reichweite; Wasser-Slow hält 25 % kürzer. Wächter: 50 % weniger Feuerschaden.'}
  };
  function at(seed,q,r){
    if(seed==null||Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r))<=2)return 'grass';
    let hash=2166136261;for(const c of String(seed))hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
    const angle=Math.atan2(r*1.5,Math.sqrt(3)*(q+r/2)),rotation=hash/4294967296*Math.PI*2;
    const radius=Math.hypot(q+r/2,r*.866),bend=.18*Math.sin(radius*.32+rotation);
    const sector=Math.floor(((angle+rotation+bend)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)/(Math.PI*2/3));
    return ['desert','storm','ash'][sector];
  }
  const forTile=(state,tile)=>state.remoteView?(tile.biome||'grass'):at(state.challengeDay?null:state.biomeSeed,tile.q,tile.r);
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
  return {guardian,definitions,at,forTile,atWorld,apply};
})();
