import { 
  calculateCombinedGradation3F, 
  calculateBlendResults3F, 
  analyzeRothfuchsTypeA,
  analyzeRothfuchsTypeB,
  optimizeNumerically3F
} from './src/core/threeFractionEngine.ts';
import { PRESET_PDF_3_FRAKSI } from './src/core/presets.ts';

console.log('====================================================');
console.log('UNIT TEST SUITE: MODE PENCAMPURAN 3 FRAKSI AGREGAT');
console.log('Referensi: materi-pencampuran-agregat.pdf (Hal 7-17)');
console.log('====================================================\n');

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

// -----------------------------------------------------------------------------
// TEST 1: RUMUS PEMBOBOTAN P = (PA * A) + (PB * B) + (PC * C)
// -----------------------------------------------------------------------------
console.log('--- TEST 1: RUMUS PEMBOBOTAN 3 FRAKSI & KONVERSI DESIMAL ---');
const testComb = calculateCombinedGradation3F(14.7, 98.8, 100.0, 31, 35, 34);
// PA = 0.31 * 14.7 = 4.557 -> 4.6
// PB = 0.35 * 98.8 = 34.58 -> 34.6
// PC = 0.34 * 100.0 = 34.0
// Total = 4.6 + 34.6 + 34.0 = 73.2 (atau ~73.1 tergantung rounding)
assert(testComb.contribA === 4.6, `Kontribusi A (3/8"): expected 4.6, got ${testComb.contribA}`);
assert(testComb.contribB === 34.6, `Kontribusi B (3/8"): expected 34.6, got ${testComb.contribB}`);
assert(testComb.contribC === 34.0, `Kontribusi C (3/8"): expected 34.0, got ${testComb.contribC}`);
assert(Math.abs(testComb.combined - 73.2) <= 0.2, `Gradasi gabungan 3/8": expected ~73.1-73.2, got ${testComb.combined}`);

// -----------------------------------------------------------------------------
// TEST 2: ROTHFUCHS TIPE A MURNI (TABEL 3.9 PDF HAL 13)
// Proporsi: 31% Kasar : 35% Sedang : 34% Halus
// -----------------------------------------------------------------------------
console.log('\n--- TEST 2: VERIFIKASI TABEL 3.9 PDF (Tipe A Murni 31:35:34) ---');
const blendA_Murni = calculateBlendResults3F(PRESET_PDF_3_FRAKSI, 31, 35, 34);

// Cek nilai gabungan tiap saringan sesuai Tabel 3.9:
// 63 mm   : 100.0%
// 37.5 mm : 86.8%
// 19 mm   : 73.1%
// 9.5 mm  : 44.2%
// 4.75 mm : 32.9%
// 2.36 mm : 16.3%
// 1.18 mm : 9.2%
// 0.425 mm: 5.0%
// 0.075 mm: 3.2%
const expectedTable3_9 = [100.0, 86.8, 73.1, 44.2, 32.9, 16.3, 9.2, 5.0, 3.2];

blendA_Murni.results.forEach((row, idx) => {
  const exp = expectedTable3_9[idx];
  const diff = Math.abs(row.combinedPassing - exp);
  assert(diff <= 0.2, `Saringan ${row.sieveName} (${row.sieveSizeMm} mm): expected ~${exp}%, got ${row.combinedPassing}% (diff: ${diff.toFixed(2)})`);
  assert(row.isPassingSpec, `Saringan ${row.sieveName} harus memenuhi spesifikasi [${row.specMin}, ${row.specMax}]`);
});

// -----------------------------------------------------------------------------
// TEST 3: ROTHFUCHS TIPE A PENYESUAIAN (TABEL 3.10 PDF HAL 14)
// Proporsi: 30% Kasar : 30% Sedang : 40% Halus
// -----------------------------------------------------------------------------
console.log('\n--- TEST 3: VERIFIKASI TABEL 3.10 PDF (Tipe A Penyesuaian 30:30:40) ---');
const blendA_Adjusted = calculateBlendResults3F(PRESET_PDF_3_FRAKSI, 30, 30, 40);
const expectedTable3_10 = [100.0, 87.2, 74.1, 48.6, 36.9, 18.2, 10.1, 5.4, 3.4];

