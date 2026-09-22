# Autohex TD – V0.7-dev

Tempo: gespeicherter Regler von 1× bis 8×; F schaltet 1× → 2× → … → 8× → 1×. Hintergrundtimer führt Waves auch ohne Bildschirmausgabe fort; gedrosselte Zeit wird schrittweise nachgeholt. Vollständig eingefrorene Tabs rechnen erst beim Aufwachen weiter. P pausiert weiterhin ausdrücklich. Freie Turmplätze sind weiß, Gebäudeplätze türkis markiert.

## Regionale Biome

Die Base und Radius 2 bleiben Grasland. Ab Radius 3 liegen drei zusammenhängende, leicht geschwungene Regionen, deren Ausrichtung vom Run-Seed abhängt. Beim Erkunden werden Bauplätze und Sonderfelder passend eingefärbt; Nebelfelder verraten ihr Biom nicht. Gelegte Hexe tragen den Biomnamen. Details stehen in den Einstellungen.

- Dünenmeer: Gegner innerhalb der Region bewegen sich 15 % langsamer. Türme dort haben 15 % weniger Reichweite.
- Sturmhochland: Kettenblitze springen 25 % weiter, Wind-Elementtürme durchschlagen ein zusätzliches Ziel. Archer und Balliste greifen 15 % seltener an.
- Aschelande: Flammentürme und Feuer-Elementtürme verursachen 20 % mehr Schaden. Freeze hat 15 % weniger Reichweite, Wasser-Slow hält 25 % kürzer.

Turmeffekte richten sich nach dem Standort des Turms, auch bei Angriffen über eine Biomgrenze. Sie werden mit Hex-, Gebäude- und Upgradeboni kombiniert; Vorschau und Turmwerte berücksichtigen sie. Nur das Wüstentempo richtet sich nach dem aktuellen Ort des Gegners. Die Herausforderung „Die letzte Karawane“ bleibt von diesen regionalen Effekten ausgenommen.

## Die letzte Karawane

Dauerhaft verfügbare tägliche Herausforderung im Hauptmenü, täglich neuer Seed um 00:00 UTC. Standardfestung, zwei zufällige Base-Ausgänge und zwei Startplatzierungen aus fünf Karten: zweimal Gerade, Lange Straße, Handelsstraße, Dorfstraße. Festes temporäres Loadout: Archer, Balliste, Katapult, Minenleger, Freeze; keine Stufe-4-Upgrades. Sandsturm senkt Gegnertempo und Turmreichweite um 15 %. Jeder zehnte normale Gegner über alle Waves trägt eine sichtbare Kasse: 18 statt 3 Killgold; beim Durchbruch zusätzlich zum HP-Schaden 10 Gold Verlust, maximal vorhandenes Gold. Überlebe Wave 20: einmal pro Tag 10 Diamanten. Wiederholungen nutzen denselben Tages-Seed, Tagesbestmarken werden separat lokal gespeichert. Keine normale Run-Diamantenabrechnung oder normale Bestwave durch diesen Modus.

Standard-Runs und Zwei Fronten besitzen regionale Biome; die Karawane verwendet ihre eigene Sandsturmregel ohne zusätzliche Biommodifikatoren.

## Schwierigkeit „Zwei Fronten“

In der Runvorbereitung lässt sich Stufe 2 wählen. Die Base erhält zwei verschiedene, zufällige Ausgänge; gleicher Seed ergibt dieselben Ausgänge. Gegenüberliegende, benachbarte und versetzte Kombinationen sind möglich. Du beginnst mit fünf Handkarten und legst zwei davon nacheinander: eine direkt an jeden Ausgang. Erst danach kannst du Türme bauen und Wave 1 starten. Die erste Platzierung wird nur zugelassen, wenn der zweite Ausgang mit der restlichen Hand noch bebaubar bleibt. Alle fünf Karten gehen anschließend regulär auf den Ablagestapel. Ab dem nächsten Zug gelten wieder drei Handkarten und eine Platzierung. Startgold, Wave-Gegnerzahl und Diamantenformel bleiben gleich. Auswahl und Wiederholungsbutton behalten die Schwierigkeit.

## Neue Türme und Bedienung (20.09.2026)

- Elementturm: 45 Diamanten zum Freischalten, 50 Gold zum Bauen. Erste Spezialisierung (40 Gold) wählt dauerhaft Feuer mit Flächenschaden, Wasser mit Treffer-Slow oder Wind mit durchschlagenden Angriffen. Jede Wahl hat einen finalen Ausbau (70 Gold). Element-Ultimate: 35 Diamanten zum Freischalten, 120 Gold im Run; Name je Zweig Weltenbrand (Feuer), Ozeanherz (Wasser), Himmelssturm (Wind).
- Nekromantenturm: 55 Diamanten / 60 Gold. Nahe getötete Gegner liefern jeweils genau einem Nekromanten eine Seele. Bis zu drei Geister bleiben sechs Sekunden und greifen einmal pro Sekunde an. Seelenchor/Geisterlegion erhöhen die Anzahl, Seelenhüter/Lichfürst Dauer und Schaden. Seelenkrone: 40 Diamanten / 130 Gold. Geister blockieren keine Einheiten und verschwinden beim Verkauf ihres Turms oder am Wave-Ende.
- Beide Türme nutzen normale Loadout-, Zielprioritäts-, Terrain-, Schmiede- und Upgrade-Regeln. 3D-Darstellung wird prozedural erzeugt, SVG besitzt eigene Symbole; keine zusätzlichen GLB-Dateien erforderlich. Balancewerte sind erste Spieltestwerte.
- Escape schließt offene Menüs und Infofenster; Hinweis am Schließen-Button und in Einstellungen. Die Kopfzeile bleibt beim Scrollen sichtbar. Mehr Abstand zwischen Handkarten und Phasenanzeige.


Stand: 20.09.2026, einschließlich lokaler Änderungen. Spielbarer Browser-Prototyp eines Hex-Tower-Defense-Deckbuilders. Diese Datei beschreibt den aktuell implementierten Stand. Frühere Zwischenstände stehen im [Entwicklungsverlauf](CHANGELOG.md), spätere Ziele im [Projektgedächtnis](../ai/BRAIN.md). Das ausführliche [Übergabeprotokoll](README_TowerDefense_Projekt.md) enthält die Konzepthistorie.

## Starten und Bedienung

**3D-Ansicht:** einmalig `npm install`, dann `npm start` und `http://localhost:8080` öffnen (Modell-Galerie: `/viewer.html`). Ein lokaler Server ist nötig, weil der Browser `.glb`-Dateien nicht per Doppelklick lädt. Per Doppelklick auf `index.html` oder mit `?svg` läuft weiterhin die SVG-Ansicht. Modellvorgaben: [ASSET_SPEC.md](ASSET_SPEC.md). Für die Logiktests wird Node.js benötigt.

