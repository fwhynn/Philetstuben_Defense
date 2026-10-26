# Hexwerk 3D: Deko-Set, Wasserlauf, Inselsockel, Nebelfeld, Porträt-Sockel

Stand 21.10.2026. Quelle für `NACHLIEFERUNG.md` Punkt 12 und `BRIEFING.md` („Menü-Hintergrund“, #17, #18).

- `build_hexwerk3d.py` erzeugt alle Modelle, die GLBs und je Gruppe und Edition eine `.blend` (`decor_*`, `tiles_*`, `sockets_*`, `fog_*`, `portrait_normal`).
- `islands.json` enthält die Inselaufstellung aus `classes/menu-diorama.mjs`. Ändert sich dort `ISLANDS`, die Datei neu schreiben und die Sockel neu bauen (siehe unten).
- `water_ripple*.png`: kachelbare Wassertextur, 128 px, in den GLBs eingebettet.
- `previews/`: Kontrollbilder (Inseln aus echten Kacheln mit Sockel und Probe-Deko, Deko-Set, Bach, Nebelfeld, Porträt).

```bash
"C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --factory-startup -P artifacts/designer-menu/blender/build_hexwerk3d.py -- decor tiles sockets fog portrait
```

Gruppen einzeln möglich, Editionen mit `--editions normal,sakura,halloween`. Danach `npm run generate-assets-index`.

`islands.json` nach einer Änderung an `ISLANDS` neu schreiben (dann `sockets` neu bauen):

```bash
node -e "import('./classes/menu-diorama.mjs').then(m=>require('fs').writeFileSync('artifacts/designer-menu/blender/islands.json',JSON.stringify(m.ISLANDS.map(i=>({side:i.side,seed:i.seed,tiles:i.tiles.map(t=>[t[0],t[1],t[4]])})))))"
```

## Konventionen

Konventionen wie in `docs/ASSET_SPEC.md`:
- Hex-Umkreisradius 1, spitz nach Norden und Süden, Export +Y oben.
- Ursprung jeder Deko am Fuß auf Höhe 0.
- Vorne ist three.js +Z (Kamera). Licht kommt warm von vorne rechts, Gegenlicht kühl von hinten links.
- Alle Materialien sind doppelseitig und flach schattiert, ohne Fototexturen. Nur das Wasser hat eine kleine Farbtextur.

Gleiche Dateinamen gibt es im Editionsordner (`assets/sakura/...`, `assets/halloween/...`). Fehlt eine Variante, gilt die normale Fassung (`HexAssetEdition.paths`).

## Deko-Set `assets/decor/`

Die Größen sind in Kacheleinheiten angegeben. Im Menü wie die Requisiten mit `TILE` (1,1) skalieren. Kein Teil ist höher als `tower_archer` (0,56).

| Datei | Höhe | Ersetzt Platzhalter / Inhalt | Sakura | Halloween |
| --- | --- | --- | --- | --- |
| `deco_pine_s/m/l` | 0,24 / 0,34 / 0,45 | Kegelbäume | – | dunkle Nadeln |
| `deco_tree_a/b` | 0,29 / 0,35 | Laubbaum schmal/breit | Kirschbaum | kahler Baum |
| `deco_bush` | 0,12 | Ikosaeder-Busch | rosa Busch | Kürbis |
| `deco_grass` | 0,09 | Grasbüschel | – | Olivgras |
| `deco_flowers` | 0,08 | Blumen, 3 Farben | Blütenblätter | Mini-Kürbisse |
| `deco_rock_a/b/c` | 0,09 / 0,19 / 0,12 | Felsen (klein, hoch, Gruppe), helle Oberkanten | wärmerer Stein | – |
| `deco_fence` | 0,13, Länge 0,31 entlang X | Zaunstück | – | – |
| `deco_torch` | 0,31 | Fackel, Flamme emissiv (`flame`, `flame_core`) | – | grünes Feuer |
| `deco_lantern` | 0,31, Laterne bei +X 0,085 | Laterne, Glas emissiv (`lantern_glow`) | Papierlaterne (`chochin`) | Kürbislaterne (`hw_glow`) |
| `deco_banner` | 0,33 | Banner mit Wappen, Tuch nach +X | Creme/Rot | Violett/Orange |
| `deco_bridge` | 0,16, Länge 0,62 entlang X | Holzbrücke, überspannt den Bach | – | – |
| `deco_pond` | Radius 0,47 | Teich-Platzhalter (`TILE·0,46`), Wasser `water` | – | Nachtwasser |
| `decor_rockIsle` | −0,55 … 0,30 | kleine Felsinsel mit Bäumen für den Außenbereich (#17) | Kirschbäume, Laterne | Kürbis |

### Platzhalter in `classes/menu-backdrop.js` ersetzen

Die Platzhalter in `menu-backdrop.js` werden durch die Modelle ersetzt, ohne Änderung an der Verteilung (`decor()`):
- **Sockel:** Die beiden Prismen je Kachel (Erde, Fels) und die Wandfelsen entfallen. Dafür kommt `decor/island_socket_left.glb` (`side −1`) bzw. `island_socket_right.glb` (`side 1`) einmal in `inner`: Position (0, 0, 0), Maßstab 1, keine Drehung. Die Sockel liegen schon in `inner`-Koordinaten: `axialToWorld(q, r, 1.1) − Inselmitte`, Höhe in Weltmaß.
- **Bäume, Büsche, Felsen:** Wo bisher Stamm und Kegel, Ikosaeder oder Dodekaeder sitzen, kommt das Modell am selben Punkt `(tx, top, tz)` hin, mit `scale = TILE·(0,9 … 1,15)` und zufälliger Drehung um Y. Felsen nur um Y drehen, sonst steht die flache Unterseite schief. Bäume: `deco_pine_*` oder `deco_tree_*` per `rnd()`.
- **Teich:** `deco_pond` bei `(x, top, z)`, Maßstab `TILE`.
- **Budget:** Kacheln und Requisiten belegen schon rund 13.000 (links) bzw. 13.700 (rechts) Dreiecke. Der Sockel bringt 1.565 bzw. 1.601 dazu, damit liegt die Insel bei 14.600 bzw. 15.300. Das Limit von 15.000 ist also schon ohne Deko ausgeschöpft. Deko pro Insel sparsam setzen; Richtwerte: Nadelbaum 100, Laubbaum 88–136, Busch 64, Fels 24–64 Dreiecke. Um das Limit sicher einzuhalten, müsste es vereinfachte Menü-Kacheln geben.

## Inselsockel `assets/decor/island_socket_{left,right}.glb`

Ein Modell je Insel mit 4 Materialien:
- `grass_meadow` in der Farbe der Editions-Kachel
- `soil_earth`
- `stone`
- `stone_ledge`

Jede Zelle schließt **exakt auf der Höhe ihrer Kachel** ab (Feld `height` in `ISLANDS`). Der Grasrand überdeckt die Kachelkante von außen um 2 %. Die Erdwand reicht unter die Kachelunterkante (−0,165) und läuft danach in eine graue Felsstufe und einen spitzen Felskörper bis etwa −2,0 aus.

Wände gibt es nur an den Kanten, die die Menükamera sieht: vorn und seitlich (Kanten 0, 3, 4, 5) sowie dort, wo eine Nachbarkachel tiefer liegt. Wird die Kamera gedreht, fehlen hinten Wände; dann `for e in (0, 3, 4, 5)` in `build_socket` auf alle sechs Kanten erweitern.

## Wasserlauf `assets/tiles/tile_river_{straight,curve,fall}.glb`

Die Bachkacheln sind wie Spielkacheln aufgebaut: Oberkante 0, Erde bis −0,15, Materialien `grass_meadow`, `soil_earth`, `water` sowie `stone` bzw. `foam` (Werte der jeweiligen Edition).

| Kachel | Bachkanten | Inhalt |
| --- | --- | --- |
| `tile_river_straight` | 0 und 3 | gerader Bach |
| `tile_river_curve` | 0 und 2 | Bogen wie `bigCurve` |
| `tile_river_fall` | von Kante 3 bis Kante 0 | Der Bach fällt an Kante 0 über die Inselkante bis −1,15, unten mit Gischt. Die Kachel so drehen, dass Kante 0 am Inselrand liegt. |

**Bewegung:** Das Wasser fließt immer zur Kante 0, und `u` läuft in Fließrichtung. Für die animierte Fassung `material.map.offset.x -= dt * 0.25` setzen; die Textur steht schon auf Wiederholen. Ohne Verschiebung ergibt sich die ruhige Fassung, z. B. bei „Bewegung reduzieren“. Der Wasserfall nutzt dieselbe Textur und fließt deshalb mit.

Die Bachkacheln haben keine Spielbedeutung und stehen nicht in `HexModelMap`.

## Nebelfeld `assets/tiles/tile_fog.glb`

Ersetzt die Fassung vom 21.10.2026 in allen drei Editionen.
- **Insel:** graue, facettierte Felsinsel auf Hex-Grundriss (Ecken auf Höhe 0, Unterseite −0,15), Felsbuckel, 4 Bäume.
- **„?“:** 0,58 hoch, als Modellteil `question_mark` mit Kontur, um 30° zur Spielkamera (+Z) geneigt.
- **Sakura:** Kirschbäume und Papierlaterne.
- **Halloween:** violetter Fels, dunkle Nadelbäume, Kürbis mit Glühen, grünlich leuchtendes „?“.

Umfang: 1.230 bis 1.430 Dreiecke, 6 bis 8 Materialien. Die Namen enthalten weder `grass` noch `soil`; das Spiel zeichnet Nebel ohnehin ohne Biom-Einfärbung.

## Turm-Porträt-Sockel `assets/decor/portrait_socket.glb`

- **Sockel:** Hex-Prisma mit Umkreisradius 0,42 und Höhe 0,29 (= 0,35 × Breite). Oben Gras mit hellerem Innenfeld, darunter Grasüberhang und Steinkante mit Fugen. 4 Materialien. Die Oberkante liegt auf 0: Das Turmmodell kommt unverändert in den Ursprung.
- **Kamera:** Die GLB enthält die Kamera `portrait_camera`: 50 mm, Sensor 36 mm (vertikales Sichtfeld 39,6°), 30° Neigung, Ecke zur Kamera. In three.js steht sie bei (0; 1,34; 1,91) und blickt auf (0; 0,24; 0).
- **Licht:** Sonne `portrait_key` in `#fff1d6` von vorne rechts, `portrait_rim` in `#a9c98f` von hinten links (KHR_lights_punctual). Die Stärke ggf. im Spiel nachregeln.
- **Ausgabe:** In der `.blend` ist 512 × 512 mit transparentem Hintergrund eingestellt. `previews/portrait_tower_archer.png` zeigt die Bildaufteilung.

## Noch offen

- WebP-Rückfallbilder der fertigen Menüszene (2560 × 1440, 1170 × 2532) und Modus-Illustrationen: erst sinnvoll, wenn `menu-backdrop.js` die Modelle lädt.
- Einbau in `menu-backdrop.js` (Platzhalter ersetzen, Wasser-Scroll) und ggf. Felsinseln im Spielfeld-Außenbereich.
