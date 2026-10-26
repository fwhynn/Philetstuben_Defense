# Augment-Karten – lokaler Implementierungsstand

## Spielregeln

- Freigabe: Welle 15 abgeschlossen und mindestens eine Arsenal-Freischaltung gekauft. Der erste Run erhält keine zusätzliche Einführung.
- Ein Booster kostet 50 Diamanten und enthält zwei unterschiedliche Kartenfamilien.
- Seltenheiten: gewöhnlich 60 %, ungewöhnlich 25 %, selten 10 %, episch 4 %, legendär 1 %. Nach neun Paketen ohne seltene Karte enthält das zehnte mindestens eine seltene Karte.
- Drei identische Karten derselben Seltenheit ergeben eine Karte der nächsten Seltenheit. Legendäre Karten können nicht weiter verschmolzen werden.
- Ein bis fünf Ausrüstungsplätze; weitere Plätze nach abgeschlossenen Wellen 20, 25, 35 und 50. Pro Familie wirkt die höchste besessene Seltenheit.
- Neun Turmfamilien sowie Basis, Haus, Markt und Schmiede. Werte und Beschreibungen stehen in `classes/augment-cards.js`.
- Die Auswahl wird beim Run-Start eingefroren. Tägliche Herausforderungen verwenden keine Meta-Augments.

## Accounts und Gäste

Die Sammlung öffnet sich über „Augment-Karten“ im Arsenal. Eine kurze Einführung erscheint bis zur Bestätigung; `introSeen` wird im Profil gespeichert und bei Accounts synchronisiert. Die Run-Vorbereitung zeigt aktive Karten und meldet ausgerüstete Turmkarten ohne passenden Turm. Tägliche Missionen zeigen diese Auswahl nicht. Aktive Effekte werden auch bei Türmen unter „Werte & Einflüsse“ sowie bei Basis und Gebäuden beschrieben.

Nach einem bestätigten Booster-Kauf erscheinen die zwei gespeicherten Ergebnisse mit Seltenheitsfarbe und einer kurzen Animation. Ohne neuen Kauf wird die letzte Ziehung ohne erneute Animation angezeigt. Es werden dabei keine Karten neu gewürfelt. `prefers-reduced-motion` schaltet die Animation ab.

Gäste verwalten Sammlung, Kauf und Ausrüstung im Browser. Accounts führen Kauf, Fusion und Ausrüstung über die API aus. Der Client berechnet dabei keine Ziehung. Nach einem nicht bestätigten Netzwerkvorgang wird weiteres Hochladen angehalten, bis der Account-Spielstand neu geladen wurde.

Die API verwendet die vorhandene Save-Transaktion: Account sperren, Revision prüfen, bisherige Fassung archivieren, Karten und Diamanten gemeinsam ändern, Statistik-Reparatur vormerken, committen. Es gibt keine neue Tabelle und keine Datenbankmigration. `_augmentAction` enthält `kind`, `requestId` und gegebenenfalls `card`/`tier`. Die letzte bestätigte Request-ID verhindert eine doppelte Ausführung nach verloren gegangener Antwort. Eine Wiederholung älterer Requests wird durch die Revision abgelehnt.

Normales Speichern darf eine bereits vorhandene Sammlung nicht ersetzen. Ältere Clients, die das Feld nicht kennen, behalten die serverseitige Sammlung. Beim erstmaligen Import vorhandene Gast-/Prototyp-Sammlungen werden erhalten. **Diese Importkompatibilität sowie die bestehende clientseitige Diamantenwirtschaft sind keine vollständige Cheat-Prüfung.** Für vollständig geprüfte Progression wären serverseitige Run-Abrechnung und ein autoritatives Währungskonto erforderlich.

## Duo

Vor dem Bereitmelden lädt der Duo-Dienst die Auswahl über die fest konfigurierte Account-API. Der Client übermittelt nur seine Authentifizierung, keine Kartenwerte. Account-Tokens werden weder im Raum noch im Checkpoint gespeichert. Die gewählte Ausrüstung ist öffentlich für beide Partner sichtbar und wird im Checkpoint eingefroren. Änderungen betreffen nur die eigene Bereitschaft. Eine Revanche behält die Auswahl. Gäste spielen im Duo ohne Account-Augments.

