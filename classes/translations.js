/* Display strings only: never translate IDs or persisted game data. */
globalThis.HexTranslations={de:{
Archer:'Bogenschütze',Freeze:'Frostturm',Waveplanung:'Wellenplanung',Waves:'Wellen',Wave:'Welle',Towerbau:'Turmbau',Tower:'Turm','Turret-Slots':'Turmplätze','Turret-Slot':'Turmplatz',Slots:'Bauplätze',Slot:'Bauplatz',Gebäudeslot:'Gebäudeplatz',Loadouts:'Turmauswahlen',Loadout:'Turmauswahl',Runs:'Durchläufe',Run:'Durchlauf',Runende:'Durchlaufende',Runzustand:'Durchlaufzustand',RUN:'DURCHLAUF',Base:'Basis',Map:'Karte',Maps:'Karten',Hero:'Festungsprofil',Supportturm:'Unterstützungsturm',Support:'Unterstützung',Slow:'Verlangsamung',Bosskiller:'Bossjäger','Single-Target-Schaden':'Einzelzielschaden',Killzones:'Kampfbereiche',Killzone:'Kampfbereich',Kills:'Besiegte Gegner',Kill:'besiegtem Gegner',Bossloot:'Bossbeute',Shrines:'Schreine',Shrine:'Schrein',Common:'Gewöhnlich',COMMON:'GEWÖHNLICH',Uncommon:'Ungewöhnlich',UNCOMMON:'UNGEWÖHNLICH',Rare:'Selten',RARE:'SELTEN',Epic:'Episch',EPIC:'EPISCH',Legendary:'Legendär',LEGENDARY:'LEGENDÄR',Upgrades:'Verbesserungen',Upgrade:'Verbesserung',Hotkeys:'Tastenbelegung',Presetplätze:'Vorlagenplätze',Preset:'Vorlage',Seed:'Startwert','Endless-Modus':'Endlosmodus',Checkpoint:'Zwischenstand',Reset:'Zurücksetzen','Hex-Placement':'Hex-Platzieren',Placement:'Platzieren','Hex-Grid':'Hex-Raster',Hexgrid:'Hex-Raster',Grid:'Raster',HP:'LP',MR:'Magieresistenz',Sounds:'Ton','Download / Upload':'Herunterladen / Hochladen',Download:'Herunterladen',Upload:'Hochladen','TOWER DEFENSE':'TURMVERTEIDIGUNG',Space:'Leertaste'
},en:{}};
// One source phrase and its English equivalent per line; dynamic fragments may compose.
globalThis.HexTranslations.add=function(rows){for(const line of rows.trim().split('\n')){const at=line.indexOf('|');if(at>0)this.en[line.slice(0,at)]=line.slice(at+1);}};
HexTranslations.add(`
Bist du dir sicher?|Are you sure?
Erneut antippen, um 1 Kopie zu entfernen.|Tap again to remove 1 copy.
Aktueller Turm|Current tower
Vergleich schließen|Close comparison
Ausbau wählen|Choose an upgrade
Schaden pro Treffer · aktuelle Werte|Damage per hit · current values
Überladung: für die nächste Welle vorgemerkt.|Overload: queued for the next wave.
Überladung aktiv: +50 % Angriffstempo.|Overload active: +50% attack speed.
Wächter-Bauplatz: +20 % Reichweite.|Guardian tower slot: +20% range.
Schaden pro Mine · aktuelle Werte|Damage per mine · current values
Aura · kein Schaden|Aura · no damage
Werte & Einflüsse|Stats & modifiers
Alle Werte im Vergleich|Compare all stats
Zurück zur Auswahl|Back to choices
Vergleichen|Compare
Zurzeit nicht ausbaubar|Cannot upgrade right now
Weniger Schaden je Ziel|Less damage per target
Langsamere Minenproduktion|Slower mine production
Langsamere Angriffe|Slower attacks
Kleinere Reichweite|Shorter range
Weniger Blitzziele|Fewer lightning targets
Schwächere Verlangsamung|Weaker slow
Schussabstand: kleiner ist schneller. Aktive Einflüsse sind eingerechnet.|Attack interval: lower is faster. Active modifiers are included.
Im Arsenal freischalten und für den nächsten Run aktivieren.|Unlock in the Arsenal and activate for the next run.
Standort-Rabatt|Local discount
Boss-Schadensfaktor|Boss damage multiplier
Treffer-Verlangsamung|On-hit slow
Verlangsamungsdauer|Slow duration
Schussabstand|Attack interval
Flächenradius|Area radius
Blitzziele|Lightning targets
Sprungweite|Jump range
Wirkungsradius|Effect radius
Aktuell|Current
Danach|After
Wert|Stat
fehlen|missing
Sprache|Language
Deutsch|German
Bogenschütze|Archer
Frostturm|Frost Tower
Welle|Wave
Wellen|Waves
Wellenplanung|Wave forecast
Turmauswahl|Loadout
Turmauswahlen|Loadouts
Durchlauf|Run
Durchläufe|Runs
DURCHLAUF|RUN
Basis|Base
Karte|Map
Karten|Maps
Festungsprofil|Fortress profile
Unterstützung|Support
Bossjäger|Boss killer
Verlangsamung|Slow
Schrein|Shrine
Schreine|Shrines
Gewöhnlich|Common
Ungewöhnlich|Uncommon
Selten|Rare
Episch|Epic
Legendär|Legendary
GEWÖHNLICH|COMMON
UNGEWÖHNLICH|UNCOMMON
SELTEN|RARE
EPISCH|EPIC
LEGENDÄR|LEGENDARY
Verbesserungen|Upgrades
Verbesserung|Upgrade
Tastenbelegung|Hotkeys
Vorlage|Preset
Startwert|Seed
Endlosmodus|Endless mode
Zwischenstand|Checkpoint
Zurücksetzen|Reset
Hex-Raster|Hex grid
LP|HP
TURMVERTEIDIGUNG|TOWER DEFENSE
Herunterladen / Hochladen|Download / Upload
Herunterladen|Download
Hochladen|Upload
Spielstand|Save file
Einstellungen|Settings
Hauptmenü|Main menu
Spielen|Play
Weiterspielen|Continue
Neuer Run|New run
Spielregeln|How to play
Regeln|Rules
Zurück|Back
Abbrechen|Cancel
Ausbauen|Upgrade
Bauen|Build
Verkaufen|Sell
Laden|Load
Ausgang|Exit
Eingang|Entrance
Ansicht|View
Automatisch|Automatic
Übersicht|Overview
Überspringen|Skip
Lautstärke|Volume
Sounds aktiv|Sound enabled
Musik aktiv|Music enabled
Musiklautstärke|Music volume
Turm|Tower
Türme|Towers
Turmplatz|Tower slot
Turmplätze|Tower slots
Gebäude|Building
Gebäudeplatz|Building slot
Gebäudeplätze|Building slots
Bauplatz|Build slot
Bauplätze|Build slots
Schaden|Damage
Reichweite|Range
Leben|Health
Rüstung|Armor
Magieresistenz|Magic resistance
Tempo|Speed
Mauern|Walls
Waffe|Weapon
Angriffsfokus|Targeting priorities
Angriffsfokus Priorität|Target priority
Beschwörung|Summoning
Bosse|Bosses
Wächter|Guardian
Gegner|Enemies
Diamanten|Diamonds
Stufe|Level
Pause|Pause
Weiter|Resume
Waveplanung öffnen|Open wave forecast
Deck anschauen|View deck
Map anschauen|View map
Deck erweitern|Expand deck
Deck ausdünnen|Thin deck
Dein Deck|Your deck
Gesamtes Deck|Entire deck
Ablagestapel|Discard pile
Nachziehstapel|Draw pile
Hex platzieren|Place hex
Hex legen|Place hex
Hex drehen|Rotate hex
Karte wählen|Choose card
Karte entfernen|Remove card
Kartenbelohnung|Card reward
Keine Karte entfernen|Skip card removal
Zurück zur Auswahl|Back to selection
Zurück zum Run|Back to run
Zurück zum Ergebnis|Back to results
Zum Hauptmenü|Main menu
Zum Hauptspiel|Main game
Zurück zum Hauptmenü|Back to main menu
Zur Base|Center on base
Türme bauen|Build towers
Turm verkaufen|Sell tower
Gebäude verkaufen|Sell building
Gebäude ausbauen|Upgrade building
Turmstatistik|Tower statistics
Mehrfachauswahl (Strg + Klick)|Multiple selection (Ctrl + click)
Turm ausbaubar|Tower can be upgraded
Turm gesperrt|Tower locked
Turm zurückgegeben: +|Tower refunded: +
Ja, verkaufen|Yes, sell
Möchtest du wirklich verkaufen?|Are you sure you want to sell?
Die Erstattung hat sich geändert:|The refund has changed:
Gold. Wirklich verkaufen?|Gold. Sell anyway?
wirklich verkaufen? Du erhältst|really sell? You receive
Zum Verkaufen einen einzelnen Turm wählen|Select a single tower to sell
Schaden gegen:|Damage against:
Schaden gegen Leben|Damage against health
Schaden gegen Rüstung|Damage against armor
Schaden gegen Magieresistenz|Damage against magic resistance
Schaden gegen alle Schutzarten|Damage against all defenses
Zeit zwischen Angriffen (kleiner ist schneller)|Time between attacks (lower is faster)
Zeit zwischen Minen|Time between mines
Explosionsradius|Blast radius
Blitzziele / Sprungweite|Lightning targets / jump range
Durchschlagziele|Piercing targets
Maximale Geister|Maximum spirits
Geisterschaden|Spirit damage
Geisterlebensdauer|Spirit lifetime
Verlangsamung / Dauer|Slow / duration
Bauphase|Build phase
Kampf|Combat
Laufende Wave|Current wave
Wave läuft|Wave in progress
Wave starten (Leertaste)|Start wave (Space)
Wave starten|Start wave
↻ Drehen|↻ Rotate
Karte wählen · Knopf zum Drehen · Hex antippen|Choose a card · Use the rotate button · Tap a hex
Vorschau antippen: setzen · Knopf zum Drehen|Tap preview to place · Use the rotate button
starten (Leertaste)|start (Space)
Leertaste|Space
R dreht|R rotates
F: nächstes Tempo|F: next speed
F: Tempo erhöhen, nach 8× zurück auf 1×|F: increase speed, cycle from 8× to 1×
G: Hexgrid ein/aus|G: toggle hex grid
Q/E: Kamera drehen (halten)|Q/E: rotate camera (hold)
W/A/S/D: Kamera vorwärts/links/rückwärts/rechts|W/A/S/D: move camera forward/left/back/right
R oder Mausrad-Klick: Hex drehen|R or middle-click: rotate hex
R / Mausrad-Klick · Drehen|R / middle-click · Rotate
Leertaste: Wave starten|Space: start wave
Escape: Fenster schließen|Escape: close windows
Escape schließt offene Menüs und Infofenster.|Escape closes open menus and information panels.
Strg + Klick: mehrere Bauplätze oder Türme auswählen|Ctrl + click: select multiple build slots or towers
1–3: Handkarte auswählen (bei zwei Fronten am Anfang 1–5)|1–3: select hand card (1–5 at the start of Two Fronts)
1–9: Turm im geöffneten Baumenü auswählen|1–9: choose tower in the open build menu
U: Upgrade-Status ein/aus|U: toggle upgrade indicators
Upgrade-Status (U): ↑ im Run ausbaubar (unabhängig vom Gold)|Upgrade indicators (U): ↑ can be upgraded this run (regardless of gold)
Freie Bauplätze: Weiß = Turm, Türkis = Gebäude|Empty build slots: white = tower, turquoise = building
Hex-Grid anzeigen (G)|Show hex grid (G)
Wave nach Platzierung automatisch starten|Automatically start wave after placement
Sound-Lautstärke|Sound volume
Mini-Tutorial starten|Start tutorial
Tutorial überspringen|Skip tutorial
Mini-Tutorial|Tutorial
Erste Schritte|Getting started
Wähle unten eine Hexkarte. Drehe sie mit R oder Mausrad-Klick, bis die Straße passt.|Choose a hex card below. Rotate it with R or middle-click until the road fits.
Klicke auf ein freies Nachbarfeld mit grüner Vorschau, um dein Hex anzulegen.|Click an empty adjacent tile with a green preview to place your hex.
Klicke auf einen leuchtenden freien Turmplatz auf deinem gelegten Hex.|Click a glowing empty tower slot on your placed hex.
Wähle im Turmmenü einen bezahlbaren Turm. Für den Einstieg eignet sich der Archer.|Choose an affordable tower in the build menu. The Archer is a good first choice.
Dein Turm ist bereit! Starte die Wave mit dem Button oder der Leertaste.|Your tower is ready! Start the wave with the button or Space.
Erweitere beide Base-Ausgänge: Wähle eine Handkarte, drehe sie mit R oder Mausrad-Klick und lege sie direkt an einen noch freien Ausgang.|Extend both base exits: choose a hand card, rotate with R or middle-click and place it next to an unused exit.
Wähle eine Hexkarte und lege sie an die offene Straße der Base.|Choose a hex card and connect it to the base's open road.
Karte wählen (1–3) · R dreht · Hex anklicken|Choose card (1–3) · R rotates · Click hex
R dreht die Karte, dann Feld anklicken.|R rotates the card, then click a tile.
Map bauen → Türme setzen → Wave überleben → Deck erweitern|Build map → Place towers → Survive wave → Expand deck
Mausrad: Zoom · links ziehen: verschieben · rechts ziehen: drehen und kippen|Mouse wheel: zoom · Left-drag: pan · Right-drag: rotate and tilt
Mausrad: Zoom · rechte Maustaste ziehen: verschieben|Mouse wheel: zoom · Right-drag: pan
Mausrad: Zoom · Ziehen: Kamera bewegen/drehen|Mouse wheel: zoom · Drag: move/rotate camera
Ziehen: verschieben. Mausrad / Zwei-Finger-Geste: zoomen.|Drag to pan. Mouse wheel / two-finger gesture to zoom.
Map vergrößern|Zoom in
Map verkleinern|Zoom out
Lade 3D-Modelle …|Loading 3D models …
Spielstand mitnehmen|Transfer save
Spielstand herunterladen|Download save
Spielstand hochladen|Upload save
Spielstand hochladen (JSON, maximal 2 MB)|Upload save (JSON, maximum 2 MB)
Vorhandenes Profil ersetzen|Replace existing profile
Diamanten, Freischaltungen, Loadouts und Profilstatistiken als Datei sichern. Laufende Runs und Geräteeinstellungen sind nicht enthalten.|Export diamonds, unlocks, loadouts and profile statistics. Active runs and device settings are not included.
Ein Import ersetzt dein Profil. Lade zur Sicherheit zuerst eine Kopie herunter.|Importing replaces your profile. Download a backup first.
Spielstand importiert. Dein Profil ist für den nächsten Run bereit.|Save imported. Your profile is ready for the next run.
Spielstanddatei zum Download bereitgestellt.|Save file ready to download.
Download fehlgeschlagen. Bitte erneut versuchen.|Download failed. Please try again.
Import fehlgeschlagen:|Import failed:
Keine gültige Spielstanddatei.|Invalid save file.
Datei zu groß (maximal 2 MB).|File too large (maximum 2 MB).
Der Spielstand ist unvollständig oder beschädigt.|The save file is incomplete or corrupted.
Spielstand zu stark verschachtelt.|Save file is nested too deeply.
Unbekanntes oder neueres Spielstandformat.|Unknown or newer save format.
Ungültige Profildaten.|Invalid profile data.
Ungültiger Zahlenwert im Spielstand.|Invalid number in save file.
Bitte zuerst den laufenden Run beenden. Ein Profilwechsel während eines Durchlaufs ist nicht möglich.|Finish the current run first. Profiles cannot be changed during a run.
Diamanten wird ersetzt. Eine lokale Sicherung wird angelegt.|diamonds will be replaced. A local backup will be created.
Wie möchtest du spielen?|How would you like to play?
Standardspiel|Standard game
Schwierigkeit wählen|Choose difficulty
Eigene Festung und eigene Turmauswahl · regionale Biome|Your fortress and loadout · regional biomes
Tägliche Herausforderung|Daily challenge
Die letzte Karawane|The Last Caravan
Feste Startbedingungen · neuer Tages-Seed · Ziel: Wave 20|Fixed starting conditions · new daily seed · Goal: wave 20
Heutige Karawane starten|Start today's caravan
Heute geschafft · Belohnung erhalten|Completed today · Reward claimed
Tagesbestmarke:|Today's best:
Tagesbelohnung bereits erhalten.|Daily reward already claimed.
Tagessieg: +10 Diamanten|Daily victory: +10 diamonds
Keine Tagesbelohnung – versuche es erneut!|No daily reward – try again!
Die Karawane ist gefallen|The caravan has fallen
DIE KARAWANE IST GERETTET!|THE CARAVAN IS SAVED!
Die Bastion ist gefallen|The bastion has fallen
FESTUNG VERTEIDIGT|FORTRESS DEFENDED
DIE WÄCHTER SIND GEFALLEN!|THE GUARDIANS HAVE FALLEN!
DU WÄCHST ÜBER DICH HINAUS!|YOU'VE OUTDONE YOURSELF!
RUN BEENDET|RUN ENDED
ÜBERLEBT|SURVIVED
überlebt!|survived!
Wave 35 geschafft!|Wave 35 cleared!
Wave 20 überlebt!|Wave 20 survived!
Wave 35 ist überstanden! Stufe 2 · Zwei Fronten ist jetzt freigeschaltet.|Wave 35 cleared! Difficulty 2 · Two Fronts is now unlocked.
Zwei Fronten gemeistert! Deine Festung hat alle drei Bosswellen überstanden.|Two Fronts conquered! Your fortress survived all three boss waves.
Deine Map und Türme bleiben im Endless-Modus erhalten. Diamanten werden beim Beenden des Durchlaufs abgerechnet.|Your map and towers carry over into endless mode. Diamonds are awarded when the run ends.
Im Endless-Modus weiterspielen|Continue in endless mode
Run abschließen · Hauptmenü|Finish run · Main menu
Run beendet|Run ended
Run beendet. Du hast Wave|Run ended. You reached wave
Noch einmal mit dieser Turmauswahl|Try again with this loadout
Run mit dieser Turmauswahl starten|Start run with this loadout
Neue Bestmarken|New records
Neuer persönlicher Rekord – Wave|New personal best – Wave
Weiter geht’s!|Let's keep going!
Bosse besiegt|Bosses defeated
Wächter besiegt!|Guardian defeated!
Wächter besiegt|Guardian defeated
Wächterbeute|Guardian loot
Wächter gestartet.|Guardian spawned.
Wächter · inaktiv|Guardian · inactive
Wächter: je|Guardians: each
Wähle 1 von 3 Hexkarten. Common ist häufiger als Uncommon und Rare.|Choose 1 of 3 hex cards. Common cards appear more often than Uncommon and Rare cards.
Wähle 1 von 3 Hexkarten.|Choose 1 of 3 hex cards.
× bereits im Deck|× already in deck
× im Deck|× in deck
im Deck · 1 Kopie entfernen|in deck · Remove 1 copy
wurde deinem Deck hinzugefügt.|was added to your deck.
durch den Shrine zum Deck hinzugefügt.|added to your deck by the shrine.
Eine Kopie aus dem Deck entfernt.|One copy removed from the deck.
Zusätzliche Karte wählen|Choose an extra card
Epic-Karte erhalten|Receive an Epic card
Legendary-Karte erhalten|Receive a Legendary card
Bastionssegen|Bastion blessing
Handelspakt|Trade pact
Bis zu +5 HP|Up to +5 HP
Vorräte|Supplies
Einmaliger Shrine-Segen.|One-time shrine blessing.
Shrine erschlossen · Effekt:|Shrine discovered · Effect:
Shrine erschlossen · Heilquelle|Shrine discovered · Healing spring
Shrine erschlossen · Werksegen|Shrine discovered · Workshop blessing
Shrine erschlossen · Effekt: Karte entfernen|Shrine discovered · Effect: remove card
Shrine · Bonus unbekannt|Shrine · Unknown blessing
Heile bis zu 5 HP. Bei voller Gesundheit erhältst du stattdessen 30 Gold.|Restore up to 5 HP. At full health, receive 30 gold instead.
Wähle ein kostenloses Upgrade für einen bereits gebauten Loadout-Turm. Ist keines möglich, erhältst du 30 Gold.|Choose a free upgrade for a tower you have built. If none is available, receive 30 gold.
Optional: Entferne eine Kartenkopie aus deinem Deck. Mindestens 5 Karten bleiben erhalten. Bereits gelegte Hexe bleiben bestehen.|Optional: remove one card copy from your deck. At least 5 cards must remain. Placed hexes are unaffected.
Zusätzlich zu den 50 Gold: Wähle genau eine Karte oder einen Run-Segen. Normale Wave-Belohnungen folgen danach.|In addition to 50 gold, choose one card or a run blessing. Normal wave rewards follow afterwards.
+5 maximale und aktuelle Base-HP für diesen Run.|+5 maximum and current base HP for this run.
+2 Gold nach jeder künftig überlebten Wave in diesem Run.|+2 gold after each future wave survived this run.
Schließe zuerst die offene Belohnung oder Auswahl ab.|Finish the current reward or selection first.
Schatz +20 Gold · ungesammelt|Treasure +20 gold · uncollected
Schatz erschlossen: +|Treasure discovered: +
Kein freier Turmplatz|No empty tower slot
Nicht genug Gold · mindestens|Not enough gold · at least
Nicht genug Gold.|Not enough gold.
Nicht genug Gold:|Not enough gold:
Gold nötig|gold required
Gold für diesen Platz.|gold for this slot.
Ziehen oder anklicken, dann Bauplatz wählen · Preis je nach Marktrabatt|Drag or click, then choose a slot · Price depends on market discount
Ziehen oder anklicken, dann Bauplatz wählen|Drag or click, then choose a slot
auf einen freien Turmplatz ziehen oder tippen · Escape: abbrechen|drag onto an empty tower slot or tap · Escape: cancel
Bauplätze gewählt · Strg + Klick: weitere Plätze markieren oder abwählen.|build slots selected · Ctrl + click: select or deselect more slots.
Türme ausgewählt|towers selected
Angriffsfokus gemeinsam einstellen · Strg + Klick: Auswahl ändern|Set shared targeting priorities · Ctrl + click: change selection
Türme mit Angriffsfokus. Unterschiedliche bisherige Einstellungen werden durch die Auswahl je Zeile angepasst. Support und Minenleger bleiben unverändert. Upgrades und Verkauf: einzelnen Turm auswählen.|towers with targeting priorities. Each row replaces that priority for all selected towers. Support and mine layers are unaffected. Select a single tower to upgrade or sell.
Priorität 1 wird zuerst geprüft. Gibt es dafür kein gültiges Ziel, folgt die nächste Zeile.|Priority 1 is checked first. If no valid target exists, the next row is checked.
Unterschiedliche Einstellungen|Mixed settings
Nächste an der Base|Closest to base
Nächste am Turm|Closest to tower
Weiteste von der Base|Farthest from base
Weiteste vom Turm|Farthest from tower
Meistes Leben|Most health
Wenigstes Leben|Least health
Meiste Rüstung|Most armor
Meiste Magieresistenz|Most magic resistance
Maximalstufe erreicht.|Maximum level reached.
Meta-Stufe 4 erreicht.|Meta level 4 reached.
vollständig ausgebaut|fully upgraded
im Arsenal mit Diamanten freischalten.|unlock with diamonds in the Arsenal.
Spezialausbau im Arsenal für 40 Diamanten freischalten. Ab dem nächsten Run verfügbar.|Unlock the special upgrade in the Arsenal for 40 diamonds. Available from your next run.
Zusatz-Hex auf der Map auswählen|Choose an additional hex on the map
Zusatz-Hex ändern|Change additional hex
Hex auf der Map anklicken · Abbrechen|Click a hex on the map · Cancel
Zusatzwirkung: ein erkundetes Hex anklicken · Escape: abbrechen|Extra effect: click an explored hex · Escape: cancel
Zusätzliches Hex versorgt.|Additional hex supplied.
Hex-Auswahl abgebrochen.|Hex selection cancelled.
Keine Türme gebaut.|No towers built.
Einzelne Türme|Individual towers
Bau 🪙|Build 🪙
Gesamt 🪙|Total 🪙
Erstattet 🪙|Refunded 🪙
Schaden/🪙|Damage/🪙
verkauft|sold
Goldplanung|Gold forecast
Diamanten gesamt|Total diamonds
Diamanten werden am Runende ausgezahlt. Freischaltungen findest du im Arsenal im Hauptmenü.|Diamonds are awarded when the run ends. Find unlocks in the main menu Arsenal.
Startpreis|Starting price
Preise am ausgewählten Hex:|Prices at the selected hex:
Änderungen gelten für|Changes apply to
für alle drei Elemente|for all three elements
Freigeschaltet. Ab dem nächsten Run verfügbar.|Unlocked. Available from your next run.
Dauerhaft freigeschaltet|Permanently unlocked
Turm verfügbar|Tower available
Benötigt Turmfreischaltung|Requires tower unlock
Freischaltungen bezahlbar|affordable unlocks
Upgrade verfügbar|Upgrade available
Bestätigen: alle Freischaltungen zurücksetzen · +|Confirm: reset all unlocks · +
Diamanten erstattet. Du kannst dich neu entscheiden.|diamonds refunded. Choose a new path.
Forschungsbaum|Research tree
Endloses Arsenal|Endless Arsenal
Im Run:|During run:
Gold nach Stufe 3.|gold after level 3.
Gold nach|gold after
Bau rückgängig|Undo build
Startgold|Starting gold
Wähle deine Festung und fünf Türme|Choose your fortress and five towers
Wähle genau fünf unterschiedliche Türme.|Choose exactly five different towers.
5/5 gewählt|5/5 selected
Alle fünf Plätze sind belegt. Wähle zuerst einen markierten Turm ab, um diesen Turm mitzunehmen.|All five slots are filled. Deselect a highlighted tower first to include this one.
Nur diese fünf Turmtypen stehen im nächsten Run zur Verfügung. Sie werden weiterhin mit Gold gebaut.|Only these five tower types will be available next run. Building them still costs gold.
Loadout speichern|Save loadout
Loadout ändern|Change loadout
Aktuell speichern|Save current
Drei Presetplätze werden mit dem ersten zusätzlichen Turm freigeschaltet.|Three preset slots unlock with your first additional tower.
Ausgewogene Turmauswahl: Leben, Rüstung, Magieresistenz, Support und Gruppen sind abgedeckt.|Balanced loadout: health, armor, magic resistance, support and groups are covered.
Kein Supportturm zur Wegkontrolle.|No support tower for path control.
Kein Turm für Gruppen oder Linien.|No tower for groups or lines.
Kein klarer Spezialist gegen Magieresistenz.|No clear specialist against magic resistance.
Kein klarer Spezialist gegen Rüstung.|No clear specialist against armor.
Standardfestung|Standard Fortress
Festungsbauer|Fortress Builder
Händlerstadt|Merchant City
15 HP · 90 Gold · +2 Gold je überlebter Wave. Base-Waffe verursacht 25 % weniger Schaden.|15 HP · 90 gold · +2 gold per wave survived. Base weapon deals 25% less damage.
20 HP · 55 Gold. Base-Upgrades 25 % günstiger; Waffenstufen mit 2/3/4 Turmplätzen.|20 HP · 55 gold. Base upgrades cost 25% less; weapon levels unlock 2/3/4 tower slots.
Stufe 1 · Standard|Difficulty 1 · Standard
Stufe 2 · Zwei Fronten|Difficulty 2 · Two Fronts
Schließe Wave 35 in Stufe 1 ab.|Clear wave 35 on difficulty 1.
Ein Base-Ausgang. Lege eine von drei Handkarten.|One base exit. Place one of three hand cards.
Zwei zufällige Base-Ausgänge. Starte mit fünf Handkarten und erweitere beide Ausgänge vor Wave 1.|Two random base exits. Start with five hand cards and extend both exits before wave 1.
Mit Run-Gold ausbauen. Käufe sind beim Hex-Platzieren, in der Bauphase und während einer Wave möglich. Ausbau gilt nur für diesen Run.|Upgrade with run gold during placement, building or combat. Upgrades last for this run only.
Noch keine Base-Waffe. Errichte die erste Stufe für automatische Verteidigung.|No base weapon yet. Build the first level for automatic defense.
Automatische Verteidigung:|Automatic defense:
Startwert für den nächsten Run (Seed)|Seed for next run
Leer = zufälliger Run|Empty = random run
Derselbe Startwert wiederholt bei gleichen Entscheidungen die Karten und Belohnungen.|The same seed reproduces cards and rewards when you make the same choices.
Aktueller Seed:|Current seed:
Grasland|Grassland
Dünenmeer|Dune Sea
Aschelande|Ashlands
Sturmhochland|Storm Highlands
Biom|Biome
Biom-Effekte|Biome effects
Biome und ihre Effekte|Biomes and their effects
Biom-Info schließen|Close biome information
Keine Biommodifikatoren.|No biome modifiers.
Gegner hier 15 % langsamer; Türme hier −15 % Reichweite. Wächter aus diesem Biom: Verlangsamungen wirken nur halb so stark.|Enemies move 15% slower here; towers have 15% less range. Guardians from this biome halve the effects of slows.
Kettenblitz +25 % Sprungweite; Wind +1 Durchschlagziel; Archer/Balliste −15 % Angriffsrate. Wächter: 50 % weniger Blitz- und Windschaden.|Chain Lightning: +25% jump range; wind: +1 piercing target; Archer/Ballista: −15% attack rate. Guardians take 50% less lightning and wind damage.
Feuer +20 % Schaden; Freeze −15 % Reichweite; Verlangsamung durch Wasser wirkt 25 % kürzer. Wächter: 50 % weniger Feuerschaden.|Fire: +20% damage; Frost Tower: −15% range; water slows last 25% less. Guardians take 50% less fire damage.
Effekte gelten lokal. Turmwerte enthalten die Boni und Nachteile bereits.|Effects apply locally. Tower stats already include bonuses and penalties.
`);
HexTranslations.add(`
Katapult|Catapult
Kettenblitz|Chain Lightning
Minenleger|Mine Layer
Balliste|Ballista
Flammenturm|Flame Tower
Elementturm|Element Tower
Nekromantenturm|Necromancer Tower
Einzelziel|Single target
Gruppenschaden|Group damage
Wegkontrolle|Path control
Linienkontrolle|Line control
Flächenkontrolle|Area control
Elementwahl|Element selection
Schneller Single-Target-Schaden.|Fast single-target damage.
Stein durchschlägt bis zu 3 Gegner in einer Linie.|A stone pierces up to 3 enemies in a line.
Bis zu 3 Ziele mit maximal 75 Einheiten Abstand je Sprung.|Up to 3 targets, maximum 75 distance per jump.
Aura: halbiert das Tempo aller Gegner in Reichweite.|Aura: halves the speed of all enemies in range.
Legt dauerhaft stapelbare Sprengminen auf Straßen.|Places persistent, stackable explosive mines on roads.
Extrem weitreichender Einzelschuss gegen Eliten und Bosse.|Very long-range single shots against elites and bosses.
Kurze Reichweite, aber dauerhafter Schaden gegen dichte Gruppen.|Short range, sustained damage against tightly packed groups.
Arkaner Angriff. Spezialisierung wählen: Feuer (Fläche), Wasser (Slow) oder Wind (Durchschlag).|Arcane attack. Choose a specialization: fire (area), water (slow) or wind (piercing).
Tote Gegner in Reichweite werden zu bis zu 3 Geistern: 6 s Lebensdauer, ein Angriff pro Sekunde. Jeder Tod liefert nur eine Seele.|Enemies dying in range become up to 3 spirits: 6 s lifetime, one attack per second. Each death provides only one soul.
Feuerkern|Fire Core
Wasserkern|Water Core
Windkern|Wind Core
Vulkanherz|Volcanic Heart
Gezeitenherz|Tidal Heart
Orkanherz|Hurricane Heart
Ozeanherz|Ocean Heart
Phönixkern|Phoenix Core
Himmelssturm|Sky Storm
Arkankern|Arcane Core
Urkraft|Primal Power
Seelendiener|Soul Servant
Seelenhüter|Soul Keeper
Seelenchor|Soul Choir
Geisterlegion|Spirit Legion
Seelenkrone|Soul Crown
Lichfürst|Lich Lord
Scharfschütze|Sharpshooter
Salven|Volley
Adlerauge|Eagle Eye
Pfeilregen|Arrow Rain
Großmeister|Grandmaster
Belagerung|Siege
Steinhagel|Stone Hail
Festungsbrecher|Fortress Breaker
Steinsturm|Stone Storm
Titanenwerk|Titan Engine
Donnerschlag|Thunderstrike
Sturmnetz|Storm Net
Gewitter|Thunderstorm
Überladung|Overcharge
Frostfeld|Frost Field
Eisstarre|Ice Lock
Permafrost|Permafrost
Tiefenfrost|Deep Frost
Minenfeld|Minefield
Sprengmeister|Demolition Expert
Erdbrecher|Earthbreaker
Minenteppich|Mine Carpet
Harpunenbolzen|Harpoon Bolt
Repetierwerk|Repeater
Drachentöter|Dragon Slayer
Bolzensturm|Bolt Storm
Feuersturm|Firestorm
Lauffeuer|Wildfire
Inferno|Inferno
Sonnenfeuer|Solar Fire
Weltenbrand|Worldfire
Feuer trifft Gruppen im Umkreis von 48.|Fire hits groups within a radius of 48.
Treffer verlangsamen 2 Sekunden lang um 35 %. Die stärkste Verlangsamung zählt; Bossresistenzen bleiben wirksam.|Hits slow by 35% for 2 seconds. Only the strongest slow applies; boss resistance still applies.
Wind durchschlägt bis zu 3 Gegner auf einer Linie.|Wind pierces up to 3 enemies in a line.
Stärkeres Feuer mit größerer Fläche.|Stronger fire with a larger area.
Halbiert das Tempo getroffener Gegner für 3 Sekunden.|Halves the speed of hit enemies for 3 seconds.
Durchschlägt bis zu 5 Gegner mit großer Reichweite.|Pierces up to 5 enemies at long range.
Bis zu 5 Geister gleichzeitig.|Up to 5 spirits at once.
Stärkere Geister bleiben 9 Sekunden.|Stronger spirits last 9 seconds.
Bis zu 8 Geister mit verstärkten Angriffen.|Up to 8 spirits with stronger attacks.
Mächtige Geister bleiben 12 Sekunden.|Powerful spirits last 12 seconds.
Mehr Einzelzielschaden und Reichweite.|More single-target damage and range.
Treffer schädigen Gegner im Umkreis von 55.|Hits damage enemies within a radius of 55.
Finale Einzelziel-Spezialisierung.|Final single-target specialization.
Größere und schnellere Flächentreffer.|Larger and faster area hits.
Schwere Steine mit mehr Schaden und Reichweite.|Heavy stones with more damage and range.
Schnelle, durchschlagende Steine für gerade Straßenabschnitte.|Fast piercing stones for straight combat zones.
Finale schwere Belagerungssteine.|Final heavy siege stones.
Finale schnelle Steinsalven.|Final rapid stone volleys.
Starke Blitze für robuste Ziele.|Strong lightning against tough targets.
Bis zu fünf Ziele und weitere Sprünge.|Up to five targets and longer jumps.
Zwei starke Treffer für robuste Gegner.|Two powerful hits against tough enemies.
Großes Blitznetz für dichte Gruppen.|Large lightning network for tightly packed groups.
45 % Slow mit großem Wirkungsbereich.|45% slow over a large area.
65 % Slow in kleinerem Radius.|65% slow in a smaller radius.
50 % Slow auf großem Gebiet.|50% slow over a large area.
75 % Verlangsamung im Kampfbereich.|75% slow in the combat zone.
Legt schnell viele kleinere Minen gegen Gruppen.|Quickly lays many smaller mines against groups.
Langsam gelegte schwere Minen für robuste Gegner.|Slowly lays heavy mines against tough enemies.
Finales dichtes Minenfeld für dauerhaften Flächenschaden.|Final dense minefield for sustained area damage.
Finale Großmine mit gewaltigem Explosionsradius.|Final large mine with a huge blast radius.
Massiver Treffer für Bosse und gepanzerte Ziele.|Massive hit against bosses and armored targets.
Schnellere Bolzen für verlässlichen Einzelzielschaden.|Faster bolts for reliable single-target damage.
Finaler Fernschuss mit extremem Einzelschaden.|Final long-range shot with extreme single-target damage.
Finales Repetierwerk mit hoher Feuerrate.|Final repeater with a high rate of fire.
Größere, schwerere Feuerstöße für dichte Gruppen.|Larger, heavier bursts of fire against dense groups.
Sehr schnelle Flammenstöße halten Schwärme unter Druck.|Rapid bursts of flame keep swarms under pressure.
Finaler großer Feuerbereich mit hohem Schaden.|Final large fire area with high damage.
Finales Flammenmeer mit kurzer Reichweite und extremer Angriffsdichte.|Final sea of flames with short range and an extreme rate of fire.
Vollendete Bogentechnik: mehr Schaden und Reichweite für beide Spezialisierungen.|Perfected archery: more damage and range for both specializations.
Verstärkt jede Katapult-Spezialisierung mit schwereren Geschossen.|Enhances each catapult specialization with heavier projectiles.
Zusätzliche Blitzenergie, zwei weitere Ziele und größere Sprungweite.|Extra lightning energy, two additional targets and longer jump range.
Vergrößert die Aura und verstärkt ihre Verlangsamung.|Expands the aura and strengthens its slow.
Legt schneller und verstärkt jede Mine samt Explosionsradius.|Lays mines faster, increasing their power and blast radius.
Maximale Durchschlagskraft mit zusätzlichem Bossschaden.|Maximum piercing power with extra boss damage.
Verstärkt Schaden und Fläche beider Flammenspezialisierungen.|Increases damage and area for both flame specializations.
Verstärkt das gewählte Element: +30 % Schaden und +10 % Reichweite.|Enhances the chosen element: +30% damage and +10% range.
Verstärkt Turm und Geister um 30 % Schaden.|Increases tower and spirit damage by 30%.
Haus|House
Schmiede|Forge
Markt|Market
+16 Gold je Welle, dazu +2 je weiterem Patrizierhaus, maximal +4 Zusatzgold pro Haus.|+16 gold per wave, plus +2 per other Patrician House, up to +4 extra gold per house.
Zusätzlich ein frei wählbares gelegtes Hex mit +40 % Schaden versorgen.|Also supply one placed hex of your choice with +40% damage.
Zusätzlich ein frei wählbares gelegtes Hex mit 35 % Rabatt versorgen.|Also supply one placed hex of your choice with a 35% discount.
Bereits gewährte Rabatte werden vom Verkaufserlös abgezogen.|Discounts already granted are deducted from the sale refund.
Patrizierhaus|Patrician House
Fernschmiede|Remote Forge
Handelsnetz|Trade Network
+3 Gold nach jeder überlebten Wave, zusätzlich zum automatischen Hex-Einkommen.|+3 gold after each survived wave, in addition to automatic hex income.
+20 % Tower-Schaden auf diesem Hex und direkt benachbarten Hexen. Nicht stapelbar.|+20% tower damage on this and adjacent hexes. Does not stack.
15 % Rabatt auf Towerbau und Upgrades auf diesem Hex und direkt benachbarten Hexen. Nicht stapelbar, keine Gebäuderabatte.|15% discount on towers and upgrades on this and adjacent hexes. Does not stack or affect buildings.
+16 Gold je Wave statt +8.|+16 gold per wave instead of +8.
Zusätzlich ein frei wählbares gelegtes Hex mit +30 % Schaden versorgen.|Also supply one placed hex of your choice with +30% damage.
Zusätzlich ein frei wählbares gelegtes Hex mit 25 % Rabatt versorgen.|Also supply one placed hex of your choice with a 25% discount.
% Turmschaden auf diesem Hex und seinen Nachbarhexen. Nicht stapelbar.|% tower damage on this and adjacent hexes. Does not stack.
% Rabatt auf Turmbau und Upgrades auf diesem Hex und seinen Nachbarhexen. Nicht stapelbar.|% discount on towers and upgrades on this and adjacent hexes. Does not stack.
Optional einen Gebäudetyp bauen. Haus: zusätzliches Einkommen, Schmiede: Tower-Schaden, Markt: Tower-Rabatte. Ein Gebäude pro Slot.|Optionally build a building. House: extra income, Forge: tower damage, Market: tower discounts. One building per slot.
Gerade|Straight
Kleine Kurve|Small Bend
Große Kurve|Wide Bend
Y-Kreuzung|Y Junction
T-Kreuzung|T Junction
Spiegelabzweig|Mirrored Junction
SpiegelAbzweig|Mirrored Junction
Fächerkreuzung|Fan Junction
Seitenkreuzung|Side Junction
Sechserkreuzung|Six-Way Junction
Kreuzung|Crossroads
Dorfstraße|Village Road
Weites Land|Open Land
Lange Straße|Long Road
Höhenkreuzung|Highland Junction
Waldkurve|Forest Bend
Handelsstraße|Trade Road
Bastionskreuzung|Bastion Junction
Kampfstraße|Battle Road
Wachtkurve|Watchtower Bend
Königsstraße|King's Road
Kriegskreuzung|War Crossroads
Bastionssackgasse|Bastion Dead End
Rettungshex|Rescue Hex
Rettungstunnel|Rescue Tunnel
Baubezirk|Building District
Bauviertel|Building Quarter
Baugrund|Building Plot
Belagerungsgerade|Siege Straight
Blitzgabel|Lightning Fork
Frostbogen|Frost Bend
Minenstraße|Mine Road
Schützenlinie|Marksman's Road
Glutknick|Ember Bend
Elementkreuzung|Element Junction
Seelenabzweig|Soul Junction
Späherbogen|Scout Bend
Signalkreuzung|Signal Junction
Veteranengabel|Veteran Fork
Goldroute|Gold Route
Versorgungsweg|Supply Road
Winterfeld|Winter Field
Drachenbogen|Dragon Bend
Kronenkreuzung|Crown Junction
Königsbogen|Royal Bend
Zuverlässiger Weg.|Reliable road.
Enge 60°-Kurve.|Tight 60° bend.
Weite Kurve, gut für Reichweite.|Wide bend, good for range.
Drei gleichmäßig verteilte Straßenarme.|Three evenly spaced road branches.
Durchgehende Links-rechts-Straße mit Abzweig.|Through road with a side branch.
Straßenöffnungen in alle sechs Richtungen.|Road openings in all six directions.
Flexibel und gefährlich.|Flexible and dangerous.
+2 Gold nach jeder Wave.|+2 gold after each wave.
Einfaches Feld mit 2 Turret-Slots.|Simple tile with 2 tower slots.
Gewundener Weg: Gegner bleiben länger im Hex.|Winding road: enemies stay on this hex longer.
+25 % Tower-Reichweite. Nur 1 Slot und drei Straßenenden.|+25% tower range. Only 1 slot and three road ends.
+25 % Archer-Schaden auf diesem Hex. Nur 1 Slot.|+25% Archer damage on this hex. Only 1 slot.
+4 Gold je Wave. Keine Turret-Slots.|+4 gold per wave. No tower slots.
+40 % Tower-Reichweite, 2 Turret-Slots und +2 Gold je Wave.|+40% tower range, 2 tower slots and +2 gold per wave.
+20 % Schaden für alle Schadenstürme auf diesem Hex.|+20% damage for all damage towers on this hex.
2 Turret-Slots und +15 % Tower-Reichweite.|2 tower slots and +15% tower range.
+5 Gold je Wave, 1 Turret-Slot und 1 Gebäudeslot.|+5 gold per wave, 1 tower slot and 1 building slot.
Vier Straßenenden, 2 Slots, +30 % Tower-Schaden.|Four road ends, 2 slots, +30% tower damage.
+25 % Reichweite für Freeze auf diesem Hex.|+25% Frost Tower range on this hex.
+25 % Schaden für Katapult auf diesem Hex.|+25% Catapult damage on this hex.
+25 % Schaden für Kettenblitz auf diesem Hex.|+25% Chain Lightning damage on this hex.
+25 % Schaden für Minenleger auf diesem Hex.|+25% Mine Layer damage on this hex.
+25 % Schaden für Balliste auf diesem Hex.|+25% Ballista damage on this hex.
+25 % Schaden für Flammenturm auf diesem Hex.|+25% Flame Tower damage on this hex.
+25 % Schaden für Elementturm auf diesem Hex.|+25% Element Tower damage on this hex.
+25 % Schaden für Nekromantenturm auf diesem Hex. Gilt auch für Geister.|+25% Necromancer Tower damage on this hex. Also affects spirits.
Gespiegelte T-Kreuzung: Durchgang mit Abzweig auf der anderen Seite.|Mirrored T junction: through road with a branch on the opposite side.
Drei Straßenenden auf einer Seite. Zwei Turmplätze im Rücken.|Three road ends on one side. Two tower slots behind.
Vier aufeinanderfolgende Straßenenden für neue Anschlüsse.|Four consecutive road ends for new connections.
Kleine Kurve: +30 % Turmreichweite auf diesem Hex.|Small bend: +30% tower range on this hex.
+20 % Reichweite, zwei Turmplätze und vier Straßenenden.|+20% range, two tower slots and four road ends.
Y-Kreuzung mit 2 Turmplätzen und +20 % Turmschaden.|Y junction with 2 tower slots and +20% tower damage.
Gerade mit einem Turmplatz und +4 Gold je Wave.|Straight with one tower slot and +4 gold per wave.
+2 Gold je Wave, ein Turmplatz an einer geraden Straße.|+2 gold per wave, one tower slot beside a straight road.
Große Kurve: +5 Gold je Wave, Gebäudeslot und +20 % Turmreichweite.|Wide bend: +5 gold per wave, a building slot and +20% tower range.
Kleine Kurve: +40 % Turmschaden und +20 % Reichweite.|Small bend: +40% tower damage and +20% range.
Sechs Anschlüsse, 2 Turmplätze, +20 % Schaden und Reichweite.|Six connections, 2 tower slots, +20% damage and range.
Schließt einen Weg mit zwei Turmplätzen ab. Darf niemals das letzte offene Straßenende schließen.|Ends a road with two tower slots. Cannot close the last open road end.
Nur bei blockiertem Deck. Passende Anschlüsse, keine Turmplätze.|Only for a blocked deck. Matching connections, no tower slots.
Kostenloser Tunnelausgang ohne Bauplätze.|Free tunnel exit without build slots.
Normal|Normal
Schwarm|Swarm
Gepanzert|Armored
Magiegeschützt|Warded
Eisenkoloss|Iron Colossus
Sturmjäger|Storm Hunter
Seelenmatriarchin|Soul Matriarch
Schwerer Belagerer: viel Rüstung, langsam, 7 Base-Schaden.|Heavy siege boss: high armor, slow, 7 base damage.
Schneller Boss: widersteht Verlangsamung, wenig Rüstung.|Fast boss: resists slows, little armor.
Deck blockiert: Lege das kostenlose Rettungshex. Es hat keine Turmplätze und kommt nicht ins Deck.|Deck blocked: place the free rescue hex. It has no tower slots and is not added to the deck.
Deck blockiert: Lege das kostenlose Rettungshex.|Deck blocked: place the free rescue hex.
Straße eingeschlossen. Ein kostenloser Rettungstunnel öffnet eine neue Front.|Road enclosed. A free rescue tunnel opens a new front.
Keine Erweiterung möglich. Du kannst bauen und die nächste Wave starten.|No expansion possible. You can build and start the next wave.
Nicht erlaubt: Straßen müssen passen und mindestens eine Straße muss zum äußeren freien Raum führen.|Not allowed: roads must match and at least one road must lead to the outside open area.
Erweitere einen freien Base-Ausgang. Straßen müssen passen; der zweite Ausgang muss mit der übrigen Hand bebaubar bleiben.|Extend an unused base exit. Roads must match; the other exit must remain buildable with your remaining hand.
Erster Ausgang erweitert. Lege jetzt eine Karte direkt an den zweiten Base-Ausgang.|First exit extended. Now place a card directly next to the second base exit.
Zwei Fronten: Wähle zwei der fünf Handkarten und erweitere beide Base-Ausgänge.|Two Fronts: choose two of your five hand cards and extend both base exits.
Hex gelegt. Baue jetzt Türme oder starte die Wave.|Hex placed. Build towers or start the wave.
Gold. Baue jetzt Türme oder starte die Wave.|gold. Build towers or start the wave.
Bossfeld erschlossen: Der Wächter startet in der nächsten Wave direkt auf diesem Hex. Bereite deine Türme vor.|Boss tile discovered: the guardian spawns on this hex next wave. Prepare your towers.
Bossfeld(er) angeschlossen. Wächter starten in der nächsten Wave auf ihren eigenen Hexfeldern.|boss tile(s) connected. Guardians spawn on their own hexes next wave.
Kostenlosen Rettungstunnel bauen|Build free rescue tunnel
Rettungstunnel ansehen|View rescue tunnel
Tunnel kostenlos bauen|Build tunnel for free
Rettungstunnel geöffnet. Erweitere die neue Straße in der nächsten Runde.|Rescue tunnel opened. Extend the new road next round.
Rettungstunnel von Hex|Rescue tunnel from hex
Rettungstunnel nach|Rescue tunnel to
Vorschau|Preview
Gold je Wave.|gold per wave.
Gold je überlebter Wave.|gold per wave survived.
Gold bis Wave-Ende.|gold by wave end.
Gold plus Kartenbeute (90 % Epic, 10 % Legendary).|gold plus card loot (90% Epic, 10% Legendary).
Gold und Kartenbeute bei Sieg.|gold and card loot on victory.
% der gesamten Investition inklusive Upgrades).|% of total investment including upgrades).
normale Gegner besiegt.|normal enemies defeated.
normale Gegner besiegt. Noch maximal +|normal enemies defeated. Up to another +
normale Gegner|normal enemies
Gegner kommen noch,|enemies still to come,
sind auf der Map (davon|on the map (including
vor Bauausgaben und weiteren Einnahmen der laufenden Wave.|before building costs and further income this wave.
kein Schaden|no damage
offene Fronten.|open fronts.
Bestmarke|Best
Platz|Slot
Verloren|Lost
pro besiegten Gegner|per kill
pro überlebter Wave|per survived wave
Hero-Einkommen|Fortress income
Hexbonus eingerechnet|hex bonus included
Basisschaden an einem zufälligen Eingang.|base damage at a random entrance.
Basisschaden|base damage
aktuelle/maximale HP|current/maximum HP
Dorf +2, Handelsstraße +4, Haus zusätzlich +3 pro Wave. Im Run verdient: Kills|Village +2, Trade Road +4, House another +3 per wave. Earned this run: kills
Hex-/Haus-/Hero-/Beuteboni|Hex/house/fortress/loot bonuses
Wave-Abschluss|Wave completion
Abschlüsse|Completions
Schätze|Treasures
Hex-Bonus|Hex bonus
Bossbeute|Boss loot
Kasse|Cargo
Karawanenkasse|Caravan cargo
Noch|Remaining
Maximal|Maximum
benötigt|required
automatisch|automatically
je überlebter Wave|per wave survived
`);
HexTranslations.add(`
Zwillingsfestungen|Twin Fortresses
Duo · Lokaler Prototyp|Duo · Local prototype
Zwillingsfestungen · Server-Prototyp|Twin Fortresses · Server prototype
Zwillingsfestungen · lokaler Duo-Prototyp|Twin Fortresses · Local Duo prototype
Neues Duo|New Duo
Spieler 1|Player 1
Spieler 2|Player 2
Lobby erstellen|Create lobby
Lobby beitreten|Join lobby
Einladungscode|Invite code
Einladungscode oder -link|Invite code or link
← Hauptmenü|← Main menu
DUO · FREUNDE-BETA|DUO · FRIENDS BETA
DUO · LOBBY|DUO · LOBBY
Zwei Festungen, ein Team: Jeder verteidigt seine eigene Karte, ihr teilt euch die Leben und helft euch gegenseitig mit Verstärkung und Geschenken.|Two fortresses, one team: each of you defends your own map, you share your lives and help each other with reinforcements and gifts.
Neue Lobby|New lobby
Du erstellst die Lobby und schickst deinem Partner den Einladungslink.|You create the lobby and send your partner the invite link.
Eigene Lobbys schaltest du frei, wenn du im Standardspiel Welle 35 überlebst. Beitreten geht immer.|You unlock your own lobbies by surviving wave 35 in the standard game. Joining always works.
Einladung annehmen|Accept an invite
Du hast einen Link oder Code bekommen? Einfach hier einfügen.|Got a link or code? Just paste it here.
So funktioniert Duo|How Duo works
Gleichzeitig bauen:|Build at the same time:
Jeder legt Hexfelder und baut Türme auf seiner eigenen Karte.|Each of you places hex tiles and builds towers on your own map.
Gemeinsam starten:|Start together:
Die Welle beginnt erst, wenn ihr beide »Bereit« gedrückt habt.|The wave only begins once you have both pressed »Ready«.
Geteilte Leben:|Shared lives:
Beide Karten verlieren Leben aus demselben Vorrat von 40.|Both maps lose lives from the same pool of 40.
Helfen:|Help:
Wer eine Welle ohne Lebensverlust schafft, schickt eine Turmkopie auf das Portal des Partners. Alle 5 Wellen beschenkt ihr euch.|Whoever clears a wave without losing lives sends a tower copy to the partner's portal. Every 5 waves you give each other a gift.
Partner einladen|Invite partner
Partner tritt bei|Partner joins
Beide bereit|Both ready
Noch nicht bereit|Not ready yet
Ich bin bereit|I'm ready
Schicke deinem Partner den Link. Sobald er beitritt, könnt ihr euch bereit melden.|Send your partner the link. Once they join, you can both get ready.
Dein Partner ist gerade nicht verbunden. Warte kurz, bis er zurück ist.|Your partner is not connected right now. Wait a moment until they are back.
Du bist bereit. Das Spiel startet, sobald dein Partner auch bereit ist.|You are ready. The game starts as soon as your partner is ready too.
Dein Partner ist bereit und wartet auf dich.|Your partner is ready and waiting for you.
Das Spiel startet, sobald ihr beide bereit seid.|The game starts as soon as you are both ready.
Beide bereit – das Spiel startet …|Both ready – the game is starting …
Einladungslink kopiert – schick ihn jetzt deinem Partner.|Invite link copied – send it to your partner now.
Kopiert ✓|Copied ✓
Letzte Duo-Partie öffnen|Open last Duo match
Duo · Team|Duo · Team
Partnerhilfe|Partner help
Dein Portal|Your portal
Platz wählen|Choose slot
Aufheben|Clear
Deine Verstärkung|Your reinforcement
Turm wählen|Choose tower
Abwählen|Deselect
Wächter starten erst, wenn ihr beide zustimmt.|Guardians only start once you both agree.
Noch nicht gesetzt – ein freier Turmplatz auf deiner Karte|Not set yet – a free tower slot on your map
Noch nicht gewählt – einer deiner Türme|Not chosen yet – one of your towers
Schaffst du eine Welle ohne Lebensverlust, fliegt eine Kopie deiner Verstärkung auf das Portal deines Partners und hilft ihm bis zum Wellenende. Umgekehrt landet seine Hilfe auf deinem Portal. Alle 5 Wellen schenkt ihr euch zusätzlich etwas.|If you clear a wave without losing lives, a copy of your reinforcement flies to your partner's portal and helps until the wave ends. Their help lands on your portal the same way. Every 5 waves you also give each other a gift.
Vorbereitung|Preparation
Vor Welle|Before wave
gemeinsam|shared
nicht verbunden|not connected
Partie beendet|Match over
bereit ✓|ready ✓
bestätigt die Welle|confirms the wave
Geschenk gewählt|gift chosen
wählt ein Geschenk|chooses a gift
wählt eine Belohnung|chooses a reward
legt ein Hex|places a hex
wählt eine Karte|chooses a card
dünnt das Deck aus|thins the deck
wählt Beute|chooses loot
wählt einen Segen|chooses a blessing
Welle geschafft|wave cleared
Serverwartung|Server maintenance
Die Partie ist sicher pausiert und geht danach automatisch weiter.|The match is safely paused and continues automatically afterwards.
Ein Spieler hat die Partie verlassen. Über das Duo-Menü geht es zurück zur Lobby.|A player left the match. Use the Duo menu to return to the lobby.
Rückkehrfenster abgelaufen|Return window expired
Diese Partie kann nicht fortgesetzt werden. Erstellt bitte eine neue Lobby.|This match cannot continue. Please create a new lobby.
Pausiert · Partner nicht verbunden|Paused · partner not connected
Bis dein Partner zurück ist, ist alles gesperrt|Everything is locked until your partner is back
er hat noch|they have
Gemeinsam geschafft!|Victory together!
Die Festungen sind gefallen|The fortresses have fallen
Startet eine neue Partie oder geht zurück zur Lobby.|Start a new match or return to the lobby.
Du siehst die Partnerkarte|You are viewing your partner's map
Hier kannst du nur zuschauen. Mit »Meine Karte« kommst du zurück.|You can only watch here. »My map« takes you back.
Gemeinsame Pause|Shared pause
Einer von euch hat pausiert. Mit P oder »Gemeinsam fortsetzen« geht es für beide weiter.|One of you paused. Press P or »Resume together« to continue for both.
Bestätige die Meldung, dann geht es weiter.|Confirm the message to continue.
Wähle Gold oder eine Karte – sie landet direkt bei deinem Partner.|Choose gold or a card – it goes straight to your partner.
Geschenk verschickt|Gift sent
Sobald dein Partner auch gewählt hat, geht es weiter.|You continue as soon as your partner has chosen too.
Wähle deine Belohnung|Choose your reward
Dein Partner wählt gleichzeitig seine eigene.|Your partner chooses their own at the same time.
Du bist dran: Hex legen|Your turn: place a hex
Wähle unten eine Karte und klicke auf ein grünes Feld. R oder Rechtsklick dreht die Karte.|Pick a card below and click a green field. R or right-click rotates the card.
Du bist bereit|You are ready
Die Welle startet, sobald dein Partner auch bereit ist. Zum Weiterbauen nimm die Bereitschaft zurück.|The wave starts as soon as your partner is ready too. To keep building, withdraw your readiness.
Bauphase: Türme bauen|Build phase: build towers
Dein Partner ist schon bereit und wartet auf dich. Wenn du fertig bist: »Bereit für die Welle« (Leertaste).|Your partner is already ready and waiting for you. When you are done: »Ready for the wave« (Space).
Baue Türme auf freie Plätze. Wenn du fertig bist: »Bereit für die Welle« (Leertaste). Die Welle startet, sobald ihr beide bereit seid.|Build towers on free slots. When you are done: »Ready for the wave« (Space). The wave starts as soon as you are both ready.
Eure Türme kämpfen automatisch auf beiden Karten. Du kannst nebenbei weiter bauen.|Your towers fight automatically on both maps. You can keep building meanwhile.
Deine Welle ist geschafft|Your wave is cleared
Dein Partner kämpft noch. Danach geht es für euch beide weiter.|Your partner is still fighting. Then you both continue.
Einen Moment|One moment
Der nächste Schritt wird vorbereitet.|The next step is being prepared.
Pausiert · Partner fehlt|Paused · partner missing
Bereit ✓ · zurücknehmen|Ready ✓ · withdraw
Bereit – Partner wartet (Leertaste)|Ready – partner is waiting (Space)
Karte wechseln|Switch map
⇄ Partnerkarte ansehen|⇄ View partner map
⇄ Zurück zu meiner Karte|⇄ Back to my map
Sitzung & Verbindung|Session & connection
Code oder Einladungslink einfügen|Paste code or invite link
Diese Duo-Lobby existiert nicht mehr oder ist abgelaufen.|This Duo lobby no longer exists or has expired.
Diese Duo-Sitzung existiert nicht mehr oder ist abgelaufen.|This Duo session no longer exists or has expired.
Einladungslink|Invite link
Einladungslink kopieren|Copy invite link
Einladungslink kopiert.|Invite link copied.
Link markieren und kopieren.|Select and copy the link.
Erstelle eine private Duo-Lobby und lade eine zweite Person mit dem Code oder Einladungslink ein.|Create a private Duo lobby and invite someone with the code or invite link.
Bitte einen gültigen Einladungscode eingeben.|Enter a valid invite code.
Lobby nicht gefunden oder abgelaufen.|Lobby not found or expired.
Diese Lobby ist bereits voll.|This lobby is full.
Diese Lobby ist abgelaufen.|This lobby has expired.
Der Server ist ausgelastet. Bitte später erneut versuchen.|The server is full. Please try again later.
Server nicht erreichbar oder zu viele Versuche. Bitte kurz warten.|Server unavailable or too many attempts. Please wait a moment.
Unpassende Serverversion.|Incompatible server version.
Verbinde …|Connecting …
Verbindung fehlgeschlagen.|Connection failed.
Verbindung fehlgeschlagen (|Connection failed (
Verbunden · Server steuert den Run|Connected · Server controls the run
Neuer Versuch läuft …|Retrying …
Du kannst erneut versuchen.|You can try again.
Aktion abgelehnt:|Action rejected:
Aktion bestätigt.|Action confirmed.
Aktion aktuell nicht möglich. Prüfe Phase, Auswahl und Gold.|Action unavailable. Check phase, selection and gold.
Bitte auf die Serverbestätigung warten.|Please wait for server confirmation.
Warte auf deinen Partner. Teile den Einladungslink oben.|Waiting for your partner. Share the invite link above.
Wartet auf Partner|Waiting for partner
Bereit|Ready
Bereit für nächste Wave|Ready for next wave
Bereitschaft zurücknehmen|Cancel ready
Beide Spieler platzieren zuerst ein Hex und bauen ihre Verteidigung.|Both players first place a hex and build their defenses.
Partner-Map · Nur anschauen|Partner's map · View only
Server-Duo · Baue auf deiner eigenen Map. Die Partner-Map kannst du anschauen. Beide müssen bereit sein. Tempo vorerst 1×.|Server Duo · Build on your own map. You can view your partner's map. Both players must be ready. Speed is currently 1×.
Kamera: Mausrad zoomt, mittlere/rechte Maustaste zieht. Auf Touch stehen Zoom-Buttons bereit. Kein Zugriff auf dein Solo-Profil.|Camera: wheel to zoom, middle/right-drag to pan. Touch zoom buttons are available. No access to your solo profile.
Beide Maps an diesem Gerät steuern. Getrennt bauen, gemeinsam bereit werden. Nach einem sauberen Abschluss hilft dein gewählter Turm am Partner-Portal. Wechsle unten zwischen den beiden Maps. Beide werden lokal weiter simuliert. Noch ohne Online-Lobby und Profilbelohnungen.|Control both maps on this device. Build separately, ready up together. After a clean wave, your selected tower helps at your partner's portal. Switch maps below. Both keep simulating locally. No online lobby or profile rewards in this mode.
Beide Festungen teilen sich das Team-Leben. Base-Ausbau folgt in einer späteren Duo-Etappe.|Both fortresses share team health. Base upgrades will follow in a later Duo phase.
Beide Karten und der gemeinsame Spielstand sind für diesen Tab gespeichert.|Both maps and team state are saved for this tab.
Runzustand wiederhergestellt.|Run state restored.
Der Run ist beendet.|The run has ended.
Lokalen Duo-Run neu starten?|Restart local Duo run?
Checkpoint merken|Save checkpoint
Checkpoint laden|Load checkpoint
Hier Partner-Portal reservieren|Reserve partner portal here
Portal aufheben|Remove portal
Kein Portal reserviert – keine Partnerhilfe möglich.|No portal reserved – partner support unavailable.
Kein Verstärkungsturm gewählt|No reinforcement tower selected
Als Verstärkung senden|Send as reinforcement
Verstärkung abwählen|Deselect reinforcement
Verstärkung ausgewählt|Reinforcement selected
Verstärkung unterwegs|Reinforcement on its way
Unterstützungsschaden:|Support damage:
Belohnung überspringen|Skip reward
+30 eigenes Gold|+30 personal gold
+2 eigenes Einkommen|+2 personal income
+5 Team-HP (aktuell/maximal)|+5 team HP (current/maximum)
Heilquelle: bis +5 Team-HP / sonst 30 Gold|Healing spring: up to +5 team HP / otherwise 30 gold
Die Ziehreihenfolge bleibt verborgen.|Draw order stays hidden.
Die Startfestung bestimmt HP und Gold; die Base lässt sich ausbauen.|Your starting fortress determines health and gold; the base can be upgraded.
Jedes offene Straßenende ist ein Spawnpunkt.|Each open road end is a spawn point.
Stufe 1 abschließen: Wave 35 überleben, dadurch Stufe 2 · Zwei Fronten freischalten. Nach Wave 35: Run beenden oder mit gleicher Map im Endless-Modus weiterspielen.|Complete difficulty 1 by surviving wave 35 to unlock difficulty 2 · Two Fronts. After wave 35, finish the run or continue on the same map in endless mode.
Ab Wave 15 erscheint alle 10 Waves ein Boss an einem zufälligen Eingang. Bosswellen werden vor dem Start angekündigt.|From wave 15, a boss appears at a random entrance every 10 waves. Boss waves are announced before they start.
Jeder Gegner entscheidet an jeder Gabelung zufällig zwischen allen Wegen zur Base. Sackgassen und Schleifen werden ausgeschlossen.|At each junction, enemies randomly choose among all routes to the base. Dead ends and loops are excluded.
Alle 2 Waves: 1 von 3 neuen Hexkarten ins Deck.|Every 2 waves: add 1 of 3 new hex cards to your deck.
Sicht ab jedem gesetzten Hex: Radius 2 klar, bis Radius 6 Nebel, danach unsichtbar. ? = unbekanntes Sonderfeld. ◆ Schatz, ✦ Shrine, ☠ Boss. Feste Sonderfelder werden durch passende Nachbarstraßen angeschlossen.|Vision from each placed hex: clear within radius 2, fog up to radius 6, then hidden. ? = unknown special tile. ◆ Treasure, ✦ Shrine, ☠ Boss. Connect special tiles using matching adjacent roads.
Die Base startet im Grasland. Beim Erkunden frühestens ab vier Hexen Entfernung erscheinen Regionen; Effekte gelten lokal.|The base starts in grassland. Other regions appear at least three hexes away; their effects apply locally.
Dünenmeer: Gegner −15 % Tempo, Türme −15 % Reichweite.|Dune Sea: enemy speed −15%, tower range −15%.
Sturmhochland: Kettenblitz +25 % Sprungweite, Wind +1 Durchschlagziel; Archer/Balliste −15 % Angriffsrate.|Storm Highlands: Chain Lightning jump range +25%, wind +1 piercing target; Archer/Ballista attack rate −15%.
Aschelande: Feuer +20 % Schaden; Freeze −15 % Reichweite, Wasser-Slow −25 % Dauer.|Ashlands: fire damage +20%; Frost Tower range −15%, water slow duration −25%.
Wave 20 überleben. Feste Standardfestung, zwei zufällige Ausgänge. Deck: 2× Gerade, Lange Straße, Handelsstraße, Dorfstraße. Türme: Archer, Balliste, Katapult, Minenleger, Freeze – für diesen Run kostenlos freigeschaltet; Stufe 4 gesperrt.|Survive wave 20. Standard Fortress, two random exits. Deck: 2× Straight, Long Road, Trade Road, Village Road. Towers: Archer, Ballista, Catapult, Mine Layer, Frost Tower – unlocked for free during this run; level 4 is locked.
Sandsturm: −15 % Gegnertempo und Turmreichweite. Jeder zehnte normale Gegner trägt eine Kasse: +15 Gold extra beim Besiegen, −10 Gold bei Durchbruch. Einmal täglich +10 Diamanten beim Sieg. Gleicher Tages-Seed für alle; Wechsel um 00:00 UTC. Regeln bleiben dauerhaft verfügbar.|Sandstorm: −15% enemy speed and tower range. Every tenth normal enemy carries cargo: +15 gold when killed, −10 gold if it breaks through. Win +10 diamonds once per day. Everyone shares the daily seed; it changes at 00:00 UTC. These rules remain available permanently.
Hohe Magieresistenz. Ruft alle 6 Sekunden einen Diener, maximal sechs; Diener geben kein Gold.|High magic resistance. Summons a minion every 6 seconds, up to six; minions drop no gold.
Bauen auch während der Wave. Rückgabe in der aktuellen Bauphase: 100 %. Danach Verkauf: 50 % inklusive Upgrades.|Build during combat too. Refund during the current build phase: 100%. Afterwards: 50%, including upgrades.
↑ Upgrade bezahlbar · 2 Spezialisierung · 3 Zweigfinale · 4 freischaltbare Meta-Stufe. Turm anklicken für Werte und Upgrades.|↑ Upgrade affordable · 2 Specialization · 3 Branch finale · 4 Unlockable meta level. Click a tower for stats and upgrades.
Bosswelle|Boss wave
Bosswellen|Boss waves
Spezialist|Specialist
Leer|Empty
Zusätzlich|Additionally
läuft –|in progress –
nötig|required
Schließen|Close
Werte & Symbole|Stats & symbols
Hex-Karte|Hex map
`);
Object.assign(HexTranslations.de,{'WAVE':'WELLE','Gebäudeslots':'Gebäudeplätze','Loadoutpreise':'Turmpreise','Undo':'Rückgabe','Turmplatzs':'Turmplätze','Schaden gegen HP':'Schaden gegen Leben'});
HexTranslations.add(`
WELLE|WAVE
Spiegel-Abzweig|Mirrored Junction
Apex-Bolzen|Apex Bolt
Straßenloses Hex mit 1 Gebäudeslot. Seitlich anbauen; offene Straßen bleiben frei.|Roadless hex with 1 building slot. Place beside the road; keep open roads clear.
Straßenloses Hex mit 2 Gebäudeslots. Seitlich anbauen; offene Straßen bleiben frei.|Roadless hex with 2 building slots. Place beside the road; keep open roads clear.
Straßenloses Hex mit 3 Gebäudeslots. Seitlich anbauen; offene Straßen bleiben frei.|Roadless hex with 3 building slots. Place beside the road; keep open roads clear.
Sekunden je Angriff (kleiner = schneller)|Seconds per attack (lower = faster)
Blitzziele/Sprungweite|Lightning targets/jump range
Geister|Spirits
Dauer|Duration
◆ schaltet dauerhaft frei; Gold bezahlt den Ausbau im Run.|◆ unlocks permanently; gold pays for upgrades during the run.
Gelb = Leben, Orange = Rüstung, Blau = Magieresistenz.|Yellow = health, orange = armor, blue = magic resistance.
schnell|fast
mit|with
und|and
Kills inklusive Karawanenboni|Kills including caravan bonuses
Nur wenn alle Gegner besiegt werden und die Wave überlebt wird. Mit aktuellem Gold: maximal|Only if all enemies are defeated and the wave is survived. With current gold: up to
Undo erstattet nur den Kaufpreis, erzeugt kein Einkommen.|Refunds only return the purchase price and do not generate income.
Vor dem Platzieren des Hexes ist der Einkommensbonus vorläufig; danach wird er aktualisiert.|Before hex placement, the hex bonus is provisional; it updates after placement.
Loadoutpreise:|Loadout prices:
noch|still
bezahlbar|affordable
Gesamtpreis für alle markierten Plätze inklusive lokaler Rabatte. Werte zeigen den zuletzt gewählten Platz.|Total price for all selected slots including local discounts. Stats show the last selected slot.
Aktuelle Ausrichtung|Current orientation
Straßenanschlüsse|road connections
Keine Straße|No road
Base-Ausgang erweitern · Karten 1–|base exit to extend · Cards 1–
Shrine-Belohnung|Shrine reward
Boss-Beute|Boss loot
Beute|Loot
kostenlos; Verkaufswert bleibt unverändert.|free; resale value stays unchanged.
Wähle eine Karte für dein Deck. Danach geht es zurück in die Bauphase. Dieser Shrine ist einmalig; Überspringen verbraucht ihn ebenfalls.|Choose a card for your deck, then return to building. This shrine is single-use; skipping also consumes it.
je Angriff|per attack
legt alle|lays every
eine stapelbare Mine|a stackable mine
Ziele|targets
Sprungdistanz|jump distance
Explosion|blast
Geister mit je|spirits with
Schaden für|damage for
Sekunden|seconds
Danach:|After:
Jetzt:|Now:
bauen|build
gewählt|selected
freischalten|unlock
Ziel: Wave 20 · Sandsturm −15 % Tempo/Reichweite|Goal: wave 20 · Sandstorm −15% speed/range
Türme freigeschaltet · Bestmarke Wave|towers unlocked · Best wave
Durchlaufende|run end
Entwicklungsserver: aktuell auf diesem Rechner erreichbar. Zwei getrennte Tabs oder Browser nutzen. Kein Profilzugriff; Serverneustart verwirft die Partien.|Development server: currently available on this computer. Use two separate tabs or browsers. No profile access; restarting the server discards matches.
bauen?|build?
`);
HexTranslations.add(`
Dieser Shrine ist einmalig; Überspringen verbraucht ihn ebenfalls.|This shrine is single-use; skipping also consumes it.
erreicht.|reached.
nach|to
Kostenlos, keine Gebäude werden entfernt.|Free; no buildings are removed.
Auswählen|Select
Im Loadout|In loadout
Hinweis:|Note:
20 HP · 70 Gold. Ausgewogene Festung ohne zusätzliche Boni.|20 HP · 70 gold. Balanced fortress without additional bonuses.
`);
HexTranslations.add(`
20 HP · 70 Gold. Ausgewogener Start; zwei Stufen je Base-Ausbau; Waffenstufen mit 1/2 Turmplätzen.|20 HP · 70 gold. Balanced start; two levels per base upgrade.
Tatsächlich verursachter Schaden an Leben, Rüstung und Magieresistenz, ohne Overkill; inklusive Minen- und Geisterschaden. Schaden/Gold nutzt die bezahlten Bau- und Verbesserungskosten vor Erstattungen. Rabatte zählen, kostenlose Shrine-Upgrades kosten 0. Freeze unterstützt durch Slow. Base-Waffenschaden separat:|Actual damage dealt to health, armor and magic resistance, excluding overkill; includes mines and spirits. Damage/gold uses paid build and upgrade costs before refunds. Discounts count; free shrine upgrades cost 0. Frost Tower supports through slows. Base weapon damage separately:
bis zu|up to
für|for
erreicht|reached
`);
HexTranslations.add(`
Ausgewählter Turm|Selected tower
Turminfos schließen|Close tower information
Gebäudeinfos schließen|Close building information
Loadout: Turm auf einen freien Platz ziehen|Loadout: drag a tower onto an empty slot
Entdeckte Biome|Discovered biomes
Menü|Menu
Goldplanung öffnen|Open gold forecast
Deck und Kartenstapel öffnen|Open deck and card piles
Profilfortschritt öffnen|Open profile progress
Diamanten bei Ende des aktuellen Durchlaufs|Diamonds awarded at the end of this run
Handkarten|Hand cards
Spielgeschwindigkeit|Game speed
Deckübersicht|Deck overview
Schwierigkeitsstufe|Difficulty
Startfestung|Starting fortress
Statistik des abgeschlossenen Durchlaufs|Completed run statistics
Forschungsmap verkleinern|Zoom research map out
Forschungsmap vergrößern|Zoom research map in
Arsenal-Hilfe|Arsenal help
Arsenal schließen (Escape)|Close Arsenal (Escape)
Verschiebbare Forschungsmap|Draggable research map
Duo-Map auswählen|Select Duo map
Meta-Freischaltung|Meta unlock
Wave-Fortschritt|Wave progress
Boss-Siege|Boss victories
Spieler|Players
Belohnung|Reward
`);
HexTranslations.add(`
Alle Turm- und Meta-Freischaltungen werden entfernt; Loadouts werden auf die fünf Starttürme zurückgesetzt. Ein bereits laufender Run behält seine Startauswahl. Erneut klicken zum Bestätigen.|All tower and meta unlocks will be removed; loadouts reset to the five starter towers. An active run keeps its starting selection. Click again to confirm.
`);
HexTranslations.add(`
Baue einen Bogenschützen. Hebe etwas Gold für seine erste Verbesserung auf.|Build an Archer. Save some gold for its first upgrade.
Klicke deinen gebauten Turm an und verbessere ihn. Beim Bogenschützen kostet die erste Verbesserung 35 Gold und hilft dir in der ersten Welle.|Click your built tower and upgrade it. The Archer's first upgrade costs 35 gold and helps you survive the first wave.
Achte auf die Herzen oben rechts: Lass keine Gegner in die Basis laufen. Bei null Leben verlierst du.|Watch the hearts at the top right: keep enemies out of your base. At zero health, you lose.
Bereit! Starte die Welle mit der Leertaste oder mit dem hervorgehobenen Knopf unten rechts.|Ready! Start the wave with Space or the highlighted button at the bottom right.
Verstanden · Weiter|Got it · Continue
Standard: Welle 35 besiegen.|Standard: defeat wave 35.
Zwei Fronten: Welle 35 besiegen.|Two Fronts: defeat wave 35.
Welle 35 geschafft! Zwei Fronten und Festungsbauer sind jetzt freigeschaltet.|Wave 35 cleared! Two Fronts and Fortress Builder are now unlocked.
Zwei Fronten gemeistert! Händlerstadt ist jetzt freigeschaltet.|Two Fronts conquered! Merchant City is now unlocked.
Wirklich verkaufen?|Really sell?
erneut klicken|click again
Zurück zum Sieg · Esc|Back to victory · Esc
Menüs und Informationen schließen durch einen Klick außerhalb oder mit Escape. Beim Verkauf bestätigt ein zweiter Klick auf denselben Knopf. Belohnungen bleiben offen, bis du gewählt oder sie über „Karte anschauen“ ausgeblendet hast.|Close menus and information with an outside click or Escape. Confirm sales by clicking the same button again. Rewards stay pending until you choose or hide them with “View map”.
`);

