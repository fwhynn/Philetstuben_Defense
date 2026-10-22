# AutoHex TD — Nachlieferung zum Hexwerk-Export

Stand: 22.10.2026 · Branch `menudesign`. Bezieht sich auf den Export in `assets/uidesign/` und das [Briefing](BRIEFING.md).

## Was aus dem Export eingebaut ist

Der Export ist im Spiel verbaut (`hexwerk.css`, geladen nach `assets/uidesign/tokens.css`):

- **Hauptmenü:** Wortmarke, Hex-Rahmen Gold/Grün/Nebel. Der Fokusrand besteht aus Rille, Füllung und Glanz als Einzelebenen plus `hex_rim_mono.svg` in `#ffe198`. Dazu alle Menü-Icons und die Fußleiste.
- **Spiel-HUD:**
  - Kleine Hex-Knöpfe (alle fünf Zustände) für Pause, Einstellungen, Regeln, Zoom, Türme bauen, Hilfen, Turm- und Biomleiste, Schließen.
  - Kapseln für die Ressourcen, das Phasenschild (Bau, Welle, Boss), Preisplaketten, die Aktionsleiste und das Tempo-Paneel (Griff aus `speed_knob.svg`).
  - Paneele, Kapseln, Phasenschild, Preis- und Verkaufen-Knöpfe, Wellenstart und Kartenrahmen sind wie in der README empfohlen mit den Werten aus `tokens.css` im Code gebaut (Abschrägung, Goldkante, Verläufe). Die gleichwertigen SVGs in `hud/` und `cards/` als `border-image` erzeugten bei kleinen Höhen sichtbare Nahtlinien.
  - Wellenstart in allen drei Zuständen.
- **Turmfenster:** Paneelrahmen, Preis-Knöpfe (bereit, zu teuer, gesperrt), Verkaufen (normal, Bestätigung), Werte-Icons und Schadensfaktoren. Die Upgrade-Icons für Salve und Scharfschütze sind eingebaut.
- **Handkarten:** Rahmen je Seltenheit, Abzeichen, Turmplatz-Icon. Das Straßenbild wird im Stil von `road_*_tilt.svg` aus der echten Kachelform erzeugt, damit Drehung und Sonderformen stimmen.
- **Turm- und Gebäude-Icons** in Turmleiste, Baumenü, Arsenal und Run-Vorbereitung; Gebäude auf cremefarbenem Hex.
- **Spielauswahl, Dialoge, Infofenster:** Paneel- und Hervorhebungsrahmen, Gold- und Grünknöpfe.

- **Schriften:** Titelschrift ist jetzt **Tektur Black** (statt Fraunces), Bedienschrift Barlow Semi Condensed 600/700; beide liegen in `assets/fonts/` und sind aktiv.
- **3D:** Inselsockel, Deko-Set (Bäume, Büsche, Gras, Blumen, Felsen, Zaun, Fackel, Laterne, Banner, Teich mit fließendem Wasser) und schwebende Felsinseln laufen im Menü-Hintergrund.

**Nicht direkt verwendet** (Inhalt ist anders abgedeckt):
- Die Rahmen-SVGs in `hud/` und `cards/` (siehe oben) sowie `action_bar.svg`: Der Trennstrich in der Mitte lässt sich nicht skalieren.
- Die einzelnen farbigen `_rim`-Dateien, `hex_groove_mono.svg` und `hex_shape.svg`: Die Form übernimmt `clip-path`.
- `wordmark_compact.svg` und `wordmark_mono.svg`: Als `<img>` fehlt die Schrift; siehe Punkt 2.
- Die statischen `road_*.svg`: Wir erzeugen die Karten dynamisch.

## Bitte nachliefern

### 1. Schriften
Erledigt: liegen in `assets/fonts/` und sind eingebunden.

### 2. Wortmarke als Pfade, neu in Tektur Black
Die Titelschrift ist jetzt Tektur Black. Bitte die Wortmarke darauf neu setzen (Prägung, Kontur und Glanz wie bisher) als `wordmark_full.svg`, `wordmark_compact.svg` und `wordmark_mono.svg` liefern, mit in Pfade umgewandelter Schrift, ohne `<text>`. Dann wirkt die Wortmarke überall gleich, auch als Bild, im Ladebildschirm und auf Steam.

