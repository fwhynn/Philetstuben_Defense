const {test}=require('node:test'),assert=require('node:assert/strict');
const wire=require('../classes/duo-wire.js'),{presentation}=require('../duo-client.js');
const clone=v=>JSON.parse(JSON.stringify(v));
function view(){return {protocol:1,serverId:'s',epoch:'e',revision:1,wave:1,portals:[null,null],boards:[0,1].map(()=>({map:Array.from({length:25},(_,q)=>({q,r:0,type:'straight',roads:[0,3],slots:1,towers:[{type:'archer',statId:q,level:1,aim:{x:1,y:1}}]})),mines:Array.from({length:100},(_,id)=>({id,x:id,y:0,color:'#aaa'})),enemies:[{id:1,x:0}],hand:['straight'],landmarks:[],deckCounts:{straight:2},loadout:['archer'],phase:'wave'}))};}
function decode(packet,decoder){const result=decoder.accept(clone(packet));delete result.wireBase;delete result.wireDelta;return result;}
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
