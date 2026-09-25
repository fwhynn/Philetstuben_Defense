# Modellspezifikation v4: neue Gegner, Festungs-Basen

Ergänzung zu [ASSET_SPEC.md](ASSET_SPEC.md), [ASSET_SPEC_v2.md](ASSET_SPEC_v2.md) und [ASSET_SPEC_v3.md](ASSET_SPEC_v3.md). Einheiten, Ausrichtung und Grundregeln gelten dort unverändert. Stand: 25.09.2026. Umfang:

1. Vier neue Gegnermodelle: Splittergolem, Golemsplitter, Feldheiler, Elementträger
2. Drei Festungs-Basen mit sichtbaren Ausbaustufen (ersetzen die fünf zufälligen Base-Varianten)
3. Sakura-Edition
4. Ablage und Reihenfolge

## Kurz: allgemeine Regeln

- **Format:** `.glb`, Export „+Y Up“. In Blender: X = Osten, Y = Norden, Z = oben.
- **Einheit:** Hex-Umkreisradius = **1,0**. Das Spiel skaliert mit Faktor 54, du modellierst klein.
- **Stil:** weiche Low-Poly-Formen, wenige Materialien oder Vertex-Colors, keine großen Texturen. Emissive ist bei Glut, Magie und Heilung erlaubt.
- **Benannte Teile:** Wenn ein Objektname verlangt wird (`leg_l`, `element_core` …), muss er exakt stimmen. Der Pivot liegt im Gelenk bzw. in der Drehachse.

---

## 1. Neue Gegner

Die drei neuen Gegnertypen erscheinen ab mittleren Wellen und ersetzen dort einzelne normale Gegner (je Typ 1 bis 3 pro Welle). Dazu kommt der Golemsplitter als „Nachwuchs“ des Splittergolems. Heute leihen sie sich fremde Modelle (Splittergolem und Golemsplitter den Ork-Wächter, Heiler und Elementträger den Goblin-Runenmeister) und sind nur an einem kleinen Symbol über dem Kopf erkennbar. Ziel: **Die Fähigkeit soll an der Silhouette ablesbar sein**, bevor man das Symbol liest.

### Gemeinsame Vorgaben (wie bei den bestehenden Gegnern)

- **Ursprung** in der Mitte der Füße auf Höhe 0, **Blickrichtung +X** (Osten). Das Spiel dreht den Gegner in Laufrichtung.
- Die Straße ist **0,33** breit, alle Modelle müssen bequem darauf passen.
- **Laufanimation (empfohlen):** Objekte `leg_l`, `leg_r`, `arm_l`, `arm_r` mit Pivot in Hüfte bzw. Schulter. Gehaltene Gegenstände gehören zum jeweiligen Arm-Objekt.
- **Nicht modellieren:** Lebensbalken, das Symbol über dem Kopf, den Freeze-Ring und Effekte wie den Heilkreis. Das zeichnet das Spiel.
- Die Lebensbalken sind **Gelb** (Leben), **Grau** (Rüstung) und **Blau** (Magieresistenz). Körperfarben nicht exakt in diesen Tönen halten.
- Gegner werden in Gruppen von 5 bis 40 aus der Höhe gesehen: große, klare Formen statt feiner Details.

### Überblick

| Datei | Spiel-Typ | Figur | Ab Welle | Höhe | max. Breite | Dreiecke | Farbe im Spiel |
|---|---|---|---|---|---|---|---|
| `enemy_splitter` | Splittergolem | Steingolem mit leuchtenden Bruchnähten | 12 | ca. 0,36 | 0,32 | bis 800 | `#889591` |
| `enemy_shard` | Golemsplitter | kleines Bruchstück des Golems | (entsteht beim Tod) | ca. 0,18 | 0,16 | bis 250 | `#b3b9aa` |
| `enemy_healer` | Feldheiler | Goblin-Schamane mit Heilstab | 18 | ca. 0,30 | 0,26 | bis 700 | `#70c794` |
| `enemy_elementCarrier` | Elementträger | Träger mit Element-Gefäß auf dem Rücken | 26 | ca. 0,32 | 0,28 | bis 800 | `#d2a965` + Elementfarbe |

