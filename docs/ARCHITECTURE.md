# Autohex TD – aktuelle Architektur

Stand: 22.09.2026, einschließlich lokaler Änderungen. Historische Zwischenstände stehen im [CHANGELOG](CHANGELOG.md).

## Laufzeit und Darstellung

Vanilla JavaScript, HTML und CSS ohne Build-Schritt. Node.js betreibt den lokalen Server und die automatisierten Tests. Three.js ist die implementierte 3D-Bibliothek; SVG bleibt alternative Darstellung und Fallback. index.html lädt die Regelmodule und anschließend den passenden Renderer sowie game.js. serve.cjs liefert statische Dateien und unter /assets/index.json die vorhandenen GLB-Modelle.

Die Spielmodule der folgenden Tabelle liegen unter `classes/`. HTML-Einstiege, `headless-core.cjs` und die Netzwerkadapter `duo-client.js`/`duo-lobby.js` liegen im Repo-Root; Servercode und dessen Tests unter `server/`.

## Verantwortlichkeiten

| Datei             | Aufgabe                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| data.js           | Karten, neun Turmtypen, Upgradezweige, Stufe 4 und Wertberechnung                                          |
| map.js            | Axiale Hexkoordinaten, Platzierung, gemeinsame Straßen- und Slotgeometrie, Routengraph                   |
| random.js         | Seedbasierte Zufallsströme mit versioniertem Snapshot/Restore                                            |
| run-runtime.js    | DOM-freie Run-Factory, Spawn-Aufträge, Wege und laufende Kampf-Simulation; vom Solo-Controller verwendet |
| waves.js          | Gegnerzusammensetzung, reguläre Bosswellen, Wave- und Goldwerte                                          |
| combat.js         | Bewegung, Zielprioritäten, Schaden, Slow, Minen und Kampfereignisse ohne DOM                             |
| rewards.js        | Heilung/Vorräte, kostenlose Loadout-Turmupgrades und alternative Boss-Runsegen                           |
| deck.js           | Ziehen und Ablegen                                                                                       |
| buildings.js      | Gebäude, Kosten, Buffs und Wirkungsbereich für Hervorhebungen                                            |
| exploration.js    | Sichtregion, seedbasierte Eventfelder, Anschluss und Erkundungsboss-/Shrine-Regeln                       |
| ui-layout.js      | DOM-freie Berechnung freier Menüflächen zwischen festen Bedienelementen                                  |
| tutorial.js       | Aktionsbasierte Tutorialschritte; Speicherung und Oberfläche im Controller                               |
| heroes.js         | Drei Startprofile, Initialisierung des Runs, Base-Upgrades und Waffenwerte ohne DOM                      |
| profile.js        | Browserprofil, Freischaltungen, Loadouts/Presets, Statistiken und Diamantenabrechnung/-prognose          |
| game.js           | Runsteuerung, Aktionen, Eingaben und HUD; noch nicht vollständig voneinander getrennt                    |
| svg-renderer.js   | SVG-Karte, Vorschauen, Klickflächen, Reichweiten und Hex-Markierungen                                    |
| three-renderer.js | Three.js-Szene, GLB-Modelle, Kamera, Raycast-Picking, Animationen, Qualität und Overlays                 |
| model-map.js      | Rendererunabhängige Modellzuordnung und Rotation                                                         |
| camera.js         | DOM-freies Pan-/Zoommodell und SVG-Eingabe-/Projektionsadapter                                           |
| sound.js          | Lokal erzeugte WebAudio-Effekte                                                                          |

## Weltgeometrie und Routing

Die Base liegt bei (0,0). Hexe, Straßen, Gegner und Turmplätze verwenden gemeinsame planare Weltkoordinaten. Three.js bildet x/y auf x/z ab und skaliert Modelle mit Hexradius 1 um Faktor 54. Straßen aus roadGeometry und Modellmittellinien werden auch für die Bewegung verwendet.

Der Routengraph enthält längengewichtete Verbindungen und Distanzen zur Base. Gegner wählen jedoch nicht ausschließlich den kürzesten Weg: Pro Einheit werden an Gabelungen zufällige, schleifenfreie Wege mit erreichbarer Base gewählt. Bewegung folgt der tatsächlichen Segmentlänge. Einheiten können sich durchlaufen und überholen; nur Gameplay-Effekte wie Freeze verlangsamen sie.

