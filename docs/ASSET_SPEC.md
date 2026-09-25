# Modellspezifikation für 3D-Assets (glTF/.glb)

Gesamtreferenz für alle Modelle von AutoHex TD: Tiles, Festungs-Basen, Türme, Gegner, Gebäude und Effekte, jeweils in der normalen Edition und der Sakura-Edition. Stand: 25.09.2026. Ersetzt die früheren Einzelspezifikationen v1 bis v4.

Alle Maße sind aus dem Spielcode abgeleitet (`map.js`, `data.js`, `model-map.js`, `three-renderer.js`). Wo „das Spiel“ etwas tut, ist das im Code umgesetzt und muss nicht modelliert werden.

## Inhalt

1. Allgemeine Regeln
2. Ablage und Dateinamen
3. Tiles
4. Festungs-Basen
5. Türme
6. Gegner
7. Gebäude und Effekte
8. Sakura-Edition
9. Prüfung und Lieferung

---

## 1. Allgemeine Regeln

- **Format:** `.glb`, Export „+Y Up“ (Blender-Standard). In Blender gilt **X = Osten, Y = Norden, Z = oben**.
- **Einheit:** Hex-Umkreisradius = **1,0**. Das Hex ist *pointy-top* (Spitze nach Norden/Süden), Kante-zu-Kante 1,732. Das Spiel skaliert einheitlich mit Faktor 54, du modellierst also klein.
- **Ursprung:**
  - Tiles und Basen: Hexmitte, Oberkante des Bodens auf Höhe 0. Der Boden darf bis etwa −0,15 nach unten reichen.
  - Türme und Gebäude: Mitte des Sockels bzw. der Grundfläche auf Höhe 0.
  - Gegner: Mitte der Füße auf Höhe 0.
- **Ausrichtung:** Tiles in **Rotation 0** modellieren, das Spiel dreht in 60°-Schritten. Türme, Base-Waffen und Gegner zeigen mit Schuss- bzw. Blickrichtung nach **+X (Osten)**.
- **Stil:** weiche Low-Poly-Formen, warme Farben (Dorfromantik), wenige Materialien oder Vertex-Colors, keine großen Texturen. Emissive ist bei Glut, Magie, Runen und Heilung erlaubt.
- **Benannte Teile:** Verlangt diese Spec einen Objekt- oder Materialnamen (`turret`, `leg_l`, `road`, `element_core` …), muss er **exakt** stimmen. Der Pivot liegt in der Drehachse bzw. im Gelenk, nicht in der Mitte des Teils.
- **Fehlende Dateien** erzeugen keinen Fehler. Das Spiel nutzt dann ein Ersatzmodell (z. B. Turm-Upgrade → Basisturm, Sonder-Tile → Grundform, Sakura → normal). Dateien können also einzeln geliefert werden.

## 2. Ablage und Dateinamen

| Ordner | Dateiname | Inhalt |
|---|---|---|
| `assets/tiles/` | `tile_<kartenId>.glb`, `tile_base_<festung>.glb`, `tile_fog.glb`, `tile_rescue.glb`, `tile_base.glb` | Hex-Tiles und Festungs-Grundmodelle |
| `assets/bases/` | `base_<festung>_<walls\|weapon>_<stufe>.glb` | Ausbaustufen der Festungen (Aufsatzteile) |
| `assets/landmarks/` | `landmark_<boss\|shrine\|treasure>.glb` | Sonderfelder |
| `assets/towers/` | `tower_<turm>.glb`, `tower_<turm>_<upgradeId>.glb` | Türme und ihre Upgrades |
| `assets/enemies/` | `enemy_<typ>.glb`, `enemy_boss_<biom>.glb` | Gegner und Bosse |
| `assets/buildings/` | `building_<house\|forge\|market>.glb` | Gebäude |
| `assets/effects/` | `mine_pickup.glb` | Mine auf der Straße |
| `assets/sakura/<ordner>/` | gleiche Namen wie oben | Sakura-Edition (Abschnitt 8) |

