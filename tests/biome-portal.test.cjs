const {test}=require('node:test'),assert=require('node:assert/strict');
const loadCore=require('../headless-core.cjs'),{load}=require('./helpers/game.cjs');
const loadout=['archer','chain','freeze','mine','catapult'];

test('grassland treasure first never consumes the later non-grass landmark introduction',()=>{
 for(const stale of [false,true]){
  const {a,elements}=load();elements.get('mainMenu').classList.add('hidden');a.state.biomeSeed='grass-first';
  a.state.landmarks=new Map([
   ['0,3',{q:0,r:3,type:'treasure',claimed:false,prefab:{type:'smallCurve',roads:[0,1],slots:1}}],
   ['4,0',{q:4,r:0,type:'treasure',claimed:false,prefab:{type:'smallCurve',roads:[0,1],slots:1}}]
  ]);
  a.state.map.set('0,1',{q:0,r:1,type:'straight',roads:[1,4],slots:0,towers:[]});a.renderAll();
  assert.equal(a.state.biomeIntro,null);assert.ok(!a.state.biomeIntroAcknowledged);
  // Legacy/invalid grass-only UI state must not consume the non-grass introduction.
  if(stale){a.state.biomeIntro=['grass'];elements.get('biomeIntroClose').listeners.click();assert.ok(!a.state.biomeIntroAcknowledged);a.state.biomeIntroAcknowledged=true;}
  a.state.map.set('2,0',{q:2,r:0,type:'straight',roads:[0,3],slots:0,towers:[]});a.renderAll();
  assert.ok(a.state.biomeIntro.length);assert.ok(!a.state.biomeIntro.includes('grass'));
  assert.equal(elements.get('biomeIntro').classList.contains('hidden'),false);
  elements.get('biomeIntroClose').listeners.click();a.renderAll();assert.equal(a.state.biomeIntro,null);assert.ok(a.state.biomeIntroAcknowledgedIds.length);
 }
});

