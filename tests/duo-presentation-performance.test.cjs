const {test}=require('node:test'),assert=require('node:assert/strict');
const {presentation}=require('../duo-client.js');
const clone=v=>JSON.parse(JSON.stringify(v));
function snapshot(tick=0){return {player:0,wave:1,hp:40,maxHp:40,portals:[null,null],boards:[0,1].map(player=>({player,phase:'wave',gold:tick,hand:[],deckCounts:{straight:3},loadout:['archer'],enemies:[{id:tick,x:tick,y:0}],landmarks:[],map:[{q:0,r:0,type:'base',roads:[0,3],slots:1,towers:[{type:'archer',statId:player,level:tick,aim:{x:tick,y:0}}]}]}))};}
const plain=value=>JSON.parse(JSON.stringify(value,(_,v)=>v instanceof Map?[...v]:v));
test('unseen boards are not prepared; switching uses the newest snapshot and retains tower identity',()=>{
 let lazy,eager,hiddenReads=0,oldTower;
 for(let tick=0;tick<40;tick++){
  const next=snapshot(tick),expected=clone(next),raw=next.boards[1].map;
  Object.defineProperty(next.boards[1],'map',{enumerable:true,get(){hiddenReads++;return raw;}});
  eager=presentation(expected,eager);lazy=presentation(next,lazy,{lazy:true});
  assert.deepEqual(plain(lazy.boards[0].state),plain(eager.boards[0].state));
  if(tick===10){assert.deepEqual(plain(lazy.boards[1].state),plain(eager.boards[1].state));oldTower=lazy.boards[1].state.map.get('0,0').towers[0];hiddenReads=0;}
  else assert.equal(hiddenReads,0,'hidden map conversion must not run, including previously visited boards');
 }
 assert.equal(lazy.boards[1].state.gold,39);assert.equal(lazy.boards[1].state.enemies[0].id,39);
 assert.equal(lazy.boards[1].state.map.get('0,0').towers[0],oldTower);
 assert.deepEqual(plain(lazy.boards[1].state),plain(eager.boards[1].state));
});
test('deferred presentation catches structural changes, rewards and removal on first access',()=>{
 let current=presentation(snapshot(),null,{lazy:true});current.boards[1].state;
 const next=snapshot(1);next.wave=2;next.boards[1].phase='reward';next.boards[1].rewardOffer={id:'reward',choices:[{kind:'gold',amount:20}]};next.boards[1].map[0].towers=[null];next.boards[1].map.push({q:1,r:0,type:'straight',roads:[0,3],slots:0,towers:[]});
 current=presentation(next,current,{lazy:true});
 assert.equal(current.boards[1].state.map.size,2);assert.equal(current.boards[1].state.map.get('0,0').towers[0],null);
 assert.equal(current.boards[1].state.waveRunning,false);assert.deepEqual(current.boards[1].state.rewardOffer,next.boards[1].rewardOffer);
 assert.equal(current.boards[1].state,current.boards[1].state,'conversion happens only once per snapshot');
});
