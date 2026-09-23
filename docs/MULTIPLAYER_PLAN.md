# Autohex TD – Duo „Zwillingsfestungen“: Umsetzung und Betrieb

Stand: 21.09.2026. **Lokaler Zwei-Map-Prototyp umgesetzt; Online-Multiplayer weiterhin geplant.**

Der Nutzer hat die Duo-Richtung mit zwei eigenen Maps, gemeinsamer Lebensleiste, Portal-Verstärkung und Lieferungen gewählt. Dieses Dokument konkretisiert die Umsetzung. Zahlen, Einschränkungen und Infrastrukturentscheidungen unten sind empfohlene Ausgangswerte, keine bereits erprobten Balancewerte. Die verworfene Variante mit gemeinsamer Map und wechselndem Karten-Platzierungsrecht ist nicht mehr das Ziel.

Zusätzlich festgehalten: **späterer 1-gegen-1-Modus, in dem die Spieler die Plättchen für die andere Person auswählen.** Dazu Abschnitt 14. Dieser Modus gehört nicht zur ersten Duo-Version.

## 1. Empfehlung und Umfang

Wir bauen privaten Online-Koop für genau zwei Personen. Jeder spielt seine eigene Map mit eigenem Deck, Gold und Loadout. Ein zentraler Spielserver berechnet beide Kämpfe und den gemeinsamen Run. Niemand muss auf seinem PC einen Server starten oder Ports freigeben.

Erste öffentliche Ausbaustufe: eine als solche bezeichnete **Freunde-Beta**, per Einladung, ohne Matchmaking oder Rangliste. Vorher ein lokaler Spielprototyp und ein geschlossener Online-Test. Solo und tägliche Solo-Karawane bleiben eigenständige Modi und auch ohne Multiplayer-Backend nutzbar.

Enthalten: zwei Maps, gemeinsame HP, gleichzeitige Wellen, Portal-Verstärkung, Lieferungen, Partneransicht, Pings, private Lobby, Link/Code, Wiederverbinden, nachvollziehbarer Runabschluss. Später: Duo-Karawane, zusätzliche Duo-Regeln, öffentliche Partien und PvP.

**Wichtigste Reihenfolge:** spielbare Regeln und trennbare Simulation → lokaler Duo-Prototyp → echte Serverpartie → Lobby/Einladungen → Reconnect/Persistenz → Lieferungen und vollständiger Fortschrittsablauf → Hosting/Härtung → Freunde-Beta.

## Entwicklungsstand 21.09.2026 – lokaler Duo-Prototyp

Etappe 1 ist begonnen, noch nicht abgeschlossen. Im bestehenden Solo-Spiel wird bereits das DOM-freie Modul `../classes/run-runtime.js` verwendet: Spawn-Aufträge enthalten nur Zeitpunkt, Gegnerindex und Quellkoordinaten/-richtung. Keine Callbacks mehr im Runzustand. Der Controller rekonstruiert die Wegdaten beim Ausführen; Reihenfolge, Abstände und bisheriger Zufallsstrom bleiben erhalten.

`HexRandom.create` liefert weiterhin eine aufrufbare Funktion, ergänzt um `snapshot()`. `HexRandom.restore` setzt denselben Zufallsstrom aus einem versionierten Zustand fort; auch der separate Minen-Zufall lässt sich so sichern. Automatisierte Tests prüfen unabhängige Warteschlangen zweier Runs, JSON-Wiederaufnahme und exakte Fortsetzung beider Zufallsströme ohne DOM.

Weiterer Baustein umgesetzt: DOM-freie Run-Factory und laufende Kampf-Simulation in `run-runtime.js`; der Solo-Controller verwendet beide. `headless-core.cjs` lädt dieselben Regeln in Node ohne DOM, Storage oder Renderer (vorübergehender VM-Adapter für die bestehenden Scriptmodule). `run-snapshot.js` speichert versionierte interne Checkpoints für Wave- und abgeschlossene Bauphasen inklusive Map-/Set-Metadaten, Sonderzahlen und RNGs. Ein Controller-Adapter stellt diese wieder her. Inzwischen ebenfalls ausgelagert: Platzierung, Wave-Start/-Ende und vollständige Phasenübergänge; Platzierungs- und aktive Erfolgsmeldungs-Checkpoints sind inzwischen umgesetzt. Kauf-/Upgrade-Commands und persistente offene Angebote sind inzwischen ausgelagert. Nicht unterstützte Phasen werden ausdrücklich abgelehnt. Der Profil-Download im Hauptmenü ist kein Run-Snapshot. Die darauf aufbauende lokale Duo-Session ist inzwischen umgesetzt; Lobby, Einladungen und Serverbereitstellung fehlen weiterhin.

Weiterer Schritt umgesetzt: `rewards.js` hält normale Karten-, Wächter-, Shrine- und Entfernungsangebote als reine Daten im Runzustand. Rungebundene Angebots-IDs, Phase/Wave und Kontext schützen vor veralteten oder doppelten Auswahlen. Snapshot/Restore unterstützt diese offenen Angebote ohne Neuwürfeln; Controller rendert das gespeicherte Angebot erneut. `tower-commands.js` übernimmt validierte atomare Turmkäufe (auch Mehrfachbau) und Upgrades für Solo und Node. 223 automatisierte Tests bestanden.

Weiter umgesetzt: `placement-commands.js` prüft und setzt Hexe ohne DOM, inklusive Zwei-Fronten-Start, Sonderfeld-Anschluss, Einkommen und Kartenverbrauch. Solo verwendet diese Regeln. Das dynamische Rettungshex liegt pro Run im Zustand statt im globalen Kartenkatalog. Platzierungs-Checkpoints werden unterstützt. Rettungstunnel sind ebenfalls DOM-freie, speicherbare Run-Aktionen. 229 Tests bestanden.

Weiter umgesetzt: `run-flow.js` übernimmt Kartenziehen inklusive Redraw/Rettungshex/Tunnelangebot, Wave-Start mit normalen Gegnern und beiden Bossarten sowie Abschlussabrechnung. Solo verwendet diese Regeln. Abrechnung prüft ausstehende Gegner/Spawns und zahlt eine Wave nur einmal aus. Headless-Test setzt einen JSON-Checkpoint bis zum nächsten Kartenziehen identisch fort. 233 Tests bestanden.

Weiter umgesetzt: `run-session.js` steuert Wächterketten, normale Kartenbelohnungen, optionale Entfernung jede sechste Wave, aufeinanderfolgende Shrines, nächste Vorbereitung und bestätigbare Erfolgsmeldungen ohne DOM. Solo verwendet diese Übergänge. Erfolgsmeldungen behalten ihren Inhalt im Runzustand und sind vor Bestätigung per Checkpoint wiederherstellbar. Headless-Tests laufen über komplette Waves und prüfen identische Fortsetzung jeder Belohnungsphase. 236 Tests bestanden.

Lokaler Zwei-Map-Prototyp umgesetzt: `duo-session.js` koordiniert zwei getrennte Runs mit 40 Team-HP, unabhängigen Zufallsströmen, Gold und Decks. Beide müssen ihre Vorbereitung abschließen und bereit sein; dann startet die Wave gemeinsam. Eine früh fertige Seite wartet ohne Abschlussauszahlung. Erst nach beiden Kämpfen beginnen Belohnungen und Vorbereitung. Leaks beider Maps ziehen Team-HP ab; Niederlage beendet beide Runs. Commands prüfen Spielerindex, Wave und bereits verarbeitete Aktions-IDs. Interne JSON-Checkpoints sichern beide Maps, Bereitschaft und Wartephase. 241 automatisierte Tests bestanden.

`duo-prototype.html` ist eine separate lokale Entwicklungsansicht: beide Seiten am selben Gerät bedienen, Karten platzieren/drehen, Türme und Gebäude bauen/verbessern, Belohnungen wählen, bereit melden, 1×/2× und einen Checkpoint im geöffneten Tab merken/laden. Eigene SVG-Ansicht; kein Zugriff auf Solo-Profil oder Diamanten. Kein vollständiger Ersatz der Solo-Oberfläche, noch keine Base-Upgrades, Verkäufe oder Lieferungen. Portal-Verstärkung ist inzwischen verfügbar. Der Checkpoint ist kein dauerhafter Spielstand und endet mit dem Tab. Kein Hintergrund-Catch-up in dieser lokalen Testansicht.

Portal-Verstärkung im lokalen Prototyp umgesetzt: freien Slot reservieren, eigenen Turm wählen, Konfiguration beim Wellenstart kopieren. Nach sauberem Abschluss erfolgt die Ankunft nach 1,5 Spielsekunden nur auf einer noch kämpfenden Map. Zielbiom, Zieltile und lokale Schmiede gelten. Kein kopiertes Kampfgedächtnis; Gastturm nicht verbesserbar/verkaufbar. Schaden zählt separat beim Sender, Killgold beim Empfänger, einschließlich Gastminen. Gäste und Minen verschwinden am Teamabschluss/Teamtod; ausstehende Ankünfte werden verworfen. Checkpoint-Version 2 hält Auswahl, Verzögerung und Unterstützungsstatistik fest. Ein reservierter Slot ist für normalen Bau gesperrt, bis die Reservierung aufgehoben wird. Auswahl und Portalstatus sind in der lokalen Oberfläche bedienbar.

