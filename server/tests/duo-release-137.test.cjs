'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{randomUUID}=require('node:crypto');
// Test the upcoming release before npm run tag stamps package.json.
// Node's test runner isolates this file from the other test processes.
const pkg=require.resolve('../../package.json');require(pkg);
require.cache[pkg].exports={...require.cache[pkg].exports,version:'1.3.7'};
const {createStore}=require('../duo-store.cjs'),{compatibleRuleset}=require('../duo-room.cjs');
const packet=(store,seat,action,payload)=>{const v=store.view(seat.token);return {epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[seat.player].phase,action,payload};};

for(const partitioned of [false,true])for(const previous of ['1.2.8','1.2.9','1.3.0','1.3.1','1.3.2','1.3.3','1.3.4','1.3.5','1.3.6'])test(`1.3.7 retains ${previous} ${partitioned?'partitioned':'legacy'} checkpoints, purchased towers and command receipts`,t=>{
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
 store=createStore(file,{now:()=>2000,partitioned});assert.equal(store.discarded,0);const restored=store.view(a.token);
 assert.deepEqual(JSON.parse(JSON.stringify(restored.boards)),JSON.parse(JSON.stringify(before.boards)));assert.equal(restored.hp,before.hp);assert.equal(restored.wave,before.wave);
 assert.equal(restored.connection.paused,true);store.touch(a.token);store.touch(b.token);assert.equal(store.view(a.token).connection.paused,false);
 assert.equal(store.receive(a.token,purchase).duplicate,true);assert.equal(store.view(a.token).boards[0].gold,before.boards[0].gold);
 assert.equal(require('../duo-partitioned-storage.cjs').readCheckpoint(file).snapshot.rooms[0].room.ruleset,'1.3.7');
 assert.equal(fs.readdirSync(dir).some(name=>name.includes('incompatible')),false);
});

test('1.3.7 checkpoint compatibility does not permit unreviewed versions or downgrades',()=>{
 assert.equal(compatibleRuleset('1.2.7','1.3.7'),false);
 assert.equal(compatibleRuleset('1.3.7','1.2.9'),false);
 assert.equal(compatibleRuleset('1.3.8','1.3.7'),false);
});

for(const partitioned of [false,true])for(const difficulty of ['normal','dual'])test(`1.3.7 upgrades pending 1.3.6 ${difficulty} tunnels in ${partitioned?'partitioned':'legacy'} storage`,t=>{
 const c=require('../../headless-core.cjs')(),dir=fs.mkdtempSync(path.join(os.tmpdir(),'autohex-tunnel-upgrade-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const file=path.join(dir,'checkpoint.json');let store=createStore(file,{now:()=>1000});const a=store.create({requestId:randomUUID()}),b=store.join({requestId:randomUUID(),code:a.code});require('./start-lobby.cjs')(store,[a,b]);
 const saved=JSON.parse(fs.readFileSync(file,'utf8')),room=saved.rooms[0].room,match=c.duo.restore(room.match),run=match.boards[0],s=run.state;
 s.map.clear();s.landmarks.clear();s.difficulty=difficulty;s.openingRemaining=0;s.phase='build';s.hand=[];s.drawResult='tunnel';
 const tile=(q,r,roads,type='buildingPlot')=>s.map.set(q+','+r,{q,r,type,roads,slots:0,towers:[],buildings:[]});tile(0,0,[0],'base');tile(1,0,[0,3],'straight');for(const d of [1,2,4,5]){const n=c.map.neighbor(2,0,d);tile(n.q,n.r,[]);}
 s.tunnelOffer={q:-1,r:2,source:'1,0',dir:4,distance:2};s.tunnelConfirmed=true;
 const before=JSON.parse(JSON.stringify({map:[...s.map.values()],deck:s.deck,gold:s.gold}));room.ruleset='1.3.6';room.match=c.duo.capture(match);fs.writeFileSync(file,JSON.stringify(saved));
 store=createStore(file,{now:()=>2000,partitioned});store.touch(a.token);store.touch(b.token);assert.equal(store.discarded,0);
 const view=store.view(a.token),board=view.boards[0];assert.equal(board.tunnelOffer.choices.length,3);assert.equal(board.tunnelOffer.choices[0].distance,1);assert.equal(board.gold,before.gold);
 const restored=c.duo.restore(require('../duo-partitioned-storage.cjs').readCheckpoint(file).snapshot.rooms[0].room.match).boards[0].state;
 assert.deepEqual(JSON.parse(JSON.stringify([...restored.map.values()])),before.map);assert.deepEqual(JSON.parse(JSON.stringify(restored.deck)),before.deck);
 const choice=board.tunnelOffer.choices[2],payload={q:choice.q,r:choice.r,source:choice.source};assert.equal(store.receive(a.token,packet(store,a,'tunnel',payload)).ok,true);
 const built=store.view(a.token).boards[0].map.find(t=>t.q===choice.q&&t.r===choice.r);assert.equal(built.type,'rescueTunnel');assert.equal(built.roads.length,difficulty==='dual'?2:1);
});
