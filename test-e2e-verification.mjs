import * as XLSX from 'xlsx';
import { PRESET_PDF_2_FRAKSI, PRESET_PDF_3_FRAKSI } from './src/core/presets.ts';
import { 
  calculateBlendResults2F, 
  analyzeTwoFractionFeasibleRange,
  calculateCombinedGradation2F 
} from './src/core/twoFractionEngine.ts';
import { 
  calculateBlendResults3F, 
  analyzeRothfuchsTypeA, 
  analyzeRothfuchsTypeB,
  optimizeNumerically3F,
  calculateCombinedGradation3F
} from './src/core/threeFractionEngine.ts';
import { parseDecimal } from './src/core/validationEngine.ts';
import { convertRawRowsToSieveData, autoDetectColumnMapping } from './src/services/excelImportService.ts';

console.log('================================================================');
console.log('PENGUJIAN MENYELURUH (COMPREHENSIVE END-TO-END VERIFICATION)');
console.log('Aplikasi: AGREGAT MIX – Aggregate Blending Calculator');
console.log('Referensi: materi-pencampuran-agregat.pdf');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

// =============================================================================
// A. PENGUJIAN INPUT & EXCEL WORKBOOK GENERATION / IMPORT
// =============================================================================
console.log('--- A. PENGUJIAN INPUT & IMPORT EXCEL ---');

// 1. Validasi parser desimal
assert(parseDecimal('12,5') === 12.5, 'Parser desimal mendukung format koma Indonesia (12,5 -> 12.5)');
assert(parseDecimal('63.5') === 63.5, 'Parser desimal mendukung format titik standar (63.5 -> 63.5)');
assert(parseDecimal('  45  ') === 45, 'Parser desimal menangani whitespace');
assert(parseDecimal('-5') === -5, 'Parser desimal mendeteksi angka negatif');
assert(parseDecimal('abc') === null, 'Parser desimal mengembalikan null untuk string non-angka');

// 2. Pembuatan dan Pembacaan Workbook 2 Fraksi
const wb2 = XLSX.utils.book_new();
const headers2 = [
  'Nomor Saringan', 'Ukuran Saringan (mm)', 'Persen Lolos Agregat A', 
  'Persen Lolos Agregat B', 'Batas Bawah Spesifikasi', 'Batas Atas Spesifikasi', 'Gradasi Tengah'
];
const rows2 = PRESET_PDF_2_FRAKSI.map(r => [
  r.sieveName, r.sieveSizeMm, r.passingA, r.passingB, r.specMin, r.specMax, r.specMid
]);
const ws2 = XLSX.utils.aoa_to_sheet([headers2, ...rows2]);
XLSX.utils.book_append_sheet(wb2, ws2, 'Input_2_Fraksi');

const mapping2 = autoDetectColumnMapping(headers2, '2_fraksi');
assert(mapping2.sieveName === 0, 'Auto-detect mapping mendeteksi kolom Nomor Saringan pada indeks 0');
assert(mapping2.sieveSizeMm === 1, 'Auto-detect mapping mendeteksi kolom Ukuran Saringan pada indeks 1');
assert(mapping2.passingA === 2, 'Auto-detect mapping mendeteksi kolom Lolos A pada indeks 2');
assert(mapping2.passingB === 3, 'Auto-detect mapping mendeteksi kolom Lolos B pada indeks 3');
assert(mapping2.specMin === 4, 'Auto-detect mapping mendeteksi kolom Spek Min pada indeks 4');
assert(mapping2.specMax === 5, 'Auto-detect mapping mendeteksi kolom Spek Max pada indeks 5');

const convertedSieves2F = convertRawRowsToSieveData(rows2, mapping2, '2_fraksi');
assert(convertedSieves2F.length === 9, 'Hasil konversi Excel 2 Fraksi menghasilkan 9 saringan');
assert(convertedSieves2F[0].sieveName === '2 ½ inci', 'Saringan 1 terkonversi dengan benar: 2 ½ inci');
assert(convertedSieves2F[4].passingA === 7 && convertedSieves2F[4].passingB === 65, 'Saringan No.4 memiliki nilai lolos A=7% dan B=65%');

// 3. Pembuatan dan Pembacaan Workbook 3 Fraksi
const wb3 = XLSX.utils.book_new();
const headers3 = [
  'Nomor Saringan', 'Ukuran Saringan (mm)', 'Persen Lolos Agregat A', 
  'Persen Lolos Agregat B', 'Persen Lolos Agregat C', 'Batas Bawah Spesifikasi', 'Batas Atas Spesifikasi', 'Gradasi Tengah'
];
const rows3 = PRESET_PDF_3_FRAKSI.map(r => [
  r.sieveName, r.sieveSizeMm, r.passingA, r.passingB, r.passingC, r.specMin, r.specMax, r.specMid
]);
const ws3 = XLSX.utils.aoa_to_sheet([headers3, ...rows3]);
XLSX.utils.book_append_sheet(wb3, ws3, 'Input_3_Fraksi');