test('revealing an unconnected treasure, shrine or guardian triggers the biome hint at clear distance',()=>{
  for(const type of ['treasure','shrine','boss']){
    const {a,elements}=load(),c=loadCore();elements.get('mainMenu').classList.add('hidden');a.state.biomeSeed='landmark-intro';
    const special={q:4,r:0,type,claimed:false,prefab:{type:'smallCurve',roads:[0,1],rotation:0,slots:1}};
    a.state.landmarks=new Map([['4,0',special]]);
    a.state.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:0,towers:[]});a.renderAll();
    assert.equal(c.exploration.visibility(a.state.map,special),'fog');assert.ok(!a.state.biomeIntro);
    assert.equal(elements.get('biomeRail').children.length,1);
    a.state.map.set('2,0',{q:2,r:0,type:'straight',roads:[0,3],slots:0,towers:[]});a.renderAll();
    assert.equal(c.exploration.visibility(a.state.map,special),'clear');assert.equal(a.state.map.has('4,0'),false);
    assert.deepEqual(Array.from(a.state.biomeIntro),[c.biomes.forTile(a.state,special)]);
    assert.equal(elements.get('biomeIntro').classList.contains('hidden'),false);
    assert.equal(elements.get('biomeRail').children.filter(b=>b.classList.contains('biomeIntroTarget')).length,1);
    assert.ok(c.biomes.highlight(a.state).tiles.some(t=>t.q===4&&t.r===0));
    // Connection must not duplicate the special tile or trigger another introduction.
    elements.get('biomeIntroClose').listeners.click();special.claimed=true;
    a.state.map.set('4,0',{...special.prefab,q:4,r:0,towers:[null]});a.renderAll();
    assert.equal(c.biomes.visibleTiles(a.state).filter(t=>t.q===4&&t.r===0).length,1);
    assert.equal(a.state.biomeIntro,null);
  }
});
function setup(core,state){
  state.phase='build';state.gold=500;state.map.get('0,0').roads=[0,3];
  state.map.set('1,0',{q:1,r:0,type:'deadEnd',rotation:3,roads:[3],slots:2,towers:[null,null],buildingSlots:1,buildings:[null]});
  state.map.set('-1,0',{q:-1,r:0,type:'straight',rotation:0,roads:[0,3],slots:1,towers:[null]});
  return {q:1,r:0,index:0};
}
test('dead-end slot accepts only a portal, at full cost, between waves; it has no normal upgrades',()=>{
  const c=loadCore(),{state:s}=c.runtime.create({seed:'portal',runId:'test',loadout}),slot=setup(c,s);
  assert.equal(c.data.CARD_LIBRARY.deadEnd.buildingSlots,1);
  assert.equal(c.buildings.buy(s,slot,'house'),false);
  s.gold=249;assert.equal(c.buildings.buy(s,slot,'portal'),false);
  s.gold=500;s.phase='wave';assert.equal(c.buildings.buy(s,slot,'portal'),false);
  s.phase='build';assert.equal(c.buildings.buy(s,slot,'portal'),true);assert.equal(s.gold,250);
  const b=s.map.get('1,0').buildings[0];assert.equal(c.buildings.nextUpgrade(s,b),null);assert.equal(s.income,0);
  assert.equal(c.buildings.buy(s,slot,'portal'),false);
  s.phase='wave';assert.equal(c.buildings.sell(s,slot),false);
  s.phase='build';assert.equal(c.buildings.sell(s,slot),true);assert.equal(s.gold,500);
  const normal=s.map.get('-1,0');normal.buildingSlots=1;normal.buildings=[null];
  assert.equal(c.buildings.buy(s,{q:-1,r:0,index:0},'portal'),false);
});
test('portal is a routed entrance at the road end, shares a fixed wave and survives checkpoints',()=>{
  const c=loadCore(),{state:s,random}=c.runtime.create({seed:'portal',runId:'test',loadout}),slot=setup(c,s);
  assert.equal(c.runtime.spawnSources(s).length,1);c.buildings.buy(s,slot,'portal');
  const sources=c.runtime.spawnSources(s);assert.equal(sources.length,2);
  const portal=sources.find(x=>x.dir===6),points=c.runtime.nextSourcePoints(s,random,portal);
  assert.deepEqual(JSON.parse(JSON.stringify(points[0])),JSON.parse(JSON.stringify(c.map.buildingPosition(s.map.get('1,0'),0))));
  assert.equal(points.at(-1).x,0);assert.equal(points.at(-1).y,0);
  c.runtime.schedule(s,sources,Array.from({length:10},()=>({speed:25})));
  assert.equal(s.spawnQueue.length,10);assert.equal(s.spawnQueue.filter(j=>j.source.dir===6).length,5);
  const restored=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(s,random))));
  assert.equal(c.runtime.spawnSources(restored.state).length,2);assert.equal(restored.state.pendingSpawns,10);
  c.buildings.sell(s,slot);assert.equal(c.runtime.spawnSources(s).length,1);
});
test('Duo accepts the same portal construction and charges only its owner',()=>{
  const c=loadCore(),match=c.duo.create('portal-duo',[loadout,loadout]),s=match.boards[0].state,slot=setup(c,s),other=match.boards[1].state.gold;
  assert.equal(c.duo.command(match,0,{id:'portal-1',wave:0,action:'building',payload:{slot,type:'portal'}}),true);
  assert.equal(s.gold,250);assert.equal(match.boards[1].state.gold,other);assert.equal(c.runtime.spawnSources(s).length,2);
});
test('first coloured unplaced neighbor triggers biome introduction, dismissal lasts only for the current run',()=>{
  const {a,elements,storage}=load();elements.get('mainMenu').classList.add('hidden');a.state.biomeSeed='intro';a.renderAll();
  assert.ok(!a.state.biomeIntro);assert.equal(elements.get('biomeRail').children.length,1);
  a.state.map.set('3,0',{q:3,r:0,type:'straight',roads:[0,3],slots:0,towers:[]});a.renderAll();
  assert.ok(a.state.biomeIntro);assert.equal(elements.get('biomeIntro').classList.contains('hidden'),false);
  assert.ok(elements.get('biomeRail').children.some(b=>b.classList.contains('biomeIntroTarget')));
  const biome=elements.get('biomeRail').children.find(b=>b.classList.contains('biomeIntroTarget'));
  biome.listeners.pointerenter();biome.listeners.pointerleave();biome.listeners.focus();biome.listeners.click();
  assert.ok(a.state.biomeIntro);assert.equal(storage.get('biome-intro-v1'),undefined);
  assert.equal(elements.get('biomeIntro').classList.contains('hidden'),false);
  elements.get('biomeIntroClose').listeners.click();assert.equal(a.state.biomeIntro,null);assert.equal(a.state.biomeIntroAcknowledged,true);
  a.renderAll();assert.equal(elements.get('biomeIntro').classList.contains('hidden'),true);
  const next=load({initialStorage:{'biome-intro-v1':'done'}});next.elements.get('mainMenu').classList.add('hidden');
  next.a.state.map.set('3,0',{q:3,r:0,type:'straight',roads:[0,3],slots:0,towers:[]});next.a.renderAll();assert.ok(next.a.state.biomeIntro);
});
test('biome visibility includes colored neighbors but not distant landmark silhouettes',()=>{
  const c=loadCore(),{state:s}=c.runtime.create({seed:'visible',runId:'test',loadout});
  assert.ok(c.biomes.visibleTiles(s).every(t=>c.biomes.forTile(s,t)==='grass'));
  s.map.set('3,0',{q:3,r:0,type:'straight',roads:[0,3]});
  const next=c.biomes.visibleTiles(s).find(t=>t.q===4&&t.r===0);assert.ok(next);assert.notEqual(c.biomes.forTile(s,next),'grass');
  s.biomeIntro=c.biomes.forTile(s,next);assert.ok(c.biomes.highlight(s).tiles.some(t=>t.q===4&&t.r===0));
  assert.ok(!c.biomes.visibleTiles(s).some(t=>t.q===8&&t.r===0));
});