Dateinamen kleingeschrieben bis auf die Kennungen aus dem Code (`tile_royalBend`, `enemy_elementCarrier` usw.), die exakt so übernommen werden.

---

## 3. Tiles

### 3.1 Kanten und Straßen

- Kanten bei Rotation 0: **0 = Osten**, dann gegen den Uhrzeigersinn 1 = Nordost, 2 = Nordwest, 3 = West, 4 = Südwest, 5 = Südost. Die Kantenmitte liegt 0,866 vom Zentrum.
- Eine Straße beginnt in der Hexmitte und endet **genau in der Kantenmitte**. Nur Kanten mit Straße laut Kartendaten dürfen eine Straße haben. Nichts ragt über die Hexgrenze (Deko bis Radius etwa 0,9).
- **Die Straße besteht aus zwei flachen, übereinanderliegenden Teilen**, gemeinsam zentriert:

| Teil | Objektname | Breite quer zur Straße | Höhe (Y) | Material | Farbe (RGB 0–1) |
|---|---|---|---|---|---|
| Bankett (breiter, dunkler, unten) | `road_verge_N` | **0,47** | 0,006 | `road_verge` | 0,440 / 0,270 / 0,109 |
| Fahrbahn (schmaler, heller, oben) | `road_surface_N` | **0,33** | 0,014 | `road` | 0,716 / 0,497 / 0,223 |

- Alle Straßenteile gehören in eine Knotengruppe namens **`road`**. Damit kann das Spiel die Straße ausblenden und selbst zeichnen, wo die Form variiert (Rettungshex, Base bei „Zwei Fronten“).
- **Gegner laufen auf der Mittellinie der Kartenstraße.** Gerade und Kreuzungen: gerade Linien zur Mitte. Große Kurve (Kanten 0/2): weicher Bogen wie in `tile_bigCurve`. Kleine Kurve: enger Bogen. Lange Straße: Zickzack über (0,50 | 0), (0,26 | 0,20), Mitte, (−0,26 | −0,20), (−0,50 | 0). Minenstraße: bewusst andere Zacken, große Zacke (0,16 | 0,40) und kurze Zacke (−0,40 | −0,17) über (0,56 | 0), (−0,18 | 0) und (−0,60 | 0). Alle Punkte in Blender-Koordinaten (X | Y). Eine abweichende Form im Modell lässt Gegner neben der Straße laufen.

### 3.2 Boden und Biome

- Einheitliche Wiese: Material `grass_meadow` (oder `grass`), 0,366 / 0,521 / 0,133, Rauheit 1. Seitenkante `grass_side` 0,228 / 0,355 / 0,083. Ausnahme: `tile_empty` mit bewusst trockenem `grass_dry`.
- **Biom-Einfärbung:** Jedes Material, dessen Name `grass`, `soil` oder `foliage` enthält, färbt das Spiel im Dünenmeer, Sturmhochland und in den Aschelanden automatisch um. Wiese, Erde und Büsche also so benennen, Stein, Holz, Dächer und Metall **nicht**.

### 3.3 Turm- und Gebäudeplätze

- Turmplätze als Gruppen `tower_slot_1`, `tower_slot_2` (Sockel plus Platte, Radius etwa 0,22). Normale Plattenhöhe 0,03–0,05.
- **X/Z-Position bestimmt das Spiel** (Tabelle 3.5), **die Höhe kommt aus dem Modell.** Ein erhöhter Sockel hebt den Turm automatisch mit an.
- Der Sockel mit Treppe sollte mit dem Turm (Radius bis 0,20, siehe Abschnitt 5) **frei von Straße, Deko und Hexrand** bleiben. Die Treppe darf bis an den Straßenrand reichen.
- Gebäudeplatz `building_pad`: quadratisch etwa 0,33 breit, üblich bei (0 | −0,56), also im Süden. Nicht mit Deko zustellen.

### 3.4 Deko und Effekt-Vokabular

