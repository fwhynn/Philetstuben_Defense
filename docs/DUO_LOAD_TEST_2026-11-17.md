# Duo-Lasttest, 17. November 2026

## Anschlussrunde: Speicherung und Netzwerk

Diese Runde folgt auf die unten dokumentierte Kampfoptimierung. Sie ändert
weder Gameplay noch Renderer, Speicherformat, Speichertakt oder Sendefrequenz.

**Speicherung:** Ein CPU-Profil von zwölf vollständigen Checkpoints mit acht
Räumen zeigte wiederholte Wegprüfung und Serialisierung als Hauptkosten.
Die Checkpoint-Erstellung bindet Standardfunktionen einmal lokal, merkt sich
Wegschlüssel und kodierte Eigenschaftsnamen innerhalb eines einzelnen Aufrufs.
Zwischen zwei Checkpoints bleiben keine dieser Zwischenergebnisse erhalten.
Die Ausgabe bleibt bytegleich zur bisherigen getaggten JSON-Darstellung.
Dateischreiben, fsync, Index-Veröffentlichung und Bestätigung sind unverändert.

**Netzwerk:** Unveränderte skalare Gegnerfelder brauchen keine erneute
JSON-Kodierung. Ein separater Worker berechnet Baselines und Deltas; die
Ansichten werden als JSON-Text an ihn weitergereicht. Ein erster Versuch mit
vollständigen Objektkopien wurde wegen zusätzlicher Kopierkosten überarbeitet.
Socket.IO-Protokoll, Kompression, Baseline-Bestätigungen und die Behandlung
verlorener Pakete bleiben erhalten. Ein ausgefallener Encoder wird beim nächsten
Auftrag mit einer vollständigen Baseline neu gestartet; Simulationszustand und
Spielstände bleiben dabei unangetastet.

Erster Vergleich mit acht Räumen / 16 Clients, jeweils 25 Sekunden nach fünf
Sekunden Aufwärmen, ohne gleichzeitig laufende Tests oder Browser:

| Messwert | Vor dieser Runde | Nur Speicheroptimierung | Speicher + Netzwerk |
| --- | ---: | ---: | ---: |
| Langsamster Simulationsschritt einschließlich Checkpoint | 302 ms | 190 ms | 179 ms |
| Hauptthread-Verzögerung P95 | 68 ms | 68 ms | 20 ms |
| Zustandsabfrage P95 | 385 ms | 252 ms | 85 ms |
| Snapshot-Abstand P95 | 336 ms | 217 ms | 217 ms |

Alle 16 Clients empfingen und dekodierten Zustände; keine Verbindungs-, Anfrage-
oder Decoderfehler. Spielfelder aller Spieler waren nach Speichern und Wiederladen
identisch. Diese Einzelmessungen belegen keine garantierten Latenzobergrenzen.
Speicherspitzen sind reduziert, nicht vollständig beseitigt.

Die Auslagerung verbessert die Reaktionszeit des Hauptthreads, spart jedoch
nicht automatisch Gesamt-CPU: Der Testprozess einschließlich Lastclient-Worker
verbrauchte im Vergleich „nur Speicher“ / „Speicher + Netzwerk“ etwa 56 / 67
CPU-Sekunden in 25 Sekunden Wandzeit und lieferte dabei 3233 / 3422 Pakete.
Zusätzliche CPU-Kerne helfen; die Messung ist keine Kapazitätszusage für einen
Server mit nur einem Kern. Die Worker-Zahl für die Simulation selbst bleibt eins.

Rohdaten: `work/duo-storage-8.log`, `work/duo-network-text-8.log` sowie die
zugehörigen CPU-Profile im übergeordneten Arbeitsverzeichnis. Die folgenden
Abschnitte beschreiben den vorherigen Stand und dessen Vergleichswerte.

Die vollständige Regression dieser Anschlussrunde bestand mit **1066 Tests,
null Fehlern** (`work/duo-storage-network-full-tests.log`). Neu abgedeckt sind
Cache-Erneuerung zwischen Checkpoints, besondere Zahlen-/Punktwerte, skalare
und verschachtelte Netzwerkänderungen, bytegleiche Worker-Pakete, verzögerte und
falsche Baseline-Bestätigungen, Paketverlust, getrennte Clients, Encoder-Neustart
und Schließen sowie Rechteprüfung und Revisionsunterdrückung im JSON-Datenweg.

Abschließende Wiederholung nach der vollständigen Regression (kein CPU-Profiler
aktiv; `work/duo-storage-network-final-{1,4,8}.log`):

