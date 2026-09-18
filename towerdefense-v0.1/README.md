# Hex Bastion – V0.7-dev

Stand: 18.09.2026. Spielbarer Browser-Prototyp eines Hex-Tower-Defense-Deckbuilders. Diese Datei beschreibt den aktuell implementierten Stand. Frühere Zwischenstände stehen im [Entwicklungsverlauf](CHANGELOG.md), spätere Ziele im [Projektgedächtnis](../BRAIN.md). Das ausführliche [Übergabeprotokoll](../README_TowerDefense_Projekt.md) enthält die Konzepthistorie.

## Starten und Bedienung

**3D-Ansicht:** einmalig `npm install`, dann `npm start` und `http://localhost:8080` öffnen (Modell-Galerie: `/viewer.html`). Ein lokaler Server ist nötig, weil der Browser `.glb`-Dateien nicht per Doppelklick lädt. Per Doppelklick auf `index.html` oder mit `?svg` läuft weiterhin die SVG-Ansicht. Modellvorgaben: [ASSET_SPEC.md](ASSET_SPEC.md). Für die Logiktests wird Node.js benötigt.

| Aktion | Bedienung |
|---|---|
| Karte auswählen / Hex platzieren | Karte anklicken, dann freie Position anklicken |
| Hex drehen | R; Hinweis direkt an der Vorschau beim Hovern |
| Wave starten | Leertaste oder Wave-Button |
| Doppeltes Spieltempo | F oder 2×-Toggle |
| Kamera zoomen | Mausrad oder +/− |
| Karte verschieben | Rechte oder mittlere Maustaste ziehen |
| Kamera zurücksetzen | Zur Base |
| Turm kaufen | Freien Turmplatz anklicken, dann Turmangebot wählen |
| Turmwerte / Upgrades | Gesetzten Turm anklicken |
| Gebäudeinformationen / Ausbau | Gebäudeslot auf Dorfhex anklicken |
| Wave-, Gold- und Deckplanung | Jeweiligen Wert oben im Header aufklappen |

Optionaler Auto-Start startet eine Wave nach dem Placement beziehungsweise nach Abschluss einer Shrine-Auswahl. Sounds lassen sich ausschalten; Lautstärke ist einstellbar. Die Effekte werden lokal mit WebAudio erzeugt.

## Run und Rundenablauf

- Start: 20 Base-HP, 70 Gold, eine Straßenöffnung an der Base und fünf Deckkarten: zweimal Gerade, Kleine Kurve, Große Kurve, Y-Kreuzung.
- Drei Karten ziehen, eine auswählen und platzieren. Danach wird die gesamte Hand abgelegt. Ein leerer Nachziehstapel wird aus dem gemischten Ablagestapel aufgefüllt.
- Nach dem Placement Türme beziehungsweise Gebäude bauen und die Wave starten. Bauen und Tower-Upgrades bleiben auch während der Wave möglich.
- Nach jeder überlebten Wave: Abschlussgold und laufendes Hex-/Gebäudeeinkommen. Alle zwei Waves eine von drei Karten für das Deck auswählen.
- Zusätzlich gibt es vorläufig nach dem Reward jeder sechsten Wave eine kostenlose optionale Kartenentfernung. Mindestens fünf Deckkarten müssen verbleiben.
- Der Run endet bei erschöpften Base-HP. Noch kein Speichern/Laden, kein Meta-Fortschritt und kein endgültiges Siegziel.

### Platzierung und Straßen

Alle Straßenanschlüsse zu bereits belegten Nachbarn müssen gegenseitig passen; das neue Hex muss an das Netz anschließen. Schleifen sind erlaubt, aber mindestens ein mit der Base verbundener Gegner-Eingang muss offen bleiben. Die letzte Öffnung darf nicht in einer vollständig eingeschlossenen Einzelzelle enden. Es gibt keine vollständige Vorausberechnung mehrerer zukünftiger Züge.

Unspielbare Hände werden neu gezogen. Passt keine Karte aus dem gesamten Deck, erscheint nach Möglichkeit ein kostenloses Rettungshex mit passenden Anschlüssen und ohne Slots/Boni. Es gehört weder dauerhaft zum Deck noch zum Rewardpool. Ist auch das nicht möglich, kann die Bauphase ohne Erweiterung fortgesetzt werden.

