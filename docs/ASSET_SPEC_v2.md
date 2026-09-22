# Modellspezifikation v2: neue Türme, Gegner, Gebäude

Ergänzung zu [ASSET_SPEC.md](ASSET_SPEC.md). Tiles, Landmarks, Slots und die vier ersten Türme (Archer, Katapult, Kettenblitz, Freeze) stehen dort und gelten unverändert. Stand: 20.09.2026. Die folgenden Basismodelle sind vorhanden und eingebunden; diese Spezifikation bleibt Grundlage für Änderungen und Erweiterungen:

1. Türme: Minenleger, Balliste, Flammenturm
2. Gegner: fünf Gegnertypen mit klar abgestuften Rüstungsgraden (Fantasy)
3. Gebäude: Haus, Schmiede, Markt
4. Ablage, Prioritäten und Stand im Code

## Allgemeine Regeln (Kurzfassung, Details in ASSET_SPEC.md)

- **Format:** `.glb`, Export mit „+Y Up“. In Blender: X = Osten, Y = Norden.
- **Einheit:** Hex-Umkreisradius = **1,0**. Das Spiel skaliert später mit Faktor 54, du modellierst klein.
- **Ursprung:** Türme und Gebäude: Mitte des Sockels auf Höhe 0. Gegner: Mitte der Füße auf Höhe 0.
- **Material:** wenige Materialien oder Vertex-Colors, keine großen Texturen. Stil: weiche Low-Poly-Formen, warme Farben (Dorfromantik). Emissive-Material ist bei Glut, Magie und Runen erlaubt.
- **Dateinamen:** kleingeschrieben, genau wie unten angegeben.
- **Benannte Teile:** Wenn eine Spec ein Objekt wie `turret` oder `leg_l` verlangt, muss der Name exakt stimmen. Der Pivot (Drehpunkt) liegt dann in der Drehachse bzw. im Gelenk, nicht in der Mitte des Teils.

---

## 1. Neue Türme

Gemeinsame Vorgaben wie bei den bestehenden Türmen: Grundfläche max. Radius **0,20** (sie stehen auf einer Plattform mit Radius 0,22), Ursprung in der Sockelmitte auf Höhe 0. Alle drei brauchen ein Objekt `turret`, das sich zum Ziel dreht. Das ist das einzige Teil, das der Renderer animiert. Alles, was nicht `turret` oder `aura` heißt, bleibt fest und dreht sich nicht mit.

Der Renderer dreht `turret` um die senkrechte Achse, und **die Schussrichtung ist +X (Osten)**. Modelliere Rohr, Bogen und Düse also so, dass sie in Blender nach +X zeigen.

### `tower_mine` (Minenleger)

Rolle: Wegkontrolle. Legt Minen auf die Straße, kurze bis mittlere Reichweite, niedrige Bauhöhe.

| Eigenschaft | Vorgabe |
|---|---|
| Idee | Kleiner Steinbunker oder Erdwall mit Mörserrohr, daneben ein Vorrat an Fässern oder Minenkugeln. Das Thema ist Zwerg und Sprengmeister. |
| Höhe | ca. **0,45–0,55**, der niedrigste Turm. Er soll geduckt und schwer wirken. |
| Dreiecke | bis ca. 1 800 |
| Farbe | Erdbraun und Kupfer (Spielfarbe `#e6a75f`), dunkles Metall, orange Lunte oder Glimmpunkte als Akzent |
| `turret` (Pflicht) | Mörserrohr oder Wurfschale, schräg nach oben in Richtung +X geneigt. Pivot in der senkrechten Drehachse. |
| `aura` (optional) | Pulsierende Zündkerze oder Glutpunkt auf dem Turm, wird als leichter Puls animiert. |

Zusätzlich optional als eigene Datei **`mine_pickup.glb`** (Ablage `assets/effects/`): die einzelne Mine, die auf der Straße liegt, also eine flache Kugel oder Scheibe mit Zünder, Durchmesser ca. 0,10, Höhe 0,05, Ursprung in der Mitte auf Höhe 0. Sie liegt auf der Straßenoberfläche. Das Spiel legt sie in großer Zahl aus, daher **unter 150 Dreiecken**. Ohne Datei zeichnet der Renderer einfache Kreise.

