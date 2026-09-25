const { test } = require('node:test'), assert = require('node:assert/strict');
const { load } = require('./helpers/game.cjs');
function unlock(elements, key) { const walk = e => [e, ...(e.children || []).flatMap(walk)]; walk(elements.get('arsenalChoices')).find(e => e.attributes?.['data-unlock'] === key).listeners.click(); }
test('Q and E rotate the camera in opposite directions without changing hex rotation', () => {
  const turns = [], { a, documentListeners } = load({ rotateView: direction => turns.push(direction) });
  const key = key => documentListeners.keydown({ key, preventDefault() { } });
  key('q'); a.advanceCamera(16); documentListeners.visibilitychange(); key('E'); a.advanceCamera(16); documentListeners.keyup({ key: 'E' }); assert.ok(turns[0] < 0 && turns[1] > 0); assert.ok(Math.abs(turns[0] + turns[1]) < 1e-9); assert.equal(a.state.rotation, 0);
  documentListeners.keydown({ key: 'q', target: { tagName: 'INPUT' } }); assert.equal(turns.length, 2);
});
test('G toggles and saves the grid, ignores held repeats and text input', () => {
  const { a, elements, storage, documentListeners } = load(), key = documentListeners.keydown;
  key({ key: 'g', preventDefault() { } }); assert.equal(a.state.showHexGrid, true); assert.equal(elements.get('hexGrid').checked, true); assert.equal(storage.get('hexGrid'), 'true');
  key({ key: 'g', repeat: true }); assert.equal(a.state.showHexGrid, true);
  key({ key: 'g', target: { tagName: 'INPUT' } }); assert.equal(a.state.showHexGrid, true);
  key({ key: 'g', ctrlKey: true }); assert.equal(a.state.showHexGrid, true);
  key({ key: 'G', preventDefault() { } }); assert.equal(a.state.showHexGrid, false); assert.equal(storage.get('hexGrid'), 'false');
});
test('grid setting persists and diamond HUD forecasts only unpaid run rewards', () => {
  const { a, elements, storage } = load({ initialStorage: { hexGrid: 'true' } });
  assert.equal(a.state.showHexGrid, true); assert.equal(elements.get('hexGrid').checked, true);
  elements.get('hexGrid').checked = false; elements.get('hexGrid').listeners.change();
  assert.equal(a.state.showHexGrid, false); assert.equal(storage.get('hexGrid'), 'false');
  a.newRun(); assert.equal(a.state.showHexGrid, false);
  a.state.wave = 10; a.state.earnedMeta.periodicBosses = 1; a.state.earnedMeta.explorationBosses = 1;
  a.renderAll(); assert.equal(elements.get('runDiamonds').textContent, '(+15)');
  a.state.metaSettled = true; a.renderAll(); assert.equal(elements.get('runDiamonds').textContent, '(+0)');
});

test('middle click rotates clockwise, R remains available, and building phase does not rotate', () => {
  const { a, elements, documentListeners } = load(); a.state.selectedCard=0; let prevented = 0;
  const middle = () => elements.get('board').listeners.pointerdown({ button: 1, preventDefault() { prevented++; } });
  assert.equal(a.state.rotation, 0); middle(); assert.equal(a.state.rotation, 5); assert.equal(prevented, 1);
  documentListeners.keydown({ key: 'r' }); assert.equal(a.state.rotation, 0);
  for (let i = 0; i < 6; i++)middle(); assert.equal(a.state.rotation, 0);
  a.state.phase = 'build'; middle(); assert.equal(a.state.rotation, 0);
});

