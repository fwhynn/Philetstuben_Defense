# AutoHex TD – Meta-Progression und Turm-Loadouts

Stand: 20.09.2026, einschließlich lokaler Änderungen. Status: Umsetzungsstand und Designplan. Etappe 1 bis 3 sind umgesetzt. Das Meta-Arsenal enthält Balliste, Flammenturm und eine dauerhaft freischaltbare vierte Stufe für jeden vorhandenen Turm. Elementturm und Nekromantenturm sind ebenfalls umgesetzt.

Aktueller Stand: Loadout, Diamanten, Arsenal, drei Presets, Turmstatistiken sowie drei Startfestungen und Base-Ausbau sind umgesetzt. Standardfestung ist sofort verfügbar; Festungsbauer benötigt den Sieg über Welle 35 auf Stufe 1, Händlerstadt auf Stufe 2. Werte stehen in README und heroes.js. Abschnitte mit „Vorschlag“ oder „Zielbild“ sind nicht implementierte Ideen; sie beschreiben keine aktuellen Voraussetzungen oder Menüs.

## 1. Ziel des Systems

Die Meta-Progression soll langfristige Ziele schaffen, ohne einzelne Runs durch dauerhafte Schadensboni automatisch zu gewinnen. Freischaltungen erweitern vor allem die strategischen Möglichkeiten: neue Turmtypen, Karten, Gebäude, Startfestungen und später Biome. Die Stärke eines Runs soll weiterhin hauptsächlich aus Kartenlayout, Goldentscheidungen, Turmwahl und Upgrades entstehen.

Das zentrale neue System ist ein Turm-Loadout:

- Jeder Run verwendet **genau fünf unterschiedliche Turmtypen**.
- Der Spieler startet anfangs mit genau fünf freigeschalteten Turmtypen und damit einem vollständigen Standard-Loadout.
- Später wächst der freigeschaltete Turmkader, die Zahl der Loadoutplätze bleibt grundsätzlich bei fünf.
- Nur die fünf gewählten Turmtypen erscheinen während des Runs im Baumenü.
- Türme im Loadout sind Bauoptionen und werden weiterhin mit Run-Gold gekauft. Es werden nicht fünf kostenlose Türme auf der Karte platziert.
- Ein begonnener Run speichert sein Loadout. Spätere Änderungen wirken erst auf den nächsten Run.

Dadurch wird die Auswahl vor dem Run zu einer echten Build-Entscheidung: Ein universeller Kader ist bequem, ein spezialisierter Kader kann stärkere Synergien erzeugen, hat aber klare Lücken.

## 2. Startzustand eines neuen Profils

### Freigeschaltete Starttürme

1. **Archer** – günstiger, schneller Einzelzielschaden; später Einzelziel oder Flächenschaden.
2. **Katapult** – Linien- und Belagerungsschaden; stark auf langen Straßen.
3. **Kettenblitz** – Gruppen- und Kreuzungsspezialist.
4. **Freeze** – Verlangsamung und Killzone-Support.
5. **Minenleger** – legt stapelbare Minen ohne feste Mengenobergrenze auf Straßen; stark auf langen, kontrollierten Wegen.

Das Standard-Loadout enthält alle fünf. Damit bleibt die heutige Auswahl erhalten und wird um die fehlende fünfte Rolle ergänzt. Der Minenleger eignet sich besser als der Nekromant für den Einstieg: Seine Funktion ist sofort lesbar und verstärkt den Kern des Spiels – das Bauen guter Wege.

### Weitere Turmrollen – Umsetzung und Vorschläge

Aktuell sind Balliste (20), Flammenturm (35), Elementturm (45) und Nekromantenturm (55 Diamanten) im Arsenal kaufbar. Giftalchemist und Verstärkerturm bleiben Vorschläge:

