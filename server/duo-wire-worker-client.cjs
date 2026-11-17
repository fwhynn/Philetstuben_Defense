'use strict';
const {Worker}=require('node:worker_threads'),path=require('node:path');
function createWireWorker({workerFactory=()=>new Worker(path.join(__dirname,'duo-wire-worker.cjs'))}={}){
 let worker=null,sequence=0,closed=false;const pending=new Map();
 function start(){
  if(closed)throw Error('Duo encoder closed');if(worker)return worker;
  const current=worker=workerFactory();
  const fail=()=>{if(worker!==current)return;worker=null;for(const p of pending.values())p.reject(Error('Duo encoder unavailable'));pending.clear();void current.terminate();};
  current.on('error',fail);current.on('exit',fail);
  current.on('message',message=>{if(worker!==current)return;const p=pending.get(message.id);if(!p)return;pending.delete(message.id);message.error?p.reject(Error(message.error)):p.resolve(message.packet);});
  return current;
 }
 return {
  encode(key,view,enemyFields,now=Date.now()){
   if(pending.size>=128)return Promise.reject(Error('Duo encoder busy'));
   return new Promise((resolve,reject)=>{try{const active=start(),id=++sequence;pending.set(id,{resolve,reject});try{active.postMessage({id,method:'encode',key,view,enemyFields,now});}catch(error){pending.delete(id);reject(error);}}catch(error){reject(error);}});
  },
  ack(key,baseId){worker?.postMessage({method:'ack',key,baseId});},
  release(key){worker?.postMessage({method:'release',key});},
  async close(){closed=true;const current=worker;worker=null;for(const p of pending.values())p.reject(Error('Duo encoder closed'));pending.clear();if(current)await current.terminate();}
 };
}
module.exports={createWireWorker};
