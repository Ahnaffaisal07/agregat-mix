export type NavigationMenu = 
  | 'dashboard'
  | 'fraksi2'
  | 'fraksi3'
  | 'saringan'
  | 'history'
  | 'laporan'
  | 'about';

export interface SieveDataRow {
  id: string;
  sieveName: string;      // Nomor Saringan (Sieve Number), misal: "3/4 inci", "No.4"
  sieveSizeMm: number;    // Ukuran Saringan (Sieve Size in mm), misal: 19.0, 4.75
  specMin: number;        // Batas Bawah Spesifikasi (Lower Specification Limit)
  specMax: number;        // Batas Atas Spesifikasi (Upper Specification Limit)
  specMid?: number;       // Gradasi Tengah (Midpoint Specification)
  passingA: number;       // Persen Lolos Fraksi A (Percent Passing Fraction A - Kasar)
  passingB: number;       // Persen Lolos Fraksi B (Percent Passing Fraction B - Halus / Sedang)
  passingC?: number;      // Persen Lolos Fraksi C (Percent Passing Fraction C - Halus pada 3 fraksi)
}

export interface BlendResultRow {
  sieveName: string;
  sieveSizeMm: number;
  contribA: number;       // Kontribusi Fraksi A
  contribB: number;       // Kontribusi Fraksi B
  contribC?: number;      // Kontribusi Fraksi C
  combinedPassing: number;// Gradasi Campuran (Combined Gradation)
  specMin: number;
  specMax: number;
  specMid: number;
  isPassingSpec: boolean; // Status Memenuhi Spesifikasi
}

export type BlendMethodType = 
  | 'bujur_sangkar_2f'    // Metode Grafis Bujur Sangkar 10x10 (2 Fraksi)
  | 'rothfuchs_tipe_a'    // Metode Rothfuchs Tipe A (Keseimbangan Jarak Vertikal)
  | 'rothfuchs_tipe_b'    // Metode Rothfuchs Tipe B (Garis Aproksimasi & Garis Hubung)
  | 'optimasi_numerik_3f'; // Optimasi Numerik (Fitur Tambahan - Non-Rothfuchs)

export interface CalculationHistoryItem {
  schemaVersion: number;  // Versi struktur data untuk backward compatibility
  id: string;
  name: string;
  projectName?: string;
  engineerName?: string;
  location?: string;
  documentNo?: string;
  timestamp: string;
  updatedAt?: string;
  mode: '2_fraksi' | '3_fraksi';
  method: BlendMethodType;
  proportions: {
    fractionA: number;    // Persen Fraksi A
    fractionB: number;    // Persen Fraksi B
    fractionC?: number;   // Persen Fraksi C (jika 3 fraksi)
  };
  sieveData: SieveDataRow[];
  notes?: string;
  typeAPos?: { xCoarse: number; xFine: number };
  typeBPoints?: {
    fineEnd: number;
    mediumStart: number;
    mediumEnd: number;
    coarseStart: number;
  };
}

export interface StandardSieve {
  id: string;
  standardName: string;   // ASTM E11, SNI, Bina Marga
  sieveNumber: string;
  sizeMm: number;
  category: 'Kasar (Coarse)' | 'Sedang (Medium)' | 'Halus (Fine)';
}
