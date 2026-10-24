const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../headless-core.cjs'),{load}=require('./helpers/game.cjs');
const day='2026-11-22',json=x=>JSON.parse(JSON.stringify(x));
function setup(){const c=core();return {c,...c.session.create({seed:'expedition-v1|'+day,runId:'expedition-test',challengeDay:day,loadout:['archer','catapult','chain','freeze','mine']})};}
const route=[[1,0,'tJunction',0],[2,0,'tJunction',3],[3,0,'straight',0],[4,0,'straight',0],[5,0,'straight',0],[6,0,'straight',0],...[1,2,3,4,5].map(n=>[1,-n,'straight',2]),...[1,2,3,4,5].map(n=>[2,n,'straight',2])];
function place(r,p){const [q,z,id,rotation]=p;assert.ok(r.c.session.place(r.state,r.random,{q,r:z,index:r.state.hand.indexOf(id),rotation}),JSON.stringify(p));}
test('fixed fog objectives and reusable kit isolate the mission and preserve partial planning through save',()=>{
 const r=setup(),{c,state:s}=r;assert.equal(s.challengeKind,'expedition');assert.equal(s.landmarks.size,3);assert.equal(s.gold,100);assert.equal(s.hand.length,5);assert.equal(s.expedition.remaining,2);assert.equal(c.expedition.complete(s),false);assert.equal(c.runtime.rescueTunnel(s),false);
 assert.equal(c.session.place(s,r.random,{q:99,r:99,index:0,rotation:0}),null);assert.equal(s.expedition.remaining,2);
 place(r,route[0]);assert.equal(s.expedition.remaining,1);c.expedition.prepare(s);assert.equal(s.expedition.remaining,1);
 const restored=c.snapshot.restore(json(c.snapshot.capture(s,r.random)));assert.equal(restored.state.landmarks.fixed,true);assert.deepEqual(json(restored.state.expedition),json(s.expedition));assert.equal(restored.state.hand.length,5);
 assert.ok(c.expedition.finishPlanning(s));assert.equal(s.hand.length,0);assert.ok(c.expedition.resumePlanning(s));assert.equal(s.hand.length,5);
});
test('real road expedition connects all relics and survives twelve waves with earned gold only',()=>{
 const r=setup(),{c,state:s}=r;let next=0;
 const build=[['catapult',1,0,0],['archer',1,0,1],['freeze',2,0,0],['ballista',2,0,1],['mine',3,0,0],['catapult',4,0,0]];
 for(let wave=1;wave<=12;wave++){
  for(let i=0;i<2&&next<route.length;i++)place(r,route[next++]);
  for(const [type,q,z,index]of build){const tile=s.map.get(q+','+z);if(tile&&index<tile.slots&&!tile.towers[index])c.towers.buy(s,type,[{q,r:z,index}]);}
  for(const [,q,z,index]of build){const tw=s.map.get(q+','+z)?.towers[index];if(tw)for(const [id]of c.data.runUpgrades(s,tw).slice(0,1))c.towers.upgrade(s,{q,r:z,index},id);}
  assert.ok(c.expedition.finishPlanning(s));assert.ok(c.flow.start(s,r.random));assert.equal(c.expedition.resumePlanning(s),false);
  let result,steps=0;do{result=c.session.advance(s,r.random,.05);}while(result==='running'&&++steps<20000);
  assert.equal(result,'complete','wave '+wave+' hp '+s.hp);c.session.acknowledge(s);assert.ok(s.gold>=0);assert.equal(s.bossRewards.length,0);
 }
 assert.equal(s.expedition.collected.length,3);assert.equal(s.goldEarned.relics,75);assert.ok(c.expedition.complete(s));assert.equal(s.phase,'victory');assert.equal(s.challengeWon,true);assert.equal(c.session.endless(s,r.random),false);
 const l=[...s.landmarks.values()][0],gold=s.gold;assert.equal(c.expedition.collect(s,l,s.map.get(l.q+','+l.r)),0);assert.equal(s.gold,gold);
});
test('surviving wave twelve without relics fails without inventing damage or awarding diamonds',()=>{
 const h=load(),{a,storage,elements}=h;a.newRun(undefined,undefined,undefined,day);a.state.wave=12;const hp=a.state.hp;a.endWave();assert.equal(a.state.phase,'gameover');assert.equal(a.state.hp,hp);assert.equal(a.state.expedition.failed,true);
 const p=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(p.diamonds,0);assert.equal(p.dailyResults[day].best,12);assert.equal(p.dailyResults[day].won,false);assert.match(elements.get('gameOverTitle').textContent,/Relikte fehlen/);
});
test('preview remains isolated and historical calendar entries remain stable',()=>{
 const h=load(),s=h.a.state;h.elements.get('devExpeditionStart').listeners.click();assert.equal(h.a.state,s);
 const p=load({firstPlayerTest:true});p.elements.get('devExpeditionStart').listeners.click();assert.equal(p.a.state.challengeKind,'expedition');
 const c=core();for(const [d,id]of [['2026-11-15','powerGrid'],['2026-11-21','powerGrid'],[day,'expedition'],['2026-11-23','powerGrid']])assert.equal(c.waves.daily(d).id,id);
});


