// Synthetic spawn workload. Excludes combat, renderer and DOM; not an FPS test.
const fs=require('node:fs'),{performance}=require('node:perf_hooks'),{createHash}=require('node:crypto');
const loadCore=require('../headless-core.cjs');
function sample(wave){
  const core=loadCore(),{state,random}=core.runtime.create({seed:'spawn-performance-v1',runId:'benchmark',loadout:['archer','catapult','chain','freeze','mine']});
  state.wave=wave;
  for(let q=1;q<=40;q++)state.map.set(q+',0',{q,r:0,type:'straight',roads:[0,3],slots:0,towers:[]});
  let graphs=0,plans=0;const graph=core.map.routeGraph,plan=core.waves.plan;
  core.map.routeGraph=(...args)=>{graphs++;return graph(...args);};
  core.waves.plan=(...args)=>{plans++;return plan(...args);};
  const start=performance.now();
  for(let i=0;i<5+2*wave;i++){
    const sources=core.runtime.spawnSources(state);
    core.runtime.spawnEnemy(state,core.runtime.nextSourcePoints(state,random,sources[0]),i);
  }
  return {ms:performance.now()-start,graphs,plans,checksum:createHash('sha256').update(JSON.stringify({enemies:state.enemies,random:random.snapshot()})).digest('hex')};
}
const cases=[40,50,60].map(wave=>{
  sample(wave);const samples=Array.from({length:3},()=>sample(wave));
  if(samples.some(s=>s.checksum!==samples[0].checksum))throw Error('Non-deterministic spawn fixture');
  return {wave,enemies:5+2*wave,tiles:41,samples,...samples[0],meanMs:samples.reduce((n,s)=>n+s.ms,0)/samples.length};
});
const report={node:process.version,platform:process.platform,cpu:require('node:os').cpus()[0]?.model,scope:'40-tile straight road, all normal wave spawns; no combat, DOM or renderer',cases};
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
