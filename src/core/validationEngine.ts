import type { SieveDataRow } from '../types/index.ts';
import type { ValidationError, ValidationResult } from '../types/inputValidation.ts';

/**
 * Mengonversi nilai input (string atau number) menjadi nilai numerik desimal.
 * Mendukung penggunaan koma (,) maupun titik (.) sebagai pemisah desimal.
 * Contoh: "12,5" -> 12.5; "19.0" -> 19; "  4,75  " -> 4.75
 */
export function parseDecimal(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }

  const str = String(value).trim();
  if (str === '') return null;

  // Ganti koma dengan titik untuk standarisasi parsing JS
  const normalized = str.replace(',', '.');

  // Validasi pola angka desimal standar
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }

  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

/**
 * Memvalidasi dataset saringan agregat secara menyeluruh.
 * Memeriksa:
 * 1. Data wajib terisi (tidak boleh kosong)
 * 2. Ukuran saringan positif (> 0 mm)
 * 3. Tidak ada ukuran saringan duplikat
 * 4. Persen lolos agregat (0 - 100%)
 * 5. Batas bawah & atas spesifikasi (0 - 100%)
 * 6. Batas bawah tidak boleh melebihi batas atas (specMin <= specMax)
 * 7. Minimal 3 baris saringan untuk pembentukan kurva rekayasa sipil
 */