test('revealing a relic is not collecting it; disconnected roads cannot collect it either',()=>{
 const r=setup(),{c,state:s}=r;
 for(let i=0;i<5;i++){if(!s.expedition.remaining){s.wave++;c.expedition.prepare(s);}place(r,route[i]);}
 const l=s.landmarks.get('7,0');assert.equal(c.exploration.visibility(s.map,l),'clear');assert.equal(l.claimed,false);assert.equal(s.expedition.collected.length,0);
 const isolated={q:1,r:-6,roads:[2,5],towers:[],slots:0};s.map.set('1,-6',isolated);assert.equal(c.expedition.collect(s,s.landmarks.get('1,-6'),isolated),0);assert.equal(s.goldEarned.relics||0,0);
});
test('resumed expedition combat produces the same enemies, life and objective progress',()=>{
 const r=setup(),{c,state:s}=r;place(r,route[0]);place(r,route[1]);c.towers.buy(s,'catapult',[{q:1,r:0,index:0}]);assert.ok(c.flow.start(s,r.random));c.runtime.advance(s,r.random,1);
 const restored=c.snapshot.restore(json(c.snapshot.capture(s,r.random)));for(let i=0;i<120;i++){c.runtime.advance(s,r.random,.05);c.runtime.advance(restored.state,restored.random,.05);}
 assert.deepEqual(json(restored.state.enemies),json(s.enemies));assert.equal(restored.state.hp,s.hp);assert.deepEqual(json(restored.state.expedition),json(s.expedition));
});
test('failed objective can later earn a real victory once, without changing solo records',()=>{
 const h=load(),{a,storage,elements}=h;a.newRun(undefined,undefined,undefined,day);a.state.wave=12;a.endWave();
 elements.get('retryLoadoutBtn').listeners.click();
 // Build a connected objective fixture; full legal placement and combat are covered above.
 for(const [q,r,id,rotation]of route){const roads={straight:[0,3],tJunction:[0,2,3]}[id].map(d=>(d+rotation)%6);a.state.map.set(q+','+r,{q,r,type:id,roads,slots:0,towers:[],buildings:[]});}
 for(const l of a.state.landmarks.values()){l.claimed=true;a.state.expedition.collected.push(l.relicId);a.state.map.set(l.q+','+l.r,{q:l.q,r:l.r,type:'straight',roads:l.prefab.roads,slots:0,towers:[],buildings:[]});}
 a.state.wave=12;a.endWave();let p=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(p.dailyResults[day].won,true);assert.equal(p.diamonds,10);assert.equal(p.records.highestWave,0);a.endWave();p=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(p.diamonds,10);
});
