# Autohex TD

Ein Tower-Defense-Roguelite auf einer Hex-Karte, die du selbst baust. Du legst Straßen-Hexe aus einem Deck, bestimmst damit den Weg der Gegner und verteidigst deine Base mit Türmen. Die Darstellung ist stilisiertes 3D im Stil von Dorfromantik.

> Stand: 20.09.2026, aktueller Arbeitsstand einschließlich lokaler Änderungen.

> **Status:** spielbarer Prototyp (V0.7-dev). Kernschleife, Kartenbau, fünf Türme, Loadouts, Meta-Arsenal und Profilfortschritt, Exploration, Sonderfelder und Bosse laufen. Balancing und viele geplante Inhalte fehlen noch.

## Spielidee

**Map bauen → Türme setzen → Wave überleben → Deck erweitern.**

- Du startest mit einer festen Base und fünf Hex-Karten; das Hero-Profil bestimmt HP und Gold (Standard: 20 HP, 70 Gold).
- Jede Runde ziehst du drei Karten, legst genau eine an die bestehende Straße an und baust danach Türme und Gebäude.
- Jedes offene Straßenende ist eine Front. Gegner wählen an Gabelungen unabhängig zwischen schleifenfreien Wegen zur Base, auch längeren Umwegen.
- Alle zwei Waves darfst du dein Deck um eine von drei Karten erweitern.
- Nebel verbirgt Sonderfelder: Schätze, Shrines mit verdeckten Boni und Bosse mit besonderer Beute.
- Das Spiel ist endlos. Es geht darum, wie weit du kommst.

Türme sind nicht im Deck. Das Deck besteht nur aus Karten für die Karte selbst. Gute Ergebnisse entstehen aus dem Zusammenspiel von Kartenlayout, Turmwahl und Upgrades: Das Katapult liebt lange gerade Straßen, der Kettenblitz Kreuzungen, Freeze verlängert jede Killzone.

## Schnellstart

