# Hexwerk UI-Design · Export

Exportiert aus der Design-Leinwand „AutoHex TD – Hexwerk UI“ (Stand 21.10.2026, Briefing `artifacts/designer-menu/BRIEFING.md`).
Alle Grafiken sind SVG ohne eingebackene Texte; Texte und Zahlen setzt der Code.

## Ordner

| Ordner | Inhalt | Briefing |
| --- | --- | --- |
| `brand/` | `wordmark_full.svg`, `wordmark_compact.svg`, `wordmark_mono.svg` (mono in `currentColor`), alle als reine Pfade ohne `<text>`, dazu `wordmark_*@2x.png` (mono hell `#f6f2e4`) | #1 |
| `hex/` | `hex_{gold,green,cream,fog}_{rim,groove,fill,shine}.svg` (je Ebene eine Datei, gleicher 866 × 1000-Rahmen), `hex_{familie}.svg` mit benannten Gruppen `#rim #groove #fill #shine`, `hex_rim_mono.svg` und `hex_groove_mono.svg` zum Umfärben (Fokus `#ffe198`), `hex_shape.svg` als Maske | #2, #3 |
| `icons/` | 75 Icons `icon_*.svg`, 24-px-Raster, eine Farbe (`currentColor`): Menü, HUD, Werte, Schadensfaktoren, Biome, Pfeile | #4, #16 |
| `towers/` | `icon_tower_{archer,catapult,chain,freeze,mine,ballista,flame,element,necromancer}.svg`, Gebäude `icon_building_{house,forge,market}.svg`, alle 38 Upgrade-Pfade `icon_path_<id>.svg` | #19 |
| `hud/` | `panel_{normal,highlight}.svg`, `phase_{build,wave,boss}.svg`, `capsule.svg`, `capsule_dropdown.svg`, `hex_small_{normal,hover,pressed,selected,disabled}.svg`, `price_tag.svg`, `price_button_{ready,expensive,locked}.svg`, `speed_{track,fill,knob}.svg`, `wave_start_{locked,ready,running}.svg`, `action_bar.svg`, `sell_{normal,confirm}.svg` | #6–13, #15 |
| `cards/` | `card_frame_{common,rare,epic,legendary}.svg`, `card_badge.svg` (`currentColor`), Straßenstücke `road_{straight,curve,cross,tee,deadEnd,crown}.svg` flach und `_tilt.svg` in Schrägsicht | #12/#14 |
| `tokens.css` | Farben, Schriften, Hex-Form als CSS-Variablen plus fertige Klassen: `.hx-panel`, `.hx-capsule`, `.hx-price`, `.hx-wave`, `.hx-sell`, `.hx-card[data-rarity]` | alle |
| `_source/` | Quelldateien der Leinwand (`*.dc.html`, `canvas.json`) als Nachschlagewerk für Maße und Layout aller Bildschirme | – |

## Nachlieferung (21.10.2026, zu `artifacts/designer-menu/NACHLIEFERUNG.md`)

| Punkt | Dateien |
| --- | --- |
| #3 Fehlende Icons | `icons/icon_{rules,base,resetView,portal,buildingSlot,spikes,resin,overload,tunnel,info,check,warning,compare,targetPriority,duoSwap,partner,sound,soundOff,fullscreen,shrine,treasure,boss}.svg` |
| #4 Upgrade-Pfade | `towers/icon_path_<id>.svg` für alle 38 Pfade, `icons/icon_ultimate.svg` als Abzeichen (oben rechts auf das Pfad-Icon legen) |
| #5 Ungewöhnlich | `cards/card_frame_uncommon.svg`, in `tokens.css` `--hx-uncommon` (#35b3a6) und `--hx-uncommon-badge` (#1b7a72), `.hx-card[data-rarity="uncommon"]`; kompaktes Abzeichen „UNGEW.“ |
| #6 Kartenmotive | `cards/overlay_{village,grove,watchtower,treasury,citadel,battlefield,highGround,buildingPlot,goldRoad,signal,mirror,soulFork}.svg` (200 × 200, Fuß bei y 140, zentriert über dem Straßenbild). `buildingPlot` gilt für Bauplatz, -viertel und -bezirk, `village` auch für royalVillage |
| #9 Zustände | `hud/capsule_warning.svg`, `hud/capsule_gain.svg`, `hud/phase_{reward,victory,defeat}.svg`, `hud/hex_small_locked.svg`, `cards/card_state_{invalid,selected}.svg`; CSS-Klassen `.hx-capsule.is-warning/.is-gain`, `.hx-panel.is-reward/.is-victory/.is-defeat`, `.hx-card.is-invalid` |
| #10 Spielfeld | `field/{select_tower,select_slot,range_circle,place_valid,place_invalid,drag_ghost,target_marker}.svg` in Draufsicht als Decal; `field/water_tile_1024.png` (nahtlos) + `water_tile.svg` + Shader-Vorschlag `field/water_shader.md` |
| #11 App-Icon | `brand/app_icon.svg`, `brand/app_icon_256.png`, `brand/app_icon.ico` (16–256 px), `brand/community_icon_184.png` |

