# Autohex TD läuft schlecht? Schritt für Schritt prüfen

Diese Anleitung hilft, wenn das Spiel im Browser ruckelt, der Rechner stark ausgelastet ist oder die Lüfter hochdrehen. Sie ist für ein starkes System gedacht (z. B. Ryzen 9 7950X3D mit Radeon RX 7900 XTX), bei dem das Spiel eigentlich **kein Problem** sein sollte. Mögliche Ursachen sind fehlende Hardwarebeschleunigung, die GPU-Auswahl oder hohe Last durch Szene und Spiellogik.

Stand: 20.09.2026. Modellzahl, Gegnerzahl und Kartengröße sind gewachsen; frühere pauschale Angaben zu Modellgröße und Dreiecken gelten nicht als aktuelle Messung. Diese Anleitung ist für manuelle Prüfungen durch den Nutzer gedacht.

---

## Schritt 1: Erst die einfachen Schalter ausprobieren

Hänge diese Zusätze hinter die Adresse des Spiels (zum Beispiel `http://localhost:8080/`):

| Adresse | Wirkung |
|---|---|
| `http://localhost:8080/?low` | Niedrige Grafik: keine Kantenglättung, kleinere Schatten, weniger Pixel |
| `http://localhost:8080/?high` | Hohe Grafik (Standard) |
| `http://localhost:8080/?svg` | 2D-Ansicht ohne WebGL |

**So liest du das Ergebnis:**

- **Mit `?low` flüssig:** Die reduzierte Grafiklast hilft. Weiter mit Schritt 2, um die Hardwarebeschleunigung zu prüfen.
- **Mit `?svg` flüssig, aber 3D nicht:** Die Ursache lässt sich auf die 3D-Darstellung oder deren zusätzliche Last eingrenzen. Weiter mit Schritt 2.
- **Auch `?svg` ruckelt:** Dann liegt es wahrscheinlich nicht an der Grafik. Weiter mit Schritt 5.

Der Renderer schaltet bei dauerhaft niedriger Bildrate in einer Wave auch **selbst** auf „niedrig“ und merkt sich das. Wenn du wieder die hohe Stufe willst, öffne die Adresse einmal mit `?high`.

---

## Schritt 2: Prüfen, ob der Browser die Grafikkarte nutzt

1. Öffne im Browser eine neue Registerkarte.
   - Chrome: `chrome://gpu`
   - Edge: `edge://gpu`
   - Firefox: `about:support` (Abschnitt „Grafik“)
2. Suche den Eintrag **WebGL** (bzw. „WebGL2“). Dort soll **„Hardware accelerated“** stehen.
   - **„Software only“ oder „Disabled“:** WebGL läuft auf der CPU. Das ist der wahrscheinlichste Grund für die hohe Last. Gehe zu Schritt 3.
3. Suche weiter unten die Angabe zur Grafikkarte (`GL_RENDERER` oder „Graphics Feature Status“).
   - **Soll stehen:** `AMD Radeon RX 7900 XTX`
   - **Problem:** `AMD Radeon(TM) Graphics` (das ist die kleine integrierte Grafik des Prozessors), `SwiftShader` oder `Microsoft Basic Render Driver` (reine Software). Gehe zu Schritt 3 und 4.

---

## Schritt 3: Hardwarebeschleunigung im Browser einschalten

1. Öffne die Browser-Einstellungen.
2. Suche nach **„Hardwarebeschleunigung“** (in Chrome und Edge unter „System“).
3. Schalte **„Hardwarebeschleunigung verwenden, wenn verfügbar“** ein.
4. Starte den Browser komplett neu (alle Fenster schließen).
5. Prüfe noch einmal `chrome://gpu` bzw. `edge://gpu` wie in Schritt 2.

---

## Schritt 4: Windows dem Browser die starke Grafikkarte zuweisen

Der Prozessor hat eine kleine integrierte Radeon-Grafik. Manchmal legt Windows fest, dass der Browser diese benutzt statt der RX 7900 XTX.