test('non-grass biomes start at distance four in every direction',()=>{
 const c=loadCore();for(let q=-4;q<=4;q++)for(let r=-4;r<=4;r++){const distance=Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r));if(distance<=3)assert.equal(c.biomes.at('rings',q,r),'grass');if(distance===4)assert.notEqual(c.biomes.at('rings',q,r),'grass');}
});
test('a placed biome triggers the hint even during the tutorial and reward phase',()=>{
 const {a,elements}=load({initialStorage:{'tutorial-v1':'','biome-intro-v1':'done'}});elements.get('mainMenu').classList.add('hidden');a.state.biomeSeed='intro';a.state.phase='reward';a.state.map.set('4,0',{q:4,r:0,type:'straight',roads:[0,3],slots:0,towers:[]});a.renderAll();assert.ok(a.state.biomeIntro);assert.equal(elements.get('biomeIntro').classList.contains('hidden'),false);
});

test('first hint marks every simultaneously discovered biome and shows hover effects inside itself',()=>{
 const {a,elements}=load(),c=loadCore();elements.get('mainMenu').classList.add('hidden');a.state.biomeSeed='all-regions';a.state.landmarks=new Map();
 for(let q=-3;q<=3;q++)for(let r=-3;r<=3;r++)if(Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r))===3)a.state.map.set(q+','+r,{q,r,type:'straight',roads:[0,3],slots:0,towers:[]});
 a.renderAll();assert.deepEqual(Array.from(a.state.biomeIntro).sort(),['ash','desert','storm']);
 const buttons=elements.get('biomeRail').children;assert.equal(buttons.filter(b=>b.classList.contains('biomeIntroTarget')).length,3);
 assert.equal(elements.get('biomeIntroTitle').textContent,'Neue Biome entdeckt');
 for(const id of a.state.biomeIntro)assert.ok(c.biomes.highlight(a.state).tiles.some(t=>c.biomes.forTile(a.state,t)===id));
 const desert=buttons[1];desert.listeners.pointerenter();assert.ok(elements.get('biomeIntroDetail').textContent.includes('Dünenmeer'));assert.ok(elements.get('biomeIntroDetail').textContent.includes('15 %'));
 assert.equal(buttons.filter(b=>b.classList.contains('biomeIntroTarget')).length,3);
 for(const id of a.state.biomeIntro)assert.ok(c.biomes.highlight(a.state).tiles.some(t=>c.biomes.forTile(a.state,t)===id));
 desert.listeners.pointerleave();assert.ok(elements.get('biomeIntroDetail').textContent.includes('Aschelande'));
 elements.get('biomeIntroClose').listeners.click();assert.equal(a.state.biomeIntro,null);assert.equal(buttons.filter(b=>b.classList.contains('biomeIntroTarget')).length,0);
});
