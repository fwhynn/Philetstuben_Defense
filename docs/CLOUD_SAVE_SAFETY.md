# Cloud-Saves und Erhalt der Bestenliste

## Schutz vor veralteten Uploads

GET /saves liefert `revision` (SHA-256 des tatsächlich gespeicherten JSON; `empty` für einen neuen Account). PUT übermittelt `_baseRevision`. Die API sperrt den Account innerhalb einer Transaktion und vergleicht diese Basis mit dem aktuellen Inhalt, bevor sie schreibt. Ein Konflikt liefert HTTP 409; fehlende Versionsinformation HTTP 428. Die Uhrzeit eines Geräts entscheidet niemals über Schreibrechte.

Der Client behält die Basis des geladenen Profils, auch nach Offline-Neustart. Eine Vorprüfung übernimmt ausdrücklich keine neuere Revision. Parallele Uploads werden zusammengefasst; Änderungen während eines Uploads bleiben als ungesichert markiert. Bei Konflikten bleiben lokales Profil und eine lokale Sicherung erhalten; automatisches Überschreiben und automatische Konflikt-Wiederholungen sind gesperrt. Manuelles Laden des Account-Spielstands löst die Sperre. Es gibt kein automatisches Zusammenführen von Währungen oder Freischaltungen.

## Deployment

Vor einem späteren Rollout die additive API-Migration `database_structure/save_safety.sql` ausführen (Sicherungshistorie und Statistik-Warteschlange), dann API und Client ausrollen, API zuerst. Die Migration wurde hier nicht ausgeführt. Alte Clients werden nach dem API-Update mit 428 zum Aktualisieren aufgefordert. Der neue Client schreibt nicht gegen eine API ohne Versionsunterstützung. Bereits bestehende Spielstände erhalten ihre Revision beim Lesen. Alte Offline-Stände ohne bekannte Basis werden nicht blind hochgeladen. Details und das Reparaturwerkzeug stehen im API-Repository in `SAVE_SAFETY.md`.

## Bestenliste

Ein Patch startet keine neue Season. `ruleset` dokumentiert die Spielversion; die laufende Season bleibt `initial`. Bestehende Run-Einträge werden weder migriert noch gelöscht. Die vorhandenen SQL-Dateien verwenden `CREATE TABLE IF NOT EXISTS`. Der API-Webhook aktualisiert Code und Composer-Abhängigkeiten, nicht die Datenbank.

Die Profil-Bestenliste behält kumulierte Läufe, Kills, Boss-Kills, verdiente Diamanten und die höchste Welle über GREATEST bei Updates. Verfügbare Diamanten bleiben veränderlich, damit Einkäufe korrekt angezeigt werden.

Der normale Tag-Release prüft die SQL-Migrationen des vorhandenen API-Repositories und stoppt bei DROP, TRUNCATE oder DELETE. Dies ersetzt weder Datenbank-Backups noch die Prüfung externer Hosting-Skripte: deren tatsächliche Live-Konfiguration ist hier nicht zugänglich. Ein absichtlicher Reset oder Season-Wechsel gehört in einen getrennten, ausdrücklich beauftragten Vorgang.

## Erweiterte Prüfung vom 22.10.2026

Geprüft wurden beide lokalen Repositories, Cloud-Synchronisation, Browserprofile, Solo-Checkpoints, die PHP-Profil- und Run-Bestenliste, der separate Node-Rankingdienst, Duo-Dateispeicher und beide Deployment-Webhooks. Es wurden keine echten Accountdaten zurückgesetzt und keine Live-Datenbankzugriffe ausgeführt. Die folgenden Befunde beschreiben den lokalen Code, nicht eine verifizierte Hosting-Konfiguration.

### Zusätzlich behoben

