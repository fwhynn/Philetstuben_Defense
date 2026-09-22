# Duo: Übergabe für die Online-Freunde-Beta

Stand: 22.09.2026. Zieladresse: https://autohextd.zlyfer.net/.
Implementierung und automatisierte lokale Tests sind vom tatsächlichen Live-Betrieb zu unterscheiden. Kein Browser-Test und keine Veröffentlichung wurden in diesem Arbeitsschritt durchgeführt.

## Implementiert

- Private Lobby, Einladungscode/-link, zwei eigene Karten und Partneransicht.
- Servergesteuerter Kampf, gemeinsames Leben/Wellenbereitschaft, Portalhilfe, Geschenke, Wächterzustimmung und gemeinsame Wächterbeute.
- Gemeinsames Ergebnis bei Niederlage oder nach Welle 35; Turmschaden, investiertes Gold, Schaden/Gold und Unterstützung. Wiederholung startet erst nach Zustimmung beider Spieler.
- Gespeicherte Ergebnisbelege je privater Sitzung, sofortige Speicherung beim Abschluss, Wiederaufnahme und wiederholbare Übertragung ins lokale Profil. Lobby bietet die letzte Sitzung erneut an.
- Vorläufige Duo-Diamantenformel je Spieler: abgerundete Hälfte der überstandenen Wellen + 5 je lokal besiegtem Wellenboss + 3 je gemeinsam besiegtem Erkundungswächter. Solo-Meilensteine werden dadurch nicht freigeschaltet.
- Wiederverbindung, Tab-Übernahme, Wartung, Sicherung/Wiederherstellung und idempotente Befehle. HTTP-Abfragen sind für maximal acht private Lobbys ausgelegt.

Das Profil bleibt ein lokaler, exportierbarer Spielstand. Belege verhindern doppelte Gutschriften in demselben Profil, auch nach dessen Export/Import. Das ist kein kontobasiertes, browserübergreifendes Anti-Cheat-System. Sitzungstoken im Link und in Backups sind privat. Wer Browserdaten löscht, braucht seinen Profil-Export und gegebenenfalls den privaten Sitzungslink zur Wiederaufnahme.

## Betrieb vorbereitet

`deploy/Dockerfile`, `deploy/compose.yaml` und `deploy/Caddyfile` bauen getrennte Spiel-/Server-Images und einen HTTPS-Einstieg. Nur öffentliche Spieldateien gelangen in das Web-Verzeichnis. Speicherdaten bleiben im privaten Volume. Der Server-Port wird nicht direkt veröffentlicht. Healthcheck und begrenzte Container-Logs sind konfiguriert.

Die Vorlage setzt einen eigenen Linux-Server mit Docker Compose, passende DNS-Einträge und freie Ports 80/443 voraus. Existiert bereits ein Webserver für die Domain, die Vorlage **nicht zusätzlich auf dieselben Ports starten**: Der Betreiber muss die vorhandene Konfiguration erweitern. Folgende Pfade gehen zum dauerhaft laufenden Node-Prozess: `/state`, `/command`, `/session`, `/results`, `/healthz`, `/lobby/*`. Alle anderen Pfade liefern die öffentlichen Spieldateien. `DUO_PUBLIC_ORIGIN=https://autohextd.zlyfer.net` muss gesetzt sein.

Auf einem passenden, noch nicht belegten Zielserver:

```sh
docker compose -f deploy/compose.yaml build
docker compose -f deploy/compose.yaml up -d
node deploy/check-online.cjs https://autohextd.zlyfer.net
```

Ohne Docker: Node 24, `npm ci --omit=dev`, `node serve.cjs --write-index`, öffentliche Dateien mit `node deploy/build-public.cjs /neues/leeres/web-verzeichnis` erzeugen. `server/start-duo.cjs` als dauerhaft überwachten Dienst starten, privaten absoluten `DUO_SAVE_FILE` setzen und den vorhandenen HTTPS-Proxy vorschalten. Nicht das komplette Repository öffentlich ausliefern.

Docker/Caddy sind lokal nicht installiert. Image-Build, Zertifikatsausstellung und Betrieb auf dem echten Host sind deshalb noch ungeprüft. Der aktuelle Hosting-Anbieter/Deployment-Weg ist noch zu klären; die Domain allein gibt keinen Serverzugang.

