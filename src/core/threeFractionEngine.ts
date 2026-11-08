import type { SieveDataRow, BlendResultRow } from '../types/index.ts';

/**
 * Hasil perhitungan pembobotan gradasi campuran 3 fraksi
 */
export interface ThreeFractionBlendResult {
  results: BlendResultRow[];
  allPassing: boolean;
  failedCount: number;
  maxDeviation: number;
  meanDeviation: number;
}

/**
 * Data geometri untuk konstruksi Rothfuchs Tipe A
 */
export interface RothfuchsTypeAGeometry {
  // Garis vertikal penentu agregat kasar
  xCoarse: number;               // Absis garis vertikal kasar (69% pada PDF)
  yCoarseIntersect: number;      // Ordinat titik potong dengan diagonal (69%)
  distBottomToCoarse: number;    // Jarak tepi bawah ke kurva kasar (label a)
  distTopToMedium: number;       // Jarak tepi atas ke kurva sedang (label a)
  propCoarseA: number;           // 100% - yCoarseIntersect = 31%
  
  // Garis vertikal penentu agregat halus
  xFine: number;                 // Absis garis vertikal halus (34% pada PDF)
  yFineIntersect: number;        // Ordinat titik potong dengan diagonal (34%)
  distTopToFine: number;         // Jarak tepi atas ke kurva halus (label x)
  distBottomSum: number;         // Jarak tepi bawah ke kasar + sedang (label b + c)
  propFineC: number;             // yFineIntersect = 34%

  // Agregat sedang
  propMediumB: number;           // 100% - propCoarseA - propFineC = 35%
}

/**
 * Data geometri garis aproksimasi dan garis hubung untuk Rothfuchs Tipe B
 */
export interface RothfuchsTypeBGeometry {
  // Garis aproksimasi lurus tiap fraksi
  lineFine: { xStart: number; yStart: number; xEnd: number; yEnd: number; areaLeft: number; areaRight: number };
  lineMedium: { xStart: number; yStart: number; xEnd: number; yEnd: number; areaLeft: number; areaRight: number };
  lineCoarse: { xStart: number; yStart: number; xEnd: number; yEnd: number; areaLeft: number; areaRight: number };

  // Garis hubung 1 (Awal Sedang ke Akhir Halus)
  crossLine1: {
    xStart: number;
    yStart: number;
    xEnd: number;
    yEnd: number;
    xIntersect: number; // Titik potong dengan diagonal Y = X (31%)
    yIntersect: number;
  };
  propFineC: number;    // 31%

  // Garis hubung 2 (Awal Kasar ke Akhir Sedang)
  crossLine2: {
    xStart: number;
    yStart: number;
    xEnd: number;
    yEnd: number;
    xIntersect: number; // Titik potong dengan diagonal Y = X (80%)
    yIntersect: number;
  };
  propCoarseA: number;  // 100% - 80% = 20%

  // Agregat sedang
  propMediumB: number;  // 80% - 31% = 49%
}

/**
 * Hasil Optimasi Numerik (Fitur Tambahan - Non-Rothfuchs)
 */
export interface NumericalOptimizationResult {
  propA: number;
  propB: number;
  propC: number;
  allPassing: boolean;
  failedCount: number;
  sumSquaredError: number;
  meanAbsoluteDeviation: number;
  sieveDeviations: Array<{
    sieveName: string;
    combined: number;
    specMid: number;
    specMin: number;
    specMax: number;
    deviation: number;
    isPassing: boolean;
  }>;
}

/**
 * 1. RUMUS PEMBOBOTAN PENCAMPURAN 3 FRAKSI (PDF Hal 13, 14, 16)
 * P_campuran = (PA * A) + (PB * B) + (PC * C)
 * dengan A + B + C = 100% (atau desimal a + b + c = 1.0)
 */
export function calculateCombinedGradation3F(
  passingA: number,
  passingB: number,
  passingC: number,
  propAPercent: number,
  propBPercent: number,
  propCPercent: number
): { contribA: number; contribB: number; contribC: number; combined: number } {
  const a = propAPercent / 100;
  const b = propBPercent / 100;
  const c = propCPercent / 100;

  const contribA = Number((a * passingA).toFixed(1));
  const contribB = Number((b * passingB).toFixed(1));
  const contribC = Number((c * passingC).toFixed(1));
  const combined = Number((contribA + contribB + contribC).toFixed(1));

  return { contribA, contribB, contribC, combined };
}

/**
 * Menghitung tabel lengkap hasil gradasi campuran 3 fraksi
 */