Die Platzierungsvorschau erscheint nur an der Cursorposition und enthält rotierte Turm- und Gebäudeslots. Straßen treffen sich an gemeinsamen Hexkanten und werden unter allen Türmen gezeichnet.

## Deck und Hexkarten

Das Deck enthält ausschließlich Maphex-Karten. Gezogene Belohnungen werden erst nach Auswahl ins Deck und den Ablagestapel aufgenommen. Kartenentfernung löscht genau eine Kopie; bereits platzierte Hexe und Türme bleiben bestehen. Der Deck-Dropdown zeigt Gesamtdeck, Nachzieh- und Ablagestapel, aber keine zukünftige Ziehreihenfolge.

| Hex | Rarität | Turmplätze | Effekt |
|---|---|---:|---|
| Gerade | Common | 1 | Gerade Straße |
| Kleine Kurve | Common | 1 | Enge 60°-Kurve |
| Große Kurve | Common | 1 | Weite Kurve |
| Y-Kreuzung | Uncommon | 2 | Drei gleichmäßig verteilte Straßenarme |
| T-Kreuzung | Uncommon | 2 | Links-rechts-Durchgang mit seitlichem Abzweig |
| Sechserkreuzung | Rare | 2 | Öffnungen in alle sechs Richtungen |
| Weites Land | Uncommon | 2 | Gerade Straße mit zwei Plätzen |
| Lange Straße | Uncommon | 2 | Gewundene Straße mit tatsächlich längerem Laufweg |
| Waldkurve | Uncommon | 1 | +25 % Archer-Schaden auf diesem Hex |
| Kreuzung | Rare | 2 | Vier Straßenenden |
| Dorfstraße | Rare | 1 | Automatisch +2 Gold/Wave und ein Gebäudeslot |
| Handelsstraße | Rare | 0 | +4 Gold/Wave |
| Höhenkreuzung | Epic | 1 | Drei Straßenenden, +25 % Tower-Reichweite |
| Kampfstraße | Epic | 1 | Gerade Straße, +20 % Schaden für Schadentürme |
| Wachtkurve | Epic | 2 | Kurve, +15 % Tower-Reichweite |
| Bastionskreuzung | Legendary | 2 | Drei Straßenenden, +40 % Tower-Reichweite, +2 Gold/Wave |
| Königsstraße | Legendary | 1 | Gerade Straße, +5 Gold/Wave und ein Gebäudeslot |
| Kriegskreuzung | Legendary | 2 | Vier Straßenenden, +30 % Tower-Schaden |

Reichweitenboni gelten auch für Auren und ausgebaute Türme. Karten sind gleich breit und haben gemeinsame Zeilen für Rarität, Hexbild, Titel, Beschreibung und Slots. Raritätsfarben: Common grau, Uncommon grün, Rare blau, Epic lila, Legendary orange.

Normale Kartenrewards nutzen Raritätsgewichte 55 / 30 / 12 / 3 / 1. Das sind Gewichte, keine garantierten festen Prozentsätze für eine Drei-Karten-Auswahl: Drei unterschiedliche Karten werden ohne Zurücklegen ausgewählt, verfügbare Raritäten werden jeweils neu gewichtet.

## Türme und Upgrades

Listenwerte vor Terrain-, Gebäude- und Upgradeboni:

| Turm | Preis | Schaden | Reichweite | Schussintervall / Wirkung |
|---|---:|---:|---:|---|
| Archer | 25 | 9 | 150 | 0,55 s; Einzelziel |
| Katapult | 40 | 18 | 190 | 1,35 s; geradlinig durch mehrere Gegner |
| Kettenblitz | 45 | 8 | 135 | 0,9 s; bis drei Ziele, Sprungabstand 75 |
| Freeze | 30 | 0 | 145 | Permanente Aura: Gegner bewegen sich mit 50 % Tempo |

