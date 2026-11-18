/* Deterministic actual combat, not catalog DPS. No browser or player profiles.
 * node scripts/balance-new-towers.cjs -> artifacts/new-towers/balance.json
 * Equal gold and discrete purchase prices; unused change is recorded explicitly.
 */
const load=require('../headless-core.cjs'),fs=require('node:fs'),path=require('node:path');
const core=load(),types=['gravity','wind','poison','meteor','laser','gamble','portal'];
function makeTower(type,branch,level){const tw={type,level,lastShot:-Infinity};if(level>1){tw.branch=core.data.availableUpgrades(tw)[branch][0];if(level>2)tw.finalUpgrade=core.data.availableUpgrades(tw)[0][0];if(level>3)tw.ultimate=type;}tw.paid=core.data.TOWERS[type].cost+(tw.branch?core.data.UPGRADES[tw.branch].cost:0)+(tw.finalUpgrade?core.data.UPGRADES[tw.finalUpgrade].cost:0)+(tw.ultimate?core.data.ULTIMATES[type].cost:0);return tw;}
function arena(towers,{kind='normal',wave=10,seed='balance',stationary=false,duration=90,count=24,spacing=.6}={}){
 const run=core.runtime.create({seed,runId:'benchmark',loadout:core.profile.START_TOWERS}),s=run.state;Object.assign(s,{wave,hp:10000,maxHp:10000,phase:'wave',waveRunning:true,enemies:[],spawnQueue:[],pendingSpawns:0});
 const points=[{x:-440,y:0},{x:440,y:0}],roadPoints=Array.from({length:45},(_,i)=>({x:-440+i*20,y:0}));
 const refs=towers.map((tw,i)=>({tw:{...tw,statId:i+1},pos:{x:(i%5-2)*18,y:i%2?40:-40},roadPoints}));
 const base=core.waves.plan(wave,0).enemies.find(e=>e.type==='normal')||core.waves.plan(wave,0).enemies[0];
 const profile=kind==='boss'?{type:'boss',hp:base.hp*14,speed:base.speed*.6,baseDamage:5}:kind==='armored'?{type:'armored',hp:base.hp,armorHp:base.hp*.75,speed:base.speed*.8}:kind==='magic'?{type:'warded',hp:base.hp,magicHp:base.hp*.75,speed:base.speed*.9}:kind==='swarm'?{type:'swarm',hp:base.hp*.6,speed:base.speed*1.3}:kind==='shield'?{type:'shieldbearer',hp:base.hp,shieldHits:3,speed:base.speed}:base;
 let spawned=0,totalHealth=0,aliveTime=0;
 for(let frame=0;frame<duration*20;frame++){
  const time=frame*50;s.elapsedMs=time;
  while(spawned<count&&time>=spawned*spacing*1000){const hp=stationary?1e7:profile.hp,enemy={...profile,id:++spawned,alive:true,hp,maxHp:hp,armorHp:profile.armorHp||0,magicHp:profile.magicHp||0,maxArmorHp:profile.armorHp||0,maxMagicHp:profile.magicHp||0,speed:stationary?0:profile.speed,points,originPoints:points,index:0,t:stationary?.5:0,x:stationary?0:-440,y:0};s.enemies.push(enemy);totalHealth+=core.combat.durability(enemy);}
  aliveTime+=s.enemies.length*.05;core.combat.step(s,refs,core.data.TOWERS,.05,time);
  if(spawned===count&&!s.enemies.length)break;
 }
 const damage=Object.values(s.runTowerStats).reduce((n,t)=>n+(t.damage||0),0),kills=Object.values(s.runTowerStats).reduce((n,t)=>n+(t.kills||0),0),lostHp=10000-s.hp;
 return {netDamage:Math.round(totalHealth-s.enemies.reduce((n,e)=>n+core.combat.durability(e),0)),kills,leaks:kind==='boss'?lostHp/5:lostHp,survivors:s.enemies.length,damage:Math.round(damage),damageShare:Number((damage/totalHealth).toFixed(3)),enemySeconds:Math.round(aliveTime),spent:towers.reduce((n,t)=>n+t.paid,0),towerCount:towers.length};
}
function army(type,branch,level,budget,support=false){const selected=makeTower(type,branch,level),out=[],spendingLimit=support?budget*.42:budget;let left=budget;while(left>=selected.paid&&budget-left+selected.paid<=spendingLimit){out.push(selected);left-=selected.paid;}const filler=makeTower('archer',level>1?1:0,level>1?3:1);while(left>=filler.paid){out.push(filler);left-=filler.paid;}while(left>=25){out.push(makeTower('archer',0,1));left-=25;}return out;}
function run(){
 const cases=[],baselines=['archer','catapult','chain','freeze','mine','ballista','flame','element','necromancer'];
 for(const level of [1,4])for(const type of [...baselines,...types])for(let branch=0;branch<(level===1?1:core.data.availableUpgrades({type}).length);branch++){
  const support=['gravity','portal','freeze'].includes(type),budget=level===1?250:1000,towers=army(type,branch,level,budget,support),results={};
  for(const kind of ['normal','swarm','armored','magic','shield','boss']){
   const seeds=type==='gamble'?8:1,samples=[];for(let i=0;i<seeds;i++)samples.push(arena(towers,{kind,wave:level===1?10:18,seed:'combat-'+i,count:kind==='boss'?1:24,spacing:kind==='swarm'?.25:.65}));
   results[kind]={...samples[0],kills:Number((samples.reduce((n,r)=>n+r.kills,0)/seeds).toFixed(2)),damage:Math.round(samples.reduce((n,r)=>n+r.damage,0)/seeds),leaks:Number((samples.reduce((n,r)=>n+r.leaks,0)/seeds).toFixed(2)),samples:seeds};
  }
  const tw=makeTower(type,branch,level);cases.push({type,branch:tw.branch||null,level,name:core.data.towerDefinition(tw).name,budget,support,composition:towers.map(t=>({type:t.type,level:t.level,cost:t.paid})),results});
 }
 const dps=[];for(const type of [...baselines,...types])for(let branch=0;branch<core.data.availableUpgrades({type}).length;branch++){
  const tw=makeTower(type,branch,4),entry={type,branch:tw.branch,cost:tw.paid};for(const count of [1,6])for(const kind of ['normal','boss']){if(kind==='boss'&&count>1)continue;entry[kind+count]=Number((arena([tw],{kind,stationary:true,count,spacing:0,duration:20}).netDamage/20).toFixed(1));}dps.push(entry);
 }
 const mixtures=[];
 for(const type of ['archer','freeze','flame',...types])for(const branch of [0,1]){const towers=[makeTower(type,branch,4)];let left=1000-towers[0].paid;while(left>=175){towers.push(makeTower('flame',0,3));left-=175;}while(left>=25){towers.push(makeTower('archer',0,1));left-=25;}const results={};for(const kind of ['normal','swarm','armored','magic','boss'])results[kind]=arena(towers,{kind,wave:18,count:kind==='boss'?1:24,spacing:kind==='swarm'?.25:.65});mixtures.push({type,branch:towers[0].branch,spent:1000-left,results});}
 const result={mixtures,description:'Actual shared Solo/Duo combat, 50 ms steps, neutral terrain, no augments. Moving 880-unit road, 24 enemies or one boss. Tier 1: 250 gold/W10; tier 4: 1000 gold/W18. Support armies spend up to 42% on control, remainder on archers. Other armies fill discrete leftover gold with archers. Gamble uses eight seeds. Stationary values are a separate 20-second role check, not balance proof.',cases,dps};
 fs.mkdirSync(path.join(__dirname,'../artifacts/new-towers'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../artifacts/new-towers/balance.json'),JSON.stringify(result,null,2));
 for(const c of cases)console.log(`${c.level} ${c.name.padEnd(22)} ${c.results.normal.spent}g | `+Object.entries(c.results).map(([k,v])=>k+': '+v.kills+'/'+(k==='boss'?1:24)).join(' | '));
 console.log('20-second stationary DPS:');console.table(dps);return result;
}
module.exports={arena,makeTower,army,run};if(require.main===module)run();
