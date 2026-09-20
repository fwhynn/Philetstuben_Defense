const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {load}=require('./helpers/game.cjs');
function rules(){const c={};for(const file of ['heroes.js','data.js','waves.js','combat.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../'+file),'utf8'),c);return vm.runInNewContext('({heroes:HexHeroes,combat:HexCombat,data:HexData})',c);}
test('heroes initialize independent runs and invalid profiles fall back to standard',()=>{
  const {heroes}=rules();for(const [id,hp,gold,income] of [['standard',20,70,0],['builder',20,55,0],['merchant',15,90,2]]){
    const state={};heroes.initialize(state,id);assert.equal(state.hp,hp);assert.equal(state.maxHp,hp);assert.equal(state.gold,gold);assert.equal(state.income,income);assert.equal(heroes.weapon(state),null);
  }
  const {a}=load({initialProfile:{activeHero:'unknown'}});assert.equal(a.state.heroId,'standard');
});
test('base upgrades charge run gold, preserve existing damage and enforce hero caps',()=>{
  const {heroes}=rules(),state={phase:'build'};heroes.initialize(state,'builder');state.gold=1000;state.hp=10;
  assert.equal(heroes.offer(state,'walls').cost,27);assert.equal(heroes.buy(state,'walls'),true);
  assert.equal(state.gold,973);assert.equal(state.hp,15);assert.equal(state.maxHp,25);
  heroes.buy(state,'walls');heroes.buy(state,'walls');assert.equal(state.maxHp,40);assert.equal(heroes.buy(state,'walls'),false);
  heroes.initialize(state,'standard');state.gold=1000;heroes.buy(state,'weapon');heroes.buy(state,'weapon');assert.equal(heroes.buy(state,'weapon'),false);
  state.phase='reward';assert.equal(heroes.buy(state,'walls'),false);state.phase='build';state.gold=0;assert.equal(heroes.buy(state,'walls'),false);
  state.gold=100;state.hp=0;assert.equal(heroes.buy(state,'walls'),false);
});
test('base weapon attacks only within range, respects cooldown and pays kills through combat',()=>{
  const {heroes,combat,data}=rules(),state={phase:'wave',enemies:[],projectiles:[],goldEarned:{kills:0},waveKills:0};heroes.initialize(state,'standard');heroes.buy(state,'weapon');
  const enemy=x=>({id:x,x,y:0,hp:100,alive:true,speed:0,index:0,t:0,points:[{x,y:0},{x:0,y:0}]});
  const near=enemy(100),far=enemy(200);state.enemies=[near,far];const step=t=>combat.step(state,[heroes.combatRef(state)],data.TOWERS,0,t);
  step(0);assert.equal(near.hp,88);assert.equal(far.hp,100);step(500);assert.equal(near.hp,88);step(1000);assert.equal(near.hp,76);
  near.hp=1;step(2000);assert.equal(state.goldEarned.kills,3);assert.equal(state.waveKills,1);assert.equal(state.enemies.length,1);
  const merchant={};heroes.initialize(merchant,'merchant');assert.equal(heroes.weapon(merchant,1).damage,9);
});
test('hero selection persists only on confirmation, retry retains hero, upgrades reset',()=>{
  const {a,elements,storage}=load();elements.get('newRunBtn').listeners.click();elements.get('heroChoices').children[1].listeners.click();
  assert.equal(a.state.heroId,'standard');elements.get('confirmLoadoutBtn').listeners.click();assert.equal(a.state.heroId,'builder');assert.equal(a.state.gold,55);
  assert.equal(JSON.parse(storage.get('hex-bastion-profile-v1')).activeHero,'builder');
  a.state.phase='build';elements.get('baseWallsBtn').listeners.click();assert.equal(a.state.maxHp,25);
  elements.get('retryLoadoutBtn').listeners.click();assert.equal(a.state.heroId,'builder');assert.equal(a.state.maxHp,20);assert.equal(a.state.baseUpgrades.walls,0);
  const fresh=load({initialProfile:JSON.parse(storage.get('hex-bastion-profile-v1'))});assert.equal(fresh.a.state.heroId,'builder');
});
test('merchant wave income is awarded and forecast without adding it twice',()=>{
  const {a,elements}=load({initialProfile:{activeHero:'merchant'}});a.state.wave=1;a.state.phase='wave';a.state.waveRunning=true;
  a.endWave();assert.equal(a.state.gold,102);assert.equal(a.state.goldEarned.income,2);a.renderAll();assert.match(elements.get('goldSources').textContent,/Startgold 90/);
});
