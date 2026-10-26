# AutoHex TD – Designregeln und Bestandsprüfung

Stand: 22.09.2026. Gilt für neue Oberflächen und die schrittweise Überarbeitung bestehender Menüs, in Deutsch und Englisch, mit Maus, Tastatur und Touch.

## Grundlage und aktueller Stand

Geprüft wurden `index.html`, `style.css`, die UI-Controller und der vom Nutzer gezeigte Siegbildschirm. Dies ist eine Quellcodeprüfung mit automatisierten Logik-/DOM-Ersatztests, keine visuelle Prüfung im Browser. Die folgenden Regeln sind das Zielsystem; nicht jeder ältere Einzelstil ist bereits darauf umgestellt.

Aktuell verwendet die Oberfläche Inter mit Systemschrift als Ersatz. Titel und Kartennamen verwenden Georgia. Viele ältere Komponenten haben eigene Größen zwischen etwa 10 und 17 px, eigene Abstände und wiederholte CSS-Überschreibungen. Die neue gemeinsame Basis steht am Ende von `style.css` unter den `--ui-*`-Variablen. Alte Spezialstile haben teilweise weiterhin Vorrang.

## Schrift und Hierarchie

| Verwendung | Zielgröße | Gewicht | Regel |
| --- | --- | --- | --- |
| Großer Menü-/Erfolgstitel | 28–40 px, mobil 24–28 px | 700 | Georgia, höchstens zwei Zeilen |
| Abschnittstitel | 18–20 px | 700 | Inter/Systemschrift |
| Fließtext und wichtige Erklärungen | 16 px | 400 | Zeilenhöhe 1,45–1,6 |
| Knöpfe, Werte und kurze UI-Texte | 14–16 px | 600–700 | Umbruch erlauben, keine feste Texthöhe |
| Zusatzinformationen | mindestens 12 px | 400 | Nicht für wesentliche Regeln verwenden |

Fettdruck kennzeichnet Überschriften, Aktionen und entscheidende Zahlen. Ganze erklärende Absätze bleiben normal. Die kleinen Karten im aktuellen kompakten Layout unterschreiten dieses Ziel teilweise: Dort Informationen reduzieren oder über die Detailansicht zugänglich machen, statt weiter zu verkleinern.

## Farben und Zustände

| Token/Zustand | Hintergrund | Text |
| --- | --- | --- |
| Oberfläche | `#1d2922` | `#f4ecd6` |
| Standardknopf | `#293f32` | `#f4ecd6` |
| Primäraktion | `#326345` | `#ffffff` |
| Zweitaktion | `#384b3e` | `#f4ecd6` |
| Verkaufsbestätigung | `#246c41` | `#ffffff` |
| Gefährliche Aktion | `#6f3834` | `#ffffff` |
| Deaktivierter Knopf | `#28382e` | `#b9c6bc` |
| Helle Hexkarte | `#efe3c2` | `#2b281f` |

Vorder- und Hintergrund immer zusammen definieren. Für normalen Text mindestens 4,5:1 Kontrast anstreben. Keine weiße Schrift auf Browser-Standardbuttons. Sekundärtexte dürfen nicht durch zusätzliche Transparenz unlesbar werden. Aktiv, gesperrt und bestätigt unterscheiden sich zusätzlich durch Text oder Symbol; Farbe allein reicht nicht.

Tastaturfokus: sichtbare 3-px-Kontur in `#ffe198` mit Abstand. Die Verkaufsschaltfläche erhält beim ersten Klick einen stärkeren grünen Hintergrund, eine helle Kontur und „Wirklich verkaufen?“ samt Erstattung. Erst der zweite Klick verkauft. Außenklick/Escape oder Zielwechsel verwirft die Bestätigung; bei verändertem Betrag muss erneut bestätigt werden.

## Größen, Abstände und Symbole

