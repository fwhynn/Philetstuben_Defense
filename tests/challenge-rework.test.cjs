const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../headless-core.cjs'),{load}=require('./helpers/game.cjs');
const json=x=>JSON.parse(JSON.stringify(x)),loadout=['archer','catapult','chain','freeze','mine'];
function create(kind,seed='rework'){const c=core(),day={greed:'2026-10-25',expedition:'2026-11-22',towerDraft:'2026-11-29',movingFortress:'2026-12-07'}[kind];return {c,...c.session.create({seed,runId:seed,loadout,challengeDay:day})};}
test('contract gold is pending until survival, never pays on death or twice, and legacy upfront contracts are not repaid',()=>{
 const {c,state:s,random}=create('greed');s.phase='build';const o=c.waves.greedOffers(s)[0],gold=s.gold;c.waves.acceptGreed(s,o.id);assert.equal(s.gold,gold);s.wave=1;s.waveRunning=true;c.waves.settleGreed(s);assert.equal(s.gold,gold);
 const restored=c.snapshot.restore(json(c.snapshot.capture(s,random))).state;restored.waveRunning=false;restored.lastCompletedWave=1;restored.hp=0;c.waves.settleGreed(restored);assert.equal(restored.gold,gold);
 s.waveRunning=false;s.lastCompletedWave=1;c.waves.settleGreed(s);assert.equal(s.gold,gold+o.gold);c.waves.settleGreed(s);assert.equal(s.gold,gold+o.gold);s.greedContract={wave:1,id:o.id};c.waves.settleGreed(s);assert.equal(s.gold,gold+o.gold);
});
test('contract boss death cannot enqueue undefined loot; old broken boss loot is selectable',()=>{
 const {c,state:s,random}=create('greed');s.wave=3;s.phase='wave';s.waveRunning=true;const boss=c.waves.plan(3,0,false,{...s,greedContract:{wave:3,id:'boss'}}).enemies.find(e=>e.type==='boss');assert.equal(boss.noBossReward,true);
 s.enemies=[{...boss,id:1,hp:1,armorHp:0,magicHp:0,alive:true,x:10,y:0,index:0,t:0,speed:0,points:[{x:10,y:0},{x:1000,y:0}]}];c.combat.step(s,[{tw:{type:'archer',lastShot:0},pos:{x:0,y:0}}],c.data.TOWERS,0,2000);assert.equal(s.enemies.length,0);assert.equal(s.bossRewards.length,0);assert.ok(c.session.finish(s,random));assert.notEqual(s.phase,'bossReward');
 s.phase='bossReward';s.bossRewards=[undefined];const offer=c.rewards.offer(s,'boss',random);assert.ok(offer.choices.length);assert.ok(c.session.choose(s,random,offer.id,0));assert.notEqual(s.phase,'bossReward');
});
test('new expedition replaces only the played card and preserves the hand and random regions after reload',()=>{
 const variants=new Set();for(let i=0;i<20;i++){const {c,state:s,random}=create('expedition','exp-'+i),before=[...s.hand];variants.add(JSON.stringify([...s.landmarks]));const result=c.session.place(s,random,{q:1,r:0,index:0,rotation:0});assert.ok(result);assert.notEqual(s.hand[0],before[0]);assert.deepEqual([...s.hand.slice(1)],before.slice(1));assert.equal(s.expedition.remaining,1);
 const restored=c.snapshot.restore(json(c.snapshot.capture(s,random)));assert.deepEqual(json(restored.state.hand),json(s.hand));assert.deepEqual(json([...restored.state.landmarks]),json([...s.landmarks]));c.expedition.finishPlanning(s);c.expedition.resumePlanning(s);assert.deepEqual(json(s.hand),json(restored.state.hand));}
 assert.ok(variants.size>=16);
});
test('new draft grows exactly one connected tile per completed wave and has non-guaranteed weighted tickets',()=>{
 let ticketOffers=0,noTickets=0;const maps=new Set(),offers=new Set();for(let seed=0;seed<12;seed++){const {c,state:s,random}=create('towerDraft','draft-'+seed);const initial=s.map.size;offers.add(JSON.stringify(s.towerDraft.offers));
 for(let wave=1;wave<35;wave++){s.wave=wave;c.towerDraft.prepare(s);assert.equal(s.map.size,initial+wave);assert.equal(c.map.routeGraph(s.map).distances.size,s.map.size);if(s.towerDraft.picks){if(s.towerDraft.offers.some(o=>o.kind==='upgrade'))ticketOffers++;else noTickets++;}const n=s.map.size;c.towerDraft.prepare(s);assert.equal(s.map.size,n);}
 maps.add(JSON.stringify([...s.map.keys()]));const restored=c.snapshot.restore(json(c.snapshot.capture(s,random)));assert.deepEqual(json(restored.state.towerDraft),json(s.towerDraft));}
 assert.ok(ticketOffers>0&&noTickets>0);assert.ok(maps.size>1);assert.ok(offers.size>1);
});
test('draft click stores only; inventory drag and drop works during combat without gold or permanent hints',()=>{
 const h=load({labMission:'towerDraft',pickSlot:()=>({q:1,r:0,index:0})}),{a,elements,documentListeners}=h,s=a.state;assert.equal(s.showSlotHints,false);const type=s.towerDraft.offers[0].type;
 elements.get('draftOffers').children[0].listeners.click();assert.equal(s.towerDraft.inventory[type],1);assert.ok(!s.dragTower);assert.equal(s.showSlotHints,true);while(s.towerDraft.picks)elements.get('draftOffers').children[0].listeners.click();a.startWave();assert.ok(a.armQuickTower(type));assert.ok(a.dropQuickTower(type,{q:1,r:0,index:0}));assert.equal(s.gold,0);assert.equal(elements.get('goldDetails').classList.contains('hidden'),true);
 s.towerDraft.inventory={};a.renderAll();assert.equal(s.showSlotHints,false);assert.equal(elements.get('draftControls').classList.contains('hidden'),true);
});
test('draft and expedition opening waves demand materially more defense than normal',()=>{
 for(const kind of ['expedition','towerDraft']){const {c,state:s}=create(kind),p=c.waves.plan(1,0,true,s),normal=c.waves.plan(1);assert.ok(p.count>normal.count*2);assert.ok(p.enemies.reduce((n,e)=>n+e.hp,0)>normal.enemies.reduce((n,e)=>n+e.hp,0)*3);assert.equal(p.wave,1);if(kind==='towerDraft')assert.equal(p.maxGold,0);}
});
test('fortress teleports on one connected map without deleting towers or terrain, all four routes work',()=>{
 const {c,state:s,random}=create('movingFortress'),size=s.map.size,tiles=new Map(s.map),slot={...s.movingFortress.stations[0].path[0],index:0};assert.ok(c.towers.buy(s,'archer',[slot]).ok);const tower=s.map.get(slot.q+','+slot.r).towers[0];
 for(let stage=0;stage<4;stage++){s.wave=stage*3;s.phase='build';s.waveRunning=false;c.movingFortress.prepare(s);assert.equal(s.map.size,size);for(const [id,t]of tiles)assert.equal(s.map.get(id),t);assert.equal(s.map.get(slot.q+','+slot.r).towers[0],tower);const source=c.runtime.spawnSources(s)[0];assert.equal(source.routes.distances.size,size);const path=c.runtime.nextSourcePoints(s,random,source);assert.deepEqual(json(path.at(-1)),json(source.routes.geometry.get(source.target).hub));assert.equal([...s.map.values()].filter(t=>t.type==='base').length,1);const restored=c.snapshot.restore(json(c.snapshot.capture(s,random)));assert.deepEqual(json(restored.state.movingFortress),json(s.movingFortress));}
});