- Deko (Blumen, Büsche, Steine, Bäume) sitzt in den freien Sektoren zwischen den Straßenenden, im Radius 0,55–0,85, **nie auf oder direkt neben einem Turmplatz**. Hohe Deko (Bäume, Laternen, Bambus) braucht mindestens 0,25 Abstand zur Turmmitte.
- Deko möglichst als einzelne Objekte statt verschmolzener Meshes.
- **Karten mit Bonus zeigen ihn im Modell:**
  - **Reichweite** (`towerRange`) → erhöhter Turmplatz: +15 % Sockel 0,10–0,14; +20–25 % Sockel 0,16–0,20; +30–40 % Sockel 0,22–0,28.
  - **Schaden** (`towerDamage` oder turmspezifisch) → kleine Rune, Wimpel oder Relief am Rand des Sockels in der Farbe des begünstigten Turms (unter 0,08 hoch, verdeckt den Turm nicht). Allgemeiner Schadensbonus: Kriegsbanner oder gekreuzte Waffen in Rot-Orange.
  - **Einkommen** (`income`) → Kisten, Säcke, Münzhaufen in Gold. Mehr Einkommen, mehr Ware.

### 3.5 Alle Karten

Turmplätze in Blender-Koordinaten (X | Y), bei Rotation 0, in der Reihenfolge `tower_slot_1`, `tower_slot_2`. „→“ bedeutet: nutzt das Modell einer Grundform, eigene Datei möglich.

**Grundformen und Standardkarten**

| Karte | Name | Seltenheit | Straßenkanten | Plätze | Turmplätze | Modell |
|---|---|---|---|---|---|---|
| `straight` | Gerade | Common | 0, 3 | 1 | (−0,26 \| 0,44) | `tile_straight` |
| `smallCurve` | Kleine Kurve | Common | 0, 1 | 1 | (−0,11 \| 0,07) | `tile_smallCurve` |
| `bigCurve` | Große Kurve | Common | 0, 2 | 1 | (0,04 \| −0,59) | `tile_bigCurve` |
| `tee` | Y-Kreuzung | Uncommon | 0, 2, 4 | 2 | (0,26 \| 0,44) · (0,26 \| −0,44) | `tile_tee` |
| `tJunction` | T-Kreuzung | Uncommon | 0, 2, 3 | 2 | (−0,56 \| −0,44) · (−0,07 \| −0,44) | `tile_tJunction` |
| `cross` | Kreuzung | Rare | 0, 1, 3, 4 | 2 | (−0,26 \| 0,44) · (0,26 \| −0,44) | `tile_cross` |
| `fullCross` | Sechserkreuzung | Rare | 0–5 | 2 | (0 \| 0,78) · (0 \| −0,78) | `tile_fullCross` |
| `empty` | Weites Land | Uncommon | 0, 3 | 2 | (−0,26 \| 0,44) · (−0,56 \| −0,44) | `tile_empty` |
| `longRoad` | Lange Straße | Uncommon | 0, 3 | 2 | (0,22 \| 0,59) · (−0,22 \| −0,59) | `tile_longRoad` |
| `village` | Dorfstraße | Rare | 0, 2 | 1 + Gebäude | (0,07 \| 0,74) | `tile_village` |
| `grove` | Waldkurve | Rare | 0, 2 | 1 | (0,04 \| −0,59) | `tile_grove` |
| `treasury` | Handelsstraße | Rare | 0, 3 | 0 | – | `tile_treasury` |
| `battlefield` | Kampfstraße | Epic | 0, 3 | 1 | (−0,26 \| 0,44) | `tile_battlefield` |
| `highGround` | Höhenkreuzung | Epic | 0, 2, 4 | 1 | (0,26 \| 0,44) | `tile_highGround` |
| `watchtower` | Wachtkurve | Epic | 0, 2 | 2 | (0,37 \| 0,52) · (−0,16 \| −0,26) | `tile_watchtower` |
| `citadel` | Bastionskreuzung | Legendary | 0, 2, 4 | 2 | (0,26 \| 0,44) · (0,26 \| −0,44) | `tile_citadel` |
| `royalVillage` | Königsstraße | Legendary | 0, 3 | 1 + Gebäude | (−0,26 \| 0,44) | `tile_royalVillage` |
| `warCross` | Kriegskreuzung | Legendary | 0, 1, 3, 4 | 2 | (−0,26 \| 0,44) · (0,26 \| −0,44) | `tile_warCross` |

