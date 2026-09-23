# Modellspezifikation v3: Turm-Upgrades, Tile-Überarbeitung, Biom-Bosse

Ergänzung zu [ASSET_SPEC.md](ASSET_SPEC.md) und [ASSET_SPEC_v2.md](ASSET_SPEC_v2.md). Diese gelten unverändert für Grundformen, Einheiten und Basismodelle. Stand: 23.09.2026. Umfang dieser Spezifikation:

1. Turm-Upgrade-Modelle für alle acht Türme aus der Turmauswahl (inkl. neuem Basismodell für den Nekromantenturm)
2. Überarbeitete und neue Tiles: Straßenkreuzungen ohne eigenes Terrain, konsistente Deko-Platzierung
3. Ein einheitliches visuelles Vokabular, damit Effekt-Tiles ihren Bonus auf einen Blick zeigen
4. Biomspezifische Boss-Varianten
5. Unterscheidung „Weites Land" vs. „Lange Straße"

## Wichtiger technischer Hinweis vorab

Der Renderer lädt Turmmodelle aktuell **ausschließlich über `tower.type`** (`modelTemplate(tower.type,'tower')` in `three-renderer.js`). Ein Turm-Upgrade ändert bisher nur einen kleinen Ring mit Icon über dem Turm (`BRANCH_VISUALS`), nicht das Modell selbst. Damit die Modelle aus Abschnitt 1 tatsächlich erscheinen, braucht es einen kleinen Code-Zusatz: `modelTemplate` muss zusätzlich nach `tower_<type>_<branch oder finalUpgrade>` suchen und ohne passende Datei auf `tower_<type>` zurückfallen – exakt das bestehende Prinzip „fehlende Datei ⇒ Platzhalter", nur eine Ebene tiefer. Diese Spezifikation geht von diesem Fallback aus; du kannst also Modelle einzeln nachliefern, ohne dass etwas fehlschlägt.

---

## 1. Turm-Upgrades

### Gemeinsame Regeln

- **Dateiname:** `tower_<type>_<upgradeId>.glb`, IDs exakt wie in `data.js` (`UPGRADES`). Beispiel: `tower_archer_marksman.glb`, `tower_archer_eagleEye.glb`.
- **Basis unverändert lassen:** Jedes Upgrade-Modell ist eine **vollständige eigene Datei**, keine Zusatzteile. Ursprung, Sockelradius (max. 0,20) und `turret`-Konvention bleiben wie beim Basisturm – du kannst also von der Basisdatei kopieren und nur Silhouette/Material ändern.
- **Lesbarkeit von oben:** Der Spieler sieht die Türme meist aus der Vogelperspektive. Die wichtigste Änderung pro Branch muss auch in dieser Ansicht erkennbar sein (Farbe, Silhouettenbreite, ein hoch aufragendes Detail), nicht nur ein kleines Materialdetail von vorn.
- **Branch-Familie sichtbar halten:** Die Endstufe (`arrowRain`, `eagleEye`, …) ist eine deutlichere, größere Version ihres eigenen Zweigs, nicht der Basis. Zwei Zweige desselben Turms sollen sich schon in der ersten Stufe klar unterscheiden lassen (Silhouette **und** Farbakzent, nicht nur Farbe).
- **Branch-Farben** stammen aus `BRANCH_VISUALS` in `data.js` – nutze sie als Emissive-/Akzentfarbe, damit Modell und UI-Icon zusammenpassen (Tabelle unten).
- Priorität: Die **Endstufen** (`eagleEye`, `arrowRain`, `fortressBreaker`, …) zuerst, weil sie am längsten sichtbar im Spiel stehen. Die ersten Branch-Stufen danach.

**Höhenhierarchie:** Die Balliste ist laut `ASSET_SPEC_v2.md` bewusst „der höchste Turm" (0,75–0,85) – das ist ihr visuelles Kernmerkmal als Ausguck/Bosskiller mit der größten Reichweite im Spiel. Ein einzelnes hohes Detail bei einem anderen Turm (z. B. ein Kristall am Adlerauge) reicht optisch trotzdem aus, um die Vogelperspektive zu bedienen – schon 0,60–0,65 Gesamthöhe sind von oben klar über der Nachbarbebauung erkennbar. Halte deshalb bei **allen Nicht-Balliste-Türmen** (auch deren Upgrades) die Gesamthöhe inklusive hoher Details bei **max. 0,65**. Nur die Balliste-Endstufen `dragonSlayer`/`boltStorm` dürfen die Basis-Balliste an Höhe noch überbieten (bis ca. 0,90), als sichtbare Steigerung innerhalb ihrer eigenen Familie. Ist ein Detail schon höher geplant, kürze es oder mach es stattdessen dünner/schlanker statt höher – ein schmales Element wirkt weniger raumgreifend als eine breite Erhöhung.

