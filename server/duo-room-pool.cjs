'use strict';
const fs=require('node:fs'),path=require('node:path'),{createWorkerStore}=require('./duo-worker-client.cjs'),{atomicWrite}=require('./duo-store.cjs'),{readCheckpoint}=require('./duo-partitioned-storage.cjs');
const SIZE=8;
function prepare(file){
 const loaded=readCheckpoint(file);if(loaded.pool)return loaded.pool.files.map(name=>path.join(file+'.pool',name));
 const snapshot=loaded.snapshot||{format:'autohex-lobbies',version:1,rooms:[],attempts:[],settlements:[]};
 // Validate the complete old checkpoint before touching any persistent file.
 require('./duo-lobbies.cjs').createLobbies({snapshot});
 const dir=file+'.pool';fs.mkdirSync(dir,{recursive:true,mode:0o700});if(fs.lstatSync(dir).isSymbolicLink())throw Error('Invalid worker pool directory');
 const parts=Array.from({length:SIZE},()=>({format:'autohex-lobbies',version:1,rooms:[],attempts:[],settlements:[]})),owners=new Map();
 snapshot.rooms.forEach((room,i)=>{parts[i].rooms.push(room);for(const seat of room.room.seats.filter(Boolean))owners.set(seat.token,i);});
 for(const entry of snapshot.attempts)parts[owners.get(entry[1].result.token)??0].attempts.push(entry);
 for(const entry of snapshot.settlements)parts[owners.get(entry[0])??0].settlements.push(entry);
 const files=parts.map((part,i)=>{const name='slot-'+i+'.json',target=path.join(dir,name);if(fs.existsSync(target)&&fs.lstatSync(target).isSymbolicLink())throw Error('Invalid worker pool file');atomicWrite(target,JSON.stringify(part));return name;});
 if(loaded.text){const backup=file+'.before-pool';if(fs.existsSync(backup)){if(fs.readFileSync(backup,'utf8')!==loaded.text)throw Error('Existing pool migration backup differs');}else atomicWrite(backup,loaded.text);}
 if(loaded.snapshot)atomicWrite(file+'.before-pool-export',JSON.stringify(snapshot));
 // Only publish after every slot is durable. Until here the original is valid.
 atomicWrite(file,JSON.stringify({format:'autohex-worker-pool',version:1,files}));
 return files.map(name=>path.join(dir,name));
}
function createRoomPool(file,{maintenance=false,workerFactory}={}){
 file=path.resolve(file);const workers=[],tokens=new Map(),codes=new Map(),attempts=new Map();let routing=[],failed=false,closing=false,control=Promise.resolve(),closeTask;
 const fail=()=>{failed=true;for(const worker of workers)void worker.stopTicks().catch(()=>{});};
 const ready=(async()=>{const files=prepare(file);for(const target of files)workers.push(createWorkerStore(target,{maintenance,limit:1,workerFactory,onFailure:fail}));await Promise.all(workers.map(w=>w.ready));await refresh();})().catch(error=>{fail();throw error;});
 async function refresh(){
  const next=await Promise.all(workers.map(w=>w.routing()));tokens.clear();codes.clear();attempts.clear();
  next.forEach((r,i)=>{for(const token of r.tokens){if(tokens.has(token))throw Error('Duplicate pool token');tokens.set(token,i);}for(const room of r.rooms){if(codes.has(room.code))throw Error('Duplicate pool code');codes.set(room.code,i);}for(const id of r.attempts){if(attempts.has(id))throw Error('Duplicate pool request');attempts.set(id,i);}});routing=next;
 }
 const healthy=()=>!failed&&!closing&&workers.every(w=>w.healthy);
 async function check(){await ready;if(!healthy())throw Error('Duo worker pool unavailable');}
 function exclusive(action){const task=control.then(action);control=task.catch(()=>{});return task;}
 async function lobby(kind,body){await check();return exclusive(async()=>{
  if(!body||Array.isArray(body)||typeof body.requestId!=='string'||!/^[a-f0-9-]{36}$/.test(body.requestId)||Object.keys(body).some(k=>!['requestId',...(kind==='join'?['code']:[])].includes(k)))return {ok:false,reason:'invalid'};
  await refresh();let owner=attempts.get(body.requestId);
  if(owner!==undefined)return workers[owner][kind](body);
  if(maintenance)return {ok:false,reason:'maintenance'};
  if(attempts.size>=1000)return {ok:false,reason:'capacity'};
  if(kind==='join'){if(typeof body.code!=='string'||!/^[A-F0-9]{10}$/.test(body.code))return {ok:false,reason:'invalid'};owner=codes.get(body.code);if(owner===undefined)return {ok:false,reason:'not-found'};}
  else{owner=routing.findIndex(r=>r.rooms.length===0);if(owner<0)return {ok:false,reason:'capacity'};}
  const result=await workers[owner][kind](body,...(kind==='create'?[[...codes.keys()]]:[]));
  // Only publish routes after the worker has durably acknowledged the operation.
  if(result.ok){tokens.set(result.token,owner);codes.set(result.code,owner);attempts.set(body.requestId,owner);}
  return result;
 });}
 async function all(method,...args){await check();await control;return Promise.all(workers.map(w=>w[method](...args)));}
 const absent={hasSeat:false,pushKey:null,receipts:null,view:null,touch:false};
 const api={ready,get workerCount(){return workers.length;},get healthy(){return healthy();},get maintenance(){return maintenance;},get discarded(){return workers.reduce((n,w)=>n+w.discarded,0);},create:body=>lobby('create',body),join:body=>lobby('join',body),
  async live(){const rows=await all('live');return {rooms:rows.reduce((n,r)=>n+r.rooms,0),seatsConnected:rows.reduce((n,r)=>n+r.seatsConnected,0),seatsWaiting:rows.reduce((n,r)=>n+r.seatsWaiting,0),seatsDisconnected:rows.reduce((n,r)=>n+r.seatsDisconnected,0),capacity:16,roomCapacity:8,maintenance};},
  async setMaintenance(value){if(typeof value!=='boolean')throw Error('Invalid maintenance state');await check();return exclusive(async()=>{try{await Promise.all(workers.map(w=>w.setMaintenance(value)));maintenance=value;}catch(error){failed=true;throw error;}});},
  flush:()=>all('flush'),tick:()=>all('tick'),startTicks:()=>all('startTicks'),stopTicks:()=>all('stopTicks'),
  async backup(){await all('flush');atomicWrite(file+'.before-update',JSON.stringify(readCheckpoint(file).snapshot));},
  close(){if(closeTask)return closeTask;closing=true;return closeTask=(async()=>{await ready.catch(()=>{});await control;const results=await Promise.allSettled(workers.map(w=>w.close()));if(results.some(r=>r.status==='rejected'))throw Error('Duo worker pool close failed');})();}
 };
 for(const method of ['hasSeat','pushKey','receipts','view','touch','claim','leave','receive','applyAugments','access','encodedPush'])api[method]=async(token,...args)=>{
  await check();const owner=tokens.get(token);
  if(owner===undefined)return Object.hasOwn(absent,method)?absent[method]:['access','encodedPush'].includes(method)?{status:401,body:{error:'unauthorized'}}:{ok:false,reason:'unauthorized'};
  return workers[owner][method](token,...args);
 };
 return api;
}
module.exports={createRoomPool,prepare};