Freeze schießt nicht. Seine Aura bleibt leicht sichtbar; mehrere Freeze-Auren stapeln sich nicht, die stärkste Verlangsamung wirkt. Angeclickte Türme zeigen einen halbtransparenten Reichweitenkreis. Nach dem Platzieren öffnet sich kein Upgradefenster automatisch.

Jeder Turm hat zwei alternative Spezialisierungen und anschließend eine zum gewählten Zweig passende finale Stufe:

| Turm | Zweig A | Zweig B |
|---|---|---|
| Archer | Scharfschütze: Schaden/Reichweite | Salven: Flächenschaden |
| Katapult | Belagerung: schwere Treffer/Reichweite | Steinhagel: schneller schießen |
| Kettenblitz | Sturmnetz: mehr Ziele/Sprungweite | Überladung: stärkere Treffer |
| Freeze | Tiefenfrost: stärkerer Slow | Frostfeld: größere Aura |

Das Turmmenü zeigt aktuelle Werte und Änderungen durch Upgrades. Symbole, Farben, Ringe und Stufenanzeigen machen den Ausbau sichtbar. Ein kleiner überlappender Pfeil zeigt bezahlbare Upgrades an.

Turmrückgabe erstattet 100 % der tatsächlich investierten Kosten inklusive Upgrades, solange der Turm in der aktuellen Bauphase gebaut wurde und die Wave noch nicht begonnen hat. Danach und in anderen laufenden Spielphasen ist Verkauf für 50 % der Gesamtinvestition möglich, einschließlich finaler Upgrades. Ungerade Rückzahlungen werden abgerundet; Rabatte zählen anhand tatsächlich bezahlter Preise. Das Turmmenü nennt Quote und Goldbetrag. Nach Game Over kein Verkauf. Gebäude sind dauerhaft und haben noch keine Upgrades oder Verkäufe.

## Dorfgebäude

Das automatische Dorfeinkommen benötigt keinen Ausbau. Im angeklickten Gebäudeslot kann genau ein Gebäude gebaut werden:

| Gebäude | Preis | Effekt |
|---|---:|---|
| Haus | 30 | Zusätzlich +3 Gold/Wave; Dorf und Haus zusammen +5 |
| Schmiede | 40 | +20 % Tower-Schaden auf eigenem und direkt benachbarten Hexen |
| Markt | 35 | 15 % Rabatt auf Towerbau und Tower-Upgrades auf eigenem und direkt benachbarten Hexen |

Gleiche Supporteffekte stapeln sich nicht. Rabatte werden auf volle Goldstücke aufgerundet und gelten nicht für Gebäude. Schmieden wirken auch auf bestehende und ausgebaute Türme, nicht auf die schadensfreie Freeze-Aura.

## Waves, Gegner und Gold

Jedes offene Straßenende auf einem erreichbaren Nicht-Base-Hex ist ein Spawnpunkt. Normale Gegner verteilen sich über diese Fronten. Gegner nehmen den nach tatsächlicher Straßenlänge kürzesten Weg zur Base. Gleich lange Alternativen werden je Eingang abwechselnd genutzt; ungerade Gegnerzahlen können sich um einen Gegner unterscheiden.

- Wavegröße: `min(5 + 2 × Wave, 24)` normale Gegner. Grund-HP: `28 + 7 × Wave`.
- Ab Wave 3 Schwarmgegner: weniger HP, höheres Tempo. Ab Wave 4 gepanzerte Gegner: mehr HP, langsamer und 50 % weniger Archer-Schaden.
- Normaler Kill: +3 Gold. Überlebte Wave: +10 Gold plus Hex-/Hausboni. Normaler Gegner an der Base: 1 Schaden.
- Wave-Dropdown zeigt nächste Gegnerzusammensetzung, HP und bereitstehende Bosse. Gold-Dropdown zeigt Quellen, maximale Einnahmen und Towerpreise. Laufende Prognosen berücksichtigen verbleibende Gegner und Bossloot.
- 2× beschleunigt Bewegung, Spawnabstände, Cooldowns und Effektzeiten gemeinsam. Nach Wave-Ende bleiben keine eingefrorenen Schusslinien stehen.

## Erkundung und Sonderfelder

