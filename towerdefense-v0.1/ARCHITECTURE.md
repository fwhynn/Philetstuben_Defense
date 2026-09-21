# Autohex TD – aktuelle Architektur

Stand: 20.09.2026, einschließlich lokaler Änderungen. Historische Zwischenstände stehen im [CHANGELOG](CHANGELOG.md).

## Laufzeit und Darstellung

Vanilla JavaScript, HTML und CSS ohne Build-Schritt. Node.js betreibt den lokalen Server und die automatisierten Tests. Three.js ist die implementierte 3D-Bibliothek; SVG bleibt alternative Darstellung und Fallback. index.html lädt die Regelmodule und anschließend den passenden Renderer sowie game.js. serve.cjs liefert statische Dateien und unter /assets/index.json die vorhandenen GLB-Modelle.

## Verantwortlichkeiten

| Datei | Aufgabe |
|---|---|
| data.js | Karten, sieben Türme, Upgradezweige, Stufe 4 und Wertberechnung |
| map.js | Axiale Hexkoordinaten, Platzierung, gemeinsame Straßen- und Slotgeometrie, Routengraph |
| random.js | Seedbasierte Zufallsströme mit versioniertem Snapshot/Restore |
| run-runtime.js | DOM-freie Run-Factory, Spawn-Aufträge, Wege und laufende Kampf-Simulation; vom Solo-Controller verwendet |
| waves.js | Gegnerzusammensetzung, reguläre Bosswellen, Wave- und Goldwerte |
| combat.js | Bewegung, Zielprioritäten, Schaden, Slow, Minen und Kampfereignisse ohne DOM |
| rewards.js | Heilung/Vorräte, kostenlose Loadout-Turmupgrades und alternative Boss-Runsegen |
| deck.js | Ziehen und Ablegen |
| buildings.js | Gebäude, Kosten, Buffs und Wirkungsbereich für Hervorhebungen |
| exploration.js | Sichtregion, seedbasierte Eventfelder, Anschluss und Erkundungsboss-/Shrine-Regeln |
| ui-layout.js | DOM-freie Berechnung freier Menüflächen zwischen festen Bedienelementen |
| tutorial.js | Aktionsbasierte Tutorialschritte; Speicherung und Oberfläche im Controller |
| heroes.js | Drei Startprofile, Initialisierung des Runs, Base-Upgrades und Waffenwerte ohne DOM |
| profile.js | Browserprofil, Freischaltungen, Loadouts/Presets, Statistiken und Diamantenabrechnung/-prognose |
| game.js | Runsteuerung, Aktionen, Eingaben und HUD; noch nicht vollständig voneinander getrennt |
| svg-renderer.js | SVG-Karte, Vorschauen, Klickflächen, Reichweiten und Hex-Markierungen |
| three-renderer.js | Three.js-Szene, GLB-Modelle, Kamera, Raycast-Picking, Animationen, Qualität und Overlays |
| model-map.js | Rendererunabhängige Modellzuordnung und Rotation |
| camera.js | DOM-freies Pan-/Zoommodell und SVG-Eingabe-/Projektionsadapter |
| sound.js | Lokal erzeugte WebAudio-Effekte |

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

Zuletzt 249 automatisierte Tests bestanden (21.09.2026). Sie prüfen Regeln, Controller mit DOM-Ersatz, SVG-Renderer, Kamera und Modellzuordnung. Sie ersetzen keinen WebGL- oder visuellen Test. Browsertests übernimmt der Nutzer, außer er beauftragt sie ausdrücklich.

## Offene technische Arbeit

Für den gewählten Duo-Modus gilt der [Multiplayer-Umsetzungsplan vom 21.09.2026](../MULTIPLAYER_PLAN.md). Die darin beschriebene Online-Architektur ist ein Zielbild, noch kein vorhandener Server: zuerst Runsteuerung/Simulation vom DOM trennen und versioniert speichern, dann zwei Maps lokal verbinden, danach Netzwerk, Lobby und Wiederaufnahme.


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

`duo-prototype.html`/`.js` stellen eine separate lokale Entwicklungsoberfläche mit zwei SVG-Maps bereit. Kein Solo-Profilzugriff, kein Online-Transport, keine dauerhafte Speicherung. Checkpoint merken/laden hält nur eine Kopie im Tab. Responsive Anordnung und explizite Dreh-/Zoom-Buttons; noch keine vollständige mobile Abnahme. Portal-Verstärkung ist umgesetzt; Lieferungen und Netzwerk folgen.

Duo-Checkpoint Version 2 speichert Portalreservierung, Verstärkungswahl, Wellenstart-Kopie, ausstehende Ankunft und Unterstützungsstatistik. Gäste tragen `guestOwner`, nutzen die Zielterrain-Effekte und werden in getrennte Schadenssummen abgerechnet. Gastminen behalten die Herkunft in ihrer Schadensreferenz. Kampfgedächtnis wird nicht übertragen, Ankunft frühestens nach 1500 ms, Bereinigung am Teamabschluss/Teamtod. Der lokale Command-Adapter sperrt Portalbau und Gastupgrades; kein Verkauf im Duo-Prototyp.

Kampagnenabschluss liegt in `run-session.js`: nach abgerechneter Wave 35 eigener speicherbarer Zustand `victory`, `endless()` setzt einmalig die ausstehenden Belohnungen fort. Solo-Adapter speichert nur den Freischaltungsmeilenstein beim Sieg; Diamanten erst beim Runende. Profile normalisieren gesperrte Zwei-Fronten-Auswahl zurück auf Standard. Duo markiert seine Runs mit `duoMode` und läuft ohne Solo-Abschluss weiter. Bossbeschwörungen nutzen Simulationszeit und begrenzte Zähler im Gegnerzustand.
