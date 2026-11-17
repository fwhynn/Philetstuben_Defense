# Duo: Performance und Verhaltenserhalt

## Achte Runde: unabhängige Simulations-Worker

Der Produktionslauncher nutzt acht Slots mit je höchstens einer Partie.
Simulation, Besitzprüfung, Befehle und dauerhafte Speicherung bleiben innerhalb
eines Raums geordnet. Globale Lobby-Zuordnung bleibt geordnet; Spielbefehle
anderer Räume warten nicht auf diese Verwaltungsqueue. Bestehende Einzeldateien
und Lobby-Indizes werden mit Original- und selbstständiger Sicherung übernommen.
Spielzustandsformat, Spielregeln, Grafik, RNG und Tokens bleiben erhalten.
Release 1.3.1 akzeptiert ausdrücklich die zuvor kompatiblen Spielstände.

Ein Test blockiert einen Worker für 1,5 Sekunden: Ein anderer Raum nimmt
währenddessen einen dauerhaft gespeicherten Befehl an und simuliert weiter.
Identische Tickfolgen, Wiederaufnahme, Migration, globale Retry-IDs, Kapazität,
fehlende Dateien und Worker-Ausfall sind abgedeckt. Simulationsfehler bleiben
fail-closed; kein stiller Ersatz durch eine neue Partie.

Acht Räume / 16 Clients: Zustandsabfragen P95 27 ms (vorher 93 ms),
Snapshot-Abstand P95 136 ms (vorher 214 ms), Hauptthread P95 18 ms.
Alle Räume verarbeiteten 500 Schritte im 25-Sekunden-Messfenster. Der langsamste
raumbezogene Schritt dauerte 48 ms. Das ist nicht direkt mit dem früheren
Gesamtschritt über acht Räume vergleichbar. Alle wiederhergestellten Spielfelder
stimmten überein; keine Clientfehler. Rohdaten: `work/duo-room-workers-8.log`.
CPU/RAM-Bedarf wächst durch zusätzliche Worker; kein Kapazitätsversprechen für
einen einkernigen oder speicherarmen Server. Der gemeinsame Netzwerk-Worker und
das physische Speichermedium bleiben gemeinsame Ressourcen.

## Siebte Runde: Speicherspitzen und Netzwerkverarbeitung

Checkpoint-Erstellung mit aufruflokalen Weg-/Namens-Caches; bytegleiches
Dateiformat und unveränderte dauerhafte Bestätigungen. Ein separater Worker
berechnet die Netzwerk-Deltas, mit JSON-Text statt mehrfacher Objektkopien an
den Worker-Grenzen. Codec-Neustarts betreffen nur Baselines, niemals Partien.
1066 Tests bestanden. Messwerte und CPU-Tradeoff stehen im aktuellen Abschnitt
des [Lasttest-Berichts](DUO_LOAD_TEST_2026-11-17.md).

## Sechste Runde: gemessene Mehrraumlast

Der ausdrücklich angeforderte Test mit zwei 3D-Browserclients und mehreren
Räumen ist im [Lasttest-Bericht](DUO_LOAD_TEST_2026-11-17.md) dokumentiert.
Die dort gemessenen Optimierungen reduzieren die mittlere Simulationszeit mit
acht Räumen von 125 auf 37 ms. Vollständige Zustandsvergleiche und 1060 Tests
bestanden. Die historischen Hinweise weiter unten, dass noch keine Browser-
oder Mehrraumtests stattgefunden haben, gelten für die jeweiligen früheren Runden.

## Fünfte Optimierungsrunde: Worker und Raumdateien

Der Launcher betreibt Simulation und Speicherung jetzt in einem separaten
Node-Worker. Alle Räume laufen darin weiterhin in der bisherigen Reihenfolge;
es ist bewusst kein Pool gleichzeitig simulierender Räume. HTTP, Socket.IO,
Paketkodierung und Assets bleiben im Hauptthread. Das entkoppelt die Erreichbarkeit
des Servers von synchroner Checkpoint-Erstellung und fsync. Ein Test verzögert
Dateischreibvorgänge im Worker künstlich: Der Hauptthread bedient weiter seinen
Timer, während die Befehlsantwort bis zur dauerhaften Speicherung aussteht.

