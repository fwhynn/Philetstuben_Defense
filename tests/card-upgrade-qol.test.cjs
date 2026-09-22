const {test}=require('node:test'),assert=require('node:assert/strict'),loadCore=require('../headless-core.cjs'),{load}=require('./helpers/game.cjs');
test('reward is drawn first even with an existing draw pile and survives checkpoint',()=>{
 const c=loadCore(),run=c.session.create({seed:'top-reward',runId:'top-reward',loadout:['archer','chain','freeze','mine','catapult']});const s=run.state;s.wave=2;s.phase='reward';s.drawPile=['straight','curve','straight'];const offer=c.rewards.offer(s,'normal',run.random),card=offer.choices[0].cardId;assert.ok(c.rewards.choose(s,offer.id,0));assert.equal(s.drawPile.at(-1),card);s.phase='build';const restored=c.snapshot.restore(JSON.parse(JSON.stringify(c.snapshot.capture(s,run.random))));c.session.preparation(restored.state,restored.random);assert.equal(restored.state.hand[0],card);
});
test('R rotates immediately while selected hand card button has focus, but not while typing',()=>{
 const {a,documentListeners}=load({initialStorage:{'tutorial-v1':'new'}});a.state.phase='place';a.state.hand=['straight'];a.state.selectedCard=0;a.state.rotation=0;documentListeners.keydown({key:'r',target:{tagName:'BUTTON'},preventDefault(){}});assert.equal(a.state.rotation,1);documentListeners.keydown({key:'r',target:{tagName:'INPUT'},preventDefault(){}});assert.equal(a.state.rotation,1);
});
test('Volley is first and range preview restores on leave without spending gold',()=>{
 const {a,elements,selectSlot,buyTower}=load();a.state.phase='build';a.state.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[null]});selectSlot(1,0,0);buyTower('archer');a.rendererCommands.selectTower(1,0,0);const buttons=elements.get('towerUpgrades').children.filter(b=>b.className==='upgradeOption');assert.match(buttons[0].innerHTML,/Salve/);const tower=a.state.map.get('1,0').towers[0],gold=a.state.gold;buttons[1].listeners.pointerenter();assert.equal(a.state.previewUpgrade.tower,tower);assert.equal(a.state.previewUpgrade.definition.range,190);assert.equal(tower.branch,undefined);assert.equal(a.state.gold,gold);buttons[1].listeners.pointerleave();assert.equal(a.state.previewUpgrade,null);
});
test('deck uses hex icons and new biome description is visible without hover',()=>{
 const {a,elements}=load();a.state.deck=['straight','straight'];a.state.drawPile=['straight'];a.state.discard=[];elements.get('deckDropdown').open=true;elements.get('deckDropdown').listeners.toggle();const sections=elements.get('deckOverview').children;assert.match(sections[0].children[1].children[0].innerHTML,/<svg/);assert.equal(sections[0].children[1].children[0].children.at(-1).textContent,'×2');
 a.state.biomeIntro=['desert'];a.state.highlightBiome=null;a.renderAll();assert.match(elements.get('biomeIntroDetail').textContent,/Dünenmeer:\nGegner hier 15/);
});