### `enemy_splitter`: Splittergolem

Spielverhalten: langsam (75 % Tempo), trägt Rüstung (35 % zusätzliche Rüstungspunkte). **Beim Tod zerfällt er in zwei Golemsplitter**, das Gold verteilt sich auf alle drei.

- Massiger, gedrungener **Golem aus wenigen großen Steinblöcken**. Er wirkt schwer, aber nicht so gepanzert wie der Ork-Wächter (kein Metall).
- **Sichtbare Bruchnähte:** Durch den Körper laufen zwei bis drei deutliche Risse, die schwach leuchten (Emissive, Bernstein oder Türkis). Sie zeigen: „Dieser Gegner zerbricht.“ Idealerweise teilen die Risse den Körper **erkennbar in zwei Hälften**. Genau diese Hälften kommen danach als Golemsplitter wieder.
- Farbe: kühles Steingrau mit Moosflecken, nicht zu nah am Grau des Rüstungsbalkens (lieber grünlich oder bläulich grau).
- Arme lang und schwer (Pivot in der Schulter), Beine kurze Säulen.

### `enemy_shard`: Golemsplitter

Spielverhalten: entsteht paarweise am Todesort des Splittergolems, hat ein Viertel seiner Lebenspunkte, **keine Rüstung**, gleiches Tempo.

- **Eine Hälfte des Splittergolems** als kleiner, eigenständiger Läufer: ein bis zwei Steinblöcke, Stummelbeine, gleicher Stein und gleiche Rissfarbe wie der Golem.
- Die Bruchkante darf roh und kantig sein, die Risse leuchten noch, aber schwächer.
- Heute nutzt das Spiel den Ork-Wächter in 60 % Größe. Mit eigenem Modell entfällt diese Verkleinerung, also bitte direkt in Zielgröße (Höhe ca. 0,18) modellieren.

### `enemy_healer`: Feldheiler

Spielverhalten: etwas weniger Leben (80 %) und langsamer (90 %). **Heilt alle 3 Sekunden andere Gegner im Umkreis von etwa 0,9** um 5 %. Heiler heilen einander nicht. Den grünen Heilkreis zeichnet das Spiel.

- **Goblin-Schamane** in weitem Gewand oder Kapuzenmantel, leicht gebückt, freundlich-verschmitzt statt bedrohlich.
- **Heilstab** in `arm_r`, oben mit einer **grün leuchtenden Kugel, Laterne oder Blüte** (Emissive). Das ist das wichtigste Erkennungsmerkmal, bitte groß genug, dass man es von oben sieht. Objektname `heal_orb`, damit wir es später pulsieren lassen können.
- Optional: kleine Kräuterbeutel oder Verbandrollen am Gürtel.
- Farbe: Gewand in Cremeweiß oder Hellbraun, Akzente in **Heilgrün** (`#70c794`). Das Grün vom Kiwigrün des Standardgegners und vom gelblichen Lebensbalken klar absetzen.

### `enemy_elementCarrier`: Elementträger

Spielverhalten: **immun gegen ein Element**, je nach Welle Feuer, Wasser oder Blitz. Andere Schadensarten wirken normal. Das Spiel zeigt das Element als Symbol (🔥, 💧, ϟ) und als Farbe.

- **Stämmiger Träger** (Goblin oder kleiner Oger), der ein großes **Element-Gefäß auf dem Rücken** schleppt, zum Beispiel ein Glasgefäß, eine Kristallkugel im Gestell oder eine Kohlenpfanne. Das Gefäß ist das Erkennungsmerkmal und darf den Körper überragen.
- **Ein einziges Modell für alle drei Elemente:** Der Inhalt des Gefäßes wird ein eigenes Objekt **`element_core`** mit einem eigenen Material namens **`element_core`** in **neutralem Hellgrau oder Weiß** (Emissive erlaubt). Das Spiel färbt dieses Material je Welle ein: Feuer `#ef7449`, Wasser `#56c5ef`, Blitz `#efd557`. Also keine Farbe fest einmodellieren und keine Textur auf diesem Teil.
- Körper und Gestell in warmem Leder- und Holzton (`#d2a965` als Richtwert), damit die Elementfarbe heraussticht.
- Optional: Kette oder Riemen über der Schulter, die das Gefäß halten (zu `arm_l`/`arm_r` gehörig, wenn sie mitschwingen sollen).

