# Hex Bastion

Ein Tower-Defense-Roguelite auf einer Hex-Karte, die du selbst baust. Du legst Straßen-Hexe aus einem Deck, bestimmst damit den Weg der Gegner und verteidigst deine Base mit Türmen. Die Darstellung ist stilisiertes 3D im Stil von Dorfromantik.

> **Status:** spielbarer Prototyp (V0.7-dev). Kernschleife, Kartenbau, fünf Türme, Loadouts, erste Meta-Progression, Exploration, Sonderfelder und Bosse laufen. Balancing und viele geplante Inhalte fehlen noch.

## Spielidee

**Map bauen → Türme setzen → Wave überleben → Deck erweitern.**

- Du startest mit einer festen Base (20 HP, 70 Gold) und fünf Hex-Karten.
- Jede Runde ziehst du drei Karten, legst genau eine an die bestehende Straße an und baust danach Türme und Gebäude.
- Jedes offene Straßenende ist eine Front. Gegner nehmen immer den kürzesten Weg zur Base.
- Alle zwei Waves darfst du dein Deck um eine von drei Karten erweitern.
- Nebel verbirgt Sonderfelder: Schätze, Shrines mit verdeckten Boni und Bosse mit besonderer Beute.
- Das Spiel ist endlos. Es geht darum, wie weit du kommst.

Türme sind nicht im Deck. Das Deck besteht nur aus Karten für die Karte selbst. Gute Ergebnisse entstehen aus dem Zusammenspiel von Kartenlayout, Turmwahl und Upgrades: Das Katapult liebt lange gerade Straßen, der Kettenblitz Kreuzungen, Freeze verlängert jede Killzone.

## Schnellstart

