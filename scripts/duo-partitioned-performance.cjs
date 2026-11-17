'use strict';
// Synthetic save-volume comparison; temporary directory only, removed at exit.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),{randomBytes}=require('node:crypto'),{performance}=require('node:perf_hooks');
const {fixture}=require('./duo-performance.cjs'),{createStore,atomicWrite}=require('../server/duo-store.cjs'),{readCheckpoint}=require('../server/duo-partitioned-storage.cjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'duo-storage-benchmark-'));
try{
 const snapshot=fixture().room.checkpoint(),rooms=Array.from({length:4},(_,i)=>{const room=JSON.parse(JSON.stringify(snapshot));room.seats.forEach(s=>s.token=randomBytes(32).toString('hex'));return {code:i.toString(16).padStart(10,'0').toUpperCase(),room};});
 const text=JSON.stringify({format:'autohex-lobbies',version:1,rooms,attempts:[],settlements:[]}),results={},states={};
 for(const partitioned of [false,true]){
  const file=path.join(dir,partitioned?'split.json':'single.json');fs.writeFileSync(file,text);let bytes=0,writes=0;
  const store=createStore(file,{now:()=>0,partitioned,write:(file,text)=>{bytes+=Buffer.byteLength(text);writes++;atomicWrite(file,text);}});
  for(const r of rooms)for(const s of r.room.seats)store.touch(s.token);store.flush();bytes=0;writes=0;
  const token=rooms[0].room.seats[0].token,v=store.view(token),start=performance.now();
  assert.ok(store.receive(token,{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[0].phase,action:'speed',payload:{value:2}}).ok);
  results[partitioned?'partitioned':'monolithic']={bytes,writes,elapsedMs:performance.now()-start};states[partitioned?'partitioned':'monolithic']=readCheckpoint(file).snapshot;
 }
 assert.deepEqual(states.partitioned,states.monolithic);console.log(JSON.stringify({scope:'One command in one of four heavy rooms; includes durable writes; single sample',...results},null,2));
}finally{fs.rmSync(dir,{recursive:true,force:true});}
