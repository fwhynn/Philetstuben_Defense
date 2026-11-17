const {test}=require('node:test'),assert=require('node:assert/strict');
const wire=require('../classes/duo-wire.js'),{presentation}=require('../duo-client.js');
const clone=v=>JSON.parse(JSON.stringify(v));
function view(){return {protocol:1,serverId:'s',epoch:'e',revision:1,wave:1,portals:[null,null],boards:[0,1].map(()=>({map:Array.from({length:25},(_,q)=>({q,r:0,type:'straight',roads:[0,3],slots:1,towers:[{type:'archer',statId:q,level:1,aim:{x:1,y:1}}]})),mines:Array.from({length:100},(_,id)=>({id,x:id,y:0,color:'#aaa'})),enemies:[{id:1,x:0}],hand:['straight'],landmarks:[],deckCounts:{straight:2},loadout:['archer'],phase:'wave'}))};}
function decode(packet,decoder){const result=decoder.accept(clone(packet));delete result.wireBase;delete result.wireDelta;return result;}

test('scalar fast path keeps JSON normalization, nested changes and field removal exact',()=>{
 const first=view();for(const b of first.boards)b.enemies=Array.from({length:20},(_,id)=>({id,x:-0,hp:100,alive:true,name:'雪"\\',description:'stable '.repeat(30),status:null,motionPath:[{x:1,y:2}]}));
 const base=wire.baseline(first,'scalars',{enemyFields:true}),decoder=wire.decoder();decode({...first,wireBase:'scalars'},decoder);
 for(const value of [null,NaN,Infinity,-Infinity,0,-0,1,'1',false,true]){
  const next=clone(first);next.boards[0].enemies[0].hp=value;next.boards[0].enemies[1].motionPath[0].x=8;delete next.boards[0].enemies[2].status;
  const packet=wire.delta(next,base);assert.ok(packet.boards[0].wireEnemies);assert.deepEqual(decode(packet,decoder),clone(next));
 }
});

