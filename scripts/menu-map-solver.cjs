'use strict';
// Erzeugt regelkonforme Menü-Karten aus den echten Spielkacheln (classes/data.js) und schreibt classes/menu-maps.mjs.
// Regeln wie im Spiel (HexMap.canPlace): an jeder gemeinsamen Kante haben beide Hexe eine Straße oder keines.
// Zusätzlich fürs Menü: keine offene Straße am Inselrand, alles hängt an der Festung, keine Kacheln mit im Code gezeichneter Straße.
// Aufruf: node scripts/menu-map-solver.cjs
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = {}; vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'classes/data.js'), 'utf8') + ';globalThis.D=HexData;', context);
const LIB = context.D.CARD_LIBRARY;
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const key = (q, r) => q + ',' + r;
// Kacheltypen mit eigenem Modell und gebackener Straße (HexModelMap.TILE_MODELS), mit Gewicht für Abwechslung.
const TYPES = { straight: 3, smallCurve: 3, bigCurve: 4, tee: 3, tJunction: 2, cross: 1, village: 3, empty: 2, longRoad: 2, highGround: 2, grove: 4, treasury: 1, citadel: 1, battlefield: 1, watchtower: 2, royalVillage: 1, warCross: 1 };
const MAX_PER_TYPE = 3;
const edges = (type, rotation) => LIB[type].roads.map(d => (d + rotation) % 6);

