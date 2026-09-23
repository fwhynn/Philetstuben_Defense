# Gegnerausbau und Balancing

Stand: 21.09.2026. Erster Teil umgesetzt: biomabhängige Wächterresistenzen. Die weiteren Gegnertypen sind für die Zukunft vorgemerkt. Die folgenden technischen Leitplanken sind Umsetzungsvorschläge; konkrete Werte werden erst im Balancing festgelegt.

## Bereits umgesetzt: Wächterresistenzen

Das Herkunftsbiom wird beim Spawn festgeschrieben und bleibt auf dem Weg zur Base erhalten. Aschelande: 50 % weniger Feuerschaden (Flammenturm und alle Feuer-Upgrades des Elementturms). Sturmhochland: 50 % weniger Blitz- und Windschaden. Dünenmeer: gesamte Verlangsamung durch Gelände und Türme wirkt halb so stark; keine zusätzliche Schadensresistenz, weil das Biom keine Schadensart verstärkt. Grasland bleibt neutral. Gilt für Erkundungswächter und regelmäßige Bosse entsprechend ihrem Spawn-Hex. Werte sind erste Balancing-Werte, keine Immunitäten. Biom-Infos erklären die Effekte.

## Elementimmunitäten – später

Einheiten können gegen bestimmte Schadensarten immun sein, beispielsweise Feuer, Wasser oder Blitz. Schadensarten ausdrücklich an Angriffen hinterlegen; sie sind unabhängig von den bestehenden Trefferpunkt-Pools Leben, Rüstung und Magieresistenz. Feuer umfasst den Flammenturm und den Feuerzweig des Elementturms einschließlich seiner Upgrades. Blitz betrifft entsprechende Kettenblitz-Angriffe; weitere Elemente werden den tatsächlichen Angriffen zugeordnet.

Vor Umsetzung festlegen, ob eine Immunität nur Schaden oder zusätzlich Effekte wie Verlangsamung verhindert. Das darf nicht stillschweigend dasselbe sein. Wellenplanung und Gegnersymbole müssen Immunitäten vorher verständlich ankündigen, auch per Antippen auf Mobile. Gegnerzusammenstellungen gegen die verfügbaren Loadouts prüfen: keine unvermeidbar unbesiegbaren Wellen, besonders bei fest vorgegebenen Challenge-Decks. Häufigkeit und Kombination mehrerer Immunitäten bleiben Balancing-Entscheidungen.

## Aufteilung und Herabstufung

Beim Tod entstehen zwei oder vier kleinere, schwächere Gegner; alternativ wird ein Gegner in eine schwächere Form herabgestuft. Kinder übernehmen eine gültige Position und verbleibende Route. Sie zählen zur aktiven Wave, bevor deren Abschluss geprüft wird. Die mögliche Zahl von Teilungen und die Gesamtzahl zusätzlicher Gegner begrenzen.

Leben, Geschwindigkeit, Base-Schaden und Belohnungen je Stufe separat festlegen. Gold, Seelen und Profil-Kills dürfen durch Teilung keine unbeabsichtigte Endlosschleife oder übermäßige Belohnungsvermehrung erzeugen. Statistiken unterscheiden bei Bedarf ursprüngliche Gegner und Kinder. Dasselbe Verhalten muss später auf dem autoritativen Duo-Server funktionieren.

## Heiler

Ein eigener Gegnertyp heilt andere Gegner innerhalb einer klar definierten Reichweite mit festem Intervall. Heilung darf den jeweiligen Maximalwert nicht überschreiten. Vor Umsetzung entscheiden, welche Trefferpunkt-Pools geheilt werden und ob andere Heiler zulässige Ziele sind. Wiederbelebung ist nicht Bestandteil dieser Idee. Heilung und Heiler müssen visuell erkennbar sein; Zielprioritäten sollen eine gezielte Bekämpfung ermöglichen.

## Beschwörer und Wiederbeleber – später

Zusätzlich vom Nutzer vorgemerkt: Gegner, die während ihres Lebens weitere Einheiten spawnen, andere Gegner wiederbeleben oder beides kombinieren. Als getrennte Fähigkeiten konzipieren, die später kombiniert werden können. Spawn-Intervall, Gesamtlimit und maximale Anzahl gleichzeitig lebender Beschwörungen festlegen. Wiederbelebung benötigt gültige Todespositionen, begrenzte Wiederholungen und klare Regeln für Leben, Route, Gold, Seelen und Kill-Statistik. Keine unbegrenzten Spawn-/Wiederbelebungsschleifen; ausstehende Beschwörungen müssen beim Wave-Ende berücksichtigt werden. Noch nicht umgesetzt.