Von jedem gesetzten Hex aus: **Radius 2 klare Sicht**, **bis Gesamtradius 6 Fog of War**, danach keine Sicht und keine Fragezeichen. Die Sicht wächst mit der Bebauung. Darstellung wieder sparsam: freie Nachbarhexes und sichtbare Sonderfelder, keine großen Sichtflächen und kein flächendeckendes Hexraster.

Neue erkundete Koordinaten erzeugen seedbasiert weitere Sonderfelder. Bereits erkundete Felder werden nicht neu gewürfelt. Innerhalb Radius 2 der Base entstehen keine Sonderfelder.

| Typ | Anteil unter Sonderfeldern | Chance je geeignetem Feld |
|---|---:|---:|
| Schatz | 55 % | 2,475 % |
| Shrine | 30 % | 1,35 % |
| Boss | 15 % | 0,675 % |
| Insgesamt | 100 % | 4,5 % |

Keine garantierte Anzahl oder feste Startliste. Im Nebel erscheinen Sonderfelder als `?`, bei klarer Sicht als graues Symbol mit ungesammeltem beziehungsweise inaktivem Status. Sonderfelder sind **vorgefertigte Hexe mit fester Straßengeometrie und Rotation**. Schatz und Shrine verwenden Gerade, Kleine/Große Kurve, Y- oder T-Kreuzung; Bossfelder haben immer alle sechs Öffnungen. Im Nebel ist die Geometrie verborgen, bei klarer Sicht werden graue Straßen und mögliche Slots angezeigt. Diese Felder dürfen nicht mit einer Handkarte überschrieben oder gedreht werden. Eine passende Straße vom gebauten Nachbarhex schließt das Feld automatisch ans Netz an und aktiviert es; eine vorbeiführende Straße reicht nicht. Beim Bauen müssen auch die festen Nachbaranschlüsse passen. Anschluss kostet keine zusätzliche Handkarte. Sonderfelder geben nur ihren Sonderbonus, keine zusätzlichen Einkommens-/Terrainboni der normalen Karten; Schatz/Shrine haben einen Turmplatz, Boss keinen. Angeschlossene Sonderfelder zählen zur Sichtregion. Ketten aus passend verbundenen Sonderfeldern werden gemeinsam erschlossen; mehrere Shrines erscheinen nacheinander.

### Schatz und Shrine

Schätze geben einmalig +20 Gold. Shrines verbergen ihren konkreten Effekt bis zur Erschließung:

| Shrine-Effekt | Wahrscheinlichkeit |
|---|---:|
| Eine Kartenkopie entfernen, Mindestdeckgröße fünf | 30 % |
| Eine zusätzliche Karte aus bis zu drei Angeboten wählen | 30 % |
| Eine Epic-Karte erhalten | 30 % |
| Eine Legendary-Karte erhalten | 10 % |

Der Epic-Pool enthält Höhenkreuzung, Kampfstraße und Wachtkurve; der Legendary-Pool Bastionskreuzung, Königsstraße und Kriegskreuzung. Raritätsspezifische Shrine-Rewards bieten damit jeweils drei Karten zur Auswahl. Das Fenster nennt direkt „Shrine erschlossen“ und den Effekt. Auswahl oder Überspringen verbraucht den Shrine. Danach Bauphase ohne erneutes Handziehen; Auto-Start wartet auf die Entscheidung. Schatz und Shrine haben einen Collect-Sound.

### Boss

Ein durch passende Nachbarstraße erschlossenes Bossfeld mit sechs Straßenöffnungen aktiviert einen Wächter für die **nächste reguläre Wave**. Wave-Button, Leertaste und Auto-Start nutzen denselben Ablauf. Alle bereiten Bosse spawnen genau einmal auf dem Straßenhub ihres eigenen ausgelösten Hexes, nicht an zufälligen Eingängen, und laufen den kürzesten Weg zur Base.

