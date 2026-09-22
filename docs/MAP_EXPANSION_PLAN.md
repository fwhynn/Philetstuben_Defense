# Eingeschlossene Straßenenden

Stand 21.09.2026: Einschluss-Schutz und erste Rettungstunnel-Version implementiert.

## Implementierter Stand

Die letzte mit der Base verbundene Front muss freien Außenraum erreichen. Flood-Fill unterscheidet Innenhöfe vom äußeren Leerraum, auch bei straßenlosen Gebäudekarten. Erreichbare vorgefertigte Sonderfelder werden im Straßennetz mitgerechnet. Die vorhandenen Anschlussregeln bleiben aktiv.

Beim Ziehen in einem bereits eingeschlossenen Run wird unabhängig von der Hand ein kostenloser Rettungstunnel angeboten. Erster Klick zeigt Koordinaten und markiert Eingang/Ausgang; zweiter Klick baut. Bestehende Tiles, Türme und Gebäude bleiben erhalten. Der Ausgang besitzt keine Bauplätze und kommt nicht ins Deck. Die Richtung weist vom bestehenden Kartenrand weg. Nach dem Tunnelbau kann in der nächsten Platzierungsphase dort weitergebaut werden.

Beide Enden tragen dieselbe Tunnelnummer. Der Graph enthält eine bidirektionale Zusatzverbindung. Erste Version: unmittelbarer Wechsel zwischen den Portalen, keine Transitdauer und keine Bewegung über die dazwischenliegenden Hexe. Minen können nur an realen Gegnerpositionen auslösen. Distanzbasierte Zielprioritäten zählen den Sprung mit Länge null. Tunnelverbindungen werden in Checkpoints erhalten. Weitere Tunnel werden nur bei erneut fehlender Außenfront angeboten.

Die folgenden Abschnitte enthalten die ursprüngliche Planung und mögliche spätere Ausbaustufen; insbesondere zeitlicher Transit und echte Brücken sind noch offen.

## Ursache

`HexMap.canPlace` verlangt einen mit der Base verbundenen offenen Eingang. Zusätzlich muss hinter diesem Eingang ein weiteres leeres Nachbarfeld liegen. Diese lokale Prüfung erkennt keine größere, vollständig von gelegten Hexen umschlossene Leerfläche. `HexMap.rescue` ergänzt passende Straßen auf genau einem freien Hex. Es kann keine belegten Hexe überbrücken und versagt deshalb, wenn der eingeschlossene Bereich keinen zulässigen Ausgang mehr zulässt. Aktuell geht das Spiel dann in die Bauphase über; Waves bleiben möglich, weitere Expansion nicht unbedingt.

## Empfohlener Schutz für neue Platzierungen

Nach einer vorgeschlagenen Platzierung mindestens eine von der Base erreichbare Straßenfront erhalten, deren freier Zielbereich mit dem äußeren freien Raum verbunden ist. Eingeschlossene Nebenwege dürfen weiterhin entstehen, solange eine andere Front nach außen offen bleibt. Auch straßenlose Gebäude-Hexe müssen diese Prüfung durchlaufen, da sie den letzten Korridor schließen können.

Technischer Ansatz: Flood-Fill der freien Hexe innerhalb der Map-Ausdehnung mit zusätzlichem Rand; vom äußeren Rand starten und prüfen, welche Fronten erreichbar bleiben. Fest vorgegebene Sonderfelder gesondert anhand ihrer Straßenanschlüsse behandeln. Ein bloßes geometrisches Flood-Fill ist eine notwendige Vorprüfung, garantiert aber noch keine passende Straßenfolge. Die bisherige Anschlussprüfung und das Rettungshex bleiben erforderlich. Ergebnis je Mapänderung zwischenspeichern, damit Hover/Drag nicht ständig große Flächen neu berechnet.

Ungültige Vorschau mit verständlichem Hinweis: „Diese Platzierung würde deine letzte erweiterbare Straße einschließen.“ Den Spieler nicht erst nach dem Bauen überraschen. Ersetzt kein bestehendes Tile und verändert keinen bereits laufenden Spielstand rückwirkend.

## Rettung bestehender Runs: Tunnel

Vorschlag: Wenn keine Front nach außen führt, einen einmaligen Rettungstunnel anbieten. Eingang an einer bestehenden blockierten Straßenfront; Ausgang am nächsten geeigneten äußeren freien Feld. Ziel vor Bestätigung anzeigen. Keine Türme oder Gebäude löschen. Kein Diamantenpreis und keine seltene Karte als Voraussetzung für die Rettung.

Ein Tunnel ist eine echte zusätzliche Verbindung im Straßengraphen, mit klaren Portalen und definierter Laufzeit. Gegner verschwinden am Eingang und erscheinen am Ausgang; sie dürfen nicht unsichtbar normalen Flächenschaden oder Minen auf überquerten Hexen auslösen. Regeln für Reichweite, Zielwahl, Slow, Statistik, Wächter und Pfadwahl müssen vor Umsetzung festgelegt werden. Beide Portale, Verbindung und Transitgegner müssen speicherbar und auf dem Duo-Server simuliert werden. Es ist daher mehr als ein rein visueller Fix.

## Brücken

Als spätere Spezialkarte sinnvoll: sichtbare Überquerung belegter Hexe mit Kämpfen auf einer zweiten Ebene. Für die Sofortrettung deutlich aufwendiger als Portale: zusätzliche Höhe, Picking, Deckung/Reichweiten und überlagerte Straßen in beiden Renderern. Empfehlung: zuerst Einschluss-Prävention, danach Rettungstunnel, Brücken als eigenes Inhaltsfeature.

## Abnahme vor Einführung

Geschlossene Ein-Feld- und Mehr-Feld-Taschen; Gebäude schließen letzten Korridor; eingeschlossene Nebenfront bei freier Hauptfront; Schleifen; Zwei-Fronten-Start; angrenzende Sonderfelder; alte bereits blockierte Runs; große Karten und Snapshot-Wiederaufnahme. Visuelle Prüfung durch den Nutzer, keine eigenständigen Browsertests.
