const {test}=require('node:test'),assert=require('node:assert/strict'),loadCore=require('../headless-core.cjs');
const options={seed:'flow',runId:'flow',loadout:['archer','catapult','chain','freeze','mine']};
test('headless draw, placement, wave and completion resume identically and grant completion gold only once',()=>{
  const c=loadCore(),a=c.runtime.create(options);a.state.drawPile=['tee','bigCurve','smallCurve','straight','straight'];c.flow.drawHand(a.state,a.random);
  assert.ok(c.placement.place(a.state,{q:1,r:0,index:0,rotation:0}));assert.ok(c.flow.start(a.state,a.random));assert.equal(c.flow.start(a.state,a.random),undefined);
  c.runtime.advance(a.state,a.random,.5);assert.equal(c.flow.finish(a.state),null);
  const b=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(a.state,a.random))));
  for(const run of [a,b]){
    let outcome;for(let i=0;i<5000;i++){outcome=c.runtime.advance(run.state,run.random,.05);if(outcome!=='running')break;}
    assert.equal(outcome,'complete');const gold=run.state.gold;assert.ok(c.flow.finish(run.state));assert.equal(run.state.gold,gold+c.waves.economy.completion);assert.equal(c.flow.finish(run.state),null);
    c.flow.drawHand(run.state,run.random);
  }
  assert.deepEqual(JSON.parse(JSON.stringify(c.snapshot.capture(a.state,a.random))),JSON.parse(JSON.stringify(c.snapshot.capture(b.state,b.random))));
});
