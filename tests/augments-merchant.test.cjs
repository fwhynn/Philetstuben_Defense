const {test}=require('node:test'),assert=require('node:assert/strict'),load=require('../headless-core.cjs');
const loadout=['archer','chain','freeze','mine','catapult'];
function setup(){const c=load(),run=c.session.create({seed:'augments',runId:'augments',loadout}),s=run.state;s.openingRemaining=0;s.phase='build';s.gold=1000;return {c,run,s};}
function take(c,s,id){const pair=id==='refinement'?c.rewards.refinement(s):undefined;assert.ok(c.rewards.applyAugment(s,{augment:id,pair}));}
test('5 percent of seeded discoveries are augments, without a per-run cap',()=>{
 const {c}=setup();let total=0,augments=0;
 for(let seed=0;seed<100;seed++){const landmarks=c.exploration.create(c.random.create('distribution'+seed));const map=new Map();for(let q=-20;q<=20;q+=4)for(let r=-20;r<=20;r+=4)map.set(q+','+r,{q,r});c.exploration.expand(landmarks,map);total+=landmarks.size;augments+=[...landmarks.values()].filter(l=>l.augment).length;}
 assert.ok(total>5000);assert.ok(augments/total>.04&&augments/total<.06,augments+'/'+total);
});
test('augment selection is persisted, unique, and removes only the selected item from the pool',()=>{
 const {c,run,s}=setup();s.map.set('1,0',{q:1,r:0,roads:[0,3],slots:0,towers:[],buildings:[]});s.map.get('0,0').roads=[0];s.landmarks.set('1,0',{q:1,r:0,type:'shrine',augment:true,claimed:false});c.exploration.claim(s,1,0);c.session.shrine(s,run.random);
 const offer=s.rewardOffer;assert.equal(offer.choices.length,3);assert.equal(offer.skippable,false);const chosen=offer.choices[0].augment,others=offer.choices.slice(1).map(x=>x.augment);const saved=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(s,run.random))));assert.equal(JSON.stringify(saved.state.rewardOffer),JSON.stringify(offer));assert.ok(c.session.choose(s,run.random,offer.id,0));assert.equal(s.phase,'build');assert.equal(c.session.choose(s,run.random,offer.id,0),false);assert.equal(c.rewards.applyAugment(s,offer.choices[0]),false);
 const available=new Set();for(let i=0;i<30;i++)for(const choice of c.rewards.augmentChoices(s,c.random.create('pool'+i)))available.add(choice.augment);assert.equal(available.has(chosen),false);for(const id of others)assert.ok(available.has(id));
});
test('refinement upgrades Epic to a matching Legendary and preserves deck/pile counts',()=>{
 const {c,s}=setup();s.deck=['sentryBend','straight','straight','smallCurve','bigCurve'];s.hand=[];s.discard=[];s.drawPile=[...s.deck];assert.equal(c.rewards.refinement(s).to,'warBend');take(c,s,'refinement');assert.equal(s.deck.length,5);assert.equal(s.drawPile.length,5);assert.ok(s.deck.includes('warBend'));assert.equal(s.deck.includes('sentryBend'),false);
});
test('four-card draw and Wegweiser preserve the deck and work once per wave across reload',()=>{
 const {c,run,s}=setup();take(c,s,'fourthCard');take(c,s,'wayfinder');c.session.preparation(s,run.random);assert.equal(s.hand.length,4);assert.ok(c.rewards.redraw(s,run.random));assert.equal(c.rewards.redraw(s,run.random),false);assert.equal(s.deck.length,s.hand.length+s.drawPile.length+s.discard.length);
 const saved=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(s,run.random))));assert.equal(c.rewards.redraw(saved.state,saved.random),false);saved.state.wave++;assert.ok(c.rewards.redraw(saved.state,saved.random));assert.equal(saved.state.hand.length,4);
});
test('scout reveals one hex earlier and survives snapshots',()=>{
 const {c,run,s}=setup();s.map=new Map([['0,0',{q:0,r:0,roads:[0],towers:[],buildings:[]}]]);assert.equal(c.exploration.visibility(s.map,{q:3,r:0}),'fog');take(c,s,'scout');assert.equal(c.exploration.visibility(s.map,{q:3,r:0}),'clear');assert.equal(c.exploration.region(s.map).get('3,0').visibility,'clear');const saved=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(s,run.random))));assert.equal(c.exploration.visibility(saved.state.map,{q:3,r:0}),'clear');
});
test('free extra hex cannot bypass unlock or repeated purchase; subsequent price still rises',()=>{
 const {c,run,s}=setup();s.landmarks=new Map();s.map.get('0,0').roads=[0];take(c,s,'freeHex');s.gold=0;s.wave=33;assert.equal(c.session.buyExtraHex(s,run.random),false);assert.equal(s.freeExtraHexes,1);s.wave=34;assert.ok(c.session.buyExtraHex(s,run.random));assert.equal(s.gold,0);assert.equal(s.freeExtraHexes,0);assert.equal(c.session.extraHexPrice(s),300);s.phase='build';assert.equal(c.session.buyExtraHex(s,run.random),false);
});
test('three free builds are transactional, cannot be refunded for gold, and do not give free upgrades',()=>{
 const {c,s}=setup();take(c,s,'freeTowers');s.gold=0;const tile={q:1,r:0,type:'straight',roads:[0,3],slots:4,towers:Array(4).fill(null),buildings:[]};s.map.set('1,0',tile);const slots=[0,1,2,3].map(index=>({q:1,r:0,index}));assert.equal(c.towers.buy(s,'archer',slots).ok,false);assert.equal(s.freeTowerBuilds,3);assert.equal(tile.towers.filter(Boolean).length,0);assert.ok(c.towers.buy(s,'archer',slots.slice(0,3)).ok);assert.equal(s.freeTowerBuilds,0);assert.equal(s.gold,0);assert.equal(c.data.towerRefund(s,tile.towers[0]).amount,0);assert.equal(c.towers.upgrade(s,slots[0],'volley'),false);assert.equal(c.towers.buy(s,'archer',[slots[3]]).ok,false);
});
function leak(c,s,damage){s.enemies=[{id:1,type:'grunt',hp:100,maxHp:100,alive:true,baseDamage:damage,index:1,points:[{x:0,y:0}],x:0,y:0}];c.combat.step(s,[],c.data.TOWERS,.01,0,()=>{});}
test('merchant price doubling is independent per offer and merchant, including saved runs',()=>{
 const {c,s,run}=setup();s.hp=1;s.gold=10000;
 for(const q of [1,2])s.map.set(q+',0',{q,r:0,site:'merchant',roads:[0,3],towers:[],buildings:[]});
 for(const price of [60,120,240]){assert.equal(c.rewards.merchantPrice(s,'repair','1,0'),price);const gold=s.gold;assert.ok(c.rewards.trade(s,'1,0','repair'));assert.equal(s.gold,gold-price);}
 assert.equal(c.rewards.merchantPrice(s,'repair','1,0'),480);
 assert.equal(c.rewards.merchantPrice(s,'repair','2,0'),60);
 assert.equal(c.rewards.merchantPrice(s,'protection','1,0'),80);
 assert.ok(c.rewards.trade(s,'2,0','repair'));
 assert.ok(c.rewards.trade(s,'1,0','protection'));
 assert.equal(c.rewards.merchantPrice(s,'protection','1,0'),160);
 assert.equal(c.rewards.merchantPrice(s,'protection','2,0'),80);
 const saved=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(s,run.random)))).state;
 assert.equal(c.rewards.merchantPrice(saved,'repair','1,0'),480);
 assert.equal(c.rewards.merchantPrice(saved,'repair','2,0'),120);
 s.gold=479;const before=JSON.stringify(s.merchantPurchases);assert.equal(c.rewards.trade(s,'1,0','repair'),false);assert.equal(JSON.stringify(s.merchantPurchases),before);assert.equal(s.gold,479);
});
test('legacy shared purchase counts migrate to the first merchant without affecting new merchants',()=>{
 const {c,s}=setup();s.hp=5;s.merchantPurchases={repair:2,protection:1};
 for(const q of [1,2])s.map.set(q+',0',{q,r:0,site:'merchant',roads:[0,3],towers:[],buildings:[]});
 assert.equal(c.rewards.merchantPrice(s,'repair','1,0'),240);
 assert.equal(c.rewards.merchantPrice(s,'repair','2,0'),60);
 assert.ok(c.rewards.trade(s,'2,0','repair'));
 assert.equal(c.rewards.merchantPrice(s,'repair','1,0'),240);
 assert.equal(c.rewards.merchantPrice(s,'protection','1,0'),160);
 assert.equal(c.rewards.merchantPrice(s,'repair','2,0'),120);
 assert.ok(c.rewards.trade(s,'1,0','repair'));
 assert.equal(c.rewards.merchantPrice(s,'repair','1,0'),480);
});
test('merchant UI can select a fresh merchant and return to the existing prices',()=>{
 const {a,elements}=loadUI({firstPlayerTest:true,developerScenario:'upgrade'});a.applyDeveloperScenario();a.state.phase='build';a.state.hp=5;a.state.gold=1000;
 for(const q of [1,2])a.state.map.set(q+',0',{q,r:0,type:'straight',site:'merchant',roads:[0,3],slots:0,towers:[],buildings:[]});
 a.renderAll();elements.get('merchantOpenBtn').listeners.click();const choices=()=>elements.get('merchantChoices').children;
 choices()[2].onclick();assert.equal(a.state.gold,940);assert.match(choices()[2].innerHTML,/120 Gold/);
 choices()[1].onclick();assert.match(choices()[2].innerHTML,/60 Gold/);
 choices()[2].onclick();assert.equal(a.state.gold,880);
 choices()[0].onclick();assert.match(choices()[2].innerHTML,/120 Gold/);
});
test('Schutzsiegel blocks one point, not an entire boss attack; resets only next wave',()=>{
 const {c,s,run}=setup();take(c,s,'seal');s.hp=20;s.wave=2;leak(c,s,5);assert.equal(s.hp,16);leak(c,s,1);assert.equal(s.hp,15);const restored=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(s,run.random))));leak(c,restored.state,1);assert.equal(restored.state.hp,14);s.wave++;leak(c,s,1);assert.equal(s.hp,15);
});
test('merchant doubles prices per site and preserves protection limits across merchants',()=>{
 const {c,s,run}=setup();for(const q of [1,2])s.map.set(q+',0',{q,r:0,site:'merchant',roads:[0,3],slots:0,towers:[],buildings:[]});s.hp=10;s.wave=5;assert.ok(c.rewards.trade(s,'1,0','repair'));assert.equal(s.hp,12);assert.equal(s.gold,940);assert.equal(c.rewards.merchantPrice(s,'repair','1,0'),120);assert.ok(c.rewards.trade(s,'2,0','protection'));assert.equal(c.rewards.trade(s,'1,0','protection'),false);s.wave=6;leak(c,s,5);assert.equal(s.hp,9);assert.equal(s.merchantProtection,0);s.phase='wave';assert.equal(c.rewards.trade(s,'1,0','repair'),false);s.phase='build';const restored=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(s,run.random))));assert.equal(c.rewards.merchantPrice(restored.state,'repair','1,0'),120);assert.equal(restored.state.map.get('1,0').site,'merchant');assert.equal(c.rewards.trade(s,'99,99','repair'),false);
});
test('Duo commands enforce ownership, preparation and ready locks for rerolls and merchants',()=>{
 const c=load(),match=c.duo.create('augment-duo',[loadout,loadout]),s=match.boards[0].state;s.phase='place';s.openingRemaining=0;take(c,s,'wayfinder');let n=0;const command=(action,payload={})=>c.duo.command(match,0,{id:'a'+(++n),wave:match.wave,action,payload});match.ready[0]=true;assert.equal(command('redraw'),false);match.ready[0]=false;assert.ok(command('redraw'));assert.equal(match.boards[1].state.redrawWave,undefined);s.phase='build';s.map.set('1,0',{q:1,r:0,site:'merchant',roads:[0,3],towers:[],buildings:[]});s.gold=1000;assert.ok(command('merchant',{site:'1,0',item:'protection'}));assert.equal(match.boards[1].state.merchantProtection,undefined);const {payloadValid}=require('../server/duo-room.cjs');assert.ok(payloadValid('merchant',{site:'1,0',item:'repair'}));assert.equal(payloadValid('merchant',{site:'1,0',item:'repair',price:0}),false);
});
const {load:loadUI}=require('./helpers/game.cjs');
test('free tower prices and redraw controls are usable through the game UI',()=>{
 const {a,elements,selectSlot,buyTower}=loadUI();a.state.phase='build';a.state.freeTowerBuilds=3;a.state.gold=0;a.state.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[null],buildings:[]});selectSlot(1,0,0);const buttons=elements.get('towerMenu').children;assert.ok(buttons.length);assert.equal(buttons[0].disabled,false);assert.match(buttons[0].innerHTML,/towerPriceValue">0</);buyTower('archer');assert.equal(a.state.freeTowerBuilds,2);assert.equal(a.state.gold,0);
 a.state.augments=['wayfinder','fourthCard'];a.state.openingRemaining=0;a.state.phase='place';a.renderAll();assert.equal(elements.get('redrawHandBtn').disabled,false);elements.get('redrawHandBtn').listeners.click();assert.equal(a.state.hand.length,4);assert.equal(elements.get('redrawHandBtn').disabled,true);
});
test('merchant UI performs direct purchases, disables unavailable offers and closes with Escape',()=>{
 const {a,elements,documentListeners}=loadUI({firstPlayerTest:true,developerScenario:'upgrade'});a.applyDeveloperScenario();a.state.phase='build';a.state.hp=10;a.state.gold=1000;a.state.map.set('1,0',{q:1,r:0,type:'straight',site:'merchant',roads:[0,3],slots:0,towers:[],buildings:[]});a.renderAll();elements.get('merchantOpenBtn').listeners.click();assert.equal(elements.get('merchantOverlay').classList.contains('hidden'),false);elements.get('merchantChoices').children[0].onclick();assert.equal(a.state.hp,12);assert.equal(a.state.gold,940);assert.match(elements.get('merchantChoices').children[0].innerHTML,/120 Gold/);elements.get('merchantChoices').children[1].onclick();assert.equal(elements.get('merchantChoices').children[1].disabled,true);documentListeners.keydown({key:'Escape',preventDefault(){}});assert.equal(elements.get('merchantOverlay').classList.contains('hidden'),true);
});


test('all seven augments can be collected, then exhausted pools give supplies without a softlock',()=>{
 const {c,run,s}=setup();s.deck=['sentryBend','straight','straight','smallCurve','bigCurve'];s.hand=[];s.discard=[];s.drawPile=[...s.deck];for(const id of Object.keys(c.rewards.augments))take(c,s,id);assert.equal(s.augments.length,7);assert.equal(c.rewards.augmentChoices(s,run.random).length,0);
 s.landmarks.set('1,0',{q:1,r:0,type:'shrine',augment:true,claimed:true});s.pendingShrine='1,0';c.session.shrine(s,run.random);assert.equal(s.rewardOffer.choices[0].blessing,'supplies');const gold=s.gold;assert.ok(c.session.choose(s,run.random,s.rewardOffer.id,0));assert.equal(s.gold,gold+30);assert.equal(s.phase,'build');
});