## Gezielte Wegwahl

Spezialgegner wählen gezielt den kürzesten oder schnellsten gültigen Weg zur Base. Normale Gegner behalten ihre bisherige zufällige Auswahl unter schleifenfreien Wegen.

„Kürzester“ bedeutet gesamte Straßenlänge, nicht bloß Anzahl der Hexe. „Schnellster“ berücksichtigt zusätzlich relevante lokale Geschwindigkeitsänderungen. Welcher Ansatz zum jeweiligen Gegner gehört und wann neu geplant wird, wird vor Implementierung festgelegt. Keine Schleifen, kein Feststecken und keine gegenseitige Blockierung einführen.

## Sinnvolle Umsetzungsschritte

1. Schadensarten und Gegnerfähigkeiten als Daten definieren, Anzeigen in der Wellenplanung ergänzen.
2. Einen einzelnen Immunitätsgegner mit passenden Wellenregeln einführen und balancieren.
3. Teilungsgegner einschließlich Spawn-Verwaltung, Belohnungsregeln und Statistiken ergänzen.
4. Heiler und gezielte Wegwahl jeweils separat hinzufügen.
5. Erst danach Fähigkeiten kombinieren und Herausforderung-/Duo-Pools erweitern.

Gezielte Logiktests für Immunitäten, Teilung, Wave-Ende, Heilgrenzen und gültige Wege. Visuelle Spieltests übernimmt der Nutzer; keine automatischen Browsertests ohne ausdrücklichen Auftrag.

## Implementierter erster Bossdurchgang (21.09.2026)

Periodische Bosse differenziert: Eisenkoloss auf Wave 15 mit Rüstung und höherem Base-Schaden, Sturmjäger auf Wave 25 mit Tempo und Slow-Widerstand, Seelenmatriarchin auf Wave 35 mit Magieresistenz-Pool und begrenzter Beschwörung (6 Sekunden, höchstens 6 Diener, keine Goldbeute). Grund-HP-Skalierung bleibt erhalten. Nachfolgende Bosse rotieren diese drei Varianten; Herkunftsbiom-Resistenzen bleiben zusätzlich aktiv. Beschwörungen sind Teil des Runzustands/Checkpoints und verhindern vorzeitigen Waveabschluss. Werte sind vorläufig; allgemeine Beschwörer/Wiederbeleber als normale Gegner bleiben Zukunftsarbeit.

## Drei vorgeschlagene normale Spezialgegner (23.09.2026)

Status: Vorschläge, noch nicht implementiert. Sie ersetzen einzelne reguläre Gegnerplätze statt die Grundzahl der Welle pauschal zu erhöhen. Einstieg jeweils ankündigen und Fähigkeit in der Wellenplanung zeigen. Werte sind vorläufig.

1. **Splittergolem – ab Welle 12.** Langsam und gepanzert; beim Tod entstehen an seiner aktuellen Position zwei kleinere, ungepanzerte Splitterlinge mit jeweils etwa 25 % seiner maximalen Lebenspunkte. Sie folgen dem verbleibenden Weg und können sich nicht erneut teilen. Flächenschaden wird dadurch wertvoll. Die bisherige Gesamtbeute wird auf Golem und Kinder verteilt: bei 3 Gold jeweils 1 Gold für den Golem und seine beiden Splitterlinge, insgesamt unverändert 3 Gold. Entkommene Kinder geben ihren Anteil nicht aus. Bei höherer Beute ganzzahlig teilen und den Rest dem ursprünglichen Golem zuweisen; keine zusätzliche Goldquelle durch Teilung. Kinder zählen für Kampfende und verursachen bei Durchbruch Schaden. Anfangs höchstens ein Golem pro Welle, später begrenzter Anteil. Route, nächste Wegmarke und Kind-IDs müssen deterministisch erhalten bleiben; keine neuen Kinder an einem Karteneingang starten.

2. **Feldheiler – ab Welle 18.** Kleine Heilreichweite von zunächst 50 Welteinheiten (knapp ein Hexradius), gut sichtbar markiert. Alle drei Sekunden heilt er nur andere Gegner innerhalb dieses Radius um etwa 5 % ihrer maximalen Lebenspunkte. Er heilt weder sich selbst noch andere Heiler, regeneriert keine Rüstung/Magieresistenz und überschreitet keine Maximalwerte. Mehrere Heiler dürfen denselben Gegner pro Heilintervall nicht mehrfach heilen. Sichtbarer Heilimpuls; eigene Gegnerpriorität „Heiler“ als gezielte Gegenmaßnahme. Zu Beginn ein Heiler pro Welle, danach weiterhin niedriger Anteil.

