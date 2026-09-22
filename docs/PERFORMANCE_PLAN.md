# Performance ohne Qualitätsverlust

Stand: 22.09.2026. Anlass: Ruckeln in Wellen 40–60, besonders bei hohem Tempo und im Hintergrund. Dieser Plan ersetzt die bisherige reine Vormerkung. Messungen und erreichte Verbesserungen sind von noch offenen Hypothesen getrennt.

## Verbindliche Grenzen

- Keine Reduktion von Auflösung, Modellen, Schatten, Partikeln, Gegnern, Minen oder sichtbaren Effekten. Bestehende optionale Grafikmodi sind kein Ersatz für diese Arbeit.
- Keine Änderung an Balance, Zielprioritäten, Reichweiten, Buffs, Zufallsfolgen, Spawns, Belohnungen oder Simulationsgeschwindigkeit. Keine verlorenen Simulationsschritte beim Aufholen.
- Gleiche Eingaben und Seeds müssen gleiche Kampfergebnisse liefern. Treffer bei gleicher Entfernung und die Reihenfolge von Minenauslösungen bleiben erhalten.
- Desktop, Touch/Mobile, Solo und die gemeinsame serverseitige Duo-Simulation berücksichtigen. Keine geräteabhängigen Spielregeln.

## Befunde aus dem aktuellen Code

| Bereich | Konkreter Befund | Einordnung |
| --- | --- | --- |
| Kampf (`classes/combat.js`) | Die Aura-Prüfung berechnet dieselben effektiven Turmwerte für jeden Gegner erneut; Angriff und Geister berechnen sie ebenfalls. | Direkter, isoliert messbarer Ansatz. Werte pro Simulationsschritt berechnen und wiederverwenden. |
| Zielsuche | Mehrere vollständige Gegnerdurchläufe für Reichweite, Kettenblitz, Explosionen und Minen; Restweglänge wird bei Prioritätsvergleichen wiederholt summiert. | Kosten wachsen mit Gegnern, Türmen, Weglänge und Minen. Noch separat zu profilieren. |
| Minen | Für neue Minen werden Straßenabschnitte wiederholt erzeugt und gegen die Reichweite geschnitten. | Statische Geometrie nach Kartenrevision und Reichweite zwischenspeichern; Zufall und Reihenfolge unverändert lassen. |
| Laufzeit (`classes/run-runtime.js`) | Turmplätze pro Tick erneut ermittelt; Routengraph bei Spawn-Batches erneut erzeugt; vollständiger Wellenplan pro Gegner erzeugt. | Versionierte Caches eignen sich für stabile Kartendaten. |
| Oberfläche (`classes/game.js`) | Während sichtbarer Kämpfe wird `renderUI()` pro Animationsframe aufgerufen. Handkarten werden neu aufgebaut, Vorhersage und Layout erneut berechnet. | Unveränderte UI nicht neu erstellen; Änderungen gezielt anzeigen. Einzelne vorhandene Caches weiterverwenden. |
| Grafik (`classes/three-renderer.js`) | Statische und dynamische Synchronisation laufen gemeinsam. Signatur-Caches und instanzierte Effekt-Pools existieren bereits. Gegner-/Minenobjekte werden erstellt und entfernt. | Erst GPU/CPU getrennt messen, dann Traversierung und Objektlebenszyklen optimieren. Nicht pauschal alle Effekte neu schreiben. |
| Hintergrund | Feste 50-ms-Spielschritte; bei 8× bis zu 160 Schritte pro realer Sekunde. Bis zu 200 Aufholschritte je Callback können den Hauptthread blockieren. | Korrekte Zeit behalten, Arbeit auf mehrere kurze Aufgaben verteilen. Browser/OS können Tabs trotzdem drosseln oder suspendieren. |
| Duo | Authentifizierung und Antwort können mehrfach `room.view()` erzeugen; regelmäßige vollständige Zustände, Dateipersistenz und Catch-up konkurrieren um Serverzeit. | Berechtigungsprüfung von Snapshot-Erstellung trennen; ACK- und Wiederherstellungsgarantien erhalten. |

## Messbasis und Grenzen

`node scripts/performance-baseline.cjs scripts/performance-after.json` misst ausschließlich den Kampfcode in Node. Pro Fall: echte Gegnerprofile für Welle 40/50/60 (85/105/125 Gegner), alle gleichzeitig, 40 Basistürme aus fünf Typen, lange parallele Wege, 400 Schritte à 50 ms. Ein Aufwärmlauf und drei Messläufe; Aufrufzählung in einem separaten Lauf. Vollständiger Zustands- und Turm-Hash überprüft deterministische Wiederholbarkeit.

