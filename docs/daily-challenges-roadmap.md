# Neue Tagesherausforderungen – Umsetzung in einzelnen Schritten

Auswahl des Nutzers: 10, 9, 8, 7, 6, 4 und 1. Keine Veröffentlichung ohne gesonderten Auftrag. Vorhandene lokale Balanceänderungen bleiben erhalten.

## 1. Fluch der Gier – lokal implementiert

- Zwölf Wellen, eine Front, festes geliehenes Loadout ohne persönliche Arsenalboni.
- Höchstens ein freiwilliger Vertrag pro Welle. Die normale Welle kann ohne Vertrag gestartet werden.
- Schwarm: sechs zusätzliche Schwarmgegner; 12 + 2 × Welle Gold sofort, zwei Punkte bei Erfolg.
- Heilertrupp: ein Heiler und drei gepanzerte Begleiter; 20 + 2 × Welle Gold sofort, drei Punkte bei Erfolg.
- Elite: vierfaches normales Leben, Rüstung in Höhe eines normalen Lebensbalkens, MR in Höhe eines halben normalen Lebensbalkens; drei Basisschaden bei Durchbruch. 28 + 2 × Welle Gold sofort, vier Punkte bei Erfolg.
- Vertragsgegner geben kein zusätzliches Killgold. Der Vertrag ist nach Annahme verbindlich und gilt nur für die betreffende Welle.
- Punkte erst nach erfolgreich abgeschlossener Welle; maximal 48. Im Endlosmodus keine weiteren Verträge/Punkte.
- Sieg zahlt die bestehende Tagesbelohnung von zehn Diamanten einmalig aus. Persönliche Risikobestmarke steht in `dailyResults[day].bestRiskScore`, einem Bestandteil des bestehenden Profils. Keine neue öffentliche/servergeprüfte Punkte-Bestenliste; die Unterstützung dieses zusätzlichen Profilfelds durch die externe Account-API wurde nicht verifiziert.
- Speichern erhält Vertragswahl, Bonusgold, Spawnplan und Punkte. Keine Doppelzahlung durch Laden oder wiederholte Abschlussereignisse.
- Karawanen-Sandsturm und Geldtransporte gelten ausdrücklich nicht in Gier.

### Lokal ausprobieren

Dev-Modus aktivieren, das **isolierte Erstspieler-Testprofil** starten, dann unter Einstellungen → Entwicklertools **„Fluch der Gier testen · isoliertes Testprofil“** wählen. Der Knopf startet den festen Testtag 25.10.2026 ausschließlich im isolierten Profil. Nach der Hex-Platzierung erscheint neben dem Wellenstart die freiwillige Vertragsauswahl.

### Tagesrotation

Historische Zuordnung bis einschließlich 24.10.2026 unverändert. Lokaler Rotationsentwurf ab 25.10.2026: Gier → Karawane → Garnison. **Vor einem späteren Release den Umstellungstag auf einen noch nicht begonnenen UTC-Tag legen**, damit auf Live bereits gespielte Tage nicht nachträglich eine andere Mission erhalten. Neue Missionen erst nach eigener Abnahme in diesen Zyklus aufnehmen.

### Prüfung

761 automatisierte Client-/Servertests bestanden, einschließlich neuer Tests für die Rotation, fehlende Karawanenmodifikatoren, alle drei Verträge, doppelte Klicks, unzulässige Phasen, Wiederherstellung mitten im Kampf, Vorschau, Escape, freiwilligen Wellenstart, Punkteabschluss, Endlosgrenze, Profilbestmarke und einmalige Diamantenbelohnung. Keine Browserprüfung für diese Implementierung durchgeführt.

## 2. Die Kunst des Umwegs – lokal implementiert