| Turm | Rolle | Stärke | bewusste Schwäche |
|---|---|---|---|
| Nekromant | Beschwörer | verwertet Kills in engen Killzones | braucht andere Türme für erste Kills |
| Giftalchemist | Schaden über Zeit | stark gegen langlebige Ziele und Bosse | schwach gegen schnelle Schwärme |
| Balliste | Elite-/Bosskiller | hohe Reichweite und Einzeltrefferschaden | niedrige Feuerrate, kaum Gruppenwirkung |
| Flammenturm | Flächenkontrolle | anhaltender Flächenschaden | kurze Reichweite, schwächer gegen Feuerresistenz |
| Verstärkerturm | Support | verbessert benachbarte Türme | verursacht selbst keinen Schaden |

Mit allen fünf Erweiterungen würde der Kader zehn Typen umfassen; aktuell sind es neun. Weitere Türme sollten erst folgen, wenn jeder vorhandene Typ eine erkennbare Rolle und zwei brauchbare Upgradezweige besitzt.

## 3. Loadout-Regeln

### Auswahl vor dem Run

Der Ablauf wird um einen Vorbereitungsbildschirm ergänzt:

1. Startfestung wählen: Standard, Festungsbauer oder Händler; alle drei derzeit frei verfügbar.
2. Fünf Turmtypen aus allen freigeschalteten Türmen wählen.
3. Optional ein gespeichertes Loadout-Preset laden.
4. Zusammenfassung mit Rollenabdeckung, Seed und gewählter Festung prüfen.
5. Run starten; das Loadout wird in den Runzustand kopiert.

Die fünf Plätze dürfen keine Duplikate enthalten. Ein Run kann nicht mit weniger als fünf Türmen starten. Hat ein Profil genau fünf Türme, sind alle automatisch gewählt und der zusätzliche Bildschirm kann beim allerersten Start als kurze Einführung erscheinen.

### Bauphase

- Das Baumenü zeigt ausschließlich die fünf mitgenommenen Turmtypen.
- Reihenfolge und Zifferntasten folgen dem gewählten Loadout.
- Gesperrte Türme tauchen während eines Runs nicht als störende deaktivierte Einträge auf.
- Upgradezweige gehören fest zum Turmtyp und benötigen vorerst keine eigenen Loadoutplätze.
- Shrines und Bossbeute dürfen keine nicht mitgenommenen Türme anbieten. Belohnungen dürfen aber zeitlich begrenzte Modifikationen für Loadouttürme enthalten.

### Presets

Nach dem ersten zusätzlichen Turm werden drei Presetplätze freigeschaltet. Presets speichern nur die fünf Turm-IDs und einen Namen, beispielsweise „Bossjagd“, „Schwarmkontrolle“ oder „Lange Wege“. Fehlende Inhalte nach einem Save- oder Versionswechsel werden markiert und müssen ersetzt werden.

### Lesbare Rollenprüfung

Der Vorbereitungsbildschirm zeigt Hinweise statt harter Verbote:

- kein zuverlässiger Gruppenschaden,
- kein Boss-/Elite-Schaden,
- kein Slow oder anderer Support,
- hohe durchschnittliche Baukosten,
- starke Synergie mit langen Straßen, Kreuzungen oder engen Killzones.

Der Spieler darf riskante Zusammenstellungen trotzdem starten. Diese Hinweise erklären die Konsequenz, ohne Builds vorzuschreiben.

## 4. Meta-Währung: Diamanten

Diamanten werden bei Game Over gutgeschrieben. Das Arsenal kann auch während eines Runs geöffnet werden; Käufe gelten für kommende Runs. Run-Gold und Diamanten bleiben getrennt.

### Implementierte Berechnung

`Diamanten = Wave-Belohnung + Boss-Belohnung + Erstmeilensteine`

- Wave-Belohnung: `floor(erreichte Wave / 2)`.
- Jeder besiegte regelmäßige Boss (Wave 15, 25, 35 …): `+5`.
- Jeder besiegte Erkundungsboss: `+3`.
- Persönlicher Rekord: `+2` je neuem Zehnerwellen-Meilenstein, nur einmal pro Profil.
- Herausforderungen sind noch nicht implementiert; vorgeschlagene spätere Zusatzbelohnung: etwa `0–5`.

