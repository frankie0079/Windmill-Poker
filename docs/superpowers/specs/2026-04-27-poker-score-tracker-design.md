# Windmill Poker — Design Spec

> **Letztes Update:** 2026-04-29 — Erweiterung um Deckblatt, Teilnehmer-Liste, Gallerie, Spieler-Aktiv/Inaktiv, ±2 Cent Toleranz, Spieltag-Abschluss-Workflow.

## Überblick

PWA (Progressive Web App) für iPhone zur Erfassung und Anzeige von Poker-Ergebnissen der "Windmill Poker"-Runde. 8–11 Spieler, monatliche Spieltage seit Januar 2025. Nur Geldbeträge, kein Punktesystem. Gepokert wird zu acht; bis zu drei zusätzliche Spieler stehen auf einer Warteliste.

## Tech-Stack

| Komponente | Technologie |
|---|---|
| Frontend | Next.js (App Router) |
| Hosting | Vercel |
| Datenbank | Supabase (PostgreSQL) |
| Storage | Supabase Storage (Foto-Gallerie) |
| Auth | Supabase Auth (nur Admin) |
| Design System | Aloha-Sixty |
| PWA | next-pwa / Service Worker |

## Zugangsmodell

- **Leser**: Offener Zugang, kein Login. Alle Rankings, Spieltage, Profile und die Foto-Gallerie sind öffentlich.
- **Admin (Frank)**: Login über Supabase Auth. Nur Admin kann Spieltage erfassen, Spieler verwalten, den nächsten Spieltag terminieren, Fotos hochladen und Kommentare bearbeiten.
- **RLS-Policies**: SELECT für alle, INSERT/UPDATE/DELETE nur für authentifizierten Admin. `players.is_active = FALSE` blendet den Spieler aus allen öffentlichen Views aus, lässt Historie aber unangetastet.

---

## Datenbank-Schema

### Tabellen

```sql
-- Spieler (mit Soft-Delete via is_active)
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Spieltage (mit Abschluss-State und Datum für nächsten Spieltag)
CREATE TABLE game_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  played_on DATE NOT NULL UNIQUE,
  next_game_date DATE,                          -- gesetzt beim Abschluss-Workflow
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,     -- TRUE = abgeschlossen
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Teilnahme: wer war an welchem Spieltag dabei (Historie, immutable)
CREATE TABLE attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_day_id UUID REFERENCES game_days(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  UNIQUE(game_day_id, player_id)
);

-- Rundenergebnisse (Cent-genau via NUMERIC für geteilte Plätze, z.B. 6,66€)
CREATE TABLE round_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_day_id UUID REFERENCES game_days(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  round_number SMALLINT NOT NULL CHECK (round_number IN (1, 2)),
  payout NUMERIC(10,2) NOT NULL DEFAULT 0,
  UNIQUE(game_day_id, player_id, round_number)
);

-- Planung des nächsten Spieltags: Teilnehmer-Bestätigungen + Warteliste
-- (game_day_id verweist auf den ABZUSCHLIESSENDEN Spieltag,
--  dessen Abschluss den nächsten Spieltag terminiert.)
CREATE TABLE next_game_planning (
  game_day_id UUID NOT NULL REFERENCES game_days(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('participant', 'waitlist')),
  status TEXT CHECK (status IN ('confirmed', 'cancelled')),       -- nur bei role='participant'
  waitlist_rank SMALLINT CHECK (waitlist_rank BETWEEN 1 AND 3),   -- nur bei role='waitlist'
  PRIMARY KEY (game_day_id, player_id),
  CHECK (
    (role = 'participant' AND status IS NOT NULL AND waitlist_rank IS NULL) OR
    (role = 'waitlist'    AND status IS NULL    AND waitlist_rank IS NOT NULL)
  )
);

-- Foto-Gallerie (Bilder werden in Supabase Storage abgelegt)
CREATE TABLE gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Views

```sql
-- Moneylist (Ewige Rangliste) — nur aktive Spieler
CREATE OR REPLACE VIEW moneylist AS
SELECT
  p.id,
  p.name,
  COALESCE(SUM(rr.payout), 0) AS total_winnings,
  COUNT(DISTINCT a.game_day_id) AS game_days_played,
  CASE
    WHEN COUNT(DISTINCT a.game_day_id) > 0
    THEN ROUND(COALESCE(SUM(rr.payout), 0) / COUNT(DISTINCT a.game_day_id), 2)
    ELSE 0
  END AS avg_per_gameday