### Archer – Bogenschütze (`#e7d89b`)

Basis: einfacher Bogen auf Holz-/Steinplattform, schneller Einzelschuss.

| Branch | Stufe | ID | Werte | Optikidee |
|---|---|---|---|---|
| Fläche | 1 | `volley` (Salve) | Splash 55 | Köcher trägt mehrere Pfeile gleichzeitig im Fächer, Bogen etwas breiter gespannt. Akzent Grün `#96d47c` (Icon ≋). |
| Fläche | Final | `arrowRain` (Pfeilregen) | Splash 75, schneller | Voller Köcher mit sichtbar vielen Pfeilen, Bogen wirkt wie kurz vor Dauerfeuer; kleine Wetterfahne/Wimpel für „Regen"-Thema. |
| Einzelziel | 1 | `marksman` (Scharfschütze) | +Range, +Damage | Längerer Recurve-Bogen, kleine Zielhilfe (Kristalllinse oder Kerbe) an der Sehne. Akzent Gold `#f5d06e` (Icon ◎). |
| Einzelziel | Final | `eagleEye` (Adlerauge) | Reichweite 230 | Bogen deutlich schlanker und länger, ein glühendes goldenes Ziel-Auge/-Kristall am oberen Ende, Feder-/Adlerschmuck am Köcher. **Gesamthöhe inkl. Kristall max. 0,65** (siehe Höhenhierarchie unten). |

### Katapult (`#c88954`)

Basis: Wurfarm mit Steinkorb, durchschlägt bis zu 3 Gegner.

| Branch | Stufe | ID | Werte | Optikidee |
|---|---|---|---|---|
| Schwer | 1 | `siege` (Belagerung) | Damage 36 | Verstärkter Arm mit Eisenbändern, größerer, sichtbar schwererer Stein im Korb. Akzent Orange `#e99a5c` (Icon ◆). |
| Schwer | Final | `fortressBreaker` (Festungsbrecher) | Damage 60 | Doppelarm-Konstruktion mit Gegengewicht (Trebuchet-Optik), massiver behauener Felsblock, Kettenverstärkung am Sockel. |
| Schnell | 1 | `barrage` (Steinhagel) | Cooldown 0,65 | Leichterer, kürzerer Arm mit zwei kleinen Körben statt einem großen. Akzent Hellgelb `#ffdca1` (Icon ⋮). |
| Schnell | Final | `rockStorm` (Steinsturm) | Cooldown 0,5 | Drei-Korb-Salvenwerfer, sichtbarer Steinvorrat in Netzsäcken daneben, Arm wirkt leicht und schnell. |

### Kettenblitz (`#7fc6ff`)

Basis: Blitzspule/Kristallturm, springt zwischen bis zu 3 Zielen.

| Branch | Stufe | ID | Werte | Optikidee |
|---|---|---|---|---|
| Weit | 1 | `storm` (Sturmnetz) | Chain 5 | Zusätzliche kleine Antennenringe um die Spule, weiter ausladende Kristallzacken. Akzent Blauviolett `#93a5ff` (Icon ϟ). |
| Weit | Final | `tempest` (Gewitter) | Chain 7 | Volle Krone aus Blitzableiter-Zacken, kleine Gewitterwolke/Nebel-Partikelquelle über der Spule (Renderer-Effekt, nicht modelliert), Kristall wirkt wie ein kleiner Sturm. |
| Stark | 1 | `overload` (Überladung) | Damage 18 | Ein einzelner, deutlich dickerer Kristallkern statt vieler kleiner Zacken. Akzent Violett `#e2a1ff` (Icon ✦). |
| Stark | Final | `thunder` (Donnerschlag) | Damage 32 | Kern wirkt überladen: Risse mit Glut/Licht darin (Emissive), Metallgehäuse leicht verbeult/versengt, große einzelne Blitzklaue oben. **Gesamthöhe inkl. Klaue max. 0,65** (siehe Höhenhierarchie unten). |

### Freeze – Frostturm (`#a4eef5`)

Basis: Eiskristallturm mit Aura, kein Direktschaden.

