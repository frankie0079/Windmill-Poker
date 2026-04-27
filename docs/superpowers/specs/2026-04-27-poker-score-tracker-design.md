# Windmill Poker — Design Spec

## Überblick

PWA (Progressive Web App) für iPhone zur Erfassung und Anzeige von Poker-Ergebnissen der "Windmill Poker"-Runde. 8–11 Spieler, monatliche Spieltage seit Januar 2025. Nur Geldbeträge, kein Punktesystem.

## Tech-Stack

| Komponente | Technologie |
|---|---|
| Frontend | Next.js (App Router) |
| Hosting | Vercel |
| Datenbank | Supabase (PostgreSQL) |
| Auth | Supabase Auth (nur Admin) |
| Design System | Aloha-Sixty |
| PWA | next-pwa / Service Worker |

## Zugangsmodell

- **Leser**: Offener Zugang, kein Login. Alle Rankings, Spieltage und Spielerprofile sind öffentlich.
- **Admin (Frank)**: Login über Supabase Auth. Nur Admin kann Spieltage erfassen und Daten ändern.
- **RLS-Policies**: SELECT für alle, INSERT/UPDATE/DELETE nur für authentifizierten Admin.

---

## Datenbank-Schema

### Tabellen

```sql
-- Spieler
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Spieltage
CREATE TABLE game_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  played_on DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Teilnahme (welcher Spieler war an welchem Spieltag dabei)
CREATE TABLE attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_day_id UUID REFERENCES game_days(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  UNIQUE(game_day_id, player_id)
);

-- Rundenergebnisse (2 Runden pro Spieltag)
CREATE TABLE round_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_day_id UUID REFERENCES game_days(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  round_number SMALLINT NOT NULL CHECK (round_number IN (1, 2)),
  payout INTEGER NOT NULL DEFAULT 0,
  UNIQUE(game_day_id, player_id, round_number)
);
```

### Views

```sql
-- Moneylist (Ewige Rangliste)
CREATE VIEW moneylist AS
SELECT
  p.id,
  p.name,
  COALESCE(SUM(rr.payout), 0) AS total_winnings,
  COUNT(DISTINCT a.game_day_id) AS game_days_played,
  CASE
    WHEN COUNT(DISTINCT a.game_day_id) > 0
    THEN ROUND(COALESCE(SUM(rr.payout), 0)::NUMERIC / COUNT(DISTINCT a.game_day_id), 2)
    ELSE 0
  END AS avg_per_gameday
FROM players p
LEFT JOIN attendances a ON a.player_id = p.id
LEFT JOIN round_results rr ON rr.player_id = p.id
GROUP BY p.id, p.name
ORDER BY total_winnings DESC;
```

### Validierung

- Pro Runde muss gelten: `SUM(payout) = Anzahl Teilnehmer × 20€`
- Buy-in: 20€ pro Spieler pro Runde
- Auszahlungsbeträge: 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100 oder freier Betrag

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

Das Logo wird bei 140px gerendert, der Container schneidet bei 80px ab. Dadurch wirkt das Logo gross, der Header bleibt kompakt.

### Gemeinsamer Footer (Bottom Tabs)

4 Tabs auf `#E8D9B5` Hintergrund:
- Ranking (📊), Spieltage (📅), Spieler (👤), Admin (⚙️)
- Aktiver Tab: `color:#C94A2B; font-weight:600; border-top:2px solid #C94A2B`
- Inaktiv: `color:#3A4747`

### 1. Ranking