**Belohnungskarten mit Bonus**

| Karte | Name | Seltenheit | Kanten | Plätze | Turmplätze | Bonus / Optik |
|---|---|---|---|---|---|---|
| `supplyRoad` | Versorgungsweg | Rare | 0, 3 | 1 | (−0,26 \| 0,44) | +2 Gold: eine Warenkiste |
| `goldRoad` | Goldroute | Epic | 0, 3 | 1 | (−0,26 \| 0,44) | +4 Gold: Kiste und Münzhaufen |
| `siegeRoad` | Belagerungsgerade | Rare | 0, 3 | 1 | (−0,26 \| 0,44) | Katapult `#c88954`: Wagenrad-Relief |
| `ballistaRoad` | Schützenlinie | Rare | 0, 3 | 1 | (−0,26 \| 0,44) | Balliste `#d9c08b`: Bolzenspitze |
| `mineRoad` | Minenstraße | Rare | 0, 3 | 2 | (0,20 \| −0,26) · (−0,40 \| 0,42) | Minenleger `#e6a75f`: Fass-Relief; eigener Zickzack (siehe 3.1), Sockel 0,07 ohne Treppe |
| `lightningFork` | Blitzgabel | Rare | 0, 2, 4 | 2 | (0,26 \| 0,44) · (0,26 \| −0,44) | Kettenblitz `#7fc6ff`: Blitzrune |
| `frostBend` | Frostbogen | Rare | 0, 1 | 1 | (−0,11 \| 0,07) | Freeze `#a4eef5`: Eiskristall, erhöhter Sockel |
| `emberBend` | Glutknick | Rare | 0, 1 | 1 | (−0,11 \| 0,07) | Flammenturm `#ff754b`: Glutschale |
| `soulFork` | Seelenabzweig | Rare | 0, 2, 3 | 2 | (−0,56 \| −0,44) · (−0,07 \| −0,44) | Nekromant `#a6edb4`: Schädel-Rune |
| `elementCross` | Elementkreuzung | Rare | 0, 1, 3, 4 | 2 | (−0,26 \| 0,44) · (0,26 \| −0,44) | Elementturm; → `tile_cross` |
| `sentryBend` | Späherbogen | Epic | 0, 1 | 1 | (−0,11 \| 0,07) | +30 % Reichweite: erhöhter Sockel |
| `battleFork` | Veteranengabel | Epic | 0, 2, 4 | 2 | (0,26 \| 0,44) · (0,26 \| −0,44) | +20 % Schaden: Kriegsbanner |
| `signalCross` | Signalkreuzung | Epic | 0, 1, 3, 4 | 2 | (−0,26 \| 0,44) · (0,26 \| −0,44) | +20 % Reichweite: erhöhter Sockel |
| `warBend` | Drachenbogen | Legendary | 0, 1 | 1 | (−0,11 \| 0,07) | +40 % Schaden, +20 % Reichweite |
| `crownCross` | Kronenkreuzung | Legendary | 0–5 | 2 | (0 \| 0,78) · (0 \| −0,78) | +20 % Schaden und Reichweite; schlanke Sockel (Radius ≤ 0,2) |
| `royalBend` | Königsbogen | Legendary | 0, 2 | 1 + Gebäude | (−0,29 \| −0,15) | +5 Gold, +20 % Reichweite |

**Karten mit vom Spiel gezeichneter Straße** (im Modell **keine** Straße, nur Terrain und Deko):

