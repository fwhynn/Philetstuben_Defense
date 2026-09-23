const {test}=require('node:test'),assert=require('node:assert/strict');
const {create}=require('../classes/duo-server-status.js');
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function setup(fetcher){const jobs=new Map(),states=[];let id=0,time=0;const monitor=create({fetcher,onStatus:s=>states.push(s),now:()=>{time+=37;return time;},schedule:(fn,delay)=>{jobs.set(++id,{fn,delay});return id;},cancel:id=>jobs.delete(id)});return {monitor,jobs,states};}
test('HTTP ping reports latency and maintenance, polls without a player session, and stops',async()=>{
 let maintenance=false;const h=setup(async(url,options)=>{assert.equal(url,'/healthz');assert.equal(options.cache,'no-store');assert.equal(options.credentials,'omit');return {ok:true,json:async()=>({ok:true,service:'autohex-duo',maintenance})};});
 h.monitor.start();await settle();assert.deepEqual(h.states.at(-1),{state:'online',ms:37});assert.equal(h.jobs.size,1);
 maintenance=true;const [id,job]=[...h.jobs][0];h.jobs.delete(id);assert.equal(job.delay,20000);job.fn();await settle();assert.equal(h.states.at(-1).state,'maintenance');h.monitor.stop();assert.equal(h.jobs.size,0);
});
test('errors and unrelated health responses never show a green indicator',async()=>{
 for(const response of [{ok:false,json:async()=>({ok:true,service:'autohex-duo'})},{ok:true,json:async()=>({ok:true})},{ok:true,json:async()=>{throw Error('HTML instead of JSON');}}]){const h=setup(async()=>response);h.monitor.start();await settle();assert.equal(h.states.at(-1).state,'offline');h.monitor.stop();}
});
test('timeouts recover, stopping cancels pending requests and stale responses cannot overwrite a fresh ping',async()=>{
 const requests=[],h=setup((url,{signal})=>new Promise((resolve,reject)=>{requests.push({resolve,signal});signal.addEventListener('abort',()=>reject(Error('aborted')));}));
 h.monitor.start();[...h.jobs.values()].find(j=>j.delay===5000).fn();await settle();assert.equal(h.states.at(-1).state,'offline');h.monitor.stop();h.monitor.start();h.monitor.stop();assert.equal(requests[1].signal.aborted,true);h.monitor.start();await settle();assert.equal(h.states.at(-1).state,'checking');requests[2].resolve({ok:true,json:async()=>({ok:true,service:'autohex-duo'})});await settle();assert.equal(h.states.at(-1).state,'online');h.monitor.stop();
});
