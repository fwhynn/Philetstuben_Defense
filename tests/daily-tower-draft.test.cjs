const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../headless-core.cjs'),{load}=require('./helpers/game.cjs');
const day='2026-11-29',json=x=>JSON.parse(JSON.stringify(x));
function setup(){const c=core();return {c,...c.session.create({seed:'towerDraft-v1|'+day,runId:'draft-test',challengeDay:day,loadout:['archer','catapult','chain','freeze','mine']})};}
function slots(s){return [...s.map.values()].flatMap(t=>Array.from({length:t.slots},(_,index)=>({q:t.q,r:t.r,index})));}
function deploy(r){const {c,state:s}=r;const order=slots(s).sort((a,b)=>Math.abs(a.q-1)+Math.abs(a.r-2)-Math.abs(b.q-1)-Math.abs(b.r-2));for(const [type,n]of Object.entries(s.towerDraft.inventory))for(let i=0;i<n;i++){const slot=order.find(x=>!s.map.get(x.q+','+x.r).towers[x.index]);if(slot)assert.ok(c.towers.buy(s,type,[slot]).ok);}
 for(const slot of order){const tw=s.map.get(slot.q+','+slot.r).towers[slot.index];if(tw&&s.towerDraft.upgrades){const up=c.data.runUpgrades(s,tw)[0];if(up)assert.ok(c.towers.upgrade(s,slot,up[0]));}}
}
test('offers are seeded, mandatory, persistent and grant exactly one inventory item per pick',()=>{
 const r=setup(),b=setup(),{c,state:s}=r;assert.equal(s.challengeKind,'towerDraft');assert.equal(s.towerDraft.picks,3);assert.deepEqual(json(s.towerDraft),json(b.state.towerDraft));assert.equal(c.flow.start(s,r.random),null);assert.equal(c.towerDraft.choose(s,-1),false);assert.ok(s.towerDraft.offers.every(o=>o.kind==='tower'&&o.type!=='freeze'));
 const item=s.towerDraft.offers[0].type;assert.ok(c.towerDraft.choose(s,0));assert.equal(s.towerDraft.inventory[item],1);c.towerDraft.prepare(s);assert.equal(s.towerDraft.picks,2);
 const restored=c.snapshot.restore(json(c.snapshot.capture(s,r.random)));assert.deepEqual(json(restored.state.towerDraft),json(s.towerDraft));
 while(s.towerDraft.picks)c.towerDraft.choose(s,0);assert.equal(c.towerDraft.choose(s,0),false);
});
test('inventory, upgrade tickets, combat locks and sales cannot be bypassed',()=>{
 const r=setup(),{c,state:s}=r;while(s.towerDraft.picks)c.towerDraft.choose(s,0);const type=Object.keys(s.towerDraft.inventory)[0],slot=slots(s)[0],before=s.towerDraft.inventory[type];
 assert.equal(c.towers.buy(s,type,[slot,slot]).ok,false);assert.equal(s.towerDraft.inventory[type],before);assert.ok(c.towers.buy(s,type,[slot]).ok);assert.equal(s.towerDraft.inventory[type],before-1);
 const tw=s.map.get(slot.q+','+slot.r).towers[0],branch=c.data.availableUpgrades(tw)[0][0];assert.equal(tw.paid,0);assert.equal(c.data.towerRefund(s,tw),null);assert.equal(c.towers.upgrade(s,slot,branch),false);s.towerDraft.upgrades=1;assert.ok(c.towers.upgrade(s,slot,branch));assert.equal(s.towerDraft.upgrades,0);assert.equal(c.towers.upgrade(s,slot,branch),false);
 assert.equal(c.heroes.buy(s,'walls'),false);assert.equal(c.runtime.rescueTunnel(s),false);assert.equal(c.placement.canPlace(s,7,0,c.data.CARD_LIBRARY.straight,0),false);
 assert.ok(c.flow.start(s,r.random));for(const paused of [false,true]){s.paused=paused;s.towerDraft.upgrades=1;assert.equal(c.towers.buy(s,type,[slots(s)[1]]).ok,false);assert.equal(c.towerDraft.choose(s,0),false);assert.equal(c.towerDraft.canUpgrade(s),false);}
});
test('real draft defense survives twelve waves without spending or injecting gold',()=>{
 const r=setup(),{c,state:s}=r;
 for(let wave=1;wave<=12;wave++){
  while(s.towerDraft.picks){const priority=o=>o.kind==='upgrade'?2:o.kind==='repair'?9:({catapult:0,chain:1,flame:3,ballista:4,necromancer:5,mine:6,freeze:7,archer:8}[o.type]);const choices=s.towerDraft.offers.map((o,i)=>({i,p:priority(o)})).sort((a,b)=>a.p-b.p);assert.ok(c.towerDraft.choose(s,choices[0].i));deploy(r);}
  deploy(r);assert.ok(c.flow.start(s,r.random));let result,steps=0;do{result=c.session.advance(s,r.random,.05);}while(result==='running'&&++steps<20000);assert.equal(result,'complete','wave '+wave+' hp '+s.hp);c.session.acknowledge(s);
 }
 assert.equal(s.phase,'victory');assert.equal(c.session.endless(s,r.random),false);assert.ok(Object.values(s.runTowerStats).length>=2);
});
test('controller draft preview is isolated and pending choices block wave start',()=>{
 const h=load(),before=h.a.state;h.elements.get('devDraftStart').listeners.click();assert.equal(h.a.state,before);
 const p=load({firstPlayerTest:true});p.elements.get('devDraftStart').listeners.click();assert.equal(p.a.state.challengeKind,'towerDraft');assert.equal(p.elements.get('startWaveBtn').disabled,true);
 const buttons=p.elements.get('draftOffers').children;assert.equal(buttons.length,3);buttons[0].listeners.click();assert.equal(p.a.state.towerDraft.picks,2);
});