test('arsenal unlocks refresh an open loadout and both new towers can be taken into a run', () => {
  const { a, elements, storage, selectSlot, buyTower } = load({ initialProfile: { diamonds: 100 } });
  elements.get('newRunBtn').listeners.click();
  elements.get('menuArsenalBtn').listeners.click();
  for (const id of ['ballista', 'flame']) unlock(elements, 'tower:' + id);
  assert.equal(elements.get('loadoutChoices').children.length, 7);
  elements.get('closeArsenalBtn').listeners.click();
  const choices = () => elements.get('loadoutChoices').children;
  choices()[5].listeners.click(); assert.match(elements.get('loadoutWarning').textContent, /fünf Plätze/);
  choices()[0].listeners.click(); choices()[5].listeners.click();
  choices()[1].listeners.click(); choices()[6].listeners.click();
  elements.get('confirmLoadoutBtn').listeners.click();
  assert.ok(a.state.towerLoadout.includes('ballista')); assert.ok(a.state.towerLoadout.includes('flame'));
  const saved = JSON.parse(storage.get('hex-bastion-profile-v1'));
  assert.deepEqual(Array.from(a.state.towerLoadout), saved.activeLoadout); assert.equal(saved.diamonds, 45);
  a.state.phase = 'build'; a.state.gold = 1000;
  a.state.map.set('1,0', { q: 1, r: 0, type: 'cross', roads: [0, 1, 3, 4], slots: 2, towers: [null, null] });
  selectSlot(1, 0, 0); buyTower('ballista'); selectSlot(1, 0, 1); buyTower('flame');
  assert.equal(a.state.map.get('1,0').towers[0].type, 'ballista');
  assert.equal(a.state.map.get('1,0').towers[1].type, 'flame');
  const reloaded = load({ initialProfile: saved }); assert.deepEqual(Array.from(reloaded.a.state.towerLoadout), saved.activeLoadout);
});


test('element and necromancer unlock, enter a five-slot loadout and build with upgrade choices', () => {
  const { a, elements, storage, selectSlot, buyTower, data } = load({ initialProfile: { diamonds: 100 } });
  elements.get('newRunBtn').listeners.click(); elements.get('menuArsenalBtn').listeners.click();
  for (const id of ['element', 'necromancer']) unlock(elements, 'tower:' + id);
  elements.get('closeArsenalBtn').listeners.click(); const choices = () => elements.get('loadoutChoices').children;
  choices()[0].listeners.click(); choices()[5].listeners.click(); choices()[1].listeners.click(); choices()[6].listeners.click();
  elements.get('confirmLoadoutBtn').listeners.click(); assert.equal(a.state.towerLoadout.length, 5);
  assert.ok(a.state.towerLoadout.includes('element')); assert.ok(a.state.towerLoadout.includes('necromancer'));
  assert.equal(JSON.parse(storage.get('hex-bastion-profile-v1')).diamonds, 0);
  a.state.phase = 'build'; a.state.gold = 1000; a.state.map.set('1,0', { q: 1, r: 0, type: 'cross', roads: [0, 1, 3, 4], slots: 2, towers: [null, null] });
  selectSlot(1, 0, 0); buyTower('element'); selectSlot(1, 0, 1); buyTower('necromancer');
  const [element, necro] = a.state.map.get('1,0').towers;
  assert.equal(data.availableUpgrades(element).length, 3); assert.equal(data.availableUpgrades(necro).length, 2);
  necro.souls = [{ until: 10000, lastShot: 0 }]; a.state.wave = 1; a.endWave(); assert.equal(necro.souls.length, 0);
});

test('camera acceleration is frame independent and focus loss stops its inertia', () => {
  function run(step) { const turns = [], { a, documentListeners } = load({ rotateView: v => turns.push(v) }); documentListeners.keydown({ key: 'q', preventDefault() { } }); for (let t = step; t <= 100; t += step)a.advanceCamera(t); const total = turns.reduce((a, b) => a + b, 0); documentListeners.visibilitychange(); const count = turns.length; a.advanceCamera(150); assert.equal(turns.length, count); return total; }
  assert.ok(Math.abs(run(10) - run(50)) < 1e-9); assert.ok(run(10) < 0 && run(10) > -.6);
});

test('arsenal menu highlights affordable unlocks and the ingame arsenal action is absent', () => {
  const rich = load({ initialProfile: { diamonds: 40 } }); assert.ok(rich.elements.get('menuArsenalBtn').classList.contains('upgradeAvailable')); assert.equal(rich.elements.has('openArsenalBtn'), false);
  const poor = load(); assert.equal(poor.elements.get('menuArsenalBtn').classList.contains('upgradeAvailable'), false);
});

test('element ultimate names follow the chosen branch and keep their bonuses', () => {
  const { data } = load(); for (const [branch, name] of [['elementFire', 'Weltenbrand'], ['elementWater', 'Ozeanherz'], ['elementWind', 'Himmelssturm']]) { const before = data.towerDefinition({ type: 'element', branch }), after = data.towerDefinition({ type: 'element', branch, ultimate: 'element' }); assert.equal(after.name, name); assert.equal(after.damage, Number((before.damage * 1.3).toFixed(2))); }
});

