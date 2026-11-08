import type { SieveDataRow, BlendResultRow } from '../types/index.ts';

/**
 * Batas kelayakan proporsi untuk satu ukuran saringan
 */
export interface SieveFeasibleBound {
  sieveName: string;
  sieveSizeMm: number;
  passingA: number;
  passingB: number;
  specMin: number;
  specMax: number;
  diff: number;                      // P_B - P_A
  aMinPercent: number;              // Batas minimum %A agar campuran <= specMax
  aMaxPercent: number;              // Batas maksimum %A agar campuran >= specMin
  isGoverningLower: boolean;        // Apakah saringan ini menjadi batas paling kiri (paling membatasi bawah)
  isGoverningUpper: boolean;        // Apakah saringan ini menjadi batas paling kanan (paling membatasi atas)
  markLowerSpec: { xPercent: number; yPercent: number } | null; // Koordinat tanda 'x' batas bawah spek
  markUpperSpec: { xPercent: number; yPercent: number } | null; // Koordinat tanda 'x' batas atas spek
}

/**
 * Hasil analisis lengkap metode 2 Fraksi Bujur Sangkar 10x10
 */
export interface TwoFractionAnalysisResult {
  hasFeasibleSolution: boolean;
  minA: number;                      // Batas kiri daerah arsiran (% A)
  maxA: number;                      // Batas kanan daerah arsiran (% A)
  recommendedA: number;              // Garis tengah daerah proporsi (% A)
  recommendedB: number;              // Garis tengah daerah proporsi (% B)
  sieveBounds: SieveFeasibleBound[];
  governingLowerSieve: string | null;// Nama saringan yang membatasi sisi kiri
  governingUpperSieve: string | null;// Nama saringan yang membatasi sisi kanan
  conflictingSieves: string[];       // Daftar saringan yang menyebabkan tidak adanya daerah layak
  methodExplanation: string;
}

/**
 * RUMUS PEMBOBOTAN PENCAMPURAN 2 FRAKSI (PDF Hal 6)
 * P_campuran = (PA * A) + (PB * B)
 * di mana A dan B adalah desimal (A = %A / 100, B = %B / 100) dan A + B = 1.0 (100%)
 */
export function calculateCombinedGradation2F(
  passingA: number,
  passingB: number,
  propAPercent: number,
  propBPercent: number
): { contribA: number; contribB: number; combined: number } {
  // Konversi proporsi persentase ke faktor desimal
  const a = propAPercent / 100;
  const b = propBPercent / 100;

  const contribA = Number((a * passingA).toFixed(1));
  const contribB = Number((b * passingB).toFixed(1));
  const combined = Number((contribA + contribB).toFixed(1));

  return { contribA, contribB, combined };
}

/**
 * Menghitung seluruh tabel gradasi campuran untuk mode 2 fraksi
 */
export function calculateBlendResults2F(
  sieveData: SieveDataRow[],
  propAPercent: number,
  propBPercent: number
): BlendResultRow[] {
  return sieveData.map((row) => {
    const { contribA, contribB, combined } = calculateCombinedGradation2F(
      row.passingA,
      row.passingB,
      propAPercent,
      propBPercent
    );

    const specMid = row.specMid ?? Number(((row.specMin + row.specMax) / 2).toFixed(1));
    const isPassingSpec = combined >= row.specMin && combined <= row.specMax;

    return {
      sieveName: row.sieveName,
      sieveSizeMm: row.sieveSizeMm,
      contribA,
      contribB,
      combinedPassing: combined,
      specMin: row.specMin,
      specMax: row.specMax,
      specMid,
      isPassingSpec,
    };
  });
}

/**
 * ANALISIS GEOMETRIS & NUMERIK BATAS KELAYAKAN CAMPURAN 2 FRAKSI
 * Sesuai Tahapan Grafis PDF Halaman 1-5:
 * 1. Menggambar bujur sangkar 10 cm x 10 cm.
 * 2. Persen lolos A di sebelah kanan, persen lolos B di sebelah kiri.
 * 3. Menghubungkan titik persen lolos untuk saringan yang sama.
 * 4. Menentukan tanda 'x' batas spesifikasi pada garis saringan.
 * 5. Menentukan garis batas vertikal paling tengah (paling membatasi).
 * 6. Menentukan garis tengah daerah arsiran sebagai nilai proporsi.
 */