- Fünf fest platzierte Türme auf Stufe 3: Bogenschütze, Flammenturm, Katapult, Frost und Balliste. Persönliche Arsenalboni gelten nicht.
- Fünf Angriffe entsprechend der Gegnerstärke der normalen Wellen 3, 6, 9, 12 und 15, einschließlich Schlussboss. Kein Endlosmodus.
- Vor Angriff 1 bis zu sechs Straßenhexe, danach jeweils zwei. Anfangsvorrat: je drei Geraden, kleine und große Kurven; nach überstandenem Angriff je eine zusätzliche Karte pro Typ. Keine Zufallsangebote.
- Mindestens zwei Straßenhexe, danach darf die Planung vorzeitig abgeschlossen werden. Nicht verwendetes Platzierungsbudget verfällt zwischen Angriffen; der Kartenvorrat bleibt erhalten.
- Aktuelle Platzierungen können rückgängig gemacht werden. Zwischen Angriffen können zusätzlich die letzten zwei älteren Straßenhexe zurückgenommen werden. Jede Rücknahme erstattet Karte und Platzierung. Feste Turmfelder sind davon ausgenommen.
- Kein Turmbau, Verkauf, Ausbau, Basis-Ausbau, Gebäudebau oder Verbrauchshilfen. Straßen haben keine neuen Bauplätze. Kein Gold und keine normalen Karten-/Bossbelohnungen.
- Bestehende Tagesabrechnung: zehn Diamanten einmalig beim Sieg. Keine neue öffentliche Bestenlistenwertung oder neue Account-API-Felder.
- Snapshots erhalten Vorrat, Umbaugrenze, Platzierungen und Kampfzustand. Die normale Deck-Reparatur wird für diesen Modus übersprungen.

### Lokal ausprobieren

Dev-Modus → isoliertes Erstspieler-Testprofil → Einstellungen → Entwicklertools → **„Kunst des Umwegs testen · isoliertes Testprofil“**. Startet den festen Testtag 01.11.2026. Über **„Straßenplanung abschließen“** wird der Wellenstart freigegeben; die Planung lässt sich vor dem Start wieder öffnen.

Lokaler Rotationsentwurf ab 01.11.2026: Umweg → Gier → Karawane → Garnison. Frühere Zuordnungen bleiben unverändert. Vor einem Release weiterhin die oben genannte UTC-Stichtagsprüfung durchführen; derzeit nicht veröffentlicht.

### Prüfung

Acht gezielte automatisierte Tests: feste Verteidigung und Kauf-/Ausbausperren, Straßenbudget und Rückerstattung, begrenzte ältere Umbauten, Planung und Kampf nach Snapshot, vollständige echte Simulation aller fünf Angriffe, Vergleich mit kurzer ungeplanter Route, isolierter Dev-Einstieg, einmalige Tagesbelohnung, historische Rotation sowie Bedienung und Wiederherstellung über den Controller. Die geplante Referenzroute überlebt alle Angriffe mit 20 Leben; die kurze Route erzielt ein schlechteres Ergebnis. Das belegt Lösbarkeit, ersetzt aber keine menschliche Schwierigkeitseinschätzung. Keine Browserprüfung durchgeführt.

## 3. Drei Dörfer – lokal implementiert

- Feste Karte mit drei getrennten Zufahrten und je sechs Straßenhexen mit zwei Bauplätzen. Nord-, Mittel- und Süddorf besitzen jeweils 15 Leben. Sobald eines fällt, endet der Run; übrige Dorfleben gleichen den Verlust nicht aus.
- Zwölf Wellen. Wellen 1–6 greifen Nord, Mitte und Süd zweimal im Wechsel an. Wellen 7–9 greifen die Paare Nord/Mitte, Mitte/Süd und Nord/Süd an. Wellen 10–12 greifen alle Dörfer an. Welle 12 enthält zusätzlich den Eisenkoloss.
- Normale Gegnerstärke der jeweiligen Welle. Zwei aktive Zufahrten erzeugen 1,5-mal, drei aktive Zufahrten zweimal die normale Gegnerzahl. Gegner werden gleichmäßig über die aktiven Zufahrten verteilt. Der Boss erscheint an einer davon, deterministisch aus dem Tagesstartwert.
- 180 Startgold; normale Kill- und Wellenbelohnungen. Geliehenes Tagesloadout: Bogenschütze, Balliste, Katapult, Minenleger, Frost. Keine persönlichen Arsenalboni. Turmbau, normale Upgrades und Verkauf bleiben möglich; keine Kartenbelohnungen, Straßenplatzierungen, Gebäudeplätze, Basis-Upgrades oder Verbrauchshilfen.
- Zwei kostenlose Turmumzüge je Bauphase, nicht ansparbar. Einzelnen Turm auswählen → „Turm kostenlos umsetzen“ → freien Platz anklicken. Abbrechen per Escape oder Knopf. Während des Kampfes keine Umzüge. Stufe, Angriffsfokus, Abklingzeiten, investiertes Gold und Statistik-ID bleiben erhalten; Statistikkoordinaten werden aktualisiert.
- Dorfleben erscheinen auf der Karte und im Statusbereich; die aktiven bzw. nächsten Ziele werden angezeigt. Automatischer Wellenstart ist für diese Planungsmission deaktiviert.
- Jeder Gegner hat ein festes Dorfziel, auch Bossdiener und Golemsplitter. Kröten-Abkürzungen verwenden das eigene Dorf als Routenziel. Checkpoints erhalten Dorfleben, Umzugsbudget und Zielzuordnung.
- Alle drei Dörfer müssen Welle 12 überleben. Kein Endlosmodus. Bestehende Tagesabrechnung mit einmalig zehn Diamanten; keine neuen Account-API-Felder oder Änderungen an öffentlichen Bestenlisten.

