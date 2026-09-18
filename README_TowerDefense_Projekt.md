# Hex Bastion – Projektübersicht und Übergabeprotokoll

Stand: 18.09.2026 · **V0.7-dev**

## Verbindlicher aktueller Spielstand

Die vollständige, mit dem Code abgeglichene Beschreibung steht in [towerdefense-v0.1/README.md](towerdefense-v0.1/README.md): Start/Bedienung, Ablauf, Hexkarten, Türme, Upgrades, Gebäude, Gold, Gegner, Sichtregeln, Sonderfelder und technische Grenzen.

Kompaktes Projektgedächtnis und spätere Ideen: [BRAIN.md](BRAIN.md). Technische 3D-Vorbereitung: [ARCHITECTURE.md](towerdefense-v0.1/ARCHITECTURE.md). Frühere Implementierungsschritte: [CHANGELOG.md](towerdefense-v0.1/CHANGELOG.md).

Aktuell implementiert:
- Browser-/SVG-Prototyp; Start mit 20 HP, 70 Gold, fünf Deckkarten. Drei ziehen, ein Hex legen, bauen und Wave überleben; alle zwei Waves Kartenreward.
- Straßenanschlüsse, längengewichtete kürzeste Wege und Aufteilung gleich langer Wege. Letzter Eingang darf nicht geschlossen werden; Rettungshex bei blockiertem Deck.
- Drehen per R mit Hinweis an der Hovervorschau. Turmverkauf für 50 % inklusive aller Upgrades; in aktueller ursprünglicher Bauphase vor Wave weiterhin 100 % Rückgabe.
- Archer, Katapult, Kettenblitz und Freeze-Aura; zwei Upgradezweige plus passende finale Stufe pro Turm. Bauen auch während Waves, kontextuelle Turm-/Gebäudemenüs.
- Dorf mit automatischem Einkommen; optional Haus, Schmiede oder Markt. Gold-/Wave-/Deckplanung in Header-Dropdowns, Leertaste zum Start und F für 2×.
- Klare Sicht Radius 2, Nebel bis Gesamtradius 6 von jedem gesetzten Hex, danach unsichtbar. Sparsame ursprüngliche Hex-Ansicht; dynamische seedbasierte Sonderfelder.
- Alte T-Kreuzung in Y-Kreuzung umbenannt, echte T-Kreuzung und Sechserkreuzung ergänzt. Sonderfelder haben feste Straßen/Rotation und werden automatisch durch passende Nachbarstraßen aktiviert; keine Handkarte überschreibt sie. Bossfelder immer sechs Öffnungen.
- Sonderfeldrate 4,5 % geeigneter Koordinaten, davon 55 % Schatz, 30 % Shrine, 15 % Boss. Keine Sonderfelder innerhalb Radius 2 der Base.
- Schatz +20 Gold. Verdeckte Shrine-Effekte: 30 % Kartenentfernung, 30 % zusätzliche Karte, 30 % Epic, 10 % Legendary. Epic jetzt Höhenkreuzung/Kampfstraße/Wachtkurve, Legendary Bastionskreuzung/Königsstraße/Kriegskreuzung.
- Boss nach Straßenerschließung automatisch in nächster Wave auf eigenem Hex; fünf Basisschaden, +50 Gold bei Sieg plus Kartenbeute nach überlebter Wave (90 % Epic, 10 % Legendary). Vorschau berücksichtigt Bosse. Collect-Sounds vorhanden.
- 87 automatisierte Tests und Syntaxprüfungen zuletzt bestanden. Manueller Spieltest/Hörprobe, Markt/Schmiede im Spiel und langfristiges Balancing offen.

Für später: verschiedene Starthelden/Startfestungen mit eigenen Effekten, mehr Sonderfeld-/Bossloot, weitere Biome, Meta-Progression und zusätzliche Towerrollen. Finales Ziel bleibt stilisiertes **3D wie Dorfromantik**; aktuelle Umsetzung noch 2D, Kartendarstellung nun hinter SVG-Renderer-Schnittstelle. Weltursprung und Kameramodell inzwischen getrennt. Engine, 3D-Kameraadapter und vollständige UI-/Runtrennung offen.

## Historisches Konzeptprotokoll

Die folgenden Abschnitte erhalten die ursprünglichen Ideen und Gesprächsentscheidungen. Sie sind kein aktueller Featurekatalog; veraltete Zahlen, offene Fragen und frühere Statusmeldungen werden durch die aktuelle App-README oben ersetzt.

## 1. Grundidee des Projekts

Das Spiel soll ein **Tower-Defense-Roguelite-Deckbuilding-Game** werden.

Die drei wichtigsten Säulen sind:

- Tower Defense
- Deckbuilding
- Roguelite / Roguelike-Struktur

Als grobe Inspirationsrichtungen wurden genannt:

- Slay the Spire 2
- Tower Dominion
- Rogue Tower
- teilweise Dorfromantik

Die spätere Richtung hat sich immer stärker zu einer Kombination aus **Dorfromantik-artigem Hex-Tile-Legen**, **Tower Defense auf der selbstgebauten Map** und **Deckbuilding nur für die Map-Hexe** entwickelt.

