const {test}=require('node:test'),assert=require('node:assert/strict');
const loadCore=require('../headless-core.cjs'),{load}=require('./helpers/game.cjs');
function trap(state,gap=false){
  state.map.clear();state.landmarks.clear();state.map.set('0,0',{q:0,r:0,type:'base',roads:[0],towers:[],slots:0});
  state.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],towers:[],slots:0});
  for(let q=-1;q<=5;q++)for(let r=-3;r<=3;r++)if(Math.max(Math.abs(q-2),Math.abs(r),Math.abs(q-2+r))===3&&(!gap||q!==5||r!==0))state.map.set(q+','+r,{q,r,type:'buildingPlot',roads:[],towers:[],slots:0});
}
test('enclosure protection detects multi-hex pockets and rejects closing the final corridor with a building tile',()=>{
  const c=loadCore(),{state:s}=c.runtime.create({seed:'trap',runId:'t',loadout:['archer','catapult','chain','freeze','mine']});trap(s,true);
  assert.equal(c.map.hasExteriorFront(s.map,s.landmarks),true);
  assert.equal(c.map.canPlace(s.map,5,0,c.data.CARD_LIBRARY.buildingPlot,0,s.landmarks),false);
  trap(s);assert.equal(c.map.hasExteriorFront(s.map,s.landmarks),false);assert.equal(c.map.rescue(s.map,s.landmarks),null);
});
test('free rescue tunnel preserves existing tiles and restores an expandable route across a checkpoint',()=>{
  const c=loadCore(),{state:s,random}=c.runtime.create({seed:'trap',runId:'t',loadout:['archer','catapult','chain','freeze','mine']});trap(s);s.phase='build';const before=s.map.size,gold=s.gold;
  const plan=c.map.tunnelPlan(s.map,s.landmarks);assert.ok(plan);assert.equal(c.runtime.rescueTunnel(s),true);assert.equal(s.gold,gold);assert.equal(s.map.size,before+1);
  assert.equal(c.map.hasExteriorFront(s.map,s.landmarks),true);assert.equal(c.runtime.rescueTunnel(s),false);
  const restored=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(s,random))));const sources=c.runtime.spawnSources(restored.state),source=sources.find(src=>src.tile.type==='rescueTunnel');assert.ok(source);
  const points=c.runtime.nextSourcePoints(restored.state,restored.random,source);assert.ok(points.some(p=>p.tunnel));assert.equal(points.at(-1).x,0);assert.equal(points.at(-1).y,0);
  const n=c.map.neighbor(source.tile.q,source.tile.r,source.dir);assert.equal(c.map.canPlace(restored.state.map,n.q,n.r,c.data.CARD_LIBRARY.straight,source.dir%3,restored.state.landmarks),true);
});
test('existing blocked runs offer a confirmed tunnel and field clicks close the tower drawer',()=>{
  const {a,elements}=load();trap(a.state);a.state.phase='place';a.drawHand();assert.equal(a.state.phase,'build');assert.ok(a.state.tunnelOffer);
  const size=a.state.map.size,button=elements.get('tunnelRescueBtn');button.listeners.click();assert.equal(a.state.map.size,size);assert.equal(a.state.tunnelConfirmed,true);
  button.listeners.click();assert.equal(a.state.map.size,size+1);assert.equal(a.state.tunnelOffer,null);
  a.rendererCommands.fieldClick();elements.get('towerDrawer').classList.remove('hidden');a.rendererCommands.clearSelection();assert.equal(elements.get('towerDrawer').classList.contains('hidden'),true);
});
test('headless placement applies a hand card once and rejects malformed or duplicate commands',()=>{
  const c=loadCore(),{state:s}=c.runtime.create({seed:'place',runId:'p',loadout:['archer','catapult','chain','freeze','mine']});s.hand=['straight'];
  assert.equal(c.placement.place(s,{q:1,r:0,index:0,rotation:.5}),null);assert.equal(s.map.size,1);
  assert.ok(c.placement.place(s,{q:1,r:0,index:0,rotation:0}));assert.equal(s.phase,'build');assert.equal(s.hand.length,0);
  assert.equal(c.placement.place(s,{q:1,r:0,index:0,rotation:0}),null);assert.equal(s.discard.length,1);
});

test('tunnel transitions skip intervening ground and do not detonate mines between portals',()=>{
 const c=loadCore(),{state:s,random}=c.runtime.create({seed:'jump',runId:'jump',loadout:['archer','catapult','chain','freeze','mine']});
 s.phase='wave';s.waveRunning=true;s.pendingSpawns=1;s.enemies=[{id:1,hp:100,alive:true,x:0,y:0,index:0,t:0,speed:10,points:[{x:0,y:0},{x:100,y:0,tunnel:true},{x:200,y:0}]}];s.mines=[{id:1,x:50,y:0,damage:100,splash:20}];
 c.runtime.advance(s,random,.1);assert.equal(s.enemies[0].x,101);assert.equal(s.enemies[0].hp,100);assert.equal(s.mines.length,1);
});
test('placement checkpoints preserve a run-local rescue card and do not overwrite another run',()=>{
 const c=loadCore(),a=c.runtime.create({seed:'a',runId:'a',loadout:['archer','catapult','chain','freeze','mine']}),b=c.runtime.create({seed:'b',runId:'b',loadout:['archer','catapult','chain','freeze','mine']});
 a.state.rescueCard={id:'rescue',roads:[0,3],slots:0,rescue:true};a.state.hand=['rescue'];b.state.rescueCard={id:'rescue',roads:[0,2],slots:0,rescue:true};b.state.hand=['rescue'];
 const restored=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(a.state,a.random))));assert.deepEqual(Array.from(restored.state.rescueCard.roads),[0,3]);
 assert.ok(c.placement.place(restored.state,{q:1,r:0,index:0,rotation:0}));assert.equal(restored.state.deck.includes('rescue'),false);assert.equal(restored.state.discard.includes('rescue'),false);assert.deepEqual(Array.from(b.state.rescueCard.roads),[0,2]);
});

test('a straight connection through an event is drawn instead of a rescue card',()=>{
 const c=loadCore(),{state:s,random}=c.runtime.create({seed:'event-bridge',runId:'bridge',loadout:['archer','catapult','chain','freeze','mine']});
 s.map=new Map([['0,0',{q:0,r:0,type:'base',roads:[0],slots:0,towers:[]}]]);s.landmarks=new Map([['2,0',{q:2,r:0,type:'treasure',claimed:false,prefab:{type:'straight',roads:[0,3],slots:1,rotation:0}}]]);
 s.deck=['straight','straight','straight'];s.hand=[];s.drawPile=[...s.deck];s.discard=[];s.phase='place';
 assert.equal(c.flow.drawHand(s,random),'ready');assert.equal(s.hand.includes('rescue'),false);assert.ok(c.placement.place(s,{q:1,r:0,index:0,rotation:0}));assert.ok(s.map.has('2,0'));
});

test('a connected road tip in a one-cell pocket is not an expandable front',()=>{
 const c=loadCore(),map=new Map([['0,0',{q:0,r:0,type:'base',roads:[0]}],['1,0',{q:1,r:0,type:'straight',roads:[0,3]}]]);
 for(let d=0;d<6;d++){const n=c.map.neighbor(2,0,d),id=c.map.key(n.q,n.r);if(!map.has(id))map.set(id,{...n,type:'deadEnd',roads:[]});}
 assert.equal(c.map.hasExteriorFront(map),false);
});
