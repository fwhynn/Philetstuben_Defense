const {test}=require('node:test');
const assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs');

test('removal needs a second click on the same card; switching cards resets confirmation',()=>{
  const {a,elements}=load(); a.state.deck.push('straight');a.state.discard.push('straight');a.showRemoval();
  const before=Array.from(a.state.deck),[first,second]=elements.get('rewardChoices').children;
  first.listeners.click(); assert.deepEqual(Array.from(a.state.deck),before);
  assert.equal(first.classList.contains('removalPending'),true);
  second.listeners.click(); assert.equal(first.classList.contains('removalPending'),false);
  first.listeners.click(); assert.deepEqual(Array.from(a.state.deck),before);
  first.listeners.click(); assert.equal(a.state.deck.length,before.length-1);
  first.listeners.click(); assert.equal(a.state.deck.length,before.length-1);
});

test('skipping an armed removal preserves the deck and reopening clears confirmation',()=>{
  const {a,elements}=load();a.state.deck.push('straight');a.state.discard.push('straight');a.showRemoval();const before=Array.from(a.state.deck);
  elements.get('rewardChoices').children[0].listeners.click();a.finishRemoval();
  assert.deepEqual(Array.from(a.state.deck),before);a.showRemoval();
  elements.get('rewardChoices').children[0].listeners.click();
  assert.deepEqual(Array.from(a.state.deck),before);
});

test('minimum-size decks cannot arm or confirm removal',()=>{
  const {a,elements}=load();a.state.deck=a.state.deck.slice(0,5);a.showRemoval();
  const card=elements.get('rewardChoices').children[0];card.listeners.click();card.listeners.click();
  assert.equal(card.classList.contains('removalPending'),false);assert.equal(a.state.deck.length,5);
});

test('duo removal sends no command before confirmation; normal rewards stay single-click',()=>{
  const calls=[],duo={choose(...args){calls.push(args);}};const {elements}=load({duo});
  const offer={id:'remove-test',kind:'removal',choices:[{cardId:'straight'}],skippable:true};
  duo.api.reward(offer,'reward');let card=elements.get('rewardChoices').children[0];
  card.listeners.click();assert.equal(calls.length,0);card.listeners.click();assert.equal(calls.length,1);
  assert.deepEqual(calls[0],['reward',offer,0]);
  duo.api.reward({...offer,id:'add-test',kind:'card'},'reward');card=elements.get('rewardChoices').children[0];
  card.listeners.click();assert.equal(calls.length,2);
});