### `tower_ballista` (Balliste)

Rolle: Bosskiller, extrem weitreichender Einzelschuss (die größte Reichweite aller Türme). Der Turm soll hoch und schlank wirken, wie ein Ausguck mit schwerer Waffe.

| Eigenschaft | Vorgabe |
|---|---|
| Idee | Hoher Holz- und Steinturm mit einer riesigen Armbrust-Balliste obenauf. Ein Bolzen ist eingelegt, zwei Seile und ein Windenrad sind sichtbar. |
| Höhe | ca. **0,75–0,85**, der höchste Turm |
| Dreiecke | bis ca. 2 200 |
| Farbe | helles Holz und Sandstein (Spielfarbe `#d9c08b`), dunkle Eisenbeschläge, Bolzenspitze in Stahlgrau |
| `turret` (Pflicht) | Balliste samt Plattform, Bolzen liegt ausgerichtet nach +X. Pivot in der senkrechten Turmachse. Der Bogen darf breiter sein als 0,20 (ca. Radius 0,28), weil er über die Plattform ragt. Er ist nur oben. |
| `bolt` (optional) | Der eingelegte Bolzen als eigenes Objekt (Pivot im Schaft-Ende), damit ich ihn später beim Schuss kurz verstecken oder zurückfahren kann. |
| `aura` | nicht nötig |

### `tower_flame` (Flammenturm)

Rolle: Flächenkontrolle mit kurzer Reichweite (nur die Hälfte der Balliste). Dauerfeuer gegen Gruppen.

| Eigenschaft | Vorgabe |
|---|---|
| Idee | Gedrungener Steinturm oder Brennkessel mit Feuerschale und einer Düse (Drachenkopf, Speirohr oder Kupferrohr mit Gasflasche). Schwarz-rote Rußspuren am Sockel. |
| Höhe | ca. **0,55–0,65** |
| Dreiecke | bis ca. 1 800 |
| Farbe | dunkler Stein und schwarzes Eisen (Spielfarbe `#ff754b`), Glut und Flamme in Orange bis Gelb, **Emissive** für die Glut |
| `turret` (Pflicht) | Düse oder Drachenkopf mit Zuleitung, zeigt nach +X. Pivot in der senkrechten Achse. Die Flamme selbst muss **nicht** modelliert werden, die Feuerstöße zeichnet der Renderer. |
| `aura` (optional) | Glühender Kessel oder Feuerschale mit Emissive-Material, pulsiert leicht. |

### Upgrade-Varianten (später)

Wie bei den alten Türmen als `tower_<turm>_<upgradeId>.glb` oder als Zusatzteile `upgrade_<id>.glb`. Erst nach den Basistürmen. IDs aus `data.js`:

- Minenleger: `demolition` → `earthquake`, `minefield` → `carpet`
- Balliste: `harpoon` → `dragonSlayer`, `repeater` → `boltStorm`
- Flammenturm: `inferno` → `sunfire`, `wildfire` → `firestorm`

Optikidee: `demolition` große Fässer und dicke Minen, `minefield` viele kleine, `harpoon` ein dicker Haken mit Seil, `repeater` ein Magazin mit mehreren Bolzen, `inferno` größere Feuerschale, `wildfire` mehrere schmale Düsen.

---

## 2. Gegner (Fantasy, gestaffelte Rüstung)

Thema: **Fantasy-Horde** aus Goblins, Kobolden und Orks, angeführt vom **Obsidian-Wächter**. Der Rüstungsgrad soll von Weitem an der Silhouette und Farbe ablesbar sein, denn genau das verlangt das Spiel vom Spieler: Gegner mit Rüstung nehmen wenig Schaden von schwachen Geschossen, magiegeschützte Gegner brauchen Turmtypen mit hohem Magieschaden.

### Die fünf Typen im Überblick

Die Typen kommen direkt aus `waves.js`. Es gibt fünf, nicht vier: der bisherige `warded` (magiegeschützt) hat noch keinen Eintrag in der alten Spec.

