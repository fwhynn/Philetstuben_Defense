# Hex Bastion – Projektgedächtnis

Stand: 19.09.2026. Kompakte Übersicht über Ziele, Entscheidungen und spätere Ideen. Ausführlicher Verlauf: [Übergabeprotokoll](README_TowerDefense_Projekt.md). Technische Grenzen: [Architektur](towerdefense-v0.1/ARCHITECTURE.md). Änderungen: [App-README](towerdefense-v0.1/README.md).

## Festgelegte Richtung
- Arbeitsweise: Keine eigenständigen Browsertests, außer ausdrücklich angefordert. Der Nutzer übernimmt die Prüfung im Browser; gezielte automatisierte Logiktests bleiben möglich.
- Hex-Tower-Defense mit Straßenbau und Map-Deckbuilding.
- Finale Darstellung: stilisiertes 3D wie Dorfromantik. Spiellogik und Daten rendererunabhängig halten; SVG-Kartendarstellung jetzt über Renderer-Schnittstelle; Weltursprung (Base 0,0) und Kameramodell getrennt; Run-/HUDtrennung und 3D-Kameraadapter fehlen noch. Engine noch nicht gewählt.
- Sparsame Hex-Ansicht. Clear Vision Radius 2; Fog bis Gesamtradius 6 von jedem gesetzten Hex; dahinter keine Sicht. Dynamische Sonderfelder bei Expansion.
- Boss nach Straßenerschließung in nächster Wave, Spawn auf eigenem Hex. Wave-Start über Button, Leertaste und Auto-Start gleich.
- Drehen per R mit kleinem Hoverhinweis direkt an der Hex-Vorschau; Eckbutton entfernt.
- Turm-Loadout-Grundlage umgesetzt: jeder Run bestätigt genau fünf unterschiedliche freigeschaltete Turmtypen; neue Profile besitzen Archer, Katapult, Kettenblitz, Freeze und Minenleger. Nur das gespeicherte Run-Loadout erscheint im Baumenü. Browserprofil und Runzustand bleiben getrennt.
- Minenleger als fünfter Startturm umgesetzt: Er legt ohne Zielkontakt stapelbare Minen direkt auf Straßen; Gegner lösen sie beim Überqueren aus, nicht ausgelöste Minen verschwinden am Wave-Ende. Zweige: Sprengmeister/Erdbrecher und Minenfeld/Minenteppich.
- Gegner wählen an jeder Gabelung pro Einheit zufällig unter allen schleifenfreien Wegen zur Base. Leben, Rüstung und Magieresistenz sind getrennte Trefferpunkt-Pools. Türme zeigen Schaden je Pool und besitzen eine konfigurierbare dreistufige Zielpriorität.
- Diamantenabrechnung umgesetzt: `floor(Wave/2)`, +5 je regelmäßigem Zehnerboss, +3 je Erkundungsboss und +2 je erstmals erreichtem Zehner-Meilenstein. Game-over zeigt die Aufschlüsselung; Run-IDs verhindern doppelte Auszahlung. Profil führt Diamanten, Bestwave, Runs, Bosse und normale Kills.
- Meta-Arsenal umgesetzt: Balliste kostet 20 Diamanten, Flammenturm 35. Beide haben zwei Upgradezweige und finale Stufen. Nach der Freischaltung erscheinen sie in der Runvorbereitung, während das Run-Loadout auf fünf Plätze begrenzt bleibt. Eigene 3D-Modelle fehlen noch; der Renderer nutzt Platzhalter.
- Etappe 3 abgeschlossen: drei persistente Loadout-Presets, Warnungen für fehlende Kampfrollen und lokale Statistiken je Turm. Jeder der sieben Türme besitzt eine zusätzliche vierte Stufe, die im Arsenal dauerhaft mit Diamanten freigeschaltet und anschließend pro Run mit Gold gekauft wird.
- Turmverkauf: 100 % inklusive Upgrades in ursprünglicher aktueller Bauphase vor Wave; sonst 50 % tatsächlicher Gesamtinvestition, abgerundet, auch während Waves. Keine Verkäufe nach Game Over.
- Modelle vorhanden: alle sieben Türme, fünf Gegner (Kiwi-Krieger „Vik“ als Standardgegner, Widmung an eine Freundin), drei Gebäude und die Straßenmine. Es fehlen nur die Turm-Upgrade-Varianten. Gegner halten Abstand (Spawnabstand nach Tempo, Bremsen vor dem Vordermann, Bosse ausgenommen). Grafikstufen `?low`/`?high`, automatische Absenkung bei niedriger Bildrate.
- Bauen auch während Waves. Turm-Upgrades nur im angeklickten Turmmenü. Wave-/Gold-/Deckinfos als Dropdowns.

