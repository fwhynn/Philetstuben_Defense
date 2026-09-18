# Hex Bastion – Projektgedächtnis

Stand: 18.09.2026. Kompakte Übersicht über Ziele, Entscheidungen und spätere Ideen. Ausführlicher Verlauf: [Übergabeprotokoll](README_TowerDefense_Projekt.md). Technische Grenzen: [Architektur](towerdefense-v0.1/ARCHITECTURE.md). Änderungen: [App-README](towerdefense-v0.1/README.md).

## Festgelegte Richtung
- Hex-Tower-Defense mit Straßenbau und Map-Deckbuilding.
- Finale Darstellung: stilisiertes 3D wie Dorfromantik. Spiellogik und Daten rendererunabhängig halten; SVG-Kartendarstellung jetzt über Renderer-Schnittstelle; Weltursprung (Base 0,0) und Kameramodell getrennt; Run-/HUDtrennung und 3D-Kameraadapter fehlen noch. Engine noch nicht gewählt.
- Sparsame Hex-Ansicht. Clear Vision Radius 2; Fog bis Gesamtradius 6 von jedem gesetzten Hex; dahinter keine Sicht. Dynamische Sonderfelder bei Expansion.
- Boss nach Straßenerschließung in nächster Wave, Spawn auf eigenem Hex. Wave-Start über Button, Leertaste und Auto-Start gleich.
- Drehen per R mit kleinem Hoverhinweis direkt an der Hex-Vorschau; Eckbutton entfernt.
- Turmverkauf: 100 % inklusive Upgrades in ursprünglicher aktueller Bauphase vor Wave; sonst 50 % tatsächlicher Gesamtinvestition, abgerundet, auch während Waves. Keine Verkäufe nach Game Over.
- Bauen auch während Waves. Turm-Upgrades nur im angeklickten Turmmenü. Wave-/Gold-/Deckinfos als Dropdowns.

## Für später fest vorgemerkt
- Verschiedene Starthelden / Startfestungen mit eigenen Effekten und unterschiedlichen Spielstilen. Erneut vom Nutzer gewünscht. Noch nicht implementiert.
- Bisherige Ideen (keine finalen Werte): neutrale Standardfestung, Händlerstadt mit Goldbonus/Nachteil, Frostfestung mit Freeze-Bonus, Nekromanten-Zitadelle mit Bonus auf spätere Nekromantentürme.
- Vor Umsetzung klären: Held und Festung ein gemeinsames Startprofil oder getrennte Auswahl; Startdeck, Ressourcen, passive Effekte und mögliche Nachteile datengetrieben definieren.
- Mehr Shrine-Bonusvarianten, insbesondere besondere Upgrades. Effekt bleibt vor Erschließung verborgen.
- Weitere Karten und Bosslootvarianten. Erster Ausbau auf drei Karten je hoher Rarität und zusätzliche Boss-Kartenbeute umgesetzt.
- Weitere Biome, spätere Meta-Progression und zusätzliche Towerrollen: Details im Übergabeprotokoll.

## Aktueller Stand / nächste Arbeit
- Shrine: 30 % Kartenkopie entfernen, 30 % zusätzliche Kartenauswahl, 30 % Epic, 10 % Legendary. Mindestdeckgröße 5; Auswahl oder Überspringen verbraucht Shrine.
- Epic-Pool: Höhenkreuzung, Kampfstraße (+20 % Schaden), Wachtkurve (2 Slots/+15 % Reichweite). Legendary-Pool: Bastionskreuzung, Königsstraße (+5 Gold/Gebäudeslot), Kriegskreuzung (+30 % Schaden/4 Straßenenden). Legendary kann durch vorhandene geringe Raritätsgewichtung auch im normalen Reward vorkommen.
- Kreuzungen: bisherige tee-Karte heißt Y-Kreuzung; neue echte T-Kreuzung und Sechserkreuzung im Rewardpool. Startdeck behält tee/Y.
- Sonderfelder vorgefertigt: feste Straßen/Rotation, keine Handkarte darüber platzieren; passende Nachbarstraße aktiviert automatisch. Schatz/Shrine gerade/kurvig/Y/T mit 1 Slot, Boss immer sechs Öffnungen ohne Slots. Nachbaranschlüsse beim Bauen berücksichtigen, mehrere Shrines nacheinander.
- Sonderfelder: 4,5 % geeigneter Koordinaten; darunter 55 % Schatz / 30 % Shrine / 15 % Boss. Keine Sonderfelder in Radius 2 um die Base.
- Bossloot: +50 Gold und nach überlebter Wave zusätzliche Kartenauswahl (90 % Epic, 10 % Legendary), alle Bosse nacheinander vor normalen Wave-Rewards. 87 Tests bestanden.
- Kartendarstellung in svg-renderer.js ausgelagert: render/reset/project/destroy, logische Aktionen an Controller, keine direkte Mutation des Spielzustands. Gemeinsame Slotpositionen in map.js.
- Weltkoordinaten: Base (0,0), keine Bildschirmzentrierung in Spiellogik. camera.js: DOM-freies Kameramodell plus austauschbarer SVG-Adapter; Renderer besitzt Kamera. 87 Tests bestanden.
- Prioritäten: Gameplay/Balance und manuelle Prüfung; Run-/HUDtrennung für 3D und spätere 3D-Kamera; Startprofile für Helden/Festungen entwerfen; weitere Karten/Bonusvarianten.
- Visuelle Prüfung, Audio-Hörprobe, Markt/Schmiede im Spiel und langfristiges Balancing weiterhin offen. Provisorisches Card Removal jede sechste Wave bleibt zusätzlich zu Shrines.

Bei neuen Entscheidungen diesen Stand aktualisieren; offene Ideen nicht als implementierte Features behandeln.





