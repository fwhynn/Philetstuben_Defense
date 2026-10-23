# Automatischer Rollout: Spielstände und Bestenlisten

## Stand 23.10.2026

Implementiert und mit isolierten Tabellen in der echten Testdatenbank geprüft. Der erste Live-Versuch scheiterte vor der Migration an fehlenden Backup-Verzeichnisrechten; der vorherige API-Code wurde ohne Datenbank-Rücksetzung wiederhergestellt. Der Betreiber hat inzwischen den privaten Backup-Ordner eingerichtet und bestätigt, dass nginx ausschließlich public/ ausliefert. Live-Freigaben werden nicht mehr durch manuell gesetzte „passed“-Werte vorgetäuscht: Jeder Deployment-Lauf prüft Sicherung, Schema und Worker auf seinem Zielserver selbst.

## Ablauf bei jedem Release

1. Der API-Webhook sperrt neue API-Aufrufe und wartet auf bereits laufende Aufrufe, bevor er main aktualisiert. Der vorhandene GitHub-Signatur- und Benutzercheck bleibt erhalten.
2. Composer führt nach der Installation automatisch scripts/prepare-release.php --apply aus. Auch der bisherige Webhook führt composer install mit Scripts aus: Damit wird die erste Umstellung bereits vorbereitet, ohne einen neu installierten Cronjob oder zusätzliche SSH-Befehle vorauszusetzen. Die neue öffentliche API prüft ihre Freigabe vor dem Laden der Anwendung; ohne passende Freigabe antwortet sie mit 503.
3. Der Vorbereitungsschritt benutzt ausschließlich die Konfiguration des API-Servers. Die lokale .env wird nicht kopiert, hochgeladen oder in Git aufgenommen.
4. Eine konsistente, private Sicherung der Accounts, Sitzungen, Spielstände, Profilstatistiken, Run-Bestenliste und vorhandenen Sicherungs-/Warteschlangentabellen wird geschrieben, erneut eingelesen und mit Zeilen- und Schema-Prüfsummen geprüft. Jede Ausführung behält eine eigene Datei.
5. Ausschließlich save_safety.sql und leaderboard_runs.sql werden ausgeführt. Der Runner akzeptiert nur die drei freigegebenen CREATE TABLE IF NOT EXISTS-Anweisungen. Keine bestehende Tabelle wird geleert, ersetzt, umbenannt oder automatisch umgebaut. Ein inkompatibles vorhandenes Schema stoppt die Freigabe.
6. Tabellen, Schlüssel und benötigte Spalten werden geprüft. Die vorhandenen Daten werden mit der Sicherung verglichen. Ein begrenzter echter Worker-Durchlauf prüft die Reparatur; Spielstände und Run-Einträge müssen dabei unverändert bleiben.
7. Erst danach wird eine Freigabe für den exakten API-Code und die Serverkonfiguration veröffentlicht. /deployment-health bestätigt diese Freigabe und prüft das Schema erneut. Änderungen am Code oder an der Konfiguration machen eine alte Freigabe ungültig.
8. npm run tag veröffentlicht bei --all zuerst die API und wartet auf deren passende Freigabe. Erst danach werden Client-Version, Patchnotes, Commit und Tag erstellt/veröffentlicht. --client prüft die bereits veröffentlichte API ebenfalls; --server wartet nach dem API-Push auf die Freigabe. Auch --test durchläuft diese Reihenfolge, weil die vorhandenen Webhooks Test-Tags ebenfalls deployen.

## Fehler und Wiederholung

Bei Sicherungs-, SQL-, Schema- oder Prüfungsfehlern bleibt die neue API gesperrt und der Client-Release stoppt. Bereits angelegte zusätzliche Tabellen dürfen stehen bleiben; ein erneuter erfolgreicher Vorbereitungslauf schließt den Ablauf ab. Es wird niemals automatisch eine alte Sicherung über aktuelle Spielstände zurückgespielt. Alte Clients ohne Speicherversion erhalten weiterhin 428; veraltete Versionen 409.

Der bestehende Webhook aktualisiert den Checkout direkt. Deshalb kann es während des Rollouts eine kurze API-Wartungsphase geben. Dies ist keine atomare Umschaltung auf ein separates Release-Verzeichnis und keine Zusage unterbrechungsfreier Verfügbarkeit. Beim allerersten Übergang kennen bereits laufende alte PHP-Anfragen die neue Sperre noch nicht; falls sie während der Prüfung Daten ändern, wird die Freigabe wegen des Datenvergleichs verweigert und kann wiederholt werden.

## Sicherungsort und Wiederherstellung

Standard: neben dem API-Repository unter .autohex-private/api-backups. Optional AUTOHEX_BACKUP_DIR in der serverseitigen Umgebung/.env. Der Ordner muss außerhalb des Webroots liegen. Innerhalb des Repositorys ist ausschließlich der explizit konfigurierte, gitignorierte Ordner .private-backups erlaubt; alle anderen internen Pfade und aufgelöste Pfade unter public/ werden abgelehnt. Der Ordner muss für den PHP-Benutzer beschreibbar sein und unter Unix Rechte 0700 haben; Dateien bekommen 0600. Der Runner legt den Standardordner an, soweit die vorhandenen Rechte reichen. Fehlen sie, stoppt er mit geschlossenem API-Zugang. Keine Zugangsdaten oder Sicherungsinhalte erscheinen im Health-Endpunkt.