export function analyzeTwoFractionFeasibleRange(
  sieveData: SieveDataRow[]
): TwoFractionAnalysisResult {
  let globalMinA = 0;
  let globalMaxA = 100;
  let governingLowerSieve: string | null = null;
  let governingUpperSieve: string | null = null;

  const rawBounds: Array<Omit<SieveFeasibleBound, 'isGoverningLower' | 'isGoverningUpper'>> = [];

  for (const row of sieveData) {
    const diff = row.passingB - row.passingA;
    let aMinForThisSieve = 0;
    let aMaxForThisSieve = 100;
    let markLower: { xPercent: number; yPercent: number } | null = null;
    let markUpper: { xPercent: number; yPercent: number } | null = null;

    if (Math.abs(diff) > 0.0001) {
      if (diff > 0) {
        // Agregat B (halus) > Agregat A (kasar) -> Kasus umum
        // y(a) = passingB - a * diff
        // y(a) <= specMax => a >= (passingB - specMax) / diff
        const boundMin = ((row.passingB - row.specMax) / diff) * 100;
        // y(a) >= specMin => a <= (passingB - specMin) / diff
        const boundMax = ((row.passingB - row.specMin) / diff) * 100;

        aMinForThisSieve = Math.max(0, boundMin);
        aMaxForThisSieve = Math.min(100, boundMax);

        // Hitung koordinat tanda 'x' pada garis bujur sangkar
        const aMinFrac = (row.passingB - row.specMax) / diff;
        if (aMinFrac >= 0 && aMinFrac <= 1) {
          markUpper = {
            xPercent: aMinFrac * 100,
            yPercent: row.specMax,
          };
        }

        const aMaxFrac = (row.passingB - row.specMin) / diff;
        if (aMaxFrac >= 0 && aMaxFrac <= 1) {
          markLower = {
            xPercent: aMaxFrac * 100,
            yPercent: row.specMin,
          };
        }
      } else {
        // diff < 0 (Agregat A > Agregat B)
        const boundMin = ((row.specMin - row.passingB) / Math.abs(diff)) * 100;
        const boundMax = ((row.specMax - row.passingB) / Math.abs(diff)) * 100;

        aMinForThisSieve = Math.max(0, boundMin);
        aMaxForThisSieve = Math.min(100, boundMax);
      }
    } else {
      // diff == 0 (passingA == passingB)
      // Jika lolos tidak masuk spec, tidak ada proporsi yang bisa memenuhi
      if (row.passingA < row.specMin || row.passingA > row.specMax) {
        aMinForThisSieve = 100;
        aMaxForThisSieve = 0;
      }
    }

    if (aMinForThisSieve > globalMinA) {
      globalMinA = aMinForThisSieve;
      governingLowerSieve = row.sieveName;
    }
    if (aMaxForThisSieve < globalMaxA) {
      globalMaxA = aMaxForThisSieve;
      governingUpperSieve = row.sieveName;
    }

    rawBounds.push({
      sieveName: row.sieveName,
      sieveSizeMm: row.sieveSizeMm,
      passingA: row.passingA,
      passingB: row.passingB,
      specMin: row.specMin,
      specMax: row.specMax,
      diff,
      aMinPercent: Number(aMinForThisSieve.toFixed(2)),
      aMaxPercent: Number(aMaxForThisSieve.toFixed(2)),
      markLowerSpec: markLower,
      markUpperSpec: markUpper,
    });
  }

  const hasFeasibleSolution = globalMinA <= globalMaxA;
  const roundedMinA = Math.round(globalMinA);
  const roundedMaxA = Math.round(globalMaxA);
  
  // Titik tengah daerah kelayakan (Midpoint)
  const recommendedA = hasFeasibleSolution ? Math.round((globalMinA + globalMaxA) / 2) : 50;
  const recommendedB = 100 - recommendedA;

  // Berikan label saringan yang menjadi batas penentu
  const sieveBounds: SieveFeasibleBound[] = rawBounds.map((b) => ({
    ...b,
    isGoverningLower: b.sieveName === governingLowerSieve,
    isGoverningUpper: b.sieveName === governingUpperSieve,
  }));

  // Identifikasi saringan yang bertentangan jika tidak ada daerah kelayakan
  const conflictingSieves: string[] = [];
  if (!hasFeasibleSolution) {
    if (governingLowerSieve) conflictingSieves.push(governingLowerSieve);
    if (governingUpperSieve && governingUpperSieve !== governingLowerSieve) {
      conflictingSieves.push(governingUpperSieve);
    }
  }

  const methodExplanation = hasFeasibleSolution
    ? `Berdasarkan konstruksi grafis bujur sangkar 10x10, daerah kelayakan dibatasi oleh garis vertikal sisi kiri (${roundedMinA}% A oleh saringan ${governingLowerSieve ?? '-'}) dan garis vertikal sisi kanan (${roundedMaxA}% A oleh saringan ${governingUpperSieve ?? '-'}). Garis tengah daerah proporsi menghasilkan rekomendasi campuran ${recommendedA}% Agregat Kasar (A) dan ${recommendedB}% Agregat Halus (B).`
    : `Tidak ditemukan daerah proporsi yang dapat memenuhi 100% spesifikasi seluruh ukuran saringan secara bersamaan. Batas bawah terkecil yang dibutuhkan (${roundedMinA}% A oleh saringan ${governingLowerSieve}) lebih besar daripada batas atas yang diizinkan (${roundedMaxA}% A oleh saringan ${governingUpperSieve}).`;

  return {
    hasFeasibleSolution,
    minA: roundedMinA,
    maxA: roundedMaxA,
    recommendedA,
    recommendedB,
    sieveBounds,
    governingLowerSieve,
    governingUpperSieve,
    conflictingSieves,
    methodExplanation,
  };
}
