import * as XLSX from 'xlsx';
import type { SieveDataRow } from '../types/index.ts';
import type { ColumnMapping, ExcelWorkbookData } from '../types/inputValidation.ts';
import { parseDecimal } from '../core/validationEngine.ts';

/**
 * Membaca file Excel (.xlsx, .xls) atau CSV (.csv) secara lokal di browser.
 * Tidak ada data laboratorium yang dikirim ke server eksternal.
 */
export async function readExcelFile(file: File): Promise<{
  workbook: XLSX.WorkBook;
  sheetNames: string[];
  fileName: string;
  fileSize: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const data = new Uint8Array(buffer);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          reject(new Error('File Excel tidak memiliki lembar kerja (worksheet).'));
          return;
        }

        resolve({
          workbook,
          sheetNames: workbook.SheetNames,
          fileName: file.name,
          fileSize: file.size,
        });
      } catch (err) {
        reject(new Error(`Gagal membaca file: ${(err as Error).message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Terjadi kesalahan saat membaca file dari komputer.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Mengekstrak data baris mentah dari sheet tertentu dan mendeteksi baris header secara otomatis
 */
export function extractSheetData(
  workbook: XLSX.WorkBook,
  sheetName: string,
  mode: '2_fraksi' | '3_fraksi'
): {
  rawRows: any[][];
  headerRowIndex: number;
  headers: string[];
  dataRows: any[][];
  mapping: ColumnMapping;
} {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Lembar kerja "${sheetName}" tidak ditemukan.`);
  }

  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // Cari baris header otomatis di 15 baris pertama
  let headerRowIndex = 0;
  let maxScore = -1;

  for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const rowStr = row.map((c) => String(c).toLowerCase()).join(' ');
    let score = 0;
    if (rowStr.includes('saringan') || rowStr.includes('sieve')) score += 3;
    if (rowStr.includes('ukuran') || rowStr.includes('size') || rowStr.includes('mm')) score += 3;
    if (rowStr.includes('lolos') || rowStr.includes('passing')) score += 3;
    if (rowStr.includes('spesifikasi') || rowStr.includes('spek') || rowStr.includes('min') || rowStr.includes('max')) score += 3;

    if (score > maxScore && score >= 3) {
      maxScore = score;
      headerRowIndex = r;
    }
  }

  // Jika baris header terdeteksi
  const headerRow = rawRows[headerRowIndex] || [];
  const headers = headerRow.map((cell, idx) => {
    const str = String(cell).trim();
    return str !== '' ? str : `Kolom ${idx + 1}`;
  });

  const dataRows = rawRows.slice(headerRowIndex + 1).filter((r) => {
    // Abaikan baris kosong total
    return r.some((c: any) => c !== '' && c !== null && c !== undefined);
  });

  const mapping = autoDetectColumnMapping(headers, mode);

  return {
    rawRows,
    headerRowIndex,
    headers,
    dataRows,
    mapping,
  };
}

/**
 * Deteksi otomatis pemetaan kolom berdasarkan nama header
 */