FROM players p
LEFT JOIN attendances a ON a.player_id = p.id
LEFT JOIN round_results rr ON rr.player_id = p.id
WHERE p.is_active = TRUE
GROUP BY p.id, p.name
ORDER BY total_winnings DESC;
```

### Validierung

- **Pott-Check pro Runde:** `SUM(payout) BETWEEN n*20.00 - 0.02 AND n*20.00 + 0.02` (n = Anzahl Teilnehmer). Toleranz ±2 Cent fängt geteilte Plätze ab (z.B. 3 × 6,66€ = 19,98€ statt 20€).
- **Buy-in:** 20,00€ pro Spieler pro Runde.
- **Auszahlungsbeträge:** 0, 10, 20, 30, …, 100€ (Standard-Picker in 10er-Schritten) oder freier Cent-genauer Betrag.
- **Spieltag-Abschluss:** `is_closed = TRUE` darf nur gesetzt werden, wenn (a) `next_game_date IS NOT NULL`, (b) genau 8 Zeilen in `next_game_planning` mit `role='participant' AND status='confirmed'` existieren, (c) bis zu 3 Zeilen mit `role='waitlist'` mit eindeutigen Rängen 1–3 existieren.

### Verhaltensregeln

- **Soft-Delete für Spieler:** Inaktive Spieler verschwinden aus allen Rankings/Statistiken (Moneylist, €/Spieltag, Spieltage-Detail). Reaktivieren stellt die Sichtbarkeit ihrer Historie wieder her.
- **Hartes Löschen** ist über die Spielerverwaltung möglich, kaskadiert über `ON DELETE CASCADE` Attendances und Round-Results. UI muss eine Bestätigungs-Modal anzeigen, wenn der Spieler Historie hat.
- **Nachrücken:** Wenn ein bestätigter Teilnehmer auf `cancelled` gesetzt wird, befördert der Admin manuell den Spieler mit `waitlist_rank=1` (UPDATE auf `role='participant', status='confirmed'`).

---

## Screens

### Gemeinsamer Header (alle Seiten identisch)

```
Logo: height:140px; width:auto
Header-Container: height:80px; overflow:hidden; padding:0 16px
          display:flex; align-items:center; gap:12px; justify-content:center
          background:#C94A2B
Titel: "WINDMILL POKER" — Alfa Slab One, 22px, #F2E7CE
```

Logo wird bei 140px gerendert, Container schneidet bei 80px ab. Wirkt visuell groß, hält Header kompakt. **Klick auf Logo** kehrt zum Deckblatt zurück (iOS-Pattern).

### Gemeinsamer Footer (Bottom Tabs)

4 Tabs auf `#E8D9B5` Hintergrund:
- Ranking (📊), Spieltage (📅), Spieler (👤), Admin (⚙️)
- Aktiver Tab: `color:#C94A2B; font-weight:600; border-top:2px solid #C94A2B`
- Inaktiv: `color:#3A4747`
- **Auf dem Deckblatt** sind alle vier Tabs inaktiv (kein Tab repräsentiert das Deckblatt).

### 1. Deckblatt (Startseite beim App-Öffnen)

Erste Seite nach App-Start. Logo-Header oben, Bottom-Tabs unten, dazwischen drei Elemente:

- **Hero-Card "Nächster Spieltag"** — Forest-grünes Karten-Element mit Schatten:
  - Label "NÄCHSTER SPIELTAG" (Mustard, Oswald uppercase)
  - Großes Datum (Alfa Slab One 30px, Paper)
  - Wochentag · 19:15 Uhr
  - Countdown in 3 Blöcken: Tage : Std : Min (live-aktualisiert, Ziel = 19:15 des Datums)
- **Teilnehmer-Button** — Karte mit 👥-Icon, Label "TEILNEHMER", Sub-Zeile "8 angemeldet · 3 auf Warteliste". Klick → Teilnehmer-Screen.
- **Gallerie-FAB** — runder Terracotta-Button rechts unten (📷 Gallerie). Klick → Gallerie-Screen.

### 2. Ranking

- **Toggle**: Moneylist (Forest aktiv) | €/Spieltag
- **Tabelle**: #, Spieler, Gewinn, ST (Spieltage)
- Header: Oswald 13px uppercase, Spielernamen: Oswald 600
- Platz 1: gesamte Zeile in Terracotta — Badge, Name, Betrag, ST
- Platz 2–3: Badge mit `#E8D9B5` Hintergrund
- Platz 4+: nur Nummer in Grau
- **Nur aktive Spieler werden angezeigt** (Moneylist filtert via `is_active = TRUE`).

### 3. Spieltage

