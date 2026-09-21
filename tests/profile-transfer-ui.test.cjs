const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs');
test('main menu import previews then replaces profile only after confirmation',async()=>{
  const initial={version:1,diamonds:12,unlockedTowers:['archer','catapult','chain','freeze','mine'],activeLoadout:['archer','catapult','chain','freeze','mine'],unlocks:[],records:{highestWave:0,bossesKilled:0,runsPlayed:0},lifetime:{normalKills:0,diamondsEarned:12,towers:{}}};
  const {a,elements,storage}=load({initialProfile:initial});a.state.hp=0;
  elements.get('menuSaveBtn').listeners.click();
  const profile=JSON.parse(storage.get('hex-bastion-profile-v1'));profile.diamonds=432;
  const file={size:1000,text:async()=>JSON.stringify({format:'autohex-profile',version:1,profile})};
  await elements.get('uploadSaveInput').listeners.change({target:{files:[file]}});
  assert.match(elements.get('saveStatus').textContent,/432 Diamanten/);
  assert.notEqual(JSON.parse(storage.get('hex-bastion-profile-v1')).diamonds,432);
  elements.get('confirmImportBtn').listeners.click();
  assert.equal(JSON.parse(storage.get('hex-bastion-profile-v1')).diamonds,432);
  assert.ok(storage.has('hex-bastion-profile-v1-before-import'));
});
test('import refuses to replace a profile while a run is active',async()=>{
  const {elements}=load();elements.get('menuSaveBtn').listeners.click();
  await elements.get('uploadSaveInput').listeners.change({target:{files:[{size:1,text:async()=>{assert.fail('active run must reject before reading');}}]}});
  assert.match(elements.get('saveStatus').textContent,/laufenden Run beenden/);
  assert.ok(elements.get('confirmImportBtn').classList.contains('hidden'));
});