---

## 2. Festungs-Basen

Es gibt **drei Festungen**, die man vor einem Durchlauf wählt. Bisher würfelt das Spiel zufällig eines von fünf Base-Designs aus (`base_hex`, `base_keep`, `base_motte`, `base_beacon`, `base_royal`), unabhängig von der gewählten Festung. Diese werden ersetzt: **Jede Festung bekommt ihr eigenes Design**, und die im Spiel gekauften Ausbauten werden sichtbar.

### Die drei Festungen

| Datei-Kürzel | Festung | Thema | Werte im Spiel |
|---|---|---|---|
| `standard` | Standardfestung | klassische Steinburg mit Bergfried, ausgewogen | 20 Leben, je 2 Ausbaustufen |
| `builder` | Festungsbauer | Baumeister und Ingenieure: Gerüste, Kran, Baumaterial, Werkstatt | 20 Leben, Ausbau 25 % günstiger, **als Einziger 3 Ausbaustufen** |
| `merchant` | Händlerstadt | Handelsstadt: Marktstände, Lagerhaus, Waren, Gold, Banner; wenig militärisch | 15 Leben, schwächere Base-Waffe, +2 Gold je Welle |

### Kaufbare Ausbauten

Zwei Ausbauten, jeweils unabhängig voneinander kaufbar:

| Ausbau | Wirkung | Stufe 1 | Stufe 2 | Stufe 3 (nur `builder`) |
|---|---|---|---|---|
| **Mauern** | mehr Leben (+5 / +5 / +10) | leichte Befestigung, z. B. Palisade oder niedrige Mauer | Steinmauer mit Türmen | Doppelmauer oder Bastionen |
| **Base-Waffe** | die Festung schießt selbst auf Gegner | kleine Schützenplattform | größere Waffe, z. B. Balliste | schweres Geschütz |

Die Stufen sollen zum Thema passen: beim Händler eher Holzpalisade und angeheuerte Armbrustschützen, beim Festungsbauer Mechanik und Zahnräder, bei der Standardfestung klassischer Stein.

### Modularer Aufbau

Weil Mauer- und Waffenstufe unabhängig gekauft werden, bitte **Grundmodell plus Aufsatzteile** liefern, die das Spiel übereinanderlegt. Nicht jede Kombination einzeln modellieren.

| Datei | Inhalt |
|---|---|
| `tile_base_standard.glb`, `tile_base_builder.glb`, `tile_base_merchant.glb` | Festung ohne Ausbauten, **komplettes Tile** mit Boden und Straße |
| `base_<festung>_walls_1.glb`, `base_<festung>_walls_2.glb`, beim builder zusätzlich `_walls_3.glb` | **nur** die Mauerteile dieser Stufe |
| `base_<festung>_weapon_1.glb`, `base_<festung>_weapon_2.glb`, beim builder zusätzlich `_weapon_3.glb` | **nur** die Waffe dieser Stufe |

`<festung>` ist `standard`, `builder` oder `merchant`. Insgesamt **17 Dateien**.

- Aufsatzteile im **selben Koordinatensystem** wie das Grundmodell, Ursprung in der Hexmitte auf Höhe 0. Das Spiel legt sie ohne Verschiebung auf das Grundmodell.
- Eine höhere Stufe **ersetzt** die niedrigere derselben Art (Mauer 2 statt Mauer 1). Mauer- und Waffenteile werden dagegen **kombiniert** und dürfen sich deshalb nicht durchdringen.

### Technische Vorgaben

