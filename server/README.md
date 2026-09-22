# Duo-Serverprototyp

## Lokal spielen

Vom Repository-Hauptordner starten:

    node server/start-duo.cjs

Der Prozess gibt die Lobby-Adresse aus. Dort „Lobby erstellen“ wählen und den Einladungslink im Spiel kopieren. In einem zweiten Tab/Browser den Link öffnen und „Lobby beitreten“ wählen; alternativ den zehnstelligen Code eingeben. Der Server läuft nur auf diesem Rechner (127.0.0.1:8090); DUO_PORT kann einen anderen Port festlegen. Einladungscodes geben den freien zweiten Platz frei. Die Spieleradresse nach dem Beitritt enthält den privaten Sitzungstoken und sollte nicht geteilt werden. Strg+C sichert den aktuellen Stand und beendet den Server. Beim nächsten Start können dieselben Spielerlinks wiederbeitreten.

Jeder Spieler legt sein erstes Hex, baut seine Verteidigung und meldet sich bereit. Beide Maps teilen sich 40 HP. Partner-Map per Umschalter anschauen; dort keine Bauaktionen. Portalplatz und Verstärkungsturm sind wählbar. Der feste Start-Loadout umfasst Archer, Katapult, Kettenblitz, Freeze und Minenleger. Netzwerktempo vorerst 1×. Die bestehende duo-prototype.html ohne Sitzungsfragment bleibt der lokale Ein-Gerät-Prototyp.

## Implementiert

- Server besitzt Spielzustand und Simulation. Feste 50-ms-Schritte, monotone Uhr, begrenzte Nachholschritte bei Verzögerung. Der Kampf läuft weiter, wenn ein Client im Hintergrund ist oder nicht abfragt. Bei ausbleibenden Zustandsabfragen greift die unten beschriebene Trennungspause.
- Sitzungsgebundene Spielerplätze und exakte Aktionsschemata. Vertrag: epoch, sequence, wave, phase, action, payload. Sequenzen und serverseitige Regeln verhindern veraltete oder doppelte Käufe.
- Client wartet auf Bestätigung; bei verlorenem Antwortpaket einmalige Wiederholung derselben Aktion/Sequenz. Keine lokale Kampfberechnung, kein vorgezogener Goldabzug. Statusabfrage etwa alle 100 ms, keine Interpolation bisher.
- Netzwerkansicht enthält erkundete Maps, öffentliche Kämpfe und nur eigene Hand/Angebote. Keine Seeds, Ziehreihenfolge oder interne Spawnaufträge. Legale Platzierungen berechnet der Server; der Client bekommt Ergebnisse für Karte/Rotation. Angebots-IDs werden gehasht.
- Presentation-Adapter ergänzt lokale Kamera-/Auswahlfelder; der bestehende SVG-Renderer verwendet serverseitige Biome. Partner-Map nur lesbar. Lokaler Neustart/Checkpoint/Tempo im Netzwerkmodus gesperrt.
- HTTP-Transport liefert eine feste Dateiliste, erlaubt im Browsermodus nur gleichnamige Origin und nutzt Sitzungstokens im Authorization-Header. Maximal 8 KiB pro Aktionsnachricht und begrenzte Aktionsrate. Token steht im URL-Fragment, nicht im HTTP-Pfad.

