import assert from "node:assert/strict";
import test from "node:test";
import ExcelJS from "exceljs";

import { updateExcelWorkbook } from "./excel-backup.ts";

async function createWorkbookFixture() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Auszahlungen");

  sheet.getCell("B13").value = "ST13";
  sheet.getCell("C13").value = "Σ Moneylist";
  sheet.getCell("E1").value = "EINGABE NEUER SPIELTAG";

  sheet.getCell("A17").value = "Alice";
  sheet.getCell("A18").value = "Bob";
  sheet.getCell("E5").value = "Alice";
  sheet.getCell("E6").value = "Bob";

  sheet.getCell("B17").value = { formula: "5+5", result: 10 };
  sheet.getCell("B18").value = 0;

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

test("adding a new game preserves numeric totals from the prior game", async () => {
  const fixture = await createWorkbookFixture();
  const withSt14 = await updateExcelWorkbook(fixture, {
    gameDayId: "st14",
    stNumber: 14,
    playedOn: "2026-05-07",
    players: [
      { name: "Alice", round1: 60, round2: 40 },
      { name: "Bob", round1: 20, round2: 0 },
    ],
  });
  const withSt15 = await updateExcelWorkbook(withSt14, {
    gameDayId: "st15",
    stNumber: 15,
    playedOn: "2026-06-11",
    players: [
      { name: "Alice", round1: 30, round2: 0 },
      { name: "Bob", round1: 20, round2: 30 },
    ],
  });

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(withSt15);
  const sheet = workbook.getWorksheet("Auszahlungen");

  assert.equal(sheet.getCell("C13").value, "ST14");
  assert.equal(sheet.getCell("C17").value, 100);
  assert.equal(sheet.getCell("C18").value, 20);
  assert.equal(sheet.getCell("D13").value, "ST15");
  assert.equal(sheet.getCell("D17").value, 30);
  assert.equal(sheet.getCell("D18").value, 50);
});