HexTranslations.add(`
Jedes offene Straßenende ist ein Spawnpunkt. Die Welle hat eine feste Gegneranzahl, die auf die offenen Enden aufgeteilt wird. Mehr Enden erzeugen keine zusätzlichen Gegner.|Each open road end is a spawn point. Each wave has a fixed number of enemies distributed across the open ends. More ends do not create additional enemies.
Verbindung unterbrochen. Wiederverbinden läuft …|Connection lost. Reconnecting …
Partnerverbindung unterbrochen · Partie pausiert · Rückkehrfenster:|Partner disconnected · Match paused · Reconnect window:
Wiederbeitrittsfenster abgelaufen · Bitte eine neue Lobby erstellen.|Reconnect window expired · Please create a new lobby.
`);

HexTranslations.add(`
Werte|Stats
Biome|Biomes
Spielsteuerung|Game controls
`);

HexTranslations.add(`
Dieses Hex ist bereits versorgt. Wähle ein unversorgtes Hex.|This hex is already supplied. Choose an unsupplied hex.
Vorlagen|Presets
Wähle fünf Türme. Details erscheinen bei Fokus oder Auswahl.|Choose five towers. Details appear on focus or selection.
5/5 Türme gewählt.|5/5 towers selected.
Kräftig: aktueller Wirkbereich. Blass: Versorgung durch andere Gebäude desselben Typs.|Strong color: current area of effect. Faint color: coverage from other buildings of the same type.
Hohe Magieresistenz. Ruft alle 6 Sekunden an ihrer Position einen Diener, maximal sechs. Diener sind 20 % langsamer und geben kein Gold.|High magic resistance. Summons a minion at its position every 6 seconds, up to six. Minions are 20% slower and grant no gold.
Gebäude ausbaubar|Building can be upgraded
Ausbaubar|Can be upgraded
`);
HexTranslations.add(`
Run vorbereiten|Prepare run
Fünf Türme für den nächsten Run.|Five towers for the next run.
Run starten|Start run
`);

