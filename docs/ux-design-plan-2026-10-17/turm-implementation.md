# Turmansicht – Umsetzung und Prüfung

Branch: `codex/tower-view`. Ausgangsstand: `codex/pre-tower-view`, Commit `863e680`. Der Ausgangsstand enthält die vorher uncommittete Arbeit und die Entwurfsdokumente. `main` wurde nicht verändert.

Umgesetzt: beschriftete Schadenswerte mit bis zu zwei Nachkommastellen; Reichweite und Angriffstakt; kompakte Ausbaukarten mit getrenntem Vergleich und Kauf; vollständige Vergleichstabellen einschließlich unveränderter Werte und Spezialmetriken; aufklappbare drei Zielprioritäten; Werte und örtliche Einflüsse; gesperrte Ultimate weiterhin lesbar; fehlendes Gold und effektive Preise; Fokus- und Scroll-Rückkehr aus dem Vergleich. Verkauf und Mehrfachauswahl bleiben erhalten.

Die Ansicht verwendet vorhandene Spieldefinitionen, keine kopierten Beispielwerte. Aktive Überladung ist im angezeigten Angriffstakt berücksichtigt. Einstellungen und Arsenal wurden nicht umgebaut.

Prüfung: 508 Node-Tests bestanden. Neue Tests decken Informationsvollständigkeit aller Turmtypen, Vergleich ohne Kauf, Escape, Rabatt, fehlendes Gold, gesperrte Ultimate, Elementzweige, Auswahlwechsel und Überladung ab. Bestehende UI-Tests wurden an die neue Anordnung angepasst; ihre fachlichen Assertions bleiben erhalten.

Browserprüfung: localhost mit `first-player-test=1&dev-scenario=upgrade`, separater Spielstand. Bei 1280 × 720 sind beide Bogenschützen-Upgrades vollständig sichtbar. Vergleich enthält die drei Schadenswerte, Reichweite, Schussabstand und Flächenradius. Escape kehrt ohne Kauf zurück. Alle drei Zielprioritäten sind erreichbar. Ausbau Salve reduziert Gold von 200 auf 165, zeigt 8,75 / 7 / 4,55 und bietet Pfeilregen an. Screenshot: `turm-umgesetzt.png`.

Grenze der Sichtprüfung: kein vollständiger Durchlauf und keine manuelle Prüfung aller Fenstergrößen oder aller Turmtypen. Kleine Fenster und lange Inhalte bleiben scrollbar. Die automatisierten Tests prüfen die Spezialwerte; sie ersetzen keine geräteübergreifende Sichtprüfung.

Zur Rückkehr zum Zustand vor dem Umbau auf `codex/pre-tower-view` wechseln. Die Feature-Branch erst nach Sicherung späterer Änderungen löschen. Kein Push oder Release durchgeführt.