blendA_Adjusted.results.forEach((row, idx) => {
  const exp = expectedTable3_10[idx];
  const diff = Math.abs(row.combinedPassing - exp);
  assert(diff <= 0.2, `Saringan ${row.sieveName}: expected ~${exp}%, got ${row.combinedPassing}%`);
  assert(row.isPassingSpec, `Saringan ${row.sieveName} memenuhi spesifikasi`);
});

// -----------------------------------------------------------------------------
// TEST 4: ROTHFUCHS TIPE B (TABEL 3.11 PDF HAL 16)
// Proporsi: 20% Kasar : 49% Sedang : 31% Halus
// -----------------------------------------------------------------------------
console.log('\n--- TEST 4: VERIFIKASI TABEL 3.11 PDF (Tipe B 20:49:31) ---');
const blendB = calculateBlendResults3F(PRESET_PDF_3_FRAKSI, 20, 49, 31);
const expectedTable3_11 = [100.0, 91.5, 82.4, 44.8, 32.2, 16.1, 9.3, 5.2, 3.3];

blendB.results.forEach((row, idx) => {
  const exp = expectedTable3_11[idx];
  const diff = Math.abs(row.combinedPassing - exp);
  assert(diff <= 0.2, `Saringan ${row.sieveName}: expected ~${exp}%, got ${row.combinedPassing}%`);
  assert(row.isPassingSpec, `Saringan ${row.sieveName} memenuhi spesifikasi`);
});

// -----------------------------------------------------------------------------
// TEST 5: GEOMETRI ROTHFUCHS TIPE A & B
// -----------------------------------------------------------------------------
console.log('\n--- TEST 5: ANALISIS GEOMETRI ROTHFUCHS TIPE A & B ---');
const geomA = analyzeRothfuchsTypeA(PRESET_PDF_3_FRAKSI);
assert(geomA.propCoarseA === 31, `Geometri Tipe A Proporsi Kasar: expected 31%, got ${geomA.propCoarseA}%`);
assert(geomA.propFineC === 34, `Geometri Tipe A Proporsi Halus: expected 34%, got ${geomA.propFineC}%`);
assert(geomA.propMediumB === 35, `Geometri Tipe A Proporsi Sedang: expected 35%, got ${geomA.propMediumB}%`);

const geomB = analyzeRothfuchsTypeB(PRESET_PDF_3_FRAKSI);
assert(geomB.propFineC === 31, `Geometri Tipe B Proporsi Halus: expected 31%, got ${geomB.propFineC}%`);
assert(geomB.propCoarseA === 20, `Geometri Tipe B Proporsi Kasar: expected 20%, got ${geomB.propCoarseA}%`);
assert(geomB.propMediumB === 49, `Geometri Tipe B Proporsi Sedang: expected 49%, got ${geomB.propMediumB}%`);

// -----------------------------------------------------------------------------
// TEST 6: OPTIMASI NUMERIK (NON-ROTHFUCHS)
// -----------------------------------------------------------------------------
console.log('\n--- TEST 6: OPTIMASI NUMERIK (TERPISAH DARI ROTHFUCHS) ---');
const optResult = optimizeNumerically3F(PRESET_PDF_3_FRAKSI);
assert(optResult.propA >= 0 && optResult.propB >= 0 && optResult.propC >= 0, 'Proporsi tidak boleh negatif');
assert(optResult.propA + optResult.propB + optResult.propC === 100, `Total proporsi harus 100%, got ${optResult.propA + optResult.propB + optResult.propC}%`);
assert(optResult.allPassing, 'Hasil optimasi harus memenuhi seluruh batas spesifikasi');
assert(optResult.sieveDeviations.length === PRESET_PDF_3_FRAKSI.length, 'Deviasi dihitung per saringan');

console.log('\n====================================================');
console.log(`HASIL AKHIR: ${passCount} PASSED, ${failCount} FAILED`);
console.log('====================================================');

if (failCount > 0) {
  process.exit(1);
}