### Lokal ausprobieren

Dev-Modus → isoliertes Erstspieler-Testprofil → Einstellungen → Entwicklertools → **„Drei Dörfer testen · isoliertes Testprofil“**. Fester Testtag: 08.11.2026.

Lokaler Rotationsentwurf ab 08.11.2026: Drei Dörfer → Umweg → Gier → Karawane → Garnison. Frühere Zuordnungen bleiben erhalten. Der tatsächliche Einführungstag muss vor einer späteren Veröffentlichung auf einen noch nicht begonnenen UTC-Tag geprüft werden. Nichts veröffentlicht.

### Prüfung

Zehn gezielte Tests für Ziele, reale Routen, gleichmäßige Spawns, einzelne Lebensbalken, Niederlage trotz gesunder Nachbardörfer, Bossdiener/Splitter, Umzugslimit und Bestandserhalt, Snapshot-Fortsetzung im Mehrfrontenkampf, Controller-Bedienung, Dev-Isolation und einmalige Tagesbelohnung. Vollständige Simulation mit dem tatsächlichen Dev-Tagesstartwert: eine regulär bezahlte gemischte Verteidigung mit Priorität für angegriffene und angeschlagene Dörfer überlebt alle zwölf Wellen und besiegt den Schlussboss. Ohne Verteidigung wird korrekt verloren. Das ist ein Lösbarkeitstest, keine abschließende menschliche Balanceabnahme. Keine Browserprüfung.

## 4. Stromnetz – lokal implementiert

- Zwölf Wellen auf einer festen gewundenen Straße; Eisenkoloss zusätzlich in Welle 12. 150 Startgold, normale Kill- und Wellenbelohnungen, geliehenes Tagesloadout ohne persönliche Arsenalboni.
- Zwei Generatoren mit jeweils drei Strom. Jeder Turm benötigt unabhängig von seiner Stufe einen Strom. Die Generatoren sind dauerhaft aktiv. Höchstens sechs Leitfelder/Relais dürfen gleichzeitig eingeschaltet sein.
- Benachbarte eingeschaltete Hexe leiten Strom, unabhängig von Straßenanschlüssen. Zwei straßenlose Relais können die Netzteile verbinden. Jeder zusammenhängende Netzteil nutzt nur die Kapazität seiner eigenen Generatoren; verbundene Generatoren addieren ihre Kapazität.
- Bei Überlast werden zuerst gebaute, eingeschaltete Türme versorgt. Die Reihenfolge basiert auf der stabilen Statistik-ID, nicht auf Karten-/Speicherreihenfolge. Einzelne Türme können ausgeschaltet werden, um Kapazität freizugeben.
- Unversorgte Türme sind vollständig inaktiv: kein Schaden, keine Frost-Aura, keine Minenproduktion. Karte und Turmmenü unterscheiden „Versorgt“, „Ausgeschaltet“, „Keine Verbindung“ und „Kapazität belegt“.
- Wellenstart fixiert die Liste versorgter Türme. Umschalten, Bauen, Upgrades und Verkaufen sind während des Kampfes gesperrt, auch bei Pause. Angriffsfokus darf weiterhin geändert werden. Automatischer Wellenstart ist für diese Planungsmission deaktiviert.
- Kein Basis-Ausbau, keine Verbrauchshilfen, keine neuen Straßen oder Karten-/Bossbelohnungen. Kein Endlosmodus. Bestehende Tagesabrechnung vergibt beim Sieg einmalig zehn Diamanten; keine neuen Account-API-Felder und keine Änderungen an öffentlichen Bestenlisten.
- Interne Run-Snapshots enthalten Schalterstellungen, ausgeschaltete Türme und die fixierte Versorgung der laufenden Welle. Keine zusätzliche lokale-only Einstellung eingeführt.

### Lokal ausprobieren