## Lokale Prüfung und späterer Release

Keine Live-Daten wurden verändert. Keine Browserprüfung durchgeführt.

- Client-/Spieltests: `node --test tests/*.test.cjs server/tests/*.test.cjs`
- API: `php scripts/test-augment-cards.php` (isoliertes transaktionales PDO-Testdouble; kein Datenbankkontakt).
- API vor Client und Duo veröffentlichen. `GET /saves` muss `augmentProtocol: 1` melden. Ein alter API-Stand sperrt Augment-Transaktionen, statt eine lokale Ziehung als Account-Kauf zu akzeptieren.
- `DUO_ACCOUNT_API_URL` bzw. `API_BASE_URL` steuert die serverseitige Account-API wie bisher. Lokal muss dieselbe Test-API wie im Frontend verwendet werden; ohne Override bleibt das Produktionsziel bestehen.
- Bestehende Backups, Saves, Ranglistentabellen und Reparatur-Worker bleiben bestehen. Für einen späteren Push sind die normalen Release-Prüfungen und Patchnotes weiterhin erforderlich.

## Elementare Resonanz

Der Elementturm zählt tatsächlich gelandete Treffer je Turm. Jeder fünfte Treffer erzeugt einen zusätzlichen Treffer auf dasselbe noch lebende Ziel: 20/35/50/75/100 % Schaden je Seltenheit, mit dem gewählten Element und seinen Resistenzmultiplikatoren. Immunität zählt nicht als Treffer. Schildkontakte zählen, ziehen aber weiterhin höchstens einen Schildstapel pro Angriff ab; Resonanz durchbricht keinen Schild. Der Zähler wird mit dem Turm im Run gespeichert.

## Kampfprüfung

Jagdfieber verliert beim Zielwechsel den Tempobonus vor dem ersten Schuss auf das neue Ziel. Die Stapel bleiben auf fünf beziehungsweise acht begrenzt, auch mit Überladung.

Minen-Nachbeben verwenden ab vier gleichzeitig fälligen Explosionen und 32 Gegnern einen räumlichen Index. Die Originalreihenfolge der Gegner bleibt erhalten. Kleine Gefechte und ungewöhnliche Radien verwenden die vollständige Prüfung. Vergleichstests prüfen den gesamten resultierenden Zustand einschließlich Schildstapeln, Belohnungen, Todeseffekten und noch ausstehenden Nachbeben gegen die bisherige Berechnung. Im verstreuten Testfeld werden über 90 % der genauen Distanzprüfungen eingespart; das ist keine Aussage über die gesamte Bildrate.

## Echter Datenbanknachweis – 26.10.2026

112 Prüfungen mit dem erweiterten API-Runner erfolgreich: `php scripts/test-save-database.php --run --tables --reference=PATH_TO_USER_TEST_ENV`. Die Referenz wurde vor der Verbindung mit allen fünf Datenbankfeldern der lokalen API verglichen und als Testdatenbank erkannt. Keine Konfigurationswerte wurden protokolliert.

Neue Augment-Prüfungen verwenden echte MySQL/MariaDB-Transaktionen und zwei Verbindungen: Account-Sperre mit Lock-Timeout, veraltete konkurrierende Käufe, Wiederholung nach bereits erfolgtem Commit (verlorene Antwort), Fusion, Ausrüstung, abgewiesene Inventarmanipulation, Altclient ohne Augment-Feld, fehlende Archivierung mit Rollback und Wiederanlauf sowie Statistik-Ausfall mit anschließender Worker-Reparatur. Der Test simuliert die Wiederholung nach Antwortverlust; er trennt keine echte Netzwerkverbindung während einer Anfrage.

Ein weiterer Rollout erhält Sammlung und Transaktionsbeleg. Synthetische Solo-/Duo- und Gier-Ranglisteneinträge sowie der zweite Testaccount bleiben bytegleich. Nach dem Lauf wurden ausschließlich neu angelegte Fixture-Tabellen entfernt; ursprünglicher Tabellenbestand und vorhandene Spielstand-/Statistik-/Run-Ranglisten-Prüfsummen sind unverändert. Testprotokoll lokal: `.local/augment-real-database.log`.

Noch keine Browser-/Bedienungsprüfung und kein Live-Release.
