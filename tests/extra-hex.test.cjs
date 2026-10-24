const {test}=require('node:test'),assert=require('node:assert/strict'),load=require('../headless-core.cjs');
const loadout=['archer','chain','freeze','mine','catapult'];
function setup(){const c=load(),run=c.session.create({seed:'extra-hex',runId:'extra-hex',loadout}),s=run.state;s.wave=34;s.phase='build';s.gold=2000;s.landmarks=new Map();return {c,run,s};}
test('extra hex unlocks before wave 35, charges once per preparation and rises permanently',()=>{
 const {c,run,s}=setup();s.wave=33;assert.equal(c.session.buyExtraHex(s,run.random),false);s.wave=34;
 assert.ok(c.session.buyExtraHex(s,run.random));assert.equal(s.gold,1800);assert.equal(s.phase,'place');assert.equal(s.hand.length,3);assert.equal(c.session.extraHexPrice(s),300);assert.equal(c.flow.start(s,run.random),undefined);
 assert.equal(c.session.buyExtraHex(s,run.random),false);s.phase='build';assert.equal(c.session.buyExtraHex(s,run.random),false);
 const saved=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(s,run.random))));assert.equal(c.session.extraHexPrice(saved.state),300);assert.equal(c.session.buyExtraHex(saved.state,saved.random),false);saved.state.wave=35;assert.ok(c.session.buyExtraHex(saved.state,saved.random));assert.equal(saved.state.gold,1500);
});
test('unavailable extra hex leaves gold, deck, RNG and snapshot unchanged',()=>{
 for(const mutate of [s=>s.gold=199,s=>s.waveRunning=true,s=>s.celebrationActive=true,s=>s.challengeDay='2026-10-24',s=>s.map.clear()]){
 const {c,run,s}=setup();mutate(s);const before=JSON.stringify(s),rng=JSON.stringify(run.random.snapshot()),piles=JSON.stringify([s.hand,s.drawPile,s.discard]);assert.equal(c.session.buyExtraHex(s,run.random),false);assert.equal(JSON.stringify(s),before);assert.equal(JSON.stringify(run.random.snapshot()),rng);assert.equal(JSON.stringify([s.hand,s.drawPile,s.discard]),piles);
 }
});
test('Duo extra hex is authoritative, cannot be bought while ready, and only charges its owner',()=>{
 const c=load(),match=c.duo.create('extra-duo',[loadout,loadout]),s=match.boards[0].state;s.wave=34;s.phase='build';s.openingRemaining=0;s.gold=1000;s.landmarks=new Map();s.map.get('0,0').roads=[0];const other=match.boards[1].state.gold;
 match.ready[0]=true;assert.equal(c.duo.command(match,0,{id:'extra-1',wave:match.wave,action:'extraHex',payload:{}}),false);match.ready[0]=false;
 assert.equal(c.duo.command(match,0,{id:'extra-2',wave:match.wave,action:'extraHex',payload:{}}),true);assert.equal(s.gold,800);assert.equal(match.boards[1].state.gold,other);
 const {payloadValid}=require('../server/duo-room.cjs');assert.ok(payloadValid('extraHex',{}));assert.equal(payloadValid('extraHex',{price:0}),false);
});
test('every entrance receives floor or ceil of its share and remainders rotate evenly',()=>{
 const {c,s}=setup(),sources=Array.from({length:6},(_,q)=>({tile:{q,r:0},dir:q===5?6:0})),totals=Array(6).fill(0);
 for(let w=0;w<6;w++){c.runtime.schedule(s,sources,Array.from({length:17},()=>({speed:25})));const counts=Array(6).fill(0);for(const job of s.spawnQueue){counts[job.source.q]++;totals[job.source.q]++;}assert.equal(Math.max(...counts)-Math.min(...counts),1);}
 assert.deepEqual(totals,Array(6).fill(17));
});
