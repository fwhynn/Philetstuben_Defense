'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{randomUUID}=require('node:crypto');
// Test the upcoming release before npm run tag stamps package.json.
// Node's test runner isolates this file from the other test processes.
const pkg=require.resolve('../../package.json');require(pkg);
require.cache[pkg].exports={...require.cache[pkg].exports,version:'1.3.0'};
const {createStore}=require('../duo-store.cjs'),{compatibleRuleset}=require('../duo-room.cjs');
const packet=(store,seat,action,payload)=>{const v=store.view(seat.token);return {epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[seat.player].phase,action,payload};};

for(const previous of ['1.2.8','1.2.9'])test(`1.3.0 retains ${previous} disk checkpoints, purchased towers and command receipts`,t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'autohex-upgrade-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const file=path.join(dir,'checkpoint.json');let store=createStore(file,{now:()=>1000});
 const a=store.create({requestId:randomUUID()}),b=store.join({requestId:randomUUID(),code:a.code});require('./start-lobby.cjs')(store,[a,b]);
 let position;
 const board=store.view(a.token).boards[0];
 for(let index=0;index<board.placements.length&&!position;index++)for(let rotation=0;rotation<6&&!position;rotation++){
  const p=board.placements[index][rotation].find(p=>p.legal);if(p)position={q:p.q,r:p.r,index,rotation};
 }
 assert.ok(position);assert.ok(store.receive(a.token,packet(store,a,'place',position)).ok);
 const purchase=packet(store,a,'tower',{type:'archer',slots:[{q:position.q,r:position.r,index:0}]});assert.ok(store.receive(a.token,purchase).ok);
 const before=store.view(a.token),saved=JSON.parse(fs.readFileSync(file,'utf8'));saved.rooms[0].room.ruleset=previous;fs.writeFileSync(file,JSON.stringify(saved));
 store=createStore(file,{now:()=>2000});assert.equal(store.discarded,0);const restored=store.view(a.token);
 assert.deepEqual(JSON.parse(JSON.stringify(restored.boards)),JSON.parse(JSON.stringify(before.boards)));assert.equal(restored.hp,before.hp);assert.equal(restored.wave,before.wave);
 assert.equal(restored.connection.paused,true);store.touch(a.token);store.touch(b.token);assert.equal(store.view(a.token).connection.paused,false);
 assert.equal(store.receive(a.token,purchase).duplicate,true);assert.equal(store.view(a.token).boards[0].gold,before.boards[0].gold);
 assert.equal(JSON.parse(fs.readFileSync(file,'utf8')).rooms[0].room.ruleset,'1.3.0');
 assert.equal(fs.readdirSync(dir).some(name=>name.includes('incompatible')),false);
});

test('1.3.0 checkpoint compatibility does not permit unreviewed versions or downgrades',()=>{
 assert.equal(compatibleRuleset('1.2.7','1.3.0'),false);
 assert.equal(compatibleRuleset('1.3.0','1.2.9'),false);
 assert.equal(compatibleRuleset('1.3.1','1.3.0'),false);
});