Wächterwerte: `300 + 45 × Wave` HP, Rüstung, Tempo 24, fünf Basisschaden. Sieg: einmalig +50 Gold mit Collect-Sound und nach überlebter Wave eine zusätzliche Kartenauswahl (90 % Epic, 10 % Legendary). Rarität und Angebote sind seed-/Bossfeld-basiert. Bei mehreren besiegten Bossen erscheinen die Auswahlen nacheinander, danach folgen normale Wave-Rewards. Die Kartenbeute kann übersprungen werden. Entkommt der Boss, gibt es keinen Loot. Dies ist eine erste Bossversion; weitere Lootvarianten und endgültiges Balancing fehlen noch.

## Seeds und technische Basis

Optionaler Seed für den nächsten Run; leer bedeutet zufälliger Seed. Gleicher Seed und gleiche Entscheidungen reproduzieren Karten, Rewards und Sonderfelder innerhalb derselben Spielversion. Separate Zufallsströme für Exploration und Shrine-Rewards. Kein Savegame und keine Garantie gleicher Ergebnisse über unterschiedliche Spielversionen.

Vanilla HTML/CSS/JavaScript mit SVG-Renderer. Daten und Regeln sind in `data.js`, `map.js`, `random.js`, `waves.js`, `combat.js`, `deck.js`, `buildings.js` und `exploration.js` ausgelagert. `game.js` enthält Runsteuerung und HUD. `svg-renderer.js` kapselt die Kartendarstellung, ihre Ebenen, Vorschauen und Klickflächen hinter render/reset/project/destroy. Eingaben gehen als logische Commands an den Controller; gemeinsame Slotpositionen liegen in map.js. camera.js trennt ein DOM-freies Kameramodell (Zoom/Pan/Reset) von SVG-Eingabe und Bildschirmprojektion. Der Renderer verwaltet seine Kamera; das HUD nutzt Zoom-/Reset-/ViewChanged-Schnittstellen. Audio bleibt in sound.js. Kartenvorschauen im HUD sind weiterhin SVG.

Finales Ziel bleibt **stilisiertes 3D wie Dorfromantik**. Die Regeln sollen weiterverwendbar bleiben; Die Kartendarstellung besitzt jetzt eine Renderer-Schnittstelle. Weltkoordinaten liegen jetzt um den Ursprung: Base bei (0,0), Straßen, Gegner und Slots in planaren Weltmaßen. Nur die Kamera bestimmt den Bildausschnitt. Vollständige UI-/Runtrennung und Engineentscheidung stehen noch aus; der aktuelle Eingabe-/Projektionsadapter ist weiterhin SVG-spezifisch. Ein Enginewechsel ist nicht aufwandsfrei. Details in [ARCHITECTURE.md](ARCHITECTURE.md).

## Prüfung und offene Arbeit

Zuletzt **87 automatisierte Tests und JavaScript-Syntaxprüfungen bestanden**. Tests ab diesem Appordner:

```powershell
node --test --test-isolation=none tests/*.test.cjs
```

`--test-isolation=none` vermeidet die Prozess-Spawn-Einschränkung dieser Arbeitsumgebung. Die Tests decken unter anderem Straßen/Placement, gleich lange Wege, Waveablauf, Bau während Waves, Upgrades, Gebäude, Seeds, Rettungshex, Sichtgrenzen, Bossstart/-loot, Shrine-Auszahlungen sowie Renderer-Commands, Zustandsunveränderlichkeit, Reset, Bildschirmprojektion, Weltursprung und Kamerazoom ab.

Noch offen: manueller visueller Spieltest neuer Änderungen, Audio-Hörprobe, Langzeit-/Economybalancing. Markt und Schmiede wurden vom Nutzer noch nicht im Spiel verifiziert; Logiktests ersetzen diese Prüfung nicht.

Für später vorgemerkt, noch nicht implementiert:

- Verschiedene Starthelden / Startfestungen mit eigenen Effekten, Startprofilen und Spielstilen.
- Weitere Karten und Lootvarianten sowie zusätzliche Shrine-Boni wie besondere Upgrades.
- Weitere Biome, Meta-Progression, zusätzliche Towerrollen und Speichern/Laden.
- 3D-Renderer und passende Modelle, Kamera und Picking.

Prioritäten und offene Entscheidungen werden in [BRAIN.md](../BRAIN.md) gepflegt.





