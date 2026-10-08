'use strict';
const {Server}=require('socket.io');
function attachSockets(server,room,{browser,publicOrigin,isClosing}){
 // Compressed frames shrink the 10 Hz board snapshots to a fraction; short pings detect lost players within ~10 s.
 const io=new Server(server,{maxHttpBufferSize:8192,serveClient:true,perMessageDeflate:{threshold:1024},pingInterval:5000,pingTimeout:5000,allowRequest(req,done){const origin=req.headers.origin;done(null,!isClosing()&&(!origin||browser&&origin===(publicOrigin||'http://'+req.headers.host)));}});
 io.use((socket,next)=>{const {token,clientId}=socket.handshake.auth||{};if(isClosing()||room.healthy===false)return next(Error('server-unavailable'));if(typeof token!=='string'||typeof clientId!=='string'||clientId.length>128||!room.view(token))return next(Error('unauthorized'));socket.data={token,clientId};next();});
 // An open socket is presence: throttled background tabs keep their seat while the connection stays alive.
 const present=new Set(),touch=socket=>{if(isClosing()||room.healthy===false)return;try{room.touch?.(socket.data.token);}catch{}};
 const heartbeat=setInterval(()=>{for(const socket of present)touch(socket);},1000);heartbeat.unref?.();
 // Push changed snapshots at a steady 10 Hz instead of waiting for request/response round trips.
 const sent=new WeakMap(),push=setInterval(()=>{if(isClosing()||room.healthy===false)return;for(const socket of present){try{const {token,clientId}=socket.data;if(room.claim&&!room.claim(token,clientId).ok)continue;const view=room.view(token);if(!view)continue;const key=view.serverId+view.epoch+':'+view.revision+':'+view.next;if(sent.get(socket)===key)continue;sent.set(socket,key);socket.emit('state',view);}catch{}}},100);push.unref?.();
 server.on('close',()=>{clearInterval(heartbeat);clearInterval(push);});
 io.on('connection',socket=>{
  present.add(socket);touch(socket);socket.on('disconnect',()=>present.delete(socket));
  let count=0,window=Date.now();
  socket.on('request',(message,ack)=>{
   if(typeof ack!=='function')return;
   const fail=(status,error)=>ack({status,body:{error}});
   if(isClosing()||room.healthy===false)return fail(503,'storage-unavailable');
   if(Date.now()-window>=1000){count=0;window=Date.now();}if(++count>40)return fail(429,'rate-limit');
   if(!message||typeof message!=='object'||!['/state','/command','/session'].includes(message.path))return fail(400,'invalid-request');
   const {token,clientId}=socket.data,{path,packet}=message;
   try{
    if(!room.view(token))return fail(401,'unauthorized');
    if(path==='/session'){
     if(!room.claim||!packet||Array.isArray(packet)||Object.keys(packet).length!==1||!['takeover','leave'].includes(packet.action))return fail(400,'invalid-session-action');
     const access=room.claim(token,clientId,packet.action==='takeover');if(!access.ok)return fail(409,access.reason);
     return ack({status:200,body:packet.action==='leave'?room.leave(token):{ok:true}});
    }
    if(room.claim){const access=room.claim(token,clientId);if(!access.ok)return fail(409,access.reason);}
    if(path==='/state'){room.touch?.(token);return ack({status:200,body:room.view(token)});}
    if(!packet||typeof packet!=='object'||Array.isArray(packet))return fail(400,'invalid-command');
    ack({status:200,body:room.receive(token,packet)});
   }catch{fail(room.healthy===false?503:400,room.healthy===false?'storage-unavailable':'invalid-request');}
  });
 });
 return io;
}
module.exports={attachSockets};