Die asynchrone Grenze trennt keine Sicherheitsentscheidung vom Befehl:
Sitzprüfung, Besitzprüfung, Aktion und Commit sind eine gemeinsame Operation
im Worker. Getestet sind konkurrierende Tab-Übernahme, verlorene Antworten und
erneute Befehle. Pro Socket gibt es höchstens einen laufenden Push und Heartbeat;
es entstehen keine überlappenden Snapshot-Abfragen bei einem beschäftigten Worker.
Simulationstakt, Nachholgrenzen, RNG und Befehlsreihenfolge bleiben erhalten.
Der Launcher wartet auf Worker-Bereitschaft und beendet ihn erst nach Taktstopp,
Speicherung und Backup. Bei Worker-Ausfall werden Aktionen gesperrt (503).

Die bisherige Einzeldatei wird automatisch eingelesen und unverändert unter
`.before-partition` gesichert. Der neue Index verweist auf SHA-256-geprüfte
Raumdateien unter `<DUO_SAVE_FILE>.rooms/`. Neue Raumversionen werden zuerst
dauerhaft gespeichert, dann wird der Index atomar ersetzt. Ergebnisbelege und
Lobby-Metadaten werden gemeinsam mit den Raumreferenzen veröffentlicht. Die
Dateien des aktuellen und vorherigen Index bleiben erhalten; erst danach werden
alte unreferenzierte Generationen entfernt. Beschädigte oder fehlende referenzierte
Raumdateien führen zum Startfehler statt zum Verlust eines Raums. Nach einem
abgebrochenen Commit werden vollständige, aber eventuell noch nicht synchronisierte
Restdateien vor Wiederverwendung erneut dauerhaft geschrieben.

**Das physische Speicherlayout ändert sich; der Spielzustand nicht.** Einzeldaten
wie RNG, Buffs, Karten, Befehlssequenzen und Ergebnisbelege verwenden unverändert
ihre bisherigen Formate. `server/backup.cjs` und das Shutdown-Backup exportieren
eine selbstständige Einzeldatei im bisherigen Format. Nur den neuen Index zu
kopieren genügt nicht als Backup. Betrieb, Migration und Rückkehr zu altem Code
sind in `server/README.md` und `deploy/systemd/README.md` beschrieben.

Messung mit `node scripts/duo-partitioned-performance.cjs`: vier synthetische
schwere Räume, eine Aktion in einem Raum, Schreiben einschließlich fsync in
einem temporären Verzeichnis. Vollständige wiederhergestellte Zustände werden
verglichen; keine echten Profile oder Spielstände werden verwendet.

| Ein Commit | Bisherige Einzeldatei | Raumdateien + Index |
| --- | ---: | ---: |
| Geschriebene Bytes | 34.641.937 | 8.661.704 |
| Atomare Schreibvorgänge | 1 | 3 |
| Einmal gemessene Dauer | 238,87 ms | 218,84 ms |

Das sind etwa 75 % weniger Schreibvolumen für diesen Mehrraumfall, keine 75 %
höhere Spielleistung. Die Zeitmessung ist ein einzelner Lauf; Serialisierung
bleibt Arbeit im Worker. Mehrere aktiv kämpfende Räume teilen weiterhin dessen
CPU, und der Hauptthread verarbeitet weiterhin Netzwerkpakete. Keine FPS- oder
Mehrserver-Skalierungsbehauptung. Aktuelle/vorherige Raumversionen und vollständige
Backups benötigen zusätzlichen Plattenplatz. Ein Server je Speicherpfad bleibt
Voraussetzung.

Validierung: kompletter Lauf mit 1.056 bestandenen Tests, null Fehlern, rund
83 Sekunden (`node --test --test-concurrency=2 --test-timeout=180000
tests/*.test.cjs server/tests/*.test.cjs`). Anschließend 13 gezielte Worker- und
Speichertests erneut bestanden, einschließlich zusätzlichem fsync-Test für
Absturzreste. Die vollständige Suite deckte eine isolierte Renderer-Testumgebung
auf, die den zuvor eingeführten Sichtbarkeitshelfer noch nicht geladen hatte;
die Testumgebung ist korrigiert, ohne Grafikverhalten zu ändern. Der Worker wird
außerdem mit der synchronen Referenzsimulation über 100 identische Ticks verglichen;
automatischer Takt, Stoppen, Neustart und produktiver Launcher werden geprüft.

Keine Browserprüfung, kein Push, kein Release und keine Migration echter Daten.
Die unten als offen aufgeführten Worker/Raumdateien sind mit dieser Runde umgesetzt.

## Vierte Optimierungsrunde: Cache-Abhängigkeiten und Renderer-Synchronisierung