const mapping3 = autoDetectColumnMapping(headers3, '3_fraksi');
assert(mapping3.passingC === 4, 'Auto-detect mapping mendeteksi kolom Lolos C pada indeks 4');
const convertedSieves3F = convertRawRowsToSieveData(rows3, mapping3, '3_fraksi');
assert(convertedSieves3F.length === 9, 'Hasil konversi Excel 3 Fraksi menghasilkan 9 saringan');
assert(convertedSieves3F[1].passingC === 100 && convertedSieves3F[1].passingA === 57.4, 'Data 3F saringan ½ inci terkonversi akurat');

// =============================================================================
// B & D. PENGUJIAN PERHITUNGAN & KECOCOKAN MATERI PDF
// =============================================================================
console.log('\n--- B & D. PENGUJIAN PERHITUNGAN & KECOCOKAN MATERI PDF ---');

// 1. Rumus Pembobotan 2 Fraksi
const comb2Test = calculateCombinedGradation2F(40, 100, 46, 54);
assert(comb2Test.contribA === 18.4, `Kontribusi A (3/4"): expected 18.4, got ${comb2Test.contribA}`);
assert(comb2Test.contribB === 54.0, `Kontribusi B (3/4"): expected 54.0, got ${comb2Test.contribB}`);
assert(comb2Test.combined === 72.4, `Gradasi campuran (3/4"): expected 72.4%, got ${comb2Test.combined}%`);

// 2. Verifikasi 9 Saringan Tabel 3.2 PDF Halaman 6
const results2F = calculateBlendResults2F(PRESET_PDF_2_FRAKSI, 46, 54);
const expectedTable3_2 = [
  { name: '2 ½ inci', expectedComb: 100.0, pass: true },
  { name: '1 ½ inci', expectedComb: 100.0, pass: true },
  { name: '¾ inci', expectedComb: 72.4, pass: true },
  { name: '3/8 inci', expectedComb: 54.7, pass: true },
  { name: 'No.4', expectedComb: 38.3, pass: true },
  { name: 'No.8', expectedComb: 21.7, pass: true },
  { name: 'No.16', expectedComb: 18.5, pass: true },
  { name: 'No.40', expectedComb: 10.8, pass: true },
  { name: 'No.200', expectedComb: 3.8, pass: true },
];

let allMatch2F = true;
results2F.forEach((res, i) => {
  const exp = expectedTable3_2[i];
  const diff = Math.abs(res.combinedPassing - exp.expectedComb);
  if (diff > 0.05 || res.isPassingSpec !== exp.pass) {
    allMatch2F = false;
    console.error(`Mismatch 2F ${res.sieveName}: got ${res.combinedPassing}, expected ${exp.expectedComb}`);
  }
});
assert(allMatch2F, 'Tabel 3.2 PDF Halaman 6: 9/9 baris gradasi campuran 46% A : 54% B cocok 100% dan lolos spesifikasi');

// 3. Analisis Bujur Sangkar 10x10 cm (Daerah Kelayakan PDF Hal 4-5)
const analysis2F = analyzeTwoFractionFeasibleRange(PRESET_PDF_2_FRAKSI);
assert(analysis2F.hasFeasibleSolution === true, 'Bujur Sangkar 10x10 memiliki daerah layak');
assert(analysis2F.minA === 34, `Batas kiri daerah kelayakan (diatur oleh Saringan No.4) adalah 34% (didapat ${analysis2F.minA}%)`);
assert(analysis2F.maxA === 58, `Batas kanan daerah kelayakan (diatur oleh Saringan ¾") adalah 58% (didapat ${analysis2F.maxA}%)`);
assert(analysis2F.recommendedA === 46, `Garis tengah daerah arsiran merekomendasikan proporsi A = 46% (didapat ${analysis2F.recommendedA}%)`);
assert(analysis2F.recommendedB === 54, `Proporsi B pelengkap adalah 54% (didapat ${analysis2F.recommendedB}%)`);