| Aktion | Bedienung |
|---|---|
| Karte auswählen / Hex platzieren | Karte anklicken, dann freie Position anklicken |
| Hex drehen | R oder Mausrad-Klick (im Uhrzeigersinn); Hinweis an der Vorschau |
| Wave starten | Leertaste oder Wave-Button |
| Spieltempo 1× bis 8× | Regler; F erhöht um eine Stufe, nach 8× wieder 1× |
| Kamera zoomen | Mausrad oder +/− |
| Karte verschieben | 3D: linke Maustaste ziehen (SVG: rechte oder mittlere) |
| Ansicht drehen und kippen | Nur 3D: rechte oder mittlere Maustaste ziehen; Q/E drehen links/rechts. Mausrad-Klick dreht während der Platzierung das Hex |
| Kamera zurücksetzen | Zur Base |
| Turm kaufen | Freien Turmplatz anklicken, dann Turmangebot wählen |
| Turmwerte / Upgrades | Gesetzten Turm anklicken |
| Gebäudeinformationen / Ausbau | Gebäudeslot auf Dorfhex anklicken |
| Wave-, Gold- und Deckplanung | Jeweiligen Wert oben im Header aufklappen |

Optionaler Auto-Start startet eine Wave nach dem Placement beziehungsweise nach Abschluss einer Shrine-Auswahl. Sounds lassen sich ausschalten; Lautstärke ist einstellbar. Die Effekte werden lokal mit WebAudio erzeugt.

## Run und Rundenablauf

Die HUD-Dropdownpfeile zeigen den Öffnungszustand an. Neben dem Diamantenbestand steht in Klammern der aktuell auszahlbare Ertrag dieses Runs. In den Einstellungen lässt sich ein dauerhaft gespeichertes Hex-Grid für SVG und 3D aktivieren (Hotkey G). Q/E drehen die 3D-Kamera nach links/rechts. Gebäude markieren bei Auswahl und Hover ihre betroffenen Hexe: Schmiede und Markt das eigene Feld und direkte Nachbarn, das Haus nur sein eigenes Feld.

- Standard-Start: 20 Base-HP, 70 Gold (andere Heroes siehe unten), eine Straßenöffnung an der Base und fünf Deckkarten: zweimal Gerade, Kleine Kurve, Große Kurve, Y-Kreuzung.
- Drei Karten ziehen, eine auswählen und platzieren. Danach wird die gesamte Hand abgelegt. Ein leerer Nachziehstapel wird aus dem gemischten Ablagestapel aufgefüllt.
- Nach dem Placement Türme beziehungsweise Gebäude bauen und die Wave starten. Bauen und Tower-Upgrades bleiben auch während der Wave möglich.
- Nach jeder überlebten Wave: Abschlussgold und laufendes Hex-/Gebäudeeinkommen. Alle zwei Waves eine von drei Karten für das Deck auswählen.
- Zusätzlich gibt es vorläufig nach dem Reward jeder sechsten Wave eine kostenlose optionale Kartenentfernung. Mindestens fünf Deckkarten müssen verbleiben.
- Der Run endet bei erschöpften Base-HP und zahlt dann Diamanten ins lokale Meta-Profil aus. Laufende Runs können noch nicht gespeichert oder geladen werden; ein endgültiges Siegziel fehlt ebenfalls.

### Platzierung und Straßen

Alle Straßenanschlüsse zu bereits belegten Nachbarn müssen gegenseitig passen; das neue Hex muss an das Netz anschließen. Schleifen sind erlaubt, aber mindestens ein mit der Base verbundener Gegner-Eingang muss offen bleiben. Die letzte Öffnung darf nicht in einer vollständig eingeschlossenen Einzelzelle enden. Es gibt keine vollständige Vorausberechnung mehrerer zukünftiger Züge.

Unspielbare Hände werden neu gezogen. Passt keine Karte aus dem gesamten Deck, erscheint nach Möglichkeit ein kostenloses Rettungshex mit passenden Anschlüssen und ohne Slots/Boni. Es gehört weder dauerhaft zum Deck noch zum Rewardpool. Ist auch das nicht möglich, kann die Bauphase ohne Erweiterung fortgesetzt werden.

Die Platzierungsvorschau erscheint nur an der Cursorposition und enthält rotierte Turm- und Gebäudeslots. Straßen treffen sich an gemeinsamen Hexkanten und werden unter allen Türmen gezeichnet.

## Einstieg und Bedienhilfen

Neue Spielende erhalten beim ersten Run ein kurzes Tutorial im mittigen Hinweisfeld über der Karte: Karte wählen/drehen, Hex platzieren, freien Turmplatz wählen, Turm kaufen und Wave starten. Schritte folgen den tatsächlichen Aktionen. Überspringen und Abschluss werden gespeichert; in den Einstellungen lässt sich das Tutorial erneut starten. Auto-Start wird während des Tutorials zurückgehalten. Profile mit bereits abgeschlossenen Runs bekommen keine automatische Einführung.

Freie Turmplätze sind während Bau- und Wavephase mit schwebenden, langsam rotierenden goldenen Diamanten markiert. Die gespeicherte Einstellung „Freie Turmplätze hervorheben“ schaltet das aus. Menüs nutzen den Bereich zwischen den festen Bedienelementen und scrollen bei langen Inhalten; Wave-Start, Tempo, Hand/Bauphase, Kamera und Turm-Shop bleiben ausgespart.

## Heroes und Base-Ausbau

Vor dem Run wird neben den fünf Türmen ein gemeinsames Hero-/Festungsprofil gewählt. Alle drei sind frei verfügbar; die bestätigte Auswahl wird im Browserprofil gespeichert. Der laufende Run behält seinen Hero. Erneuter Run mit gleichem Loadout übernimmt auch den Hero, setzt jedoch alle Base-Upgrades zurück.

| Profil | HP | Startgold | Besonderheit |
|---|---:|---:|---|
| Standardfestung | 20 | 70 | Zwei Stufen je Ausbaupfad |
| Festungsbauer | 20 | 55 | 25 % günstigere Base-Upgrades (Kosten aufgerundet), dritte Stufe |
| Händlerstadt | 15 | 90 | +2 Gold je überlebter Wave, Base-Waffe −25 % Schaden |

Klick auf die Base oder den Base-Button im HUD öffnet das Ausbaumenü. Käufe sind während Hex-Platzierung, Bau- und Wavephase möglich und kosten Run-Gold. Die HP-Anzeige nennt aktuelle und maximale HP. Eine gekaufte Waffe zeigt bei geöffnetem Base-Menü ihre Reichweite.

| Stufe | Mauern: Kosten / zusätzliche HP | Waffe: Kosten / Schaden / Reichweite / Intervall |
|---|---|---|
| 1 | 35 Gold / +5 | 45 Gold / 12 / 150 / 1 s |
| 2 | 60 Gold / +5 | 80 Gold / 24 / 165 / 0,9 s |
| 3 (nur Festungsbauer) | 90 Gold / +10 | 120 Gold / 38 / 180 / 0,8 s |

Tabellenwerte vor Hero-Modifikatoren. Mauern erhöhen maximale und aktuelle HP um den genannten Betrag; bestehender Schaden wird nicht vollständig repariert. Waffenstufen ersetzen die vorherigen Waffenwerte. Die automatische Base-Waffe verursacht Einzelzielschaden gegen Leben, Rüstung und Magieresistenz und nutzt die normale Kill-/Bossabrechnung. Sie belegt keinen Turmplatz im Loadout und erhält keine Turm-Upgrades oder Schmiede-/Marktboni. Eigene Modelle für Ausbauzustände sind noch nicht vorhanden; die Waffe nutzt sichtbare Pfeileffekte.