- Der Checkpoint-Cache hängt jetzt von tatsächlichen Match-Änderungen ab, nicht
  von der öffentlichen Revision. Verbindungsstatus, Wiederbeitritts-Countdown,
  Wartungsstatus und Tab-Übernahme ändern weiterhin die öffentliche Revision
  und werden aktuell gespeichert, lösen aber keine erneute Serialisierung des
  unveränderten Kampfzustands aus. Validierte Befehle invalidieren vorsorglich
  auch bei Ablehnung; Änderungen an Augments und Simulationsschritte ebenfalls.
- Landmarken-Sichtbarkeit wird zwischen Raster, Landmarken und Nachbarflächen
  innerhalb desselben synchronen Renderdurchlaufs wiederverwendet. Vor jedem
  weiteren Renderdurchlauf wird der Cache verworfen. Änderungen an der Karte,
  Aufdeckung und Reliktlokalisierung können deshalb nicht übersehen werden.
- Die Prüfung, ob Turm-/Gebäudemodelle neu aufgebaut werden müssen, behält ihre
  bisherigen Vergleichsfelder und identischen JSON-Signaturen. Unveränderte
  Vergleichswerte benötigen aber keine erneute JSON-Serialisierung. Verglichen
  werden die Werte, nicht nur Objektidentitäten; Änderungen an vorhandenen
  Türmen oder Arrays werden weiterhin erkannt. Asset-Neuladen und Renderer-Reset
  bauen über die weiterhin geleerten Modelltabellen wie bisher neu auf.

`node scripts/renderer-sync-performance.cjs`: 160 Felder mit 320 Türmen, ein
Turm pro Renderdurchlauf verändert, 90 Messungen nach Aufwärmen und wechselnder
Messreihenfolge. Median der Modellprüfung: 0,0792 ms zuvor, 0,0470 ms mit Cache
(rund 41 % weniger in diesem Teil). Alle erzeugten Signaturen werden verglichen.
Dies ist eine kleine CPU-Optimierung, keine Messung der gesamten Bildrate.

Ein instrumentierter Raumtest prüft, dass nach dem ersten Checkpoint trotz
mehrerer Verbindungs-/Countdown-/Wartungsänderungen keine weitere Kampferfassung
stattfindet. Nach einem Spielbefehl erfolgt sie sofort wieder. Die Speicherbytes
werden nach jedem dieser Schritte mit der vollständigen Referenz verglichen.

Abschluss: 186 Tests bestanden mit `node --test --test-concurrency=2
--test-timeout=30000 tests/duo*.test.cjs server/tests/duo*.test.cjs
tests/renderer*.test.cjs tests/road-rendering.test.cjs tests/exploration*.test.cjs
tests/run-snapshot.test.cjs tests/startup-version.test.cjs`.
Keine Browserprüfung, kein Push, kein Release und keine Änderungen an echten
Spielständen. Worker sowie getrennte Speicherdateien je Raum bleiben weiterhin
nicht umgesetzt; die synchrone atomare Speicherung und ihre Garantien gelten
unverändert. Diese verbleibenden Architekturpunkte sind kein abgeschlossener
Bestandteil der Optimierung.

## Dritte Optimierungsrunde: unsichtbare Karte und Lebensbalken

Die Präsentationsdaten einer Karte werden jetzt erst beim Anzeigen aufgebaut.
Bis dahin bleiben die aktuellen Serverdaten verfügbar. Teamstatus, Geschenke,
Verstärkungsanzeigen und Ergebniszählung lesen diese Daten direkt, ohne dadurch
die unsichtbare Karte aufzubereiten. Beim Wechsel wird synchron die neueste
Karte aufgebaut; es werden weder Netzwerkpakete übersprungen noch veraltete
Karten gezeigt. Bereits verwendete Turmidentitäten bleiben erhalten. Die
Zwischenspeicherung hält den letzten aufgebauten Zustand je Karte, keine Kette
aller bisher empfangenen Snapshots.

Der Renderer prüft die sechs aktuellen/maximalen Lebens-, Rüstungs- und
Magiewerte, bevor er Lebensbalken aktualisiert. Unveränderte Werte lösen keine
erneuten Schreibzugriffe auf Sichtbarkeit, Größe oder Position der Balken aus.
Bewegungsinterpolation, Laufrichtung, Animation, Eiseffekte und Entfernung
gestorbener Gegner werden weiterhin ausgeführt. Neue Gegner erhalten neue Caches.

