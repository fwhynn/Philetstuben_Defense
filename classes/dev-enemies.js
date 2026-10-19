/* Local isolated profile only. Never used as a server/admin permission. */
const HexDevEnemies=(()=>{
  const entries=[['normal','Normal',1],['armored','Gepanzert',4],['warded','Magiegeschützt',5],['swarm','Schwarm',3],['shieldbearer','Schildknecht',6],['splitter','Splittergolem',12],['shard','Golemsplitter',12],['thornToad','Donnerkröte',13],['moltingBeetle','Häutungskäfer',17],['healer','Feldheiler',18],['tarSnail','Pechschnecke',21],['elementCarrier','Elementträger',26],['mushroomColossus','Pilzkoloss',28],['ramBeetle','Rammbockkäfer',38],['iron','Eisenkoloss',15],['hunter','Sturmjäger',25],['summoner','Seelenmatriarchin',35],['grass','Wächter · Grasland',1],['ash','Wächter · Aschelande',1],['storm','Wächter · Sturmhochland',1],['desert','Wächter · Dünenmeer',1]];
  entries.splice(entries.findIndex(e=>e[0]==='elementCarrier'),1,...[['fire','Feuer'],['water','Wasser'],['lightning','Blitz']].map(([id,name])=>['element-'+id,'Elementträger · '+name,26]));
  entries.push(['summoned','Seelendiener',35]);
  const allowed=()=>!!(globalThis.HexFirstPlayerTest?.available&&globalThis.HexFirstPlayerTest?.enabled&&globalThis.HexFirstPlayerTest?.active);
  function profile(id,wave){
    const entry=entries.find(e=>e[0]===id);if(!entry)return null;
    const base=HexWaves.plan(Math.max(1,wave),0,false,{});let p;
    if(id==='summoned')p={type:'swarm',summoned:true,hp:Math.round(HexWaves.bossProfile(35).hp*.025),speed:26*.8,armorHp:0,magicHp:0,baseDamage:1};
    else if(['iron','hunter','summoner'].includes(id))p=HexWaves.bossProfile(entry[2]);
    else if(['grass','ash','storm','desert'].includes(id))p={...HexExploration.bossProfile(wave),originBiome:id,resistances:id==='ash'?{fire:.5}:id==='storm'?{lightning:.5,wind:.5}:{},slowResistance:id==='desert'?.5:0};
    else if(id==='shard')p={type:'shard',hp:base.hp*.4,speed:base.speed,armorHp:0,magicHp:0};
    else{const source=HexWaves.plan(entry[2],0,false,{});p={...source.enemies.find(e=>e.type===(id.startsWith('element-')?'elementCarrier':id))};const ratio=base.hp/source.hp;for(const field of ['hp','armorHp','magicHp'])p[field]=Math.round((p[field]||0)*ratio);p.speed*=base.speed/source.speed;
      if(id.startsWith('element-')){const element=id.slice(8);p.immunity=element;p.color=({fire:'#ef7449',water:'#56c5ef',lightning:'#efd557'})[element];p.abilityIcon=({fire:'🔥',water:'💧',lightning:'ϟ'})[element];p.description='Immun gegen '+entry[1].split(' · ')[1]+'. Andere Schadensarten wirken normal.';}
    }
    return {...p,name:entry[1],killGold:0};
  }
  function plan(wave,context){
    if(!allowed()||context.devEnemyWave!==wave||!Array.isArray(context.devEnemyRoster))return null;
    const enemies=[];for(const row of context.devEnemyRoster){const p=profile(row.id,wave);if(!p)continue;const n=Math.min(20,Math.max(1,Math.floor(Number(row.count)||1)));for(let i=0;i<n&&enemies.length<60;i++)enemies.push({...p});}
    if(!enemies.length)return null;
    return {wave,count:enemies.length,hp:enemies[0].hp,speed:enemies[0].speed,enemies,boss:null,type:'Dev-Testwelle',killGold:0,completionGold:0,income:0,maxGold:0,dev:true};
  }
  return {entries,allowed,plan};
})();
