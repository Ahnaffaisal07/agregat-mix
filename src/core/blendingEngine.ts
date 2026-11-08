import { SieveDataRow, BlendResultRow } from '../types/index';

/**
 * Menghitung gradasi campuran 2 fraksi (Agregat A dan B)
 * Rumus: P_campuran = (a * P_A) + (b * P_B)
 */
export function calculateBlend2Fractions(
  sieveData: SieveDataRow[],
  propAPercent: number,
  propBPercent: number
): BlendResultRow[] {
  const a = propAPercent / 100;
  const b = propBPercent / 100;

  return sieveData.map((row) => {
    const contribA = Number((a * row.passingA).toFixed(1));
    const contribB = Number((b * row.passingB).toFixed(1));
    const combinedPassing = Number((contribA + contribB).toFixed(1));
    const specMid = row.specMid ?? Number(((row.specMin + row.specMax) / 2).toFixed(1));

    const isPassingSpec = combinedPassing >= row.specMin && combinedPassing <= row.specMax;

    return {
      sieveName: row.sieveName,
      sieveSizeMm: row.sieveSizeMm,
      contribA,
      contribB,
      combinedPassing,
      specMin: row.specMin,
      specMax: row.specMax,
      specMid,
      isPassingSpec,
    };
  });
}

/**
 * Menghitung gradasi campuran 3 fraksi (Agregat A, B, dan C)
 * Rumus: P_campuran = (a * P_A) + (b * P_B) + (c * P_C)
 */
export function calculateBlend3Fractions(
  sieveData: SieveDataRow[],
  propAPercent: number,
  propBPercent: number,
  propCPercent: number
): BlendResultRow[] {
  const a = propAPercent / 100;
  const b = propBPercent / 100;
  const c = propCPercent / 100;

  return sieveData.map((row) => {
    const pC = row.passingC ?? 0;
    const contribA = Number((a * row.passingA).toFixed(1));
    const contribB = Number((b * row.passingB).toFixed(1));
    const contribC = Number((c * pC).toFixed(1));
    const combinedPassing = Number((contribA + contribB + contribC).toFixed(1));
    const specMid = row.specMid ?? Number(((row.specMin + row.specMax) / 2).toFixed(1));

    const isPassingSpec = combinedPassing >= row.specMin && combinedPassing <= row.specMax;

    return {
      sieveName: row.sieveName,
      sieveSizeMm: row.sieveSizeMm,
      contribA,
      contribB,
      contribC,
      combinedPassing,
      specMin: row.specMin,
      specMax: row.specMax,
      specMid,
      isPassingSpec,
    };
  });
}

/**
 * Analisis Geometris Feasible Range untuk Metode Bujur Sangkar 10x10 (2 Fraksi)
 * Sesuai Butir 5, 6, dan 7 pada materi PDF (Halaman 2 dan 5)
 */
export function calculateTwoFractionFeasibleRange(sieveData: SieveDataRow[]) {
  let globalMinA = 0;
  let globalMaxA = 100;

  const sieveLimits: Array<{
    sieveName: string;
    lowerBoundA: number | null; // Batas minimum %A agar tidak melebihi batas atas spesifikasi
    upperBoundA: number | null; // Batas maksimum %A agar tidak kurang dari batas bawah spesifikasi
  }> = [];

  for (const row of sieveData) {
    const diff = row.passingB - row.passingA;
    if (Math.abs(diff) > 0.001) {
      // y = passingB - a * (passingB - passingA)
      // Agar y <= specMax => a >= (passingB - specMax) / diff (bila diff > 0)
      // Agar y >= specMin => a <= (passingB - specMin) / diff (bila diff > 0)
      if (diff > 0) {
        const boundForMax = ((row.passingB - row.specMax) / diff) * 100;
        const boundForMin = ((row.passingB - row.specMin) / diff) * 100;

        const effectiveLowerA = Math.max(0, boundForMax);
        const effectiveUpperA = Math.min(100, boundForMin);

        sieveLimits.push({
          sieveName: row.sieveName,
          lowerBoundA: Number(effectiveLowerA.toFixed(1)),
          upperBoundA: Number(effectiveUpperA.toFixed(1)),
        });

        if (effectiveLowerA > globalMinA) globalMinA = effectiveLowerA;
        if (effectiveUpperA < globalMaxA) globalMaxA = effectiveUpperA;
      }
    }
  }

  const roundedMinA = Math.round(globalMinA);
  const roundedMaxA = Math.round(globalMaxA);
  const recommendedA = Math.round((globalMinA + globalMaxA) / 2);
  const recommendedB = 100 - recommendedA;

  return {
    minA: roundedMinA,
    maxA: roundedMaxA,
    recommendedA,
    recommendedB,
    sieveLimits,
    hasFeasibleSolution: globalMinA <= globalMaxA,
  };
}