Die Sicherung ist JSONL mit Tabellendefinitionen, Base64-kodierten Zellwerten und Prüfsummen. Sie umfasst die sieben genannten Datentabellen, nicht beliebige weitere Hosting-Daten. Die Wiederherstellung der drei Kernbereiche wurde in isolierten Testtabellen bytegenau geprüft. Eine echte Wiederherstellung ist immer ein eigener kontrollierter Vorgang: Sicherung verifizieren, in einen isolierten Bereich laden, vergleichen und nur ausdrücklich gewünschte Daten übernehmen. Keine automatische Rücksetzung bei Deployment-Fehlern. Nach erfolgreicher Aktivierung werden ausschließlich ältere, geprüfte Release-Backup-Dateien bereinigt: Das aktive Backup und die zwei jüngsten weiteren gültigen Sicherungen bleiben erhalten. Keine Bereinigung bei fehlgeschlagenem Rollout, kein Datenbankzugriff durch die Bereinigung, keine rekursive Löschung und keine Symlinks. Fremde, beschädigte und unvollständige Dateien bleiben erhalten; Bereinigungsprobleme werden protokolliert. Freien Speicher und eine zusätzliche externe Kopie weiterhin überwachen.

## Worker ohne Cron-Pflicht

Nach normalen API-Aufrufen wird höchstens einmal pro Minute und Host ein kleiner Batch versucht: maximal drei Accounts, Zeitbudget zwischen Jobs 0,5 Sekunden, Datenbank-Sperrwartezeit maximal eine Sekunde. Unter PHP-FPM wird die Antwort vorher abgeschlossen. Fehlgeschlagene Jobs bleiben erhalten und werden hinten eingereiht. Ohne API-Verkehr erfolgt kein Hintergrundlauf; beim nächsten Laden/Speichern wird der jeweilige Account zusätzlich direkt repariert. Ein Cronjob bleibt optional für zeitgesteuerte Verarbeitung ohne Besucher. Die Dateisperren setzen den bisherigen Betrieb auf einem API-Host voraus.

## Prüfungen und Release-Voraussetzungen

Echter Testaufruf im API-Repository: php scripts/test-save-database.php --run --tables --reference=PATH_TO_USER_TEST_ENV. Der Runner prüft die Konfigurationsidentität, verwendet frische zufällige Tabellenpräfixe und entfernt nur diese Tabellen. Bestehende Testtabellen werden nicht beschrieben. Die ursprünglichen Tabellenliste und Prüfsummen von saves/player_stats/leaderboard_runs müssen unverändert bleiben.

Geprüft: wiederholte Rollouts, echte Sicherung/Wiederherstellung, beschädigte Sicherung, unsicherer Sicherungsort, tatsächlicher SQL-Fehler nach Teilmigration, inkompatibles Schema, abgelehnte Löschanweisung, parallele Schreibzugriffe, veraltete Uploads, Worker-Ausfall/Reparatur, echte Composer-Hooks und lokale HTTP-Sperren/Freigabe. Die Antworten der bisherigen öffentlichen Bestenliste sowie der Solo-/Duo-Listen bleiben nach Migration identisch. Die alten Gesamtwerte werden nicht als eindeutig zugeordnete Solo-/Duo-Läufe erfunden; ihre bisherige Liste bleibt erhalten.

Vor einem ausdrücklich beauftragten Release: Änderungen in beiden Repositories reviewen/committen und in main übernehmen. Die Webhooks deployen main. Uncommittete oder neue, ungetrackte Dateien blockieren den Tag-Befehl. Der Release erfolgt auf main. Direkte manuelle Pushes/Tags umgehen die lokale Release-Reihenfolge; der API-eigene Gate bleibt bestehen. Tests sind keine Behauptung bereits geprüfter Live-Schreibrechte oder eines bereits ausgeführten Live-Backups.

Nachweis am 23.10.2026: 68 echte Datenbankprüfungen bestanden, einschließlich echter Composer- und lokaler HTTP-Tests; 30 PDO-Double-Prüfungen und 54 unterschiedliche gezielte Node-Prüfungen bestanden. 22 PHP-Dateien syntaxgeprüft. PHP-/Node-Versionsfingerprints stimmen überein. Erster Live-Versuch abgebrochen; die öffentlichen Bestenlisten wurden nach Wiederherstellung bytegleich verifiziert. Erneuter Rollout nach Einrichtung des privaten Backup-Ordners ausstehend.

Aktuelle Prüfung: 74 echte Datenbankchecks inklusive privatem Repository-Backup, Ablehnung anderer interner Pfade, unveränderten Bestandsdaten und vollständiger Fixture-Bereinigung bestanden.

Aufbewahrung implementiert: Dateitests prüfen geschütztes aktives Backup, drei verbleibende Sicherungen, unveränderte Fremddateien und idempotente Bereinigung. Die Testdatenbank prüft außerdem das Ausbleiben der Bereinigung bei Fehlern und die Bereinigung nach erfolgreichem Retry. Live verifiziert mit API v1.1.9 am 23.10.2026: completed=true, limit=3, kept=2, deleted=0, skipped=0, failed=0. Aktuell ist noch keine Löschung erforderlich. Alle vier öffentlichen Bestenlisten sind bytegleich zum Vorher-Stand. Der Rollout beschränkt die Rechte des validierten Backup-Ordners bei Bedarf wieder auf 0700.

Aktueller Testnachweis: 9 Dateitests und 77 echte Datenbankprüfungen bestanden. Der öffentliche Health-Endpunkt gibt zur Aufbewahrung nur Status und Zähler aus, keine Pfade oder Sicherungsinhalte.
