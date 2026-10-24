# Herausforderungen: Testlabor und Prüfung vom 24.10.2026

## Benutzung

`npm start`, dann `/challenge-lab.html` öffnen oder im Hauptmenü „Herausforderungen testen“ wählen. Alle sieben neuen Missionen sowie Karawane und Garnison sind ohne Account und unabhängig vom heutigen Datum erreichbar. Das Labor ist auch auf einem öffentlichen Host verfügbar, sobald diese Dateien regulär veröffentlicht werden. Dieser Auftrag veröffentlicht nichts.

Jede Mission hat einen festen Referenztag und damit einen reproduzierbaren Seed. Die Zuordnung wird gegen den echten Tageskalender getestet. Bei einer späteren Änderung des Kalenders müssen diese Tests weiterhin bestehen; gegebenenfalls Referenztage bewusst aktualisieren.

Pro Mission wird ein separater Browser-Spielstand gespeichert. Beim Neuladen wird er fortgesetzt. „Neu starten“ fragt vor dem Verwerfen nach. „Mission wechseln“ und das Verlassen der Seite sichern den aktuellen Testlauf. „Testbericht“ pausiert den Lauf und zeigt eine kopierbare Vorlage mit Version, Mission, Seed, Welle und Phase; keine Accountdaten und kein automatischer Versand.

## Trennung von echten Daten

- Eigenes Speicherpräfix `autohex-challenge-lab-v1:<mission>:` für Profil, Autosave, Audio und Spieleinstellungen.
- Account-API und Account-Speicher werden in aktiven Laborseiten nicht initialisiert. Keine Cloud-Uploads, Anwesenheitsmeldungen oder Ranglisteneinträge.
- Keine Diamanten durch Testsiege. Tagesergebnisse werden ausschließlich im separaten Laborprofil geführt.
- Normale Fortsetzungen akzeptieren keine Labor-Snapshots. Ein Labor akzeptiert auch keine Snapshots einer anderen Mission.
- Teststände sind bewusst nur browsergebunden, auch bei einem sonst angemeldeten Nutzer. Es gibt keine API-Unterstützung für getrennte Cloud-Teststände; echte Accounts werden deshalb nicht verwendet.
- Kein Dev-Modus für öffentliche Besucher erforderlich oder freigeschaltet.

## Gefundene und behobene Fehler

1. Turm-Draft: Seitliche Schnellauswahl war trotz vorhandenem Inventar wegen 0 Gold gesperrt. Auswahl und Platzierung prüfen jetzt Inventar, zeigen Stückzahlen und belasten kein Gold. Doppelte Platzierung auf belegtem Platz verbraucht nichts.
2. Startmeldung fester Karten verwies auf das Legen einer Handkarte, obwohl keine Karten vorgesehen waren. Draft und feste Verteidigungsmissionen erklären jetzt ihren tatsächlichen ersten Schritt; im Labor erscheint die Missionsbeschreibung.

## Prüfungen

Automatisierte vorhandene Missionstests prüfen vollständige Kämpfe bis zum Missionsziel für Umweg, Dörfer, Stromnetz, Expedition, Draft und Festung; außerdem Niederlagen, Ziele, Belohnungen, gesperrte Aktionen, Ressourcen und Fortsetzungen. Gier prüft alle Verträge, zwölf Wellenabrechnungen und die Risikogrenze; diese Abrechnungstests sind kein vollständiger spielerischer Gewinnlauf.

Zusätzlich: alle neun Missionen mit jeweils drei unterschiedlichen Seeds durch echte erste Wellen inklusive Snapshot mitten im Kampf, identischem Ergebnis nach Wiederherstellung und Zeitlimit gegen hängenbleibende Wellen. Controller-Tests für Start, Speichern, Wiederherstellen und Neustart aller neun Missionen sowie Schutz echter Profil-/Speicherschlüssel, blockierte API-Initialisierung, keine Testdiamanten und Inventar-Schnellbau.

Lokale Browserprüfung mit 3D-Renderer: alle neun Labor-Missionen geöffnet; Draft-Angebote gewählt und Katapult bei 0 Gold platziert; Dorf- und Festungswelle gestartet; Strom-Leitfeld umgeschaltet; Umweg-Karte ausgewählt; Expeditionsstraße gelegt, Planung abgeschlossen und nach Reload wiederhergestellt; Giervertrag angenommen (+14 Gold); Testbericht geöffnet/geschlossen und Laborübersicht kontrolliert. Keine manuellen Komplettsiege aller Missionen behauptet. Die vollständigen Kampfabläufe sind automatisiert geprüft. Keine Live-Daten verwendet.

Die UI wird parallel neu gestaltet. Diese Prüfung ersetzt keinen abschließenden mobilen Layout- und Usabilitytest des neuen Designs.

## Nachprüfung: Umweg-Spielerfeedback

- Die festen Turminseln hatten `roads: []`, verwendeten aber das straßenhaltige Modell „Weites Land“. Sie verwenden jetzt das straßenlose Geradenmodell mit prozeduraler Geometrie (hier ohne Straßen). Reguläre Weites-Land-Karten behalten ihre Straße. Auch bestehende Mission-Snapshots werden korrekt dargestellt.
- Zusätzlicher Test enumeriert erlaubte Platzierungen und prüft für jede benachbarte Kante gegenseitigen Straßenanschluss. Isolierte Straßen und Straßen in Turminseln sind verboten.
- Drehen meldet jetzt eine einzig passende Ausrichtung oder ein Feld ohne passende Ausrichtung. Normale Karten mit unterschiedlich positionierten Bauplätzen behalten ihre Drehmöglichkeiten.
- Vorrat, Restbudget, Rücknahmen und Nachschub stehen ausdrücklich an den Missionssteuerungen; ausführliche Regeln sind aufklappbar.
- Angriffsstärken von `[3,6,9,12,15]` auf `[6,10,14,16,17]`. Gemessene HP nach den fünf Angriffen bei Seed `detour-test`: geplante Kurvenstrecke `20/20/20/20/17`, einfache Gerade `20/20/20/13/0`, Minimalstrecke `20/20/4/0`. Das ist ein Vergleich reproduzierbarer Strategien, kein Beweis für eine universell perfekte Balance.
- Gesamte lokale Suite nach diesen Änderungen: 836 Tests bestanden. Kein Push.

