const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function setup(){
  const context={};
  for(const file of ['data.js','waves.js','combat.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../'+file),'utf8'),context);
  vm.runInNewContext('globalThis.step=HexCombat.step;globalThis.towers=HexData.TOWERS;',context);
  const state={hp:20,gold:0,goldEarned:{kills:0},waveKills:0,enemies:[],projectiles:[]};
  return {state,step:context.step,towers:context.towers};
}
function enemy(x,y=0,hp=100){return {x,y,hp,alive:true,index:0,t:0,speed:0,points:[{x,y},{x:x+500,y}]};}
test('constant travel speed crosses segments with different lengths',()=>{
  const {state,step,towers}=setup(),e=enemy(0);e.speed=30;e.points=[{x:0,y:0},{x:10,y:0},{x:100,y:0}];state.enemies=[e];
  step(state,[],towers,1,1000);assert.equal(e.x,30);assert.equal(e.index,1);
  step(state,[],towers,1,2000);assert.equal(e.x,60);
});
test('lightning jumps from the last victim and never hits a disconnected target',()=>{
  const {state,step,towers}=setup();state.enemies=[enemy(130),enemy(190),enemy(300)];
  step(state,[{tw:{type:'chain',lastShot:0},pos:{x:0,y:0}}],towers,0,1000);
  assert.equal(state.enemies[0].hp,92);assert.ok(state.enemies[1].hp<100);assert.equal(state.enemies[2].hp,100);
});
test('freeze aura slows all nearby enemies without damage, shots or stacking',()=>{
  const {state,step,towers}=setup(),e=enemy(0);e.speed=20;state.enemies=[e];
  const refs=[{tw:{type:'freeze',lastShot:0},pos:{x:0,y:0}},{tw:{type:'freeze',lastShot:0},pos:{x:0,y:0}}];
  step(state,refs,towers,1,1000);assert.equal(e.hp,100);assert.equal(e.x,10);assert.equal(state.projectiles.length,0);
  step(state,[],towers,1,2000);assert.equal(e.x,30);
});

test('armor reduces archer damage but not chain lightning',()=>{
  const {state,step,towers}=setup(),e=enemy(10);e.armor=true;state.enemies=[e];
  step(state,[{tw:{type:'archer',lastShot:0},pos:{x:0,y:0}}],towers,0,1000);assert.equal(e.hp,95.5);
  step(state,[{tw:{type:'chain',lastShot:0},pos:{x:0,y:0}}],towers,0,2000);assert.equal(e.hp,87.5);
});
test('archer branches change combat behavior: splash and extended single target range',()=>{
  const {state,step,towers}=setup();state.enemies=[enemy(10),enemy(30),enemy(100)];
  step(state,[{tw:{type:'archer',branch:'volley',lastShot:0},pos:{x:0,y:0}}],towers,0,1000);
  assert.equal(state.enemies[0].hp,93);assert.equal(state.enemies[1].hp,93);assert.equal(state.enemies[2].hp,100);
  state.enemies=[enemy(180)];step(state,[{tw:{type:'archer',branch:'marksman',lastShot:0},pos:{x:0,y:0}}],towers,0,2000);assert.equal(state.enemies[0].hp,78);
});

test('catapult and lightning branches apply their distinct attack profiles',()=>{
  const {state,step,towers}=setup();state.enemies=[enemy(210)];
  step(state,[{tw:{type:'catapult',branch:'siege',lastShot:0},pos:{x:0,y:0}}],towers,0,2000);assert.equal(state.enemies[0].hp,64);
  state.enemies=[enemy(20),enemy(40),enemy(60),enemy(80),enemy(100)];
  step(state,[{tw:{type:'chain',branch:'storm',lastShot:0},pos:{x:0,y:0}}],towers,0,3000);assert.ok(state.enemies.every(e=>e.hp<100));
  state.enemies=[enemy(20),enemy(40),enemy(60)];
  step(state,[{tw:{type:'chain',branch:'overload',lastShot:0},pos:{x:0,y:0}}],towers,0,4000);assert.equal(state.enemies[0].hp,82);assert.equal(state.enemies[2].hp,100);
});

test('final lightning network damages all seven targets without negative damage',()=>{
  const {state,step,towers}=setup();state.enemies=Array.from({length:7},(_,i)=>enemy(10+i*10));
  step(state,[{tw:{type:'chain',branch:'storm',finalUpgrade:'tempest',lastShot:0},pos:{x:0,y:0}}],towers,0,1000);
  assert.ok(state.enemies.every(e=>e.hp<100&&e.hp>0));
});

test('terrain bonuses affect attacks after specialization and aura range',()=>{
  const {state,step,towers}=setup();state.enemies=[enemy(10)];
  step(state,[{tw:{type:'archer',tileType:'grove',branch:'marksman',lastShot:0},pos:{x:0,y:0}}],towers,0,1000);assert.equal(state.enemies[0].hp,72.5);
  state.enemies=[enemy(175)];
  step(state,[{tw:{type:'freeze',tileType:'highGround',lastShot:0},pos:{x:0,y:0}}],towers,0,2000);assert.equal(state.enemies[0].slowFactor,.5);assert.equal(state.enemies[0].hp,100);
});

test('boss kill awards loot once without altering normal wave kill accounting',()=>{
  const {state,step,towers}=setup(),e={...enemy(10,0,1),type:'boss',killGold:50,landmarkId:'1,0'};state.landmarks=new Map([['1,0',{status:'fighting'}]]);state.enemies=[e];const events=[];
  step(state,[{tw:{type:'chain',lastShot:0},pos:{x:0,y:0}}],towers,0,1000,name=>events.push(name));assert.equal(state.gold,50);assert.equal(state.goldEarned.boss,50);assert.equal(state.waveKills,0);assert.equal(state.landmarks.get('1,0').status,'defeated');assert.ok(events.includes('collect'));
  step(state,[],towers,1,2000);assert.equal(state.gold,50);
});
test('boss reaching base deals five damage and escapes without loot',()=>{
  const {state,step,towers}=setup(),e={...enemy(0),type:'boss',baseDamage:5,landmarkId:'1,0',speed:100,points:[{x:0,y:0},{x:1,y:0}]};state.landmarks=new Map([['1,0',{status:'fighting'}]]);state.enemies=[e];step(state,[],towers,1,1000);assert.equal(state.hp,15);assert.equal(state.gold,0);assert.equal(state.landmarks.get('1,0').status,'escaped');
});

test('damage terrain composes with upgrades and forge while freeze remains harmless',()=>{
  const {state,step,towers}=setup(),e=enemy(10,0,1000);state.enemies=[e];step(state,[{tw:{type:'archer',tileType:'warCross',branch:'marksman',supportDamage:1.2,lastShot:0},pos:{x:0,y:0}}],towers,0,1000);assert.ok(Math.abs(e.hp-(1000-34.32))<1e-8);
  const fresh=enemy(10);state.enemies=[fresh];state.projectiles=[];step(state,[{tw:{type:'freeze',tileType:'battlefield',lastShot:0},pos:{x:0,y:0}}],towers,0,2000);assert.equal(fresh.hp,100);assert.equal(state.projectiles.length,0);
});
