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
