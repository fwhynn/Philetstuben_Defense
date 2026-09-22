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

function roadRun(c){const run=c.runtime.create(options),s=run.state;s.landmarks=new Map();s.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[null]});return run;}
test('street guarantee replaces only one building plot with a usable road and preserves every card',()=>{
 const c=loadCore(),{state:s,random}=roadRun(c);s.deck=['straight',...Array(8).fill('buildingPlot')];s.drawPile=[...s.deck];s.discard=[];
 assert.equal(c.flow.drawHand(s,random),'ready');assert.equal(s.hand.length,3);assert.equal(s.hand.filter(id=>id==='buildingPlot').length,2);assert.ok(s.hand.includes('straight'));
 assert.deepEqual([...s.hand,...s.drawPile,...s.discard].sort(),Array.from(s.deck).sort());
});
test('plots and dead ends do not suppress a free rescue road',()=>{
 const c=loadCore(),{state:s,random}=roadRun(c);s.deck=['buildingPlot','buildingPlot','deadEnd'];s.drawPile=[...s.deck];s.discard=[];
 assert.equal(c.flow.drawHand(s,random),'rescue');assert.deepEqual(Array.from(s.hand),['rescue']);assert.ok(s.rescueCard.roads.length>=2);assert.deepEqual([...s.drawPile,...s.discard].sort(),Array.from(s.deck).sort());
});
test('street guarantee preserves five-card two-front opening and is deterministic',()=>{
 const c=loadCore();function draw(){const run=c.runtime.create({...options,difficulty:'dual'}),s=run.state;s.landmarks=new Map();s.deck=[...Array(6).fill('buildingPlot'),'straight','straight'];s.drawPile=[...s.deck];s.discard=[];c.flow.drawHand(s,run.random);return s;}
 const a=draw(),b=draw();assert.equal(a.hand.length,5);assert.ok(a.hand.includes('straight'));assert.deepEqual(Array.from(a.hand),Array.from(b.hand));assert.deepEqual([...a.hand,...a.drawPile,...a.discard].sort(),Array.from(a.deck).sort());
});