- **Download ist noch keine Übernahme:** Bei verzögerter Profilübernahme ist die Upload-Basis nur im Arbeitsspeicher gültig. Erst nach erfolgreicher Anwendung des Profils wird sie dauerhaft freigegeben. Auch ein zwischenzeitlicher Einstellungs-Upload darf einen Reload nicht zum Hochladen des alten Browserprofils berechtigen.
- **Unlesbare Solo-Snapshots:** Ein neuerer Snapshot wird unverändert aufbewahrt und beim Speichern von Einstellungen mitgeführt. Fehlende Lesbarkeit bedeutet nicht mehr automatisch `runAutosave: null`. Beschädigtes JSON stoppt den Upload, statt den Cloud-Snapshot zu löschen.
- **Beschädigte oder unbekannte lokale Profilversion:** Das Original bleibt erhalten, lokale Ersatzwerte werden nicht darüber geschrieben und der Cloud-Upload wird gesperrt. Ein erfolgreicher, validierter Import/Cloud-Download hebt die Sperre auf und sichert zuvor das Original.
- **Synchroner Uploadfehler:** Auch ein Fehler beim Zusammenstellen des Payloads lässt den Upload nicht dauerhaft als laufend hängen.

### Weitere Befunde und verbleibende Grenzen

| System | Befund / Auswirkung |
| --- | --- |
| PHP-Profil-Bestenliste | Liest `player_stats`, keine Versions-/Season-Filter. Kumulierte Werte werden mit der lokalen API-Korrektur nicht mehr durch kleinere Uploadwerte reduziert. Die Darstellung ist auf 100 Spieler begrenzt und blendet Nullwerte der gewählten Kategorie aus; ein Spieler kann deshalb unsichtbar sein, ohne gelöscht zu sein. |
| PHP-Run-Bestenliste | `season='initial'`; `ruleset` ist nur Metadatum. Ein Patch leert sie nicht. Nur angenommene Ergebnisse, je Account der beste Run im gewählten Modus, erscheinen öffentlich. Ein besseres Ergebnis desselben fortgesetzten Runs setzt den vorhandenen Datensatz wieder auf `pending`; dadurch kann der bisher angenommene Bestwert bis zur erneuten Prüfung verschwinden. Für dauerhaft sichtbare angenommene Zwischenstände fehlt eine getrennte Historie freigegebener Scores. |
| Fehlgeschlagene Run-Einreichung | Gast-Runs werden im Browser zwischengespeichert (maximal 20). Für bereits angemeldete Nutzer fehlt eine dauerhaft accountgebundene Wiederholungswarteschlange. Bei API-Ausfall plus Reload kann ein noch nicht eingereichter Run verloren gehen; bestehende Datenbankeinträge sind davon nicht betroffen. |
| Node-Rankingdienst | Versionsübergreifende Rangliste, Season-Wechsel ausdrücklich über `changeSeason`. Persistenzfehler veröffentlichen keine ungespeicherten Änderungen. Dies ist ein eigener Dienst und kein Nachweis für die produktive PHP-Datenbank. |
| Laufende Duo-Partien | `duo-room.cjs` verwendet die Paketversion als `RULESET`. Damit verwirft **jeder Versionswechsel**, nicht nur eine tatsächlich inkompatible Regeländerung, alte laufende Lobbys beim Neustart. Originaldatei wird gesichert, bereits erfasste Ergebnisbelege bleiben erhalten. Der Frontend-Webhook startet Duo nach dem Update neu und drainiert aktive Partien nicht automatisch. Bestehende Bestenlisten werden dadurch nicht geleert, unfertige Partien können aber verloren gehen. |
| Duo-Dateispeicher | Vorgesehener Systemd-Pfad `/var/lib/autohextd/checkpoint.json`, lokal Benutzerverzeichnis: außerhalb des Git-Checkouts, atomare Speicherung und Sicherung. Container benötigen entsprechend ein dauerhaftes Volume; ein flüchtiges Container-Dateisystem ist kein persistenter Speicher. Tatsächliche Live-Mounts hier nicht geprüft. |
| Deployment | Beide Webhooks ziehen Code von `main`; Frontend installiert npm-Abhängigkeiten und startet Duo, API installiert Composer-Abhängigkeiten. Keine automatische Datenbankinitialisierung/-löschung gefunden. Die Composer-Konfiguration enthält keinen Installations-Hook für SQL. Git ignoriert `.env`; ein normaler Pull ersetzt keine ungetrackte Live-`.env`. |
| Release-Schutz | SQL-Prüfung gilt für den normalen Tag-Befehl und das vorhandene lokale API-Repo. Sie ist kein Schutz gegen manuelle Datenbankbefehle, andere Deploy-Pipelines oder einen direkten Git-Push. Sie ist kein vollständiger SQL-Parser. |
| Domain / API-Ziel / Rollback | Ein anderer Browser-Origin hat getrennten Browser-Speicher. Ein anderes API-Ziel hat getrennte Tokens und ggf. eine andere Datenbank: leere Anzeigen beweisen keine Löschung. Rollback auf alte Clients ist wegen fehlender Revisionsprüfung kein sicherer Ausweg; die neue API verweigert deren Uploads mit 428. |
| Rollout-Fenster | Git-Pull im laufenden Webverzeichnis ist kein atomarer Frontend/API-Release. Offene Tabs und nacheinander geladene Dateien können verschiedene Versionen enthalten. Versionskonflikte müssen fail-closed bleiben. Live-Proxy-/Cache-Regeln und Backups sind ohne Hosting-Zugriff nicht verifiziert. |

