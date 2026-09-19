# Modellspezifikation für 3D-Assets (glTF/.glb)

> Für die neuen Türme (Minenleger, Balliste, Flammenturm), die fünf Gegner und die Gebäude siehe [ASSET_SPEC_v2.md](ASSET_SPEC_v2.md).

Damit deine Modelle ohne Nacharbeit zur Spiellogik passen. Alle Maße sind aus `map.js` abgeleitet. Das Spiel skaliert später einheitlich (Faktor 54), du modellierst also im kleinen Maßstab.

## Allgemein

- **Format:** `.glb`, Export mit „+Y Up“ (Blender-Standard). In Blender modelliert man von oben mit **X = Osten, Y = Norden**.
- **Einheit:** Hex-Umkreisradius = **1,0**. Das Hex ist *pointy-top* (Spitze zeigt nach Norden/Süden). Kante-zu-Kante-Breite = 1,732.
- **Ursprung:** Mitte des Hex, Oberkante des Bodens bei **Höhe 0**. Boden/Sockel darf nach unten bis ca. −0,15 gehen.
- **Ausrichtung:** Alle Tiles in **Rotation 0** modellieren. Das Spiel dreht sie in 60°-Schritten selbst (gegen den Uhrzeigersinn von oben).
- **Material:** Wenige Materialien oder Vertex-Colors, keine großen Texturen. Stil: weiche Low-Poly-Formen, warme Farben (Dorfromantik). Richtwert: Tile unter ca. 3 000 Dreiecke, Turm unter ca. 2 000.
- **Dateinamen:** kleingeschrieben, wie unten angegeben. Ablage später in `assets/tiles/`, `assets/towers/`, `assets/buildings/`.

## Tiles

### Straßen
- Die Straße beginnt in der Hexmitte und endet **genau in der Mitte der Hexkante**: Abstand 0,866 vom Zentrum.
- Straßenbreite **0,33**, Straßenoberfläche bündig mit der Kante des Tiles (gleiche Höhe an allen Kanten), damit Nachbarn nahtlos anschließen.
- Nur Kanten mit Straße dürfen dort eine Straße haben. Sonst Wiese/Wald usw. Nichts darf über die Hexgrenze hinausragen (Deko bis ca. Radius 0,9).
- Kanten sind nummeriert wie im Spiel. Bei Rotation 0 liegt Kante 0 im **Osten**, dann gegen den Uhrzeigersinn: 1 = Nordost, 2 = Nordwest, 3 = West, 4 = Südwest, 5 = Südost.
- Die Straßenmittellinie soll dem Spiel-Wegverlauf folgen, da Gegner darauf laufen. Gerade = Linie. Kurven = weiche Bögen über einen Punkt zwischen Mitte und Kanten. `longRoad` = leicht geschlängelt.

### Turm- und Gebäudeplätze
Flache Bauplattformen (Sockel/Steinplatte, Radius ca. 0,22), auf denen später der Turm steht. Als Objekt `tower_slot_1`, `tower_slot_2` (Gruppe aus Sockel und Platte) modellieren, Platte auf Höhe ca. 0,03–0,05.

**Die Position bestimmt das Spiel, nicht das Modell.** Der Renderer verschiebt die Plattformen an die Spielpositionen aus `map.js` (`SLOT_LAYOUTS`, je Hexart eigene Lage, damit Türme neben der Straße statt darauf stehen). Die Position im Modell ist nur ein Platzhalter; wichtig sind Anzahl (`tower_slot_N` für alle Plätze der Karte) und die Höhe. Der Gebäudeplatz bleibt bei (0, 0,56 Süd), ein quadratischer Platz von ca. 0,33 Breite (`building_pad`).

Beim Modellieren der Deko (Büsche, Steine, Bäume) beachten: Die Spielpositionen der Türme stehen in `SLOT_LAYOUTS` in `map.js`. Plattformen dort nicht mit großer Deko zustellen.

### Benötigte Tiles

Priorität 1 – Grundformen (Kartenkennung = Dateiname `tile_<id>.glb`):

| Datei | Straßenkanten | Slots | Besonderheit |
|---|---|---|---|
| `tile_base` | mind. 1 (bei Rotation 0: 0) | – | Festung/Burg, zentral |
| `tile_straight` | 0, 3 | 1 | Wiese |
| `tile_smallCurve` | 0, 1 | 1 | enge Kurve |
| `tile_bigCurve` | 0, 2 | 1 | weite Kurve |
| `tile_tee` | 0, 2, 4 | 2 | Y-Kreuzung |
| `tile_tJunction` | 0, 2, 3 | 2 | T-Kreuzung |
| `tile_cross` | 0, 1, 3, 4 | 2 | Kreuzung |
| `tile_fullCross` | 0–5 | 2 | Sechserkreuzung |
| `tile_village` | 0, 2 | 1 + Gebäudeplatz | Dorf, Häuschen |
| `tile_empty` | 0, 3 | 2 | weites Land |
| `tile_longRoad` | 0, 3 | 2 | geschlängelt |

Priorität 2 – Sonderkarten (gleiche Straßenformen, eigene Optik):

