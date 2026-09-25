# Übergabe für die Weiterarbeit auf dem Laptop

Stand: 25.09.2026. Grundlage: lokaler Code, Git-Metadaten, vorhandene Dokumentation und der unten protokollierte Testlauf. Vor dem Übergabe-Commit wurde GitHub-`main` per `git ls-remote` geprüft: identisch mit dem unten genannten Basis-Commit. Der Live-Server wurde nicht geprüft.

## Ziel und Ausgangspunkt

AutoHex TD / Hex Bastion ist ein Hex-Tower-Defense-Roguelite: Straßen aus einem Deck legen, die Karte erweitern, Verteidigung aufbauen und Wellen überleben. Solo und privates kooperatives Duo sind implementiert. Die Weiterarbeit soll diesen Stand auf dem Laptop reproduzierbar fortsetzen. Spielregeln und Detailwerte stehen in [GAME_REFERENCE](docs/GAME_REFERENCE.md), Modulzuständigkeiten in [ARCHITECTURE](docs/ARCHITECTURE.md).

- Aktueller Branch: `main`.
- Basis-Commit dieser Übergabe (lokales HEAD): `5fd155a68c73c12ff43e014f42cf607498cf71db`.
- Commit-Zeit: 25.09.2026, 15:27:58 +02:00.
- Commit-Betreff: „Minenstraße mit eigenem Zickzack, Asset-Spec zusammengeführt, alte Basen entfernt“.
- Paketversion: `0.9.1` in `package.json` und Lockfile. Das ist keine Aussage über den aktuell veröffentlichten Stand.
- Arbeitsverzeichnis vor der Erstellung dieser Datei: sauber. Vor dem Übergabe-Commit war ausschließlich `HANDOFF.md` ungetrackt; keine weiteren ausstehenden Änderungen. Der Folgeauftrag autorisiert Commit und Branch-Push einschließlich dieser Datei, aber keine Tags, keinen Merge, Force-Push oder Deployment.

Auf dem Laptop den vollständigen aktuellen Branch `main` einschließlich `assets/` und dieser Datei aus GitHub beziehen. Der obige Basis-Commit beschreibt den getesteten Code vor dem reinen Dokumentationscommit; die genaue Übergabe-Commit-ID wird nach dem Push im Chat mitgeteilt und ist mit `git rev-parse HEAD` prüfbar. `node_modules/` auf dem Laptop neu installieren.

## Aktueller Implementierungsstand, am Code geprüft

- Vanilla JavaScript, HTML und CSS ohne Build-Schritt. `index.html` lädt die Spielmodule; `classes/three-renderer.js` stellt 3D dar, `classes/svg-renderer.js` die Alternative. `serve.cjs` liefert Dateien und den Modellindex.
- Die gemeinsame DOM-freie Spiellogik liegt unter anderem in `run-runtime.js`, `run-session.js`, `run-flow.js`, `combat.js`, `map.js` und den Command-Modulen unter `classes/`. `classes/game.js` verbindet weiterhin Steuerung, Eingaben und HUD; die Trennung ist noch nicht vollständig.
- Solo: Kartenbau, Kampf, neun Turmtypen mit Fünfer-Loadout, Gebäude, Festungswahl/Base-Ausbau, Profil/Arsenal, Exploration/Biome, Belohnungen, tägliche Herausforderungen, Kampagnensieg bei Welle 35 und Endless-Fortsetzung. Einzelheiten nicht hier duplizieren, sondern in der Spielreferenz nachschlagen und bei Änderungen mit dem Code vergleichen.
- Jüngste Modelländerungen: Festungsmodelle mit Ausbauaufsätzen in `classes/model-map.js`, neue Gegner-/Bossmodelle und umschaltbare Normal-/Sakura-Edition (`classes/asset-edition.js`). Die Edition betrifft Darstellung, nicht Spielregeln; fehlende Sakura-Modelle fallen auf normale Modelle zurück.
- Der Basis-Commit ergänzt die eigene Zickzack-Mittellinie der Minenstraße in `classes/map.js` samt Modell-/Regelanpassungen und entfernt alte Basismodelle. Die Asset-Vorgaben sind jetzt in [ASSET_SPEC](docs/ASSET_SPEC.md) zusammengeführt; die früheren Dateien `_v2`, `_v3`, `_v4` wurden gelöscht.
- Duo: serverseitige Simulation, Lobby mit beidseitiger Startbereitschaft, gemeinsame Spieloberfläche, Partneransicht, Portalhilfe/Geschenke, gemeinsame Steuerung, Ergebnisbelege und lokale Profilabrechnung. Socket.IO ist in `server/duo-transport.cjs`, `server/duo-sockets.cjs` und `duo-client.js` angebunden; HTTP bleibt Kompatibilitätsweg.
- Duo verfügt über private Datei-Checkpoints, Wiederbeitritt, Tab-Übernahme, Verlassen und Wartung. Siehe [Serverdokumentation](server/README.md) und besonders die neueren Abschnitte der [Online-MVP-Übergabe](docs/ONLINE_MVP_HANDOFF.md).
- Solo-Snapshots sind als interne Grundlage vorhanden (`classes/run-snapshot.js`, Capture/Restore in `classes/game.js`, Tests). Daraus folgt **keine fertige dauerhafte Solo-Speichern/Laden-Oberfläche**. Profil-Export/-Import ist davon getrennt und enthält keinen laufenden Solo-Run.