### Validierung

717 automatisierte Client-/Node-Server-Tests bestanden, einschließlich Profilbeschädigung, künftiger Snapshot-Versionen, Reload vor Profilübernahme, konkurrierender Uploads, versionsübergreifender Rangliste und Duo-Neustart mit erhaltenen Ergebnisbelegen. PHP-Speicherrouten werden separat mit einer PDO-Testimplementierung geprüft; dies ersetzt keinen Integrationstest auf einer wegwerfbaren MySQL/MariaDB-Datenbank. Keine Browserprüfung und kein Deployment durchgeführt.

## Umsetzung der drei zusätzlichen Prioritäten

- `classes/local-store.js` hält Profil, Solo-Checkpoint, Spielpräferenzen, Sicherung und Synchronisationsmarkierungen in getrennten Bereichen pro API-Umgebung und Account; Gäste haben einen eigenen Bereich. Bestehende unzugeordnete Browserdaten bleiben unverändert erhalten und werden als Produktions-Gastdaten übernommen. Beim erstmaligen Cloud-Laden wird der ersetzte lokale Profilstand zusätzlich gesichert. Die Serverdaten werden nicht automatisch aus Legacy-Browserdaten überschrieben.
- Ein Web Lock erlaubt pro Bereich nur einen schreibenden Tab. Ein zweiter Tab ist schreibgeschützt; zusätzlich wird vor jedem Schreiben der gespeicherte Zustand verglichen. Ohne Web-Locks-Unterstützung oder bei beschädigtem Bereich bleibt das System schreibgeschützt. Der Nutzer muss andere Tabs schließen und neu laden; es gibt keinen automatischen Lock-Takeover. Account-Wechsel in anderen Tabs blockieren auch API-Aufrufe des alten Tabs.
- `SaveValidator` prüft Profile vor dem Überschreiben. `save_history` archiviert den vorherigen JSON-Inhalt pro Account/Revision innerhalb der Speichervorgangs-Transaktion. Wenn Sicherung oder Queue fehlen/fehlschlagen, wird nicht überschrieben. Bereits vorhandene Spielstände werden nicht nachträglich normalisiert.
- `player_stats_pending` speichert fehlgeschlagene Statistik-Aktualisierungen dauerhaft. Jeder Retry verwendet unter Account-Sperre den neuesten Spielstand; ein erfolgreicher Retry entfernt nur den Warteschlangenauftrag, keine Bestenlisteneinträge. GET/PUT versuchen die Verarbeitung erneut. Für zuverlässige Verarbeitung ohne weitere Spieleraktivität muss beim späteren Deployment zusätzlich der dokumentierte Reparatur-Worker regelmäßig gestartet werden.
- Der Account-/Ergebnisbildschirm unterscheidet gespeicherten Fortschritt von einer noch ausstehenden Statistik-Aktualisierung. Der Wiederaufbau aus bestehenden Profilen ist ein ausdrücklich gestarteter Wartungsbefehl, kein automatischer Reset beim Push.

Die weiteren auditieren Themen (Duo-Kompatibilität bei Versionswechsel, Run-Einreichungswarteschlange und freigegebene Zwischenstände fortgesetzter Runs) sind separate offene Aufgaben; sie werden von diesen drei Änderungen nicht als erledigt ausgewiesen.