Eventformen berücksichtigen seedbasierte benachbarte Events, auch außerhalb des bereits erkundeten Bereichs. Gemeinsame Kanten haben auf beiden Seiten Straßen; bestehende Eventgeometrien bleiben beim weiteren Erkunden unverändert.

## Renderer und Eingaben

Beide Renderer bieten render, reset, project, zoom, resetView, getView und destroy. Sie erhalten Zustand und bereits auf Legalität geprüfte Platzierungsziele. Logische Commands melden Platzierung, Auswahl und Hover an den Controller. 3D bietet zusätzlich rotateView für Q/E. Kartenvorschauen im HUD bleiben SVG.

Die 3D-Kamera unterstützt Pan, Orbit, Kippen und Zoom. Mausrad-Klick dreht während der Platzierung das Hex im Uhrzeigersinn; ansonsten dient die mittlere Taste der Kamera. R bleibt verfügbar. Gebäudemarkierungen verwenden dieselbe Radiusdefinition wie die Buffregeln. G schaltet das gespeicherte Hex-Grid um. Reichweiten werden als Overlay gezeichnet, damit Nebelmodelle sie nicht verdecken.

Die Trennung ist nicht vollständig: game.js enthält weiterhin DOM und Runlogik; der 3D-Renderer schreibt aktuell auch den Turm-Hoverzustand. Der SVG-Renderer wird auf Zustandsunveränderlichkeit geprüft. Ein späterer Enginewechsel benötigt weiterhin Portierungsarbeit.

## Persistenz und Lebenszyklus

localStorage enthält das versionierte Profil mit Diamanten, freigeschalteten Türmen und Stufe-4-Upgrades, aktivem Hero und Loadout, drei Presets und Statistiken. Die letzten 100 abgerechneten Run-IDs verhindern erneute Auszahlung. Run und Profil sind getrennte Zustände, aber der laufende Run wird nicht gespeichert. Hex-Grid und Grafikqualität haben separate Einstellungen.

Diamanten werden bei Game Over abgerechnet; ein manueller Neustart zahlt den abgebrochenen Run derzeit nicht aus. Die Prognose berechnet denselben Ertrag ohne Speichervorgang. Neue Runs übernehmen Hero, Loadout und Freischaltungen, setzen Karte und Kamera zurück und verwerfen ausstehende Spawn-/Runaktionen.

Die Base-Waffe wird als zusätzliche Kampfreferenz mit eigenen Werten an combat.js übergeben. Dadurch verwendet sie dieselbe Zielsuche, Schadens- und Beuteabrechnung wie die Türme, ohne einen Loadoutplatz oder Turmstatistiken zu belegen. Base-Upgrades und Waffen-Cooldown sind ausschließlich Runzustand.

## Modelle, Performance und Prüfung

Basismodelle für Tiles, Sonderfelder, sieben Türme, fünf Gegner, drei Gebäude und Straßenminen sind eingebunden. Eigene Upgrade-Modelle fehlen. Grafikstufen, automatische Qualitätsabsenkung, Render-Taktung und gebündelte Effekte/Overlays sind vorhanden; große Karten und viele Gegner bleiben Gegenstand der Performanceprüfung.

Zuletzt 293 automatisierte Tests bestanden (22.09.2026), einschließlich HTTP-/Duo-Tests. Sie prüfen Regeln, Controller mit DOM-Ersatz, SVG-Renderer, Kamera, Modellzuordnung, Tutorial, Menüschließen und Layoutgeometrie. Sie ersetzen keinen WebGL- oder visuellen Test. Browsertests übernimmt der Nutzer, außer er beauftragt sie ausdrücklich.

## Offene technische Arbeit

Für den gewählten Duo-Modus gilt der [Multiplayer-Umsetzungsplan vom 21.09.2026](MULTIPLAYER_PLAN.md). Run-Kern, zwei Maps, Portalverstärkung, autoritativer HTTP-Server und Lobby/Einladung sind implementiert. Dauerhafte Wiederaufnahme und Internet-Hosting bleiben offen.

