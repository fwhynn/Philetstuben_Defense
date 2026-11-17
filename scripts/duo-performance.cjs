// Synthetic two-board snapshot/render-input benchmark; no browser FPS claim.
const fs=require('node:fs'),{performance}=require('node:perf_hooks'),{createHash}=require('node:crypto');
const {createRoom}=require('../server/duo-room.cjs'),core=require('../headless-core.cjs')();
function fixture(){
 const room=createRoom({seed:'duo-performance',loadouts:Array(2).fill(core.profile.START_TOWERS),now:()=>0});
 const a=room.connect(0),b=room.connect(1),snapshot=room.checkpoint(),match=core.duo.restore(snapshot.match);
 for(const {state:s} of match.boards){
  for(let q=1;q<=80;q++)s.map.set(q+',0',{q,r:0,type:'straight',rotation:0,roads:[0,3],slots:2,towers:[{type:'archer',statId:'a'+q,paid:25},{type:'mine',statId:'m'+q,paid:35}],buildingSlots:1,buildings:q%8===0?[{type:'forge',level:3}]:[null]});
  const points=Array.from({length:250},(_,i)=>({x:i*10,y:0}));
  s.enemies=Array.from({length:300},(_,i)=>({id:i,type:'grunt',x:1000+i,y:0,index:Math.floor((1000+i)/10),points,alive:true,hp:5000,maxHp:5000,armorHp:1000,magicHp:1000}));
  s.mines=Array.from({length:3000},(_,i)=>({id:i,x:i*2,y:0,color:'#eeb672'}));
 }
 snapshot.match=core.duo.capture(match);const restored=createRoom({snapshot,now:()=>0});restored.touch(a.token);restored.touch(b.token);return {room:restored,a,b};
}
function sample(){const {room,a,b}=fixture(),client=require('../duo-client.js');let presentation;const times=[],present=[],wire=[];let checksum;
 for(let i=0;i<35;i++){
  const v=room.view(a.token);room.receive(a.token,{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[0].phase,action:'speed',payload:{value:i%8+1}});
  let t=performance.now();const first=room.view(a.token),second=room.view(b.token);times.push(performance.now()-t);
  t=performance.now();presentation=client.presentation(JSON.parse(JSON.stringify(first)),presentation);present.push(performance.now()-t);
  t=performance.now();const text=JSON.stringify([first,second]);wire.push(performance.now()-t);checksum=createHash('sha256').update(text.replace(/"serverId":"[^"]+"/g,'').replace(/"epoch":"[^"]+"/g,'')).digest('hex');
 }
 const median=a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)];return {viewPairMs:median(times),presentationWithJsonMs:median(present),encodePairMs:median(wire),checksum};}
function bandwidth(codec=require('../classes/duo-wire.js'),options={}){
 const zlib=require('node:zlib'),{room,a}=fixture(),initial=room.view(a.token),base=codec.baseline(initial,'benchmark',options),decoder=codec.decoder();decoder.accept({...initial,wireBase:'benchmark'});
 let fullBytes=0,deltaBytes=0,fullCompressed=0,deltaCompressed=0,encodeMs=0,decodeMs=0;
 for(let tick=1;tick<=20;tick++){
  const next=JSON.parse(JSON.stringify(initial));next.revision+=tick;
  for(const b of next.boards){b.enemies.forEach(e=>e.x+=tick);b.map.forEach(tile=>tile.towers?.forEach(t=>{if(t)t.aim={x:1000+tick,y:0,time:tick*100};}));b.mines.splice(0,tick*10);for(let j=0;j<tick*5;j++)b.mines.push({id:4000+j,x:j,y:2,color:'#eeb672'});}
  let time=performance.now();const packet=tick===20?{...next,wireBase:'fresh'}:codec.delta(next,base),delta=JSON.stringify(packet);encodeMs+=performance.now()-time;
  time=performance.now();const decoded=decoder.accept(JSON.parse(delta));decodeMs+=performance.now()-time;delete decoded.wireDelta;delete decoded.wireBase;
  require('node:assert/strict').deepEqual(decoded,next);
  const full=JSON.stringify(next);fullBytes+=Buffer.byteLength(full);deltaBytes+=Buffer.byteLength(delta);fullCompressed+=zlib.deflateRawSync(full).length;deltaCompressed+=zlib.deflateRawSync(delta).length;
 }
 return {scenario:'Moving enemies, every tower aiming, 200 mine removals + 100 placements per board in two seconds, including full baseline refresh',fullBytes,deltaBytes,fullCompressed,deltaCompressed,encodeMsPerPacket:encodeMs/20,decodeMsPerPacket:decodeMs/20};
}
if(require.main===module){const result={scope:'Two boards, each 81 tiles / 160 towers / 300 enemies / 3000 mines; 35 changed revisions',...sample(),bandwidth:bandwidth()};if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(result,null,2));console.log(result);}
module.exports={fixture,sample,bandwidth};