- **Toggle**: Moneylist (Forest-Grün aktiv) | €/Spieltag
- **Tabelle**: #, Spieler, Gewinn, ST (Spieltage)
- Header: Oswald 13px uppercase, Spielernamen: Oswald font-weight:600
- **Platz 1**: gesamte Zeile in Terracotta (#C94A2B) — Badge, Name, Betrag, ST
- Platz 2–3: Badge mit #E8D9B5 Hintergrund
- Platz 4+: nur Nummer in Grau
- Alle 11 Spieler sichtbar

### 2. Spieltage

- **Liste**: Buttons mit Datum + Spieleranzahl, neueste oben
- **Aufklappbar**: Klick zeigt Gewinner-Tabelle
  - Nur Spieler mit Gewinn > 0
  - Absteigend sortiert nach Gesamtbetrag
  - 3 Spalten: Gesamt, R1, R2
  - Top-Gewinner in Terracotta
- Aufgeklappter Spieltag: Border in Terracotta
- Geschlossener Spieltag: Border in Ink (#0E1A1A)

### 3. Spieler-Profil

- **Navigation**: Zurück-Pfeil + Spielername (Alfa Slab One, 24px, Forest)
- **Platz-Badges**: Separate Buttons über den Stat-Karten
  - Links: "PLATZ X" in Terracotta (Moneylist-Rang)
  - Rechts: "PLATZ Y" in Forest-Grün (€/Spieltag-Rang)
- **3 Stat-Karten**:
  - Gesamtgewinn (Terracotta), Spieltage (Schwarz), €/Spieltag mit 2 Dezimalstellen (Forest-Grün)
- **Entwicklung** (Balkendiagramm):
  - Chronologisch links→rechts, horizontal scrollbar
  - Labels: Monat (Zeile 1), Jahr (Zeile 2, nur bei Wechsel)
  - Vertikaler Trennstrich am Jahresübergang
  - Farben: Mustard (normal), Terracotta (Tagessieg), Grau (0€)
- **Spieltage-Tabelle**: Alle Spieltage, neueste oben, vertikal scrollbar
  - Tagessieg-Beträge in Terracotta, 0€ in Grau, Rest schwarz
- **Scrollbars**: 4px, sandig (#C4A882)

### 4. Admin (Eingabe-Flow)

- **Schritt 1**: Datum wählen + Spieler auswählen (Checkboxen)
- **Schritt 2**: Ergebnisse pro Runde eingeben
  - Runden-Tabs: "1. Runde" / "2. Runde"
  - Pro Spieler: iOS-Style Scroll-Picker (0–100€ in 10er-Schritten + freier Betrag)
  - Ausgewählter Wert hervorgehoben in Terracotta
- **Validierung**: Echtzeit-Anzeige Summe vs. Topf (Spieler × 20€)
  - Grün + ✓ wenn korrekt
  - Rot + ✗ wenn nicht aufgehend
- **Speichern-Button**: Forest-Grün, nur aktiv wenn beide Runden validiert

---

## Design System: Aloha-Sixty

### Farben

| Token | Hex | Verwendung |
|---|---|---|
| Terracotta | #C94A2B | Primär, aktive Elemente, Platz 1 |
| Mustard | #E9B63A | Badges Platz 2–3, Balkendiagramm |
| Forest | #1E4A3C | Sekundär, €/Spieltag, Buttons |
| Teal | #2A6A6A | Akzent |
| Paper | #F2E7CE | Hintergrund |
| Ink | #0E1A1A | Text, Borders |

### Typografie

| Schrift | Gewicht | Verwendung |
|---|---|---|
| Alfa Slab One | — | Logo, Seitentitel, Spielername im Profil |
| Oswald | 400/600/700 | Tabellen-Header, Spielernamen, Beträge, Labels |
| Work Sans | 400/600/700 | Body-Text |

### Karte

- Max-Width: 375px (iPhone)
- Background: #F2E7CE mit Dot-Pattern
- Border: 2px solid #0E1A1A, border-radius: 14px

---

## PWA & Verteilung

- Service Worker via next-pwa
- Offline-Caching der statischen Seiten
- App-Icon: Logo_Windmill_Poker.png
- Manifest: `display: standalone`, Terracotta als Theme-Color
- **Verteilung**: Admin (Frank) teilt die Vercel-URL per Link (z.B. WhatsApp). Jeder Empfänger öffnet den Link im mobilen Browser und kann die PWA auf den Home-Bildschirm laden. Kein App Store, kein Login für Leser.

## Historischer Import

12 Spieltage aus Excel (ST1: 16.01.25 bis ST12: 05.03.26) mit allen Auszahlungsdaten. Import als einmaliges Seed-Script für die Supabase-Datenbank.

## Mockup-Referenzen

Alle genehmigten Mockups unter:
`Superpowers-Trial_one/.superpowers/brainstorm/2619-1777306653/content/`
- `ranking.html`
- `spieltage.html`
- `spieler-profil.html`
- `admin.html`