Voraussetzung: [Node.js](https://nodejs.org) (getestet mit v22).

```bash
cd towerdefense-v0.1
npm install
npm start
```

Danach `http://localhost:8080` im Browser öffnen. Die 3D-Modelle (`.glb`) lassen sich nur über einen Server laden, deshalb reicht ein Doppelklick auf `index.html` für die 3D-Ansicht nicht.

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
| Hex drehen | `R` |
| Wave starten | `Leertaste` oder Button |
| Doppeltes Tempo | `F` |
| Kamera zoomen | Mausrad oder `+` / `−` |
| Karte verschieben | Linke Maustaste ziehen (3D) |
| Ansicht drehen und kippen | Rechte oder mittlere Maustaste ziehen (3D) |
| Turm kaufen | Freien Turmplatz anklicken, dann Turm wählen |
| Werte, Upgrades, Verkauf | Gesetzten Turm anklicken |
| Gebäude bauen | Gebäudeplatz auf einem Dorf-Hex anklicken |

## Inhalte

- **18 Hex-Karten** in fünf Raritäten, von der einfachen Geraden bis zur Kriegskreuzung mit Schadensbonus.
- **5 Starttürme** plus freischaltbare Balliste und Flammenturm, jeweils mit zwei Upgrade-Zweigen und einer Endstufe. Pro Run werden genau fünf ausgewählt.
- **3 Gebäude** auf Dorf-Hexen: Haus (Gold), Schmiede (Schaden), Markt (Rabatt).
- **Gegnertypen** mit gestaffeltem Schutz im Fantasy-Stil: Kobold-Schwarm (ungeschützt), grüner Kiwi-Krieger (normal, leichte Rüstung), Ork-Wächter (gepanzert), Goblin-Runenmeister (magiegeschützt) und der Obsidian-Wächter als Boss. Gegner halten Abstand zueinander und laufen nicht ineinander.
- **Exploration** mit Sichtradius, Nebel und seedbasierten Sonderfeldern. Der Startwert (Seed) wiederholt einen Run.
- **Sounds** werden lokal mit WebAudio erzeugt.

Die vollständigen, mit dem Code abgeglichenen Regeln, Werte und Tabellen stehen in [towerdefense-v0.1/README.md](towerdefense-v0.1/README.md).

## Projektstruktur

```
towerdefense-v0.1/
├── index.html, style.css     Oberfläche
├── game.js                   Runsteuerung, Aktionen, HUD
├── data.js, waves.js         Karten, Türme, Upgrades, Wave- und Economy-Werte
├── map.js, exploration.js    Hexgeometrie, Straßen, Wege, Sicht und Sonderfelder
├── combat.js, deck.js,       Kampf, Deck und Gebäude (ohne DOM)
│   buildings.js, random.js
├── svg-renderer.js           SVG-Darstellung
├── three-renderer.js         3D-Darstellung (Three.js)
├── model-map.js              Zuordnung Spielzustand → 3D-Modell
├── camera.js, sound.js       Kamera und Audio
├── assets/                   glTF-Modelle: tiles/, towers/, landmarks/, enemies/,
│                             buildings/, effects/
├── viewer.html               Modell-Galerie
├── serve.cjs                 Lokaler Entwicklungsserver
└── tests/                    Automatisierte Tests
```

Spiellogik und Daten sind bewusst von der Darstellung getrennt. SVG- und 3D-Renderer benutzen dieselbe Schnittstelle, die Logik blieb beim Wechsel unverändert. Details: [ARCHITECTURE.md](towerdefense-v0.1/ARCHITECTURE.md).

## Tests

```bash
cd towerdefense-v0.1
node --test tests/*.test.cjs
```

Aktuell 121 Tests. Sie prüfen Spiellogik, Kampf (inklusive Gegnerabstand), Wellen, Profil und Meta-Progression, Deck, Exploration, Kamera, den SVG-Renderer und die Modellzuordnung. Die 3D-Darstellung selbst ist bisher nur manuell im Browser geprüft.

## Eigene Modelle

Alle 3D-Modelle sind von Hand gebaut. Maße, Ursprung, Kantennummerierung, Turmplätze und benannte Objekte (`turret`, `arm`, `aura`) beschreibt [ASSET_SPEC.md](towerdefense-v0.1/ASSET_SPEC.md). Die Vorgaben für Minenleger, Balliste, Flammenturm, die fünf Gegner und die Gebäude stehen in [ASSET_SPEC_v2.md](towerdefense-v0.1/ASSET_SPEC_v2.md). Neue Modelle als `.glb` in den passenden Ordner unter `assets/` legen.

Vorhanden sind Tiles, Sonderfelder, alle sieben Türme, alle fünf Gegner, die drei Gebäude und die Straßenmine. Noch fehlend: die Upgrade-Varianten der Türme. Fehlende Modelle ersetzt das Spiel durch einfache Platzhalter.

## Roadmap

Fest vorgemerkt, noch nicht umgesetzt:

- Verschiedene Starthelden und Startfestungen mit eigenen Effekten
- Meta-Arsenal mit freischaltbaren Inhalten; Diamanten und Profilstatistiken funktionieren bereits
- Weitere Biome, Karten, Türme (unter anderem Nekromant) und Bossbeute
- Schwierigkeitsstufen und ein Hardcore-Modus
- Speichern und Laden

Die Ideen und Entscheidungen dazu stehen in [BRAIN.md](BRAIN.md), die ausführliche Konzeptgeschichte im [Übergabeprotokoll](README_TowerDefense_Projekt.md).

## Technik

Vanilla JavaScript ohne Build-Schritt, [Three.js](https://threejs.org) für die 3D-Ansicht, WebAudio für Sounds, Node.js nur für Tests und den lokalen Server.

## Lizenz

Alle Rechte vorbehalten (siehe [LICENSE](LICENSE)). Quellcode, Modelle und Texte dürfen ohne Erlaubnis nicht kopiert, weiterverbreitet oder kommerziell genutzt werden. Three.js steht unter der MIT-Lizenz und wird per npm installiert.