| Karte | Name | Kanten | Plätze | Turmplätze | Optik |
|---|---|---|---|---|---|
| `mirrorJunction` | Spiegel-Abzweig | 0, 3, 4 | 2 | (−0,56 \| 0,44) · (−0,07 \| 0,44) | Wegweiser an der Gabelung |
| `fanJunction` | Fächerkreuzung | 0, 1, 2 | 2 | (−0,41 \| −0,46) · (0,30 \| −0,46) | Rastplatz mit Feuerstelle |
| `sideCross` | Seitenkreuzung | 0, 1, 2, 3 | 2 | (−0,41 \| −0,46) · (0,30 \| −0,46) | Zaun, Karren am Rand |
| `deadEnd` | Bastionssackgasse | 0 | 2 + Portal-Platz | (−0,26 \| 0,44) · (−0,26 \| −0,44) | Palisade riegelt die Straße ab |

`rescueTunnel`, `buildingPlot`, `buildingQuarter` und `buildingDistrict` zeichnet das Spiel komplett selbst.

### 3.6 Sonderfelder und System-Tiles

- `landmark_boss`: Boss-Feld, sechs Straßenöffnungen, keine Turmplätze (Obsidian-Spitzen, Glutkern).
- `landmark_shrine`, `landmark_treasure`: Hauptobjekt (Schrein bzw. Schatztruhe) plus Kisten. Das Spiel setzt sie als Deko auf das jeweilige Straßen-Tile.
- `tile_fog`: nebliges, dunkles Hex ohne Straße für unerkundete Felder.
- `tile_rescue`: schlichtes Hex ohne Turmplätze (Rettungshex, Straße als Gruppe `road`).
- `tile_base`: neutrale Festung, nur Ersatz, falls ein Festungsmodell fehlt.

---

## 4. Festungs-Basen

Vor jedem Durchlauf wählt man eine von drei Festungen. Jede hat ihr eigenes Grundmodell, dazu kaufbare Ausbaustufen, die als Aufsatzteile sichtbar werden.

| Kürzel | Festung | Thema | Spielwerte |
|---|---|---|---|
| `standard` | Standardfestung | klassische Steinburg mit Bergfried | 20 Leben, je 2 Ausbaustufen |
| `builder` | Festungsbauer | Baumeister: Gerüste, Kran, Werkstatt, Mechanik | 20 Leben, Ausbau 25 % günstiger, **3 Ausbaustufen** |
| `merchant` | Händlerstadt | Marktstände, Lagerhaus, Waren, Banner; wenig militärisch | 15 Leben, schwächere Waffe, +2 Gold je Welle |

| Ausbau | Wirkung | Stufe 1 | Stufe 2 | Stufe 3 (nur `builder`) |
|---|---|---|---|---|
| **Mauern** (`walls`) | +5 / +5 / +10 Leben | Palisade oder niedrige Mauer | Steinmauer mit Türmen | Doppelmauer, Bastionen |
| **Base-Waffe** (`weapon`) | Festung schießt selbst | kleine Schützenplattform | größere Waffe, z. B. Balliste | schweres Geschütz |

**Dateien:** `tile_base_<festung>.glb` (komplettes Tile) sowie `base_<festung>_walls_<stufe>.glb` und `base_<festung>_weapon_<stufe>.glb` (nur die jeweiligen Teile), zusammen 17 Dateien.

- **Aufsatzteile** im selben Koordinatensystem wie das Grundmodell. Das Spiel legt sie ohne Verschiebung auf. Eine höhere Stufe **ersetzt** die niedrigere derselben Art. Mauer und Waffe werden **kombiniert** und dürfen sich nicht durchdringen.
- **Straße:** eine Straße von der Mitte zur Ostkante (Gruppe `road`, Materialien `road`/`road_verge`), Tor nach Osten. Bei „Zwei Fronten“ blendet das Spiel sie aus und zeichnet zwei Straßen in zufällige Richtungen. Deshalb die Festung **kompakt in der Mitte** halten (Kern bis etwa 0,55 Radius, Mauern bis etwa 0,7) und rundherum Fläche frei lassen.
- **Waffe:** drehbarer Teil als Objekt **`turret`** (Pivot senkrecht in der Mitte, Schussrichtung +X), Mündung als leeres Objekt **`muzzle`**. Oben mittig, etwa 0,45–0,6 hoch. Die Waffe richtet sich im Spiel auf Gegner aus, hat Rückstoß, und Geschosse starten an der Mündung.
- **Höhe** möglichst unter 0,7. Boden, Erde und Grün mit `grass`/`soil`/`foliage` benennen (Biom-Einfärbung).