test('opt-in enemy field deltas preserve spawns, deaths, status removal, order and dropped packets',()=>{
 const first=view();for(const b of first.boards)b.enemies=Array.from({length:40},(_,id)=>({id,x:id,y:0,hp:100,name:'Long enemy name',description:'Unchanged description '.repeat(5),color:'#abcd12',type:'grunt',slowFactor:1,motionPath:[{x:0,y:0}]}));
 const base=wire.baseline(first,'enemy-base',{enemyFields:true}),decoder=wire.decoder();decode({...first,wireBase:'enemy-base'},decoder);
 for(let tick=1;tick<=20;tick++){
  const next=clone(first);next.revision+=tick;for(const b of next.boards){b.enemies.splice(0,tick);for(const e of b.enemies){e.x+=tick;delete e.slowFactor;e.motionPath=[{x:tick,y:0}];}b.enemies.push({id:100+tick,x:tick,y:5,hp:50,type:'swarm'});if(tick%2)b.enemies.reverse();}
  const packet=wire.delta(next,base);assert.ok(packet.boards[0].wireEnemies);if(tick%3===0)continue;
  const actual=decode(packet,decoder);assert.deepEqual(actual,next);actual.boards[0].enemies[0].hp=-1;assert.deepEqual(decode(packet,decoder),next);
 }
 const changed=clone(first);changed.boards[0].enemies[0].x++;
 const oldPacket=wire.delta(changed,wire.baseline(first,'legacy'));assert.equal(oldPacket.boards[0].wireEnemies,undefined);assert.deepEqual(oldPacket.boards[0].enemies,changed.boards[0].enemies);
 const duplicate=clone(first);duplicate.boards[0].enemies[1].id=0;assert.equal(wire.delta(duplicate,base).boards[0].wireEnemies,undefined);
});
test('wire deltas preserve all records after dropped packets, additions, deletion, reorder and epoch changes',()=>{
 const first=view(),base=wire.baseline(first,'base'),decoder=wire.decoder();decode({...first,wireBase:'base'},decoder);
 for(let tick=1;tick<=50;tick++){
  const next=clone(first);next.revision+=tick;next.boards[0].enemies[0].x=tick;
  next.boards[0].map[4].towers[0].aim.x=tick;next.boards[0].map[6].towers[0]=null;
  next.boards[0].mines.splice(0,tick);next.boards[0].mines.push({id:100+tick,x:tick,y:3});if(tick%2)next.boards[0].mines.reverse();
  if(tick===50){next.boards[0].map=[];next.boards[0].mines=[];}
  const packet=wire.delta(next,base);if(tick%3===0)continue;assert.deepEqual(decode(packet,decoder),next);
 }
 const next=clone(first);next.epoch='new';assert.equal(wire.delta(next,base),next);assert.equal(decoder.accept({...wire.delta(first,base),epoch:'wrong'}),null);assert.equal(wire.decoder().accept(wire.delta(first,base)),null);
});
test('presentation cannot mutate wire baselines; map identity remains stable while tower effects update',()=>{
 const first=view(),base=wire.baseline(first,'base'),decoder=wire.decoder();let old=presentation(decode({...first,wireBase:'base'},decoder));
 const map=old.boards[0].state.map,tower=map.get('0,0').towers[0];tower.overloadUntil=999;map.get('0,0').towers[0].aim.x=999;
 const next=clone(first);next.revision++;next.boards[0].map[0].towers[0].overloadUntil=500;
 const data=decode(wire.delta(next,base),decoder);assert.deepEqual(data,next);old=presentation(data,old);
 assert.equal(old.boards[0].state.map,map);assert.equal(map.get('0,0').towers[0],tower);assert.equal(tower.overloadUntil,500);
 require('../classes/duo-game.js').mergeBoard(old.boards[0].state,old.boards[0].state);assert.equal(tower.overloadUntil,500);
 const clean=decode(wire.delta(first,base),decoder);old=presentation(clean,old);assert.equal(tower.overloadUntil,undefined);assert.equal(tower.aim.x,1);
 const expanded=clone(first);expanded.boards[0].map.push({q:50,r:0,roads:[0,3],towers:[]});old=presentation(expanded,old);assert.notEqual(old.boards[0].state.map,map);
});
test('unchanged large mine fields and road geometry are omitted with exact reconstruction',()=>{
 const first=view(),base=wire.baseline(first,'base'),decoder=wire.decoder();decode({...first,wireBase:'base'},decoder);const next=clone(first);next.revision++;next.boards[0].enemies[0].x=5;
 const packet=wire.delta(next,base);assert.ok(JSON.stringify(packet).length<JSON.stringify(next).length*.2);assert.deepEqual(decode(packet,decoder),next);
});
test('decoded collections are isolated from baseline, changed packet records and previous results',()=>{
 const first=view(),base=wire.baseline(first,'base'),decoder=wire.decoder();
 const full={...clone(first),wireBase:'base'};decoder.accept(full);
 full.boards[0].mines[0].x=999;
 const next=clone(first);next.boards[0].map[0].towers[0].aim.x=42;next.boards[0].mines.push({id:200,x:5,y:6,color:'雪"\\'});
 const packet=wire.delta(next,base),decoded=decoder.accept(packet);
 assert.deepEqual(decoded,next);
 decoded.boards[0].map[0].towers[0].aim.x=-100;decoded.boards[0].mines.at(-1).x=-100;
 assert.deepEqual(decode(packet,decoder),next);
 packet.boards[0].wireCollections.map.changes[0][1].towers[0].aim.x=-200;
 assert.deepEqual(decode(wire.delta(first,base),decoder),first);
 const replacement=clone(first);replacement.epoch='new';decoder.accept({...replacement,wireBase:'new'});
 assert.deepEqual(decode(wire.delta(first,base),decoder),first);
});