Voraussetzung: [Node.js](https://nodejs.org) (getestet mit v22).

```bash
npm install
npm start
```

Danach `http://localhost:8080` im Browser öffnen. Die 3D-Modelle (`.glb`) lassen sich nur über einen Server laden, deshalb reicht ein Doppelklick auf `index.html` für die 3D-Ansicht nicht.

Auf der bereitgestellten Subdomain gilt dasselbe: unter HTTP(S) startet die 3D-Version automatisch, solange `node_modules/three` im Projekt vorhanden ist. Über das Einstellungsmenü im Spiel kannst du zwischen `Automatisch`, `3D Low Poly`, `3D Hoch` und `SVG` umschalten.

| Aufruf | Ergebnis |
|---|---|
| `http://localhost:8080` | 3D-Ansicht (Three.js) |
| `http://localhost:8080/?svg` | Ursprüngliche SVG-Ansicht |
| `http://localhost:8080/?low` / `?high` | Grafikstufe erzwingen (niedrig: weniger Pixel, kleinere Schatten, keine Kantenglättung) |
| `http://localhost:8080/viewer.html` | Galerie aller 3D-Modelle |
| `index.html` per Doppelklick | SVG-Ansicht ohne Server |

Ohne WebGL fällt das Spiel automatisch auf die SVG-Ansicht zurück. Bricht die Bildrate in einer Wave dauerhaft ein, stellt der Renderer die Grafik selbst auf „niedrig“. Läuft das Spiel auf einem starken Rechner trotzdem schlecht, hilft [PERFORMANCE_TROUBLESHOOTING.md](PERFORMANCE_TROUBLESHOOTING.md).

## Bedienung

| Aktion | Bedienung |
|---|---|
| Karte wählen, Hex legen | Karte anklicken, dann freies Feld anklicken |
| Hex drehen | `R` oder Mausrad-Klick (im Uhrzeigersinn) |
| Wave starten | `Leertaste` oder Button |
| Doppeltes Tempo | `F` |
| Kamera zoomen | Mausrad oder `+` / `−` |
| Karte verschieben | Linke Maustaste ziehen (3D) |
| Ansicht drehen und kippen | Rechte oder mittlere Maustaste ziehen (3D); Q/E drehen links/rechts. Während der Platzierung dreht Mausrad-Klick das Hex. |
| Hex-Grid umschalten | G oder Einstellungen |
| Turm kaufen | Freien Turmplatz anklicken, dann Turm wählen |
| Werte, Upgrades, Verkauf | Gesetzten Turm anklicken |
| Gebäude bauen | Gebäudeplatz auf einem Dorf-Hex anklicken |

## Inhalte

- **Drei Startprofile:** Standardfestung, Festungsbauer und Händlerstadt. Alle erhalten Base-Ausbau für Mauern und eine automatische Verteidigungswaffe; der Festungsbauer besitzt günstigere Upgrades und eine dritte Stufe.

- **20 Hex-Karten** in fünf Raritäten, von der einfachen Geraden bis zur Kriegskreuzung mit Schadensbonus.
- **5 Starttürme** plus freischaltbare Balliste und Flammenturm, jeweils mit zwei Upgrade-Zweigen und einer Endstufe. Pro Run werden genau fünf ausgewählt.
- **3 Gebäude** auf Dorf-Hexen: Haus (Gold), Schmiede (Schaden), Markt (Rabatt).
- **Gegnertypen** mit gestaffeltem Schutz im Fantasy-Stil: Kobold-Schwarm (ungeschützt), grüner Kiwi-Krieger (normal, leichte Rüstung), Ork-Wächter (gepanzert), Goblin-Runenmeister (magiegeschützt) und der Obsidian-Wächter als Boss. Gegner können einander durchlaufen und überholen.
- **Exploration** mit Sichtradius, Nebel und seedbasierten Sonderfeldern. Der Startwert (Seed) wiederholt einen Run.
- **Sounds** werden lokal mit WebAudio erzeugt.

Die vollständigen, mit dem Code abgeglichenen Regeln, Werte und Tabellen stehen in [docs/GAME_REFERENCE.md](docs/GAME_REFERENCE.md).

## Projektstruktur

```
Philetstuben_Defense/
├── index.html, style.css     Oberfläche
├── classes/                  Spiellogik, Renderer, Kamera, Audio, API
├── assets/                   glTF-Modelle: tiles/, towers/, landmarks/, enemies/,
│                             buildings/, effects/
├── docs/                     Architektur, Regeln, Specs, Changelog, Projektprotokolle
├── ai/                       Projektgedächtnis und KI-Arbeitsnotizen
├── viewer.html               Modell-Galerie
├── serve.cjs                 Lokaler Entwicklungsserver
└── tests/                    Automatisierte Tests
```

Spiellogik und Daten sind bewusst von der Darstellung getrennt. SVG- und 3D-Renderer benutzen dieselbe Schnittstelle, die Logik blieb beim Wechsel unverändert. Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Tests

```bash
node --test tests/*.test.cjs
```

Zuletzt 149 Tests bestanden (20.09.2026). Sie prüfen Spiellogik, Kampf (inklusive Durchlaufen und Überholen), Wellen, Profil und Meta-Progression, Deck, Exploration, Kamera, den SVG-Renderer und die Modellzuordnung. Die jüngsten Darstellungsänderungen sind nicht im Browser geprüft; diese Prüfung übernimmt der Nutzer.

## Eigene Modelle

Alle 3D-Modelle sind von Hand gebaut. Maße, Ursprung, Kantennummerierung, Turmplätze und benannte Objekte (`turret`, `arm`, `aura`) beschreibt [docs/ASSET_SPEC.md](docs/ASSET_SPEC.md). Die Vorgaben für Minenleger, Balliste, Flammenturm, die fünf Gegner und die Gebäude stehen in [docs/ASSET_SPEC_v2.md](docs/ASSET_SPEC_v2.md). Neue Modelle als `.glb` in den passenden Ordner unter `assets/` legen.

Vorhanden sind Tiles, Sonderfelder, alle sieben Türme, alle fünf Gegner, die drei Gebäude und die Straßenmine. Noch fehlend: die Upgrade-Varianten der Türme. Fehlende Modelle ersetzt das Spiel durch einfache Platzhalter.

## Roadmap

Fest vorgemerkt, noch nicht umgesetzt:

- Weitere Heroes, Festungen und Base-Ausbaupfade; drei Startprofile und zwei Ausbaupfade sind bereits umgesetzt
- Erweiterung des vorhandenen Meta-Arsenals um weitere Inhalte; Balliste, Flammenturm, Stufe-4-Upgrades und drei Presets sind umgesetzt
- Zusätzliche Biome, Karten, Türme und Bossbeute; Dünenmeer, Sturmhochland und Aschelande sind als Mapregionen umgesetzt
- Weitere Schwierigkeitsstufen und ein Hardcore-Modus; Stufe 2 mit zwei zufälligen Base-Ausgängen und zwei Startplatzierungen ist umgesetzt
- Laufende Runs speichern/laden sowie Profil exportieren/importieren

Die Ideen und Entscheidungen dazu stehen in [ai/BRAIN.md](ai/BRAIN.md), die ausführliche Konzeptgeschichte im [Übergabeprotokoll](docs/README_TowerDefense_Projekt.md).

## Technik

Vanilla JavaScript ohne Build-Schritt, [Three.js](https://threejs.org) für die 3D-Ansicht, WebAudio für Sounds, Node.js nur für Tests und den lokalen Server.

## Deployment

Unter [webhook.php](webhook.php) liegt ein GitHub-Webhook-Endpunkt für Tag-Deployments.

- Der Endpunkt verarbeitet nur `push` auf `refs/tags/*`. Branch-Pushes, Tag-Deletes, `create` und Releases werden ignoriert.
- Deployments laufen nur, wenn GitHub den Auslöser als `Autophil317` sendet (Groß-/Kleinschreibung wird ignoriert).
- Das Deployment holt die Tags von `origin`, checkt den ausgelösten Tag per `git checkout --force --detach <tag>` aus, führt im Repo-Root ein `npm ci --omit=dev` aus und schreibt `assets/index.json` für nginx. `npm start` bleibt nur der lokale Entwicklungsserver.
- Das Secret kommt entweder aus der Umgebungsvariable `AUTOHEXTD_WEBHOOK_SECRET` oder aus der Datei `.deploy-webhook-secret` im Repo-Root `Philetstuben_Defense/`.
- Der Webhook bricht absichtlich ab, wenn das Checkout lokale getrackte Änderungen hat oder wenn der PHP-User keine Schreibrechte auf Repo und App-Verzeichnis besitzt.

Für GitHub den Webhook auf `https://autohextd.zlyfer.net/webhook.php` zeigen lassen, Content type `application/json`, Event `Just the push event`, und dasselbe Secret hinterlegen.

## Lizenz

Alle Rechte vorbehalten (siehe [LICENSE](LICENSE)). Quellcode, Modelle und Texte dürfen ohne Erlaubnis nicht kopiert, weiterverbreitet oder kommerziell genutzt werden. Three.js steht unter der MIT-Lizenz und wird per npm installiert.