HexTranslations.add(`
Gegnerportal|Enemy portal
Gegnerportal-Platz|Enemy portal slot
Ein zusätzlicher Gegnereingang. Die feste Gegnerzahl wird auf alle Eingänge verteilt. Bau und Verkauf nur zwischen Wellen.|An additional enemy entrance. The fixed enemy count is shared between all entrances. Build and sell only between waves.
Schließt einen Weg mit zwei Turmplätzen ab. Eigener Gegnerportal-Platz: Ausbau für 250 Gold. Darf niemals das letzte offene Straßenende schließen.|Closes a road with two tower slots. Dedicated enemy portal slot: build for 250 gold. Can never close the last open road end.
Neues Biom entdeckt|New biome discovered
Hier rechts findest du die sichtbaren Biome und ihre Effekte. Fahre über ein Symbol oder tippe darauf: Die zugehörigen Felder werden hervorgehoben.|On the right you can find visible biomes and their effects. Hover over an icon or tap it to highlight its tiles.
`);

HexTranslations.add(`
Verstanden|Got it
Die epische Bastionssackgasse hat einen eigenen Gegnerportal-Platz. Für 250 Gold entsteht dort zwischen den Wellen ein zusätzlicher Eingang, der sich die feste Gegnerzahl mit den Straßenenden teilt. Normale Gebäude sind auf diesem Platz nicht möglich.|The Epic Bastion Dead End has a dedicated enemy portal slot. Between waves, spend 250 gold to build an additional entrance that shares the fixed enemy count with the road ends. Regular buildings cannot be built on this slot.
`);

HexTranslations.add(`
besonders gut gegen|especially effective against
Aktuelles Zusatzhex:|Current extra hex:
kräftig markiert|strongly highlighted
Zusatzhex auswählen|Choose extra hex
`);

HexTranslations.add(`
Neue Biome entdeckt|New biomes discovered
`);

HexTranslations.add(`
Sitzung hier übernehmen|Take over session here
Partie verlassen|Leave match
Wirklich verlassen? Partie endet für beide.|Really leave? The match ends for both players.
Zur Lobby|Back to lobby
Diese Sitzung ist in einem anderen Tab geöffnet.|This session is open in another tab.
Du kannst sie hier ausdrücklich übernehmen.|You can explicitly take it over here.
Sitzung zuerst in diesem Tab übernehmen.|Take over the session in this tab first.
Sitzung in diesem Tab übernommen.|Session taken over in this tab.
Die Partie wurde von einem Spieler verlassen. Zurück zur Lobby.|A player left the match. Return to the lobby.
Sitzungsaktion abgelehnt.|Session action rejected.
`);

HexTranslations.add(`
Die Partie wurde verlassen. Zur Lobby zurückkehren.|The match has been left. Return to the lobby.
Wiederbeitrittsfenster abgelaufen. Bitte eine neue Lobby erstellen.|The reconnect window expired. Please create a new lobby.
Partie pausiert. Warte auf die Wiederverbindung deines Partners.|Match paused. Waiting for your partner to reconnect.
`);

HexTranslations.add(`
Serverwartung · Partie sicher pausiert. Bitte warten.|Server maintenance · Match safely paused. Please wait.
Serverwartung. Neue Partien und Beitritte sind vorübergehend gesperrt.|Server maintenance. New matches and joins are temporarily disabled.
`);

HexTranslations.add(`
Die Karawane ist gerettet!|The caravan is saved!
Welle 20 geschafft! Tagessieg: +10 Diamanten|Wave 20 completed! Daily victory: +10 diamonds
Welle 20 geschafft! Tagesbelohnung bereits erhalten.|Wave 20 completed! Daily reward already claimed.
Spiele mit deiner Karte und deinen Türmen im Endlosmodus weiter. Die Karawanenregeln bleiben aktiv. Die Tagesbelohnung gibt es nur einmal pro Tag.|Continue in endless mode with your map and towers. Caravan rules remain active. The daily reward is available only once per day.
Endlosmodus|Endless mode
`);

HexTranslations.add(`
Nach Welle 20 kannst du im Endlosmodus weiterspielen. Die Tagesbelohnung gibt es nur einmal pro Tag.|After wave 20, you can continue in endless mode. The daily reward is available only once per day.
`);

HexTranslations.add(`
Strg + F: FPS-Anzeige ein/aus|Ctrl + F: toggle FPS counter
`);

HexTranslations.add(`
Partner-Lieferung|Partner delivery
Partner-Lieferung · Wähle ein kostenloses Geschenk für deinen Partner. Karten gehen in dessen Deck und Ablagestapel, bevor die nächste Hand gezogen wird.|Partner delivery · Choose a free gift for your partner. Cards enter their deck and discard pile before the next hand is drawn.
Dein Partner wählt noch seine Wellenbelohnung.|Your partner is still choosing their wave reward.
Gold für deinen Partner|gold for your partner
Karte verschenken|Gift card
Geschenk zugestellt. Warte auf die Lieferung deines Partners.|Gift delivered. Waiting for your partner's delivery.
`);

HexTranslations.add(`
Schatz +|Treasure +
Gold · ungesammelt|gold · uncollected
Das ist zwar kein Bogenschütze – aber viel Glück und viel Spaß damit! Klicke deinen Turm an, um seine Verbesserungen anzusehen. Falls dein Gold nicht reicht, kannst du hier trotzdem weitergehen.|That's not an Archer — but good luck and have fun! Click your tower to see its upgrades. If you don't have enough gold, you can still continue here.
`);

HexTranslations.add(`
Salve|Volley
Klicke deinen Bogenschützen an und wähle Salve für 35 Gold. Der Flächenschaden hilft dir, alle Gegner der ersten Welle abzuwehren.|Click your Archer and choose Volley for 35 gold. Its area damage helps you defeat every enemy in the first wave.
`);

HexTranslations.add(`
Partner-Lieferung · Wähle ein kostenloses Geschenk für deinen Partner. Karten kommen oben auf dessen Nachziehstapel und werden als Nächstes gezogen.|Partner delivery · Choose a free gift for your partner. Cards go on top of their draw pile and are drawn next.
`);

HexTranslations.add(`
Nachziehstapel: Die nächste Karte steht links oben.|Draw pile: the next card is at the top left.
Wächter auf Karte|Guardian on board
Zustimmung|Approval
Wächter verschieben|Postpone guardian
Wächter für nächste Welle freigeben|Approve guardian for the next wave
`);

HexTranslations.add(`
Wächterbeute · Wähle deine eigene Belohnung.|Guardian loot · Choose your own reward.
`);
HexTranslations.add(`
↻ Drehen (R)|↻ Rotate (R)
Ausgewählte Hexkarte drehen|Rotate selected hex card
Zuerst Hex legen|Place a hex first
Lege zuerst dein Hex, bevor du die nächste Welle startest.|Place your hex before starting the next wave.
Praktische Tastenbelegung|Useful keyboard shortcuts
Mit Hotkeys geht vieles schneller. Öffne die Einstellungen mit Escape und dort die Tastenbelegung.|Shortcuts make many actions faster. Press Escape to open Settings, then open Keyboard shortcuts.
Einstellungen öffnen|Open Settings
Escape öffnet die Einstellungen oder schließt offene Menüs und Infofenster.|Escape opens Settings or closes open menus and information panels.
Einstellungen öffnen / Fenster schließen|Open Settings / close window
Duo · Freunde-Beta|Duo · Friends beta
Zwei Festungen, ein Team. Private Lobby mit Einladungscode.|Two fortresses, one team. Private lobby with an invite code.
Noch nicht verfügbar · Coming Soon|Not available yet · Coming Soon
Karte wählen (1–3) · Drehen: Knopf oder R · Hex antippen|Select a card (1–3) · Rotate: button or R · Tap a hex
`);
HexTranslations.add(`
Stufe 1: Welle 35 besiegen.|Stage 1: defeat wave 35.
Stufe 2 · Zwei Fronten: Welle 35 besiegen.|Stage 2 · Two Fronts: defeat wave 35.
`);
HexTranslations.add(`
Bauplatz gewählt · Strg + Klick: weitere Plätze markieren oder abwählen.|build slot selected · Ctrl + click: select or deselect more slots.
`);
HexTranslations.add(`
Deck ausdünnen (optional)|Thin deck (optional)
`);
HexTranslations.add(`
Rettungsstraße mit zwei offenen Ausgängen. Keine Turmplätze.|Rescue road with two open exits. No tower slots.
`);

HexTranslations.add(`
Pfeilhagel|Arrow Hail
25 % kürzere Nachladezeit und +25 Explosionsradius.|25% shorter reload time and +25 blast radius.
Meisterschütze|Master Marksman
+50 % Schaden und +20 % Reichweite.|+50% damage and +20% range.
Belagerungstitan|Siege Titan
+60 % Schaden und +15 % Reichweite.|+60% damage and +15% range.
Steinlawine|Rock Avalanche
35 % kürzere Nachladezeit.|35% shorter reload time.
Gewitterfront|Storm Front
Vier zusätzliche Kettenziele und +30 Sprungweite.|Four extra chain targets and +30 jump range.
Donnerschlag|Thunder Strike
+70 % Schaden pro Treffer.|+70% damage per hit.
Ewiges Eis|Eternal Ice
40 % geringere Bewegungsgeschwindigkeit innerhalb der Aura.|40% lower movement speed within the aura.
Polarweite|Polar Expanse
+35 % Aura-Reichweite.|+35% aura range.
Weltenbrecher|World Breaker
+50 % Schaden und +30 Explosionsradius.|+50% damage and +30 blast radius.
Minenmeer|Sea of Mines
40 % kürzere Nachladezeit.|40% shorter reload time.
Drachentod|Dragon's Bane
+30 % Schaden und zusätzlich +50 % Bossschaden.|+30% damage and an additional +50% boss damage.
Bolzenorkan|Bolt Hurricane
Sonnenkern|Solar Core
+50 % Schaden und +25 Explosionsradius.|+50% damage and +25 blast radius.
Feuerwalze|Rolling Fire
35 % kürzere Nachladezeit und +10 Explosionsradius.|35% shorter reload time and +10 blast radius.
+30 % Feuerschaden und +30 Explosionsradius.|+30% fire damage and +30 blast radius.
+30 % Wasserschaden, stärkere Verlangsamung und +2 Sekunden Dauer.|+30% water damage, stronger slowing and +2 seconds duration.
+30 % Windschaden, +20 % Reichweite und drei zusätzliche Durchschlagsziele.|+30% wind damage, +20% range and three extra pierced targets.
Seelenheer|Soul Army
Vier zusätzliche Geister gleichzeitig.|Four additional simultaneous spirits.
Seelenherrscher|Soul Sovereign
+50 % Turm- und Geisterschaden und +6 Sekunden Geisterdauer.|+50% tower and spirit damage and +6 seconds spirit lifetime.
+16 Gold je Welle und +2 Gold für jedes weitere Patrizierhaus im Run.|+16 gold per wave and +2 gold for every other Patrician House in the run.
Für den nächsten Run aktivieren|Activate for next run
Aktiv für den nächsten Run|Active for next run
Freigeschaltet · inaktiv|Unlocked · inactive
Meta-Freischaltung · nur ein Pfad je Turmtyp aktiv|Meta unlock · only one active path per tower type
im Arsenal freischalten und für den nächsten Run aktivieren.|unlock in the Arsenal and activate for the next run.
`);

HexTranslations.add(`
Vorlagenname|Preset name
Name speichern|Save name
`);

// Phrase-level agreement: noun-only replacements cannot infer German gender/case.
Object.assign(HexTranslations.de,{"mit diesem Loadout":"mit dieser Turmauswahl","eigenes Loadout":"eigene Turmauswahl","Ausgewogenes Loadout":"Ausgewogene Turmauswahl","des Runs":"des Durchlaufs","eines Runs":"eines Durchlaufs","aktuellen Runs":"aktuellen Durchlaufs","abgeschlossenen Runs":"abgeschlossenen Durchlaufs","75 % Slow in der Killzone.":"75 % Verlangsamung im Kampfbereich.","Schnelle durchschlagende Steine für gerade Killzones.":"Schnelle, durchschlagende Steine für gerade Straßenabschnitte.","Bis zu 3 Ziele, maximal 75 Abstand je Sprung.":"Bis zu 3 Ziele mit maximal 75 Einheiten Abstand je Sprung.","Stärkster Slow zählt; Bossresistenz bleibt.":"Die stärkste Verlangsamung zählt; Bossresistenzen bleiben wirksam.","auf diesem und direkt benachbarten Hexen":"auf diesem Hex und direkt benachbarten Hexen","auf diesem und benachbarten Hexen":"auf diesem Hex und seinen Nachbarhexen","Bau- und Upgrade-Kosten":"Bau- und Verbesserungskosten","inklusive Minen und Geister.":"inklusive Minen- und Geisterschaden.","Wasser-Slow hält 25 % kürzer.":"Verlangsamung durch Wasser wirkt 25 % kürzer.","an seiner Position einen Diener":"an ihrer Position einen Diener","Vor dem Hex-Placement ist der Hex-Bonus vorläufig; er wird nach dem Placement aktualisiert.":"Vor dem Platzieren des Hexes ist der Einkommensbonus vorläufig; danach wird er aktualisiert.","Beide Maps und der gemeinsame Zustand sind für diesen Tab gemerkt.":"Beide Karten und der gemeinsame Spielstand sind für diesen Tab gespeichert.","für nächsten Run":"für den nächsten Run","Für nächsten Run":"Für den nächsten Run","pro Kill":"pro besiegten Gegner","beim Kill":"beim Besiegen"});
HexTranslations.add(`
Auf diesem Hex steht bereits eine Schmiede. Der Schadensbonus ist nicht stapelbar.|This hex already has a Forge. Its damage bonus does not stack.
Auf diesem Hex steht bereits ein Markt. Der Rabatt ist nicht stapelbar.|This hex already has a Market. Its discount does not stack.
Beute +15 Gold · Flucht −10 Gold|Loot +15 gold · Escape −10 gold
`);

HexTranslations.add(`
Rettungshex: Straßen müssen passen. Zwei Straßenenden des neuen Hexes müssen nach außen ins freie Gelände führen. Anschlüsse an vorhandene Hexe zählen nicht als offene Ausgänge.|Rescue hex: roads must match. Two road ends on the new hex must lead out into open terrain. Connections to existing hexes do not count as open exits.
Geldtransport: Besiegen bringt 15 Gold extra. Erreicht er die Basis, verlierst du 10 Gold.|Gold carrier: defeating it earns 15 extra gold. If it reaches the base, you lose 10 gold.
`);

HexTranslations.add(`
Splittergolem|Splinter Golem
Golemsplitter|Golem Shard
Feldheiler|Field Healer
Heiler|Healers
Elementträger|Element Bearer
Zerfällt in zwei kleine Golems. Das Gold verteilt sich auf alle drei.|Splits into two small golems. The gold is divided among all three.
Heilt andere Gegner im kleinen Umkreis alle 3 Sekunden um 5 %. Heiler heilen einander nicht.|Heals other nearby enemies by 5% every 3 seconds. Healers cannot heal each other.
Immun gegen Feuer. Andere Schadensarten wirken normal.|Immune to fire. Other damage types work normally.
Immun gegen Wasser. Andere Schadensarten wirken normal.|Immune to water. Other damage types work normally.
Immun gegen Blitz. Andere Schadensarten wirken normal.|Immune to lightning. Other damage types work normally.
`);

HexTranslations.add(`
Geldtransport: 18 Gold verteilt auf Golem und Splitter. Erreicht der Golem die Basis, verlierst du 10 Gold.|Gold transport: 18 gold shared by the golem and its shards. Lose 10 gold if the golem reaches the base.
regulärer Gegner|regular enemy
(Splittergolem: auf drei Einheiten verteilt)|(Splinter Golem: divided among three units)
Wasserverlangsamung wirkt nicht; Frost-Auren wirken weiterhin.|Water slows have no effect; frost auras still work.
`);

HexTranslations.add(`
Fahre über ein Symbol oder tippe drauf, um die Effekte der Biome zu erfahren.|Hover over a symbol or tap it to learn about the biome effects.
Turm im geöffneten Baumenü auswählen|Select a tower in the open build menu
Rettungshex: Straßen müssen passen. Genau ein Straßenende des neuen Hexes muss nach außen ins freie Gelände führen.|Rescue tile: Roads must match. Exactly one road end of the new tile must lead outside into open terrain.
`);

HexTranslations.add(`
Server wird geprüft …|Checking server …
Server erreichbar|Server reachable
Server nicht erreichbar|Server unreachable
Server in Wartung|Server under maintenance
HTTP-Antwortzeit|HTTP response time
`);

