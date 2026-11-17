'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const FORMAT='autohex-lobby-index';
const filename=/^[A-F0-9]{10}-[a-f0-9]{64}\.json$/;
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
function readCheckpoint(file,{allowPool=true}={}){
 if(!fs.existsSync(file))return {snapshot:undefined,text:undefined};
 const text=fs.readFileSync(file,'utf8'),saved=JSON.parse(text);
 if(saved.format==='autohex-worker-pool'){
  if(!allowPool||saved.version!==1||!Array.isArray(saved.files)||saved.files.length!==8||saved.files.some((name,i)=>name!=='slot-'+i+'.json'))throw Error('Invalid worker pool checkpoint');
  const dir=file+'.pool';if(fs.lstatSync(dir).isSymbolicLink()||!fs.statSync(dir).isDirectory())throw Error('Invalid worker pool directory');
  const parts=saved.files.map(name=>{const target=path.join(dir,name);if(fs.lstatSync(target).isSymbolicLink())throw Error('Invalid worker pool file');const part=readCheckpoint(target,{allowPool:false});if(!part.snapshot)throw Error('Missing worker checkpoint');return part.snapshot;});
  const snapshot={format:'autohex-lobbies',version:1,rooms:[],attempts:[],settlements:[]};
  const codes=new Set(),tokens=new Set(),requests=new Set(),receipts=new Set();
  for(const part of parts){
   if(part.format!=='autohex-lobbies'||part.version!==1||!Array.isArray(part.rooms)||!Array.isArray(part.attempts)||!Array.isArray(part.settlements)||part.rooms.length>1)throw Error('Invalid worker checkpoint');
   for(const room of part.rooms){if(codes.has(room.code))throw Error('Duplicate worker room');codes.add(room.code);for(const seat of room.room.seats.filter(Boolean)){if(tokens.has(seat.token))throw Error('Duplicate worker seat');tokens.add(seat.token);}snapshot.rooms.push(room);}
   for(const entry of part.attempts){if(requests.has(entry[0]))throw Error('Duplicate worker request');requests.add(entry[0]);snapshot.attempts.push(entry);}
   for(const entry of part.settlements){if(receipts.has(entry[0]))throw Error('Duplicate worker receipt');receipts.add(entry[0]);snapshot.settlements.push(entry);}
  }
  return {text,pool:saved,snapshot};
 }
 if(saved.format!==FORMAT)return {snapshot:saved,text};
 if(saved.version!==1||!Array.isArray(saved.rooms)||saved.rooms.length>8||!Array.isArray(saved.attempts)||!Array.isArray(saved.settlements))throw Error('Invalid partitioned checkpoint');
 const dir=file+'.rooms';if(fs.lstatSync(dir).isSymbolicLink()||!fs.statSync(dir).isDirectory())throw Error('Invalid room directory');
 const codes=new Set(),rooms=saved.rooms.map(entry=>{
  if(!entry||!filename.test(entry.file)||entry.file.slice(0,10)!==entry.code||codes.has(entry.code))throw Error('Invalid room reference');codes.add(entry.code);
  const target=path.join(dir,entry.file);if(fs.lstatSync(target).isSymbolicLink())throw Error('Invalid room file');
  const bytes=fs.readFileSync(target,'utf8');if(hash(bytes)!==entry.file.slice(11,-5))throw Error('Damaged room checkpoint');
  return {code:entry.code,room:JSON.parse(bytes)};
 });
 return {text,index:saved,snapshot:{format:'autohex-lobbies',version:1,rooms,settlements:saved.settlements,attempts:saved.attempts}};
}
function createPartitionedStorage(file,loaded,{write}={}){
 const dir=file+'.rooms';fs.mkdirSync(dir,{recursive:true,mode:0o700});if(fs.lstatSync(dir).isSymbolicLink())throw Error('Invalid room directory');
 let index=loaded.index,lastText=loaded.index?loaded.text:undefined;
 const verified=new Set(index?.rooms.map(r=>r.file)||[]);
 const roomCache=new Map();
 // Keep the original monolithic file as a self-contained rollback source.
 if(loaded.text&&!loaded.index)write(file+'.before-partition',loaded.text);
 function commit(parts){
  const refs=[];
  for(const room of parts.rooms){
   if(!/^[A-F0-9]{10}$/.test(room.code))throw Error('Invalid room code');
   const cached=roomCache.get(room.code),name=cached?.text===room.text?cached.name:room.code+'-'+hash(room.text)+'.json',target=path.join(dir,name);
   // An orphan may have complete bytes but no completed fsync. Republish it
   // durably before allowing a new index to reference it.
   if(!verified.has(name)){
    if(fs.existsSync(target)&&fs.lstatSync(target).isSymbolicLink())throw Error('Invalid room file');
    write(target,room.text);
    verified.add(name);
   }
   refs.push({code:room.code,file:name});
   roomCache.set(room.code,{text:room.text,name});
  }
  const liveCodes=new Set(refs.map(r=>r.code));for(const code of roomCache.keys())if(!liveCodes.has(code))roomCache.delete(code);
  const next={format:FORMAT,version:1,rooms:refs,settlements:parts.settlements,attempts:parts.attempts};
  const text=JSON.stringify(next);if(text===lastText)return;
  // Both generations remain valid while publishing the new index.
  if(index)write(file+'.previous',lastText);
  write(file,text);
  const keep=new Set([...refs,...(index?.rooms||[])].map(r=>r.file));
  index=next;lastText=text;
  // Cleanup is best effort, only after commit, and only inside our blob directory.
  // Unrelated files and the current/previous generation are never removed.
  try{for(const name of fs.readdirSync(dir))if(filename.test(name)&&!keep.has(name))try{fs.unlinkSync(path.join(dir,name));verified.delete(name);}catch{}}catch{}
 }
 return {commit};
}
module.exports={readCheckpoint,createPartitionedStorage};