- Runsteuerung und HUD weiter trennen.
- Laufende Runs versioniert speichern und laden, einschließlich Zufallszustand und ausstehender Entscheidungen.
- Profil-Export/-Import ist umgesetzt (versionierte JSON-Datei, Prüfung, bestätigtes Ersetzen, lokale Sicherung). Belastbare Migrationen bei künftigen Schemaänderungen bleiben offen.
- Weitere Performance- und Balanceauswertung sowie Modelle für Upgrade-Stufen.

## Duo-Grundlage: aktuelle Grenze

`headless-core.cjs` ist ein Node-Einstieg ohne DOM oder Storage. Ein isolierter VM-Kontext lädt die vorhandenen Scriptmodule; keine duplizierten Kampfregeln. Eine spätere Umstellung auf native Modulimporte bleibt geplant. `run-snapshot.js` kodiert interne Checkpoints explizit: Map-Einträge und zusätzliche Erkundungsfelder, Sets, RNGs sowie nicht-endliche Cooldownwerte. Kein Netzwerksnapshot und kein Format für ungeprüfte Spieleruploads. Kamera-/Auswahlzustand wird ausgeschlossen.

Checkpoints gelten für laufende Waves, abgeschlossene Bauphasen und persistente offene Belohnungsangebote. Platzierungsphasen mit regulärer Hand oder runlokalem Rettungshex werden ebenfalls unterstützt. Aktive Erfolgsmeldungen mit gespeichertem Inhalt sind ebenfalls wiederherstellbar. Der Solo-Controller besitzt Capture-/Restore-Adapter; im Hauptmenü bleibt ausschließlich der separate Profiltransfer sichtbar. Tests vergleichen die Fortsetzung eines JSON-Checkpoints mit dem ununterbrochenen Lauf und prüfen getrennte Run-Instanzen.

`rewards.js` besitzt `offer`/`choose`: Angebote liegen im Runzustand und werden beim erneuten Rendern nicht neu generiert. Auswahl prüft rungebundene Angebots-ID, Phase, Wave und Quelle; erfolgreiche Auswahl verbraucht das Angebot. Die nächsten Phasen werden inzwischen von run-session.js gesteuert. `tower-commands.js` validiert Turmkäufe atomar und führt zulässige Upgrades aus; gemeinsame Nutzung durch Solo und Headless-Kern.

`placement-commands.js` validiert und mutiert Hex-Platzierungen ohne UI. `state.rescueCard` ersetzt den veränderlichen globalen Rettungskarten-Eintrag. Tunnel liegen als benachbarte IDs in `tile.tunnels`; der Straßengraph erzeugt explizite Sprungsegmente (Länge null), die Bewegung überspringt den Zwischenraum. Keine versteckte Straßenfläche für Minen.

`run-flow.js` kapselt Kartenziehen, garantierte spielbare Hand bzw. Rettungsangebote, Wave-Start und Abschlussabrechnung ohne DOM. Der Controller setzt Meldungen, Audio und Belohnungsansichten darauf auf. `lastCompletedWave` verhindert doppelte Abschlusszahlungen; ausstehende Spawns und lebende Gegner verhindern vorzeitigen Abschluss. `previewBuilding` ist reiner lokaler UI-Zustand und vom Checkpoint ausgeschlossen. Verkaufsbestätigung hält eine lokale Zielreferenz und prüft Run, Objekt und Erstattung vor dem Verkauf erneut.

`run-session.js` koordiniert die vollständige Belohnungs-/Vorbereitungsfolge als DOM-freie Zustandsübergänge und verwendet `run-flow.js`, `rewards.js` und die Platzierungs-Commands. Der Solo-Controller zeigt die resultierende Phase an. `activeCelebration` erhält den noch zu bestätigenden Inhalt im Checkpoint; Bestätigung verbraucht ihn einmalig. Node-Einstieg exportiert dieselbe Session-Steuerung. Kein Profilzugriff im Kern: bisherige Bestwave wird vom aufrufenden Adapter übergeben.

