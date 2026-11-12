const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs');

test('map and deck inspection preserve reward choices, deck and pending phase',()=>{
  const {a,elements}=load();a.state.wave=2;a.showRewards();
  const choices=[...elements.get('rewardChoices').children],deck=[...a.state.deck];
  elements.get('rewardMapBtn').listeners.click();assert.equal(elements.get('rewardOverlay').attributes['aria-modal'],'false');
  elements.get('rewardDeckBtn').listeners.click();assert.equal(elements.get('rewardDeckOverview').children.length,3);
  assert.ok(elements.get('rewardDeckBtn').classList.contains('hidden'));
  elements.get('rewardBackBtn').listeners.click();assert.equal(elements.get('rewardOverlay').attributes['aria-modal'],'true');
  assert.equal(elements.get('rewardDeckBtn').classList.contains('hidden'),false);
  assert.deepEqual(elements.get('rewardChoices').children,choices);assert.deepEqual([...a.state.deck],deck);assert.equal(a.state.phase,'reward');
  choices[0].listeners.click();assert.equal(a.state.deck.length,deck.length+1);assert.equal(a.state.phase,'place');
});

test('victory waits for boss and normal rewards, stays until acknowledged and blocks the next wave',()=>{
  const {a,elements}=load({initialProfile:{records:{highestWave:9}}});
  a.state.discard.push(...a.state.hand);a.state.hand=[];
  a.state.wave=10;a.state.bossRewards=['guardian','guardian-2'];a.endWave();
  assert.ok(a.state.pendingCelebration);assert.ok(!a.state.celebrationActive);
  elements.get('rewardChoices').children[0].listeners.click();assert.equal(a.state.phase,'bossReward');assert.ok(!a.state.celebrationActive);
  elements.get('rewardChoices').children[0].listeners.click();assert.equal(a.state.phase,'reward');assert.ok(!a.state.celebrationActive);
  elements.get('rewardChoices').children[0].listeners.click();assert.equal(a.state.celebrationActive,true);
  const message=elements.get('celebrationText').textContent;
  assert.match(message,/2 Wächter besiegt/);assert.match(message,/Wave 10 geschafft/);assert.match(message,/persönlicher Rekord/);
  a.state.phase='build';a.startWave();assert.equal(a.state.wave,10);
  elements.get('celebrationContinue').listeners.click();assert.equal(a.state.celebrationActive,false);
  a.state.discard.push(...a.state.hand);a.state.hand=[];a.state.wave=15;a.endWave();
  assert.equal(a.state.celebrationActive,true);assert.doesNotMatch(elements.get('celebrationText').textContent,/persönlicher Rekord/);
  a.newRun();assert.ok(!a.state.celebrationActive);assert.equal(a.state.pendingCelebration,undefined);
});

test('Duo deck and map inspection survive repeated snapshots and send only the confirmed server choice',()=>{
 const calls=[],duo={send(action,payload){calls.push([action,payload.offerId,payload.index]);}};
 const {elements}=load({duo});const offer={kind:'normal',id:'server-offer',choices:[{kind:'card',cardId:'straight'},{kind:'card',cardId:'tee'}]};
 duo.api.reward(offer,'reward');
 const choices=elements.get('rewardChoices').children.slice();
 elements.get('rewardDeckBtn').listeners.click();duo.api.reward(structuredClone(offer),'reward');
 assert.equal(elements.get('rewardDeck').classList.contains('hidden'),false);assert.equal(elements.get('rewardDeckOverview').children.length,3);
 elements.get('rewardMapBtn').listeners.click();assert.equal(elements.get('rewardOverlay').classList.contains('inspectMap'),true);
 elements.get('rewardBackBtn').listeners.click();assert.equal(elements.get('rewardChoices').children[1],choices[1]);assert.equal(calls.length,0);
 choices[1].listeners.click();assert.deepEqual(calls,[['reward',offer.id,1]]);
});