Das ist ein künstlicher Belastungsfall, kein natürlich gespielter Run. Keine DOM-, GPU-, Spawnrouting- oder Straßenberechnung für Minen enthalten. Ergebnisse sind keine FPS-Angabe und kein Beweis für flüssige Darstellung auf Mobile. Messdateien enthalten Umgebung, Quellcode-Hash, p50/p95, Mittelwert und Objektzahlen. Vorher/Nachher nur bei identischen Ergebnis-Hashes vergleichen.

Noch benötigte Referenzen: echte gespeicherte Runs für Wellen 40, 50, 60 sowie Beschwörerwellen; lange verzweigte Karte, viele Minen, Blitz-/Flächeneffekte und große Gebäude-Netze. Bei 1×, 2× und 8× jeweils Vordergrund, 60 Sekunden Hintergrund, fünf Minuten Hintergrund und Rückkehr prüfen. Duo mit zwei Clients und mehreren Räumen ergänzen. Browsermessungen erfolgen erst nach expliziter Anforderung; bisher liegen keine GPU- oder Layout-Zeitmessungen vor.

## Umsetzung in sinnvoller Reihenfolge

### 1. Wiederholte Turmberechnung entfernen — erster Umsetzungsschritt

Effektive Definitionen einmal je Tick berechnen; Aura-Liste daraus ableiten. Keine dauerhaften Daten an Turmreferenzen speichern: Änderungen an Upgrade, Biom, Schmiede, Reichweite und Gastturm müssen im nächsten Tick gelten. Vorgegebene Definitionen der Basis respektieren. Bestehende Gegner- und Turmreihenfolge behalten. Regression: aktuelle Werte nach Upgrade/Buffwechsel, gleiche Ergebnisse vor/nach Optimierung, alle Kampf- und Duo-Tests.

### 2. Oberfläche nur bei Änderungen aktualisieren

Hand/Deck nur bei Karten-, Auswahl-, Sprach- oder Phasenwechsel aufbauen. Gold/Leben/Tempo textuell aktualisieren, wenn sich der Wert ändert. Wellenplanung bei Änderung ihrer Eingaben aktualisieren. Layoutmessungen nach Größenänderung oder Öffnen/Schließen eines Panels bündeln: erst lesen, dann schreiben. Tutorial, Tooltips, Drag-and-drop, bezahlbare Upgrades und responsive Menüs dürfen dabei nicht veralten. Animationen laufen unverändert weiter.

Ziel: Während eines unveränderten Kampfabschnitts keine Neuerstellung der Handkarten und keine kontinuierlichen Layoutmessungen für unveränderte Menüs. Erfolg über Zähler und Browserprofil nachweisen, nicht nur subjektiv beurteilen.

### 3. Stabile Spielgeometrie wiederverwenden

Explizite Revisionen für Karte/Wege, Portale/Tunnel, Türme und Gebäudebuffs einführen. Routengraph, Turmpositionen, Wellenprofile und erreichbare Straßenabschnitte davon abhängig cachen. Keine zufällig ausgewählten Wege cachen. Änderungen durch Platzierung, Verkauf, Zusatzhex, Upgrades, Wiederherstellung und Duo-Kommandos müssen invalidieren. Caches nicht als autoritativen Spielstand speichern, sondern nach Import rekonstruieren.

Ziel: Keine Neuerzeugung eines unveränderten Routengraphen pro Spawn und keine vollständige Straßenanalyse pro Minenwurf. Risiko: veraltete Buffs/Wege; daher gezielte Änderungs- und Restore-Tests vor Freigabe.

### 4. Räumliche Suche und Restwege optimieren

Gegner pro Tick in räumliche Zellen einordnen. Radiusabfragen für Aura, Mine, Explosion und Turm zellweise einschränken; exakte Distanzprüfung bleibt. Kandidaten wieder in ursprünglicher Gegnerreihenfolge verarbeiten, damit Gleichstände und Kettenblitze gleich bleiben. Reststrecken über Weg-Suffixlängen und aktuelle Segmentposition ermitteln. Erst nach Referenzvergleich aktivieren: geänderte Gleitkomma-Summierung darf Zielauswahl nicht unbemerkt verändern.

Ziel: Messbar weniger Distanzberechnungen in dünn besetzten Karten; dicht belegte Karten als Gegenprobe. Nicht pauschal voraussetzen, dass ein Index bei wenigen Gegnern schneller ist.

