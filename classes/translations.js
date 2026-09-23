/* Display strings only: never translate IDs or persisted game data. */
globalThis.HexTranslations={de:{
Archer:'Bogenschütze',Freeze:'Frostturm',Waveplanung:'Wellenplanung',Waves:'Wellen',Wave:'Welle',Towerbau:'Turmbau',Tower:'Turm','Turret-Slots':'Turmplätze','Turret-Slot':'Turmplatz',Slots:'Bauplätze',Slot:'Bauplatz',Gebäudeslot:'Gebäudeplatz',Loadouts:'Turmauswahlen',Loadout:'Turmauswahl',Runs:'Durchläufe',Run:'Durchlauf',Runende:'Durchlaufende',Runzustand:'Durchlaufzustand',RUN:'DURCHLAUF',Base:'Basis',Map:'Karte',Maps:'Karten',Hero:'Festungsprofil',Supportturm:'Unterstützungsturm',Support:'Unterstützung',Slow:'Verlangsamung',Bosskiller:'Bossjäger','Single-Target-Schaden':'Einzelzielschaden',Killzones:'Kampfbereiche',Killzone:'Kampfbereich',Kills:'Besiegte Gegner',Kill:'besiegtem Gegner',Bossloot:'Bossbeute',Shrines:'Schreine',Shrine:'Schrein',Common:'Gewöhnlich',COMMON:'GEWÖHNLICH',Uncommon:'Ungewöhnlich',UNCOMMON:'UNGEWÖHNLICH',Rare:'Selten',RARE:'SELTEN',Epic:'Episch',EPIC:'EPISCH',Legendary:'Legendär',LEGENDARY:'LEGENDÄR',Upgrades:'Verbesserungen',Upgrade:'Verbesserung',Hotkeys:'Tastenbelegung',Presetplätze:'Vorlagenplätze',Preset:'Vorlage',Seed:'Startwert','Endless-Modus':'Endlosmodus',Checkpoint:'Zwischenstand',Reset:'Zurücksetzen','Hex-Placement':'Hex-Platzieren',Placement:'Platzieren','Hex-Grid':'Hex-Raster',Hexgrid:'Hex-Raster',Grid:'Raster',HP:'LP',MR:'Magieresistenz',Sounds:'Ton','Download / Upload':'Herunterladen / Hochladen',Download:'Herunterladen',Upload:'Hochladen','TOWER DEFENSE':'TURMVERTEIDIGUNG',Space:'Leertaste'
},en:{}};
// One source phrase and its English equivalent per line; dynamic fragments may compose.
globalThis.HexTranslations.add=function(rows){for(const line of rows.trim().split('\n')){const at=line.indexOf('|');if(at>0)this.en[line.slice(0,at)]=line.slice(at+1);}};
HexTranslations.add(`
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
20 HP · 55 Gold. Base-Upgrades 25 % günstiger und eine zusätzliche dritte Stufe.|20 HP · 55 gold. Base upgrades cost 25% less and gain a third level.
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
20 HP · 70 Gold. Ausgewogener Start; zwei Stufen je Base-Ausbau.|20 HP · 70 gold. Balanced start; two levels per base upgrade.
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
↻ Drehen|↻ Rotate
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