- Raster: 4, 8, 12, 16 und 24 px; vorhandene `--ui-space-*`-Variablen verwenden.
- Mindestens 12 px Abstand zum Bildschirmrand, einschließlich Safe-Area-Inset. Menüinnenabstand 16 px mobil, 24 px auf großen Bildschirmen.
- Zwischen zusammengehörigen Aktionen 8–12 px, zwischen Abschnitten 16–24 px.
- Neue interaktive Ziele mindestens 44 × 44 px. Bestehende kompakte Ausnahmen wie Tutorialknöpfe und Querformat-Leisten schrittweise vergrößern.
- Ein primärer Aktionsknopf je Entscheidung; weitere Aktionen sekundär. Lange Übersetzungen umbrechen lassen.
- Wiederkehrende Werte erhalten dieselben Symbole in Bauansicht, Upgradeansicht und Statistik. Symbole neben Zahlen nicht als Fließtext wiederholen.
- Symbolknöpfe brauchen einen zugänglichen Namen und eine per Fokus/Touch erreichbare Erklärung. Hammer bedeutet Bauen; ein Bogenschützensymbol steht für den konkreten Turm.

## Öffnen, Schließen und Ebenen

- Informations-Popups und Dropdowns schließen bei Linksklick außerhalb. Ein Klick innerhalb bleibt bedienbar; der eigene Öffner toggelt das Fenster.
- Oben rechts darf nur ein Informations-Dropdown offen sein. Es wird am eigenen Knopf verankert und bleibt unabhängig von der Tutorialhöhe.
- Optionale Dialoge schließen auf ihrem Hintergrund. Escape bleibt zusätzlich verfügbar; eine sichtbare Schließen-/Zurück-Aktion bleibt auch für Touch erhalten.
- Eine ausstehende Belohnung wird durch Außenklick nicht verworfen: Die Auswahl wechselt zur Kartenansicht und bleibt über „Zur Auswahl“ erreichbar. Sieg/Niederlage können ebenso zur Kartenansicht wechseln, ohne den Lauf abzurechnen.
- Das Hauptmenü ist eine Bildschirmansicht, kein durch Außenklick zu schließendes Popup. Spielstandtransfer bleibt über dessen Hintergrund.
- Lange Inhalte scrollen innerhalb ihres Fensters; Schließen und entscheidende Aktionen müssen erreichbar bleiben. Popups dürfen feste Spielknöpfe und Kartenhand nicht verdecken.
- Der Tutorialhinweis zeigt Platzierungsfehler direkt darunter. Beim Lebens- und Wellenstartschritt markiert ein Rahmen das echte Ziel; ein nicht interaktiver Schleier dimmt die Umgebung.
- Aktuelle Ebenen: Spiel-HUD 7, Tutorialmarkierung 20, Tutorialtext 30, offene Informationsfenster 35, Hauptmenü 40, übergeordnete Dialoge darüber. Keine beliebigen zusätzlichen hohen `z-index`-Werte einführen.

## Responsive Verhalten

Die Kopfleiste verwendet gemeinsamen Flex-Umbruch statt zwei konkurrierender absoluter Positionen. Unter 1100 px stehen Navigation und Werte in eigenen Zeilen; unter 600 px ordnen sich Werte in drei Spalten. Unter 1000 px werden Bau-/Kameraknöpfe und Fußleiste kompakter angeordnet. Gemessene Kopf-, Fuß- und Kartenhöhen bestimmen die verfügbare Spielfläche über CSS-Variablen und `ResizeObserver`.

In kurzem Querformat kann ein Menü eine freie Fläche neben der Kartenhand nutzen. Reservierte Flächen werden in `classes/ui-layout.js` berechnet. Neue permanente Bedienelemente müssen in diese Berechnung aufgenommen werden. Keine feste Bildschirmhöhe voraussetzen; `dvh`, Safe-Areas, Flex/Grid, `min-width:0` und Textumbruch verwenden.

Für Änderungen an HUD oder Menüs mindestens 320 × 568, 390 × 844, 768 × 1024, 844 × 390 und 1440 × 900 mit beiden Sprachen berücksichtigen. Automatisierte Geometrieprüfungen ergänzen die spätere manuelle Sichtprüfung. Lange Texte, geöffnete Dropdowns, Tutorial, fünf Startkarten und eingeblendete Tastatur mitdenken. Hover darf niemals der einzige Zugang zu einer notwendigen Funktion sein.