### 5. Darstellung und Speicher glätten

Statische Karten-/Objektsynchronisation nur nach Revisionen; Gegnerbewegung und Effekte weiterhin in jedem dargestellten Frame. Vorhandene Instanzen/Pools ausbauen, gleiche Geometrien und Materialien wiederverwenden. Entfernte Gegner-/Minenobjekte bei Bedarf recyceln, sämtliche Animationen/Zustände vollständig zurücksetzen. Pools dürfen nicht unbegrenzt wachsen; überschüssige Ressourcen nach Lastspitzen freigeben. Schatten und Darstellung unverändert lassen.

Ziel: Weniger Speicherallokationen und Garbage-Collection-Spitzen bei Spawns und Explosionen, gleiche sichtbare Effekte. Speicher nach wiederholten Runs, Rückkehr ins Menü und Duo-Reconnect prüfen.

### 6. Hintergrund und hohes Tempo stabilisieren

Simulation und Darstellung weiter entkoppeln. Feste Spielschritte unverändert, Aufholarbeit nach Zeitbudget in kurzen Aufgaben verarbeiten; Darstellung einmal danach statt für jeden Schritt. Zeitrückstand explizit erfassen und erhalten. Keine doppelten Updates durch Intervall und Animationsframe. Erst wenn Messungen es rechtfertigen: Simulation in einen Worker auslagern und geordnete Eingaben/Snapshots definieren; das ist ein größerer Umbau und keine erste Maßnahme.

Ein Worker garantiert keinen Betrieb bei OS-Suspendierung auf Mobile. Für lange Unterbrechungen muss Wiederaufnahme definiert werden, ohne vorzugeben, der Browser sei durchgelaufen. Duo läuft serverseitig weiter; dort vorhandene Debt-Begrenzung separat auf Zeitverlust unter Last prüfen. Dieses Verhalten nicht nebenbei als Performance-Fix ändern.

### 7. Duo-Transport und Persistenz

Autorisierung ohne vollständige View-Erstellung, höchstens eine Snapshot-Erstellung pro benötigter Zustandsrevision. Unveränderte Kartendaten nicht pro Poll rekonstruieren; gegebenenfalls versionierte statische und dynamische Anteile mit vollständigem Resync nach Reconnect. Änderungen an Protokoll erst nach Messung der Bytes/Antwortzeit. Persistenz nur optimieren, wenn bestätigte Kommandos weiterhin dauerhaft gespeichert sind; kein ACK vor notwendiger Sicherung. Ein einzelner Writer mit geordneter Warteschlange wäre ein späterer Kandidat.

## Abnahmekriterien

1. Pro Änderung Referenzzustände, Schadensstatistik, Gold, HP, Spawns, Minen und Zufallsfortschritt vergleichen. Im Benchmark identische Hashes; zusätzlich Gameplay-Tests für Upgrades, Biome, Gebäude, Beschwörer und Gasttürme.
2. Gesamtsuite: `node --test --test-isolation=none tests/*.test.cjs server/tests/*.test.cjs`. Duo einschließlich Reconnect, verlorener ACK, Wartung und Wiederherstellung.
3. Browserziel auf vereinbarten Referenzgeräten: Desktop p95-Framezeit unter 16,7 ms für 60 Hz, Mobile zunächst unter 33,3 ms für 30 Hz. Das sind zu validierende Ziele, keine bisher erreichten Werte; 120/144-Hz-Geräte separat erfassen. Simulation muss bei 8× dauerhaft nachkommen, ohne wachsenden Rückstand.
4. Keine durch eigene Aufholschleifen verursachten langen Aufgaben über 50 ms als Ziel. Lange Browser-/OS-Unterbrechungen gesondert ausweisen. Keine verlorenen oder doppelten Gegner/Belohnungen.
5. Gleiche Auflösung, Grafikoptionen und Szene vor/nach vergleichen. Keine abgeschnittenen Effekte, fehlenden Partikel, flackernden Labels oder veralteten Menüs.
6. Eine Optimierung je Schritt messen. Verschlechterungen in kleinen Runs, steigender Speicherverbrauch oder abweichende Kampfergebnisse verhindern die Übernahme.

## Nächster Schwerpunkt

Nach dem Kampf-Fix und dem ersten UI-Schritt folgen Karten-/Weg-Caches sowie weitere UI-/Layout-Arbeit, anschließend räumliche Suche. Einen Worker oder ein neues Rendering-System erst erwägen, wenn die kleineren Maßnahmen vermessen sind. Verknüpfung mit zukünftigen Gold-Ausgaben: [LATE_GAME_PLAN.md](LATE_GAME_PLAN.md); zusätzliche Hexe vergrößern die Last und gehören in künftige Referenzfälle.