- **Liste**: Buttons mit Datum + Spieltag-Nr. + Spieleranzahl, neueste oben.
- **Status-Pill rechts** auf jedem Eintrag:
  - **Offen** — `🕐 Offen`, Mustard-Hintergrund (`#E9B63A`), schwarzer Border auf der Karte ersetzt durch Mustard-Border, hellerer Karten-BG (`#FFF8DC`). Sub-Zeile: "Nächster Spieltag: <Datum> — Nachrücker bestätigen".
  - **Abgeschlossen** — `✓ Abgeschlossen`, Forest-Outline-Pill, Standard-Karten-Border (Ink).
- **Aufklappbar**: Klick zeigt Gewinner-Tabelle. Aufgeklappte Karte: Border in Terracotta. Maximal 1 Spieltag gleichzeitig aufgeklappt.
- Detail-Tabelle (nur Spieler mit Gewinn > 0): Spalten Spieler, Gesamt, R1, R2. Top-Gewinner in Terracotta.
- **Liste ist scrollbar** (Header und Bottom-Tabs sticky). 4px sandige Scrollbar (`#C4A882`).

### 4. Spieler-Profil

- **Navigation**: Zurück-Pfeil + Spielername (Alfa Slab One, 24px, Forest)
- **Platz-Badges** (separate Buttons über den Stat-Karten):
  - Links: "PLATZ X" in Terracotta (Moneylist-Rang)
  - Rechts: "PLATZ Y" in Forest-Grün (€/Spieltag-Rang)
- **3 Stat-Karten**: Gesamtgewinn (Terracotta), Spieltage (Schwarz), €/Spieltag mit 2 Dezimalstellen (Forest-Grün)
- **Entwicklung** (Balkendiagramm):
  - Chronologisch links→rechts, horizontal scrollbar
  - Labels: Monat (Zeile 1), Jahr (Zeile 2, nur bei Wechsel)
  - Vertikaler Trennstrich am Jahresübergang
  - Farben: Mustard (normal), Terracotta (Tagessieg), Grau (0€)
- **Spieltage-Tabelle**: Alle Spieltage des Spielers, neueste oben, vertikal scrollbar
- **Scrollbars**: 4px, sandig (`#C4A882`)
- **Inaktive Spieler erscheinen nicht in der Spieler-Liste, ihr Profil ist nicht erreichbar.** Reaktivierung stellt Sichtbarkeit wieder her.

### 5. Teilnehmer (vom Deckblatt erreichbar)

Liste der 11 Spieler-Slots für den nächsten Spieltag. Header oben, Backrow "← Zurück: Deckblatt", Bottom-Tabs alle inaktiv.

- **Plätze 1–8**: bestätigte Teilnehmer (inkl. Nachrücker, ohne Markierung — der User unterscheidet nicht).
  - Badge-Stil: Forest-Kreis mit weißer Zahl
- **Plätze 9–11**: Warteliste in Rang-Reihenfolge.
  - Badge-Stil: heller Sand-Kreis (`#E8D9B5`)
  - Pill rechts: "Rang 1/2/3" in Terracotta-Outline
- Section-Trenner zwischen 1–8 und 9–11 mit Sublabel "WARTELISTE" in Terracotta + Hinweis "Plätze 9–11".

### 6. Admin

Sub-Tab-Navigation oben (2 Tabs, Forest aktiv): **Eingabe Spieltag** | **Nächster Spieltag**.

#### 6.1 Tab "Eingabe Spieltag"

Erfassung der Auszahlungen pro Spieler pro Runde.

- **Schritt 1** (vorgelagert): Datum wählen + Spieler auswählen (Checkboxen)
- **Schritt 2**: Ergebnisse pro Runde
  - Runden-Tabs: "1. Runde" / "2. Runde", aktiver Tab Terracotta-Underline
  - Spieler-Liste mit Auszahlungs-Picker (iOS-Style Scroll-Picker, 0–100€ in 10er-Schritten + freier Cent-genauer Betrag)
  - Top-Werte (1. + 2. Platz) in Terracotta hervorgehoben
- **Pott-Check** (Live-Validierung, Forest-Box):
  - "Pott-Check ✓ OK" wenn `SUM ∈ [n*20 − 0,02 ; n*20 + 0,02]`
  - Zeigt Zeile "Summe Auszahlung", "Soll (n × 20€)", "Differenz"
  - Differenz < 2¢ Toleranz → grün; sonst → rot mit "✗ Pott stimmt nicht"
  - Hinweis-Zeile: "Toleranz bis ±2 Cent erlaubt geteilte Plätze (z.B. 3× 6,66€ statt 20€)."
- **Speichern-Button** (Forest, full-width): Aktiv nur wenn beide Runden valid sind.

