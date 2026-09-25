const {test}=require('node:test'),assert=require('node:assert/strict'),loadCore=require('../headless-core.cjs');
function setup(){const c=loadCore(),run=c.runtime.create({seed:'dual-rescue',runId:'dual-rescue',difficulty:'dual',loadout:['archer','catapult','chain','freeze','mine']});const s=run.state;s.openingRemaining=0;s.map.clear();s.landmarks.clear();s.phase='place';return {c,s,run};}
function tile(s,q,r,roads,type='straight'){s.map.set(q+','+r,{q,r,type,roads,slots:0,towers:[],buildings:[]});}
test('dual rescue reconnects two incoming streets with two exterior exits, including rotations',()=>{
 const {c,s}=setup();tile(s,0,0,[0,5],'base');tile(s,0,1,[2,1]);
 const card=c.map.rescue(s.map,s.landmarks,2);assert.ok(card);assert.equal(card.roads.length,4);s.rescueCard=card;s.hand=['rescue'];
 let legal=0;for(let q=-2;q<=3;q++)for(let r=-2;r<=3;r++)for(let rotation=0;rotation<6;rotation++)if(c.placement.canPlace(s,q,r,card,rotation)){
  legal++;const roads=c.map.rotatedRoads(card,rotation),candidate=new Map(s.map);candidate.set(q+','+r,{q,r,roads,type:'rescue'});const outside=c.map.exterior(candidate,s.landmarks);assert.equal(roads.filter(d=>{const n=c.map.neighbor(q,r,d);return outside.has(c.map.key(n.q,n.r));}).length,2);
 }assert.ok(legal>0);
 const old={id:'rescue',rescue:true,slots:0,roads:[3,4,0]};assert.equal(c.map.canPlace(s.map,1,0,old,0,s.landmarks),true);assert.equal(c.placement.canPlace(s,1,0,old,0),false,'legacy single-exit rescue cannot merge the dual fronts');
});
test('a narrow dual rescue falls back to a two-exit tunnel and cannot be repeated',()=>{
 const {c,s,run}=setup();tile(s,0,0,[0],'base');tile(s,1,0,[0,3]);for(const d of [1,2,4,5]){const n=c.map.neighbor(2,0,d);tile(s,n.q,n.r,[],'buildingPlot');}
 assert.ok(c.map.rescue(s.map,s.landmarks));assert.equal(c.map.rescue(s.map,s.landmarks,2),null);
 s.deck=['buildingPlot'];s.drawPile=[...s.deck];s.discard=[];assert.equal(c.flow.drawHand(s,run.random),'tunnel');assert.ok(s.tunnelOffer);
 const restored=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(s,run.random)))).state;
 assert.equal(c.runtime.rescueTunnel(restored),true);const tunnel=[...restored.map.values()].find(t=>t.type==='rescueTunnel');assert.equal(tunnel.roads.length,2);assert.equal(c.runtime.spawnSources(restored).filter(source=>source.tile===tunnel).length,2);assert.equal(c.runtime.rescueTunnel(restored),false);
});
test('dual narrow-road fallback can be previewed and confirmed from the game UI',()=>{
 const {load}=require('./helpers/game.cjs'),{a,elements}=load(),c=loadCore(),s=a.state;s.map.clear();s.landmarks.clear();s.difficulty='dual';s.openingRemaining=0;
 tile(s,0,0,[0],'base');tile(s,1,0,[0,3]);for(const d of [1,2,4,5]){const n=c.map.neighbor(2,0,d);tile(s,n.q,n.r,[],'buildingPlot');}
 s.deck=['buildingPlot'];s.drawPile=[...s.deck];s.discard=[];a.drawHand();assert.ok(s.tunnelOffer);const before=s.map.size;
 elements.get('tunnelRescueBtn').listeners.click();assert.equal(s.tunnelConfirmed,true);assert.equal(s.map.size,before);
 elements.get('tunnelRescueBtn').listeners.click();assert.equal(s.map.size,before+1);assert.equal([...s.map.values()].find(t=>t.type==='rescueTunnel').roads.length,2);
});

test('dual rescue rejection explains two exterior exits while normal placement keeps its own rule',()=>{
 const {c,s}=setup();tile(s,0,0,[0,5],'base');tile(s,0,1,[2,1]);const old={id:'rescue',rescue:true,slots:0,roads:[3,4,0]};assert.equal(c.placement.canPlace(s,1,0,old,0),false);assert.match(c.placement.failureMessage(s,old),/Zwei Straßenenden/);assert.match(c.placement.failureMessage(s,old),/Anschlüsse an vorhandene Hexe/);
 assert.match(c.placement.failureMessage({...s,difficulty:'normal'},old),/Genau ein Straßenende/);
 const {load}=require('./helpers/game.cjs'),{a,elements}=load();Object.assign(a.state,{difficulty:'dual',openingRemaining:0,hand:['rescue'],rescueCard:old,selectedCard:0,rotation:0,phase:'place'});a.state.map.clear();a.state.landmarks.clear();tile(a.state,0,0,[0,5],'base');tile(a.state,0,1,[2,1]);a.placeTile(1,0);assert.ok([...elements.values()].some(el=>String(el.textContent).includes('Zwei Straßenenden')));
});

test('gold carrier opens the existing wave information with an explicit outcome legend',()=>{
 const {load}=require('./helpers/game.cjs'),{a,elements}=load();a.newRun(undefined,undefined,undefined,'2026-09-22');a.renderAll();assert.match(elements.get('waveForecast').textContent,/Besiegen bringt 15 Gold extra/);assert.match(elements.get('waveForecast').textContent,/verlierst du 10 Gold/);a.rendererCommands.inspectCaravan();assert.equal(elements.get('waveDropdown').open,true);
});

test('single-front rescue prefers a simple road and cannot rotate into multiple exterior exits',()=>{
 const {c,s}=setup();s.difficulty='normal';tile(s,0,0,[0],'base');const card=c.map.rescue(s.map,s.landmarks,1);assert.equal(card.roads.length,2);
 let valid=0;for(let rotation=0;rotation<6;rotation++)if(c.placement.canPlace(s,1,0,card,rotation)){valid++;const roads=c.map.rotatedRoads(card,rotation),candidate=new Map(s.map);candidate.set('1,0',{q:1,r:0,roads});const outside=c.map.exterior(candidate,s.landmarks);assert.equal(roads.filter(d=>{const n=c.map.neighbor(1,0,d);return outside.has(c.map.key(n.q,n.r));}).length,1);}assert.ok(valid);
 assert.equal(c.placement.canPlace(s,1,0,{id:'rescue',rescue:true,roads:[3,0,1],slots:0},0),false);
});
test('single rescue hand is centered and tower shortcut hint follows the equipped loadout',()=>{
 const {load}=require('./helpers/game.cjs'),{a,elements}=load();a.state.hand=['rescue'];a.state.rescueCard={id:'rescue',name:'Rettungshex',rarity:'Common',roads:[0,3],slots:0,rescue:true};a.renderAll();assert.equal(elements.get('hand').classList.contains('singleCard'),true);assert.match(elements.get('towerHotkeyHint').textContent,/1–5:/);
 a.state.towerLoadout.push('flame');a.renderAll();assert.match(elements.get('towerHotkeyHint').textContent,/1–6:/);a.state.hand=['straight','straight','straight'];a.renderAll();assert.equal(elements.get('hand').classList.contains('singleCard'),false);
});
