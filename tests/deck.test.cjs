const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
function load() { const context = {}; for (const file of ['random.js', 'data.js', 'deck.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../classes', file), 'utf8'), context); vm.runInNewContext('globalThis.deck=HexDeck;globalThis.cards=HexData.CARD_LIBRARY;globalThis.random=HexRandom.create;', context); return context; }
test('weighted rewards are unique and reproducible with the same seed', () => {
  const { deck, cards, random } = load(), first = random('deck-test'), second = random('deck-test');
  for (let i = 0; i < 100; i++) { const picks = deck.rewards(cards, first); assert.equal(picks.length, 3); assert.equal(new Set(picks).size, 3); assert.equal(JSON.stringify(picks), JSON.stringify(deck.rewards(cards, second))); }
});
test('rarity weighting favors common over uncommon over rare', () => {
  const { deck, random } = load(), generator = random('weights'), library = { a: { rarity: 'Common' }, b: { rarity: 'Uncommon' }, c: { rarity: 'Rare' } }, counts = { a: 0, b: 0, c: 0 };
  for (let i = 0; i < 10000; i++) counts[deck.rewards(library, generator, 1)[0]]++;
  assert.ok(counts.a > counts.b && counts.b > counts.c);
});
test('card removal deletes a single copy in both deck and piles and stops at five', () => {
  const { deck } = load(), state = { deck: ['a', 'a', 'b', 'c', 'd', 'e'], discard: ['a', 'a'], drawPile: ['b', 'c'], hand: ['d', 'e'] };
  assert.equal(deck.remove(state, 'a'), true); assert.equal(state.deck.filter(id => id === 'a').length, 1); assert.equal(state.discard.filter(id => id === 'a').length, 1);
  const snapshot = JSON.stringify(state); assert.equal(deck.remove(state, 'a'), false); assert.equal(deck.remove(state, 'missing'), false); assert.equal(JSON.stringify(state), snapshot);
});

test('strategic tiles offer different tradeoffs and include an epic reward', () => {
  const { cards } = load(); assert.equal(cards.highGround.rarity, 'Epic'); assert.equal(cards.highGround.roads.length, 3); assert.equal(cards.highGround.slots, 1); assert.equal(cards.highGround.towerRange, 1.25);
  assert.equal(cards.grove.archerDamage, 1.25); assert.equal(cards.treasury.slots, 0); assert.equal(cards.treasury.income, 4);
});

test('expanded high rarity pools offer three distinct cards with different roles', () => {
  const { deck, cards, random } = load(); for (const rarity of ['Epic', 'Legendary']) { const library = Object.fromEntries(Object.entries(cards).filter(([, card]) => card.rarity === rarity)), picks = deck.rewards(library, random(rarity)); assert.equal(picks.length, 3); assert.equal(new Set(picks).size, 3); assert.ok(picks.every(id => cards[id].rarity === rarity)); }
  assert.equal(cards.battlefield.towerDamage, 1.2); assert.equal(cards.watchtower.slots, 2); assert.equal(cards.warCross.towerDamage, 1.3); assert.equal(cards.royalVillage.buildingSlots, 1); assert.equal(cards.royalVillage.income, 5);
});

test('Y, T and six-way crossings have distinct road topologies', () => {
  const { cards } = load(); assert.equal(cards.tee.name, 'Y-Kreuzung'); assert.deepEqual(Array.from(cards.tee.roads), [0, 2, 4]); assert.equal(cards.tJunction.name, 'T-Kreuzung'); assert.ok(cards.tJunction.roads.includes(0) && cards.tJunction.roads.includes(3)); assert.equal(cards.fullCross.roads.length, 6);
});