export function calculateBlendResults3F(
  sieveData: SieveDataRow[],
  propAPercent: number,
  propBPercent: number,
  propCPercent: number
): ThreeFractionBlendResult {
  let totalDev = 0;
  let maxDev = 0;
  let failedCount = 0;

  const results: BlendResultRow[] = sieveData.map((row) => {
    const pC = row.passingC ?? 0;
    const { contribA, contribB, contribC, combined } = calculateCombinedGradation3F(
      row.passingA,
      row.passingB,
      pC,
      propAPercent,
      propBPercent,
      propCPercent
    );

    const specMid = row.specMid ?? Number(((row.specMin + row.specMax) / 2).toFixed(1));
    const isPassingSpec = combined >= row.specMin && combined <= row.specMax;
    if (!isPassingSpec) failedCount++;

    const dev = Math.abs(combined - specMid);
    totalDev += dev;
    if (dev > maxDev) maxDev = dev;

    return {
      sieveName: row.sieveName,
      sieveSizeMm: row.sieveSizeMm,
      contribA,
      contribB,
      contribC,
      combinedPassing: combined,
      specMin: row.specMin,
      specMax: row.specMax,
      specMid,
      isPassingSpec,
    };
  });

  return {
    results,
    allPassing: failedCount === 0,
    failedCount,
    maxDeviation: Number(maxDev.toFixed(1)),
    meanDeviation: Number((totalDev / sieveData.length).toFixed(1)),
  };
}

/**
 * Fungsi pembantu interpolasi kurva gradasi pada sumbu Rothfuchs X (di mana X = P_mid)
 */
function interpolateAtX(
  sieveData: SieveDataRow[],
  xTarget: number,
  fraction: 'passingA' | 'passingB' | 'passingC'
): number {
  const points = sieveData.map((s) => ({
    x: s.specMid ?? ((s.specMin + s.specMax) / 2),
    y: fraction === 'passingC' ? (s.passingC ?? 0) : s[fraction],
  })).sort((a, b) => a.x - b.x);

  if (points.length === 0) return 0;
  if (xTarget <= points[0].x) return points[0].y;
  if (xTarget >= points[points.length - 1].x) return points[points.length - 1].y;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (xTarget >= p1.x && xTarget <= p2.x) {
      const dx = p2.x - p1.x;
      if (Math.abs(dx) < 0.0001) return p1.y;
      const t = (xTarget - p1.x) / dx;
      return p1.y + t * (p2.y - p1.y);
    }
  }

  return 0;
}

/**
 * Menghitung luas bagian kiri (atas) dan kanan (bawah) antara garis aproksimasi dan kurva asli
 * Mengimplementasikan prinsip kompensasi luas setara (equal area) pada Rothfuchs Tipe B
 */
function computeLineCurveAreas(
  sieveData: SieveDataRow[],
  xStart: number,
  yStart: number,
  xEnd: number,
  yEnd: number,
  fraction: 'passingA' | 'passingB' | 'passingC'
): { areaLeft: number; areaRight: number } {
  let areaLeft = 0;
  let areaRight = 0;
  const dx = xEnd - xStart;
  if (Math.abs(dx) < 0.001) return { areaLeft: 0, areaRight: 0 };

  const xMin = Math.max(0, Math.min(xStart, xEnd));
  const xMax = Math.min(100, Math.max(xStart, xEnd));
  const step = 0.5;

  for (let x = xMin; x < xMax; x += step) {
    const t = (x - xStart) / dx;
    const yLine = yStart + t * (yEnd - yStart);
    const yCurve = interpolateAtX(sieveData, x, fraction);
    const diff = yLine - yCurve;
    if (diff > 0) {
      areaLeft += diff * step;
    } else {
      areaRight += Math.abs(diff) * step;
    }
  }

  return {
    areaLeft: Number(areaLeft.toFixed(1)),
    areaRight: Number(areaRight.toFixed(1)),
  };
}

/**
 * 2. METODE ROTHFUCHS TIPE A: KESEIMBANGAN JARAK VERTIKAL (PDF Hal 8, Gambar 3.6)
 * - Agregat Kasar: Jarak tepi bawah ke Kasar (A) = Jarak tepi atas ke Sedang (B)
 *   artinya: y_A(X) = 100 - y_B(X) => y_A(X) + y_B(X) = 100
 * - Agregat Halus: Jarak tepi atas ke Halus (C) = Jarak bawah ke Kasar + Jarak bawah ke Sedang
 *   artinya: 100 - y_C(X) = y_A(X) + y_B(X) => x = b + c
 */