Beispiele ohne Herausforderungen; Zehner-Meilensteine in dieser Tabelle wurden bereits in früheren Runs erreicht und zählen daher nicht erneut:

| Run | Rechnung | Diamanten |
|---|---|---:|
| Ende in Wave 6 | 3 | 3 |
| Ende in Wave 10, kein regulärer Boss | 5 | 5 |
| Ende in Wave 15, Boss in Wave 15 besiegt | 7 + 5 | 12 |
| Ende in Wave 25, zwei reguläre Bosse und ein Erkundungsboss besiegt | 12 + 10 + 3 | 25 |

Aktuell zahlt ein manueller Neustart keine Diamanten für den abgebrochenen Run aus. Game Over vor Wave 2 bringt keine reine Wave-Belohnung; Bossbelohnungen werden separat berechnet. Eine Abrechnung beim freiwilligen Abbruch wäre ein späteres Feature.

## 5. Freischaltungsstruktur

Aktuell gibt es das Arsenal mit vier kaufbaren Türmen und neun Stufe-4-Unlocks. Die folgenden zusätzlichen Kategorien und Pfade sind Vorschläge.

### Kategorie A – Arsenal

Neue Turmtypen sind der wichtigste Fortschritt, weil sie das Loadoutsystem tragen.

Vorgeschlagene Kosten:

- erster zusätzlicher Turm: 20 Diamanten,
- zweiter: 35,
- dritter: 50,
- vierter: 70,
- fünfter: 90.

Noch nicht implementierter Vorschlag für spätere Unlocks: Die Reihenfolge ist nicht vollständig frei: Nach dem Tutorial kann der Spieler aus zwei oder drei sichtbaren Türmen wählen. Anschließend öffnen sich angrenzende Rollen. So entsteht persönliche Entwicklung, ohne dass ein Anfänger von zehn unbekannten Türmen überfordert wird.

### Kategorie B – Kartografie

- neue Hexkarten für den allgemeinen Rewardpool,
- alternative Startdecks,
- später neue Biome.

Jede Freischaltung fügt eine Option hinzu und darf den Kartenpool nicht mit schwachen Pflichtkarten verwässern. Vor der Freischaltung werden Kartenwirkung und Seltenheit angezeigt.

### Kategorie C – Siedlung

- neue Gebäude,
- alternative Gebäude-Upgrades,
- zusätzliche Wirtschaftsstrategien.

Gebäude-Unlocks sollten seitwärts gerichtete Alternativen sein, beispielsweise ein Observatorium für Sicht/Exploration oder eine Werkstatt für Minen und mechanische Türme.

### Kategorie D – Vermächtnis

- Startfestungen beziehungsweise Heldenprofile,
- zusätzliche Presetplätze,
- Statistiken, Bestiarium und Runhistorie,
- kosmetische Varianten.

Startfestungen verändern Regeln und besitzen möglichst einen Vorteil plus eine Einschränkung. Beispiele:

- Standardfestung: neutral, 20 HP und 70 Gold.
- Händlerstadt: mehr Startgold und bessere Märkte, aber weniger Base-HP.
- Frostfestung: stärkere Slow-Effekte, aber teurere reine Schadentürme.
- Nekromanten-Zitadelle: bessere Beschwörungen, aber geringeres Gold aus normalen Kills.

### Keine dauerhaften Pflicht-Stats in Version 1

Permanente globale Boni wie `+20 % Schaden`, `+50 Startgold` oder zusätzliche Base-HP werden zunächst nicht eingeführt. Sie machen alte Runs rückwirkend leichter und erschweren das Balancing. Kleine Komfort-Unlocks sind erlaubt, wenn sie keine Kampfkraft erhöhen, etwa weitere Presets oder detailliertere Prognosen.

## 6. Freischaltungsrhythmus – unbestätigte Balanceziele

Das gewünschte Tempo:

- Nach 2–4 normalen Runs: erster neuer Turm.
- Nach etwa 8–12 Runs: mehrere echte Loadoutentscheidungen und erste Startfestung.
- Nach etwa 20–30 Runs: Großteil der ersten Meta-Stufe freigeschaltet.
- Danach: Herausforderungen, Biome, kosmetische Ziele und besonders schwere Inhalte.

Der erste Turm-Unlock sollte sehr früh erfolgen. Vorher hat der Spieler exakt fünf verfügbare Türme und damit noch keine Auswahl; erst der sechste Turm aktiviert den eigentlichen Loadoutgedanken.

## 7. Meilensteine und Herausforderungen – spätere Vorschläge

Aktuell geben neue Zehnerwellen-Rekorde +2 Diamanten; Arsenal und Presets sind nicht an diese Wave-Meilensteine gebunden. Folgendes sind zusätzliche, noch nicht implementierte Vorschläge: Sie erklären Systeme und belohnen unterschiedliche Spielweisen:

- Wave 10 erreichen: Arsenal-Freischaltung und Auswahl des ersten neuen Turms.
- Ersten Boss besiegen: Bestiarium und Bossstatistik.
- Wave 20 erreichen: erste alternative Startfestung kaufbar.
- Einen Run mit fünf verschiedenen Turmtypen bauen: kosmetisches Banner.
- Wave 15 ohne Freeze erreichen: kleine Diamantenbelohnung, einmalig.
- 100 Gegner mit Minen besiegen: Minenleger-Kosmetik oder alternativer Effektstil.

Herausforderungen dürfen keine bestimmte Freischaltung dauerhaft blockieren. Sie geben Diamanten, Kosmetik oder Abkürzungen, während Kerninhalte immer regulär kaufbar bleiben.

## 8. UI- und Spielerfluss – späteres Zielbild

Aktuell gibt es HUD-Dropdowns, Arsenal-, Loadout- und Game-over-Overlays. Türme werden an-/abgewählt; bei fünf belegten Plätzen muss zuerst einer abgewählt werden. Neue Unlocks erscheinen sofort in der offenen Auswahl. Drag-and-drop, Sammlung, Wunsch-Unlock und Einführung sind noch nicht umgesetzt.

### Hauptmenü

- „Neuer Run“ führt zur Runvorbereitung.
- „Meta-Fortschritt“ öffnet den Freischaltungsbaum.
- „Sammlung“ zeigt Türme, Karten, Gebäude und Festungen.
- Diamantenstand ist im Hauptmenü sichtbar, während eines Runs nur in einer unaufdringlichen Profilanzeige.

### Runvorbereitung

Links steht der freigeschaltete Turmkader, in der Mitte die fünf Loadoutplätze, rechts die Rollen- und Kostenübersicht. Ein Klick oder Drag-and-drop tauscht Türme aus. Der Startbutton ist erst aktiv, wenn fünf unterschiedliche gültige Türme gewählt sind.

Beim ersten Profil mit genau fünf Türmen wird das Standard-Loadout erklärt und direkt vorbelegt. Sobald der sechste Turm freigeschaltet wird, öffnet sich automatisch eine kurze Einführung: „Du hast mehr Türme als Plätze. Wähle fünf für deinen nächsten Run.“

### Runende

Der Game-over-Bildschirm zeigt:

- erreichte Wave und neue Bestmarke,
- besiegte Bosse,
- Diamantenaufschlüsselung,
- Fortschritt zum nächsten sichtbaren Wunsch-Unlock,
- „Noch einmal mit gleichem Loadout“, „Loadout ändern“ und „Meta-Fortschritt“.

Ein Wunsch-Unlock kann markiert werden; das System zeigt lediglich den Fortschritt und kauft ihn nicht automatisch.

## 9. Balancing-Leitplanken