test('WASD pans continuously and U distinguishes locked, available and maxed upgrades without gold', () => {
  const { a, data, elements, documentListeners } = load(); const before = elements.get('board').attributes.viewBox;
  documentListeners.keydown({ key: 'w', preventDefault() { } }); a.advanceCamera(16); assert.notEqual(elements.get('board').attributes.viewBox, before); documentListeners.keyup({ key: 'w' }); const stopped = elements.get('board').attributes.viewBox; documentListeners.visibilitychange(); a.advanceCamera(32); assert.equal(elements.get('board').attributes.viewBox, stopped);
  a.state.gold = 0; documentListeners.keydown({ key: 'u', preventDefault() { } }); assert.equal(a.state.showUpgradeStatus, true); assert.equal(data.upgradeStatus(a.state, { type: 'archer' }), '↑'); assert.equal(data.upgradeStatus(a.state, { type: 'archer', branch: 'marksman', finalUpgrade: 'eagleEye' }), ''); a.state.ultimateUnlocks = ['ultimate:archer']; assert.equal(data.upgradeStatus(a.state, { type: 'archer', branch: 'marksman', finalUpgrade: 'eagleEye' }), '↑'); assert.equal(data.upgradeStatus(a.state, { type: 'archer', ultimate: 'archer' }), '');
  documentListeners.keydown({ key: 'u', preventDefault() { } }); assert.equal(a.state.showUpgradeStatus, false);
});

test('defeat leads to main menu and loadout cancellation no longer offers a dead run', () => {
  const { a, elements } = load(); a.state.hp = 0; a.state.waveRunning = true; a.state.pendingSpawns = 1; a.update(.01, 1); assert.equal(a.state.phase, 'gameover'); elements.get('changeLoadoutBtn').listeners.click(); assert.equal(elements.get('cancelLoadoutBtn').title, 'Zurück zum Hauptmenü'); elements.get('cancelLoadoutBtn').listeners.click(); assert.equal(elements.get('menuContinueBtn').classList.contains('hidden'), true); elements.get('gameOverMenuBtn').listeners.click(); assert.equal(elements.get('gameOverOverlay').classList.contains('hidden'), true);
});

test('research map exposes all towers and buildings and reset needs confirmation before refund', () => {
  const { elements, storage } = load({ initialProfile: { diamonds: 100 } }); elements.get('menuArsenalBtn').listeners.click(); assert.equal(elements.get('arsenalChoices').children.length, 12); unlock(elements, 'tower:ballista'); assert.equal(JSON.parse(storage.get('hex-bastion-profile-v1')).diamonds, 80);
  elements.get('resetDiamondsBtn').listeners.click(); assert.equal(JSON.parse(storage.get('hex-bastion-profile-v1')).diamonds, 80); elements.get('resetDiamondsBtn').listeners.click(); const p = JSON.parse(storage.get('hex-bastion-profile-v1')); assert.equal(p.diamonds, 100); assert.equal(p.unlockedTowers.includes('ballista'), false); assert.equal(elements.get('resetDiamondsBtn').disabled, true);
});

test('arsenal shows one tree at a time, picked from a rail that marks affordable unlocks', () => {
  const fs = require('node:fs'), path = require('node:path'), html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8'); const arsenal=html.search(/src\s*=\s*["']classes\/arsenal\.js["']/),game=html.search(/s\.src\s*=\s*["']classes\/game\.js["']/); assert.ok(arsenal>=0&&game>arsenal,'Arsenal must load before the game controller');
  const { elements } = load({ initialProfile: { diamonds: 20 } }); elements.get('menuArsenalBtn').listeners.click();
  const trees = elements.get('arsenalChoices').children, tabs = elements.get('arsenalTabs').children.filter(e => e.attributes.role === 'tab');
  assert.equal(tabs.length, 12); assert.equal(trees.filter(t => !t.hidden).length, 1);
  assert.ok(tabs.some(t => t.className.includes('affordable'))); assert.equal(tabs.find(t => t.attributes['aria-controls'] === 'research-ballista').className.includes('locked'), true);
  const target = tabs.find(t => t.attributes['aria-controls'] === 'research-market'); target.listeners.click();
  assert.equal(target.attributes['aria-selected'], 'true'); assert.deepEqual(trees.filter(t => !t.hidden).map(t => t.id), ['research-market']);
  elements.get('closeArsenalBtn').listeners.click(); elements.get('menuArsenalBtn').listeners.click();
  assert.deepEqual(elements.get('arsenalChoices').children.filter(t => !t.hidden).map(t => t.id), ['research-market']);
});

