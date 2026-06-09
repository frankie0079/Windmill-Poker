# Google Drive Excel-Backup

Der Admin-Button `Excel-Backup aktualisieren` liest den neuesten vollständig
erfassten Spieltag aus Supabase und aktualisiert dieselbe `.xlsx`-Datei in
Google Drive.

## Einmalige Einrichtung

1. In Google Cloud ein Projekt und ein Computerprogramm-Konto erstellen.
   Google nennt dieses Konto technisch `Service Account` beziehungsweise
   `Dienstkonto`.
2. Die Google Drive API für das Projekt aktivieren.
3. Einen JSON-Schlüssel für das Servicekonto erstellen.
4. Die Datei `Windmill_Poker_results.xlsx` in Google Drive für die
   Servicekonto-E-Mail als Bearbeiter freigeben.
5. Die Datei-ID aus der Drive-URL kopieren:
   `https://drive.google.com/file/d/DATEI_ID/view`
6. Lokal und in Vercel diese Variablen setzen:

```text
GOOGLE_DRIVE_EXCEL_FILE_ID=...
GOOGLE_SERVICE_ACCOUNT_EMAIL=...@...iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Ablauf

- Beide Runden in der PWA speichern.
- Auf `/admin/naechster` `Excel-Backup aktualisieren` klicken.
- Der Server prüft Vollständigkeit und Rundentöpfe, ergänzt beziehungsweise
  aktualisiert den Spieltag und ersetzt die Datei in Google Drive.
- Erneutes Klicken ist sicher: Ein vorhandener Spieltag wird aktualisiert und
  nicht doppelt eingefügt.

## Aktiver Produktionsstand

- PWA: `https://windmill-poker-psj1.vercel.app`
- Vercel-Projekt: `windmill-poker-psj1`
- Google-Drive-Zugangsdaten sind für `Production` in Vercel hinterlegt.
- Der erste Live-Test mit ST14 vom 07.05.2026 war erfolgreich.