## Erstes Ergebnis: umgesetzt und gemessen

Turmdefinitionen werden jetzt ticklokal wiederverwendet; die Verlangsamungsprüfung durchläuft nur Aura-Türme. Referenzen des Aufrufers werden nicht um dauerhafte Caches ergänzt. Grafikcode und Spielregeln sind unverändert.

Lokale Messung mit Node v24.19.0, Windows x64, Ryzen 7 9850X3D. Rohdaten: [vorher](../scripts/performance-before.json), [nachher](../scripts/performance-after.json).

| Künstlicher Fall | Mittlere Tickzeit vorher → nachher | p95 vorher → nachher | Definitionsaufrufe pro 400 Ticks vorher → nachher |
| --- | --- | --- | --- |
| Welle 40 | 6,76 → 4,07 ms | 13,19 → 9,70 ms | 1.392.000 → 16.000 |
| Welle 50 | 8,57 → 4,80 ms | 16,60 → 11,17 ms | 1.712.000 → 16.000 |
| Welle 60 | 9,49 → 5,85 ms | 18,18 → 13,72 ms | 2.032.000 → 16.000 |

In diesen Fällen etwa 38–44 % weniger mittlere Kampf-Rechenzeit. Alle drei vollständigen Ergebnis-Hashes sind vor/nach identisch, einschließlich Minen und Projektilen. Die absoluten Zeiten schwanken mit Laufzeit und Systemlast. Das ist keine Aussage über die Gesamt-FPS oder sämtliche Turmkombinationen. Zusätzliche Regressionstests prüfen die Aktualität nach Upgrade/Buffwechsel und vorgegebene Aura-Definitionen.

## Zweiter Schritt: unnötige UI-Neuerstellung entfernt

Umgesetzt in `classes/game.js`:

- Handkarten behalten ihre DOM-Knoten, solange Karten, Auswahl, Rotation und Rettungskarte unverändert sind. Klick-Handler und Fokus werden nicht mehr pro Frame ersetzt.
- Deckübersichten haben getrennte Inhalts-Caches für die normale Übersicht und die Belohnungsansicht. Änderungen an Deck, Nachzieh- und Ablagestapel aktualisieren sie weiterhin sofort.
- Wellenpläne für Fortschrittsbalken und Vorhersage werden wiederverwendet. Der reine UI-Cache enthält maximal vier Einträge und wird nicht an die Simulation weitergegeben.
- Vorhersagetexte werden nur bei Änderung relevanter Werte erstellt: unter anderem Gold, Einkommen, Wächter, lebende Gegner und deren Goldwert, Gebäuderabatte und Auswahl.
- Sprachwechsel, neuer Run und Wiederherstellung invalidieren die betreffenden Anzeigen. Rendering, Animationen, Simulation und Eingabefrequenz bleiben unverändert.

Nachweis: `tests/ui-performance.test.cjs` prüft über 120 unveränderte Renderaufrufe **null neue Wellenplan-Berechnungen, null Schreibzugriffe auf den Wellen-Vorhersagetext und dieselben Handkarten-Knoten**. Weitere Fälle prüfen Kartenrotation/-wechsel, Rettungskarte, Deckänderung, Gold, Wächter, Live-Gegner, Marktrabatte, Sprache, Neustart und Checkpoint. Gesamtsuite: **323 Tests bestanden**.

Noch offen: andere HUD-Texte, vollständige Trennung statischer/live Vorhersageteile und Layoutmessungen. Diese Änderung beansprucht keine vollständige ereignisgesteuerte UI und keine gemessene Browser-FPS-Steigerung. Die Prüfungen laufen mit dem vorhandenen DOM-Testmodell; Browser-/GPU-Messungen wurden nicht durchgeführt.

## Dritter Schritt: Spawn-Wege und Gegnerprofile wiederverwenden

Umgesetzt in `classes/run-runtime.js`, gemeinsam für Solo und Duo:

- Das Wegenetz wird bei unveränderter Kartentopologie wiederverwendet. Ein Inhaltsvergleich berücksichtigt Kartenreihenfolge, Koordinaten, Typ/Modell, Straßen und Tunnel. Damit werden auch Änderungen ohne zusätzliche Hexe erkannt. Der lineare Vergleich bleibt bewusst bestehen, bis alle Kartenänderungen über zentrale Revisionen abgesichert sind.
- Spawnquellen werden weiterhin aus den aktuellen Tiles und Gebäuden abgeleitet. Ein Portalbau/-verkauf oder ein ersetztes Tile kann deshalb keinen veralteten Eingang hinterlassen.
- Gegnerprofile werden einmal je Kombination aus Welle, Einkommen und Herausforderungsmodus berechnet. Gegner erhalten eigene Objekte; Schaden verändert keine zwischengespeicherten Profile.
- Zufällige Wege werden weiterhin für jeden Gegner gewählt, in derselben Reihenfolge und mit derselben Anzahl Zufallsaufrufe. Kein Caching der Zufallsentscheidungen.
- `WeakMap`-Caches liegen außerhalb des Spielstands, halten abgeschlossene Runs nicht dauerhaft fest und werden nach Wiederherstellung neu aufgebaut. Kein neues Speicherformat und kein Protokollwechsel.

Messung: `node scripts/spawn-performance.cjs scripts/spawn-performance-after.json`. Künstliche Karte mit 40 geraden Straßenhexen plus Basis; alle normalen Spawns der jeweiligen Welle, ohne Kampf/DOM/Grafik. Ein Aufwärmlauf, drei Messläufe. Aufrufzähler sind in beiden Varianten aktiv. Rohdaten: [vorher](../scripts/spawn-performance-before.json), [nachher](../scripts/spawn-performance-after.json).

| Fall | Gesamte Spawn-Arbeit, Mittelwert vorher → nachher | Wegenetz-Berechnungen | Wellenplan-Berechnungen |
| --- | --- | --- | --- |
| Welle 40, 85 Gegner | 23,81 → 10,83 ms | 85 → 1 | 85 → 1 |
| Welle 50, 105 Gegner | 34,24 → 13,17 ms | 105 → 1 | 105 → 1 |
| Welle 60, 125 Gegner | 35,43 → 14,16 ms | 125 → 1 | 125 → 1 |

In diesem isolierten Test etwa 55–62 % weniger Rechenzeit für die Spawn-Arbeit. Die Zeit bezieht sich auf sämtliche Spawns zusammen, nicht auf einen Frame. Alle Gegner-/Weg-/Zufallszustands-Hashes stimmen vorher/nachher überein. Keine daraus abgeleitete Gesamt-FPS-Aussage.

Vier neue Regressionstests prüfen Invalidierung bei Karten-/Straßen-/Tunneländerung, Portale, frische Tile-Referenzen, exakte Zufallswege auf einer verzweigten Karte, Profiländerungen und Checkpoint-Wiederherstellung. Gesamtsuite: 327 Tests bestanden. Weiter offen bleiben unter anderem die räumliche Gegner-/Minensuche, Minen-Straßengeometrie und Layoutmessungen. Grafik, Effekte, Balancing und Scheduler wurden in diesem Schritt nicht verändert.

## Vierter Schritt: Straßenabschnitte für Minen wiederverwenden

Die Schnittberechnung zwischen Straßen und Minenleger-Reichweite wird in `classes/combat.js` je Turm wiederverwendet. Jede Platzierung prüft weiterhin Karte, Straßenreihenfolge/-form, Position und effektive Reichweite. Änderungen erzeugen neue Abschnitte; bereits vorhandene Minen beeinflussen die Auswahl weiterhin nicht. Segmentreihenfolge, Längengewichtung und Zufallsaufrufe bleiben exakt erhalten. Keine Änderungen an Auslösung, Stapelung, Schaden oder Effekten.

Der Cache enthält höchstens einen Eintrag pro Turm in einer `WeakMap`, außerhalb der Spielstände. Ein neuer oder wiederhergestellter Turm beginnt ohne Cache. Der vereinfachte `roadPoints`-Pfad für Tests bleibt unverändert.

Reproduzierbare Messung: `node scripts/mine-performance.cjs scripts/mine-performance-after.json`. Künstlicher Fall mit 41 Hexen, zehn Minenlegern und 200 Simulationsaufrufen à zwei Sekunden; 2.000 Minen, keine Gegner und keine Darstellung. Ein Aufwärmlauf, drei Messläufe. Enthält auch die übrige Runtime-Arbeit und die Prüfung vorhandener Minen. [Vorher](../scripts/mine-performance-before.json) / [Nachher](../scripts/mine-performance-after.json):

