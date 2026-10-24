const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../headless-core.cjs');
const json=x=>JSON.parse(JSON.stringify(x)),loadout=['archer','catapult','chain','freeze','mine'];
function route(s){
 const [e,n,b]=[...s.landmarks.values()],steps=[];
 for(let q=1;q<e.q;q++)steps.push({q,r:0,roads:q===n.q?[0,2,3]:q===b.q?[0,3,5]:[0,3]});
 for(let r=-1;r>n.r;r--)steps.push({q:n.q,r,roads:[2,5]});
 for(let r=1;r<b.r;r++)steps.push({q:b.q,r,roads:[2,5]});return steps;
}
test('200 expedition seeds have a legal 18-card solution, permanent geometry coverage and reload-stable draws',()=>{
 const c=core(),variants=new Set(),families=c.expedition.cards.map(id=>c.data.CARD_LIBRARY[id].roads.join());
 for(let seed=0;seed<200;seed++){
  const run=c.session.create({seed:'fair-geometry-'+seed,runId:'audit',challengeDay:'2026-11-22',loadout}),s=run.state;
  variants.add(JSON.stringify([...s.landmarks]));const steps=route(s);assert.equal(steps.length,18);
  for(const p of steps){
   if(!s.expedition.remaining){s.wave++;c.expedition.prepare(s);}let command;
   for(let index=0;index<s.hand.length;index++)for(let rotation=0;rotation<6;rotation++)if(c.map.rotatedRoads(c.data.CARD_LIBRARY[s.hand[index]],rotation).slice().sort().join()===p.roads.slice().sort().join())command={q:p.q,r:p.r,index,rotation};
   assert.ok(command,'geometry exists for seed '+seed);const old=s.hand[command.index];
   const restored=c.snapshot.restore(json(c.snapshot.capture(s,run.random)));
   assert.ok(c.session.place(s,run.random,command),'legal placement for seed '+seed);
   assert.ok(c.session.place(restored.state,restored.random,command));
   assert.deepEqual(json(s.expedition.heldCards),json(restored.state.expedition.heldCards));
   assert.notEqual(s.expedition.heldCards[command.index],old);
   assert.deepEqual(s.expedition.heldCards.map(id=>c.data.CARD_LIBRARY[id].roads.join()).sort(),families.slice().sort());
  }
  assert.equal(s.expedition.collected.length,3);assert.ok(c.expedition.complete(s));assert.equal(s.wave,8);
 }
 assert.ok(variants.size>100);
});
test('200 draft seeds retain damage choices, unique offers, bounded ticket gaps and complete tower coverage',()=>{
 const c=core();
 for(let seed=0;seed<200;seed++){
  const run=c.session.create({seed:'fair-offers-'+seed,runId:'audit',challengeDay:'2026-11-29',loadout}),s=run.state;
  while(s.towerDraft.picks){const offers=s.towerDraft.offers;assert.ok(offers.some(o=>['archer','ballista'].includes(o.type)));assert.ok(offers.some(o=>['catapult','chain','mine','flame'].includes(o.type)));assert.ok(c.towerDraft.choose(s,0));}
  let misses=0;const seen=new Set();
  for(let wave=2;wave<35;wave+=2){
   s.wave=wave;s.hp=seed%2?10:20;c.towerDraft.prepare(s);const offers=s.towerDraft.offers;
   assert.equal(new Set(offers.map(o=>o.kind+':'+o.type)).size,3);
   assert.ok(offers.some(o=>o.kind==='tower'));
   misses=offers.some(o=>o.kind==='upgrade')?0:misses+1;assert.ok(misses<=2);
   for(const o of offers)if(o.kind==='tower')seen.add(o.type);
   if(wave===12)assert.equal(seen.size,8,'all tower types offered by wave 12: seed '+seed);
   const restored=c.snapshot.restore(json(c.snapshot.capture(s,run.random)));
   assert.ok(c.towerDraft.choose(s,0));assert.ok(c.towerDraft.choose(restored.state,0));
   s.wave+=2;restored.state.wave+=2;c.towerDraft.prepare(s);c.towerDraft.prepare(restored.state);
   assert.deepEqual(json(s.towerDraft),json(restored.state.towerDraft));
  }
 }
});
test('previously problematic expedition starts win with legal cards, earned gold and real combat',()=>{
 const {simulateExpedition}=require('../scripts/audit-challenge-fairness.cjs');
 for(const seed of ['exp-fair-0','exp-fair-1','exp-fair-27','exp-fair-29']){
  const result=simulateExpedition(seed);assert.equal(result.won,true,seed);assert.equal(result.relics,3);assert.ok(result.wave>=9&&result.wave<=10);assert.ok(result.placements>=18&&result.placements<=20);
 }
});
test('draft drought and late-game regression seeds can win all 35 waves without resource injection',()=>{
 const {simulateDraft}=require('../scripts/audit-challenge-fairness.cjs');
 for(const seed of ['baseline-0','bag-4']){const result=simulateDraft(seed);assert.equal(result.won,true,seed);assert.equal(result.wave,35);}
});
