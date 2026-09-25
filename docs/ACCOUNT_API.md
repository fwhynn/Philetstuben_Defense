# Account-API für AutoHex TD

Beschreibung der Server-Schnittstelle, die der Spiel-Client für Accounts und Spielstände nutzt (Branch `warteraum`, Datei `classes/api.js`). Das Backend ist ein eigenes Projekt und nicht Teil dieses Repos. Stand: 25.09.2026.

## Überblick

- **Basis-URL:** `https://api.autohextd.zlyfer.net` (festgelegt in `classes/api.js`, `baseUrl`). Zieht die API um, nur dort ändern.
- **Format:** Anfragen und Antworten in JSON (`Content-Type: application/json`).
- **Anmeldung:** Nach Login oder Registrierung bekommt der Client ein Token und schickt es danach bei jeder geschützten Anfrage als Header `Authorization: Bearer <token>`.
- **Fehler:** Bei jedem Status außer 2xx erwartet der Client diesen Aufbau und zeigt `message` dem Spieler an. Also verständliche deutsche Texte verwenden:

```json
{ "error": { "message": "Benutzername ist bereits vergeben." } }
```

- **CORS:** Das Spiel läuft auf einer anderen Domain. Erlaubt sein müssen die Methoden `GET, POST, PUT, OPTIONS` und die Header `Authorization, Content-Type, Accept`. Aktuell ist `Access-Control-Allow-Origin: *` gesetzt; empfohlen ist die Beschränkung auf `https://autohextd.autophil.lol` (zum Entwickeln zusätzlich `http://localhost:8080`).

## Stand auf dem Server (25.09.2026)

| Endpunkt | Stand |
|---|---|
| `GET /users/{id}` | vorhanden |
| `POST /register`, `POST /login`, `POST /logout` | fehlen vermutlich (GET antwortet 404) |
| `GET /me`, `GET /saves`, `PUT /saves` | fehlen |

## Endpunkte

### `POST /register`: Account anlegen

Anfrage:

```json
{ "username": "philipp", "password": "geheim123" }
```

| Status | Antwort | Wann |
|---|---|---|
| `201` (oder `200`) | `{ "token": "…", "user": { "id": 17, "username": "philipp" } }` | Account angelegt, direkt eingeloggt |
| `409` | Fehlerobjekt | Benutzername schon vergeben |
| `422` | Fehlerobjekt | Name oder Passwort ungültig (Regeln siehe unten) |

Der Client speichert `token` und zeigt `user.username` an.

### `POST /login`: Einloggen

Anfrage wie bei der Registrierung. Antworten:

| Status | Antwort | Wann |
|---|---|---|
| `200` | `{ "token": "…", "user": { "id": 17, "username": "philipp" } }` | erfolgreich |
| `401` | Fehlerobjekt, z. B. „Benutzername oder Passwort falsch.“ | falsche Daten (nicht verraten, welches von beiden) |
| `429` | Fehlerobjekt | zu viele Versuche |

### `POST /logout`: Ausloggen

Header `Authorization: Bearer <token>`, kein Body. Das Token wird ungültig. Antwort `204` ohne Inhalt. Der Client löscht sein Token ohnehin sofort und wertet die Antwort nicht aus.

### `GET /me`: Angemeldeter Nutzer

Header `Authorization: Bearer <token>`.

| Status | Antwort | Wann |
|---|---|---|
| `200` | `{ "user": { "id": 17, "username": "philipp" } }` | Token gültig |
| `401` | Fehlerobjekt | Token fehlt, ist abgelaufen oder ungültig. **Der Client verwirft dann sein Token**, deshalb wirklich 401 und nicht 403 oder 404 |

### `GET /saves`: Spielstand laden

Header `Authorization: Bearer <token>`.

| Status | Antwort | Wann |
|---|---|---|
| `200` | `{ "data": <gespeicherter Spielstand>, "updatedAt": "2026-09-25T13:57:56Z" }` | Spielstand vorhanden |
| `404` | beliebig | noch kein Spielstand für diesen Account. Der Client meldet das freundlich |
| `401` | Fehlerobjekt | nicht angemeldet |