## Für später fest vorgemerkt
- Meta-Progression und Turm-Loadouts sind in [META_PROGRESSION_PLAN.md](META_PROGRESSION_PLAN.md) konkretisiert. Loadout, Diamanten, Arsenal, Minenleger sowie die ersten zwei freischaltbaren Türme sind umgesetzt. Keine fünf kostenlosen platzierten Türme. Meta-Unlocks sollen vor allem Optionen statt permanenter globaler Stärke geben.
- Verschiedene Starthelden / Startfestungen mit eigenen Effekten und unterschiedlichen Spielstilen. Erneut vom Nutzer gewünscht. Noch nicht implementiert.
- Ein Startheld soll besonders gut darin sein, die eigene Base zu verstärken und zu einer selbstverteidigenden Festung auszubauen. Offen bleibt, ob der Base-Ausbau grundsätzlich allen Helden zur Verfügung steht und dieser Held besondere Vorteile dabei erhält. Für später vorgemerkt, noch nicht implementiert.
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
- Sonderfelder: 4,5 % geeigneter Koordinaten; darunter 55 % Schatz / 30 % Shrine / 15 % Boss. Keine Sonderfelder in Radius 2 um die Base; Wächterfelder zusätzlich nie innerhalb von vier Hexen.
- Direkt benachbarte Sonderfelder erhalten immer beidseitige Straßenanschlüsse an ihrer gemeinsamen Kante. Die Generierung berücksichtigt auch noch nicht erkundete Nachbarn; feste Geometrien bleiben später unverändert. Bei Bedarf erhalten Schatz/Shrine eine Sechserkreuzung mit weiterhin einem Turmplatz.
- Für später vorgemerkt: ein Elementturm, bei dem der Spieler selbst ein Element wie Feuer, Wasser oder Wind auswählt. Elemente sollen unterschiedliche Rollen und Matchups erhalten.
- Bossloot: +50 Gold und nach überlebter Wave zusätzliche Kartenauswahl (90 % Epic, 10 % Legendary), alle Bosse nacheinander vor normalen Wave-Rewards. 87 Tests bestanden.
- Kartendarstellung in svg-renderer.js ausgelagert: render/reset/project/destroy, logische Aktionen an Controller, keine direkte Mutation des Spielzustands. Gemeinsame Slotpositionen in map.js.
- Weltkoordinaten: Base (0,0), keine Bildschirmzentrierung in Spiellogik. camera.js: DOM-freies Kameramodell plus austauschbarer SVG-Adapter; Renderer besitzt Kamera. 87 Tests bestanden.
- Prioritäten: Gameplay/Balance und manuelle Prüfung; Run-/HUDtrennung für 3D und spätere 3D-Kamera; Startprofile für Helden/Festungen entwerfen; weitere Karten/Bonusvarianten.
- Visuelle Prüfung, Audio-Hörprobe, Markt/Schmiede im Spiel und langfristiges Balancing weiterhin offen. Provisorisches Card Removal jede sechste Wave bleibt zusätzlich zu Shrines.

Bei neuen Entscheidungen diesen Stand aktualisieren; offene Ideen nicht als implementierte Features behandeln.