export function validateSieveDataset(
  data: SieveDataRow[],
  mode: '2_fraksi' | '3_fraksi'
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Pengecekan jumlah minimum saringan
  if (data.length < 3) {
    errors.push({
      rowNumber: 0,
      columnKey: 'general',
      columnName: 'Tabel Saringan',
      message: `Jumlah saringan minimal adalah 3 baris untuk analisis gradasi campuran (saat ini ${data.length} baris).`,
      severity: 'error',
    });
  }

  // Peta untuk mendeteksi ukuran saringan duplikat
  const sizeMap = new Map<number, number[]>(); // sizeMm -> array of row numbers (1-indexed)
  data.forEach((row, idx) => {
    const size = parseDecimal(row.sieveSizeMm);
    if (size !== null && size > 0) {
      const existing = sizeMap.get(size) || [];
      existing.push(idx + 1);
      sizeMap.set(size, existing);
    }
  });

  // Iterasi pemeriksaan baris demi baris dan kolom demi kolom
  data.forEach((row, idx) => {
    const rowNum = idx + 1;

    // 1. Kolom Nomor Saringan (Sieve Name)
    if (!row.sieveName || String(row.sieveName).trim() === '') {
      errors.push({
        rowNumber: rowNum,
        sieveId: row.id,
        columnKey: 'sieveName',
        columnName: 'Nomor Saringan',
        message: 'Nomor saringan wajib diisi (contoh: "3/4 inci", "No.4").',
        severity: 'error',
      });
    }

    // 2. Kolom Ukuran Saringan (Sieve Size mm)
    const sizeVal = parseDecimal(row.sieveSizeMm);
    if (sizeVal === null) {
      errors.push({
        rowNumber: rowNum,
        sieveId: row.id,
        columnKey: 'sieveSizeMm',
        columnName: 'Ukuran Saringan (mm)',
        message: 'Ukuran saringan harus berupa angka numerik yang valid.',
        severity: 'error',
      });
    } else if (sizeVal <= 0) {
      errors.push({
        rowNumber: rowNum,
        sieveId: row.id,
        columnKey: 'sieveSizeMm',
        columnName: 'Ukuran Saringan (mm)',
        message: `Ukuran saringan harus lebih besar dari 0 mm (saat ini: ${sizeVal} mm).`,
        severity: 'error',
      });
    } else {
      // Cek duplikasi ukuran
      const duplicateRows = sizeMap.get(sizeVal);
      if (duplicateRows && duplicateRows.length > 1) {
        const others = duplicateRows.filter((r) => r !== rowNum);
        errors.push({
          rowNumber: rowNum,
          sieveId: row.id,
          columnKey: 'sieveSizeMm',
          columnName: 'Ukuran Saringan (mm)',
          message: `Ukuran saringan ${sizeVal} mm duplikat dengan Baris ${others.join(', ')}. Ukuran saringan tidak boleh sama.`,
          severity: 'error',
        });
      }
    }

    // 3. Kolom Persen Lolos Agregat A (Fraksi Kasar)
    const passA = parseDecimal(row.passingA);
    if (passA === null) {
      errors.push({
        rowNumber: rowNum,
        sieveId: row.id,
        columnKey: 'passingA',
        columnName: 'Persen Lolos Agregat A',
        message: 'Persen lolos Agregat A harus berupa angka numerik (0–100%).',
        severity: 'error',
      });
    } else if (passA < 0 || passA > 100) {
      errors.push({
        rowNumber: rowNum,
        sieveId: row.id,
        columnKey: 'passingA',
        columnName: 'Persen Lolos Agregat A',
        message: `Persen lolos Agregat A harus dalam rentang 0% hingga 100% (saat ini: ${passA}%).`,
        severity: 'error',
      });
    }

    // 4. Kolom Persen Lolos Agregat B (Fraksi Halus / Sedang)
    const passB = parseDecimal(row.passingB);
    if (passB === null) {
      errors.push({
        rowNumber: rowNum,
        sieveId: row.id,
        columnKey: 'passingB',
        columnName: 'Persen Lolos Agregat B',
        message: 'Persen lolos Agregat B harus berupa angka numerik (0–100%).',
        severity: 'error',
      });
    } else if (passB < 0 || passB > 100) {
      errors.push({
        rowNumber: rowNum,
        sieveId: row.id,
        columnKey: 'passingB',
        columnName: 'Persen Lolos Agregat B',
        message: `Persen lolos Agregat B harus dalam rentang 0% hingga 100% (saat ini: ${passB}%).`,
        severity: 'error',
      });
    }

    // 5. Kolom Persen Lolos Agregat C (Khusus Mode 3 Fraksi)
    if (mode === '3_fraksi') {
      const passC = parseDecimal(row.passingC);
      if (passC === null) {
        errors.push({
          rowNumber: rowNum,
          sieveId: row.id,
          columnKey: 'passingC',
          columnName: 'Persen Lolos Agregat C',
          message: 'Persen lolos Agregat C harus berupa angka numerik (0–100%).',
          severity: 'error',
        });
      } else if (passC < 0 || passC > 100) {
        errors.push({
          rowNumber: rowNum,
          sieveId: row.id,
          columnKey: 'passingC',
          columnName: 'Persen Lolos Agregat C',
          message: `Persen lolos Agregat C harus dalam rentang 0% hingga 100% (saat ini: ${passC}%).`,
          severity: 'error',
        });
      }
    }

    // 6. Kolom Batas Bawah Spesifikasi
    const sMin = parseDecimal(row.specMin);
    if (sMin === null) {
      errors.push({
        rowNumber: rowNum,
        sieveId: row.id,
        columnKey: 'specMin',
        columnName: 'Batas Bawah Spesifikasi',
        message: 'Batas bawah spesifikasi harus berupa angka numerik (0–100%).',
        severity: 'error',
      });
    } else if (sMin < 0 || sMin > 100) {
      errors.push({
        rowNumber: rowNum,
        sieveId: row.id,
        columnKey: 'specMin',
        columnName: 'Batas Bawah Spesifikasi',
        message: `Batas bawah spesifikasi harus dalam rentang 0% hingga 100% (saat ini: ${sMin}%).`,
        severity: 'error',
      });
    }

    // 7. Kolom Batas Atas Spesifikasi
    const sMax = parseDecimal(row.specMax);
    if (sMax === null) {
      errors.push({
        rowNumber: rowNum,
        sieveId: row.id,
        columnKey: 'specMax',
        columnName: 'Batas Atas Spesifikasi',
        message: 'Batas atas spesifikasi harus berupa angka numerik (0–100%).',
        severity: 'error',
      });
    } else if (sMax < 0 || sMax > 100) {
      errors.push({
        rowNumber: rowNum,
        sieveId: row.id,
        columnKey: 'specMax',
        columnName: 'Batas Atas Spesifikasi',
        message: `Batas atas spesifikasi harus dalam rentang 0% hingga 100% (saat ini: ${sMax}%).`,
        severity: 'error',
      });
    }

    // 8. Relasi Batas Bawah <= Batas Atas
    if (sMin !== null && sMax !== null && sMin > sMax) {
      errors.push({
        rowNumber: rowNum,
        sieveId: row.id,
        columnKey: 'specMin',
        columnName: 'Batas Spesifikasi',
        message: `Batas bawah spesifikasi (${sMin}%) tidak boleh lebih besar dari batas atas spesifikasi (${sMax}%).`,
        severity: 'error',
      });
    }

    // 9. Kolom Gradasi Tengah (Pemeriksaan opsional)
    if (row.specMid !== undefined && row.specMid !== null) {
      const sMid = parseDecimal(row.specMid);
      if (sMid !== null && sMin !== null && sMax !== null) {
        if (sMid < sMin || sMid > sMax) {
          warnings.push({
            rowNumber: rowNum,
            sieveId: row.id,
            columnKey: 'specMid',
            columnName: 'Gradasi Tengah',
            message: `Gradasi tengah (${sMid}%) berada di luar rentang spesifikasi [${sMin}% - ${sMax}%].`,
            severity: 'warning',
          });
        }
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    errorCount: errors.length,
    warningCount: warnings.length,
  };
}

/**
 * Mencari kesalahan spesifik pada sel tertentu berdasarkan baris dan kolom
 */
export function getCellError(
  errors: ValidationError[],
  rowNumber: number,
  columnKey: string
): ValidationError | undefined {
  return errors.find(
    (e) => e.rowNumber === rowNumber && (e.columnKey === columnKey || e.columnKey === 'specMin' && columnKey === 'specMax')
  );
}
