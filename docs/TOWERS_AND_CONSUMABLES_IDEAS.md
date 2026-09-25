# Vorschläge: zusätzliche Türme und einmalige Gold-Hilfen

Status: Krähenfüße, Klebeharz und Überladung sind implementiert. Die übrigen Vorschläge bleiben Ideen. Preise und Werte der ersten Version können nach Spieltests angepasst werden.

## Drei Türme

| Turm | Eigenständige Mechanik | Mögliche Spezialisierungen |
| --- | --- | --- |
| Resonanzglocke | Treffer legen Klangmarken auf Gegner. Bei drei Marken löst sich ein Impuls, der nahe Gegner trifft. Gut gegen dichte Gruppen; einzelne neue Gegner benötigen Anlauf. | Marken schneller auf einem Ziel aufbauen / beim Auslösen eine Marke an Nachbarn weitergeben. |
| Magnetkran | Entfernt pro Treffer einen kleinen, begrenzten Anteil gegnerischer Rüstung und sammelt Schrott. Nach mehreren Treffern feuert er einen schweren Schrottball. Gegen ungepanzerte Gegner lädt er deutlich langsamer. | Rüstungsabbau und Teamhilfe / stärkere Schrottgeschosse. Bosse erhalten reduzierte Rüstungsentfernung. |
| Sternwarte | Markiert die vorausberechnete Position eines Gegners; nach kurzer Verzögerung fällt dort ein Meteor. Starker Flächenschaden, aber schnelle Gegner können der Vorhersage entkommen. | Größerer Einschlagsbereich / präzisere, häufigere Einschläge gegen Einzelziele. |

## Drei Verbrauchsgegenstände auf der Straße

| Hilfe | Wirkung | Grenze |
| --- | --- | --- |
| Krähenfüße (vormals Schrottbarriere) | 20 Spitzen mit je 5 Schaden auf einem Straßenabschnitt. Ein Gegner verbraucht beim Durchlaufen so viele Spitzen, bis er stirbt oder der Vorrat leer ist. | 50 Leben ohne Schadensminderung verbrauchen 10 Spitzen; die übrigen 10 bleiben für nachfolgende Gegner. Ein ausreichend robuster Gegner verbraucht alle 20. Kein Wegblockieren. |
| Klebeharz | Ein kurzer Straßenabschnitt verlangsamt die nächsten Gegner für einige Sekunden. | Begrenzte Ladungen; stärkste Verlangsamung gilt statt beliebiger Stapelung. |
| Bannkreis | Die nächsten drei Gegner lösen eine kurze Unterbrechung ihrer Spezialfähigkeit aus, etwa Heilen oder Beschwören. | Verursacht keinen Schaden; Bosse werden nur kurz unterbrochen, nicht dauerhaft deaktiviert. |

## Drei Hilfen außerhalb der Straße

| Hilfe | Wirkung | Grenze |
| --- | --- | --- |
| Überladung | Auf einen eigenen Turm ziehen: kurze Zeit deutlich höhere Angriffsgeschwindigkeit. | Ein aktiver Effekt pro Turm; kein kostenloser dauerhafter Ausbau. |
| Zielsignal | Auf freiem Gelände platzieren: nahe Türme priorisieren vorübergehend das stärkste Ziel in ihrem eigenen normalen Radius. | Keine Reichweitenvergrößerung; Prioritäten werden nach Ablauf wiederhergestellt. |
| Notversorgung | Auf die Basis ziehen: ein temporärer Schutzpuffer fängt die nächsten wenigen Lebenspunktverluste ab. | Nur bis Wellenende, begrenzte Nutzung je Welle und kein Stapeln. |

## Bedienung und technische Leitplanken

Ein gemeinsames Verbrauchsmenü mit Goldpreis, Wirkungsbeschreibung und Platzierungsvorschau. Gold erst bei gültiger Platzierung abbuchen; Außenklick/Escape bricht ab. Touch: auswählen, Ziel antippen. Straßenhilfen binden sich an vorhandene Straßenabschnitte, andere Hilfen an Turm, Basis oder freies Gelände. Keine Wegänderung oder neue Wegsuche nötig. Effekte besitzen feste Laufzeit/Ladungen und werden in Run-Zwischenständen gespeichert. Im Duo prüft der Server Platzierung, Besitz, Gold und Nutzungslimits. Zunächst nur das eigene Spielfeld unterstützen.

Vom Nutzer ausgewählter erster Verbrauchsgegenstand-Umfang: Krähenfüße, Klebeharz und Überladung. Implementiert für Solo und servergesteuertes Duo. Diese ergänzen bestehende Schadens-/Effektsysteme und erlauben einen kleinen, gut testbaren ersten Schritt. Preise danach gegen Wellenbelohnungen prüfen; permanente Türme müssen langfristig effizienter bleiben als Verbrauchshilfen.


## Präzisierung der ausgewählten Verbrauchseffekte

Alle drei werden mit Gold für genau eine Welle gekauft. In der Bauphase platzierte Hilfen gelten für die unmittelbar folgende Welle. Nach deren Ende verschwinden sämtliche Restladungen, Straßenobjekte und Turm-Buffs automatisch, ohne Erstattung oder Übertrag in die nächste Welle. Zeitlich begrenzte Effekte können schon vorher auslaufen. Kein dauerhaftes Upgrade; Laden oder Duo-Wiederverbindung verlängern die Gültigkeit nicht.

Krähenfüße verbrauchen Ladungen pro Schadenstreffer, nicht pauschal eine Ladung pro Gegner. Tod wird nach jeder Spitze geprüft, damit keine weiteren Spitzen an einen bereits besiegten Gegner verloren gehen. Krähenfüße: 25 Gold, 20 × 5 physischer Schaden, gleicher Faktor gegen Leben/Rüstung/Magieresistenz; vorhandene physische Resistenzen gelten. Klebeharz: 30 Gold, 12 Gegner, 35 % Verlangsamung für 4 Sekunden; stärkste Verlangsamung und Gegnerresistenzen gelten. Überladung: 40 Gold, 50 % mehr Angriffstempo für 12 Sekunden auf einem eigenen angreifenden Turm; nicht stapelbar und nicht für reine Frost-Auren. In der Bauphase beginnt die Laufzeit erst im Kampf. Ein Straßenhex kann jeweils einen aktiven Vorrat jeder Art tragen. Käufe erfordern genügend Gold und ein gültiges Ziel; ohne gültiges Ziel keine Abbuchung. Mobile Bedienung über den Hilfen-Reiter.