## Prüfung

    node --test --test-isolation=none tests/*.test.cjs server/tests/*.test.cjs

260 Tests bestanden, keine Browsertests. Echte Loopback-HTTP-Clients prüfen Spielertrennung, verlorene Kaufbestätigung, serverseitigen Takt ohne Abfragen und SVG-Darstellung ohne interne Geheimdaten.

## Noch offen

Private Lobbys, Einladungscodes und begrenzte Raumverwaltung sind umgesetzt. Kein Internet-Hosting. Lokale Checkpoints und Wiederaufnahme nach Prozessneustart sind umgesetzt; Details stehen unten. Kein Profilzugriff oder Diamanten-Payout. HTTP-Polling ist der Entwicklungsadapter; endgültigen Transport, Interpolation, Lastgrenzen und sichere Bereitstellung vor Freunde-Beta integrieren.

## Lobbyverwaltung

Maximal acht gleichzeitige Räume, zwei feste Plätze pro Raum. Erst nach Beitritt des Partners sind Spielaktionen erlaubt. Zehnstellige Zufallscodes mit 40 Bit Entropie; Einladung enthält nur den Raumcode, keinen Spieler-Token. Erstellen und Beitreten nutzen eine wiederverwendbare Anfragen-ID gegen doppelte Räume/Plätze bei verloren gegangenen Antworten. Gleichzeitig eintreffende Beitritte können nicht denselben Platz beanspruchen. Lobby-Endpunkte erlauben höchstens 20 Versuche je IP und Minute.

Inaktive wartende Räume laufen nach 30 Minuten aus, Räume mit zwei Spielern nach zwei Stunden ohne Clientzugriff. Sitzungen werden dann ungültig und die Kapazität frei. Regelmäßig abgefragte Räume bleiben bestehen. Lokale Speicherung ist umgesetzt; noch kein expliziter Verlassen-/Kick-Ablauf.

Weitere automatisierte Prüfungen: [Multiplayer-Testbericht](MULTIPLAYER_TEST_REPORT.md). Insgesamt 265 Tests bestanden, inklusive drei Bot-Partien und kurzer Prüfung aller acht Räume mit 16 Clients. Keine Browsertests.

## Wiederverbindung im laufenden Prozess (22.09.2026)

Umgesetzt: Authentifizierte Zustandsabfragen erneuern die Anwesenheit ausschließlich des eigenen Sitzes. Nach zehn Sekunden ohne Abfrage pausieren beide Maps; innerhalb weiterer 120 Sekunden kann derselbe Spielerlink die Partie fortsetzen. Sitz, Gold und Aktionssequenzen bleiben erhalten, es gibt kein Nachholen der pausierten Kampfzeit. Während der Pause werden neue Spielaktionen abgewiesen. Verlorene Bestätigungen bleiben mit derselben Sequenz idempotent. Nach Ablauf wird der Raum nicht wieder spielbar; eine neue Lobby ist nötig, ohne automatische Diamantenabrechnung. Der Client zeigt Pause, Rückkehrfenster und Ablauf und versucht bei Netzwerkfehlern erneut zu verbinden.

Dies ersetzt die ältere Aussage „keine Trennungspause“. Browser im Hintergrund können HTTP-Abfragen drosseln und deshalb ebenfalls eine Pause auslösen. Nächster Schritt: persistente, versionierte Checkpoints und Wiederaufnahme nach Serverneustart; danach explizite Sitzungsübernahme und Produktions-Transport. Noch kein Internet-Hosting, kein Auszahlungsdienst und keine dauerhafte Wiederaufnahme.

## Dauerhafte Wiederaufnahme (aktueller Stand)

Der Launcher speichert standardmäßig unter `~/.autohex-duo/checkpoint.json`, außerhalb der öffentlich ausgelieferten Dateien. `DUO_SAVE_FILE` kann auf einen privaten absoluten Pfad umgestellt werden. Die Datei enthält private Sitzungstokens: nicht teilen oder ins Webverzeichnis legen. Betriebssystemrechte zusätzlich passend zum Dienstkonto setzen; Modus 0600 ist auf Windows kein Ersatz für ACLs.

Erstellen, Beitreten und Commands werden vor der Antwort atomar gespeichert (temporäre Datei, fsync, Umbenennen). Die Kampfsimulation sichert zusätzlich jede Sekunde. Nach hartem Prozessverlust können bis zu etwa einer Sekunde Kampfzeit zurückgerollt werden; bestätigte Käufe sind bereits gespeichert. SIGINT/SIGTERM sichern abschließend. Die Wiederherstellung prüft Format, Snapshotversion und Spielversion; unbekannte/defekte Dateien führen zum Startfehler und werden nicht überschrieben. Schreibfehler stoppen Simulation und neue Aktionen (HTTP 503).

Beim Neustart bleiben Lobbycode, Plätze, private Spielerlinks, Aktionssequenzen und letzte Bestätigungen erhalten. Beide Spieler müssen innerhalb des neu gestarteten Rückkehrfensters zurückkommen. Bis dahin bleibt die Partie pausiert, ohne Zeit nachzuholen. Eine neue Serverinstanz wird vom Client auch bei niedrigerer Snapshotrevision erkannt. Beendete oder abgelaufene Partien werden nicht wiederhergestellt; noch keine dauerhafte Ergebnis-/Diamantenabrechnung. Der Dateispeicher ist nur für genau einen lokalen Serverprozess vorgesehen. Produktiver Mehrprozessbetrieb, Verzeichnis-Durabilität bei Stromverlust und Backup-/Betriebsabnahme bleiben offen.

## Sitzungsübernahme und bewusstes Verlassen

Aktueller Stand: Nur ein Browser-Tab kontrolliert einen Sitz. Ein weiterer Tab mit demselben privaten Spielerlink zeigt einen Konflikt; „Sitzung hier übernehmen“ überträgt die Kontrolle ausdrücklich. Der bisherige Tab erhält danach HTTP 409 und darf keine weiteren Spielaktionen senden. Ein Reload erzeugt ebenfalls eine neue Tab-ID und kann daher eine explizite Übernahme verlangen. Die Bindung wird im Checkpoint gespeichert.

„Partie verlassen“ wird am selben Button ein zweites Mal bestätigt und beendet die Partie für beide Spieler. Das ist kein vorübergehendes Trennen und zahlt keine Diamanten aus. Der Partner kann die Map noch sehen und zur Lobby zurückkehren. Nach 60 Sekunden wird der Raum entfernt, bei Serverneustart sofort nicht wiederhergestellt.

Transport: X-Duo-Client bindet Tab-ID und privaten Sitzungstoken. POST /session akzeptiert ausschließlich {action: 'takeover'} oder {action: 'leave'}. Alte tablose Entwicklungsclients funktionieren nur, solange noch keine Tab-Bindung besteht. Bei Commands wird die Bindung nach Einlesen des Bodys erneut geprüft, damit eine inzwischen erfolgte Übernahme berücksichtigt wird. Niemals Tab-ID als Authentifizierung statt des Tokens verwenden.

Noch keine Internet-Freigabe, Kontoanmeldung oder Geräte-Abnahme.

## Kontrollierte Wartung (lokaler Betreiber)

Im interaktiven Launcher: `maintenance on`, `maintenance off`, `status`. Beim Start: `DUO_MAINTENANCE=1`. Keine öffentliche Verwaltungs-HTTP-Schnittstelle.

Wartung sperrt neue Räume und Beitritte, pausiert beide Maps samt Wiederbeitritts-/Lobbyfristen und sichert sofort atomar. Statusabfragen, Sitzungsübernahme und bewusstes Verlassen bleiben möglich. Bereits bestätigte Aktionen sind weiterhin idempotent. Beide Clients und die Lobby zeigen einen Wartungshinweis.

Update-Ablauf: Wartung einschalten und Speicherbestätigung abwarten; mit Strg+C beenden; private Checkpoint-Datei sichern; kompatiblen Release bereitstellen; mit DUO_MAINTENANCE=1 starten; Status und Speicherung prüfen; Wartung bewusst beenden. Inkompatible Spiel-/Snapshotversionen bleiben ein Startfehler und überschreiben keine Datei. Für Rollback passenden alten Release und Checkpoint aufbewahren. Keine automatische Migration und keine Produktionsabnahme. Die Wartungseinstellung wird beim Start ausdrücklich gewählt und nicht dauerhaft im Spielcheckpoint gespeichert.

## Partner-Lieferungen

Nach jeder fünften gemeinsamen Welle folgen auf die persönlichen Belohnungen zwei kostenlose Partner-Geschenke: je 20 Gold oder eine von zwei für den Empfänger passenden Karten. Vor beiden Zustellungen wird keine nächste Hand gezogen. Der Befehl delivery akzeptiert ausschließlich offerId und index (0–2); Angebots-IDs kommen aus der eigenen Serveransicht. Kein clientseitiger Goldbetrag, Kartentyp oder Empfänger.

Duo-Checkpoints verwenden jetzt Version 3. Die explizite Migration von Version 2 übernimmt laufende Partien ohne rückwirkende Geschenke. Teilzustellungen und letzte Bestätigungen werden gemeinsam gesichert; erneutes Senden nach Neustart zahlt nicht doppelt aus. Nur diese Migration ist erlaubt; andere Versionskonflikte bleiben Startfehler. Vor Updates weiter Checkpoint sichern, Wartung verwenden und für Rollbacks den passenden alten Stand behalten.

## Online-MVP: Abschluss und Betriebsübergabe (22.09.2026)

Gemeinsames Ergebnis bei Niederlage/Welle 35, Turm- und Unterstützungsstatistik, beidseitiger Neustart und dauerhaft gespeicherte Ergebnisbelege sind umgesetzt. Das lokale Profil verbucht jeden Beleg einmal; Export/Import erhält diese Kennungen. HTTPS-/Container-Vorlage, privater Public-Build, Healthcheck, schreibfreier Online-Prüfbefehl und validierte Backup-Kopie sind vorbereitet.

Verbindlicher aktueller Stand, Profilmodell, Betriebsbefehle und verbleibende Aufgaben: [Online-MVP-Übergabe](../docs/ONLINE_MVP_HANDOFF.md). Frühere „noch offen“-Listen oben sind Fortschrittsprotokolle. Live-Installation, TLS und Prüfung auf echten Browsern/Geräten sind noch offen. Die Domain ist bekannt; Hosting/Deployment-Zugang noch nicht. Keine öffentliche Freigabe behauptet.