test('run results show paid tower costs, refunds and a reversible map view without settling twice', () => {
  const { a, elements, storage, selectSlot, buyTower, upgradeSelectedTower, sellSelectedTower } = load(); a.state.phase = 'build'; a.state.gold = 200; a.state.map.set('1,0', { q: 1, r: 0, type: 'straight', roads: [0, 3], slots: 1, towers: [null] }); selectSlot(1, 0, 0); buyTower('archer'); a.state.selectedTower = { q: 1, r: 0, index: 0 }; upgradeSelectedTower('marksman'); const usage = a.state.runTowerStats.archer; assert.equal(usage.buildGold, 25); assert.equal(usage.upgradeGold, 35); sellSelectedTower(); assert.equal(usage.refundGold, 60); assert.equal(a.state.runTowerDetails[1].sold, true);
  a.state.hp = 0; a.state.waveRunning = true; a.state.pendingSpawns = 1; a.update(.01, 1); assert.match(elements.get('runStatistics').innerHTML, /Schaden\/🪙/); assert.match(elements.get('runStatistics').innerHTML, /verkauft/); const saved = storage.get('hex-bastion-profile-v1'); elements.get('gameOverMapBtn').listeners.click(); assert.equal(a.state.inspectEndMap, true); elements.get('backToRunResultBtn').listeners.click(); assert.equal(a.state.inspectEndMap, false); assert.equal(storage.get('hex-bastion-profile-v1'), saved); assert.equal(a.state.phase, 'gameover');
});
test('daily victory also exposes statistics and map inspection', () => {
  const { a, elements } = load(); a.newRun(undefined, undefined, undefined, '2026-09-22'); a.state.wave = 20; a.endWave(); assert.equal(a.state.challengeWon, true); assert.match(elements.get('dailyVictoryStatsContent').innerHTML, /Turmstatistik/); const panel=elements.get('campaignVictory');panel.listeners.click({target:panel});assert.equal(panel.classList.contains('inspectCampaign'),true);
});