Dev-Modus → isoliertes Erstspieler-Testprofil → Einstellungen → Entwicklertools → **„Stromnetz testen · isoliertes Testprofil“**. Fester Testtag: 15.11.2026. Im Bereich neben dem Wellenstart **„Leitfelder schalten“** öffnen. Die Feldnamen stehen auch auf der Karte. Zum Abschalten eines Verbrauchers den Turm auswählen und seinen Stromknopf verwenden.

Lokaler Rotationsentwurf ab 15.11.2026: Stromnetz → Drei Dörfer → Umweg → Gier → Karawane → Garnison. Ältere Zuordnungen bleiben unverändert. Vor einer tatsächlichen Veröffentlichung den Stichtag auf einen noch nicht begonnenen UTC-Tag prüfen. Nicht veröffentlicht.

### Prüfung

Neun neue gezielte Tests: Kartengeometrie, Leitfeldlimit, Netztrennung und -verbindung, geteilte Kapazität, stabile Verbraucherpriorität, echte Inaktivität von Schaden/Aura/Minen, gesperrte Änderungen während laufender und pausierter Wellen, identische Simulation nach Wiederherstellung, Controller-Bedienung und Fokusbestand, Dev-Isolation, historische Rotation und einmalige Tagesbelohnung. Eine regulär bezahlte gemischte Verteidigung überlebt beim tatsächlichen Dev-Tagesstartwert alle zwölf Wellen mit 20 Leben und besiegt den Schlussboss. Vollständige Client-/Serversuite: 788 Tests. Keine Browserprüfung; menschliche Abnahme von Bedienung und Schwierigkeit steht aus.

## 5. Expedition ins Unbekannte – lokal implementiert

- Drei feste Reliktinseln im Norden, Osten und Süden müssen über Straßen mit der Basis verbunden sein. Aufdecken allein zählt nicht. Zusätzlich Welle 12 überleben; fehlt ein Relikt, endet die Mission als Niederlage, auch bei verbleibendem Basisleben.
- Bis zu zwei Straßenplatzierungen je Bauphase, nicht ansparbar. Wiederverwendbarer Baukasten mit Gerade, kleiner/großer Kurve, T- und Y-Kreuzung. So scheitert die Erkundung nicht am Kartenglück. Planung kann nach einem gültigen Straßenanschluss vorzeitig beendet und mit verbleibendem Budget wieder geöffnet werden.
- 100 Startgold, normale Gegner-/Wellenbelohnungen. Jedes angeschlossene Relikt gibt einmalig 25 Gold. Keine weiteren Schreinboni, zufälligen Inseln, Kartenbelohnungen oder Rettungstunnel. Keine persönlichen Arsenalboni; geliehenes Tagesloadout. Gewöhnliche Turm-/Basisupgrades und Verbrauchshilfen bleiben erlaubt. Kein Endlosmodus.
- Drei Zielrichtungen und Fortschritt werden angezeigt; Platzierungsbudget, Relikte, Straßen und laufender Kampf bleiben in Run-Snapshots erhalten. Deutsche und englische Texte sind hinterlegt.
- Tagesbelohnung von zehn Diamanten nur bei erfülltem Gesamtziel und nur einmal. Welle 12 ohne Relikte wird als erreichte Welle gespeichert, ausdrücklich ohne Sieg. Ein späterer vollständiger Sieg kann die Belohnung trotzdem erhalten. Keine neuen Account-API-Felder, keine Änderung an öffentlichen Bestenlisten.

### Lokal ausprobieren

Dev-Modus → isoliertes Erstspieler-Testprofil → Einstellungen → Entwicklertools → **„Expedition testen · isoliertes Testprofil“**. Fester Testtag: 22.11.2026. Über **„Planung abschließen“** gegebenenfalls auf ungenutzte Platzierungen verzichten; vor Wellenstart ist **„Planung fortsetzen“** möglich.

Lokaler Rotationsentwurf ab 22.11.2026: Expedition → Stromnetz → Drei Dörfer → Umweg → Gier → Karawane → Garnison. Frühere Zuordnungen bleiben erhalten. Vor Veröffentlichung den Stichtag auf einen noch nicht begonnenen UTC-Tag prüfen. Nicht gepusht oder veröffentlicht.

### Prüfung