`duo-session.js` koordiniert zwei unabhängige Run-Instanzen. Der gemeinsame Takt beträgt 50 ms; Team-HP werden nach jedem Simulationsschritt und jeder erfolgreichen Aktion gespiegelt. Die Phase `duoWait` hält einen fertigen Kampf ohne vorzeitige Abschlusszahlung an. Beide abgeschlossenen Maps gehen gemeinsam in die Belohnungsfolge. Der Duo-Checkpoint umschließt zwei Run-Checkpoints und den Teamzustand; beendete Matches werden noch nicht gespeichert. Command-IDs werden pro Spieler begrenzt gespeichert, Wave und Bereitschaft geprüft. Dies ist ein lokaler Kern, keine Netzwerk-Authentifizierung.

`duo-prototype.html` und `classes/duo-prototype.js` stellen eine separate lokale Entwicklungsoberfläche mit zwei SVG-Maps bereit. Kein Solo-Profilzugriff und keine dauerhafte Speicherung. Der Netzwerkmodus nutzt `duo-client.js` und den Duo-Server. Checkpoint merken/laden hält nur eine Kopie im Tab. Responsive Anordnung und explizite Dreh-/Zoom-Buttons; noch keine vollständige mobile Abnahme. Portal-Verstärkung und Netzwerkadapter sind umgesetzt; Lieferungen bleiben offen.

Duo-Checkpoint Version 2 speichert Portalreservierung, Verstärkungswahl, Wellenstart-Kopie, ausstehende Ankunft und Unterstützungsstatistik. Gäste tragen `guestOwner`, nutzen die Zielterrain-Effekte und werden in getrennte Schadenssummen abgerechnet. Gastminen behalten die Herkunft in ihrer Schadensreferenz. Kampfgedächtnis wird nicht übertragen, Ankunft frühestens nach 1500 ms, Bereinigung am Teamabschluss/Teamtod. Der lokale Command-Adapter sperrt Portalbau und Gastupgrades; kein Verkauf im Duo-Prototyp.

Kampagnenabschluss liegt in `run-session.js`: nach abgerechneter Wave 35 eigener speicherbarer Zustand `victory`, `endless()` setzt einmalig die ausstehenden Belohnungen fort. Solo-Adapter speichert nur den Freischaltungsmeilenstein beim Sieg; Diamanten erst beim Runende. Profile normalisieren gesperrte Zwei-Fronten-Auswahl zurück auf Standard. Duo markiert seine Runs mit `duoMode` und läuft ohne Solo-Abschluss weiter. Bossbeschwörungen nutzen Simulationszeit und begrenzte Zähler im Gegnerzustand.

Duo-Servergrundlage umgesetzt: server/duo-room.cjs bindet Sitzungen an feste Spielerplätze; exakte Aktionsschemata, Match-Epoche, Sequenz, Wave/Phase und begrenzte Rate. Netzwerkansichten verbergen Seeds, Ziehreihenfolgen, Partnerhand und unerforschte Eventtypen; Angebots-IDs werden gehasht. Lokaler HTTP-Testadapter mit zwei echten Clients. Die Oberfläche verwendet diesen Adapter; automatischer Takt und Lobby/Einladungen sind implementiert. Dauerhafter Reconnect und öffentliches Hosting bleiben offen.

- Duo-Serverprototyp mit Frontend verbunden: node server/start-duo.cjs startet auf 127.0.0.1:8090 und gibt die Lobby-Adresse aus. Server simuliert automatisch in 50-ms-Schritten; Client zeigt Netzwerkansicht, eigene Bauaktionen und lesbare Partner-Map. Legale Platzierungen und Biome vom Server. Derselbe SVG-Renderer, keine Client-Kampfberechnung. Verlorene Kaufbestätigung wird mit identischer Sequenz wiederholt. Netzwerkmodus ohne lokale Reset-/Checkpoint-/Tempokontrolle; vorerst 1× und feste Start-Loadouts. Noch keine Internet-Lobby oder Neustart-Persistenz.

- Duo-Lobbys umgesetzt: Startseite mit Erstellen/Beitreten, zehnstelligem Einladungscode und kopierbarem Link im Spiel. Zwei feste Plätze, Sperre von Aktionen vor Partnerbeitritt, atomarer Beitritt und idempotente Wiederholung bei verlorener Antwort. Maximal acht getrennte Räume; Inaktivitätsablauf und begrenzte Anfragerate. Launcher gibt jetzt Lobby-Adresse aus, keine Sitzungstokens. Noch nur Loopback, kein Internet-Hosting oder dauerhafter Reconnect.


