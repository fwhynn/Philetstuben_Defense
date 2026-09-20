# Autohex TD – Projektgedächtnis

Stand: 20.09.2026, einschließlich der aktuellen lokalen Änderungen. Kompakte Übersicht über Ziele, Entscheidungen und spätere Ideen. Ausführlicher Verlauf: [Übergabeprotokoll](README_TowerDefense_Projekt.md). Technische Grenzen: [Architektur](towerdefense-v0.1/ARCHITECTURE.md). Änderungen: [App-README](towerdefense-v0.1/README.md).

## Festgelegte Richtung
- Schwierigkeit Stufe 2 „Zwei Fronten“ umgesetzt: zwei verschiedene zufällige Base-Ausgänge (alle 15 Kombinationen, reproduzierbar per Seed), fünf Starthandkarten, zwei Pflichtplatzierungen direkt an den Ausgängen vor Bauphase/Wave 1. Erste Platzierung darf die zweite nicht blockieren. Danach drei Handkarten und eine Platzierung je Zug. Startgold, Gegnerzahl und Diamanten unverändert; Standardmodus behält einen Ausgang. Auswahl wird gespeichert.
- Schritt 5 umgesetzt: Elementturm (45 Diamanten / 50 Run-Gold) mit Feuer-, Wasser- oder Windspezialisierung; Nekromantenturm (55 Diamanten / 60 Run-Gold) sammelt einmalig Seelen naher getöteter Gegner und beschwört zeitlich begrenzte, nicht blockierende Geister. Beide haben finale Upgrades und freischaltbare Stufe 4. Kader: neun Türme, weiterhin fünf Loadoutplätze. Neue Türme haben prozedurale 3D-Modelle und SVG-Symbole.
- Escape schließt Menüs und Infofenster, Hinweis am X und in Einstellungen. Mehr Abstand über ausgewählten Handkarten.
- Inhaltspaket Schritt 4 umgesetzt: Versorgungsweg (Rare, +2 Einkommen, ein Slot) und Signalkreuzung (Epic, +20 % Reichweite, zwei Slots). Neue Shrine-Effekte Heilquelle und Werksegen; Bossbeute bietet alternativ +5 aktuelle/maximale Base-HP oder +2 Einkommen pro künftiger Wave. Diese Boni gelten nur im Run.
- Base-Upgrades sind in Platzierungs-, Bau- und Wavephase kaufbar; bei fehlendem Gold, Maximalstufe, offenen Belohnungen oder Game Over wird der Sperrgrund angezeigt. Pop-ups reservieren Platz für HUD, Hand und feste Bedienelemente; lange Inhalte scrollen. Freie Turmplätze werden optional mit schwebenden, langsam rotierenden goldenen Diamanten markiert (gespeicherte Einstellung). Neues Profil erhält ein überspringbares Mini-Tutorial; Wiederholung über Einstellungen, Auto-Start wartet während des Tutorials.
- Heroes/Base-Ausbau umgesetzt: Standard (20 HP/70 Gold), Festungsbauer (20 HP/55 Gold, Base-Upgrades 25 % günstiger, dritte Stufe), Händler (15 HP/90 Gold, +2 Wave-Einkommen, Base-Waffe −25 % Schaden). Alle drei frei auswählbar; gemeinsame Hero-/Festungsauswahl vor dem Run. Alle Heroes können Mauern und eine automatische Base-Waffe mit Run-Gold ausbauen. Auswahl wird gespeichert, Ausbau beim Neustart zurückgesetzt.
- Regelmäßige Bosswellen: erstmals Wave 15, dann alle zehn Waves (25, 35 …), Stärke wie zuvor fünf Waves früher. Wave 1 hat fünf Gegner. Q/E drehen die 3D-Kamera, G schaltet das gespeicherte Hex-Grid um. Turmreichweiten müssen auch über Nebel und unbebauten Hexen vollständig sichtbar bleiben.
- Gebäude zeigen bei Auswahl und Hover ihren Wirkungsbereich farbig: Schmiede/Markt eigenes Hex plus direkte Nachbarn, Haus eigenes Hex. Künftige Gebäude sollen dieselbe datengetriebene Regel für Effekt und Hervorhebung verwenden. Optionales Hex-Grid in den Einstellungen, lokal gespeichert, für SVG und 3D.
- Arbeitsweise: Keine eigenständigen Browsertests, außer ausdrücklich angefordert. Der Nutzer übernimmt die Prüfung im Browser; gezielte automatisierte Logiktests bleiben möglich.
- Hex-Tower-Defense mit Straßenbau und Map-Deckbuilding.
- Darstellung: stilisiertes 3D mit Three.js, SVG als Alternative/Fallback. Weltursprung bei Base (0,0), gemeinsame Renderer-Schnittstelle; 3D-Kamera, Picking und Modelle sind umgesetzt. Vollständige Trennung von Runsteuerung und HUD bleibt offen.
- Sparsame Hex-Ansicht. Clear Vision Radius 2; Fog bis Gesamtradius 6 von jedem gesetzten Hex; dahinter keine Sicht. Dynamische Sonderfelder bei Expansion.
- Boss nach Straßenerschließung in nächster Wave, Spawn auf eigenem Hex. Wave-Start über Button, Leertaste und Auto-Start gleich.
- Hex drehen per R oder Mausrad-Klick (im Uhrzeigersinn), mit Hinweis an der Vorschau. Während der Platzierung hat Mausrad-Klick Vorrang vor der Kamerasteuerung.
- Turm-Loadout-Grundlage umgesetzt: jeder Run bestätigt genau fünf unterschiedliche freigeschaltete Turmtypen; neue Profile besitzen Archer, Katapult, Kettenblitz, Freeze und Minenleger. Nur das gespeicherte Run-Loadout erscheint im Baumenü. Browserprofil und Runzustand bleiben getrennt.
- Minenleger als fünfter Startturm umgesetzt: Er legt ohne Zielkontakt stapelbare Minen direkt auf Straßen; Gegner lösen sie beim Überqueren aus, nicht ausgelöste Minen verschwinden am Wave-Ende. Zweige: Sprengmeister/Erdbrecher und Minenfeld/Minenteppich.
- Gegner wählen an jeder Gabelung pro Einheit zufällig unter allen schleifenfreien Wegen zur Base. Leben, Rüstung und Magieresistenz sind getrennte Trefferpunkt-Pools. Türme zeigen Schaden je Pool und besitzen eine konfigurierbare dreistufige Zielpriorität.
- Diamantenabrechnung umgesetzt: `floor(Wave/2)`, +5 je regelmäßigem Boss, +3 je Erkundungsboss und +2 je erstmals erreichtem Zehner-Meilenstein. Game-over zeigt die Aufschlüsselung; Run-IDs verhindern doppelte Auszahlung. Profil führt Diamanten, Bestwave, Runs, Bosse und normale Kills.
- Meta-Arsenal umgesetzt: Balliste kostet 20 Diamanten, Flammenturm 35. Beide haben zwei Upgradezweige und finale Stufen. Nach der Freischaltung erscheinen sie in der Runvorbereitung, während das Run-Loadout auf fünf Plätze begrenzt bleibt. Eigene 3D-Modelle sind eingebunden; Platzhalter dienen nur als Fallback.
- Etappe 3 abgeschlossen: drei persistente Loadout-Presets, Warnungen für fehlende Kampfrollen und lokale Statistiken je Turm. Jeder der neun Türme besitzt eine zusätzliche vierte Stufe, die im Arsenal dauerhaft mit Diamanten freigeschaltet und anschließend pro Run mit Gold gekauft wird.
- Turmverkauf: 100 % inklusive Upgrades in ursprünglicher aktueller Bauphase vor Wave; sonst 50 % tatsächlicher Gesamtinvestition, abgerundet, auch während Waves. Keine Verkäufe nach Game Over.
- Modelle vorhanden: alle sieben Türme, fünf Gegner (Kiwi-Krieger „Vik“ als Standardgegner, Widmung an eine Freundin), drei Gebäude und die Straßenmine. Es fehlen nur die Turm-Upgrade-Varianten. Alle Gegner können einander durchlaufen und überholen; es gibt keine gegenseitige Abstandsbremsung. Grafikstufen `?low`/`?high`, automatische Absenkung bei niedriger Bildrate.
- Bauen auch während Waves. Turm-Upgrades nur im angeklickten Turmmenü. Wave-/Gold-/Deckinfos als Dropdowns.