HexTranslations.add(`
Gemeinsam starten|Start together
Deine Festung|Your fortress
Meine Karte|My map
Partnerkarte · Nur anschauen|Partner map · View only
Hier Partner-Portal reservieren|Reserve partner portal here
Ausgewählten Turm als Verstärkung|Send selected tower as reinforcement
Portal aufheben|Clear portal
Verstärkung abwählen|Clear reinforcement
Partie verlassen|Leave match
Wirklich verlassen? Partie endet für beide.|Really leave? This ends the match for both players.
Bereitschaft zurücknehmen|Cancel ready
Bereit für die Welle (Leertaste)|Ready for the wave (Space)
Geschenk für den Partner wählen|Choose a gift for your partner
Geschenk für deinen Partner|Gift for your partner
Wähle eine Karte oder Gold für deinen Partner.|Choose a card or gold for your partner.
Gemeinsamer Durchlauf beendet|Co-op run finished
Noch eine gemeinsame Partie|Play together again
Neustart-Zustimmung zurücknehmen|Cancel rematch vote
Zur Lobby|Back to lobby
Partner ist bereit|Partner is ready
Partnerverstärkung ist unterwegs!|Partner reinforcements are on their way!
Deine Verstärkung fliegt zum Partner!|Your reinforcement is flying to your partner!
Portal reserviert.|Portal reserved.
Nicht bereit|Not ready
Wartet auf Beitritt …|Waiting for partner …
Dein Partner|Your partner
Lobby verlassen|Leave lobby
Warte auf deinen Partner|Waiting for your partner
Gemeinsame Welle läuft|Co-op wave in progress
Nach einer verlustfreien Welle hilft eine Kopie beim Partner. Sein Portal muss frei sein. Alle 5 Wellen wählt ihr ein Geschenk füreinander.|After a wave without leaks, a copy helps your partner. Their portal must be free. Every 5 waves, you choose gifts for each other.
`);
HexTranslations.add(`
◆ schaltet dauerhaft frei · 🪙 Gold bezahlt den Ausbau im Run|◆ unlocks permanently · 🪙 gold pays for upgrades during a run
Forschungsbäume|Research trees
Freischaltung bezahlbar|Unlock affordable
Pro Turm ist höchstens ein Ultimate aktiv. Wechseln kostet keine Diamanten.|Each tower can have at most one active ultimate. Switching costs no diamonds.
Gebäude sind immer verfügbar. Der Spezialausbau wird dauerhaft freigeschaltet.|Buildings are always available. The special upgrade is unlocked permanently.
Schalte zuerst den Turm frei, um seine Ausbaupfade zu nutzen.|Unlock the tower first to use its upgrade paths.
Spezial freigeschaltet|Special unlocked
Spezial gesperrt|Special locked
Immer verfügbar|Always available
nach Stufe 3|after level 3
Ultimate|Ultimate
Spezial|Special
Pfad|Path
Bau:|Build:
`);
HexTranslations.add(`
Account (Beta)|Account (beta)
Mit einem Account sicherst du deinen Spielstand auf dem Server und lädst ihn auf einem anderen Gerät wieder. Die Funktion ist noch im Test.|With an account you can back up your save on the server and load it on another device. This feature is still in testing.
Benutzername|Username
Passwort|Password
Einloggen …|Logging in …
Einloggen|Log in
Account erstellen|Create account
Account wird erstellt …|Creating account …
Account erstellt.|Account created.
Eingeloggt als|Logged in as
Ausgeloggt.|Logged out.
Ausloggen|Log out
Registrierung fehlgeschlagen|Registration failed
Login fehlgeschlagen|Login failed
Auf Server speichern|Save to server
Vom Server laden|Load from server
Speichere auf dem Server …|Saving to server …
Spielstand auf dem Server gesichert.|Save stored on the server.
Speichern fehlgeschlagen|Saving failed
Lade vom Server …|Loading from server …
Auf dem Server liegt noch kein Spielstand für diesen Account.|There is no save on the server for this account yet.
Spielstand vom Server geladen. Dein lokales Profil wurde ersetzt.|Save loaded from the server. Your local profile was replaced.
Laden fehlgeschlagen|Loading failed
Bitte zuerst den laufenden Run beenden.|Please finish the current run first.
`);
HexTranslations.add(`
Grafikstil|Graphics style
Sakura-Edition|Sakura Edition
Halloween-Edition|Halloween Edition
`);
HexTranslations.add(`
Zen-Sommer|Zen Summer
Glyzinienregen|Wisteria Rain
Momiji-Herbst|Momiji Autumn
`);

HexTranslations.add(`
Einsteigerhinweise anzeigen|Show beginner tips
Mini-Tutorial, Tastenbelegungs-Hinweis und Hinweise zu neu entdeckten Biomen. Spielregeln und wichtige Spielmeldungen bleiben verfügbar.|Mini tutorial, hotkey tip and newly discovered biome tips. Rules and important game messages remain available.
Nur Gegner in Reichweite zählen. Bei Gleichstand oder fehlenden Zielen entscheidet die nächste Priorität. Basisnähe meint den verbleibenden Straßenweg. Kettenblitze springen danach zum nächsten Gegner; durchschlagende Geschosse treffen entlang ihrer Flugbahn.|Only enemies in range count. Ties or missing targets use the next priority. Base proximity means remaining road distance. Chain lightning then jumps to the nearest enemy; piercing shots hit along their flight path.
Werte gelten ohne Biom-, Hex- und Gebäudeboni. Vergleich jeweils mit der vorherigen Stufe.|Values exclude biome, tile and building bonuses. Each comparison is against the previous tier.
Aura-Reichweite|Aura range
Nachladezeit|Reload time
Zeit je Mine|Time per mine
Explosionsradius|Blast radius
Blitzziele|Lightning targets
Blitz-Sprungweite|Lightning jump range
Durchschlagsziele|Piercing targets
Verlangsamungsdauer|Slow duration
Aura-Verlangsamung|Aura slow
Treffer-Verlangsamung|Hit slow
Geisterschaden pro Sekunde|Spirit damage per second
Geisterlebensdauer|Spirit lifetime
Bossschaden-Multiplikator|Boss damage multiplier
Turmschaden-Bonus|Tower damage bonus
Turm-Rabatt|Tower discount
Zusätzlich versorgbare Wunschhexe|Additional chosen tiles supplied
Ein Kill zählt für den Turm, der den tödlichen Treffer verursacht; Minen und Geister zählen zum Ursprungsturm.|A kill belongs to the tower that deals the final blow; mines and spirits count towards their source tower.
`);

Object.assign(HexTranslations.en,{
'Krähenfüße':'Caltrops','Klebeharz':'Sticky resin','Verbrauchshilfen':'Consumables','Hilfen':'Support',
'20 Spitzen × 5 Schaden. Reste verfallen am Wellenende.':'20 spikes × 5 damage. Unused spikes expire at wave end.',
'Die nächsten 12 Gegner: 35 % langsamer für 4 Sekunden. Bis Wellenende.':'The next 12 enemies: 35% slower for 4 seconds. Until wave end.',
'+50 % Angriffsgeschwindigkeit für 12 Sekunden. Bis Wellenende; nicht stapelbar.':'+50% attack speed for 12 seconds. Until wave end; does not stack.',
'Die letzte Garnison':'The Last Garrison','Die Garnison hält stand!':'The garrison holds!',
'Feste Karte · Budget einteilen · drei Angriffe abwehren':'Fixed map · Manage your budget · Survive three assaults',
'Nur für diese Welle. In der Bauphase: für die nächste Welle.':'For this wave only. During preparation: for the next wave.',
'Krähenfüße · 25 Gold':'Caltrops · 25 gold','Klebeharz · 30 Gold':'Sticky resin · 30 gold','Überladung · 40 Gold':'Overcharge · 40 gold',
'20 Spitzen × 5 Schaden · Position auf der Straße wählen':'20 spikes × 5 damage · Choose a position on the road','12 Gegner: −35 % Tempo für 4 Sekunden':'12 enemies: −35% speed for 4 seconds','Turm: +50 % Angriffstempo für 12 Sekunden':'Tower: +50% attack speed for 12 seconds',
'Heutige Mission starten':"Start today's mission"
});
HexTranslations.add(`
Dein Account|Your account
Sichere deinen Fortschritt und spiele auf jedem Gerät weiter.|Back up your progress and keep playing on any device.
Fortschritt sicher auf dem Server|Progress stored safely on the server
Auf jedem Gerät weiterspielen|Continue on any device
Automatisch nach jedem Spiel gesichert|Saved automatically after every game
Anmelden oder registrieren|Sign in or register
Anmelden|Sign in
Registrieren|Register
Passwort anzeigen|Show password
Passwort verbergen|Hide password
Nach der Anmeldung wird dein gespeicherter Spielstand automatisch geladen.|After signing in, your saved progress is loaded automatically.
Benutzername 3–20 Zeichen, Passwort mindestens 8 Zeichen. Dein aktueller Fortschritt wird übernommen.|Username 3–20 characters, password at least 8 characters. Your current progress is carried over.
Angemeldet als|Signed in as
Wird automatisch nach jedem Spiel gesichert.|Saved automatically after every game.
Nicht gesicherte Änderungen – werden beim nächsten Mal übertragen.|Unsaved changes – they will be uploaded next time.
Beste Welle|Best wave
Letzte Sicherung|Last backup
gerade eben|just now
☁ Jetzt sichern|☁ Save now
⇩ Vom Server laden|⇩ Load from server
Abmelden|Sign out
Hallo,|Hello,
Dein Fortschritt wird in deinem Account gesichert.|Your progress is backed up to your account.
Bitte Benutzername und Passwort eingeben.|Please enter username and password.
Anmelden …|Signing in …
Account wird erstellt …|Creating account …
Account erstellt. Dein Fortschritt ist jetzt gesichert.|Account created. Your progress is now backed up.
Account erstellt. Der Spielstand wird beim nächsten Mal gesichert.|Account created. Your progress will be backed up next time.
Angemeldet. Spielstand wird geladen …|Signed in. Loading your progress …
Willkommen,|Welcome,
Willkommen zurück,|Welcome back,
Dein aktueller Fortschritt wurde in deinem Account gesichert.|Your current progress was backed up to your account.
Dein Spielstand wurde geladen.|Your progress was loaded.
Angemeldet. Dein Spielstand wird nach dem laufenden Spiel übernommen.|Signed in. Your progress will be applied after the current game.
Registrierung fehlgeschlagen:|Registration failed:
Anmeldung fehlgeschlagen:|Sign-in failed:
Abgemeldet. Dein Spielstand bleibt auf diesem Gerät erhalten.|Signed out. Your progress stays on this device.
Spielstand wird gesichert …|Saving progress …
Spielstand gesichert.|Progress saved.
Sichern fehlgeschlagen. Bitte Verbindung prüfen.|Saving failed. Please check your connection.
Spielstand wird geladen …|Loading progress …
Der Spielstand wird nach dem laufenden Spiel übernommen.|Your progress will be applied after the current game.
Spielstand vom Server geladen.|Progress loaded from the server.
Tipp: Mit einem Account wird dein Fortschritt automatisch gesichert.|Tip: With an account, your progress is backed up automatically.
☁ Spielstand wird gesichert …|☁ Saving progress …
☁ Spielstand in deinem Account gesichert.|☁ Progress backed up to your account.
☁ Gerade offline – wird beim nächsten Mal gesichert.|☁ Offline right now – it will be backed up next time.
Account schließen (Escape)|Close account (Escape)
`);

HexTranslations.add(`
Starte mit Bogenschütze und Katapult. Neue Türme kommen nach Welle 5, 10 und 15 dazu.|Start with Archer and Catapult. New towers join after waves 5, 10 and 15.
Ich kenne das Spiel – Einführung überspringen|I know the game – skip introduction
Neuer Turm freigeschaltet:|New tower unlocked:
Verlangsamt Gegner in seiner Nähe.|Slows nearby enemies.
Blitze springen zwischen Gegnern und sind besonders stark gegen Magieresistenz.|Lightning jumps between enemies and is especially effective against magic resistance.
Legt explosive Minen auf die Straße.|Places explosive mines on the road.
Neues Biom: Dünenmeer. Gegner bewegen sich hier langsamer; Türme haben weniger Reichweite. Tippe auf das Sonnensymbol für Details.|New biome: Dune Sea. Enemies move slower here; towers have reduced range. Tap the sun icon for details.
Überlebe Welle 35 im Standardspiel, um eigene Lobbys zu erstellen. Einladungen kannst du jederzeit annehmen.|Survive wave 35 in Standard to create your own lobbies. You can accept invitations at any time.
`);

HexTranslations.add(`
Einführung überspringen · vollständige Welt ab nächstem Durchlauf|Skip introduction · full world from the next run
Welle 35 geschafft! Zwei Fronten, Festungsbauer, Tagesherausforderung und Duo sind jetzt freigeschaltet.|Wave 35 survived! Two Fronts, Fortress Builder, Daily Challenge and Duo are now unlocked.
`);

HexTranslations.add(`
Patch Notes · Was ist neu?|Patch notes · What's new?
Erstspieler-Test starten|Start first-player test
Erstspieler-Test neu starten|Restart first-player test
Zurück zu meinem Spielstand|Return to my progress
Erstspieler-Test beenden · zum echten Spielstand|Exit first-player test · return to real progress
Erstspieler-Test · separater Spielstand|First-player test · separate progress
Änderungen werden geladen …|Loading changes …
In Vorbereitung|In preparation
Noch nicht veröffentlicht|Not yet released
Patch Notes konnten nicht geladen werden. Bitte später erneut öffnen.|Could not load patch notes. Please try again later.
`);

HexTranslations.add(`
🏆 Bestenliste|🏆 Leaderboard
Bestenliste|Leaderboard
Sortieren nach|Sort by
Beste Welle|Best wave
Rang|Rank
Bestenliste wird geladen …|Loading leaderboard …
Noch keine Einträge in dieser Kategorie.|No entries in this category yet.
Bestenliste konnte nicht geladen werden. Bitte später erneut öffnen.|Could not load the leaderboard. Please try again later.
Top 100 aller Accounts mit Cloud-Spielstand. Ungeprüft: Die Werte stammen aus hochgeladenen Spielständen.|Top 100 of all accounts with a cloud save. Unverified: values come from uploaded saves.
Schließen · Esc|Close · Esc
`);

// Leaderboard modes and complete release history.
HexTranslations.add(`
Eine Front|One Front
Zwei Fronten|Two Fronts
Duo-Mode|Duo Mode
Für diesen Modus sind noch keine Bestenlistendaten verfügbar.|No leaderboard data is available for this mode yet.
Eine Front: Top 100 aus gespeicherten Account-Spielständen (ungeprüft). Weitere Modi folgen, sobald deren Daten verfügbar sind.|One Front: top 100 from saved account progress (unverified). Other modes will follow when their data becomes available.
Weiterspielen, faire Neustarts und bessere Bedienung|Resume runs, fair restarts and improved controls
Nach jeder abgeschlossenen Solo-Welle wird ein Zwischenstand lokal gespeichert. Weiterspielen setzt den Durchlauf auch nach einem Neuladen fort, einschließlich offener Belohnungen.|After every completed solo wave, a checkpoint is saved locally. Continue resumes the run even after reloading, including pending rewards.
Vor einem Neustart erscheint eine Bestätigung mit erreichter Welle und genauer Diamantenauszahlung. Bestätigte Abbrüche werden regulär abgerechnet, auch während der Einführung und bei gespeicherten Durchläufen.|Before restarting, a confirmation shows the wave reached and the exact diamond payout. Confirmed abandoned runs receive their normal rewards, including during the introduction and for saved runs.
Lautstärke und Stummschaltung bleiben nach dem Schließen des Browsers erhalten. Angemeldet werden Audio-Einstellungen und Zwischenstände zusätzlich zur Account-Sicherung übertragen; die lokale Sicherung bleibt erhalten.|Volume and mute settings persist after closing the browser. When logged in, audio settings and checkpoints are also included in account backups; the local backup is retained.
Das Arsenal ist bereits nach dem ersten beendeten Durchlauf verfügbar, auch nach einer Niederlage.|The Arsenal is available after your first finished run, including a defeat.
Die Bestenliste lässt sich über alle Spaltenüberschriften auf- und absteigend sortieren. Pfeile zeigen die Richtung; Kategorien wechseln ohne kurz eingeblendete Lademeldung oder Zwischenumsortierung.|The leaderboard can be sorted in both directions using any column heading. Arrows indicate the direction; switching categories no longer briefly shows a loading message or an intermediate order.
Vier Buttons wechseln zwischen Einer Front, Zwei Fronten, Täglicher Herausforderung und Duo. Eine Front öffnet standardmäßig mit den vorhandenen Daten; Modi ohne eigene Daten bleiben leer.|Four buttons switch between One Front, Two Fronts, Daily Challenge and Duo. One Front opens by default with the available data; modes without their own data remain empty.
Krähenfüße, Klebeharz und Überladung bleiben nach dem Einsatz ausgewählt, sodass mehrere Einsätze hintereinander möglich sind. Der Hinweis bleibt bis zum Abbruch sichtbar und nennt Escape sowie Rechtsklick.|Caltrops, Sticky Resin and Overload remain selected after use, allowing repeated placement. The hint stays visible until cancelled and lists Escape and right-click.
Der Schaden des Flammenturms ist in allen Ausbaustufen um 5 % reduziert.|Flame Tower damage has been reduced by 5% at every upgrade level.
Der mobile Hilfen-Tab schließt sich beim zweiten Antippen wieder.|The mobile consumables tab closes when tapped a second time.
Bei abgeschalteten Einsteigerhinweisen erscheint beim Start keine leere Hinweisbox mehr.|With beginner hints disabled, an empty hint box no longer appears at the start.
Rettungshexe dürfen keine zusätzlichen Straßenenden in eingeschlossene Hohlräume führen.|Rescue hexes cannot lead additional road ends into enclosed pockets.
Öffentliche Bestenliste im Hauptmenü|Public leaderboard in the main menu
Die Bestenliste öffnet sich jetzt direkt im Hauptmenü und zeigt die Top 100 aller Accounts mit Cloud-Spielstand: beste Welle, Durchläufe, besiegte Gegner, Bosse und Diamanten. Oben lässt sich die Sortierung wechseln; angemeldet ist der eigene Eintrag hervorgehoben. Die Werte stammen aus hochgeladenen Spielständen und sind ungeprüft.|The leaderboard now opens directly in the main menu and shows the top 100 accounts with cloud saves: best wave, runs, enemies defeated, bosses and diamonds. Sorting can be changed at the top; your entry is highlighted when logged in. Values come from uploaded saves and are unverified.
Die Bastionen der Festung, auf denen die Basis-Türme stehen, sind niedriger. Türme auf der Basis stehen dadurch näher am Boden.|The fortress bastions supporting base towers are lower. Towers on the base now stand closer to the ground.
Auf der Langen Straße liegen die beiden Turmplätze jetzt weiter in der Mitte, in den Buchten der Straße, statt am Rand des Hex-Felds.|On the Long Road, both tower slots are now closer to the middle, in the bends of the road, rather than at the edge of the hex.
Übersichtlichere Bedienung auf Handy und Tablet|Clearer controls on phones and tablets
Die Bedienoberfläche ist auf Handys, Tablets und mittleren Fenstergrößen übersichtlicher gruppiert. Hinweise zu neu entdeckten Biomen überlagern die übrigen Meldungen nicht mehr.|The interface is grouped more clearly on phones, tablets and medium-sized windows. Newly discovered biome hints no longer overlap other messages.
Die Kartenauswahl beim Erweitern des Decks ist auf kleinen Bildschirmen kompakter. Turm- und Gebäudeplätze werden mit Zahl und Icon angezeigt; Beschriftungen bleiben erhalten, solange sie in die Karte passen.|Deck expansion cards are more compact on small screens. Tower and building slots use a number and an icon; labels remain visible while they fit inside the card.
Auf kleinen Bildschirmen schließt sich das Turmbaumenü nach erfolgreichem Bau automatisch. Goldgewinne sind auch bei geschlossenem Werte-Tab sofort sichtbar.|On small screens, the tower building menu closes automatically after a successful build. Gold gains are immediately visible even when the stats tab is closed.
Auf Touch-Geräten entfallen Hinweise auf Leertaste und R bei Wellenstart, Drehen und Kartenplatzierung.|On touch devices, wave start, rotation and card placement no longer show Space or R keyboard hints.
Der Platzierungshinweis bleibt beim Verschieben und Zoomen der Karte unter dem ausgewählten Hex.|The placement hint stays below the selected hex when panning and zooming the map.
Die Basis zeigt bei einem bezahlbaren Ausbau denselben Upgrademarker wie Türme.|The base shows the same upgrade marker as towers when an upgrade is affordable.
Die Angriffsfokus-Auswahl behält ihre Überschrift, verzichtet aber auf den längeren Erklärungstext. Im Turmmenü kennzeichnet ein Icon das Biom.|The targeting selector keeps its heading but drops the longer explanation. A biome icon appears in the tower menu.
Die Bestenlistenseite ist vom Hauptmenü erreichbar. Die automatische Wertung von Durchläufen ist noch nicht freigeschaltet.|The leaderboard page is accessible from the main menu. Automatic run ranking is not enabled yet.
Turmplätze auf der Festung|Tower slots on the fortress
Die Turmplätze auf der Basis haben eigene Bastionen für alle drei Festungen, in der normalen und der Sakura-Edition. Türme stehen jetzt sichtbar auf diesen Bastionen statt auf grauen Platzhaltern.|Base tower slots have their own bastions for all three fortresses, in both the normal and Sakura editions. Towers now visibly stand on these bastions instead of grey placeholders.
Die Basis-Turmplätze liegen an neuen Stellen im Nordwesten, Südwesten, Norden und Süden der Festung, abseits der Straße nach Osten.|Base tower slots have new positions to the northwest, southwest, north and south of the fortress, away from the road to the east.
Die Festungsmodelle wurden überarbeitet: Deko und Mauern des Festungsbauers lassen die Turmplätze frei.|The fortress models have been revised: decorations and walls on the Fortress Builder's base leave the tower slots clear.
Mehr Tempo und präzisere Bedienung|More speed and more precise controls
Das Grundtempo ist in Solo und Duo verdoppelt: 1× entspricht dem bisherigen 2×; alle weiteren Tempostufen bauen darauf auf.|The base speed in solo and Duo has doubled: 1× matches the previous 2× speed; all other speed settings scale from this.
Waffen-Upgrades der Basis schalten zusätzlich Turmplätze frei: bis zu zwei bei Standardfestung und Händlerstadt, bis zu vier beim Festungsbauer.|Base weapon upgrades unlock additional tower slots: up to two for the standard fortress and Merchant City, and up to four for the Fortress Builder.
Krähenfüße und Klebeharz lassen sich frei entlang der Straßen und mehrfach auf demselben Hex platzieren. Ihre Wirkung gilt an der gewählten Position.|Caltrops and Sticky Resin can be placed freely along roads, including multiple times on the same hex. Their effects apply at the chosen position.
Verbrauchshilfen zeigen beim Platzieren eine Vorschau am Mauszeiger und markieren gültige Ziele. Straßen werden hervorgehoben, bei Überladung geeignete Türme. Rechtsklick bricht die Auswahl wie Escape ab.|Consumables show a cursor preview and highlight valid targets during placement. Roads are highlighted, or eligible towers for Overload. Right-click cancels selection just like Escape.
Beschriftungen über platzierten Krähenfüßen und Klebeharz entfallen. Die Turmleiste zeigt die Preise ohne zusätzliches Münzsymbol.|Labels above placed Caltrops and Sticky Resin have been removed. The tower bar shows prices without an extra coin icon.
Bogenschützen zielen standardmäßig zuerst auf Gegner, die der Basis am nächsten sind. Eigene Fokus-Einstellungen bleiben erhalten.|Archers target enemies closest to the base by default. Custom targeting settings are preserved.
Präzisere Klickflächen für Türme, Gebäude und Bauplätze erleichtern die Auswahl nah beieinanderliegender Ziele. Die Basis ist nur noch im mittleren Kreis anklickbar.|More precise click areas for towers, buildings and construction slots make nearby targets easier to select. The base can only be clicked in its central circle.
Der Mauszeiger zeigt nach dem Drehen einer Hexkarte sofort an, ob sie platziert werden kann. Der Drehen-Knopf zeigt die Taste R an.|After rotating a hex card, the cursor immediately indicates whether it can be placed. The Rotate button shows the R shortcut.
Aufgebrauchte Rüstungs- und Magieschutzleisten verschwinden. Die Lebensanzeige ist kompakter und ihr Text vertikal zentriert; die Sprachauswahl ist gleichmäßiger ausgerichtet.|Depleted armor and magic shield bars disappear. The health display is more compact with vertically centered text; the language selector is more evenly aligned.
Die Konto-Aktionen heißen jetzt Spielstand hochladen und Spielstand herunterladen. Der zusätzliche Spielstand-Knopf im Hauptmenü entfällt.|Account actions are now called Upload save and Download save. The extra save button in the main menu has been removed.
Beim Deck-Ausdünnen bleibt nur der fixierte Knopf Keine Karte entfernen oben rechts sichtbar.|When thinning the deck, only the fixed Remove no card button at the top right remains visible.
Wartung|Maintenance
Fehlerbehebungen in der Serververwaltung. Am Spiel selbst ändert sich nichts.|Server administration fixes. Gameplay is unchanged.
Anonyme Aufrufzählung|Anonymous visit counting
Die Seite zählt Aufrufe von Spiel und Duo-Lobby jetzt anonym, damit wir sehen, wann und wie viel gespielt wird. Dafür werden keine Cookies gesetzt und keine IP-Adressen gespeichert; das Spiel läuft unverändert, auch wenn das Zählen fehlschlägt.|The site now counts game and Duo lobby visits anonymously so we can see when and how much people play. No cookies are set and no IP addresses are stored; the game continues unchanged even if counting fails.
Flüssigeres Duo|Smoother Duo
Duo: Kämpfe laufen deutlich flüssiger: Gegner gleiten zwischen den Server-Updates, statt zu ruckeln, und Updates kommen gleichmäßiger an.|Duo combat is much smoother: enemies glide between server updates instead of jumping, and updates arrive more evenly.
Duo: Schnell hintereinander ausgeführte Aktionen werden nacheinander abgearbeitet, statt mit »Bitte auf die Serverbestätigung warten« abgelehnt zu werden.|Duo: Actions performed in quick succession are processed in order instead of being rejected with a request to wait for server confirmation.
Duo: Der Knopf für die Partnerkarte sitzt jetzt in der Teamleiste und überdeckt das Duo-Menü oben links nicht mehr.|Duo: The partner map button now sits in the team bar and no longer covers the Duo menu at the top left.
Ein leichterer Einstieg|An easier start
Neue Spieler starten direkt mit Bogenschütze und Katapult. Frostturm, Kettenblitz und Minenleger kommen nach Welle 5, 10 und 15 in den laufenden Durchlauf.|New players start with Archer and Catapult. Frost Tower, Chain Lightning and Mine Layer join the current run after waves 5, 10 and 15.
Zunächst gibt es nur Grasland. Nach Welle 20 kann Dünenmeer entdeckt werden. Weniger Event-Felder und Hinweise machen den Einstieg übersichtlicher.|Initially, only Grassland is available. After wave 20, the Dune Sea can be discovered. Fewer event tiles and hints make the introduction clearer.
Nach geschaffter Welle 35 werden Tagesherausforderung und Duo freigeschaltet. Duo-Einladungen funktionieren jederzeit. Bestehende Spielstände behalten ihren Zugang.|Daily Challenge and Duo unlock after completing wave 35. Duo invitations work at any time. Existing saves retain access.
Die Einführung lässt sich überspringen; gelernter Fortschritt wird gespeichert.|The introduction can be skipped; learned progress is saved.
Neue Standarddurchläufe starten mit Grafikstil Normal. Sakura bleibt während des Spiels in den Einstellungen auswählbar.|New standard runs start with the Normal graphics style. Sakura remains available in the in-game settings.
Patch Notes sind jetzt im Hauptmenü nachlesbar.|Patch notes can now be read in the main menu.
Duo: Neue Teamleiste im Spiel zeigt jederzeit, was du und dein Partner gerade tun, und sagt dir, was als Nächstes zu tun ist – oder warum gerade nichts geht.|Duo: A new in-game team bar always shows what you and your partner are doing and explains what to do next, or why an action is currently unavailable.
Duo: Die Lobby wurde neu gestaltet, mit Schritt-für-Schritt-Anzeige, Spielerplätzen und einer kurzen Regelübersicht. Das Duo-Menü im Spiel ist übersichtlicher gegliedert und erklärt Portal und Verstärkung verständlicher.|Duo: The lobby has been redesigned with step-by-step guidance, player slots and a short rules overview. The in-game Duo menu is organized more clearly and explains portals and reinforcements.
Duo: Einladungslinks können jetzt vollständig in das Code-Feld eingefügt werden; zuvor wurde der Link abgeschnitten.|Duo: Full invitation links can now be pasted into the code field; previously, the link was truncated.
Duo: Abgelaufene oder verlassene Partien hängen nicht mehr in einer Endlosschleife, sondern führen mit Hinweis zurück zur Lobby.|Duo: Expired or abandoned matches no longer get stuck in an endless loop and instead return to the lobby with an explanation.
Duo: Ein Tab im Hintergrund pausiert die Partie nicht mehr für beide, solange die Verbindung steht. Abgerissene Verbindungen werden schneller erkannt.|Duo: A background tab no longer pauses the match for both players while the connection is intact. Lost connections are detected faster.
Duo: Deutlich weniger Datenverbrauch während der Partie.|Duo: Significantly less data usage during matches.
`);
HexTranslations.add(`
Kein gültiger Rettungstunnel verfügbar.|No valid rescue tunnel is available.
`);
HexTranslations.add(`
Schildknecht|Shieldbearer
Maskenläufer|Masked Runner
Donnerkröte|Thunder Toad
Häutungskäfer|Molting Beetle
Pechschnecke|Tar Snail
Pilzkoloss|Mushroom Colossus
Rammbockkäfer|Ram Beetle
Der Schild blockiert drei Treffer vollständig, auch Flächenschaden. Jeder Treffer entfernt nur einen Schildstack.|The shield completely blocks three hits, including area damage. Each hit removes only one shield stack.
Schleicht drei Sekunden und sprintet danach eine Sekunde.|Sneaks for three seconds, then sprints for one second.
Bewegt sich nur springend. Kann gelegentlich auf eine nahe Straße im Nachbarhex abkürzen. Verlangsamung verkürzt die Sprünge.|Moves only by hopping. Occasionally shortcuts to a nearby road on an adjacent hex. Slows shorten its jumps.
Nach dem Panzerbruch dauerhaft 40 % schneller.|Permanently 40% faster after its armor breaks.
Ihre Pechspur schützt andere Gegner: 20 % weniger Schaden, ohne Verlangsamung. Feuer entzündet das Pech.|Its tar trail protects other enemies: 20% less damage, without slowing them. Fire ignites the tar.
Hinterlässt beim Tod vier Sekunden Sporen. Gegner darin können von Türmen nicht anvisiert werden.|Leaves spores for four seconds on death. Towers cannot target enemies inside.
Beschleunigt auf Geraden; Kurven und Verlangsamungen bremsen. Bei vollem Tempo drei Basisschaden.|Accelerates on straights; turns and slows reduce momentum. Deals three base damage at full speed.
`);

