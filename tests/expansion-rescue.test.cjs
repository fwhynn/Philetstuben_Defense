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

test('rescue action survives notification expiry, checkpoint restore and confirmation',()=>{
 const {a,elements}=load();trap(a.state);a.state.phase='place';a.drawHand();a.renderAll();
 const panel=elements.get('tunnelRescuePanel'),button=elements.get('tunnelRescueBtn');
 assert.equal(panel.classList.contains('hidden'),false);
 // The fading notification can disappear without hiding the separate rescue action.
 elements.get('message').classList.remove('show');a.renderAll();assert.equal(panel.classList.contains('hidden'),false);
 const checkpoint=a.captureRunCheckpoint();a.restoreRunCheckpoint(checkpoint);assert.equal(panel.classList.contains('hidden'),false);
 button.listeners.click();assert.equal(panel.classList.contains('hidden'),false);assert.equal(button.textContent,'Tunnel kostenlos bauen');
 button.listeners.click();assert.equal(panel.classList.contains('hidden'),true);assert.equal(a.state.tunnelOffer,null);
});

test('legacy blocked checkpoint recovers its missing rescue offer without changing the deck',()=>{
 const {a,elements}=load();trap(a.state);a.state.phase='build';a.state.drawResult='tunnel';a.state.tunnelOffer=null;
 const deck=JSON.stringify(a.state.deck);a.restoreRunCheckpoint(a.captureRunCheckpoint());
 assert.ok(a.state.tunnelOffer);assert.equal(elements.get('tunnelRescuePanel').classList.contains('hidden'),false);assert.equal(JSON.stringify(a.state.deck),deck);
});

test('rescue button belongs to the persistent wave controls rather than the fading message',()=>{
 const html=require('node:fs').readFileSync('index.html','utf8'),dock=html.indexOf('<div class="dockBR">'),button=html.indexOf('id="tunnelRescueBtn"');
 assert.ok(button>dock&&button<html.indexOf('id="startWaveBtn"'));assert.equal(html.match(/id="tunnelRescueBtn"/g).length,1);
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

test('a dead end cannot close the last route and old completely closed maps can recover',()=>{
 const c=loadCore(),{state:s,random}=c.runtime.create({seed:'closed-end',runId:'closed-end',loadout:['archer','catapult','chain','freeze','mine']});
 s.landmarks.clear();s.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[null]});
 assert.equal(c.map.canPlace(s.map,2,0,c.data.CARD_LIBRARY.deadEnd,3,s.landmarks),false);
 s.map.set('2,0',{q:2,r:0,type:'deadEnd',roads:[3],slots:2,towers:[null,null]});s.phase='place';
 assert.equal(c.map.hasExteriorFront(s.map,s.landmarks),false);assert.equal(c.flow.drawHand(s,random),'tunnel');assert.equal(s.phase,'build');
 assert.ok(s.tunnelOffer);assert.equal(c.runtime.rescueTunnel(s),true);assert.ok(c.flow.start(s,random));assert.equal(s.waveRunning,true);
});

test('closing a curved ring with a dead end cannot trap the remaining road in its one-hex hole',()=>{
 const c=loadCore(),map=new Map();
 for(const [q,r,type,roads] of [[0,0,'base',[0]],[1,0,'tee',[3,5,0]],[1,1,'bigCurve',[2,0]],[2,1,'bigCurve',[3,1]],[3,0,'bigCurve',[4,2]],[3,-1,'bigCurve',[5,3]]])map.set(`${q},${r}`,{q,r,type,roads});
 assert.equal(c.map.hasExteriorFront(map),true);
 assert.equal(c.map.canPlace(map,2,-1,c.data.CARD_LIBRARY.deadEnd,0),false);
 assert.equal(c.map.canPlace(map,2,-1,c.data.CARD_LIBRARY.straight,0),true);
});

test('single-front tunnel offers can be confirmed even while an exterior front exists',()=>{
 const {a,elements}=load(),c=loadCore(),s=a.state;
 s.map.clear();s.landmarks.clear();s.difficulty='normal';s.openingRemaining=0;s.phase='build';
 s.map.set('0,0',{q:0,r:0,type:'base',roads:[0],towers:[],slots:0});
 s.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],towers:[],slots:0});
 assert.equal(c.map.hasExteriorFront(s.map,s.landmarks),true);
 s.tunnelOffer=c.map.tunnelPlan(s.map,s.landmarks,true);assert.ok(s.tunnelOffer);
 const size=s.map.size,button=elements.get('tunnelRescueBtn');button.listeners.click();assert.equal(s.tunnelConfirmed,true);
 button.listeners.click();assert.equal(s.map.size,size+1);assert.equal(s.tunnelOffer,null);
});

test('repeated blocked turns retain every deck copy and never recycle rescue cards',()=>{
 const c=loadCore(),{state:s,random}=c.runtime.create({seed:'blocked-deck',runId:'blocked-deck',loadout:['archer','catapult','chain','freeze','mine']});trap(s);
 s.drawPile=[...s.deck];s.discard=[];s.hand=[];
 const expected=JSON.stringify([...s.deck].sort());
 for(let turn=0;turn<15;turn++){
  s.phase='place';assert.equal(c.flow.drawHand(s,random),'tunnel');
  assert.equal(JSON.stringify([...s.hand,...s.drawPile,...s.discard].sort()),expected);
 }
 s.hand=['rescue'];s.drawPile=[...s.deck];s.discard=[];c.flow.drawHand(s,random);
 assert.equal([...s.hand,...s.drawPile,...s.discard].includes('rescue'),false);
 assert.equal(JSON.stringify([...s.hand,...s.drawPile,...s.discard].sort()),expected);
});

test('continuing a damaged checkpoint recovers missing cards once and allows deck removal',()=>{
 const c=loadCore(),{state:s,random}=c.runtime.create({seed:'recover-deck',runId:'recover-deck',loadout:['archer','catapult','chain','freeze','mine']});
 s.deck.push('bigCurve');s.hand=['straight'];s.drawPile=[];s.discard=[];
 const restored=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(s,random))));
 c.flow.drawHand(restored.state,restored.random);
 const cards=s=>JSON.stringify([...s.hand,...s.drawPile,...s.discard].sort());
 assert.equal(cards(restored.state),JSON.stringify([...s.deck].sort()));
 const again=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(restored.state,restored.random))));
 assert.equal(cards(again.state),cards(restored.state));
 again.state.phase='removal';const offer=c.rewards.offer(again.state,'removal',again.random);
 assert.equal(c.rewards.choose(again.state,offer.id,offer.choices.findIndex(choice=>choice.cardId==='bigCurve')),true);
});