| Datei | Spiel-Typ | Figur | Schutz | Höhe | max. Breite | Dreiecke |
|---|---|---|---|---|---|---|
| `enemy_swarm` | Schwarm | Kobold-Läufer | **keiner**, nur Fell und Lumpen | ca. 0,16 | 0,18 | bis 300 |
| `enemy_normal` | Normal | Kiwi-Krieger „Vik“ | **leicht**, Lederband und Holzgriffe | ca. 0,30 | 0,28 | bis 600 |
| `enemy_armored` | Gepanzert | Ork-Wächter | **schwer**, Stahlrüstung und Schild | ca. 0,34 | 0,32 | bis 800 |
| `enemy_warded` | Magiegeschützt | Goblin-Runenmeister | **magisch**, Runen und Schutzsphäre | ca. 0,32 | 0,28 | bis 700 |
| `enemy_boss` | Boss | Obsidian-Wächter | Rüstung **und** Magie | ca. 0,70 | 0,55 | bis 1 500 |

Der Renderer zeigt zusätzlich Lebensbalken in drei Farben (Gelb = Leben, Grau = Rüstung, Blau = Magieresistenz). Halte die **Körperfarben deshalb nicht in exakt diesen Tönen**, sonst verschwinden sie hinter den Balken.

### Gemeinsame Vorgaben

- **Blickrichtung +X** (Osten) bei Rotation 0, Ursprung Mitte der Füße auf Höhe 0. Das Spiel dreht den Gegner selbst in Laufrichtung.
- Die Straße ist 0,33 breit. Alle normalen Gegner (alle außer dem Boss) müssen bequem darauf passen.
- **Laufanimation (optional, empfohlen):** Objekte `leg_l`, `leg_r`, `arm_l`, `arm_r` mit **Pivot im Gelenk** (Hüfte oder Schulter). Sie schwingen gegengleich. Ohne diese Objekte wippt der Gegner nur leicht.
- Hält ein Gegner ein Schild oder eine Waffe in der Hand, gehört das Teil zum jeweiligen Arm-Objekt, damit es mitschwingt.
- Nicht modellieren: Lebensbalken, Freeze-Ring (blauer Ring um verlangsamte Gegner) und Schadenseffekte.
- Große, klare Silhouetten. Die Gegner werden in Gruppen von 5 bis 40 Stück aus der Höhe gesehen.

### `enemy_swarm` (Kobold, ungeschützt)

- Klein, dünn und flink, leicht nach vorn gebeugt, spitze Ohren, große Augen. Kaum Details.
- **Kein Rüstungsteil**, nur ein Lendenschurz oder eine Kapuze. So sieht man sofort, dass er nichts aushält.
- Farbe: **Sandbraun bis Orange** (Haut und Fell). Auffällige Farbe, weil sie in Schwärmen erkannt werden muss.
- Beine dürfen überlang wirken (Läufer). Bis 300 Dreiecke.

### `enemy_normal` (Kiwi-Krieger „Vik“, leichte Rüstung)

Der Standardgegner ist ein grüner **Kiwi-Krieger** und trägt den Namen einer Freundin auf dem Bauch (Widmung). Er ist der häufigste Gegner im Spiel, also sieht man ihn am meisten.