Sieben neue Tests: fester Baukasten und Budget, gespeicherte Teilplanung, echte erreichbare Straßenverbindungen, vollständige zwölf Wellen mit regulär verdientem Gold und gemischter Verteidigung, Aufdecken versus Anschluss, identische Kampffortsetzung nach Snapshot, Niederlage bei fehlenden Relikten ohne künstlichen Lebensverlust, spätere einmalige Siegbelohnung, Dev-Isolation und historische Rotation. Die Referenzroute benötigt 16 der maximal 24 Platzierungen. Vollständige Client-/Serversuite: **795 Tests bestanden**. Keine Browserprüfung; menschliche Abnahme von Schwierigkeit und Bedienung steht aus.

## 6. Turm-Draft – lokal implementiert

- Zwölf Wellen auf der festen gewundenen Straße. Kein Straßenbau und keine Kartenbelohnungen. Vor dem ersten Angriff drei Auswahlrunden, danach je Bauphase eine: immer genau eines von drei Angeboten. Der Wellenstart bleibt gesperrt, solange eine Auswahl offen ist.
- Angebote werden aus Tagesstartwert, Welle und Auswahlrunde deterministisch erzeugt. Neuladen würfelt sie nicht neu. Anfangs ausschließlich Schadenstürme, später auch Frost. Pool: Bogenschütze, Katapult, Balliste, Kettenblitz, Frost, Minenleger, Flamme und Nekromant. Persönliche Arsenalboni gelten nicht.
- Gedraftete Türme wandern ins Inventar; kostenlose Platzierung über das gewohnte Turmbaumenü. Anzahl pro Typ steht dort und im Draft-Status. Platzierung prüft alle Ziele vor dem Verbrauch, auch bei Mehrfachauswahl. Ungültige oder doppelte Ziele kosten keine Inventargegenstände.
- Ab der zweiten Bauphase kann das dritte Angebot ein Upgrade-Ticket sein, wenn ein gebauter Turm noch normal verbessert werden kann und weniger als zwei unverbrauchte Tickets vorhanden sind. Ein Ticket bezahlt genau eine frei gewählte normale Verbesserung. Keine Arsenal-Ultimates.
- Vor Welle 4, 7 und 10 ersetzt bei beschädigter Basis eine Reparatur das zweite Angebot: sofort fünf Leben, höchstens 20. Andere Angebote bleiben echte Alternativen. Unverbrauchte Türme und Tickets werden über Wellen und Checkpoints erhalten.
- Kein Gold-Shop, Verkauf oder Rückbau, Basis-Ausbau, Verbrauchshilfen oder Endlosmodus. Bauen und Verbessern nur zwischen Wellen, auch während einer Kampfpause gesperrt. Regulär angezeigtes Gold ist in dieser Mission nicht ausgebbar; der Status erklärt das.
- Tagesabrechnung mit einmalig zehn Diamanten beim Sieg. Keine neuen Account-API-Felder oder Änderungen an öffentlichen Bestenlisten. Angebote, Auswahlbudget, Inventar und Tickets werden im bestehenden Run-Snapshot gespeichert.

### Lokal ausprobieren

Dev-Modus → isoliertes Erstspieler-Testprofil → Einstellungen → Entwicklertools → **„Turm-Draft testen · isoliertes Testprofil“**. Fester Testtag: 29.11.2026. Angebote auswählen, freie Bauplätze anklicken und aus dem Inventar bauen. Upgrade-Tickets werden über die normalen Verbesserungsknöpfe am gebauten Turm eingesetzt.

Lokaler Rotationsentwurf ab 29.11.2026: Turm-Draft → Expedition → Stromnetz → Drei Dörfer → Umweg → Gier → Karawane → Garnison. Frühere Tage bleiben unverändert. Vor Veröffentlichung den Stichtag auf einen noch nicht begonnenen UTC-Tag prüfen. Nicht gepusht.

### Prüfung

Sieben neue gezielte Tests: deterministische und verpflichtende Auswahl, Erhalt offener Angebote und Inventar, atomarer Verbrauch, Upgrade-Tickets und Sperren, passende Upgrade-/Reparaturangebote, begrenzte Heilung, identische Kampffortsetzung nach Snapshot, Controller-/Dev-Isolation, einmalige Tagesbelohnung und historische Rotation. Vollständige Zwölf-Wellen-Simulation mit dem tatsächlichen Dev-Tagesstartwert und einer gemischten Draft-Verteidigung bestanden, ohne zusätzliches Gold oder Inventar. Gesamte Client-/Serversuite: **802 Tests bestanden**. Keine Browserprüfung. Menschliche Abnahme von Schwierigkeit und Bedienung steht aus.

## 7. Wandernde Festung – lokal implementiert