function slots(s){return [...s.map.values()].flatMap(t=>Array.from({length:t.slots},(_,index)=>({q:t.q,r:t.r,index})));}
function deploy(r){const {c,state:s}=r;const order=slots(s).sort((a,b)=>Math.abs(a.q-1)+Math.abs(a.r-2)-Math.abs(b.q-1)-Math.abs(b.r-2));for(const [type,n]of Object.entries(s.towerDraft.inventory))for(let i=0;i<n;i++){const slot=order.find(x=>!s.map.get(x.q+','+x.r).towers[x.index]);if(slot)assert.ok(c.towers.buy(s,type,[slot]).ok);}
 for(const slot of order){const tw=s.map.get(slot.q+','+slot.r).towers[slot.index];if(tw&&s.towerDraft.upgrades){const up=c.data.runUpgrades(s,tw)[0];if(up)assert.ok(c.towers.upgrade(s,slot,up[0]));}}
}

test('new random draft defense survives thirty-five waves without spending or injecting gold',()=>{
 const r=create('towerDraft','2026-11-29'),{c,state:s}=r;
 for(let wave=1;wave<=35;wave++){
  while(s.towerDraft.picks){const existing=[...s.map.values()].flatMap(t=>t.towers).filter(Boolean);const priority=o=>o.kind==='upgrade'?(existing.filter(t=>t.type!=='freeze').length>=4&&c.towerDraft.eligible(s)&&s.towerDraft.upgrades===0?-1:8):o.kind==='repair'?9:o.type==='freeze'&&!existing.some(t=>t.type==='freeze')?-1:({flame:0,chain:1,necromancer:2,catapult:3,ballista:4,archer:5,mine:6,freeze:7}[o.type]);const choices=s.towerDraft.offers.map((o,i)=>({i,p:priority(o)})).sort((a,b)=>a.p-b.p);assert.ok(c.towerDraft.choose(s,choices[0].i));deploy(r);}
  deploy(r);assert.ok(c.flow.start(s,r.random));let result,steps=0;do{result=c.session.advance(s,r.random,.05);}while(result==='running'&&++steps<20000);assert.equal(result,'complete','wave '+wave+' hp '+s.hp);c.session.acknowledge(s);
 }
 assert.equal(s.phase,'victory');assert.equal(c.session.endless(s,r.random),false);assert.ok(Object.values(s.runTowerStats).length>=2);
});
