# Zielarchitektur: stilisiertes 3D wie Dorfromantik

Das finale Spiel soll ein stilisiertes 3D-Spiel mit gut lesbaren Hexlandschaften, Straßen und Türmen werden. SVG ist die aktuelle Prototypdarstellung. Die Wahl der 3D-Engine ist noch offen.

## Bereits getrennt

- `data.js`: Karten- und Towerdefinitionen.
- `map.js`: Hexkoordinaten, Anschlussregeln, Graph und kürzeste Wege. Kein DOM.
- `random.js`: Seedbasierter Zufall.
- `waves.js`: Wave- und Economywerte.
- `combat.js`: Bewegung, Zielsuche, Schaden und Statuswirkungen. Erhält Zustand, Towerpositionen, Definitionen und Zeitschritt; gibt Sound-/Kampfereignisse über einen Callback aus. Kein DOM oder SVG.
- `sound.js`: aktuelle Audioausgabe.
- `camera.js`: DOM-freies Weltkamera-Modell plus SVG-Eingabe-/Projektionsadapter, vom Renderer verwaltet.
- `svg-renderer.js`: SVG-Kartendarstellung mit Ebenen, Picking, Vorschau, Towern, Gegnern und Effekten. Renderer liest Zustand und meldet logische Aktionen an den Controller.
- `game.js`: Runsteuerung, Aktionen und HUD inklusive SVG-Kartenminiaturen. Diese Bereiche sind noch nicht vollständig getrennt.

## Vor dem 3D-Wechsel

1. Umgesetzt: Weltkoordinaten um den Ursprung, Base bei (0,0), Geometrie/Simulation ohne Bildschirmoffset. In 3D können planare x/y-Werte auf x/z abgebildet werden; Bildschirmprojektion liegt im Kameraadapter.
2. Straßen als gemeinsame lokale Punktfolgen je Hex modellieren. Rendering, tatsächliche Weglänge und Gegnerbewegung verwenden dieselben Daten. Das ermöglicht wirklich unterschiedliche Kurven und lange Straßen.
3. Runsteuerung und Commands (Hex legen, Slot auswählen, Tower kaufen, Wave starten) von DOM-Ereignissen trennen. Renderer und HUD lesen den Zustand; sie legen keine Gameplayregeln fest.
4. Kampf-/Bauereignisse für Audio und visuelle Effekte von der Simulation ausgeben. Die aktuelle Callback-Schnittstelle ist der erste Schritt.
5. Umgesetzt für die Karte: SVG hinter Renderer-Schnittstelle, DOM-freies Kameramodell und separater SVG-Eingabe-/Projektionsadapter. 3D ersetzt Darstellung, Picking und Kameraadapter; logische Hex-/Slotreferenzen bleiben.
6. Gameplaytests gegen die Simulation weiterverwenden. Für die 3D-Implementierung zusätzlich Picking, Kamerabewegung, Darstellung und Performance prüfen.

Ein Browser-3D-Renderer kann JavaScript-Logik unmittelbar weiterverwenden. Bei einem Wechsel zu einer Engine mit anderer Sprache müssen Logikmodule portiert werden; Daten, Regeln und Tests dienen als Referenz. Ein vollständig aufwandsfreier Enginewechsel ist nicht zugesichert.

## V0.3 – Straßenmodell

`roadGeometry(tile)` liefert einen gemeinsamen Hub und Punktfolgen zu den Straßenkanten. Karte, Hover-Vorschau und Spielfeld rendern diese Daten. `routeGraph(map)` verbindet die Hubs über exakt gemeinsame Kanten, gewichtet Verbindungen nach Punktfolgen-Länge und ermittelt Distanzen zur Base. Gegner laufen dieselben Punktfolgen ab; gleich lange Alternativen bleiben gleichmäßig verteilt. Ein 3D-Renderer kann entlang dieser Punktfolgen Straßenmeshes erzeugen und planare x/y-Koordinaten auf x/z abbilden. Die Bildschirmzentrierung und UI-/Runtrennung sind weiterhin umzubauen.

## V0.3, vorheriger erster Teil

Gleichmäßige Bewegung nach tatsächlicher Länge der bestehenden Punktfolgen, Kettenblitz mit begrenzten Sprüngen und Freeze Tower sind umgesetzt. Straßen verlaufen weiterhin über Hexzentren; echte individuelle Kurvengeometrie und gewichtet kürzeste Wege sind der nächste Teil.

## V0.7 – Exploration
Sichtregion, Koordinatenhash für dynamische Landmarken, Erschließung und Bosswerte leben rendererunabhängig in exploration.js. SVG zeichnet klare/neblige Hexflächen in einem gecachten Hintergrundlayer. Ein 3D-Renderer kann dieselben axialen Sichtdaten für Terrain-/Nebelmaterialien nutzen. Bosskampf nutzt vorhandene Straßenrouten und Combat-Logik; UI/Run-Steuerung verbleibt noch in game.js.

