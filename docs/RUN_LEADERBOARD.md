# Getrennte Run-Bestenlisten

Client und API sind gemeinsam erforderlich. Nicht nur den Client veröffentlichen.

## Daten und Wertung

- `single`: Solo mit einer Startfront (Standard beim Öffnen).
- `dual`: Solo mit zwei Startfronten.
- `duo`: gemeinsame abgeschlossene Welle und gemeinsame Kills beider Spielfelder; ein Bestwert je teilnehmendem Account.
- Tagesherausforderungen bleiben ohne Daten, bis eine eigene Wertung dafür existiert.
- Welle absteigend, dann Kills absteigend; vollständige Gleichstände teilen einen Rang.
- Die Vorschau zählt alle freigegebenen Bestwerte, nicht nur die ersten 100 sichtbaren Einträge. Der eigene bestehende Bestwert wird beim hypothetischen Vergleich ausgeschlossen.
- Die bisherige öffentliche Accountliste bleibt als „Gesamtwerte“ erhalten. Ihre alten Summen lassen sich nicht zuverlässig nach Startmodus aufteilen.
- Die Season bleibt `initial`; Releases ändern sie nicht. Gespielte Version wird separat gespeichert.

## Prüfung und Vertrauen

Run-Werte werden vom Client gemeldet und sind **nicht manipulationssicher**. Neue Einträge sind immer `pending`. Nur Accounts aus der bestehenden serverseitigen Admin-Allowlist können annehmen oder ablehnen. Nicht freigegebene Runs erscheinen niemals öffentlich. Eine Freigabe bedeutet manuelle Prüfung, keine Simulation auf dem Server.

Der Bereich „Runs prüfen“ in der Bestenliste erscheint für Administratoren. Jede Entscheidung benötigt eine Begründung. Gleichzeitige Änderungen werden über eine Revisionsnummer abgefangen. Fortgesetzte Runs mit höheren Ergebnissen gehen erneut in die Prüfung; identische Wiederholungen ändern weder Wertung noch Prüfstatus. Abgelehnte Run-IDs bleiben abgelehnt.

Gast-Runs werden in diesem Browser separat vorgemerkt (maximal 20). Nach erfolgreicher Anmeldung/Registrierung werden sie zur Prüfung übertragen. Das ist keine Cloud-Sicherung für Gäste. Bei nicht erreichbarer API wird keine Platzierung erfunden.

## API-Projekt und Aktivierung

Nachbarprojekt: `D:\Codex\api.autohextd`, Repository `zlyfer/api.autohextd`.

Neue Dateien:

- `classes/RunLeaderboard.php`
- `database_structure/leaderboard_runs.sql`
- Ergänzungen in `bootstrap.php` und `routes/index.php`

Die SQL-Datei muss vor Aktivierung der neuen API auf der vorgesehenen Datenbank ausgeführt werden. Anschließend API und Client gemeinsam veröffentlichen. In dieser Umsetzung wurden weder Migrationen noch Deployments ausgeführt.

Am 20.10.2026 lokal geprüft: PHP 8.4.26, Composer-Abhängigkeiten aus dem Lockfile und eine isolierte MariaDB 11.4.10. Alle PHP-Dateien bestanden den Syntaxcheck. Das API-Skript scripts/test-run-leaderboard.php bestand 20 Integrationsprüfungen: Authentifizierung mit Test-Sessions, doppelte Einreichung, Moduswechsel-Verbot, getrennte Listen, Gast-Vorschau, Gleichstände, Ausschluss des eigenen Bestwerts, Prüfung/Freigabe/Ablehnung, veraltete Revisionsnummer und Rang außerhalb der Top 100.

Die portablen Laufzeiten liegen unter %TEMP%/autohex-ranking-tools. Der Testserver bindet ausschließlich an 127.0.0.1:33079, wurde nach dem Test beendet und seine erzeugte Testdatenbank gelöscht. Es wurden keine globalen Dienste eingerichtet. Der Test verwendet reale PHP-Handler und SQL-Abfragen, aber keinen öffentlichen HTTP-Server.

**Noch offen:** SQL-Migration auf dem Zielsystem, API- und Client-Veröffentlichung sowie anschließende Live-Funktionsprüfung. Die Live-Aktivierung wurde auf Nutzerwunsch vorerst zurückgestellt. Dafür muss zunächst der Hosting-Zugangsweg bzw. die Zuständigkeit mit Zlyfer geklärt werden.

## Endpunkte

- `GET /run-leaderboard?mode=single`: bis zu 100 freigegebene Bestwerte, Antwort `{mode, entries:[{rank,username,wave,kills,ruleset}]}`
- `GET /run-leaderboard/preview?mode=single&wave=35&kills=400`: `{mode, rank, provisional:true}`, optional Bearer für Ausschluss des eigenen Accounts.
- `POST /run-leaderboard`: Bearer erforderlich; `{runId,mode,wave,kills,ruleset}`; Antwort `{status}`.
- `GET /run-leaderboard/pending`: nur Admin; erste 100 offene Einträge mit `id` und `revision`.
- `POST /run-leaderboard/{id}/review`: nur Admin; `{revision,decision:"accepted"|"rejected",reason}`.

`/leaderboard` bleibt für alte Clients und Gesamtwerte unverändert.

Release-Hinweis 20.10.2026: Ohne Hosting-Zugang wird der vorbereitete Code veröffentlicht, aber keine Live-Migration ausgeführt. Ist die getrennte Run-Liste nicht verfügbar, wechselt die Solo-Standardansicht ausdrücklich zu Gesamtwerte. Platzierungsvorschauen bleiben dann als nicht verfügbar gekennzeichnet. Bestehende Account-Saves und Gesamtwerte werden nicht migriert oder verändert.
