const HexWaves=(()=>{
  const economy={kill:3,completion:10,startGold:70};
  function plan(wave,income=0){
    const count=Math.min(5+wave*2,24),hp=28+wave*7;
    const speed=(.34+Math.min(.12,wave*.005))*54*Math.sqrt(3);
    const enemies=Array.from({length:count},(_,i)=>{
      const type=wave>=4&&i%4===0?'armored':wave>=3&&i%3===0?'swarm':'normal';
      return {type,name:{normal:'Normal',armored:'Gepanzert',swarm:'Schwarm'}[type],hp:type==='swarm'?Math.round(hp*.6):type==='armored'?Math.round(hp*1.3):hp,speed:speed*(type==='swarm'?1.3:type==='armored'?.8:1),armor:type==='armored'};
    });
    return {wave,count,hp,speed,enemies,type:'Gegner',killGold:count*economy.kill,completionGold:economy.completion,income,maxGold:count*economy.kill+economy.completion+income};
  }
  return {economy,plan};
})();