## Updates, Backups, Rückkehr zum alten Stand

1. Vor dem Update Wartung aktivieren (lokale interaktive Serverkonsole: `maintenance on`), dann Dienst kontrolliert stoppen. Beim nicht interaktiven Betrieb Server mit `DUO_MAINTENANCE=1` starten, prüfen und für die Sicherung wieder stoppen. Keine Images während laufender Speicherung austauschen.
2. Private Checkpoint-Datei und bisheriges Release getrennt sichern. Validierte Kopie: `node server/backup.cjs /privat/checkpoint.json /privat/backups/checkpoint-DATUM.json`. Ziel muss neu sein. Unter Docker zuerst den gestoppten Container-Checkpoint mit `docker compose -f deploy/compose.yaml cp duo:/data/checkpoint.json /privat/checkpoint-export.json` kopieren und die Kopie validieren. Erste Installation hat noch keinen Checkpoint.
3. Neues Release mit Wartung starten. Healthcheck, Logs und Wiederherstellung prüfen; danach ohne Wartung neu starten. Gespeicherte Partien werden nicht durch nachgeholte Offline-Zeit beschleunigt.
4. Bei Fehlern stoppen, passendes altes Image/Release **mit dessen Sicherung** wiederherstellen. Sicherung mit `backup.cjs` in eine neue private Datei kopieren und diese als `DUO_SAVE_FILE` verwenden beziehungsweise ins gestoppte Datenvolume übernehmen. Neuere Checkpoints nicht ungeprüft mit älterem Code öffnen.
5. Betreiber richtet regelmäßige private Backups, Aufbewahrung, Speicherplatz-/Healthcheck-Überwachung und einen echten Restore-Probelauf auf dem Zielserver ein. Keine Checkpoints in Git, Web-Verzeichnis oder öffentliche Fehlerberichte laden.

## Deine verbleibenden Aufgaben

1. **Hosting klären:** Anbieter/Betreiber und Veröffentlichungsweg nennen (z. B. Git-Webhook, Docker, VPS oder Hosting-Dashboard). Keine Zugangsdaten in den Chat kopieren. Danach Server/Proxy konfigurieren und den obigen Prüfbefehl ausführen lassen.
2. **Zwei echte Browser/Geräte:** Lobby erstellen, Link teilen, beitreten, beide Karten spielen, Partneransicht und gemeinsame Wellenbereitschaft prüfen.
3. **Spielablauf:** Geschenke nach Welle 5, Wächterzustimmung/Beute, Portalhilfe, Niederlage und Welle-35-Sieg mit Statistiken prüfen. Bei beidseitigem Neustart muss eine frische Partie beginnen.
4. **Unterbrechungen:** Während Kampf und Belohnung einen Browser neu laden, kurz offline gehen, im zweiten Tab übernehmen. Keine doppelte Ausgabe/Belohnung; alter Tab darf nicht weiter steuern. Betreiber testet Wartung und Prozessneustart auf dem echten Host.
5. **Profil:** Diamanten vor/nach Abschluss vergleichen, Ergebnis neu laden, Spielstand exportieren/importieren: keine erneute Gutschrift desselben Ergebnisses. Speicherfehler sollen sichtbar sein.
6. **Darstellung:** Desktop und schmales Fenster, Deutsch/Englisch, Kartenwahl/Zoom/Bedienung prüfen. Belohnungskarten brauchen nach kurzem Öffnungsschutz nur einen bewussten Klick. Keine vorausgewählte Handkarte; Hover-Schrift bleibt scharf.
7. **Freunde-Beta:** Erst nach diesen Prüfungen begrenzt öffnen. Längere Partien und bis zu acht Lobbys auf dem echten Host beobachten. Die lokalen kleinen Lasttests belegen keine Kapazität für beliebig große Karten oder einen öffentlichen Launch.

Eine spätere Angleichung der Duo-Oberfläche an die vollständige Solo-3D-Oberfläche, freie Duo-Turmauswahl, Konten, Matchmaking und Ranglisten sind weitere Produktarbeit; der aktuelle Freunde-MVP verwendet die bestehende Duo-Oberfläche und feste Turmauswahl.
