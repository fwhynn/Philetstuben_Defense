'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const assets=new Set(["classes/profile.js","classes/translations.js","classes/i18n.js","duo-lobby.html","duo-lobby.js","duo-prototype.html","classes/duo-prototype.js","duo-client.js","classes/random.js","classes/biomes.js","classes/data.js","classes/map.js","classes/heroes.js","classes/waves.js","classes/exploration.js","classes/placement-commands.js","classes/run-flow.js","classes/run-session.js","classes/buildings.js","classes/tower-commands.js","classes/deck.js","classes/rewards.js","classes/combat.js","classes/run-runtime.js","classes/run-snapshot.js","classes/duo-session.js","classes/camera.js","classes/svg-renderer.js"]);
function createTransport(room,{browser=false,autoTick=false,publicOrigin=null}={}){
 let closing=false;const attempts=new Map();
 const server=http.createServer(async(req,res)=>{
  const send=(status,value)=>{if(res.writableEnded)return;res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
  if(closing)return send(503,{error:'server-restarting'});
  const origin=req.headers.origin;
  if(origin&&(!browser||origin!==(publicOrigin||'http://'+req.headers.host)))return send(403,{error:'cross-origin-disabled'});
  if(browser&&req.method==='GET'){
   const file=req.url==='/'?(room.create?'duo-lobby.html':'duo-prototype.html'):req.url.slice(1);
   const publicFile=file==='index.html'||file==='style.css'||file==='duo.css'||file.startsWith('classes/')&&/^[a-z0-9-]+\.js$/.test(file.slice(8))||(file.startsWith('assets/')||file.startsWith('node_modules/three/'))&&!file.split('/').some(part=>part.startsWith('.')||part.includes('\\'));
   if(publicFile){const resolved=path.resolve(root,file);if(!resolved.startsWith(root+path.sep))return send(403,{error:'forbidden'});fs.readFile(resolved,(error,data)=>{if(error)return send(404,{error:'not-found'});const ext=path.extname(file),mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.glb':'model/gltf-binary'}[ext]||'application/octet-stream';res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);});return;}
   if(assets.has(file)){res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html; charset=utf-8':'text/javascript; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'});return res.end(fs.readFileSync(path.join(root,file)));}
  }
  if(req.method==='GET'&&req.url==='/healthz')return send(room.healthy===false?503:200,{ok:room.healthy!==false,service:'autohex-duo',maintenance:!!room.maintenance});
  const token=req.headers.authorization?.replace(/^Bearer /,'');
  if(room.healthy===false)return send(503,{error:'storage-unavailable'});
  if(req.method==='GET'&&req.url==='/results'&&room.receipts){const receipts=room.receipts(token);return receipts?send(200,{receipts}):send(401,{error:'unauthorized'});}
  const lobbyAction=req.method==='POST'&&room.create&&['/lobby/create','/lobby/join'].includes(req.url);
  if(!lobbyAction&&(!token||!room.view(token)))return send(401,{error:'unauthorized'});
  if(lobbyAction){const ip=req.socket.remoteAddress,time=Date.now(),old=attempts.get(ip);if(!old||time-old.at>60000)attempts.set(ip,{at:time,count:1});else if(++old.count>20)return send(429,{error:'rate-limit'});if(attempts.size>1024)for(const [key,value] of attempts)if(time-value.at>60000)attempts.delete(key);}
  const sessionAction=req.method==='POST'&&req.url==='/session'&&room.claim,clientId=req.headers['x-duo-client'];
  if(!lobbyAction&&!sessionAction&&room.claim){let access;try{access=room.claim(token,clientId);}catch{return send(503,{error:'storage-unavailable'});}if(!access.ok)return send(409,{error:access.reason});}
  if(req.method==='GET'&&req.url==='/state'){room.touch?.(token);return send(200,room.view(token));}
  if(!lobbyAction&&!sessionAction&&(req.method!=='POST'||req.url!=='/command'))return send(404,{error:'not-found'});
  let length=0,chunks=[];
  try{for await(const chunk of req){length+=chunk.length;if(length>8192){send(413,{error:'too-large'});req.resume();return;}chunks.push(chunk);}if(closing)return send(503,{error:'server-restarting'});const packet=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(sessionAction){if(!packet||Array.isArray(packet)||Object.keys(packet).length!==1||!['takeover','leave'].includes(packet.action))return send(400,{error:'invalid-session-action'});const access=room.claim(token,clientId,packet.action==='takeover');if(!access.ok)return send(409,{error:access.reason});return send(200,packet.action==='leave'?room.leave(token):{ok:true});}if(!lobbyAction&&room.claim){const access=room.claim(token,clientId);if(!access.ok)return send(409,{error:access.reason});}if(closing)return send(503,{error:'server-restarting'});send(200,lobbyAction?(req.url==='/lobby/create'?room.create(packet):room.join(packet)):room.receive(token,packet));}
  catch{send(room.healthy===false?503:400,{error:room.healthy===false?'storage-unavailable':'invalid-json'});}
 });
 const io=require('./duo-sockets.cjs').attachSockets(server,room,{browser,publicOrigin,isClosing:()=>closing});
 server.quiesce=()=>{closing=true;clearInterval(timer);io.engine.close();};
 server.requestTimeout=5000;server.headersTimeout=5000;
 let timer;server.on('listening',()=>{if(!autoTick)return;let last=performance.now(),debt=0;timer=setInterval(()=>{const now=performance.now();debt=Math.min(1000,debt+now-last);last=now;let count=0;while(debt>=50&&count++<5){room.tick();debt-=50;}},25);});server.on('close',()=>clearInterval(timer));
 server.on('close',()=>io.engine.close());
 return server;
}
module.exports={createTransport};
