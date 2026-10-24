const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../headless-core.cjs'),{load}=require('./helpers/game.cjs');
const loadout=['archer','catapult','chain','freeze','mine'];
const signature=s=>JSON.stringify({map:[...s.map],variant:s.dailyVariant,deck:s.deck,power:s.powerGrid});
test('daily calendar slots repeat deterministically for the date and change on the next cycle',()=>{
 const c=core();for(let i=0;i<9;i++){const day='2026-12-'+String(7+i).padStart(2,'0'),next='2026-12-'+String(16+i).padStart(2,'0'),kind=c.waves.daily(day).id;
 const create=d=>c.session.create({seed:kind+'-v1|'+d,runId:'test',loadout,challengeDay:d});const a=create(day),b=create(day),later=create(next);assert.equal(later.state.challengeKind,kind);assert.equal(signature(a.state),signature(b.state));const gameplay=r=>JSON.stringify({map:[...r.state.map],power:r.state.powerGrid,draft:r.state.towerDraft,offers:r.state.challengeKind==='greed'?c.waves.greedOffers(r.state):null,waves:[4,5,8].map(w=>c.waves.plan(w,0,true,r.state))});assert.notEqual(gameplay(a),gameplay(later),kind+' must change gameplay, not just its variant ID');
 const restored=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(a.state,a.random))));assert.equal(signature(restored.state),signature(a.state));assert.deepEqual(JSON.parse(JSON.stringify(c.waves.plan(8,0,true,a.state))),JSON.parse(JSON.stringify(c.waves.plan(8,0,true,b.state))));
 }
});
test('villages preserve selected loadout and display three correctly ordered health bars',()=>{
 const c=core(),{state:s}=c.session.create({seed:'villages-v1|2026-12-11',runId:'health',loadout,challengeDay:'2026-12-11'});assert.deepEqual([...s.towerLoadout],loadout);const ys=s.villages.goals.map(g=>c.map.axialToWorld(g.q,g.r).y);assert.ok(ys[0]<ys[1]&&ys[1]<ys[2]);
 const {a,elements}=load();a.newRun(loadout,undefined,undefined,'2026-12-11');a.renderAll();assert.equal(elements.get('villageHud').children.length,3);assert.ok(elements.get('healthStat').classList.contains('hidden'));assert.equal(elements.get('villageHud').children[0].children[0].textContent,'N ♥ 15/15');
});
