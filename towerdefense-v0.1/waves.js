const HexWaves=(()=>{
  const economy={kill:3,completion:10,startGold:70};
  function bossProfile(wave){
    if(wave<10||wave%10!==0) return null;
    const hp=Math.round(1200*Math.pow(wave/10,1.8));
    return {type:'boss',name:'Belagerungswächter',hp,armorHp:Math.round(hp*.25),magicHp:Math.round(hp*.2),speed:28,minSpeedFactor:.6,baseDamage:5,killGold:50};
  }
  function plan(wave,income=0){
    // Keep the opening approachable; growing routes/defenses need compounding pressure.
    const count=5+wave*2,hp=Math.round((28+wave*7)*Math.pow(1.10,Math.max(0,wave-3)));
    const speed=(.34+Math.min(.12,wave*.005))*54*Math.sqrt(3);
    const enemies=Array.from({length:count},(_,i)=>{
      const type=wave>=5&&i%5===0?'warded':wave>=4&&i%4===0?'armored':wave>=3&&i%3===0?'swarm':'normal';
      return {type,name:{normal:'Normal',armored:'Gepanzert',warded:'Magiegeschützt',swarm:'Schwarm'}[type],hp:type==='swarm'?Math.round(hp*.6):hp,armorHp:type==='armored'?Math.round(hp*.3):0,magicHp:type==='warded'?Math.round(hp*.25):0,speed:speed*(type==='swarm'?1.3:type==='armored'?.8:type==='warded'?.9:1)};
    });
    const boss=bossProfile(wave);
    return {wave,count,hp,speed,enemies,boss,type:'Gegner',killGold:count*economy.kill,completionGold:economy.completion,income,maxGold:count*economy.kill+economy.completion+income+(boss?.killGold||0)};
  }
  return {economy,plan,bossProfile};
})();

