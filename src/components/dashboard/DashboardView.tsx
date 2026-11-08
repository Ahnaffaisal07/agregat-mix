import React from 'react';
import { 
  Layers2, 
  Layers3, 
  History, 
  FileText, 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  FileSpreadsheet,
  BookOpen,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { NavigationMenu, CalculationHistoryItem } from '../../types';

interface DashboardViewProps {
  onNavigate: (menu: NavigationMenu) => void;
  historyList: CalculationHistoryItem[];
  onSelectHistory: (item: CalculationHistoryItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  onNavigate, 
  historyList,
  onSelectHistory
}) => {
  const count2F = historyList.filter(h => h.mode === '2_fraksi').length;
  const count3F = historyList.filter(h => h.mode === '3_fraksi').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-navy-900 to-slate-900 text-white p-8 md:p-10 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform Komputasi Perancangan Campuran Agregat</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            AGREGAT MIX – Aggregate Blending Calculator
          </h2>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Aplikasi rekayasa teknik sipil modern untuk membantu mahasiswa, dosen, dan praktisi perkerasan jalan melakukan perhitungan proporsi pencampuran fraksi agregat berdasarkan kaidah metode grafis yang akurat dan terverifikasi.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('fraksi2')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
            >
              <Layers2 className="w-4 h-4" />
              <span>Mulai 2 Fraksi Agregat</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('fraksi3')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
            >
              <Layers3 className="w-4 h-4" />
              <span>Mulai 3 Fraksi (Rothfuchs)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('about')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition-all"
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Pelajari Teori Grafis PDF</span>
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-[-40px] top-[-40px] w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute right-20 bottom-[-20px] w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
      </div>

      {/* Metric Counters / Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Riwayat Tersimpan
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {historyList.length} <span className="text-xs font-normal text-slate-500">Kalkulasi</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>Tersimpan di LocalStorage</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <History className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pencampuran 2 Fraksi
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {count2F} <span className="text-xs font-normal text-slate-500">Studi</span>
            </div>
            <div className="text-[11px] text-blue-600 font-medium mt-1">
              Metode Bujur Sangkar 10x10
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pencampuran 3 Fraksi
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {count3F} <span className="text-xs font-normal text-slate-500">Studi</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              Metode Rothfuchs Tipe A & B
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Layers3 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Standar Acuan
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              ASTM / SNI
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Bina Marga & Modul Dosen
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two Main Method Exploration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Pencampuran 2 Fraksi */}
        <div className="bg-white rounded-2xl p-7 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Layers2 className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                2 Fraksi Agregat
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Metode Grafis Bujur Sangkar 10 × 10
              </h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5 uppercase tracking-wider">
                Square Blending Method
              </p>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Pencampuran antara Agregat Kasar (Fraksi A) dan Agregat Halus (Fraksi B). Garis-garis saringan menghubungkan nilai persen lolos kedua fraksi untuk membentuk rentang arsiran batas spesifikasi, dan garis tengahnya menjadi proporsi campuran.
            </p>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Fitur & Luaran Metode:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1">
                <li>Visualisasi grafik bujur sangkar 10x10 interaktif</li>
                <li>Penandaan otomatis batas tanda &times; spesifikasi</li>
                <li>Perhitungan otomatis daerah arsiran & proporsi optimum</li>
                <li>Tabel gradasi campuran lengkap & evaluasi kelolosan</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Contoh PDF: <span className="font-semibold text-slate-700">46% A : 54% B</span>
            </div>
            <button
              onClick={() => onNavigate('fraksi2')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <span>Buka Menu 2 Fraksi</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 2: Pencampuran 3 Fraksi */}
        <div className="bg-white rounded-2xl p-7 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Layers3 className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                3 Fraksi Agregat
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Metode Grafis Rothfuchs Tipe A & B
              </h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5 uppercase tracking-wider">
                Rothfuchs Blending Method
              </p>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Pencampuran antara Kasar (A), Sedang (B), dan Halus (C) menggunakan bidang 1:2 dengan sumbu saringan terpetakan diagonal. Mendukung analisis Tipe A (keseimbangan jarak vertikal) dan Tipe B (garis aproksimasi luas & garis hubung silang).
            </p>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Fitur & Luaran Metode:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1">
                <li>Diagram Rothfuchs interaktif dengan diagonal tengah</li>
                <li>Konstruksi garis bantu jarak $a$ dan $x = b + c$ (Tipe A)</li>
                <li>Konstruksi garis aproksimasi luas setara & titik potong (Tipe B)</li>
                <li>Slider penyesuaian rekayasa manual (*fine-tuning*)</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Contoh PDF: <span className="font-semibold text-slate-700">Tipe A (30:30:40) & Tipe B (20:49:31)</span>
            </div>
            <button
              onClick={() => onNavigate('fraksi3')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <span>Buka Menu 3 Fraksi</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Calculations Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <History className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Riwayat Perhitungan Terakhir (Recent Blending Studies)
              </h3>
              <p className="text-xs text-slate-500">
                Pilih salah satu riwayat untuk memuat ulang data saringan dan hasil grafisnya
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('history')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Lihat Semua ({historyList.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 uppercase font-semibold border-b border-slate-200/80">
              <tr>
                <th className="px-6 py-3.5">Nama Analisis / Studi</th>
                <th className="px-6 py-3.5">Mode & Metode</th>
                <th className="px-6 py-3.5">Proporsi Campuran (Blend)</th>
                <th className="px-6 py-3.5">Waktu Kalkulasi</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {historyList.slice(0, 5).map((item) => {
                const is2F = item.mode === '2_fraksi';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${is2F ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
                        <span>{item.name}</span>
                      </div>
                      {item.notes && (
                        <div className="text-[11px] text-slate-400 font-normal truncate max-w-md mt-0.5">
                          {item.notes}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-medium ${
                        is2F 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/60' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      }`}>
                        {is2F ? '2 Fraksi (Bujur Sangkar)' : item.method === 'rothfuchs_tipe_a' ? '3 Fraksi (Rothfuchs A)' : '3 Fraksi (Rothfuchs B)'}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-mono font-medium text-slate-800">
                      {is2F ? (
                        <span>A: {item.proportions.fractionA}% | B: {item.proportions.fractionB}%</span>
                      ) : (
                        <span>A: {item.proportions.fractionA}% | B: {item.proportions.fractionB}% | C: {item.proportions.fractionC ?? 0}%</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.timestamp}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onSelectHistory(item)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white font-semibold text-slate-700 transition-colors text-xs"
                      >
                        Buka Studi
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
