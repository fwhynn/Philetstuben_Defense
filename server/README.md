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
