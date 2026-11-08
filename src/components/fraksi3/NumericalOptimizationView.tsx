import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Check, 
  FileSpreadsheet, 
  ArrowRight,
  Calculator,
  Info
} from 'lucide-react';
import { SieveDataRow } from '../../types';
import { 
  optimizeNumerically3F, 
  calculateBlendResults3F,
  NumericalOptimizationResult 
} from '../../core/threeFractionEngine';

interface NumericalOptimizationViewProps {
  sieveData: SieveDataRow[];
  currentPropA: number;
  currentPropB: number;
  currentPropC: number;
  onApplyProportions: (a: number, b: number, c: number) => void;
}

export const NumericalOptimizationView: React.FC<NumericalOptimizationViewProps> = ({
  sieveData,
  currentPropA,
  currentPropB,
  currentPropC,
  onApplyProportions,
}) => {
  const optResult: NumericalOptimizationResult = React.useMemo(() => {
    return optimizeNumerically3F(sieveData);
  }, [sieveData]);

  // Perbandingan 4 konfigurasi
  const compPresets = React.useMemo(() => {
    const resMurni = calculateBlendResults3F(sieveData, 31, 35, 34);
    const resPenyesuaian = calculateBlendResults3F(sieveData, 30, 30, 40);
    const resTipeB = calculateBlendResults3F(sieveData, 20, 49, 31);
    const resOpt = calculateBlendResults3F(sieveData, optResult.propA, optResult.propB, optResult.propC);

    return [
      {
        name: 'Rothfuchs Tipe A (Grafis Murni)',
        prop: '31% A : 35% B : 34% C',
        ref: 'Tabel 3.9 PDF',
        allPassing: resMurni.allPassing,
        failedCount: resMurni.failedCount,
        meanDev: resMurni.meanDeviation,
        maxDev: resMurni.maxDeviation,
      },
      {
        name: 'Rothfuchs Tipe A (Penyesuaian Rekayasa)',
        prop: '30% A : 30% B : 40% C',
        ref: 'Tabel 3.10 PDF',
        allPassing: resPenyesuaian.allPassing,
        failedCount: resPenyesuaian.failedCount,
        meanDev: resPenyesuaian.meanDeviation,
        maxDev: resPenyesuaian.maxDeviation,
      },
      {
        name: 'Rothfuchs Tipe B (Garis Aproksimasi Luas)',
        prop: '20% A : 49% B : 31% C',
        ref: 'Tabel 3.11 PDF',
        allPassing: resTipeB.allPassing,
        failedCount: resTipeB.failedCount,
        meanDev: resTipeB.meanDeviation,
        maxDev: resTipeB.maxDeviation,
      },
      {
        name: 'Optimasi Numerik (Kuadrat Terkecil)',
        prop: `${optResult.propA}% A : ${optResult.propB}% B : ${optResult.propC}% C`,
        ref: 'Fitur Komputasi Tambahan',
        allPassing: resOpt.allPassing,
        failedCount: resOpt.failedCount,
        meanDev: resOpt.meanDeviation,
        maxDev: resOpt.maxDeviation,
        isOpt: true,
      },
    ];
  }, [sieveData, optResult]);

  const isCurrentMatchingOpt = 
    currentPropA === optResult.propA && 
    currentPropB === optResult.propB && 
    currentPropC === optResult.propC;

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner: Explicitly non-Rothfuchs */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-bold">Ketentuan Rekayasa Sipil Penting:</strong>
          <p className="mt-0.5 text-amber-800">
            Fitur <strong>Optimasi Numerik</strong> ini adalah algoritma komputasi berbasis pencarian matematis kuadrat terkecil (<em>Least-Squares Error Minimization</em>), <strong>bukan metode grafis Rothfuchs</strong>. Metode Rothfuchs murni menggunakan bidang konstruksi geometris 1:2 (Tipe A dan Tipe B). Modul ini disediakan sebagai alat pembanding dan validasi komparatif bagi mahasiswa serta perencana campuran agregat.
          </p>
        </div>
      </div>

      {/* Optimum Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Hasil Pencarian Optimasi Numerik (Constrained Grid Search)</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Proporsi Campuran Terdekat terhadap Gradasi Tengah Spesifikasi
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Fungsi Tujuan: min &Sigma; (P_campuran - P_mid)&sup2; dengan batasan A &ge; 0, B &ge; 0, C &ge; 0 dan A + B + C = 100%.
            </p>
          </div>

          <button
            onClick={() => onApplyProportions(optResult.propA, optResult.propB, optResult.propC)}
            disabled={isCurrentMatchingOpt}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
              isCurrentMatchingOpt
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-emerald-500/30'
            }`}
          >
            {isCurrentMatchingOpt ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Proporsi Sudah Aktif</span>
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                <span>Terapkan Proporsi ke Perhitungan</span>
              </>
            )}
          </button>
        </div>

        {/* Proportions Stat Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80">
            <span className="text-[11px] font-semibold text-red-300 block">Fraksi A (Kasar)</span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {optResult.propA}%
            </div>
            <span className="text-[10px] text-slate-400">Proporsi Agregat Kasar</span>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80">
            <span className="text-[11px] font-semibold text-blue-300 block">Fraksi B (Sedang)</span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {optResult.propB}%
            </div>
            <span className="text-[10px] text-slate-400">Proporsi Agregat Sedang</span>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80">
            <span className="text-[11px] font-semibold text-amber-300 block">Fraksi C (Halus)</span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {optResult.propC}%
            </div>
            <span className="text-[10px] text-slate-400">Proporsi Agregat Halus</span>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80">
            <span className="text-[11px] font-semibold text-emerald-300 block">Kelayakan Spesifikasi</span>
            <div className="mt-1 flex items-center gap-1.5">
              {optResult.allPassing ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-400">100% LOLOS</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-bold text-amber-400">{optResult.failedCount} DI LUAR</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              MAD: {optResult.meanAbsoluteDeviation}% | SSE: {optResult.sumSquaredError}
            </span>
          </div>
        </div>
      </div>

      {/* Sieve Deviations Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Tabel Evaluasi Deviasi Saringan terhadap Gradasi Tengah
            </h4>
            <p className="text-xs text-slate-500">
              Deviasi dihitung sebagai selisih absolut dan kuadrat antara hasil campuran dan titik tengah spesifikasi.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 bg-slate-100 rounded text-slate-700">
            Campuran: {optResult.propA}% A : {optResult.propB}% B : {optResult.propC}% C
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Nomor Saringan</th>
                <th className="px-3 py-3">Bukaan (mm)</th>
                <th className="px-3 py-3">Batas Spek (Min - Max)</th>
                <th className="px-3 py-3">Gradasi Tengah (Mid)</th>
                <th className="px-4 py-3 bg-emerald-50 text-emerald-900 font-extrabold">
                  Campuran Hasil Optimasi
                </th>
                <th className="px-3 py-3">Deviasi (P - P_mid)</th>
                <th className="px-3 py-3 text-center">Status Kelayakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
              {optResult.sieveDeviations.map((dev, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5 font-sans font-medium">{dev.sieveName}</td>
                  <td className="px-3 py-2.5">{sieveData[idx]?.sieveSizeMm}</td>
                  <td className="px-3 py-2.5">
                    {dev.specMin} – {dev.specMax}%
                  </td>
                  <td className="px-3 py-2.5 text-slate-500">{dev.specMid.toFixed(1)}%</td>
                  <td className="px-4 py-2.5 bg-emerald-50/50 font-extrabold text-slate-900 text-sm">
                    {dev.combined.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`font-bold ${
                        dev.deviation > 0
                          ? 'text-blue-700'
                          : dev.deviation < 0
                          ? 'text-amber-700'
                          : 'text-slate-500'
                      }`}
                    >
                      {dev.deviation > 0 ? `+${dev.deviation.toFixed(1)}` : dev.deviation.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center font-sans">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        dev.isPassing
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      {dev.isPassing ? 'MEMENUHI' : 'OUT OF SPEC'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparative Preset Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Perbandingan Komparatif: Metode Rothfuchs vs Optimasi Numerik
          </h4>
          <p className="text-xs text-slate-500">
            Tinjauan performa proporsi campuran antara metode grafis klasik PDF dan metode komputasi numerik.
          </p>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Metode &amp; Skenario</th>
                <th className="px-4 py-3">Proporsi (Kasar : Sedang : Halus)</th>
                <th className="px-3 py-3">Sumber / Referensi</th>
                <th className="px-3 py-3">Rata-rata Deviasi (MAD)</th>
                <th className="px-3 py-3">Deviasi Maksimum</th>
                <th className="px-3 py-3 text-center">Status Spesifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {compPresets.map((item, idx) => (
                <tr 
                  key={idx} 
                  className={`hover:bg-slate-50 transition-colors ${
                    item.isOpt ? 'bg-emerald-50/30 font-semibold' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900 block">{item.name}</span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-700">
                    {item.prop}
                  </td>
                  <td className="px-3 py-3 text-slate-500 font-mono text-[11px]">{item.ref}</td>
                  <td className="px-3 py-3 font-mono">{item.meanDev}%</td>
                  <td className="px-3 py-3 font-mono">{item.maxDev}%</td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.allPassing
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {item.allPassing ? 'SEMUA LOLOS' : `${item.failedCount} Saringan Keluar`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
