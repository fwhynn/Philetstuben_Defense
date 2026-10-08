# Patch Notes

Spieler finden die Änderungen im Hauptmenü unter „Patch Notes · Was ist neu?“. Datenquelle ist patch-notes.json; neueste Veröffentlichung zuerst. Ein next-Eintrag heißt sichtbar „In Vorbereitung“ und wird nicht als bereits veröffentlicht ausgegeben.

Vor einem Release fasst der bearbeitende Agent die tatsächlichen spielerrelevanten Änderungen im next-Eintrag zusammen. Technische Commit-Titel, geheime Daten und unbelegte Behauptungen gehören nicht hinein. Bestehende Release-Einträge bleiben erhalten.

Der vorhandene Client-Release über npm run tag prüft die Notizen vor der Versionserhöhung, ersetzt next durch die neue Version und ergänzt das UTC-Datum. Notizen und Versionsdateien kommen in denselben Release-Commit. Fehlen Notizen, bricht der Release ab. Server-only- und Test-Tags verändern diese Veröffentlichungshistorie nicht.

Ein gewöhnliches git push startet kein KI-Modell und erzeugt keine Zusammenfassung. Dafür gilt die Arbeitsanweisung in AGENTS.md: vor einem angeforderten Push den next-Eintrag pflegen. Es wird kein API-Schlüssel und kein Hintergrunddienst benötigt.