`data` ist **genau das JSON-Objekt, das zuvor per `PUT /saves` gespeichert wurde**, unverändert.

### `PUT /saves`: Spielstand speichern

Header `Authorization: Bearer <token>`. Der Body ist der Profil-Export des Spiels, zum Beispiel:

```json
{
  "format": "autohex-profile",
  "version": 1,
  "exportedAt": "2026-09-25T13:57:56.834Z",
  "profile": { "version": 1, "activeHero": "standard", "diamonds": 0, "unlockedTowers": ["archer", "catapult"], "…": "…" }
}
```

| Status | Antwort | Wann |
|---|---|---|
| `200` | `{ "updatedAt": "2026-09-25T14:02:11Z" }` | gespeichert, ersetzt den bisherigen Stand |
| `401` | Fehlerobjekt | nicht angemeldet |
| `413` | Fehlerobjekt | größer als 2 MB |
| `422` | Fehlerobjekt | kein gültiger Spielstand |

Der Server muss den Inhalt nicht verstehen. Er soll ihn nur prüfen und unverändert speichern:
- gültiges JSON-Objekt,
- `format` ist `"autohex-profile"` und `version` ist `1`,
- höchstens 2 MB (typisch 1 bis 20 KB).

Ein Spielstand pro Account genügt. Wer mag, hebt die letzten Stände als Sicherung auf.

### `GET /users/{id}`: Nutzer abrufen (vorhanden)

Öffentlich, ohne Token. Liefert keine sensiblen Daten (kein Passwort-Hash, keine E-Mail).

## Regeln und Sicherheit

- **Benutzername:** 3 bis 20 Zeichen aus `A–Z a–z 0–9 _ -`, eindeutig ohne Beachtung der Groß-/Kleinschreibung.
- **Passwort:** mindestens 8 Zeichen. Nur als Hash speichern (**argon2id** oder **bcrypt**), niemals im Klartext oder in Logs.
- **Token:** zufällig, mindestens 32 Byte, in der Datenbank nur als Hash (z. B. SHA-256) speichern. Ablauf nach etwa 30 Tagen. `logout` löscht das Token.
- **Login-Schutz:** Begrenzung der Versuche pro IP und pro Benutzername (z. B. 10 pro Minute), danach `429`.
- **Nur HTTPS.**

## Vorschlag Datenmodell

```
users    (id, username UNIQUE, password_hash, created_at)
tokens   (id, user_id → users, token_hash UNIQUE, created_at, expires_at)
saves    (user_id PRIMARY KEY → users, data JSON, updated_at)
```

## Abgleich im Spiel

Aktuell bedient der Spieler den Abgleich von Hand im Account-Fenster: **„Auf Server speichern“** schickt `PUT /saves`, **„Vom Server laden“** holt `GET /saves` und ersetzt das lokale Profil (nur ohne laufenden Run). Ein automatischer Abgleich ist für später geplant; dafür ist `updatedAt` in den Antworten bereits vorgesehen.

## Schnelltest mit curl

```bash
API=https://api.autohextd.zlyfer.net
curl -s -X POST $API/register -H 'Content-Type: application/json' -d '{"username":"testnutzer","password":"testpasswort1"}'
TOKEN=$(curl -s -X POST $API/login -H 'Content-Type: application/json' -d '{"username":"testnutzer","password":"testpasswort1"}' | sed -E 's/.*"token":"([^"]+)".*/\1/')
curl -s $API/me -H "Authorization: Bearer $TOKEN"
curl -s -X PUT $API/saves -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"format":"autohex-profile","version":1,"profile":{"version":1}}'
curl -s $API/saves -H "Authorization: Bearer $TOKEN"
curl -s -X POST $API/logout -H "Authorization: Bearer $TOKEN" -o /dev/null -w '%{http_code}\n'
curl -s $API/me -H "Authorization: Bearer $TOKEN" -o /dev/null -w '%{http_code}\n'   # erwartet 401
```