Map-Umschalter umgesetzt: eine große Map, Auswahl von Spieler 1/2, Partnerphase/Bereitschaft und Hinweis auf unterwegs befindliche Verstärkung. Beide Runs simulieren weiter; Kamera pro Map bleibt erhalten. Der lokale Prototyp bleibt endlos und schaltet keinen Solo-Profilfortschritt frei.


Duo-Servergrundlage umgesetzt: server/duo-room.cjs bindet Sitzungen an feste Spielerplätze; exakte Aktionsschemata, Match-Epoche, Sequenz, Wave/Phase und begrenzte Rate. Netzwerkansichten verbergen Seeds, Ziehreihenfolgen, Partnerhand und unerforschte Eventtypen; Angebots-IDs werden gehasht. Lokaler HTTP-Testadapter mit zwei echten Clients. Noch keine Online-Spieloberfläche, automatische Ticksteuerung, Lobby, Einladungen, Reconnect oder Hosting. 253 Tests bestanden, keine Browsertests.


- Duo-Serverprototyp mit Frontend verbunden: node server/start-duo.cjs startet auf 127.0.0.1:8090 und gibt zwei Spielerlinks aus. Server simuliert automatisch in 50-ms-Schritten; Client zeigt Netzwerkansicht, eigene Bauaktionen und lesbare Partner-Map. Legale Platzierungen und Biome vom Server. Derselbe SVG-Renderer, keine Client-Kampfberechnung. Verlorene Kaufbestätigung wird mit identischer Sequenz wiederholt. Netzwerkmodus ohne lokale Reset-/Checkpoint-/Tempokontrolle; vorerst 1× und feste Start-Loadouts. Noch keine Internet-Lobby oder Neustart-Persistenz. 256 Tests bestanden, keine Browsertests.


- Duo-Lobbys umgesetzt: Startseite mit Erstellen/Beitreten, zehnstelligem Einladungscode und kopierbarem Link im Spiel. Zwei feste Plätze, Sperre von Aktionen vor Partnerbeitritt, atomarer Beitritt und idempotente Wiederholung bei verlorener Antwort. Maximal acht getrennte Räume; Inaktivitätsablauf und begrenzte Anfragerate. Launcher gibt jetzt Lobby-Adresse aus, keine Sitzungstokens. Noch nur Loopback, kein Internet-Hosting oder dauerhafter Reconnect. 260 Tests bestanden, keine Browsertests.

Nächster Arbeitsschritt: Trennungs-/Wiederverbindungsregeln samt sichtbarem Verbindungsstatus und Wiederbeitrittsfenster umsetzen. Die aktuelle HTTP-Verbindung ist ein lokaler Entwicklungsadapter, noch kein Produktionshosting. Lobby/Einladungen, Wiederverbinden und Hosting folgen. Noch keine spielbare Onlinepartie.

## 2. Was im vorhandenen Projekt bereits hilft – und was fehlt

Diese Bestandsaufnahme beruht auf dem Code, nicht auf älteren Inhaltszahlen in den READMEs.

| Vorhanden | Bedeutung für Multiplayer |
|---|---|
| Vanilla-JS-Frontend, Three.js plus SVG, neun Turmtypen | Darstellung und Inhalte können bleiben; kein neuer Spielmotor erforderlich. |
| DOM-freie Regelmodule wie `combat.js`, `map.js`, `buildings.js`, `waves.js` | Gute Basis für dieselben Regeln in Solo und auf dem Server. |
| `game.js` verbindet Aktionen, Runsteuerung, UI und Timer | Muss vor einer verlässlichen Onlinepartie schrittweise aufgeteilt werden. |
| Seedbasierter Zufall in `random.js` | Wiederholbarkeit sowie versioniertes snapshot/restore vorhanden; Einbindung in einen vollständigen Run-Serializer noch offen. |
| `spawnQueue` mit deklarativen Aufträgen | Bereits durch `run-runtime.js` ersetzt; als JSON speicherbar, vollständige Run-Wiederaufnahme noch offen. |
| `state.mineRandom` ist eine Funktion; `Map`, `-Infinity` und Referenzen kommen im Zustand vor | Eine JSON-Kopie des jetzigen `state` genügt ausdrücklich nicht. |
| Hintergrundtimer und lokale Spielgeschwindigkeit | Im Online-Modus darf allein der Server Spielzeit fortschreiben; Clients animieren nur. |
| Browserprofil und Diamanten in `localStorage` | Keine überprüfbare Online-Identität oder manipulationssichere Freischaltungshistorie. |
| Run-Statistiken und Stufe-4-Upgrades | Übernehmen, aber Gastturm-Beiträge und Spielerzuordnung erweitern. |
| `serve.cjs` liefert statische Dateien | Noch kein Lobby-, Sitzungs- oder Spielserver. |
| Dokumentiertes nginx/PHP-Tag-Deployment | Belegt einen Web-Deployment-Weg, aber nicht die Verfügbarkeit eines dauerhaften Node-Prozesses. |

