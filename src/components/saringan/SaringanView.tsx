import React, { useState } from 'react';
import { STANDARD_SIEVES_LIST } from '../../core/presets';
import { TableProperties, Search, Filter, ShieldCheck, Info } from 'lucide-react';

export const SaringanView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filtered = STANDARD_SIEVES_LIST.filter(item => {
    const matchesSearch = item.sieveNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(item.sizeMm).includes(searchTerm);
    const matchesCategory = filterCategory === 'all' || item.category.toLowerCase().includes(filterCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Title */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
            <TableProperties className="w-4 h-4" />
            <span>Referensi Standar Teknik Sipil</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Data Standar Saringan (Sieve Size Specifications)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar bukaan saringan standar ASTM E11 dan Spesifikasi Umum Bina Marga untuk perkerasan jalan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-4 h-4" />
            <span>Standar ASTM E11 / SNI</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari saringan (misal: 3/4 inci, No.4, 4.75)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          >
            <option value="all">Semua Kategori (All Categories)</option>
            <option value="kasar">Agregat Kasar (Coarse Aggregate)</option>
            <option value="sedang">Agregat Sedang (Medium Aggregate)</option>
            <option value="halus">Agregat Halus (Fine Aggregate)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-6 py-3.5">Standar Acuan</th>
              <th className="px-6 py-3.5">Nomor Saringan (Sieve Designation)</th>
              <th className="px-6 py-3.5">Bukaan Saringan (Sieve Opening mm)</th>
              <th className="px-6 py-3.5">Kategori Fraksi Agregat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {filtered.map((sieve) => (
              <tr key={sieve.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-3 font-semibold text-slate-600">{sieve.standardName}</td>
                <td className="px-6 py-3 font-bold text-slate-900">{sieve.sieveNumber}</td>
                <td className="px-6 py-3 font-mono font-semibold text-blue-700">{sieve.sizeMm} mm</td>
                <td className="px-6 py-3">
                  <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-medium ${
                    sieve.category.includes('Kasar')
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : sieve.category.includes('Sedang')
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {sieve.category}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info note */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">Pedoman Standar Bukaan Saringan:</div>
          <p className="text-slate-600 leading-relaxed">
            Pada perkerasan lentur aspal (AC-WC, AC-BC, AC-Base) dan lapis pondasi agregat (LPA/LPB), batas antara agregat kasar dan agregat halus umumnya berada pada <strong>Saringan No. 4 (4,75 mm)</strong> atau <strong>No. 8 (2,36 mm)</strong>, sedangkan partikel lolos <strong>Saringan No. 200 (0,075 mm)</strong> diklasifikasikan sebagai bahan pengisi (*mineral filler*).
          </p>
        </div>
      </div>
    </div>
  );
};
