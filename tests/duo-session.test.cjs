const {test}=require('node:test'),assert=require('node:assert/strict'),loadCore=require('../headless-core.cjs');
const loadout=['archer','catapult','chain','freeze','mine'],json=v=>JSON.parse(JSON.stringify(v));
function setup(){const c=loadCore(),m=c.duo.create('duo-test',[loadout,loadout]);let seq=0;const send=(p,action,payload={})=>c.duo.command(m,p,{id:'test-'+seq++,wave:m.wave,action,payload});for(const run of m.boards){run.state.hand=['straight'];run.state.drawPile=run.state.deck.slice(1);run.state.discard=[];}return {c,m,send};}
function buildBoth(h){for(let i=0;i<2;i++)assert.ok(h.send(i,'place',{q:1,r:0,index:0,rotation:0}));}
test('the finished board expires effects and can upgrade while the partner fights, without early payout',()=>{
 const h=setup(),{c,m,send}=h;buildBoth(h);const a=m.boards[0].state,b=m.boards[1].state,slot={q:1,r:0,index:0};
 assert.ok(send(0,'tower',{type:'freeze',slots:[slot]}));send(0,'ready',{value:true});send(1,'ready',{value:true});
 a.gold=500;a.spawnQueue=[];a.pendingSpawns=0;a.enemies=[];
 a.projectiles=[{kind:'blast',x:0,y:0,r:10,ttl:.3,max:.3}];a.mines=[{x:0,y:0}];const paid=a.gold,last=a.lastCompletedWave;
 c.duo.tick(m);assert.equal(a.phase,'duoWait');assert.equal(a.mines.length,0);assert.equal(a.projectiles.length,1);assert.equal(b.phase,'wave');
 assert.ok(send(0,'upgrade',{slot,upgrade:'deepFrost'}));assert.equal(a.map.get('1,0').towers[0].level,2);assert.ok(a.gold<paid);
 assert.ok(send(0,'baseUpgrade',{kind:'weapon'}));assert.equal(a.baseUpgrades.weapon,1);
 const afterUpgrade=a.gold;for(let i=0;i<8;i++)c.duo.tick(m);
 assert.equal(a.projectiles.length,0);assert.equal(a.gold,afterUpgrade);assert.equal(a.lastCompletedWave,last);assert.equal(a.rewardOffer,undefined);assert.equal(send(0,'ready',{value:true}),false);
 const copy=c.duo.restore(json(c.duo.capture(m)));assert.equal(copy.boards[0].state.map.get('1,0').towers[0].level,2);
 b.spawnQueue=[];b.pendingSpawns=0;b.enemies=[];c.duo.tick(m);assert.equal(a.lastCompletedWave,1);assert.equal(a.gold,afterUpgrade+c.waves.economy.completion+a.income);
 const gold=a.gold;c.duo.tick(m);assert.equal(a.gold,gold,'completion is paid exactly once');
});
test('a ready player can buy the affordable Frost ultimate; upgrading keeps their readiness',()=>{
 const h=setup(),{m,send}=h;buildBoth(h);const s=m.boards[0].state,slot={q:1,r:0,index:0};
 s.gold=122;s.ultimateUnlocks=['ultimate:freeze:deepFrost'];s.map.get('1,0').towers[0]={type:'freeze',level:3,branch:'deepFrost',finalUpgrade:'absoluteZero',paid:125};
 assert.ok(send(0,'ready',{value:true}));assert.equal(send(0,'upgrade',{slot,upgrade:'not-an-upgrade'}),false);assert.equal(m.ready[0],true);
 assert.ok(send(0,'speed',{value:8}));assert.equal(m.ready[0],true);
 assert.ok(send(0,'upgrade',{slot,upgrade:'ultimate:freeze'}));assert.equal(s.map.get('1,0').towers[0].level,4);assert.equal(s.gold,27);assert.deepEqual(Array.from(m.ready),[true,false]);assert.equal(m.phase,'prepare');
 // A purchase by the other player cannot revoke this player's readiness.
 assert.ok(send(0,'ready',{value:true}));assert.ok(send(1,'tower',{type:'archer',slots:[slot]}));assert.deepEqual(Array.from(m.ready),[true,false]);
});
test('two boards remain independent and only both ready can start the same wave',()=>{
  const h=setup(),{m,send}=h;assert.notEqual(m.boards[0].state.seed,m.boards[1].state.seed);assert.equal(m.hp,40);
  assert.equal(send(0,'ready',{value:true}),false);buildBoth(h);
  assert.ok(send(0,'tower',{type:'archer',slots:[{q:1,r:0,index:0}]}));assert.equal(m.boards[0].state.gold,45);assert.equal(m.boards[1].state.gold,70);assert.equal(m.boards[1].state.map.get('1,0').towers[0],null);
  assert.ok(send(0,'ready',{value:true}));assert.equal(m.wave,0);assert.equal(send(0,'tower',{type:'archer',slots:[{q:1,r:0,index:0}]}),false);
  assert.ok(send(1,'ready',{value:true}));assert.equal(m.wave,1);assert.equal(m.phase,'combat');assert.equal(m.boards[0].state.wave,m.boards[1].state.wave);
  assert.equal(send(1,'ready',{value:true}),false);assert.equal(m.wave,1);
});
test('early finisher waits without payout and complete match snapshots resume identically',()=>{
  const h=setup(),{c,m,send}=h;buildBoth(h);send(0,'ready',{value:true});send(1,'ready',{value:true});
  const a=m.boards[0].state;a.spawnQueue=[];a.pendingSpawns=0;a.enemies=[];const gold=a.gold;c.duo.tick(m);
  assert.equal(a.phase,'duoWait');assert.equal(a.gold,gold);assert.equal(a.rewardOffer,undefined);
  const other=loadCore(),restored=other.duo.restore(json(c.duo.capture(m)));
  for(let i=0;m.phase==='combat'&&i<5000;i++){c.duo.tick(m);other.duo.tick(restored);}
  assert.equal(m.phase,'prepare');assert.equal(m.hp,35);assert.equal(a.gold,gold+c.waves.economy.completion);
  assert.deepEqual(json(c.duo.capture(m)),json(other.duo.capture(restored)));
  c.duo.tick(m);assert.equal(a.gold,gold+c.waves.economy.completion);
});
test('leaks from either board drain one shared pool and defeat stops both boards',()=>{
  const h=setup(),{c,m,send}=h;buildBoth(h);send(0,'ready',{value:true});send(1,'ready',{value:true});
  m.hp=3;for(const run of m.boards){const s=run.state;s.hp=3;s.spawnQueue=[];s.pendingSpawns=0;s.enemies=[{alive:true,hp:1,baseDamage:2,index:1,points:[{x:0,y:0},{x:0,y:0}],x:0,y:0}];}
  c.duo.tick(m);assert.equal(m.phase,'gameover');assert.equal(m.hp,0);for(const run of m.boards){assert.equal(run.state.hp,0);assert.equal(run.state.waveRunning,false);assert.equal(run.state.spawnQueue.length,0);}
  assert.equal(send(0,'ready',{value:true}),false);
});
test('team healing and max HP blessings apply once and rejected commands do not mutate the partner',()=>{
  const {c,m,send}=setup();const s=m.boards[0].state;s.phase='bossReward';s.bossRewards=['boss'];s.rewardOffer={kind:'boss',context:'boss',wave:s.wave,phase:s.phase,id:'saved-boss',choices:[{kind:'blessing',blessing:'bastion'}]};const offer=c.rewards.offer(s,'boss',m.boards[0].random),index=offer.choices.findIndex(c=>c.blessing==='bastion');
  assert.ok(send(0,'reward',{offerId:offer.id,index}));assert.equal(m.hp,45);assert.equal(m.maxHp,45);assert.equal(m.boards[1].state.hp,45);
  assert.equal(send(0,'reward',{offerId:offer.id,index}),false);assert.equal(m.hp,45);
  const before=json(c.duo.capture(m));assert.equal(c.duo.command(m,2,{id:'x',wave:0,action:'ready',payload:{value:true}}),false);assert.equal(c.duo.command(m,0,{id:'x',wave:99,action:'ready',payload:{value:true}}),false);assert.deepEqual(json(c.duo.capture(m)),before);
});
test('ready commands can be withdrawn and duplicate IDs are not applied twice',()=>{
  const h=setup(),{c,m,send}=h;buildBoth(h);const cmd={id:'same',wave:0,action:'ready',payload:{value:true}};
  assert.equal(c.duo.command(m,0,cmd),true);assert.equal(c.duo.command(m,0,cmd),false);assert.ok(send(0,'ready',{value:false}));assert.equal(m.ready[0],false);
  assert.throws(()=>c.duo.restore({...json(c.duo.capture(m)),version:99}),/Invalid/);
});

