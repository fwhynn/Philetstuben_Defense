# Rechtliches vor dem Steam-Release

Stand: 21.10.2026 · Branch `menudesign`. Technische und organisatorische Bestandsaufnahme, **keine Rechtsberatung**. Vor dem Release eine Anwältin, einen Anwalt oder einen spezialisierten Rechtstext-Dienst prüfen lassen.

## Umgesetzt im Branch

- `impressum.html` und `datenschutz.html` als Entwürfe. Die Datenschutzerklärung beschreibt den tatsächlichen Datenfluss im Code. Offene Angaben stehen als `[[…]]`.
- Links „Impressum · Datenschutz“ unten in der Mitte des Hauptmenüs und im Einstellungsfenster des Hauptmenüs. Damit sind beide Seiten aus dem Spiel mit einem Klick erreichbar.
- **Release-Sperre:** `npm run tag` bricht ab, solange eine der beiden Seiten noch `[[…]]` enthält (`legal-placeholders.cjs`, mit Test).
- Schriften sollen selbst gehostet werden, nicht über Google Fonts. Die Einbindung über Google-Server überträgt die IP-Adresse; das LG München I hat das 2022 als Datenschutzverstoß gewertet (Az. 3 O 17493/20).

## Was der Code heute an Daten verarbeitet

| Bereich | Daten | Speicherort / Dauer | Rechtsgrundlage (Vorschlag) |
| --- | --- | --- | --- |
| Spiel ohne Account | Fortschritt, Zwischenstände, Einstellungen, Sprache | nur `localStorage` auf dem Gerät | § 25 Abs. 2 Nr. 2 TDDDG, keine Einwilligung nötig |
| Besuchszählung (`server/site-visits.cjs`) | Hash aus IP + Browserkennung mit täglich neuem Salz; keine rohe IP gespeichert | stündlich 35 Tage, täglich 400 Tage | Art. 6 Abs. 1 lit. f DSGVO |
| Anfragebegrenzung (Duo, Bestenliste) | IP-Adresse im Arbeitsspeicher | etwa 60 Sekunden, nicht auf der Festplatte | Art. 6 Abs. 1 lit. f |
| Account (separate API `api.autohextd`) | Benutzername, Passwort-Hash, Token-Hashes, Erstellungsdatum, Cloud-Spielstand | bis zur Löschung | Art. 6 Abs. 1 lit. b |
| Bestenliste und Run-Wertung | Benutzername öffentlich, Bestwerte, Spielverlauf eines Runs zur Manipulationsprüfung, Moderation | **Frist festlegen** | Art. 6 Abs. 1 lit. b / f |
| Duo | Lobby-Code, Spielzustand, Aktionen, Ergebnisse | **Frist festlegen** | Art. 6 Abs. 1 lit. b |
| Reverse Proxy (Caddy) | Zugriffslogs sind im `Caddyfile` nicht aktiviert | **beim Hoster prüfen** (Docker-/Systemlogs) | Art. 6 Abs. 1 lit. f |

Keine Werbe- oder Analyse-Cookies, kein Tracking durch Dritte, three.js liegt lokal. Ein Cookie-Banner ist nach diesem Stand **nicht nötig**. Das ändert sich, sobald Analytics, Crash-Reporting von Drittanbietern oder Werbung dazukommen.

## Offene Punkte (nach Priorität)

1. **Impressum ausfüllen.** Name und ladungsfähige Anschrift (kein Postfach), E-Mail und ein zweiter schneller Kontaktweg (§ 5 DDG). Falls keine Privatadresse veröffentlicht werden soll: Impressum-Service oder Geschäftsadresse. Die frühere Pflicht zum Link auf die EU-Streitschlichtungsplattform ist mit deren Abschaltung im Juli 2025 entfallen.
2. **Account löschen im Spiel.** Die API hat derzeit keinen Lösch-Endpunkt. DSGVO Art. 17 verlangt Löschung auf Wunsch. Per E-Mail ist das übergangsweise möglich, ein Knopf im Accountfenster ist besser. Dabei auch Bestenlisten-Einträge und Run-Verläufe entfernen oder anonymisieren.
3. **Speicherfristen festlegen** für Run-Verläufe, Duo-Ergebnisse, abgelaufene Tokens und inaktive Accounts, dann in Datenschutzerklärung und Code umsetzen.
4. **Hoster und AV-Vertrag:** Anbieter, Serverstandort und Auftragsverarbeitungsvertrag (Art. 28 DSGVO) eintragen. Gleiches gilt für einen eventuellen Mail-Dienst.
5. **Englische Fassungen** beider Seiten. Auf Steam ist das Publikum international; der deutsche Text bleibt maßgeblich.
6. **Steam-spezifisch:**
   - Store-Seite: Impressum und Datenschutz verlinken (Website-Feld bzw. Beschreibung).
   - Steamworks-Fragebogen zu Inhalten ehrlich ausfüllen, insbesondere **KI-generierte Inhalte**. Steam verlangt seit 2024 die Offenlegung. Im Projekt gibt es KI-Bildprompts (`docs/ux-design-plan-2026-10-17/image-prompts.txt`) und generierte Modell-Entwürfe; final ausgelieferte KI-Assets müssen angegeben werden.
   - Bei Steam-Login, Erfolgen oder Steam Cloud den Abschnitt 9 der Datenschutzerklärung ergänzen (SteamID, welche Daten an den eigenen Server gehen).
   - Kauf, Widerruf und Rückerstattung laufen über Valve; keine eigenen AGB dafür nötig.
7. **Nutzungsbedingungen / Verhaltensregeln** für Accounts und öffentliche Benutzernamen (verbotene Namen, Moderation, Sperren). Kurz halten, im Accountfenster verlinken.
8. **Altersgrenze:** Account ab 16 oder mit Zustimmung der Eltern (Art. 8 DSGVO). Die Registrierung sollte das abfragen oder bestätigen lassen. Jugendschutz: Steam-Fragebogen; für eine physische oder konsolen­gebundene Veröffentlichung wäre eine USK-Prüfung nötig.
9. **Rechte an Assets:** schriftliche Nutzungsrechte vom Designer für alle gelieferten Modelle, Grafiken und Schriften (exklusiv/nicht exklusiv, kommerziell, zeitlich unbegrenzt, inkl. Bearbeitung). Lizenzliste im Spiel: three.js (MIT), Schriften (OFL), ggf. Sounds.
10. **Name „AutoHex TD“** vor dem Release in DPMA- und EUIPO-Markenregistern sowie auf Steam auf Kollisionen prüfen.

## Auszufüllende Platzhalter

`impressum.html`: Name/Firma, Anschrift, E-Mail, Telefon oder Kontaktformular, USt-IdNr. (falls vorhanden), Verantwortlicher nach § 18 MStV.
`datenschutz.html`: Datum, Verantwortlicher, Hoster/Standort/Logs, Löschweg, Duo-Speicherdauer, Steam-Abschnitt, zuständige Aufsichtsbehörde, Altersgrenze.