## Für später fest vorgemerkt
- Meta-Progression und Turm-Loadouts sind in [META_PROGRESSION_PLAN.md](META_PROGRESSION_PLAN.md) konkretisiert. Loadout, Diamanten, Arsenal, Minenleger sowie die ersten zwei freischaltbaren Türme sind umgesetzt. Keine fünf kostenlosen platzierten Türme. Meta-Unlocks sollen vor allem Optionen statt permanenter globaler Stärke geben.
- Weitere Startprofile über die drei implementierten Heroes hinaus.
- Weitere Base-Ausbaupfade können später folgen; Mauern und automatische Waffe sind umgesetzt.
- Bisherige Ideen (keine finalen Werte): neutrale Standardfestung, Händlerstadt mit Goldbonus/Nachteil, Frostfestung mit Freeze-Bonus, Nekromanten-Zitadelle mit Bonus auf spätere Nekromantentürme.
- Held und Festung bilden aktuell ein gemeinsames Startprofil. Startdeck und fünf Turmplätze bleiben gleich; Hero-Werte und Base-Upgrades liegen in heroes.js.
- Weitere Shrine-Bonusvarianten über Heilquelle und Werksegen hinaus. Effekt bleibt vor Erschließung verborgen.
- Weitere Karten und Bosslootvarianten. Erster Ausbau auf drei Karten je hoher Rarität und zusätzliche Boss-Kartenbeute umgesetzt.
- Weitere Biome, spätere Meta-Progression und zusätzliche Towerrollen: Details im Übergabeprotokoll.