- **Körper:** runder, leicht ovaler Kiwi-Körper mit Kugelform, kurze Stummelbeine und -arme. Auf dem Kopf ein kleines **grünes Blatt oder Sprössling** (Objekt `sprout`, ich kann ihn später leicht wippen lassen). Große dunkle Augen mit kleinem Glanzpunkt, ein winziges freches Grinsen. Auf Wunsch feine Härchen oder Kiwi-Sprenkel als Vertex-Color.
- **Farbe:** **Grün.** Hauptfarbe Kiwigrün (ca. `#7fae3a`), Bauch etwas heller, wie das Fruchtfleisch. Halte das Grün deutlich vom Gelb der Lebensbalken getrennt.
- **Waffen: ein Hammer und ein Schwert.** Rechts (`arm_r`) ein Kurzschwert, links (`arm_l`) ein kleiner Kriegshammer mit dickem Kopf. Beide sind Teil des jeweiligen Arm-Objekts und schwingen mit. Der Hammerkopf soll deutlich größer wirken als das Schwert, damit man beide auch von oben unterscheidet. Das Schwert bleibt schlicht.
- **Leichte Rüstung:** nur ein braunes Lederband quer über den Körper oder eine kleine Holzschulter, sonst nackt. Der Bauch bleibt frei, denn dort steht die Schrift.
- **Widmung „VIK“ auf dem Bauch:** die Buchstaben **V I K** als kleine, erhabene 3D-Schrift (extrudierter Text, ca. 0,01 tief) direkt auf der Vorderseite des Bauchs, Objektname `vik_text`, eigenes Material in Hellgelb oder Creme. Nutze keine Textur, das wäre bei dieser Größe unscharf. Alternative ohne Schrift: ein kleines Wappenschild mit den Buchstaben. Die Schrift ist bei Höhe 0,30 nur etwa 0,05 hoch und in der normalen Spielansicht kaum lesbar. Wer heranzoomt, sieht sie. Wenn sie auch von hinten oder oben zu sehen sein soll, kann sie zusätzlich klein auf dem Rücken stehen.
- **Größe:** Höhe ca. 0,30 (mit Sprössling), max. Breite 0,28 (mit Hammer und Schwert). Der Körper selbst ist ca. 0,22 breit, damit er auf die 0,33 breite Straße passt.
- Blickrichtung +X: das Gesicht und die Bauchschrift zeigen nach **+X**.
- Bis 600 Dreiecke (die Schrift zählt mit, halte sie kurz und ohne feine Rundungen).

### `enemy_armored` (Ork-Wächter, schwere Rüstung)

- Breiter und schwerer als der Goblin, kräftige Schultern, kurzer Hals, Hauer im Gesicht.
- **Schwere Rüstung**: Stahlhelm mit Hörnern oder Nasenschutz, Brustpanzer, Schulterplatten und ein **großes Schild** im linken Arm (`arm_l`). Rechts eine Axt oder Keule (`arm_r`).
- Farbe: **Grau-Grün** (Haut) mit **Stahlgrau** und dunklen Beschlägen. Metall soll matt, aber leicht glänzend wirken.
- Er bewegt sich langsamer. Wenn du willst, lass ihn beim Laufen stärker wippen (der Renderer animiert Wippen sowie benannte Gliedmaßen; die Modellpose legt die Grundhaltung fest).
- Bis 800 Dreiecke.

### `enemy_warded` (Goblin-Runenmeister, magisch geschützt)

- Schlanker Goblin oder Kobold-Schamane in Robe, Stab mit leuchtendem Kristall (`arm_r`, hält den Stab), kleiner Schädelschmuck.
- **Magischer Schutz** statt Stahl: leuchtende Runen auf Robe oder Haut (Emissive erlaubt) und eine **halbtransparente blaue Schutzsphäre** oder ein schwebender Runenring um den Körper. Wenn du die Sphäre als eigenes Objekt `ward` benennst, kann ich sie später ausblenden, sobald die Magieresistenz aufgebraucht ist.
- Farbe: **Blau-Violett** (Robe), hellblaue Runen. Die Sphäre bleibt unter 0,32 Breite.
- Bis 700 Dreiecke.

### `enemy_boss` (Obsidian-Wächter)

- Riesiger Golem aus schwarzem Obsidian, breite Schultern, Stacheln aus Glasgestein auf Rücken und Schultern, dazu ein **orange glühender Kern** in der Brust (**Emissive-Material**). Er passt zum Boss-Feld mit Obsidian-Spitzen und Glutkern.
- Er hat **beides**: schwere Rüstung (Obsidianplatten, dicke Gliedmaßen) und Magie (Glutrisse und Runen).
- Er darf breiter als die Straße sein, Höhe ca. 0,70, max. Breite 0,55.
- Optional `arm_l`, `arm_r`, `leg_l`, `leg_r` mit Pivot im Gelenk, dazu ein eigenes Objekt `core` für den Glutkern, damit ich ihn später pulsieren lassen kann.
- Bis 1 500 Dreiecke.

---

## 3. Gebäude

