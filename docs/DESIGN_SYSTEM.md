# Autohex TD – Designregeln und Bestandsprüfung

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