- Straßen-Geometrieberechnungen: **82.000 → 410**.
- Mittlere Gesamtzeit des Tests: **562,18 → 114,54 ms**, etwa 80 % weniger in diesem isolierten Szenario. Einzelmessungen schwanken deutlich; keine Übertragung dieser Prozentzahl auf Spiel-FPS.
- Alle 2.000 Minen und der Minen-Zufallszustand haben vorher/nachher denselben Hash.
- Neue Tests vergleichen gecachte gegen frisch berechnete Positionen bei Reichweiten-, Straßen-, Kartentyp- und Turmänderungen sowie hinzugefügten/entfernten Hexen. Bestehende Tests für gleichmäßige Zufallsverteilung, Stapelung, fehlende Kettenreaktion und Checkpoint-Fortsetzung bestehen weiterhin.

Gesamtsuite: **329 Tests bestanden**. Weiter offen: räumliche Suche für Minenauslösung/Gegner und Layoutmessungen. Keine Browser-/GPU-Messung durchgeführt.

## Fünfter Schritt: redundante Wegberechnungen bei der Zielauswahl

`targetByPriority` berechnet den Vergleichswert des bisher besten Ziels jetzt einmal und übernimmt bei einem Wechsel den bereits berechneten Wert des neuen Ziels. Das strikte `>` erhält die ursprüngliche Reihenfolge bei Gleichständen. Die ursprüngliche Distanzformel und Summierungsreihenfolge bleiben unverändert.

Zusätzlich teilen Türme und Nekromanten-Geister die verbleibende Wegdistanz eines Gegners innerhalb desselben Simulationsschritts. Der Cache entsteht pro Schritt neu; Bewegung findet vor der Zielauswahl statt. Leben, Rüstung und Magieresistenz werden ausdrücklich weiterhin aktuell ausgewertet, damit ein Treffer die Auswahl des nächsten Turms beeinflusst.

Gezielter Nachweis: vier Türme, drei Gegner, Priorität „nächster zur Basis“ benötigen **3 statt 16 Wegberechnungen pro Schritt**. Der nächste Schritt berechnet erneut drei aktuelle Distanzen. Alle Prioritäten, Fallbacks und Gleichstände werden gegen die vorherige Vergleichslogik geprüft; ein zusätzlicher Test sichert veränderte Lebenswerte zwischen zwei Angriffen ab.

Die erneuten vollständigen Kampf-Benchmarks ([vorher](../scripts/target-performance-before.json), [nachher](../scripts/target-performance-after.json)) haben in allen drei Fällen exakt gleiche Zustands-Hashes. Ihre mittleren Tickzeiten sind jedoch uneinheitlich: Welle 40 8,91 → 3,81 ms, Welle 50 5,97 → 5,97 ms, Welle 60 7,84 → 8,40 ms. Deshalb **keine belastbare prozentuale Verbesserung der Gesamt-Kampfzeit** aus diesen Durchläufen ableiten. Der nachgewiesene Gewinn ist die reduzierte Zahl der Distanzberechnungen; der Gesamteffekt muss unter kontrollierter Last bzw. im Browser noch bewertet werden.

Gesamtsuite: **332 Tests bestanden**. Keine Änderungen an Reichweiten, Gegnerzahl, Grafik, Effekten, Zielregeln oder Spielgeschwindigkeit.

## Sechster Schritt: räumliche Suche für Minenauslöser

Bei mindestens 16 Minen und 32 Gegnern wird eine räumliche Einteilung mit 28 Einheiten Zellgröße verwendet. Jede Mine prüft nur Zellen, die ihren unveränderten Auslöseradius von 14 berühren; die abschließende Prüfung verwendet weiterhin dieselbe exakte Distanzformel. Kleine Gefechte sowie erkannte dichte Schwärme verwenden den bisherigen direkten Scan. Der Index wird je Aufruf frisch aus den aktuellen Gegnerpositionen erstellt.

Alle Auslöser werden wie bisher vor der ersten Explosion bestimmt. Stapel lösen dadurch auch dann vollständig aus, wenn die erste Mine den gemeinsamen Auslöser tötet. Explosionen lösen keine Nachbarminen aus. Schaden, Gegnerreihenfolge, Kill-Gold, Statistik und Effekte bleiben gleich; die Schadensabfrage selbst verwendet weiterhin die ursprüngliche Reihenfolge.

Vergleich: `node scripts/mine-trigger-performance.cjs scripts/mine-trigger-performance.json`. Eingefrorene vorherige Auslösefunktion dient als Referenz. Pro Fall alternierende Aufrufreihenfolge, zehn Aufwärm- und 50 Messläufe, in beiden Varianten instrumentierte Distanzberechnung. [Messdaten](../scripts/mine-trigger-performance.json):