export function autoDetectColumnMapping(
  headers: string[],
  mode: '2_fraksi' | '3_fraksi'
): ColumnMapping {
  const mapping: ColumnMapping = {
    sieveName: -1,
    sieveSizeMm: -1,
    passingA: -1,
    passingB: -1,
    passingC: mode === '3_fraksi' ? -1 : undefined,
    specMin: -1,
    specMax: -1,
    specMid: -1,
  };

  headers.forEach((h, idx) => {
    const clean = h.toLowerCase().trim();

    // Nomor Saringan
    if (mapping.sieveName === -1 && (clean.includes('nomor') || clean.includes('saringan') || clean.includes('sieve') || clean.includes('no'))) {
      if (!clean.includes('ukuran') && !clean.includes('mm') && !clean.includes('lolos')) {
        mapping.sieveName = idx;
        return;
      }
    }

    // Ukuran Saringan mm
    if (mapping.sieveSizeMm === -1 && (clean.includes('ukuran') || clean.includes('size') || clean.includes('mm') || clean.includes('bukaan'))) {
      mapping.sieveSizeMm = idx;
      return;
    }

    // Persen Lolos A
    if (mapping.passingA === -1 && ((clean.includes('lolos') || clean.includes('passing')) && clean.includes('a') || clean.includes('kasar') || clean.includes('fraksi a'))) {
      mapping.passingA = idx;
      return;
    }

    // Persen Lolos B
    if (mapping.passingB === -1 && ((clean.includes('lolos') || clean.includes('passing')) && clean.includes('b') || clean.includes('sedang') || clean.includes('fraksi b') || (mode === '2_fraksi' && clean.includes('halus')))) {
      mapping.passingB = idx;
      return;
    }

    // Persen Lolos C (Khusus 3 Fraksi)
    if (mode === '3_fraksi' && mapping.passingC === -1 && ((clean.includes('lolos') || clean.includes('passing')) && clean.includes('c') || clean.includes('halus') || clean.includes('fraksi c'))) {
      mapping.passingC = idx;
      return;
    }

    // Batas Bawah Spesifikasi
    if (mapping.specMin === -1 && (clean.includes('bawah') || clean.includes('min') || clean.includes('lower') || clean.includes('spek min'))) {
      mapping.specMin = idx;
      return;
    }

    // Batas Atas Spesifikasi
    if (mapping.specMax === -1 && (clean.includes('atas') || clean.includes('max') || clean.includes('upper') || clean.includes('spek max'))) {
      mapping.specMax = idx;
      return;
    }

    // Gradasi Tengah
    if (mapping.specMid === -1 && (clean.includes('tengah') || clean.includes('mid') || clean.includes('center'))) {
      mapping.specMid = idx;
      return;
    }
  });

  // Fallback berdasarkan urutan posisi jika belum terpetakan sama sekali
  if (mapping.sieveName === -1 && headers.length > 0) mapping.sieveName = 0;
  if (mapping.sieveSizeMm === -1 && headers.length > 1) mapping.sieveSizeMm = 1;
  if (mapping.passingA === -1 && headers.length > 2) mapping.passingA = 2;
  if (mapping.passingB === -1 && headers.length > 3) mapping.passingB = 3;

  if (mode === '3_fraksi') {
    if (mapping.passingC === -1 && headers.length > 4) mapping.passingC = 4;
    if (mapping.specMin === -1 && headers.length > 5) mapping.specMin = 5;
    if (mapping.specMax === -1 && headers.length > 6) mapping.specMax = 6;
    if (mapping.specMid === -1 && headers.length > 7) mapping.specMid = 7;
  } else {
    if (mapping.specMin === -1 && headers.length > 4) mapping.specMin = 4;
    if (mapping.specMax === -1 && headers.length > 5) mapping.specMax = 5;
    if (mapping.specMid === -1 && headers.length > 6) mapping.specMid = 6;
  }

  return mapping;
}

/**
 * Mengonversi baris mentah Excel menjadi array SieveDataRow terstruktur
 */
export function convertRawRowsToSieveData(
  dataRows: any[][],
  mapping: ColumnMapping,
  mode: '2_fraksi' | '3_fraksi'
): SieveDataRow[] {
  return dataRows.map((row, idx) => {
    const rawName = mapping.sieveName >= 0 ? row[mapping.sieveName] : `Saringan ${idx + 1}`;
    const rawSize = mapping.sieveSizeMm >= 0 ? row[mapping.sieveSizeMm] : 0;
    const rawA = mapping.passingA >= 0 ? row[mapping.passingA] : 0;
    const rawB = mapping.passingB >= 0 ? row[mapping.passingB] : 0;
    const rawC = mode === '3_fraksi' && mapping.passingC !== undefined && mapping.passingC >= 0 ? row[mapping.passingC] : 0;
    const rawMin = mapping.specMin >= 0 ? row[mapping.specMin] : 0;
    const rawMax = mapping.specMax >= 0 ? row[mapping.specMax] : 100;
    const rawMid = mapping.specMid !== undefined && mapping.specMid >= 0 ? row[mapping.specMid] : null;

    const parsedSize = parseDecimal(rawSize) ?? 0;
    const parsedA = parseDecimal(rawA) ?? 0;
    const parsedB = parseDecimal(rawB) ?? 0;
    const parsedC = mode === '3_fraksi' ? (parseDecimal(rawC) ?? 0) : undefined;
    const parsedMin = parseDecimal(rawMin) ?? 0;
    const parsedMax = parseDecimal(rawMax) ?? 100;

    let parsedMid = rawMid !== null ? parseDecimal(rawMid) : null;
    if (parsedMid === null) {
      parsedMid = Number(((parsedMin + parsedMax) / 2).toFixed(1));
    }

    return {
      id: `imp_${idx + 1}_${Date.now()}`,
      sieveName: String(rawName).trim() || `Saringan ${idx + 1}`,
      sieveSizeMm: parsedSize,
      passingA: parsedA,
      passingB: parsedB,
      passingC: parsedC,
      specMin: parsedMin,
      specMax: parsedMax,
      specMid: parsedMid,
    };
  });
}