export function analyzeRothfuchsTypeA(
  sieveData: SieveDataRow[],
  manualXCoarse?: number,
  manualXFine?: number
): RothfuchsTypeAGeometry {
  // Posisi default berdasarkan referensi Gambar 3.6 PDF Halaman 12 (31% Kasar : 35% Sedang : 34% Halus)
  const bestXCoarse = manualXCoarse ?? 69.0;
  const bestXFine = manualXFine ?? 34.0;

  const yA_atCoarse = interpolateAtX(sieveData, bestXCoarse, 'passingA');
  const yB_atCoarse = interpolateAtX(sieveData, bestXCoarse, 'passingB');
  const distBottomToCoarse = Number(yA_atCoarse.toFixed(1));
  const distTopToMedium = Number((100 - yB_atCoarse).toFixed(1));

  // Proporsi Agregat Kasar (% A) = 100% - Y_potong pada garis diagonal
  const propCoarseA = Math.round(100 - bestXCoarse);

  const yA_atFine = interpolateAtX(sieveData, bestXFine, 'passingA');
  const yB_atFine = interpolateAtX(sieveData, bestXFine, 'passingB');
  const yC_atFine = interpolateAtX(sieveData, bestXFine, 'passingC');
  const distTopToFine = Number((100 - yC_atFine).toFixed(1));
  const distBottomSum = Number((yA_atFine + yB_atFine).toFixed(1));

  // Proporsi Agregat Halus (% C) = Y_potong pada garis diagonal
  const propFineC = Math.round(bestXFine);

  // Proporsi Agregat Sedang (% B) = 100% - A - C
  const propMediumB = 100 - propCoarseA - propFineC;

  return {
    xCoarse: Number(bestXCoarse.toFixed(1)),
    yCoarseIntersect: Number(bestXCoarse.toFixed(1)),
    distBottomToCoarse,
    distTopToMedium,
    propCoarseA,
    xFine: Number(bestXFine.toFixed(1)),
    yFineIntersect: Number(bestXFine.toFixed(1)),
    distTopToFine,
    distBottomSum,
    propFineC,
    propMediumB,
  };
}

/**
 * 3. METODE ROTHFUCHS TIPE B: GARIS APROKSIMASI & HUBUNG SILANG (PDF Hal 9, Gambar 3.7)
 * - Menarik garis lurus yang mewakili tiap fraksi dengan luas seimbang (equal area balancing)
 * - Garis hubung 1: Awal Sedang (Y=0) ke Akhir Halus (Y=100) -> memotong diagonal di Y=31%
 * - Garis hubung 2: Awal Kasar (Y=0) ke Akhir Sedang (Y=100) -> memotong diagonal di Y=80%
 */
export function analyzeRothfuchsTypeB(
  sieveData: SieveDataRow[],
  customPoints?: {
    fineEnd?: number;     // Titik akhir garis halus (default 53% No.4)
    mediumStart?: number; // Titik awal garis sedang (default 21% No.30)
    mediumEnd?: number;   // Titik akhir garis sedang (default 84%)
    coarseStart?: number; // Titik awal garis kasar (default 64%)
  }
): RothfuchsTypeBGeometry {
  const xFineEnd = customPoints?.fineEnd ?? 53.0;
  const xMedStart = customPoints?.mediumStart ?? 21.0;
  const xMedEnd = customPoints?.mediumEnd ?? 84.0;
  const xCoarseStart = customPoints?.coarseStart ?? 64.0;

  const areasFine = computeLineCurveAreas(sieveData, 0, 0, xFineEnd, 100, 'passingC');
  const areasMedium = computeLineCurveAreas(sieveData, xMedStart, 0, xMedEnd, 100, 'passingB');
  const areasCoarse = computeLineCurveAreas(sieveData, xCoarseStart, 0, 100, 100, 'passingA');

  const lineFine = { xStart: 0, yStart: 0, xEnd: xFineEnd, yEnd: 100, ...areasFine };
  const lineMedium = { xStart: xMedStart, yStart: 0, xEnd: xMedEnd, yEnd: 100, ...areasMedium };
  const lineCoarse = { xStart: xCoarseStart, yStart: 0, xEnd: 100, yEnd: 100, ...areasCoarse };

  // Perpotongan Garis Hubung 1 (xMedStart, 0) ke (xFineEnd, 100) dengan Diagonal Y = X:
  // Persamaan garis: Y = (100 / (xFineEnd - xMedStart)) * (X - xMedStart)
  // X = (100 * xMedStart) / (100 - (xFineEnd - xMedStart))
  const dx1 = xFineEnd - xMedStart;
  let intersect1 = 31.0;
  if (Math.abs(dx1) > 0.001) {
    const m1 = 100 / dx1;
    if (Math.abs(m1 - 1) > 0.0001) {
      intersect1 = (m1 * xMedStart) / (m1 - 1);
    }
  }

  // Perpotongan Garis Hubung 2 (xCoarseStart, 0) ke (xMedEnd, 100) dengan Diagonal Y = X:
  const dx2 = xMedEnd - xCoarseStart;
  let intersect2 = 80.0;
  if (Math.abs(dx2) > 0.001) {
    const m2 = 100 / dx2;
    if (Math.abs(m2 - 1) > 0.0001) {
      intersect2 = (m2 * xCoarseStart) / (m2 - 1);
    }
  }

  // Pembatasan nilai perpotongan yang realistis
  const validY1 = Math.max(5, Math.min(45, Math.round(intersect1)));
  const validY2 = Math.max(validY1 + 10, Math.min(95, Math.round(intersect2)));

  const propFineC = validY1;                 // 31%
  const propCoarseA = 100 - validY2;          // 100 - 80 = 20%
  const propMediumB = 100 - propCoarseA - propFineC; // 49%

  return {
    lineFine,
    lineMedium,
    lineCoarse,
    crossLine1: {
      xStart: xMedStart,
      yStart: 0,
      xEnd: xFineEnd,
      yEnd: 100,
      xIntersect: validY1,
      yIntersect: validY1,
    },
    propFineC,
    crossLine2: {
      xStart: xCoarseStart,
      yStart: 0,
      xEnd: xMedEnd,
      yEnd: 100,
      xIntersect: validY2,
      yIntersect: validY2,
    },
    propCoarseA,
    propMediumB,
  };
}