test('retired partner portal commands cannot reserve slots or send towers',()=>{
 const h=setup(),{c,m,send}=h;buildBoth(h);const slot={q:1,r:0,index:0};
 assert.ok(send(0,'tower',{type:'archer',slots:[slot]}));
 const before=json(c.duo.capture(m));
 assert.equal(send(0,'reinforcement',{slot}),false);assert.equal(send(1,'portal',{slot}),false);
 assert.deepEqual(json(c.duo.capture(m)),before);assert.ok(send(1,'tower',{type:'archer',slots:[slot]}));
 send(0,'ready',{value:true});send(1,'ready',{value:true});
 const a=m.boards[0].state;a.spawnQueue=[];a.pendingSpawns=0;a.enemies=[];c.duo.tick(m);
 assert.equal(m.pendingHelp.every(v=>v===null),true);
});

test('legacy checkpoint retires temporary assistance without touching owned towers, progress or results',()=>{
 const h=setup(),{c,m,send}=h;buildBoth(h);const slot={q:1,r:0,index:0};send(0,'tower',{type:'archer',slots:[slot]});
 const a=m.boards[0].state,b=m.boards[1].state;
 m.portals[1]=slot;m.reinforcements[0]=slot;m.waveHelp[0]={type:'archer',level:1};m.pendingHelp[0]={at:100,tower:{type:'archer',level:1}};m.support[0]={archer:123};
 b.map.get('1,0').towers[0]={type:'archer',level:1,guestOwner:0,paid:0};
 const snap=json(c.duo.capture(m)),restored=c.duo.restore(snap),roundtrip=json(c.duo.capture(restored));
 assert.equal(restored.boards[1].state.map.get('1,0').towers[0],null);
 assert.deepEqual(json(restored.boards[0].state.map.get('1,0').towers[0]),json(a.map.get('1,0').towers[0]));
 for(const name of ['portals','reinforcements','waveHelp','pendingHelp'])assert.deepEqual(json(restored[name]),[null,null]);
 assert.deepEqual(json(restored.support),[{archer:123},{}]);assert.equal(restored.hp,m.hp);assert.equal(restored.wave,m.wave);
 assert.equal(restored.boards[0].state.gold,a.gold);assert.equal(restored.boards[1].state.gold,b.gold);
 assert.deepEqual(json(c.duo.capture(c.duo.restore(roundtrip))),roundtrip,'cleanup is idempotent');
});