Das Spiel soll so aufgebaut sein, dass:

- jeder Run einzigartig ist,
- die Base fest ist,
- der Spieler seine Map selbst erweitert,
- sich das Hex-Deck während des Runs entwickelt,
- außerhalb eines Runs Meta-Progression existiert,
- unterschiedliche Tower-Builds und Synergien möglich sind,
- langfristig viele viable Builds existieren,
- die Map groß werden darf, aber nicht absurd riesig.

---

## 2. Frühere Konzeptideen

Bevor die aktuelle Richtung festgelegt wurde, wurden mehrere Konzepte diskutiert.

### 2.1 The Last Route

Grundidee:

Der Spieler baut mit Karten sowohl:

- Türme
- Terrain
- den Weg der Gegner

Die Karte wächst während des Runs.

Mögliche Kartenarten:

- Tower Cards
- Terrain Cards
- Power Cards

Beispiel:

- Gerade Straße
- Kurve
- Kreuzung
- Frost Tower
- Poison Tower
- globale Effekte

Die Stärke des Konzepts war, dass Deckbuilding und Map-Erweiterung direkt zusammenhängen.

### 2.2 Siege Architect

Grundidee:

Es gibt nur wenige grundlegende Turmtypen.

Beispiele:

- Cannon
- Ballista
- Frost
- Arcane
- Flame
- Support

Das Deck enthält hauptsächlich Modifikationen für die Türme.

Beispiele:

- Split Shot
- Chain Reaction
- Frozen Core
- Overclock

Türme könnten sich zusätzlich entwickeln.

Beispiel:

Flame Tower:

- Inferno
- Napalm

Dieses Konzept legte den Fokus stark auf Buildcrafting und absurde Roguelite-Synergien.

### 2.3 Kingdom of Cards

Grundidee:

Das gesamte Königreich wird über Karten aufgebaut.

Mögliche Gebäude:

- Archer Tower
- Farm
- Wall
- Barracks
- Marketplace
- Blacksmith
- Mage Tower

Der Spieler verteidigt eine zentrale Festung.

Zusätzlich zur Verteidigung gibt es:

- Economy
- Citybuilding
- Gebäude-Synergien
- Gebäude, die zerstört werden können

Das Konzept war stärker Citybuilder-orientiert und wurde später nicht als Hauptidee weiterverfolgt.

Es wurde auch visualisiert.

---

## 3. Zweite Konzeptphase mit festen Vorgaben

Später wurden folgende Parameter festgelegt:

- jeder Run ist einzigartig,
- feste Base,
- Deck wird von Runde zu Runde erweitert,
- Meta-Progression nach einem Run,
- Meta-Fortschritt abhängig davon, wie weit man gekommen ist,
- die Map wird wie bei Rogue Tower Stück für Stück erweitert.

Daraufhin wurden drei weitere Konzepte diskutiert.

### 3.1 Frontier Defense

Die Base sitzt fest.

Der Spieler erweitert den Gegnerweg über neue Map-Tiles.

Beispiele:

- Gerade
- Kurve
- Kreuzung

Die Map wird mit jeder Wave größer.

Neue Tiles können zusätzliche Fronten öffnen.

Terrain könnte spezielle Eigenschaften haben.

Beispiele:

- High Ground
- Crystal
- Forest
- Village
- Cursed Ground

Das Deck entwickelt sich während des Runs.

### 3.2 The Core

Eine zentrale feste Base bzw. ein Core liegt in der Mitte.

Der Spieler deckt Regionen rund um den Core auf.

Beispiele:

- Forest
- Ruins
- Mountain
- Swamp
- Village
- Enemy Camp

Jede neue Region kann eine weitere Front öffnen.

Der Fokus lag stärker auf einer 360-Grad-Verteidigung.

### 3.3 Path of the Kingdom

Die Map selbst wurde stärker als Roguelike-Skilltree gedacht.

Der Spieler wählt Map-Karten mit unterschiedlichen Risiken und Belohnungen.

Beispiele:

- Long Road
- Abandoned Mine
- Ancient Temple

Bestimmte Regionen sollten wiederum bestimmte Kartenpools beeinflussen.

Beispiele:

Sumpf:

- Poison
- Slow
- Disease

Vulkan:

- Burn
- Explosion
- Fire Towers

Ruinen:

- Magic
- Relics
- Ancient Towers

Dieses Konzept wurde als besonders starke Richtung angesehen, weil Map-Build, Deck-Build und Tower Defense eng miteinander verknüpft sind.

---

## 4. Dorfromantik-Richtung

Später kam die konkrete Frage auf, ob man den Dorfromantik-Playstyle in ein Tower-Defense-Spiel mit Deckbuilding überführen kann.

Die Antwort bzw. daraus entwickelte Richtung war:

- Base in der Mitte
- Map wird über Hex-Tiles erweitert
- Tiles haben unterschiedliche Landschafts- und Straßenstrukturen
- Straßen bestimmen Gegnerpfade
- die Map wird vom Spieler selbst gebaut
- Gebäude bzw. Tower profitieren von bestimmten Tile-Arten
- Tile-Drafting wird zum Kern des Spiels

