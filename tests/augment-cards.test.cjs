const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../headless-core.cjs');
const c=core(),a=c.augmentCards,json=x=>JSON.parse(JSON.stringify(x));
const profile=()=>({diamonds:500,unlockedTowers:Object.keys(c.data.TOWERS),unlocks:['tower:flame'],introduction:{bestWave:15},records:{highestWave:16},augmentCards:a.clean(null)});
function combat(id,tier=0){
 const r=c.runtime.create({seed:'cards',runId:'cards',loadout:['archer','catapult','freeze','mine','flame'],metaAugments:{version:1,cards:[{id,tier}]}});
 Object.assign(r.state,{wave:1,waveRunning:true,phase:'wave',enemies:[],pendingSpawns:0,spawnQueue:[]});
 return r;
}
function enemy(extra={}){return {id:1,type:'normal',alive:true,hp:1000,maxHp:1000,armorHp:0,magicHp:0,speed:0,x:20,y:0,index:0,t:0,points:[{x:20,y:0},{x:10000,y:0}],...extra};}
function step(r,seconds,refs=[]){r.state.elapsedMs+=seconds*1000;c.combat.step(r.state,refs,c.data.TOWERS,seconds,r.state.elapsedMs);}
test('B requires completed wave fifteen AND a purchased Arsenal unlock, not tutorial skip',()=>{
 const p=profile();assert.equal(a.unlocked(p),true);p.unlocks=[];assert.equal(a.unlocked(p),false);p.unlocks=['tower:flame'];p.introduction.bestWave=14;p.records.highestWave=14;p.introduction.skipped=true;assert.equal(a.unlocked(p),false);
 p.augmentCards.bestWave=15;assert.equal(a.unlocked(p),false);p.augmentCards.settledBestWave=15;assert.equal(a.unlocked(p),true);assert.equal(a.slots(p),1);
 for(const [w,n] of [[20,2],[25,3],[35,4],[50,5]]){p.augmentCards.bestWave=w;assert.equal(a.slots(p),n);}
});
test('two distinct cards cost exactly fifty, bad randomness and insufficient funds are atomic',()=>{
 const p=profile(),before=json(p);const next=a.buy(p,()=>0);assert.equal(next.diamonds,450);assert.equal(next.augmentCards.lastPack.length,2);assert.notEqual(next.augmentCards.lastPack[0].id,next.augmentCards.lastPack[1].id);assert.deepEqual(json(p),before);
 assert.throws(()=>a.buy({...p,diamonds:49},()=>0));assert.throws(()=>a.buy(p,()=>NaN));assert.deepEqual(json(p),before);
 let q=p;for(let i=0;i<10;i++)q=a.buy(q,()=>0);assert.ok(q.augmentCards.lastPack.some(x=>x.tier>=2));assert.equal(q.augmentCards.pity,0);
});
test('fusion consumes exactly three matching copies, upgrades equipped card and leaves run frozen',()=>{
 let p=profile();p.augmentCards.cards.mine=[3,0,0,0,0];p=a.equip(p,'mine');const run=a.run(p,['mine']);p=a.fuse(p,'mine',0);
 assert.deepEqual(json(p.augmentCards.cards.mine),[0,1,0,0,0]);assert.equal(a.run(p,['mine']).cards[0].tier,1);assert.equal(run.cards[0].tier,0);
 assert.throws(()=>a.fuse(p,'mine',0));assert.throws(()=>a.fuse(p,'mine',4));
 p.augmentCards.cards.flame=[1,0,0,0,0];assert.throws(()=>a.equip(p,'flame'));assert.equal(a.run(p,['archer']).cards.length,0);
});
test('cards survive save export/import and reset of Arsenal purchases',()=>{
 const {load}=require('./helpers/game.cjs'),p=profile();p.version=1;p.augmentCards.cards.mine=[3,0,0,0,0];p.augmentCards.unlocked=true;
 const env=load({initialProfile:p});env.elements.get('menuArsenalBtn').listeners.click();
 const stored=JSON.parse(env.storage.get('hex-bastion-profile-v1'));assert.equal(stored.augmentCards.cards.mine[0],3);
});
test('ballista, lightning, spirits and forge apply bounded tier values without mutating base stats',()=>{
 for(let tier=0;tier<5;tier++){
  for(const id of ['ballista','chain','necromancer']){const s={metaAugments:{version:1,cards:[{id,tier}]}},tw={type:id},base=c.data.towerDefinition(tw),copy=json(base),d=a.definition(s,tw,base);
   if(id==='ballista')assert.equal(d.pierceTargets,(base.pierce?(base.pierceTargets||3):1)+tier+1);
   if(id==='chain')assert.equal(d.chain,base.chain+tier+1);
   if(id==='necromancer')assert.equal(d.soulDuration,base.soulDuration+a.catalog[id].values[tier]);assert.deepEqual(json(base),copy);
  }
 }
});
test('mine echo occurs only after a second, survives restore, and cannot recurse',()=>{
 const r=combat('mine'),s=r.state;s.enemies=[enemy({x:0,points:[{x:0,y:0},{x:1000,y:0}]})];s.mines=[{x:0,y:0,damage:100,splash:50,color:'#fff'}];step(r,0);assert.equal(s.enemies[0].hp,900);
 const copy=c.snapshot.restore(json(c.snapshot.capture(s,r.random)));step(r,.9);assert.equal(s.enemies[0].hp,900);step(r,.1);assert.equal(s.enemies[0].hp,885);
 step(copy,1);assert.equal(copy.state.enemies[0].hp,885);step(r,2);assert.equal(s.enemies[0].hp,885);
});
test('burn respects shields and immunity, refreshes without stacking and expires',()=>{
 const r=combat('flame'),s=r.state,e=enemy();s.enemies=[e];const ref={tw:{type:'flame',lastShot:-Infinity},pos:{x:0,y:0},definition:{damage:100,damageType:'fire',range:100,cooldown:1}};
 step(r,0,[ref]);assert.equal(e.hp,900);step(r,1);assert.equal(e.hp,890);step(r,2);assert.equal(e.hp,870);step(r,2);assert.equal(e.hp,870);
 e.shieldHits=3;step(r,0,[ref]);assert.equal(e.shieldHits,2);assert.equal(e.augmentBurn,undefined);
});
test('frost pulse is periodic, boss duration halved and does not permanently stun',()=>{
 const r=combat('freeze',4),s=r.state,e=enemy({type:'boss'});s.enemies=[e];const ref={tw:{type:'freeze'},pos:{x:0,y:0},definition:{aura:true,slow:.8,range:100}};
 step(r,5,[ref]);assert.equal(e.augmentFrozen,5300);step(r,1,[ref]);assert.equal(e.augmentFrozen,5300);step(r,4,[ref]);assert.equal(e.augmentFrozen,10300);
});
test('house pays once per completed wave regardless of building count',()=>{
 const r=combat('house',4),s=r.state;s.map.get('0,0').buildings=[{type:'house'},{type:'house'}];const gold=s.gold;c.flow.finish(s);assert.equal(s.gold,gold+c.waves.economy.completion+6);const paid=s.gold;c.flow.finish(s);assert.equal(s.gold,paid);
});
test('daily missions ignore selected meta cards',()=>{
 const r=c.runtime.create({seed:'daily',runId:'daily',loadout:['archer','catapult','freeze','mine','flame'],challengeDay:'2026-10-26',metaAugments:{version:1,cards:[{id:'mine',tier:4}]}});
 assert.equal(r.state.metaAugments,undefined);
});
test('market discount applies once, including bulk purchases, with correct paid/refund amounts',()=>{
 const r=combat('market',4),s=r.state;s.gold=1000;s.map.get('0,0').buildings=[{type:'market',level:1}];
 s.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:2,towers:[],buildings:[]});
 const slots=[{q:1,r:0,index:0},{q:1,r:0,index:1}],base=c.buildings.cost(s,slots[0],c.data.TOWERS.archer.cost),before=s.gold;
 const result=c.towers.buy(s,'archer',slots);assert.equal(result.ok,true);assert.equal(result.total,base*2-6);assert.equal(before-s.gold,result.total);
 assert.deepEqual(s.map.get('1,0').towers.map(t=>t.paid),[base-6,base]);assert.equal(a.marketDiscount(s),0);s.wave++;assert.equal(a.marketDiscount(s),6);
});
test('base shield activates once, preserves the triggering hit and protects later arrivals',()=>{
 const r=combat('base',4),s=r.state;s.hp=6;s.maxHp=20;
 const arrival=id=>enemy({id,index:1,points:[{x:0,y:0},{x:0,y:0}],baseDamage:2});
 s.enemies=[arrival(1),arrival(2)];step(r,0);assert.equal(s.hp,6);assert.equal(s.augmentBaseUsed,true);
 s.enemies=[arrival(3)];step(r,4);assert.equal(s.hp,4);assert.equal(s.augmentBaseUntil,3000);
});
test('damaged and future collection formats fail instead of silently losing cards',()=>{
 assert.throws(()=>a.clean({version:2,cards:{}}));assert.throws(()=>a.clean({version:1,cards:{mine:[1,2]}}));assert.throws(()=>a.clean({version:1,cards:{future:[1,0,0,0,0]}}));
});
test('profile export/import roundtrips cards and Arsenal reset preserves them',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),context={localStorage:{getItem:()=>null,setItem(){}}};vm.createContext(context);
 for(const name of ['augment-cards','profile'])vm.runInContext(fs.readFileSync('classes/'+name+'.js','utf8'),context);
 const p=profile();p.augmentCards.cards.mine=[3,2,1,0,0];p.augmentCards.unlocked=true;context.input=p;context.defs=c.data.TOWERS;
 const result=vm.runInContext('HexProfile.readFile(HexProfile.exportFile(input,defs),defs)',context);
 assert.deepEqual(json(result.augmentCards.cards.mine),[3,2,1,0,0]);context.input=result;
 assert.deepEqual(json(vm.runInContext('HexProfile.resetUnlocks(input,defs).profile.augmentCards.cards.mine',context)),[3,2,1,0,0]);
});


