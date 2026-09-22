const {test}=require('node:test'),assert=require('node:assert/strict');
const loadCore=require('../headless-core.cjs');
const {load}=require('./helpers/game.cjs');
const json=v=>JSON.parse(JSON.stringify(v));
test('headless reward offers survive checkpoints without reroll and reject stale, duplicate and invalid choices',()=>{
  const core=loadCore(),run=core.runtime.create({seed:'offers',runId:'a',loadout:['archer','catapult','chain','freeze','mine']});
  const s=run.state;s.wave=2;s.phase='reward';const offer=core.rewards.offer(s,'normal',run.random),rng=json(run.random.snapshot());
  assert.equal(core.rewards.offer(s,'normal',run.random),offer);assert.deepEqual(json(run.random.snapshot()),rng);
  const saved=json(core.snapshot.capture(s,run.random)),other=loadCore(),restored=other.snapshot.restore(saved);
  assert.deepEqual(json(other.rewards.offer(restored.state,'normal',restored.random)),json(offer));assert.deepEqual(json(restored.random.snapshot()),rng);
  const before=restored.state.deck.length;
  for(const index of [-1,99,.5,null])assert.equal(other.rewards.choose(restored.state,offer.id,index),false);
  assert.equal(other.rewards.choose(restored.state,offer.id+1,0),false);assert.equal(restored.state.deck.length,before);
  assert.equal(other.rewards.choose(restored.state,offer.id,0),true);assert.equal(other.rewards.choose(restored.state,offer.id,0),false);assert.equal(restored.state.deck.length,before+1);
  restored.state.phase='reward';restored.state.wave=4;const next=other.rewards.offer(restored.state,'normal',restored.random);
  assert.notEqual(next.id,offer.id);assert.equal(other.rewards.choose(restored.state,offer.id,0),false);
});
test('normal and guardian card choices show existing deck counts and restore the same offer',()=>{
  for(const kind of ['normal','boss']){
    const {a,elements}=load();a.state.wave=2;
    if(kind==='boss'){a.state.bossRewards=['guardian-a','guardian-b'];a.showBossReward();}else a.showRewards();
    const offered=a.state.rewardOffer.choices.filter(c=>c.kind==='card');
    const cards=elements.get('rewardChoices').children.slice(0,offered.length);
    for(let i=0;i<cards.length;i++)assert.equal(cards[i].children.at(-1).textContent,a.state.deck.filter(id=>id===offered[i].cardId).length+'× bereits im Deck');
    const expected=json(a.state.rewardOffer),checkpoint=json(a.captureRunCheckpoint());a.restoreRunCheckpoint(checkpoint);
    assert.deepEqual(json(a.state.rewardOffer),expected);
    assert.deepEqual(json(a.state.rewardOffer.choices.filter(c=>c.kind==='card').map(c=>c.cardId)),json(offered.map(c=>c.cardId)));
    const length=a.state.deck.length;elements.get('rewardChoices').children[0].listeners.click();assert.equal(a.state.deck.length,length+1);
    cards[0].listeners.click();assert.equal(a.state.deck.length,length+1);
  }
});
test('shrine card, healing, upgrade and removal menus resume from saved offers',()=>{
  for(const effect of ['epic','legendary','repair','upgrade','remove']){
    const {a,elements}=load();const s=a.state;s.deck.push('straight');
    s.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[{type:'archer',level:1,paid:25,lastShot:0}]});
    s.landmarks=new Map([['2,0',{q:2,r:0,type:'shrine',shrineEffect:effect,claimed:false}]]);s.hand=['straight'];s.selectedCard=0;s.rotation=0;s.phase='place';a.placeTile(2,0);
    const offered=json(a.state.rewardOffer),checkpoint=json(a.captureRunCheckpoint());
    a.restoreRunCheckpoint(checkpoint);assert.deepEqual(json(a.state.rewardOffer),offered,effect);
    const cards=elements.get('rewardChoices').children;
    if(['epic','legendary'].includes(effect))assert.match(cards[0].children.at(-1).textContent,/× bereits im Deck/);
    cards[0].listeners.click();assert.equal(a.state.phase,'build',effect);assert.equal(a.state.rewardOffer,null,effect);
  }
});

test('headless tower commands validate every multi-build target before charging and enforce upgrade progression',()=>{
 const core=loadCore(),{state:s}=core.runtime.create({seed:'build',runId:'build',loadout:['archer','catapult','chain','freeze','mine']});s.phase='build';s.gold=200;
 s.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:2,towers:[null,null]});const one={q:1,r:0,index:0},two={q:1,r:0,index:1};
 for(const slots of [[one,one],[one,{...two,index:.5}],[one,{...two,index:5}]]){assert.equal(core.towers.buy(s,'archer',slots).ok,false);assert.equal(s.gold,200);assert.equal(s.map.get('1,0').towers[0],null);}
 s.gold=49;assert.equal(core.towers.buy(s,'archer',[one,two]).ok,false);assert.equal(s.gold,49);s.gold=200;
 assert.equal(core.towers.buy(s,'archer',[one,two]).ok,true);assert.equal(s.gold,150);assert.equal(s.runTowerStats.archer.builds,2);
 assert.equal(core.towers.upgrade(s,one,'ultimate:archer'),false);assert.equal(core.towers.upgrade(s,one,'marksman'),true);const gold=s.gold;assert.equal(core.towers.upgrade(s,one,'marksman'),false);assert.equal(s.gold,gold);
 const restored=core.snapshot.restore(json(core.snapshot.capture(s,core.random.create('build'))));assert.equal(restored.state.map.get('1,0').towers[0].branch,'marksman');
});