Mögliche Landschaftsarten wurden als Beispiele genannt:

- Wald
- Feld
- Wasser
- Dorf
- Berg
- Straße

Synergien könnten langfristig entstehen zwischen:

- Map
- Tower
- Terrain
- Economy

Beispiele:

- Wald → Archer
- Berg → Cannon / Reichweite
- Wasser → Frost
- Dorf → Economy

Wichtige Grundidee:

> Die Map wird nicht einfach automatisch generiert, sondern durch den Spieler Zug für Zug gebaut.

---

## 5. Aktuell gewählte Kernrichtung

Die aktuelle und verbindlichere Spielidee lautet:

### Tower Defense

Der Spieler baut die Map selbst über Hex-Karten weiter.

### Deckbuilding

Das Deck enthält ausschließlich Map-Hexe.

Türme sind nicht Bestandteil des Decks.

### Roguelite

Jeder Run ist anders.

Es gibt:

- randomisierte Karten
- Special Tiles
- Fog of War
- später Meta-Progression
- verschiedene Festungen / Heroes
- verschiedene Difficulty-Modi
- langfristig unterschiedliche Biome

---

## 6. Startzustand eines Runs

Die Base steht auf einem festen Start-Hex in der Mitte.

Die Base ist zunächst auf einem einzelnen Hex.

Von der Base gehen abhängig vom Schwierigkeitsgrad später unterschiedlich viele Straßenöffnungen aus.

Für die erste Version wurde zunächst mit einem Ausgang gedacht.

Die Base hat:

**20 HP**

Später soll es einen Hardcore-Modus geben:

> Ein Gegner erreicht die Base = sofortiger Runverlust.

---

## 7. Startdeck

Der Spieler hat ein Startdeck mit:

**5 Karten**

Pro Turn:

- 3 Karten ziehen
- genau 1 davon spielen
- danach wird die komplette Hand abgeworfen

Das bedeutet:

Auch die zwei nicht gespielten Karten landen im Discard Pile.

Wenn der Draw Pile leer ist:

- Discard Pile mischen
- daraus neuen Draw Pile erstellen

Minimum des Decks:

**5 Karten**

Darunter darf das Deck auch durch Card Removal nicht fallen.

---

## 8. Tile-Placement

Ein gespieltes Hex kostet:

**kein Gold**

Gold wird ausschließlich für:

- Türme
- Upgrades
- Gebäude

verwendet.

Ein Hex muss legal an die bestehende Map angelegt werden.

Aktuelle Regel:

> Die Straße muss weitergeführt werden.

Andere Landschaftskanten müssen zunächst nicht übereinstimmen.

Also:

Wald darf zum Beispiel an Wiese angrenzen.

Straßen dagegen müssen logisch verbunden sein.

Der Spieler kann neue Hexe frei rotieren.

Ein neues Hex darf auch mehrere existierende Hexe gleichzeitig verbinden.

Loops sind erlaubt.

Das kann dazu führen, dass sich kürzere Wege zur Base ergeben.

---

## 9. Straßen und Enemy Pathing

Grundregel:

> Gegner nehmen immer den kürzesten legalen Weg zur Base.

Es dürfen mehrere offene Straßen existieren.

Offene Straßenenden sind mögliche Enemy Spawn Points.

Damit kann der Spieler durch eine Kreuzung bewusst zusätzliche Fronten öffnen.

Beispiel:

Ein starkes Kreuzungs-Hex kann mehr Tower Slots bieten, aber gleichzeitig mehrere Spawnrichtungen erzeugen.

Die Map kann dadurch strategisch gefährlicher werden.

---

## 10. Rundenablauf

Der aktuell definierte Turn-Loop lautet:

### Phase 1 – Karten ziehen

3 Hexkarten ziehen.

### Phase 2 – Hex platzieren

1 Hex muss gespielt werden, wenn ein legales Placement möglich ist.

### Phase 3 – Bauphase

Der Spieler kann:

- Türme bauen
- Türme upgraden
- Gebäude bauen

solange genug Gold vorhanden ist.

### Phase 4 – Wave starten

Der Spieler drückt manuell:

**Wave starten**

Zusätzlich soll es eine Option geben:

> Wave automatisch starten, sobald das Hex platziert wurde.

### Phase 5 – Wave

Gegner laufen von den aktiven Spawnpunkten über die Straßen zur Base.

### Phase 6 – Rewards

Gegner geben Gold.

Alle zwei Waves erhält der Spieler eine neue Hexkarte zur Auswahl.

Dann beginnt der nächste Turn.

---

## 11. Verhalten bei unspielbarer Hand

Der Spieler muss immer eine Karte legen, wenn das möglich ist.

Wenn keine der drei gezogenen Karten irgendwo legal platziert werden kann:

> Es wird so lange neu gezogen, bis eine spielbare Karte erscheint.

Das soll automatisch passieren.

Der Spieler soll also nicht durch eine komplett unspielbare Hand feststecken können.

---

## 12. Kartenarten / Hexe

Für die erste kleine Version wurden folgende Hex-Typen als sinnvoll angesehen:

