import type { SieveDataRow, StandardSieve } from '../types/index.ts';

/**
 * Data Contoh Resmi PDF: Kasus 1 - Pencampuran 2 Fraksi Agregat
 * Sumber: materi-pencampuran-agregat.pdf (Tabel 3.1 Halaman 3 & Tabel Halaman 4)
 * Hasil Validasi PDF: 46% Fraksi A (Kasar) & 54% Fraksi B (Halus)
 */
export const PRESET_PDF_2_FRAKSI: SieveDataRow[] = [
  { id: '1', sieveName: '2 ½ inci', sieveSizeMm: 63.0, specMin: 100, specMax: 100, specMid: 100, passingA: 100, passingB: 100 },
  { id: '2', sieveName: '1 ½ inci', sieveSizeMm: 37.5, specMin: 100, specMax: 100, specMid: 100, passingA: 100, passingB: 100 },
  { id: '3', sieveName: '¾ inci',   sieveSizeMm: 19.0, specMin: 65,  specMax: 85,  specMid: 75,  passingA: 40,  passingB: 100 },
  { id: '4', sieveName: '3/8 inci', sieveSizeMm: 9.5,  specMin: 45,  specMax: 63,  specMid: 54,  passingA: 25,  passingB: 80 },
  { id: '5', sieveName: 'No.4',     sieveSizeMm: 4.75, specMin: 27,  specMax: 45,  specMid: 36,  passingA: 7,   passingB: 65 },
  { id: '6', sieveName: 'No.8',     sieveSizeMm: 2.36, specMin: 18,  specMax: 40,  specMid: 29,  passingA: 6,   passingB: 35 },
  { id: '7', sieveName: 'No.16',    sieveSizeMm: 1.18, specMin: 11,  specMax: 25,  specMid: 18,  passingA: 5,   passingB: 30 },
  { id: '8', sieveName: 'No.40',    sieveSizeMm: 0.425,specMin: 6,   specMax: 16,  specMid: 11,  passingA: 0,   passingB: 20 },
  { id: '9', sieveName: 'No.200',   sieveSizeMm: 0.075,specMin: 0,   specMax: 10,  specMid: 5,   passingA: 0,   passingB: 7 },
];

/**
 * Data Contoh Resmi PDF: Kasus 2 - Pencampuran 3 Fraksi Agregat
 * Sumber: materi-pencampuran-agregat.pdf (Tabel 3.8 Halaman 10)
 * Hasil Validasi PDF:
 * - Rothfuchs Tipe A Grafis Murni: 31% A, 35% B, 34% C (Tabel 3.9)
 * - Rothfuchs Tipe A Penyesuaian: 30% A, 30% B, 40% C (Tabel 3.10)
 * - Rothfuchs Tipe B: 20% A, 49% B, 31% C (Tabel 3.11)
 */
export const PRESET_PDF_3_FRAKSI: SieveDataRow[] = [
  { id: '1', sieveName: '¾ inci',   sieveSizeMm: 63.0, specMin: 100, specMax: 100, specMid: 100.0, passingA: 100.0, passingB: 100.0, passingC: 100.0 },
  { id: '2', sieveName: '½ inci',   sieveSizeMm: 37.5, specMin: 75,  specMax: 100, specMid: 87.5,  passingA: 57.4,  passingB: 100.0, passingC: 100.0 },
  { id: '3', sieveName: '3/8 inci', sieveSizeMm: 19.0, specMin: 60,  specMax: 85,  specMid: 72.5,  passingA: 14.7,  passingB: 98.8,  passingC: 100.0 },
  { id: '4', sieveName: 'No.4',     sieveSizeMm: 9.5,  specMin: 38,  specMax: 65,  specMid: 52.5,  passingA: 4.2,   passingB: 28.2,  passingC: 97.2 },
  { id: '5', sieveName: 'No.8',     sieveSizeMm: 4.75, specMin: 27,  specMax: 40,  specMid: 33.5,  passingA: 2.7,   passingB: 14.6,  passingC: 79.2 },
  { id: '6', sieveName: 'No 30',    sieveSizeMm: 2.36, specMin: 14,  specMax: 24,  specMid: 19.0,  passingA: 1.6,   passingB: 8.0,   passingC: 38.3 },
  { id: '7', sieveName: 'No 50',    sieveSizeMm: 1.18, specMin: 9,   specMax: 18,  specMid: 13.5,  passingA: 1.2,   passingB: 5.8,   passingC: 20.0 },
  { id: '8', sieveName: 'No 100',   sieveSizeMm: 0.425,specMin: 5,   specMax: 12,  specMid: 8.5,   passingA: 0.8,   passingB: 4.0,   passingC: 9.9 },
  { id: '9', sieveName: 'No.200',   sieveSizeMm: 0.075,specMin: 2,   specMax: 8,   specMid: 5.0,   passingA: 0.5,   passingB: 2.8,   passingC: 6.0 },
];

/**
 * Tabel Referensi Saringan Standar ASTM E11 & Bina Marga
 */
export const STANDARD_SIEVES_LIST: StandardSieve[] = [
  { id: 's1', standardName: 'ASTM E11', sieveNumber: '2 ½ inci (2.5 in)', sizeMm: 63.0, category: 'Kasar (Coarse)' },
  { id: 's2', standardName: 'ASTM E11', sieveNumber: '2 inci (2 in)', sizeMm: 50.0, category: 'Kasar (Coarse)' },
  { id: 's3', standardName: 'ASTM E11', sieveNumber: '1 ½ inci (1.5 in)', sizeMm: 37.5, category: 'Kasar (Coarse)' },
  { id: 's4', standardName: 'ASTM E11', sieveNumber: '1 inci (1 in)', sizeMm: 25.0, category: 'Kasar (Coarse)' },
  { id: 's5', standardName: 'ASTM E11', sieveNumber: '¾ inci (3/4 in)', sizeMm: 19.0, category: 'Kasar (Coarse)' },
  { id: 's6', standardName: 'ASTM E11', sieveNumber: '½ inci (1/2 in)', sizeMm: 12.5, category: 'Sedang (Medium)' },
  { id: 's7', standardName: 'ASTM E11', sieveNumber: '3/8 inci (3/8 in)', sizeMm: 9.5, category: 'Sedang (Medium)' },
  { id: 's8', standardName: 'ASTM E11', sieveNumber: 'No. 4', sizeMm: 4.75, category: 'Sedang (Medium)' },
  { id: 's9', standardName: 'ASTM E11', sieveNumber: 'No. 8', sizeMm: 2.36, category: 'Halus (Fine)' },
  { id: 's10', standardName: 'ASTM E11', sieveNumber: 'No. 16', sizeMm: 1.18, category: 'Halus (Fine)' },
  { id: 's11', standardName: 'ASTM E11', sieveNumber: 'No. 30', sizeMm: 0.60, category: 'Halus (Fine)' },
  { id: 's12', standardName: 'ASTM E11', sieveNumber: 'No. 50', sizeMm: 0.30, category: 'Halus (Fine)' },
  { id: 's13', standardName: 'ASTM E11', sieveNumber: 'No. 100', sizeMm: 0.15, category: 'Halus (Fine)' },
  { id: 's14', standardName: 'ASTM E11', sieveNumber: 'No. 200', sizeMm: 0.075, category: 'Halus (Fine)' },
];
