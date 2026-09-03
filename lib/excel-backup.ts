import { Readable } from "node:stream";
import ExcelJS from "exceljs";
import { google } from "googleapis";
import type { SupabaseClient } from "@supabase/supabase-js";

const SHEET_NAME = "Auszahlungen";
const HEADER_ROW = 13;
const DATE_ROW = 14;
const PLAYER_COUNT_ROW = 15;
const POT_ROW = 16;
const FIRST_PLAYER_ROW = 17;
const LAST_PLAYER_ROW = 27;
const ROUND_TOLERANCE = 0.02;

type GameDayRow = {
  id: string;
  played_on: string;
};

type AttendanceRow = {
  player_id: string;
  players: { name: string } | null;
};

type ResultRow = {
  player_id: string;
  round_number: 1 | 2;
  payout: number;
};

export type BackupGame = {
  gameDayId: string;
  stNumber: number;
  playedOn: string;
  players: Array<{
    name: string;
    round1: number;
    round2: number;
  }>;
};

export type ExcelBackupResult = {
  message: string;
  stNumber: number;
  playedOn: string;
};

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} ist nicht konfiguriert`);
  return value;
}

function normalizePrivateKey(value: string) {
  return value.replace(/\\n/g, "\n");
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function excelDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function cloneStyle<T>(value: T): T {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function cellText(cell: ExcelJS.Cell) {
  return String(cell.text || cell.value || "").trim();
}

function findCell(
  sheet: ExcelJS.Worksheet,
  text: string,
): { row: number; col: number } | null {
  for (let row = 1; row <= sheet.rowCount; row++) {
    for (let col = 1; col <= sheet.columnCount; col++) {
      if (cellText(sheet.getCell(row, col)) === text) return { row, col };
    }
  }
  return null;
}

function findSummaryStart(sheet: ExcelJS.Worksheet) {
  const summary = findCell(sheet, "Σ Moneylist");
  if (!summary || summary.row !== HEADER_ROW) {
    throw new Error('Excel-Spalte "Σ Moneylist" nicht gefunden');
  }
  return summary.col;
}

function findGameColumn(sheet: ExcelJS.Worksheet, stNumber: number) {
  const expected = `ST${stNumber}`;
  for (let col = 1; col <= sheet.columnCount; col++) {
    if (cellText(sheet.getCell(HEADER_ROW, col)) === expected) return col;
  }
  return null;
}

function copyColumnStyle(
  sheet: ExcelJS.Worksheet,
  fromColumn: number,
  toColumn: number,
) {
  const from = sheet.getColumn(fromColumn);
  const to = sheet.getColumn(toColumn);
  to.width = from.width;
  to.hidden = from.hidden;

  for (let row = 1; row <= sheet.rowCount; row++) {
    const source = sheet.getCell(row, fromColumn);
    const target = sheet.getCell(row, toColumn);
    target.style = cloneStyle(source.style);
    target.numFmt = source.numFmt;
    target.alignment = cloneStyle(source.alignment);
    target.border = cloneStyle(source.border);
    target.fill = cloneStyle(source.fill);
    target.font = cloneStyle(source.font);
    target.protection = cloneStyle(source.protection);
  }
}

function formulaCell(formula: string, result: number | string = "") {
  return { formula, result };
}

function placementText(round1: number, round2Value: number) {
  return [
    round1 > 0 ? `R1:${round1.toFixed(2)} €` : "",
    round2Value > 0 ? `R2:${round2Value.toFixed(2)} €` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

async function loadLatestCompleteGame(
  supabase: SupabaseClient,
): Promise<BackupGame> {
  const { data: days, error: daysError } = await supabase
    .from("game_days")
    .select("id, played_on")
    .order("played_on", { ascending: true });
  if (daysError) throw new Error(daysError.message);

  for (let index = (days ?? []).length - 1; index >= 0; index--) {
    const day = (days ?? [])[index] as GameDayRow;
    const [{ data: attendanceRaw, error: attendanceError }, { data: resultsRaw, error: resultsError }] =
      await Promise.all([
        supabase
          .from("attendances")
          .select("player_id, players(name)")
          .eq("game_day_id", day.id),
        supabase
          .from("round_results")
          .select("player_id, round_number, payout")
          .eq("game_day_id", day.id),
      ]);

    if (attendanceError) throw new Error(attendanceError.message);
    if (resultsError) throw new Error(resultsError.message);

    const attendance = (attendanceRaw ?? []) as unknown as AttendanceRow[];
    const results = (resultsRaw ?? []) as ResultRow[];
    if (attendance.length === 0 || results.length !== attendance.length * 2) {
      continue;
    }

    const byPlayer = new Map<
      string,
      { name: string; round1: number; round2: number }
    >();
    for (const attendee of attendance) {
      if (!attendee.players?.name) {
        throw new Error("Teilnehmer ohne Spielernamen gefunden");
      }
      byPlayer.set(attendee.player_id, {
        name: attendee.players.name,
        round1: 0,
        round2: 0,
      });
    }
    for (const result of results) {
      const player = byPlayer.get(result.player_id);
      if (!player) throw new Error("Ergebnis ohne Teilnahme gefunden");
      if (result.round_number === 1) player.round1 = Number(result.payout);
      if (result.round_number === 2) player.round2 = Number(result.payout);
    }

    const expectedRoundPot = attendance.length * 20;
    const round1 = round2(
      [...byPlayer.values()].reduce((sum, player) => sum + player.round1, 0),
    );
    const round2Total = round2(
      [...byPlayer.values()].reduce((sum, player) => sum + player.round2, 0),
    );
    if (
      Math.abs(round1 - expectedRoundPot) > ROUND_TOLERANCE ||
      Math.abs(round2Total - expectedRoundPot) > ROUND_TOLERANCE
    ) {
      throw new Error(
        `ST${index + 1}: Rundentopf stimmt nicht (R1 ${round1} €, R2 ${round2Total} €, Soll ${expectedRoundPot} €)`,
      );
    }

    return {
      gameDayId: day.id,
      stNumber: index + 1,
      playedOn: day.played_on,
      players: [...byPlayer.values()],
    };
  }

  throw new Error("Kein vollständig erfasster Spieltag gefunden");
}

export function updateExcelWorkbook(buffer: Buffer, game: BackupGame) {
  const workbook = new ExcelJS.Workbook();

  return workbook.xlsx.load(buffer as never).then(async () => {
    const sheet = workbook.getWorksheet(SHEET_NAME);
    if (!sheet) throw new Error(`Excel-Blatt "${SHEET_NAME}" nicht gefunden`);

    const playerRows = new Map<string, number>();
    for (let row = FIRST_PLAYER_ROW; row <= LAST_PLAYER_ROW; row++) {
      const name = cellText(sheet.getCell(row, 1));
      if (name) playerRows.set(name, row);
    }
    for (const player of game.players) {
      if (!playerRows.has(player.name)) {
        throw new Error(`Spieler "${player.name}" fehlt in der Excel-Datei`);
      }
    }

    const existingGameColumn = findGameColumn(sheet, game.stNumber);
    let gameColumn = existingGameColumn;
    if (!gameColumn) {
      const summaryStart = findSummaryStart(sheet);
      const previousGameColumn = summaryStart - 1;

      // Freeze the prior game day, which may still be linked to the input panel.
      for (let row = FIRST_PLAYER_ROW; row <= LAST_PLAYER_ROW; row++) {
        const cell = sheet.getCell(row, previousGameColumn);
        const result = cell.result ?? cell.value;
        cell.value =
          typeof result === "number" || typeof result === "string"
            ? result
            : null;
      }

      sheet.spliceColumns(summaryStart, 0, []);
      gameColumn = summaryStart;
      copyColumnStyle(sheet, previousGameColumn, gameColumn);
    }

    const summaryStart = findSummaryStart(sheet);
    const averageColumn = summaryStart + 1;
    const attendanceColumn = summaryStart + 2;
    const totalsByName = new Map(
      game.players.map((player) => [
        player.name,
        round2(player.round1 + player.round2),
      ]),
    );
    const totals = [...totalsByName.values()];
    const grandTotal = round2(totals.reduce((sum, total) => sum + total, 0));

    sheet.getCell(HEADER_ROW, gameColumn).value = `ST${game.stNumber}`;
    sheet.getCell(DATE_ROW, gameColumn).value = excelDate(game.playedOn);
    sheet.getCell(DATE_ROW, gameColumn).numFmt = "dd.mm.yy";
    sheet.getCell(PLAYER_COUNT_ROW, gameColumn).value = game.players.length;
    sheet.getCell(POT_ROW, gameColumn).value = game.players.length * 40;

    for (let row = FIRST_PLAYER_ROW; row <= LAST_PLAYER_ROW; row++) {
      const name = cellText(sheet.getCell(row, 1));
      const playerTotal = totalsByName.get(name);
      sheet.getCell(row, gameColumn).value = playerTotal ?? null;
      const previousTotals = [];
      for (let col = 2; col <= gameColumn; col++) {
        const value = sheet.getCell(row, col).value;
        if (typeof value === "number" && Number.isFinite(value)) {
          previousTotals.push(value);
        }
      }
      const totalWinnings = round2(
        previousTotals.reduce((sum, value) => sum + value, 0),
      );
      const attendanceCount = previousTotals.length;
      sheet.getCell(row, summaryStart).value = formulaCell(
        `SUM(B${row}:${sheet.getColumn(gameColumn).letter}${row})`,
        totalWinnings,
      );
      sheet.getCell(row, averageColumn).value = formulaCell(
        `IF(${sheet.getColumn(attendanceColumn).letter}${row}>=8,${sheet.getColumn(summaryStart).letter}${row}/${sheet.getColumn(attendanceColumn).letter}${row},"")`,
        attendanceCount >= 8 ? round2(totalWinnings / attendanceCount) : "",
      );
      sheet.getCell(row, attendanceColumn).value = formulaCell(
        `COUNT(B${row}:${sheet.getColumn(gameColumn).letter}${row})`,
        attendanceCount,
      );
    }

    const inputTitle = findCell(sheet, "EINGABE NEUER SPIELTAG");
    if (!inputTitle) throw new Error("Excel-Eingabemaske nicht gefunden");
    const panelStart = inputTitle.col;
    const attendanceInputCol = panelStart + 1;
    const round1Col = panelStart + 2;
    const round2Col = panelStart + 3;
    const totalCol = panelStart + 4;
    const placementsCol = panelStart + 5;

    sheet.getCell(2, panelStart + 1).value = `ST${game.stNumber}`;
    sheet.getCell(2, panelStart + 3).value = excelDate(game.playedOn);
    sheet.getCell(2, panelStart + 3).numFmt = "dd.mm.";

    const gamePlayers = new Map(game.players.map((player) => [player.name, player]));
    for (let row = 5; row <= 15; row++) {
      const name = cellText(sheet.getCell(row, panelStart));
      const player = gamePlayers.get(name);
      sheet.getCell(row, attendanceInputCol).value = player ? 1 : null;
      sheet.getCell(row, round1Col).value =
        player && player.round1 > 0 ? player.round1 : null;
      sheet.getCell(row, round2Col).value =
        player && player.round2 > 0 ? player.round2 : null;
      sheet.getCell(row, totalCol).value = formulaCell(
        `IF(${sheet.getColumn(attendanceInputCol).letter}${row}=1,${sheet.getColumn(round1Col).letter}${row}+${sheet.getColumn(round2Col).letter}${row},"")`,
        player ? round2(player.round1 + player.round2) : "",
      );
      sheet.getCell(row, placementsCol).value = player
        ? placementText(player.round1, player.round2)
        : null;
    }

    sheet.getCell(16, attendanceInputCol).value = formulaCell(
      `SUM(${sheet.getColumn(attendanceInputCol).letter}5:${sheet.getColumn(attendanceInputCol).letter}15)`,
      game.players.length,
    );
    sheet.getCell(16, round1Col).value = formulaCell(
      `SUM(${sheet.getColumn(round1Col).letter}5:${sheet.getColumn(round1Col).letter}15)`,
      game.players.length * 20,
    );
    sheet.getCell(16, round2Col).value = formulaCell(
      `SUM(${sheet.getColumn(round2Col).letter}5:${sheet.getColumn(round2Col).letter}15)`,
      game.players.length * 20,
    );
    sheet.getCell(16, totalCol).value = formulaCell(
      `SUM(${sheet.getColumn(totalCol).letter}5:${sheet.getColumn(totalCol).letter}15)`,
      grandTotal,
    );
    sheet.getCell(16, placementsCol).value = `✓ ${grandTotal}€`;

    return Buffer.from(await workbook.xlsx.writeBuffer());
  });
}

async function driveClient() {
  const auth = new google.auth.JWT({
    email: requiredEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: normalizePrivateKey(requiredEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")),
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  return google.drive({ version: "v3", auth });
}

export async function updateGoogleDriveExcelBackup(
  supabase: SupabaseClient,
): Promise<ExcelBackupResult> {
  const fileId = requiredEnv("GOOGLE_DRIVE_EXCEL_FILE_ID");
  const game = await loadLatestCompleteGame(supabase);
  const drive = await driveClient();

  const download = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "arraybuffer" },
  );
  const currentFile = Buffer.from(download.data as ArrayBuffer);
  const updatedFile = await updateExcelWorkbook(currentFile, game);

  await drive.files.update({
    fileId,
    supportsAllDrives: true,
    keepRevisionForever: true,
    media: {
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      body: Readable.from(updatedFile),
    },
  });

  return {
    message: `Excel-Backup ST${game.stNumber} aktualisiert`,
    stNumber: game.stNumber,
    playedOn: game.playedOn,
  };
}
