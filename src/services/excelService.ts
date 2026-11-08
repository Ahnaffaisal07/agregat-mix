import * as XLSX from 'xlsx';
import { BlendResultRow, SieveDataRow } from '../types';

export interface ExcelExportOptions {
  title: string;
  projectName?: string;
  engineerName?: string;
  location?: string;
  documentNo?: string;
  methodName?: string;
  mode: '2_fraksi' | '3_fraksi';
  proportions: {
    fractionA: number;
    fractionB: number;
    fractionC?: number;
  };
  results: BlendResultRow[];
  sieveData?: SieveDataRow[];
  notes?: string;
}

/**
 * Ekspor data hasil perhitungan pencampuran agregat ke format Excel (.xlsx) komprehensif
 */
export function exportBlendToExcel(
  titleOrOptions: string | ExcelExportOptions,
  legacyMode?: '2_fraksi' | '3_fraksi',
  legacyProportions?: { fractionA: number; fractionB: number; fractionC?: number },
  legacyResults?: BlendResultRow[]
) {
  let opts: ExcelExportOptions;

  if (typeof titleOrOptions === 'object') {
    opts = titleOrOptions;
  } else {
    opts = {
      title: titleOrOptions,
      mode: legacyMode || '2_fraksi',
      proportions: legacyProportions || { fractionA: 50, fractionB: 50 },
      results: legacyResults || [],
    };
  }

  const {
    title,
    projectName = title,
    engineerName = 'Laboratorium Bahan Jalan',
    location = 'Laboratorium Uji',
    documentNo = 'AMR-EXCEL-001',
    methodName = opts.mode === '2_fraksi' ? 'Metode Bujur Sangkar 10x10' : 'Metode Rothfuchs',
    mode,
    proportions,
    results,
    sieveData,
    notes = '',
  } = opts;

  const wb = XLSX.utils.book_new();

  // Evaluasi kelayakan
  const allPassing = results.every((r) => r.isPassingSpec);
  const failedCount = results.filter((r) => !r.isPassingSpec).length;

  let totalDev = 0;
  let maxDev = 0;
  results.forEach((r) => {
    const dev = Math.abs(r.combinedPassing - r.specMid);
    totalDev += dev;
    if (dev > maxDev) maxDev = dev;
  });
  const meanDev = results.length > 0 ? (totalDev / results.length).toFixed(1) : '0.0';

  // =========================================================================
  // SHEET 1: HASIL CAMPURAN & EVALUASI
  // =========================================================================
  const sheet1Data: (string | number)[][] = [
    ['AGREGAT MIX - LAPORAN REKAYASA PENCAMPURAN AGREGAT (AGGREGATE BLENDING)'],
    ['Standar Acuan Metodologi: materi-pencampuran-agregat.pdf'],
    [''],
    ['I. IDENTITAS PERHITUNGAN & PROYEK'],
    ['Nama Proyek / Pekerjaan', projectName],
    ['Penguji / Laboran', engineerName],
    ['Lokasi Pengujian', location],
    ['Nomor Dokumen Laporan', documentNo],
    ['Waktu Perhitungan / Ekspor', new Date().toLocaleString('id-ID')],
    ['Metode Perhitungan', methodName],
    ['Mode Campuran', mode === '2_fraksi' ? 'Pencampuran 2 Fraksi Agregat' : 'Pencampuran 3 Fraksi Agregat'],
    ['Status Kelolosan Spesifikasi', allPassing ? 'MEMENUHI SEMUA SPESIFIKASI' : `${failedCount} SARINGAN DI LUAR SPESIFIKASI`],
    [''],
    ['II. PROPORSI PENCAMPURAN TERPILIH (BLEND PROPORTIONS)'],
    ['Fraksi A (Kasar)', `${proportions.fractionA}%`],
    ['Fraksi B (' + (mode === '3_fraksi' ? 'Sedang' : 'Halus') + ')', `${proportions.fractionB}%`],
    ...(mode === '3_fraksi' ? [['Fraksi C (Halus)', `${proportions.fractionC ?? 0}%`]] : []),
    ['Total Proporsi', '100%'],
    [''],
    ['III. TABEL HASIL GRADASI CAMPURAN & EVALUASI TIAP SARINGAN'],
  ];

  // Table Headers
  const tableHeaders =
    mode === '2_fraksi'
      ? [
          'Nomor Saringan',
          'Ukuran Bukaan (mm)',
          `Kontribusi A (${proportions.fractionA}%)`,
          `Kontribusi B (${proportions.fractionB}%)`,
          'Gradasi Campuran (%)',
          'Batas Bawah Spek (%)',
          'Gradasi Tengah Spek (%)',
          'Batas Atas Spek (%)',
          'Deviasi thd Tengah (%)',
          'Status Evaluasi Saringan',
        ]
      : [
          'Nomor Saringan',
          'Ukuran Bukaan (mm)',
          `Kontribusi A (${proportions.fractionA}%)`,
          `Kontribusi B (${proportions.fractionB}%)`,
          `Kontribusi C (${proportions.fractionC}%)`,
          'Gradasi Campuran (%)',
          'Batas Bawah Spek (%)',
          'Gradasi Tengah Spek (%)',
          'Batas Atas Spek (%)',
          'Deviasi thd Tengah (%)',
          'Status Evaluasi Saringan',
        ];

  sheet1Data.push(tableHeaders);

  // Table Rows
  results.forEach((row) => {
    const dev = Number((row.combinedPassing - row.specMid).toFixed(1));
    const devStr = dev > 0 ? `+${dev}` : `${dev}`;
    const statusStr = row.isPassingSpec ? 'MEMENUHI (PASS)' : 'OUT OF SPEC';

    if (mode === '2_fraksi') {
      sheet1Data.push([
        row.sieveName,
        row.sieveSizeMm,
        row.contribA,
        row.contribB,
        row.combinedPassing,
        row.specMin,
        row.specMid,
        row.specMax,
        devStr,
        statusStr,
      ]);
    } else {
      sheet1Data.push([
        row.sieveName,
        row.sieveSizeMm,
        row.contribA,
        row.contribB,
        row.contribC ?? 0,
        row.combinedPassing,
        row.specMin,
        row.specMid,
        row.specMax,
        devStr,
        statusStr,
      ]);
    }
  });

  // Summary statistics footer
  sheet1Data.push(['']);
  sheet1Data.push(['IV. RINGKASAN EVALUASI STATISTIK']);
  sheet1Data.push(['Rata-rata Deviasi Absolut (MAD)', `${meanDev}%`]);
  sheet1Data.push(['Deviasi Maksimum terhadap Tengah', `${maxDev.toFixed(1)}%`]);
  sheet1Data.push(['Jumlah Saringan di Luar Spesifikasi', `${failedCount} dari ${results.length} saringan`]);
  if (notes) {
    sheet1Data.push(['Catatan Rekayasa', notes]);
  }

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  ws1['!cols'] = [
    { wch: 26 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 20 },
    { wch: 22 },
    { wch: 22 },
    { wch: 26 },
    { wch: 26 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Hasil_Campuran_Evaluasi');

  // =========================================================================
  // SHEET 2: DATA AWAL & SPESIFIKASI
  // =========================================================================
  const rawSieves = sieveData || results.map((r) => ({
    id: r.sieveName,
    sieveName: r.sieveName,
    sieveSizeMm: r.sieveSizeMm,
    passingA: Number(((r.contribA / (proportions.fractionA || 1)) * 100).toFixed(1)),
    passingB: Number(((r.contribB / (proportions.fractionB || 1)) * 100).toFixed(1)),
    passingC: r.contribC !== undefined ? Number(((r.contribC / (proportions.fractionC || 1)) * 100).toFixed(1)) : 0,
    specMin: r.specMin,
    specMax: r.specMax,
    specMid: r.specMid,
  }));

  const sheet2Data: (string | number)[][] = [
    ['DATA HASIL ANALISIS SARINGAN AWAL & SPESIFIKASI AGREGAT'],
    ['Sumber Laboratorium: Data uji saringan agregat individual'],
    [''],
  ];

  const sheet2Headers =
    mode === '2_fraksi'
      ? [
          'Nomor Saringan',
          'Ukuran Bukaan (mm)',
          'Persen Lolos Agregat A (Kasar %)',
          'Persen Lolos Agregat B (Halus %)',
          'Batas Bawah Spek (Min %)',
          'Gradasi Tengah Spek (Mid %)',
          'Batas Atas Spek (Max %)',
        ]
      : [
          'Nomor Saringan',
          'Ukuran Bukaan (mm)',
          'Persen Lolos Agregat A (Kasar %)',
          'Persen Lolos Agregat B (Sedang %)',
          'Persen Lolos Agregat C (Halus %)',
          'Batas Bawah Spek (Min %)',
          'Gradasi Tengah Spek (Mid %)',
          'Batas Atas Spek (Max %)',
        ];

  sheet2Data.push(sheet2Headers);

  rawSieves.forEach((s) => {
    const mid = s.specMid ?? Number(((s.specMin + s.specMax) / 2).toFixed(1));
    if (mode === '2_fraksi') {
      sheet2Data.push([
        s.sieveName,
        s.sieveSizeMm,
        s.passingA,
        s.passingB,
        s.specMin,
        mid,
        s.specMax,
      ]);
    } else {
      sheet2Data.push([
        s.sieveName,
        s.sieveSizeMm,
        s.passingA,
        s.passingB,
        s.passingC ?? 0,
        s.specMin,
        mid,
        s.specMax,
      ]);
    }
  });

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!cols'] = [
    { wch: 22 },
    { wch: 20 },
    { wch: 26 },
    { wch: 26 },
    { wch: 26 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Data_Awal_Spesifikasi');

  // =========================================================================
  // SHEET 3: METODOLOGI & RUMUS PERHITUNGAN
  // =========================================================================
  const sheet3Data = [
    ['DASAR TEORI DAN RUMUS PERHITUNGAN PENCAMPURAN AGREGAT'],
    ['Referensi: Modul Pencampuran Agregat (materi-pencampuran-agregat.pdf)'],
    [''],
    ['1. RUMUS PEMBOBOTAN CAMPURAN (WEIGHTED COMBINATION)'],
    ['Persamaan Umum:'],
    ['P_campuran,i = sum(P_fraksi * Persen_Lolos_fraksi,i)'],
    ['Untuk 2 Fraksi: P_campuran = (PA * A) + (PB * B) dengan PA + PB = 100%'],
    ['Untuk 3 Fraksi: P_campuran = (PA * A) + (PB * B) + (PC * C) dengan PA + PB + PC = 100%'],
    [''],
    ['2. METODE GRAFIS BUJUR SANGKAR 10 x 10 CM (2 FRAKSI)'],
    ['- Sumbu Kiri: % Lolos Agregat Halus (B) dari 0 s.d. 100%'],
    ['- Sumbu Kanan: % Lolos Agregat Kasar (A) dari 0 s.d. 100%'],
    ['- Titik batas spesifikasi agregat campuran ditandai tanda silang (x) pada garis saringan.'],
    ['- Rentang kelayakan dibatasi oleh garis vertikal paling tengah dari batas spesifikasi.'],
    ['- Nilai proporsi ditentukan oleh garis tengah daerah kelayakan.'],
    [''],
    ['3. METODE ROTHFUCHS TIPE A (3 FRAKSI)'],
    ['- Menggunakan persegi panjang rasio 1 : 2 (10 x 20 cm).'],
    ['- Sumbu horizontal dipetakan non-linear berdasar % lolos gradasi tengah spesifikasi (X = P_mid).'],
    ['- Garis diagonal Y = X menjadi garis gradasi tengah spesifikasi.'],
    ['- Proporsi Kasar (A): dicari garis vertikal dengan jarak tepi bawah ke Kasar = jarak tepi atas ke Sedang (jarak a).'],
    ['- Proporsi Halus (C): dicari garis vertikal dengan jarak tepi atas ke Halus = jumlah jarak bawah ke Kasar dan Sedang (x = b + c).'],
    ['- Proporsi Sedang (B): sisa terhadap 100% (100% - A - C).'],
    [''],
    ['4. METODE ROTHFUCHS TIPE B (3 FRAKSI)'],
    ['- Tarik garis lurus aproksimasi untuk masing-masing fraksi dengan luas daerah kiri dan kanan seimbang (equal area).'],
    ['- Garis hubung awal Sedang ke akhir Halus memotong diagonal menentukan Proporsi Halus (C).'],
    ['- Garis hubung awal Kasar ke akhir Sedang memotong diagonal menentukan Proporsi Kasar (A).'],
    ['- Selisih kedua titik potong menentukan Proporsi Sedang (B).'],
  ];

  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  ws3['!cols'] = [{ wch: 100 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'Metodologi_Rumus');

  // Unduh File Excel
  const safeFilename = projectName.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 45);
  XLSX.writeFile(wb, `Laporan_AgregatMix_${safeFilename}.xlsx`);
}
