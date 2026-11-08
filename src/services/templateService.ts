import * as XLSX from 'xlsx';
import { PRESET_PDF_2_FRAKSI, PRESET_PDF_3_FRAKSI } from '../core/presets';

/**
 * Membuat dan mengunduh file template Excel untuk Pencampuran 2 Fraksi
 */
export function downloadTemplate2Fraksi() {
  const wb = XLSX.utils.book_new();

  // Header dan Instruksi
  const instructions = [
    ['PETUNJUK PENGISIAN TEMPLATE INPUT ANALISIS SARINGAN 2 FRAKSI (AGREGAT MIX)'],
    ['1. Jangan mengubah nama kolom pada baris header (Baris ke-5).'],
    ['2. Nomor saringan dapat disesuaikan dengan laboratorium Anda (misal: "3/4 inci", "No.4", "No.200").'],
    ['3. Ukuran saringan (mm) harus bernilai positif dan tidak boleh ada ukuran yang duplikat.'],
    ['4. Nilai persen lolos dan spesifikasi harus berada dalam rentang 0 hingga 100.'],
    ['5. Angka desimal dapat ditulis dengan koma (,) maupun titik (.) (misal: 12,5 atau 12.5).'],
    ['6. Gradasi tengah dapat dikosongkan (akan dihitung otomatis: (Batas Bawah + Batas Atas) / 2).'],
    [''],
  ];

  const headers = [
    'Nomor Saringan',
    'Ukuran Saringan (mm)',
    'Persen Lolos Agregat A',
    'Persen Lolos Agregat B',
    'Batas Bawah Spesifikasi',
    'Batas Atas Spesifikasi',
    'Gradasi Tengah',
  ];

  // Data baris contoh dari materi PDF
  const rows = PRESET_PDF_2_FRAKSI.map((item) => [
    item.sieveName,
    item.sieveSizeMm,
    item.passingA,
    item.passingB,
    item.specMin,
    item.specMax,
    item.specMid ?? Number(((item.specMin + item.specMax) / 2).toFixed(1)),
  ]);

  const fullData = [...instructions, headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(fullData);

  // Atur lebar kolom
  ws['!cols'] = [
    { wch: 22 }, // Nomor Saringan
    { wch: 24 }, // Ukuran mm
    { wch: 24 }, // Lolos A
    { wch: 24 }, // Lolos B
    { wch: 26 }, // Spek Bawah
    { wch: 26 }, // Spek Atas
    { wch: 20 }, // Gradasi Tengah
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Input_2_Fraksi');
  XLSX.writeFile(wb, 'Template_Analisis_Saringan_2_Fraksi.xlsx');
}

/**
 * Membuat dan mengunduh file template Excel untuk Pencampuran 3 Fraksi
 */
export function downloadTemplate3Fraksi() {
  const wb = XLSX.utils.book_new();

  const instructions = [
    ['PETUNJUK PENGISIAN TEMPLATE INPUT ANALISIS SARINGAN 3 FRAKSI (AGREGAT MIX)'],
    ['1. Jangan mengubah nama kolom pada baris header (Baris ke-5).'],
    ['2. Nomor saringan dapat disesuaikan dengan laboratorium Anda.'],
    ['3. Ukuran saringan (mm) harus bernilai positif dan tidak boleh ada ukuran yang duplikat.'],
    ['4. Nilai persen lolos dan spesifikasi harus berada dalam rentang 0 hingga 100.'],
    ['5. Angka desimal dapat ditulis dengan koma (,) maupun titik (.) (misal: 4,75 atau 4.75).'],
    ['6. Gradasi tengah dapat dikosongkan (akan dihitung otomatis: (Batas Bawah + Batas Atas) / 2).'],
    [''],
  ];

  const headers = [
    'Nomor Saringan',
    'Ukuran Saringan (mm)',
    'Persen Lolos Agregat A',
    'Persen Lolos Agregat B',
    'Persen Lolos Agregat C',
    'Batas Bawah Spesifikasi',
    'Batas Atas Spesifikasi',
    'Gradasi Tengah',
  ];

  const rows = PRESET_PDF_3_FRAKSI.map((item) => [
    item.sieveName,
    item.sieveSizeMm,
    item.passingA,
    item.passingB,
    item.passingC ?? 0,
    item.specMin,
    item.specMax,
    item.specMid ?? Number(((item.specMin + item.specMax) / 2).toFixed(1)),
  ]);

  const fullData = [...instructions, headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(fullData);

  ws['!cols'] = [
    { wch: 22 },
    { wch: 24 },
    { wch: 24 },
    { wch: 24 },
    { wch: 24 },
    { wch: 26 },
    { wch: 26 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Input_3_Fraksi');
  XLSX.writeFile(wb, 'Template_Analisis_Saringan_3_Fraksi.xlsx');
}
