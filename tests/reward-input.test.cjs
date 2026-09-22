const {test}=require('node:test'),assert=require('node:assert/strict'),{load}=require('./helpers/game.cjs');
test('new reward rejects carried-over and immediate clicks, then accepts one deliberate click',()=>{
 let time=1000;const {a,elements}=load({now:()=>time});a.showRewards();const overlay=elements.get('rewardOverlay');
 const event=(detail=1)=>({detail,blocked:false,preventDefault(){this.blocked=true;},stopImmediatePropagation(){this.blocked=true;}});
 let e=event();overlay.captureListeners.click(e);assert.ok(e.blocked);
 e=event();overlay.captureListeners.pointerdown(e);assert.ok(e.blocked);
 time=1400;e=event();overlay.captureListeners.click(e);assert.ok(e.blocked,'old pointer down must not become a valid click after delay');
 e=event();overlay.captureListeners.pointerdown(e);overlay.captureListeners.click(e);assert.equal(e.blocked,false);
 const count=a.state.deck.length;elements.get('rewardChoices').children[0].listeners.click();assert.equal(a.state.deck.length,count+1);
 a.showRewards();e=event();overlay.captureListeners.click(e);assert.ok(e.blocked,'next offer rearms the guard');
 time=1800;e=event(0);overlay.captureListeners.click(e);assert.equal(e.blocked,false,'keyboard activation works after guard');
});
test('new run and new hand require explicit card selection before placement',()=>{
 const {a}=load();assert.equal(a.state.selectedCard,null);const size=a.state.map.size;a.placeTile(1,0);assert.equal(a.state.map.size,size);
 a.state.selectedCard=0;a.drawHand();assert.equal(a.state.selectedCard,null);
});