#### 6.2 Tab "Nächster Spieltag"

Workflow zum Abschluss des aktuellen Spieltags + Terminierung des nächsten.

- **Datum-Eingabe** (Karten-Element mit `📅`-Icon): "Nächster Spieltag" Label, Datum-Input, "19:15" als feste Uhrzeit.
- **Section "Teilnehmer ST X" (8 Spieler)**: Liste mit Pill rechts:
  - `✓ Dabei` (Forest-fill) → status='confirmed'
  - `✗ Abgesagt` (Terracotta-outline) → status='cancelled', Name durchgestrichen
  - **Es gibt keinen "Offen"-Status** — binär. Default-Annahme = `confirmed`, Admin togglet auf `cancelled` wenn jemand absagt.
  - Counter rechts oben: "X dabei · Y abgesagt"
- **Section "Warteliste"**: 3 Zeilen mit Rang-Dropdown (Rang 1/2/3) pro Spieler. Admin legt Reihenfolge manuell fest.
- **Nachrück-Logik**: Sobald ein Teilnehmer abgesagt hat, zeigt der Spieler mit `waitlist_rank=1` eine Mustard-Pill `↑ rückt nach`. Admin bestätigt mit Button → der Spieler wechselt von `waitlist` zu `participant, confirmed`. Im UI erscheint er ab dann in der Teilnehmer-Liste (anonym, ohne Sondermarkierung).
- **Status-Box**:
  - Mustard wenn nicht bereit: "Noch offen" + Liste fehlender Aktionen
  - Forest wenn bereit: "✓ Bereit · 8 bestätigt für \<Datum\>"
- **Primärer Button** "Spieltag abschließen" (Forest-fill, full-width): Aktiv wenn Status=Bereit. Setzt `is_closed=TRUE` + persistiert `next_game_date`.
- **Sekundärer Button "⚙ Spielerverwaltung"** (Forest-outlined, full-width): Öffnet Sub-Screen Spielerverwaltung. Bewusst sekundär platziert, weil selten gebraucht.

#### 6.3 Sub-Screen "Spielerverwaltung"

Erreichbar über den sekundären Button auf "Nächster Spieltag". Statt Sub-Tab-Bar oben: Backrow "← Zurück: Nächster Spieltag".

- **Header-Zeile**: Titel "SPIELERVERWALTUNG" + Counter "11 Spieler · 10 aktiv · 1 inaktiv".
- **Hinweistext** unter dem Header: "Inaktive Spieler erscheinen nicht in Rankings/Statistiken. Reaktivieren stellt Daten wieder her."
- **Add-Field** (gestrichelte Box): Text-Input für neuen Namen + Forest-Button "+ Anlegen".
- **Spieler-Tabelle** (Spalten: Name | Aktiv-Toggle | Spieltage gespielt | Trash-Icon):
  - **Toggle Aktiv/Inaktiv**: Forest=on / Sand=off. Klick togglet `is_active`. Inaktive Spieler-Zeile mit `opacity:0.55` + Name `text-decoration:line-through`.
  - **Trash-Icon (Terracotta)** ist für jeden Spieler verfügbar. Klick öffnet Bestätigungs-Modal:
    - Wenn `attendances`-Historie existiert: Modal warnt "Achtung: \<N\> Spieltag-Einträge gehen verloren. Lieber inaktiv setzen?" mit Optionen "Trotzdem löschen" / "Inaktiv setzen" / "Abbrechen".
    - Wenn keine Historie: einfache Bestätigung "Spieler löschen?" mit "Ja/Abbrechen".

### 7. Gallerie (vom Deckblatt erreichbar)

Foto-Sammlung der Runde. Reine Bild-Anzeige ohne Spieltag-/Datums-Etiketten.

- Header oben, Backrow "← Zurück: Deckblatt".
- **Toolbar**: Titel "GALLERIE" + Counter "X Fotos". Rechts: **Kamera-Button** (Terracotta-rund mit `📸`-Icon).
  - Klick auf Kamera-Button (nur Admin) → öffnet die iPhone-Kamera (über `<input type="file" accept="image/*" capture="environment">`).
  - Nach dem Auslösen: Upload zu Supabase Storage + Insert in `gallery_photos`.
- **Hinweis-Zeile** (klein, italic): "Kamera-Button nur für Admin sichtbar. Öffnet die iPhone-Kamera. Nach dem Auslösen erscheint das Foto hier."
- **Foto-Grid**: 3 Spalten, quadratische Tiles (`aspect-ratio: 1/1`), Border `2px solid #0E1A1A`, `border-radius:8px`. Klick auf Tile → Foto-Detail.

