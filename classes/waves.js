const HexWaves=(()=>{
  const economy={kill:3,completion:10,startGold:70};
  function daily(day){const offset=Math.floor((Date.parse(day+'T00:00:00Z')-Date.UTC(2026,8,22))/86400000);return Math.abs(offset%2)===1?{id:'garrison',name:'Die letzte Garnison',target:3}:{id:'caravan',name:'Die letzte Karawane',target:20};}
  function bossProfile(wave){
    if(wave<15||(wave-15)%10!==0) return null;
    const hp=Math.round(1200*Math.pow((wave-5)/10,1.8));
    const variants=[{bossKind:'iron',name:'Eisenkoloss',description:'Schwerer Belagerer: viel Rüstung, langsam, 7 Base-Schaden.',armor:.6,magic:.1,speed:23,baseDamage:7},{bossKind:'hunter',name:'Sturmjäger',description:'Schneller Boss: widersteht Verlangsamung, wenig Rüstung.',armor:.1,magic:.2,speed:48,minSpeedFactor:.8},{bossKind:'summoner',name:'Seelenmatriarchin',description:'Hohe Magieresistenz. Ruft alle 6 Sekunden an ihrer Position einen Diener, maximal sechs. Diener sind 20 % langsamer und geben kein Gold.',armor:.15,magic:.7,speed:26,summonInterval:6000,summonLimit:6}];
    const v=variants[((wave-15)/10)%3];return {type:'boss',hp,minSpeedFactor:.6,baseDamage:5,killGold:50,...v,armorHp:Math.round(hp*v.armor),magicHp:Math.round(hp*v.magic)};
  }
  function elementFor(wave,context={}){
    const loadout=context.towerLoadout||['archer'];
    const types=['fire','water','lightning'].filter(element=>loadout.some(id=>id!=='freeze'&&(id==='element'||({flame:'fire',chain:'lightning'})[id]!==element)));
    if(!types.length)return null;
    let hash=2166136261;for(const c of String(context.seed||'default'))hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
    return types[(hash+Math.max(0,wave-26))%types.length];
  }
  function plan(wave,income=0,caravan=false,context={}){
    if(context.challengeKind==='garrison'){
      const strength=18+Math.max(0,wave-1)*3,p=plan(strength,0,false,{...context,challengeKind:null});
      for(const enemy of p.enemies)enemy.killGold=0;if(p.boss)p.boss.killGold=0;
      return {...p,wave,killGold:0,completionGold:0,income:0,maxGold:0};
    }
    // Keep the opening approachable; growing routes/defenses need compounding pressure.
    const count=wave===1?5:5+wave*2,hp=Math.round((28+wave*7)*Math.pow(1.10,Math.max(0,wave-3)));
    const speed=(.34+Math.min(.12,wave*.005))*54*Math.sqrt(3);
    const enemies=Array.from({length:count},(_,i)=>{
      const type=wave>=5&&i%5===0?'warded':wave>=4&&i%4===0?'armored':wave>=3&&i%3===0?'swarm':'normal';
      return {type,name:{normal:'Normal',armored:'Gepanzert',warded:'Magiegeschützt',swarm:'Schwarm'}[type],hp:type==='swarm'?Math.round(hp*.6):hp,armorHp:type==='armored'?Math.round(hp*.3):0,magicHp:type==='warded'?Math.round(hp*.25):0,speed:speed*(type==='swarm'?1.3:type==='armored'?.8:type==='warded'?.9:1)};
    });
    // Replace normal slots, preserving the wave's initial count and gold budget.
    const slots=enemies.map((e,i)=>e.type==='normal'?i:-1).filter(i=>i>=0);
    const replace=(start,profile)=>{if(wave<start)return;const amount=Math.min(3,1+Math.floor((wave-start)/15));for(let i=0;i<amount&&slots.length;i++){const index=slots.shift();enemies[index]={hp,armorHp:0,magicHp:0,speed,...profile};}};
    replace(12,{type:'splitter',name:'Splittergolem',speed:speed*.75,armorHp:Math.round(hp*.35),splitOnDeath:true,description:'Zerfällt in zwei kleine Golems. Das Gold verteilt sich auf alle drei.'});
    replace(18,{type:'healer',name:'Feldheiler',hp:Math.round(hp*.8),speed:speed*.9,healRadius:50,healInterval:3000,description:'Heilt andere Gegner im kleinen Umkreis alle 3 Sekunden um 5 %. Heiler heilen einander nicht.'});
    const immunity=elementFor(wave,context),elements={fire:['Feuer','🔥','#ef7449'],water:['Wasser','💧','#56c5ef'],lightning:['Blitz','ϟ','#efd557']};
    if(immunity){const [name,icon,color]=elements[immunity];replace(26,{type:'elementCarrier',name:'Elementträger · '+name,immunity,abilityIcon:icon,color,description:'Immun gegen '+name+'. Andere Schadensarten wirken normal.'+(immunity==='water'?' Wasserverlangsamung wirkt nicht; Frost-Auren wirken weiterhin.':'')});}
    const boss=bossProfile(wave);
    if(caravan){let before=0;for(let w=1;w<wave;w++)before+=w===1?5:5+2*w;enemies.forEach((enemy,i)=>{enemy.speed*=.85;if((before+i+1)%10===0){enemy.caravan=true;enemy.name+=' · Karawanenkasse';enemy.killGold=18;enemy.goldLoss=10;}});if(boss)boss.speed*=.85;}
    const bonus=enemies.filter(e=>e.caravan).length*15;
    return {wave,count,hp,speed,enemies,boss,type:'Gegner',killGold:count*economy.kill+bonus,completionGold:economy.completion,income,maxGold:count*economy.kill+bonus+economy.completion+income+(boss?.killGold||0)};
  }
  return {daily,economy,plan,bossProfile,elementFor};
})();