| Branch | Stufe | ID | Werte | Optikidee |
|---|---|---|---|---|
| Eng/Stark | 1 | `deepFrost` (Tiefenfrost) | Slow 65 % | Kompakter, dicker Eisblock statt schlankem Kristall, raue Reif-Textur. Akzent `#70d5ff` (Icon ❄). |
| Eng/Stark | Final | `absoluteZero` (Eisstarre) | Slow 75 % | Fast geschlossener Gletscherblock mit nur wenigen scharfen Spitzen, intensives helles Blauweiß, dichter Nebel/Reif am Sockel. |
| Weit/Sanft | 1 | `frostField` (Frostfeld) | Range 200 | Schlanker, höherer Kristall mit weit ausladenden dünnen Eisnadeln. Akzent `#c0f6ea` (Icon ❆). |
| Weit/Sanft | Final | `winter` (Winterfeld) | Range 250 | Kristall wächst in einen schirmartigen Eisbaldachin (dünne, weit ausladende Zacken wie Äste), heller, fast durchsichtiger Nebeleffekt. |

### Minenleger (`#e6a75f`)

Basis laut v2: Steinbunker/Erdwall mit Mörserrohr.

| Branch | Stufe | ID | Werte | Optikidee |
|---|---|---|---|---|
| Schwer | 1 | `demolition` (Sprengmeister) | Damage 42, Splash 60 | Zusätzlicher Fassstapel (2–3 große Fässer), verstärktes, dickeres Mörserrohr. Akzent `#ff9b55` (Icon ✹). |
| Schwer | Final | `earthquake` (Erdbrecher) | Damage 75, Splash 80 | Doppelmörser-Rig, aufgerissener/rissiger Boden um den Sockel (Deko), großer Munitionsstapel aus dicken Fässern. |
| Schnell | 1 | `minefield` (Minenfeld) | Cooldown 0,75 | Kleinerer, leichterer Bunker, daneben ein offener Korb mit vielen kleinen runden Minen. Akzent `#d9bc72` (Icon ••). |
| Schnell | Final | `carpet` (Minenteppich) | Cooldown 0,5 | Marktstand-artiger Aufbau mit dutzenden kleinen Minen in Reih und Glied, mehrläufiges leichtes Wurfrohr. |

### Balliste (`#d9c08b`)

Basis laut v2: hoher Holz-/Steinturm mit Armbrust-Balliste.

| Branch | Stufe | ID | Werte | Optikidee |
|---|---|---|---|---|
| Schwer | 1 | `harpoon` (Harpunenbolzen) | Damage 72 | Bolzen bekommt breiten Widerhakenkopf, sichtbare Kette/Seilrolle am Sockel. Akzent `#e7d39e` (Icon ➶). |
| Schwer | Final | `dragonSlayer` (Drachentöter) | Damage 125 | Dreifach-Widerhaken-Bolzen, dicke Eisenkette komplett aufgerollt sichtbar, verstärkte Bogenarme, kleine Trophäe (Schuppe/Knochen) am Turmschaft. |
| Schnell | 1 | `repeater` (Repetierwerk) | Cooldown 1,05 | Magazin mit 2–3 zusätzlichen Bolzen seitlich sichtbar eingelegt, Kurbel am Windenrad größer. Akzent `#d4b979` (Icon »). |
| Schnell | Final | `boltStorm` (Bolzensturm) | Cooldown 0,72 | Volles Bolzenmagazin (5+ sichtbare Schäfte), Kurbelmechanik wirkt in Bewegung eingefroren (leicht schräge Speichen), Holzspäne/Funken als Deko. |

### Flammenturm (`#ff754b`)

Basis laut v2: Brennkessel mit Drachenkopf-/Kupferdüse.

| Branch | Stufe | ID | Werte | Optikidee |
|---|---|---|---|---|
| Groß | 1 | `inferno` (Inferno) | Damage 25, Splash 65 | Größere Feuerschale, dickere Düse, mehr Rußspuren. Akzent `#ff7448` (Icon ☀). |
| Groß | Final | `sunfire` (Sonnenfeuer) | Damage 43, Splash 82 | Kessel glüht fast weißgold (starkes Emissive), feine Rissmuster im Stein wie geschmolzen, größere Flammenschale. |
| Schnell | 1 | `wildfire` (Lauffeuer) | Cooldown 0,38 | Zwei bis drei dünnere Düsen statt einer dicken, fächerförmig angeordnet. Akzent `#ff9b55` (Icon ≋). |
| Schnell | Final | `firestorm` (Feuersturm) | Cooldown 0,25 | Volles Düsenrad (4–5 dünne Düsen im Kreis), wirkt wie ein kleines Windrad aus Flammenrohren. |

### Nekromantenturm – neues Basismodell (bisher ohne Modell)

