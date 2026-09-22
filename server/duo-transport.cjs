'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const assets=new Set(["classes/translations.js","classes/i18n.js","duo-lobby.html","duo-lobby.js","duo-prototype.html","classes/duo-prototype.js","duo-client.js","classes/random.js","classes/biomes.js","classes/data.js","classes/map.js","classes/heroes.js","classes/waves.js","classes/exploration.js","classes/placement-commands.js","classes/run-flow.js","classes/run-session.js","classes/buildings.js","classes/tower-commands.js","classes/deck.js","classes/rewards.js","classes/combat.js","classes/run-runtime.js","classes/run-snapshot.js","classes/duo-session.js","classes/camera.js","classes/svg-renderer.js"]);
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
  if(room.healthy===false)return send(503,{error:'storage-unavailable'});
  const lobbyAction=req.method==='POST'&&room.create&&['/lobby/create','/lobby/join'].includes(req.url);
  if(!lobbyAction&&(!token||!room.view(token)))return send(401,{error:'unauthorized'});
  if(lobbyAction){const ip=req.socket.remoteAddress,time=Date.now(),old=attempts.get(ip);if(!old||time-old.at>60000)attempts.set(ip,{at:time,count:1});else if(++old.count>20)return send(429,{error:'rate-limit'});if(attempts.size>1024)for(const [key,value] of attempts)if(time-value.at>60000)attempts.delete(key);}
  if(req.method==='GET'&&req.url==='/state'){room.touch?.(token);return send(200,room.view(token));}
  if(!lobbyAction&&(req.method!=='POST'||req.url!=='/command'))return send(404,{error:'not-found'});
  let length=0,chunks=[];
  try{for await(const chunk of req){length+=chunk.length;if(length>8192){send(413,{error:'too-large'});req.resume();return;}chunks.push(chunk);}const packet=JSON.parse(Buffer.concat(chunks).toString('utf8'));send(200,lobbyAction?(req.url==='/lobby/create'?room.create(packet):room.join(packet)):room.receive(token,packet));}
  catch{send(room.healthy===false?503:400,{error:room.healthy===false?'storage-unavailable':'invalid-json'});}
 });
 server.requestTimeout=5000;server.headersTimeout=5000;
 let timer;server.on('listening',()=>{if(!autoTick)return;let last=performance.now(),debt=0;timer=setInterval(()=>{const now=performance.now();debt=Math.min(1000,debt+now-last);last=now;let count=0;while(debt>=50&&count++<5){room.tick();debt-=50;}},25);});server.on('close',()=>clearInterval(timer));
 return server;
}
module.exports={createTransport};