## Entscheidungen und Arbeitsregeln

Aus dem verfügbaren Verlauf dieses Chats sind die Vorgaben des ursprünglichen Dokumentationsauftrags und des anschließenden Git-Übergabeauftrags sicher belegt: Angaben am Code prüfen, Unsicherheiten markieren, keine Geheimnisse/personenbezogenen Daten aufnehmen. Nach Erstellung der Dokumentation wurden Commit und Push ausdrücklich autorisiert; Merge, Force-Push und Deployment bleiben ausgeschlossen. Frühere Produktentscheidungen sind hier nicht als neue Chatbeschlüsse zu behandeln.

Deployment-Prüfung vor dem Commit: `webhook.php::extractTagName` akzeptiert ausschließlich nicht gelöschte `push`-Ereignisse auf `refs/tags/*`; Branch-Pushes werden ignoriert. Im geprüften Checkout existieren keine GitHub-Workflows und keine aktiven lokalen Git-Hooks. Daher ist kein separater Übergabebranch für diesen bekannten Deployment-Weg nötig. Push nur des Branches mit `--no-follow-tags`; `npm run tag` nicht verwenden. Zusätzliche, ausschließlich auf GitHub oder bei externen Diensten konfigurierte Integrationen wurden nicht eingesehen.

Vorhandene Projektentscheidungen und Ideen stehen in [ai/BRAIN.md](ai/BRAIN.md), [CHANGELOG](docs/CHANGELOG.md) und dem [Projektprotokoll](docs/README_TowerDefense_Projekt.md). Dort ist unter anderem festgehalten: keine eigenständigen Browsertests ohne ausdrücklichen Auftrag; die Browserprüfung übernimmt der Nutzer. In dieser Übergabe wurden nur automatisierte Tests ausgeführt. Historische Einträge können vom heutigen Code überholt sein.

## Laptop: Software, Installation und Start

Reproduktionsbasis dieses Testlaufs: **Node.js 24.21.0**, **npm 11.19.0**, Git **2.55.0.windows.5**, Windows/PowerShell. Für den Laptop Node 24 verwenden; auch `deploy/Dockerfile` nutzt Node 24. `package.json` legt keine Mindestversion über `engines` fest, es gibt keine eingecheckte `.nvmrc`/`.node-version`. Eine exakte Mindestversion wurde nicht ermittelt. Die ältere README-Angabe „Node v22 getestet“ ist kein aktueller Kompatibilitätstest.

Lockfile v3: Three.js **0.186.0**, Socket.IO und Socket.IO Client jeweils **4.8.3**; diese Versionen sind auch lokal installiert (`npm ls --depth=0` erfolgreich). Ein Browser mit WebGL für 3D wird benötigt; keine konkrete Browserversion wurde in diesem Auftrag geprüft. Für lokale Entwicklung sind Docker, PHP, Caddy und Nginx nicht nötig.

Im Projektordner:

```powershell
node --version
npm --version
npm ci
npm start
```

Solo: `http://localhost:8080/`; SVG: `http://localhost:8080/?svg`; Modellgalerie: `http://localhost:8080/viewer.html`. `npm ci` verwendet das Lockfile; es wurde für diese Dokumentationsarbeit nicht erneut ausgeführt. `npm start` führt `node serve.cjs` aus. Stoppen mit Strg+C.

Für Duo stattdessen oder in einem zweiten Terminal:

```powershell
npm run start:duo
```

Lobby: `http://127.0.0.1:8090/duo-lobby.html`. Der Duo-Prozess liefert auch die Spieloberfläche. Zwei Browser/Browserprofile nutzen, Lobby erstellen und beitreten, dann beide bereit melden. Nicht versehentlich nur den statischen Server auf Port 8080 für Netzwerk-Duo verwenden. Strg+C sichert den Duo-Stand und beendet den Prozess.