## Nachprüfung: Drei-Dörfer-Spielerfeedback

- Neue Durchläufe verwenden 32 statt 21 Hexe: gewundene Zufahrten mit gemeinsamem Streckenabschnitt und Abzweigungen zu drei Dörfern. Die Karte bleibt fest; freie Hex-Platzierung ist nicht Teil dieser Änderung. Die zwei kostenlosen Turmversetzungen je Bauphase bleiben erhalten.
- Markierungen an Eingängen und Dorfzielen zeigen den nächsten Angriff, während der Welle den laufenden Angriff. Beide Renderer verwenden dieselben Marker. Alte gespeicherte Karten behalten ihre bisherigen Eingänge und ihre Karte.
- Normale Wellen-Meilensteinfeiern und der Einstellungshinweis werden in täglichen Herausforderungen unterdrückt. Der echte Missionssieg bleibt bei zwölf abgeschlossenen Wellen erhalten.
- Gegnerstärke entspricht Welle plus einem zusätzlichen Stärkeschritt je drei Wellen, außerdem +10 % Leben und +25 % Rüstung. Startgold und Dorfleben bleiben unverändert.
- Reproduzierbare Kämpfe mit Seed `villages-v1|2026-11-08`: gemischte zentrale Verteidigung gewinnt mit 44/45 Dorfleben; eine ungleichmäßig auf Dorfzufahrten verteilte Kaufreihenfolge verliert in Welle 6. Zentraler Bogenschützenaufbau gewinnt mit 29/45 Leben. Diese Stichproben belegen keine universell perfekte Balance.
- 840 automatisierte Tests bestanden, darunter echte zwölf Wellen mit Boss, Niederlage, Straßenanschlüsse, gemeinsame Wegpunkte, Angriffsmarkierungen, Snapshot-Fortsetzung und unterdrückte Hinweise. Keine erneute visuelle Browserprüfung dieser Änderung. Kein Push.
- Zum Testen der neuen Karte im Labor einen neuen Drei-Dörfer-Durchlauf starten; vorhandene gespeicherte Karten werden nicht ersetzt.

## Abschlussprüfung vor Client-Release (24.10.2026)

- Alle neun Missionen auf Ziele, Handlungsanweisungen und Schwierigkeit geprüft. Eine aufklappbare Missionshilfe zeigt Wellenfortschritt und konkrete nächste Aktionen. Missionsfelder haben nun kontrastreiche Hintergründe und begrenzte, scrollbar bleibende Höhe.
- Stromnetz und Expedition: gemischte Referenzverteidigung gewinnt, dieselbe Kaufreihenfolge ohne Upgrades verliert in Welle 12 bzw. 11. Keine pauschale Erhöhung.
- Draft: ab Welle 4 pro weiterer Welle +10 Prozentpunkte auf Leben und vorhandene Rüstung/MR; Festung +8 Prozentpunkte. Anfang, Geschwindigkeit, Gegnerzahl und Gold bleiben unverändert.
- Draft mit drei Angebotsfolgen: gemischte Referenz endet mit 15/20/6 Leben. Festung mit Upgrades gewinnt; ohne Upgrades verliert die Vergleichsstrategie jetzt in Welle 11 statt vorher mit 6 Leben zu gewinnen.
- Gier: Referenz ohne Verträge gewinnt mit 20 Leben/0 Punkten, alle Eliteverträge mit 16 Leben/48 Punkten. Freiwilliges Risiko bleibt die zusätzliche Schwierigkeit; kein erzwungener Vertrag eingeführt.
- Karawane: einfache Vergleichsstrategie verliert in Welle 16; Garnison verliert mit dieser Kaufreihenfolge schon im ersten Angriff. Deshalb kein weiterer pauschaler Nerf. Diese Ergebnisse sind keine gemessene Spieler-Winrate und belegen keine optimale Strategie.
- Dorf-Rüstungskorrektur: Der Faktor wird nun tatsächlich auf armorHp angewendet, statt auf ein nicht genutztes armor-Feld.
- Browser auf separatem localhost-Laborprofil: Draft-Angebot ausgewählt, Inventarzuwachs geprüft, Reload erhalten; Expeditionshilfe mit Anschlussbedingung geöffnet; Stromnetz-Schalter und Lesbarkeit geprüft. Keine echten Accountdaten verändert. Komplette Siege sind automatisiert simuliert, nicht manuell im Browser durchgespielt.
- 844 automatisierte Tests erfolgreich; neue Tests decken Skalierung, unveränderte Einnahmen/Tempo, Hinweise, Dorf-Rüstung und gespeicherte Kampffortsetzung ab. Zusätzliche Übersetzungsprüfung nach Patchnotes bestanden.
- Veröffentlichung nur Client auf main: keine neue API-Migration, keine Datenbankzugriffe zum Schreiben. Historische Tageszuordnungen bis 24.10. bleiben erhalten. Sieben neue Missionen werden schrittweise ab 25.10. bis 07.12. in die Tagesrotation aufgenommen; im Labor sofort alle verfügbar.