| Künstlicher Fall | Distanzprüfungen vorher → nachher | Mittlere Zeit vorher → nachher |
| --- | --- | --- |
| 500 verteilte Minen, 125 Gegner, keine Auslösung | 62.500 → 288 | 50,90 → 1,37 ms |
| Gleiches Feld, einige Minen an Gegnerpositionen | 65.550 → 6.548 | 46,19 → 4,11 ms |
| Dicht gedrängte Gegner/Minen | 1.125 → 1.125 | 3,30 → 3,79 ms |
| Kleines Gefecht | 32 → 32 | 0,023 → 0,019 ms |

Die absolute Laufzeit ist durch VM und Instrumentierung geprägt und keine Browser-FPS-Messung. Der dichte Fall zeigt trotz direktem Scan keinen Zeitgewinn; die Erkennung hat einen Zusatzaufwand. Der Vorteil liegt bei großen verteilten Feldern. Referenz und Optimierung liefern in allen Fällen identische vollständige Zustände und Ereignisfolgen.

Tests prüfen zusätzlich negative Koordinaten, Zellgrenzen, exakt/knapp innerhalb/außerhalb des Radius, tote bzw. aufgebrauchte Gegner sowie Stapel. Gesamtsuite: **335 Tests bestanden**. Keine Einschränkung von Grafik, Minenzahl, Effekten oder Spielregeln.

## Siebter Schritt: leere Turmplätze im Kampftakt überspringen

`HexRunRuntime.advance` berechnet Turmpositionen nur noch für Hexe mit mindestens einem tatsächlich gebauten Turm. Hexe ohne Türme benötigen im Kampf weder Layoutobjekte noch Rotationsberechnungen. Turmreihenfolge, Auswahl der belegten Plätze und Basiswaffe bleiben unverändert. Kein Cache: Kauf und Verkauf wirken sofort im nächsten Schritt.

Regressionstest mit 41 Hexen und zehn belegten Hexen: **10 statt 41 Aufrufe von `slotPositions` pro Simulationsschritt**. Nach Verkauf aller Türme null, nach erneutem Bau auf einem Hex genau ein Aufruf. Die Verbesserung betrifft die gemeinsame Solo-/Duo-Simulation. Keine gemessene Gesamt-FPS-Aussage.

## Achter Schritt: gemeinsame Preisberechnung der Schnellbauleiste

Die fünf Schnellbauangebote suchten bisher jeweils sämtliche freien Turmhexe ab; für jeden dieser Plätze wurde die ganze Karte erneut auf Gebäudeeffekte geprüft. `HexBuildings.freeSlotDiscount` sammelt nun einmal die Märkte und ermittelt bei einem zweiten Kartendurchlauf den besten Rabatt auf tatsächlich freien Plätzen. Aus demselben Rabatt entstehen die fünf weiterhin aufgerundeten Preise. Für positive Baukosten ist das identisch zum bisherigen Minimum aller einzeln aufgerundeten Angebote.

Keine dauerhafte Zwischenspeicherung: Marktbau/-verkauf, Upgrades, Zusatzhex, Belegung und Gold werden bei jeder Aktualisierung berücksichtigt. Beim Aktivieren eines Bauangebots wird ebenfalls frisch geprüft; beim tatsächlichen Bau gilt weiterhin der Preis am konkreten Platz.

Nachweis in `tests/quick-price-performance.test.cjs`:

- 100 Kartenvarianten mit unterschiedlichen Belegungen, Gebäudetypen, Marktstufen und Zusatzhexen: Preise identisch zur bisherigen Berechnung.
- 60 freie Turmhexe, sechs Märkte, fünf Angebote: **18.300 → 120 durchlaufene Karteneinträge pro Aktualisierung**. Dazu kommen die gezielten Vergleiche mit den gesammelten Märkten; die Zahl bezeichnet keine vollständige Operations- oder Zeitmessung.
- UI reagiert sofort auf Goldänderungen, versetztes Zusatzhex, belegten letzten Platz und erneut freien Platz.

Grafik, Eingaben, Preisregeln und Spieltempo bleiben unverändert. Browser-FPS wurden nicht gemessen. Gesamtsuite: **342 Tests bestanden**.

## Neunter Schritt: Gebäudewerte innerhalb einer Berechnung wiederverwenden

Schmiede-/Markteffekte erstellen ihre Definition nicht mehr doppelt für dieselbe Prüfung. Die Radiusprüfung nutzt die bereits berechnete Hexdistanz. Bei der Flächenmarkierung werden die Werte jeder beteiligten Schmiede bzw. jedes Marktes einmal für den Aufruf ermittelt, statt erneut für jedes Hex. Auch die Schnellbau-Rabattprüfung nutzt ihre bereits vorliegenden Marktwerte.

