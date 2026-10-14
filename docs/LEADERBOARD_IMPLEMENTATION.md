# Accountgebundene Bestenliste – Umsetzung und offene Integration

Stand: 14.10.2026. **Oberflächen vorbereitet, automatische Wertung noch nicht aktiviert oder veröffentlicht.**

## Festgelegtes Verhalten

- Normale Standardläufe zählen automatisch; keine zusätzliche Queue oder Moduswahl.
- Auch Gäste erhalten von Beginn an eine servergeführte Sitzung. Nach Niederlage können sie den Lauf durch Registrierung oder Anmeldung übernehmen.
- Startvariante bestimmt die Kategorie: eine Front / zwei Fronten, später erweiterbar. Offene Straßenenden ändern die Kategorie nicht.
- Höchste vollständig abgeschlossene Welle zuerst, danach sämtliche Kills des Laufs einschließlich der verlorenen Welle und Bosse. Identische Werte teilen einen Rang.
- Ein öffentlicher Bestwert je Account, Startvariante und Season. Jeder Versuch wird separat gespeichert.
- Updates ändern nicht automatisch die Season. Regelversion und Season werden beim Start gebunden.
- Persönliche Freischaltungen bleiben relevant. Bestehende Accounts sollen ihre Freischaltungen behalten; ihre Herkunft ist dadurch nicht automatisch technisch verifiziert.
- Ergebnisse werden zunächst manuell geprüft. Nur angenommene Ergebnisse erscheinen öffentlich. Ablehnungen und spätere Korrekturen werden mit Grund protokolliert.
- Niederlagenübersicht zeigt die aktuelle Einordnung des Versuchs. Gäste sehen: „Damit wärst du aktuell Platz …“ und Registrierung/Anmeldung zur Ergebnisübernahme. Ausstehende Einträge zeigen: „Dein Run wird überprüft. Nach der Prüfung wird er angenommen oder abgelehnt.“

## Implementierte, noch nicht angeschlossene Bausteine

`server/solo-run.cjs` verwendet die vorhandene Headless-Solo-Simulation:

- Server erzeugt Zufallsstartwert, Lauf-ID und Sitzungsnachweis.
- Laufende Simulation nutzt ausschließlich die Serveruhr und erlaubte Tempostufen.
- Spielaktionen werden über gemeinsame Regelmodule geprüft; kein Score-Upload.
- Sequenznummern, Wiederholungsschutz, persistierbare Checkpoints und Sperre bei Speicherfehlern.
- Niederlagenabschluss berechnet Wellen und Kills aus dem Serverzustand.
- Regelversionsfremde Checkpoints werden abgelehnt und müssen beim ursprünglichen Worker bleiben; ein Worker-Routing ist noch nicht implementiert.

`server/leaderboard.cjs` verwaltet:

- Account-Bestwerte, Fronten-Kategorien, Kill-Tiebreak und gemeinsame Ränge.
- Gast-Ergebnisübernahme mit gehashtem Besitznachweis, Wiederholungsschutz und Bindung an genau einen Account.
- Moderationszustände pending/accepted/rejected und Entscheidungsverlauf.
- Öffentliche Liste ohne Account-IDs, Besitznachweise oder interne Prüfvermerke.
- Explizite Seasonwechsel und Archivabfrage, unabhängig von der Spielversion.
- Persist-before-publish über einen injizierten Speicheradapter. Eine produktive Datenbank/Dateianbindung fehlt noch.

Diese Module sind interne Schnittstellen. `options`, `account` und `verifiedAdmin` dürfen **niemals direkt aus Browser-JSON** kommen. Der HTTP-Adapter ist optional im Server eingehängt, antwortet ohne explizite Konfiguration jedoch mit 503. Seine Existenz macht aktuelle lokale Läufe nicht ranglistenfähig.

## Zusätzlich vorbereitete Oberfläche und HTTP-Schnittstelle