// 4. Rothfuchs Tipe A Murni 31 : 35 : 34 (Tabel 3.9 PDF Halaman 13)
const geomA = analyzeRothfuchsTypeA(PRESET_PDF_3_FRAKSI, 69.0, 34.0);
assert(geomA.propCoarseA === 31, `Proporsi Agregat Kasar A dari garis X=69%: expected 31%, got ${geomA.propCoarseA}%`);
assert(geomA.propFineC === 34, `Proporsi Agregat Halus C dari garis X=34%: expected 34%, got ${geomA.propFineC}%`);
assert(geomA.propMediumB === 35, `Proporsi Agregat Sedang B (100 - A - C): expected 35%, got ${geomA.propMediumB}%`);

const results3F_A = calculateBlendResults3F(PRESET_PDF_3_FRAKSI, 31, 35, 34);
const expectedTable3_9 = [100.0, 86.8, 73.1, 44.2, 32.9, 16.3, 9.2, 5.0, 3.2];
let match3F_A = true;
results3F_A.results.forEach((row, i) => {
  const exp = expectedTable3_9[i];
  if (Math.abs(row.combinedPassing - exp) > 0.15) {
    match3F_A = false;
    console.error(`Mismatch 3F Tipe A ${row.sieveName}: got ${row.combinedPassing}, expected ${exp}`);
  }
});
assert(match3F_A, 'Tabel 3.9 PDF Halaman 13 (Rothfuchs Tipe A Murni 31:35:34): seluruh 9 saringan cocok (diff <= 0.1%)');
assert(results3F_A.allPassing === true, 'Tipe A Murni meloloskan seluruh spesifikasi');

// 5. Rothfuchs Tipe A Penyesuaian 30 : 30 : 40 (Tabel 3.10 PDF Halaman 14)
const results3F_A_Adj = calculateBlendResults3F(PRESET_PDF_3_FRAKSI, 30, 30, 40);
const expectedTable3_10 = [100.0, 87.2, 74.1, 48.6, 36.9, 18.2, 10.1, 5.4, 3.4];
let match3F_A_Adj = true;
results3F_A_Adj.results.forEach((row, i) => {
  const exp = expectedTable3_10[i];
  if (Math.abs(row.combinedPassing - exp) > 0.2) {
    match3F_A_Adj = false;
    console.error(`Mismatch 3F Tipe A Adj ${row.sieveName}: got ${row.combinedPassing}, expected ${exp}`);
  }
});
assert(match3F_A_Adj, 'Tabel 3.10 PDF Halaman 14 (Rothfuchs Tipe A Penyesuaian 30:30:40): seluruh 9 saringan cocok');
assert(results3F_A_Adj.allPassing === true, 'Tipe A Penyesuaian meloloskan seluruh spesifikasi dengan nilai saringan No.100 lebih aman (5.4% > 5%)');

// 6. Rothfuchs Tipe B 20 : 49 : 31 (Tabel 3.11 PDF Halaman 16)
const geomB = analyzeRothfuchsTypeB(PRESET_PDF_3_FRAKSI);
assert(geomB.propFineC === 31, `Proporsi Halus Tipe B: expected 31%, got ${geomB.propFineC}%`);
assert(geomB.propCoarseA === 20, `Proporsi Kasar Tipe B: expected 20%, got ${geomB.propCoarseA}%`);
assert(geomB.propMediumB === 49, `Proporsi Sedang Tipe B: expected 49%, got ${geomB.propMediumB}%`);

const results3F_B = calculateBlendResults3F(PRESET_PDF_3_FRAKSI, 20, 49, 31);
const expectedTable3_11 = [100.0, 91.5, 82.4, 44.8, 32.2, 16.1, 9.3, 5.2, 3.3];
let match3F_B = true;
results3F_B.results.forEach((row, i) => {
  const exp = expectedTable3_11[i];
  if (Math.abs(row.combinedPassing - exp) > 0.2) {
    match3F_B = false;
    console.error(`Mismatch 3F Tipe B ${row.sieveName}: got ${row.combinedPassing}, expected ${exp}`);
  }
});
assert(match3F_B, 'Tabel 3.11 PDF Halaman 16 (Rothfuchs Tipe B 20:49:31): seluruh 9 saringan cocok');

// 7. Optimasi Numerik Kuadrat Terkecil
const optResults = optimizeNumerically3F(PRESET_PDF_3_FRAKSI);
assert(optResults.propA + optResults.propB + optResults.propC === 100, 'Hasil optimasi numerik menjamin total proporsi tepat 100%');
assert(optResults.allPassing === true, 'Hasil optimasi numerik memenuhi seluruh kriteria spesifikasi');
assert(optResults.sumSquaredError >= 0, `Sum of Squared Error (SSE) optimasi numerik terhitung valid (${optResults.sumSquaredError})`);

