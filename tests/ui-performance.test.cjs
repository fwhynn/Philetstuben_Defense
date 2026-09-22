const {test}=require('node:test');
const assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs');

test('unchanged renders preserve hand buttons, forecast text and cached wave plans',()=>{
  const {a,elements,waves}=load(),hand=elements.get('hand'),cards=[...hand.children];
  const forecast=elements.get('waveForecast');let value=forecast.textContent,writes=0,calls=0;
  Object.defineProperty(forecast,'textContent',{get:()=>value,set:v=>{value=v;writes++;}});
  const plan=waves.plan;waves.plan=(...args)=>{calls++;return plan(...args);};
  for(let i=0;i<120;i++)a.renderAll();
  assert.deepEqual(hand.children,cards);
  assert.equal(writes,0);
  assert.equal(calls,0);
  a.state.gold+=3;a.renderAll();
  assert.match(elements.get('goldForecast').textContent,new RegExp('Mit aktuellem Gold: maximal '+(a.state.gold+plan(a.state.wave+1,a.state.income).maxGold)));
  assert.equal(calls,0,'gold does not change wave profiles');
});

test('hand cache follows selection, rotation, replaced cards and rescue geometry',()=>{
  const {a,elements}=load(),s=a.state,hand=elements.get('hand');
  s.hand=['straight','smallCurve'];s.selectedCard=0;s.rotation=0;a.renderAll();
  const first=hand.children[0];hand.children[1].listeners.click();
  assert.equal(s.selectedCard,1);assert.notEqual(hand.children[0],first);
  const path=hand.children[1].innerHTML;s.rotation=1;a.renderAll();
  assert.notEqual(hand.children[1].innerHTML,path);
  s.hand[0]='bigCurve';a.renderAll();assert.match(hand.children[0].innerHTML,/Große Kurve/);
  s.rescueCard={...a.CARD_LIBRARY.straight,id:'rescue',name:'Rettung',roads:[0,3]};s.hand=['rescue'];s.selectedCard=0;a.renderAll();
  const rescue=hand.children[0];s.rescueCard.roads=[0,2];a.renderAll();assert.notEqual(hand.children[0],rescue);
});

test('deck overview preserves nodes but updates in-place deck and pile changes',()=>{
  const {a,elements}=load(),s=a.state;elements.get('deckDropdown').open=true;a.renderAll();
  const content=elements.get('deckOverview'),first=content.children[0];
  a.renderAll();assert.equal(content.children[0],first);
  s.deck.push('straight');a.renderAll();assert.notEqual(content.children[0],first);
  assert.equal(content.children[0].children[0].textContent,'Gesamtes Deck ('+s.deck.length+')');
  const pile=content.children[1];s.drawPile.push('straight');a.renderAll();assert.notEqual(content.children[1],pile);
});

test('language changes, new runs and restored checkpoints invalidate UI caches',()=>{
  const {a,elements,globalListeners}=load();
  elements.get('deckDropdown').open=true;a.renderAll();
  const hand=elements.get('hand'),deck=elements.get('deckOverview');
  let card=hand.children[0],section=deck.children[0];
  globalListeners.hexlanguagechange();
  assert.notEqual(hand.children[0],card);assert.notEqual(deck.children[0],section);
  const checkpoint=JSON.parse(JSON.stringify(a.captureRunCheckpoint()));
  card=hand.children[0];a.restoreRunCheckpoint(checkpoint);assert.notEqual(hand.children[0],card);
  card=hand.children[0];a.newRun();assert.notEqual(hand.children[0],card);
});

test('forecast updates for guardian discovery, income, live enemy rewards and discounts',()=>{
  const {a,elements}=load(),s=a.state;
  s.landmarks.set('test',{q:50,r:50,status:'ready',kind:'boss'});a.renderAll();
  assert.match(elements.get('waveForecast').textContent,/Zusätzlich 1 Wächter/);
  s.income+=4;a.renderAll();assert.match(elements.get('goldForecast').textContent,new RegExp('Hex-Bonus \\+'+s.income));
  s.waveRunning=true;s.phase='wave';s.enemies=[{alive:true,hp:20,armorHp:0,magicHp:0,type:'normal',killGold:3}];a.renderAll();
  assert.match(elements.get('liveWaveInfo').textContent,/1 sind auf der Map/);
  const info=elements.get('liveWaveInfo').textContent;s.enemies[0].killGold=18;a.renderAll();assert.notEqual(elements.get('liveWaveInfo').textContent,info);
  s.enemies[0].alive=false;a.renderAll();assert.match(elements.get('liveWaveInfo').textContent,/0 sind auf der Map/);
  s.selectedSlot={q:0,r:0,index:0};a.renderAll();const budget=elements.get('towerBudget').textContent;
  s.map.get('0,0').buildings=[{type:'market',level:1}];s.buildingVersion=(s.buildingVersion||0)+1;a.renderAll();
  assert.notEqual(elements.get('towerBudget').textContent,budget);
});