Messung: `node scripts/duo-presentation-performance.cjs`, beide schweren Boards
aus dem bestehenden Benchmark, eine Karte sichtbar, Wechsel alle zehn Pakete,
50 gemessene Updates nach Aufwärmen und wechselnder Messreihenfolge:

| Aufbereitung pro Update | Vorher | Verzögert |
| --- | ---: | ---: |
| Median, ohne JSON-Parsing und Rendering | 0,253 ms | 0,141 ms |

Das sind rund 44 % weniger für diesen kleinen Teil der Verarbeitung, keine
44 % höhere Bildrate. Jeder sichtbare Zustand und beide abschließenden Karten
werden mit der bisherigen sofortigen Aufbereitung verglichen. Tests prüfen
zusätzlich, dass unsichtbare Karten nicht aufgebaut werden, Käufe/Entfernungen,
neue Geometrie und Belohnungen beim Wechsel aktuell sind und Tower-Identitäten
erhalten bleiben. Für Lebensbalken werden identische Geometrie und null zusätzliche
Schreibzugriffe bei 60 reinen Positionsänderungen geprüft.

Abschluss: 161 Tests bestanden mit `node --test --test-concurrency=2
--test-timeout=30000 tests/duo*.test.cjs server/tests/duo*.test.cjs
tests/renderer.test.cjs tests/road-rendering.test.cjs tests/startup-version.test.cjs`.
Keine Browserprüfung, kein Push und kein Release.

## Zweite Optimierungsrunde: Speicherung, Darstellung und Transport

Die Änderungen sind lokal; es wurde kein Release ausgelöst. Echte Spielstände
und Profile wurden nicht zum Testen verändert.

### Umsetzung nach Priorität

- P0: Direkte Erzeugung des bisherigen getaggten Checkpoint-JSON. Identische
  einfache Gegnerrouten werden innerhalb eines Serialisierungslaufs wiederverwendet.
  Das vermeidet große temporäre Objektbäume, ohne ein neues Speicherformat einzuführen.
  Die resultierende Datei ist bytegleich zur bisherigen Serialisierung.
- P0: Jeder Raum hält seine serialisierten Kampfdaten bis zur nächsten Änderung.
  Aktionen eines Raumes lösen dadurch keine erneute Aufbereitung unveränderter
  Nachbarräume aus. Sitzungsdaten, Rate-Limits und Befehlsbelege werden weiterhin
  frisch geschrieben. Identische Gesamtdateien lösen keinen weiteren Schreibzugriff aus.
  Atomarer Dateitausch, fsync und Speichern vor der Befehlsbestätigung bleiben erhalten.
- P1: Unveränderte Textwerte im Duo-HUD werden nicht erneut ins DOM geschrieben.
  Dabei wird der tatsächliche DOM-Wert geprüft, damit andere UI-Renderer keine
  veralteten Anzeigen verursachen. Transferanimationen behalten ihre ursprüngliche
  Erneuerung einschließlich Icon.
- P1: Die optische Zielsuche nutzt pro Frame einen räumlichen Index. Die genaue
  Distanzprüfung, Filter, Kandidatenreihenfolge und Gleichstandsentscheidung bleiben
  gleich. Bei großen Suchbereichen wird weiterhin direkt gesucht. Keine Änderung
  an Schüssen, Animationen, Details, Qualitätsstufen oder Bildratenlimits.
- P2: Turmplatz-Geometrie wird wiederverwendet; Position, Typ, Rotation, Slotanzahl
  und Austausch eines Kartenfelds invalidieren den Cache. Käufe, Verkäufe,
  Verstärkungen, Buffs und Turmdefinitionen werden weiterhin aktuell gelesen.
- P2: Socket-Befehle können ihren autoritativen Folgezustand direkt in der Antwort
  erhalten. Der zusätzliche `/state`-Roundtrip entfällt. HTTP und ältere Server
  verwenden weiter die bisherige Abfrage; Wiederholung verlorener Antworten bleibt
  idempotent. Der Zustand wird erst nach erfolgreichem Speichern mitgeliefert.
- P2: Ausgehandelte Gegner-Felddeltas übertragen nur geänderte Attribute relativ
  zur bestätigten Vollreferenz. Neue, entfernte und umsortierte Gegner sowie
  entfernte Statusattribute bleiben exakt rekonstruierbar, auch nach Paketverlust.
  Alte Clients erhalten weiterhin ihr bisheriges Datenformat. Keine Änderung an
  10-Hz-Updates, Vollreferenzintervall oder Bewegungsglättung.