## Sprache und Menüs

`classes/translations.js` hält die deutsche Begriffsnormierung und den englischen Textkatalog. `classes/i18n.js` übersetzt ausschließlich sichtbare DOM-/SVG-Texte und Beschriftungsattribute, einschließlich dynamischer Renderer-Labels. Ein MutationObserver verarbeitet geänderte Knoten; ein begrenzter Cache vermeidet wiederholte Textarbeit. Originaltexte bleiben in einer WeakMap für verlustfreien Sprachwechsel erhalten. Eingabewerte, IDs, Profil und Simulationsdaten bleiben unverändert. Sprache wird separat unter `language` gespeichert. Neue sichtbare Texte und dynamische Fragmente im Katalog ergänzen; native Bestätigungsdialoge verwenden `HexI18n.text()`. `data-no-translate` schützt fremde oder vom Nutzer eingegebene Inhalte.

Hauptmenü, Einstellungen und Duo bieten dieselbe Sprachauswahl. Die HUD-Dropdowns bilden eine exklusive Gruppe über `menu-controls.js`. Ihre Position hängt vom jeweiligen Knopf ab, nicht von der Höhe des mittigen Tutorials.

## Responsive UI und Fortschrittsfreigaben

Die Gestaltungsgrundlage ist [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Ein gemeinsamer Flex-Header verhindert konkurrierende absolute Positionen. `ResizeObserver` misst Kopf-/Fußleisten und Hand; `ui-layout.js` reserviert freie Rechtecke in kurzem Querformat. Das siebenstufige Tutorial richtet seinen Spotlight an den aktuellen DOM-Grenzen von Leben und Wellenstart aus. Platzierungsfehler besitzen einen eigenen Textbereich. Verkaufsbestätigung ist lokaler Zustand am vorhandenen Button, kein eigener Dialog. `profile.js` prüft Festungsfreigaben anhand von `standard35` bzw. `dual35`; Auswahl und Runstart prüfen dieselbe Regel.

## Biom-Erstkontakt und Sackgassenportal

`HexBiomes.visibleTiles()` umfasst gelegte Hexe, ihre sichtbaren farbigen Nachbarfelder sowie aufgedeckte Schatz-, Schrein- und Wächterfelder mit Prefab, auch ohne Straßenanschluss. Sonderfelder zählen ab Sichtbarkeit `clear`; Fragezeichen-Silhouetten im Nebel bleiben ausgeschlossen. Die Biomleiste nutzt dieselbe Menge wie die Hervorhebung. Der erste Nicht-Grasland-Kontakt zeigt einen Hinweis, der ausschließlich über seinen Bestätigungsknopf verschwindet (kein Außenklick, Hover oder Escape); Die Bestätigung speichert pro Run die bestätigten Nicht-Grasland-IDs in `biomeIntroAcknowledgedIds`. Grasland, leere Einträge und alte alleinstehende Boolean-Markierungen unterdrücken keinen späteren Hinweis; die frühere browserweite Kennzeichnung wird ignoriert. Der Hinweis wartet nicht auf den Tutorialabschluss. Nicht-Grasland beginnt frühestens bei Hexdistanz 4 von der Basis. Der UI-Zustand `biomeIntro` bleibt außerhalb der Run-Checkpoints.

`deadEnd` besitzt zusätzlich zu zwei Turmplätzen einen exklusiven `portal`-Gebäudeplatz im Straßenmittelpunkt. Bau kostet 250 Gold; Kauf und Verkauf sind nur in der Bauphase möglich, damit laufende Spawn-Jobs ihren Eingang behalten. `HexBuildings.allowedTypes()` gilt auch für Duo und verhindert normale Gebäude auf diesem Platz sowie Portale auf normalen Gebäudeplätzen. Portale haben keine Gebäude-Upgrades oder Arsenal-Freischaltung. `spawnSources()` liefert für gebaute Portale einen zusätzlichen Eingang mit der reservierten Richtung 6; die Route beginnt am Straßenende. Die feste Wellen-Gegnerzahl bleibt unverändert und wird auf alle Quellen verteilt. Die bisherige Schutzregel für das letzte offene Straßenende bleibt bestehen.
