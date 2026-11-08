import React from 'react';
import { SieveDataRow } from '../../types';
import { ValidationResult } from '../../types/inputValidation';
import { getCellError, parseDecimal } from '../../core/validationEngine';
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Layers2,
  Layers3
} from 'lucide-react';
import { PRESET_PDF_2_FRAKSI, PRESET_PDF_3_FRAKSI } from '../../core/presets';
import { downloadTemplate2Fraksi, downloadTemplate3Fraksi } from '../../services/templateService';

interface ManualInputTableProps {
  mode: '2_fraksi' | '3_fraksi';
  data: SieveDataRow[];
  onChange: (updated: SieveDataRow[]) => void;
  validation: ValidationResult;
  onNotification?: (msg: string) => void;
}

export const ManualInputTable: React.FC<ManualInputTableProps> = ({
  mode,
  data,
  onChange,
  validation,
  onNotification,
}) => {
  const is2F = mode === '2_fraksi';

  // Perbarui nilai sel dengan penanganan koma dan titik
  const handleCellChange = (id: string, field: keyof SieveDataRow, rawVal: string) => {
    onChange(
      data.map((row) => {
        if (row.id !== id) return row;

        if (field === 'sieveName') {
          return { ...row, sieveName: rawVal };
        }

        // Untuk nilai numerik: simpan nilai yang diparse
        const parsed = parseDecimal(rawVal);
        const updatedRow: SieveDataRow = {
          ...row,
          [field]: parsed !== null ? parsed : (rawVal as any),
        };

        // Otomatisasi hitung Gradasi Tengah jika batas bawah atau atas berubah
        if (field === 'specMin' || field === 'specMax') {
          const sMin = field === 'specMin' ? (parsed ?? 0) : row.specMin;
          const sMax = field === 'specMax' ? (parsed ?? 0) : row.specMax;
          if (typeof sMin === 'number' && typeof sMax === 'number' && !isNaN(sMin) && !isNaN(sMax)) {
            updatedRow.specMid = Number(((sMin + sMax) / 2).toFixed(1));
          }
        }

        return updatedRow;
      })
    );
  };

  const handleAddRow = () => {
    const newId = 'sieve_' + Date.now();
    const newRow: SieveDataRow = {
      id: newId,
      sieveName: 'Saringan Baru',
      sieveSizeMm: 1.0,
      passingA: 0,
      passingB: 0,
      ...(is2F ? {} : { passingC: 0 }),
      specMin: 0,
      specMax: 100,
      specMid: 50,
    };
    onChange([...data, newRow]);
    if (onNotification) onNotification('Baris saringan baru berhasil ditambahkan');
  };

  const handleDeleteRow = (id: string) => {
    if (data.length <= 3) {
      alert('Peringatan: Jumlah saringan minimal adalah 3 baris untuk analisis gradasi campuran.');
      return;
    }
    onChange(data.filter((r) => r.id !== id));
  };

  const handleLoadVerifiedPDF = () => {
    if (is2F) {
      onChange(PRESET_PDF_2_FRAKSI);
      if (onNotification) onNotification('Data contoh terverifikasi PDF (Kasus 2 Fraksi - Tabel 3.1 & 3.2) berhasil dimuat');
    } else {
      onChange(PRESET_PDF_3_FRAKSI);
      if (onNotification) onNotification('Data contoh terverifikasi PDF (Kasus 3 Fraksi - Tabel 3.8) berhasil dimuat');
    }
  };

  const handleResetToBlank = () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan seluruh tabel data saringan?')) {
      onChange([
        { id: 'init_1', sieveName: '1 inci', sieveSizeMm: 25.0, passingA: 100, passingB: 100, ...(is2F ? {} : { passingC: 100 }), specMin: 100, specMax: 100, specMid: 100 },
        { id: 'init_2', sieveName: '3/8 inci', sieveSizeMm: 9.5, passingA: 50, passingB: 80, ...(is2F ? {} : { passingC: 95 }), specMin: 45, specMax: 65, specMid: 55 },
        { id: 'init_3', sieveName: 'No.4', sieveSizeMm: 4.75, passingA: 10, passingB: 50, ...(is2F ? {} : { passingC: 80 }), specMin: 25, specMax: 45, specMid: 35 },
      ]);
      if (onNotification) onNotification('Tabel saringan telah direset');
    }
  };

  const handleDownloadTemplate = () => {
    if (is2F) {
      downloadTemplate2Fraksi();
      if (onNotification) onNotification('Template Excel 2 Fraksi berhasil diunduh');
    } else {
      downloadTemplate3Fraksi();
      if (onNotification) onNotification('Template Excel 3 Fraksi berhasil diunduh');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            {is2F ? <Layers2 className="w-4 h-4 text-blue-600" /> : <Layers3 className="w-4 h-4 text-emerald-600" />}
            <span>Tabel Input Manual ({is2F ? '2 Fraksi' : '3 Fraksi'})</span>
          </span>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
            {data.length} Ukuran Saringan
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Baris</span>
          </button>

          <button
            onClick={handleLoadVerifiedPDF}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors shadow-sm"
            title="Muat dataset resmi dari materi-pencampuran-agregat.pdf"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Muat Contoh PDF Terverifikasi</span>
          </button>

          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors shadow-sm"
            title="Unduh template Excel dengan struktur kolom yang sesuai"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Unduh Template Excel</span>
          </button>

          <button
            onClick={handleResetToBlank}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Kosongkan tabel data saringan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Editable Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-3 py-3 w-10 text-center">No</th>
              <th className="px-3 py-3">Nomor Saringan (Sieve No.)</th>
              <th className="px-3 py-3">Ukuran Saringan (mm)</th>
              <th className="px-3 py-3 bg-red-50/70 text-red-900">
                % Lolos Agregat A (Kasar)
              </th>
              <th className="px-3 py-3 bg-blue-50/70 text-blue-900">
                % Lolos Agregat B ({is2F ? 'Halus' : 'Sedang'})
              </th>
              {!is2F && (
                <th className="px-3 py-3 bg-amber-50/70 text-amber-900">
                  % Lolos Agregat C (Halus)
                </th>
              )}
              <th className="px-3 py-3">Batas Bawah Spesifikasi (%)</th>
              <th className="px-3 py-3">Batas Atas Spesifikasi (%)</th>
              <th className="px-3 py-3 bg-slate-50 text-slate-600">
                Gradasi Tengah (%)
              </th>
              <th className="px-3 py-3 text-center w-12">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
            {data.map((row, idx) => {
              const rowNum = idx + 1;
              const errName = getCellError(validation.errors, rowNum, 'sieveName');
              const errSize = getCellError(validation.errors, rowNum, 'sieveSizeMm');
              const errA = getCellError(validation.errors, rowNum, 'passingA');
              const errB = getCellError(validation.errors, rowNum, 'passingB');
              const errC = !is2F ? getCellError(validation.errors, rowNum, 'passingC') : undefined;
              const errMin = getCellError(validation.errors, rowNum, 'specMin');
              const errMax = getCellError(validation.errors, rowNum, 'specMax');

              return (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  {/* Row index */}
                  <td className="px-3 py-2 text-center text-slate-400 font-sans font-medium text-[11px]">
                    {rowNum}
                  </td>

                  {/* 1. Nomor Saringan */}
                  <td className="px-3 py-2 font-sans">
                    <div className="relative">
                      <input
                        type="text"
                        value={row.sieveName}
                        onChange={(e) => handleCellChange(row.id, 'sieveName', e.target.value)}
                        className={`w-32 px-2.5 py-1 text-xs border rounded font-sans focus:outline-none transition-all ${
                          errName
                            ? 'border-red-500 bg-red-50/50 text-red-900 focus:ring-1 focus:ring-red-500'
                            : 'border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                        }`}
                        placeholder="misal: 3/4 inci"
                      />
                      {errName && (
                        <span className="absolute right-2 top-2 text-red-500" title={errName.message}>
                          <AlertCircle className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 2. Ukuran Saringan mm */}
                  <td className="px-3 py-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={row.sieveSizeMm}
                        onChange={(e) => handleCellChange(row.id, 'sieveSizeMm', e.target.value)}
                        className={`w-20 px-2 py-1 text-xs border rounded font-mono font-bold focus:outline-none transition-all ${
                          errSize
                            ? 'border-red-500 bg-red-50/50 text-red-900 focus:ring-1 focus:ring-red-500'
                            : 'border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                        }`}
                        placeholder="mm"
                      />
                      {errSize && (
                        <span className="absolute right-2 top-2 text-red-500" title={errSize.message}>
                          <AlertCircle className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 3. Persen Lolos A */}
                  <td className="px-3 py-2 bg-red-50/20">
                    <div className="relative">
                      <input
                        type="text"
                        value={row.passingA}
                        onChange={(e) => handleCellChange(row.id, 'passingA', e.target.value)}
                        className={`w-20 px-2 py-1 text-xs border rounded font-mono font-bold focus:outline-none transition-all ${
                          errA
                            ? 'border-red-500 bg-red-50 text-red-900 focus:ring-1 focus:ring-red-500'
                            : 'border-red-200 text-red-700 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        }`}
                        placeholder="0-100"
                      />
                      {errA && (
                        <span className="absolute right-2 top-2 text-red-500" title={errA.message}>
                          <AlertCircle className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 4. Persen Lolos B */}
                  <td className="px-3 py-2 bg-blue-50/20">
                    <div className="relative">
                      <input
                        type="text"
                        value={row.passingB}
                        onChange={(e) => handleCellChange(row.id, 'passingB', e.target.value)}
                        className={`w-20 px-2 py-1 text-xs border rounded font-mono font-bold focus:outline-none transition-all ${
                          errB
                            ? 'border-red-500 bg-red-50 text-red-900 focus:ring-1 focus:ring-red-500'
                            : 'border-blue-200 text-blue-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                        }`}
                        placeholder="0-100"
                      />
                      {errB && (
                        <span className="absolute right-2 top-2 text-red-500" title={errB.message}>
                          <AlertCircle className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 5. Persen Lolos C (Khusus 3 Fraksi) */}
                  {!is2F && (
                    <td className="px-3 py-2 bg-amber-50/20">
                      <div className="relative">
                        <input
                          type="text"
                          value={row.passingC ?? 0}
                          onChange={(e) => handleCellChange(row.id, 'passingC', e.target.value)}
                          className={`w-20 px-2 py-1 text-xs border rounded font-mono font-bold focus:outline-none transition-all ${
                            errC
                              ? 'border-red-500 bg-red-50 text-red-900 focus:ring-1 focus:ring-red-500'
                              : 'border-amber-200 text-amber-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                          }`}
                          placeholder="0-100"
                        />
                        {errC && (
                          <span className="absolute right-2 top-2 text-red-500" title={errC.message}>
                            <AlertCircle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                  )}

                  {/* 6. Batas Bawah Spesifikasi */}
                  <td className="px-3 py-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={row.specMin}
                        onChange={(e) => handleCellChange(row.id, 'specMin', e.target.value)}
                        className={`w-18 px-2 py-1 text-xs border rounded font-mono focus:outline-none transition-all ${
                          errMin
                            ? 'border-red-500 bg-red-50 text-red-900 focus:ring-1 focus:ring-red-500'
                            : 'border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                        }`}
                        placeholder="Min %"
                      />
                      {errMin && (
                        <span className="absolute right-2 top-2 text-red-500" title={errMin.message}>
                          <AlertCircle className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 7. Batas Atas Spesifikasi */}
                  <td className="px-3 py-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={row.specMax}
                        onChange={(e) => handleCellChange(row.id, 'specMax', e.target.value)}
                        className={`w-18 px-2 py-1 text-xs border rounded font-mono focus:outline-none transition-all ${
                          errMax
                            ? 'border-red-500 bg-red-50 text-red-900 focus:ring-1 focus:ring-red-500'
                            : 'border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                        }`}
                        placeholder="Max %"
                      />
                      {errMax && (
                        <span className="absolute right-2 top-2 text-red-500" title={errMax.message}>
                          <AlertCircle className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 8. Gradasi Tengah (Auto-calculated / Editable) */}
                  <td className="px-3 py-2 bg-slate-50/80">
                    <input
                      type="text"
                      value={row.specMid !== undefined ? row.specMid : ''}
                      onChange={(e) => handleCellChange(row.id, 'specMid', e.target.value)}
                      className="w-18 px-2 py-1 text-xs border border-slate-200 bg-white rounded font-mono text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      title="Dihitung otomatis: (Min + Max) / 2 atau dapat diedit manual"
                    />
                  </td>

                  {/* Action Delete */}
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Hapus baris saringan ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 px-1">
        <span>
          💡 <strong>Tips:</strong> Anda dapat mengedit ukuran saringan secara bebas tanpa terkunci. Desimal dapat menggunakan tanda koma (misal: <code>4,75</code>) atau titik (misal: <code>4.75</code>).
        </span>
        <span className="font-mono text-slate-400">
          Struktur Data: Unified <code>SieveDataRow</code>
        </span>
      </div>
    </div>
  );
};
