# Schrittweiser Einstieg

Neue lokale Profile starten direkt im Standardspiel mit Bogenschütze und Katapult. Die Einführung läuft bis zur erfolgreich abgeschlossenen Welle 35. Freischaltungen gelten sofort im aktuellen Durchlauf und bleiben im Profil erhalten:

| Abgeschlossene Welle | Neue Funktion |
| --- | --- |
| 5 | Frostturm |
| 10 | Kettenblitz (Tesla) |
| 15 | Minenleger |
| 20 | Dünenmeer zusätzlich zu Grasland |
| 35 | Reguläre Spielmoduswahl mit Tagesherausforderung und Duo |

Es zählt die höchste überlebte Welle eines einzelnen Standarddurchlaufs. Wellen mehrerer Durchläufe werden nicht addiert. Neue Türme ergänzen die Leiste ohne die laufende Auswahl zu löschen. Hinweise warten auf das Ende von Kampf und Belohnungsdialogen. Die alten Tastenbelegungs- und Biomhinweise sowie normale Rekord-/Wellenjubel werden während der Einführung unterdrückt. Wächterbelohnungen bleiben erhalten.

Bis Welle 20 ist die Einführungswelt vollständig Grasland. Danach können neu erkundete Flächen Dünenmeer sein; bereits sichtbare Felder behalten Grasland. Weitere Biome kommen erst in regulären Durchläufen vor. Alle Event-Arten bleiben möglich, werden jedoch seltener und mindestens vier Hexschritte voneinander entfernt erzeugt. Gebäude, Verbrauchshilfen und Kartenbelohnungen sind unverändert spielbar.

Einführung überspringen ist im Hauptmenü und in den Einstellungen verfügbar. Dadurch stehen alle fünf Startertürme bereit; normale Weltgenerierung beginnt im nächsten Durchlauf. Das gewährt keine Diamanten, gekauften Verbesserungen, Festungen oder Welle-35-Erfolge. Tagesherausforderung und eigene Duo-Lobbys bleiben bis Welle 35 gesperrt. Einladungscode und Einladungslink funktionieren jederzeit.

## Speicherung und Migration

Das lokale Profil enthält introduction mit version, bestWave, skipped und legacy. Bestehende Profile ohne dieses Feld werden als Bestandsprofile mit vollem bisherigen Zugang übernommen. Ein alter tutorial-v1-Abschlussmarker ohne Profil wird ebenfalls berücksichtigt. Neue Profile werden beim ersten Laden gespeichert. Abgeschlossene Wellen werden sofort gespeichert, unabhängig vom Ende des Durchlaufs.

Profil-Export/Import und die bestehende Account-Synchronisierung transportieren das Feld. Automatisches Laden eines Account-Spielstands behält die jeweils höhere Einführungsstufe und gesetzte Überspringen-/Bestandsmarker. Ohne Konto oder Import erkennt ein anderer Browser das Gerät nicht wieder; dort kann die Einführung übersprungen werden.

## Prüfen

Automatisierte Abdeckung: tests/introduction.test.cjs, tests/account-sync.test.cjs sowie bestehende Profil-, Kampagnen- und UI-Tests. Zum manuellen Testen einen privaten Browser auf http://localhost:8080 verwenden: bestehende Profile werden absichtlich nicht zurückgestuft. Keine bestehenden Browserdaten löschen. Mobile Darstellung und Animationen sind vom Nutzer im Browser zu prüfen.

## Lokaler Erstspieler-Test

Auf localhost gibt es im Hauptmenü „Erstspieler-Test starten“. Der Test verwendet den eigenen Speicherbereich autohex-first-player-test:, beginnt mit einem frischen Profil und überspringt Modus- und Turmauswahl. „Zurück zu meinem Spielstand“ (auch in Einstellungen) beendet den Test. Ein erneuter Start löscht nur das Testprofil. Account-Anmeldung und Cloud-Synchronisierung sind im Test deaktiviert. Dies ist kein Admin-Account und verleiht keine Serverrechte.

Jeder neue Standarddurchlauf beginnt mit Grafikstil Normal; während eines Durchlaufs kann weiterhin Sakura gewählt werden.