- `leaderboard.html`: öffentliche Liste mit Frontenauswahl, Seitenwechsel, Versionsangaben und verständlichen Lade-/Fehlerzuständen. Aus dem Hauptmenü in einem neuen Tab erreichbar, ohne einen laufenden Run zu verlassen.
- Prüfoberfläche auf derselben Seite für angemeldete Administratoren: offene Einträge, verpflichtende Begründung, Annahme/Ablehnung. Serverseitige Rechteprüfung ist unabhängig von der Sichtbarkeit im Browser.
- `classes/leaderboard-ui.js`: Niederlagenanzeige für Gast, ausstehende Prüfung, Annahme, Ablehnung und fehlende Serverwertung. Alte asynchrone Antworten überschreiben keinen neueren Lauf. Namen werden als Text ausgegeben.
- Der Spielcontroller fragt ausschließlich einen künftigen `HexRankedSession.credentialsForRun(runId)`-Adapter nach einer gewerteten Sitzung. Solange dieser fehlt, werden weder Platzierungen aus lokalen Scores errechnet noch Ergebnisse hochgeladen.
- Nach Anmeldung/Registrierung wird ein zuvor bestätigter Gast-Lauf zur Prüfung übernommen. Ein HTTP-Fehler bleibt sichtbar und ist wiederholbar.
- `server/leaderboard-http.cjs`: öffentliche GET-Liste, private Ergebnisabfrage, Gast-Claim, Admin-Prüfliste und Entscheidungen. Kein Endpunkt für Score-Uploads. Account-Verifikation muss als vertrauenswürdiger Adapter injiziert werden.
- Der Entwicklungsserver leitet `/rankings` zum bestehenden Duo-Server weiter. Der produktive Reverse-Proxy muss diese Route später ebenfalls weiterleiten.

Vertrag: `GET /rankings?fronts=1&offset=0`, `GET /rankings/results/:runId`, `POST /rankings/results/:runId/claim` mit leerem JSON-Objekt, `GET /rankings/pending?offset=0`, `POST /rankings/results/:runId/review` mit `{decision,reason}`. Account-Token ausschließlich im Authorization-Header, Gastnachweis ausschließlich in X-Run-Token; niemals in URLs. `verifyAccount(token)` muss `{id: String, name: String, isAdmin: Boolean}` oder null liefern. Ergebnisse niemals cachen.

## Noch erforderliche Arbeit

1. Account-Backend bereitstellen/prüfen. Lokal fehlt `D:\Codex\api.autohextd`; die bekannte Produktionsadresse lautet `https://api.autohextd.zlyfer.net`. Die vorhandene Schnittstellendokumentation beschreibt `/me` und unveränderte Spielstand-Uploads, ist aber älter als der aktuelle Live-Betrieb.
2. Serverseitige Account-Verifikation, einmalige Übernahme vorhandener Freischaltungen und dauerhaften Gast-/Account-Fortschritt implementieren. Weitere Spielstand-Uploads dürfen den verifizierten Stand nicht stillschweigend überschreiben. Moderation ersetzt diese Grenze nicht.
3. Dauerhaften Speicher, Laufverwaltung, Kapazitätsgrenzen, Authentisierung, Rate Limits, Verbindungsabbruch/Wiederverbindung, begrenzte Gast-Aufbewahrung und Shutdown-/Update-Verhalten integrieren.
4. Den Solo-Client vollständig an die Serverbefehle und Darstellungssnapshots anschließen, einschließlich Tutorial, Belohnungen, Bauaktionen, Forschung/Freischaltungen und Endless. Aktuell liefert der neue Adapter nur eine minimale Statusansicht, noch keine vollständigen Renderdaten.
5. Vorbereitete Rangliste, Niederlagenübersicht, Gast-Übernahme und Admin-Prüfansicht mit produktiver Sitzung und Datenhaltung verbinden. Für die Moderation zusätzlich die serverseitige Aktionshistorie bereitstellen; die Ergebniszahlen allein sind kein ausreichender Prüfnachweis.
6. Servergeführte Ergebnisse und persönlichen Fortschritt atomar abrechnen; Registrierung/Claim und Belohnungen dürfen bei Wiederholungen nicht doppelt wirken.
7. HTTP-Integrations-, Berechtigungs-, Neustart-, Last- und Manipulationstests ergänzen. Die Browserprüfung übernimmt gemäß AGENTS.md der Nutzer.

## Gezielte Prüfung

```powershell
node --test server/tests/leaderboard.test.cjs server/tests/solo-run.test.cjs
```

Abgedeckt: echte simulierte Niederlage, Serverzeit/Pause, manipulierte Befehle, doppelte Käufe, falsche Sitzungsnachweise, Sequenzfehler, fremde Regelversion, Speicherfehler, Rangfolge, Gast-Übernahme, Freigabe/Ablehnung, getrennte Fronten und manuelle Seasons.