- Gerade Straße
- Kleine Kurve
- Große Kurve
- T-Kreuzung
- Kreuzung
- Lange Straße
- Dorf
- leeres Land / einfaches defensives Feld

Die kleine und große Kurve unterscheiden sich darin, wie der Weg durch das Hex verläuft.

Die große Kurve soll einen weiteren bzw. ausladenderen Wegverlauf haben.

---

## 13. Turret Slots

Hexe haben fest definierte Turret Slots.

Der Standort ist damit vorgegeben.

Beispiele:

Common Tile:

- eventuell 1 Turret Slot

spätere oder bessere Tiles:

- 2 Slots
- eventuell mehr

Wichtig:

Höhere Rarity bedeutet nicht automatisch nur „mehr Slots“.

Auch spezielle Tile-Effekte sollen eine Rolle spielen.

---

## 14. Building Slots

Neben Turret Slots soll es auf Hexen auch Slots für Nicht-Tower-Gebäude geben.

Beispiele:

- Haus
- Schmiede
- Markt

Gebäude können positive Effekte erzeugen.

Beispiele, die diskutiert wurden:

### Haus

Bonus-Income nach der Wave.

### Schmiede

Bufft benachbarte Türme.

### Markt

Reduziert Upgrade- oder Baukosten in der Nähe.

---

## 15. Bonus Income

Für später ausdrücklich vorgemerkt:

Das zusätzliche Einkommen durch Häuser o. Ä. soll direkt neben dem aktuellen Gold angezeigt werden.

Beispiel:

**32 (+4)**

Dabei bedeutet:

- 32 = aktuelles Gold
- +4 = Bonusgold nach Abschluss der Runde / Wave

---

## 16. Tower-System

Türme sind nicht im Deck.

Sie werden über ein separates Tower-/Build-Menü gekauft.

Bisher festgelegte Tower-Typen:

### Archer

Schneller Single-Target-Turm.

Soll später Skilltree-Optionen haben.

Beispielsweise:

- mehr AoE
- mehr Single-Target-Damage

### Katapult

Besondere Mechanik:

Das Katapult schießt einen Stein, der in einer geraden Linie fliegt.

Der Stein kann mehrere Gegner treffen.

Dadurch soll die Mapstruktur relevant werden.

Lange gerade Wege sind besonders gut für Katapulte.

### Kettenblitzturm

Schießt einen Blitz auf einen Gegner.

Der Blitz springt auf nahe Gegner über.

Stark bei:

- Gruppen
- engen Wegen
- Kreuzungen
- hoher Gegnerdichte

### Freeze Tower

Verlangsamt Gegner.

Weniger Damage.

Funktioniert als Support Tower.

### Minenlegerturm

Legt Minen auf Straßen in der Nähe.

Kann dadurch Wegführung und Killzones ausnutzen.

### Nekromantenturm

Spezialmechanik:

Belebt Gegner, die in seiner Nähe sterben oder später eventuell mit seinem DoT versehen sind, wieder.

Diese werden zu schwachen verbündeten Einheiten.

Für eine erste Vereinfachung wurde vorgeschlagen:

> Gegner, die in seiner Reichweite sterben, haben eine Chance, als schwache verbündete Einheit wiederbelebt zu werden.

Die verbündeten Einheiten kämpfen dann gegen Gegner.

Langfristig denkbar:

- DoT
- Markierungen
- stärkere Minions
- explodierende Untote
- Elite-Reanimation

Diese Erweiterungen sind noch nicht als V1-Pflicht festgelegt.

---

## 17. Tower-Upgrades

Der User bevorzugt klar:

**Skilltrees statt linearer Upgrades**

Beispiel Archer:

Archer  
→ AoE-Pfad  
oder  
→ Single-Target-Pfad

Eine mögliche vereinfachte Struktur für frühe Versionen:

Basis-Tower  
→ Branch A oder Branch B  
→ finales Upgrade

Langfristig sollen dadurch unterschiedliche Builds entstehen.

---

## 18. Synergie-Fokus

Synergien sind besonders wichtig.

Ziel ist:

> viele unterschiedliche viable Builds.

Beispiele für gewünschte Synergien:

- Katapult + lange gerade Straßen
- Chain Lightning + Kreuzungen / hohe Gegnerdichte
- Minenleger + lange Wege
- Freeze + Killzones
- Nekromant + viele Kills in einem kleinen Bereich
- Schmiede + mehrere benachbarte Tower
- Economy-Gebäude + langfristige Skalierung

Der Spieler soll sowohl:

- schöne / clevere Maps bauen,
- perfekte Killzones bauen,
- starke Synergien entwickeln.

Der Synergie-Aspekt hat dabei besonders hohe Priorität.

---

## 19. Gegner und Rüstungen

Wichtiges gewünschtes System:

> Verschiedene Rüstungen der Gegner sollen von unterschiedlichen Türmen gecountert werden.

Die erste vereinfachte Einteilung war:

### Unarmored

Normale Gegner.

Archer effektiv.

### Armored

Hohe physische Schadensreduktion.

Katapult bzw. andere passende Damage-Arten stärker.

### Swarm

Viele kleine Gegner.