test('multi-build sums local discounts and buys exactly the marked slots atomically', () => {
  const { a, elements, selectSlot, buyTower } = load(); a.state.phase = 'build'; a.state.gold = 46;
  const first = { q: 1, r: 0, type: 'straight', roads: [0, 3], slots: 1, towers: [null], buildings: [{ type: 'market' }] }, second = { q: 4, r: 0, type: 'cross', roads: [0, 1, 3, 4], slots: 2, towers: [null, null] };
  a.state.map.set('1,0', first); a.state.map.set('4,0', second);
  selectSlot(1, 0, 0); selectSlot(4, 0, 1, true);
  const offer = elements.get('towerMenu').children[0]; assert.match(offer.innerHTML, /47 🪙/); assert.match(offer.innerHTML, /2 × Türme/); assert.equal(offer.disabled, true);
  buyTower('archer'); assert.equal(first.towers[0], null); assert.equal(second.towers[1], null); assert.equal(a.state.gold, 46);
  a.state.gold = 47; buyTower('archer'); assert.equal(first.towers[0].paid, 22); assert.equal(second.towers[1].paid, 25); assert.equal(second.towers[0], null); assert.equal(a.state.gold, 0); assert.equal(a.state.runTowerStats.archer.builds, 2); assert.equal(a.state.runTowerStats.archer.buildGold, 47); assert.equal(Object.keys(a.state.runTowerDetails).length, 2);
});
test('control click toggles slots, normal click replaces selection, touch toggle also adds slots', () => {
  const { a, elements, selectSlot } = load(); a.state.phase = 'build'; a.state.map.set('1,0', { q: 1, r: 0, type: 'cross', roads: [0, 1, 3, 4], slots: 2, towers: [null, null] });
  selectSlot(1, 0, 0); selectSlot(1, 0, 1, true); assert.equal(a.state.selectedSlots.length, 2); selectSlot(1, 0, 0, true); assert.equal(a.state.selectedSlots.length, 1); assert.equal(a.state.selectedSlot.index, 1); selectSlot(1, 0, 1, true); assert.equal(a.state.selectedSlot, null);
  selectSlot(1, 0, 0); selectSlot(1, 0, 1); assert.equal(a.state.selectedSlots.length, 1); elements.get('multiTowerSelection').checked = true; selectSlot(1, 0, 0); assert.equal(a.state.selectedSlots.length, 2); a.rendererCommands.clearSelection(); assert.equal(a.state.selectedSlot, null); selectSlot(1, 0, 1, true); assert.equal(a.state.selectedSlots.length, 1);
});
test('multi-build never partially buys when a selected slot becomes occupied', () => {
  const { a, selectSlot, buyTower } = load(); a.state.phase = 'build'; a.state.gold = 100; const tile = { q: 1, r: 0, type: 'cross', roads: [0, 1, 3, 4], slots: 2, towers: [null, null] }; a.state.map.set('1,0', tile); selectSlot(1, 0, 0); selectSlot(1, 0, 1, true); tile.towers[1] = { type: 'archer' }; buyTower('archer'); assert.equal(tile.towers[0], null); assert.equal(a.state.gold, 100);
});
test('multi tower focus edits all eligible turrets, preserves unique priorities, ignores support and blocks single sale', () => {
  const { a, elements, selectSlot, buyTower, sellSelectedTower } = load(); a.state.phase = 'build'; a.state.gold = 500;
  const tile = { q: 1, r: 0, type: 'cross', roads: [0, 1, 3, 4], slots: 2, towers: [null, null] }, support = { q: 2, r: 0, type: 'straight', roads: [0, 3], slots: 1, towers: [null] }; a.state.map.set('1,0', tile); a.state.map.set('2,0', support);
  selectSlot(1, 0, 0); selectSlot(1, 0, 1, true); buyTower('archer'); selectSlot(2, 0, 0); buyTower('freeze'); tile.towers[1].targetPriority = ['boss', 'mostArmor', 'closestBase'];
  a.rendererCommands.selectTower(1, 0, 0); a.rendererCommands.selectTower(1, 0, 1, true); a.rendererCommands.selectTower(2, 0, 0, true);
  const section = elements.get('towerUpgrades').children[0], select = section.children[0].children[0]; assert.equal(select.children[0].textContent, 'Unterschiedliche Einstellungen'); select.value = 'boss'; select.listeners.change();
  for (const tower of tile.towers) { assert.equal(tower.targetPriority[0], 'boss'); assert.equal(new Set(tower.targetPriority).size, 3); } assert.equal(support.towers[0].targetPriority[0], 'closestBase'); assert.equal(elements.get('sellTowerBtn').disabled, true); sellSelectedTower(); assert.ok(support.towers[0]);
  a.rendererCommands.selectTower(2, 0, 0, true); assert.equal(a.state.selectedTowers.length, 2); a.rendererCommands.selectTower(1, 0, 0); assert.equal(a.state.selectedTowers.length, 1);
});

