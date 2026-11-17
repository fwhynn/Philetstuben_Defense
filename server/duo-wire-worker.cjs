'use strict';
const {parentPort}=require('node:worker_threads'),wire=require('../classes/duo-wire.js');
const sessions=new Map();
parentPort.on('message',({id,method,key,view,enemyFields,now,baseId})=>{
 if(method==='release'){sessions.delete(key);return;}
 if(method==='ack'){const state=sessions.get(key);if(state?.pending?.id===baseId){state.base=state.pending;state.pending=null;}return;}
 if(method!=='encode')return;
 try{
  // JSON text avoids cloning thousands of nested view objects across both
  // worker boundaries. It is the same JSON representation sent to clients.
  if(typeof view==='string')view=JSON.parse(view);
  let state=sessions.get(key);if(!state)sessions.set(key,state={base:null,pending:null,at:0});
  let packet;
  if(!state.base&&!state.pending||now-state.at>=2000){
   const base=view.serverId+':'+view.epoch+':'+view.revision+':'+view.next;
   state.pending=wire.baseline(view,base,{enemyFields});state.at=now;packet={...view,wireBase:base};
  }else packet=wire.delta(view,state.base);
  parentPort.postMessage({id,packet});
 }catch{parentPort.postMessage({id,error:'Duo encoding failed'});}
});