## Deck und Hexkarten

Das Deck enthält ausschließlich Maphex-Karten. Gezogene Belohnungen werden erst nach Auswahl ins Deck und den Ablagestapel aufgenommen. Kartenentfernung löscht genau eine Kopie; bereits platzierte Hexe und Türme bleiben bestehen. Der Deck-Dropdown zeigt Gesamtdeck, Nachzieh- und Ablagestapel, aber keine zukünftige Ziehreihenfolge.

| Hex | Rarität | Turmplätze | Effekt |
|---|---|---:|---|
| Spiegel-Abzweig | Uncommon | 2 | Gespiegelte T-Kreuzung: Durchgang mit Abzweig auf der anderen Seite. |
| Fächerkreuzung | Uncommon | 2 | Drei Straßenenden auf einer Seite. Zwei Turmplätze im Rücken. |
| Seitenkreuzung | Rare | 2 | Vier aufeinanderfolgende Straßenenden für neue Anschlüsse. |
| Bastionssackgasse | Epic | 2 | Ein Straßenanschluss; darf das letzte mit der Base verbundene offene Ende nicht schließen. Bleibt unabhängig davon im Ziehpool. |
| Späherbogen | Epic | 1 | Kleine Kurve: +30 % Turmreichweite auf diesem Hex. |
| Veteranengabel | Epic | 2 | Y-Kreuzung mit 2 Turmplätzen und +20 % Turmschaden. |
| Goldroute | Epic | 1 | Gerade mit einem Turmplatz und +4 Gold je Wave. |
| Drachenbogen | Legendary | 1 | Kleine Kurve: +40 % Turmschaden und +20 % Reichweite. |
| Kronenkreuzung | Legendary | 2 | Sechs Anschlüsse, 2 Turmplätze, +20 % Schaden und Reichweite. |
| Königsbogen | Legendary | 1 | Große Kurve: +5 Gold je Wave, Gebäudeslot und +20 % Turmreichweite. |
| Versorgungsweg | Rare | 1 | Gerade Straße, +2 Gold je überlebter Wave |
| Signalkreuzung | Epic | 2 | Vier Straßenenden, +20 % Turmreichweite |
| Gerade | Common | 1 | Gerade Straße |
| Kleine Kurve | Common | 1 | Enge 60°-Kurve |
| Große Kurve | Common | 1 | Weite Kurve |
| Y-Kreuzung | Uncommon | 2 | Drei gleichmäßig verteilte Straßenarme |
| T-Kreuzung | Uncommon | 2 | Links-rechts-Durchgang mit seitlichem Abzweig |
| Sechserkreuzung | Rare | 2 | Öffnungen in alle sechs Richtungen |
| Weites Land | Uncommon | 2 | Gerade Straße mit zwei Plätzen |
| Lange Straße | Uncommon | 2 | Gewundene Straße mit tatsächlich längerem Laufweg |
| Belagerungsgerade | Rare | 1 | +25 % Schaden für Katapult auf diesem Hex. |
| Blitzgabel | Rare | 2 | +25 % Schaden für Kettenblitz auf diesem Hex. |
| Frostbogen | Rare | 1 | +25 % Reichweite für Freeze auf diesem Hex. |
| Minenstraße | Rare | 2 | +25 % Schaden für Minenleger auf diesem Hex. |
| Schützenlinie | Rare | 1 | +25 % Schaden für Balliste auf diesem Hex. |
| Glutknick | Rare | 1 | +25 % Schaden für Flammenturm auf diesem Hex. |
| Elementkreuzung | Rare | 2 | +25 % Schaden für Elementturm auf diesem Hex. |
| Seelenabzweig | Rare | 2 | +25 % Schaden für Nekromantenturm auf diesem Hex. Gilt auch für Geister. |
| Waldkurve | Rare | 1 | +25 % Archer-Schaden auf diesem Hex |
| Kreuzung | Rare | 2 | Vier Straßenenden |
| Dorfstraße | Rare | 1 | Automatisch +2 Gold/Wave und ein Gebäudeslot |
| Handelsstraße | Rare | 0 | +4 Gold/Wave |
| Höhenkreuzung | Epic | 1 | Drei Straßenenden, +25 % Tower-Reichweite |
| Kampfstraße | Epic | 1 | Gerade Straße, +20 % Schaden für Schadentürme |
| Wachtkurve | Epic | 2 | Kurve, +15 % Tower-Reichweite |
| Bastionskreuzung | Legendary | 2 | Drei Straßenenden, +40 % Tower-Reichweite, +2 Gold/Wave |
| Königsstraße | Legendary | 1 | Gerade Straße, +5 Gold/Wave und ein Gebäudeslot |
| Kriegskreuzung | Legendary | 2 | Vier Straßenenden, +30 % Tower-Schaden |

Turmspezifische Karten (einschließlich Waldkurve) erscheinen nur für Türme im gültigen Run-Loadout: regulär freigeschaltet, in Herausforderungen gegebenenfalls temporär verliehen. Der Filter gilt für normale, Wächter- und Shrine-Kartenbelohnungen. Freeze erhält +25 % Reichweite, die übrigen Turmkarten +25 % Schaden; Seelenabzweig verstärkt auch Geister.

Reichweitenboni gelten auch für Auren und ausgebaute Türme. Karten sind gleich breit und haben gemeinsame Zeilen für Rarität, Hexbild, Titel, Beschreibung und Slots. Raritätsfarben: Common grau, Uncommon grün, Rare blau, Epic lila, Legendary orange.

Normale Kartenrewards nutzen Raritätsgewichte 55 / 30 / 12 / 3 / 1. Das sind Gewichte, keine garantierten festen Prozentsätze für eine Drei-Karten-Auswahl: Drei unterschiedliche Karten werden ohne Zurücklegen ausgewählt, verfügbare Raritäten werden jeweils neu gewichtet.

## Türme und Upgrades

Listenwerte vor Terrain-, Gebäude- und Upgradeboni:

| Turm | Preis | Schaden | Reichweite | Schussintervall / Wirkung |
|---|---:|---:|---:|---|
| Archer | 25 | 9 | 150 | 0,55 s; Einzelziel |
| Katapult | 40 | 18 | 190 | 1,35 s; geradlinig durch maximal drei Gegner (auch mit Upgrades) |
| Kettenblitz | 45 | 8 | 135 | 0,9 s; bis drei Ziele, Sprungabstand 75 |
| Freeze | 30 | 0 | 145 | Permanente Aura: Gegner bewegen sich mit 50 % Tempo |
| Minenleger | 35 | 24 | 150 | Legt während einer Wave stapelbare Wegminen; nicht ausgelöste Minen verschwinden am Wave-Ende |
| Balliste | 55 | 46 | 235 | 1,9 s; freischaltbarer Elite-/Bosskiller |
| Flammenturm | 50 | 14 | 115 | 0,7 s; freischaltbarer Flächenschaden im Radius 48 |

