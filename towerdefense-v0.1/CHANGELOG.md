# Historischer Entwicklungsverlauf

Die folgenden Einträge dokumentieren frühere Zwischenstände. Verbindlicher aktueller Funktionsstand: [README.md](README.md). Spätere Einträge können frühere Angaben ersetzen.

# Hex Bastion – V0.7-dev

## V0.7 – Modelle, Gegnerabstand und Grafikstufen

- Neue Modelle eingebunden: Minenleger, Balliste, Flammenturm, fünf Gegner (Kiwi-Krieger „Vik“, Ork-Wächter, Goblin-Runenmeister, Kobold, Obsidian-Wächter), Haus, Schmiede, Markt und die Straßenmine. Vorgaben in ASSET_SPEC_v2.md. `enemy_warded` wird geladen, Gebäude und Minen nutzen ihre Modelle statt Platzhalter. Nur die Upgrade-Varianten der Türme fehlen noch.
- Gegner laufen nicht mehr ineinander: Spawnabstand hängt vom Tempo ab, Nachfolger bremsen vor dem Vordermann (Bosse ausgenommen). Neuer Test in combat.test.cjs. Das Balancing (`scripts/balance-*.json`) stammt noch aus der Zeit davor.
- Performance des 3D-Renderers: Bildrate begrenzt (60/s in Waves, sonst 30/s), Schattenkarte 2048 statt 4096, Pixeldichte höchstens 1,5. Grafikstufe „niedrig“ per `?low` oder automatisch bei dauerhaft niedriger Bildrate. Anleitung: PERFORMANCE_TROUBLESHOOTING.md.
- Repo: Projekt liegt wieder direkt im Root, der Unterordner Philetstuben_Defense-main ist entfernt. 121 Tests.

## V0.7 – Gegnermodelle (Vorbereitung)

- Der 3D-Renderer lädt optional `assets/enemies/enemy_normal|armored|swarm|boss.glb`, dreht Gegner in Laufrichtung, animiert Wippen sowie optionale Gliedmaßen (`leg_l/leg_r/arm_l/arm_r`) und zeigt Verlangsamung als blauen Ring. Ohne Datei bleiben die farbigen Kugeln. Modellvorgaben in ASSET_SPEC.md (Goblins, Orks, Obsidian-Wächter).
- Der mitgelieferte Server liefert `/assets/index.json` mit allen vorhandenen Modellen; der Renderer lädt nur diese (keine 404-Meldungen für noch fehlende Modelle).

## V0.7 – 3D-Kamera frei bewegbar

- Linke Maustaste ziehen verschiebt die Karte (ein Klick ohne Ziehen wählt weiterhin, ab 5 Pixel Bewegung wird gezogen). Rechte oder mittlere Maustaste ziehen dreht die Ansicht um den Blickpunkt (Yaw) und kippt sie (Neigung 12°–88°), wie die mittlere Maustaste in Blender. Mausrad zoomt zum Mauszeiger. "Zur Base" setzt auch Drehung und Neigung zurück.

## V0.7 – Turmplätze neben der Straße

- Turmplätze hängen jetzt von der Hexart ab (`SLOT_LAYOUTS`, `HexMap.slotOffsets`). Vorher lagen sie für alle Tiles gleich und überlappten bei 14 von 17 Hexarten die Straße, teils lag der Turm mittig darauf. Jetzt mindestens 4 Einheiten Abstand (Sechserkreuzung bauartbedingt 1) und innerhalb des Hex. Der 3D-Renderer setzt die Plattformen an diese Positionen; SVG und Kampf nutzen dieselben Werte.
- Neuer Test prüft alle Hexarten in allen sechs Rotationen. 93 Tests.

## V0.7 – 3D-Renderer (Three.js)

