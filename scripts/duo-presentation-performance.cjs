// CPU-only presentation benchmark; excludes packet parsing and GPU rendering.
const {performance}=require('node:perf_hooks'),assert=require('node:assert/strict');
const {fixture}=require('./duo-performance.cjs'),{presentation}=require('../duo-client.js');
const plain=value=>JSON.parse(JSON.stringify(value,(_,v)=>v instanceof Map?[...v]:v));
const median=xs=>xs.sort((a,b)=>a-b)[Math.floor(xs.length/2)];
function sample(){
 const {room,a}=fixture(),initial=room.view(a.token),eagerTimes=[],lazyTimes=[];let eager,lazy;
 for(let tick=0;tick<60;tick++){
  const next=JSON.parse(JSON.stringify(initial));next.revision+=tick;next.boards.forEach(b=>{b.gold+=tick;b.map.forEach(t=>t.towers.forEach(tower=>{if(tower)tower.aim={x:tick,y:0,time:tick*100};}));});
  const eagerInput=JSON.parse(JSON.stringify(next)),lazyInput=JSON.parse(JSON.stringify(next)),visible=Math.floor(tick/10)%2;
  const runEager=()=>{const start=performance.now();eager=presentation(eagerInput,eager);eager.boards[visible].state;if(tick>=10)eagerTimes.push(performance.now()-start);};
  const runLazy=()=>{const start=performance.now();lazy=presentation(lazyInput,lazy,{lazy:true});lazy.boards[visible].state;if(tick>=10)lazyTimes.push(performance.now()-start);};
  if(tick%2){runEager();runLazy();}else{runLazy();runEager();}
  assert.deepEqual(plain(lazy.boards[visible].state),plain(eager.boards[visible].state));
 }
 for(let i=0;i<2;i++)assert.deepEqual(plain(lazy.boards[i].state),plain(eager.boards[i].state));
 return {scope:'Two heavy boards; one visible; switch every ten packets; 50 measured updates after warmup',eagerMs:median(eagerTimes),lazyMs:median(lazyTimes)};
}
if(require.main===module)console.log(JSON.stringify(sample(),null,2));
module.exports={sample};