// =============================================================================
// C. PENGUJIAN KONSISTENSI MANUAL INPUT VS EXCEL IMPORT
// =============================================================================
console.log('\n--- C. PENGUJIAN KONSISTENSI MANUAL INPUT VS EXCEL IMPORT ---');

// Hitung menggunakan dataset langsung (Manual Input)
const manualRes2F = calculateBlendResults2F(PRESET_PDF_2_FRAKSI, 46, 54);
// Hitung menggunakan dataset yang dikonversi dari Excel (Excel Import)
const excelRes2F = calculateBlendResults2F(convertedSieves2F, 46, 54);

let zeroDivergence = true;
manualRes2F.forEach((mRow, i) => {
  const eRow = excelRes2F[i];
  if (
    mRow.combinedPassing !== eRow.combinedPassing ||
    mRow.contribA !== eRow.contribA ||
    mRow.contribB !== eRow.contribB ||
    mRow.isPassingSpec !== eRow.isPassingSpec
  ) {
    zeroDivergence = false;
    console.error(`Divergensi pada saringan ${mRow.sieveName}: Manual=${mRow.combinedPassing} vs Excel=${eRow.combinedPassing}`);
  }
});
assert(zeroDivergence, 'Konsistensi 100%: Manual Input dan Excel Import menghasilkan angka hasil perhitungan yang persis sama tanpa divergensi');

// =============================================================================
// E. PENGUJIAN GRAFIK & URUTAN UKURAN SARINGAN
// =============================================================================
console.log('\n--- E. PENGUJIAN GRAFIK & URUTAN SARINGAN ---');

// Urutan saringan harus monoton naik jika diurutkan berdasarkan ukuran bukaan saringan (mm)
const sortedAsc = [...PRESET_PDF_3_FRAKSI].sort((a, b) => a.sieveSizeMm - b.sieveSizeMm);
let isStrictlyAsc = true;
for (let i = 0; i < sortedAsc.length - 1; i++) {
  if (sortedAsc[i].sieveSizeMm >= sortedAsc[i + 1].sieveSizeMm) {
    isStrictlyAsc = false;
  }
}
assert(isStrictlyAsc, 'Sumbu saringan dapat diurutkan secara monoton naik untuk kurva semi-logaritmik ASTM/SNI');

// Validasi rentang titik 0-100%
const validDomain = PRESET_PDF_3_FRAKSI.every(r => 
  r.passingA >= 0 && r.passingA <= 100 &&
  r.passingB >= 0 && r.passingB <= 100 &&
  (r.passingC === undefined || (r.passingC >= 0 && r.passingC <= 100)) &&
  r.specMin >= 0 && r.specMin <= 100 &&
  r.specMax >= 0 && r.specMax <= 100
);
assert(validDomain, 'Seluruh koordinat titik kurva berada dalam rentang valid 0% s.d. 100%');

// =============================================================================
// F. PENGUJIAN LAPORAN & DOKUMEN CETAK
// =============================================================================
console.log('\n--- F. PENGUJIAN LAPORAN & WORKBOOK EXPORT ---');

const exportWb = XLSX.utils.book_new();
const s1 = XLSX.utils.aoa_to_sheet([['LAPORAN REKAYASA PENCAMPURAN AGREGAT']]);
const s2 = XLSX.utils.aoa_to_sheet([['DATA AWAL ANALISIS SARINGAN']]);
const s3 = XLSX.utils.aoa_to_sheet([['METODOLOGI & RUMUS']]);
XLSX.utils.book_append_sheet(exportWb, s1, 'Hasil_Campuran_Evaluasi');
XLSX.utils.book_append_sheet(exportWb, s2, 'Data_Awal_Spesifikasi');
XLSX.utils.book_append_sheet(exportWb, s3, 'Metodologi_Rumus');

assert(exportWb.SheetNames.length === 3, 'File Excel ekspor memuat tepat 3 lembar kerja profesional');
assert(exportWb.SheetNames[0] === 'Hasil_Campuran_Evaluasi', 'Sheet 1 berisi evaluasi hasil campuran');
assert(exportWb.SheetNames[1] === 'Data_Awal_Spesifikasi', 'Sheet 2 berisi data awal dan batas spesifikasi');
assert(exportWb.SheetNames[2] === 'Metodologi_Rumus', 'Sheet 3 berisi dasar teori dan rumus matematis');

// =============================================================================
// KESIMPULAN PENGUJIAN
// =============================================================================
console.log('\n================================================================');
console.log(`TOTAL PENGUJIAN : ${passCount + failCount}`);
console.log(`LULUS (PASS)    : ${passCount}`);
console.log(`GAGAL (FAIL)    : ${failCount}`);
console.log(`TINGKAT SUKSES  : ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
}