Freeze schießt nicht. Seine Aura bleibt leicht sichtbar; mehrere Freeze-Auren stapeln sich nicht, die stärkste Verlangsamung wirkt. Angeclickte Türme zeigen einen halbtransparenten Reichweitenkreis. Nach dem Platzieren öffnet sich kein Upgradefenster automatisch.

Jeder Turm hat zwei alternative Spezialisierungen und anschließend eine zum gewählten Zweig passende finale Stufe. Darüber liegt eine vierte, turmweite Meta-Stufe: Sie muss einmal im Arsenal mit Diamanten freigeschaltet und danach in jedem Run mit Gold gekauft werden.

| Turm | Zweig A | Zweig B |
|---|---|---|
| Archer | Scharfschütze: Schaden/Reichweite | Salven: Flächenschaden |
| Katapult | Belagerung: schwere Treffer/Reichweite | Steinhagel: schneller schießen |
| Kettenblitz | Sturmnetz: mehr Ziele/Sprungweite | Überladung: stärkere Treffer |
| Freeze | Tiefenfrost: stärkerer Slow | Frostfeld: größere Aura |
| Minenleger | Sprengmeister: schwere Großminen | Minenfeld: schnelle Gruppenminen |
| Balliste | Harpunenbolzen: maximale Einzeltreffer | Repetierwerk: höhere Feuerrate |
| Flammenturm | Inferno: großer, schwerer Flächenschaden | Lauffeuer: schnelle kleine Feuerstöße |

Das Turmmenü zeigt aktuelle Werte und Änderungen durch Upgrades. Symbole, Farben, Ringe und Stufenanzeigen machen den Ausbau sichtbar. Ein kleiner überlappender Pfeil zeigt bezahlbare Upgrades an.

Turmrückgabe erstattet 100 % der tatsächlich investierten Kosten inklusive Upgrades, solange der Turm in der aktuellen Bauphase gebaut wurde und die Wave noch nicht begonnen hat. Danach und in anderen laufenden Spielphasen ist Verkauf für 50 % der Gesamtinvestition möglich, einschließlich finaler Upgrades. Ungerade Rückzahlungen werden abgerundet; Rabatte zählen anhand tatsächlich bezahlter Preise. Das Turmmenü nennt Quote und Goldbetrag. Nach Game Over kein Verkauf. Gebäude verwenden dieselbe Verkaufsregel einschließlich bezahlter Ausbaukosten und lassen sich auf Stufe 3 ausbauen.

## Turm-Loadout

Vor jedem neuen Run wird ein Loadout aus genau fünf unterschiedlichen freigeschalteten Turmtypen bestätigt. Neue Profile starten mit Archer, Katapult, Kettenblitz, Freeze und Minenleger. Nur diese fünf Typen erscheinen während des Runs im Baumenü; sie werden weiterhin mit Run-Gold gebaut. Das aktive Loadout wird lokal im Browserprofil gespeichert und beim Runstart in den Runzustand kopiert.

## Meta-Profil und Diamanten

Am Runende werden Diamanten ausgezahlt: `floor(erreichte Wave / 2)`, zusätzlich +5 je besiegtem regelmäßigen Boss, +3 je Erkundungsboss und +2 je erstmals erreichtem Zehnerwellen-Meilenstein. Runs vor Wave 2 geben keine reine Wave-Belohnung. Der Game-over-Bildschirm zeigt die Bestandteile einzeln. Profil, Diamanten, Bestwave, Runanzahl, Bosskills, normale Kills und die letzten abgerechneten Run-IDs werden in `localStorage` gespeichert; die letzten 100 abgerechneten Run-IDs schützen vor wiederholter Auszahlung. Ein manueller Run-Neustart rechnet den abgebrochenen Run derzeit nicht ab.

Im Arsenal können die Balliste für 20 Diamanten und der Flammenturm für 35 Diamanten dauerhaft freigeschaltet werden. Zusätzlich besitzt jeder Turm ein eigenes Stufe-4-Upgrade für 20 Diamanten bei Starttürmen beziehungsweise 30 Diamanten bei den zusätzlichen Türmen. Drei Loadout-Presets, Rollenwarnungen und lokale Statistiken zu Käufen, Upgrades, Nutzung und bester Wave schließen Etappe 3 ab. Freigeschaltete Türme erscheinen in der Runvorbereitung, erhöhen aber nicht die fünf Loadoutplätze.

## Dorfgebäude

Das automatische Dorfeinkommen benötigt keinen Ausbau. Im angeklickten Gebäudeslot kann genau ein Gebäude gebaut werden:

| Gebäude | Preis | Effekt |
|---|---:|---|
| Haus | 30 | Zusätzlich +3 Gold/Wave; Dorf und Haus zusammen +5 |
| Schmiede | 40 | +20 % Tower-Schaden auf eigenem und direkt benachbarten Hexen |
| Markt | 35 | 15 % Rabatt auf Towerbau und Tower-Upgrades auf eigenem und direkt benachbarten Hexen |

Gleiche Supporteffekte stapeln sich nicht. Rabatte werden auf volle Goldstücke aufgerundet und gelten nicht für Gebäude. Schmieden wirken auch auf bestehende und ausgebaute Türme, nicht auf die schadensfreie Freeze-Aura.

## Waves, Gegner und Gold

Jedes offene Straßenende auf einem erreichbaren Nicht-Base-Hex ist ein Spawnpunkt. Normale Gegner verteilen sich über diese Fronten. Jede Einheit entscheidet an jeder Gabelung unabhängig und gleichverteilt zwischen allen noch nicht besuchten Ausgängen, von denen die Base erreichbar bleibt. Damit werden auch längere Umwege genutzt, während Sackgassen und Kreisläufe ausgeschlossen sind.

- Wavegröße: fünf Gegner in Wave 1, danach `5 + 2 × Wave` normale Gegner, ohne die bisherige 24er-Grenze. Grund-HP: `round((28 + 7 × Wave) × 1,10^max(0, Wave − 3))`. Die ersten drei Waves bleiben beim bisherigen HP-Verlauf.
- Ab Wave 15 erscheint alle zehn Waves zusätzlich ein Belagerungswächter an einem zufälligen erreichbaren Eingang. Der Startbutton und die Wave-Vorschau kündigen ihn an.
- Ab Wave 3 erscheinen schnelle Schwarmgegner. Ab Wave 4 kommen gepanzerte Gegner mit einem separaten Rüstungspool, ab Wave 5 magiegeschützte Gegner mit separater Magieresistenz. Bosse besitzen alle drei Pools. Rüstung und Magieresistenz sind zusätzliche Trefferpunkte und werden in eigenen Balken dargestellt.
- Gegner können sich durchlaufen und überholen. Ein neuer Gegner erscheint frühestens nach der Zeit, die sein Vordermann für 20 Einheiten braucht (mindestens 320 ms). Unterwegs beeinflussen andere Einheiten das Bewegungstempo nicht; Verlangsamungen durch Türme bleiben wirksam.
- 3D-Modelle: normal = Kiwi-Krieger mit Hammer, Schwert und der Widmung „VIK“ auf dem Bauch, gepanzert = Ork mit Schild, Schwarm = Kobold, magiegeschützt = Goblin-Runenmeister mit Schutzsphäre, Boss = Obsidian-Wächter. Ohne Modell zeichnet der Renderer farbige Kugeln.
- Jeder Schadensturm zeigt seine Werte gegen Leben, Rüstung und Magieresistenz. Für normale Angriffstürme lassen sich drei geordnete Zielprioritäten einstellen, darunter Boss, meiste Rüstung, meiste Magieresistenz, meistes/wenigstes Leben sowie Nähe zu Turm oder Base.
- Normaler Kill: +3 Gold. Überlebte Wave: +10 Gold plus Hex-/Hausboni. Normaler Gegner an der Base: 1 Schaden.
- Wave-Dropdown zeigt nächste Gegnerzusammensetzung, HP und bereitstehende Bosse. Gold-Dropdown zeigt Quellen, maximale Einnahmen und Towerpreise. Laufende Prognosen berücksichtigen verbleibende Gegner und Bossloot.
- 2× beschleunigt Bewegung, Spawnabstände, Cooldowns und Effektzeiten gemeinsam. Nach Wave-Ende bleiben keine eingefrorenen Schusslinien stehen.

