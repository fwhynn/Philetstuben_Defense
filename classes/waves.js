const HexWaves=(()=>{
  const economy={kill:3,completion:10,startGold:70};
  const dailyMissions={movingFortress:{id:'movingFortress',name:'Wandernde Festung',target:12},towerDraft:{id:'towerDraft',name:'Turm-Draft',target:12},expedition:{id:'expedition',name:'Expedition ins Unbekannte',target:12},powerGrid:{id:'powerGrid',name:'Stromnetz',target:12},villages:{id:'villages',name:'Drei Dörfer',target:12},detour:{id:'detour',name:'Die Kunst des Umwegs',target:5},caravan:{id:'caravan',name:'Die letzte Karawane',target:20},garrison:{id:'garrison',name:'Die letzte Garnison',target:3},greed:{id:'greed',name:'Der Fluch der Gier',target:12}};
  function daily(day){
    const time=Date.parse(day+'T00:00:00Z'),offset=Math.floor((time-Date.UTC(2026,8,22))/86400000);
    // Preserve already played days. New missions enter only at a UTC day boundary.
    const next=Math.floor((time-Date.UTC(2026,9,25))/86400000);
    const expanded=Math.floor((time-Date.UTC(2026,10,1))/86400000);
    const villages=Math.floor((time-Date.UTC(2026,10,8))/86400000);
    const power=Math.floor((time-Date.UTC(2026,10,15))/86400000);
    const expedition=Math.floor((time-Date.UTC(2026,10,22))/86400000);
    const draft=Math.floor((time-Date.UTC(2026,10,29))/86400000);
    const moving=Math.floor((time-Date.UTC(2026,11,7))/86400000);
    if(moving>=0)return {...dailyMissions[['movingFortress','towerDraft','expedition','powerGrid','villages','detour','greed','caravan','garrison'][moving%9]]};
    if(draft>=0)return {...dailyMissions[['towerDraft','expedition','powerGrid','villages','detour','greed','caravan','garrison'][draft%8]]};
    if(expedition>=0)return {...dailyMissions[['expedition','powerGrid','villages','detour','greed','caravan','garrison'][expedition%7]]};
    if(power>=0)return {...dailyMissions[['powerGrid','villages','detour','greed','caravan','garrison'][power%6]]};
    if(villages>=0)return {...dailyMissions[['villages','detour','greed','caravan','garrison'][villages%5]]};
    if(expanded>=0)return {...dailyMissions[['detour','greed','caravan','garrison'][expanded%4]]};
    return {...dailyMissions[next>=0?['greed','caravan','garrison'][next%3]:Math.abs(offset%2)===1?'garrison':'caravan']};
  }
  function greedOffers(state){
    const wave=state.wave+1,gold=12+wave*2;
    return [
      {id:'swarm',name:'Schwarmvertrag',gold,points:2,count:6,description:'Sechs zusätzliche schnelle Schwarmgegner.'},
      {id:'healers',name:'Heilervertrag',gold:gold+8,points:3,count:4,description:'Ein Feldheiler und drei zusätzliche gepanzerte Begleiter.'},
      {id:'elite',name:'Elitevertrag',gold:gold+16,points:4,count:1,description:'Ein Elitegegner mit vierfachem Leben, Rüstung und Magieresistenz. Drei Basisschaden bei Durchbruch.'}
    ];
  }
  function acceptGreed(state,id){
    if(state.challengeKind!=='greed'||state.phase!=='build'||state.waveRunning||state.hp<=0||state.celebrationActive||state.endless||state.wave>=12||state.greedContract?.wave===state.wave+1)return false;
    const offer=greedOffers(state).find(o=>o.id===id);if(!offer)return false;
    state.greedContract={id,wave:state.wave+1,points:offer.points};state.gold+=offer.gold;
    state.goldEarned.greed=(state.goldEarned.greed||0)+offer.gold;
    return true;
  }
  function settleGreed(state){
    const contract=state.greedContract;
    if(state.challengeKind!=='greed'||!contract||contract.wave!==state.wave||contract.settled)return;
    contract.settled=true;state.greedScore=(state.greedScore||0)+contract.points;
  }
  // Preserve the opening curve; late health grows with 8 % rather than 10 %.
  function normalHealth(wave){return Math.round((28+wave*7)*Math.pow(1.10,Math.max(0,Math.min(wave,35)-3))*Math.pow(1.08,Math.max(0,wave-35))*(1+Math.min(.18,Math.max(0,wave-3)*.006)));}
  function bossProfile(wave){
    if(wave<15||(wave-15)%10!==0) return null;
    // Gradually establish a boss floor after W35; no discontinuity in the opening bosses.
    const hp=Math.max(Math.round(1200*Math.pow((wave-5)/10,1.8)),Math.round(normalHealth(wave)*Math.min(2,Math.max(0,(wave-35)/20))));
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
    caravan=caravan&&(!context.challengeKind||context.challengeKind==='caravan');
    const dev=typeof HexDevEnemies!=='undefined'&&HexDevEnemies.plan(wave,context);if(dev)return dev;
    if(['towerDraft','movingFortress'].includes(context.challengeKind)){
      const p=plan(wave,income,false,{...context,challengeKind:null});
      const factor=1+Math.max(0,wave-3)*(context.challengeKind==='towerDraft'?.10:.08);
      for(const e of p.enemies)for(const field of ['hp','armorHp','magicHp'])if(e[field])e[field]=Math.ceil(e[field]*factor);
      return p;
    }
    if(context.challengeKind==='expedition'){
      const p=plan(wave,0,false,{...context,challengeKind:null}),factor=1+Math.max(0,wave-2)*.12;
      for(const e of p.enemies)for(const field of ['hp','armorHp','magicHp'])if(e[field])e[field]=Math.ceil(e[field]*factor);return p;
    }
    if(context.challengeKind==='powerGrid'){
      const p=plan(wave,0,false,{...context,challengeKind:null});
      if(wave===12){p.boss=bossProfile(15);p.maxGold+=p.boss.killGold||0;}return p;
    }
    if(context.challengeKind==='villages'){
      const strength=wave+Math.floor(wave/3),p=plan(strength,0,false,{...context,challengeKind:null}),targets=HexVillages.targets(wave);
      if(wave===12){p.boss=bossProfile(15);p.maxGold+=p.boss.killGold||0;}
      const enemies=Array.from({length:Math.ceil(p.enemies.length*(1+(targets.length-1)*.5))},(_,i)=>({...p.enemies[i%p.enemies.length]}));
      for(const e of enemies){e.hp=Math.ceil(e.hp*1.1);if(e.maxHp)e.maxHp=e.hp;if(e.armorHp)e.armorHp=Math.ceil(e.armorHp*1.25);}
      const killGold=enemies.reduce((n,e)=>n+(e.killGold??economy.kill),0);
      return {...p,wave,strength,enemies,count:enemies.length,killGold,maxGold:p.maxGold-p.killGold+killGold,villageTargets:targets};
    }
    if(context.challengeKind==='detour'){
      const strength=[6,10,14,16,17][Math.min(4,Math.max(0,wave-1))],p=plan(strength,0,false,{...context,challengeKind:null});
      for(const e of p.enemies)e.killGold=0;if(p.boss)p.boss.killGold=0;
      return {...p,wave,strength,killGold:0,completionGold:0,income:0,maxGold:0};
    }
    if(context.challengeKind==='garrison'){
      const strength=18+Math.max(0,wave-1)*3,p=plan(strength,0,false,{...context,challengeKind:null});
      for(const enemy of p.enemies)enemy.killGold=0;if(p.boss)p.boss.killGold=0;
      return {...p,wave,killGold:0,completionGold:0,income:0,maxGold:0};
    }
    // Keep the opening approachable; growing routes/defenses need compounding pressure.
    const count=wave===1?5:5+wave*2,hp=normalHealth(wave);
    const speed=(.345+Math.min(.015,Math.max(0,wave-3)*.0007))*54*Math.sqrt(3)*(wave===1?.8:1);
    const enemies=Array.from({length:count},(_,i)=>{
      const type=wave>=5&&i%5===0?'warded':wave>=4&&i%4===0?'armored':wave>=3&&i%3===0?'swarm':'normal';
      return {type,name:{normal:'Normal',armored:'Gepanzert',warded:'Magiegeschützt',swarm:'Schwarm'}[type],hp:type==='swarm'?Math.round(hp*.6):hp,armorHp:type==='armored'?Math.round(hp*.3):0,magicHp:type==='warded'?Math.round(hp*.25):0,speed:speed*(type==='swarm'?1.3:type==='armored'?.8:type==='warded'?.9:1)};
    });
    // A deterministic rotating roster; special enemies replace ordinary spawn slots.
    const boss=bossProfile(wave),immunity=elementFor(wave,context);
    const catalog=[
      [6,'shieldbearer',{name:'Schildknecht',shieldHits:3,speed:speed*.85,abilityIcon:'▣',description:'Der Schild blockiert drei Treffer vollständig, auch Flächenschaden. Jeder Treffer entfernt nur einen Schildstack.'}],
      [12,'splitter',{name:'Splittergolem',speed:speed*.75,armorHp:Math.round(hp*.35),splitOnDeath:true,description:'Zerfällt in zwei kleine Golems. Das Gold verteilt sich auf alle drei.'}],
      [13,'thornToad',{name:'Donnerkröte',abilityIcon:'↟',description:'Bewegt sich nur springend. Kann gelegentlich auf eine nahe Straße im Nachbarhex abkürzen. Verlangsamung verkürzt die Sprünge.'}],
      [17,'moltingBeetle',{name:'Häutungskäfer',speed:speed*.7,armorHp:Math.round(hp*.4),abilityIcon:'⬡',description:'Nach dem Panzerbruch dauerhaft 40 % schneller.'}],
      [18,'healer',{name:'Feldheiler',hp:Math.round(hp*.8),speed:speed*.9,healRadius:50,healInterval:3000,description:'Heilt andere Gegner im kleinen Umkreis alle 3 Sekunden um bis zu 5 % (maximal 20 + 8 je Welle). Heiler heilen einander nicht.'}],
      [21,'tarSnail',{name:'Pechschnecke',hp:hp*2,speed:speed*.8,abilityIcon:'≈',description:'Ihre Pechspur schützt andere Gegner: 20 % weniger Schaden, ohne Verlangsamung. Feuer entzündet das Pech.'}],
      [26,'elementCarrier',{name:'Elementträger · '+({fire:'Feuer',water:'Wasser',lightning:'Blitz'})[immunity],immunity,abilityIcon:({fire:'🔥',water:'💧',lightning:'ϟ'})[immunity],color:({fire:'#ef7449',water:'#56c5ef',lightning:'#efd557'})[immunity],description:'Immun gegen '+({fire:'Feuer',water:'Wasser',lightning:'Blitz'})[immunity]+'. Andere Schadensarten wirken normal.'+(immunity==='water'?' Wasserverlangsamung wirkt nicht; Frost-Auren wirken weiterhin.':'')}],
      [28,'mushroomColossus',{name:'Pilzkoloss',hp:Math.round(hp*1.5),speed:speed*.65,abilityIcon:'♣',description:'Hinterlässt beim Tod vier Sekunden Sporen. Gegner darin können von Türmen nicht anvisiert werden.'}],
      [38,'ramBeetle',{name:'Rammbockkäfer',hp:Math.round(hp*1.25),speed:speed*.8,abilityIcon:'»',description:'Beschleunigt auf Geraden; Kurven und Verlangsamungen bremsen. Bei vollem Tempo drei Basisschaden.'}]
    ];
    let pool=catalog.filter(([start,type])=>wave>=start&&(type!=='elementCarrier'||immunity)&&!(boss?.bossKind==='hunter'&&type==='tarSnail'));
    const debut=pool.find(([start])=>start===wave),limit=boss?1:wave<15?1:wave<36?2:wave%4===0?3:2;
    const chosen=[];
    if(debut)chosen.push(debut);
    if(debut||boss||wave%3!==0){
      let hash=0;for(const char of String(context.seed||'default'))hash=(Math.imul(hash,31)+char.charCodeAt(0))>>>0;
      pool=pool.filter(entry=>entry!==debut);const offset=pool.length?(hash+wave)%pool.length:0;
      for(let i=0;i<pool.length&&chosen.length<limit;i++)chosen.push(pool[(offset+i)%pool.length]);
    }
    const slots=enemies.map((e,i)=>e.type==='normal'?i:-1).filter(i=>i>=0);
    let budget=Math.max(1,Math.floor(count*.2));
    for(const [start,type,profile] of chosen){
      const support=['healer','tarSnail','mushroomColossus'].includes(type);
      const amount=boss||support||start===wave?1:Math.min(3,1+Math.floor((wave-start)/12));
      for(let i=0;i<amount&&slots.length&&budget>0;i++,budget--){const index=slots.shift();enemies[index]={hp,armorHp:0,magicHp:0,speed,type,...profile};}
    }
    if(caravan){let before=0;for(let w=1;w<wave;w++)before+=w===1?5:5+2*w;enemies.forEach((enemy,i)=>{enemy.speed*=.85;if((before+i+1)%10===0){enemy.caravan=true;enemy.name+=' · Karawanenkasse';enemy.killGold=18;enemy.goldLoss=10;}});if(boss)boss.speed*=.85;}
    if(context.challengeKind==='greed'&&context.greedContract?.wave===wave){
      const common={hp,armorHp:0,magicHp:0,speed,killGold:0,greed:true};
      if(context.greedContract.id==='swarm')for(let i=0;i<6;i++)enemies.push({...common,type:'swarm',name:'Vertragsschwarm',hp:Math.round(hp*.6),speed:speed*1.3});
      if(context.greedContract.id==='healers'){
        enemies.push({...common,type:'healer',name:'Vertragsheiler',hp:Math.round(hp*.8),healRadius:50,healInterval:3000});
        for(let i=0;i<3;i++)enemies.push({...common,type:'armored',name:'Vertragswache',armorHp:Math.round(hp*.3),speed:speed*.8});
      }
      if(context.greedContract.id==='elite')enemies.push({...common,type:'armored',name:'Vertragselite',hp:hp*4,armorHp:hp,magicHp:Math.round(hp*.5),speed:speed*.85,baseDamage:3});
    }
    const killGold=enemies.reduce((n,e)=>n+(e.killGold??economy.kill),0);
    return {wave,count:enemies.length,hp,speed,enemies,boss,type:'Gegner',killGold,completionGold:economy.completion,income,maxGold:killGold+economy.completion+income+(boss?.killGold||0)};
  }
  const enemyAssets=Object.fromEntries(["shieldbearer", "moltingBeetle", "thornToad", "tarSnail", "mushroomColossus", "ramBeetle"].map(type=>[type,'assets/enemies-concepts/'+type+'.png']));
  return {daily,dailyMissions,greedOffers,acceptGreed,settleGreed,economy,plan,bossProfile,elementFor,enemyAssets};
})();