- Ein neuer Turm erweitert Optionen und ist kein direktes Upgrade eines Startturms.
- Jede Rolle muss mindestens zwei sinnvolle Kombinationen mit Karten, Gebäuden oder anderen Türmen besitzen.
- Kein einzelner Turm darf Voraussetzung für einen normalen Boss sein.
- Ein ausgewogenes Start-Loadout muss alle normalen Gegnerarten bewältigen können.
- Spezialisierte Loadouts dürfen stärker sein, wenn Kartenlayout und Gegnerwellen zu ihnen passen.
- Loadoutgröße fünf bleibt während der ersten vollständigen Version konstant. Zusätzliche Slots wären ein massiver Machtzuwachs und verwässern die Entscheidung.
- Neue Inhalte dürfen den Rewardpool nur betreten, wenn sie im Profil aktiviert sind. Optional kann die Sammlung später einzelne freigeschaltete Karten deaktivieren, Türme jedoch nur über das Loadout.
- Geplant für Run-Speicherung: Versionen und Änderungen von Kosten/Turmwerten berücksichtigen. Aktuell existieren keine persistenten Runs.

## 10. Technisches Datenmodell

Die Regeln bleiben datengetrieben. Das folgende Schema ist eine vereinfachte Skizze, nicht der vollständige aktuelle Speichervertrag; verbindlich sind profile.js und freshState() in game.js.

```js
profile = {
  version: 1,
  diamonds: 0,
  unlockedTowers: ['archer', 'catapult', 'chain', 'freeze', 'mine'],
  activeLoadout: ['archer', 'catapult', 'chain', 'freeze', 'mine'],
  loadoutPresets: [],
  unlocks: [],
  milestones: [],
  records: { highestWave: 0, bossesKilled: 0, runsPlayed: 0 },
  lifetime: { normalKills: 0, diamondsEarned: 0 }
}

run = {
  // bestehender Runzustand
  towerLoadout: ['archer', 'catapult', 'chain', 'freeze', 'mine'],
  profileVersionAtStart: 1,
  earnedMeta: { periodicBosses: 0, explorationBosses: 0 }
}
```

Validierung beim Laden:

- unbekannte IDs ignorieren und protokollieren,
- nur freigeschaltete Türme akzeptieren,
- Duplikate entfernen,
- fehlende Plätze mit Starttürmen auffüllen,
- bei beschädigtem Profil ein sicheres Standardprofil herstellen,
- Profil und laufenden Run getrennt behandeln; persistentes Speichern des Runs ist noch offen.

Der Browser-Prototyp speichert das Profil in `localStorage`; exportierbares JSON-Backup ist noch nicht umgesetzt. Vor dem ersten öffentlichen Release sollte es Versionsmigrationen und einen sichtbaren „Profil zurücksetzen“-Dialog geben.

## 11. Umsetzung in Etappen

### Etappe 1 – Loadout-Grundlage

- [x] Minenleger mit Basiswerten und zwei Upgradezweigen implementieren.
- [x] `towerLoadout` in den Runzustand aufnehmen.
- [x] Baumenü von allen `TOWERS` auf die fünf IDs des Run-Loadouts umstellen.
- [x] Standardprofil mit fünf Starttürmen anlegen.
- [x] Runvorbereitungsbildschirm mit genau fünf validierten Plätzen bauen.
- [x] Tests für Duplikate, fehlende Türme, Runneustart und unveränderliches laufendes Loadout.

Abnahmekriterium: Jeder neue Run startet mit genau fünf Bauoptionen; ein sechster freigeschalteter Turm kann nur durch Austausch mitgenommen werden.

### Etappe 2 – Profil und Diamanten (umgesetzt)

- [x] Profil speichern/laden und Versionierung einführen.
- [x] Game-over-Auswertung und Diamantenformel implementieren.
- [x] Schutz gegen doppelte Auszahlung beim Neuladen oder mehrfachen Game-over-Aufruf.
- [x] Profilübersicht, Bestmarke und Runanzahl anzeigen.

Abnahmekriterium: Gleicher abgeschlossener Run kann seine Meta-Belohnung exakt einmal auszahlen; Neustart und Browserreload behalten Profil und Loadout.

### Etappe 3 – Erste echte Auswahl (umgesetzt)

