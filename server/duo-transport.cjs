'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../towerdefense-v0.1');
const assets=new Set(['duo-lobby.html','duo-lobby.js','duo-prototype.html','duo-prototype.js','duo-client.js','random.js','biomes.js','data.js','map.js','heroes.js','waves.js','exploration.js','placement-commands.js','run-flow.js','run-session.js','buildings.js','tower-commands.js','deck.js','rewards.js','combat.js','run-runtime.js','run-snapshot.js','duo-session.js','camera.js','svg-renderer.js']);
function createTransport(room,{browser=false,autoTick=false}={}){
 const attempts=new Map();
 const server=http.createServer(async(req,res)=>{
  const send=(status,value)=>{if(res.writableEnded)return;res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
  const origin=req.headers.origin;
  if(origin&&(!browser||origin!=='http://'+req.headers.host))return send(403,{error:'cross-origin-disabled'});
  if(browser&&req.method==='GET'){
   const file=req.url==='/'?(room.create?'duo-lobby.html':'duo-prototype.html'):req.url.slice(1);
   if(assets.has(file)){res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html; charset=utf-8':'text/javascript; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'});return res.end(fs.readFileSync(path.join(root,file)));}
  }
  const token=req.headers.authorization?.replace(/^Bearer /,'');
  const lobbyAction=req.method==='POST'&&room.create&&['/lobby/create','/lobby/join'].includes(req.url);
  if(!lobbyAction&&(!token||!room.view(token)))return send(401,{error:'unauthorized'});
  if(lobbyAction){const ip=req.socket.remoteAddress,time=Date.now(),old=attempts.get(ip);if(!old||time-old.at>60000)attempts.set(ip,{at:time,count:1});else if(++old.count>20)return send(429,{error:'rate-limit'});if(attempts.size>1024)for(const [key,value] of attempts)if(time-value.at>60000)attempts.delete(key);}
  if(req.method==='GET'&&req.url==='/state')return send(200,room.view(token));
  if(!lobbyAction&&(req.method!=='POST'||req.url!=='/command'))return send(404,{error:'not-found'});
  let length=0,chunks=[];
  try{for await(const chunk of req){length+=chunk.length;if(length>8192){send(413,{error:'too-large'});req.resume();return;}chunks.push(chunk);}const packet=JSON.parse(Buffer.concat(chunks).toString('utf8'));send(200,lobbyAction?(req.url==='/lobby/create'?room.create(packet):room.join(packet)):room.receive(token,packet));}
  catch{send(400,{error:'invalid-json'});}
 });
 server.requestTimeout=5000;server.headersTimeout=5000;
 let timer;server.on('listening',()=>{if(!autoTick)return;let last=performance.now(),debt=0;timer=setInterval(()=>{const now=performance.now();debt=Math.min(1000,debt+now-last);last=now;let count=0;while(debt>=50&&count++<5){room.tick();debt-=50;}},25);});server.on('close',()=>clearInterval(timer));
 return server;
}
module.exports={createTransport};