### Bewusst nicht als Verbesserung übernommen

Ein gemeinsamer Board-Snapshot mit Kopien pro Spieler wurde implementiert und
vermessen, aber wieder entfernt: Im schweren Test stiegen die Kosten für zwei
Ansichten von rund 7 auf 11–13 ms. Ein geteilter veränderbarer Snapshot wäre billiger,
würde aber die bisherige Trennung von Ausgaben und privaten Spielerdaten aufweichen.

Die verzögerte Aufbereitung der unsichtbaren Partnerkarte und gezielte
Lebensbalken-Updates wurden anschließend in Runde drei umgesetzt (siehe oben).
Weiter offen bleiben weitere Renderer-Synchronisierungen, getrennte Dateien
pro Raum und Worker für Speicherung/Simulation. Diese Architekturänderungen sind
in diesem Stand nicht umgesetzt. Sie benötigen eigene Messungen und Absicherung
für Kartenwechsel, Ereignisreihenfolge, Abstürze und Wiederherstellung. Die vorhandene
Datei wird weiterhin vollständig atomar ersetzt, wenn sich ihr Inhalt ändert;
die Dateigröße wurde nicht reduziert.

### Reproduzierbare Messungen

`node scripts/duo-persistence-performance.cjs` vergleicht die vorhandene
Referenz-Serialisierung mit der neuen Ausgabe und prüft Bytegleichheit.
Checkpoint: zwei Boards mit je 81 Feldern, 160 Türmen, 300 Gegnern mit langen
Routen und 3000 Minen; Median aus sieben Änderungen. Kein Dateisystem-I/O.
Die Zielsuche wird mit 600 Gegnern und 160 Abfragen einschließlich Indexaufbau
gemessen; beide Algorithmen laufen im selben Node-Kontext, ohne VM-Verzerrung.

| CPU-Arbeit | Referenz | Optimiert |
| --- | ---: | ---: |
| Geänderten Checkpoint erzeugen | 260,94 ms | 165,14 ms |
| Unveränderte Kampfdaten erneut serialisieren | 260,94 ms als Referenz | 0,031 ms |
| Optische Reichweitenabfragen | 1,61 ms | 0,81 ms |

Die Datei blieb in diesem Test 8.660.896 Bytes groß. Der Cachewert enthält weder
Dateivergleich noch fsync und ist kein Maß für die komplette Speicherlatenz.
Raum-Caches und zuletzt gespeicherter Dateitext benötigen zusätzlichen RAM,
ungefähr proportional zum Umfang der gespeicherten Zustände.

Gegnerdelta-Vergleich über `bandwidth(undefined, {enemyFields:true})` aus
`scripts/duo-performance.cjs`, 20 Pakete einschließlich Vollreferenz:
7.622.703 auf 3.012.391 unkomprimierte Bytes; separat komprimiert 558.502 auf
453.983 Bytes, etwa 19 % weniger. Trade-off in diesem Lauf: Encoding 4,90 auf
5,36 ms, Decoding 5,17 auf 6,25 ms pro Paket. Das spart Bandbreite, ist jedoch
keine zusätzliche Codec-CPU-Optimierung. Die reale Socket-Kompression und
wechselnde Routen können andere Ergebnisse liefern.

Diese synthetischen CPU-Messungen belegen keine Browser-FPS oder reale Latenz.
Browserprüfung erfolgt gemäß AGENTS.md durch den Nutzer.

### Regressionstests

Die erweiterten Tests vergleichen vollständige Zustände nach jedem Simulationsschritt,
alte/neue Speicherbytes, RNG-Streams, Routen, Cooldowns, Metadaten, Verkäufe/Käufe,
Abbrüche, Wiederbeitritt, Befehlswiederholungen, alte Clients und Paketverlust.
210 gezielte Tests bestanden im abschließenden Lauf einschließlich der
Gegnerdelta-Erweiterung und ihrer Client-Kompatibilitätsprüfung.
Die Gesamtsuite ergab 1031 bestandene Tests, einen veralteten lokalen Asset-Index
und einen 30-Sekunden-Timeout im Fairness-Test. Nach Erzeugen des ignorierten
Asset-Index (`node serve.cjs --write-index`) bestanden alle acht Menütests;
der separate Fairness-Lauf mit 180 Sekunden Limit bestand alle vier Tests in
47 Sekunden. Keine Änderung an Grafikassets oder Spielregeln war dafür nötig.

