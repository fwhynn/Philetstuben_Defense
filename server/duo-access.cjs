'use strict';
// One synchronous authorization + operation transaction, also used inside the
// worker. No takeover can interleave between checking ownership and a command.
function perform(room,token,clientId,path,packet,withState=false){
 const fail=(status,error)=>({status,body:{error}}),ok=body=>({status:200,body});
 if(room.healthy===false)return fail(503,'storage-unavailable');
 if(!(room.hasSeat?room.hasSeat(token):room.view(token)))return fail(401,'unauthorized');
 if(path==='/session'&&(!room.claim||!packet||Array.isArray(packet)||Object.keys(packet).length!==1||!['takeover','leave'].includes(packet.action)))return fail(400,'invalid-session-action');
 const access=room.claim?.(token,clientId,path==='/session'&&packet.action==='takeover');
 if(access&&!access.ok)return fail(409,access.reason);
 if(path==='/session')return ok(packet.action==='leave'?room.leave(token):{ok:true});
 if(path==='/state'){room.touch?.(token);return ok(room.view(token));}
 if(path==='/push'){const key=room.pushKey?.(token);return ok(key&&key===packet?.lastKey?null:room.view(token));}
 if(path==='/augments'){const result=room.applyAugments(token,packet.profile,packet.guest);return {status:result.ok?200:409,body:result};}
 if(path!=='/command'||!packet||typeof packet!=='object'||Array.isArray(packet))return fail(400,'invalid-command');
 const result=room.receive(token,packet);
 if(withState){room.touch?.(token);return ok({...result,state:room.view(token)});}
 return ok(result);
}
function access(room,...args){return room.access?room.access(...args):perform(room,...args);}
module.exports={perform,access};
