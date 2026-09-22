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
