'use strict';
const {parentPort,workerData}=require('node:worker_threads');
const {createStore}=require('./duo-store.cjs'),{perform}=require('./duo-access.cjs');
let rooms,timer;
const stopTicks=()=>{clearInterval(timer);timer=null;};
function startTicks(){
 if(timer)return;let last=performance.now(),debt=0;
 timer=setInterval(()=>{const now=performance.now();debt=Math.min(1000,debt+now-last);last=now;let count=0;while(debt>=50&&count++<5){rooms.tick();debt-=50;}if(!rooms.healthy){stopTicks();parentPort.postMessage({healthy:false});}},25);
}
try{
 rooms=createStore(workerData.file,{partitioned:true,maintenance:workerData.maintenance,limit:workerData.limit});
 parentPort.postMessage({ready:true,healthy:rooms.healthy,maintenance:rooms.maintenance,discarded:rooms.discarded});
}catch{parentPort.postMessage({ready:false,error:'Duo storage initialization failed'});parentPort.close();}
const methods=new Set(['routing','hasSeat','pushKey','receipts','live','claim','leave','create','join','receive','view','touch','tick','setMaintenance','applyAugments','flush','backup']);
if(rooms)parentPort.on('message',({id,method,args=[]})=>{
 try{
  let value;
  if(method==='access')value=perform(rooms,...args);
  else if(method==='encodedPush'){
   value=perform(rooms,args[0],args[1],'/push',args[2]);
   if(value.status===200&&value.body){const view=value.body;value={status:200,body:{key:view.serverId+view.epoch+':'+view.revision+':'+view.next,json:JSON.stringify(view)}};}
  }
  else if(method==='startTicks')startTicks();
  else if(method==='stopTicks')stopTicks();
  else if(method==='close'){stopTicks();rooms.flush();}
  else if(methods.has(method))value=rooms[method](...args);
  else throw Error('Invalid worker method');
  parentPort.postMessage({id,value,healthy:rooms.healthy,maintenance:rooms.maintenance});
  if(method==='close')parentPort.close();
 }catch{parentPort.postMessage({id,error:'Duo worker operation failed',healthy:rooms.healthy,maintenance:rooms.maintenance});}
});