## Erkundung und Sonderfelder

Von jedem gesetzten Hex aus: **Radius 2 klare Sicht**, **bis Gesamtradius 6 Fog of War**, danach keine Sicht und keine Fragezeichen. Die Sicht wächst mit der Bebauung. Darstellung wieder sparsam: freie Nachbarhexes und sichtbare Sonderfelder, keine großen Sichtflächen und kein flächendeckendes Hexraster.

Neue erkundete Koordinaten erzeugen seedbasiert weitere Sonderfelder. Bereits erkundete Felder werden nicht neu gewürfelt. Innerhalb Radius 2 der Base entstehen keine Sonderfelder.

| Typ | Anteil unter Sonderfeldern | Chance je geeignetem Feld |
|---|---:|---:|
| Schatz | 55 % | 2,475 % |
| Shrine | 30 % | 1,35 % |
| Boss | 15 % | 0,675 % |
| Insgesamt | 100 % | 4,5 % |

Keine garantierte Anzahl oder feste Startliste. Wächterfelder entstehen nie innerhalb von vier Hexen um die Base; der früheste mögliche Abstand ist fünf. Im Nebel erscheinen Sonderfelder als `?`, bei klarer Sicht als graues Symbol mit ungesammeltem beziehungsweise inaktivem Status. Sonderfelder sind **vorgefertigte Hexe mit fester Straßengeometrie und Rotation**. Schatz und Shrine verwenden Gerade, Kleine/Große Kurve, Y- oder T-Kreuzung, bei Bedarf eine Sechserkreuzung; Bossfelder haben immer alle sechs Öffnungen. Direkt benachbarte Eventfelder erhalten beidseitig passende Straßenanschlüsse. Die Generierung berücksichtigt auch noch nicht erkundete Nachbarn und verändert bestehende Formen später nicht. Im Nebel ist die Geometrie verborgen, bei klarer Sicht werden graue Straßen und mögliche Slots angezeigt. Diese Felder dürfen nicht mit einer Handkarte überschrieben oder gedreht werden. Eine passende Straße vom gebauten Nachbarhex schließt das Feld automatisch ans Netz an und aktiviert es; eine vorbeiführende Straße reicht nicht. Sonderfelder geben nur ihren Sonderbonus, Schatz und Shrine haben einen Turmplatz, Bossfelder keinen.

### Schatz und Shrine

Schätze geben einmalig +20 Gold. Shrines verbergen ihren konkreten Effekt bis zur Erschließung:

| Shrine-Effekt | Wahrscheinlichkeit |
|---|---:|
| Eine Kartenkopie entfernen, Mindestdeckgröße fünf | 20 % |
| Eine zusätzliche Karte aus bis zu drei Angeboten wählen | 20 % |
| Eine Epic-Karte erhalten | 20 % |
| Eine Legendary-Karte erhalten | 10 % |
| Heilquelle: bis zu +5 HP, bei voller Gesundheit +30 Gold | 15 % |
| Werksegen: kostenloses Turm-Upgrade, sonst +30 Gold | 15 % |

Der Epic-Pool enthält Höhenkreuzung, Kampfstraße, Wachtkurve und Signalkreuzung; der Legendary-Pool Bastionskreuzung, Königsstraße und Kriegskreuzung. Raritätsspezifische Shrine-Rewards bieten bis zu drei Karten zur Auswahl. Der Werksegen bietet normale Upgradezweige bzw. deren finale Stufen für bereits gebaute Loadout-Türme; keine gesperrten Stufe-4-Upgrades. Gratis-Upgrades erhöhen den Verkaufswert nicht. Das Fenster nennt direkt „Shrine erschlossen“ und den Effekt. Auswahl oder Überspringen verbraucht den Shrine. Danach Bauphase ohne erneutes Handziehen; Auto-Start wartet auf die Entscheidung. Schatz und Shrine haben einen Collect-Sound.

### Boss

**Regelmäßige Bosswellen:** In Wave 15, 25, 35 usw. erscheint ein Belagerungswächter unabhängig von erkundeten Sonderfeldern. Der Eingang wird gleichverteilt aus den aktuellen erreichbaren Straßenenden gewählt; gleiche Seeds und Kartenentscheidungen wiederholen die Auswahl. Basisleben: `round(1200 × ((Wave − 5) / 10)^1,8)`, dazu 25 % Rüstung und 20 % Magieresistenz, Tempo 28 und fünf Basisschaden. Freeze kann ihn höchstens um 40 % verlangsamen. Sieg gibt 50 Gold und nach überlebter Wave eine zusätzliche Beuteauswahl.

**Erkundungsbosse:**

Ein durch passende Nachbarstraße erschlossenes Bossfeld mit sechs Straßenöffnungen aktiviert einen Wächter für die **nächste reguläre Wave**. Alle bereiten Bosse spawnen genau einmal auf dem Straßenhub ihres eigenen ausgelösten Hexes und verwenden dieselben zufälligen, schleifenfreien Gabelungsentscheidungen wie normale Gegner.

Wächterwerte: `240 + 36 × Wave` Leben, dazu 25 % Rüstung und 20 % Magieresistenz, Tempo 24 und fünf Basisschaden. Sieg: einmalig +50 Gold mit Collect-Sound und nach überlebter Wave eine zusätzliche Beuteauswahl (Kartenpool: 90 % Epic, 10 % Legendary).

Für jede Bossbeute darf genau eine Karte oder alternativ ein Run-Segen gewählt werden: **Bastionssegen** erhöht maximale und aktuelle Base-HP um fünf, **Handelspakt** erhöht Einkommen um zwei Gold je künftig überlebter Wave. Mehrere Segen können sich addieren; beim Run-Neustart verfallen sie. Die normalen 50 Gold pro Boss bleiben unabhängig von der Beuteauswahl.

Die zwei neuen Hexkarten verwenden vorhandene Straßenmodelle mit passenden Slotpositionen; eigene Modelle sind noch nicht vorhanden.

