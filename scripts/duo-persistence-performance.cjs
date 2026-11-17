// Synthetic CPU comparison. No disk writes, real accounts or browser FPS claims.
const {performance}=require('node:perf_hooks'),assert=require('node:assert/strict');
const {fixture}=require('./duo-performance.cjs'),core=require('../headless-core.cjs')();
const median=values=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)];
function persistence(){
 const {room,a}=fixture(),before=[],after=[],reused=[];let bytes;
 for(let i=0;i<7;i++){
  const v=room.view(a.token);room.receive(a.token,{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[0].phase,action:'speed',payload:{value:i+1}});
  let t=performance.now();const old=JSON.stringify(room.checkpoint());before.push(performance.now()-t);
  t=performance.now();const next=room.serializeCheckpoint();after.push(performance.now()-t);assert.equal(next,old);bytes=Buffer.byteLength(next);
  t=performance.now();room.serializeCheckpoint();reused.push(performance.now()-t);
 }
 return {bytes,legacyMs:median(before),directMs:median(after),cachedMs:median(reused)};
}
function aiming(){
 const enemies=Array.from({length:600},(_,i)=>({id:i,x:(i*173)%3000-1500,y:(i*79)%1200-600}));
 const towers=Array.from({length:160},(_,i)=>({x:(i*131)%3000-1500,y:(i*61)%1200-600,range:150+i%200}));
 // Run both algorithms in Node's main realm to avoid headless VM lookup overhead.
 const buildQuery=Function('return '+core.combat.presentationRange.toString())();
 const brute=()=>towers.map(p=>enemies.filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<=p.range));
 const indexed=()=>{const query=buildQuery(enemies);return towers.map(p=>Array.from(query(p,p.range)));};
 assert.deepEqual(indexed(),brute());const before=[],after=[];
 for(let i=0;i<80;i++){let t=performance.now();brute();before.push(performance.now()-t);t=performance.now();indexed();after.push(performance.now()-t);}
 return {scope:'600 enemies, 160 tower queries; includes building the index',bruteMs:median(before),indexedMs:median(after)};
}
if(require.main===module)console.log(JSON.stringify({persistence:persistence(),aiming:aiming()},null,2));
module.exports={persistence,aiming};