- [x] Balliste und Flammenturm als erste zwei kaufbare Türme umsetzen; Elementturm und Nekromant sind inzwischen ebenfalls umgesetzt.
- [x] Arsenal-Seite und Kaufablauf ergänzen.
- [x] Drei Loadout-Presets sowie Rollenwarnungen einführen.
- [x] Daten zu Nutzung, Kaufhäufigkeit und erreichter Wave lokal statistisch erfassen.
- [x] Für jeden Turm eine vierte Stufe ergänzen, die dauerhaft mit Diamanten freigeschaltet und im Run mit Gold gekauft wird.

Abnahmekriterium: Technisch lassen sich verschiedene Fünfer-Loadouts zusammenstellen. Ziel für die noch offene Balanceprüfung: mindestens drei deutlich verschiedene, brauchbare Zusammenstellungen.

### Etappe 4 – Breite Meta-Progression (teilweise umgesetzt)

Umgesetzt sind drei Startprofile/Base-Ausbau sowie ein erstes Run-Inhaltspaket: zwei Hexkarten, Heilquelle/Werksegen und alternative Bosssegen. Zusätzliche Meta-Kategorien, Sammlung, Runhistorie und Profil-Export/-Import bleiben offen.

- neue Karten und Gebäude,
- Erste drei Startfestungen mit Vorteil und Nachteil umgesetzt; weitere Profile später,
- Base-Ausbau für alle Heroes umgesetzt; Festungsbauer mit günstigeren Upgrades und einer dritten Stufe,
- Meilensteine und optionale Herausforderungen,
- Sammlung, Bestiarium und Runhistorie,
- Export/Import des Profils.

### Etappe 5 – Langzeitinhalt

- Biome und höhere Schwierigkeitsstufen,
- kosmetische Ziele,
- weitere Turmrollen nur nach Balanceauswertung,
- optional saisonale oder tägliche Seeds ohne exklusive Machtbelohnungen.
- [x] Elementturm: Feuer (Fläche), Wasser (Slow), Wind (Durchschlag) als feste Spezialisierung; Nekromant mit zeitlich begrenzten Geistern aus nahen Kills.

## 12. Test- und Balanceplan

Automatische Tests:

- Profilmigration und beschädigte Saves,
- exakt fünf einzigartige Loadoutplätze,
- Baumenü zeigt nur das gespeicherte Run-Loadout,
- Freischaltung zieht Diamanten genau einmal ab,
- Game-over zahlt Diamanten genau einmal aus,
- laufender Run bleibt von späteren Loadoutänderungen unberührt,
- Boss-, Shrine- und Rewardpfade bieten keine fremden Turmtypen an,
- gleiche Seeds bleiben innerhalb eines festen Loadouts reproduzierbar.

Spieltests:

- mindestens fünf Seeds je Loadout-Archetyp bis Wave 20,
- Erfolgsquote und verlorene Base-HP je Gegnerart,
- Anteil gebauter und aufgewerteter Turmtypen,
- ungenutzte Loadoutplätze als Warnsignal für schwache oder zu teure Türme,
- Vergleich von Generalisten-, Boss-, Schwarm- und Economy-Loadouts,
- neuer Spieler erreicht ersten Unlock in der geplanten Zeit,
- kein freigeschalteter Turm erhöht die durchschnittliche Bestwave allein durch seine Existenz.

Erste Zielwerte für Balanceprüfungen:

- Jeder Startturm wird in mindestens 15 % der geeigneten Test-Runs tatsächlich gebaut.
- Kein Turm erscheint in mehr als 85 % aller erfolgreichen Loadouts ab sieben freigeschalteten Typen.
- Der sechste freigeschaltete Turm wird nicht automatisch in nahezu jedes Loadout übernommen.
- Unterschiedliche starke Loadouts liegen bei gleicher Spielstärke innerhalb von ungefähr zwei Waves durchschnittlicher Reichweite.

## 13. Bewusste Entscheidungen