Beim Aktualisieren von Turmboni wird der gemeinsame Bonus eines Hexes einmal berechnet und auf dessen Türme angewendet. Keine dauerhafte Zwischenspeicherung: Änderungen an Stufe, Zusatzhex, Gebäuden und Türmen gelten beim nächsten Aufruf sofort. Farben, Flächen, Radius, Bonusstärke und Nicht-Stapelbarkeit bleiben erhalten.

Reproduzierbarer Test: `node scripts/building-performance.cjs scripts/building-performance-after.json`. 60 Hexe, 180 Türme, sechs Gebäude; Boni für alle Hexe, eine Schmiedemarkierung und vollständiges Aktualisieren der Turmboni. Ein Aufwärmlauf und 20 Messläufe. [Vorher](../scripts/building-performance-before.json) / [Nachher](../scripts/building-performance-after.json): **3.061 → 723 Definitionsberechnungen**, mittlere Zeit **11,65 → 3,84 ms** in diesem künstlichen Teilbereich. Ergebnis-Hash inklusive Effekten, Markierungen und Turmboni identisch. Keine daraus abgeleitete Gesamt-FPS-Aussage.

Neue Regressionstests prüfen unabhängige Flächenabdeckung und sofortige Anpassung bei Upgrades, Zusatzhexänderung, Entfernung sowie Markt-/Schmiedeboni. Gesamtsuite: **344 Tests bestanden**. Keine Browser-/GPU-Messung.

## Schritte 10–12: drei weitere Optimierungen

### 10. Nächstes Kettenblitzziel ohne Sortierung

Je Sprung werden Kandidaten einmal durchlaufen und ihre Distanz einmal bestimmt. Eine Kandidatenliste mit anschließender Sortierung entfällt. Ein strikter Vergleich erhält den ersten Kandidaten bei gleicher Entfernung, entsprechend der bisherigen stabilen Sortierung. Reichweite, Sprungreihenfolge, Schaden und Effekte bleiben unverändert.

Regression: 15 Gefechtsvarianten mit 125 Gegnern und zehn Blitzzielen gegen die eingefrorene vorherige Suchformel; vollständige Zustände und Ereignisse identisch. Gezielt enthalten sind gleich weit entfernte Ziele. Die Anzahl exakter Distanzberechnungen ist geringer; kein pauschaler FPS-Wert abgeleitet.

### 11. Keine vollständige Gegnerkopie für Beschwörer pro Tick

Die Beschwörerprüfung merkt sich die ursprüngliche Listenlänge und durchläuft nur diese Einträge. Die bisher in jedem Kampfschritt erstellte Kopie sämtlicher Gegnerreferenzen entfällt. Währenddessen angehängte Diener werden, wie zuvor, nicht noch einmal in derselben Beschwörerprüfung bearbeitet; die anschließende Kampfsimulation bleibt gleich.

Regression: zwei gleichzeitig beschwörende Bosse behalten die Einheiten-IDs, Zeitpunkte und das Limit von jeweils sechs Dienern. Bestehende Beschwörer-/Checkpoint-Tests gelten weiterhin. Keine Änderung an der Zahl sichtbarer Gegner.

### 12. Mehrfachbau-Angebote teilen Rabattberechnungen

Das Turmbaumenü ermittelt den Rabatt je ausgewähltem Platz einmal pro UI-Aktualisierung und verwendet die daraus berechneten Preise für Beschriftung, Bezahlbarkeitsmarkierung und Buttonstatus. Jeder Einzelpreis wird weiterhin vor dem Summieren aufgerundet. Kein Cache über Aktualisierungen hinweg; Käufe nutzen weiterhin die autoritative Prüfung des konkreten Bauplatzes.

Regression: zwei ausgewählte Plätze brauchen bei stabiler Anzeige **zwei statt bis zu zwanzig Rabattabfragen** für fünf Angebote. Ein 25-Gold-Turm auf Plätzen mit 15 % und 25 % Rabatt kostet weiterhin 22 + 19 = 41 Gold. Änderungen an Gold und Marktstufe aktualisieren Buttons unmittelbar.

Neue Tests: `tests/performance-batch-three.test.cjs`. Gesamtsuite: **347 Tests bestanden**. Alle drei Änderungen erhalten Grafik, Effekte und Spielregeln. Keine Browser-/GPU-Messung durchgeführt.
