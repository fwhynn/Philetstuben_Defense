'use strict';
const {Server}=require('socket.io'),{access}=require('./duo-access.cjs');
function attachSockets(server,room,{browser,publicOrigin,isClosing}){
 // Compressed frames shrink the 10 Hz board snapshots to a fraction; short pings detect lost players within ~10 s.
 const io=new Server(server,{maxHttpBufferSize:8192,serveClient:true,perMessageDeflate:{threshold:1024},pingInterval:5000,pingTimeout:5000,allowRequest(req,done){const origin=req.headers.origin;done(null,!isClosing()&&(!origin||browser&&origin===(publicOrigin||'http://'+req.headers.host)));}});
 io.use(async(socket,next)=>{try{const {token,clientId}=socket.handshake.auth||{};if(isClosing()||room.healthy===false)return next(Error('server-unavailable'));if(typeof token!=='string'||typeof clientId!=='string'||clientId.length>128||!await(room.hasSeat?room.hasSeat(token):room.view(token)))return next(Error('unauthorized'));if(isClosing())return next(Error('server-unavailable'));socket.data={token,clientId,wireEnemyFields:socket.handshake.auth.wireEnemyFields===1};next();}catch{next(Error('server-unavailable'));}});
 // Keep at most one heartbeat and snapshot in flight per socket.
 const present=new Set(),touching=new WeakSet(),pushing=new WeakSet();
 const encoder=require('./duo-wire-worker-client.cjs').createWireWorker();
 const touch=async socket=>{if(isClosing()||room.healthy===false||touching.has(socket))return;touching.add(socket);try{await room.touch?.(socket.data.token);}catch{}finally{touching.delete(socket);}};
 const heartbeat=setInterval(()=>{for(const socket of present)void touch(socket);},1000);heartbeat.unref?.();
 const sent=new WeakMap();
 async function pushSocket(socket){
  if(isClosing()||room.healthy===false||pushing.has(socket)||socket.conn?.transport?.writable===false)return;pushing.add(socket);
  try{
   const {token,clientId}=socket.data,response=room.encodedPush?await room.encodedPush(token,clientId,{lastKey:sent.get(socket)}):await access(room,token,clientId,'/push',{lastKey:sent.get(socket)}),view=response.body;
   if(response.status!==200||!view||isClosing()||!present.has(socket))return;
   const key=room.encodedPush?view.key:view.serverId+view.epoch+':'+view.revision+':'+view.next;if(sent.get(socket)===key)return;
   const packet=await encoder.encode(socket.id,room.encodedPush?view.json:view,socket.data.wireEnemyFields);
   if(isClosing()||!present.has(socket))return;
   sent.set(socket,key);if(packet.wireBase)socket.emit('state',packet);else socket.volatile.emit('state',packet);
  }catch{}finally{pushing.delete(socket);}
 }
 const push=setInterval(()=>{for(const socket of present)void pushSocket(socket);},100);push.unref?.();
 server.on('close',()=>{clearInterval(heartbeat);clearInterval(push);void encoder.close();});
 io.on('connection',socket=>{
  present.add(socket);touch(socket);socket.on('state-base',id=>encoder.ack(socket.id,id));socket.on('disconnect',()=>{present.delete(socket);encoder.release(socket.id);});
  let count=0,window=Date.now();
  socket.on('request',async(message,ack)=>{
   if(typeof ack!=='function')return;
   const fail=(status,error)=>ack({status,body:{error}});
   if(isClosing()||room.healthy===false)return fail(503,'storage-unavailable');
   if(Date.now()-window>=1000){count=0;window=Date.now();}if(++count>40)return fail(429,'rate-limit');
   if(!message||typeof message!=='object'||!['/state','/command','/session'].includes(message.path))return fail(400,'invalid-request');
   const {token,clientId}=socket.data,{path,packet}=message;
   try{
    ack(await access(room,token,clientId,path,packet,message.withState===true));
   }catch{fail(room.healthy===false?503:400,room.healthy===false?'storage-unavailable':'invalid-request');}
  });
 });
 return io;
}
module.exports={attachSockets};
