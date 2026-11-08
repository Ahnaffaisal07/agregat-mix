import { 
  calculateCombinedGradation2F, 
  calculateBlendResults2F, 
  analyzeTwoFractionFeasibleRange 
} from './src/core/twoFractionEngine.ts';
import { PRESET_PDF_2_FRAKSI } from './src/core/presets.ts';

console.log('====================================================');
console.log('UNIT TEST SUITE: MODE PENCAMPURAN 2 FRAKSI AGREGAT');
console.log('Referensi: materi-pencampuran-agregat.pdf (Hal 1-6)');
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
// TEST 1: RUMUS PEMBOBOTAN DAN KONVERSI DESIMAL
// -----------------------------------------------------------------------------
console.log('--- TEST 1: RUMUS PEMBOBOTAN P = (PA * A) + (PB * B) ---');

// Agregat A: 40% lolos, Agregat B: 100% lolos, Proporsi: 46% A dan 54% B
// A = 0.46, B = 0.54
// Contrib A = 0.46 * 40 = 18.4
// Contrib B = 0.54 * 100 = 54.0
// P_campuran = 18.4 + 54.0 = 72.4 (Sesuai Tabel 3.2 Halaman 6 PDF)
const testSieve34 = calculateCombinedGradation2F(40, 100, 46, 54);
assert(testSieve34.contribA === 18.4, `Kontribusi A saringan 3/4" harus 18.4 (didapat ${testSieve34.contribA})`);
assert(testSieve34.contribB === 54.0, `Kontribusi B saringan 3/4" harus 54.0 (didapat ${testSieve34.contribB})`);
assert(testSieve34.combined === 72.4, `Gradasi campuran saringan 3/4" harus 72.4% (didapat ${testSieve34.combined}%)`);

// Saringan No.4: A = 7%, B = 65%
// Contrib A = 0.46 * 7 = 3.22 -> 3.2
// Contrib B = 0.54 * 65 = 35.1
// P_campuran = 3.2 + 35.1 = 38.3 (Sesuai Tabel 3.2 PDF)
const testSieveNo4 = calculateCombinedGradation2F(7, 65, 46, 54);
assert(testSieveNo4.contribA === 3.2, `Kontribusi A saringan No.4 harus 3.2 (didapat ${testSieveNo4.contribA})`);
assert(testSieveNo4.contribB === 35.1, `Kontribusi B saringan No.4 harus 35.1 (didapat ${testSieveNo4.contribB})`);
assert(testSieveNo4.combined === 38.3, `Gradasi campuran saringan No.4 harus 38.3% (didapat ${testSieveNo4.combined}%)`);

// -----------------------------------------------------------------------------
// TEST 2: ANALISIS INTERVAL KELAYAKAN GRAFIS (FEASIBLE RANGE)
// -----------------------------------------------------------------------------
console.log('\n--- TEST 2: ANALISIS DAERAH ARSIRAN KELAYAKAN BUJUR SANGKAR ---');
const analysis = analyzeTwoFractionFeasibleRange(PRESET_PDF_2_FRAKSI);

assert(analysis.hasFeasibleSolution === true, 'Dataset PDF harus memiliki solusi daerah kelayakan yang valid.');
// Batas kiri daerah arsiran: ditentukan oleh batas atas Saringan No. 4
// Sieve No.4: Spec max = 45. Min %A = (65 - 45)/(65 - 7) * 100 = 20/58 * 100 = 34.48% -> pembulatan 34%
assert(analysis.governingLowerSieve === 'No.4', `Batas kiri harus diatur oleh Saringan No.4 (didapat ${analysis.governingLowerSieve})`);
assert(analysis.minA >= 34 && analysis.minA <= 35, `Batas kiri daerah arsiran harus sekitar 34-35% (didapat ${analysis.minA}%)`);

// Batas kanan daerah arsiran: ditentukan oleh batas bawah Saringan 3/4"
// Sieve 3/4": Spec min = 65. Max %A = (100 - 65)/(100 - 40) * 100 = 35/60 * 100 = 58.33% -> pembulatan 58%
assert(analysis.governingUpperSieve === '¾ inci', `Batas kanan harus diatur oleh Saringan ¾ inci (didapat ${analysis.governingUpperSieve})`);
assert(analysis.maxA >= 58 && analysis.maxA <= 59, `Batas kanan daerah arsiran harus sekitar 58-59% (didapat ${analysis.maxA}%)`);