Gebäude stehen auf dem quadratischen Gebäudeplatz eines Dorfhex (`building_pad`, ca. **0,33 × 0,33**, bei (0, 0,56 Süd)). Sie sitzen auf dem **Pad, nicht auf dem Tile**: Ursprung in der Mitte der Grundfläche auf Höhe 0 (Oberkante des Pads).

| Eigenschaft | Vorgabe |
|---|---|
| Grundfläche | max. **0,32 × 0,32**, quadratisch, nichts darf über das Pad hinausragen |
| Höhe | bis **0,40** |
| Dreiecke | bis ca. 800 pro Gebäude |
| Ausrichtung | Vorderseite (Tür) zeigt nach **Süden** (−Y), also zum Hexrand |
| Stil | gleiche Dorfromantik-Optik wie die Dörfer: helle Wände, warme Dächer, kleine Details |

Die drei Gebäude müssen auf einen Blick unterscheidbar sein. Im aktuellen Platzhalter sind Haus, Schmiede und Markt nur durch Farbe getrennt. Nutze **unterschiedliche Silhouetten**.

### `building_house` (Haus)

- Effekt im Spiel: +3 Gold nach jeder überlebten Wave.
- Kleines, gemütliches Wohnhaus mit **Satteldach** in Rot oder Terrakotta, Fachwerk oder helle Putzwände, kleiner Kamin mit Rauch (Rauch als Objekt `smoke` optional, ich lasse ihn später aufsteigen).
- Farbe: Wände `#c9a066`, Dach `#a94a3a`.

### `building_forge` (Schmiede)

- Effekt im Spiel: +20 % Turmschaden auf diesem und den direkt benachbarten Hexen.
- Offene Werkstatt mit **hohem Schornstein**, Amboss vorn, Esse mit glühender Kohle (Emissive), Vordach auf Pfosten, Hammer oder Zange angelehnt. Sie ist niedriger, breiter und dunkler als das Haus, damit man sie sofort vom Haus trennt.
- Farbe: Stein und Schiefer grau `#6b6e75` / `#3d3f45`, Glut orange.

### `building_market` (Markt)

- Effekt im Spiel: 15 % Rabatt auf Turmbau und Upgrades auf diesem und den direkt benachbarten Hexen.
- Marktstand mit **gestreiftem Stoffdach** (Rot-Weiß oder Rot-Gold) auf vier Pfosten, Tisch mit Kisten, Fässern, Säcken und einer Waage oder Münzkiste. Das Dach ist flach oder leicht spitz, keine massive Wand.
- Farbe: Holz `#d8c48a`, Stoff `#b8443a`, Goldakzent.

---

## 4. Ablage, Priorität und Stand im Code

### Ablage

```
assets/towers/tower_mine.glb
assets/towers/tower_ballista.glb
assets/towers/tower_flame.glb
assets/enemies/enemy_swarm.glb
assets/enemies/enemy_normal.glb
assets/enemies/enemy_armored.glb
assets/enemies/enemy_warded.glb
assets/enemies/enemy_boss.glb
assets/buildings/building_house.glb
assets/buildings/building_forge.glb
assets/buildings/building_market.glb
assets/effects/mine_pickup.glb          (optional)
```

Der Server (`npm start`) listet vorhandene Modelle selbst über `/assets/index.json`. Fehlende Dateien erzeugen keine Fehlermeldung, sie werden einfach durch Platzhalter ersetzt. Du kannst also Datei für Datei nachliefern.

### Aktueller Implementierungsstand

Alle sieben Turm-Basismodelle, fünf Gegner inklusive `enemy_warded`, Haus, Schmiede, Markt und `mine_pickup.glb` sind vorhanden und werden geladen. `model-map.js` enthält die Kategorien für Gebäude und Effekte; fehlende Dateien erhalten Platzhalter.

Noch offen sind eigene Modelle für die Turm-Upgrade-Stufen. Zusätzliche benannte Objekte wie `bolt`, `ward`, `core` und `smoke` sind Gestaltungsvorschläge; ihre Namen allein garantieren keine Animation. Unterstützte bewegliche Teile und Effekte richten sich nach `three-renderer.js`.