## Seeds und technische Basis

Optionaler Seed für den nächsten Run; leer bedeutet zufälliger Seed. Gleicher Seed und gleiche Entscheidungen reproduzieren Karten, Rewards und Sonderfelder innerhalb derselben Spielversion. Separate Zufallsströme für Exploration und Shrine-Rewards. Kein Savegame und keine Garantie gleicher Ergebnisse über unterschiedliche Spielversionen.

Vanilla HTML/CSS/JavaScript ohne Build-Schritt. Three.js übernimmt standardmäßig die 3D-Darstellung unter HTTP(S); SVG ist alternative Ansicht und Fallback. Spiellogik, Daten, Exploration, Profil und Renderer sind in eigene Dateien aufgeteilt; Runsteuerung und HUD teilen sich weiterhin `game.js`. Die gemeinsame Weltgeometrie liegt um Base (0,0), 3D bildet x/y auf x/z ab. Kamera, Picking, Modelle, Gebäude-Hervorhebungen und Hex-Grid sind umgesetzt. Die vollständige Trennung von Run und HUD bleibt offen. Details: [ARCHITECTURE.md](ARCHITECTURE.md).

## Prüfung und offene Arbeit

Zuletzt **260 automatisierte Tests bestanden**. Tests ab diesem Appordner:

```powershell
node --test tests/*.test.cjs
```

In Umgebungen, die keine Unterprozesse starten dürfen, hilft `--test-isolation=none` (erst ab neueren Node-Versionen verfügbar). Die Tests decken unter anderem Straßen/Placement, zufällige schleifenfreie Wege, Waveablauf, Bau während Waves, Upgrades, Gebäude, Seeds, Rettungshex, Sichtgrenzen, Bossstart/-loot, Shrine-Auszahlungen sowie Renderer-Commands, Zustandsunveränderlichkeit, Reset, Bildschirmprojektion, Weltursprung und Kamerazoom ab.

Noch offen: manueller visueller Spieltest neuer Änderungen, Audio-Hörprobe, Langzeit-/Economybalancing. Die jüngsten visuellen Änderungen wurden nicht im Browser geprüft; der Nutzer übernimmt diese Prüfung. Logiktests ersetzen sie nicht.

Für später vorgemerkt, noch nicht implementiert:

- Weitere Heroes/Startfestungen über Standard, Festungsbauer und Händler hinaus.
- Weitere Karten und Lootvarianten sowie zusätzliche Shrine-Boni wie besondere Upgrades.
- Weitere Biome, Ausbau der vorhandenen Meta-Progression, zusätzliche Towerrollen und Run-Speicherung.
- Zusätzliche Base-Ausbaupfade und sichtbare Modelle der Ausbaustufen.
- Turm-Upgrade-Modelle und weitere visuelle Effekte.

Prioritäten und offene Entscheidungen werden in [BRAIN.md](../ai/BRAIN.md) gepflegt.

Biom-Erklärungen: Auf der Map zeigt Hover auf den Biomnamen die Effekte; Klick, Tippen oder Enter öffnet die schließbare Info. Zusätzlich gibt es „Biom-Effekte“ im Turmfenster. Keine dauerhaft eingeblendete Effektliste.

Gebäude verkaufen: Im Gebäudefenster wie bei Türmen 100 % Erstattung in derselben Bauphase vor der Wave, anschließend 50 % (abgerundet). Einkommen, Schmiede-Buffs und Marktrabatte werden unmittelbar entfernt bzw. aus verbleibenden Gebäuden neu berechnet. Gebäude-Upgrades sind umgesetzt: Haus → +5/+8 Gold pro Wave (40/65 Gold); Schmiede → +25/+30 % Schaden (45/70 Gold); Markt → 20/25 % Rabatt (45/70 Gold). Radius bleibt unverändert; Schaden und Rabatte stapeln nicht, der stärkste Effekt zählt.

Meta-Gebäudeausbau: Fernschmiede und Handelsnetz kosten jeweils einmalig 40 Diamanten im Arsenal. Ab dem nächsten Standard-Run ist nach Stufe 3 für 90 Gold ein zusätzliches gelegtes Hex frei auswählbar (auch außerhalb des Radius). Die Auswahl im Gebäudemenü ist änderbar, wird hervorgehoben und ersetzt das bisherige Zusatzziel. Spezialausbauten sind im festen Karawanenmodus gesperrt. Patrizierhaus: +16 Gold/Wave statt +8, 40 Diamanten Freischaltung und 120 Gold nach Stufe 3 im Run; keine gegenseitige Haus-Verdopplung.

Shrine-Schaltflächen sind kontextabhängig: Heilquelle und Werksegen zeigen nur ihre effektiven Belohnungen; keine Kartenentfernung oder Deck-/Map-Inspektion. Bei Kartenwahl bleiben Deck/Map sowie „Belohnung überspringen“ verfügbar; ausschließlich beim Entfernen steht „Keine Karte entfernen“.

- Arsenal-Zugang ausschließlich im Hauptmenü; dezente Hervorhebung, wenn eine noch gesperrte, tatsächlich kaufbare Turm-, Ultimate- oder Gebäude-Freischaltung bezahlbar ist.
- Turmwerte als kompakte Symbolgruppen in Bau-, Upgrade-, Loadout- und Arsenalansichten, mit Tooltip/Screenreader-Beschriftung und aufklappbarer Touch-Legende im Baumenü. Sekunden je Angriff: kleiner bedeutet schneller.
- Q/E: zeitbasierte kontinuierliche Kameradrehung beim Halten (60 Grad/s), unabhängig von Tastenwiederholung und Spieltempo; Sanfte Beschleunigung und kurzes Abbremsen beim Loslassen; Fokusverlust oder Tabwechsel stoppen sofort.

- WASD verschiebt die Kamera kontinuierlich relativ zur Blickrichtung (diagonal gleiche Geschwindigkeit). Q/E dreht weiterhin; Einstellungen enthalten eine aufklappbare Hotkey-Liste.
- U oder Einstellung zeigt unabhängig vom Gold den Turm-Ausbauzustand: nur ↑ weiter ausbaubar. Maximale Türme und im Run nicht freigeschaltete Meta-Stufen bleiben unmarkiert.
- Turmbaumenü nutzt automatische Kartenhöhen und flexible Symbolzeilen. Freie Turmplätze sind weiß, Gebäudeplätze weiterhin türkis.
- Nach Niederlage oder Challenge-Ende direkter Hauptmenü-Button; Loadout-Abbruch führt ins Hauptmenü, beendete Runs werden nicht mehr als fortsetzbar angeboten.
- Minen: während Waves unabhängig zufällig entlang aller Straßenanteile innerhalb der Reichweite, nach Straßenlänge gewichtet und exakt auf den Reichweitenkreis begrenzt. Eigener Seed-Zufallsstrom, keine Abstandsprüfung und keine Rücksicht auf vorhandene Minen. Jede Mine zündet ausschließlich durch einen Gegner im eigenen Auslöseradius. Keine Kettenreaktionen durch Minen oder Explosionen. Mehrere Minen können durch denselben Gegner ausgelöst werden. Grundintervall 1,4 s Spielzeit; Upgrades verändern es. Auslösung bis Abstand 14; Wave-Ende räumt Minen ab.