## V0.7 – Bonusdaten und Bossbeute
Neue Hexe nutzen generische towerDamage/towerRange/income/buildingSlots-Daten. Towerwerte werden gemeinsam für Vorschau, Upgradeanzeige und Combat aufgelöst. Combat merkt Bossbelohnungen als logische Hex-IDs vor; UI verarbeitet sie erst nach Wave-Ende. Bossloot-Rarität wird rendererunabhängig ermittelt. Die SVG-Kartendarstellung wurde anschließend hinter die Renderer-Schnittstelle ausgelagert.


## Kartendarstellung hinter einer Schnittstelle

`HexSvgRenderer.create(surface, commands)` erzeugt den aktuellen Adapter:
- `render(state, placementTargets)` liest aktuellen Zustand; Placementtargets enthalten bereits geprüfte Legalität. Keine direkte Zustandsmutation durch Rendering oder Klickflächen.
- `reset()` verwirft Run-/Objektcaches für Neustarts.
- `project(position)` liefert lokale Bildschirmkoordinaten und Viewportgröße für kontextuelle HUD-Panels; der Controller benötigt kein SVG-Matrixwissen mehr.
- `destroy()` entfernt Adapterlayer und seinen Hintergrundlistener. Kamera/HUD sind separat verwaltet und werden damit nicht entsorgt.

Commands: Hex platzieren, Slot/Turm/Gebäude auswählen, Hover betreten/verlassen, Auswahl leeren. Identität besteht aus axialen Koordinaten und Slotindex. Preis-/Upgradeprüfungen bleiben Controller-/Regelaufgabe. Die Rotation/Slotpositionen werden in map.js gemeinsam von Combat, Renderer und Panelpositionierung verwendet.

Dies ist eine echte Modulgrenze für die Karte, noch keine fertige 3D-Unterstützung. Renderer nutzt weiterhin planare Geometrie mit SVG-Zentrum; Kamera und Kartenminiaturen im HUD sind SVG-spezifisch. Nächster struktureller Schritt: Weltursprung und Kamera-/Projektionsabstraktion, danach Run-/HUDtrennung. Ein 3D-Adapter braucht weiterhin Modelle, Materialien, Picking und Kamera. 73 Tests inklusive eigenständiger Renderer-Tests bestanden; visueller Regressionstest offen.


## Weltursprung und Kamera – aktueller Stand

axialToWorld(q,r) liefert planare Weltkoordinaten mit Base (0,0). Straßenrouten, Gegnerpositionen, Reichweiten und Slotpositionen nutzen diese Werte. Bildschirmoffset 545/375 gehört ausschließlich zum anfänglichen Kamerabildausschnitt (viewBox -545/-375/1100/760). Kartenminiaturen skalieren lokale Straßenpunkte um ihren eigenen Bildmittelpunkt. axialToPixel bleibt als Kompatibilitätsalias für bestehende Tests, neue Module nutzen axialToWorld.

HexCamera.create() ist DOM-frei: getView/reset/pan/zoom, begrenzte Zoomweite und gleicher Ankerpunkt beim Zoomen. HexSvgCamera kapselt Pointereingabe, SVG-Matrizen und Bildschirmprojektion. Renderer bietet zoom/resetView/getView/project, meldet ViewChanged an Controller und entfernt Kameralistener bei destroy. Neuer Run setzt Bildausschnitt und Dragzustand zurück. Noch offen: vollständige Run-/HUDtrennung, 3D-Kamera/Picking und Engineentscheidung. 78 Tests bestanden; visueller Regressionstest offen.


## 3D-Renderer (Three.js) – aktueller Stand

`three-renderer.js` ersetzt Darstellung, Picking und Kameraadapter hinter der bestehenden Renderer-Schnittstelle; Spiellogik, Daten und Tests blieben unverändert. Spielweltkoordinaten (x, y) liegen auf x/z, Modelle (Hexradius 1) werden mit 54 skaliert, Rotation entspricht 60° gegen den Uhrzeigersinn je Schritt. `model-map.js` bestimmt renderer-unabhängig, welches Modell zu welchem Tile gehört. Modellvorgaben: [ASSET_SPEC.md](ASSET_SPEC.md). Der Controller wählt den Renderer (`globalThis.HexThreeRenderer` oder SVG) und fällt bei Fehlern auf SVG zurück. Offen: Run-/HUD-Trennung, Kamerarotation, Gebäude-/Gegnermodelle, Performance bei sehr großen Karten.