---

## 5. Türme

### 5.1 Allgemein

- Ursprung in der Sockelmitte auf Höhe 0. Grundfläche **Radius bis 0,20**; Ausleger, Decks und Bögen dürfen oben bis etwa 0,29 ausgreifen.
- **Höhe:** alle Türme und ihre Upgrades **höchstens 0,65**. Einzige Ausnahme ist die Balliste als höchster Turm (0,75–0,85), ihre Endstufen `dragonSlayer`/`boltStorm` bis etwa 0,90.
- **Bewegliche Teile:**
  - `turret` (Pflicht): dreht sich zum Ziel, Pivot in der senkrechten Achse, Schussrichtung +X. Alles andere bleibt fest.
  - `aura` (optional): pulsierendes Teil, z. B. Kristall oder Glut.
- **Upgrades:** jede Stufe ist eine **vollständige eigene Datei** `tower_<turm>_<upgradeId>.glb` (Basis kopieren, Silhouette und Akzente ändern). Die Änderung muss **von oben** erkennbar sein. Die zwei Zweige eines Turms unterscheiden sich schon in Stufe 1 in Silhouette **und** Farbe. Die Endstufe ist eine größere Version ihres eigenen Zweigs.
- Akzentfarben der Zweige stammen aus dem Spiel (`BRANCH_VISUALS`), damit Modell und Symbol zusammenpassen.

### 5.2 Übersicht

| Turm | Datei | Farbe | Idee | Zweig A: Stufe 1 → Endstufe | Zweig B: Stufe 1 → Endstufe |
|---|---|---|---|---|---|
| Bogenschütze | `tower_archer` | `#e7d89b` | Holz-/Steinturm mit Bogenplattform | `volley` → `arrowRain` (Fläche, Grün `#96d47c`) | `marksman` → `eagleEye` (Einzelziel, Gold `#f5d06e`) |
| Katapult | `tower_catapult` | `#c88954` | Wurfarm mit Steinkorb, durchschlägt 3 Gegner | `siege` → `fortressBreaker` (schwer, `#e99a5c`) | `barrage` → `rockStorm` (schnell, `#ffdca1`) |
| Kettenblitz | `tower_chain` | `#7fc6ff` | Blitzspule, Kristall | `storm` → `tempest` (mehr Ziele, `#93a5ff`) | `overload` → `thunder` (mehr Schaden, `#e2a1ff`) |
| Freeze | `tower_freeze` | `#a4eef5` | Eiskristall mit Aura | `deepFrost` → `absoluteZero` (stark, `#70d5ff`) | `frostField` → `winter` (weit, `#c0f6ea`) |
| Minenleger | `tower_mine` | `#e6a75f` | Bunker mit Mörserrohr, niedrigster Turm (0,45–0,55) | `demolition` → `earthquake` (schwer, `#ff9b55`) | `minefield` → `carpet` (schnell, `#d9bc72`) |
| Balliste | `tower_ballista` | `#d9c08b` | hoher Turm mit Riesenarmbrust | `harpoon` → `dragonSlayer` (schwer, `#e7d39e`) | `repeater` → `boltStorm` (schnell, `#d4b979`) |
| Flammenturm | `tower_flame` | `#ff754b` | Brennkessel mit Düse, Emissive-Glut | `inferno` → `sunfire` (groß, `#ff7448`) | `wildfire` → `firestorm` (schnell, `#ff9b55`) |
| Nekromant | `tower_necromancer` | `#a6edb4` | Totempfahl mit Seelenlaterne, grüne Runen | `soulChoir` → `soulLegion` (mehr Geister) | `soulKeeper` → `soulLord` (stärkere Geister, Violett `#c8a3ee`) |