3. **Elementträger – ab Welle 26.** Pro Welle genau eine vor dem Start sichtbar angekündigte Feuer-, Wasser- oder Blitzvariante; alle Elementträger dieser Welle tragen dieselbe Immunität. Die Variante wird anhand des Run-Seeds bei der Wellenplanung aus den zulässigen Elementen gezogen, nicht erst beim Spawn. Nach Möglichkeit keine direkte Wiederholung zur letzten Welle mit Elementträgern. Kein nachträgliches Neuwürfeln bei Laden oder Wiederverbindung. Gemischte Elementträger innerhalb einer Welle sind vorerst nicht geplant. Gegen genau diese Schadensart immun, gegen andere Schadensarten normal verwundbar. Keine pauschale Magieimmunität. Wasserimmunität blockiert auch die direkte Wasser-Verlangsamung, nicht die Frostturm-Aura. Anfangs höchstens ein Elementträger; Immunität nur auswählen, wenn die Run-Turmauswahl mindestens einen schädigenden Gegenpol bauen kann. Keine Immunitätskombinationen; klare Farbe plus Symbol und Text. Nachziehende Wellen dürfen den Anteil nur moderat erhöhen. Biomboni und Resistenzregeln dürfen die angekündigte Immunität nicht stillschweigend verändern.

Empfohlene Reihenfolge: Splittergolem → Feldheiler → Elementträger. Zunächst jede Fähigkeit einzeln einführen; erst später innerhalb einer Welle kombinieren. Beschwörer und Wiederbeleber bleiben danach offen, damit Teilung, Heilung und Immunität zunächst separat austariert werden können. Keine zusätzlichen Figuren oder Tests dieser Fähigkeiten behaupten, solange sie nur geplant sind.

## Implementiert: Spezialgegner und kleine Turmkorrektur (23.09.2026)

- Frostturm: 5 % weniger Reichweite in allen Ausbaustufen; Feuer-/Flammenturm: 5 % weniger Schaden in allen Ausbaustufen. Kosten, Angriffstempo und Verlangsamungsstärke bleiben gleich.
- Splittergolem ab Welle 12: ersetzt einen normalen Gegner, 35 % Rüstung, 25 % langsamer. Beim Tod entstehen am selben Wegpunkt zwei ungerüstete Splitter mit je 25 % der maximalen Lebenspunkte. Jeder Splitter erhält ein Drittel des Goldbudgets (abgerundet), der Rest geht an den Hauptgolem. Auch tägliche Geldtransporte behalten insgesamt ihr ursprüngliches Goldbudget. Splitter können nicht weiter zerfallen, zählen für das Wellenende und verursachen je einen Basisschaden.
- Feldheiler ab Welle 18: 80 % der normalen Lebenspunkte, 10 % langsamer. Alle drei Sekunden heilt er andere Gegner im Radius 50 um 5 % ihrer maximalen Lebenspunkte. Keine Selbstheilung, keine Heilerheilung, keine Wiederherstellung von Rüstung oder Magieresistenz. Pro Ziel höchstens eine Heilung in drei Sekunden. Sichtbarer grüner Heilimpuls und Zielpriorität Heiler.
- Elementträger ab Welle 26: normale Lebenspunkte und Geschwindigkeit, genau eine Immunität gegen Feuer, Wasser oder Blitz. Innerhalb einer Welle identisch; Reihenfolge durch Run-Seed bestimmt, ohne direkte Wiederholung bei mehreren möglichen Elementen. Nur Elemente mit baubarem Schadenskonter werden gewählt. Wasserimmunität verhindert auch die direkte Wasserverlangsamung, nicht die Frost-Aura. Fähigkeiten stehen in der Wellenplanung, Symbol und Farbe markieren die Immunität.
- Pro Art anfangs ein Gegner, alle 15 weiteren Wellen einer mehr, maximal drei. Spezialgegner ersetzen normale Startplätze; keine zusätzliche anfängliche Gegnerzahl.
- Gemeinsame Solo-/Duo-Simulation; Heilintervalle und Immunitäten bleiben bei Zwischenständen erhalten. Automatisierte Regressionstests vorhanden; visuelle Abnahme und Langzeit-Balancing im Browser stehen aus.