## Aktueller Stand / nächste Arbeit
- Shrine: 20 % Kartenkopie entfernen, 20 % zusätzliche Kartenauswahl, 20 % Epic, 10 % Legendary, 15 % Heilquelle (+5 HP bis Maximum, bei voller Gesundheit 30 Gold), 15 % Werksegen (kostenloses normales Upgrade eines gebauten Loadout-Turms; sonst 30 Gold). Mindestdeckgröße 5; Auswahl oder Überspringen verbraucht Shrine.
- Epic-Pool: Signalkreuzung (+20 % Reichweite, zwei Slots), Höhenkreuzung, Kampfstraße (+20 % Schaden), Wachtkurve (2 Slots/+15 % Reichweite). Legendary-Pool: Bastionskreuzung, Königsstraße (+5 Gold/Gebäudeslot), Kriegskreuzung (+30 % Schaden/4 Straßenenden). Legendary kann durch vorhandene geringe Raritätsgewichtung auch im normalen Reward vorkommen.
- Kreuzungen: bisherige tee-Karte heißt Y-Kreuzung; neue echte T-Kreuzung und Sechserkreuzung im Rewardpool. Startdeck behält tee/Y.
- Sonderfelder vorgefertigt: feste Straßen/Rotation, keine Handkarte darüber platzieren; passende Nachbarstraße aktiviert automatisch. Schatz/Shrine gerade/kurvig/Y/T mit 1 Slot, Boss immer sechs Öffnungen ohne Slots. Nachbaranschlüsse beim Bauen berücksichtigen, mehrere Shrines nacheinander.
- Sonderfelder: 4,5 % geeigneter Koordinaten; darunter 55 % Schatz / 30 % Shrine / 15 % Boss. Keine Sonderfelder in Radius 2 um die Base; Wächterfelder zusätzlich nie innerhalb von vier Hexen.
- Direkt benachbarte Sonderfelder erhalten immer beidseitige Straßenanschlüsse an ihrer gemeinsamen Kante. Die Generierung berücksichtigt auch noch nicht erkundete Nachbarn; feste Geometrien bleiben später unverändert. Bei Bedarf erhalten Schatz/Shrine eine Sechserkreuzung mit weiterhin einem Turmplatz.
- Elementwahl erfolgt als erste, feste Spezialisierung des gebauten Elementturms: Feuer mit Flächenschaden, Wasser mit zeitlich begrenztem Slow, Wind mit Durchschlag.
- Bossloot: +50 Gold und nach überlebter Wave genau eine Wahl aus Karten (90 % Epic, 10 % Legendary als Pool) oder Run-Segen (+5 aktuelle/maximale HP bzw. +2 Einkommen je künftiger Wave). Alle Bosse nacheinander vor normalen Wave-Rewards.
- Kartendarstellung in svg-renderer.js ausgelagert: render/reset/project/destroy, logische Aktionen an Controller, keine direkte Mutation des Spielzustands. Gemeinsame Slotpositionen in map.js.
- Weltkoordinaten: Base (0,0), keine Bildschirmzentrierung in Spiellogik. camera.js: DOM-freies Kameramodell plus austauschbarer SVG-Adapter; Renderer besitzt Kamera.
- Prioritäten: aktuelle Änderungen im Spiel durch den Nutzer prüfen, Gameplay/Balance, Hero-/Base-Balancing anhand der ersten Spieltests. Danach Run-Speicherung und weitere Karten/Bonusvarianten. Diese Reihenfolge ist ein Vorschlag; Details sind noch nicht beschlossen.
- Visuelle Prüfung, Audio-Hörprobe, Gebäude-Wirkungsbereiche im Spiel und langfristiges Balancing sind nicht durch aktuelle Browsertests bestätigt. Provisorisches Card Removal jede sechste Wave bleibt zusätzlich zu Shrines.

Zuletzt 156 automatisierte Tests bestanden (20.09.2026); für die jüngsten Änderungen keine Browsertests durchgeführt. Laufende Runs sind nicht persistent; Profil, Freischaltungen, Presets und Hex-Grid-Einstellung werden lokal gespeichert.

Bei neuen Entscheidungen diesen Stand aktualisieren; offene Ideen nicht als implementierte Features behandeln.