- Fünf Plätze sind eine feste strategische Grenze, kein früh kaufbarer Meta-Bonus.
- Der Spieler besitzt anfangs fünf Turmtypen und startet mit einem gültigen Standard-Loadout.
- Der Minenleger ist der fünfte Startturm; der Nekromant ist eine zusätzliche Arsenal-Freischaltung.
- Meta-Fortschritt schaltet neue Möglichkeiten und die optionale vierte Turmstufe frei. Diese Stufe ist kein kostenloser globaler Bonus, sondern muss in jedem Run mit Gold gebaut werden.
- Loadout und Profil werden lokal gespeichert; der getrennte Runzustand lebt bislang nur im Arbeitsspeicher.
- Diamanten werden am Runende transparent berechnet und niemals mit Run-Gold vermischt.

## 14. Für später: gegnerbezogene Freischaltbedingungen

Vom Nutzer vorgemerkt, noch nicht umgesetzt: Bestimmte Meta-Upgrades sollen erst nach einer erforderlichen Anzahl besiegter Gegner eines bestimmten Typs oder mit bestimmten Eigenschaften verfügbar werden. Beispiel: Ein Feuer-Upgrade setzt 100 besiegte feuerresistente Monster voraus. Die Zahl 100 und das konkrete Upgrade sind Beispiele, keine festgelegten Balancewerte.

- Bedingungen als Daten je Upgrade hinterlegen (Gegnerart/Eigenschaft, benötigte Anzahl). Fortschritt über Runs hinweg im Profil speichern und beim Profil-Export/-Import mitnehmen.
- Im Arsenal transparent anzeigen, zum Beispiel „Feuerresistente Gegner: 37 / 100“, und erklären, welche Gegner zählen. Der Nutzer muss diese Information auch per Antippen erreichen können.
- Noch entscheiden: Bedingung schaltet das Upgrade unmittelbar frei oder öffnet erst den Kauf mit Diamanten. Bereits erworbene Upgrades bei Einführung nicht nachträglich entziehen.
- Gegnerkategorien anhand ihrer tatsächlichen Resistenz/Tags zählen, nicht anhand des verwendeten Turms oder nur des Biomnamens. Keine automatisch unterstellte Pflicht, resistente Gegner mit dem benachteiligten Element zu besiegen.
- Ereignisse eindeutig zählen: keine doppelten Kills durch Wiederaufnahme oder erneute Ergebnisabrechnung. Regeln für geteilte, beschworene und wiederbelebte Gegner vor Einführung festlegen, damit keine unbeabsichtigten Farm-Schleifen entstehen.
- Duo-Zurechnung ausdrücklich definieren (persönliche Kills, Teamfortschritt oder beide). Späteres Online-Profil serverseitig fortschreiben. Aktuelle Killstatistiken reichen noch nicht für eine zuverlässige rückwirkende Zuordnung nach Resistenztypen.

Diese Idee gehört zur späteren Meta-Progression; keine neuen Kaufbedingungen im aktuellen Arsenal aktiviert.

## Geplant: Achievements und Gegner-Meilensteine

Noch nicht implementiert. Erfolge sollen langfristige Ziele sichtbar machen, zum Beispiel „Besiege 1.000 Golems“, „Besiege 100 Bosse“ oder „Überstehe jede Biom-Wächterart“. Die Zahlen sind Vorschläge für späteres Balancing. Ein eigener Bereich zeigt Fortschrittsbalken, Beschreibung und erreichte Erfolge; neue Erfolge werden nach einer Belohnungswahl gemeldet, ohne diese zu verdecken.

Zuerst stabile Gegner-/Boss-IDs und profilweite Zähler einführen, dann versionierte Erfolgsdefinitionen. Nur tatsächliche Tötungen zählen, keine Vorschauen, wiederhergestellten Ereignisse oder mehrfach empfangenen Netzwerkpakete. Solo und Duo müssen klare Zurechnungsregeln erhalten (eigene Kills oder Teamerfolge ausdrücklich benennen). Export/Import und Migration alter Profile mitdenken: Vergangene Gegnerarten nicht aus einem Gesamtzähler erfinden. Belohnungen und Verknüpfungen mit Arsenal-Freischaltungen erst separat festlegen; vorhandene Freischaltungen nicht rückwirkend entziehen. Dies ergänzt die bereits geplanten gegnerabhängigen Meta-Upgrades.

