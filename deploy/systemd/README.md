# Debian 12: Duo-Dienst und Tag-Webhook

Ziel: `https://autohextd.zlyfer.net`, Repository `/var/www/html/net.zlyfer.autohextd`.
Servercode liegt im gleichen Repo. Installation durch den Serverbetreiber, nicht bereits live ausgeführt.

## Einmalige Einrichtung

Voraussetzung: Node.js 24 und npm unter `/usr/local/bin/node` bzw. `/usr/local/bin/npm` (Service-Datei und `webhook.php` rufen diese Pfade fest auf). Git und sudo müssen installiert sein. Bestehenden Webserver/HTTPS/PHP-FPM weiterverwenden.

Als root:

```sh
install -o root -g root -m 0644 /var/www/html/net.zlyfer.autohextd/deploy/systemd/autohextd-duo.service /etc/systemd/system/autohextd-duo.service
install -o root -g root -m 0440 /var/www/html/net.zlyfer.autohextd/deploy/systemd/autohextd-duo.sudoers /etc/sudoers.d/autohextd-duo
visudo -cf /etc/sudoers.d/autohextd-duo
systemctl daemon-reload
```

Der Dienst läuft als `zlyfer:zlyfer`, nicht root, und braucht Lese-/Verzeichniszugriff auf Repo und node_modules. PHP-FPM braucht Schreibzugriff aufs Repo für Git/npm. Sudoers erlaubt ausschließlich Start/Stop/Restart dieses einen root-eigenen Dienstes. Bei anderem PHP-FPM-Benutzer `www-data` entsprechend ersetzen. Dienst-/Sudoers-Dateien werden nicht automatisch durch einen Webhook überschrieben – nach Änderungen daran die beiden `install`-Befehle oben erneut ausführen.

Abhängigkeiten einmal als Repository-/Deployment-Benutzer installieren:

```sh
cd /var/www/html/net.zlyfer.autohextd
/usr/local/bin/npm ci --omit=dev
/usr/local/bin/npm run generate-assets-index
```

Anschließend als root:

```sh
systemctl enable --now autohextd-duo.service
systemctl status autohextd-duo.service
journalctl -u autohextd-duo.service -n 80 --no-pager
```

`StateDirectory` erzeugt `/var/lib/autohextd` mit privaten Rechten. Port 8090 hört nur auf Loopback. Optionale Umgebungsvariablen gehören nach `/etc/autohextd/duo.env`; bei Portänderung auch Proxy und Healthcheck anpassen.

## Bestehenden Webserver ergänzen

Nginx: `deploy/systemd/nginx-duo.conf` in den bestehenden HTTPS-vHost integrieren, Regeln mit vorhandenen Locations abgleichen, `nginx -t`, dann Nginx neu laden. Für Apache entsprechend `/socket.io/` inklusive WebSocket-Upgrade sowie die HTTP-Endpunkte zum Node-Dienst proxyen. Keinen zweiten Webserver auf Port 443 starten. `deploy/Caddyfile` enthält die entsprechende Caddy-Route.

Der Socket.IO-Client kommt vom eigenen Server unter `/socket.io/socket.io.js`, kein CDN nötig. Die Spielverbindung nutzt Socket.IO für Zustand, Befehle und Sitzungssteuerung; der Zustand wird darüber derzeit mit 10 Abfragen/Sekunde angefordert. Lobby-Erstellung, Beitritt und Ergebnisabruf bleiben HTTP. Bestehende HTTP-Spielendpunkte bleiben für Diagnostik/Kompatibilität verfügbar.

Die Dotfiles (`.git`, `.deploy-webhook-secret`), Servercode, Deploymentdateien und `webhook-error.log` müssen im Webserver gesperrt sein. Die bereitgestellten Nginx-Regeln enthalten dies; vor Freigabe überprüfen. Node-Port nicht öffentlich freigeben. PHP-FPM und Proxy müssen dem signierten Deployment-Webhook genug Zeit für `npm ci` geben (z. B. 300 Sekunden Request-Timeout).