test('later offers include usable upgrades and wounded-base repairs, with bounded healing',()=>{
 const r=setup(),{c,state:s}=r;while(s.towerDraft.picks)c.towerDraft.choose(s,0);deploy(r);s.wave=3;s.hp=18;c.towerDraft.prepare(s);
 assert.ok(s.towerDraft.offers.some(o=>o.kind==='upgrade'));assert.ok(s.towerDraft.offers.some(o=>o.kind==='repair'));assert.ok(c.towerDraft.choose(s,s.towerDraft.offers.findIndex(o=>o.kind==='repair')));assert.equal(s.hp,20);assert.equal(c.towerDraft.choose(s,1),false);
 s.wave=4;c.towerDraft.prepare(s);assert.ok(!s.towerDraft.offers.some(o=>o.kind==='repair'));assert.ok(c.towerDraft.choose(s,2));assert.equal(s.towerDraft.upgrades,1);
});
test('snapshot resumes draft combat identically without refreshing offers or inventory',()=>{
 const r=setup(),{c,state:s}=r;while(s.towerDraft.picks)c.towerDraft.choose(s,0);deploy(r);c.flow.start(s,r.random);c.runtime.advance(s,r.random,1);
 const restored=c.snapshot.restore(json(c.snapshot.capture(s,r.random)));for(let i=0;i<180;i++){c.runtime.advance(s,r.random,.05);c.runtime.advance(restored.state,restored.random,.05);}
 assert.deepEqual(json(restored.state.enemies),json(s.enemies));assert.equal(restored.state.hp,s.hp);assert.deepEqual(json(restored.state.towerDraft),json(s.towerDraft));
});
test('daily win pays once, retry does not alter solo records and earlier dates keep their missions',()=>{
 const h=load(),{a,elements,storage}=h;a.newRun(undefined,undefined,undefined,day);a.state.wave=12;a.endWave();let p=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(p.diamonds,10);assert.equal(p.records.highestWave,0);assert.equal(a.state.challengeWon,true);assert.match(elements.get('campaignVictoryTitle').textContent,/Draft/);
 elements.get('retryLoadoutBtn').listeners.click();a.state.wave=12;a.endWave();p=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(p.diamonds,10);
 const c=core();for(const [d,id]of [['2026-11-22','expedition'],['2026-11-28','garrison'],[day,'towerDraft'],['2026-11-30','expedition']])assert.equal(c.waves.daily(d).id,id);
});