| Datei | Kanten | Slots | Optik-Idee |
|---|---|---|---|
| `tile_grove` | 0, 2 | 1 | Wald |
| `tile_highGround` | 0, 2, 4 | 1 | Hügel/Fels |
| `tile_treasury` | 0, 3 | 0 | Handelsposten, Waren |
| `tile_battlefield` | 0, 3 | 1 | Kampfplatz, Banner |
| `tile_watchtower` | 0, 2 | 2 | Wachturm-Ruine |
| `tile_citadel` | 0, 2, 4 | 2 | prächtige Bastion |
| `tile_royalVillage` | 0, 3 | 1 + Gebäudeplatz | goldenes Dorf |
| `tile_warCross` | 0, 1, 3, 4 | 2 | Kriegslager |

Priorität 3 – Sonderfelder und Nebel:
- `landmark_treasure`, `landmark_shrine`, `landmark_boss`: Boss-Feld hat immer sechs Straßenöffnungen und keine Slots. Schatz/Shrine bekommen die Straßenformen gerade/Kurve/Y/T mit 1 Slot (Details werden geklärt, wenn wir dort sind).
- `tile_fog`: leeres, neblig-dunkles Hex ohne Straße für nicht erkundete Nachbarfelder.
- `tile_rescue`: schlichtes Hex ohne Slots (Rettungshex, Straßenform variiert).

Tipp: Wenn du Zeit sparen willst, baue pro **Straßenform** ein neutrales Basistile und die Sonderoptik (Wald, Hügel usw.) als getrennte Deko-Objekte. Dann sage mir Bescheid und ich kombiniere sie im Code.

## Türme

- Ursprung = Mitte des Sockels auf Höhe 0. Grundfläche max. Radius **0,20**, Höhe ca. **0,5–0,8**.
- Wichtige bewegliche Teile als **eigene Objekte mit festem Namen** (damit ich sie animieren kann):
  - `turret`: Teil, das sich zum Gegner dreht (Bogen, Katapult-Ausleger-Plattform, Blitzspule). Pivot in der Drehachse, senkrecht.
  - `arm` (nur Katapult): schwenkender Wurfarm.
  - `aura` (nur Freeze, optional): Kristall/Ring, der pulsiert.

Basistürme:

| Datei | Idee |
|---|---|
| `tower_archer` | Holz-/Steinturm mit Bogenschütze/Bogenplattform |
| `tower_catapult` | Steinsockel mit Katapult |
| `tower_chain` | Turm mit Spule/Blitzkristall |
| `tower_freeze` | Eiskristallturm |

Upgrades (später): zwei Zweige pro Turm und je eine Endstufe. Am einfachsten sind Varianten mit dem Namen `tower_<turm>_<upgradeId>.glb`. IDs aus `data.js`:

- Archer: `marksman` → `eagleEye`, `volley` → `arrowRain`
- Katapult: `siege` → `fortressBreaker`, `barrage` → `rockStorm`
- Kettenblitz: `storm` → `tempest`, `overload` → `thunder`
- Freeze: `deepFrost` → `absoluteZero`, `frostField` → `winter`

Alternativ nur Zusatzteile (`upgrade_marksman.glb` usw.), die auf den Basisturm gesetzt werden.

## Gegner

Thema: **Fantasy** (Goblins, Orks). Der Boss ist der **Obsidian-Wächter** (passt zum Boss-Feld mit Obsidian-Spitzen und Glutkern).

- **Ursprung:** Mitte der Füße auf Höhe 0. **Blickrichtung +X** (Osten) bei Rotation 0. Das Spiel dreht den Gegner selbst in Laufrichtung.
- Die Straße ist 0,33 breit; normale Gegner sollen darauf passen. Ablage: `assets/enemies/`.
- Farben klar unterscheidbar halten, sie werden von weitem in Gruppen gesehen.

| Datei | Figur | Höhe | max. Breite | Dreiecke |
|---|---|---|---|---|
| `enemy_normal` | Goblin-Krieger, schlichte Silhouette, grüne Haut | ca. 0,30 | 0,28 | bis ca. 600 |
| `enemy_armored` | Ork mit Rüstung und Schild, breiter und schwerer, grau-grün mit Stahl | ca. 0,34 | 0,32 | bis ca. 800 |
| `enemy_swarm` | Kleiner Goblin-Läufer/Kobold, sehr wenige Flächen, wirkt flink | ca. 0,16 | 0,18 | bis ca. 300 |
| `enemy_boss` | Obsidian-Wächter mit orange glühendem Kern (Emissive-Material erlaubt), darf breiter als die Straße sein | ca. 0,70 | 0,55 | bis ca. 1500 |

**Laufanimation (optional):** Arme und Beine als eigene Objekte `leg_l`, `leg_r`, `arm_l`, `arm_r` benennen. **Pivot (Drehpunkt) im Gelenk** (Hüfte bzw. Schulter, nicht in der Mitte des Gliedes). Sie schwingen dann gegengleich vor und zurück. Ohne diese Objekte wippt der Gegner nur leicht beim Laufen.

Nicht modellieren muss man: Lebensbalken (schwebt automatisch über dem Kopf) und den Freeze-Effekt (der Renderer legt einen blauen Ring um verlangsamte Gegner). Fehlende Gegnermodelle ersetzt das Spiel durch farbige Kugeln; einzelne Dateien können also nach und nach kommen.

## Gebäude (später)
`building_house`, `building_forge`, `building_market`: passen auf den quadratischen Gebäudeplatz (ca. 0,33 breit, Höhe bis 0,4).

## Reihenfolge-Empfehlung
1. `tile_straight`, `tile_smallCurve`, `tile_base`, `tower_archer` als Stilprobe schicken. Dann kann ich den Three.js-Renderer bauen und dir zeigen, wie es im Spiel aussieht.
2. Danach den Rest der Tiles und Türme.