## Befunde und nächste Verbesserungen

| Befund | Stand / Empfehlung |
| --- | --- |
| Sieg- und Gebäudeupgradebuttons: helle Schrift auf hellem Standardhintergrund | Gemeinsame dunkle Buttonbasis und explizite Sieg-/Gebäudestile ergänzt |
| Navigation und Ressourcenleiste überlagern sich bei kleiner Breite | Gemeinsamer umbrechender Header, mobile Ressourcenmatrix und gemessene Abstände ergänzt |
| Tutorial unterdrückt Platzierungsfehler | Eigene Fehlermeldung unter dem Tutorial ergänzt |
| Verkauf unterbricht mit großem Dialog | Zweistufige Bestätigung im vorhandenen Knopf umgesetzt |
| Viele doppelte CSS-Regeln | Als nächsten technischen Schritt komponentenweise zusammenführen; neue Tokens konsequent nutzen |
| Kleine Karten-/Arsenaltexte | Wichtiges mindestens 12–14 px; bei Platzmangel progressive Details statt Mikroschrift |
| Emoji unterscheiden sich je Plattform | Gemeinsamen SVG-Icon-Satz für HUD und Bauaktionen einführen |
| Fokusmanagement in älteren Dialogen uneinheitlich | Fokus beim Öffnen hineinsetzen, beim Schließen zum Öffner zurückgeben; Dialoge auf Tastaturbedienung prüfen |
| Mobile Darstellung noch nicht visuell abgenommen | Nutzerprüfung im echten Browser/Gerät nötig; keine vollständige visuelle Fehlerfreiheit behaupten |

Neue Features sollen diese Regeln direkt berücksichtigen. Bei älteren Ansichten gezielt die betroffene Komponente migrieren, ohne Spielregeln oder gespeicherte IDs zur Gestaltung umzubenennen.

## Ergänzung: konsistentes Schließen und native Bedienelemente

Regeln/Einstellungen müssen sowohl über Pointer-Ereignisse als auch über normale Klicks im Capture-Handler schließen. Regressionstests müssen beide Wege abdecken, auch bei verschachtelten Öffner-Symbolen. `.hidden` hat Vorrang vor komponentenspezifischen Display-Regeln. Dialoge nie nur über den Öffner schließbar machen. Die Hauptmenü-Sprachzeile verwendet dieselbe Breite, Fläche, Kontur und Schriftgröße wie die übrigen Menüaktionen. Native Scrollbars nutzen einen dunkelgrünen Track und einen helleren grünen Griff; Browser ohne Unterstützung behalten ihre native Darstellung.

### Umsetzung: kompakte Navigation und Tutorialziele

Unter 900 px Breite oder 600 px Höhe ersetzen vier aufklappbare Gruppen (Menü, Werte, Türme, Biome) die permanenten Leisten. Nur eine Gruppe ist offen. Zoom-/Basisleiste und doppelter Bauknopf entfallen dort; Wellenstart und Tempo teilen sich eine feste Fußzeile, die Hand liegt mit Abstand darüber. Die Desktopbedienung bleibt bestehen.

Das Tutorial markiert pro Schritt Karten, legale Bauziele, freie Turmplätze, Bauauswahl, Turm/Upgradeauswahl, Lebensanzeige und Wellenstart. Maskierte Flächen erhalten die unveränderte Darstellung ihrer Ziele; die Umgebung wird gedimmt. Beide Aktionsplätze bleiben reserviert, Überspringen steht immer rechts oberhalb des Erklärungstexts. Die Position des Tutorialblocks bleibt während der Schritte verankert.

Zusätzlich umgesetzt: gemeinsame Schriftgrößen für Panels und Erklärungen; erste einheitliche SVG-Symbole für Regeln, Einstellungen, Bauen und Leben; Fokusbegrenzung in modalen Dialogen und Rückkehr zum Öffner. Weitere Emoji-Symbole werden nach und nach migriert. Die jüngsten CSS-Komponenten sind getrennt kommentiert; ältere doppelte Regeln sind noch nicht komplett bereinigt. Aktuelle Ebenen: normales HUD 7, Fokusmaske 20, Tutorial 30, Informationsfenster 35–37, kompakte Navigation 38, Vollbilddialoge 50, Unterdialoge 60, Spielstandtransfer 65.