test('loadout rail drags exactly one tower onto the drop slot with its market price', () => {
  const { a, elements, documentListeners } = load({ pickSlot: () => ({ q: 1, r: 0, index: 1 }) }); a.state.phase = 'build'; a.state.gold = 22;
  const tile = { q: 1, r: 0, type: 'cross', roads: [0, 1, 3, 4], slots: 2, towers: [null, null], buildings: [{ type: 'market' }] }; a.state.map.set('1,0', tile); a.renderAll();
  const rail = elements.get('quickLoadout'); assert.equal(rail.children.length, 5); const button = rail.children[0]; button.listeners.pointerdown({ button: 0, pointerId: 7, clientX: 10, clientY: 100, preventDefault() { }, stopPropagation() { } }); assert.equal(a.state.dragTower, 'archer');
  documentListeners.pointermove({ pointerId: 7, clientX: 300, clientY: 200 }); assert.equal(a.state.dragSlot.index, 1); documentListeners.pointerup({ pointerId: 7, clientX: 300, clientY: 200 }); assert.equal(tile.towers[0], null); assert.equal(tile.towers[1].type, 'archer'); assert.equal(a.state.gold, 0); assert.equal(a.state.runTowerStats.archer.buildGold, 22); assert.equal(a.state.dragTower, null);
});
test('quick build supports keyboard/tap, cancels outside and does not charge invalid or unaffordable drops', () => {
  let hit = null; const { a, elements, documentListeners, selectSlot } = load({ pickSlot: () => hit }); a.state.phase = 'build'; a.state.gold = 24; const tile = { q: 1, r: 0, type: 'straight', roads: [0, 3], slots: 1, towers: [null] }; a.state.map.set('1,0', tile); a.renderAll(); let button = elements.get('quickLoadout').children[0];
  button.listeners.click({ detail: 0 }); assert.ok(!a.state.dragTower); assert.equal(button.disabled, true); assert.equal(tile.towers[0], null); assert.equal(a.state.gold, 24);
  a.state.gold = 25; button.listeners.click({ detail: 0 }); selectSlot(1, 0, 0); assert.equal(tile.towers[0].type, 'archer'); assert.equal(a.state.gold, 0);
  tile.towers[0] = null; a.state.gold = 25; a.renderAll();
  button.listeners.pointerdown({ button: 0, pointerId: 1, clientX: 0, clientY: 0, preventDefault() { }, stopPropagation() { } }); documentListeners.pointermove({ pointerId: 1, clientX: 100, clientY: 100 }); documentListeners.pointerup({ pointerId: 1, clientX: 100, clientY: 100 }); assert.equal(a.state.dragTower, null); assert.equal(a.state.gold, 25);
  button.listeners.click({ detail: 0 }); documentListeners.pointercancel(); assert.equal(a.state.dragTower, null); button.listeners.click({ detail: 0 }); a.state.phase = 'reward'; a.renderAll(); assert.equal(a.state.dragTower, 'archer'); assert.equal(button.disabled, true);
});
test('biome rail discovers visible regions and highlights them by hover or pinned click', () => {
  const { a, elements } = load(); a.state.biomeSeed = 'biome-rail'; a.renderAll(); assert.equal(elements.get('biomeRail').children.length, 1);
  for (let q = -8; q <= 8; q += 4)for (let r = -8; r <= 8; r += 4) { if (!q && !r) continue; a.state.map.set(q + ',' + r, { q, r, type: 'straight', roads: [0, 3], slots: 1, towers: [null] }); } a.renderAll(); const rail = elements.get('biomeRail'); assert.equal(rail.children.length, 4);
  const desert = rail.children[1]; assert.match(desert.innerHTML, /Dünenmeer/); assert.match(desert.innerHTML, /15 %/); desert.listeners.pointerenter(); assert.equal(a.state.highlightBiome, 'desert'); const overlays = elements.get('board').children[3]; assert.ok(overlays.children.some(e => e.attributes['data-overlay'] === 'building'));
  desert.listeners.pointerleave(); assert.equal(a.state.highlightBiome, null); desert.listeners.click(); desert.listeners.pointerleave(); assert.equal(a.state.highlightBiome, 'desert'); desert.listeners.click(); assert.equal(a.state.highlightBiome, null);
  a.newRun(); assert.equal(elements.get('biomeRail').children.length, 1); assert.equal(a.state.highlightBiome, undefined);
});

test('quick icons reflect affordable free slots, local discounts and live gold changes', () => {
  const { a, elements } = load(); a.state.phase = 'build'; a.state.gold = 21; const tile = { q: 1, r: 0, type: 'straight', roads: [0, 3], slots: 1, towers: [null], buildings: [{ type: 'market' }] }; a.state.map.set('1,0', tile); a.renderAll(); const button = elements.get('quickLoadout').children[0];
  assert.equal(button.disabled, true); assert.equal(button.classList.contains('unaffordable'), true); assert.match(button.title, /22 Gold/); button.listeners.click({ detail: 0 }); assert.ok(!a.state.dragTower);
  a.state.gold = 22; a.renderAll(); assert.equal(button.disabled, false); assert.equal(button.classList.contains('unaffordable'), false); assert.match(button.innerHTML, /ab 22/);
  tile.towers[0] = { type: 'archer', level: 1 }; a.renderAll(); assert.equal(button.disabled, true); assert.match(button.title, /Kein freier/);
  tile.towers[0] = null; tile.buildings = []; a.renderAll(); assert.equal(button.disabled, true); a.state.gold = 25; a.renderAll(); assert.equal(button.disabled, false);
});

