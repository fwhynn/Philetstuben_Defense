# Multiplayer-Prüfung – 21.09.2026

Automatisiert ohne Browser oder Benutzereingriff. Ergebnis: **265 Tests bestanden, 0 fehlgeschlagen**. Fünf neue Szenarien in `tests/duo-resilience.test.cjs`; in diesen Prüfungen kein neuer Fehler gefunden.

## Zusätzliche Szenarien

- Acht parallele identische Kaufnachrichten: genau ein Turm und ein Goldabzug, sieben wiederholte Bestätigungen. Veränderte Nachricht mit verbrauchter Sequenznummer wird abgewiesen.
- HTTP: kaputtes JSON (400), übergroße Nachricht (413), neue Verbindung mit vorhandenem Sitzungstoken: ursprünglicher Platz, Gold und nächste Aktionsnummer erhalten.
- 110 Kombinationen aus Aktionsarten und fehlerhaften Payloads: kein Absturz, keine Mutation von Maps/Gold/HP.
- Getrennte Lobbys: fremde Match-Epoche abgewiesen, kein Übergriff auf anderen Raum. Ablauf mit kontrollierter Uhr: alte Sitzung ungültig, neues Erstellen vergibt andere Zugangsdaten.
- Drei Bot-Partien ausschließlich über erlaubte Commands: Karten legen, Kartenbelohnungen wählen, Archer bauen, bereit melden. Keine künstlichen Gold-/HP-Zuschüsse. Ergebnisse: Seed soak-a Niederlage in Wave 10; soak-b Wave 12 mit 23 Team-HP; soak-c Wave 12 mit 20 Team-HP. Abbruchgrenze Wave 12, kein Nachweis für komplette Boss-/Endless-Runs. Zusammen 20.400 simulierte Schritte à 50 ms.
- Acht gleichzeitig belegte Räume: neunter Raum abgewiesen, unabhängige Simulation, 16 parallele authentifizierte HTTP-Abfragen. 40 gemeinsame Tickaufrufe bei kleinen Startmaps: p95 4,69 ms im dokumentierten lokalen Lauf. Dies ist eine Momentaufnahme, keine Produktionskapazitätsgarantie oder Langzeitmessung.

Bestehende Tests decken zusätzlich verlorene Kaufbestätigungen, automatischen Tick ohne Clientabfragen, Portal-Verstärkung, gemeinsame HP, Wave-/Belohnungsbarrieren und interne Checkpoints ab.

## Grenzen

Keine Browser-/WebGL-/Touch-Abnahme. Kein echtes WLAN-/Internet-Störungsprofil. Eine neue HTTP-Verbindung im laufenden Prozess ist keine Wiederaufnahme nach Prozessneustart. Lobby-Trennungspausen, dauerhafte Wiederverbindung und Internet-Hosting fehlen noch. Große Karten und spätere Wellen sind nicht Teil der kurzen Parallelmessung.

## Wiederholen

Vom Repository-Hauptordner:

    node --test --test-isolation=none towerdefense-v0.1/tests/*.test.cjs server/tests/*.test.cjs

Nur die neuen Szenarien:

    node --test --test-isolation=none server/tests/duo-resilience.test.cjs