### Run-Vorbereitung und Gebäudeanzeigen
Run-Vorbereitung verwendet kompakte Schwierigkeits-/Festungsauswahl, Turm-Icons und eine kurze Detailzeile. Lange Beschreibungen stehen zusätzlich als Titel bereit. Vorlagen öffnen sich bei Bedarf über der Auswahl. Kleine Bildschirme verwenden drei Turmspalten; Runstart und Zurück bleiben kurz beschriftet. Scrollende abgerundete Panels werden an ihrer Oberfläche beschnitten, damit Scrollbars nicht über die Rundungen hinausragen. Siegbuttons erhalten explizite Vorder-/Hintergrundfarben über ihre IDs. Keine visuelle Browserabnahme erfolgt.

Bei Schmiede/Markt ist der aktuelle Wirkbereich kräftig, vorhandene Versorgung durch andere Gebäude desselben Typs blasser und andersfarbig. Zusatzhexe der Schmiede dürfen nicht bereits von irgendeiner Schmiede versorgt werden. Der U-Modus zeigt auch für Gebäude noch verfügbare Run-Upgrades unabhängig vom Gold an; bereits vollständig ausgebaute Gebäude bleiben unmarkiert.

### Präzisierung der Tutorial-Markierungen
Schritt 2 markiert die vollständigen sechs projizierten Hexkanten. Schritt 4 öffnet das Baumenü nach Slotwahl und markiert zusätzlich Bauknopf und Schnellbauleiste; kein erneuter Kreis auf dem bereits gewählten Platz. Schritt 5 umfasst in 3D die tatsächlichen Modellgrenzen des ganzen Turms (ohne Reichweiten-/Upgradehilfen). Nach erfolgreichem Tutorial-Upgrade schließen die Turmfenster. Überspringen steht oberhalb von „Erste Schritte“. Markierungen nehmen keine Eingaben an und werden bei jeder Kameraänderung sofort neu projiziert. Ein Klick, dessen Pointer-Geste bereits behandelt wurde, darf ein beim Loslassen geöffnetes Menü nicht wieder schließen; Tastatur-/synthetische Außenklicks bleiben unterstützt.

Tutorial Schritt 4: Schnellbau-/Drag-and-Drop-Leiste nicht mehr hervorheben. Im geöffneten Turmbaumenü wird gezielt der Bogenschütze mit einer goldenen Kontur markiert. Schritt 5 markiert dessen Upgrade-Schaltflächen zusätzlich zum Turm. Alle Turmbauangebote verwenden dieselben SVG-Icons wie Arsenal und Schnellbau; schmale Layouts reservieren eine eigene Icon-Spalte.

### Biom-Informationen und Außenklick

Auch angeheftete Biom-Informationen schließen bei einem linken Klick außerhalb des Panels und der Biomleiste. Dies gilt als Standard für künftige Dialoge und Popovers. Der erste Entdeckungshinweis bleibt als ausdrücklich gewünschte Ausnahme bis zur Bestätigung sichtbar. Biomflächen werden immer in ihrer eigenen Biomfarbe hervorgehoben, auch bei mehreren gleichzeitigen Entdeckungen oder zusätzlichem Hover.
## Bedienregeln: Touch, Dialogfokus und Vorbereitung