| Räume / Clients | Schritte in 25 s | Langsamster Schritt | Hauptthread P95 | Zustandsabfrage P95 | Snapshot-Abstand P95 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 / 2 | 501 | 31 ms | 23 ms | 20 ms | 118 ms |
| 4 / 8 | 500 | 90 ms | 21 ms | 26 ms | 137 ms |
| 8 / 16 | 501 | 186 ms | 20 ms | 93 ms | 214 ms |

Alle drei Läufe ohne Clientfehler und mit identischen wiederhergestellten
Spielfeldern aller Spieler. Unterschiede zur ersten Messung sind normale
Laufzeitschwankungen; für acht Räume bestätigen beide Läufe die Entlastung.
Zusammengefasste Rohdaten: `work/duo-storage-network-comparison.json`.
Die Änderungen sind lokal und wurden nicht veröffentlicht.

## Aufbau und Grenzen

Lokaler Windows-Rechner, Node 22.23.3, produktiver Worker, Socket.IO-Kompression,
10-Hz-Snapshotversand und dauerhafte, getrennte Raumdateien. Je Raum zwei
unabhängige Socket.IO-Clients mit gültigen Sitzungskennungen und bestätigten
Delta-Baselines. Die Lastclients laufen in einem separaten Worker. Gemessen
werden 25 Sekunden nach fünf Sekunden Aufwärmen. Jeder Lauf startet aus derselben
synthetischen Kampfsituation; es ist kein regulär erspielter Spielstand:

- Welle 30, Tempo 1, zwei Karten je Raum.
- Je Karte 40 Spiegel-Abzweige mit 80 Türmen, 120 vollständigen Gegnern aus dem
  Wellenplan und 500 Minen. Gegner bewegen sich, Türme schießen, Minen explodieren.
- Ein, vier und acht Räume, entsprechend zwei, acht und 16 Netzwerkclients.
- Alle Daten liegen in neu erzeugten temporären Verzeichnissen. Nach Stopp und
  Flush werden die Spielfelder **aller** Spieler mit den erneut geladenen
  Spielständen verglichen.

Es handelt sich um einen lokalen Kapazitäts-/Regressionstest, keine Zusage für
die Kapazität eines anderen Servers oder für Internetlatenzen. Bei Überlast
vergeht weniger Simulationszeit; Vorher/Nachher nach gleicher Wandzeit enthält
daher nicht exakt dieselben Gegnerpositionen. Der separate deterministische
Vergleich prüft vollständige Checkpoints nach gleicher Tickzahl.

## Reproduktion

Aus dem Spiel-Repository:

```powershell
node scripts/duo-load.cjs 4 --reference-targeting
node scripts/duo-load.cjs 4
node --test tests/duo-load-targeting.test.cjs
```

`--reference-targeting` ersetzt nur im Test-Worker die optimierten
Zielauswahl-Prädikate und Pool-Abfragen durch ihre ursprünglichen Ausdrücke. Es ändert keine
Quelldateien. `LOAD_SECONDS` kann die Messdauer ändern.

Für zwei echte Browserclients plus weitere Räume:

```powershell
node scripts/duo-load.cjs 4 --browser
```

Die ausgegebenen Links verwenden ausschließlich neu erzeugte Testtokens. Für
Client 2 `127.0.0.1` durch `localhost` ersetzen: getrennte Browser-Speicher und
Profilsperren. Das reguläre Erstspieler-Testprofil lässt sich absichtlich nicht
mit einem Duo-Token kombinieren; deshalb werden hier frische lokale Ursprünge
verwendet. Die Account-API wird auf einen nicht produktiven lokalen Pfad gesetzt.
Die Simulation beginnt erst mit `/__load/start`. `/__load/report` liefert die
Messwerte. Diese Endpunkte und zusätzliche Modul-Auslieferung existieren nur im
Testskript; sie werden nicht im Produktionsserver registriert.

Der Browsertest wurde ausdrücklich angefordert. Zwei Browserclients mit echter
Three.js-Darstellung liefen gemeinsam mit sechs weiteren Netzwerkclients
(vier Räume). Beide meldeten sichtbare Dokumente und keine JavaScript-Fehler.
Die P95-Bildabstände in den ausgewerteten Zwei-Sekunden-Fenstern nach dem Laden
lagen bei etwa 16,8–16,9 ms. Das beschreibt den beobachteten Kartenausschnitt und
ist kein GPU-Benchmark mit der gesamten Karte gleichzeitig im Sichtfeld.
Renderer, Grafikeinstellungen und Animationen wurden nicht verändert.

## Gefundener Engpass

