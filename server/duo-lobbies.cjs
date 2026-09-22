'use strict';
const crypto=require('node:crypto'),{createRoom}=require('./duo-room.cjs');
const loadout=['archer','catapult','chain','freeze','mine'];
function createLobbies({now=()=>Date.now(),limit=8}={}){
 const rooms=new Map(),sessions=new Map(),attempts=new Map();
 function cleanup(){const time=now();for(const [code,r] of rooms)if(time-r.seen>(r.players===1?30*60000:2*60*60000)){rooms.delete(code);for(const token of r.tokens)sessions.delete(token);}for(const [id,a] of attempts)if(time-a.at>30*60000)attempts.delete(id);}
 function request(kind,body){cleanup();if(!body||Array.isArray(body)||typeof body.requestId!=='string'||! /^[a-f0-9-]{36}$/.test(body.requestId)||Object.keys(body).some(k=>!['requestId',...(kind==='join'?['code']:[])].includes(k)))return {ok:false,reason:'invalid'};
 const key=body.requestId,signature=JSON.stringify([kind,body.code||'']),old=attempts.get(key);if(old){if(old.signature!==signature)return {ok:false,reason:'invalid'};return sessions.has(old.result.token)?{...old.result}:{ok:false,reason:'expired'};}
 if(attempts.size>=1000)return {ok:false,reason:'capacity'};
 let record,seat;
 if(kind==='create'){if(rooms.size>=limit)return {ok:false,reason:'capacity'};let code;do{code=crypto.randomBytes(5).toString('hex').toUpperCase();}while(rooms.has(code));record={code,room:createRoom({loadouts:[loadout,loadout],now}),players:1,tokens:[],seen:now()};seat=record.room.connect(0);rooms.set(code,record);}
 else{if(typeof body.code!=='string'||! /^[A-F0-9]{10}$/.test(body.code))return {ok:false,reason:'invalid'};record=rooms.get(body.code);if(!record)return {ok:false,reason:'not-found'};if(record.players!==1)return {ok:false,reason:'full'};seat=record.room.connect(1);record.players=2;}
 record.seen=now();record.tokens.push(seat.token);sessions.set(seat.token,record);const result={ok:true,code:record.code,...seat};attempts.set(key,{signature,result,at:now()});return {...result};
 }
 function resolve(token){cleanup();const r=sessions.get(token);if(r)r.seen=now();return r;}
 return {create:body=>request('create',body),join:body=>request('join',body),view(token){const r=resolve(token);if(!r)return null;return {...r.room.view(token),lobby:{code:r.code,players:r.players}};},receive(token,packet){const r=resolve(token);if(!r)return {ok:false,reason:'unauthorized'};if(r.players<2)return {ok:false,reason:'waiting-for-partner'};return r.room.receive(token,packet);},tick(){cleanup();for(const r of rooms.values())if(r.players===2)r.room.tick();}};
}
module.exports={createLobbies};