- **Tile:** Radius 1 zur Ecke, Boden auf Höhe 0, gleiche Ausrichtung wie alle Tiles. Kante 0 liegt im **Osten** (+X).
- **Straße:** Eine Straße führt von der Mitte zur Ostkante (Kantenmitte bei 0,866 | 0), in einer Knotengruppe namens `road` mit den Materialien `road` (Fahrbahn, 0,33 breit) und `road_verge` (Bankett, 0,47 breit). **Tor nach Osten.**
- **Zwei Fronten:** Im Modus „Zwei Fronten“ blendet das Spiel diese Straße aus und zeichnet **zwei Straßen in zufällige Richtungen** von der Mitte aus. Deshalb die Festung **kompakt in der Mitte** halten (Mauerring bis etwa **0,55** Radius) und rundherum freie Fläche lassen, damit Straßen in jede Richtung sichtbar bleiben.
- **Biom-Einfärbung:** Boden, Erde und Pflanzen mit Materialnamen, die `grass`, `soil` bzw. `foliage` enthalten. Diese färbt das Spiel je Biom um. Mauern, Dächer und Holz dagegen **nicht** so benennen.
- **Waffe:** Die Geschosse der Base starten in der **Hexmitte auf etwa 0,6 Höhe**. Die Waffe also oben mittig platzieren. Den drehbaren Teil als Objekt `turret` anlegen (Schussrichtung +X), die Mündung als leeres Objekt `muzzle`.
- **Höhe:** möglichst unter etwa **0,7**, damit Nachbar-Tiles nicht verdeckt werden.

---

## 3. Sakura-Edition

Das Spiel hat eine umschaltbare **Sakura-Edition** (Einstellungen → Grafikstil). Alle Modelle aus diesem Dokument bitte, wenn möglich, zusätzlich im Sakura-Stil liefern: **gleiche Dateinamen, gleiche Objektnamen, gleiche Maße**, nur der Stil ändert sich. Ablage im Unterordner `sakura/` (siehe unten). Fehlt eine Sakura-Datei, verwendet das Spiel automatisch die normale.

Für Sakura-Tiles gilt zusätzlich: Boden `grass_meadow`, Erde `soil_earth`, Laub `foliage_bush`/`foliage_dark`, Blüten `foliage_blossom`/`foliage_blossom_light`/`petal`. Diese Namen färbt das Spiel je Biom als Jahreszeit ein.

---

## 4. Ablage und Reihenfolge

```
assets/enemies/enemy_splitter.glb
assets/enemies/enemy_shard.glb
assets/enemies/enemy_healer.glb
assets/enemies/enemy_elementCarrier.glb

assets/tiles/tile_base_standard.glb
assets/tiles/tile_base_builder.glb
assets/tiles/tile_base_merchant.glb
assets/bases/base_standard_walls_1.glb      … _walls_2
assets/bases/base_standard_weapon_1.glb     … _weapon_2
assets/bases/base_merchant_walls_1.glb      … _walls_2
assets/bases/base_merchant_weapon_1.glb     … _weapon_2
assets/bases/base_builder_walls_1.glb       … _walls_3
assets/bases/base_builder_weapon_1.glb      … _weapon_3

Sakura: dieselben Dateien unter assets/sakura/enemies/, assets/sakura/tiles/ bzw. assets/sakura/bases/
```

### Empfohlene Reihenfolge

1. **`enemy_healer` und `enemy_splitter` mit `enemy_shard`.** Sie kommen am frühesten im Spiel vor (ab Welle 18 bzw. 12).
2. **`enemy_elementCarrier`** (ab Welle 26).
3. **Festungs-Basen:** zuerst die drei Grundmodelle, dann Mauern, dann Waffen.

### Hinweis zur Einbindung

Fehlende Dateien erzeugen keinen Fehler, das Spiel fällt wie bisher auf das vorhandene Ersatzmodell zurück. Damit die neuen Dateien erscheinen, sind auf Code-Seite kleine Ergänzungen nötig. Diese übernimmt das Entwicklerteam nach Lieferung:

- Gegner eigenes Modell vor Ersatzmodell.
- Einfärben von `element_core`.
- Base nach gewählter Festung statt zufällig.
- Ausbaustufen einblenden.