## Offene Idee: Handkarten neu ziehen (Reroll)

Status: unverbindliche Ideensammlung, weder beschlossen noch umgesetzt. Handkarten könnten gegen Gold neu gezogen werden. Offen ist, ob dies nur für die Starthand oder in jeder Bauphase möglich sein soll; ebenso Umfang (ganze Hand/einzelne Karten), Preis und mögliche steigende Kosten.

Mögliche Meta-Progression: ein kostenloser Reroll pro Run oder ein kostenloser Reroll alle fünf Runden. Ebenfalls offen: Ansparen/Limit, Startzeitpunkt und genaue Freischaltkosten. Erst nach Spieltests entscheiden; Rettungsmechaniken dürfen keine kostenpflichtigen Rerolls voraussetzen. Bei einer Umsetzung Deck-/Ablageregeln, deterministischen Zufall, Speicherung und serverseitige Duo-Prüfung berücksichtigen.

## Umgesetzt: exklusive aktive Endstufen im Arsenal

Jeder Turmpfad besitzt eine eigene spezialisierte Diamanten-Endstufe; der Elementturm entsprechend drei. Jeder Pfad kostet die bisherigen Diamantenkosten des Turmtyps separat. Besitz und Aktivierung sind getrennt: beliebig viele Pfade freischalten, pro Turmtyp genau einen für den nächsten Run aktivieren. Die Auswahl wird mit dem Profil exportiert/importiert und beim Runstart fest übernommen. Ein Wechsel im Arsenal verändert keinen laufenden Run. Die täglichen Herausforderungen behalten ihre bisherigen festen Regeln ohne Meta-Endstufen.

Bestehende generische Freischaltungen (`ultimate:typ`) bleiben als Besitz aller bisherigen Pfade erhalten. Ohne ausdrückliche Auswahl ist der erste Pfad aktiv. Der Rückerstattungswert alter Käufe bleibt unverändert. Neue Käufe verwenden `ultimate:typ:pfad`; `activeUltimates` speichert die Auswahl. Run-Freischaltungen enthalten nur den aktiven Pfad. Alte interne Run-Zwischenstände bleiben kompatibel.

Spezialisierungen: Bogenschütze Fläche/Schussfolge oder Präzision/Reichweite; Katapult schwere Belagerung oder Feuerrate; Blitz zusätzliche Kettenziele oder Trefferschaden; Frost stärkere Verlangsamung oder größere Aura; Minen Explosionskraft oder Legerate; Balliste Bossschaden oder Feuerrate; Feuer große Explosionen oder schnelle Salven; Elemente Brandfläche, Wasserverlangsamung oder Winddurchschlag; Nekromant mehr Geister oder stärkere und länger bestehende Geister. Konkrete Werte stehen in `HexData.SPECIALIZATIONS` und sind erste Balancing-Werte.

Patrizierhäuser liefern jeweils 16 + 2 × (Anzahl anderer Patrizierhäuser) Gold pro Welle. Normale Häuser bis Stufe 3 zählen nicht als vollständig ausgebaut. Zwei Patrizierhäuser liefern insgesamt 36, drei insgesamt 60 Gold. Verkauf entfernt auch den Bonus bei allen verbleibenden Patrizierhäusern. Zwischenstände speichern den bereits berücksichtigten Gesamtbonus, damit Wiederherstellung ihn nicht doppelt addiert.

Vorlagen lassen sich direkt in der Durchlaufvorbereitung benennen (1–30 Zeichen, Enter oder „Name speichern“). Namen sind Nutzertext und werden nicht übersetzt. Speichern einer Turmauswahl erhält den Namen; der Spielstandexport nimmt ihn mit.