### 8. Foto-Detail

Vollbild-Ansicht eines einzelnen Fotos mit Kommentar. Header oben, Backrow "← Zurück: Gallerie".

- **Foto-Frame**: quadratisch, `border:2px solid #0E1A1A`, `border-radius:12px`. Optional: kleine Pille oben rechts mit `📷 Foto` als visueller Marker.
- **Kommentar-Karte** unter dem Foto:
  - Label "KOMMENTAR" (Oswald uppercase)
  - Text in Work Sans 14px (z.B. "AA888 wird von 8888 geschlagen.")
  - **Bearbeiten-Button** "✎ Bearbeiten" rechts unten (Forest-outlined, klein) — **nur Admin**.
- **Hinweis-Zeile** klein, italic: "Bearbeiten/Löschen nur für Admin. Leser sehen Foto + Kommentar."

---

## Design System: Aloha-Sixty

### Farben

| Token | Hex | Verwendung |
|---|---|---|
| Terracotta | `#C94A2B` | Primär, aktive Elemente, Platz 1, Trash, Highlight-Texte |
| Mustard | `#E9B63A` | Badges Platz 2–3, Balkendiagramm, Status "Offen", Nachrücker-Pill |
| Forest | `#1E4A3C` | Sekundär, €/Spieltag, primäre Buttons, Status "Dabei" |
| Teal | `#2A6A6A` | Akzent (selten verwendet) |
| Paper | `#F2E7CE` | Hintergrund |
| Ink | `#0E1A1A` | Text, Borders |
| Sandig | `#C4A882` | Scrollbars (4px) |
| Sand-Hell | `#E8D9B5` | Bottom-Tab-Hintergrund, Standard-Badges |

### Typografie

| Schrift | Gewicht | Verwendung |
|---|---|---|
| Alfa Slab One | — | Logo, Seitentitel, Spielername im Profil, Hero-Datum, Countdown-Zahlen |
| Oswald | 400/600/700 | Tabellen-Header, Spielernamen, Beträge, Labels, Sub-Tabs |
| Work Sans | 400/600/700 | Body-Text, Kommentare, Hinweis-Zeilen |

### Karte (Standard-Frame)

- Max-Width: 375px (iPhone)
- Background: `#F2E7CE` mit Dot-Pattern (`radial-gradient(rgba(14,26,26,.04) 1px, transparent 1px)` × 2 Layer)
- Border: 2px solid `#0E1A1A`, border-radius: 14px

---

## PWA & Verteilung

- Service Worker via `next-pwa`
- Offline-Caching der statischen Seiten (Rankings, Spieltage)
- Foto-Gallerie-Bilder werden bei Bedarf geladen (kein Offline-Cache)
- App-Icon: `Logo_Windmill_Poker.png`
- Manifest: `display: standalone`, Terracotta als Theme-Color
- **Verteilung**: Admin teilt die Vercel-URL per Link (z.B. WhatsApp). Empfänger öffnen den Link im mobilen Browser und können die PWA auf den Home-Bildschirm laden. Kein App Store, kein Login für Leser.
- **Supabase Storage Bucket** `gallery-photos` mit Public-Read-Policy. Upload-Policy nur für authentifizierte Admin-User.

## Historischer Import

12 Spieltage aus Excel (ST1: 16.01.25 bis ST12: 05.03.26) mit allen Auszahlungsdaten. Import als einmaliges Seed-Script für die Supabase-Datenbank. **Hinweis:** Da `payout` jetzt `NUMERIC(10,2)` ist, müssen die Excel-Werte als Cent-genaue Beträge importiert werden (auch wenn die historischen Daten nur volle Euro enthalten).

## Mockup-Referenzen

Aktuelle genehmigte Mockups (Stand 2026-04-29):

| Screen | Datei |
|---|---|
| Ranking | `.superpowers/brainstorm/1598-1777301666/content/ranking-aloha-v14.html` |
| Spieltage (mit Status + Scroll) | `.superpowers/brainstorm/801-1777469477/content/spieltage-status-v2.html` |
| Admin (Eingabe + Nächster Spieltag + Spielerverwaltung) | `.superpowers/brainstorm/801-1777469477/content/admin-alle-v3.html` |
| Deckblatt + Teilnehmer + Gallerie + Foto-Detail | `.superpowers/brainstorm/801-1777469477/content/deckblatt-alle-v3.html` |

Spieler-Profil-Mockup ist im Spec-Text beschrieben, Mockup-Datei steht aus (kann bei Frontend-Implementierung direkt als React-Component umgesetzt werden).