test('element resonance applies every fifth contact at all rarities and all elements',()=>{
 for(let tier=0;tier<5;tier++)for(const kind of ['arcane','fire','water','wind']){
  const r=combat('element',tier),e=enemy({hp:10000,maxHp:10000,resistances:{[kind]:.2}});r.state.enemies=[e];
  const tw={type:'element',lastShot:-Infinity},ref={tw,pos:{x:0,y:0},definition:{damage:100,damageType:kind,range:100,cooldown:1}};
  for(let i=0;i<4;i++)step(r,1,[ref]);assert.equal(e.hp,9680);assert.equal(tw.augmentResonanceHits,4);
  step(r,1,[ref]);assert.equal(e.hp,9600-80*a.catalog.element.values[tier]);assert.equal(tw.augmentResonanceHits,0);
  assert.doesNotMatch(a.describe('element',tier),/undefined/);
 }
});
test('element resonance never bypasses shields or counts immune contacts',()=>{
 const r=combat('element',4),e=enemy({shieldHits:3});r.state.enemies=[e];const tw={type:'element',augmentResonanceHits:4,lastShot:-Infinity};
 const ref={tw,pos:{x:0,y:0},definition:{damage:100,damageType:'fire',range:100,cooldown:1}};
 step(r,1,[ref]);assert.equal(e.shieldHits,2);assert.equal(e.hp,1000);assert.equal(tw.augmentResonanceHits,0);
 e.immunity='fire';step(r,1,[ref]);assert.equal(tw.augmentResonanceHits,0);assert.equal(e.shieldHits,2);
});
test('element resonance respects boss MR then armor then life and survives a snapshot',()=>{
 const r=combat('element',4),e=enemy({type:'boss',magicHp:200,armorHp:200});r.state.enemies=[e];
 const tw={type:'element',augmentResonanceHits:4,lastShot:-1000};r.state.map.get('0,0').towers=[tw];
 const copy=c.snapshot.restore(json(c.snapshot.capture(r.state,r.random))),restored=copy.state.map.get('0,0').towers[0];
 const definition={damage:100,damageType:'water',range:100,cooldown:1,bossMultiplier:2};
 step(copy,1,[{tw:restored,pos:{x:0,y:0},definition}]);
 assert.equal(copy.state.enemies[0].magicHp,0);assert.equal(copy.state.enemies[0].armorHp,0);assert.equal(copy.state.enemies[0].hp,1000);assert.equal(restored.augmentResonanceHits,0);
});
test('element card is filtered by loadout and survives collection fusion',()=>{
 let p=profile();p.augmentCards.cards.element=[3,0,0,0,0];p=a.equip(p,'element');p=a.fuse(p,'element',0);
 assert.equal(a.run(p,['archer']).cards.length,0);assert.deepEqual(json(a.run(p,['element']).cards),[{id:'element',tier:1}]);
 assert.deepEqual(json(a.clean(json(p.augmentCards)).cards.element),[0,1,0,0,0]);
});
test('weaker flame refresh preserves the stronger burn owner and multipliers',()=>{
 const r=combat('flame'),e=enemy({hp:10000,maxHp:10000});r.state.enemies=[e];
 const strong={tw:{type:'flame',statId:'strong',lastShot:-Infinity},pos:{x:0,y:0},definition:{damage:100,damageType:'fire',range:100,cooldown:1,damageMultipliers:{hp:2}}};
 const weak={tw:{type:'flame',statId:'weak',lastShot:-Infinity},pos:{x:0,y:0},definition:{damage:50,damageType:'fire',range:100,cooldown:1,damageMultipliers:{hp:1}}};
 step(r,0,[strong]);step(r,.5,[weak]);assert.equal(e.augmentBurn.source.statId,'strong');assert.equal(e.augmentBurn.multipliers.hp,2);
 const hp=e.hp;step(r,.5);assert.equal(e.hp,hp-20);
 step(r,4);step(r,0,[weak]);assert.equal(e.augmentBurn.damage,5);assert.equal(e.augmentBurn.source.statId,'weak');
});