## Erste Optimierungsrunde: Netzwerk-Codec

Vergleich auf Basis von `355d6f3` (v1.3.0), Node 22.23.3 unter Windows.
Synthetischer Benchmark aus `scripts/duo-performance.cjs`; keine Browser-FPS-Messung.

## Befund und Änderung

Der Delta-Encoder baute für jede Nachricht die Indizes der unveränderten
Referenzlisten neu auf und serialisierte dieselben Listen mehrfach.
Der Decoder baute ebenfalls die Referenzindizes neu auf und kopierte jedes
einzelne Kartenfeld und jede Mine mit einem eigenen JSON-Roundtrip.

Die Indizes werden nun zusammen mit dem bestätigten Referenzzustand gespeichert.
Der Encoder ermittelt Listenlängen aus den ohnehin serialisierten Einzelwerten
und vergleicht die Reihenfolge direkt. Der Decoder rekonstruiert die Liste und
kopiert sie mit einem gemeinsamen JSON-Roundtrip. Ausgabedaten bleiben vollständig
von Referenzzuständen und eingehenden Änderungsdatensätzen getrennt.

## Messung

Zwei Boards mit jeweils 81 Feldern, 160 Türmen, 300 Gegnern und 3000 Minen.
20 aufeinanderfolgende Updates: bewegte Gegner, alle Türme zielen, entfernte und
neue Minen sowie ein vollständiger Referenzwechsel. Beide Implementierungen
wurden aufgewärmt und fünfmal in wechselnder Reihenfolge gemessen; Tabelle zeigt
den Median der Durchläufe. Jeder rekonstruierte Zustand wurde vollständig mit
dem ursprünglichen Snapshot verglichen.

| Verarbeitung pro Paket | Vorher | Nachher | Verringerung |
| --- | ---: | ---: | ---: |
| Delta erzeugen einschließlich JSON-Encoding | 5,06 ms | 3,82 ms | 24,7 % |
| JSON parsen und Delta rekonstruieren | 7,57 ms | 5,34 ms | 29,5 % |

Unkomprimierter Gesamtumfang in beiden Varianten: 7.622.703 Bytes für die
Delta-Pakete, gegenüber 13.612.728 Bytes bei vollständigen Snapshots.
Die Optimierung spart Verarbeitung, keine zusätzlichen Netzwerkbytes.

## Verhalten und Grenzen

Simulationsschritte, Netzwerkfrequenz, Bewegungsglättung, Geometrie, Effekte,
Modelle und Spielregeln bleiben unverändert. Paketverlust, Listenreihenfolge,
Hinzufügen/Entfernen, Epoch-Wechsel und Mutationstrennung sind automatisiert
abgedeckt. Pro Referenzzustand werden zusätzliche Lookup-Indizes gehalten;
der Decoder behält weiterhin höchstens vier Referenzzustände.

Die Zahlen gelten für diesen Lastfall auf diesem Rechner. Browserdarstellung,
echte Netzwerklatenz und mehrere gleichzeitig laufende Partien sind damit nicht
vermessen. Die visuelle Abnahme übernimmt gemäß AGENTS.md der Nutzer.

Benchmark: `node scripts/duo-performance.cjs`.
Für direkte Vergleiche exportiert das Skript `bandwidth(codec)`; damit können
alter und neuer Codec im selben Prozess mit identischem Lastprofil laufen.

## Testabschluss

127 Tests bestanden, keine Fehler: `node --test --test-concurrency=2
--test-timeout=30000 tests/duo*.test.cjs server/tests/duo*.test.cjs
tests/startup-version.test.cjs` (als ein Befehl ausführen).
HTTP-/Socket- und Dateispeichertests benötigen Ausführung außerhalb der
Windows-Sandbox; dort waren Verbindungen bzw. Umbenennungen blockiert.

Ein zusätzlicher vorhandener Fehler wurde behoben: Der Release-Stempel hatte
Browser-Cacheparameter an CommonJS-Dateipfade angehängt. `require` und
`require.resolve` behalten nun Dateipfade ohne URL-Query, während Browserimports
weiterhin versioniert werden. Ein Regressionstest prüft auch wiederholtes Stempeln.

Die zuerst versuchte Gesamtsuite mit deaktivierter Testisolation wurde nach
ausbleibendem Fortschritt im Augment-UI-Bereich abgebrochen. Ein vollständiger
Gesamtsuiten-Pass oder eine Browserabnahme wird deshalb nicht behauptet.