Die Geschosse aller Türme zeichnet das Spiel, sie werden nicht modelliert.

---

## 6. Gegner

### 6.1 Allgemein

- Blickrichtung +X, Ursprung Mitte der Füße. Das Spiel dreht den Gegner in Laufrichtung.
- Die Straße ist 0,33 breit. Alle Gegner außer Bossen passen bequem darauf.
- **Laufanimation:** Objekte `leg_l`, `leg_r`, `arm_l`, `arm_r` mit Pivot in Hüfte bzw. Schulter. Gehaltene Waffen, Schilde und Stäbe gehören zum Arm-Objekt.
- **Nicht modellieren:** Lebensbalken, Symbole über dem Kopf, Freeze-Ring, Heilkreis, Treffer-Effekte.
- Die Lebensbalken sind **Gelb** (Leben), **Grau** (Rüstung), **Blau** (Magieresistenz). Körperfarben nicht exakt in diesen Tönen halten.
- Große, klare Silhouetten: Gegner werden in Gruppen von 5 bis 40 aus der Höhe gesehen. Die Fähigkeit soll an der Form ablesbar sein.

### 6.2 Übersicht

| Datei | Spiel-Typ | Figur | Schutz / Fähigkeit | Höhe | max. Breite | Dreiecke |
|---|---|---|---|---|---|---|
| `enemy_swarm` | Schwarm | Kobold-Läufer, sandbraun bis orange | keiner | 0,16 | 0,18 | 300 |
| `enemy_normal` | Normal | Kiwi-Krieger „Vik“ | leicht | 0,30 | 0,28 | 600 |
| `enemy_armored` | Gepanzert | Ork-Wächter mit Schild, grau-grün und Stahl | schwere Rüstung | 0,34 | 0,32 | 800 |
| `enemy_warded` | Magiegeschützt | Goblin-Runenmeister, blau-violett, Runen | Magieresistenz | 0,32 | 0,28 | 700 |
| `enemy_splitter` | Splittergolem (ab Welle 12) | Steingolem mit leuchtenden Bruchnähten | Rüstung; zerfällt in 2 Splitter | 0,36 | 0,32 | 800 |
| `enemy_shard` | Golemsplitter | eine Golemhälfte als kleiner Läufer | keine Rüstung | 0,18 | 0,16 | 250 |
| `enemy_healer` | Feldheiler (ab Welle 18) | Goblin-Schamane mit Heilstab | heilt andere Gegner | 0,30 | 0,26 | 700 |
| `enemy_elementCarrier` | Elementträger (ab Welle 26) | Träger mit Element-Gefäß auf dem Rücken | immun gegen ein Element | 0,32 | 0,28 | 800 |
| `enemy_boss` | Boss (Grasland) | Obsidian-Wächter mit Glutkern | Rüstung und Magie | 0,70 | 0,55 | 1 500 |
| `enemy_boss_ash` | Boss Aschelande | geschmolzene Platten, weiße Glut | −50 % Feuerschaden | 0,70 | 0,55 | 1 500 |
| `enemy_boss_storm` | Boss Sturmhochland | schlank, Kristallzacken, blauweiß | −50 % Blitz-/Windschaden | 0,70 | 0,55 | 1 500 |
| `enemy_boss_desert` | Boss Dünenmeer | Sandstein und Glasgestein, bernstein | halbe Verlangsamung | 0,70 | 0,55 | 1 500 |

### 6.3 Besondere Teile