// Titik tengah proporsi: (34.48 + 58.33)/2 = 46.41% -> pembulatan 46% A dan 54% B (PERSIS seperti Halaman 5 & 6 PDF)
assert(analysis.recommendedA === 46, `Rekomendasi proporsi A dari garis tengah daerah arsiran harus 46% (didapat ${analysis.recommendedA}%)`);
assert(analysis.recommendedB === 54, `Rekomendasi proporsi B harus 54% (didapat ${analysis.recommendedB}%)`);

// -----------------------------------------------------------------------------
// TEST 3: VERIFIKASI KESELURUHAN TABEL 3.2 TERHADAP DATA ASLI PDF
// -----------------------------------------------------------------------------
console.log('\n--- TEST 3: VERIFIKASI 9 BARIS TABEL 3.2 HALAMAN 6 PDF ---');
const results = calculateBlendResults2F(PRESET_PDF_2_FRAKSI, 46, 54);

const expectedPassingFromPDF = [
  { name: '2 ½ inci', expected: 100.0, specMin: 100, specMax: 100 },
  { name: '1 ½ inci', expected: 100.0, specMin: 100, specMax: 100 },
  { name: '¾ inci',   expected: 72.4,  specMin: 65,  specMax: 85 },
  { name: '3/8 inci', expected: 54.7,  specMin: 45,  specMax: 63 },
  { name: 'No.4',     expected: 38.3,  specMin: 27,  specMax: 45 },
  { name: 'No.8',     expected: 21.7,  specMin: 18,  specMax: 40 },
  { name: 'No.16',    expected: 18.5,  specMin: 11,  specMax: 25 },
  { name: 'No.40',    expected: 10.8,  specMin: 6,   specMax: 16 },
  { name: 'No.200',   expected: 3.8,   specMin: 0,   specMax: 10 },
];

results.forEach((row, i) => {
  const exp = expectedPassingFromPDF[i];
  assert(
    Math.abs(row.combinedPassing - exp.expected) <= 0.1,
    `Saringan ${row.sieveName}: Nilai campuran ${row.combinedPassing}% cocok dengan nilai PDF (${exp.expected}%)`
  );
  assert(
    row.isPassingSpec === true,
    `Saringan ${row.sieveName}: Harus berstatus MEMENUHI (didapat isPassingSpec: ${row.isPassingSpec})`
  );
});

// -----------------------------------------------------------------------------
// TEST 4: KASUS INFEASIBLE (KETIKA SPESIFIKASI TIDAK DAPAT DIPENUHI)
// -----------------------------------------------------------------------------
console.log('\n--- TEST 4: PENGUJIAN KASUS TIDAK ADA DAERAH KELAYAKAN (INFEASIBLE) ---');
const conflictingDataset = [
  // Saringan 1 menuntut %A sangat tinggi (min %A = 80%)
  { id: 'c1', sieveName: 'Saringan Konflik 1', sieveSizeMm: 19.0, passingA: 0, passingB: 100, specMin: 0, specMax: 20 },
  // Saringan 2 menuntut %A sangat rendah (max %A = 20%)
  { id: 'c2', sieveName: 'Saringan Konflik 2', sieveSizeMm: 4.75, passingA: 0, passingB: 100, specMin: 80, specMax: 100 },
  { id: 'c3', sieveName: 'Saringan 3', sieveSizeMm: 2.36, passingA: 0, passingB: 50, specMin: 10, specMax: 40 },
];

const confAnalysis = analyzeTwoFractionFeasibleRange(conflictingDataset);
assert(confAnalysis.hasFeasibleSolution === false, 'Dataset dengan spesifikasi bertentangan harus menghasilkan hasFeasibleSolution = false');
assert(confAnalysis.conflictingSieves.length >= 2, `Harus mendeteksi saringan penyebab konflik (ditemukan: ${confAnalysis.conflictingSieves.join(', ')})`);

console.log('\n====================================================');
console.log(`HASIL AKHIR PENGUJIAN: ${passCount} LULUS, ${failCount} GAGAL`);
console.log('====================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