- `three-renderer.js`: Three.js-Adapter mit derselben Schnittstelle wie der SVG-Renderer (render/reset/project/zoom/resetView/getView/destroy). Lädt 28 `.glb`-Modelle aus `assets/` (21 Tiles, 3 Sonderfelder, 4 Türme), fasst sie je Material zusammen und zeichnet Tiles, Türme, Gebäude-Platzhalter, Gegner, Geschosse, Reichweiten, Upgrade-Hinweise und Beschriftungen. Turrets zielen auf den nächsten Gegner.
- `model-map.js` (renderer-unabhängig, getestet): Zuordnung Tile -> Modell und Rotation, Straßenform-Erkennung für Rettungshexe, Deko-Position auf Sonderfeldern.
- Picking per Raycast (Hex-Felder, Turmplätze, Türme, Gebäudeplätze), Hover-Vorschau mit Modell, Kamera schräg von oben (Rechtsklick ziehen, Mausrad zoomt zum Mauszeiger).
- Start: `npm install`, `npm start`, `http://localhost:8080`. Doppelklick auf `index.html` (file://) oder `?svg` nutzt weiterhin den SVG-Renderer, ebenso fällt das Spiel ohne WebGL darauf zurück.
- Tests: 92 (5 neue für model-map). Noch offen: Gebäudemodelle, Gegnermodelle, Turm-Upgrade-Varianten, Effekte/Animationen, Performancetest bei großen Karten.

## V0.7 – Kartenlayout und erste Exploration

- Gleich breite Kartenspalten mit `minmax(0,1fr)`, breiteres Seitenpanel (460 px) und Rewardfenster. Gemeinsame feste Zeilen für Rarity, Hexbild, Name, Beschreibung und Slots; keine vertikale Verschiebung ausgewählter Karten. Kleine Displays erhalten angepasste, weiterhin einheitliche Zeilen.
- Erster Exploration-Prototyp: fünf Schatzlandmarken pro Run, Seed-reproduzierbar in Entfernung 3–6 Hexe von der Base. Separater Zufallsstrom verändert Kartenrewards nicht.
- Sichtweite 1 identifiziert Landmarken; bis Entfernung 4 erscheinen sie unbekannt als ?. Außerhalb bleiben sie verborgen. Sicht bezieht sich auf alle gelegten Hexe, nicht nur auf die Base.
- Legales Placement auf einem Schatzfeld gibt einmalig 20 Gold. Sonderfelder belegen selbst keine Maphexen und erzwingen keine vorgegebenen Straßen. Neue Hexe müssen weiterhin Straßen verbinden und mindestens einen Gegner-Eingang erhalten.
- `exploration.js` hält Landmarken/Sicht/Rewards ohne Rendererabhängigkeit; SVG zeigt die Symbole. Allgemeines Terrain-Fog-System, Shrine und Boss sind noch offen in V0.7.
- 47 Logiktests und Syntaxprüfungen bestanden. Visuelle Prüfung von Kartenlayout/Exploration offen. Markt und Schmiede ausdrücklich noch nicht vom Nutzer im Spiel verifiziert; technische Tests ersetzen diesen Test nicht. Economy-/Build-Balancing ebenfalls offen.

## V0.6 – kontextuelles Gebäudemenü und Synergien

- Gebäudeinfos und Käufe ausschließlich im Panel am angeklickten Gebäudeslot, nicht im allgemeinen Towerkaufmenü. Auch belegte Slots zeigen Gebäudeeffekt und automatischen Hexbonus. Bedienbar in Bau-/Wavephase; andere Phasen erlauben nur Infos.
- Dorfhex weiter sofort +2 Gold je überlebter Wave. Haus zusätzlich +3. Ausbau nicht nötig für ursprüngliches Dorfeinkommen.
- Schmiede (40 Gold): +20 % Tower-Schaden auf eigenem/direkt benachbarten Hexen. Gilt für bestehende, neue und ausgebaute Tower. Keine Wirkung auf schadensfreie Freeze-Auren.
- Markt (35 Gold): 15 % Rabatt auf Towerbau und Upgrades auf eigenem/direkt benachbarten Hexen. Preise auf volle Goldstücke aufgerundet, keine Gebäuderabatte. Keine Stapelung gleicher Supportboni. Undo erstattet tatsächliche Ausgaben, nicht den Listenpreis.
- Ein Gebäudetyp je Slot. Gebäude bislang dauerhaft, keine Verkäufe/Upgrades. Rechteckige Gebäudesymbole H/S/M unterscheiden Haus, Schmiede und Markt.
- 44 Logiktests und Syntaxprüfungen bestanden. Visuelle Prüfung und Economy-/Build-Balancing offen.
- Nächster Entwicklungsmeilenstein: V0.7 mit Exploration, Fog of War und ersten Special Tiles. UI-/Run-/Rendertrennung und das finale 3D-Ziel weiter berücksichtigen.

## V0.6 – erster Gebäudeschritt und Runregeln

- Neues Hex nur legal, wenn danach mindestens ein mit der Base verbundener Gegner-Eingang auf einem Nicht-Base-Hex offen bleibt. Loops erlaubt; Schließen der letzten Front verboten. Gilt für Rotation, Preview, Neuziehen und tatsächliches Placement.
- 2× Spieltempo per Toggle oder F. Bewegung, Cooldowns, Effekte und Spawnabstände verwenden denselben Simulationszeitgeber. Auto-Start bleibt eine kurze UI-Verzögerung; Audio bleibt unverzerrt.
- Gegner-Spawns liegen in der Run-eigenen Simulationsqueue statt in Echtzeit-Timern. Neustart und Game Over verwerfen ausstehende Spawns.
- Auf Dorfhexen jetzt ein eckiger Gebäudeslot, auch in der Platzierungsvorschau. Slot wählen, dann Haus kaufen: 30 Gold, zusätzlich +3 Einkommen je überlebter Wave. Bauen in Bauphase und während Waves möglich; bestehender Dorfbonus +2 bleibt. Haus und Dorf zusammen +5 je Wave. Häuser haben noch kein Verkauf-/Upgrade-Menü.
- Gebäuderegeln in rendererfreiem `buildings.js`. Schmiede und Markt bleiben nächste V0.6-Erweiterungen.
- Neue Hexkarten aus V0.5 gehören zum Rewardpool, nicht ins Startdeck. Nur ausgewählte Rewards werden ins Deck aufgenommen und später gezogen; Epic-Höhenkreuzung ist selten.
- 41 Logiktests und Syntaxprüfungen bestanden. Visueller Spieltest/Building-/Build-Balancing offen.

## V0.5 – strategische Hexkarten

- Meldungsbox oben rechts innerhalb des Spielfelds, statt unten links.
- Höhenkreuzung (Epic): ein Slot, drei Straßenenden, +25 % Reichweite für Tower auf diesem Hex (inklusive Auren).
- Waldkurve (Uncommon): ein Slot, +25 % Archer-Schaden auf diesem Hex, auch nach Spezialisierung/finalem Upgrade.
- Handelsstraße (Rare): kein Tower-Slot, +4 Gold pro überlebter Wave.
- Eigene Terrainfarben und Bonusbeschriftungen. Rewardpool enthält jetzt tatsächlich eine Epic-Karte. Startdeck unverändert.
- Gemeinsame Towerwert-Auflösung rechnet Terrainboni in Combat, Reichweitenvorschau, Kaufwerte und Upgradevergleich ein. Einkommensanzeige zeigt Hex-Boni statt ausschließlich Dorf-Boni.
- 38 Logiktests und Syntaxprüfungen bestanden. Visueller Spieltest und vergleichendes Balancing bleiben offen. Danach folgt V0.6 mit echten Gebäudeslots und Economygebäuden.

## V0.5 – erster Deckbuilding-Schritt

- Upgradepfeil näher am Tower, mit leichter Überlappung am oberen rechten Rand. Nicht-interaktive Hinweislayer über den Towern; Tower-Klickziele bleiben stabil.
- Rewards ziehen zuerst eine Rarity gewichtet (Common 55, Uncommon 30, Rare 12, Epic 3, Legendary 1), dann eine zufällige Karte dieser Rarity. Bereits gewählte Karten werden für das aktuelle Angebot ausgeschlossen; drei unterschiedliche Karten. Nur Rarities mit verfügbaren Karten nehmen teil. Daher sind Gewichte keine festen Prozentwerte für das gesamte Angebot.
- Seed reproduziert die gewichteten Angebote innerhalb dieser Version. Frühere Versionen erzeugen andere Angebote.
- Vorläufige Card-Removal-Quelle: Nach dem Kartenreward jeder sechsten Wave optional eine Kartenkopie entfernen. Auswahl zeigt Anzahl je Karte. Mindestens fünf Karten bleiben im Deck. Entfernung betrifft Deck und genau eine Kopie in Draw/Discard/Hand; bereits gelegte Hexe und Tower bleiben unverändert. „Keine Karte entfernen“ setzt den Run fort.
- Quelle/Rhythmus sind Prototypregeln, keine finale Shrine-/Special-Tile-Entscheidung. Card Removal kostet aktuell kein Gold.
- `deck.js` enthält Reward-/Removalregeln ohne Rendererabhängigkeit.
- 36 Logiktests und Syntaxprüfungen bestanden. Visueller Spieltest und Reward-/Build-Balancing sind offen. Strategisch besondere neue Hexkarten fehlen noch für den vollständigen V0.5-Meilenstein.

## V0.4 – sichtbare Spezialisierung und finale Stufen

- Nach dem Towerkauf bleibt das Towerpanel geschlossen. Erst Klick auf den platzierten Tower öffnet es.
- Jeder Zweig hat ein eigenes Symbol und eine Farbe; zusätzlicher Ring und kleine Stufenzahl unterscheiden Basis, Spezialisierung (2) und finale Stufe (3). Tooltip nennt Name, Stufe und gewählten Zweig.
- Ein kleiner ↑ am Tower bedeutet: Ein erlaubtes Upgrade ist aktuell bezahlbar. Hinweis aktualisiert sich bei Gold-/Phasenänderungen, ohne Tower-Klickziele zu ersetzen.
- Alle vier Tower haben zwei Zweige und je Zweig eine finale Stufe. Freeze: Tiefenfrost für stärkeren Slow in kleinem Radius oder Frostfeld für große Abdeckung; finales Upgrade bleibt schadensfreie Aura.
- Finale Stufen sind nur nach dem passenden Zweig kaufbar. Wechsel und erneuter Kauf sind gesperrt; ursprüngliches Bauphase-Undo erstattet auch finale Upgradeausgaben.
- Kettenblitz-Abschwächung hat eine Untergrenze von 25 % Schaden, damit große Blitznetze nicht versehentlich heilen.
- 32 automatisierte Tests und Syntaxprüfungen bestanden. Visuelle Prüfung und vollständiges Build-Balancing fehlen weiterhin; deshalb bleibt die Version V0.4-dev.3.
- Nächster Schritt: V0.4-Builds im Spiel vergleichen und balancieren; anschließend V0.5 mit gewichteten Kartenrewards, besonderen Hexen und Card Removal.

## V0.4 – Towerpanel und weitere Zweige

- „Hand“ aus der Deckübersicht entfernt. Deck, Nachzieh- und Ablagestapel bleiben sichtbar.
- Upgrades und Bau-Undo aus dem allgemeinen Kaufmenü entfernt. Klick auf einen Map-Tower öffnet ein Panel bei diesem Tower; es bleibt auch während Waves bedienbar und bewegt sich beim Zoom/Panning mit. Schließen über × oder Klick außerhalb.
- Aktuelle Werte und Upgradevergleich: Schaden, Reichweite, Schussintervall, Splash sowie Zielzahl/Sprungdistanz. Werte sind Basisschaden je Treffer, vor gegnerischer Rüstungsreduktion.
- Katapult: Belagerung (45 Gold, 36 Schaden, 1,8 s, 230 Reichweite) oder Steinhagel (45 Gold, 13 Schaden, 0,65 s, 190 Reichweite). Beide durchschlagen Gegnerlinien.
- Kettenblitz: Sturmnetz (45 Gold, 7 Schaden, fünf Ziele, 95 Sprungdistanz) oder Überladung (45 Gold, 18 Schaden, zwei Ziele, 1,1 s, 155 Reichweite). Folgetreffer behalten die vorhandene Schadensabschwächung.
- Zweigwahl einmalig. Upgrades folgen denselben Kauf- und Undo-Regeln wie zuvor. Finale Upgrade-Stufen und ausführliches Build-Balancing stehen aus.
- 28 Logiktests und alle Syntaxprüfungen bestanden. Visuelle Prüfung von Panelposition und Wertvergleich offen.

## V0.4 – erster Teil und Nutzerkorrekturen

- Leertaste startet die Wave in der Bauphase. Beim Schreiben in Eingabefeldern und auf Buttons/Dropdown-Köpfen bleibt deren Tastaturbedienung erhalten.
- Freeze ist jetzt eine reine Aura: 50 % Slow auf alle Gegner in Reichweite, kein Schaden, kein Schuss und keine stapelnden Slows. Der Radius ist dauerhaft dezent sichtbar. Außerhalb der Aura endet die Wirkung im nächsten Simulationsschritt.
- Wave-Ende löscht verbliebene Schuss-/Blitzeffekte, damit sie zwischen Waves nicht stehen bleiben.
- Archer einmalig spezialisieren: Scharfschütze (35 Gold, 22 Schaden, 190 Reichweite, 0,85 s) oder Salven (35 Gold, 7 Schaden, 0,65 s, Splashradius 55). Tower auf der Map auswählen, dann Zweig wählen. In Bau- und Wavephase möglich. Undo vor Wave-Start erstattet den gesamten bezahlten Bau-/Upgradepreis.
- Ab Wave 3 schnelle Schwarmgegner (60 % Basis-HP, 130 % Tempo); ab Wave 4 gepanzerte Gegner (130 % HP, 80 % Tempo, 50 % weniger Archer-Schaden). Katapult und Blitz umgehen diese erste Rüstungsregel.
- Waveplanung zeigt die tatsächliche Zusammensetzung und HP je Typ. Alle Typen geben zunächst 3 Gold je Kill.
- 27 automatisierte Tests und Syntaxprüfungen bestanden. Neue UI und Balance müssen manuell geprüft werden.
- Noch offen im V0.4-Meilenstein: weitere Towerzweige, finale Upgrade-Stufen und Vergleich mehrerer vollständiger Builds.

## V0.3 – Straßen und Wege

- Deck und Kartenstapel über die Deckanzeige oben ausklappbar. Der separate Button und Dialog sind entfernt.
- Eine gemeinsame Straßen-Punktfolge für Karte, Hover-Vorschau, Spielfeld und Gegnerbewegung. Kurven verlaufen nun gekrümmt; der Hub liegt je nach Kurvenart unterschiedlich.
- „Lange Straße“ wieder im Kartenpool: sichtbar gewundener Weg, zwei Slots, tatsächlich längere Durchlaufzeit als „Weites Land“.
- Gewichtetes Pathfinding nach den tatsächlichen Punktfolgen-Längen. Gleich lange Alternativen teilen die Gegner abwechselnd; längere Alternativen bleiben ungenutzt. Die Anzahl Hexe allein entscheidet nicht mehr.
- 23 Logiktests und JavaScript-Syntaxprüfungen bestanden. Visuelle Prüfung der neuen Kurven, langen Straße und Deck-Ausklapper ist offen.
- Nächster Planmeilenstein: V0.4 mit ersten Tower-Spezialisierungen und Gegnerprofilen. Das verbindliche 3D-Ziel bleibt Grundlage, siehe `ARCHITECTURE.md`.

## V0.3 – vorheriger erster Teil

- Waveplanung über die Waveanzeige, Goldplanung über die Goldanzeige oben ausklappbar; kein eigener Planungskasten im Seitenpanel.
- Combat nach `combat.js` ausgelagert, ohne DOM-/SVG-Abhängigkeiten.
- Gleichmäßige Gegnerbewegung entlang der tatsächlichen Länge bestehender Wegsegmente.
- Kettenblitz springt bis zu zweimal weiter, jeweils maximal 75 Simulationseinheiten vom letzten Ziel. Folgesprünge dürfen außerhalb der initialen Towerreichweite liegen.
- Freeze Tower: 30 Gold, 2 Schaden, 145 Reichweite, Schuss alle 0,8 Sekunden; 50 % Verlangsamung für 1,5 Sekunden. Wiederholte Treffer erneuern den Effekt, stapeln ihn nicht.
- Finales 3D-Ziel ausdrücklich festgehalten, siehe `ARCHITECTURE.md`. SVG bleibt Prototyp; Engineentscheidung offen.
- Noch offen im V0.3-Meilenstein: unterschiedliche Straßengeometrie innerhalb der Hexe und nach Weglänge gewichtetes Pathfinding.

Alle Logiktests: `node --test --test-isolation=none tests/*.test.cjs`. 21 Tests bestanden; visuelle Prüfung der neuen Ausklapper und Freeze-Darstellung offen.

## V0.2.2 – Wavebau-Fix und Vorausplanung

- Interaktive Tower und Slots bleiben während Animationen in einer eigenen SVG-Ebene bestehen. Goldänderungen aktualisieren Kaufbuttons, ohne sie zu ersetzen. Das behebt verlorene Klicks beim Wavebau.
- Waveplanung zeigt nächste Gegnerzahl, Typ und HP. Derzeit existieren nur normale Gegner ohne Rüstung/Spezialfähigkeiten; neue Gegnertypen sind weiterhin geplant.
- Goldübersicht: 70 Startgold, 3 je Kill, 10 je überlebter Wave, 2 je Dorf und Wave. Run-Einnahmen werden nach Quelle erfasst.
- Maximaler Wave-Ertrag = Gegnerzahl × Killgold + Abschlussgold + Dorfbonus. Beispiel Wave 1 ohne Dorf: 7 × 3 + 10 = 31 Gold. Gegner, die die Base erreichen, geben kein Killgold; bei Game Over entfällt der Abschlussbonus.
- Während Waves werden verbleibende Spawns, aktive Gegner, Kills und der maximal noch erzielbare Ertrag angezeigt. Die separate nächste Wave bleibt sichtbar. Dorfbonus vor Placement ist vorläufig; künftige Bauausgaben sind nicht in der Budgetprojektion enthalten.
- Towerbudget zeigt Kosten und aktuell fehlendes Gold für jeden Typ.
- Wavewerte und Economyregeln sind in `waves.js` zentralisiert; Vorschau und Gameplay verwenden dieselben Formeln.
- 18 Logiktests bestanden, einschließlich stabiler Klickziele über Animationsframes, Kauf nach Goldänderung und Wave-/Goldvorschau. Visuelle Prüfung ist offen.

### Ergänzungen: Bauen während Waves und Raritätsfarben

- Towerbau ist in Bauphase und laufender Wave möglich. Während einer Wave gekaufte Tower kämpfen sofort mit; ihre Käufe können nicht über das Bauphase-Undo rückgängig gemacht werden.
- Kaufbuttons werden nicht mehr jeden Animationsframe ersetzt, damit Klicks und Fokus während Waves erhalten bleiben.
- Kartenrahmen und Raritätsbadge: Common grau, Uncommon grün, Rare blau, Epic lila, Legendary orange mit Glow. Gilt für Hand, Rewards und Raritätsbadges in der Deckübersicht. Der aktuelle Pool enthält noch keine Epic-/Legendary-Karten.
- Seedfeld mit Erklärung: derselbe Startwert wiederholt Karten und Belohnungen bei gleichen Entscheidungen; leer erzeugt einen Zufallsrun.
- Validierung: 16 Logiktests und JavaScript-Syntaxprüfung bestanden; die neuen UI-Änderungen sind noch nicht visuell geprüft.

## V0.2.1 – Daten, Maplogik und reproduzierbare Runs

- Karten- und Towerwerte in `data.js`; Hex-Geometrie, Straßenanschlüsse und kürzeste Wege in `map.js`.
- Seedbasierter Zufall in `random.js` für Kartenmischung und Rewards.
- Im Aktionspanel einen Seed eingeben und „Neuer Run“ drücken, um einen Run zu wiederholen. Ein leeres Feld erzeugt einen neuen Zufallsseed; der aktive Seed wird darunter angezeigt.
- Gleicher Seed und gleiche Entscheidungen ergeben dieselben Karten/Rewards innerhalb derselben Spielversion. Der Seed ist kein Spielstand und garantiert keine identischen Echtzeit-Kampfergebnisse.
- V0.2 wurde vom Nutzer erfolgreich im Spiel geprüft. Für V0.2.1 bestehen vierzehn Logiktests einschließlich Wiederholung von Startkarten und Rewards sowie einer längeren Zufallssequenz.

Nächster Schritt: Combat-Logik weiter auslagern und V0.3 mit echten Weglängen, gleichmäßiger Gegnerbewegung, Kettenblitz-Sprungdistanz und Freeze Tower umsetzen.

Erster lokaler Gameplay-Prototyp für das Tower-Defense-Roguelite-Deckbuilding-Konzept.

## Starten

Keine Installation nötig:

1. Ordner entpacken.
2. `index.html` per Doppelklick im Browser öffnen.

Falls dein Browser lokale Dateien ungewöhnlich restriktiv behandelt, alternativ im Ordner starten:

```bash
python -m http.server 8080
```

Dann `http://localhost:8080` öffnen.

## V0.1 enthält

- feste Base mit 20 HP
- Hex-Map, die während des Runs wächst
- Startdeck mit 5 Hexkarten
- 3 Karten ziehen, 1 spielen, komplette Hand danach abwerfen
- Karten rotieren
- Straßen müssen an bereits belegten Hexen korrekt anschließen
- offene Straßenenden = Gegner-Spawns
- Gegner suchen den kürzesten Weg zur Base
- Bauphase nach jedem gelegten Hex
- Gold durch Kills und Wave-Abschluss
- drei Tower: Archer, Katapult, Kettenblitz
- feste Turret-Slots auf Hexen
- Wave manuell starten oder optional automatisch
- alle 2 Waves: 1 von 3 neuen Hexkarten ins Deck
- endloser Run bis Base-HP 0

## Bewusst noch nicht enthalten

- Skilltrees / Tower-Upgrades
- Freeze-, Minenleger- und Nekromantenturm
- Armor-Klassen / Counter-System
- Fog-of-War-Special-Hexe
- Boss, Shrine, Treasure
- Card Removal
- Gebäude-Slots / Häuser / Schmiede / Markt (Dorfkarte erzeugt aktuell nur passives Gold)
- Meta-Progression / Diamanten
- verschiedene Startfestungen/Heroes
- Biome
- Hardcore Mode

## Ziel des Prototyps

Nicht Content-Menge, sondern den Kernloop testen:

**Hex wählen → Map erweitern → Tower platzieren → Wave → Reward → Deck verändert die nächste Map.**


## V0.1.1 Fixes
- Die Straßen-Grafik nutzt jetzt dieselbe Hex-Richtung wie das Pathfinding. Dadurch entspricht die sichtbare Route der tatsächlichen Verbindung.
- Beim Platzieren wird auf jedem legalen Feld eine Ghost-/Tile-Preview der aktuell rotierten Straße angezeigt. Auch die ausgewählte Karte zeigt ihre aktuelle Rotation.
- Gegner spawnen jetzt am äußeren Straßenrand statt in der Mitte des Spawn-Hexes.
- Jedes offene Straßenende zählt separat als Spawnfront.

## V0.2 – Bauphase und Übersicht

- Neu gekaufte Tower sind automatisch ausgewählt. „Bau rückgängig“ erstattet den vollen Kaufpreis ausschließlich während derselben Bauphase. Mit Wave-Start endet das Undo; ältere Tower bleiben bestehen.
- Tower-Reichweite beim Auswählen auf der Map sowie bei Hover/Fokus auf einen Tower-Kaufbutton mit ausgewähltem freien Slot.
- Tower-Menü zeigt Schaden, Schussrate und Reichweite. Kaufbuttons benötigen Bauphase, freien Slot und ausreichend Gold.
- Bonus-Income neben Gold, z. B. `32 (+4)`. Der Bonus kommt zusätzlich zum normalen Wave-Gold.
- Mausrad zoomt zur Cursorposition; +/- zoomt zur Bildmitte. Rechte oder mittlere Maustaste ziehen verschiebt die Map. „Zur Base“ und neuer Run setzen die Ansicht zurück.
- Aktuelle Spielphase im Aktionspanel.
- Deckübersicht mit Gesamtd​​eck, Hand, Nachzieh- und Ablagestapel, ohne Anzeige der Ziehreihenfolge. Während Waves läuft das Spiel weiter.

Validierung: Zwölf automatisierte Logiktests und Syntaxprüfungen bestanden. Visuelle Prüfung von Zoom, Baupanel und Deckübersicht ist offen: Der automatisierte Browser darf die lokale Datei aufgrund seiner URL-Sicherheitsrichtlinie nicht öffnen.

## V0.1.2 – Stabilisierung

### Karten und Hover-Vorschau

- Globale Zeichenreihenfolge: Gelände, Straßen, Vorschau/Reichweite, Gegner/Effekte, Tower und Slots. Straßen können keine Tower mehr überdecken.
- Straßen treffen sich an der geometrischen Mitte der gemeinsamen Hex-Kante, ohne überstehende Straßenenden.
- Klick auf einen bestehenden Tower schaltet dessen halbtransparenten Reichweitenkreis ein/aus, auch während der Wave. Ein Klick außerhalb schließt ihn.
- Die Hover-Vorschau zeigt Turret-Slots; ihre Position dreht sich mit dem Hex und wird beim Placement übernommen.

- Gegner verteilen sich pro Spawnfront abwechselnd auf gleich kurze Wege. Weitere Verzweigungen teilen ebenfalls gleichmäßig auf; längere Wege werden nicht gewählt. Die aktuelle Distanz entspricht der Anzahl Hex-Verbindungen.
- Lokale, synthetisierte Sounds für alle drei Türme, Kills, Base-Treffer, Hex-/Towerbau, Wave-Start, Abschluss und Game Over. Sound-Schalter und Lautstärkeregler im Baupanel. Browser-Audio aktiviert sich beim ersten Klick oder Tastendruck.

- Die bisher identischen Karten „Lange Straße“ und „Weites Land“ sind zu „Weites Land“ zusammengefasst: gerade Straße mit zwei Turret-Slots. Eine eigenständige lange Straße kommt erst zurück, wenn ihr Straßenverlauf und Gameplay tatsächlich abweichen.
- Die Hex- und Straßenvorschau erscheint nur auf dem Feld unter dem Cursor. Andere mögliche Positionen zeigen keine Vorschau. Ungültige Anschlüsse werden beim Hover rot markiert.

- Rungebundene Timer: Ein neuer Run und Game Over stoppen ausstehende Spawns und Auto-Start. Auch bereits vorgemerkte alte Callbacks können den neuen Run nicht verändern.
- Eindeutige Phasen für Placement, Bau, Wave, Reward und Game Over. Runwechsel schließt das Reward-Fenster.
- Wave-Abschluss wartet auf alle geplanten Spawns und das Ende der Gegner; kein separater Polling-Timer mehr.
- Automatisches Neuziehen garantiert eine spielbare Hand, sofern das Deck eine legale Karte enthält.
- Falls im gesamten Deck kein legales Placement existiert, entfällt das Placement für diesen Turn; Bauphase und Wave bleiben möglich. Dies ist eine vorläufige Anti-Blockade-Regel.
- Türme wählen keine bereits getöteten Gegner als Ziele.

### Logiktests

Mit Node.js aus dem Projekt-Unterordner ausführen:

```bash
node --test --test-isolation=none tests/core.test.cjs
```

Die Tests prüfen Kartenrotationen, Nachbaranschlüsse, Loops, kürzeste Wege, Spawnfronten, Runwechsel, Reward, Game Over und das Verhalten bei einem unspielbaren Deck. Sie ersetzen keinen visuellen Browser-Spieltest.

### V0.7-dev – blockiertes Deck und Sichtkorrektur
- Keine passende Karte im gesamten Deck: einmaliges kostenloses Rettungshex mit passenden Straßen, ohne Slots/Boni; weder dauerhafter Deckzugang noch Reward. Letzter Eingang darf nicht in einer vollständig eingeschlossenen Einzelzelle enden. Kein vollständiger Mehrzug-Lookahead.
- Jedes gelegte Hex deckt Landmarken in Radius 2 auf. Außerhalb bleiben sie ?. Aufgedeckte Schätze bleiben grau/ungesammelt; Auszahlung erst beim Platzieren eines gegenseitig angeschlossenen Straßenhexes direkt auf dem Schatzfeld.
- Shrine/Boss weiterhin offen; dieser Schritt korrigiert die zuvor gemeldeten Spielregeln. Markt/Schmiede weiter manuell ungeprüft.

### V0.7-dev – Shrines
- Neuer Run: vier Schatzfelder und ein Shrine, seedbasiert und außerhalb der Startsicht. Bestehende Sicht-/Straßenregeln gelten für beide Typen.
- Shrine aufgedeckt: graues ✦ mit „ungenutzt“. Straßenhex direkt darauf: einmalige optionale Entfernung genau einer Deckkopie; Mindestdeckgröße 5. Überspringen verbraucht den Shrine ebenfalls. Keine Goldauszahlung.
- Auswahl hält Auto-Wave-Start an; danach Bauphase ohne zweite Kartenziehung. Bereits gesetzte Hexe/Türme bleiben bestehen. Provisorische Entfernung nach jeder sechsten Wave bleibt vorerst zusätzlich erhalten.
- Logik bleibt in Exploration/Deck, Darstellung und Ablauf in game.js; 3D-Ziel weiter berücksichtigt. Bossaktivierung/Begegnung nächster Schritt. Manuelle Sichtprüfung, Markt/Schmiede und Balancing offen.

### V0.7-dev – dynamischer Nebel und erste Bossbegegnungen
- Klare Sicht: Radius 2 um jedes gesetzte Hex. Nebel: sechs weitere Hexes (Gesamtradius 8). Außerhalb keine Karte/Fragezeichen. Helle/dunkle Hexflächen plus Legende zeigen die Sichtgrenzen; Cache des Nebellayers wird nur bei Expansion erneuert.
- Unbegrenzte Expansion: neu erkundete Koordinaten erzeugen seedbasiert mit 4,5 % Dichte weitere Sonderfelder (55 % Schatz, 30 % Shrine, 15 % Boss). Gleiche Koordinate/Seed gleiches Sonderfeld, unabhängig von Baurichtung; kein Neuwürfeln bereits erkundeter Felder und keine feste Startliste mehr.
- Shrine zeigt vor Anschluss nur Typ und unbekannten Bonus. Aktuell weiterhin optional eine Kopie entfernen. Später: verdeckte Bonusvarianten (Karte entfernen, zusätzliche Karte, Epic/Legendary-Karte, besonderes Upgrade). Noch keine Legendary-Karten oder Zufallsbonusvarianten implementiert.
- Neuer Collect-Sound für Schatz, Shrine-Aktivierung und Bossloot; vorhandene Lautstärke-/Mute-Einstellung gilt.
- Boss: Straßenhex direkt auf dem Feld aktiviert ihn; optionaler Button startet die nächste reguläre Wave mit einem Wächter zusätzlich. Kürzester Straßenweg zur Base, 300 + 45 × Wave HP, Rüstung, 24 Tempo, 5 Basisschaden, einmalig 50 Gold bei Sieg. Kein automatischer Bossstart. Normale Waves bleiben separat startbar. Mehrere bereite Bosse werden nacheinander angeboten.
- Erste Begegnung, kein endgültiges Bossbalancing/Legendaryloot. 57 Tests plus JS-Syntaxprüfungen bestanden; visuelle Prüfung, Audio-Hörprobe und Gameplaybalancing offen. Markt/Schmiede weiter manuell ungeprüft.

### V0.7-dev – ruhigere Sicht und einheitliche Turmangebote
- Nebel endet jetzt bei Radius 6 direkt ab jedem gesetzten Hex (klare Sicht Radius 2). Sichtflächen sind dezente zusammenhängende Silhouetten ohne flächendeckendes Hexraster; unverändert präzise axiale Sicht-/Entdeckungsregeln. Legendenaussage korrigiert.
- Turmkaufangebote: linksbündige, feste Zeilen für Name, Beschreibung und Werte sowie separate rechtsbündige Preis-Spalte. Einheitliche Höhe und responsive Zeilenhöhen.
- Shrine-Auswahl nennt direkt „Shrine erschlossen · Effekt: Karte entfernen“.
- 57 Tests bestanden und JS-Syntax geprüft. Visuelle Prüfung weiterhin offen.

### Sichtdesign zurückgesetzt
Auf Nutzerwunsch wieder ursprüngliche sparsame Hex-Ansicht: nur freie Nachbarhexes, keine großflächigen Sichtflächen/Legende. Aktuelle Logik unverändert: Radius 2 klare Sicht, bis Radius 6 Nebel, dahinter unsichtbar; dynamische Sonderfelder und Erschließung bleiben erhalten. Turmangebote und Shrine-Effektbeschriftung bleiben erhalten.

### Bossstart vereinheitlicht und Sichtgrenze geprüft
- Erschlossenes Bossfeld kündigt den Wächter für die nächste Wave an. Normaler Wave-Button, Leertaste und Auto-Start nutzen denselben Ablauf; kein zusätzlicher Boss-Button mehr.
- Alle bereiten Wächter spawnen jeweils genau einmal direkt am Straßenhub ihres ausgelösten Hexes und nehmen den kürzesten Weg zur Base. Keine zufällige Eingangszuordnung. Mehrere erschlossene Bossfelder starten ihre Wächter zusammen in der nächsten Wave.
- Wave-/Goldvorschau berücksichtigt bereitstehende Bosse; laufende Goldprognose nutzt tatsächlich mögliche 50 Gold pro aktivem Wächter statt normaler 3 Gold.
- Aktuelle Sichtlogik bleibt Radius 2 klar / Radius 6 Nebel ab jedem gesetzten Hex. Renderingtest bestätigt unsichtbare Fragezeichen außerhalb und neue Sicht durch Expansion. Sparsames Sichtdesign bleibt erhalten.
- 60 Tests und Syntaxprüfungen bestanden. Manueller Spieltest offen. Als nächster Ausbau: verdeckte Shrine-Bonusvarianten.

### Verdeckte Shrine-Boni
- Sonderfeldrate unverändert: 4,5 % je geeigneter neuer Koordinate; unter Sonderfeldern 55 % Schatz / 30 % Shrine / 15 % Boss. Effektive Einzelraten: 2,475 % / 1,35 % / 0,675 %. Keine Sonderfelder innerhalb Radius 2 der Base, keine feste Anzahl garantiert.
- Shrine-Effekt seed-/koordinatenbasiert: 40 % eine Kartenkopie entfernen (Mindestdeck 5), 40 % zusätzliche Karte aus bis zu drei gewichteten Angeboten auswählen, 20 % Epic-Karte aus vorhandenem Epic-Pool auswählen. Aktuell nur Höhenkreuzung im Epic-Pool.
- Vor Straßenanschluss sichtbar nur als Shrine mit unbekanntem Bonus. Modal nennt bei Erschließung direkt den Effekt. Einmalige Auswahl/Skip verbraucht Shrine, danach Bauphase ohne erneutes Ziehen; Auto-Start wartet auf Abschluss.
- Eigener Reward-Zufallsstrom pro Shrine, verändert reguläre Deck-/Wave-Rewards nicht. Neue Karten kommen ins Deck und in den Ablagestapel. Karte wird nicht sofort als Hex gelegt.
- Legendary-Karten und besondere Upgrade-Boni noch nicht implementiert. 64 Tests und Syntaxprüfungen bestanden; manuelle visuelle Prüfung/Balancing offen. Nächster Schritt: Sonderfeld-/Bossloot-Pool weiter ausbauen, dann Renderer-Abstraktion für 3D.

### Shrine-Raritäten und Projektgedächtnis
- Shrine-Boni auf 30 % Entfernen / 30 % zusätzliche Karte / 30 % Epic / 10 % Legendary geändert. Verdeckter Effekt, einmalige Auswahl/Skip und Bauphasenrückkehr bleiben bestehen.
- Erste Legendary-Karte: Bastionskreuzung, Straßen [0,2,4], zwei Slots, +40 % Tower-Reichweite und +2 Gold pro Wave. Nutzt bestehende Terrain-/Income-Regeln und Legendary-Darstellung. Vorhandene Legendary-Gewichtung 1 erlaubt sie auch im normalen Reward; Balancing vorläufig.
- BRAIN.md im Projektroot als kompakte Übersicht über spätere Ziele und offene Entscheidungen ergänzt. Verschiedene Starthelden/Startfestungen dort erneut festgehalten; noch nicht implementiert.
- 65 Tests und JS-Syntaxprüfungen bestanden. Manueller Spieltest/Balancing offen.


### V0.7-dev – Kartenpools und Boss-Kartenbeute
- Vier neue Hexe: Kampfstraße/Wachtkurve (Epic), Königsstraße/Kriegskreuzung (Legendary). Je drei Karten in Epic-/Legendary-Rewards. Gemeinsamer Terrain-Schadensmultiplikator gilt auch auf Upgradezweigen und zusammen mit Schmiedebonus; schadensfreie Freeze-Aura unverändert.
- Bosskill merkt eine Kartenbelohnung vor. Nach überlebter Wave: 90 % Epic-Auswahl / 10 % Legendary-Auswahl je besiegtem Boss, dann normale Wave-Rewards. Seed-/feldbasierte Angebote, separater Zufallsstrom, keine zweite Auszahlung. Keine neue Shrine-Verteilung.
- 70 Tests und JS-Syntaxprüfungen bestanden; manuelle visuelle Prüfung/Balancing offen.

### V0.7-dev – Renderer-Modulgrenze für 3D
- Kartendarstellung aus game.js nach svg-renderer.js ausgelagert. render/reset/project/destroy-Schnittstelle, logische Commands für Picking und Hover. Kein direkter Schreibzugriff des Renderers auf Spielzustand.
- Gemeinsame Turm-/Gebäudeslotpositionen in map.js. Panelpositionen über Adapterprojektion statt SVG-Matrixzugriff im Controller. Layerreihenfolge und stabile Klickobjekte bleiben erhalten.
- Kamera, Weltursprung und HUD-Kartenminiaturen noch SVG-spezifisch; kein Enginewechsel oder neues Grafikdesign.
- 73 Tests und alle JS-Syntaxprüfungen bestanden. Neue unabhängige Adaptertests für eingefrorenen Spielzustand, logische Pickingaktionen, Reset/Destroy und Bildschirmprojektion. Manueller visueller Regressionstest offen.

### V0.7-dev – Weltkoordinaten und Kameraabstraktion
- Base/Geometrie auf Weltursprung (0,0) umgestellt. Kamera übernimmt bisherigen Bildschirmoffset; Minihex-Vorschauen nutzen lokale Geometrie. Reichweiten und tatsächliche Weglängen bleiben gleich.
- camera.js als DOM-freies Kameramodell plus SVG-Eingabe-/Projektionsadapter modularisiert. Renderer verwaltet Kamera, HUD nutzt Zoom/Reset/ViewChanged. Neustart setzt Kamera zurück, Destroy entfernt Listener.
- 78 Tests und Syntaxprüfungen bestanden: Weltursprung, unveränderte Routendistanzen bei Kamerabewegung, Zoomanker, Clamps/Aspect-Ratio, Reset und Adapterlistener. Manueller visueller Regressionstest offen.

### Hover-Drehhinweis und Turmverkauf
- Eckbutton zum Drehen entfernt; Hexvorschau zeigt beim Hovern einen kleinen R-Drehen-Hinweis. Rotation weiterhin per R.
- Rückgabe in ursprünglicher Bauphase vor Wave: 100 %. Sonst Verkauf während des laufenden Spiels: 50 % der tatsächlichen Investition einschließlich Branch/finalem Upgrade, abgerundet. Menü zeigt Quote/Betrag; nach Game Over gesperrt. Rückerstattungsregel zentral in data.js.
- 81 Tests und JS-Syntaxprüfungen bestanden, einschließlich Max-Level-Verkauf, rabatter Investition/Rundung, Livephasen und Hoverhinweis. Visueller Spieltest offen.

### Kreuzungen und vorgefertigte Sonderfelder
- tee heißt jetzt Y-Kreuzung (Straßen 0/2/4), neue T-Kreuzung (0/2/3) und Sechserkreuzung (0–5) im Rewardpool. Startdeck behält dieselbe bisherige Y-Geometrie.
- Sonderfelder mit seedbasierter fester Geometrie/Rotation. Schatz/Shrine: Gerade/Kleine Kurve/Große Kurve/Y/T, ein Turmplatz. Boss: alle sechs Öffnungen, keine Plätze. Sicht enthüllt graue Straßen, keine Rotation/Überschreibung per Handkarte.
- Nachbarstraße verbindet und aktiviert automatisch. Placement und Rettungshex berücksichtigen feste Nachbaranschlüsse. Verkettete Sonderfelder und mehrere Shrines werden abgearbeitet, Auto-Start wartet auf alle Entscheidungen.
- 87 Tests und Syntaxprüfungen bestanden; manueller Spieltest/Balancing offen.
