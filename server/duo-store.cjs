'use strict';
const fs=require('node:fs'),path=require('node:path'),{createLobbies}=require('./duo-lobbies.cjs');
// Private server data, never a downloadable profile or a public static asset.
function createStore(file,{now=()=>Date.now(),write=atomicWrite,maintenance=false}={}){
 const snapshot=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):undefined;
 const rooms=createLobbies({now,snapshot,maintenance});let failed=false,lastSaved=now();
 function flush(){if(failed)throw Error('Duo storage unavailable');try{write(file,JSON.stringify(rooms.checkpoint()));lastSaved=now();}catch(error){failed=true;throw error;}}
 const change=(method,...args)=>{if(failed)throw Error('Duo storage unavailable');const result=rooms[method](...args);flush();return result;};
 return {receipts:token=>rooms.receipts(token),get maintenance(){return rooms.maintenance;},setMaintenance:enabled=>change('setMaintenance',enabled),get healthy(){return !failed;},flush,backup(){flush();atomicWrite(file+'.before-update',fs.readFileSync(file,'utf8'));},claim(token,clientId,takeover){if(failed)throw Error('Duo storage unavailable');const result=rooms.claim(token,clientId,takeover);if(result.changed)flush();return result;},leave:token=>change('leave',token),create:body=>change('create',body),join:body=>change('join',body),receive:(token,packet)=>change('receive',token,packet),view:token=>rooms.view(token),touch:token=>rooms.touch(token),tick(){if(failed)return;const settled=rooms.tick();if(settled||now()-lastSaved>=1000)try{flush();}catch{console.error('Duo storage failed; simulation stopped.');}}};
}
function atomicWrite(file,data){
 fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
 const temporary=file+'.tmp',fd=fs.openSync(temporary,'w',0o600);
 try{fs.writeFileSync(fd,data,'utf8');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 fs.renameSync(temporary,file);
 // Persist the rename as well as the file contents on Linux.
 if(process.platform!=='win32'){const dir=fs.openSync(path.dirname(file),'r');try{fs.fsyncSync(dir);}finally{fs.closeSync(dir);}}
}
module.exports={createStore,atomicWrite};