Das CPU-Profil des ursprünglichen Kampfs zeigte die häufigen Lebens-, Rüstungs-
und Magieresistenzprüfungen (`pool`) als größten Posten: Jeder schussbereite
Turm prüfte diese Werte auch bei weit entfernten Gegnern. Die Reichweite wird
nun vorher geprüft, einschließlich einer günstigen Rechteckprüfung und der
unveränderten exakten `Math.hypot`-Distanz. Die ursprüngliche Gegnerreihenfolge,
Prioritäten und zwischen Treffern veränderte Lebenswerte bleiben erhalten.

Zusätzlich werden `Number` und `Math.max` für die Pool-Abfragen einmal lokal
gebunden. Das vermeidet die sehr häufige Auflösung dieser globalen Funktionen
im Headless-VM-Kontext, bei exakt gleicher Zahlenumwandlung und Berechnung.

## Ergebnisse

Je Zelle Vorher → Nachher, Millisekunden. P95 bedeutet: 95 % der Messwerte liegen
unter diesem Wert. Zustandsabfragen sind echte Socket.IO-Anfragen, keine
Schreibbefehle. Laufzeit umfasst Simulation und gegebenenfalls den fälligen
dauerhaften Checkpoint; Netzwerkintervalle werden am empfangenden Client gemessen.

| Räume / Clients | Schritt im Mittel | Schritt P95 | Snapshot-Abstand P95 | Zustandsabfrage P95 |
| --- | ---: | ---: | ---: | ---: |
| 1 / 2 | 14,2 → 5,1 | 18,5 → 6,1 | 126,9 → 118,7 | 22,3 → 20,1 |
| 4 / 8 | 56,0 → 18,9 | 154,0 → 18,8 | 515,2 → 186,6 | 391,1 → 70,1 |
| 8 / 16 | 125,2 → 36,6 | 296,6 → 37,2 | 1306,8 → 336,4 | 788,1 → 385,0 |

Mittlere Schrittzeit um 64 %, 66 % bzw. 71 % reduziert. Bei acht Räumen wurden
vorher nur 195, nachher 501 Schritte im Messfenster verarbeitet; Ziel sind
ungefähr 500 Schritte in 25 Sekunden. Alle Clients empfingen Daten, keine
Verbindungs-, Anfrage- oder Decoderfehler; alle gespeicherten Spielfelder kamen
nach erneutem Laden unverändert zurück. Temporäre Kennungen/Serverports sind
bewusst nicht Bestandteil des Vergleichs.

**Verbleibende Grenze:** Synchrone dauerhafte Checkpoints im Worker erzeugen
weiterhin Spitzen. Der langsamste Schritt mit acht Räumen dauerte 302 ms,
der größte beobachtete Snapshot-Abstand 613 ms. Auch Kodierung/Kompression und
Verteilung auf 16 Clients belasten den Hauptthread (Event-Loop-P95 ca. 68 ms).
Das ist keine Zusage für stets gleichmäßige 10-Hz-Lieferung bei acht schweren
Partien. Die Speichergarantie, der Ein-Sekunden-Speichertakt, die 50-ms-Schritte,
Grafik und Anzahl der Spielelemente wurden dafür nicht reduziert.

## Validierung

Ein deterministischer Vergleich prüft in drei Szenarien jeweils 200 Schritte
gegen die ursprüngliche Berechnung: Lastfixture, alle Turmtypen mit wechselnden
Prioritäten, sowie Sporen/Schildtreffer/Teilung beim Tod. Alle 20 Schritte werden
die vollständigen Checkpoints bytegleich verglichen, einschließlich Zufallsstand,
Projektilen, Trefferreihenfolge, Gesundheit, Gold und Zwischenzuständen.

Rohmessungen befinden sich im übergeordneten Arbeitsverzeichnis unter
`work/duo-load-comparison.json` und `work/duo-load-browser-after.json`.
Der Browserlauf fand nach der Reichweitenoptimierung und vor der zusätzlichen
Bindung der Standardfunktionen statt; die finalen Servermessungen enthalten
beide Änderungen. Die vollständige Testsuite bestand mit **1060 erfolgreichen
Tests, null Fehlern** (`work/duo-load-full-tests.log`):

```powershell
node --test --test-concurrency=2 --test-timeout=180000 tests/*.test.cjs server/tests/*.test.cjs
```

Der Befehl muss aus dem Spiel-Repository gestartet werden. Ein erster gezielter
Aufruf aus dem übergeordneten Verzeichnis scheiterte bei einem vorhandenen
UI-Test an dessen relativem Dateipfad; der vollständige Lauf im richtigen
Arbeitsverzeichnis bestand. `git diff --check` meldet keine Whitespace-Fehler.