- Hex-Drehung hat einen sichtbaren, mindestens 44 px hohen Touch-Button bei den Handkarten. Erst nach expliziter Kartenwahl aktiv; R und Mausrad-Klick bleiben gleichwertig.
- Dialoge fokussieren beim Öffnen den Dialog oder eine neutrale Überschrift, niemals automatisch eine Aktion. Tab/Shift+Tab bleiben verfügbar. Nur das Tutorial darf eine konkrete Aktion gezielt hervorheben.
- Gebäudemenüs sind am rechten Rand des verfügbaren Bildschirmbereichs angedockt, auf schmalen Displays unten im verfügbaren Bereich. Sie folgen nicht dem angeklickten Gebäude und bleiben außerhalb reservierter HUD-/Handkartenflächen.
- Vorbereitung hat keine feste Reihenfolge: Türme und Gebäude können bereits vor dem Hexlegen gebaut/verbessert werden. Wellenstart bleibt bis zum Platzieren gesperrt und erklärt die Voraussetzung direkt am Button.
- Escape schließt zuerst aktive Menüs/Auswahlen. Ohne offenes Menü öffnet es im laufenden Spiel die Einstellungen. Kein zweiter globaler Escape-Handler darf diese wieder schließen.
- Der Hinweis erscheint nach abgeschlossener Welle 11, nach Belohnung und Abschlussmeldung, in der Vorbereitung vor Welle 12. Er zeigt den Weg Einstellungen → Tastenbelegung, einschließlich des kompakten Menüknopfs. Er bleibt bis zum Öffnen der Tastenbelegung oder zum Klick auf „Verstanden“ bestehen, auch in späteren Wellen. Außenklicks und Escape bestätigen ihn nicht. In geöffneten Einstellungen wird er direkt oberhalb der Tastenbelegung eingeblendet.
### Auswahl über Wellenübergänge erhalten

Turm- und Gebäudemenüs verwenden dieselbe feste Randposition. Wellenende ist kein Abbruchsignal für Bauplatz-/Turmauswahl, Mehrfachauswahl, Zusatzhex-Zielwahl oder einen gewählten Schnellbau-Turm. Belohnungsdialoge unterbrechen die Bedienbarkeit, löschen aber die dahinterliegende Auswahl nicht. Ihre Bestätigung darf nicht als Außenklick auf Bau- oder Turmmenüs behandelt werden. DOM-Elemente für unveränderte Bau-/Upgrade-Angebote bei einem reinen Phasenwechsel erhalten, damit Fokus und laufende Zeigereingaben nicht verloren gehen.

Gesperrte Optionen der Durchlaufvorbereitung zeigen ihre Freischaltbedingung dauerhaft als lesbaren Text. Diese Texte dürfen durch kompakte Layouts nicht ausgeblendet werden; ein Hover-Titel allein genügt insbesondere auf Touch-Geräten nicht.
### Hauptmenü-Ausnahme und linke Kontextmenüs

Turm- und Gebäudemenüs werden am linken Rand des freien Bildschirmbereichs positioniert; auf schmalen Bildschirmen bleiben sie unten links innerhalb dieses Bereichs. Dies ersetzt die frühere rechte Randposition.

Hauptmenü-Dialoge (Spielmodus, Spielregeln, Spielstand, Arsenal und Durchlaufvorbereitung) bleiben bei Außenklicks offen. Sie werden über ihre ausdrücklichen Zurück-/Schließen-Schaltflächen geschlossen. Die Außenklick-Regel für Ingame-Dialoge bleibt bestehen. Die Durchlaufvorbereitung hat keinen Statusbalken mit Diamanten und Auswahlzähler mehr; Hinweise auf eine unvollständige Turmauswahl bleiben erhalten.

### Arsenal: Werkstatt statt Forschungskarte

Das Arsenal zeigt keine verschiebbare Zoom-Karte mehr, sondern immer nur einen Forschungsbaum in normaler Lesegröße. Links liegt eine Leiste mit allen Türmen und Gebäuden (Icon, Name, Kurzstatus wie aktives Ultimate oder „Turm gesperrt“); ein goldener ◆-Punkt markiert Bäume mit bezahlbarer Freischaltung. Beim ersten Öffnen ist der erste Baum mit bezahlbarer Freischaltung gewählt, danach bleibt die letzte Auswahl erhalten. Pfeiltasten wechseln zwischen den Einträgen. Unter 760 px Breite wird die Leiste zu einer waagerecht scrollbaren Chip-Reihe über dem Baum.

