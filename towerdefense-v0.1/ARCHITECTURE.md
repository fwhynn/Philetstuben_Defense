# Hex Bastion – aktuelle Architektur

Stand: 20.09.2026, einschließlich lokaler Änderungen. Historische Zwischenstände stehen im [CHANGELOG](CHANGELOG.md).

## Laufzeit und Darstellung

Vanilla JavaScript, HTML und CSS ohne Build-Schritt. Node.js betreibt den lokalen Server und die automatisierten Tests. Three.js ist die implementierte 3D-Bibliothek; SVG bleibt alternative Darstellung und Fallback. index.html lädt die Regelmodule und anschließend den passenden Renderer sowie game.js. serve.cjs liefert statische Dateien und unter /assets/index.json die vorhandenen GLB-Modelle.

## Verantwortlichkeiten

| Datei | Aufgabe |
|---|---|
| data.js | Karten, sieben Türme, Upgradezweige, Stufe 4 und Wertberechnung |
| map.js | Axiale Hexkoordinaten, Platzierung, gemeinsame Straßen- und Slotgeometrie, Routengraph |
| random.js | Seedbasierte Zufallsströme |
| waves.js | Gegnerzusammensetzung, reguläre Bosswellen, Wave- und Goldwerte |
| combat.js | Bewegung, Zielprioritäten, Schaden, Slow, Minen und Kampfereignisse ohne DOM |
| deck.js | Ziehen und Ablegen |
| buildings.js | Gebäude, Kosten, Buffs und Wirkungsbereich für Hervorhebungen |
| exploration.js | Sichtregion, seedbasierte Eventfelder, Anschluss und Erkundungsboss-/Shrine-Regeln |
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

localStorage enthält das versionierte Profil mit Diamanten, freigeschalteten Türmen und Stufe-4-Upgrades, aktivem Loadout, drei Presets und Statistiken. Die letzten 100 abgerechneten Run-IDs verhindern erneute Auszahlung. Run und Profil sind getrennte Zustände, aber der laufende Run wird nicht gespeichert. Hex-Grid und Grafikqualität haben separate Einstellungen.

Diamanten werden bei Game Over abgerechnet; ein manueller Neustart zahlt den abgebrochenen Run derzeit nicht aus. Die Prognose berechnet denselben Ertrag ohne Speichervorgang. Neue Runs übernehmen Loadout und Freischaltungen, setzen Karte und Kamera zurück und verwerfen ausstehende Spawn-/Runaktionen.

## Modelle, Performance und Prüfung

Basismodelle für Tiles, Sonderfelder, sieben Türme, fünf Gegner, drei Gebäude und Straßenminen sind eingebunden. Eigene Upgrade-Modelle fehlen. Grafikstufen, automatische Qualitätsabsenkung, Render-Taktung und gebündelte Effekte/Overlays sind vorhanden; große Karten und viele Gegner bleiben Gegenstand der Performanceprüfung.

Zuletzt 133 automatisierte Tests bestanden (20.09.2026). Sie prüfen Regeln, Controller mit DOM-Ersatz, SVG-Renderer, Kamera und Modellzuordnung. Sie ersetzen keinen WebGL- oder visuellen Test. Browsertests übernimmt der Nutzer, außer er beauftragt sie ausdrücklich.

## Offene technische Arbeit

- Runsteuerung und HUD weiter trennen.
- Laufende Runs versioniert speichern und laden, einschließlich Zufallszustand und ausstehender Entscheidungen.
- Profil-Export/-Import und belastbare Migrationen bei künftigen Schemaänderungen.
- Weitere Performance- und Balanceauswertung sowie Modelle für Upgrade-Stufen.
