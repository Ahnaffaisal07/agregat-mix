export interface ValidationError {
  rowNumber: number;        // Nomor baris (1-indexed tampilan)
  sieveId?: string;         // ID saringan terkait
  columnKey: string;        // Kunci kolom ('sieveName', 'sieveSizeMm', 'passingA', dst.)
  columnName: string;       // Nama kolom teknis ('Nomor Saringan', 'Ukuran Saringan (mm)', dst.)
  message: string;          // Pesan kesalahan rinci
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  errorCount: number;
  warningCount: number;
}

export interface ColumnMapping {
  sieveName: number;        // Indeks kolom di Excel (-1 jika tidak terpetakan)
  sieveSizeMm: number;
  passingA: number;
  passingB: number;
  passingC?: number;        // Khusus 3 fraksi
  specMin: number;
  specMax: number;
  specMid?: number;
}

export interface ExcelWorkbookData {
  fileName: string;
  fileSize: number;
  sheetNames: string[];
  activeSheet: string;
  rawRows: any[][];
  headers: string[];
  detectedMapping: ColumnMapping;
}