### 3. Fehlende Icons (24-px-Raster, `currentColor`, gleicher Stil)

| Datei | Wofür | Heute |
| --- | --- | --- |
| `icon_rules.svg` | Spielregeln (Buch) | Patch-Notes-Symbol als Ersatz |
| `icon_base.svg` | Base-Ausbau (Festung) in der Kapselleiste | Hammer als Ersatz |
| `icon_resetView.svg` | „Zur Base“: Kamera zentrieren | Textknopf |
| `icon_portal.svg` | Gegnerportal-Plätze auf der Sackgasse | Wellenstart-Symbol als Ersatz |
| `icon_buildingSlot.svg` | Gebäudeplatz auf Karten | Haus als Ersatz |
| `icon_spikes.svg`, `icon_resin.svg`, `icon_overload.svg` | Die drei Verbrauchshilfen im Hilfen-Menü | nur Text |
| `icon_tunnel.svg` | Rettungstunnel | nur Text |
| `icon_info.svg`, `icon_check.svg`, `icon_warning.svg` | Hinweise, Bestätigung, Warnung in Dialogen | Text/Emoji |
| `icon_compare.svg` | „Vergleichen“ im Turmfenster | nur Text |
| `icon_targetPriority.svg` | Angriffsfokus | nur Text |
| `icon_duoSwap.svg`, `icon_partner.svg` | Duo: Karte wechseln, Partnerstatus | nur Text |
| `icon_sound.svg`, `icon_soundOff.svg`, `icon_fullscreen.svg` | Einstellungen (Ton, Vollbild für Steam) | – |
| `icon_shrine.svg`, `icon_treasure.svg`, `icon_boss.svg` | Landmarken, Bosswelle | – |

### 4. Upgrade-Pfad-Icons (36 fehlen)
Geliefert sind nur `icon_path_volley.svg` und `icon_path_sniper.svg`. Gleicher Stil, Dateiname `icon_path_<id>.svg`:

- **Bogenschütze:** arrowRain, eagleEye
- **Balliste:** boltStorm, dragonSlayer, harpoon, repeater
- **Katapult:** barrage, fortressBreaker, rockStorm, siege
- **Kettenblitz:** overload, storm, tempest, thunder
- **Element:** elementFire, elementTempest, elementTide, elementVolcano, elementWater, elementWind
- **Flamme:** firestorm, inferno, sunfire, wildfire
- **Frost:** absoluteZero, deepFrost, frostField, winter
- **Minenleger:** carpet, demolition, earthquake, minefield
- **Nekromant:** soulChoir, soulKeeper, soulLegion, soulLord

Dazu ein kleines **Ultimate-Abzeichen** (`icon_ultimate.svg`), das über das Pfad-Icon gelegt wird.

### 5. Seltenheit „Ungewöhnlich“
Das Spiel hat **fünf** Seltenheiten. Für „Uncommon/Ungewöhnlich“ fehlen `card_frame_uncommon.svg` sowie Farbwerte für Rand und Abzeichen in `tokens.css`. Betroffen sind 7 Karten (u. a. T-Kreuzung, Lange Straße, Bauplatz). Heute steht dort ein Platzhalter in Türkis.

### 6. Kartenmotive für Sonderkacheln
Unsere 42 Kartentypen zeigen das Straßenbild automatisch. Sonderkacheln brauchen zusätzlich ein kleines **Overlay-Piktogramm** über dem Straßenbild, als SVG im gleichen Schrägstil, zentriert im Hex:

| Overlay | Für die Karten |
| --- | --- |
| Dorf | village, royalVillage |
| Wald | grove |
| Wachturm | watchtower |
| Schatzkammer | treasury |
| Zitadelle | citadel |
| Schlachtfeld | battlefield |
| Anhöhe | highGround |
| Bauplatz, -viertel, -bezirk | buildingPlot, buildingQuarter, buildingDistrict |
| Goldroute | goldRoad |
| Signal | signalCross |
| Spiegel | mirrorJunction |
| Seelengabel | soulFork |

