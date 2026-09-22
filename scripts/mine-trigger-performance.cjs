// Side-by-side reference comparison; headless trigger work, not FPS.
const {load,fixture}=require('../tests/helpers/mine-trigger.cjs');
const {performance}=require('node:perf_hooks'),fs=require('node:fs'),{createHash}=require('node:crypto');
const results=[];
for(const kind of ['spread','mixed','dense','small']){
  const before=load(true),after=load(),timings={before:[],after:[]};let referenceHash;
  for(let i=0;i<60;i++)for(const name of (i%2?['after','before']:['before','after'])){
    const api=name==='before'?before:after,state=fixture(kind),events=[],start=performance.now();api.trigger(state,e=>events.push(e));const elapsed=performance.now()-start;
    const hash=createHash('sha256').update(JSON.stringify({state,events})).digest('hex');
    referenceHash??=hash;if(hash!==referenceHash)throw Error('Behavior differs');
    if(i>=10)timings[name].push(elapsed);
  }
  results.push({kind,hash:referenceHash,beforeChecksPerRun:before.checks/60,afterChecksPerRun:after.checks/60,beforeMeanMs:timings.before.reduce((a,b)=>a+b)/50,afterMeanMs:timings.after.reduce((a,b)=>a+b)/50});
}
const report={node:process.version,cpu:require('node:os').cpus()[0]?.model,scope:'Mine trigger phase only, alternating reference/current, 10 warmups + 50 samples; distance instrumentation in both',results};
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