### Lokale Dateien und Konfiguration

- Für den Standardstart keine manuell anzulegende Konfigurationsdatei und keine Zugangsdaten nötig. Die Launcher lesen Umgebungsvariablen direkt; eine `.env` wird nicht automatisch geladen.
- `node_modules/`: durch `npm ci` erzeugt, nicht übertragen oder einchecken.
- `assets/index.json`: vom Solo-Server beim Start automatisch erzeugt, in Git ignoriert. Bei Bedarf lokal mit `npm run generate-assets-index` erstellen.
- Duo-Speicher standardmäßig `~/.autohex-duo/checkpoint.json` im Benutzerverzeichnis, außerhalb des Repositories. Wird vom Dateispeicher verwaltet; nicht manuell mit Beispieldaten vorbelegen. Enthält private Sitzungstokens und gehört weder in Git noch in diese Übergabe. Für einen frischen Laptopstart ist keine vorhandene Datei nötig. Fortsetzen alter Duo-Partien erfordert deren private Sicherung separat.
- Browserprofil, Einstellungen und Fortschritt sind lokal im Browser gespeichert; sie kommen nicht mit dem Repository mit. Bei Bedarf den vorhandenen Profil-Export/-Import verwenden. Hostname und Port beibehalten, wenn derselbe lokale Browserspeicher genutzt werden soll.

Optionale Variablen laut `serve.cjs` / `server/start-duo.cjs`:

| Variable | Standard / Zweck |
| --- | --- |
| `PORT` | `8080`, statischer Solo-Server |
| `DUO_PORT` | `8090` |
| `DUO_HOST` | `127.0.0.1`, nur lokal erreichbar |
| `DUO_SAVE_FILE` | privater Checkpoint-Pfad; bei Änderung absoluten Pfad außerhalb des Web-/Repo-Verzeichnisses wählen |
| `DUO_PUBLIC_ORIGIN` | lokal nicht gesetzt; für Betrieb hinter einem Proxy siehe Betriebsdokumentation |
| `DUO_MAINTENANCE` | nur Wert `1` aktiviert Wartung beim Start |

PowerShell-Beispiel für einen belegten Solo-Port: `$env:PORT='8081'`, danach `npm start`. Deployment-Secrets oder `.deploy-webhook-secret` sind für lokale Entwicklung nicht erforderlich. `npm run tag` ist kein Start-/Testbefehl; es verweist auf `tag-and-push.cjs` und gehört nicht in diesen Übergabeablauf.

## Offene Aufgaben nach Priorität

Diese Reihenfolge ist ein Vorschlag für die Weiterarbeit, keine zusätzlich beschlossene Roadmap.

1. **P1 – Laptop und Darstellung abnehmen:** Installation/Start reproduzieren; Normal/Sakura, neue Festungen samt Ausbau, Gegner/Bosse und Minenstraße in allen Rotationen prüfen. Laufweg, Modellstraße und Turmplätze vergleichen. Kleine Fenster, Bedienung und Audio prüfen. Automatisierte Tests ersetzen diese Sichtprüfung nicht.
2. **P1 – Duo mit zwei echten Browsern/Geräten abnehmen:** Lobbybereitschaft, Bauen, Portalhilfe, Geschenke, Abschluss/Neustart, Reconnect/Tab-Übernahme und genau einmalige Profilgutschrift. Konkreter Ablauf in [ONLINE_MVP_HANDOFF](docs/ONLINE_MVP_HANDOFF.md). Der lokale Standard bindet nur Loopback; echte Geräte benötigen einen bewusst konfigurierten erreichbaren Server.
3. **P2 – Dokumentationsrückstände bereinigen:** README-Versions-/Testzahlen, alte Duo-Offenlisten und Verweise auf gelöschte Asset-Specs abgleichen. Diese Übergabe korrigiert die Einordnung, verändert aber keine anderen Dokumente.
4. **P2 – Gameplay und Performance:** Hero-/Base-/Turmbalance, späte Wellen, große Karten und längere Duo-Partien messen. Vorhandene [Performance-Analyse](docs/PERFORMANCE_TROUBLESHOOTING.md), [Performance-Plan](docs/PERFORMANCE_PLAN.md), [Late-Game-Plan](docs/LATE_GAME_PLAN.md) und `scripts/` nutzen; alte Messwerte nicht als Laptop-Benchmark behandeln.
5. **P2 – Solo-Run-Persistenz:** Auf den vorhandenen Snapshots aufbauen; Speicherformat-/Versionsverträglichkeit und Nutzeroberfläche für Speichern/Fortsetzen klären. Profiltransfer nicht mit Runtransfer verwechseln.
6. **P3 – Weitere Inhalte/Betrieb:** Geplante Inhalte aus den verlinkten Konzepten priorisieren. Falls später Online-Betrieb beauftragt wird, [systemd-Anleitung](deploy/systemd/README.md) und Online-MVP-Übergabe verwenden; realen Host-/TLS-/Restore-Stand zuerst feststellen. Hier keine Veröffentlichung veranlassen.