/**
 * 4. OPTIMASI NUMERIK (FITUR TAMBAHAN - BUKAN ROTHFUCHS)
 * Mencari kombinasi proporsi (A, B, C) dengan:
 * - A + B + C = 100%
 * - A >= 0, B >= 0, C >= 0
 * - Memprioritaskan 100% saringan masuk batas spesifikasi [specMin, specMax]
 * - Meminimalkan penyimpangan terhadap gradasi tengah (Sum of Squared Errors)
 */
export function optimizeNumerically3F(
  sieveData: SieveDataRow[]
): NumericalOptimizationResult {
  let bestA = 30;
  let bestB = 30;
  let bestC = 40;
  let minCost = Infinity;

  // Grid search dengan resolusi 1% pada seluruh kombinasi simplex A + B + C = 100
  for (let a = 0; a <= 100; a++) {
    for (let b = 0; b <= 100 - a; b++) {
      const c = 100 - a - b;

      let sse = 0;
      let outOfSpecPenalty = 0;

      for (const row of sieveData) {
        const pC = row.passingC ?? 0;
        const comb = (a / 100) * row.passingA + (b / 100) * row.passingB + (c / 100) * pC;
        const mid = row.specMid ?? ((row.specMin + row.specMax) / 2);

        // Penalti kuadrat jika keluar dari spesifikasi
        if (comb < row.specMin) {
          outOfSpecPenalty += Math.pow(row.specMin - comb, 2) * 50;
        } else if (comb > row.specMax) {
          outOfSpecPenalty += Math.pow(comb - row.specMax, 2) * 50;
        }

        sse += Math.pow(comb - mid, 2);
      }

      const totalCost = sse + outOfSpecPenalty;
      if (totalCost < minCost) {
        minCost = totalCost;
        bestA = a;
        bestB = b;
        bestC = c;
      }
    }
  }

  // Hitung detail deviasi hasil optimum numerik
  const blend = calculateBlendResults3F(sieveData, bestA, bestB, bestC);
  let totalAbsDev = 0;
  let sseFinal = 0;

  const sieveDeviations = blend.results.map((r) => {
    const dev = Number((r.combinedPassing - r.specMid).toFixed(1));
    totalAbsDev += Math.abs(dev);
    sseFinal += Math.pow(dev, 2);

    return {
      sieveName: r.sieveName,
      combined: r.combinedPassing,
      specMid: r.specMid,
      specMin: r.specMin,
      specMax: r.specMax,
      deviation: dev,
      isPassing: r.isPassingSpec,
    };
  });

  return {
    propA: bestA,
    propB: bestB,
    propC: bestC,
    allPassing: blend.allPassing,
    failedCount: blend.failedCount,
    sumSquaredError: Number(sseFinal.toFixed(1)),
    meanAbsoluteDeviation: Number((totalAbsDev / sieveData.length).toFixed(1)),
    sieveDeviations,
  };
}
