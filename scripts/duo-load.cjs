// Local-only load harness. Never opens a production save or account.
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{performance,monitorEventLoopDelay}=require('node:perf_hooks'),{Worker,isMainThread,workerData,parentPort}=require('node:worker_threads');
const root=path.resolve(__dirname,'..');
function fixture(count){
 const core=require('../headless-core.cjs')(),{createRoom}=require('../server/duo-room.cjs'),rooms=[],seats=[];
 for(let n=0;n<count;n++){
  const r=createRoom({seed:'load-'+n,loadouts:Array(2).fill(core.profile.START_TOWERS)}),a=r.connect(0),b=r.connect(1),saved=r.checkpoint(),m=core.duo.restore(saved.match);
  m.phase='combat';m.wave=30;
  for(const {state:s} of m.boards){
   s.wave=30;s.phase='wave';s.waveRunning=true;s.openingRemaining=0;s.pendingSpawns=0;s.enemies=[];s.mines=[];
   for(let q=1;q<=40;q++)s.map.set(q+',0',{q,r:0,type:'mirrorJunction',rotation:0,roads:[0,3,4],slots:2,towers:[{type:'archer',statId:'a'+q,paid:25},{type:'mine',statId:'m'+q,paid:35}],buildingSlots:1,buildings:[null]});
   const points=Array.from({length:41},(_,i)=>core.map.axialToPixel(40-i,0));
   const plan=core.waves.plan(s.wave,s.income,false,s);
   for(let i=0;i<120;i++){core.runtime.spawnEnemy(s,points,i%plan.enemies.length);const e=s.enemies.at(-1);e.index=Math.floor(i/6);e.x=points[e.index].x;e.y=0;}
   s.mines=Array.from({length:500},(_,i)=>({id:i,x:2000+i*3,y:0,damage:35,splash:45,color:'#eeb672'}));s.nextMineId=500;
  }
  saved.match=core.duo.capture(m);rooms.push({code:n.toString(16).padStart(10,'0').toUpperCase(),room:saved});seats.push([a,b]);
 }
 return {snapshot:{format:'autohex-lobbies',version:1,rooms,settlements:[],attempts:[]},seats};
}
function stats(a){const s=[...a].sort((a,b)=>a-b);return {n:s.length,mean:s.reduce((a,b)=>a+b,0)/(s.length||1),p50:s[Math.floor(s.length*.5)]||0,p95:s[Math.floor(s.length*.95)]||0,max:s.at(-1)||0};}
async function clients(){
 const {io}=require('socket.io-client'),wire=require('../classes/duo-wire.js');const sockets=[],samples={intervals:[],commands:[],errors:[],packets:0,bytes:0},latest=new Map();
 for(const seat of workerData.seats.flat()){
  const socket=io(workerData.url,{auth:{token:seat.token,clientId:require('node:crypto').randomUUID(),wireEnemyFields:1},transports:['websocket'],forceNew:true,reconnection:false}),decoder=wire.decoder();sockets.push(socket);let at;
  socket.on('state',packet=>{try{const t=performance.now();if(at)samples.intervals.push(t-at);at=t;samples.packets++;samples.bytes+=Buffer.byteLength(JSON.stringify(packet));const v=decoder.accept(packet);latest.set(socket,v);if(packet.wireBase)socket.emit('state-base',packet.wireBase);}catch(e){samples.errors.push(e.message);}});
  socket.on('connect_error',e=>samples.errors.push(e.message));
 }
 const timer=setInterval(async()=>{for(const socket of sockets){const v=latest.get(socket);if(!v)continue;const start=performance.now();try{const ack=await socket.timeout(15000).emitWithAck('request',{path:'/state'});samples.commands.push(performance.now()-start);if(ack.status!==200)samples.errors.push(ack.status);}catch(e){samples.errors.push(e.message);}}},3000);
 parentPort.on('message',message=>{if(message==='reset'){for(const k of ['intervals','commands','errors'])samples[k]=[];samples.packets=samples.bytes=0;}if(message==='report')parentPort.postMessage({intervals:stats(samples.intervals),requestMs:stats(samples.commands),packets:samples.packets,bytes:samples.bytes,errors:samples.errors,elapsed:[...latest.values()].map(v=>v.boards[0].elapsedMs),enemies:[...latest.values()].map(v=>v.boards[0].enemies.length)});if(message==='stop'){clearInterval(timer);sockets.forEach(s=>s.close());parentPort.close();}});
}
async function main(){
 const count=Number(process.argv[2]||4),browser=process.argv.includes('--browser'),duration=Number(process.env.LOAD_SECONDS||25);
 if(!Number.isInteger(count)||count<1||count>8||!Number.isFinite(duration)||duration<=0)throw Error('Use 1–8 rooms and a positive LOAD_SECONDS');
 const data=fixture(count),dir=fs.mkdtempSync(path.join(os.tmpdir(),'autohex-load-')),file=path.join(dir,'checkpoint.json');fs.writeFileSync(file,JSON.stringify(data.snapshot));
 const timings={},record=(name,ms)=>(timings[name]??=[]).push(ms);
 const entry=path.join(root,'server/duo-store-worker.cjs');
 const createStore=process.argv.includes('--room-workers')?require('../server/duo-room-pool.cjs').createRoomPool:require('../server/duo-worker-client.cjs').createWorkerStore;
 const store=createStore(file,{workerFactory:options=>{
  const w=new Worker(`const {parentPort,workerData}=require('node:worker_threads');const p=require('node:path');if(workerData.reference){const fs=require('node:fs'),read=fs.readFileSync;fs.readFileSync=function(file,...args){const result=read.call(this,file,...args);return file===p.join(workerData.root,'classes/combat.js')?require(p.join(workerData.root,'scripts/duo-load-reference.cjs'))(result):result;};}const mod=require(p.join(workerData.root,'server/duo-store.cjs')),create=mod.createStore;mod.createStore=(...args)=>{const s=create(...args);for(const k of ['view','tick','flush']){const f=s[k];s[k]=(...args)=>{const t=performance.now();try{return f(...args);}finally{parentPort.postMessage({metric:k,ms:performance.now()-t});}};}return s;};require(workerData.entry);`,{eval:true,workerData:{...options.workerData,entry,root,reference:process.argv.includes('--reference-targeting')}});w.on('message',m=>{if(m.metric)record(m.metric,m.ms);});return w;
 }});await store.ready;
 const access=store.access;store.access=async(...args)=>{const t=performance.now();try{return await access(...args);}finally{record('rpc',performance.now()-t);}};
 const wire=require('../classes/duo-wire.js');for(const k of ['baseline','delta']){const fn=wire[k];wire[k]=(...args)=>{const t=performance.now();try{return fn(...args);}finally{record(k,performance.now()-t);}};}
 const server=require('../server/duo-transport.cjs').createTransport(store,{browser:true,autoTick:!browser}),browserMetrics=[];
 if(browser){const handlers=server.listeners('request');server.removeAllListeners('request');server.on('request',(req,res)=>{
  const u=new URL(req.url,'http://localhost');
  if(u.pathname==='/__load/metrics'&&req.method==='POST'){let body='';req.on('data',c=>body+=c);req.on('end',()=>{try{browserMetrics.push(JSON.parse(body));}catch{}res.end('ok');});return;}
  if(u.pathname==='/__load/start'){store.startTicks().then(()=>res.end('started'));return;}
  if(u.pathname==='/__load/report'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({timings:Object.fromEntries(Object.entries(timings).map(([k,v])=>[k,stats(v)])),browserMetrics}));return;}
  if(u.pathname==='/runtime-config.js'){res.setHeader('Content-Type','text/javascript');res.end("globalThis.AUTOHEX_CONFIG=Object.freeze({apiBaseUrl:location.origin+'/__test-api'});");return;}
  if(u.pathname==='/index.html'){res.setHeader('Content-Type','text/html');let html=fs.readFileSync(path.join(root,'index.html'),'utf8');html=html.replace('<head>','<head><script src="/__load/instrument.js"></script>');res.end(html);return;}
  if(u.pathname==='/__load/instrument.js'){res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(path.join(__dirname,'duo-load-browser.js')));return;}
  if(u.pathname==='/classes/three-renderer.js'){res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(path.join(root,'classes/three-renderer.js'),'utf8')+'\n globalThis.__loadWrap?.(globalThis.HexThreeRenderer);');return;}
  if(/^\/classes\/[a-z0-9-]+\.mjs$/.test(u.pathname)){res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(path.join(root,u.pathname.slice(1))));return;}
  for(const h of handlers)h.call(server,req,res);
 });}
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 const client=new Worker(__filename,{workerData:{clients:true,seats:browser?data.seats.slice(1):data.seats,url}}),loop=monitorEventLoopDelay({resolution:10});loop.enable();
 console.log(JSON.stringify({url,dir,count,browser,links:browser?data.seats[0].map(s=>url+'/index.html?high#duo='+s.token):[]}));
 if(browser){process.on('SIGINT',async()=>{client.postMessage('stop');await server.quiesce();server.closeAllConnections();server.close();await store.close();process.exit(0);});return;}
 await new Promise(r=>setTimeout(r,5000));for(const k of Object.keys(timings))timings[k]=[];loop.reset();client.postMessage('reset');const cpu=process.cpuUsage(),at=performance.now();
 const profiler=process.env.LOAD_PROFILE?new (require('node:inspector').Session)():null;
 const profileCall=method=>new Promise((resolve,reject)=>profiler.post(method,(error,result)=>error?reject(error):resolve(result)));
 if(profiler){profiler.connect();await profileCall('Profiler.enable');await profileCall('Profiler.start');}
 await new Promise(r=>setTimeout(r,duration*1000));client.postMessage('report');const network=await new Promise(r=>client.once('message',r));if(!network.packets)throw Error('No snapshots received');const elapsed=performance.now()-at;
 if(profiler){fs.writeFileSync(process.env.LOAD_PROFILE,JSON.stringify((await profileCall('Profiler.stop')).profile));profiler.disconnect();}
 require('node:assert/strict').equal(network.elapsed.length,count*2,'Every client must receive and decode snapshots');
 require('node:assert/strict').deepEqual(network.errors,[],'No connection, decode or request errors');
 await store.stopTicks();const before=await Promise.all(data.seats.flat().map(s=>store.view(s.token)));await store.flush();
 const restored=require('../server/duo-lobbies.cjs').createLobbies({snapshot:require('../server/duo-partitioned-storage.cjs').readCheckpoint(file).snapshot});data.seats.flat().forEach((s,i)=>require('node:assert/strict').equal(JSON.stringify(restored.view(s.token).boards),JSON.stringify(before[i].boards)));
 console.log(JSON.stringify({rooms:count,clients:count*2,elapsedMs:elapsed,cpu:process.cpuUsage(cpu),eventLoop:{p95:loop.percentile(95)/1e6,max:loop.max/1e6},timings:Object.fromEntries(Object.entries(timings).map(([k,v])=>[k,stats(v)])),network,restartBoardsEqual:true},null,2));
 loop.disable();client.postMessage('stop');await client.terminate();await server.quiesce();server.closeAllConnections();await new Promise(r=>server.close(r));await store.close();
}
if(!isMainThread&&workerData.clients)clients();else if(require.main===module)main().catch(e=>{console.error(e);process.exit(1);});
module.exports={fixture,stats};
