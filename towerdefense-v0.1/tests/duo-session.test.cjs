const {test}=require('node:test'),assert=require('node:assert/strict'),loadCore=require('../headless-core.cjs');
const loadout=['archer','catapult','chain','freeze','mine'],json=v=>JSON.parse(JSON.stringify(v));
function setup(){const c=loadCore(),m=c.duo.create('duo-test',[loadout,loadout]);let seq=0;const send=(p,action,payload={})=>c.duo.command(m,p,{id:'test-'+seq++,wave:m.wave,action,payload});for(const run of m.boards){run.state.hand=['straight'];run.state.drawPile=run.state.deck.slice(1);run.state.discard=[];}return {c,m,send};}
function buildBoth(h){for(let i=0;i<2;i++)assert.ok(h.send(i,'place',{q:1,r:0,index:0,rotation:0}));}
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
  const {c,m,send}=setup();const s=m.boards[0].state;s.phase='bossReward';s.bossRewards=['boss'];const offer=c.rewards.offer(s,'boss',m.boards[0].random),index=offer.choices.findIndex(c=>c.blessing==='bastion');
  assert.ok(send(0,'reward',{offerId:offer.id,index}));assert.equal(m.hp,45);assert.equal(m.maxHp,45);assert.equal(m.boards[1].state.hp,45);
  assert.equal(send(0,'reward',{offerId:offer.id,index}),false);assert.equal(m.hp,45);
  const before=json(c.duo.capture(m));assert.equal(c.duo.command(m,2,{id:'x',wave:0,action:'ready',payload:{value:true}}),false);assert.equal(c.duo.command(m,0,{id:'x',wave:99,action:'ready',payload:{value:true}}),false);assert.deepEqual(json(c.duo.capture(m)),before);
});
test('ready commands can be withdrawn and duplicate IDs are not applied twice',()=>{
  const h=setup(),{c,m,send}=h;buildBoth(h);const cmd={id:'same',wave:0,action:'ready',payload:{value:true}};
  assert.equal(c.duo.command(m,0,cmd),true);assert.equal(c.duo.command(m,0,cmd),false);assert.ok(send(0,'ready',{value:false}));assert.equal(m.ready[0],false);
  assert.throws(()=>c.duo.restore({...json(c.duo.capture(m)),version:99}),/Invalid/);
});

function prepareHelp(){const h=setup();buildBoth(h);const slot={q:1,r:0,index:0};h.send(0,'tower',{type:'archer',slots:[slot]});h.send(0,'reinforcement',{slot});h.send(1,'portal',{slot});h.send(0,'ready',{value:true});h.send(1,'ready',{value:true});return {...h,slot};}
test('portal reserves slot and clean completion sends a snapshot once after 1.5 seconds, including checkpoint restore',()=>{
 const {c,m,send,slot}=prepareHelp(),a=m.boards[0].state,b=m.boards[1].state;
 assert.equal(send(1,'tower',{type:'archer',slots:[slot]}),false);assert.equal(send(1,'portal',{slot:null}),false);
 a.spawnQueue=[];a.pendingSpawns=0;a.enemies=[];c.duo.tick(m);assert.ok(m.pendingHelp[0]);
 a.map.get('1,0').towers[0].branch='marksman';
 const restored=c.duo.restore(json(c.duo.capture(m)));
 for(let i=0;i<29;i++){c.duo.tick(m);c.duo.tick(restored);}assert.equal(b.map.get('1,0').towers[0],null);
 c.duo.tick(m);c.duo.tick(restored);const guest=b.map.get('1,0').towers[0];assert.equal(guest.type,'archer');assert.equal(guest.guestOwner,0);assert.equal(guest.branch,undefined);assert.equal(guest.souls,undefined);assert.equal(m.pendingHelp[0],null);assert.equal(send(1,'upgrade',{slot,upgrade:'marksman'}),false);
 assert.deepEqual(json(c.duo.capture(m)),json(c.duo.capture(restored)));
 const position=c.map.slotPositions(b.map.get('1,0'))[0];b.spawnQueue=[];b.pendingSpawns=0;b.enemies=[{id:999,alive:true,hp:1000,armorHp:0,magicHp:0,speed:0,index:0,t:0,x:position.x,y:position.y,points:[position,{x:position.x+1,y:position.y}]}];
 for(let i=0;i<30;i++)c.duo.tick(m);assert.ok(m.support[0].archer>0);assert.equal(b.runTowerStats.archer?.damage,undefined);
 b.enemies=[];c.duo.tick(m);assert.equal(m.phase,'prepare');assert.equal(b.map.get('1,0').towers[0],null);assert.equal(b.mines.length,0);
});
test('leaked waves never send help and pending help is discarded when both sides finish',()=>{
 for(const leak of [true,false]){const {c,m}=prepareHelp(),a=m.boards[0].state,b=m.boards[1].state;
 a.spawnQueue=[];a.pendingSpawns=0;a.enemies=leak?[{alive:true,hp:1,baseDamage:1,index:1,points:[{x:0,y:0},{x:0,y:0}],x:0,y:0}]:[];c.duo.tick(m);
 assert.equal(!!m.pendingHelp[0],!leak);b.spawnQueue=[];b.pendingSpawns=0;b.enemies=[];c.duo.tick(m);assert.equal(m.phase,'prepare');assert.equal(m.pendingHelp[0],null);assert.equal(b.map.get('1,0').towers[0],null);}
});

test('guest mines credit damage to sender, kill gold to recipient and disappear at team completion',()=>{
 const {c,m}=prepareHelp(),a=m.boards[0].state,b=m.boards[1].state;const goldA=a.gold,goldB=b.gold;
 a.spawnQueue=[];a.pendingSpawns=0;a.enemies=[];b.spawnQueue=[];b.pendingSpawns=0;
 b.enemies=[{id:777,alive:true,hp:5,armorHp:0,magicHp:0,killGold:7,speed:0,index:0,t:0,x:100,y:0,points:[{x:100,y:0},{x:101,y:0}]}];
 b.mines=[{id:1,x:100,y:0,damage:10,splash:30,source:{type:'mine',guestOwner:0}},{id:2,x:900,y:900,damage:10,splash:30,source:{type:'mine',guestOwner:0}}];
 c.duo.tick(m);assert.equal(m.support[0].mine,5);assert.equal(b.runTowerStats.mine?.damage,undefined);assert.equal(a.gold,goldA+c.waves.economy.completion);assert.equal(b.gold,goldB+7+c.waves.economy.completion);assert.equal(b.mines.length,0);assert.equal(m.pendingHelp[0],null);
});
