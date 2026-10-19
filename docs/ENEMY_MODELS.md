# Neue Gegnermodelle

Die sechs Modelle unter `assets/enemies/enemy_<typ>.glb` sind echte Low-Poly-Geometrie, nach den Konzeptbildern in `assets/enemies-concepts/` modelliert. Sie verwenden Materialfarben, keine Bildflächen. Die Bilder bleiben als Referenz und für den ursprünglichen SVG-Renderer erhalten.

## Bearbeiten und erzeugen

- In Blender über **Datei → Importieren → glTF 2.0** importieren. Die GLBs enthalten bewegliche Objektgruppen und Animationsclips. Es ist ein Rig aus starren Teilen, keine Haut mit Skelettgewichten.
- Reproduzierbare Modellquelle: `scripts/generate-enemy-models.mjs`. Ausführen mit `node scripts/generate-enemy-models.mjs` (vorhandenes Three.js genügt).
- Nach neuen Modellen: `node serve.cjs --write-index`. Der lokale Server stellt den Index ohnehin dynamisch bereit.
- Geometrievorschau ohne Browser: `node scripts/preview-enemy-models.mjs`, Ausgabe `artifacts/enemies/models-preview.png`. Reihenfolge: Schildknecht, Donnerkröte, Häutungskäfer; Pechschnecke, Pilzkoloss, Rammbockkäfer.
- Generieren überschreibt die sechs GLBs. Änderungen aus Blender deshalb separat speichern oder in die Modellquelle übernehmen.

## Animation und Spielanbindung

Vorwärts ist +X, oben +Y; Ursprung liegt am Boden. Die Größe entspricht den vorhandenen Gegnern. Alle beweglichen Gruppen heißen `rig_*`, haben unskalierte Gelenkkoordinaten und liegen direkt unter dem Modellroot. Der Renderer übernimmt sie getrennt vom unbeweglichen Körper.

Alle Dateien enthalten `Walk`; Donnerkröte zusätzlich `Jump`, Rammbockkäfer `Charge`. Die gemeinsame Quelle `classes/enemy-motion.mjs` berechnet sowohl die exportierten Clips als auch die bewegungsabhängigen Posen im Spiel. Dadurch folgen Schritte der tatsächlich zurückgelegten Strecke und halten beim Pausieren an. Sprung, Panzerbruch und Schildverlust werden vom echten Spielzustand gesteuert.

Schildknecht: Holzschild, Speer, Helm und Gang. Donnerkröte: vier Beine, Rückendornen, Ducken und Sprung. Häutungskäfer: sechs Beine, abwerfbare Panzerhälften, bernsteinfarbene Unterseite. Pechschnecke: gleitender Körper, Fühler und plastische Schneckenhausspirale. Pilzkoloss: schwerer Gang, breiter gefleckter Hut und Baumpilze. Rammbockkäfer: sechs Beine, roter Panzer, Goldbänder und gebogenes Horn.

Die Sakura-Edition verwendet dieselben Modelle über den bestehenden Fallback. Keine Spielwerte werden durch die Modelldateien geändert.
