const {test}=require('node:test'),assert=require('node:assert/strict'),loadCore=require('../headless-core.cjs');
const json=v=>JSON.parse(JSON.stringify(v)),options={seed:'session',runId:'session',loadout:['archer','catapult','chain','freeze','mine']};
test('boss chain, wave reward, removal and celebration resume identically at every transition',()=>{
  const c=loadCore(),a=c.session.create(options);a.state.hand=[];a.state.drawPile=[...a.state.deck];a.state.wave=6;a.state.phase='wave';a.state.waveRunning=true;a.state.bossRewards=['boss-a','boss-b'];
  assert.ok(c.session.finish(a.state,a.random,5));assert.equal(a.state.phase,'bossReward');
  for(const expected of ['bossReward','reward','removal','place']){
    const other=loadCore(),b=other.snapshot.restore(json(c.snapshot.capture(a.state,a.random))),offer=a.state.rewardOffer;
    const index=offer.kind==='removal'?null:0;
    assert.equal(c.session.choose(a.state,a.random,offer.id,index),true);assert.equal(other.session.choose(b.state,b.random,offer.id,index),true);
    assert.equal(a.state.phase,expected);assert.deepEqual(json(c.snapshot.capture(a.state,a.random)),json(other.snapshot.capture(b.state,b.random)));
    assert.equal(c.session.choose(a.state,a.random,offer.id,index),false);
  }
  assert.equal(a.state.celebrationActive,true);assert.match(a.state.activeCelebration.messages.join(' '),/Wächter/);
  const restored=c.snapshot.restore(json(c.snapshot.capture(a.state,a.random)));assert.equal(restored.state.celebrationActive,true);
  restored.state.phase='build';assert.equal(c.flow.start(restored.state,restored.random),undefined);
  assert.equal(c.session.acknowledge(restored.state),true);assert.equal(c.session.acknowledge(restored.state),false);
});
test('headless session runs two full waves through rewards and back to preparation without UI',()=>{
  const c=loadCore(),run=c.session.create(options),s=run.state;s.hp=s.maxHp=1000;
  s.deck=Array(5).fill('straight');s.hand=[];s.discard=[];s.drawPile=[...s.deck];c.session.preparation(s,run.random);
  for(let wave=1;wave<=2;wave++){
    assert.ok(c.session.place(s,run.random,{q:wave,r:0,index:0,rotation:0}));assert.equal(s.phase,'build');
    assert.ok(c.flow.start(s,run.random));
    for(let i=0;s.waveRunning&&i<10000;i++)c.session.advance(s,run.random,.05);
    assert.equal(s.waveRunning,false);assert.equal(s.lastCompletedWave,wave);
    if(wave===2){assert.equal(s.phase,'reward');assert.ok(c.session.choose(s,run.random,s.rewardOffer.id,0));}
    assert.equal(s.phase,'place');assert.ok(s.hand.length);assert.equal(c.session.finish(s,run.random),null);
  }
});
test('queued shrines finish before the next build phase and retain their own offer identity',()=>{
  const c=loadCore(),{state:s,random}=c.session.create(options);s.phase='build';s.pendingShrine='a';s.shrineQueue=['b'];
  s.landmarks.set('a',{shrineEffect:'repair'});s.landmarks.set('b',{shrineEffect:'remove'});c.session.shrine(s,random);
  const first=s.rewardOffer.id,gold=s.gold;assert.ok(c.session.choose(s,random,first,0));assert.equal(s.gold,gold+30);assert.equal(s.phase,'removal');assert.equal(s.pendingShrine,'b');
  assert.equal(c.session.choose(s,random,first,0),false);assert.ok(c.session.choose(s,random,s.rewardOffer.id,null));assert.equal(s.phase,'build');assert.equal(s.pendingShrine,null);
});
