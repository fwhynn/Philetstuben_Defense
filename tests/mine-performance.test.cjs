const {test}=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('../scripts/mine-performance.cjs');
const json=v=>JSON.parse(JSON.stringify(v));
test('unchanged mine ranges reuse geometry while range and map changes refresh it',()=>{
  const {core,state,random}=fixture(),geometry=core.map.roadGeometry;let calls=0;
  core.map.roadGeometry=(...args)=>{calls++;return geometry(...args);};
  const advance=()=>core.runtime.advance(state,random,2);
  advance();assert.equal(calls,410);advance();assert.equal(calls,410);
  state.map.get('4,0').towers[0].rangeFactor=1.5;advance();assert.equal(calls,451);
  state.map.get('2,0').roads=[1,3];advance();assert.equal(calls,861);
  state.map.get('2,0').type='smallCurve';advance();assert.equal(calls,1271);
  state.map.get('4,0').towers[0]={type:'mine',lastShot:0};advance();assert.equal(calls,1312);
});
test('cached and freshly rebuilt mine ranges produce exact positions and RNG through changes',()=>{
  const a=fixture(),b=fixture();
  for(let i=0;i<20;i++){
    for(const run of [a,b]){
      const tile=run.state.map.get('4,0');
      if(i===3)tile.towers[0].rangeFactor=1.5;
      if(i===5)tile.roads=[1,3];
      if(i===7)tile.type='smallCurve';
      if(i===9)tile.towers[0]={type:'mine',lastShot:0};
      if(i===11)run.state.map.set('41,0',{q:41,r:0,type:'longRoad',roads:[0,3],slots:0,towers:[]});
      if(i===13)run.state.map.delete('2,0');
      if(i===15)tile.towers[0].rangeFactor=.2;
    }
    b.state.map=new Map(b.state.map); // Independent reference: no reuse across steps.
    for(const run of [a,b])run.core.runtime.advance(run.state,run.random,2);
    assert.deepEqual(json(a.state.mines),json(b.state.mines));
    assert.deepEqual(json(a.state.mineRandom.snapshot()),json(b.state.mineRandom.snapshot()));
  }
});