Der gewählte Baum hat einen Kopfbereich (großes Icon, Beschreibung, Baukosten, Turmfreischaltung) und darunter die Ausbaupfade als Spalten: Stufe 2 → Stufe 3 → Ultimate bzw. Spezial. Jeder Baum verwendet die Turmfarbe als Akzent (`--tree-color`), Gebäude verwenden Gold. Hinweise zur Ultimate-Exklusivität stehen einmal pro Baum statt auf jeder Karte. Zustände: gesperrt = abgedunkelt mit gestrichelten Verbindern, freigeschaltet = grün, aktiv = goldener Rahmen mit Schein, bezahlbar = goldener Hauptbutton. Besitz und aktive Auswahl haben unterschiedliche Statusbeschriftungen; Aktivieren verbraucht keine Diamanten und gilt ab dem nächsten Run.

## Deutsche Texte und Gebäuderegeln (23.09.2026)

Sprachprüfung von UI-Katalog, Karten-/Turm-/Gebäudebeschreibungen, Regeln, Statistiken und Duo-Texten. Ganze Formulierungen für grammatische Übereinstimmung verwenden: „mit dieser Turmauswahl“, „im Kampfbereich“, „des Durchlaufs“, „pro besiegten Gegner“. Einzelne englische Begriffe nicht blind austauschen, wenn dabei Genus/Kasus falsch werden. Eigene Vorlagennamen unverändert lassen. Englische Katalogeinträge entsprechend mitführen; Regressionstests für die problematischen Formulierungen bestehen.

Je Hex maximal eine Schmiede und ein Markt, da ihre gleichartigen Boni nicht stapelbar sind. Beide unterschiedlichen Gebäude dürfen auf demselben Hex stehen; Häuser bleiben mehrfach baubar. Sperrgrund im Baumenü dauerhaft anzeigen und dieselbe Regel in den gemeinsamen Solo-/Duo-Baubefehlen prüfen. Verkauf gibt den entsprechenden Typ sofort wieder frei. Bereits bestehende doppelte Gebäude aus alten Partien werden nicht automatisch entfernt.

Karawanengegner nur mit einem Münzsymbol markieren. Beim Darüberfahren erklärt der Tooltip die beiden Folgen; Antippen öffnet die bestehende Wellenplanung mit derselben kurzen Erklärung, ohne einen zusätzlichen Dialog. Bedeutung: tägliche Herausforderung, zusätzliche Beute beim Besiegen, Goldabzug beim Erreichen der Basis. Keine zusätzlichen Diamanten und kein Hexbonus. Die normale Beute beträgt derzeit 3 Gold, somit insgesamt 18 Gold für einen besiegten Karawanengegner.

## Hauptmenü: Hex-Blüte (21.10.2026, Branch menudesign)

Jede Hauptmenü-Aktion ist ein spitz stehender Hex (Breite : Höhe = 0,866 : 1) aus drei Ebenen: heller Rand, dunkle Rille, Füllung. Gold nur für die eine Hauptaktion in der Mitte, Grün für Navigation, Creme für „Neuer Run“, Nebel für gesperrte oder freie Plätze. Mit fortsetzbarem Run zeigt die Mitte „Spielen · Fortsetzen · Welle N“, „Neuer Run“ steht dann als Creme-Kapsel direkt unter der Blüte (Klasse `canContinue` am Hauptmenü). Ring im Uhrzeigersinn ab oben links: Arsenal, Bestenliste, Einstellungen, Duo, Tägliche Herausforderung, Account. Das Einstellungsfenster des Hauptmenüs spiegelt Sprache, Grafikstil, Ton und Einsteigerhinweise der Spieleinstellungen. Tägliche Herausforderung und Duo bleiben vor der Freischaltung sichtbar, sind deaktiviert und nennen „ab Welle 35“. Ausgeblendete Aktionen (Arsenal in der Einführung, Account im Testprofil) hinterlassen einen dekorativen Nebel-Hex mit „?“.