HexTranslations.add(`
Neue Gegner, Turmausbau und zuverlässige Kartenrettung|New enemies, tower upgrades and reliable map rescue
Sechs neue Gegner mit animierten 3D-Modellen bereichern die Wellen: Schildknecht ab Welle 6, Donnerkröte ab 13, Häutungskäfer ab 17, Pechschnecke ab 21, Pilzkoloss ab 28 und Rammbockkäfer ab 38.|Six new enemies with animated 3D models join the waves: Shieldbearer from wave 6, Thunder Toad from 13, Molting Beetle from 17, Tar Snail from 21, Mushroom Colossus from 28 and Ram Beetle from 38.
Der Schildknecht blockiert drei direkte Treffer und zeigt den Zustand seines Schilds. Der Häutungskäfer wird nach dem Verlust seiner Rüstung schneller.|The Shieldbearer blocks three direct hits and visibly shows shield damage. The Molting Beetle speeds up after losing its armor.
Die Donnerkröte bewegt sich durch Sprünge und kann gelegentlich eine Abkürzung auf eine nahe Straße im Nachbarhex nehmen. Der Rammbockkäfer beschleunigt nur auf geraden Strecken.|The Thunder Toad moves by hopping and occasionally shortcuts to a nearby road on an adjacent hex. The Ram Beetle only accelerates on straight roads.
Die Pechschnecke ist besonders langsam und widerstandsfähig. Ihre Pechspur liegt auf der Straße und verlangsamt andere Gegner um 45 %. Feuer kann die Spur entzünden.|The Tar Snail is extremely slow and durable. Its ground-level tar trail slows other enemies by 45%. Fire can ignite the trail.
Der Pilzkoloss hinterlässt beim Tod vier Sekunden lang eine Sporenwolke. Türme können Gegner darin nicht anvisieren; außerhalb sind sie sofort wieder sichtbar. Flächenschaden und Fallen wirken weiterhin.|The Mushroom Colossus leaves a spore cloud for four seconds on death. Towers cannot target enemies inside; they become visible again immediately after leaving. Area damage and traps still work.
Der Turmausbau zeigt die Upgrade-Wege übersichtlich nebeneinander. Aktuelle Werte, nächste Verbesserungen und Vergleiche sind leichter zugänglich.|Tower upgrades show upgrade paths side by side. Current stats, next upgrades and comparisons are easier to access.
Beim Entfernen einer Deckkarte wird zunächst eine Bestätigung direkt auf der unscharfen Karte angezeigt. Erst ein zweiter Klick entfernt eine Kopie; die Auswahl einer anderen Karte setzt die Bestätigung zurück.|Removing a deck card first displays a confirmation over the blurred card. A second click removes one copy; selecting another card resets confirmation.
Fehlende Karten im Nachzieh- und Ablagestapel werden wiederhergestellt, damit das bestehende Deck weiter nutzbar bleibt.|Missing cards in the draw and discard piles are restored so the existing deck remains usable.
Die Rettungstunnel-Aktion bleibt während der Bauphase erreichbar und verschwindet nicht mehr zusammen mit dem Hinweis. Ein gebauter Tunnel wird direkt im Zwischenstand gesichert.|The rescue tunnel action remains available during the build phase instead of disappearing with the notification. A built tunnel is saved immediately in the checkpoint.
Die große Duo-Anleitung wird nach einigen Sekunden eingeklappt; wichtige Warnungen bleiben sichtbar. Englische Bestenlisten-Beschriftungen und Patchnotes wurden ergänzt.|The large Duo guidance panel collapses after a few seconds; important warnings remain visible. English leaderboard labels and patch notes have been added.
`);

HexTranslations.add(`
Gespeicherte Einstellungen und bessere Touch-Bedienung|Saved preferences and improved touch controls
Freie Bauplätze, Einsteigerhinweise, Raster, Upgrade-Markierungen, automatischer Wellenstart und Mehrfachauswahl bleiben nach einem Neuladen erhalten. Zusammen mit Tempo, Sprache und Grafikstil werden sie in die Account-Sicherung aufgenommen und beim Laden übernommen.|Free build slots, beginner hints, grid, upgrade markers, automatic wave start and multi-selection persist after reloading. Along with speed, language and visual style, they are included in account saves and restored when loading.
Der gewählte Grafikstil bleibt auch beim Start eines neuen normalen Durchlaufs erhalten.|The selected visual style is retained when starting a new normal run.
Krähenfüße skalieren ihren Schaden mit der Welle. Klebeharz erfasst später mehr Gegner und wirkt länger; Überladung hält bis zu 24 Sekunden. Die Preise bleiben gleich und das Menü zeigt die aktuellen Werte.|Caltrop damage scales with the wave. Glue Resin affects more enemies and lasts longer in later waves; Overload lasts up to 24 seconds. Prices remain unchanged and the menu shows current values.
Auf Touch-Geräten kann der Tipp auf einen Bauplatz nicht gleichzeitig einen Turm kaufen. Die Turmauswahl benötigt einen eigenen neuen Tipp.|On touch devices, tapping a build slot cannot also purchase a tower. Choosing a tower requires a separate new tap.
Die Zusatzhex-Auswahl von Fernschmiede und Handelsnetz wird beim Wellenende geschlossen, damit sie die folgende Kartenplatzierung nicht mehr überlagert. Bereits zugewiesene Gebäude-Ziele bleiben erhalten.|Remote Forge and Trade Network target selection closes at the end of a wave so it no longer interferes with the next card placement. Previously assigned building targets are retained.
Die Sound-Umschaltung und Spielregeln entfallen im Hauptmenü. Sound-Einstellungen und Regeln bleiben im Spiel erreichbar.|The sound toggle and game rules have been removed from the main menu. Sound settings and rules remain accessible in-game.
`);

HexTranslations.add(`
Klare Schutzschichten und sichtbare Upgrades|Clear protection layers and visible upgrades
Angriffe bauen zuerst Magieresistenz, dann Rüstung und zuletzt Leben ab. Überschüssiger Schaden trifft die jeweils nächste Schicht.|Attacks deplete magic protection first, then armor, then health. Excess damage carries over to the next layer.
Eisenkoloss, Sturmjäger und Seelenmatriarchin behalten in allen Biomen ihre Bossgestalt und erhalten passende Aufsätze. Biom-Wächter behalten ihre eigenen Modelle.|Iron Colossus, Storm Hunter and Soul Matriarch retain their boss shape in every biome and receive matching details. Biome guardians retain their own models.
Die beiden Endausbauten des Flammenturms sind deutlicher unterscheidbar. Die ultimative Stufe zeigt zusätzlich einen leuchtenden Phönixkern mit Flügelaufsätzen.|The Flame Tower’s two final upgrade paths are easier to distinguish. The ultimate upgrade adds a glowing Phoenix Core with wing details.
`);

HexTranslations.add(`
Gesamtwerte|Overall totals
Kills|Kills
Runs prüfen|Review runs
Prüfliste wird geladen …|Loading pending runs …
Keine offenen Prüfungen.|No pending reviews.
Begründung der Entscheidung|Reason for this decision
Annehmen|Accept
Ablehnen|Reject
Account erstellen und Run übernehmen|Create an account and claim this run
Erneut versuchen|Try again
Platzierung momentan nicht verfügbar|Ranking is currently unavailable
Dein Run wird überprüft und später angenommen oder abgelehnt.|Your run is under review and will later be accepted or rejected.
Dein Run wurde angenommen.|Your run was accepted.
Dein Run wurde abgelehnt.|Your run was rejected.
Der Run konnte noch nicht eingereicht werden. Bitte erneut versuchen.|Your run could not be submitted yet. Please try again.
Freigegebene Bestwerte pro Account · Welle, danach Kills.|Approved best scores per account · Wave, then kills.
Ungeprüfte Account-Gesamtwerte, keine getrennte Run-Wertung.|Unverified account totals, not scores separated by run mode.
Vorläufiger Vergleich mit freigegebenen Bestwerten. Welle zählt zuerst, danach Kills. Die Platzierung kann sich ändern.|Provisional comparison with approved best scores. Wave comes first, followed by kills. Rankings may change.
Erstelle einen Account oder melde dich an, um diesen Run einzureichen. Unauffällige Ergebnisse werden automatisch angenommen. Er bleibt dafür in diesem Browser gespeichert.|Create an account or sign in to submit this run. Results without suspicious indicators are accepted automatically. It is saved in this browser for that purpose.
Verwaltung|Management
Bestenlisten ohne Wartezeit|Leaderboards without the wait
Unauffällige Runs werden automatisch in die Bestenliste aufgenommen. Hohe Wellen oder viele Kills allein führen nicht zu einer manuellen Prüfung.|Runs without suspicious indicators are automatically added to the leaderboard. High waves or many kills alone do not trigger a manual review.
Widersprüchliche Meldungen desselben Runs werden zur Prüfung markiert, beispielsweise ein wechselnder Startmodus oder steigende Wellen bei sinkenden Gesamtkills.|Contradictory reports of the same run are flagged for review, such as a changing starting mode or increasing waves with decreasing total kills.
Administratoren können Einträge direkt in der Bestenliste und in der Prüfliste löschen. Gelöschte Runs erscheinen durch erneutes Einreichen nicht wieder; ein anderer gültiger persönlicher Bestwert kann nachrücken.|Administrators can delete entries directly from the leaderboard and review queue. Resubmitting a deleted run does not restore it; another valid personal best can take its place.
Löschen|Delete
Löschen bestätigen|Confirm deletion
Eintrag konnte nicht gelöscht werden.|Could not delete the entry.
Speichern & Hauptmenü|Save & main menu
Duo-Lobby|Duo lobby
Zusatz-Hex festgelegt · keine Änderung mehr möglich|Extra hex locked · no changes remaining
Speichern fehlgeschlagen. Bitte diesen Tab geöffnet lassen.|Saving failed. Please keep this tab open.
`);

HexTranslations.add(`
Zuverlässiger weiterspielen und klarere Rückmeldungen|Resume reliably with clearer feedback
Ein laufender Solo-Durchlauf lässt sich über „Speichern & Hauptmenü“ unterbrechen und später fortsetzen, auch wenn zwischendurch Duo gespielt wird.|A solo run can be suspended with Save & Main Menu and resumed later, including after playing Duo.
Die Wellenplanung zeigt während des Kampfes die laufende Welle und erst nach ihrem Abschluss die nächste.|Wave planning shows the current wave during combat and switches to the next wave only after completion.
Angesehene bezahlbare Arsenal-Freischaltungen leuchten nicht mehr dauerhaft. Der Gesehen-Status wird mit dem Account synchronisiert; Gäste behalten ihn im Browser. Neu bezahlbare Angebote werden wieder hervorgehoben.|Affordable Arsenal unlocks stop glowing after you view them. Viewed status syncs with your account; guests retain it in their browser. Newly affordable offers are highlighted again.
Der Schildknecht blockiert die ersten drei Treffer vollständig, auch Flammenwerfer und Explosionen. Jeder Treffer entfernt höchstens einen Schildstack.|The Shieldbearer fully blocks the first three hits, including flamethrowers and explosions. Each hit removes at most one shield stack.
Die Pechschnecke bewegt sich deutlich schneller und hat weniger Leben. Ihre Pechspur schützt andere Gegner mit 20 % Schadensreduktion, statt sie zu verlangsamen. Feuer hebt diesen Schutz auf.|The Tar Snail moves much faster and has less health. Its tar trail protects other enemies with 20% damage reduction instead of slowing them. Fire removes this protection.
Die Sporenwolke des Pilzkolosses bleibt sechs statt vier Sekunden bestehen.|The Mushroom Colossus spore cloud lasts six seconds instead of four.
Krähenfüße skalieren in späteren Wellen schwächer. Gegner, die durch Krähenfüße sterben, geben kein Gold.|Caltrops scale less strongly in later waves. Enemies killed by caltrops grant no gold.
Viele Minen werden effizienter verarbeitet und dargestellt. Anzahl, Platzierung und Wirkung bleiben erhalten.|Large minefields are processed and rendered more efficiently without changing mine count, placement or effects.
Bei Turm-Upgrades stehen die Flächenpfade oben und die Einzelzielpfade unten.|Tower upgrades list area-effect paths above single-target paths.
Das Zusatzfeld eines verbesserten Marktes kann einmal gesetzt und einmal korrigiert werden. Weitere Verschiebungen sind nicht mehr möglich.|An upgraded market extra tile can be assigned once and corrected once. Further moves are no longer possible.
Hinweise für Verbrauchshilfen liegen über hervorgehobenen Straßen. Freie Flächen im oberen Header blockieren die Kartenbedienung nicht mehr.|Consumable hints appear above highlighted roads. Empty header areas no longer block map interaction.
Nach Updates werden zusammengehörige Spieldateien zuverlässiger gemeinsam geladen, um Startprobleme durch veraltete Dateien zu vermeiden.|After updates, matching game files load together more reliably to prevent startup problems caused by outdated files.
Die bisherigen Bestenlistenwerte bleiben unter Gesamtwerte erreichbar. Solange getrennte Run-Bestenlisten nicht verfügbar sind, öffnet sich diese Liste als klar gekennzeichneter Ersatz.|Existing leaderboard values remain available under Overall stats. Until separate run leaderboards are available, this list opens as a clearly labelled fallback.
Getrennte Run-Bestenlisten sind noch nicht verfügbar. Angezeigt werden die bisherigen Gesamtwerte.|Separate run leaderboards are not yet available. Showing the existing overall stats.
`);

HexTranslations.add(`
Getrennte Run-Wertungen zeigen freigegebene Ergebnisse. Gesamtwerte stammen aus gespeicherten Account-Spielständen und sind ungeprüft.|Separate run rankings show approved results. Overall stats come from saved account profiles and are unverified.
`);

HexTranslations.add(`
Neue Modelle und Halloween-Edition|New models and Halloween Edition
Neuer Grafikstil Halloween-Edition: in den Einstellungen unter Grafikstil wählbar. Die Wahl bleibt wie bei Normal und Sakura nach dem Neuladen erhalten und wird in die Account-Sicherung übernommen.|New Halloween Edition graphics style: choose it in the settings under Graphics style. Like Normal and Sakura, the choice persists after reloading and is included in the account backup.
Schildknecht, Donnerkröte, Häutungskäfer, Pechschnecke, Pilzkoloss und Rammbockkäfer haben neu gestaltete Modelle, auch in der Sakura-Edition. Schildzustand, Sprünge, Panzerverlust und Anlauf bleiben sichtbar.|Shieldbearer, Thunder Toad, Molting Beetle, Tar Snail, Mushroom Colossus and Ram Beetle have redesigned models, including in the Sakura Edition. Shield state, jumps, shell loss and charging remain visible.
Die Ultimate-Stufen aller Türme haben eigene Modelle und heben sich sichtbar von der Endstufe ab. Beim Flammenturm ersetzt das neue Modell den bisherigen Phönix-Aufsatz.|The ultimate stages of all towers have their own models and stand out visibly from the final stage. For the Flame Tower, the new model replaces the previous phoenix attachment.
Eisenkoloss, Sturmjäger und Seelenmatriarchin haben eigene Bossgestalten. Die Akzente der Biome bleiben erhalten.|Iron Colossus, Storm Hunter and Soul Matriarch have their own boss forms. The biome accents remain.
Viele Hex-Felder wurden überarbeitet: Bäume, Mauern, Steine und Deko stehen nicht mehr auf Turmplätzen, und Turmsockel liegen dort, wo Türme gebaut werden. Auf dem Königsbogen schwebt der Turm in der Sakura-Edition nicht mehr.|Many hex tiles have been reworked: trees, walls, rocks and decorations no longer stand on tower slots, and tower bases sit where towers are built. On the Royal Bend, the tower no longer floats in the Sakura Edition.
Schrein, Schatz und Boss-Sonderfeld sind neu gestaltet und haben in der Sakura-Edition eigene Fassungen. Unerkundete Felder zeigen einen neuen Nebel.|The shrine, treasure and boss special tiles have been redesigned and have their own versions in the Sakura Edition. Unexplored tiles show new fog.
`);

HexTranslations.add(`
Einheitliche Wiese|Uniform meadow
Weites Land hat jetzt dieselbe grüne Wiese wie die übrigen Hex-Felder statt eines trockenen Gelbtons, in der normalen, der Sakura- und der Halloween-Edition.|Open Land now has the same green meadow as the other hex tiles instead of a dry yellow tone, in the Normal, Sakura and Halloween Editions.
`);
HexTranslations.add(`
Fortsetzen · Welle|Continue · Wave
ab Welle 35|from wave 35
Zurück · Esc|Back · Esc
Impressum|Legal notice
Datenschutz|Privacy
Rechtliches|Legal
Patch Notes|Patch notes
Welle läuft|Wave in progress
Niederlage|Defeat
Sieg|Victory
Base-Ausbau öffnen|Open base upgrades
Verbrauchshilfen|Consumables
Drehen (R)|Rotate (R)
Drehen|Rotate
Basisstufe|Base level
Stufe 2 · Spezialisierung|Level 2 · Specialization
Stufe 3 · Zweigfinale|Level 3 · Branch finale
Gemeinsam einstellen|Set together
Upgrades|Upgrades
Zurück zu Upgrades|Back to upgrades
Aktuelle Werte|Current stats
Aktive Einflüsse|Active influences
Schadensfaktoren|Damage factors
Gegen Leben|Against health
Gegen Rüstung|Against armor
Gegen Magieresistenz|Against magic resistance
Fläche|Area
Kette|Chain
Aura|Aura
Minen|Mines
Durchschlag|Pierce
Frost|Frost
Radius|Radius
Baum (Test)|Tree (test)
Werkstatt|Workshop
Ganzen Baum zeigen|Show whole tree
Vergrößern|Zoom in
Verkleinern|Zoom out
Arsenal als Baum|Arsenal as a tree
Diamanten freischalten Türme, Ultimates und Gebäude-Spezialausbauten dauerhaft. Stufe 2 und 3 baust du im Run mit Gold aus.|Diamonds permanently unlock towers, ultimates and special building upgrades. Levels 2 and 3 are bought with gold during a run.
im Run mit Gold|bought with gold during a run
Kosten im Run:|Cost during a run:
verfügbar|available
Diamanten schalten Türme und ihre Ultimates dauerhaft frei. Stufe 2 und 3 baust du im Run mit Gold aus.|Diamonds permanently unlock towers and their ultimates. Levels 2 and 3 are bought with gold during a run.
Diamanten schalten Gebäude und ihre Spezialausbauten dauerhaft frei. Stufe 2 und 3 baust du im Run mit Gold aus.|Diamonds permanently unlock buildings and their special upgrades. Levels 2 and 3 are bought with gold during a run.
Freigeschaltet:|Unlocked:
Arsenal-Bereiche|Arsenal sections
jetzt freischaltbar|unlockable now
freigeschaltet|unlocked
gesperrt|locked
II · III im Run mit Gold|II · III with gold during a run
Tastenbelegung, Hex-Grid und Spielhilfen findest du im Spiel unter Einstellungen (Escape).|Key bindings, hex grid and gameplay aids are in the in-game settings (Escape).
`);
HexTranslations.add(`
Neue Hex-Oberfläche|New hex interface
Die Einstellungen sind ein großes Fenster mit Bereichen: Spiel & Anzeige, Audio & Sprache, Steuerung mit Tastenübersicht und Hilfe mit Tutorial, Spielregeln und Biomen. Schalter und Regler statt Häkchen; unten stehen Welle, „Speichern & Hauptmenü“ und „Zurück zum Spiel“. Der Schalter „Mehrfachauswahl“ entfällt, mehrere Bauplätze wählst du mit Strg + Klick.|Settings are now a large window with sections: Game & display, Audio & language, Controls with a key overview, and Help with tutorial, rules and biomes. Switches and sliders replace checkboxes; the bottom bar shows the wave, “Save & main menu” and “Back to the game”. The “Multi-select” switch is gone; select several building slots with Ctrl + click.
Neues Account-Fenster: Registrieren und Anmelden als Reiter, die Anmeldung über Twitch und Google ist angekündigt. Angemeldet zeigt „Account & Spielstand“ Diamanten, beste Welle und letzte Sicherung sowie Hochladen und Herunterladen des Spielstands.|New account window: register and sign in as tabs, sign-in with Twitch and Google is announced. When signed in, “Account & save” shows diamonds, best wave and last backup, plus uploading and downloading your progress.
Neuer Ergebnisbildschirm „Durchlauf beendet“: erreichte Welle, gewonnene Diamanten, Platzierung, Kills, besiegte Bosse, verdientes Gold und eine übersichtliche Turmstatistik. Ein Klick auf einen Turm zeigt seine Bau-, Upgrade- und Erstattungskosten.|New “Run complete” screen: wave reached, diamonds earned, ranking, kills, bosses defeated, gold earned and a clear tower statistic. Clicking a tower shows its build, upgrade and refund costs.
Die Bestenliste zeigt die ersten drei auf einem Podest vor dem Hauptmenü-Hintergrund, mit Boss-Porträts als Medaillen. Dein Eintrag ist hervorgehoben, unten steht deine Platzierung. Bei Gleichstand stehen trotzdem drei Einträge auf dem Podest.|The leaderboard shows the top three on a podium in front of the main menu landscape, with boss portraits as medals. Your entry is highlighted and your rank is shown at the bottom. With tied ranks the podium still shows three entries.
Arsenal-Baum: Die Detailspalte ist größer und gegliedert, mit Ausbaupfaden, Statuszeile und Werteänderungen als Tabelle.|Arsenal tree: the detail column is larger and structured, with upgrade paths, a status line and value changes as a table.
Turmfenster überarbeitet: größere Schrift, kompakte Upgrade-Karten mit Typ, Kurzwerten und Preis; Beschreibung und Vergleich gibt es auf Wunsch über das Info-Symbol. „Werte & Einflüsse“ und „Verkaufen“ sind immer unten sichtbar, und jeder Einfluss nennt seine Herkunft. „Turm bauen“ ist im gleichen Stil gestaltet, mit Turmbildern und größeren Zeilen.|Tower window reworked: larger text, compact upgrade cards with type, key values and price; description and comparison are available via the info button. “Values & influences” and “Sell” are always visible at the bottom, and every influence states where it comes from. “Build tower” uses the same style with tower images and larger rows.
Das Spielfeld wirkt kräftiger: sattere Wiese, Laub und Wege, ein etwas dunklerer Himmel und bei hoher Grafikqualität eine Farbkorrektur wie im Hauptmenü.|The playing field looks richer: more saturated meadow, foliage and paths, a slightly darker sky and, on high graphics quality, colour grading like in the main menu.
Bessere Darstellung auf kleineren Bildschirmen: Das Hauptmenü passt ohne Scrollen, die Anzeigen oben rechts überdecken das Phasenschild nicht mehr, und die Wellenplanung öffnet mittig darunter.|Better layout on smaller screens: the main menu fits without scrolling, the top-right displays no longer cover the phase badge, and the wave plan opens centred below it.
Der Hintergrund des Hauptmenüs ist aufwendiger gestaltet: Abendsonne mit weichen Schatten, flackernde Fackeln und warmes Licht an der Festung, leuchtende Flammen, kräftigere Farben, dazu Wiese, Wald, Berge im Dunst, Himmel und ziehende Wolken rund um die Karten. Auf schwächeren Geräten entfallen die Leuchteffekte, bei „Bewegung reduzieren“ das Flackern und der Wolkenzug.|The main menu background is more elaborate: evening sun with soft shadows, flickering torches and warm light at the fortress, glowing flames, richer colours, plus meadow, forest, hazy mountains, sky and drifting clouds around the maps. Weaker devices skip the glow effects, and “reduce motion” turns off flickering and cloud movement.
Ruhige Klaviermusik im Hintergrund, im Hauptmenü und im Spiel in Endlosschleife. Musik lässt sich in den Einstellungen getrennt von den Soundeffekten ein- und ausschalten und in der Lautstärke regeln; im Hintergrund-Tab pausiert sie. Musik von Nikita Kondrashev über Pixabay, verlinkt in den Einstellungen.|Calm piano music now plays in a loop in the main menu and in game. Music can be switched on and off and adjusted separately from sound effects in the settings, and pauses while the tab is in the background. Music by Nikita Kondrashev via Pixabay, linked in the settings.
Gegner im Hintergrund des Hauptmenüs laufen jetzt mit Laufanimation.|Enemies in the main menu background now walk with an animation.
Das Arsenal lässt sich als Fertigkeitenbaum anzeigen (Test): getrennte Reiter für Türme und Gebäude, vom Arsenal in der Mitte über Stufe 2 und 3 bis zu Ultimates und Spezialausbauten. Ein Klick auf einen Knoten zeigt die Details und schaltet direkt frei; Ziehen verschiebt, das Mausrad zoomt. Die bisherige Werkstatt bleibt umschaltbar.|The arsenal can be shown as a skill tree (test): separate tabs for towers and buildings, from the arsenal in the centre through levels 2 and 3 to ultimates and special upgrades. Clicking a node shows its details and unlocks it directly; drag to pan, use the mouse wheel to zoom. The previous workshop view is still available.
Neues Hauptmenü im Hex-Stil: ein großer goldener Spielen-Knopf in der Mitte, darum Arsenal, Bestenliste, Einstellungen, Duo, Tägliche Herausforderung und Account. Duo und die Tägliche Herausforderung sind direkt erreichbar und zeigen vor der Freischaltung „ab Welle 35“.|New hex-style main menu: a large golden Play button in the centre, surrounded by Arsenal, Leaderboard, Settings, Duo, Daily challenge and Account. Duo and the daily challenge are directly accessible and show “from wave 35” until unlocked.
Mit gespeichertem Durchlauf zeigt „Spielen“ die aktuelle Welle und öffnet die Spielauswahl: „Fortsetzen“ steht an erster Stelle, darunter lässt sich ein neuer Run starten.|With a saved run, “Play” shows the current wave and opens the play selection: “Continue” comes first, and a new run can be started below it.
Im Hintergrund des Hauptmenüs liegen Spielkarten mit Festung, Türmen und Gegnern, die zur Festung laufen.|The main menu background shows game maps with a fortress, towers and enemies walking towards the fortress.
Einstellungen direkt im Hauptmenü: Sprache, Grafikstil, Ton und Einsteigerhinweise. Die Sprachwahl steht unten links, die Patch Notes unten rechts.|Settings directly in the main menu: language, graphics style, sound and beginner tips. The language picker sits bottom left, patch notes bottom right.
Neue Spieloberfläche: Pause, Einstellungen, Regeln, Zoom und Bauen als Hex-Knöpfe; Leben, Gold, Deck, Diamanten und Base als Anzeigen oben rechts; ein Phasenschild oben zeigt Bauphase oder laufende Welle. Turmleiste mit Preisschildern, Tempo-Regler und Wellenstart sind neu gestaltet. Der Knopf „Zur Base“ entfällt.|New game interface: pause, settings, rules, zoom and build as hex buttons; health, gold, deck, diamonds and base as displays at the top right; a phase sign at the top shows the build phase or the running wave. The tower bar with price tags, the speed slider and the wave start are redesigned. The “Back to base” button has been removed.
Handkarten mit Rahmen in der Seltenheitsfarbe und einem Kachelbild, das die aktuelle Drehung zeigt.|Hand cards with a frame in the rarity colour and a tile image that shows the current rotation.
Die Turmauswahl zeigt Werte mit Symbolen und den Preis als Knopf; bei zu wenig Gold ist der Preis rot.|The tower selection shows stats with icons and the price as a button; with too little gold the price turns red.
Neues Turmfenster: Bild des Turms in seiner Ausbaustufe, die wichtigsten Werte auf einen Blick, Angriffsfokus und Upgrades mit Vorschaubild, Typ und Preis. „Werte & Einflüsse“ öffnet eine eigene Ansicht mit allen Werten, aktiven Einflüssen und Schadensfaktoren.|New tower window: an image of the tower at its upgrade level, the key stats at a glance, targeting and upgrades with preview image, type and price. “Stats & modifiers” opens its own view with all stats, active modifiers and damage factors.
Neue Schriften für Titel und Bedienelemente, und das Spielfeld liegt vor einem kräftigeren Blau.|New fonts for titles and controls, and the board sits in front of a stronger blue.
`);

Object.assign(globalThis.HexTranslations.en, {
  "Spielstände sind besser gegen veraltete Uploads und gleichzeitiges Spielen in mehreren Tabs geschützt. Ein zweiter Tab zeigt an, wenn er nicht speichern darf.": "Saves are better protected against outdated uploads and playing in multiple tabs. A second tab indicates when it cannot save.",
  "Lokale Spielstände von Accounts und Gästen werden getrennt aufbewahrt. Vorherige Cloud-Spielstände werden beim Ersetzen gesichert; beschädigte Uploads werden abgewiesen.": "Local account and guest saves are kept separately. Previous cloud saves are backed up before replacement; damaged uploads are rejected.",
  "Wenn die Aktualisierung der Profil-Bestenliste vorübergehend fehlschlägt, wird sie nachgeholt. Der Account zeigt dabei an, dass der Spielstand bereits gesichert ist.": "If updating the profile leaderboard temporarily fails, the update is retried. Your account shows that your progress has already been saved.",
  "Spielstand gesichert. Die Bestenliste wird noch aktualisiert.": "Progress saved. The leaderboard update is still pending.",
  "☁ Spielstand gesichert. Die Bestenliste wird noch aktualisiert.": "☁ Progress saved. The leaderboard update is still pending."
});

Object.assign(globalThis.HexTranslations.en, {
  "Ballisten und andere Türme richten sich nach ihrem Angriffsfokus aus. Der Angriffsfokus lässt sich auf andere Türme kopieren.": "Ballistas and other towers face their selected attack target. Attack priorities can be copied to other towers.",
  "Die Basis lässt sich auf Mobilgeräten zum Ausbauen öffnen. Fernschmieden markieren ein Zusatzfeld, das inzwischen gleich stark durch eine nahe Schmiede versorgt wird.": "The base upgrade panel opens on mobile. Remote forges flag a remote tile that now receives equally strong support from a nearby forge.",
  "Verbrauchshilfen sind auf drei Einsätze je Sorte und Welle begrenzt. Vorbereitete Einsätze zählen mit; die verbleibende Anzahl wird angezeigt.": "Consumables are limited to three uses per type per wave. Preparation uses count toward this limit, and remaining uses are shown.",
  "Kettenblitze und Nekromanten verursachen mehr Schaden, Flammentürme und Minen weniger. Flammen sind gegen Rüstung und Magieresistenz schwächer. Gegner in Welle 1 bewegen sich langsamer.": "Chain lightning and necromancers deal more damage; flame towers and mines deal less. Flames are weaker against armor and magic resistance. Wave 1 enemies move more slowly.",
  "Rammbockkäfer beschleunigen auf geraden Straßen schneller. Nekromanten erhalten auch aus Krähenfuß-Kills Seelen.": "Ram beetles accelerate faster on straight roads. Necromancers also collect souls from caltrop kills.",
  "Fokus kopieren": "Copy focus",
  "Fokus einfügen": "Paste focus",
  "Zusatz-Hex bereits gleich stark versorgt · neu wählen": "Remote tile already equally supported · choose another"
});
// Fenster im Referenzstil (Einstellungen, Account, Durchlauf, Bestenliste)
HexTranslations.add(`
Passe dein Spielerlebnis an.|Adjust your game experience.
Spiel & Anzeige|Game & display
Audio & Sprache|Audio & language
Steuerung|Controls
Hilfe|Help
Kartenübersicht|Map overview
Freie Bauplätze anzeigen|Show free building slots
Weiß: Türme · Türkis: Gebäude|White: towers · Teal: buildings
Upgrade-Markierungen (U)|Upgrade markers (U)
↑ zeigt, was im Run ausbaubar ist, unabhängig vom Gold.|↑ shows what can be upgraded in the run, regardless of gold.
Hex-Raster anzeigen (G)|Show hex grid (G)
Kanten der Spielfelder hervorheben.|Highlight the edges of the tiles.
Spielablauf|Gameplay
Einsteigerhinweise|Beginner hints
Wellen automatisch starten|Start waves automatically
Nach dem Platzieren eines Hexes starten.|Start after placing a hex.
Nächster Run|Next run
Startwert (Seed)|Seed
Alle Spielgeräusche wiedergeben.|Play all game sounds.
Lautstärke aller Spielgeräusche.|Volume of all game sounds.
Hintergrundmusik im Menü und im Spiel.|Background music in the menu and in game.
Unabhängig von den Spielgeräuschen.|Independent of the game sounds.
Gilt für Menüs, Spieltexte und Hinweise.|Applies to menus, game texts and hints.
Tastatur & Maus|Keyboard & mouse
Die wichtigsten Eingaben auf einen Blick.|The most important inputs at a glance.
Kamera bewegen/drehen|Move/rotate camera
Kamera drehen (halten)|Rotate camera (hold)
Kamera bewegen|Move camera
Kamera|Camera
Zoomen|Zoom
Mausrad-Klick|Middle click
Mausrad|Mouse wheel
Ziehen|Drag
Bauen & Spielen|Build & play
Handkarte wählen|Choose hand card
Welle starten|Start wave
Tempo erhöhen|Increase speed
Mehrfachauswahl|Multi-select
Strg|Ctrl
Klick|Click
Einstellungen / Schließen|Settings / close
Anzeige|Display
Upgrade-Markierungen|Upgrade markers
FPS-Anzeige|FPS counter
ⓘ Bei zwei Fronten am Anfang: Karten 1–5.|ⓘ With two fronts at the start: cards 1–5.
ⓘ Tempo: 1× bis 8×, danach wieder 1×.|ⓘ Speed: 1× to 8×, then back to 1×.
Einstieg|Getting started
Lerne das Platzieren von Hexen und den Turmbau.|Learn how to place hexes and build towers.
Gegner −15 % Tempo · Türme −15 % Reichweite.|Enemies −15% speed · Towers −15% range.
Kettenblitz +25 % Sprungweite · Wind +1 Durchschlagziel · Archer/Balliste −15 % Angriffsrate.|Chain lightning +25% jump range · Wind +1 pierce target · Archer/Ballista −15% attack rate.
Feuer +20 % Schaden · Freeze −15 % Reichweite · Wasser-Slow −25 % Dauer.|Fire +20% damage · Freeze −15% range · Water slow −25% duration.
Steuerung nachschlagen|Look up controls
Pausiert|Paused
Änderungen werden automatisch gespeichert.|Changes are saved automatically.
Zurück zum Spiel|Back to the game
Hilfe & Rechtliches|Help & legal
Tipps zu Steuerung, Bauen und neuen Biomen.|Tips on controls, building and new biomes.
Dein Benutzername|Your username
Dein Passwort|Your password
Ohne Account weiterspielen.|Continue without an account.
Account & Spielstand|Account & save
Dein Fortschritt auf einen Blick.|Your progress at a glance.
Auf dem neuesten Stand.|Up to date.
Änderungen noch nicht gesichert.|Changes not saved yet.
Spielstand verwalten|Manage save
Aktuellen Fortschritt in deinem Account sichern.|Save your current progress to your account.
Gespeicherten Account-Spielstand auf dieses Gerät laden.|Load the saved account progress onto this device.
Ersetzt den lokalen Spielstand.|Replaces the local save.
Durchlauf beendet|Run complete
Wellen abgeschlossen|waves completed
Welle abgeschlossen|wave completed
Details einblenden|Show details
Details ausblenden|Hide details
Deine Belohnung ist unabhängig von der Ranglistenprüfung.|Your reward does not depend on the leaderboard review.
Gold verdient|Gold earned
Gold gesamt|Total gold
Kosten (gesamt)|Costs (total)
Upgrades:|Upgrades:
Erstattet:|Refunded:
Ergebnis teilen|Share result
Die besten drei|Top three
Deine Platzierung:|Your rank:
Bereiche|Sections
Bestmarke: Wave|Best: wave
Turm bauen|Build tower
Details & Vergleich|Details & comparison
Details schließen|Close details
Biom des Bauplatzes|Biome of the building slot
Bonus des bebauten Hexes|Bonus of the built hex
Schrein in der Nähe|Shrine nearby
Besiegter Erkundungswächter|Defeated exploration guardian
Gebäude in Reichweite|Building in range
Verbrauchshilfe|Consumable
Änderungen|Changes
Ausbaupfade|Upgrade paths
Fortschritt|Progress
Im Run mit Gold:|During a run with gold:
Wähle einen Knoten im Baum, um Details und Freischaltungen zu sehen.|Select a node in the tree to see details and unlocks.
Mit Konto fortfahren|Continue with an account
Bald verfügbar|Coming soon
Mit Benutzername|With username
`);

