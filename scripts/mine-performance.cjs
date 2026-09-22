// Synthetic mine-laying workload, not a browser/FPS benchmark.
const fs=require('node:fs'),{performance}=require('node:perf_hooks'),{createHash}=require('node:crypto');
const loadCore=require('../headless-core.cjs');
function fixture(){
  const core=loadCore(),run=core.runtime.create({seed:'mine-performance-v1',runId:'mines',loadout:['archer','catapult','chain','freeze','mine']});
  for(let q=1;q<=40;q++)run.state.map.set(q+',0',{q,r:0,type:q%2?'longRoad':'straight',roads:[0,3],slots:1,towers:q%4===0?[{type:'mine',lastShot:0}]:[null]});
  run.state.waveRunning=true;run.state.phase='wave';
  return {core,...run};
}
function sample(){
  const {core,state,random}=fixture();let geometryCalls=0;const geometry=core.map.roadGeometry;
  core.map.roadGeometry=(...args)=>{geometryCalls++;return geometry(...args);};
  const start=performance.now();
  for(let i=0;i<200;i++)core.runtime.advance(state,random,2);
  return {ms:performance.now()-start,geometryCalls,mines:state.mines.length,checksum:createHash('sha256').update(JSON.stringify({mines:state.mines,rng:state.mineRandom.snapshot()})).digest('hex')};
}
if(require.main===module){
  sample();const samples=Array.from({length:3},sample);
  if(samples.some(s=>s.checksum!==samples[0].checksum))throw Error('Non-deterministic mines');
  const report={node:process.version,cpu:require('node:os').cpus()[0]?.model,scope:'41 tiles, 10 mine layers, 200 advances of 2 seconds, no enemies/DOM/rendering; includes runtime and mine scans',samples,meanMs:samples.reduce((n,s)=>n+s.ms,0)/samples.length};
  if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
module.exports={fixture};