- Arsenal als mit Maus/Touch verschiebbare Forschungsmap: neun Turmbäume mit allen Zweigen, Endstufen und Meta-Ausbau sowie drei Gebäudebäume. Kleine SVG-Symbole, sichtbare Verbindungen, Besitzstatus und klare Unterscheidung Diamanten-Freischaltung/Run-Gold. Kein neuer Diamantenpreis für bisherige Gold-Upgrades.
- Freischaltungen zurücksetzen: zweiter Klick bestätigt, investierte Diamanten werden erstattet, Turm-/Meta-Freischaltungen entfernt, Loadout/Presets auf Starttürme zurückgesetzt. Rekorde, Einnahmen und unbenutzte Diamanten bleiben. Bereits laufende Runs behalten ihren Snapshot. Neue Käufe speichern den Preis; alte Profile nutzen mangels Kaufhistorie die bisherigen Katalogpreise.
- Weiß für freie Turmplatz-Diamanten und Upgrade-Pfeile; Gebäude bleiben türkis. U blendet ausschließlich aktuell im Run ausbaubare Türme unabhängig vom Gold ein.

- U-Markierungen: breite gefüllte weiße Pfeile mit dunkler Kontur in 3D und SVG. Freie Turmplatz-Diamanten und bezahlbare Upgrade-Hinweise ebenfalls weiß, Gebäudeplätze weiterhin türkis.

- Arsenal fast bildschirmfüllend (8 px Außenrand), ohne Scrollleisten: Drag verschiebt, Mausrad zoomt um den Mauszeiger, Touch unterstützt Zwei-Finger-Zoom. Plus/Minus und Gesamtübersicht stehen separat bereit. Transform-basierte Kamera statt Scrollposition, beim Öffnen 73 % Zoom am Anfang der Map.

- Arsenal: zwölf Forschungsbäume in zwei Reihen mit je sechs Bäumen. Kompakte obere Werkzeugleiste statt separater Titel-/Erklärungs-/Fußbereiche; Hilfe aufklappbar, Status nur bei Meldungen als Overlay. Jeder Einstieg startet bei 73 %, Gesamtübersicht bleibt manuell verfügbar.

- Arsenal-Bäume passen ihre Breite an die vorhandenen Zweige an (Katapult zwei, Element drei); keine Streckung auf die Breite anderer Bäume. Zoom verwendet Layout-Zoom statt transform:scale, damit Text bei jeder Zoomstufe neu gerastert wird. 73-%-Start, Mausanker und Drag bleiben erhalten.

Prozedurale Straßen (Spiegel-Abzweig, Fächer-/Seitenkreuzung, Sackgasse und Rettungshex) erhalten einen 22 Einheiten breiten Straßenrand unter der 18 Einheiten breiten Fahrbahn. Freie Bauplatz-Diamanten werden als transparente Overlay-Marker ohne Tiefentest und ohne Schreiben in den Tiefenpuffer nach den Map-Flächen gezeichnet.

- Run-Ende (Niederlage und Karawanensieg): Map anschauen blendet das Ergebnis aus; Kamera bleibt bedienbar, Button/Escape zurück ohne neue Abrechnung oder Simulationsstart.
- Run-Statistik je Turmtyp und aufklappbar je gebautem Turm: tatsächlich abgezogener Leben-/Rüstung-/Magieresistenz-Schaden ohne Overkill, Baukosten, Upgrade-Kosten, Bruttoinvestition, Erstattungen und Schaden/Brutto-Gold. Rabatte zählen tatsächlich bezahlt, kostenlose Shrine-Upgrades nicht als Ausgabe. Verkauf löscht Historie nicht; Minenschaden behält Turmzuordnung nach Verkauf, Geisterschaden zählt zum Nekromanten. Base-Schaden separat, Freeze als Support ohne irreführende Schadenseffizienz. Daten beginnen pro Run neu.
- Feuerkern profitiert bereits ab Element-Feuerzweig von Aschelande +20 % Schaden; gilt ebenfalls für Vulkanherz und Weltenbrand.

- Mehrfachauswahl: Strg/Cmd + Klick markiert/entfernt mehrere freie Turmplätze oder mehrere vorhandene Türme; normaler Klick ersetzt die Auswahl. Touch-Alternative: Mehrfachauswahl-Schalter im Turmbaumenü. Markierte Plätze erhalten weiße Ringe. Bauangebote zeigen Stückzahl und Gesamtpreis inklusive individueller Marktrabatte; Kauf erfolgt vollständig oder gar nicht.
- Bei mehreren Türmen werden Angriffsfokus-Prioritäten gemeinsam bearbeitet; gemischte Einstellungen werden angezeigt. Minenleger/Support ohne Angriffsfokus bleiben unverändert. Verkauf und Upgrades erfordern eine Einzelauswahl.
- Nebel, freie Nachbarfelder und noch nicht angeschlossene Sonderfelder werden in 3D separat hinter der erkundeten Map gerendert; sie können Baumarker und Map-Objekte nicht mehr verdecken.

- Ingame links: fünf dauerhafte Loadout-Icons. Pointer-Drag auf einen freien Turmplatz baut genau einen Turm zum lokalen Preis; alternativ Icon anklicken/antippen und Bauplatz wählen. Beim Ziehen grauer Map-Schleier mit ausgesparten, hervorgehobenen freien Slots. Escape, ungültiges Ablegen, Pointer-Abbruch und Fokusverlust brechen ab; keine Kosten bei ungültigem/zu teurem Bau. Touch über Pointer Events, Icons wiederverwenden die Arsenal-Symbole.
- Biomnamen nicht mehr auf jedem Hex: rechte Icon-Leiste für auf gelegten Tiles entdeckte Biome. Hover/Fokus zeigt Effekte und hebt zugehörige gelegte Tiles hervor; Klick/Tippen fixiert oder löst die Anzeige. Neuer Run setzt Entdeckungen und Fixierung zurück.

- Schnellbau-Icons sperren/ergrauen bei fehlendem Gold oder fehlenden freien Turmplätzen. Günstigster Preis eines freien Platzes berücksichtigt Marktrabatte (Anzeige „ab“). Drag-Zielkreise und Trefferprüfung verwenden gemeinsam projizierte Bodenmittelpunkte und 20 px Radius; bei Überlappung zählt der nächste Mittelpunkt, außerhalb des Boards kein Treffer.

- Drag-Bauplätze als eigenständige HTML-Zielmarker über der Map (Plus für bezahlbar, Kreuz für zu teuer), getrennt von der SVG-Abdunklung. Sichtbarkeit unabhängig von Slot-Hinweisen; Kameraänderungen aktualisieren die Zielpositionen sofort. Regressionstest deckt Anzeige, belegte Plätze, Board-Versatz, Kameraverschiebung und erfolgreichen Drop ab.