1. Öffne die Windows-Einstellungen: **System > Anzeige > Grafik**.
2. Suche deinen Browser in der Liste. Ist er nicht dabei, wähle **„Desktop-App“ > „Durchsuchen“** und füge die `.exe` des Browsers hinzu (z. B. `chrome.exe` oder `msedge.exe`).
3. Klicke auf den Browser, dann auf **„Optionen“**, und wähle **„Hohe Leistung“**.
4. Speichern und den Browser neu starten.
5. Prüfe noch einmal `chrome://gpu` bzw. `edge://gpu`. Jetzt sollte die RX 7900 XTX genannt werden.

**Zusätzlich empfohlen:** Aktuellen Grafiktreiber von AMD installieren (Adrenalin-Treiber von amd.com), denn ein veralteter Treiber kann WebGL ausbremsen.

---

## Schritt 5: Mitschauen, was ausgelastet ist

Öffne den **Task-Manager** (Strg + Umschalt + Esc), Reiter **Leistung**, während das Spiel läuft.

| Beobachtung | Wahrscheinlicher Grund | Was tun |
|---|---|---|
| **GPU** hoch (über 80 %) | Die Grafik ist der Engpass | `?low` nutzen, Schritt 4 prüfen |
| **GPU** fast 0 %, **ein CPU-Kern** hoch | WebGL läuft in Software auf der CPU | Schritt 2, 3 und 4 |
| Beides niedrig, das Spiel ruckelt trotzdem | Etwas im Spiel selbst | Schritt 6 |

Im Reiter **Prozesse** siehst du außerdem, welcher Browser-Prozess viel verbraucht. Bei „GPU-Prozess“ liegt es an der Grafik, bei einem „Tab“ eher am Spiel.

---

## Schritt 6: Wenn es weiterhin schlecht läuft

Bitte notiere diese Punkte und melde sie zurück, damit gezielt gesucht werden kann:

1. **Welcher Browser** und welche Version? (Chrome, Edge, Firefox, Brave, Opera …)
2. **Was genau ist das Problem?** Niedrige Bildrate, hohe Auslastung, Lüfter, Abstürze, Ruckeln nur bei manchen Aktionen?
3. **Wann tritt es auf?** Schon im Menü, beim Bauen oder erst mit vielen Gegnern in einer Wave?
4. **Was steht in `chrome://gpu`** beim Eintrag „WebGL“ und bei der Grafikkarte? (Ein Screenshot reicht.)
5. **Ergebnis der Adressen-Tests aus Schritt 1** (`?low`, `?svg`).
6. **Sind andere Browser-Fenster oder -Tabs offen?** Am besten alle anderen schließen und testen.

---

## Kurzüberblick der wahrscheinlichsten Ursachen

1. **Hardwarebeschleunigung im Browser ist aus.** WebGL läuft auf der CPU.
2. **Der Browser nutzt die integrierte Grafik** des Ryzen statt der RX 7900 XTX.
3. **Veralteter Grafiktreiber.**
4. **Sehr hohe Bildwiederholrate des Monitors** (120/144 Hz oder mehr). Das Spiel begrenzt seit `v2` die Bildrate auf 60 in einer Wave und 30 sonst.
5. **Ein Problem im Spiel selbst.** Dann brauchen wir die Angaben aus Schritt 6.

## Entwicklung: hohe Wellen und Hintergrundbetrieb

Der konkrete Maßnahmenplan, Messaufbau und erste Ergebnisse stehen in [PERFORMANCE_PLAN.md](PERFORMANCE_PLAN.md). Die erste Optimierung reduziert wiederholte Turmberechnungen; weitere Schritte betreffen UI, Wegdaten, Zielsuche, Darstellung, Hintergrundbetrieb und Duo.

Verbindlich: keine Reduktion der Grafikqualität, Effekte, Gegner oder Spielregeln. Frühere Hinweise zu optionalen Low-/Diagnosemodi in diesem Dokument sind keine Strategie für diese Optimierungen. Historische Bildratenangaben oben sind keine aktuelle Messung oder garantierte Begrenzung. Browser-/GPU- und Mobile-Messungen stehen noch aus.
