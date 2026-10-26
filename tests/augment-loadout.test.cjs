const {test}=require('node:test'),assert=require('node:assert/strict'),{load}=require('./helpers/game.cjs');
const profile={diamonds:100,records:{highestWave:36,runsPlayed:2,bossesKilled:0},unlocks:['tower:flame'],activeLoadout:['archer','catapult','chain','freeze','mine'],unlockedTowers:['archer','catapult','chain','freeze','mine','flame'],augmentCards:{version:1,unlocked:true,cards:{mine:[1,0,0,0,0],flame:[0,1,0,0,0]},equipped:['mine','flame']}};
test('run preparation lists effective cards and explains missing loadout towers',()=>{
 const {elements}=load({initialProfile:profile});elements.get('closeArsenalBtn').listeners.click();const summary=elements.get('loadoutAugments');assert.equal(summary.hidden,false);
 const text=summary.children.map(n=>n.textContent).join(' ');assert.match(text,/Nachbeben/);assert.match(text,/Nicht aktiv/);assert.match(text,/Brandöl/);assert.match(text,/1\/4/);
});
test('fresh players see neither augment preparation nor the new Arsenal hint',()=>{
 const {elements}=load({initialProfile:{records:{highestWave:0,runsPlayed:0,bossesKilled:0},introduction:{version:1,bestWave:0,skipped:false,legacy:false}}});
 elements.get('closeArsenalBtn').listeners.click();assert.equal(elements.get('loadoutAugments').hidden,true);assert.doesNotMatch(elements.get('menuArsenalBtn').textContent,/Augment/);
});
