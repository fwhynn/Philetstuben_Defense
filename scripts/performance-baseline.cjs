// Synthetic combat benchmark, not browser FPS or a naturally played run.
// Usage: node scripts/performance-baseline.cjs [output.json]
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {performance}=require('node:perf_hooks');
const {createHash}=require('node:crypto');
function fixture(wave){
  const context=vm.createContext({});
  for(const name of ['random','biomes','data','waves','combat'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../classes',name+'.js'),'utf8'),context);
  const api=vm.runInContext('({step:HexCombat.step,data:HexData,waves:HexWaves})',context);
  const state={seed:'performance-v1',hp:10000,gold:0,goldEarned:{kills:0},waveKills:0,enemies:[],projectiles:[],mines:[]};
  // Real wave profiles, all present together on deliberately long parallel paths.
  state.enemies=api.waves.plan(wave).enemies.map((profile,id)=>{
    const x=id%10*10,y=Math.floor(id/10)*6;
    return {...profile,id,hp:profile.hp,maxHp:profile.hp,alive:true,index:0,t:0,x,y,points:Array.from({length:101},(_,i)=>({x:x+i*20,y}))};
  });
  const types=['archer','chain','catapult','freeze','mine'];
  const refs=Array.from({length:40},(_,i)=>({tw:{type:types[i%5],lastShot:0},pos:{x:i%10*80,y:Math.floor(i/10)*25},roadPoints:Array.from({length:40},(_,n)=>({x:n*20,y:40}))}));
  return {api,state,refs};
}
function run(wave,countCalls=false){
  const {api,state,refs}=fixture(wave),times=[];let calls=0,maxMines=0,maxProjectiles=0;
  if(countCalls){const original=api.data.towerDefinition;api.data.towerDefinition=(...args)=>{calls++;return original(...args);};}
  for(let tick=1;tick<=400;tick++){
    const start=performance.now();api.step(state,refs,api.data.TOWERS,.05,tick*50);times.push(performance.now()-start);
    maxMines=Math.max(maxMines,state.mines.length);maxProjectiles=Math.max(maxProjectiles,state.projectiles.length);
  }
  const checksum=createHash('sha256').update(JSON.stringify({state,refs})).digest('hex');
  return {times,calls,checksum,maxMines,maxProjectiles};
}
function main(){
  const cases=[];
  for(const wave of [40,50,60]){
    run(wave); // Discard warm-up. Instrumentation is separate from timing samples.
    const samples=Array.from({length:3},()=>run(wave)),counted=run(wave,true);
    if(samples.some(s=>s.checksum!==counted.checksum))throw Error('Non-deterministic fixture');
    const times=samples.flatMap(s=>s.times).sort((a,b)=>a-b);
    cases.push({wave,enemies:5+wave*2,towers:40,ticksPerSample:400,samples:3,p50TickMs:times[Math.floor(times.length*.5)],p95TickMs:times[Math.floor(times.length*.95)],meanTickMs:times.reduce((a,b)=>a+b,0)/times.length,definitionCalls:counted.calls,checksum:counted.checksum,maxMines:counted.maxMines,maxProjectiles:counted.maxProjectiles});
  }
  const report={date:new Date().toISOString(),node:process.version,platform:process.platform,arch:process.arch,cpu:require('node:os').cpus()[0]?.model,combatHash:createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../classes/combat.js'))).digest('hex'),scope:'Synthetic combat only; no DOM, rendering, runtime spawn routing or mine road geometry. Real wave profiles, simultaneous enemies, 40 basic towers, 20 seconds simulated per sample.',cases};
  if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}
if(require.main===module)main();
module.exports={fixture,run};