Object.assign(globalThis.HexTranslations.en, {
  "Neue Hex-Oberfläche und sichere Spielstände": "New hex interface and safer saves",
  "Kleine Verbesserungen": "Small improvements",
  "„Zum Spiel“ auf den Seiten Impressum und Datenschutz schließt den Tab wieder, wenn du sie aus dem Spiel geöffnet hast. Es bleibt kein zweiter Spiel-Tab offen.": "“Zum Spiel” on the legal notice and privacy pages closes the tab again when you opened them from the game, so no second game tab stays open.",
  "Impressum und Datenschutzhinweise sind direkt aus dem Spiel erreichbar; Datenschutz- und Löschanfragen können per E-Mail gestellt werden.": "Legal and privacy information is accessible directly from the game; privacy and deletion requests can be sent by email.",
  "Updates bewahren bestehende Spielstände und Bestenlisten. Während der kurzen Vorbereitung kann die Account-Speicherung vorübergehend pausieren; der lokale Fortschritt bleibt erhalten.": "Updates preserve existing saves and leaderboards. Account saving may pause briefly during preparation; local progress is retained."
});
HexTranslations.add(`
Zusatzhex kaufen|Buy extra hex
Zusatzhex gekauft|Extra hex purchased
Ein zusätzliches Hex je Bauphase ab Welle 35. Jeder Kauf erhöht den Preis um 100 Gold.|One extra hex per preparation phase from wave 35. Each purchase raises the price by 100 gold.
Zusatzhex aktuell nicht möglich: Gold, Bauphase und freien Anschluss prüfen.|Cannot buy an extra hex now: check gold, preparation phase and an available connection.
Zusatzhex gekauft. Wähle eine Karte und lege sie an.|Extra hex purchased. Choose a card and place it.
`);
HexTranslations.add(`
Wegweiser|Wayfinder
Einmal je Welle die gesamte Kartenhand kostenlos neu ziehen.|Redraw your entire hand for free once per wave.
Späher|Scout
Deckt unbekannte Inseln ein Hex früher auf. Keine zusätzliche Turmreichweite.|Reveals unknown islands one hex earlier. Does not increase tower range.
Schutzsiegel|Protective Seal
Verhindert den ersten Punkt Basisschaden jeder Welle.|Prevents the first point of base damage each wave.
Veredelung|Refinement
Ersetzt eine Deckkarte durch eine passende Karte der nächsthöheren Seltenheit.|Replaces one deck card with a matching card of the next rarity.
Freies Zusatzhex|Free Extra Hex
Der nächste Zusatzhex-Kauf ab Welle 35 ist kostenlos.|Your next extra hex purchase from wave 35 is free.
Mehr Auswahl|More Choice
Ziehe vier statt drei Karten je Welle. Die Anzahl platzierbarer Hexe bleibt gleich.|Draw four cards instead of three each wave. The number of hexes you may place stays the same.
Bautrupp|Construction Crew
Die nächsten drei neuen Türme sind kostenlos. Keine kostenlosen Upgrades oder Verkaufserlöse.|Your next three new towers are free. Upgrades are not free and free builds have no resale value.
Seltenes Augment wählen|Choose a rare augment
Wähle einen Bonus für diesen Durchlauf. Gewählte Augments erscheinen nicht erneut.|Choose a bonus for this run. Selected augments will not appear again.
Keine weiteren passenden Augments verfügbar: +30 Gold.|No more eligible augments available: +30 gold.
Vorräte|Supplies
Wegweiser · Neu ziehen|Wayfinder · Redraw
Händler|Merchant
Händler · Vorräte kaufen|Merchant · Buy supplies
Händler · noch nicht verbunden|Merchant · Not connected yet
Seltenes Augment · ungesammelt|Rare augment · Unclaimed
Augment-Insel|Augment island
Feldversorgung|Field Supplies
Sofort bis zu 2 Basisleben wiederherstellen.|Immediately restore up to 2 base health.
Schutzvorrat|Protective Supplies
In der nächsten Welle insgesamt 2 Basisschaden verhindern.|Prevent a total of 2 base damage in the next wave.
Kaufen und fertig. Jeder Kauf verdoppelt den Preis dieses Angebots bei diesem Händler. Neue Händler starten beim Grundpreis.|Buy and benefit immediately. Each purchase doubles that item's price at this merchant. New merchants start at the base price.
`);
HexTranslations.add(`
Karte wählen (1–4) · Drehen: Knopf oder R · Hex antippen|Choose card (1–4) · Rotate: button or R · Click hex
Karte wählen (1–5) · Drehen: Knopf oder R · Hex antippen|Choose card (1–5) · Rotate: button or R · Click hex
`);

Object.assign(globalThis.HexTranslations.en, {
  "Gebäude · Gold sinnvoll investieren": "Buildings · Make your gold count",
  "Kosten: Stufe 2 / 3": "Cost: level 2 / 3",
  "45 / 70 Gold": "45 / 70 gold",
  "35 / 45 Gold": "35 / 45 gold",
  "Rabatt: Stufe 2 / 3": "Discount: level 2 / 3",
  "20 / 25 %": "20 / 25%",
  "25 / 35 %": "25 / 35%",
  "Handelsnetz: Ausbaukosten": "Trade Network: upgrade cost",
  "90 Gold": "90 gold",
  "55 Gold": "55 gold",
  "Gesamtkosten inklusive Handelsnetz": "Total cost including Trade Network",
  "240 Gold": "240 gold",
  "170 Gold": "170 gold",
  "Markt & Handelsnetz": "Market & Trade Network",
  "Mehr Rabatt für weniger Gold. Der Markt soll sich früher lohnen.": "Bigger discounts for less gold. Markets should pay off sooner.",
  "Das Zusatzfeld des Handelsnetzes gewährt ebenfalls 35 % Rabatt. Gewährte Rabatte werden vom Verkaufserlös des Marktes abgezogen, mindestens bis auf 0 Gold.": "The Trade Network remote hex also grants a 35% discount. Discounts granted are deducted from the market resale value, down to a minimum of 0 gold.",
  "40 / 55 Gold": "40 / 55 gold",
  "Fernschmiede: Ausbaukosten": "Remote Forge: upgrade cost",
  "60 Gold": "60 gold",
  "Gesamtkosten inklusive Fernschmiede": "Total cost including Remote Forge",
  "245 Gold": "245 gold",
  "195 Gold": "195 gold",
  "Schmiede & Fernschmiede": "Forge & Remote Forge",
  "Günstigerer Ausbau bei unverändertem Schadensbonus.": "Cheaper upgrades with unchanged damage bonuses.",
  "Der Schadensbonus bleibt bei 20 / 25 / 30 %. Gleiche Schmiedeboni stapeln weiterhin nicht.": "Damage bonuses remain 20 / 25 / 30%. Forge bonuses still do not stack.",
  "Zusatzgold je Haus durch andere Patrizierhäuser": "Extra gold per house from other Patrician Houses",
  "+2 je weiterem Haus, ohne Obergrenze": "+2 per additional house, uncapped",
  "+2 je weiterem Haus, maximal +4": "+2 per additional house, up to +4",
  "Patrizierhaus": "Patrician House",
  "Das Grund-Einkommen bleibt erhalten; große Hausnetzwerke skalieren weniger stark.": "Base income stays unchanged; large house networks scale less strongly.",
  "Normale Häuser bleiben unverändert. Ein Patrizierhaus bringt weiterhin 16 Grund-Einkommen und mit Netzwerkbonus höchstens 20 Gold je Welle.": "Regular houses are unchanged. A Patrician House still grants 16 base income, reaching at most 20 gold per wave with its network bonus.",
  "Gegner & Erkundung": "Enemies & Exploration",
  "Normale Gegner: Tempo ab Welle 25": "Normal enemies: speed from wave 25",
  "43,0 Einheiten/s": "43.0 units/s",
  "33,7 Einheiten/s (−21,7 %)": "33.7 units/s (−21.7%)",
  "Zusätzlicher Lebensfaktor": "Additional health multiplier",
  "×1,00": "×1.00",
  "Bis ×1,18 ab Welle 33": "Up to ×1.18 from wave 33",
  "Gegnerskalierung": "Enemy scaling",
  "Weniger Tempo-Eskalation im späteren Spiel. Dafür steigen die Lebenspunkte etwas stärker.": "Less late-game speed escalation, offset by slightly more health.",
  "Ab Welle 4 steigt der zusätzliche Lebensfaktor um 0,6 Prozentpunkte je Welle bis maximal 18 %. Gegner behalten ihre jeweiligen Tempo-Modifikatoren.": "From wave 4, the additional health factor increases by 0.6 percentage points per wave, capped at 18%. Enemies retain their individual speed modifiers.",
  "Die normale Gegnerzahl wird gleichmäßig auf offene Eingänge und gebaute Gegnerportale verteilt. Überzählige Gegner wechseln zwischen den Eingängen, damit keiner dauerhaft leer bleibt.": "Regular enemy counts are distributed evenly across open entrances and built enemy portals. Remainders rotate between entrances so none stay permanently unused.",
  "Gold beim Andocken": "Gold on connection",
  "25 + 5 × Hex-Distanz zur Basis": "25 + 5 × hex distance from base",
  "25 + 10 × Hex-Distanz zur Basis": "25 + 10 × hex distance from base",
  "Beispiel: Distanz 4": "Example: distance 4",
  "45 Gold": "45 gold",
  "65 Gold": "65 gold",
  "Schatzinseln": "Treasure islands",
  "Weiter entfernte Schätze belohnen Erkundung stärker.": "Distant treasures reward exploration more strongly.",
  "Neue Systeme": "New systems",
  "Zusatzhex kaufen": "Buy extra hex",
  "Mehr Baufläche im Endgame gegen steigende Goldkosten.": "More late-game building space at an increasing gold cost.",
  "Ab der Vorbereitung auf Welle 35 einmal je Bauphase verfügbar: 200 Gold beim ersten Kauf, danach +100 Gold je Kauf. Nicht in täglichen Herausforderungen.": "Available once per build phase starting before wave 35: 200 gold for the first purchase, then +100 gold per purchase. Not available in daily challenges.",
  "Du erhältst eine zusätzliche Kartenhand und darfst ein weiteres Hex legen. Fehlt eine mögliche Platzierung, wird kein Gold abgezogen.": "You receive another hand and may place one more hex. If no placement is possible, no gold is deducted.",
  "Dauerhafte Händler-Inseln": "Persistent merchant islands",
  "Einmal verbinden, immer wieder einkaufen. Kaufen und Wirkung erhalten – ohne Zielauswahl.": "Connect once, shop repeatedly. Buy and receive the effect immediately, without selecting a target.",
  "Feldversorgung: bis zu 2 Basisleben sofort heilen, anfangs 60 Gold.": "Field Supplies: immediately heal up to 2 base health, initially 60 gold.",
  "Schutzvorrat: in der nächsten Welle insgesamt 2 Basisschaden verhindern, anfangs 80 Gold; nicht für dieselbe Welle stapelbar.": "Protective Supplies: prevent 2 total base damage in the next wave, initially 80 gold; cannot stack for the same wave.",
  "Jeder Kauf verteuert dasselbe Angebot um 20 Gold. Alle Händler teilen diese Preise. Käufe sind nur zwischen Wellen möglich.": "Each purchase increases that offer by 20 gold. Prices are shared across merchants. Purchases are only possible between waves.",
  "Seltene Augment-Inseln": "Rare augment islands",
  "5 % Fundchance unter neu erzeugten „?“-Inseln. Wähle einen von bis zu drei Boni für diesen Durchlauf.": "5% chance among newly generated mystery islands. Choose one of up to three bonuses for this run.",
  "Kein zusätzliches Limit pro Durchlauf. Gewählte Augments verschwinden aus dem Pool; nicht gewählte bleiben verfügbar. Boni und Restladungen werden mit dem Durchlauf gespeichert.": "No additional per-run cap. Chosen augments leave the pool; unchosen augments remain available. Bonuses and remaining charges are saved with the run.",
  "Wenn kein passendes Augment mehr verfügbar ist, gibt die Insel 30 Gold.": "If no eligible augment remains, the island grants 30 gold.",
  "Die sieben Augments": "The seven augments",
  "Wegweiser": "Wayfinder",
  "Einmal je Welle die gesamte Hand kostenlos neu ziehen.": "Redraw the entire hand for free once per wave.",
  "Späher": "Scout",
  "Deckt unbekannte Inseln ein Hex früher auf; Turmreichweite bleibt unverändert.": "Reveals unknown islands one hex earlier; tower range is unchanged.",
  "Schutzsiegel": "Protective Seal",
  "Verhindert den ersten einzelnen Punkt Basisschaden jeder Welle, auch bei einem stärkeren Treffer.": "Prevents the first single point of base damage each wave, even from a stronger hit.",
  "Veredelung": "Refinement",
  "Ersetzt eine passende Deckkarte durch die nächsthöhere Seltenheit, etwa Späherbogen (Epic) → Drachenbogen (Legendary).": "Replaces an eligible deck card with the next rarity, for example Scout Bend (Epic) → Dragon Bend (Legendary).",
  "Freies Zusatzhex": "Free Extra Hex",
  "Der nächste Zusatzhex-Kauf ab Welle 35 kostet 0 Gold. Weitere Käufe steigen weiterhin im Preis.": "The next extra hex purchase from wave 35 costs 0 gold. Subsequent purchases still increase in price.",
  "Mehr Auswahl": "More Choice",
  "Vier statt drei Karten je Welle ziehen. Die Zahl platzierbarer Hexe bleibt unverändert.": "Draw four cards instead of three per wave. The number of hexes you may place is unchanged.",
  "Bautrupp": "Construction Crew",
  "Die nächsten drei neuen Türme sind kostenlos. Upgrades kosten weiterhin Gold; kostenlose Bauten erzeugen keinen Verkaufserlös.": "The next three new towers are free. Upgrades still cost gold; free builds have no resale value.",
  "Bedienung & Übersicht": "Controls & clarity",
  "Hex-Platzierung": "Hex placement",
  "Beim Anvisieren eines Feldes dreht sich die Karte automatisch in eine gültige Richtung. Manuelles Drehen überspringt dort ungültige Rotationen.": "When targeting a cell, the card turns to a valid orientation automatically. Manual rotation skips invalid orientations at that cell.",
  "Neue Patchnotes-Ansicht": "New patch notes layout",
  "Buffs, Nerfs, neue Inhalte und entfernte Inhalte auf einen Blick; Werteänderungen mit Alt → Neu. Auch auf Englisch verfügbar.": "Buffs, nerfs, new and removed content at a glance; stat changes show Before → After. Also available in English.",
  "VERSTÄRKT": "BUFFED",
  "Schmiede: Kosten ↓": "Forge: cost ↓",
  "Schatzgold ↑": "Treasure gold ↑",
  "Gegner-Leben ↑": "Enemy health ↑",
  "ABGESCHWÄCHT": "NERFED",
  "Patrizier-Netzwerk": "Patrician network",
  "Gegner-Tempo ↓": "Enemy speed ↓",
  "Markt-Verkaufserlös": "Market resale value",
  "NEU": "NEW",
  "7 seltene Augments": "7 rare augments",
  "Händler-Inseln": "Merchant islands",
  "Zusatzhex ab Welle 35": "Extra hex from wave 35",
  "ENTFERNT": "REMOVED",
  "Keine Spielinhalte entfernt": "No game content removed",
  "Markt & Handelsnetz — Mehr Rabatt für weniger Gold. Der Markt soll sich früher lohnen. Kosten: Stufe 2 / 3: 45 / 70 Gold → 35 / 45 Gold. Rabatt: Stufe 2 / 3: 20 / 25 % → 25 / 35 %. Handelsnetz: Ausbaukosten: 90 Gold → 55 Gold. Gesamtkosten inklusive Handelsnetz: 240 Gold → 170 Gold. Das Zusatzfeld des Handelsnetzes gewährt ebenfalls 35 % Rabatt. Gewährte Rabatte werden vom Verkaufserlös des Marktes abgezogen, mindestens bis auf 0 Gold.": "Market & Trade Network — Bigger discounts for less gold. Markets should pay off sooner. Cost: level 2 / 3: 45 / 70 gold → 35 / 45 gold. Discount: level 2 / 3: 20 / 25% → 25 / 35%. Trade Network: upgrade cost: 90 gold → 55 gold. Total cost including Trade Network: 240 gold → 170 gold. The Trade Network remote hex also grants a 35% discount. Discounts granted are deducted from the market resale value, down to a minimum of 0 gold.",
  "Schmiede & Fernschmiede — Günstigerer Ausbau bei unverändertem Schadensbonus. Kosten: Stufe 2 / 3: 45 / 70 Gold → 40 / 55 Gold. Fernschmiede: Ausbaukosten: 90 Gold → 60 Gold. Gesamtkosten inklusive Fernschmiede: 245 Gold → 195 Gold. Der Schadensbonus bleibt bei 20 / 25 / 30 %. Gleiche Schmiedeboni stapeln weiterhin nicht.": "Forge & Remote Forge — Cheaper upgrades with unchanged damage bonuses. Cost: level 2 / 3: 45 / 70 gold → 40 / 55 gold. Remote Forge: upgrade cost: 90 gold → 60 gold. Total cost including Remote Forge: 245 gold → 195 gold. Damage bonuses remain 20 / 25 / 30%. Forge bonuses still do not stack.",
  "Patrizierhaus — Das Grund-Einkommen bleibt erhalten; große Hausnetzwerke skalieren weniger stark. Zusatzgold je Haus durch andere Patrizierhäuser: +2 je weiterem Haus, ohne Obergrenze → +2 je weiterem Haus, maximal +4. Normale Häuser bleiben unverändert. Ein Patrizierhaus bringt weiterhin 16 Grund-Einkommen und mit Netzwerkbonus höchstens 20 Gold je Welle.": "Patrician House — Base income stays unchanged; large house networks scale less strongly. Extra gold per house from other Patrician Houses: +2 per additional house, uncapped → +2 per additional house, up to +4. Regular houses are unchanged. A Patrician House still grants 16 base income, reaching at most 20 gold per wave with its network bonus.",
  "Gegnerskalierung — Weniger Tempo-Eskalation im späteren Spiel. Dafür steigen die Lebenspunkte etwas stärker. Normale Gegner: Tempo ab Welle 25: 43,0 Einheiten/s → 33,7 Einheiten/s (−21,7 %). Zusätzlicher Lebensfaktor: ×1,00 → Bis ×1,18 ab Welle 33. Ab Welle 4 steigt der zusätzliche Lebensfaktor um 0,6 Prozentpunkte je Welle bis maximal 18 %. Gegner behalten ihre jeweiligen Tempo-Modifikatoren. Die normale Gegnerzahl wird gleichmäßig auf offene Eingänge und gebaute Gegnerportale verteilt. Überzählige Gegner wechseln zwischen den Eingängen, damit keiner dauerhaft leer bleibt.": "Enemy scaling — Less late-game speed escalation, offset by slightly more health. Normal enemies: speed from wave 25: 43.0 units/s → 33.7 units/s (−21.7%). Additional health multiplier: ×1.00 → Up to ×1.18 from wave 33. From wave 4, the additional health factor increases by 0.6 percentage points per wave, capped at 18%. Enemies retain their individual speed modifiers. Regular enemy counts are distributed evenly across open entrances and built enemy portals. Remainders rotate between entrances so none stay permanently unused.",
  "Schatzinseln — Weiter entfernte Schätze belohnen Erkundung stärker. Gold beim Andocken: 25 + 5 × Hex-Distanz zur Basis → 25 + 10 × Hex-Distanz zur Basis. Beispiel: Distanz 4: 45 Gold → 65 Gold.": "Treasure islands — Distant treasures reward exploration more strongly. Gold on connection: 25 + 5 × hex distance from base → 25 + 10 × hex distance from base. Example: distance 4: 45 gold → 65 gold.",
  "Zusatzhex kaufen — Mehr Baufläche im Endgame gegen steigende Goldkosten. Ab der Vorbereitung auf Welle 35 einmal je Bauphase verfügbar: 200 Gold beim ersten Kauf, danach +100 Gold je Kauf. Nicht in täglichen Herausforderungen. Du erhältst eine zusätzliche Kartenhand und darfst ein weiteres Hex legen. Fehlt eine mögliche Platzierung, wird kein Gold abgezogen.": "Buy extra hex — More late-game building space at an increasing gold cost. Available once per build phase starting before wave 35: 200 gold for the first purchase, then +100 gold per purchase. Not available in daily challenges. You receive another hand and may place one more hex. If no placement is possible, no gold is deducted.",
  "Dauerhafte Händler-Inseln — Einmal verbinden, immer wieder einkaufen. Kaufen und Wirkung erhalten – ohne Zielauswahl. Feldversorgung: bis zu 2 Basisleben sofort heilen, anfangs 60 Gold. Schutzvorrat: in der nächsten Welle insgesamt 2 Basisschaden verhindern, anfangs 80 Gold; nicht für dieselbe Welle stapelbar. Jeder Kauf verteuert dasselbe Angebot um 20 Gold. Alle Händler teilen diese Preise. Käufe sind nur zwischen Wellen möglich.": "Persistent merchant islands — Connect once, shop repeatedly. Buy and receive the effect immediately, without selecting a target. Field Supplies: immediately heal up to 2 base health, initially 60 gold. Protective Supplies: prevent 2 total base damage in the next wave, initially 80 gold; cannot stack for the same wave. Each purchase increases that offer by 20 gold. Prices are shared across merchants. Purchases are only possible between waves.",
  "Seltene Augment-Inseln — 5 % Fundchance unter neu erzeugten „?“-Inseln. Wähle einen von bis zu drei Boni für diesen Durchlauf. Kein zusätzliches Limit pro Durchlauf. Gewählte Augments verschwinden aus dem Pool; nicht gewählte bleiben verfügbar. Boni und Restladungen werden mit dem Durchlauf gespeichert. Wenn kein passendes Augment mehr verfügbar ist, gibt die Insel 30 Gold.": "Rare augment islands — 5% chance among newly generated mystery islands. Choose one of up to three bonuses for this run. No additional per-run cap. Chosen augments leave the pool; unchosen augments remain available. Bonuses and remaining charges are saved with the run. If no eligible augment remains, the island grants 30 gold.",
  "Wegweiser — Einmal je Welle die gesamte Hand kostenlos neu ziehen.": "Wayfinder — Redraw the entire hand for free once per wave.",
  "Späher — Deckt unbekannte Inseln ein Hex früher auf; Turmreichweite bleibt unverändert.": "Scout — Reveals unknown islands one hex earlier; tower range is unchanged.",
  "Schutzsiegel — Verhindert den ersten einzelnen Punkt Basisschaden jeder Welle, auch bei einem stärkeren Treffer.": "Protective Seal — Prevents the first single point of base damage each wave, even from a stronger hit.",
  "Veredelung — Ersetzt eine passende Deckkarte durch die nächsthöhere Seltenheit, etwa Späherbogen (Epic) → Drachenbogen (Legendary).": "Refinement — Replaces an eligible deck card with the next rarity, for example Scout Bend (Epic) → Dragon Bend (Legendary).",
  "Freies Zusatzhex — Der nächste Zusatzhex-Kauf ab Welle 35 kostet 0 Gold. Weitere Käufe steigen weiterhin im Preis.": "Free Extra Hex — The next extra hex purchase from wave 35 costs 0 gold. Subsequent purchases still increase in price.",
  "Mehr Auswahl — Vier statt drei Karten je Welle ziehen. Die Zahl platzierbarer Hexe bleibt unverändert.": "More Choice — Draw four cards instead of three per wave. The number of hexes you may place is unchanged.",
  "Bautrupp — Die nächsten drei neuen Türme sind kostenlos. Upgrades kosten weiterhin Gold; kostenlose Bauten erzeugen keinen Verkaufserlös.": "Construction Crew — The next three new towers are free. Upgrades still cost gold; free builds have no resale value.",
  "Hex-Platzierung — Beim Anvisieren eines Feldes dreht sich die Karte automatisch in eine gültige Richtung. Manuelles Drehen überspringt dort ungültige Rotationen.": "Hex placement — When targeting a cell, the card turns to a valid orientation automatically. Manual rotation skips invalid orientations at that cell.",
  "Neue Patchnotes-Ansicht — Buffs, Nerfs, neue Inhalte und entfernte Inhalte auf einen Blick; Werteänderungen mit Alt → Neu. Auch auf Englisch verfügbar.": "New patch notes layout — Buffs, nerfs, new and removed content at a glance; stat changes show Before → After. Also available in English.",
  "Neue Entdeckungen & ausgewogenere Gebäude": "New discoveries & building balance",
  "Mehr Entscheidungen beim Erkunden, bessere Goldnutzung und ein ruhigeres Endgame.": "More exploration choices, better ways to spend gold and a calmer late game.",
  "Patch auf einen Blick": "Patch at a glance",
  "Alt": "Before",
  "Neu": "After",
  "Wert": "Stat",
  "Ältere Patchnotes": "Older patch notes"
});
Object.assign(globalThis.HexTranslations.en, {'Werteänderungen':'Stat changes'});

Object.assign(globalThis.HexTranslations.en, {
  "Zurück zum bisherigen Design": "Back to the previous design",
  "Hauptmenü, Spieloberfläche, Turmfenster und die übrigen Fenster sehen wieder so aus wie vor der Hex-Oberfläche. Die Hex-Oberfläche, die Baumansicht im Arsenal und die Klavier-Hintergrundmusik sind vorerst nicht mehr zu sehen bzw. zu hören.": "The main menu, game interface, tower window and other windows look as they did before the hex interface again. The hex interface, the Arsenal tree view and the piano background music are gone for now.",
  "Impressum und Datenschutz sind weiterhin unten im Hauptmenü erreichbar. Spielstand-Sicherung, Balance-Änderungen und die grüne Wiese auf Weitem Land bleiben erhalten.": "The legal notice and privacy policy remain available at the bottom of the main menu. Save protection, balance changes and the green meadow on Open Land are kept."
});

Object.assign(globalThis.HexTranslations.en, {
  "Händler: Preise & eigene Vorräte": "Merchants: prices & individual stock",
  "Wiederholte Käufe werden teurer. Neu entdeckte Händler bieten wieder die Grundpreise.": "Repeat purchases become more expensive. Newly discovered merchants offer base prices again.",
  "Händlerpreise verdoppeln sich": "Merchant prices double",
  "Eigene Preise je Händler": "Individual prices per merchant",
  "Händler auswählen": "Choose a merchant",
  "Händler": "Merchants",
  "Wiederholte Käufe": "Repeat purchases",
  "Jeder Kauf verdoppelt den Preis desselben Angebots bei diesem Händler.": "Each purchase doubles the price of that offer at this merchant.",
  "Heilung: erste vier Käufe": "Healing: first four purchases",
  "Schutz: erste vier Käufe": "Protection: first four purchases",
  "60 / 80 / 100 / 120 Gold": "60 / 80 / 100 / 120 gold",
  "60 / 120 / 240 / 480 Gold": "60 / 120 / 240 / 480 gold",
  "80 / 100 / 120 / 140 Gold": "80 / 100 / 120 / 140 gold",
  "80 / 160 / 320 / 640 Gold": "80 / 160 / 320 / 640 gold",
  "Neue Händler starten mit 60 Gold für Heilung und 80 Gold für Schutz.": "New merchants start at 60 gold for healing and 80 gold for protection.",
  "Im Händlermenü kannst du zwischen den entdeckten Händlern wechseln.": "Switch between discovered merchants in the merchant menu.",
  "Heilung und Schutz haben getrennte Preissteigerungen. Schutz bleibt auf einen Kauf für dieselbe nächste Welle begrenzt.": "Healing and protection have separate price increases. Protection remains limited to one purchase for the same upcoming wave.",
  "Händlerpreise bleiben beim Speichern und Fortsetzen erhalten. Bei älteren Spielständen werden bisherige gemeinsame Kaufzähler dem ersten Händler zugeordnet.": "Merchant prices persist when saving and continuing. Older saves assign previous shared purchase counts to the first merchant."
});

HexTranslations.add(`
+40 % Schaden, vier zusätzliche Kettenziele und +30 Sprungweite.|+40% damage, four additional chain targets and +30 jump range.
20 % geringere Bewegungsgeschwindigkeit innerhalb der Aura.|20% less movement speed within the aura.
60 % Slow in kleinerem Radius.|60% slow in a smaller radius.
65 % Verlangsamung im Kampfbereich.|65% slow in the combat area.
Bis zu 5 Geister gleichzeitig, jeweils 10 Sekunden.|Up to 5 spirits at once, lasting 10 seconds each.
Bis zu 8 Geister mit verstärkten Angriffen für jeweils 12 Sekunden.|Up to 8 spirits with stronger attacks, lasting 12 seconds each.
+15 % Tower-Schaden auf diesem Hex und direkt benachbarten Hexen. Nicht stapelbar.|+15% tower damage on this hex and adjacent hexes. Does not stack.
Heilt andere Gegner im kleinen Umkreis alle 3 Sekunden um bis zu 5 % (maximal 20 + 8 je Welle). Heiler heilen einander nicht.|Heals nearby enemies every 3 seconds for up to 5% (capped at 20 + 8 per wave). Healers cannot heal each other.
`);