function random(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function region(radius, removed) {
  const cells = [];
  for (let q = -radius; q <= radius; q++) for (let r = -radius; r <= radius; r++) if (Math.abs(q + r) <= radius && !removed.includes(key(q, r))) cells.push([q, r]);
  return cells;
}
function solve({ radius, removed = [], seed, baseExit = 0 }) {
  const cells = region(radius, removed), inside = new Set(cells.map(([q, r]) => key(q, r))), rnd = random(seed);
  // Alle Kachelformen als Bitmaske der Straßenkanten (je Typ jede Drehung nur einmal).
  const shapes = [];
  for (const type of Object.keys(TYPES)) { const seen = new Set(); for (let rotation = 0; rotation < 6; rotation++) { const mask = edges(type, rotation).reduce((m, d) => m | 1 << d, 0); if (!seen.has(mask)) { seen.add(mask); shapes.push({ type, rotation, mask }); } } }
  const assigned = new Map([['0,0', { q: 0, r: 0, type: 'base', rotation: baseExit, mask: 1 << baseExit }]]), counts = {};
  const free = cells.filter(([q, r]) => q || r);
  // Zulässige Formen eines Feldes: Rand ohne Straße, feste Nachbarn mit passender Kante.
  function options(q, r) {
    let must = 0, value = 0;
    for (let d = 0; d < 6; d++) {
      const id = key(q + DIRS[d][0], r + DIRS[d][1]);
      if (!inside.has(id)) { must |= 1 << d; continue; }
      const other = assigned.get(id); if (other) { must |= 1 << d; if (other.mask & 1 << (d + 3) % 6) value |= 1 << d; }
    }
    return shapes.filter(s => (s.mask & must) === value && (counts[s.type] || 0) < MAX_PER_TYPE);
  }
  let steps = 0;
  function step() {
    if (++steps > 3e4) return false;
    let best = null;
    for (const [q, r] of free) { if (assigned.has(key(q, r))) continue; const list = options(q, r); if (!list.length) return false; if (!best || list.length < best.list.length) best = { q, r, list }; }
    if (!best) return true;
    const ordered = best.list.map(s => ({ s, score: rnd() * TYPES[s.type] })).sort((a, b) => b.score - a.score);
    for (const { s } of ordered) {
      assigned.set(key(best.q, best.r), { q: best.q, r: best.r, ...s }); counts[s.type] = (counts[s.type] || 0) + 1;
      if (step()) return true;
      assigned.delete(key(best.q, best.r)); counts[s.type]--;
    }
    return false;
  }
  if (!step()) return null;
  // Alles muss über Straßen mit der Festung verbunden sein.
  const reach = new Set(['0,0']), list = [assigned.get('0,0')];
  while (list.length) { const t = list.pop(); for (let d = 0; d < 6; d++) if (t.mask & 1 << d) { const id = key(t.q + DIRS[d][0], t.r + DIRS[d][1]); if (!reach.has(id)) { reach.add(id); list.push(assigned.get(id)); } } }
  if (reach.size !== assigned.size) return null;
  return [...assigned.values()].map(({ q, r, type, rotation }) => ({ q, r, type, rotation }));
}
// Türme mit echten Ausbaustufen (Dateien in assets/towers), Gebäude auf Gebäudeplätzen.
const TOWERS = ['archer_volley', 'catapult_siege', 'freeze_deepFrost', 'chain_storm', 'ballista_harpoon', 'flame_inferno', 'archer_marksman', 'element_elementFire', 'mine'];
const BUILDINGS = ['house', 'market', 'forge'];
// Genau fünf Türme je Karte auf zufälligen Bauplätzen, jeder Turm ein anderer Typ; Gebäude auf allen Gebäudeplätzen.
// Gegner laufen im Menü auf der Straße zur Festung (Route berechnet menu-backdrop.js aus den Straßen).
const TOWER_COUNT = 5, ENEMIES = ['normal', 'armored', 'swarm', 'shieldbearer'];
function furnish(tiles, seed) {
  const rnd = random(seed + 7), slots = [], buildings = []; let b = 0;
  for (const tile of tiles) {
    if (tile.type === 'base') continue;
    const card = LIB[tile.type];
    for (let i = 0; i < (card.slots || 0); i++) slots.push({ q: tile.q, r: tile.r, index: i });
    for (let i = 0; i < (card.buildingSlots || 0); i++) buildings.push({ q: tile.q, r: tile.r, index: i, model: BUILDINGS[b++ % BUILDINGS.length] });
  }
  for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  const offset = Math.floor(rnd() * TOWERS.length);
  return { towers: slots.slice(0, TOWER_COUNT).map((slot, i) => ({ ...slot, model: TOWERS[(offset + i) % TOWERS.length] })), buildings, enemies: ENEMIES };
}
const SPECS = {
  left: { radius: 2, removed: ['-2,2', '2,-2', '0,-2'], seed: 3, baseExit: 0, fog: [[-3, 1], [1, -3]] },
  right: { radius: 2, removed: ['2,-2', '-2,2', '0,2'], seed: 11, baseExit: 3, fog: [[3, -1], [-1, 3]] },
  stage: { radius: 2, removed: [], seed: 29, baseExit: 0, fog: [[3, -1], [-3, 2], [1, -3]] }
};
const maps = {};
for (const [name, spec] of Object.entries(SPECS)) {
  let tiles = null, seed = spec.seed;
  for (let attempt = 0; attempt < 3000 && !tiles; attempt++) tiles = solve({ ...spec, seed: seed + attempt * 101 });
  if (!tiles) throw new Error('Keine regelkonforme Karte gefunden: ' + name);
  maps[name] = { tiles, ...furnish(tiles, seed), fog: spec.fog.map(([q, r]) => ({ q, r })) };
  console.log(name, tiles.length, 'Kacheln', maps[name].towers.length, 'Türme', maps[name].buildings.length, 'Gebäude');
}
const header = `/* Regelkonforme Menü-Karten aus den echten Spielkacheln. Erzeugt von scripts/menu-map-solver.cjs – nicht von Hand bearbeiten.
   Wie im Spiel: Festung in der Mitte, an jeder gemeinsamen Kante beide Straße oder keine, keine offenen Enden, alles mit der Festung verbunden.
   Türme stehen auf Bauplätzen (index < slots), Gebäude auf Gebäudeplätzen. „fog“ sind unerkundete Felder am Rand wie im Spiel. */\n`;
fs.writeFileSync(path.join(root, 'classes/menu-maps.mjs'), header + 'export const MENU_MAPS=' + JSON.stringify(maps) + ';\n');
