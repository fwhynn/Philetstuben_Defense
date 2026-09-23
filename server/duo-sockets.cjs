'use strict';
const {Server}=require('socket.io');
function attachSockets(server,room,{browser,publicOrigin,isClosing}){
 const io=new Server(server,{maxHttpBufferSize:8192,serveClient:true,allowRequest(req,done){const origin=req.headers.origin;done(null,!isClosing()&&(!origin||browser&&origin===(publicOrigin||'http://'+req.headers.host)));}});
 io.use((socket,next)=>{const {token,clientId}=socket.handshake.auth||{};if(isClosing()||room.healthy===false)return next(Error('server-unavailable'));if(typeof token!=='string'||typeof clientId!=='string'||clientId.length>128||!room.view(token))return next(Error('unauthorized'));socket.data={token,clientId};next();});
 io.on('connection',socket=>{
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