HexTranslations.add(`
Der Fluch der Gier|The Curse of Greed
Giervertrag · freiwillig|Greed contract · optional
Giervertrag angenommen|Greed contract accepted
Risikopunkte|Risk points
Beste Risikopunkte|Best risk score
Schwarmvertrag|Swarm contract
Heilervertrag|Healer contract
Elitevertrag|Elite contract
Vertragsschwarm|Contract swarm
Vertragsheiler|Contract healer
Vertragswache|Contract guard
Vertragselite|Contract elite
Sechs zusätzliche schnelle Schwarmgegner.|Six additional fast swarm enemies.
Ein Feldheiler und drei zusätzliche gepanzerte Begleiter.|One field healer and three additional armored escorts.
Ein Elitegegner mit vierfachem Leben, Rüstung und Magieresistenz. Drei Basisschaden bei Durchbruch.|One elite with quadruple health, armor and magic resistance. Deals three base damage if it escapes.
Gold sofort|gold immediately
Risikopunkte bei Erfolg|risk points on success
Zurück zur Vorbereitung|Back to preparation
Freiwillige Gierverträge|Optional greed contracts
Dem Fluch widerstanden!|The curse is broken!
DEM FLUCH WIDERSTANDEN!|THE CURSE IS BROKEN!
Der Gier erlegen|Consumed by greed
Im Endlosmodus gibt es keine weiteren Verträge oder Risikopunkte. Die Tagesbelohnung gibt es nur einmal pro Tag.|Endless mode offers no additional contracts or risk points. The daily reward is only awarded once per day.
Fluch der Gier testen · isoliertes Testprofil|Test Curse of Greed · isolated test profile
Starte zuerst das isolierte Erstspieler-Testprofil im Dev-Modus.|Start the isolated first-player test profile in Dev mode first.
Freiwillig: höchstens ein Vertrag für die nächste Welle. Gold sofort, Risikopunkte erst nach überstandener Welle. Die Wahl ist verbindlich. Zusätzliche Vertragsgegner geben kein weiteres Gold.|Optional: at most one contract for the next wave. Gold immediately, risk points only after surviving the wave. Your choice is final. Additional contract enemies grant no further gold.
Überlebe zwölf Wellen. Vor jeder Welle kannst du einen freiwilligen Vertrag annehmen: zusätzliche Gegner gegen sofortiges Gold. Höchstens ein Vertrag pro Welle; die Wahl kann nicht rückgängig gemacht werden.|Survive twelve waves. Before each wave, you can accept an optional contract: extra enemies for immediate gold. At most one contract per wave; your choice cannot be undone.
Risikopunkte erhältst du nur für überstandene Vertragswellen. Schwarm: 2 Punkte. Heilertrupp: 3 Punkte. Elite: 4 Punkte. Ohne Vertrag kannst du die Mission ebenfalls gewinnen. Maximal 48 Punkte; im Endlosmodus gibt es keine weiteren Verträge.|Earn risk points only for survived contract waves. Swarm: 2 points. Healers: 3 points. Elite: 4 points. You can also win without a contract. Maximum 48 points; endless mode offers no additional contracts.
Eine Front, kein Sandsturm. Bogenschütze, Katapult, Kettenblitz, Frost und Balliste stehen allen zur Verfügung; persönliche Arsenalboni gelten nicht. Einmal täglich +10 Diamanten beim Sieg.|One front, no sandstorm. Archer, Catapult, Chain Lightning, Frost and Ballista are available to everyone; personal Arsenal bonuses do not apply. Win to earn +10 diamonds once per day.
`);

HexTranslations.add(`
Die Kunst des Umwegs|The Art of the Detour
Straßenplanung|Road planning
Straßenbudget|Road budget
Ältere Hexe umsetzen|Reposition older hexes
Feste Türme|Fixed towers
Fünf Angriffe|Five attacks
Straßen planen|Plan roads
Letztes Straßenhex zurücknehmen|Undo last road hex
Straßenplanung abschließen|Finish road planning
Straßenplanung fortsetzen|Resume road planning
Nur Straße. Die Verteidigung steht bereits.|Road only. Defenses are already in place.
In dieser Mission bleibt die Verteidigung unverändert.|Defenses cannot be changed in this mission.
Straße gelegt. Plane weiter oder schließe die Straßenplanung ab.|Road placed. Continue planning or finish road planning.
Der Umweg hat sich gelohnt!|The detour paid off!
DER UMWEG HAT SICH GELOHNT!|THE DETOUR PAID OFF!
Die Straße hielt nicht stand|The road did not hold
Alle fünf Angriffe abgewehrt. Diese Straßenmission ist abgeschlossen; es gibt keinen Endlosmodus.|All five attacks repelled. This road mission is complete; there is no endless mode.
Kunst des Umwegs testen · isoliertes Testprofil|Test The Art of the Detour · isolated test profile
Fünf Angriffe, fünf feste Türme. Baue die Straße durch ihre Wirkungsbereiche. Kein Turmbau, Ausbau, Verkauf, Basis-Ausbau oder Verbrauchshilfen. Keine Goldeinnahmen.|Five attacks, five fixed towers. Build the road through their ranges. No tower building, upgrades, sales, base upgrades or consumables. No gold income.
Vor dem ersten Angriff bis zu sechs Straßenhexe, danach je zwei. Anfangs je drei Geraden, kleine und große Kurven; nach jedem Angriff je eine weitere Karte. Mindestens zwei Straßenhexe sind nötig, dann kannst du die Planung vorzeitig abschließen.|Up to six road hexes before the first attack, then two each time. Start with three straights, small curves and large curves each; gain one more of each after every attack. At least two road hexes are required before you can finish planning early.
Aktuelle Platzierungen kannst du zurücknehmen. Zwischen Angriffen dürfen außerdem höchstens die letzten zwei älteren Straßenhexe neu gesetzt werden. Zurückgenommene Karten und Platzierungen erhältst du zurück. Keine zufälligen Kartenangebote, kein Endlosmodus. Einmal täglich +10 Diamanten beim Sieg.|You can undo current placements. Between attacks, you can also reposition up to the last two older road hexes. Undone cards and placements are refunded. No random card offers, no endless mode. Win to earn +10 diamonds once per day.
`);

HexTranslations.add(`
Drei Dörfer|Three Villages
Norddorf|North Village
Mitteldorf|Central Village
Süddorf|South Village
Dorfverteidigung|Village defense
Unter Angriff|Under attack
Nächster Angriff|Next attack
Kostenlose Umzüge|Free relocations
Umzug abbrechen|Cancel relocation
Turm kostenlos umsetzen|Relocate tower for free
Freien Bauplatz wählen · Escape: abbrechen|Choose an empty tower slot · Escape: cancel
Wähle einen freien Bauplatz. Umzüge sind nur in der Bauphase möglich.|Choose an empty tower slot. Relocation is only available during preparation.
Die drei Dörfer können nicht ausgebaut werden.|The three villages cannot be upgraded.
Drei Dörfer · Feste Karte · Verteidigung vorbereiten|Three Villages · Fixed map · Prepare your defenses
Drei getrennte Lebensbalken|Three separate health bars
Alle drei Dörfer gerettet!|All three villages saved!
Ein Dorf ist gefallen|A village has fallen
Zwölf Angriffe überstanden. Alle drei Dörfer stehen noch! Kein Endlosmodus.|Twelve attacks survived. All three villages are still standing! No endless mode.
Drei Dörfer testen · isoliertes Testprofil|Test Three Villages · isolated test profile
Drei Dörfer mit je 15 Leben. Überlebe zwölf Wellen; sobald ein Dorf fällt, ist die Mission verloren. Die Karte ist fest. Du startest mit 180 Gold, ohne persönliche Arsenalboni.|Three villages with 15 health each. Survive twelve waves; if any village falls, you lose the mission. The map is fixed. Start with 180 gold and no personal Arsenal bonuses.
Drei Dörfer mit je 15 Leben. Überlebe zwölf Wellen; sobald ein Dorf fällt, ist die Mission verloren. Gewundene Zufahrten teilen sich ein festes Wegenetz: Zentrale Türme können mehrere Angriffe abdecken. Die markierten Eingänge zeigen, wo die nächste Welle erscheint und welches Dorf ihr Ziel ist. Du startest mit 180 Gold, ohne persönliche Arsenalboni.|Three villages with 15 health each. Survive twelve waves; if any village falls, you lose the mission. Winding approaches share a fixed road network: centrally placed towers can cover multiple attacks. Marked entrances show where the next wave appears and which village it targets. Start with 180 gold and no personal Arsenal bonuses.
Ziel Welle|Target wave
Angriff →|Attack →
Wellen 1–6: Nord, Mitte und Süd im Wechsel. Wellen 7–9: Nord + Mitte, Mitte + Süd, Nord + Süd. Wellen 10–12: alle drei Dörfer, zuletzt mit einem Boss. Das Angriffsziel wird vor der Welle angezeigt.|Waves 1–6: North, Central and South in rotation. Waves 7–9: North + Central, Central + South, North + South. Waves 10–12: all three villages, with a boss in the last wave. Attack targets are shown before each wave.
Zwei kostenlose Turmumzüge je Bauphase, ohne Ansparen. Wähle einen Turm, dann „Turm kostenlos umsetzen“ und einen freien Bauplatz. Stufe, Einstellungen und investiertes Gold bleiben erhalten. Im Kampf sind Umzüge gesperrt. Turmbau und Upgrades sind erlaubt, Basis-Ausbau und Verbrauchshilfen nicht. Kein Endlosmodus; einmal täglich +10 Diamanten beim Sieg.|Two free tower relocations per preparation phase, without banking unused moves. Select a tower, then “Relocate tower for free” and an empty slot. Level, settings and invested gold are preserved. Relocation is blocked during combat. Tower construction and upgrades are allowed; base upgrades and consumables are not. No endless mode; win to earn +10 diamonds once per day.
`);

HexTranslations.add(`
Stromnetz|Power Grid
Generator A|Generator A
Generator B|Generator B
Leitfeld|Conduit
Relais Nord|North Relay
Relais Süd|South Relay
Strom|power
EIN|ON
AUS|OFF
Versorgt|Powered
Ausgeschaltet|Switched off
Keine Verbindung|Disconnected
Kapazität belegt|Capacity exhausted
Stromversorgung|Power supply
Strom einschalten|Switch power on
Strom ausschalten|Switch power off
Leitfelder schalten|Switch conduits
Türme versorgt|towers powered
Leitfelder|Conduits
Benachbarte eingeschaltete Hexe leiten Strom.|Adjacent enabled hexes conduct power.
Versorgung während der Welle gesperrt.|Power switching is locked during the wave.
Stromnetz · Versorgung prüfen · Zwölf Wellen|Power Grid · Check supply · Twelve waves
Zwei Generatoren · Sechs Strom|Two generators · Six power
Das Netz hält!|The grid holds!
Stromnetz überrannt|Power grid overrun
Zwölf Angriffe mit deiner Stromversorgung abgewehrt. Kein Endlosmodus.|Twelve attacks repelled with your power network. No endless mode.
Stromnetz testen · isoliertes Testprofil|Test Power Grid · isolated test profile
Überlebe zwölf Wellen auf der festen Karte, zuletzt mit einem Boss. Du startest mit 150 Gold. Zwei Generatoren liefern je drei Strom; jeder Turm benötigt einen Strom, unabhängig von seiner Stufe.|Survive twelve waves on a fixed map, with a boss in the final wave. Start with 150 gold. Two generators supply three power each; each tower uses one power, regardless of its level.
Schalte höchstens sechs Leitfelder ein. Strom fließt über benachbarte eingeschaltete Hexe, unabhängig von Straßenanschlüssen. Die beiden Relais verbinden die Netzteile. Verbundene Generatoren teilen ihre Kapazität.|Enable up to six conduits. Power flows through adjacent enabled hexes, regardless of road connections. The two relays link the network sections. Connected generators share their capacity.
Ohne Verbindung oder freie Kapazität greifen Türme nicht an; auch Frost-Auren und Minenleger bleiben inaktiv. Bei Engpässen haben zuerst gebaute Türme Vorrang. Schalte einen Turm im Turmmenü aus, um Strom für einen anderen freizugeben.|Towers cannot attack without a connection and available capacity; frost auras and minelayers also remain inactive. Earlier-built towers have priority when capacity is limited. Switch off a tower in its menu to free power for another.
Schalter, Turmbau, Upgrades und Verkauf sind nur zwischen Wellen möglich. Kein Basis-Ausbau, keine Verbrauchshilfen, keine persönlichen Arsenalboni, kein Endlosmodus. Einmal täglich +10 Diamanten beim Sieg.|Switching, tower construction, upgrades and sales are only possible between waves. No base upgrades, consumables, personal Arsenal bonuses or endless mode. Win to earn +10 diamonds once per day.
`);
HexTranslations.add(`
Basis-Ausbau ist in dieser Mission gesperrt.|Base upgrades are disabled in this mission.
`);
HexTranslations.add(`
Expedition ins Unbekannte|Expedition into the Unknown
Expedition erfolgreich!|Expedition successful!
Expedition gescheitert · Relikte fehlen|Expedition failed · Missing relics
Expedition gescheitert|Expedition failed
Alle drei Relikte geborgen und Welle 12 überlebt. Kein Endlosmodus.|All three relics recovered and wave 12 survived. No endless mode.
Expedition testen · isoliertes Testprofil|Test Expedition · isolated test profile
Relikt Ost|Eastern relic
Relikt Nord|Northern relic
Relikt Süd|Southern relic
Relikt geborgen|Relic recovered
Relikte|Relics
geborgen|recovered
entdeckt|discovered
unbekannt|unknown
Platzierungen|placements
Planung abschließen|Finish planning
Planung fortsetzen|Resume planning
Drei Relikte bis Ende Welle 12|Three relics by the end of wave 12
Ziel: Ende Welle 12|Goal: end of wave 12
Hex gelegt · Noch|Hex placed · Remaining:
Verbinde alle drei Reliktinseln im Norden, Osten und Süden mit deiner Straße zur Basis und überlebe Welle 12. Aufdecken allein zählt nicht. Fehlt am Ende ein Relikt, ist die Expedition verloren.|Connect all three relic islands in the north, east and south to the road leading to your base and survive wave 12. Revealing them is not enough. A missing relic at the end means defeat.
Bis zu zwei Hexe je Bauphase. Der feste Straßenbaukasten enthält Gerade, kleine und große Kurve, T-Kreuzung und Y-Kreuzung. Karten sind wiederverwendbar; ungenutzte Platzierungen werden nicht angespart. Nach der ersten Straße kannst du die Planung auch vorzeitig abschließen.|Place up to two hexes per preparation phase. Your fixed road kit contains a straight, small and large bends, a T-junction and a Y-junction. Cards are reusable; unused placements do not carry over. After placing the first road, you may finish planning early.
100 Startgold. Jedes angeschlossene Relikt gibt einmalig 25 Gold, keinen weiteren Schreinbonus. Keine zufälligen Inseln oder Kartenbelohnungen. Persönliche Arsenalboni gelten nicht. Kein Endlosmodus; einmal täglich +10 Diamanten nur bei vollständig erfülltem Ziel.|Start with 100 gold. Each connected relic grants 25 gold once, without a shrine bonus. No random islands or card rewards. Personal Arsenal bonuses do not apply. No endless mode; earn +10 diamonds once per day only after completing the entire objective.
`);
HexTranslations.add(`
Turm-Draft|Tower Draft
Turm-Draft testen · isoliertes Testprofil|Test Tower Draft · isolated test profile
Turm-Draft · Inventar platzieren · Zwölf Wellen|Tower Draft · Place your inventory · Twelve waves
Drei Angebote, eine Wahl|Three offers, one choice
Auswahl offen|Picks remaining
Upgrade-Tickets|Upgrade tickets
Upgrade-Ticket|Upgrade ticket
Inventar|Inventory
Reparatur: +5 Leben|Repair: +5 health
Zuerst Draft wählen|Choose your draft first
Ausbauen · 1 Upgrade-Ticket|Upgrade · 1 upgrade ticket
Kein Upgrade-Ticket verfügbar|No upgrade ticket available
Maximale Draft-Stufe erreicht.|Maximum draft level reached.
Draft gemeistert!|Draft mastered!
Draft gescheitert|Draft failed
Zwölf Wellen mit deiner gedrafteten Verteidigung überlebt. Kein Endlosmodus.|Survived twelve waves with your drafted defenses. No endless mode.
Gold kann im Turm-Draft nicht ausgegeben werden. Verwende dein Inventar und Upgrade-Tickets.|Gold cannot be spent in Tower Draft. Use your inventory and upgrade tickets.
Überlebe zwölf Wellen auf einer festen Karte. Wähle jeweils eines von drei Angeboten: vor Welle 1 dreimal, danach einmal je Bauphase.|Survive twelve waves on a fixed map. Pick one of three offers: three picks before wave 1, then one pick per preparation phase.
Türme kommen ins Inventar und werden kostenlos auf freien Plätzen gebaut. Upgrade-Tickets erlauben eine normale Verbesserung deiner Wahl. Reparaturen heilen fünf Basisleben. Unverbrauchte Türme und Tickets bleiben erhalten.|Towers enter your inventory and can be built on empty slots for free. Upgrade tickets grant one regular upgrade of your choice. Repairs restore five base health. Unused towers and tickets carry over.
Kein Gold-Shop, Verkauf, Basis-Ausbau, Verbrauchshilfen oder persönliche Arsenalboni. Bauen und Verbessern nur zwischen Wellen. Kein Endlosmodus. Sieg: einmal täglich zehn Diamanten.|No gold shop, selling, base upgrades, consumables or personal Arsenal bonuses. Build and upgrade only between waves. No endless mode. Win to earn ten diamonds once per day.
`);
HexTranslations.add(`
Wandernde Festung|Wandering Fortress
Wandernde Festung testen · isoliertes Testprofil|Test Wandering Fortress · isolated test profile
Vier Stationen, je drei Wellen|Four stations, three waves each
Station|Station
Festung|Fortress
abgeschlossen|completed
Nächster Halt|Next stop
Letzte Station|Final station
Etappenwechsel: Türme kostenlos umsetzen|New stage: relocate towers for free
Umsetzen nach Welle 3, 6 und 9|Relocate after waves 3, 6 and 9
Festung sicher angekommen!|Fortress arrived safely!
Die Festung ist gefallen|The fortress has fallen
Alle vier Stationen verteidigt. Kein Endlosmodus.|All four stations defended. No endless mode.
Verteidige dieselbe Festung an vier Stationen für jeweils drei Wellen. Nach Welle 3, 6 und 9 zieht sie automatisch weiter. Verbleibende Leben und alle Türme bleiben erhalten.|Defend the same fortress at four stations for three waves each. It moves automatically after waves 3, 6 and 9. Remaining health and all towers are preserved.
In der Bauphase direkt nach einem Ortswechsel kannst du Türme kostenlos beliebig oft an die aktuelle Station umsetzen: Turm auswählen, Umsetzen anklicken, freien Bauplatz wählen. Upgrades und Angriffsfokus bleiben erhalten.|During the preparation phase immediately after moving, relocate towers to the current station for free as often as needed: select a tower, click relocate, then choose an empty slot. Upgrades and targeting priorities are preserved.
150 Startgold, normale Einnahmen. Kein Straßenbau, Basis-Ausbau, Verbrauchshilfen oder persönliche Arsenalboni. Bauen und Verbessern nur zwischen Wellen. Überlebe Welle 12 für einmal täglich zehn Diamanten. Kein Endlosmodus.|Start with 150 gold and earn regular income. No road building, base upgrades, consumables or personal Arsenal bonuses. Build and upgrade only between waves. Survive wave 12 to earn ten diamonds once per day. No endless mode.
`);

HexTranslations.add("Überlebe zwölf Wellen. Nach dem Hexbau ist ein Giervertrag freiwillig: Gold sofort, zusätzliche Gegner in dieser Welle. Risikopunkte sind ein Bonus, keine Siegbedingung.|Survive twelve waves. After placing a hex, a greed contract is optional: gold now, extra enemies this wave. Risk points are a bonus, not a victory requirement.\nVerlängere den Weg um die festen Türme. Erst sechs, danach zwei Platzierungen pro Angriff. Karten bleiben im Vorrat; ungenutzte Platzierungen verfallen. Danach Straßenplanung abschließen.|Extend the road around the fixed towers. Place up to six hexes initially, then two per attack. Cards remain in stock; unused placements expire. Then finish road planning.\nAlle drei Dörfer müssen zwölf Wellen überleben. Die Markierungen zeigen Eingang und Ziel. Gemeinsame Wege nutzen; zwischen Wellen zwei Türme kostenlos umsetzen.|All three villages must survive twelve waves. Markers show entrances and targets. Cover shared roads; relocate two towers for free between waves.\nÜberlebe zwölf Wellen. Erst Türme bauen und Leitfelder schalten: nur mit einem Generator verbundene Türme greifen an. Maximal sechs versorgte Türme und sechs Leitfelder. Während des Kampfes ist das Netz gesperrt.|Survive twelve waves. Build towers and switch on conducting tiles: only towers connected to a generator attack. At most six powered towers and six conducting tiles. The network is locked during combat.\nVerbinde alle drei Relikte über Straßen mit der Basis UND überlebe Welle 12. Aufdecken reicht nicht! Zwei Hexe pro Bauphase, Karten beliebig wiederverwendbar. Danach Planung abschließen.|Connect all three relics to the base by road AND survive wave 12. Revealing them is not enough! Two hexes per preparation phase, with reusable cards. Then finish planning.\nWähle vor dem ersten Angriff drei Angebote, danach eines pro Bauphase. Turm im Inventar? Freien Bauplatz anklicken und kostenlos bauen. Upgrade-Tickets am gebauten Turm einlösen. Überlebe zwölf Wellen; Gold ist hier nicht ausgebbar.|Choose three offers before the first attack, then one per preparation phase. Tower in your inventory? Click an empty slot and build it for free. Spend upgrade tickets on a built tower. Survive twelve waves; gold cannot be spent here.\nÜberlebe zwölf Wellen. Nach Welle 3, 6 und 9 zieht die Festung weiter. Dann alte Türme auswählen, kostenlos umsetzen und einen Platz an der neuen Station wählen. Sie ziehen nicht automatisch mit!|Survive twelve waves. The fortress moves after waves 3, 6 and 9. Select old towers, choose free relocation and select a slot at the new station. Towers do not move automatically!\nÜberlebe zwanzig Wellen auf zwei Fronten. Erst beide Basis-Ausgänge verlängern. Goldtransporter geben 18 Gold; bei Durchbruch verlierst du bis zu 10 Gold. Der Sandsturm senkt Reichweite und Gegnertempo.|Survive twenty waves on two fronts. Extend both base exits first. Gold carriers award 18 gold; a leak costs up to 10 gold. The sandstorm reduces range and enemy speed.\nÜberlebe drei schwere Angriffe mit insgesamt 1200 Gold. Keine Einnahmen und keine neuen Hexe. Baue und verbessere deine Verteidigung vor dem ersten Angriff; Restgold bleibt für spätere Anpassungen.|Survive three heavy attacks with a total of 1200 gold. No income or new hexes. Build and upgrade before the first attack; unspent gold remains available for later adjustments.\nGeschafft:|Completed:\nLeitfelder schalten → mit Generator verbinden → Turm bauen. Nur versorgte Türme greifen an.|Switch on conducting tiles → connect to a generator → build a tower. Only powered towers attack.\nEtappenwechsel: alten Turm wählen → Umsetzen → freien Platz an neuer Station wählen|New stage: select an old tower → relocate → choose an empty slot at the new station");

HexTranslations.add("Herausforderungen, Testlabor & Turmrollen|Challenges, practice lab & tower roles\nSieben neue Missionen, klare Ziele und gezielte Balance für Türme und Herausforderungen.|Seven new missions, clearer objectives and targeted tower and challenge balance.\n7 Herausforderungen & öffentliches Testlabor|7 challenges & public practice lab\nMissionsziele und Hilfen im Spiel|In-game objectives and guidance\nKettenblitz · Balliste · Nekromant|Chain Lightning · Ballista · Necromancer\nHaus- und Schmiede-Ausbau günstiger|Cheaper house and forge upgrades\nFrost-Kontrolle · frühe Schmiede|Frost control · early forge\nUmweg · Drei Dörfer · Draft · Festung|Detour · Three Villages · Draft · Fortress\nAlle neun Missionen sind im Testlabor jederzeit spielbar. Testfortschritte bleiben getrennt; es gibt dort keine Diamanten oder Bestenlistenwertung.|All nine missions are always playable in the practice lab. Practice saves stay separate, with no diamonds or leaderboard entries.\nNeue Tagesmissionen kommen ab 25. Oktober schrittweise in die Rotation. Bereits gespielte Tage behalten ihre Zuordnung.|New daily missions enter the rotation gradually from October 25. Previously played days keep their assignments.\nGierverträge, Straßenrätsel, drei Dörfer, Stromversorgung, Reliktsuche, Turm-Draft und eine wandernde Festung ergänzen die Herausforderungen.|Greed contracts, road puzzles, three villages, power networks, relic hunts, tower drafting and a moving fortress join the challenges.\nSieben neue Spielideen|Seven new ways to play\nJede Mission zeigt ihren Wellenfortschritt und eine aufklappbare Anleitung. Normale Wellenfeiern und Einstellungstipps unterbrechen tägliche Herausforderungen nicht mehr.|Each mission shows wave progress and expandable instructions. Regular wave celebrations and settings tips no longer interrupt daily challenges.\nKlarere Ziele|Clearer objectives\nStraßenlose Turmfelder zeigen keine falschen Straßen mehr. Ist nur eine Ausrichtung erlaubt, erklärt der Drehknopf das.|Roadless tower tiles no longer display phantom roads. The rotate button explains when only one orientation is valid.\nDrei Dörfer teilen sich gewundene Wege; Eingänge und Dorfziele sind markiert. Im Umweg sind Straßenanschlüsse, Vorrat und Platzierungsbudget klarer erkennbar.|Three Villages shares winding roads with marked entrances and village targets. Detour makes road connections, stock and placement budgets clearer.\nDrei Dörfer & Umweg|Three Villages & Detour\nDraft: zusätzlicher Faktor je Welle ab W4|Draft: added multiplier per wave from W4\nFestung: zusätzlicher Faktor je Welle ab W4|Fortress: added multiplier per wave from W4\nTurm-Draft und Wandernde Festung erhöhen das Gegnerleben und vorhandene Schutzbalken ab Welle 4 schrittweise. Tempo und Goldbelohnungen bleiben gleich.|Tower Draft and Moving Fortress gradually increase enemy health and existing defense pools from wave 4. Speed and gold rewards stay unchanged.\nGezielter Druck ab Welle 4|Targeted pressure from wave 4\nNeue Herausforderungen|New challenges\nSturmnetz / Gewitter: Grundschaden|Storm Network / Thunderstorm: base damage\nHarpunenbolzen / Drachentöter: Bossfaktor|Harpoon Bolt / Dragon Slayer: boss multiplier\nSeelenchor / Geisterlegion: Geisterdauer|Soul Choir / Ghost Legion: spirit duration\nGeisterlegion: Grundschaden|Ghost Legion: base damage\nKettenblitz bekommt einen stärkeren Flächenzweig, die Balliste mehr Bossschaden und der Nekromant langlebigere Geister.|Chain Lightning gains a stronger area branch, Ballista deals more boss damage and Necromancer spirits last longer.\nKettenblitz, Balliste und Geister|Chain Lightning, Ballista and spirits\nTiefenfrost / Eisstarre / Ewiges Eis: Verlangsamung|Deep Frost / Frozen Stasis / Eternal Ice: slow\nLebenswachstum nach W35|Health growth after W35\nStarke Frost-Upgrades verlangsamen weniger. Dafür wächst normales Gegnerleben nach Welle 35 langsamer; späte Bosse bleiben durch mehr Leben relevant. Feldheiler haben eine wellenabhängige Heilungsgrenze.|Strong frost upgrades slow less. Normal enemy health grows more slowly after wave 35, while late bosses gain health to remain relevant. Field healers have a wave-dependent healing cap.\nFrost und spätere Gegner|Frost and late enemies\nHaus-Upgrades: Gold|House upgrades: gold\nSchmiede-Upgrades: Gold|Forge upgrades: gold\nSchmiedebonus|Forge bonus\nHaus- und Schmiede-Upgrades kosten weniger. Der erste Schmiedebonus fällt schwächer aus, die höchste Stufe bleibt bei 30 Prozent.|House and forge upgrades cost less. The initial forge bonus is weaker, while the highest tier stays at 30 percent.\nGebäude ausbauen lohnt sich|Building upgrades pay off\nTurmrollen & Wirtschaft|Tower roles & economy");
HexTranslations.add("VERBESSERT|IMPROVED");

HexTranslations.add("+0 %|+0 %\n+10 %|+10 %\n+8 %|+8 %\n7 / 11|7 / 11\n11 / 20|11 / 20\n1,3× / 1,3×|1.3× / 1.3×\n1,6× / 1,8×|1.6× / 1.8×\n6 s / 6 s|6 s / 6 s\n10 s / 12 s|10 s / 12 s\n11|11\n14|14\n65 / 75 / 85 %|65 / 75 / 85 %\n60 / 65 / 72 %|60 / 65 / 72 %\n10 %|10 %\n8 %|8 %\n40 / 65|40 / 65\n30 / 50|30 / 50\n40 / 55|40 / 55\n35 / 50|35 / 50\n20 / 25 / 30 %|20 / 25 / 30 %\n15 / 22 / 30 %|15 / 22 / 30 %");
HexTranslations.add(`Stromnetz verwalten · Felder & Türme|Manage power grid · Fields & towers
Stromnetz verwalten|Manage power grid
1. Türme bauen. 2. Benachbarte Leitfelder bis zum Generator einschalten. 3. Versorgung prüfen.|1. Build towers. 2. Enable adjacent relay fields leading to a generator. 3. Check the power supply.
Jeder Generator versorgt bis zu drei Türme in seinem verbundenen Netz. Zusammen sind sechs möglich. Leitfelder und Turmschalter sind getrennt: EIN allein bedeutet noch nicht „versorgt“.|Each generator powers up to three towers in its connected network, six in total. Relay fields and tower switches are separate: ON does not necessarily mean powered.
Leitfelder · höchstens sechs eingeschaltet|Relay fields · At most six enabled
Deine Türme|Your towers
Ein ausgeschalteter Turm gibt Kapazität frei. Bei Überlast werden die zuerst gebauten Türme versorgt.|Switching a tower off frees capacity. When overloaded, towers built first receive power first.
Alle sechs Leitfelder sind an. Schalte zuerst ein Feld aus, um ein anderes einzuschalten.|All six relay fields are on. Switch one off before enabling another.
Verbinde benachbarte eingeschaltete Felder mit einem Generator. Straßenanschlüsse spielen für Strom keine Rolle.|Connect adjacent enabled fields to a generator. Road connections do not affect power.
Welle läuft: Die Versorgung ist bis zum letzten Gegner festgelegt. Auch bei Pause kannst du erst danach umschalten.|Wave in progress: Power allocation is locked until the last enemy is gone. Pausing does not unlock switching.
Generator verbunden|Generator connected
Kein Generator verbunden|No generator connected
Leitet keinen Strom|Does not conduct power
Das Spiel konnte nicht vollständig starten.|The game could not finish starting.
Bitte lade die Seite neu. Dein gespeicherter Spielstand wird dabei nicht gelöscht.|Please reload the page. Your saved game will not be deleted.
Spiel neu laden|Reload game`);

HexTranslations.add("Noch keine Türme gebaut. Schließe diese Übersicht und wähle einen freien Bauplatz.|No towers built yet. Close this overview and select an empty tower site.");

HexTranslations.add(`◆ Relikte geborgen:|◆ Relics recovered:
Alle geborgen! Noch eine Welle überleben.|All recovered! Survive one more wave.
Goldene ◆-Felder mit der Basis verbinden. Frist: Welle 12.|Connect golden ◆ sites to the base. Deadline: wave 12.
Straße anschließen|Connect a road
erkunden & anschließen|Explore & connect
erkunden|Explore
Alle drei Relikte geborgen und den letzten Angriff überlebt. Kein Endlosmodus.|All three relics recovered and the final attack survived. No endless mode.
Drei Relikte + letzter Angriff · Frist: Welle 12|Three relics + final attack · Deadline: wave 12
Drei Relikte anschließen, dann eine Welle überleben. Frist: Welle 12.|Connect three relics, then survive one wave. Deadline: wave 12.
Relikte sind die goldenen ◆-Missionsfelder. Verbinde alle drei über Straßen mit der Basis und überlebe danach eine Welle. Je früher, desto besser; spätestens Welle 12. Aufdecken allein reicht nicht! Zwei Hexe pro Bauphase, Karten beliebig wiederverwendbar. Danach Planung abschließen.|Relics are the golden ◆ objective sites. Connect all three to the base by road, then survive one wave. The sooner the better; wave 12 is the deadline. Revealing alone is not enough! Two tiles per build phase, reusable cards. Then finish planning.
Relikte sind die goldenen ◆-Missionsfelder im Norden, Osten und Süden. Verbinde alle drei über Straßen mit deiner Basis und überlebe danach eine Welle: Dann gewinnst du sofort. Je früher, desto besser! Welle 12 ist die Frist. Aufdecken allein zählt nicht.|Relics are the golden ◆ objective sites to the north, east and south. Connect all three to your base by road, then survive one wave to win immediately. The sooner the better! Wave 12 is the deadline. Revealing alone does not count.`);

