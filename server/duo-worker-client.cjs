'use strict';
const path=require('node:path'),{Worker}=require('node:worker_threads');
function createWorkerStore(file,{maintenance=false,limit=8,onFailure,workerFactory=options=>new Worker(path.join(__dirname,'duo-store-worker.cjs'),options)}={}){
 const worker=workerFactory({workerData:{file:path.resolve(file),maintenance,limit}}),pending=new Map();
 let sequence=0,healthy=true,discarded=0,closing=false,closed=false,resolveReady,rejectReady;
 const ready=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
 let notified=false;const notifyFailure=()=>{if(!notified){notified=true;onFailure?.();}};
 const fail=error=>{healthy=false;closed=true;rejectReady(error);for(const p of pending.values())p.reject(error);pending.clear();notifyFailure();};
 worker.on('error',fail);worker.on('exit',code=>{if(!closing||pending.size)fail(Error('Duo worker exited'));else closed=true;});
 worker.on('message',message=>{
  if(closed)return;
  if(message.healthy!==undefined){healthy=message.healthy;if(!healthy)notifyFailure();}if(message.maintenance!==undefined)maintenance=message.maintenance;
  if(message.ready!==undefined){if(message.ready){discarded=message.discarded;resolveReady();}else fail(Error(message.error));return;}
  const p=pending.get(message.id);if(!p)return;pending.delete(message.id);
  if(message.error)p.reject(Error(message.error));else p.resolve(message.value);
 });
 async function call(method,...args){
  await ready;if(closed||closing&&method!=='close')throw Error('Duo worker unavailable');
  if(pending.size>=1024&&!['close','stopTicks'].includes(method))throw Error('Duo worker busy');
  return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});try{worker.postMessage({id,method,args});}catch(error){pending.delete(id);reject(error);}});
 }
 const api={ready,get healthy(){return healthy&&!closed&&!closing;},get maintenance(){return maintenance;},get discarded(){return discarded;},async close(){if(closing)return;closing=true;try{await call('close');}finally{await worker.terminate();closed=true;}}};
 for(const name of ['routing','hasSeat','pushKey','receipts','live','claim','leave','create','join','receive','view','touch','tick','setMaintenance','applyAugments','flush','backup','startTicks','stopTicks','access','encodedPush'])api[name]=(...args)=>call(name,...args);
 return api;
}
module.exports={createWorkerStore};