## Update-Ablauf

Der signierte Webhook wird durch einen berechtigten Tag-Push ausgelöst und behält Zugriffskontrolle und Deploy-Sperre. Ausgeliefert wird dabei immer der aktuelle Stand von `main`, nicht das Tag selbst:

1. Arbeitskopie prüfen (lokale Änderungen an versionierten Dateien brechen ab).
2. `git checkout main` und `git pull --ff-only origin main`.
3. `/usr/local/bin/npm ci --omit=dev` und `/usr/local/bin/npm run generate-assets-index`.
4. `systemctl restart autohextd-duo.service` – der alte Prozess schreibt beim SIGTERM seinen Checkpoint, der neue startet mit dem aktualisierten Code.
5. Lokaler Healthcheck; ein Fehlschlag wird in der Antwort gemeldet, das Spiel-Update gilt trotzdem als durchgeführt.

Schlägt Pull/npm fehl, bricht der Webhook vor dem Neustart ab; der Dienst läuft dann mit dem alten Code weiter. Beim erfolgreichen Update verbinden Browser automatisch neu. Beide Spieler müssen innerhalb des bestehenden Rückkehrfensters (120 Sekunden ab Serverwiederaufnahme) wieder da sein, bevor der Kampf weiterläuft. Während der Server aus ist, wird keine Spielzeit nachgeholt. Der Hauptmenüeintrag bleibt bis zur Browser-Abnahme wie bisher Coming Soon; direkter Betatest über `/duo-lobby.html`.

## Spielstände und Grenzen

`/var/lib/autohextd/checkpoint.json` enthält Lobbys, private Sitzungen, Karten, Gegner/Kampfzustand, Befehlssequenzen, Belohnungen und Ergebnisbelege. Speicherung nach mutierenden Befehlen sowie ungefähr jede Sekunde. Atomarer Dateitausch und fsync einschließlich Verzeichnis unter Linux; sauberes SIGTERM schreibt den letzten Stand. Socket-Verbindungen selbst werden neu aufgebaut, statt Betriebssystem-Sockets zu speichern.

Bei hartem Prozessabbruch/Stromausfall kann der Fortschritt seit dem letzten Checkpoint fehlen. Inkompatible zukünftige Regel-/Speicherformatänderungen benötigen Migration; der Server darf solche Dateien nicht stillschweigend löschen. Vor jedem Release Kompatibilität prüfen. `.before-update` wird beim nächsten sauberen Stop ersetzt und ist kein Ersatz für regelmäßige versionierte Backups.

Vor Rollback Dienst stoppen und **die zum alten Release gehörende Sicherung** separat sichern/wiederherstellen, Besitzer `zlyfer:zlyfer`, Rechte 0600. Keine neuere Sicherung mit älterem Code erzwingen. Spielstanddateien enthalten private Sitzungstoken: nicht veröffentlichen oder ins Repo legen.

## Abnahme durch den Betreiber

- `/usr/local/bin/node deploy/check-duo-health.cjs` im Repo und `/usr/local/bin/node deploy/check-online.cjs https://autohextd.zlyfer.net`.
- Zwei Browser verbinden, laufende Kampfwelle starten, signiertes Tag-Update auslösen. Beide Browser verbinden neu; Gold, Türme, Gegner und Wellenfortschritt bleiben erhalten, keine doppelte Belohnung.
- Dienststatus/Journal und private Checkpoints prüfen. Testweise Neustart und Wiederherstellung eines Backups durchführen.
- Lokale Node-Tests laufen ohne Browser; systemd, PHP-FPM und Proxy müssen auf Debian geprüft werden. Eine PHP-Laufzeit und systemd standen in der Windows-Entwicklungsumgebung nicht zur Verfügung.

Referenzen: https://socket.io/docs/v4/server-options/ und https://socket.io/docs/v4/client-api/ (Client-Bundle, Origin-Prüfung, Acknowledgements und Wiederverbindung).
