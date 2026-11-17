'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{Worker}=require('node:worker_threads'),path=require('node:path');
const {createWireWorker}=require('../duo-wire-worker-client.cjs'),wire=require('../../classes/duo-wire.js');
function view(revision){return {serverId:'server',epoch:'epoch',revision,next:1,boards:[0,1].map(()=>({map:[],mines:[],hand:['straight'],enemies:Array.from({length:40},(_,id)=>({id,x:id+revision,y:0,hp:100,name:'Enemy',description:'stable '.repeat(20),motionPath:[{x:id,y:0}]}))}))};}
test('encoding worker preserves exact packets, acknowledgements, packet loss and independent clients',async t=>{
 const encoder=createWireWorker();t.after(()=>encoder.close());const states=new Map(),decoders=new Map();
 for(let tick=0;tick<45;tick++)for(const key of ['a','b','legacy']){
  const now=10000+tick*100,v=view(tick),enemyFields=key!=='legacy';if(key==='b')v.boards[0].enemies.reverse();
  let s=states.get(key);if(!s){states.set(key,s={base:null,pending:null,at:0});decoders.set(key,wire.decoder());}
  let expected;
  if(!s.base&&!s.pending||now-s.at>=2000){const id=v.serverId+':'+v.epoch+':'+v.revision+':'+v.next;s.pending=wire.baseline(v,id,{enemyFields});s.at=now;expected={...v,wireBase:id};}
  else expected=wire.delta(v,s.base);
  const packet=await encoder.encode(key,key==='b'?JSON.stringify(v):v,enemyFields,now);assert.equal(JSON.stringify(packet),JSON.stringify(expected));
  if(packet.wireBase||tick%3!==0){const decoded=decoders.get(key).accept(packet);delete decoded.wireBase;assert.deepEqual(decoded,v);}
  // Delay acknowledgements; ignore an unrelated baseline ID.
  encoder.ack(key,'invalid');if(tick%4===2&&s.pending){encoder.ack(key,s.pending.id);s.base=s.pending;s.pending=null;}
 }
 encoder.release('a');assert.ok((await encoder.encode('a',view(50),true,15000)).wireBase);
});
test('encoder crash rejects pending work and the next request starts with a fresh full baseline',async t=>{
 let worker;const encoder=createWireWorker({workerFactory:()=>worker=new Worker(path.resolve(__dirname,'../duo-wire-worker.cjs'))});t.after(()=>encoder.close());
 const first=await encoder.encode('a',view(0),true);encoder.ack('a',first.wireBase);
 const lost=encoder.encode('a',view(1),true);const settled=Promise.allSettled([lost]);await worker.terminate();await settled;
 const next=await encoder.encode('a',view(2),true);assert.ok(next.wireBase);assert.deepEqual(next.boards,view(2).boards);
});
test('closing the encoder rejects pending requests and prevents new work',async()=>{
 const encoder=createWireWorker(),pending=encoder.encode('a',view(0),true),rejected=assert.rejects(pending,/closed/);
 await encoder.close();await rejected;await assert.rejects(encoder.encode('a',view(1),true),/closed/);
});