test('element area and piercing attacks count contacts once without recursive resonance',()=>{
 for(const shape of [{splash:50},{pierce:true,pierceTargets:6}]){
  const r=combat('element',4);r.state.enemies=Array.from({length:6},(_,i)=>enemy({id:i+1,x:20+i*5,points:[{x:20+i*5,y:0},{x:10000,y:0}]}));
  const tw={type:'element',lastShot:-Infinity};
  step(r,0,[{tw,pos:{x:0,y:0},definition:{damage:100,damageType:'fire',range:100,cooldown:1,...shape}}]);
  assert.equal(r.state.enemies.reduce((sum,e)=>sum+1000-e.hp,0),700);assert.equal(tw.augmentResonanceHits,1);
 }
});


test('archer haste resets before the first shot at a different target, including overloaded towers',()=>{
 for(let tier=0;tier<5;tier++)for(const overload of [false,true]){
  const r=combat('archer',tier),e=enemy({id:2});r.state.enemies=[e];
  const tw={type:'archer',lastShot:0,augmentTarget:1,augmentStreak:tier===4?8:5,...(overload?{overloadUntil:10000}:{})};
  const ref={tw,pos:{x:0,y:0},definition:{damage:10,range:100,cooldown:1}},cooldown=1000/(overload?1.5:1);
  step(r,(cooldown-10)/1000,[ref]);assert.equal(e.hp,1000);assert.equal(tw.augmentStreak,0);
  step(r,.011,[ref]);assert.equal(e.hp,990);assert.equal(tw.augmentStreak,0);assert.equal(tw.augmentTarget,2);
  step(r,cooldown/1000+.001,[ref]);assert.equal(tw.augmentStreak,1);
 }
});
test('archer repeat stacks stay bounded at each rarity',()=>{
 for(let tier=0;tier<5;tier++){
  const r=combat('archer',tier);r.state.enemies=[enemy()];const tw={type:'archer',lastShot:-Infinity};
  const ref={tw,pos:{x:0,y:0},definition:{damage:1,range:100,cooldown:1}};
  for(let i=0;i<20;i++)step(r,1,[ref]);assert.equal(tw.augmentStreak,tier===4?8:5);
 }
});
