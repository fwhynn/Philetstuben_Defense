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
    const {a,elements}=load();a.state.wave=1;a.state.bossRewards=['wave:15'];a.showBossReward();
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
    assert.equal(elements.get('skipRemovalBtn').classList.contains('hidden'),direct,effect);
    assert.equal(elements.get('rewardInspectActions').classList.contains('hidden'),direct,effect);
    if(!direct)assert.equal(elements.get('skipRemovalBtn').textContent,effect==='remove'?'Keine Karte entfernen':'Belohnung überspringen');
    if(direct){elements.get('rewardChoices').children[0].listeners.click();a.showRewards();assert.equal(elements.get('rewardInspectActions').classList.contains('hidden'),false);}
  }
});