HexTranslations.add(`Wählen → links auswählen → Bauplatz anklicken|Choose → select on the left → click a tower site
Am gebauten Turm einlösen|Redeem at a built tower
Sofort +5 Leben|Instantly restore 5 health`);

HexTranslations.add(`Draft, Expedition & Stromnetz|Draft, Expedition & Power Grid
Klarere Missionen, wechselnde Karten und mehr Druck bei der Reliktsuche.|Clearer missions, varied maps and more pressure while hunting relics.
Draft-Karten & wachsende Straßen|Draft cards & expanding roads
Variable Reliktregionen|Varied relic regions
Stromnetz-Verwaltung|Power grid management
Turmbaumenü & Missionsstart|Tower menu & mission startup
SCHWIERIGER|HARDER
Expedition: stärkere Gegner ab Welle 3|Expedition: stronger enemies from wave 3
Wähle deine Angebote als bebilderte Karten unten in der Mitte. Links stehen nur Türme, die du noch platzieren kannst.|Choose illustrated offer cards at the bottom center. The left rail only shows towers you can still place.
Die Turmliste ist auf großen Bildschirmen vertikal zentriert. Aufgebrauchte Türme verschwinden aus der Schnellwahl.|The tower list is vertically centered on large screens. Spent towers disappear from quick selection.
Die Karte erhält nach Welle 3, 6 und 9 jeweils zwei weitere Straßenhexe. Ihr Verlauf variiert mit der Mission.|Two road tiles are added after waves 3, 6 and 9. Their route varies with the mission.
Drei Relikte anschließen und danach eine Welle überleben: Das beendet die Expedition sofort. Welle 12 bleibt die Frist.|Connect three relics and survive the following wave to complete the expedition immediately. Wave 12 remains the deadline.
Zusätzliches Gegnerleben und Schutz je Welle ab W3|Additional enemy health and defenses per wave from W3
+12 %|+12 %
Relikte variieren in Entfernung und Straßenform innerhalb der Regionen Nord, Ost und Süd.|Relic distance and road shape vary within the northern, eastern and southern regions.
Goldene Reliktmarkierungen und eine deutlichere Zielanzeige erklären, welche Felder angeschlossen werden müssen.|Golden relic markers and a clearer objective display explain which sites must be connected.
Tempo und Goldbelohnungen der Gegner bleiben unverändert.|Enemy speed and gold rewards remain unchanged.
Abwechslung mit gleichen Chancen|Variety with equal chances
Im Testlabor erhalten Expedition und Turm-Draft bei jedem neuen Versuch eine neue Variante. In der Tagesmission gelten für alle Spieler dieselben Bedingungen am selben Tag.|In the test lab, Expedition and Tower Draft get a new variant each attempt. Daily missions give all players the same conditions on the same day.
Eine größere Verwaltung trennt Leitfelder und Turmschalter. Verbindungsprobleme, Kapazität und die Sperre während einer Welle sind klar erkennbar.|A larger management panel separates relay fields and tower switches. Connection issues, capacity and the combat lock are clearly explained.
Bedienung & Start|Controls & startup
Das Turmbaumenü nutzt auf großen Bildschirmen den freien Platz links besser aus. Startfehler zeigen einen Hinweis zum Neuladen, ohne Spielstände zu löschen.|The tower menu makes better use of free space on the left on large screens. Startup errors show a reload prompt without deleting saves.
Spielaktualisierungen laden zusammengehörige Spieldateien zuverlässiger.|Updates load matching game files more reliably.`);
HexTranslations.add("Herausforderungen|Challenges");

HexTranslations.add("Duo-Start nach Updates|Duo startup after updates\nDuo-Seiten laden auch mit aktualisierten Spieldateien zuverlässig.|Duo pages load reliably with updated game files.\nDuo-Dateien nach Updates|Duo files after updates");
HexTranslations.add("Duo|Duo");

HexTranslations.add("Nachschub alle zwei Wellen|New offers every two waves");

HexTranslations.add(`Wähle vor dem ersten Angriff drei Angebote, danach eines nach jeder zweiten Welle. Turm im Inventar? Freien Bauplatz anklicken und kostenlos bauen. Upgrade-Tickets am gebauten Turm einlösen. Überlebe zwölf Wellen; Gold ist hier nicht ausgebbar.|Choose three offers before the first attack, then one after every second wave. Got a tower in inventory? Click an empty site to build it for free. Redeem upgrade tickets at built towers. Survive twelve waves; gold cannot be spent here.
Überlebe zwölf Wellen auf einer festen Karte. Wähle jeweils eines von drei Angeboten: vor Welle 1 dreimal, danach nach jeder zweiten Welle.|Survive twelve waves on the mission map. Choose one of three offers: three times before wave 1, then after every second wave.
Kein Gold-Shop, Verkauf, Basis-Ausbau, Verbrauchshilfen oder persönliche Arsenalboni. Türme bauen nur zwischen Wellen. Upgrade-Tickets auch während des Kampfes einlösen. Kein Endlosmodus. Sieg: einmal täglich zehn Diamanten.|No gold shop, selling, base upgrades, consumables or personal arsenal bonuses. Build towers between waves. Redeem upgrade tickets during combat too. No endless mode. Victory awards ten diamonds once per day.`);

HexTranslations.add(`35 Wellen · Verdiene so viel Gold wie möglich|35 waves · Earn as much gold as possible
Der Fluch der Gier · Goldwertung|Curse of Greed · Gold leaderboard
Verdientes Gold|Gold earned
Welle 35|Wave 35
Endlos|Endless
Kein Vertrag|No contract
Doppelte Welle|Double wave
Bossbesuch|Boss visit
Ansturm|Rush
Doppelte Deckung|Double protection
Riesenparade|Giant parade
Sechs zusätzliche schnelle Schwarmgegner.|Six additional fast swarm enemies.
Ein Feldheiler und drei gepanzerte Begleiter.|One field healer and three armored escorts.
Ein Elitegegner mit vierfachem Leben und beiden Schutzbalken.|One elite enemy with four times the health and both protection bars.
Alle normalen Gegner dieser Welle kommen doppelt. Vertragskopien geben kein Killgold.|Every normal enemy in this wave appears twice. Contract copies award no kill gold.
Ein zusätzlicher Boss mit sieben Basisschaden. Kein zusätzliches Bossgold.|One extra boss dealing seven base damage. No additional boss gold.
Alle normalen Gegner bewegen sich 35 % schneller.|All normal enemies move 35% faster.
Alle normalen Gegner erhalten zusätzlich je 35 % ihres Lebens als Rüstung und Magieresistenz.|All normal enemies gain 35% of their health as armor and magic resistance each.
Alle normalen Gegner haben 80 % mehr Leben und verursachen mindestens zwei Basisschaden.|All normal enemies have 80% more health and deal at least two base damage.
Unveränderte Gegner. Kein Vertragsgold.|Unchanged enemies. No contract gold.
Erreiche Welle 35 und verdiene so viel Gold wie möglich. Wähle dein eigenes Loadout. Vor jeder Welle musst du einen von drei wechselnden Verträgen oder Kein Vertrag wählen.|Reach wave 35 and earn as much gold as possible. Choose your own loadout. Before each wave, choose one of three changing contracts or No contract.
Verträge zahlen sofort Gold und verstärken nur den nächsten Angriff: etwa doppelte Gegnerzahl, einen zusätzlichen Boss oder mehr Schutz und Tempo. Ausgegebenes Gold zählt weiterhin, Startgold und Verkäufe nicht.|Contracts pay gold immediately and strengthen only the next attack: double enemies, an extra boss or more protection and speed. Spent gold still counts; starting gold and sales do not.
Nach Welle 35 kannst du endlos weiterspielen. Die Goldwertung bis Welle 35 bleibt gespeichert; Endlos hat eine eigene Bestenliste. Gleicher Tag, gleicher Angebotsplan. Account erforderlich; neue Gier-Ergebnisse warten auf Freigabe.|Continue endlessly after wave 35. Your wave-35 gold score stays saved; Endless has its own leaderboard. Same day, same offers. Account required; new Greed scores await review.
Freigegebene Bestwerte des gewählten Tages · Verdientes Gold.|Approved best scores for the selected day · Gold earned.`);

HexTranslations.add(`Längere Missionen, neue Tagesvarianten|Longer missions, new daily variants
Umweg und Drei Dörfer dauern länger. Neue Tagesvarianten, Gierverträge und eine getrennte Goldwertung sorgen für neue Entscheidungen.|Detour and Three Villages last longer. New daily variants, Greed contracts and separate gold scores add new decisions.
NEU|NEW
VERBESSERT|IMPROVED
REDUZIERT|REDUCED
ENTFERNT|REMOVED
Tagesvarianten und Gierwertung|Daily variants and Greed scoring
Längere Straßen- und Dorfmissionen|Longer road and village missions
Weniger Draft-Nachschub|Less frequent draft supplies
Umweg-Planungsbuttons|Detour planning buttons
Tägliche Herausforderungen|Daily challenges
Die Kunst des Umwegs|The Art of the Detour
Mehr Strecke, zehn feste Türme und neue Straßen im laufenden Durchlauf.|More space, ten fixed towers and new roads during the run.
Wellenziel|Wave target
5 Wellen|5 waves
15 Wellen|15 waves
Feste Türme|Fixed towers
5 Türme|5 towers
10 Türme|10 towers
Lange Straßen nach Welle 3, Y-Kreuzungen nach Welle 6 und seltene Seitenkreuzungen nach Welle 9 ergänzen den Vorrat.|Long roads after wave 3, Y-junctions after wave 6 and rare side junctions after wave 9 expand your stock.
Ab Angriff 6 sind drei statt zwei neue Straßenplatzierungen möglich.|From attack 6, place three new roads instead of two.
Die Erklärung steht größer bei den Karten. Welle starten schließt die Planung ab; Rücknahme, separater Planungsbutton und Turmleiste entfallen.|Instructions are larger and beside the cards. Start Wave ends planning; undo, the separate planning button and the tower rail are removed.
Drei Dörfer|Three Villages
Wähle deine fünf Türme und verteidige die Dörfer über 20 Wellen.|Choose your five towers and defend the villages for 20 waves.
12 Wellen|12 waves
20 Wellen|20 waves
Oben stehen drei eigene Lebensbalken: N, M und S. Die Dörfer liegen von Norden über die Mitte bis Süden.|The HUD shows three separate health bars: N, M and S. Villages run from north through the middle to south.
Die späteren Angriffe steigen langsamer in der Stärke; Welle 20 enthält einen Abschlussboss.|Later attacks increase in strength more gradually; wave 20 includes a final boss.
Der Fluch der Gier|Curse of Greed
Erreiche Welle 35 und sammle möglichst viel verdientes Gold – mit eigener Turmauswahl.|Reach wave 35 and earn as much gold as possible with your own tower loadout.
35 Wellen|35 waves
Drei wechselnde Risikokarten und Kein Vertrag stehen unten bei der Hand. Acht Vertragsarten reichen von schnelleren Gegnern bis Doppelwelle und Zusatzboss.|Three changing risk cards and No Contract appear beside your hand. Eight contract types range from faster enemies to double waves and an extra boss.
Welle 35 und Endlos haben getrennte Gold-Bestenlisten pro Tag. Ausgaben senken die Wertung nicht; Startgold und Verkäufe zählen nicht. Neue Einträge werden geprüft.|Wave 35 and Endless have separate daily gold leaderboards. Spending does not lower your score; starting gold and sales do not count. New entries are reviewed.
Abwechslung im Kalender|Calendar variety
Gleicher Tag, gleiche Bedingungen. Beim nächsten Auftauchen ändern sich Tagesbedingungen.|Same day, same conditions. Daily conditions change when a mission returns.
Je nach Mission variieren Gegnerzusammenstellung, Turminseln, Bauplätze, eingeschaltete Leitfelder, Festungswege, Reliktpositionen oder Draft- und Gierangebote.|Depending on the mission, enemy composition, tower islands, building sites, enabled power fields, fortress paths, relic positions or draft and Greed offers vary.
Turm-Draft und Wandernde Festung|Tower Draft and Moving Fortress
Weniger Draft-Nachschub, nutzbare Tickets im Kampf und gewundene Festungswege.|Less frequent draft supplies, upgrade tickets usable in combat and winding fortress paths.
Nachschub|Supplies
Jede Welle|Every wave
Alle zwei Wellen|Every two waves
Nach den drei Startangeboten gibt es ein Angebot nach jeder zweiten Welle. Gespeicherte Verbesserungstickets können auch im Kampf eingelöst werden.|After three initial picks, receive one offer after every second wave. Saved upgrade tickets can also be used during combat.
Die Festung zieht über vier gewundene Strecken. Turmmenüs nutzen mehr freien Bildschirmplatz; die Turmleiste sitzt mittig am linken Rand.|The fortress travels along four winding routes. Tower menus use more available screen space; the tower rail is centered on the left edge.`);

HexTranslations.add(`15 Angriffe, zehn feste Türme. Erst sechs, danach zwei Straßen; ab Welle 6 drei. Neue Karten nach Welle 3, 6 und 9. Karten bleiben im Vorrat. Starte direkt mit Welle starten; ungenutzte Platzierungen verfallen.|15 attacks, ten fixed towers. Place six roads initially, then two; three from wave 6. New cards arrive after waves 3, 6 and 9. Keep unused cards. Start directly with Start Wave; unused placements expire.
Alle drei Dörfer müssen 20 Wellen überleben. Die Markierungen zeigen Eingang und Ziel. Gemeinsame Wege nutzen; zwischen Wellen zwei Türme kostenlos umsetzen.|All three villages must survive 20 waves. Markers show entrances and targets. Use shared routes; move two towers for free between waves.
Karten bleiben im Vorrat. Nach jeder Welle gibt es Nachschub. Neue Karten nach Welle 3, 6 und 9. Starte den Angriff mit „Welle starten“, sobald deine Straße bereit ist.|Cards stay in your stock. Receive supplies after every wave. New cards arrive after waves 3, 6 and 9. Start the attack with Start Wave once your road is ready.
15 Angriffe|15 attacks
Angriff|Attack
Straßen platzierbar|roads available to place
Turmauswahl|Tower loadout`);

HexTranslations.add(`Längere Missionen, direkter Turm-Draft und ein einfacheres Stromnetz. Neue Tagesvarianten und Gierverträge bringen Abwechslung.|Longer missions, direct tower drafting and a simpler power grid. Daily variants and Greed contracts add variety.
Turm-Draft und Stromnetz|Tower Draft and Power Grid
Je nach Mission variieren Gegnerzusammenstellung, Turminseln, Bauplätze, Festungswege, Reliktpositionen oder Draft- und Gierangebote.|Depending on the mission, enemy composition, tower islands, building sites, fortress paths, relic positions or draft and Greed offers vary.
Turm-Draft geht bis Welle 35. Die Karte wächst nach Welle 5, 10, 15, 20, 25 und 30 um zwei Straßenhexe; der nächste Ausbau wird angekündigt.|Tower Draft lasts 35 waves. Two road hexes are added after waves 5, 10, 15, 20, 25 and 30; the next expansion is announced.
Ziehe eine Draftkarte direkt auf einen Bauplatz. Die Auswahl der drei Starttürme ist deutlicher; während des Kampfes verschwindet das Draftfeld.|Drag a draft card directly onto a building site. The three starting picks are clearer; the draft panel disappears during combat.
Die längere Mission hat eine flachere Gegnerkurve. Ticketangebote enthalten ab Welle 12 zwei, ab Welle 24 drei Verbesserungen.|The longer mission has a gentler enemy curve. Ticket offers contain two upgrades from wave 12 and three from wave 24.
Stromnetz: direkt auf der Karte|Power Grid: directly on the map
Eine klare Regel: verbundene gelbe Felder versorgen alle Türme darauf.|One clear rule: connected yellow fields power every tower on them.
Grenze bei neuen Runs|Limit in new runs
6 Leitfelder und 6 Türme|6 conducting fields and 6 towers
6 Leitfelder; alle Türme darauf|6 conducting fields; every tower on them
Generatoren und Leitfelder haben sichtbare Strommasten. Schalte Leitfelder am Blitzsymbol; Gelb bedeutet versorgt, Grau aus und Orange ohne Generatorverbindung.|Generators and conducting fields have visible power pylons. Toggle fields via the lightning icon; yellow means powered, grey off and orange disconnected.
Die zusätzliche Turmbegrenzung und einzelne Turmschalter entfallen bei neuen Runs. Während eines Angriffs bleibt das Netz fest. Bestehende Runs behalten ihre Regeln.|New runs remove the additional tower cap and individual tower switches. The network stays fixed during attacks. Existing runs keep their rules.
Versorgung und Anleitung stehen größer bei den Karten statt in der kleinen Ecke.|Power status and instructions are larger and beside the cards instead of in the small corner.
Direkt auf einen Bauplatz ziehen oder antippen|Drag directly onto a building site or tap
Am gebauten Turm einlösen|Use on a built tower
Sofort +5 Leben|Instant +5 health
WÄHLE DEINE 3 STARTTÜRME|CHOOSE YOUR 3 STARTING TOWERS
WÄHLE 1 VERSTÄRKUNG|CHOOSE 1 REINFORCEMENT
gewählt|chosen
Vorbereitung|Preparation
Karte wächst nach Welle|Map expands after wave
um 2 Straßenhexe am Gegner-Eingang.|by 2 road hexes at the enemy entrance.
Nachschub: alle 2 Wellen.|Supplies: every 2 waves.
Karte vollständig erweitert.|Map fully expanded.
Leitfelder|conducting fields
Türme versorgt|towers powered
Generator · Stromquelle|Generator · power source
Strom umschalten|Toggle power
⚡ Gelb = versorgt. Stromnetz während der Welle gesperrt.|⚡ Yellow = powered. Power grid locked during the wave.
Klicke ⚡ auf der Karte. Verbinde bis zu 6 benachbarte Leitfelder mit einem Generator. Gelb: alle Türme darauf greifen an. Grau: kein Strom. Orange: eingeschaltet, aber nicht verbunden.|Click ⚡ on the map. Connect up to 6 neighboring conducting fields to a generator. Yellow: every tower on this field attacks. Grey: no power. Orange: on but disconnected.
Überlebe zwölf Wellen. Klicke die Blitzsymbole auf der Karte: bis zu sechs benachbarte Leitfelder mit einem Generator verbinden. Gelbe Felder versorgen alle Türme darauf automatisch. Graue Felder sind aus; orange Felder sind eingeschaltet, aber nicht verbunden. Während der Welle bleibt die Auswahl fest.|Survive twelve waves. Click lightning icons on the map to connect up to six neighboring conducting fields to a generator. Yellow fields power every tower on them automatically. Grey fields are off; orange fields are on but disconnected. Your allocation is fixed during the wave.
Überlebe zwölf Wellen. Die beiden großen Strommasten sind Generatoren. Klicke die Blitzsymbole der kleinen Masten, um bis zu sechs Leitfelder einzuschalten. Benachbarte Felder leiten den Strom weiter.|Survive twelve waves. The two large power pylons are generators. Click lightning icons on the small pylons to enable up to six conducting fields. Neighboring fields pass power along.
Gelb: mit einem Generator verbunden – alle Türme auf diesem Feld kämpfen. Grau: ausgeschaltet. Orange: eingeschaltet, aber ohne Verbindung. Es gibt kein zusätzliches Turmlimit und keine einzelnen Turmschalter. Während einer Welle bleibt das Netz unverändert.|Yellow: connected to a generator, all towers on this field fight. Grey: off. Orange: on but disconnected. No additional tower cap or individual tower switches. The network remains fixed during waves.
Wähle vor dem ersten Angriff drei Angebote, danach eines nach jeder zweiten Welle. Ziehe gewählte Türme direkt auf freie Bauplätze oder wähle sie links. Tickets am gebauten Turm auch während der Welle einlösen. Die Karte wächst alle fünf Wellen. Ziel: 35 Wellen; Gold ist hier nicht ausgebbar.|Choose three offers before the first attack, then one after every second wave. Drag chosen towers directly to free sites or select them on the left. Use tickets on built towers, even during waves. The map expands every five waves. Goal: 35 waves; gold cannot be spent here.
Überlebe 35 Wellen. Die Karte wächst nach Welle 5, 10, 15, 20, 25 und 30 um je zwei Straßenhexe. Wähle jeweils eines von drei Angeboten: vor Welle 1 dreimal, danach nach jeder zweiten Welle.|Survive 35 waves. The map gains two road hexes after waves 5, 10, 15, 20, 25 and 30. Choose one of three offers: three times before wave 1, then after every second wave.
Ziehe eine Turmkarte direkt auf einen freien Platz oder wähle sie erst aus und baue über die linke Turmleiste. Tickets erlauben eine normale Verbesserung deiner Wahl, auch während einer Welle. Reparaturen heilen fünf Basisleben. Unverbrauchte Türme und Tickets bleiben erhalten.|Drag a tower card to a free site or choose it and build via the left tower rail. Tickets grant a regular upgrade of your choice, even during waves. Repairs heal five base health. Unused towers and tickets are kept.
Kein Gold-Shop, Verkauf, Basis-Ausbau, Verbrauchshilfen oder persönliche Arsenalboni. Neue Türme baust du zwischen Wellen. Kein Endlosmodus. Sieg: einmal täglich zehn Diamanten.|No gold shop, selling, base upgrades, consumables or personal arsenal bonuses. Build new towers between waves. No endless mode. Victory: ten diamonds once per day.
35 Wellen mit deiner gedrafteten Verteidigung überlebt. Kein Endlosmodus.|Survived 35 waves with your drafted defenses. No endless mode.`);

HexTranslations.add(`⌛ Noch|⌛ Remaining
Wellen · Frist: Ende Welle 12|waves · Deadline: end of wave 12
◆ Geborgen:|◆ Recovered:
◆ Entdeckt:|◆ Discovered:
Straße zu ◆ bauen und andocken.|Build a road to ◆ and connect it.
Das erste Relikt ist von Anfang an markiert. Nach jeder Bergung wird das nächste sichtbar; beim Erkunden kannst du es auch früher entdecken. Die Frist sinkt nach jeder abgeschlossenen Welle um eins.|The first relic is marked from the start. Recovering it reveals the next; exploration can reveal it sooner. The deadline decreases by one after each completed wave.
Das erste Relikt ist markiert; nach einer Bergung wird das nächste sichtbar. Relikte sind die goldenen ◆-Missionsfelder. Verbinde alle drei über Straßen mit der Basis und überlebe danach eine Welle. Je früher, desto besser; spätestens Welle 12. Aufdecken allein reicht nicht! Zwei Hexe pro Bauphase, Karten beliebig wiederverwendbar. Danach Planung abschließen.|The first relic is marked; recovering a relic reveals the next. Relics are the golden ◆ objective tiles. Connect all three to the base by road and survive one more wave. Earlier is better; wave 12 is the deadline. Revealing alone is not enough! Two hexes per preparation phase, with reusable cards. Then finish planning.`);

HexTranslations.add(`
Für deinen Partner · sofort verfügbar|For your partner · available immediately
⇄ Turmverstärkung & Partnerportal|⇄ Tower reinforcement & partner portal
Speichern gesperrt: Dieser Browser stellt keine sichere Speichersperre bereit. Öffne das Spiel über HTTPS in einem aktuellen Browser.|Saving disabled: This browser does not provide a safe storage lock. Open the game over HTTPS in a current browser.
Speichern gesperrt: Der Browser-Speicher ist nicht verfügbar oder der Spielstand wurde außerhalb dieses Tabs geändert. Bitte lade die Seite neu.|Saving disabled: Browser storage is unavailable or the save changed outside this tab. Please reload.
Nur-Lese-Modus: Ein anderer Spiel-Tab hält die Speichersperre. Schließe ihn. Die Sperre wird beim Zurückkehren automatisch erneut geprüft.|Read-only mode: Another game tab holds the storage lock. Close it. The lock is checked again when you return.
`);

HexTranslations.add(`
Duo: Partnerhilfe und Korrekturen|Duo: partner support and fixes
Geschenke sind wertvoller, Verstärkung ist leichter zu finden und Gegner folgen Kurven sauberer.|More valuable gifts, easier-to-find reinforcements and enemies that follow bends correctly.
Das Goldgeschenk hat eine eigene goldene Geschenk-Karte. Bereits offene alte Angebote bleiben gültig.|The gold gift has its own golden gift card. Existing pending offers remain valid.
Turmverstärkung und Partnerportal sind direkt über die Teamleiste erreichbar.|Tower reinforcements and the partner portal are accessible directly from the team bar.
Die geglättete Gegnerbewegung folgt dem zurückgelegten Straßenverlauf statt Kurven abzukürzen.|Smoothed enemy movement follows the travelled road instead of cutting across bends.
Partnergeschenk|Partner gift
20 Gold|20 gold
50 Gold|50 gold
Expedition: Relikte und Zeitdruck|Expedition: relics and deadline
Das nächste Ziel wird klarer sichtbar, Relikte feiern ihren Fund und spätere Wellen werden stärker.|The next objective is clearer, relics celebrate discovery and later waves grow stronger.
Das erste Relikt ist markiert. Nach einer Bergung erscheint spätestens das nächste noch fehlende Relikt.|The first relic is marked. Recovering one reveals the next missing relic at the latest.
Neu sichtbare Relikte erhalten Sterne, einen Ton und einen Kamerafokus; die Bergung erhält einen eigenen goldenen Effekt.|Newly visible relics get stars, a sound and camera focus; recovery gets its own golden effect.
Die Frist zählt nach jeder abgeschlossenen Welle herunter. Die letzten drei Warnsignale sind eindringlicher.|The deadline counts down after each completed wave. The final three warning sounds are more urgent.
Turmmenüs nutzen mehr Bildschirmhöhe und die linke Turmleiste ist in der Expedition zentriert.|Tower menus use more screen height and the left tower bar is centered in Expedition.
Zusätzliche Lebens- und Schutzskalierung je Welle ab Welle 3|Additional health and protection scaling per wave from wave 3
12 %|12%
20 %|20%
Menüs und Speichern|Menus and saving
Fokusaktionen stehen beim Angriffsfokus; Popup-Positionen und die Speichersperre beim Seitenwechsel sind korrigiert.|Focus actions sit beside targeting settings; popup positioning and storage locks during navigation are fixed.
Fokus kopieren und einfügen stehen unter Angriffsfokus – auch im Solospiel.|Copy and paste focus appear below targeting settings, including in solo play.
Das Basismenü orientiert sich an seinem Button und wird nicht mehr durch die mittige Duo-Leiste nach unten verschoben.|The base menu anchors to its button without being pushed down by the central Duo bar.
Speichersperren werden beim Verlassen der Seite freigegeben und bei der Rückkehr erneut geprüft. Veraltete Daten dürfen weiterhin keinen neueren Spielstand überschreiben.|Storage locks are released on page exit and checked again on return. Stale data still cannot overwrite a newer save.
Duo-Verbesserungen und Reliktjagd|Duo improvements and relic hunt
Stärkere Partnergeschenke, sauberere Duo-Bewegung und mehr Orientierung und Spannung in der Expedition.|Stronger partner gifts, cleaner Duo movement and more guidance and tension in Expedition.
VERBESSERT|IMPROVED
Partnergeschenk: 50 Gold|Partner gift: 50 gold
NEU|NEW
Relikteffekte und Fristwarnungen|Relic effects and deadline warnings
SCHWIERIGER|HARDER
Spätere Expeditionswellen|Later Expedition waves
KORRIGIERT|FIXED
Duo-Kurven und Speichersperren|Duo bends and storage locks
Duo|Duo
Tägliche Herausforderungen|Daily challenges
Allgemeine Verbesserungen|General improvements
`);

HexTranslations.add(`
Deine Turmauswahl|Your tower loadout
Turmauswahl deines Partners|Your partner's tower loadout
Wähle fünf Türme für diese Duo-Partie. Änderungen heben eure Bereitschaft auf.|Choose five towers for this Duo match. Changes reset both players' ready status.
Turmauswahl übernehmen|Apply tower loadout
Wartet auf deinen Partner …|Waiting for your partner …
Turmauswahl übernommen. Beide Spieler müssen sich erneut bereit melden.|Tower loadout applied. Both players must ready up again.
Partnergeschenke|Partner gifts
⇄ Partnerhilfe & Geschenke|⇄ Partner support & gifts
Vom Partner erhalten:|Received from your partner:
Dein Partner hat noch kein Geschenk gewählt.|Your partner has not chosen a gift yet.
Diese Geschenke kann dein Partner dir schicken:|Your partner can send you one of these gifts:
Sofort verfügbares Gold|Gold available immediately
✓ Erhalten|✓ Received
Du hast verschenkt:|You sent:
Stimmt euch ab. Jeder wählt das Geschenk für den anderen.|Coordinate with each other. Each player chooses a gift for their partner.
`);

HexTranslations.add(`
Wähle fünf Türme für diese Duo-Partie. Änderungen heben deine Bereitschaft auf.|Choose five towers for this Duo match. Changes reset only your ready status.
Turmauswahl übernommen. Melde dich anschließend erneut bereit.|Tower loadout applied. Ready up again when you are done.
`);

HexTranslations.add(`
Duo: flüssiger und kompakter|Duo: smoother and more compact
Weniger Bildschirmfläche für Hinweise, stabilere Leisten und flüssigere Gegnerbewegung.|Less screen space for hints, stable sidebars and smoother enemy movement.
Die Teamleiste sitzt kompakt am oberen Bildschirmrand. Lange Anleitungstexte entfallen.|The compact team bar sits at the top edge. Long instruction text is removed.
Turm- und Biomleisten bleiben beim Verschieben, Kaufen und Verbessern an ihrem Platz.|Tower and biome bars stay in place while panning, building and upgrading.
Gegnerbewegungen werden gepuffert und nicht mehr doppelt geglättet. Der Kartenabgleich wird bei reinen Bewegungsschritten reduziert.|Enemy motion is buffered and no longer smoothed twice. Motion-only updates avoid repeated map synchronization.
Bei langsamen Verbindungen werden überholte Ansichten nicht hintereinander nachgeholt.|Slow connections no longer queue outdated views for later playback.
Noch offene alte Goldgeschenke|Pending legacy gold gifts
20 Gold|20 gold
50 Gold|50 gold
Partnergeschenke und Turmauswahl|Partner gifts and tower loadouts
Stimmt eure Geschenke und Türme vor dem nächsten Angriff ab.|Coordinate gifts and towers before the next attack.
Die Geschenkangebote des Partners sind einsehbar; erhaltene Geschenke werden mit Name oder Goldbetrag angezeigt.|Partner gift offers are visible; received gifts show the card name or gold amount.
Noch offene alte 20-Gold-Angebote werden beim Fortsetzen auf 50 Gold angehoben. Bereits ausgezahlte Geschenke werden nicht erneut gutgeschrieben.|Pending legacy 20-gold offers become 50 gold on resume. Completed gifts are not paid again.
In der Duo-Lobby wählst du fünf Türme und siehst die Turmauswahl deines Partners.|Choose five towers in the Duo lobby and see your partner’s loadout.
Eine geänderte Turmauswahl hebt nur deine eigene Bereitschaft auf.|Changing your tower loadout clears only your own ready status.
Duo: Gemeinsam besser vorbereitet|Duo: better prepared together
Kompakte Teamleiste, bessere Bewegung und gemeinsame Planung von Geschenken und Türmen.|A compact team bar, smoother movement and shared gift and tower planning.
NEU|NEW
Loadout-Wahl in der Duo-Lobby|Duo lobby loadout selection
Partnerangebote ansehen|View partner gift offers
VERBESSERT|IMPROVED
Offene Goldgeschenke: 50 Gold|Pending gold gifts: 50 gold
KORRIGIERT|FIXED
Bewegung und springende Leisten|Movement and shifting sidebars
Duo-Modus|Duo mode
`);