AoE / Chain Lightning gut.

Später sind weitere Armor-/Enemy-Klassen denkbar, wurden aber noch nicht festgelegt.

---

## 20. Gold-System

Gold wird im Run verdient.

Quellen:

- Gegnerkills
- Wave Completion
- Gebäude
- Special Tiles

Ausgaben:

- Tower bauen
- Tower upgraden
- Gebäude bauen

Gold verfällt nach einem Run.

Gold ist keine Meta-Währung.

---

## 21. Karten-Reward-System

Aktuell:

> Alle zwei Waves bekommt man neue Karten zur Auswahl.

Auswahl:

**1 aus 3**

Die gewählte Hexkarte wird dem Deck hinzugefügt.

Das Deck wird dadurch während des Runs größer.

---

## 22. Card Removal

Karten sollen entfernt werden können.

Deck darf aber niemals kleiner als:

**5 Karten**

werden.

Card Removal könnte später über verschiedene Systeme funktionieren.

Eine konkrete Idee:

### Shrine / Special Tile

Einmalig:

> Entferne eine Karte permanent aus deinem Deck.

Zusätzlich wurde genannt:

Card Removal könnte auch über eine spezielle gezogene Karte funktionieren.

Dann wäre der Effekt:

> Einmalig eine Karte entfernen.

Welche Variante final genutzt wird, ist noch nicht entschieden.

---

## 23. Karten-Rarities

Festgelegt:

- Common
- Uncommon
- Rare
- Epic

Ursprünglich wurde kurz „Legendary“ vorgeschlagen, später wurde vom User ausdrücklich festgelegt:

> Rare = Epic

Die vier genannten Stufen sollen verwendet werden.

Rarity soll nicht ausschließlich mehr Slots bedeuten.

Seltene Tiles können besondere Effekte haben.

---

## 24. Fog of War

Hexfelder besitzen Sichtweite.

Beispielidee:

- 1 Feld Clear Vision
- 4 Felder Fog of War

Bedeutung:

Direkt nahe Felder werden vollständig sichtbar.

Weiter entfernte Special Tiles werden nur als „etwas Besonderes“ erkannt.

Diese Werte waren als Beispiel genannt, nicht zwingend endgültig.

Später könnte die Sichtweite verbessert werden über:

- Meta-Progression
- Scout Towers

---

## 25. Special Tiles

Im Fog of War sehen alle Special Tiles gleich aus.

Sie zeigen zunächst nur ein unbekanntes Symbol.

Erst innerhalb der Clear Vision wird erkannt, was sich dort befindet.

Beispiele:

- Boss
- Treasure
- Shrine
- Händler
- Event

Für eine frühe Version wurden insbesondere drei Typen vorgeschlagen:

- Boss
- Shrine
- Treasure

---

## 26. Boss-System

Im Fog of War ist der Boss zunächst nicht als Boss erkennbar.

Sobald das Feld in Clear Vision kommt, wird klar, was es ist.

Wenn der Spieler den Boss-Hex mit seinem Straßennetz verbindet:

> Der Boss wird aktiviert.

Der Boss startet aber nicht sofort.

Festgelegt:

> Er kommt in der nächsten Wave.

Dadurch hat der Spieler noch eine Bauphase zur Vorbereitung.

Der Boss läuft dann über den kürzesten Weg zur Base.

Der Boss soll besonderen Loot droppen.

Mögliche Rewards:

- Rare-/Epic-Karte
- anderer besonderer Bonus

---

## 27. Map-Größe

Die Map darf:

- groß werden,
- viele Hexe enthalten,

aber nicht:

- absurd riesig werden.

Ein starker Run nach längerer Zeit soll sichtbar eine größere Welt erzeugt haben.

---

## 28. Biome

Langfristig soll die Map feste Biome enthalten.

Die Biome sollen pro Run anders verteilt sein.

Variabel:

- welches Biom wo liegt,
- wie groß es ist,
- Mindestgröße,
- Maximalgröße,
- Form / Verteilung

Für die erste Version:

> nur ein Biom.

Beispiel:

Grasslands.

Mehrere Biome kommen später.

---

## 29. Endless Run

Festgelegt:

> Das Spiel soll grundsätzlich Endless sein.

Kein fixer Endboss als normales Run-Ende.

Stattdessen geht es darum:

> Wie weit kommt der Spieler?

---

## 30. Difficulty-System

Es sollen verschiedene Schwierigkeitsstufen existieren.

Diese sollen unter anderem festlegen:

- wie viele Öffnungen die Startbase hat,
- wie viele Waves / Runden man erreichen muss,
- generell die Schwierigkeit

Ein Beispielansatz war:

Easy:
- weniger Base-Ausgänge

Hard:
- mehr Base-Ausgänge

Die konkreten Difficulty-Werte sind noch nicht festgelegt.

---

## 31. Hardcore Mode

Für später fest vorgemerkt:

> Ein einziger Gegner erreicht die Base = Run vorbei.

Dieser Modus soll nicht für die erste Version gebaut werden.

---

## 32. Heroes / Startfestungen

Der User möchte später verschiedene Heroes bzw. Startfestungen.

