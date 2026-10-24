const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../headless-core.cjs'),{load}=require('./helpers/game.cjs');
const day='2026-11-29',json=x=>JSON.parse(JSON.stringify(x));
// Preserve regression coverage for existing v1.2.3 saves; new rules have separate tests.
function setup(){const c=core();return {c,...c.snapshot.restore(JSON.parse(JSON.stringify(require('./fixtures/towerDraft-v123.json'))))};}
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
 assert.ok(c.flow.start(s,r.random));for(const paused of [false,true]){s.paused=paused;s.towerDraft.upgrades=1;assert.equal(c.towers.buy(s,type,[slots(s)[1]]).ok,false);assert.equal(c.towerDraft.choose(s,0),false);assert.equal(c.towerDraft.canUpgrade(s),true);}
});
test('real draft defense survives thirty-five waves without spending or injecting gold',()=>{
 const r=setup(),{c,state:s}=r;
 for(let wave=1;wave<=35;wave++){
  while(s.towerDraft.picks){const existing=[...s.map.values()].flatMap(t=>t.towers).filter(Boolean);const priority=o=>o.kind==='upgrade'?(existing.filter(t=>t.type!=='freeze').length>=4?-1:8):o.kind==='repair'?9:o.type==='freeze'&&!existing.some(t=>t.type==='freeze')?-1:({flame:0,chain:1,necromancer:2,catapult:3,ballista:4,archer:5,mine:6,freeze:7}[o.type]);const choices=s.towerDraft.offers.map((o,i)=>({i,p:priority(o)})).sort((a,b)=>a.p-b.p);assert.ok(c.towerDraft.choose(s,choices[0].i));deploy(r);}
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
 const r=setup(),{c,state:s}=r;while(s.towerDraft.picks)c.towerDraft.choose(s,0);deploy(r);s.wave=6;s.hp=18;c.towerDraft.prepare(s);
 assert.ok(s.towerDraft.offers.some(o=>o.kind==='upgrade'));assert.ok(s.towerDraft.offers.some(o=>o.kind==='repair'));assert.ok(c.towerDraft.choose(s,s.towerDraft.offers.findIndex(o=>o.kind==='repair')));assert.equal(s.hp,20);assert.equal(c.towerDraft.choose(s,1),false);
 s.wave=4;c.towerDraft.prepare(s);assert.ok(!s.towerDraft.offers.some(o=>o.kind==='repair'));assert.ok(c.towerDraft.choose(s,2));assert.equal(s.towerDraft.upgrades,1);
});
test('snapshot resumes draft combat identically without refreshing offers or inventory',()=>{
 const r=setup(),{c,state:s}=r;while(s.towerDraft.picks)c.towerDraft.choose(s,0);deploy(r);c.flow.start(s,r.random);c.runtime.advance(s,r.random,1);
 const restored=c.snapshot.restore(json(c.snapshot.capture(s,r.random)));for(let i=0;i<180;i++){c.runtime.advance(s,r.random,.05);c.runtime.advance(restored.state,restored.random,.05);}
 assert.deepEqual(json(restored.state.enemies),json(s.enemies));assert.equal(restored.state.hp,s.hp);assert.deepEqual(json(restored.state.towerDraft),json(s.towerDraft));
});
test('daily win pays once, retry does not alter solo records and earlier dates keep their missions',()=>{
 const h=load(),{a,elements,storage}=h;a.newRun(undefined,undefined,undefined,day);a.state.wave=35;a.endWave();let p=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(p.diamonds,10);assert.equal(p.records.highestWave,0);assert.equal(a.state.challengeWon,true);assert.match(elements.get('campaignVictoryTitle').textContent,/Draft/);
 elements.get('retryLoadoutBtn').listeners.click();a.state.wave=35;a.endWave();p=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(p.diamonds,10);
 const c=core();for(const [d,id]of [['2026-11-22','expedition'],['2026-11-28','garrison'],[day,'towerDraft'],['2026-11-30','expedition']])assert.equal(c.waves.daily(d).id,id);
});


test('draft map grows once per stage, varies by seed and survives snapshots',()=>{
 const r=setup(),b=setup(),{c,state:s}=r;assert.deepEqual(json([...s.map]),json([...b.state.map]));const size=s.map.size;
 s.wave=5;c.towerDraft.prepare(s);assert.equal(s.map.size,size+2);c.towerDraft.prepare(s);assert.equal(s.map.size,size+2);
 const saved=c.snapshot.restore(json(c.snapshot.capture(s,r.random)));c.towerDraft.prepare(saved.state);assert.equal(saved.state.map.size,size+2);
 const shapes=new Set();for(let i=0;i<12;i++){const x=c.session.create({seed:'map-'+i,runId:'test',challengeDay:day,loadout:['archer','catapult','chain','freeze','mine']}).state;x.wave=5;c.towerDraft.prepare(x);shapes.add(JSON.stringify([...x.map].map(([k,t])=>[k,t.roads])));assert.ok(c.runtime.spawnSources(x).length);}
 assert.ok(shapes.size>1);
});
test('draft quick inventory only shows owned towers and removes spent entries',()=>{
 const {a,elements}=load({labMission:'towerDraft'});assert.equal(elements.get('quickLoadout').children.length,0);
 const d=a.state.towerDraft;d.inventory={archer:1,mine:0};a.renderAll();assert.equal(elements.get('quickLoadout').children.length,1);
 d.inventory.archer=0;a.renderAll();assert.equal(elements.get('quickLoadout').children.length,0);
});

test('saved upgrade tickets work during combat and paused combat, spending exactly one',()=>{
 for(const paused of [false,true]){const r=setup(),{c,state:s}=r;while(s.towerDraft.picks)c.towerDraft.choose(s,0);const type=Object.keys(s.towerDraft.inventory)[0],slot=slots(s)[0];assert.ok(c.towers.buy(s,type,[slot]).ok);s.towerDraft.upgrades=1;assert.ok(c.flow.start(s,r.random));s.paused=paused;const tw=s.map.get(slot.q+','+slot.r).towers[slot.index],branch=c.data.availableUpgrades(tw)[0][0];assert.ok(c.towers.upgrade(s,slot,branch));assert.equal(s.towerDraft.upgrades,0);assert.equal(tw.level,2);assert.equal(c.towers.upgrade(s,slot,branch),false);}
});
test('draft cadence gives three initial picks and five subsequent picks over twelve waves',()=>{
 const {c,state:s}=setup();let total=0;for(let wave=0;wave<12;wave++){s.wave=wave;c.towerDraft.prepare(s);assert.equal(s.towerDraft.picks,wave===0?3:wave%2===0?1:0);total+=s.towerDraft.picks;while(s.towerDraft.picks)c.towerDraft.choose(s,0);}assert.equal(total,8);
});


test('draft offers drag directly onto a slot once, retain cancelled picks and hide in combat',()=>{
 let hit={q:1,r:0,index:0};const {a,elements,documentListeners}=load({labMission:'towerDraft',pickSlot:()=>hit}),s=a.state;
 const card=elements.get('draftOffers').children[0],type=s.towerDraft.offers[0].type;
 assert.match(elements.get('draftStatus').textContent,/3 STARTTÜRME.*0\/3/);
 const down={button:0,pointerId:4,clientX:10,clientY:10,preventDefault(){},stopPropagation(){}};
 card.listeners.pointerdown(down);assert.equal(s.towerDraft.picks,3);assert.ok(!s.dragTower);
 documentListeners.pointermove({pointerId:4,clientX:300,clientY:200});assert.match(elements.get('towerDragGhost').innerHTML,/0 🪙/);
 documentListeners.pointerup({pointerId:4,clientX:300,clientY:200});card.listeners.click();assert.equal(s.towerDraft.picks,2);assert.equal(s.map.get('1,0').towers[0].type,type);assert.equal(s.towerDraft.inventory[type],0);
 hit=null;const second=elements.get('draftOffers').children[0],secondType=s.towerDraft.offers[0].type;second.listeners.pointerdown({...down,pointerId:5});documentListeners.pointermove({pointerId:5,clientX:300,clientY:200});documentListeners.pointercancel({});assert.equal(s.towerDraft.inventory[secondType],1);assert.equal(s.towerDraft.picks,1);
 elements.get('draftOffers').children[0].listeners.click();a.startWave();assert.equal(s.waveRunning,true);assert.ok(elements.get('draftControls').classList.contains('hidden'));
});
test('long draft has fixed five-wave expansion dates, capped final expansion and scaling ticket packs',()=>{
 const {c,state:s}=setup();while(s.towerDraft.picks)c.towerDraft.choose(s,0);deploy({c,state:s});const size=s.map.size;
 for(let w=1;w<35;w++){s.wave=w;c.towerDraft.prepare(s);assert.equal(s.map.size,size+Math.floor(w/5)*2);if(w===12||w===24){const up=s.towerDraft.offers.find(o=>o.kind==='upgrade');assert.equal(up.count,w===12?2:3);}}
 const {a,elements}=load({labMission:'towerDraft'});a.state.wave=30;a.renderAll();assert.match(elements.get('draftGrowth').textContent,/nach Welle 31 um 1 Straßenhex/);
});