- **Kiwi-Krieger „Vik“:** runder Kiwi-Körper in Kiwigrün (`#7fae3a`), Bauch heller, Sprössling auf dem Kopf (`sprout`), Kurzschwert in `arm_r`, Kriegshammer mit großem Kopf in `arm_l`. Auf dem Bauch die Widmung **„VIK“** als kleine erhabene 3D-Schrift (`vik_text`, Hellgelb oder Creme, keine Textur).
- **Feldheiler:** Heilkugel am Stab als Objekt **`heal_orb`** mit eigenem Leuchtmaterial **`heal_glow`** (Emissive, nur für die Kugel). Das Spiel lässt sie pulsieren und beim Heilen aufblitzen.
- **Elementträger:** Gefäßinhalt als Objekt und Material **`element_core`** in neutralem Hellgrau/Weiß. Das Spiel färbt es je Welle in Feuer `#ef7449`, Wasser `#56c5ef` oder Blitz `#efd557`. Keine Farbe fest einmodellieren.
- **Splittergolem und Golemsplitter:** gleiche Steinfarbe (grünlich oder bläulich grau, nicht Balkengrau) und Rissfarbe. Die Risse teilen den Golem erkennbar in zwei Hälften, der Splitter ist eine dieser Hälften in Zielgröße.
- **Bosse:** optional `core` für den Glutkern.

---

## 7. Gebäude und Effekte

**Gebäude** stehen auf dem Gebäudeplatz (Ursprung = Mitte des Pads auf Höhe 0):

| Datei | Wirkung im Spiel | Optik | Farben |
|---|---|---|---|
| `building_house` | +3 Gold je Welle | Wohnhaus mit Satteldach, Kamin | Wände `#c9a066`, Dach `#a94a3a` |
| `building_forge` | +20 % Turmschaden auf diesem und angrenzenden Hexen | niedrige offene Werkstatt, hoher Schornstein, Amboss, glühende Esse | `#6b6e75` / `#3d3f45`, Glut orange |
| `building_market` | 15 % Rabatt auf diesem und angrenzenden Hexen | Marktstand mit gestreiftem Stoffdach, Kisten, Waage | Holz `#d8c48a`, Stoff `#b8443a`, Gold |

Grundfläche höchstens 0,32 × 0,32, Höhe bis 0,40, bis etwa 800 Dreiecke, Tür nach **Süden**. Die drei müssen sich an der Silhouette unterscheiden, nicht nur an der Farbe.

**Effekte:** `mine_pickup.glb` in `assets/effects/`: einzelne Mine auf der Straße, flache Scheibe mit Zünder, Durchmesser etwa 0,10, Höhe 0,05, **unter 150 Dreiecke** (erscheint in großer Zahl).

---

## 8. Sakura-Edition

Das Spiel hat eine umschaltbare **Sakura-Edition** (Einstellungen → Grafikstil). Jedes Modell kann zusätzlich im Sakura-Stil unter `assets/sakura/<ordner>/` liegen, mit **gleichem Dateinamen, gleichen Objekt- und Materialnamen für benannte Teile und gleichen Maßen**. Nur der Stil ändert sich. Fehlt eine Sakura-Datei, nutzt das Spiel die normale.

Für Sakura-Tiles und -Basen gelten feste Materialnamen, damit das Spiel die Biome als Jahreszeiten einfärben kann:

| Rolle | Materialname |
|---|---|
| Boden | `grass_meadow` |
| Erde | `soil_earth` |
| Laub | `foliage_bush`, `foliage_dark` (auch `sk_pine`) |
| Blüten | `foliage_blossom`, `foliage_blossom_light`, `petal` |

Laternen, Lack, Bambus, Torii und Steine behalten ihre Farbe.

---

## 9. Prüfung und Lieferung

- Vor der Lieferung prüfen: Straßenenden an den richtigen Kanten, Turmplätze an den Positionen aus 3.5 und frei von Straße und hoher Deko, benannte Teile vorhanden.
- Das Projekt prüft automatisch (`tests/tile-models.test.cjs`), ob die Straßen aller Tiles in beiden Editionen die Kanten der Kartendaten treffen, und (`tests/asset-edition.test.cjs`), ob jede Sakura-Datei ein normales Gegenstück hat.
- Nach dem Ablegen neuer Dateien auf dem Server den Modell-Index neu erzeugen (`npm run generate-assets-index`), sonst lädt das Spiel sie nicht.