Diese Startfestungen sollen unterschiedliche Effekte haben.

Beispiele, die als Ideen genannt wurden:

### Standard-Festung

Neutral.

### Nekromanten-Zitadelle

Buff auf Nekromantentürme.

### Händlerstadt

Mehr Gold, eventuell andere Nachteile.

### Frostfestung

Buff auf Freeze Tower.

Diese Beispiele sind nicht als final bestätigt, aber das System „unterschiedliche Startfestungen mit eigenen Effekten“ ist fest gewünscht.

---

## 33. Meta-Progression

Außerhalb des Runs soll Meta-Progression existieren.

Meta-Währung:

## Diamanten

Diamanten erhält man abhängig von:

- erreichter Wave
- besiegten Bossen
- eventuell weiteren Run-Erfolgen

Mit Diamanten sollen später Dinge freigeschaltet werden.

Explizit gewünschte Meta-Unlocks:

- neue Hexkarten
- neue Türme
- neue Gebäude
- neue Boss-Tiles
- neue Relics
- alternative Startdecks
- neue Biome
- verschiedene Startfestungen / Heroes

Meta-Stats sind ebenfalls möglich.

Beispiel:

- Sichtweite erhöhen
- Startgold erhöhen

Es soll aber nicht nur stumpfe permanente Damage-Skalierung sein.

---

## 34. Designrichtung

Visuelle Richtung:

**Dorfromantik / Tower Dominion**

Stil:

**Comic / realistisch**

Also:

- stilisiertes 3D
- nicht komplett cartoonig
- nicht fotorealistisch
- angenehm und hochwertig
- isometrisch / top-down-artig
- klare Landschaften
- gut lesbare Straßen
- Tiles visuell wichtig

Die Map soll sich befriedigend entwickeln.

Gleichzeitig sollen die Waves zunehmend bedrohlich wirken.

---

## 35. V1-Plan

Es wurde zunächst eine größere V1 umrissen.

Enthalten:

- Hexgrid
- Base
- Map selbst erweitern
- Draw 3 / Play 1
- Draw Pile / Discard Pile
- mehrere Hexkarten
- Rarities
- Reward alle 2 Waves
- Card Removal
- Turret Slots
- Building Slots
- mehrere Tower
- Tower-Skilltrees
- Gebäude
- Gold
- mehrere Enemy-Klassen / Armor
- Endless Waves
- Fog of War
- Boss
- Shrine
- Treasure
- 20 Base HP
- Diamanten
- Meta-Progression-Grundgerüst

Noch nicht zwingend für die erste V1:

- mehrere Biome
- mehrere Festungen
- Hardcore
- komplexe Relics
- komplexe Events
- riesige Kartenbibliothek

---

## 36. V0.1 – bewusst kleiner erster Prototyp

Daraufhin wurde entschieden, zunächst eine V0.1 zu bauen.

Ziel:

> Erst prüfen, ob der Kernloop Spaß macht.

Kernloop:

**Map bauen → Türme setzen → Wave überleben → Deck erweitern**

V0.1 wurde bewusst kleiner gehalten.

---

## 37. V0.1 – implementierter Umfang

Der erste lokal spielbare Browser-Prototyp enthielt:

- Hex-Map
- feste Base
- 5er-Startdeck
- 3 Karten ziehen
- 1 spielen
- Kartenrotation
- Straßen-Anschlussregeln
- feste Turret Slots
- Bauphase
- Gold
- 20 Base HP
- offene Straßenenden als Spawnpunkte
- kürzester Weg zur Base
- endlose Waves
- Archer
- Katapult
- Kettenblitzturm
- alle zwei Waves Kartenreward
- 1 aus 3 neuen Hexkarten ins Deck

Der Prototyp lief lokal als Browser-Spiel.

Kein Server war nötig.

`index.html` konnte direkt geöffnet werden.

---

## 38. V0.1 – erste Testprobleme

Beim Testen wurden mehrere Fehler bzw. UX-Probleme gefunden.

### Problem 1 – Rotation nicht sichtbar

Beim Rotieren eines Hexes war nicht klar zu sehen:

> Wie wird das Hex aktuell platziert?

Dadurch wirkte es so, als könne man zum Beispiel:

- Kurven
- T-Kreuzungen

nicht korrekt platzieren.

Der User stellte später selbst fest:

> Das Placement war teilweise möglich, aber die aktuelle Ausrichtung war nicht erkennbar.

Darum wurde als notwendiges Feature definiert:

### Tile Preview

Beim Hover / Placement muss direkt auf dem Spielfeld sichtbar sein:

- wie das Hex ausgerichtet ist,
- wo die Straßen verlaufen,
- wie es platziert werden würde.

Auch die Kartenrotation selbst soll visuell klar erkennbar sein.

---

## 39. Pathing-Bug

Ein weiterer Fehler:

Ein Tile konnte an einer Position platziert werden, obwohl die sichtbare Straße nicht korrekt mit der bestehenden Route verbunden war.

Der Screenshot zeigte:

- eine existierende Route,
- daneben ein neu platziertes Tile,
- aber die Straßen waren visuell nicht durchgehend verbunden.