Größe über `--u` (Höhe eines Ring-Hex) aus verfügbarer Höhe und Breite, mindestens 52 px. Die sechs Ring-Hexe liegen Kante an Kante bei 0°, 60° … im Abstand `--d` = 1; der Mittel-Hex ist mit `--hc` = 1,1 etwas größer. Der Test `tests/hex-menu.test.cjs` prüft gleichen Abstand, 60°-Teilung, keine Überlappung und annähernd gleich breite Fugen. Fokus: Rand und Rille färben sich `#ffe198`, da ein Outline am geschnittenen Hex nicht sichtbar wäre. Pfeiltasten springen zum nächsten bedienbaren Hex in Pfeilrichtung. Feste Fußleiste: Sprache unten links, „Impressum · Datenschutz“ in der Mitte (unter 640 px eine eigene Zeile darüber), Version und Patch Notes unten rechts; die frühere Regel zur gleich breiten Sprachzeile entfällt. Hintergrund: regelkonforme Spielkarten aus den echten Spielkacheln (`classes/menu-maps.mjs`, erzeugt von `scripts/menu-map-solver.cjs`, geprüft in `tests/hex-menu.test.cjs`): Festung, fünf Türme auf Bauplätzen, Gebäude, Nebelfelder und Gegner, die auf der Straße zur Festung laufen. Entwürfe über `?menu=`: `insel` (Standard, Karten links und rechts), `seite` (Menü links, Karte rechts, dreht sich), `gespiegelt`. „Spielen“ öffnet mit gespeichertem Run die Spielauswahl mit „Fortsetzen“ an erster Stelle.

Turmfenster: Kopf mit gerendertem Porträt des echten Turmmodells (`classes/tower-portraits.mjs`), drei Kernwerte, Angriffsfokus, Upgrade-Zeilen mit Porträt der nächsten Stufe, Typ-Chip, Kurzwerten und Preis-Knopf; „Werte & Einflüsse“ ist eine Unteransicht mit aktuellen Werten, Einflüssen mit Bild und Schadensfaktoren. Konzept und Folgeschritte: `docs/hex-ui-konzept-2026-10-21/index.html`, Designer-Lieferliste: `artifacts/designer-menu/BRIEFING.md`.

## Hexwerk-Oberfläche im ganzen Spiel (21.10.2026)

Grafiken, Farben und Schriften kommen aus dem Designer-Export `assets/uidesign/` (README, `tokens.css`). Eingebunden in `index.html` in der Reihenfolge `style.css` → `assets/uidesign/tokens.css` → `hexwerk.css`; `hexwerk.css` enthält das Hauptmenü und alle Spiel-Bausteine und ändert keine IDs.

- **Icons** sind einfarbige Masken: `<span class="hxi hxi-<name>">` (Name = Dateiname ohne `icon_`, z. B. `hxi-coin`, `hxi-tower_archer`, `hxi-biome_desert`). Farbe über `color`. Knöpfe, deren Text das JavaScript setzt (Pause, Wellenstart), bekommen ihr Icon per `::before`, damit der Text erhalten bleibt.
- **Kleine Hex-Knöpfe** verwenden `hud/hex_small_{normal,hover,pressed,selected,disabled}.svg`; der sichtbare Text ist ausgeblendet, `aria-label`/`title` bleiben. Im kompakten Menü-Tray bleiben die Menüknöpfe beschriftete Kapseln.
- **Rahmen** (Paneel, Hervorhebung, Phasenschild Bau/Welle/Boss, Kapsel, Preisplakette, Preis-Knopf bereit/zu teuer/gesperrt, Verkaufen normal/Bestätigung, Wellenstart gesperrt/bereit/läuft, Kartenrahmen je Seltenheit) sind mit den Werten aus `tokens.css` im Code gebaut: scrollende Fenster mit Goldkante als Rahmen-Hintergrund, feste Elemente (Phasenschild, Aktionsleiste, Tempo, Wellenstart) als abgeschrägte Fläche mit Füllung in `::before`/`::after`. Kein `border-image` für kleine Elemente: es erzeugt Nahtlinien. Kein `:is()` mit IDs in gemeinsamen Selektorlisten: die ID-Spezifität überschreibt sonst Zustandsregeln.
- **Hex-Knöpfe** tragen die Klasse `hxHex` (auch die per JavaScript erzeugten Turm- und Biom-Knöpfe); das Icon ist ein absolut zentriertes `::before`. Zustände kommen aus vorhandenen Klassen und Attributen: `:disabled`, `.confirmSale`, `[data-locked]`, `#startWaveBtn[data-state]`, `#waveDropdown[data-phase]`.
- **Phasenschild** ist die Wellenplanung (`#waveDropdown`) oben Mitte; `#phaseName` zeigt Bauphase, Welle läuft, Bosswelle, Sieg oder Niederlage.
- **Karten:** Straßenbild in Schrägsicht wird aus der echten Kachelgeometrie erzeugt (`miniPathSvg`), damit Drehung und Sonderformen stimmen. „Ungewöhnlich“ hat noch keinen Designer-Rahmen.
- **Desktop-Anordnung** über 1100 × 600 px nach `_source/GameScreen.dc.html`; kleinere Bildschirme behalten die kompakte Gruppen-Navigation und erhalten nur den Stil.
- Schriften: Titel, Wortmarke und Überschriften in **Tektur Black**, Bedienelemente in Barlow Semi Condensed 600/700; beide selbst gehostet in `assets/fonts/` mit OFL-Lizenztexten (`OFL-Tektur.txt`, `OFL.txt`). Fraunces bleibt nur als Ersatzschrift. Menü-Hintergrund mit Inselsockeln und Deko-Set aus `assets/decor/`. Offene Lieferungen: `artifacts/designer-menu/NACHLIEFERUNG.md`.