Rolle: Beschwörung. Kein Projektil auf ein Ziel – tote Gegner in Reichweite werden zu Geistern, die selbständig kämpfen. Farbe im Spiel `#a6edb4` (blasses Totengrün), `damageType:'spirit'`.

| Eigenschaft | Vorgabe |
|---|---|
| Idee | Ein dunkler Totem-/Grabpfahl aus verwittertem Holz und Knochen, gekrönt von einem schwebenden Schädel oder einer Laterne, die gefangene Seelen enthält. Runen am Schaft, die schwach grün glimmen. Bewusster Stilbruch zu den warmen Dorfromantik-Farben der anderen Türme – dunkel, aber nicht comichaft gruselig. |
| Höhe | ca. **0,55–0,65** |
| Dreiecke | bis ca. 1 800 |
| Farbe | dunkles, grau gebeiztes Holz und Knochenweiß, Runen/Glut in Blassgrün `#a6edb4`, **Emissive** an Runen und Laterne |
| `turret` (Pflicht, kein Zielverfolgen nötig) | Der schwebende Schädel/die Laterne. Objekt trotzdem `turret` nennen – falls später eine passive Drehung ergänzt wird, ist der Name schon vorbereitet. Zeigt in Grundstellung nach +X wie bei anderen Türmen. |
| `core` (optional) | Die Seelenlaterne/der Schädelkern als eigenes emissives Objekt, das pulsiert, sobald ein Geist beschworen wird. |
| `wisps` (optional) | 2–3 kleine schwebende Irrlicht-Kugeln um den Totempfahl, rein dekorativ. |

**Upgrades** (gleiche Datei-Konvention wie oben):

| Branch | Stufe | ID | Werte | Optikidee |
|---|---|---|---|---|
| Menge | 1 | `soulChoir` (Seelenchor) | bis 5 Geister | Zusätzliche kleine Schädel/Amulette hängen am Pfahl (einer je Geist-Slot als Andeutung der Kapazität). Akzent `#a6edb4` (Icon ☽). |
| Menge | Final | `soulLegion` (Geisterlegion) | bis 8 Geister, mehr Schaden | Pfahl ist dicht mit Schädeln/Amuletten behangen, mehrere kleine grüne Irrlichter kreisen sichtbar (`wisps`). |
| Stärke | 1 | `soulKeeper` (Seelenhüter) | mehr Schaden, längere Dauer | Laterne/Schädel wird größer und heller, ein zusätzlicher Knochenring darum. Akzent Violett `#c8a3ee` (Icon ☠). |
| Stärke | Final | `soulLord` (Lichfürst) | starke, lang lebende Geister | Krone aus Knochen um den Schädel, violett-grünes Doppelglühen, Totempfahl wirkt aufwendiger geschnitzt/verziert – liest sich als „Herrscher"-Upgrade. |

---

## 2. Tile-Überarbeitung

### 2.1 Straßenkreuzungen ohne eigenes Terrain

`mirrorJunction`, `fanJunction`, `sideCross` und `deadEnd` sind Kartenbelohnungen mit eigener Straßenform (`roads` in `data.js`), rendern aber aktuell alle als `tile_straight` mit **prozedural gezeichneter Straße** (`proceduralRoads:true` in `model-map.js`) – die Straße kommt aus dem Code, aber der Untergrund ist die schlichte Wiese der Basis-Geraden. Damit sehen vier unterschiedliche, seltene Belohnungskarten wie dieselbe Wiese aus.

Empfehlung: **eigenes Terrain, geteilte Straßenlogik.** Du modellierst für jede Karte ein eigenes `tile_<id>.glb` mit charakteristischem Untergrund (Gras/Fels/Deko wie gewünscht), lässt aber **keine Straßenmesh-Geometrie** darin – die zeichnet weiterhin der Code anhand von `tile.roads`. Objekt `road`/`road_verge` also weglassen oder wie bei `tile_straight`/`tile_rescue` über den `noRoad`-Mechanismus ausblendbar machen (siehe `three-renderer.js`, `template.noRoad`). Das ist ein kleiner Zusatz im Renderer (dieselbe Datei zusätzlich unter dem Kartennamen suchen, sonst Fallback `tile_straight`), aber rein additiv.