Alternativ rendern wir alle Karten aus den GLB-Kacheln. Dafür brauchen wir **eine Beispielkarte mit Kamerawinkel und Licht** als Vorgabe.

### 7. Bildschirme ohne eigenes Design
Diese Bildschirme haben heute nur den allgemeinen Paneel- und Knopfstil. Bitte je ein Layout, Desktop und Handy:
1. **Run-Vorbereitung** (Schwierigkeit, Festung, Turmauswahl, Vorlagen)
2. **Arsenal** (Turm-Leiste links, Forschungsbaum mit Stufe 2 → 3 → Ultimate)
3. **Kartenbelohnung** nach der Welle (3 Karten zur Wahl, Entfernen, Überspringen)
4. **Sieg, Niederlage und Run-Abschluss** mit Diamanten-Abrechnung und Statistik
5. **Bestenliste, Patch Notes, Account und Spielstand**
6. **Tutorial-Hinweis, Biom-Entdeckung, Tastenbelegungs-Tipp** (Infokarten mit Markierung)
7. **Turmbau-Menü** (Liste „Türme bauen“) und **Gebäudefenster**
8. **Duo**: Lobby, Partnerleiste, Wächter-Abstimmung

### 8. Hochformat und Querformat am Handy
`GameScreen.dc.html` enthält Hochformat- und Querformat-Vorgaben. Das Spiel nutzt unter 1100 × 600 px eine **kompakte Navigation mit vier aufklappbaren Gruppen** (Menü, Werte, Türme, Biome), damit auf kleinen Bildschirmen Platz für das Spielfeld bleibt. Bitte das Handy-Layout auf diese Gruppen abstimmen oder ausdrücklich sagen, dass die Gruppen entfallen sollen.

### 9. Fehlende Zustände
- Kapsel **Warnung** (wenig Leben, Gold reicht nicht) und **Zuwachs** (kurzes Aufleuchten bei +Gold).
- Phasenschild für **Belohnung, Sieg und Niederlage**.
- Kleiner Hex **gesperrt mit Schloss** (heute: deaktiviert ohne Schloss).
- **Ausgewählte Karte, nicht platzierbar** (rot markiert mit Grund).

### 10. Spielfeld-Grafik
- Auswahlring für Turm und Bauplatz, Reichweitenkreis, Vorschau beim Hex-Legen (gültig/ungültig) im Hexwerk-Stil.
- Drag-Vorschau eines Turms (Geist) und Ziel-Markierung für Verbrauchshilfen.
- **Wasserfläche:** Der Hintergrund ist jetzt Blau `#3f97cf`. Für echte Wasseroptik bitte eine kachelbare Textur (1024 px) oder einen Shader-Vorschlag.

### 11. Steam (für den Release nötig)
- Store-Grafiken: Header-Kapsel 920 × 430, kleine Kapsel 462 × 174, Hauptkapsel 1232 × 706, vertikale Kapsel 748 × 896, Bibliothek 600 × 900, Bibliothek-Hero 3840 × 1240, Logo transparent 1280 × 720, Seitenhintergrund 1438 × 810.
- App-Icon im Hex-Stil: 256 × 256 (Windows `.ico` mit 16–256 px), Community-Icon 184 × 184.
- Mindestens 5 Screenshots 1920 × 1080 nach dem neuen Design (machen wir, sobald die Bildschirme stehen).

### 12. 3D
Eingebaut: Inselsockel und Deko-Set im Menü (`classes/menu-backdrop.js`). Nicht eingebaut: Wasserlauf-Kacheln (dafür müsste die Inselaufstellung und damit der Sockel neu gebaut werden) und der Porträt-Sockel (braucht den Render-Schritt für Turmporträts).

**Nebelfeld im Spiel:** Das neue `tile_fog.glb` wirkt aus der Spielkamera (steil von oben) wie eine flache graue Platte; das „?“ ist kaum lesbar. Bitte das „?“ stärker zur Spielkamera aufrichten (60–70°), höher setzen und den Fels weniger flach gestalten.

Weiterhin offen: Nebelfeld `tile_fog.glb` als Felsinsel mit „?“, Turm-Porträt-Sockel, WebP-Rückfallbilder, Modus-Illustrationen.