Referenzen im Repository: [Architektur](ARCHITECTURE.md), [Controller](../classes/game.js), [Kampf](../classes/combat.js), [Zufall](../classes/random.js), [Profil](../classes/profile.js), [Deployment-Beschreibung](../README.md#deployment).

## 3. Verbindliche Spielregeln für den ersten Prototyp

### 3.1 Eigene Maps, gemeinsames Ergebnis

- Zwei Spieler, zwei Koordinatenräume; `(0,0)` auf Map A ist ein anderes Feld als `(0,0)` auf Map B.
- Eigenes Gold, Deck, Hand, Loadout und eigene Tower-/Gebäude-Upgrades. Kein abwechselndes Kartenlegen.
- Zunächst Standardfestung und ein Ausgang pro Map. Zwei-Fronten und weitere Heroes werden erst nach dem Grundbalancing zugeschaltet.
- Startvorschlag: zusammen 40/40 Team-HP aus zweimal Standardfestung. Durchbrüche auf beiden Maps senken denselben Pool.
- Wellenzahl und Spielzeit sind gemeinsam; beide Maps erhalten zunächst dieselbe Gegnerliste und denselben nominellen Spawn-Zeitplan. Aufteilung auf eigene Eingänge folgt der eigenen Map.
- Map-, Deck-, Wege- und Kampfzufall erhalten getrennte, speicherbare Zufallsströme. A und B bekommen unterschiedliche Map-/Deck-Seeds aus einem gemeinsamen Match-Seed.
- Gegnerzahl zunächst je Map wie Solo; keine pauschale Verdoppelung innerhalb einer einzelnen Map. Verstärkung wird anschließend separat balanciert.
- Jeder entscheidet über seine eigenen Kartenbelohnungen. Die turmspezifischen Kartenpools hängen nur am eigenen Loadout; ein geliehener Gastturm schaltet keine Karten frei.

### 3.2 Rundenablauf ohne Wartefalle

1. Beide erledigen ihre Belohnungen und platzieren jeweils ihr nächstes Hex.
2. Beide bauen, setzen ihren Portalplatz und wählen ihren Verstärkungsturm.
3. Beide melden sich bereit. Jede Änderung an kampfrelevanten Vorbereitungen hebt die eigene Bereitschaft auf.
4. Nach beiderseitiger Bereitschaft läuft ein kurzer, abbrechbarer Countdown; der Server startet beide Maps auf demselben Tick.
5. Bauen und Upgraden während des eigenen Kampfes bleibt grundsätzlich wie bisher möglich.
6. Sobald eine Map alle vorgesehenen Spawns abgearbeitet und alle Gegner erledigt oder durchgelassen hat, endet dort der Kampf. Bei null Durchbrüchen ist Verstärkung möglich.
7. Der fertige Spieler kann die andere Map anschauen und pingen. Neue Kartenbelohnungen und die nächste Bauphase beginnen erst, wenn beide Kämpfe abgeschlossen sind.
8. Abschlussgold und Einkommen werden pro Map genau einmal vergeben; danach folgen persönliche Belohnungen, gegebenenfalls Lieferungen und anschließend die nächste Vorbereitung.

Keine Karte- oder Congratulations-Overlays über einer noch laufenden Partner-Rettung. Gemeinsame Erfolgsmeldungen erscheinen nach dem Team-Wellenabschluss und den relevanten Entscheidungen.

Team-HP von null beendet beide Maps. Schäden und Heilereignisse desselben Simulationstakts werden in definierter Reihenfolge als Team-Ereignisse verarbeitet; keine Abhängigkeit davon, welche Map zufällig zuerst aktualisiert wurde.

### 3.3 Verstärkung: der Kern des Modus

- Jeder markiert vor dem Start einen eigenen, tatsächlich gebauten Turm als Verstärkungsturm.
- Der Empfänger reserviert einen freien regulären Turmplatz als Portalplatz. Das nutzt bestehende Geometrie und vermeidet neue Platzierungsregeln. Dieser Platz ist während der Wave für normalen Bau gesperrt; zwischen Waves kann die Reservierung verschoben/aufgehoben werden.
- Ohne Portalplatz kann gespielt werden, aber es gibt einen sichtbaren Hinweis, dass dort keine Hilfe eintreffen kann. Gerade am Anfang ist die knappe Platzwahl eine Balancefrage für den Prototyp.
- Turmtyp, Zweig, Endstufe, Ultimate und Angriffsfokus werden beim Wellenstart kopiert. Änderungen am Original wirken erst auf die Verstärkung der nächsten Wave.
- Der ausgewählte Originalturm darf bis zum Team-Wellenende nicht verkauft werden. Dadurch kann niemand einen teuren Gastturm sichern und die Investition sofort zurücknehmen.
- Nach einem sauberen Abschluss erscheint nach vorgeschlagenen 1,5 Spielsekunden eine temporäre Kopie auf der anderen Map, sofern dort noch gekämpft wird.
- Sauberer Abschluss: Spawnqueue vollständig abgearbeitet, keine lebenden Gegner einschließlich aktivierter Bosse, null Durchbrüche dieser Wave. Absichtliches Durchlassen erzeugt keine Verstärkung.
- Der Gastturm startet mit leerem Kampfgedächtnis: keine kopierten Minen, Seelen, Projektile oder bereits angesparten Cooldown-Vorteile.
- Empfänger-Biom, Empfänger-Tile und Empfänger-Gebäudebuffs gelten am Einsatzort. Ursprüngliche Standortboni werden nicht mitkopiert. Allgemeine persönliche Run-Segen zunächst ebenfalls nicht zusätzlich übertragen; diese Regel muss im Hinweis stehen.
- Gastturm kostet beim Empfänger kein Gold, kann nicht verkauft, verbessert oder erneut als Verstärkung ausgewählt werden. Er ist kein normaler Loadout-Besitz.
- Gold für auf der Empfänger-Map getötete Gegner geht ausschließlich an den Empfänger. Gastturmschaden zählt als Unterstützung für den Sender; keine doppelte Kill- oder Bossbelohnung.
- Minen und Geister aus dem Gastturm tragen eindeutige Eigentümer-IDs und verschwinden zusammen mit ihm am Team-Wellenende.
- Wenn beide Maps vor der Ankunft fertig werden, wird die ausstehende Verstärkung verworfen. Pro Sender und Wave maximal eine Ankunft, auch nach Reconnect.

Früh mit Archer und Freeze entwickeln, anschließend sämtliche neun Turmtypen prüfen. Insbesondere Minenleger, Nekromant und Feuer-Elementturm dürfen keine Sonderfälle ohne Tests bleiben.

### 3.4 Lebenspunkte, Base-Ausbau und Heilung

Es gibt exakt einen Team-HP-Zustand; die beiden Maps dürfen nicht jeweils selbst eine abweichende Kopie weiterrechnen.

Mauern werden aus dem Gold ihres Besitzers bezahlt, erhöhen aber Team-Maximum und aktuelle Team-HP um ihren normalen Betrag. Jede Base behält ihren eigenen Ausbauzähler. Base-Waffen stehen lokal und wirken nur auf ihrer eigenen Map. Shrine-Heilung heilt den Team-Pool einmal; ein Ersatz-Goldbonus bei vollen HP geht an den Besitzer des Shrines.

Bei späteren Heroes wäre das gemeinsame HP-Maximum die Summe der Start-HP beider Heroes plus gekaufter Mauer-Boni. Diese Erweiterung folgt erst, wenn die Standardfestungen funktionieren.

### 3.5 Lieferungen und Wächter

Nach jeder fünften gemeinsam überlebten Wave wählt jeder eine kostenlose Lieferung für den Partner. Für die erste vollständige Version: ein Goldpaket oder eine von zwei für das Empfänger-Loadout gültigen Hexkarten. Paketwert und Raritäten stehen in eigener Duo-Konfiguration; sie werden nicht ungeprüft aus Solo übernommen. Der Empfänger muss keine zweite Auswahl bestätigen. Die Karte kommt ins Deck und in den Ablagestapel, nicht rückwirkend in die bereits gezogene Hand.

Lieferungen besitzen eine einmalige ID und werden vor dem Ziehen der nächsten regulären Hand abgeschlossen. Technischer Testwert für Gold: 20, ausdrücklich zu balancieren. Turm-Baupläne außerhalb des Loadouts folgen später.

Entdeckte Wächter werden im Duo zunächst als ausstehende Herausforderung vorgemerkt. Beide stimmen der Aktivierung zu; danach kämpfen sie auf der Entdecker-Map in der nächsten gemeinsamen Wave. Eine Ablehnung verschiebt die Aktivierung, sie entfernt den Wächter nicht. Reguläre Bosswellen laufen unverändert nach dem Duo-Wellenplan.

Die erste Online-Alpha kann Wächter deaktivieren, solange Zustimmung und Belohnungen noch fehlen. Für die vollständige Freunde-Beta müssen sie integriert sein oder im Modus sichtbar als ausgenommen bezeichnet werden. Bei gemeinsamen Wächterbelohnungen genau ein eindeutig identifiziertes Angebot pro Spieler; der bisherige Solo-Bossabschluss darf nicht zusätzlich auszahlen.

### 3.6 Geschwindigkeit, Pause und Kommunikation

- Zunächst 1× und 2×. Später 4× bis 8× erst nach Server-Lasttests; der Solo-Regler bleibt davon unberührt.
- Jeder nennt ein Wunschtempo; aktiv ist der kleinere Wert. Der Server entscheidet, alle Clients zeigen den gemeinsamen Wert.
- Jeder kann eine Pause anfordern. Nach einer Pause setzen beide auf „Weiter/Bereit“ zurück; kein einseitiges Überstimmen.
- Pings: Hilfe hier, Portal hier, diesen Turm/Schutztyp brauche ich, Wächter aktivieren. Begrenzte Frequenz, keine Chatpflicht.
- Partnerkarte über einen Umschalter, keine zwei dauerhaften 3D-Ansichten. Kamerapositionen je Map lokal merken.

## 4. Lobby und Einladung aus Sicht der Spieler

### 4.1 Einstieg und Erstellung

„Spielen“ → „Duo“ → „Lobby erstellen“ oder „Code eingeben“. Keine zusätzliche lange Erklärungskarte im Hauptmenü.

Beim ersten Online-Einstieg vergibt der Server eine anonyme Gastidentität mit wiedererkennbarer Sitzung. Der Spieler wählt nur einen Anzeigenamen. Kein E-Mail-Konto als Einstiegshürde; Name ist keine Identitätsprüfung.

Beim Erstellen legt der Server einen privaten Raum mit zwei Plätzen an und reserviert den ersten für den Ersteller. Angezeigt werden Modus, zwei Spielerplätze, Loadouts, Verbindung, ein Einladungscode und „Link kopieren“. Auf unterstützten Geräten zusätzlich „Teilen“. Dieser Button öffnet die Geräte-Teilenfunktion, verschickt nicht selbst Nachrichten.

### 4.2 Einladung und Beitritt

- Ein Kurzcode, beispielsweise acht gut unterscheidbare zufällige Zeichen, führt zur Lobby.
- Zusätzlich ein Einladungslink, etwa `https://autohextd.zlyfer.net/#duo=<einladung>`; nur ein geplantes URL-Format, kein heute funktionierender Link.
- Der Link enthält einen zufälligen Einladungsschlüssel, niemals den Eigentümer- oder Reconnect-Schlüssel. Fragment nach erfolgreichem Einlösen aus der Adresszeile entfernen.
- Einladung verfällt zunächst nach 30 Minuten, kann neu erzeugt oder widerrufen werden und erlaubt nur den freien zweiten Platz. Beitrittsversuche werden begrenzt.
- Link öffnen → Name prüfen → Lobby beitreten. Ein vorhandener aktiver Solo-Run wird nicht still verworfen; Moduswechsel deutlich bestätigen oder zurückgehen.
- Voller Raum, abgelaufene Einladung, inkompatible Version und gestartete Partie erhalten unterschiedliche Fehlermeldungen.
- Kein freies Nachrücken fremder Personen nach Matchstart. Ein Wiederbeitritt gehört an die ursprüngliche Spieleridentität.

### 4.3 Start der Partie

Beide wählen ihre fünf Türme und prüfen das Partner-Loadout. Änderungen setzen Bereitschaft zurück. Der Lobby-Ersteller bestimmt die freigegebenen Modusoptionen; im ersten Prototyp gibt es nur einen festen Duo-Regelsatz.

Wenn beide bereit sind, friert der Server Loadouts und Moduskonfiguration ein, prüft Regel-/Protokollversionen und startet die Ladephase. Beide Clients bestätigen, dass ihre Darstellung bereit ist. Erst dann öffnet die erste Bauphase. Ein fehlgeschlagenes Laden führt nach vorgeschlagenen 60 Sekunden in die Lobby zurück; kein Spieler startet allein mit laufender Wave.

Der Ersteller ist nur Lobby-Verwalter, **nicht der Rechner, der das Match hostet**. Sein Verbindungsabbruch wird während der Partie genauso behandelt wie der des Partners.

## 5. Hosting- und Framework-Entscheidung

### 5.1 Zentraler Server statt Spieler als Host

Empfehlung: autoritativer Node.js-Spielserver. Er berechnet beide Maps, validiert jeden Kauf und jede Platzierung, erzeugt Zufall und entscheidet über Gold, Schaden, Wave-Ende und Ergebnis. Browser und spätere Mobile-App schicken Aktionen und zeigen bestätigte Zustände an.

Das vermeidet Host-Wechsel bei App-Unterbrechungen, Router-Konfiguration bei Spielern und voneinander abweichende Browser-Simulationen. Ein reiner Weiterleitungsserver wäre billiger zu beginnen, würde aber die wichtigen Konsistenzprobleme auf die Clients verlagern.

Als Netzwerkgrundlage empfehle ich **Colyseus**, nicht eine vollständig selbst gebaute Raumverwaltung. Räume, begrenzte Teilnehmerzahl und Reconnect-Unterstützung sind bereits vorgesehen. Die Implementierung pinnt eine gemeinsam getestete SDK-/Server-Version; sie übernimmt nicht blind Beispiele älterer Hauptversionen. [Colyseus: Räume](https://docs.colyseus.io/room)

Colyseus verwaltet Transport und synchronisierte Ansichten; unsere Spielregeln bleiben davon unabhängig. Seine Schema-Synchronisation unterstützt serverseitige Zustandsänderungen und Änderungsübertragung. Das ist kein Ersatz für unsere Aktionsvalidierung oder dauerhafte Speicherung. [Colyseus: Zustandssynchronisation](https://docs.colyseus.io/state)

Runtime-Vorschlag: Node.js 24 LTS, vor Implementierungsbeginn auf Sicherheitsstand und Kompatibilität prüfen und eine Version festsetzen. Neue Server-/Protokollmodule in TypeScript; kein notwendiger Komplettumbau des bestehenden JS-Frontends. Node empfiehlt LTS-Versionen für Produktionsbetrieb. [Node.js: Releases](https://nodejs.org/en/about/previous-releases)

### 5.2 Konkrete Anfangstopologie

```text
Browser A / Browser B / spätere Mobile-App
                  │ HTTPS + WSS
                  ▼
         nginx mit TLS-Zertifikat
           ├── statische Web-App / versionierte Assets
           └── Online-API + Colyseus-Spielserver
                         ├── private Lobby/Match-Räume
                         ├── je Match: Map A + Map B + Teamzustand
                         └── SQLite auf persistentem Datenträger
```

Zunächst ein dauerhaft laufender Serverprozess, eine Region nahe den ersten Spielern und eine kleine persistente Datenbank. Ein Prozess bedient mehrere Matches; kein Container pro Partie. Kein Redis, Kubernetes oder Mehrregionenbetrieb für die erste Version.

**Noch zu prüfen:** Hat der vorhandene Webserver Zugang zu einem dauerhaft laufenden Node-Prozess und zur nginx-Konfiguration? Der Plan setzt dies nicht voraus. Wenn ja, eigener Dienst neben dem Webangebot mit Ressourcenbegrenzung. Wenn nein, separater kleiner Linux-VPS beziehungsweise dauerhafter Containerdienst; das bestehende Webangebot kann bleiben. Eine vorgeschlagene Startgröße von 2 vCPU/4 GB ist nur eine Messbasis, keine Zusage zur Anzahl paralleler Partien.

Für denselben Host bevorzugt `/online/` als Proxy-Pfad unter der Spiel-Domain; Pfadweiterleitung, SDK-Endpunkt und alle HTTP-Matchmaking-/WebSocket-Routen müssen zusammen getestet werden. Auf getrenntem Host kann eine eigene Multiplayer-Subdomain verwendet werden; dann Origin-/Sitzungsregeln ausdrücklich konfigurieren. Keine Spielerseite greift direkt auf die Datenbank zu.

nginx muss WebSocket-Upgrades durchreichen; Heartbeats und Proxy-Timeouts müssen auch in langen Baupausen zusammenpassen. [nginx: WebSocket-Proxy](https://nginx.org/en/docs/http/websocket.html)

Colyseus lässt sich als normale Node-Anwendung betreiben; der Produktions-Build wird vor dem Start kompiliert, TLS liegt am Proxy, und ein Prozessmanager überwacht den Dienst. Wir wählen zunächst systemd oder einen Container mit Neustartregel, nicht mehrere konkurrierende Prozessmanager. [Colyseus: Deployment](https://docs.colyseus.io/deployment)

### 5.3 Kosten und Kapazität

Vor einer Bestellung Anbieter, Region und laufendes Budget konkret auswählen; dieser Plan bestellt nichts und setzt keine aktuellen Anbieterpreise voraus. Monatliche Kosten bestehen aus Rechenleistung, Traffic, persistentem Speicher/Backups und gegebenenfalls Monitoring. Betrieb und Updates sind ebenfalls Aufwand.

Kapazität wird mit realistischen Zwei-Map-Runs gemessen: fortgeschrittene Waves, große Karten, Minen, Seelen und 2× Tempo. Für den ersten privaten Test kleine Match-Obergrenze, zum Beispiel zwei bis vier gleichzeitige Partien. Erst nach Messung erhöhen. Hohe Gegner-/Minenzahlen dürfen nicht still gekürzt werden, um eine Kapazitätszahl zu halten.

## 6. Technische Struktur im Repository

### 6.1 Regeln, Sitzung und Oberfläche trennen

```text
core/                               neue DOM-freie Run-/Duo-Steuerung
  run.mjs                     ein eigener Map-Run
  match.mjs                   zwei Runs + gemeinsamer Lebenszyklus
  commands.mjs                validierte Aktionen
  snapshot.mjs                versionierte Speicherung/Wiederherstellung
  modes/solo.mjs, duo.mjs      unterschiedliche Regeln, dieselben Grundsysteme

client/                          lokale Darstellung und Bedienung
  session-local.*             Solo-/lokaler Testadapter
  session-online.*            Online-Adapter und SDK-Anbindung
  lobby.*                     Vorbereitung und Einladung

server/                       außerhalb des öffentlichen Web-Verzeichnisses
  src/rooms/duo-room.ts       Raum, Sitzungen, Tick-Steuerung
  src/api/                    Gastidentität, Einladungen, Wiederaufnahme
  src/persistence/            Checkpoints, Ergebnis- und Zustelljournal
  tests/                      echte Server-/Client-Integrationstests
```

Das sind Zielpfade, keine bereits existierenden Module. Bestehende Regeln schrittweise importierbar machen; während des Übergangs dürfen dünne Kompatibilitätsadapter bestehende globale APIs bedienen. Kein kopierter zweiter Satz von Tower- oder Kampfregeln im Server.

Ein kleiner Build-Schritt für SDK/TypeScript ist gerechtfertigt. Das Frontend benötigt dafür weder React noch einen Enginewechsel. Bestehendes Asset-Index-Deployment bleibt, wird aber um reproduzierbare Client-/Server-Builds ergänzt. Auslieferbare Dateien und Servercode werden getrennt gepackt.

### 6.2 Drei verschiedene Zustandsarten

| Zustand | Beispiele | Zuständig |
|---|---|---|
| Autoritativer Spielzustand | Map, Türme, Gold, Gegner, Team-HP, Phasen, Zufall, Spawn-Aufträge | Server bzw. lokale Solo-Simulation |
| Netzwerkansicht | erkundete Karte, sichtbare Gegner, erlaubte Angebote, bestätigte Aktionsnummern | aus Spielzustand abgeleiteter Serializer |
| Lokale UI | Kamera je Map, Hover, Drag-Vorschau, Auswahl, Tooltip, Soundlautstärke | jeweiliger Client |

Keine Kamera-/Hover-Zustände in gemeinsamen Snapshots. Renderer dürfen das empfangene Spielmodell nicht verändern; bestehende Hover-Schreibzugriffe wandern in den UI-Zustand.

Alle Objekte brauchen stabile IDs mit Match-, Board- und Besitzbezug. Statistikreferenzen eines Gastturms verweisen auf Sender und Originalturm, ohne eine Objekt-Referenz auf die andere Map vorauszusetzen.

### 6.3 Aktionsvertrag

Beispiele: `PlaceTile`, `BuildTowers`, `UpgradeTower`, `SellTower`, `SetTargetPriorities`, `BuyBuilding`, `UpgradeBase`, `ChooseReward`, `SetPortal`, `SetReinforcement`, `ChooseDelivery`, `SetReady`, `SetTempo`, `RequestPause`, `Ping`.

Eine Aktion enthält `commandId`, Verbindungs-/Match-Epoche, erwartete Phase/Wave und die notwendigen Objekt-IDs. Die authentifizierte Sitzung bestimmt den Spieler; eine vom Client behauptete Besitzer-ID ist keine Berechtigung.

Der Server prüft Typen, Wertebereiche, Besitz, Loadout, Run-Freischaltungen, Gold, Preise am Zielort, Phase und aktuelle Legalität. Er liefert Bestätigung oder eine verständliche Ablehnung. Doppelte `commandId` bewirkt keine zweite Ausgabe; veraltete Aktionen aus einer früheren Wave werden abgelehnt.

Mehrfachbau bleibt atomar: erst alle Slots und Gesamtkosten prüfen, dann alles oder nichts bauen. Der Client darf beim Ziehen sofort Vorschauen zeigen, aber keinen verbindlichen Goldabzug oder echten Tower vor Serverbestätigung erzeugen. Bei Ablehnung verschwindet die Vorschau mit Begründung.

### 6.4 Simulation und Synchronisierung

- Ausgangspunkt: feste Schritte von 50 ms Spielzeit. 20 Netzwerkaktualisierungen pro Sekunde als zu messender Startwert, nicht an die Bildrate gebunden.
- Bei 2× werden je 50 ms Echtzeit zwei Simulationsschritte ausgeführt; bei späterem 8× acht. Keine doppelte Skalierung durch den bisherigen `gameSpeed`-Multiplikator.
- Monotone Serverzeit; Gegnerbewegung und Schaden kommen ausschließlich vom Server. Auf Clients keine zweite wirtschaftlich relevante Kampfberechnung.
- Clients interpolieren Positionen zwischen bestätigten Zuständen. Bauaktionen benötigen keine komplizierte Kampf-Rollback-Technik.
- Beide Board-Ansichten zunächst synchronisieren, nur eine rendern. Wenn Messungen zu viel Traffic zeigen: nicht betrachtete Map auf Teamübersicht reduzieren und beim Wechsel einen vollständigen freigegebenen Snapshot senden.
- Ereignisse wie Treffer, Portalankunft und Sounds besitzen IDs. Nach Reconnect kein erneutes Abspielen alter Effekte.
- Kartenangebote und Reihenfolge des Nachziehstapels werden unterschieden: sichtbare Angebote dürfen zum Partner, verborgene Deckreihenfolge, unerforschte Events und RNG-Zustände bleiben auf dem Server.
- Der Netzwerkzustand ist ausdrücklich kein ungefilterter Persistenz-Snapshot. Auch im kooperativen Modus soll ein Blick in Netzwerkdaten nicht den Nebel aufheben.
- Bei Lastüberschreitung keine unbounded Aufholschleife und keine übersprungenen Schadensschritte: neue Räume begrenzen, Warnung messen und gegebenenfalls das Match kontrolliert technisch pausieren.

## 7. Verbindung, Abbruch und Mobile

### 7.1 Zustände

Lobby: `WAITING → PREPARING → LOADING → IN_MATCH → RESULTS → CLOSED`.

Match: `PREPARE → COUNTDOWN → WAVE → TEAM_REWARDS → PREPARE`, mit klaren Unterbrechungen `PAUSED`, `RECONNECTING`, `SUSPENDED`, `FINISHED`.

Jede Map hat zusätzlich `FIGHTING` oder `CLEARED`; ein einzelnes `CLEARED` darf den gemeinsamen Rundenabschluss nicht auslösen.

### 7.2 Unterbrechungen

| Fall | Vorgeschlagenes Verhalten |
|---|---|
| Kurzer Paket-/Verbindungsfehler | Automatisch erneut verbinden; keine optimistischen Käufe weiter annehmen. |
| Server erkennt Spielerausfall | Gemeinsame technische Pause, sichtbarer Status für den Partner, zunächst 120 Sekunden Wiederbeitrittszeit. |
| Spieler kommt zurück | Vollständiger aktueller Zustand, neue Verbindungsepoche, bestätigte Aktionen abgleichen; beide bestätigen Fortsetzung. |
| Frist läuft ab | Partie aussetzen oder geordnet abbrechen; kein Ersatzspieler und keine automatische Bot-Übernahme im MVP. |
| Beide schließen die App | Ausgesetzter Run bleibt ab Persistenz-Etappe zunächst 24 Stunden wiederaufnehmbar. |
| Browser nur im Hintergrund, Verbindung intakt | Server läuft weiter; bloßes Verbergen des Tabs pausiert nicht automatisch. |
| Mobile-OS suspendiert Verbindung | Dieselbe Ausfall-/Reconnect-Regel; nach Rückkehr Snapshot statt lokaler Zeitnachholung. |
| Lobby-Ersteller geht vor Matchstart | Kurze Rückkehrfrist, danach Verwaltung an verbleibenden Spieler; alte Einladung widerrufen. |
| Doppelter Tab derselben Person | Nicht als zweiter Spieler zählen; explizite Sitzungsübernahme mit neuer Epoche statt gleichzeitiger Steuerung. |

Die Servererkennung ist nicht augenblicklich: Heartbeat-Frist und letzter bestätigter Tick sind maßgeblich. Das UI darf keine rückwirkende Schadensfreiheit versprechen. Manuelle Pause, technische Pause und Warten auf Belohnungen haben getrennte Ursachen, damit ein Reconnect keine Benutzerpause aufhebt.

Colyseus bietet automatische und tokenbasierte Wiederverbindung, wenn der Server den Platz reserviert. Das hilft bei Netzwerkwechseln und Reloads, stellt aber allein keinen Run nach einem Serververlust wieder her. [Colyseus: Reconnection](https://docs.colyseus.io/room/reconnection)

### 7.3 Mobile-taugliche Bedienung

Link plus manuell eingebbarer Code; Share-Button mit Kopieren-Fallback. Portal, Partnerwechsel und Verstärkungsauswahl funktionieren per Tap, nicht nur per Hover oder Rechtsklick. Touch-Ziele mindestens ungefähr 44 CSS-Pixel; Details aufklappbar. Kein permanenter Split-Screen und keine zweite aktive WebGL-Szene.

Die native Verpackung und Plattformkonten sind eine spätere Arbeit. Der Serververtrag muss nicht davon abhängen, ob ein Client Browser, WebView oder App ist. Deep-Link/App-Link-Zuordnung kommt mit der App-Veröffentlichung; der Browserlink funktioniert zuerst.

## 8. Speicherung, Wiederaufnahme und Fortschritt

### 8.1 Speichern ist eine Voraussetzung, kein späteres Extra

Persistenzformat ab Etappe 1 versionieren: Regelversion, Match-/Boardzustände, IDs, RNG-Zustände, Spielzeit, deklarative Spawn-Aufträge, ausstehende Angebote, Lieferungen, Team-HP und Bestätigungsnummern. `Map` explizit kodieren, Funktionen entfernen, `-Infinity` etwa als eindeutigen „noch nie geschossen“-Wert abbilden. Abgeleitete Graphen und Rendererobjekte werden beim Laden neu aufgebaut.

Verbindungsausfall bei laufendem Prozess: aktuellen In-Memory-Zustand erhalten. **Serverneustart ist ein anderer Fall:** persistierten Checkpoint laden, beide Besitzer über stabile Gastidentität autorisieren und neue Raum-/Reconnect-Zugangsdaten ausstellen. Alte SDK-Reconnect-Tokens allein können einen verlorenen Raum nicht rekonstruieren.

Für die Beta dauerhaft speichern: Lobby-/Mitgliedschaftszuordnung, letzter gemeinsamer sicherer Wellenstart, technische Aussetzung und endgültiges Ergebnis. Crash-Wiederherstellung darf zunächst an den letzten gesicherten Wellenstart zurückspringen; das wird offen angezeigt. Kein Versprechen, nach einem Maschinenabsturz jede Millisekunde zu erhalten. Gegnerzufall wird durch den gespeicherten Zustand reproduziert.

Checkpoint und zugehöriger Aktionsstand werden atomar zusammen gespeichert. Bereits zugestellte Entscheidungen/Ergebnisse haben eindeutige IDs. Der Checkpoint darf nicht mit einem späteren Gold- oder Lieferungsjournal vermischt werden und dadurch doppelt auszahlen.

SQLite genügt für den einzelnen Anfangsprozess; gespeicherte Daten liegen außerhalb austauschbarer Release-Verzeichnisse. Regelmäßige Backups und tatsächlicher Wiederherstellungstest vor Beta. Mehrere unabhängige Serverprozesse benötigen später eine andere gemeinsame Speicherung/Koordination.

### 8.2 Fortschritt bewusst in zwei Vertrauensstufen

**Technische Alpha:** keine dauerhafte Diamantenauszahlung, eigene Teststatistiken. Bestehendes Solo-Profil wird nicht verändert.

**Private Freunde-Beta:** bestehende lokale Freischaltungen dürfen als validierter, aber nicht beweisbarer Besitz-Snapshot mitgebracht werden. Werte müssen im Katalog existieren; der Server berechnet Preise und Kampfwerte selbst. Das verhindert ungültige Spielaktionen, beweist aber nicht, dass ein Spieler seine Diamanten ehrlich erspielt hat. Daher keine Rangliste und keine Behauptung manipulationssicherer Profile.

Für Beta-Auszahlungen erzeugt der Server ein festes Ergebnis pro `(matchId, playerId)` und speichert es dauerhaft einmalig. Abrechnung nach Team-Erfolg, nicht nach Schadensanteil. Eigenständige Duo-Rekorde und Meilensteine; Wiederverbinden oder Map-Anschauen zahlt nicht erneut aus.

Der lokale Client übernimmt ein Ergebnis zusammen mit dessen ID idempotent. Die bisher auf 100 Einträge begrenzte Solo-Abrechnungshistorie genügt hierfür nicht unverändert; Duo-Empfangsbelege müssen über ihren gesamten Gültigkeitszeitraum erhalten bleiben, und mehrere Tabs dürfen nicht gegeneinander schreiben. Ein Serverbeleg macht `localStorage` trotzdem nicht fälschungssicher. Geräteübergreifende Wallet-Synchronisierung ist nicht Teil dieser Beta.

**Vor öffentlichem Wettbewerb/PvP mit Wertung:** serverseitig geführtes Online-Profil, transaktionale Diamantenbuchungen, Online-Arsenal und gebundene Wiederherstellungsidentität. Import alter Offline-Freischaltungen ist eine ausdrücklich festzulegende Kulanz-/Migrationsregel, kein überprüfbarer Beweis. Offline-Solo-Fortschritt bleibt erhalten; er wird nicht still überschrieben oder als verifiziert ausgegeben.

Abgebrochene Runs dürfen höchstens den dokumentierten Ertrag vollständig abgeschlossener Team-Waves erhalten; keine Siegesprämie und kein Serverfehler als normale Niederlage. Details vor Beta in der Duo-Belohnungstabelle festlegen.

## 9. Sicherheit und klare Zuständigkeiten

Auch eine Freunde-Beta braucht grundlegende serverseitige Regeln:

- Private Räume nicht öffentlich auflisten. Ein „privat“-Flag ersetzt keine Zugangsprüfung; alle Beitrittswege, auch direkter Beitritt per Raum-ID, validieren Einladung oder bestehende Mitgliedschaft.
- Kryptographisch zufällige Sitzungs-/Einladungsschlüssel. Kurzcodes begrenzen, ablaufen lassen und gegen schnelles Durchprobieren schützen; Raum-ID nicht als alleinige Berechtigung verwenden.
- Zwei Sitzplätze atomar vergeben; ein dritter gleichzeitiger Join darf nie durchrutschen. Keine Neubelegung während der Reconnect-Frist.
- Gastidentität über sichere Sitzung, keine privaten Schlüssel in freigegebenen Links, Namen oder Logs. Persistierte Reconnect-Daten nicht mit der Einladung verwechseln.
- HTTPS/WSS, zugelassene Origins, Sitzungsprüfung und Schutz zustandsändernder HTTP-Routen; Cookie-/Origin-Konfiguration für einen späteren App-Client gesondert prüfen.
- Größen-/Frequenzgrenzen für Nachrichten, Pings und Raum-Erstellung, begrenzte inaktive Räume, validierte Anzeigenamen als Text statt HTML.
- Identische Commands nach Reconnect nicht erneut ausführen. Veraltete SDK-Warteschlangen nicht blind in eine neue Wave einspielen; eigene Outbox mit Bestätigung/Verfall einsetzen.
- Protokoll-, Schema- und Regelversion prüfen. Bei Inkompatibilität vor Join/Resume eine verständliche Aktualisierungsaufforderung zeigen.

## 10. Umsetzung in Etappen mit überprüfbaren Abschlüssen

Jede Etappe ergibt einen separat prüfbaren Stand. Größen S/M/L sind relative Aufwände, keine zugesagten Termine. Die Engine-Entkopplung und Persistenz sind die größten Unsicherheiten.

| Etappe | Umfang / konkrete Arbeit | Abhängigkeit | Fertig, wenn … | Größe |
|---|---|---|---|---|
| 0 | Duo-Regelvertrag, IDs/Kommandos, Referenz-Runs und Performance-Baseline; Hosting-Möglichkeiten klären | keine | Varianten und Grenzen schriftlich klar, bestehende Tests als Ausgangsbasis erfasst | S |
| 1 | Runsteuerung aus `game.js` lösen; speicherbaren RNG/Spawnqueue bauen; lokale Session-Schnittstelle, versionierter Snapshot | 0 | kompletter Solo-Testlauf ohne DOM; Speichern/Laden produziert denselben weiteren Regelzustand; Solo-Bedienung bleibt erhalten | L |
| 2 | Lokaler Duo-Prototyp: zwei unabhängige Runs, Team-HP, Ready/Wave-Barriere, Portal und echter Gastturm, Map-Umschalter | 1 | ein Spieler räumt früher, seine Hilfe beeinflusst tatsächlich den Partnerkampf; kein doppelter Abschluss | M–L |
| 3 | Colyseus-Spike, dann autoritativer Raum; zwei lokale Netzwerkclients; Commands, ACKs, IDs, Projektionen und Netzwerkansichten | 1–2 | zwei Clients sehen denselben Matchzustand; fremde/ungültige/doppelte Aktionen werden abgelehnt | L |
| 4 | Private Lobby, Gastidentität, Code/Link, Sitzreservierung, Loadouts, Lade-Handshake, mobiletaugliches UI; Reconnect-Minimum | 3 | zwei Personen kommen per Einladung bis in eine echte Online-Wave; dritter Join und abgelaufene Einladungen sicher behandelt | M |
| 5 | Vollständiger Reconnect, Pause, Checkpoints, Resume nach Serverneustart, Session-Übernahme, Versionierung | 1, 3–4 | Netzwerkwechsel, Reload und definierter Servercrash ohne verwaiste Plätze oder doppelte Belohnung wiederherstellbar | L |
| 6 | Lieferungen, Wächter-Zustimmung, sämtliche Gastturmtypen, gemeinsame Feier/Ergebnisansicht, Duo-Statistik, Beta-Abrechnung | 2–5 | ein vollständiger längerer Run einschließlich Boss, Hilfe, Geschenk und Ergebnis funktioniert | M–L |
| 7 | Staging/Produktionsbetrieb, WebSocket-Proxy, dauerhafte Daten, Monitoring, Lasttests, Versionsschutz, Upgrade-/Rollback-Ablauf | erster Spike ab 3; Abschluss nach 5–6 | zwei externe Geräte spielen stabil; Neustart/Backup-Wiederherstellung und Kapazitätsgrenzen sind geprüft | M–L |
| 8 | Geschlossene Freunde-Beta, gemeinsame manuelle Abnahme, Balanceanpassungen, schrittweise Freischaltung | 7 | Portalhilfe tritt regelmäßig sinnvoll auf; keine offenen kritischen Zustands-/Auszahlungsfehler | laufend |

**Warum diese Reihenfolge:** Etappe 2 beweist den eigentlichen Duo-Spielspaß. Etappe 3 prüft früh das Servermodell. Schöne Lobby-Menüs vor einem funktionierenden Zwei-Map-Kampf würden die größte Unsicherheit nicht lösen. Reconnect und Speicherung müssen vor längerem Online-Spielen fertig werden, nicht nach der Beta.

Ein kleiner Deployment-Test wird bereits in Etappe 3 auf Staging gemacht. Etappe 7 ist die Betriebsabnahme, nicht der erste Kontakt mit dem echten Hosting.

Empfohlene erste Arbeitspakete innerhalb Etappe 1: (1) neue Run-Instanz ohne DOM und Profil-Singleton, (2) Spielzeit und RNG explizit, (3) Spawn-Aufträge als Daten, (4) Käufe/Platzierung als Commands, (5) Snapshot-Rundlauf, (6) Solo-UI über lokalen Session-Adapter. Noch keine Lobby neben halb entkoppeltem Zustand bauen.

## 11. Test- und Abnahmeplan

Automatisiert ohne Browser:

- Alle bisherigen Regeltests; Solo, Karawane, Mehrfachbau und Drag-Aktionen bleiben Regressionsthemen.
- Derselbe Seed plus dieselbe Commandfolge führt zur gleichen Fortsetzung nach Snapshot/Restore; RNG-Ströme zweier Maps beeinflussen sich nicht.
- Besitz-/Preis-/Phasenvalidierung; parallele Käufe, doppelte Commands, Batch-Abbruch bei einem belegten Slot.
- Unterschiedliche Kampfendzeiten, Boss noch lebendig, Spawnqueue noch offen, Leaks, Teamtod, gleichzeitiger Abschluss, Gastturm mehrfach angefordert.
- Gastturm mit allen Typen/Zweigen/Stufe 4, Zielbiom/Schmiede, Minen, Seelen, Lebenszyklus und korrekter Statistik.
- Lieferung genau einmal, auch bei Sender- oder Empfänger-Reconnect und Checkpoint-Wiederherstellung.
- Echte Headless-Netzwerkclients gegen gestarteten Testserver: Lobbyrennen, Versionkonflikt, Serverneustart, Wiederbeitritt, verspätete/duplizierte Nachrichten und absichtlich verzögerte Verbindungen.
- Keine unerforschten Events, Zufallszustände oder Drawpile-Reihenfolgen im Netzwerksnapshot.
- Lasttests bei 1×/2×, Karten-/Gegner-/Minenwachstum und mehreren Räumen; CPU, RAM, Tickverspätung und Traffic aufzeichnen.

Zielwerte für die erste Messung: Server-Tickarbeit im gesamten Prozess mit deutlicher Reserve unter 50 ms, vorzugsweise p95 unter 25 ms bei freigegebener Raumzahl; gewöhnliche Aktionsbestätigung p95 unter 250 ms in der Testregion; Wiederbeitritt möglichst innerhalb weniger Sekunden nach wiederhergestellter Verbindung. Das sind Abnahmekriterien zum Prüfen, keine bereits gemessenen Ergebnisse.

Visuelle und Geräte-Abnahme durch den Nutzer, keine eigenständigen Browsertests ohne ausdrücklichen Auftrag: zwei Browser/Computer, Smartphone mit Touch, Partnerwechsel, Portalplatz, Einladungslink, Reload, App-Wechsel, WLAN-/Mobilfunkwechsel, lange Baupause, Verkauf/Upgrade während Kampf und mehrere vollständige Runs.

Spielerische Kriterien: Verstärkung kommt nicht ausschließlich an, wenn die andere Wave ohnehin schon vorbei ist; zwei sinnvolle Loadout-Spezialisierungen sind möglich; der langsamere Spieler hat weiterhin aktive Entscheidungen; Karten-/Goldlieferungen fühlen sich hilfreich an. Bei Problemen erst Spawnrhythmus, Verzögerung und Gastturmwirkung abstimmen, nicht sofort weitere Systeme ergänzen.

## 12. Deployment und laufende Pflege

Der bisherige Tag-Webhook tauscht ein Checkout aus und installiert Frontend-Abhängigkeiten. Ein laufender Matchprozess darf nicht mitten in einer Partie unkontrolliert auf neue Regeln wechseln.

1. CI baut und testet einen unveränderlichen Release mit Client, Server und passender Regelversion.
2. Release in Staging prüfen; Produktionsdaten nicht verwenden.
3. Neue Lobbys während eines kleinen Wartungsfensters stoppen; aktive Runs am nächsten sicheren gemeinsamen Punkt speichern/aussetzen. Ein endloser Run darf ein Update nicht unbegrenzt blockieren.
4. Dienst kontrolliert ersetzen, Health-/Ready-Prüfung durchführen, Schema-/Snapshot-Kompatibilität prüfen.
5. Clients auf passende Version bringen und kompatible Matches fortsetzen. Inkompatible gespeicherte Runs nicht still mit neuen Regeln laden; für frühe Beta nur kompatible Updates oder vorab kommunizierten geordneten Abschluss erlauben.
6. Bei Fehlern alten Release mit passender Datenmigration zurücknehmen; keine ungetestete Datenbank-Rückwärtsmigration.

Während aktiver Partien bleiben versionierte Client-Assets erreichbar. Ein simpler Seiten-Refresh darf nicht automatisch einen inkompatiblen Code mit einem alten laufenden Raum verbinden.

Erfassen: aktive Räume/Spieler, Join-Fehler, Reconnect-Erfolg, Tickdauer/-Rückstand, RAM/CPU, Traffic, abgewehrte Commands, Snapshot-/Datenbankfehler und doppelte Abrechnungsversuche. Logs über Match-/Command-IDs korrelieren; keine Sitzungsgeheimnisse protokollieren. Gesundheitsprüfung und Alarm bei Dienst-/Speicherausfall, regelmäßige Wiederherstellungsprobe.

Wachstum erst nach Messung: weitere Prozesse/Worker und gemeinsame Speicherung/Room-Zuordnung, anschließend weitere Regionen. Nicht einfach denselben In-Memory-Dienst mehrfach hinter einen zufälligen Loadbalancer stellen.

## 13. Offene Punkte und festgelegte Arbeitsannahmen

| Punkt | Arbeitsannahme, bis bessere Information vorliegt |
|---|---|
| Bestehendes Hosting | Dauerhafter Node-Dienst nicht nachgewiesen; separater kleiner Server bleibt Fallback. |
| Erste Zielgruppe | Private Freunde-Beta, zunächst eine europäische Region; keine öffentlichen Warteschlangen. |
| Größenordnung | Wenige gleichzeitige Partien, feste Aufnahmegrenze aus Lasttest. |
| Profile | Vorhandene lokale Freischaltungen in privater Beta vertrauensbasiert; Online-Wertung später mit Serverprofil. |
| Erste Schwierigkeit | Standardfestungen, je ein Ausgang, 1×/2×, vorläufig 40 Team-HP. |
| Spiellänge | Regulärer endloser Duo-Run; Wiederaufnahme wichtig. Ein Test-Meilenstein wie Wave 15 ist kein endgültiges Siegziel. |
| Portal | Reservierter vorhandener Slot; im lokalen Prototyp prüfen, ob die Platzknappheit früh Hilfe verhindert. |
| Ausfallwiederherstellung | Laufender Prozess: aktueller Stand; Prozessverlust: letzter sicherer gespeicherter Wellenstart. |

Keine Kontenpflicht, kein Plattform-SDK und kein bezahltes Hosting wird allein durch dieses Dokument aktiviert. Für den Start der Implementierung sind die technischen Voreinstellungen ausreichend; Hostingzugang und Budget werden vor tatsächlichem Deployment benötigt.

## 14. Zukunftsidee: 1 gegen 1 mit gegnerischer Plättchenwahl

**Vom Nutzer vorgegebener Kern:** Zwei Personen spielen gegeneinander und wählen die Plättchen für die jeweils andere Person aus. Noch nicht umgesetzt, nicht Bestandteil des Duo-MVP.

Später zu entscheiden: Wählt der Gegner genau ein Plättchen oder mehrere Angebote? Wer dreht und platziert? Wie werden unspielbare Angebote abgefangen? Was entscheidet den Sieg, wie lang dauert eine Partie, und soll der Arsenal-Fortschritt normalisiert werden?

Erster prüfbarer Vorschlag, noch keine festgelegte Regel: Beide wählen gleichzeitig aus einem begrenzten Angebot eine Karte für den Gegner; der Empfänger bestimmt Rotation und legalen Platz. Der Server muss einen gültigen Fortgang gewährleisten. Die Epic-Sackgasse darf zum Beispiel nicht das letzte offene Ende erzwingen; nötigenfalls legales Ersatzangebot statt Softlock.

Dafür wiederverwendbar: Lobby/Einladung, zwei getrennte Boards, Besitzprüfung, Commands, Ready-Barrieren, Snapshot/Resume und Ergebnisverwaltung. Unterschiedlich: eigene Lebenspunkte, gegnerische Sichtrechte, Karten-Zuweisung, Sieg-/Zeitregeln. Diese Unterschiede gehören in einen eigenen Modus, nicht in Sonderbedingungen überall im Duo-Code. Vor gewertetem PvP sind serverseitige Profile und strengere Integritätsregeln Pflicht.

## 15. Nächster konkreter Schritt

**Etappe 5 abschließen:** Lokale Trennungspause und persistente Wiederaufnahme sind umgesetzt. Als Nächstes folgen explizite Sitzungsübernahme/Verlassen und kontrollierte Versionswechsel. Danach Etappe 6 mit Lieferungen, Wächter-Zustimmung, gemeinsamen Ergebnissen und idempotenter Abrechnung. Vor Online-Freigabe fehlen produktiver Transport, Hosting, Backups, Last-/Missbrauchstests und gemeinsame Geräte-Abnahme.

Dieses Dokument wurde anhand des aktuellen Quellcodes und offizieller Framework-/Betriebsdokumentation erstellt. Bei Erstellung des Plans wurden keine Multiplayer-Komponenten implementiert. Der inzwischen umgesetzte lokale Prototyp ist oben dokumentiert; weiterhin keine Dienste eingerichtet und keine Browsertests ausgeführt.

### Fortschritt 22.09.2026: Trennungspause und Wiederbeitritt

Der nächste Teil von Etappe 5 ist umgesetzt: Anwesenheit je Sitz, zehn Sekunden Erkennung, danach zwei Minuten reserviertes Wiederbeitrittsfenster; beide Maps pausieren gemeinsam. Derselbe Sitzungstoken setzt im laufenden Prozess fort, ohne Kampfzeit nachzuholen oder bestätigte Käufe erneut auszuführen. Der Client zeigt Verbindungszustand und verbleibendes Fenster. Abgelaufene Räume bleiben gesperrt; es erfolgt keine automatische Auszahlung. Automatisierte Tests decken Pause, Rückkehr, beide getrennten Spieler, Ablauf, verlorene Bestätigung und langes Warten vor dem Lobbybeitritt ab. Noch keine Browser-Abnahme.

Nächster konkreter Schritt ist jetzt **dauerhafte versionierte Checkpoints mit Wiederaufnahme nach Prozessneustart**. Danach folgen explizite Sitzungsübernahme, produktiver Transport und Hostingabnahme. Der ältere Abschnitt 15 beschreibt den Ausgangsstand vor diesem Arbeitspaket.

### Fortschritt: persistente lokale Wiederaufnahme

Versionierte Raum- und Lobby-Checkpoints sind jetzt im lokalen Launcher aktiviert. Gespeichert werden beide Runs inklusive Zufallszustand, private Sitzungen, Lobbycode und Aktionsbestätigungen. Commands werden vor Bestätigung gespeichert, Kampfzustand jede Sekunde. Neustart pausiert bis zur Rückkehr beider Spieler. Inkompatible Dateien bleiben unverändert; Speicherausfall stoppt neue Aktionen. Das ist eine lokale Einzelprozess-Grundlage, keine Produktionsfreigabe.

**Jetzt als Nächstes:** explizite Sitzungsübernahme/Verlassen, Wiederherstellungshinweise und sichere Versionswechsel; danach Lieferungen, Wächter-Zustimmung und gemeinsame Ergebnisse/Statistik. Für die Freunde-Beta fehlen weiterhin dauerhafte idempotente Ergebnisabrechnung, produktiver Transport/Hosting, Backup-/Rollback-Prüfung, Last-/Missbrauchstests und Geräte-Abnahme. Achievements stehen separat im Meta-Progressionsplan.

### Fortschritt: explizite Sitzungsübernahme und Verlassen

Umgesetzt: Ein Netzwerkclient beansprucht seinen Sitz mit einer zufälligen Tab-ID. Ein zweiter Tab mit demselben privaten Spielerlink wird gesperrt und bietet „Sitzung hier übernehmen“ an. Übernahme erhält Run, Sitz und Aktionssequenz; danach sind Zustandsabfragen und Commands des alten Tabs gesperrt. Keine automatische Rückübernahme. Neue Sitzzuordnung wird vor Bestätigung gespeichert; normale Heartbeats schreiben sie nicht erneut. Das ist eine Bedienungssperre zwischen Tabs mit demselben privaten Token, kein Ersatz für dessen Geheimhaltung.

„Partie verlassen“ verlangt eine zweite Bestätigung am Button und beendet beide Boards ohne Diamantenabrechnung. Der Partner bekommt einen eindeutigen Hinweis; die Partie kann nicht durch Neustart wiederbelebt werden. Der beendete Raum bleibt 60 Sekunden für die Abschlussanzeige erreichbar, dann wird seine Kapazität frei. Bei verlorenem Antwortpaket ist Wiederholung idempotent. Ein bloßer Verbindungsabbruch behält weiterhin das Wiederbeitrittsfenster.

Automatisiert geprüft: zwei echte HTTP-Clients, explizite Übernahme, gesperrter alter Tab, unveränderte Aktionssequenz, idempotente Commands und Verlassen, Wiederaufnahme nach Prozessneustart, verlorene Verlassen-Antwort, später Beitritt in verlassene Lobby und Freigabe der Kapazität. Keine Browser-/Geräteabnahme.

Nächste offene Arbeit: kontrollierte Versionswechsel/Wartungsmodus, danach Lieferungen, Wächter-Zustimmung und gemeinsame Ergebnisse samt dauerhafter Abrechnung. Produktiver Transport, Hosting, Backup-/Rollback-Abnahme und Freunde-Beta bleiben offen; der Multiplayer ist noch nicht öffentlich fertig freigegeben.

### Fortschritt: kontrollierte Wartung vor Serverneustarts

Lokaler Wartungsmodus umgesetzt: neue Räume/Beitritte sperren, beide Kämpfe und Verbindungsfristen pausieren, sofort sichern, ausdrücklich fortsetzen. Steuerung über lokale Konsole oder DUO_MAINTENANCE=1 beim Start; sichtbarer Wartungsstatus in Spiel und Lobby. Tests decken mehrstündige Wartung, wiederholte Bestätigungen, wartende Lobby und Prozessneustart ohne Aufholsimulation ab. Checkpoints bleiben versionsgeprüft; inkompatible Dateien werden nicht automatisch migriert. Keine Internet-Freigabe.

Nächster spielerischer Schritt: Lieferungen nach jeder fünften gemeinsamen Welle gemäß Abschnitt 3.5, danach Wächter-Zustimmung und gemeinsame Ergebnisse. Produktionsbetrieb, automatisierter Release-/Rollback-Ablauf, Lastabnahme und dauerhafte Ergebnisabrechnung bleiben offen.

### Fortschritt: Partner-Lieferungen nach jeder fünften Welle

Im lokalen und servergesteuerten Duo-Prototyp umgesetzt. Nach jeder fünften gemeinsam überstandenen Welle erledigen beide zunächst ihre persönlichen Belohnungen. Danach schenkt jeder dem anderen kostenlos 20 Gold oder eine von zwei Hexkarten. Die Karten berücksichtigen die Turmauswahl des Empfängers, schließen Rettungskarten aus und verwenden eigene vorläufige Duo-Gewichte: Gewöhnlich 55, Ungewöhnlich 30, Selten 15. Betrag, Intervall und Gewichte stehen zentral in HexDuoSession.DELIVERY.

Eine geschenkte Karte landet im Deck und oben auf dem Nachziehstapel. Beide Lieferungen müssen zugestellt sein, bevor neue Hände gezogen werden; eine zusätzliche Empfängerbestätigung ist nicht nötig. Der Server akzeptiert nur die eigene gespeicherte Auswahl, keine frei angegebenen Goldbeträge oder Karten. Wiederholungen, verlorene Bestätigungen und Wiederverbindungen dürfen keine zweite Zustellung auslösen. Die Partneransicht enthält nur den Zustellstatus, nicht dessen noch offene Auswahl.

Duo-Checkpointversion 3 speichert Angebote und Zustellungen. Version 2 wird ausdrücklich übernommen, ohne vergangene Lieferungen nachträglich auszuzahlen; bestehende Runs erhalten das erste Geschenk beim nächsten gemeinsam abgeschlossenen Fünfer-Meilenstein. Andere inkompatible Versionen bleiben gesperrt. Automatisierte Tests prüfen Belohnungsreihenfolge, Ziehbarriere, verschiedene Empfänger-Turmauswahlen, Teilzustellung/Neustart, Manipulationsversuche und HTTP-Wiederholung. Kein Browser-/Gerätetest.

Nächste offene Schritte: gemeinsame Zustimmung vor Wächterkämpfen, gemeinsamer Ergebnisbildschirm und dauerhafte, gegen doppelte Auszahlung abgesicherte Diamantenabrechnung. Danach produktiver Transport/Hosting, Betriebs- und Lastabnahme sowie Freunde-Beta.

### Fortschritt: gemeinsame Wächter-Freigabe

Neu angeschlossene Wächter warten im Duo auf zwei Zustimmungen. Beide Spieler können ihre Zustimmung vor dem Wellenstart zurücknehmen; der Wächter bleibt dann für später erhalten. Eine Änderung setzt die Wellenbereitschaft zurück, damit niemand mit einer veralteten Auswahl startet. Freigegebene Wächter kämpfen nur auf der Entdeckerkarte in der nächsten gemeinsamen Welle. Normale Bosswellen bleiben unverändert. Stimmen liegen im gespeicherten Landmark-Zustand und werden über den servervalidierten guardian-Befehl geändert. Bestehende, bereits aktivierte Wächter in alten Spielständen bleiben aktiv.

Noch offen: gemeinsame Wächter-Belohnungen für beide Spieler, gemeinsamer Ergebnisbildschirm und dauerhafte Diamantenabrechnung, anschließend Hosting und Betriebsabnahme.

### Aktueller Stand und Weg zum Duo-MVP

Gemeinsame Erkundungswächter-Beute umgesetzt: nach gemeinsamem Wellenabschluss erhält jeder Spieler genau ein eigenes Angebot je besiegtem Wächter, passend zur eigenen Turmauswahl. Herkunftskarte und Koordinate unterscheiden auch gleich liegende Wächter auf beiden Karten. Die lokale Auswahl wird ersetzt, nicht zusätzlich ausgeschüttet. Kill-Gold bleibt beim Kampf auf der Entdeckerkarte. Reguläre Wellenboss-Belohnungen bleiben lokal. Offene Belohnungen sind bereits Teil der wiederherstellbaren Zwischenstände und verwenden die bestehende idempotente Befehlsprüfung.

Spielbarer lokaler/servergesteuerter Prototyp: private Lobby mit Code/Link, zwei eigene Karten mit Partneransicht, gemeinsames Leben, gemeinsame Wellenbereitschaft, Portal-Verstärkung, Lieferungen, Wächterzustimmung und gemeinsame Wächter-Beute. Serverseitige Befehlsprüfung, Wiederverbindung, Zwischenstände, Sitzungsübernahme, Verlassen und Wartungsmodus sind implementiert.

Bis zu einem online testbaren Freunde-MVP bleiben in dieser Reihenfolge offen:
1. Gemeinsamer Abschluss mit Sieg/Niederlage, Unterstützungs- und Turmstatistik, Rückkehr zur Lobby und sauberem Neustart.
2. Dauerhafte Ergebnisablage und einmalige Diamantenabrechnung inklusive Wiederholungen/Neustart; Profilzuordnung und Umgang mit lokalem Spielstand festlegen.
3. Serverbetrieb mit HTTPS, produktivem Transport, Konfiguration, Protokollierung und Backup/Restore; öffentliche Adressen und Kosten hängen vom gewählten Hosting ab.
4. Gesamtdurchlauf mit zwei Clients einschließlich längerer Partien, Verbindungsabbruch während Belohnungen, Wartung, Versionswechsel und Ergebniswiederaufnahme.
5. Browser-/Geräteabnahme mit zwei Spielern und begrenzte Freunde-Beta. Automatische Node-/HTTP-Tests ersetzen diese Abnahme nicht.

Aktuell kein öffentlich freigegebener Online-MVP. Konten/Freundeslisten, Matchmaking und Ranglisten sind für den ersten privaten Einladungs-MVP nicht erforderlich.

## Online-MVP: Abschluss und Betriebsübergabe (22.09.2026)

Gemeinsames Ergebnis bei Niederlage/Welle 35, Turm- und Unterstützungsstatistik, beidseitiger Neustart und dauerhaft gespeicherte Ergebnisbelege sind umgesetzt. Das lokale Profil verbucht jeden Beleg einmal; Export/Import erhält diese Kennungen. HTTPS-/Container-Vorlage, privater Public-Build, Healthcheck, schreibfreier Online-Prüfbefehl und validierte Backup-Kopie sind vorbereitet.

Verbindlicher aktueller Stand, Profilmodell, Betriebsbefehle und verbleibende Aufgaben: [Online-MVP-Übergabe](ONLINE_MVP_HANDOFF.md). Frühere „noch offen“-Listen oben sind Fortschrittsprotokolle. Live-Installation, TLS und Prüfung auf echten Browsern/Geräten sind noch offen. Die Domain ist bekannt; Hosting/Deployment-Zugang noch nicht. Keine öffentliche Freigabe behauptet.

## Lobby und gemeinsame Oberfläche (23.09.2026)

Auf `codex/multiplayer-test`: eigener Warteraum vor Spielbeginn, persistente Bereitschaft beider Spieler und serverseitige Startsperre. Duo verwendet jetzt `index.html` und `classes/game.js` inklusive 3D-Darstellung; der zusätzliche Adapter übersetzt Aktionen in Serverbefehle. Partneransicht, Portal/Verstärkung, Geschenke und Wächterzustimmung sind in diese Oberfläche integriert. Lokale Simulation ist im Netzwerkmodus ausgeschaltet. 430 automatische Tests bestanden; Browser-Abnahme steht aus. Aktuelle Schritte siehe [Übergabe](ONLINE_MVP_HANDOFF.md).