- Upgrade-Hinweise nutzen in SVG und 3D dieselbe Run-Upgrade-Liste inklusive freigeschalteter Arsenal-Stufe 4. Gold-Hinweis berücksichtigt lokalen Marktrabatt; U bleibt goldunabhängig. Gesperrte und bereits gekaufte Endstufen erzeugen keinen Hinweis.

- Straßenlose Gebäude-Hexe im Belohnungspool: Baugrund (Uncommon, 1 Gebäudeslot), Bauviertel (Rare, 2), Baubezirk (Epic, 3). Sie schließen seitlich an bestehende Hexe an und dürfen keine offene Straße blockieren. Keine Turmplätze; jeder Gebäudeslot ist separat bebaubar.
- Weitere Gegner mit Elementimmunitäten, Aufteilung beim Tod, Heilung und gezielter Wegwahl sind für später geplant: [Gegner-Balancing](ENEMY_BALANCING_PLAN.md). Noch nicht implementiert.

- Hauptmenü: Spielstand als JSON herunterladen oder hochladen. Enthalten sind Diamanten, Freischaltungen, Kaufpreise, Loadouts und Profilstatistiken; kein laufender Run und keine Geräteeinstellungen. Import nach Vorschau und Bestätigung ersetzt das Profil, statt Diamanten zu addieren. Vorherige lokale Daten werden unter `hex-bastion-profile-v1-before-import` gesichert. Import während eines aktiven Runs gesperrt.
- Wächter behalten die Resistenz ihres Herkunftsbioms: Aschelande 50 % Feuer; Sturmhochland 50 % Blitz/Wind; Dünenmeer halbiert Verlangsamung; Grasland neutral. Effekte in der Biom-Info.
- Duo-Grundlage begonnen: `run-runtime.js` verwaltet Spawn-Aufträge als reine Daten; `random.js` bietet versionierte Zufallszustände. Noch kein spielbarer Multiplayer.

- Kartenwahl bei Wave-, Wächter- und Shrine-Belohnungen zeigt „N× bereits im Deck“. Gezählt wird das gesamte Run-Deck. Duo-Grundlage erweitert: speicherbare offene Angebote ohne Neuwürfeln und gemeinsame Kauf-/Upgrade-Aktionen. Noch kein spielbarer Multiplayer.

- Linksklick aufs freie Feld schließt das Türme-Menü. Letzte erweiterbare Straßenfront wird gegen Einschließen geschützt; kostenlose bestätigbare Rettungstunnel helfen bei bereits blockierten Runs. Markierte Portale verbinden die Straßen unmittelbar, ohne Bauplätze oder Deckkarte.

- Beim Hover/Fokus auf Schmiede oder Markt im Gebäudebaumenü wird deren künftiger Wirkungsbereich hervorgehoben. Verkäufe von Türmen/Gebäuden fragen mit Erstattungsbetrag nach; Escape bricht ab.

- Duo-Grundlage: gemeinsame DOM-freie Session-Steuerung für Wächter-/Wave-/Shrine-Belohnungen, Kartenentfernung, Vorbereitung und Erfolgsmeldungen. Checkpoints halten auch unbestätigte Erfolgsmeldungen fest. Lokaler Duo-Prototyp siehe folgenden Abschnitt; noch kein Online-Duo.

## Lokaler Duo-Prototyp

Bei laufendem lokalen Server `duo-prototype.html` öffnen (standardmäßig `http://localhost:8080/duo-prototype.html`). Beide Seiten werden an einem Gerät gesteuert: je ein Hex legen, Verteidigung bauen und beide bereit melden. Zwei getrennte Maps, Goldkonten und Decks teilen sich 40 HP. Abschlussbelohnungen gibt es erst nach beiden Kämpfen.

Karten drehen, Türme/Gebäude bauen und verbessern, Belohnungen wählen sowie 1×/2× sind verfügbar. „Checkpoint merken“ sichert beide Seiten nur im geöffneten Tab; kein dauerhafter Spielstand. Kein Zugriff auf Solo-Diamanten. Freien Slot anklicken und als Partner-Portal reservieren; eigenen Turm anklicken und als Verstärkung wählen. Nach sauberem Abschluss hilft eine Kopie nach 1,5 Spielsekunden beim Partner. Unterstützungs-Schaden wird dem Sender zugerechnet. Noch ohne Online-Verbindung, Lieferungen, Verkäufe oder Base-Ausbau. 246 automatisierte Tests bestanden; visuelle Prüfung durch den Nutzer.

## Kampagne und Bosswellen

Wave 35 in Stufe 1 abschließen schaltet Stufe 2 · Zwei Fronten frei. Der Victory-Screen bietet Hauptmenü oder Endless mit derselben Map. Der Run wird erst beim Beenden abgerechnet. Wave 15: Eisenkoloss mit starker Rüstung; Wave 25: schneller Sturmjäger; Wave 35: magiegeschützte Seelenmatriarchin mit maximal sechs beschworenen Dienern ohne Goldbeute. Danach wiederholt sich die Bossrotation mit steigender Stärke.

Der lokale Duo-Prototyp zeigt jeweils eine große Map mit Umschalter und Partnerstatus. Beide Kämpfe laufen beim Wechsel weiter. 249 automatisierte Tests bestanden; keine Browsertests.

Duo-Servergrundlage umgesetzt: server/duo-room.cjs bindet Sitzungen an feste Spielerplätze; exakte Aktionsschemata, Match-Epoche, Sequenz, Wave/Phase und begrenzte Rate. Netzwerkansichten verbergen Seeds, Ziehreihenfolgen, Partnerhand und unerforschte Eventtypen; Angebots-IDs werden gehasht. Lokaler HTTP-Testadapter mit zwei echten Clients. Noch keine Online-Spieloberfläche, automatische Ticksteuerung, Lobby, Einladungen, Reconnect oder Hosting. 253 Tests bestanden, keine Browsertests.

- Duo-Serverprototyp mit Frontend verbunden: node server/start-duo.cjs startet auf 127.0.0.1:8090 und gibt zwei Spielerlinks aus. Server simuliert automatisch in 50-ms-Schritten; Client zeigt Netzwerkansicht, eigene Bauaktionen und lesbare Partner-Map. Legale Platzierungen und Biome vom Server. Derselbe SVG-Renderer, keine Client-Kampfberechnung. Verlorene Kaufbestätigung wird mit identischer Sequenz wiederholt. Netzwerkmodus ohne lokale Reset-/Checkpoint-/Tempokontrolle; vorerst 1× und feste Start-Loadouts. Noch keine Internet-Lobby oder Neustart-Persistenz. 256 Tests bestanden, keine Browsertests.

- Duo-Lobbys umgesetzt: Startseite mit Erstellen/Beitreten, zehnstelligem Einladungscode und kopierbarem Link im Spiel. Zwei feste Plätze, Sperre von Aktionen vor Partnerbeitritt, atomarer Beitritt und idempotente Wiederholung bei verlorener Antwort. Maximal acht getrennte Räume; Inaktivitätsablauf und begrenzte Anfragerate. Launcher gibt jetzt Lobby-Adresse aus, keine Sitzungstokens. Noch nur Loopback, kein Internet-Hosting oder dauerhafter Reconnect. 260 Tests bestanden, keine Browsertests.