## Hexwerk für Herausforderungen und Einzelseiten (26.10.2026)

Alle seit v1.1.4 hinzugekommenen Oberflächen verwenden dieselben Hexwerk-Bausteine wie das übrige Spiel. Quellcodeprüfung mit automatisierten Tests; keine visuelle Browserabnahme.

- Leisten an der Hand und in der Fußleiste (Umweg, Turm-Draft, Giervertrag, Stromnetz, Missionsziel, Expedition, Dörfer/Festung) sind Paneele mit Goldkante. Wählbare Angebote (Draft, Verträge, Partnergeschenke) sind Creme-Karten mit Seltenheitsrand und Hex-Symbol; Preise und Gold erscheinen als Plakette mit Münz-Maske statt als Emoji.
- Händler und Giervertrag sind Fenster im Referenzstil. Wahlzeilen in Belohnungs-, Händler- und Duo-Fenstern teilen sich den Zeilenstil `.rewardBox .upgradeOption`.
- Frist, Dorf-Leben, Testlabor-Leiste und Duo-Zugstatus liegen am Desktop unter dem Phasenschild, nie darüber.
- Symbole kommen aus `assets/uidesign/icons` (`.hxi-*`). Die Icons der Nachlieferung (z. B. `treasure`, `portal`, `overload`, `partner`, `rules`) sind als Klassen angebunden. Textzeichen wie ◆, ✓ und ♥ in Statuszeilen bleiben, wo Tests oder Kartenmarker sie verwenden.
- Barlow Semi Condensed liegt nur in 600 und 700 vor. Keine Stärken 800 oder 900 mit `--hx-font-ui` verwenden, sonst erzeugt der Browser eine künstliche Fettung.
- Eigenständige Seiten laden `hexwerk-pages.css` nach ihrer eigenen CSS und setzen eine Klasse am `body`: `hxPage` (mit `hxLegal`, `hxBoard` oder `hxLab`), `duoLobbyPage`, `hxAdmin` oder `hxViewer`. Die Datei enthält Schriften, Farben, die Turm-Icons für `HexArsenal.icon()` und den Fensterrahmen.
- Der Duo-Server liefert nur freigegebene Dateien aus; neue Stylesheets müssen in `server/duo-transport.cjs` ergänzt werden.
- Skalierung am Desktop (ab 1101 × 601 px): `ui-layout.js` setzt `--hx-k` = min(Breite/1920, Höhe/1080), begrenzt auf 0,8–2. HUD, Turmfenster, Seitenmenüs und Fenster werden per `zoom` gleichmäßig skaliert; ihre Maße in `hexwerk.css` sind Werte bei 1920 × 1080. Unter `zoom` werden auch `vw`/`vh` multipliziert: Begrenzungen relativ zum Bildschirm durch `--hx-k` teilen. Elemente, die `fitMenu()` positioniert, rechnen den Zoom über `cssZoom()` heraus; neue gezoomte Elemente mit JS-Position müssen das ebenso tun.