Festgelegt:

> Straßen müssen immer eine ununterbrochene Verbindung bilden.

Das ist zwingend.

Keine visuell getrennten Straßen dürfen intern als verbunden gelten.

---

## 40. Enemy Spawn Bug

Problem:

Gegner spawnte zunächst in der Mitte eines Hexfelds.

Gewünscht:

> Gegner sollen immer am äußeren Rand der Map bzw. am äußeren Ende einer offenen Straße spawnen.

Also:

Nicht in der Feldmitte.

Sondern:

am äußersten offenen Straßenrand.

---

## 41. V0.1.1

Daraufhin wurde V0.1.1 erstellt.

Gemeldete Änderungen:

### Tile Preview

Beim Platzieren wird angezeigt:

- Position
- aktuelle Rotation
- Straßenverlauf

### Rotation sichtbar

Die ausgewählte Karte zeigt die aktuelle Ausrichtung.

### Straßenverbindungen korrigiert

Die interne Straßenrichtung und die sichtbare Straßenrichtung wurden angeglichen.

Ziel:

Keine falschen Verbindungen mehr.

### Enemy Spawn

Gegner starten jetzt am äußeren Ende eines offenen Straßenabschnitts.

### Mehrere offene Enden

Mehrere offene Straßenenden zählen jeweils als Spawnfront.

---

## 42. Später vorgemerkte Tower-UX-Features

Der User hat ausdrücklich folgende spätere Features notiert:

### Türme verkaufen / Undo

Während derselben Placement-/Bauphase sollen Türme für:

**100 % ihres Werts**

verkauft werden können.

Das dient praktisch als:

> Rückgängig machen.

Also:

Tower gerade gebaut → falsch gesetzt → in derselben Bauphase wieder verkaufen → komplettes Gold zurück.

### Tower Attack Range anzeigen

Beim:

- Platzieren
- Auswählen

eines Turms soll dessen Attack Range sichtbar werden.

Die genaue Darstellung ist noch nicht definiert.

---

## 43. Bonus-Income-Anzeige

Bereits oben erwähnt, aber separat ausdrücklich als Backlog notiert:

Goldanzeige soll später so aussehen:

**32 (+4)**

Dabei ist:

- 32 aktuelles Gold
- +4 Bonusincome nach der aktuellen / nächsten abgeschlossenen Runde durch Häuser o. Ä.

---

## 44. Aktueller technischer Stand

Aktuell existiert:

**V0.1.1**

als lokaler Browser-Prototyp.

Vorher existierte auch:

**V0.1**

Aktuell sollte aber V0.1.1 als Basis verwendet werden.

---

## 45. Aktueller Name im Prototyp

Im Screenshot war der Prototyp unter dem Namen:

**Hex Bastion v0.1**

zu sehen.

Ob das der endgültige Spielname ist, wurde nicht entschieden.

Es ist aktuell nur der Name des Prototyps.

---

## 46. Sichtbarer UI-Aufbau des bisherigen Prototyps

Im Screenshot der V0.1 war sichtbar:

oben:

- HP
- Gold
- weitere Ressourcen-/Counter-Anzeigen

rechts:

### 1. Hex wählen

3 Karten sichtbar.

Beispiele:

- Gerade
- Große Kurve
- Gerade

Button:

**Drehen (R)**

darunter:

Hinweis:

> Ziehe 3, spiele 1. Danach wird die ganze Hand abgeworfen.

Darunter:

### 2. Bauphase

Tower:

- Archer
- Katapult
- Kettenblitz

mit Preisen.

Beispiel sichtbar:

- Archer 25
- Katapult 40
- Kettenblitz 45

Diese konkreten Preise stammen aus dem aktuellen Prototypen, wurden aber noch nicht als finales Balancing festgelegt.

Zusätzlich:

Checkbox:

**Wave nach Platzierung automatisch starten**

Button:

**Wave starten**

Button:

**Neuer Run**

---

## 47. Wichtigstes Designprinzip

Ein besonders wichtiger Grundsatz, der sich aus der Diskussion ergeben hat:

> Map, Deck und Tower-Build dürfen nicht drei getrennte Systeme sein.

Sie sollen sich gegenseitig beeinflussen.

Beispiele:

Katapult:

- profitiert von geraden langen Wegen.

Kettenblitz:

- profitiert von Kreuzungen / Gegnergruppen.

Minenleger:

- profitiert von langen Straßen / Chokepoints.

Freeze:

- verlängert Aufenthaltszeit in Killzones.

Nekromant:

- profitiert von hoher Gegnerdichte.

Gebäude:

- buffen angrenzende Tower.

Dadurch entsteht der eigentliche strategische Kern.

---

## 48. Spielerfantasie

Der Spieler soll gleichzeitig das Gefühl haben:

- eine clevere Landschaft zu bauen,
- eine perfekte Verteidigung aufzubauen,
- einen starken Synergie-Build zu entwickeln.

Der Synergie-/Buildcrafting-Aspekt ist besonders wichtig.

---

## 49. Noch nicht entschieden / offene Punkte

Folgende Dinge sind bewusst noch nicht final festgelegt:

- exakte Tower-Stats
- exakte Tower-Kosten
- exakte Enemy-HP
- exakte Damage-Werte
- exakte Wave-Skalierung
- genaue Spawnverteilung bei mehreren offenen Enden
- genaue Gewichtung der verschiedenen Rarities
- exakte Anzahl Karten im gesamten Pool
- genaue Effekte aller Hexkarten
- genaue Building-Kosten
- genaue Building-Boni
- genaue Card-Removal-Quelle
- genaue Diamond-Belohnungsformel
- exakte Difficulty-Stufen
- Anzahl Base-Ausgänge pro Difficulty
- exakte Sichtweitenwerte
- exakte Funktionsweise von Scout Towers
- exakte Meta-Unlock-Kosten
- finale Startfestungen
- finale Heroes
- finale Biome
- finale Gegner-Rüstungsarten
- finale Skilltrees
- finaler Artstyle
- finaler Spielname

---

## 50. Empfohlener unmittelbarer Fokus laut bisherigem Verlauf

Der letzte Stand war:

Bevor neue große Systeme hinzukommen, sollte zunächst das Grundsystem stabil sein.

Besonders testen:

- Kurven
- T-Kreuzungen
- Kreuzungen
- Loops
- Pathfinding
- sichtbare Straßenverbindungen
- mehrere Spawnfronten
- Rotation
- Tile Preview

Erst wenn das zuverlässig funktioniert, sollten größere Systeme wie:

- Skilltrees
- Fog of War
- Special Tiles
- Meta-Progression

weiter ausgebaut werden.

---

## 51. Bereits vorgesehene nächste Entwicklungsschritte

Aus dem bisherigen Verlauf ergibt sich als geplante Richtung nach dem stabilen Kern:

1. Hex-Placement und Pathing wasserdicht machen.
2. Tile Preview verbessern.
3. Tower Placement / Attack Range UX verbessern.
4. Tower-Sell / Undo in derselben Bauphase.
5. Tower-Upgrades und erste Branches.
6. Fog of War.
7. erstes Special-Hex.
8. Boss-Hex.
9. Card Removal.
10. Buildings.
11. Bonus Income.
12. weitere Tower.
13. Armor-System ausbauen.
14. Meta-Progression.
15. Startfestungen / Heroes.
16. weitere Difficulty-Stufen.
17. Hardcore.
18. mehrere Biome.
19. deutlich mehr Hexkarten.
20. Relics / Events / größere Build-Vielfalt.

Diese Reihenfolge ist aus dem bisherigen Projektverlauf abgeleitet; einzelne Punkte wurden noch nicht als unumstößliche Reihenfolge final beschlossen.

---

## 52. Kurzfassung des heutigen Zielbilds

Das Spiel lässt sich aktuell am besten so zusammenfassen:

> Ein endloses Tower-Defense-Roguelite auf einer Hex-Map, die der Spieler selbst baut. Die Base liegt fest in der Mitte. Der Spieler besitzt ein Deck ausschließlich aus Map-Hexen, zieht pro Turn drei Karten und spielt eine davon. Die neuen Hexe erweitern das Straßennetz und damit gleichzeitig den Gegnerpfad, die möglichen Spawnfronten, die Tower-Positionen und die strategischen Möglichkeiten. Nach dem Placement folgt eine Bauphase für Tower und Gebäude, danach startet die Wave. Alle zwei Waves wächst das Deck. Fog of War verbirgt Boss-, Treasure- und andere Special Tiles. Der Run endet irgendwann durch Überforderung der Base, danach erhält der Spieler Diamanten für Meta-Progression. Tower haben unterschiedliche Rollen, Armor-Counter und später verzweigte Skilltrees. Besonders wichtig sind starke Synergien zwischen Map-Aufbau, Tower-Build und Deckentwicklung.


Aktuelle Korrektur: Bei blockiertem Gesamtdeck erscheint ein kostenloses Rettungshex ohne Slots/Boni (nicht im Deck/Reward). Letzte Öffnung in vollständig eingeschlossene Einzelzellen verboten; kein vollständiger Mehrzug-Lookahead. Shrine umgesetzt; Boss noch offen.




Aktuell: Sichtdesign auf ursprüngliche sparsame Ansicht mit freien Nachbarhexes zurückgesetzt, ohne Sichtflächen/Legende. Sichtlogik Radius 2/6 und dynamische Sonderfelder bleiben unverändert.


Aktueller Teststand: 60 Tests und JS-Syntaxprüfungen bestanden. Fragezeichen nur bis Radius 6 von gelegten Hexes; dynamische Expansion im Renderingtest geprüft. Nächster Ausbau: verdeckte Shrine-Bonusvarianten.


Aktueller Ausbau: 64 Tests und Syntaxprüfungen bestanden. Drei verdeckte Shrine-Boni umgesetzt (40 % Entfernen, 40 % zusätzliche Karte, 20 % Epic). Sonderfelder unverändert 4,5 %, davon Schatz 55 %, Shrine 30 %, Boss 15 %. Nächster Ausbau: Sonderfeld-/Bossloot-Pool und Vorbereitung 3D-Renderer.