| Karte | Straßenform | Slots | Optikidee |
|---|---|---|---|
| `mirrorJunction` (Spiegel-Abzweig) | Durchgang + Abzweig gegenüber | 2 | Zwei kleine Wegweiser-Pfosten an der Gabelung, leicht schräg zueinander („Spiegel"-Thema), sonst ruhiges Grasland. |
| `fanJunction` (Fächerkreuzung) | 3 Enden auf einer Seite | 2 | Kleiner Rastplatz mit Feuerstelle im Rücken der drei Straßenenden, Heuballen/Fässer als Blickfang. |
| `sideCross` (Seitenkreuzung) | 4 aufeinanderfolgende Enden | 2 | Belebter Wegknoten: niedriger Zaun/Geländer säumt die Kurve, ein Karren am Rand. |
| `deadEnd` (Bastionssackgasse) | 1 Ende | 2 + 1 Gebäudeslot | Kleine befestigte Bastion mit Palisade/Steinmauer, die die Straße abriegelt – muss auch ohne Turm/Gebäude klar als „Ende der Straße" lesbar sein. |

Für `rescueTunnel`, `buildingPlot`, `buildingQuarter`, `buildingDistrict` reicht die schlichte Optik weiterhin – sie sind Notlösungen bzw. reine Bauflächen, keine Belohnungskarten mit Identität.

### 2.2 Konsistente Deko-Platzierung (Blumen, Steine, Büsche)

`model-map.js` liefert mit `propAngle(shape, slots)` bereits einen Winkel, der Deko **zwischen zwei Straßenenden und mit Abstand zu Turmplätzen** setzt – nutze diese Logik als Richtschnur beim Modellieren, statt Deko zufällig zu verteilen:

- Deko sitzt bevorzugt in den „freien" 60°-Sektoren zwischen Straßenkanten, nie auf oder direkt neben `tower_slot_N`.
- Radius für Einzeldeko (Blume, Busch, Stein) ca. 0,55–0,85 vom Zentrum, nie über 0,9 hinaus (Hexgrenze).
- Dieselbe Grundform (`smallCurve`, `tee`, …) taucht in mehreren Karten auf (siehe 2.3/3). Baue die Deko nach Möglichkeit **modular** (einzelne Objekte statt verschmolzener Meshes), damit sie sich später pro Karte austauschen lässt, ohne die Straße neu zu bauen.
- Biom-Tint (Abschnitt 4) greift automatisch auf Materialien, deren Name `grass`, `foliage` oder `soil` enthält – benenne Wiesen-/Busch-/Erdmaterialien entsprechend, dann funktioniert die Einfärbung in Wüste/Sturmland/Aschelande ohne weiteres Zutun.

### 2.3 „Weites Land" vs. „Lange Straße"

Beide Karten nutzen dieselbe Straßenform (Kanten 0/3, 2 Slots) und sehen dadurch zu ähnlich aus, obwohl sie mechanisch unterschiedlich sind: `empty` ist offenes Land, `longRoad` soll Gegner länger im Hex halten.

Das Spiel hat für `longRoad` bereits eine eigene, geschwungene Gegner-Laufkurve hinterlegt (`LONGROAD_CENTERLINE` in `map.js`, ein flacher S-Bogen). Aktuell ist die Kurve mit max. ±5,8 Welteinheiten (≈ ±0,11 Hex-Radius) Ausschlag sehr flach – zu flach, um sich vom geraden `empty`-Weg optisch abzuheben. Vorschlag:

- **`tile_longRoad`:** Straße deutlich sichtbar im Zickzack führen – **zwei klare Richtungswechsel** statt einem sanften Bogen (S- oder Z-Form), Straßenrand mit Trittsteinen/Wurzeln, die den Schlenker betonen. Passe dabei die Straße an die tatsächliche Laufkurve an, sonst wirken Gegner, als würden sie neben dem Weg laufen. Wenn du den Schlenker stärker machst, sag Bescheid – dann ziehe ich `LONGROAD_CENTERLINE` im Code nach, damit Modell und Pfad wieder übereinstimmen.
- **`tile_empty`:** bewusst **kein** Schlenker – offenes, flaches Grasland mit vereinzelten Feldsteinen/Büscheln, gerade Straße. Der Kontrast „gerade & karg" vs. „verschlungen & bewachsen" macht den Unterschied auch ohne Statblick erkennbar.

---

## 3. Effekt-Tiles erkennbarer machen

Aktuell teilen sich viele Belohnungskarten mit Bonus (aus `CARD_LIBRARY`) ihr Modell mit einer einfachen Grundform (`model`-Alias in `data.js`), z. B. `sentryBend`, `warBend`, `frostBend` und `emberBend` sehen alle exakt wie `tile_smallCurve` aus. Damit ist der Bonus nur im Karten-Tooltip sichtbar, nicht auf der Map. Vorschlag für ein **einheitliches Vokabular**, das pro Bonusart gilt (nicht pro einzelner Karte) – das hält den Modellierungsaufwand überschaubar und funktioniert automatisch für künftige Karten mit demselben Bonustyp.

Technische Basis: Der Renderer liest die Höhe eines Turmplatzes direkt aus der Position des `tower_slot_N`-Objekts im Modell (`slot.pos.y` in `three-renderer.js`) – **nur X/Z werden vom Spiel überschrieben, die Höhe kommt exakt aus deinem Modell.** Ein höher platziertes `tower_slot_N` erzeugt also ohne jeden Code-Zusatz einen sichtbar erhöhten Turm.

### 3.1 Reichweiten-Bonus (`towerRange`) → erhöhter Turmplatz

Plattform (Podest/Fels/Stufe) unter `tower_slot_N` anheben, gestaffelt nach Bonushöhe. Referenz: Standard-Plattenhöhe ist 0,03–0,05.

| Bonus | Beispielkarten | Podesthöhe (`tower_slot_N`-Position) | Optikidee |
|---|---|---|---|
| +15 % | `watchtower` | 0,10–0,14 | niedrige Steinstufe |
| +20–25 % | `sentryBend`, `signalCross`, `royalBend`, `crownCross` | 0,16–0,20 | deutliche Fels-/Holzplattform, ggf. kleine Treppe modelliert |
| +30–40 % | `highGround`, `citadel`, `warBend` | 0,22–0,28 | Aussichtsfelsen oder Turmstumpf-Sockel, Platz wirkt „erhöht über der Straße" |

`highGround`, `citadel` und `watchtower` haben bereits eigene Modelle – bei ihnen reicht es, die vorhandenen Sockel entsprechend zu erhöhen. Für `sentryBend`, `warBend`, `royalBend`, `crownCross`, `signalCross` braucht es eigene Varianten ihrer Basisform (siehe Tabelle 3.4), weil sie aktuell auf die Basisform aliasen.

### 3.2 Schaden-Bonus (`towerDamage` oder turmspezifischer Bonus) → Rune/Banner am Sockel

Kein Höhenunterschied, sondern eine **glühende Markierung direkt am `tower_slot_N`**: eine kleine eingeritzte oder gemalte Rune, ein Wimpel oder eine kleine Statuette, in der Farbe des begünstigten Turms (Spalte `color` in `TOWERS`, siehe Abschnitt 1).

| Karte | Begünstigter Turm | Akzentfarbe | Symbolidee |
|---|---|---|---|
| `siegeRoad` | Katapult | `#c88954` | kleines Steinrad/Wagenrad-Relief |
| `lightningFork` | Kettenblitz | `#7fc6ff` | Blitzrune |
| `frostBend` | Freeze (Reichweite statt Schaden) | `#a4eef5` | Eiskristall-Relief, zusätzlich Podest wie 3.1 (25 % Reichweite) |
| `mineRoad` | Minenleger | `#e6a75f` | kleines Fass-Relief |
| `ballistaRoad` | Balliste | `#d9c08b` | Bolzenspitze als Wegmarke |
| `emberBend` | Flammenturm | `#ff754b` | Glutschale/Rußfleck |
| `soulFork` | Nekromantenturm | `#a6edb4` | kleiner Schädel/Rune, gilt laut Text auch für Geister |
| `battleFork`, `warCross`, `battlefield`, `warBend`, `crownCross` | alle Schadentürme | neutrales Rot-Orange | Kriegsbanner/gekreuzte Waffen am Wegrand, unabhängig vom Turmtyp |

Diese Marker sind klein (Faustgröße im Modellmaßstab, unter 0,08 hoch) und sitzen am Rand der Plattform, nicht auf ihr – der Turm selbst darf nicht verdeckt werden.

### 3.3 Einkommen (`income`) → sichtbares Gold/Warenlager

Gilt für `supplyRoad`, `goldRoad`, zusätzlich zu den bereits eigenständig modellierten `village`, `treasury`, `royalVillage`, `citadel`. Deko über die `propAngle`-Position (Abschnitt 2.2): kleiner Münzhaufen, Sackkarre oder Warenkiste, Goldakzent `#e6a75f`/`#f5d06e`. Je höher der Bonus, desto größer/mehr die Deko (`supplyRoad` +2 Gold: eine Kiste; `goldRoad` +4 Gold: Kiste plus sichtbarer Münzhaufen).

### 3.4 Betroffene Karten, die eine eigene Modell-Variante brauchen

Diese Karten teilen sich aktuell ihr Modell mit der Basisform und bräuchten eine eigene Datei (`tile_<cardId>.glb`, gleiche Straßenform, gleiche Herangehensweise wie 2.1 – Terrain eigenständig, Straße ggf. weiter aus der Basisform übernehmen), damit die Marker aus 3.1/3.2 überhaupt greifen können:

`sentryBend`, `battleFork`, `goldRoad`, `warBend`, `crownCross`, `royalBend`, `siegeRoad`, `lightningFork`, `frostBend`, `mineRoad`, `ballistaRoad`, `emberBend`, `soulFork`, `supplyRoad`, `signalCross`.

Priorisiere danach, wie oft die Karte im Run vorkommt bzw. wie hoch ihre Rarity ist (Common/Uncommon zuerst sichtbar machen: `supplyRoad`; danach die turmspezifischen Rare-Karten `siegeRoad` bis `soulFork`, da sie am direktesten mit einem Turm-Build zusammenhängen; Epic/Legendary zuletzt, da seltener gesehen).

---

## 4. Biomspezifische Bossmodelle

Vier Biome existieren (`biomes.js`): Grasland (neutral), Dünenmeer (Wüste, `#e2bd69`, halbierte Verlangsamung), Sturmhochland (`#7e8da9`, halber Blitz-/Windschaden), Aschelande (`#bd6047`, halber Feuerschaden). Sowohl reguläre Wellen-Bosse (alle 10 Wellen) als auch der Boss aus dem Boss-Sonderfeld übernehmen die Resistenz des Biomes, in dem sie erscheinen (`HexBiomes.guardian`) – aktuell aber ohne jede visuelle Entsprechung. Der Spieler kann die Resistenz nicht sehen, nur nachträglich im Kampf spüren.

### Stufe 1 (schnell, empfohlen zuerst): automatische Einfärbung wie bei Tiles

Tiles werden schon heute automatisch eingefärbt: Jedes Mesh, dessen Material `grass`, `foliage` oder `soil` im Namen trägt, wird in der Biomfarbe eingefärbt (`three-renderer.js`, `buildTile`). Für den Boss braucht es denselben Kniff, nur mit einem neuen Materialnamen (z. B. `plate_biome` für die Außenhaut/Panzerplatten), den ich im Renderer analog behandle. Für dich als Modellierer heißt das: **eine** `enemy_boss.glb`-Datei, aber das Außenhaut-/Gesteinsmaterial sauber benannt, damit die Einfärbung greift. Der Glutkern (`core`) bleibt unabhängig davon emissiv-orange (Ascheland-Thema) – dieser Teil wird nicht eingefärbt.

### Stufe 2 (später, mehr Wirkung): eigene Silhouetten pro Biom

Vier eigene Dateien mit angepasster Form, nicht nur Farbe. Basis bleibt der Obsidian-Wächter aus `ASSET_SPEC_v2.md` (Höhe 0,70, Breite bis 0,55, bis 1 500 Dreiecke, `arm_l/arm_r/leg_l/leg_r`, `core`).

| Datei | Biom | Resistenz | Optikidee |
|---|---|---|---|
| `enemy_boss.glb` | Grasland (Standard) | keine | bestehender Obsidian-Wächter, unverändert – dient als Fallback für nicht zugeordnete Fälle. |
| `enemy_boss_ash.glb` | Aschelande | −50 % Feuerschaden | Panzerplatten wirken geschmolzen/verschmolzen, breitere Risse mit hellerer, fast weißer Glut, Rußkruste an den Rändern – liest sich als „hat schon im Feuer gestanden". |
| `enemy_boss_storm.glb` | Sturmhochland | −50 % Blitz-/Windschaden | Schlankere, windschnittigere Silhouette, kleine Kristallzacken statt Glutrissen, blauweißes Flackern (Emissive) statt Orange, evtl. leichte Schwebe-/Windpartikel um die Schultern (Deko-Objekt `wisps`, analog Nekromant). |
| `enemy_boss_desert.glb` | Dünenmeer | halbe Wirkung von Slow-Effekten | Sandstein-/Glasgestein-Panzerung statt reinem Obsidian, sichtbare Sandschleier am Sockel, Kern glüht eher bernsteinfarben als orange. |

`enemy_boss_ash` liegt optisch am nächsten am bestehenden Modell (Ascheland war ohnehin die ursprüngliche Inspiration mit Obsidian und Glutkern) – dort reicht ggf. Stufe 1 allein schon aus. `storm` und `desert` profitieren am meisten von einer eigenen Silhouette, weil sie sich stofflich am stärksten vom Referenzmodell unterscheiden.

Die drei periodischen Boss-Varianten (`iron`/Eisenkoloss, `hunter`/Sturmjäger, `summoner`/Seelenmatriarchin aus `waves.js`) sind unabhängig von Biomen – sie sind ein mögliches Folgeprojekt (eigene Silhouetten je Verhalten, z. B. Eisenkoloss zweiarmig-schwer, Sturmjäger niedrig-vierbeinig-schnell, Seelenmatriarchin mit sichtbaren kleinen Dienern am Umhang), aber nicht Teil dieser Spezifikation.

---

## 5. Ablage, Priorität

```
assets/towers/tower_archer_marksman.glb
assets/towers/tower_archer_eagleEye.glb
assets/towers/tower_archer_volley.glb
assets/towers/tower_archer_arrowRain.glb
assets/towers/tower_catapult_siege.glb
assets/towers/tower_catapult_fortressBreaker.glb
assets/towers/tower_catapult_barrage.glb
assets/towers/tower_catapult_rockStorm.glb
assets/towers/tower_chain_storm.glb
assets/towers/tower_chain_tempest.glb
assets/towers/tower_chain_overload.glb
assets/towers/tower_chain_thunder.glb
assets/towers/tower_freeze_deepFrost.glb
assets/towers/tower_freeze_absoluteZero.glb
assets/towers/tower_freeze_frostField.glb
assets/towers/tower_freeze_winter.glb
assets/towers/tower_mine_demolition.glb
assets/towers/tower_mine_earthquake.glb
assets/towers/tower_mine_minefield.glb
assets/towers/tower_mine_carpet.glb
assets/towers/tower_ballista_harpoon.glb
assets/towers/tower_ballista_dragonSlayer.glb
assets/towers/tower_ballista_repeater.glb
assets/towers/tower_ballista_boltStorm.glb
assets/towers/tower_flame_inferno.glb
assets/towers/tower_flame_sunfire.glb
assets/towers/tower_flame_wildfire.glb
assets/towers/tower_flame_firestorm.glb
assets/towers/tower_necromancer.glb              (neues Basismodell)
assets/towers/tower_necromancer_soulChoir.glb
assets/towers/tower_necromancer_soulLegion.glb
assets/towers/tower_necromancer_soulKeeper.glb
assets/towers/tower_necromancer_soulLord.glb
assets/tiles/tile_mirrorJunction.glb
assets/tiles/tile_fanJunction.glb
assets/tiles/tile_sideCross.glb
assets/tiles/tile_deadEnd.glb
assets/tiles/tile_longRoad.glb                    (überarbeitet, mehr Zickzack)
assets/tiles/tile_empty.glb                        (überarbeitet, bewusst kontrastarm dazu)
assets/tiles/tile_sentryBend.glb
assets/tiles/tile_battleFork.glb
assets/tiles/tile_goldRoad.glb
assets/tiles/tile_warBend.glb
assets/tiles/tile_crownCross.glb
assets/tiles/tile_royalBend.glb
assets/tiles/tile_siegeRoad.glb
assets/tiles/tile_lightningFork.glb
assets/tiles/tile_frostBend.glb
assets/tiles/tile_mineRoad.glb
assets/tiles/tile_ballistaRoad.glb
assets/tiles/tile_emberBend.glb
assets/tiles/tile_soulFork.glb
assets/tiles/tile_supplyRoad.glb
assets/tiles/tile_signalCross.glb
assets/enemies/enemy_boss_ash.glb
assets/enemies/enemy_boss_storm.glb
assets/enemies/enemy_boss_desert.glb
```

### Empfohlene Reihenfolge

1. **Nekromantenturm-Basismodell** – einziger Turm im aktuellen Turmauswahl-Screen ganz ohne eigenes Modell.
2. **Turm-Endstufen** der bereits gebauten Türme (`eagleEye`, `arrowRain`, `fortressBreaker`, `rockStorm`, `tempest`, `thunder`, `absoluteZero`, `winter`, `earthquake`, `carpet`, `dragonSlayer`, `boltStorm`, `sunfire`, `firestorm`) – stehen am längsten sichtbar im Spiel.
3. **`tile_longRoad`-Überarbeitung** (schneller Fix, hoher Wiedererkennungswert, betrifft jede Map).
4. **Common/Uncommon-Effekt-Tiles** aus 3.4 (`supplyRoad` zuerst), dann die turmspezifischen Rare-Karten.
5. Turm-Erststufen (`volley`, `marksman`, `siege`, …), Straßenkreuzungen aus 2.1, Biom-Bosse.

Wie bisher: Fehlende Dateien erzeugen keinen Fehler, sie fallen auf das nächstniedrigere vorhandene Modell zurück (Turm-Upgrade → Basisturm, Effekt-Tile → aliaste Grundform, Biom-Boss → `enemy_boss`). Du kannst also Datei für Datei nachliefern.
