# Vorschläge: zusätzliche Türme und einmalige Gold-Hilfen

Status: Ideen zur Auswahl, nicht implementiert. Werte und Preise sind noch keine festgelegten Balancing-Vorgaben.

## Drei Türme

| Turm | Eigenständige Mechanik | Mögliche Spezialisierungen |
| --- | --- | --- |
| Resonanzglocke | Treffer legen Klangmarken auf Gegner. Bei drei Marken löst sich ein Impuls, der nahe Gegner trifft. Gut gegen dichte Gruppen; einzelne neue Gegner benötigen Anlauf. | Marken schneller auf einem Ziel aufbauen / beim Auslösen eine Marke an Nachbarn weitergeben. |
| Magnetkran | Entfernt pro Treffer einen kleinen, begrenzten Anteil gegnerischer Rüstung und sammelt Schrott. Nach mehreren Treffern feuert er einen schweren Schrottball. Gegen ungepanzerte Gegner lädt er deutlich langsamer. | Rüstungsabbau und Teamhilfe / stärkere Schrottgeschosse. Bosse erhalten reduzierte Rüstungsentfernung. |
| Sternwarte | Markiert die vorausberechnete Position eines Gegners; nach kurzer Verzögerung fällt dort ein Meteor. Starker Flächenschaden, aber schnelle Gegner können der Vorhersage entkommen. | Größerer Einschlagsbereich / präzisere, häufigere Einschläge gegen Einzelziele. |

## Drei Verbrauchsgegenstände auf der Straße

| Hilfe | Wirkung | Grenze |
| --- | --- | --- |
| Schrottbarriere | Verbraucht ein festes Schadensbudget an vorbeilaufenden Gegnern und zerbricht danach. | Verschwindet spätestens am Wellenende; blockiert keinen Weg. |
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

Empfohlener erster Umfang: Resonanzglocke, Schrottbarriere und Überladung. Diese ergänzen bestehende Schadens-/Effektsysteme und erlauben einen kleinen, gut testbaren ersten Schritt. Preise danach gegen Wellenbelohnungen prüfen; permanente Türme müssen langfristig effizienter bleiben als Verbrauchshilfen.
