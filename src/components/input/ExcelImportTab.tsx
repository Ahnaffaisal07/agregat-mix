import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { SieveDataRow } from '../../types';
import { ColumnMapping } from '../../types/inputValidation';
import { 
  readExcelFile, 
  extractSheetData, 
  convertRawRowsToSieveData 
} from '../../services/excelImportService';
import { validateSieveDataset } from '../../core/validationEngine';
import { ValidationBanner } from './ValidationBanner';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  RefreshCw, 
  ArrowRight, 
  FileText,
  SlidersHorizontal,
  TableProperties
} from 'lucide-react';
import { downloadTemplate2Fraksi, downloadTemplate3Fraksi } from '../../services/templateService';

interface ExcelImportTabProps {
  mode: '2_fraksi' | '3_fraksi';
  onImportSuccess: (importedData: SieveDataRow[]) => void;
  onNotification?: (msg: string) => void;
}

export const ExcelImportTab: React.FC<ExcelImportTabProps> = ({
  mode,
  onImportSuccess,
  onNotification,
}) => {
  const is2F = mode === '2_fraksi';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State File & Workbook
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');

  // State Headers & Mapping
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<any[][]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    sieveName: -1,
    sieveSizeMm: -1,
    passingA: -1,
    passingB: -1,
    passingC: is2F ? undefined : -1,
    specMin: -1,
    specMax: -1,
    specMid: -1,
  });

  // Konversi data mentah menjadi SieveDataRow
  const previewSieves: SieveDataRow[] = useMemo(() => {
    if (!dataRows || dataRows.length === 0) return [];
    return convertRawRowsToSieveData(dataRows, columnMapping, mode);
  }, [dataRows, columnMapping, mode]);

  // Validasi real-time data hasil import
  const validation = useMemo(() => {
    if (previewSieves.length === 0) {
      return { isValid: false, errors: [], warnings: [], errorCount: 0, warningCount: 0 };
    }
    return validateSieveDataset(previewSieves, mode);
  }, [previewSieves, mode]);

  // Handle pembacaan file
  const processFile = async (file: File) => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!validExtensions.includes(ext)) {
        throw new Error('Format file tidak didukung. Harap unggah file dengan format .xlsx, .xls, atau .csv.');
      }

      const res = await readExcelFile(file);
      setWorkbook(res.workbook);
      setFileName(res.fileName);
      setFileSize(res.fileSize);
      setSheetNames(res.sheetNames);
      const defaultSheet = res.sheetNames[0];
      setActiveSheet(defaultSheet);

      // Ekstrak sheet pertama
      const sheetData = extractSheetData(res.workbook, defaultSheet, mode);
      setHeaders(sheetData.headers);
      setDataRows(sheetData.dataRows);
      setColumnMapping(sheetData.mapping);

      if (onNotification) onNotification(`File "${file.name}" berhasil dibaca.`);
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSheetChange = (newSheet: string) => {
    if (!workbook) return;
    setActiveSheet(newSheet);
    try {
      const sheetData = extractSheetData(workbook, newSheet, mode);
      setHeaders(sheetData.headers);
      setDataRows(sheetData.dataRows);
      setColumnMapping(sheetData.mapping);
    } catch (err) {
      setErrorMessage((err as Error).message);
    }
  };

  const handleMappingChange = (field: keyof ColumnMapping, colIdx: number) => {
    setColumnMapping((prev) => ({
      ...prev,
      [field]: colIdx,
    }));
  };

  const handleConfirmImport = () => {
    if (previewSieves.length === 0) {
      alert('Tidak ada data saringan yang terdeteksi untuk diimpor.');
      return;
    }

    if (!validation.isValid) {
      if (!confirm(`Terdapat ${validation.errorCount} kesalahan validasi data. Apakah Anda tetap ingin mengimpor dan memperbaikinya di tabel manual?`)) {
        return;
      }
    }

    onImportSuccess(previewSieves);
    if (onNotification) onNotification(`Berhasil mengimpor ${previewSieves.length} data saringan dari Excel ke analisis.`);
  };

  return (
    <div className="space-y-6">
      {/* Upload Box / Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          isDragging
            ? 'border-blue-600 bg-blue-50/70 scale-[1.01]'
            : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-md shadow-blue-500/10">
            <Upload className="w-7 h-7" />
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-800">
              Tarik &amp; Lepaskan File Excel di Sini, atau{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:underline font-extrabold focus:outline-none"
              >
                Pilih File dari Komputer
              </button>
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Mendukung format <strong>.xlsx</strong>, <strong>.xls</strong>, dan <strong>.csv</strong>. Pemrosesan dilakukan 100% lokal di browser Anda.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => (is2F ? downloadTemplate2Fraksi() : downloadTemplate3Fraksi())}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unduh Template Contoh ({is2F ? '2 Fraksi' : '3 Fraksi'})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Message Box */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Sheet Details & Column Mapping Section */}
      {workbook && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{fileName}</h4>
                <span className="text-[11px] text-slate-400 font-mono">
                  {(fileSize / 1024).toFixed(1)} KB | {dataRows.length} baris data ditemukan
                </span>
              </div>
            </div>

            {/* Sheet Selector */}
            {sheetNames.length > 1 && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600">Pilih Worksheet:</label>
                <select
                  value={activeSheet}
                  onChange={(e) => handleSheetChange(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 font-sans font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sheetNames.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Pemetaan Kolom (Column Mapping) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Pemetaan Kolom Excel (Column Mapping)
                </h5>
              </div>
              <span className="text-[11px] text-slate-400">
                Kolom telah dideteksi otomatis. Anda dapat mengubah pemetaan secara manual jika diperlukan.
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              {/* Sieve Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nomor Saringan:</label>
                <select
                  value={columnMapping.sieveName}
                  onChange={(e) => handleMappingChange('sieveName', Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                >
                  <option value={-1}>-- Belum Dipetakan --</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      Kolom {i + 1}: {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sieve Size mm */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Ukuran (mm):</label>
                <select
                  value={columnMapping.sieveSizeMm}
                  onChange={(e) => handleMappingChange('sieveSizeMm', Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                >
                  <option value={-1}>-- Belum Dipetakan --</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      Kolom {i + 1}: {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Passing A */}
              <div>
                <label className="block text-[11px] font-bold text-red-800 mb-1">% Lolos A (Kasar):</label>
                <select
                  value={columnMapping.passingA}
                  onChange={(e) => handleMappingChange('passingA', Number(e.target.value))}
                  className="w-full text-xs border border-red-200 rounded px-2 py-1 bg-white text-red-900"
                >
                  <option value={-1}>-- Belum Dipetakan --</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      Kolom {i + 1}: {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Passing B */}
              <div>
                <label className="block text-[11px] font-bold text-blue-800 mb-1">
                  % Lolos B ({is2F ? 'Halus' : 'Sedang'}):
                </label>
                <select
                  value={columnMapping.passingB}
                  onChange={(e) => handleMappingChange('passingB', Number(e.target.value))}
                  className="w-full text-xs border border-blue-200 rounded px-2 py-1 bg-white text-blue-900"
                >
                  <option value={-1}>-- Belum Dipetakan --</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      Kolom {i + 1}: {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Passing C (3 Fraksi) */}
              {!is2F && (
                <div>
                  <label className="block text-[11px] font-bold text-amber-800 mb-1">% Lolos C (Halus):</label>
                  <select
                    value={columnMapping.passingC ?? -1}
                    onChange={(e) => handleMappingChange('passingC', Number(e.target.value))}
                    className="w-full text-xs border border-amber-200 rounded px-2 py-1 bg-white text-amber-900"
                  >
                    <option value={-1}>-- Belum Dipetakan --</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        Kolom {i + 1}: {h}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Spec Min */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Batas Bawah Spek (%):</label>
                <select
                  value={columnMapping.specMin}
                  onChange={(e) => handleMappingChange('specMin', Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                >
                  <option value={-1}>-- Belum Dipetakan --</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      Kolom {i + 1}: {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Spec Max */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Batas Atas Spek (%):</label>
                <select
                  value={columnMapping.specMax}
                  onChange={(e) => handleMappingChange('specMax', Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                >
                  <option value={-1}>-- Belum Dipetakan --</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      Kolom {i + 1}: {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Spec Mid */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Gradasi Tengah (%):</label>
                <select
                  value={columnMapping.specMid ?? -1}
                  onChange={(e) => handleMappingChange('specMid', Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                >
                  <option value={-1}>-- Otomatis: (Min+Max)/2 --</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      Kolom {i + 1}: {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Validation Banner Report */}
          <ValidationBanner validation={validation} totalRows={previewSieves.length} />

          {/* Preview Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TableProperties className="w-4 h-4 text-emerald-600" />
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Preview Hasil Pembacaan Data ({previewSieves.length} Baris Saringan)
                </h5>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">No</th>
                    <th className="px-3 py-2.5">Nomor Saringan</th>
                    <th className="px-3 py-2.5">Ukuran (mm)</th>
                    <th className="px-3 py-2.5 bg-red-50 text-red-900">% Lolos A</th>
                    <th className="px-3 py-2.5 bg-blue-50 text-blue-900">% Lolos B</th>
                    {!is2F && <th className="px-3 py-2.5 bg-amber-50 text-amber-900">% Lolos C</th>}
                    <th className="px-3 py-2.5">Spek Min</th>
                    <th className="px-3 py-2.5">Spek Max</th>
                    <th className="px-3 py-2.5">Gradasi Tengah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                  {previewSieves.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-400 font-sans">{i + 1}</td>
                      <td className="px-3 py-2 font-sans font-medium text-slate-900">{r.sieveName}</td>
                      <td className="px-3 py-2 font-bold">{r.sieveSizeMm}</td>
                      <td className="px-3 py-2 bg-red-50/30 text-red-700 font-bold">{r.passingA}</td>
                      <td className="px-3 py-2 bg-blue-50/30 text-blue-700 font-bold">{r.passingB}</td>
                      {!is2F && <td className="px-3 py-2 bg-amber-50/30 text-amber-700 font-bold">{r.passingC ?? 0}</td>}
                      <td className="px-3 py-2">{r.specMin}</td>
                      <td className="px-3 py-2">{r.specMax}</td>
                      <td className="px-3 py-2 text-slate-500">{r.specMid?.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Setelah dikonfirmasi, data ini akan diterapkan ke analisis aktif dan dapat diedit kembali di tabel manual.
            </span>

            <button
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <span>Konfirmasi &amp; Terapkan Data ke Analisis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