Die Leinwand enthält dazu: das Nachlieferungsblatt, die acht Bildschirme aus #7 (Desktop und Handy), die Gruppen-Navigation fürs Handy (#8) und alle Steam-Formate (#11) in exakter Größe. Die Steam-Kapseln lassen sich dort über Teilen › Export als PNG speichern.

## Einbau

**Icons einfärben:** inline einsetzen oder als Maske, damit `currentColor` greift. Als `<img>` bleibt das Icon schwarz.

```html
<span class="icon" style="color:#f3c94c"><!-- Inhalt von icons/icon_coin.svg --></span>
```

```css
.icon-mask { background: currentColor; -webkit-mask: url(assets/uidesign/icons/icon_coin.svg) center / contain no-repeat; mask: url(assets/uidesign/icons/icon_coin.svg) center / contain no-repeat; }
```

**Hex-Knöpfe:** Ebenen übereinanderlegen (Rand, Rille, Füllung, Glanz) oder `hex_{familie}.svg` als Hintergrund nutzen. Für den Fokus `hex_rim_mono.svg` als Maske mit `background:#ffe198` über den Rand legen. Inhalte in der Sicherheitszone halten: mittig 70 % Breite, 55 % Höhe.

**Paneele, Phasenschild, Wellenstart:** im Code mit `.hx-panel` + `.hx-panel-inner` aus `tokens.css` bauen. Die SVGs in `hud/` zeigen dieselbe Form in fester Größe (für Bilder oder `border-image` mit Slice 12).

**Handkarten:** `.hx-card` mit `data-rarity="common|rare|epic|legendary"`; Bild ist `cards/road_*_tilt.svg` bzw. später das gerenderte Kachelbild.

## Schrift

Fraunces Black (Titel, Wortmarke) und Barlow Semi Condensed 600/700 (Bedienelemente), beide SIL Open Font License 1.1, liegen als WOFF2 in `assets/fonts/` (Quelle: github.com/google/fonts, `ofl/fraunces` und `ofl/barlowsemicondensed`), Lizenz in `assets/fonts/OFL.txt`.

- `Fraunces-Black.woff2`: Gewicht 900 fest, SOFT 0, WONK 0 (ruhige Buchstaben wie in der Referenz); die optische Größe (opsz 9–144) bleibt variabel, der Browser wählt sie mit `font-optical-sizing: auto` passend zur Schriftgröße.
- `BarlowSemiCondensed-SemiBold.woff2`, `BarlowSemiCondensed-Bold.woff2`: statisch.
- Alle drei auf Latein + Latin-1 (ä ö ü ß), Typografie-Zeichen, Pfeile und geometrische Formen reduziert (je 25–36 KB). Für weitere Sprachen neu erzeugen.

## Grenzen dieses Exports

- Nicht enthalten, weil 3D bzw. gerenderte Bilder: Menü-Diorama und Deko-Set (GLB/Blender), WebP-Rückfallbilder, Porträt-Sockel, Nebelfeld-Modell `tile_fog.glb`, Modus-Illustrationen. Die Leinwand zeigt dafür nur Entwürfe.
- `_source/*.dc.html` laufen nur in der Design-Leinwand (sie brauchen deren Laufzeit `support.js`); im Spiel nicht direkt verwendbar.
