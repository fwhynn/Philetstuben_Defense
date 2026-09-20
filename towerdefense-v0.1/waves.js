const HexWaves=(()=>{
  const economy={kill:3,completion:10,startGold:70};
  function bossProfile(wave){
    if(wave<15||(wave-15)%10!==0) return null;
    const hp=Math.round(1200*Math.pow((wave-5)/10,1.8));
    return {type:'boss',name:'Belagerungswächter',hp,armorHp:Math.round(hp*.25),magicHp:Math.round(hp*.2),speed:28,minSpeedFactor:.6,baseDamage:5,killGold:50};
  }
  function plan(wave,income=0,caravan=false){
    // Keep the opening approachable; growing routes/defenses need compounding pressure.
    const count=wave===1?5:5+wave*2,hp=Math.round((28+wave*7)*Math.pow(1.10,Math.max(0,wave-3)));
    const speed=(.34+Math.min(.12,wave*.005))*54*Math.sqrt(3);
    const enemies=Array.from({length:count},(_,i)=>{
      const type=wave>=5&&i%5===0?'warded':wave>=4&&i%4===0?'armored':wave>=3&&i%3===0?'swarm':'normal';
      return {type,name:{normal:'Normal',armored:'Gepanzert',warded:'Magiegeschützt',swarm:'Schwarm'}[type],hp:type==='swarm'?Math.round(hp*.6):hp,armorHp:type==='armored'?Math.round(hp*.3):0,magicHp:type==='warded'?Math.round(hp*.25):0,speed:speed*(type==='swarm'?1.3:type==='armored'?.8:type==='warded'?.9:1)};
    });
    const boss=bossProfile(wave);
    if(caravan){let before=0;for(let w=1;w<wave;w++)before+=w===1?5:5+2*w;enemies.forEach((enemy,i)=>{enemy.speed*=.85;if((before+i+1)%10===0){enemy.caravan=true;enemy.name+=' · Karawanenkasse';enemy.killGold=18;enemy.goldLoss=10;}});if(boss)boss.speed*=.85;}
    const bonus=enemies.filter(e=>e.caravan).length*15;
    return {wave,count,hp,speed,enemies,boss,type:'Gegner',killGold:count*economy.kill+bonus,completionGold:economy.completion,income,maxGold:count*economy.kill+bonus+economy.completion+income+(boss?.killGold||0)};
  }
  return {economy,plan,bossProfile};
})();