test('drag draws visible free-slot targets and dropping on their projected centers builds there', () => {
  const box = { left: 37, top: 53, width: 1000, height: 700 }; let pan = 0;
  const { a, elements, documentListeners, slotPositions } = load({ boardBox: box, project: p => ({ x: p.x + 300 + pan, y: p.y + 250, width: box.width, height: box.height }) });
  a.state.phase = 'build'; a.state.gold = 200; a.state.showSlotHints = false;
  const tile = { q: 1, r: 0, type: 'cross', roads: [0, 1, 3, 4], slots: 2, towers: [null, { type: 'archer', level: 1 }] }; a.state.map.set('1,0', tile); a.renderAll();
  const button = elements.get('quickLoadout').children[0]; button.listeners.pointerdown({ button: 0, pointerId: 9, clientX: 10, clientY: 100, preventDefault() { }, stopPropagation() { } });
  const shade = elements.get('towerDragShade'); assert.equal(shade.classList.contains('hidden'), false); assert.match(shade.innerHTML, /class="dragBuildTarget" data-slot="1,0,0"/); assert.doesNotMatch(shade.innerHTML, /data-slot="1,0,1"/); assert.equal(shade.style.left, '37px');
  pan = 80; a.rendererCommands.viewChanged(); const point = slotPositions(tile)[0], x = point.x + 300 + pan, y = point.y + 250; assert.ok(shade.innerHTML.includes('left:' + x + 'px;top:' + y + 'px'));
  documentListeners.pointermove({ pointerId: 9, clientX: box.left + x, clientY: box.top + y }); assert.equal(a.state.dragSlot.index, 0); assert.match(shade.innerHTML, /dragBuildTarget active/);
  documentListeners.pointerup({ pointerId: 9, clientX: box.left + x, clientY: box.top + y }); assert.equal(tile.towers[0].type, 'archer'); assert.equal(a.state.gold, 175); assert.equal(shade.classList.contains('hidden'), true);
});

test('a clicked quick-build selection cancels on an outside press and keeps valid tower slots active',()=>{
 let hit=null;const {a,elements,documentListeners,selectSlot}=load({pickSlot:()=>hit});a.state.phase='build';a.state.gold=100;const tile={q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[null]};a.state.map.set('1,0',tile);a.renderAll();const button=elements.get('quickLoadout').children[0];
 button.listeners.click({detail:0});assert.equal(a.state.dragTower,'archer');documentListeners.pointerdown({button:0,clientX:800,clientY:600});assert.equal(a.state.dragTower,null);assert.equal(elements.get('towerDragShade').classList.contains('hidden'),true);assert.equal(a.state.gold,100);
 button.listeners.click({detail:0});hit={q:1,r:0,index:0};documentListeners.pointerdown({button:0,clientX:200,clientY:200});assert.equal(a.state.dragTower,'archer');selectSlot(1,0,0);assert.equal(tile.towers[0].type,'archer');assert.equal(a.state.gold,75);
 tile.towers[0]=null;button.listeners.click({detail:0});a.rendererCommands.clearSelection();assert.equal(a.state.dragTower,null);
});

test('HUD popups stay below their own button even when the central tutorial is visible',()=>{
 const {a,elements,document}=load({initialStorage:{'tutorial-v1':''}});
 const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
 document.documentElement={clientWidth:1912,clientHeight:948};
 elements.get('message').getBoundingClientRect=()=>rect(696,94,520,122);
 for(const id of ['quickLoadout','biomeRail'])elements.get(id).getBoundingClientRect=()=>rect(0,0,0,0);
 const popup={style:{},offsetWidth:380,getBoundingClientRect:()=>rect(0,0,380,148),parentElement:{getBoundingClientRect:()=>rect(1500,14,90,56)}};
 document.querySelectorAll=selector=>selector.includes('.dockTL')?[{getBoundingClientRect:()=>rect(0,14,1912,56)}]:selector==='.statDetails[open]>.statPopup'?[popup]:[];
 a.layoutMenus();assert.equal(popup.style.top,'82px');assert.equal(popup.style.left,'1210px');
});