test('Duo guardians require both votes, allow postponement and retain votes after restore',()=>{
 const h=setup();buildBoth(h);const {c,m,send}=h,s=m.boards[0].state,guardian={q:1,r:0,type:'boss',claimed:false};s.landmarks.set('1,0',guardian);c.exploration.claim(s,1,0);assert.equal(guardian.status,'pending');
 assert.ok(send(0,'guardian',{board:0,id:'1,0',value:true}));assert.equal(guardian.status,'pending');assert.ok(send(1,'guardian',{board:0,id:'1,0',value:true}));assert.equal(guardian.status,'ready');assert.ok(send(1,'guardian',{board:0,id:'1,0',value:false}));assert.equal(guardian.status,'pending');
 const restored=c.duo.restore(json(c.duo.capture(m)));assert.deepEqual(json(restored.boards[0].state.landmarks.get('1,0').consent),[true,false]);
 assert.equal(send(1,'guardian',{board:1,id:'missing',value:true}),false);assert.ok(send(1,'guardian',{board:0,id:'1,0',value:true}));send(0,'ready',{value:true});send(1,'ready',{value:true});assert.equal(guardian.status,'fighting');assert.ok(s.enemies.some(e=>e.landmarkId==='1,0'));assert.equal(m.boards[1].state.enemies.some(e=>e.landmarkId==='1,0'),false);assert.equal(send(1,'guardian',{board:0,id:'1,0',value:false}),false);
});
test('pending guardians do not block the next wave or spawn without approval',()=>{
 const h=setup();buildBoth(h);const {c,m,send}=h,s=m.boards[0].state;s.landmarks.set('1,0',{q:1,r:0,type:'boss',claimed:false});c.exploration.claim(s,1,0);send(0,'ready',{value:true});send(1,'ready',{value:true});assert.equal(m.phase,'combat');assert.equal(s.landmarks.get('1,0').status,'pending');assert.equal(s.enemies.some(e=>e.landmarkId==='1,0'),false);
});

test('shared guardian loot gives each player one offer per guardian without duplicating local loot',()=>{
 const h=setup();buildBoth(h);const {c,m,send}=h;send(0,'ready',{value:true});send(1,'ready',{value:true});
 for(const {state:s} of m.boards){s.spawnQueue=[];s.pendingSpawns=0;s.enemies=[];s.bossRewards=['1,0'];}
 c.duo.tick(m);for(const {state:s} of m.boards){assert.equal(s.bossRewards.length,2);assert.equal(new Set(s.bossRewards).size,2);assert.equal(s.phase,'bossReward');assert.equal(s.rewardOffer.kind,'boss');}
 assert.notEqual(m.boards[0].state.rewardOffer.id,m.boards[1].state.rewardOffer.id);const restored=c.duo.restore(json(c.duo.capture(m)));
 for(let player=0;player<2;player++)for(let reward=0;reward<2;reward++){
   const s=m.boards[player].state,offer=s.rewardOffer,before=s.deck.length;
   const packet={id:'loot-'+player+'-'+reward,wave:m.wave,action:'reward',payload:{offerId:offer.id,index:0}};
   assert.ok(c.duo.command(m,player,packet));assert.ok(c.duo.command(restored,player,packet));assert.equal(s.deck.length,before+1);assert.equal(c.duo.command(m,player,packet),false);
 }
 for(const {state:s} of m.boards)assert.equal(s.bossRewards.length,0);assert.deepEqual(json(c.duo.capture(m)),json(c.duo.capture(restored)));c.duo.tick(m);assert.equal(m.boards[0].state.bossRewards.length,0);
});
test('periodic boss loot is not shared with the other board',()=>{
 const h=setup();buildBoth(h);const {c,m,send}=h;send(0,'ready',{value:true});send(1,'ready',{value:true});for(const {state:s} of m.boards){s.spawnQueue=[];s.pendingSpawns=0;s.enemies=[];}m.boards[0].state.bossRewards=['wave:15'];c.duo.tick(m);assert.equal(m.boards[0].state.rewardOffer.kind,'boss');assert.equal(m.boards[1].state.rewardOffer,undefined);
});