## Bekannte Fehler, Grenzen und Unsicherheiten

- In der aktuellen automatisierten Suite wurde kein fehlschlagender Test festgestellt. Das ist keine Aussage, dass das Spiel fehlerfrei ist; Browser-, Grafik-, Audio- und Gerätefehler wurden nicht untersucht.
- Bestätigter Dokumentationsrückstand: README nennt noch V0.7-dev und 293 Tests; `package.json` steht auf 0.9.1 und die aktuelle Suite umfasst 458 Tests. Ältere Texte nennen HTTP-Polling sowie fehlende Persistenz/Profilabrechnung, obwohl neuere Implementierungen und Nachträge vorhanden sind. Historische Branch-Namen in Dokumenten sind nicht der aktuelle Branch.
- Dauerhafte Solo-Run-Speicherung ist noch keine fertige Nutzerfunktion. Interne Snapshots sind laut Quellkommentar nicht als unvalidierte Spieleruploads gedacht.
- Duo-Dateispeicher ist für einen Serverprozess ausgelegt. Browserprofile sind lokal, kein kontobasiertes geräteübergreifendes Profil-/Anti-Cheat-System. Betriebsgrenzen und Wiederherstellungsregeln siehe Serverdokumentation.
- Sichtbare Qualität und Vollständigkeit aller Modelle/Upgradevarianten sind nicht neu geprüft. Fehlende optionale Modelle können durch Fallbacks verborgen werden.
- Live-Deployment, Laptop-Performance und npm-Neuinstallation sind in diesem Auftrag nicht verifiziert. Remote-`main` wurde vor dem Übergabe-Commit mit dem lokalen Basis-Commit abgeglichen. Vorhandene Betriebsanleitungen beweisen keine tatsächlich erfolgte Installation.

## Zuletzt tatsächlich ausgeführte Prüfungen

Am **25.09.2026**, auf obigem Basis-Commit mit bereits vorhandenen Abhängigkeiten:

```powershell
node --test --test-isolation=none tests/*.test.cjs server/tests/*.test.cjs
```

Ergebnis: **458 Tests bestanden, 0 fehlgeschlagen, 0 übersprungen, 0 abgebrochen, 0 TODO**, Exitcode **0**, Laufzeit **13,861 Sekunden**. Die Suite umfasst Spielregeln, Snapshot-/Profilabläufe, DOM-Testadapter, Modellzuordnung/Geometrie, Performance-Regressionen und lokale Duo-HTTP-/Socket-/Persistenztests. Keine echte WebGL-/Browserabnahme und kein Online-Test.

Zusätzlich tatsächlich geprüft: `node --version`, `npm --version`, `git --version`, `npm ls --depth=0`, Branch/HEAD/Arbeitsverzeichnis und gezielte Code-/Dokumentationsabgleiche. Alle 14 relativen Markdown-Linkziele sind vorhanden; die abschließende Statusprüfung zeigt ausschließlich die neue `HANDOFF.md`. Die älteren Zahlen in README und [Multiplayer-Testbericht](server/MULTIPLAYER_TEST_REPORT.md) sind historische Läufe und wurden nicht als aktueller Nachweis übernommen.

Im anschließenden Git-Übergabeauftrag wurden die vollständige ausstehende Datei auf Geheimnisse und lokale Daten sowie Git-Status, Remote-Basis und Deployment-Auslöser geprüft. Keine erkennbaren Geheimnisse oder versehentlich enthaltenen lokalen Dateien gefunden. Der Code blieb unverändert; die Tests wurden nicht erneut ausgeführt. Commit und Branch-Push sind für diesen Folgeauftrag autorisiert; ihr Abschluss wird separat im Chat bestätigt.

Nicht ausgeführt: erneute Installation, manuelles Start-/Spieltesten im Browser, neue Balance-/Lastmessungen, Docker-Build, Live-Healthcheck oder Deployment.
