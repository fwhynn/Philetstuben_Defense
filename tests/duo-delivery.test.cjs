const {test}=require('node:test'),assert=require('node:assert/strict'),loadCore=require('../headless-core.cjs');
const loadout=['archer','catapult','chain','freeze','mine'],json=v=>JSON.parse(JSON.stringify(v));
function finished(wave=5,seed='gifts'){
 const c=loadCore(),m=c.duo.create(seed,[loadout,['element','ballista','necromancer','freeze','mine']]);m.wave=wave;m.phase='combat';
 for(const {state:s} of m.boards){s.wave=wave;s.phase='wave';s.waveRunning=true;s.spawnQueue=[];s.pendingSpawns=0;s.enemies=[];s.lastCompletedWave=wave-1;}
 c.duo.tick(m);let seq=0;const send=(p,action,payload)=>c.duo.command(m,p,{id:'test-'+seq++,wave:m.wave,action,payload});return {c,m,send};
}
test('deliveries only follow every fifth shared completion; no next hand before both gifts',()=>{
 const {c,m,send}=finished(),a=m.boards[0].state,b=m.boards[1].state,offer=m.delivery.offers[0],card=offer.choices[1].cardId;
 assert.equal(a.phase,'duoDelivery');assert.equal(b.phase,'duoDelivery');assert.equal(send(0,'ready',{value:true}),false);
 const before={hand:json(b.hand),deck:b.deck.length,draw:b.drawPile.length,goldA:a.gold,goldB:b.gold};
 assert.equal(send(0,'delivery',{offerId:offer.id,index:99}),false);
 assert.ok(send(0,'delivery',{offerId:offer.id,index:1}));assert.equal(b.deck.length,before.deck+1);assert.equal(b.drawPile.length,before.draw+1);assert.equal(b.drawPile.at(-1),card);assert.deepEqual(json(b.hand),before.hand);assert.equal(b.phase,'duoDelivery');assert.equal(b.gold,before.goldB);
 assert.equal(send(0,'delivery',{offerId:offer.id,index:0}),false);
 const restored=c.duo.restore(json(c.duo.capture(m)));
 const packet={id:'finish',wave:5,action:'delivery',payload:{offerId:m.delivery.offers[1].id,index:0}};
 assert.ok(c.duo.command(m,1,packet));assert.ok(c.duo.command(restored,1,packet));assert.equal(a.gold,before.goldA+20);assert.equal(a.goldEarned.partner,20);assert.notEqual(a.phase,'duoDelivery');assert.notEqual(b.phase,'duoDelivery');assert.deepEqual(json(c.duo.capture(m)),json(c.duo.capture(restored)));
 assert.equal(c.duo.command(m,1,packet),false);assert.equal(send(1,'delivery',packet.payload),false);c.duo.tick(m);assert.equal(a.gold,before.goldA+20);
 assert.equal(finished(4).m.delivery,undefined);
});
test('personal wave rewards finish first; deferred draw survives restore',()=>{
 const {c,m,send}=finished(10);assert.ok(m.boards.every(r=>r.state.phase==='reward'));
 assert.equal(send(0,'delivery',{offerId:m.delivery.offers[0].id,index:0}),false);
 const a=m.boards[0].state,b=m.boards[1].state;assert.ok(send(0,'reward',{offerId:a.rewardOffer.id,index:0}));assert.equal(a.phase,'duoDelivery');assert.equal(send(0,'delivery',{offerId:m.delivery.offers[0].id,index:0}),false);
 assert.doesNotThrow(()=>c.duo.restore(json(c.duo.capture(m))));assert.ok(send(1,'reward',{offerId:b.rewardOffer.id,index:0}));
 for(let p=0;p<2;p++)assert.ok(send(p,'delivery',{offerId:m.delivery.offers[p].id,index:0}));
 assert.ok(m.boards.every(r=>!r.state.duoDeliveryPending&&r.state.celebrationActive));
});
test('delivery cards use recipient loadout, configured rarities and deterministic persisted offers',()=>{
 for(let i=0;i<30;i++){const {c,m}=finished(5,'offer-'+i);for(let p=0;p<2;p++){const choices=m.delivery.offers[p].choices;assert.equal(choices.length,3);assert.notEqual(choices[1].cardId,choices[2].cardId);for(const {cardId} of choices.slice(1)){const card=c.data.CARD_LIBRARY[cardId];assert.ok(!card.requiredTower||m.boards[1-p].state.towerLoadout.includes(card.requiredTower));assert.ok(Object.hasOwn(c.duo.DELIVERY.weights,card.rarity));assert.ok(!card.rescue);}}
 assert.deepEqual(json(c.duo.restore(json(c.duo.capture(m))).delivery),json(m.delivery));}
});
test('version 2 checkpoints migrate without retroactive gifts and invalid delivery snapshots fail',()=>{
 const c=loadCore(),old=json(c.duo.capture(c.duo.create('legacy',[loadout,loadout])));old.version=2;delete old.duo.delivery;const restored=c.duo.restore(old);assert.equal(restored.delivery,null);assert.equal(c.duo.capture(restored).version,3);
 const h=finished(),snap=json(h.c.duo.capture(h.m));snap.duo.delivery.offers[0].choices[0].amount=999;assert.throws(()=>h.c.duo.restore(snap),/delivery/);
});
