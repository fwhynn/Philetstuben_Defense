const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs');
function shrine(effect,withTower=false){
  const h=load(),s=h.a.state;
  s.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[withTower?{type:'archer',level:1,paid:25,lastShot:0}:null]});
  s.landmarks=new Map([['2,0',{q:2,r:0,type:'shrine',shrineEffect:effect,claimed:false}]]);
  s.hand=['straight'];s.selectedCard=0;s.rotation=0;s.phase='place';return h;
}
test('healing shrine respects upgraded max HP and pays only once',()=>{
  const {a,elements}=shrine('repair');a.state.hp=22;a.state.maxHp=25;a.placeTile(2,0);
  const action=elements.get('rewardChoices').children[0],gold=a.state.gold;action.listeners.click();
  assert.equal(a.state.hp,25);assert.equal(a.state.maxHp,25);assert.equal(a.state.gold,gold);assert.equal(a.state.phase,'build');
  action.listeners.click();assert.equal(a.state.gold,gold);
});
test('full-health and no-upgrade shrines grant supplies instead of an unusable reward',()=>{
  for(const effect of ['repair','upgrade']){const {a,elements}=shrine(effect);a.placeTile(2,0);const before=a.state.gold;elements.get('rewardChoices').children[0].listeners.click();assert.equal(a.state.gold,before+30);assert.equal(a.state.goldEarned.shrine,30);}
});
test('workshop shrine upgrades a built loadout tower without increasing its sale value',()=>{
  const {a,elements}=shrine('upgrade',true);a.placeTile(2,0);elements.get('rewardChoices').children.at(-1).listeners.click();assert.equal(a.state.workshopPicking,true);a.rendererCommands.selectTower(1,0,0);const buttons=elements.get('rewardChoices').children;assert.equal(buttons.length,3);
  const tower=a.state.map.get('1,0').towers[0],gold=a.state.gold;buttons[0].listeners.click();
  assert.equal(tower.level,2);assert.equal(tower.branch,'volley');assert.equal(tower.paid,25);assert.equal(a.state.gold,gold);
  buttons[1].listeners.click();assert.equal(tower.branch,'volley');assert.equal(a.state.phase,'build');
});
test('boss blessings replace the card choice, cannot be repeated, and reset next run',()=>{
  for(const [title,kind] of [['Bastionssegen','hp'],['Handelspakt','income']]){
    const {a,elements}=load();a.state.wave=1;a.state.bossRewards=['wave:15'];
    a.state.rewardOffer={kind:'boss',context:'wave:15',wave:1,phase:'bossReward',id:'saved',choices:[{kind:'blessing',blessing:kind==='hp'?'bastion':'income'}]};a.showBossReward();
    const button=elements.get('rewardChoices').children.find(b=>b.innerHTML.includes(title)),deck=a.state.deck.length;
    button.listeners.click();assert.equal(a.state.deck.length,deck);assert.equal(a.state.bossRewards.length,0);
    assert.equal(kind==='hp'?a.state.maxHp:a.state.income,kind==='hp'?25:2);
    button.listeners.click();assert.equal(kind==='hp'?a.state.maxHp:a.state.income,kind==='hp'?25:2);
    a.newRun();assert.equal(a.state.maxHp,20);assert.equal(a.state.income,0);
  }
});
test('new hex cards apply economy and range bonuses',()=>{
  const {a,data}=load();a.state.hand=['supplyRoad'];a.state.selectedCard=0;a.state.rotation=0;a.placeTile(1,0);assert.equal(a.state.income,2);
  assert.equal(data.towerDefinition({type:'archer',tileType:'signalCross'}).range,180);
});
test('wall upgrade HUD contains exactly current and max HP',()=>{
  const {a,elements}=load();a.state.hp=12;elements.get('baseWallsBtn').listeners.click();assert.equal(elements.get('hp').textContent,'17/25');
  const html=require('node:fs').readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');assert.doesNotMatch(html,/id="hp"[^<]*<\/strong>\s*\/20/);
});

test('shrine controls match direct blessings, card selection and card removal',()=>{
  for(const effect of ['repair','upgrade','epic','legendary','remove']){
    const {a,elements}=shrine(effect);a.placeTile(2,0);const direct=['repair','upgrade'].includes(effect);
    assert.equal(elements.get('skipRemovalBtn').classList.contains('hidden'),direct||effect==='remove',effect);
    assert.equal(elements.get('rewardInspectActions').classList.contains('hidden'),direct,effect);
    assert.equal(elements.get('skipRemovalTopBtn').classList.contains('hidden'),effect!=='remove',effect);
    if(!direct&&effect!=='remove')assert.equal(elements.get('skipRemovalBtn').textContent,'Belohnung überspringen');
    if(direct){elements.get('rewardChoices').children[0].listeners.click();a.showRewards();assert.equal(elements.get('rewardInspectActions').classList.contains('hidden'),false);}
  }
});

test('guardian loot draws three distinct blessings, with all six reachable and applied once',()=>{
  const core=require('../headless-core.cjs')(),seen=new Set();
  for(let i=0;i<40;i++){
    const run=core.runtime.create({seed:'guardian-'+i,runId:'reward-test',loadout:['archer','catapult','freeze','mine','chain']});
    const state=run.state;state.phase='bossReward';state.bossRewards=['2,3'];state.hp=16;state.maxHp=20;
    const offer=core.rewards.offer(state,'boss',run.random), options=offer.choices.filter(c=>c.kind==='blessing');
    assert.equal(options.length,3);assert.equal(new Set(options.map(c=>c.blessing)).size,3);
    assert.equal(core.rewards.offer(state,'boss',run.random),offer);
    for(const option of options){
      const stateCopy=JSON.parse(JSON.stringify(state)), gold=stateCopy.gold, income=stateCopy.income;
      assert.ok(core.rewards.choose(stateCopy,offer.id,offer.choices.indexOf(option)));
      assert.equal(core.rewards.choose(stateCopy,offer.id,offer.choices.indexOf(option)),false);
      const result=[stateCopy.hp,stateCopy.maxHp,stateCopy.gold-gold,stateCopy.income-income,stateCopy.freeTowerBuilds||0];
      const expected={bastion:[21,25,0,0,0],income:[16,20,0,2,0],treasury:[16,20,60,0,0],builder:[16,20,0,0,1],recovery:[20,20,18,0,0],convoy:[16,20,25,1,0]};
      assert.deepEqual(result,expected[option.blessing]);seen.add(option.blessing);
    }
  }
  assert.equal(seen.size,6);
});
