# Projekt-Arbeitsweise

- Vor einem vom Nutzer angeforderten Push oder Release die tatsächlichen spielerrelevanten Änderungen in patch-notes.json unter version next zusammenfassen. Bestehende Einträge nicht löschen; vorhandene next-Notizen ergänzen und Doppelungen vermeiden. Nur umgesetztes Verhalten beschreiben. Keine technischen Interna oder sensiblen Daten veröffentlichen.
- Der normale Client-Release (npm run tag) versieht diese Notizen mit Versionsnummer und Datum. Einen Push oder Release nicht eigenständig ausführen, wenn der aktuelle Auftrag dies nicht verlangt.
- Keine eigenständigen Browsertests, außer ausdrücklich angefordert. Der Nutzer übernimmt die Browserprüfung; gezielte automatisierte Tests sind erwünscht.
- Erstspieler-Tests auf localhost über das isolierte Testprofil durchführen. Echte Profil- und Accountdaten nicht zum Testen zurücksetzen.