- Zwölf Wellen an vier festen Stationen, jeweils drei Wellen pro Halt. Jede Station hat eine acht Hexe lange Zufahrt mit 16 Turmplätzen. Es gibt immer genau eine aktive Festung und eine aktive Gegnerzufahrt.
- Nach Welle 3, 6 und 9 wechselt die Festung automatisch zur nächsten Station. Ihre verbleibenden Leben bleiben unverändert; kein Gratisheilen. Gegner der nächsten Etappe laufen tatsächlich zur neuen Position, einschließlich der Zielsuche für Kröten-Abkürzungen. Abgeschlossene Stationen werden normale Felder.
- Alle gekauften Türme bleiben an ihren Standorten erhalten. In der Bauphase unmittelbar nach dem Wechsel können sie beliebig oft kostenlos auf freie Turmplätze der aktuellen Station umgesetzt werden. Kein Duplizieren, keine Rückerstattung, keine Neukäufe nötig. Turmobjekt, Stufe, Upgrades, Fokus, Abklingzeit, bezahlter Betrag und Statistik-ID bleiben erhalten; Statistikkoordinaten werden aktualisiert. Nicht umgesetzte Türme werden nicht gelöscht.
- Umsetzen ist nur nach dem Etappenwechsel möglich, nicht in den beiden anderen Bauphasen und nie während laufender oder pausierter Kämpfe. Ungültige/volle Plätze und fremde Stationen werden ohne Änderung abgewiesen. Abbruch mit Escape oder Abbrechen. Neue Türme und Upgrades sind nur zwischen Wellen möglich.
- 150 Startgold, normale Kill-/Wellenbelohnungen, geliehenes Tagesloadout ohne persönliche Arsenalboni. Keine Straßen-/Kartenbelohnungen, Gebäudeplätze, Basis-Upgrades oder Verbrauchshilfen. Kein Endlosmodus. Einmal täglich zehn Diamanten für das Überleben der zwölften Welle.
- Karte und Status zeigen aktuelle, nächste und abgeschlossene Stationen. Die Kamera folgt beim Wechsel; Zur Basis zentriert auf die aktuelle Festung. Deutsche und englische Texte sind hinterlegt.
- Snapshots erhalten Station, Umsetzphase, Türme und laufende Kampfrouten. Beim Etappenwechsel werden abgeschlossene Kampfreste wie Minen, Projektile und Gegnerzonen entfernt. Keine neuen Account-API-Felder und keine Änderungen an öffentlichen Bestenlisten.

### Lokal ausprobieren

Dev-Modus → isoliertes Erstspieler-Testprofil → Einstellungen → Entwicklertools → **„Wandernde Festung testen · isoliertes Testprofil“**. Fester Testtag: 07.12.2026. Nach Welle 3, 6 oder 9 einen vorhandenen Turm wählen, **„Turm kostenlos umsetzen“** anklicken und einen freien Bauplatz an der aktuellen Station auswählen.

Lokaler Rotationsentwurf ab 07.12.2026: Wandernde Festung → Turm-Draft → Expedition → Stromnetz → Drei Dörfer → Umweg → Gier → Karawane → Garnison. Der vorherige achttägige Draft-Zyklus bis einschließlich 06.12. bleibt erhalten. Vor Veröffentlichung den Stichtag auf einen noch nicht begonnenen UTC-Tag prüfen. Nicht gepusht oder veröffentlicht.

### Prüfung

Sieben neue gezielte Tests: Kartengeometrie, aktive Basis und echte Gegner-Endpunkte aller vier Etappen, Leben-/Turm-/Upgrade-/Statistikerhalt, kostenlose atomare Umzüge und Sperren, vollständige Zwölf-Wellen-Simulation mit regulär bezahlter gemischter Verteidigung, Snapshot-Fortsetzung nach Umzug und im Kampf, echte Niederlage ohne Verteidigung, Controller-Bedienung/Abbruch, Dev-Isolation, historische Rotation und einmalige Tagesbelohnung. Vollständige Client-/Serversuite: **809 Tests bestanden**. Keine Browserprüfung; menschliche Abnahme von Bedienung und Schwierigkeit steht aus.

## Ausgewählte Herausforderungen vollständig lokal umgesetzt

Gier, Umweg, Drei Dörfer, Stromnetz, Expedition, Turm-Draft und Wandernde Festung sind implementiert. Die Tagesrotationen sind lokale Entwürfe. Vor einem späteren Release sind die Einführungsdaten und das Spielerfeedback zu prüfen. Kein eigenständiger Push.
