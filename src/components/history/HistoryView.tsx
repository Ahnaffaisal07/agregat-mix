import React, { useState, useRef } from 'react';
import { 
  History, 
  Trash2, 
  FileSpreadsheet, 
  ArrowUpRight, 
  Clock, 
  Search, 
  CheckCircle2, 
  Layers2, 
  Layers3, 
  Copy,
  Edit3,
  Download,
  Upload,
  FileText,
  X,
  AlertTriangle,
  Building,
  User,
  MapPin,
  Hash,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { CalculationHistoryItem } from '../../types';
import { 
  deleteCalculation, 
  duplicateCalculation, 
  updateCalculation, 
  exportHistoryToJson, 
  importHistoryFromJson,
  clearAllCalculations 
} from '../../services/storageService';
import { exportBlendToExcel } from '../../services/excelService';
import { downloadTemplate2Fraksi, downloadTemplate3Fraksi } from '../../services/templateService';
import { calculateBlend2Fractions, calculateBlend3Fractions } from '../../core/blendingEngine';

interface HistoryViewProps {
  historyList: CalculationHistoryItem[];
  onHistoryUpdate: (updated: CalculationHistoryItem[]) => void;
  onSelectHistory: (item: CalculationHistoryItem) => void;
  onOpenReport?: (item: CalculationHistoryItem) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  historyList,
  onHistoryUpdate,
  onSelectHistory,
  onOpenReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | '2_fraksi' | '3_fraksi'>('all');
  const [editingItem, setEditingItem] = useState<CalculationHistoryItem | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  
  // File input ref for JSON restore
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data riwayat perhitungan:\n"${name}"?`)) {
      const updated = deleteCalculation(id);
      onHistoryUpdate(updated);
      notify(`Riwayat "${name}" berhasil dihapus.`);
    }
  };

  const handleDuplicate = (id: string) => {
    const duplicated = duplicateCalculation(id);
    if (duplicated) {
      // Re-fetch full updated list
      const updatedList = [duplicated, ...historyList.filter(h => h.id !== duplicated.id)];
      onHistoryUpdate(updatedList);
      notify(`Berhasil menduplikasi perhitungan: "${duplicated.name}"`);
    }
  };

  const handleExportItemExcel = (item: CalculationHistoryItem) => {
    if (item.mode === '2_fraksi') {
      const results = calculateBlend2Fractions(item.sieveData, item.proportions.fractionA, item.proportions.fractionB);
      exportBlendToExcel({
        title: item.name,
        projectName: item.projectName || item.name,
        engineerName: item.engineerName,
        location: item.location,
        documentNo: item.documentNo,
        methodName: 'Metode Bujur Sangkar 10x10 cm',
        mode: '2_fraksi',
        proportions: item.proportions,
        results,
        sieveData: item.sieveData,
        notes: item.notes,
      });
    } else {
      const results = calculateBlend3Fractions(
        item.sieveData,
        item.proportions.fractionA,
        item.proportions.fractionB,
        item.proportions.fractionC ?? 0
      );
      exportBlendToExcel({
        title: item.name,
        projectName: item.projectName || item.name,
        engineerName: item.engineerName,
        location: item.location,
        documentNo: item.documentNo,
        methodName: item.method === 'rothfuchs_tipe_a' ? 'Metode Rothfuchs Tipe A' : 'Metode Rothfuchs Tipe B',
        mode: '3_fraksi',
        proportions: item.proportions,
        results,
        sieveData: item.sieveData,
        notes: item.notes,
      });
    }
    notify(`File Excel "${item.name}.xlsx" berhasil diunduh.`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const updated = updateCalculation(editingItem.id, {
      name: editingItem.name,
      projectName: editingItem.projectName,
      engineerName: editingItem.engineerName,
      location: editingItem.location,
      documentNo: editingItem.documentNo,
      notes: editingItem.notes,
    });
    onHistoryUpdate(updated);
    setEditingItem(null);
    notify('Perubahan identitas proyek berhasil disimpan.');
  };

  const handleExportJsonBackup = () => {
    const jsonStr = exportHistoryToJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Riwayat_Agregat_Mix_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('File cadangan JSON riwayat berhasil diunduh.');
  };

  const handleTriggerImportJson = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importHistoryFromJson(content);
        if (res.success) {
          onHistoryUpdate(res.items);
          notify(`Berhasil memulihkan ${res.items.length} riwayat perhitungan dari file backup.`);
        } else {
          alert(`Gagal mengimpor file backup: ${res.error}`);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const filtered = historyList
    .filter((h) => {
      if (filterMode === 'all') return true;
      return h.mode === filterMode;
    })
    .filter((h) => {
      const q = searchTerm.toLowerCase();
      return (
        h.name.toLowerCase().includes(q) ||
        (h.projectName && h.projectName.toLowerCase().includes(q)) ||
        h.method.toLowerCase().includes(q) ||
        (h.notes && h.notes.toLowerCase().includes(q)) ||
        (h.documentNo && h.documentNo.toLowerCase().includes(q))
      );
    });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-slideIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* Hidden File Input for JSON Restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Header with Tools */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
            <History className="w-4 h-4" />
            <span>Penyimpanan Lokal Terverifikasi (Local Storage)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Riwayat Perhitungan (Calculation History)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola, buka, duplikasi, edit, dan ekspor perancangan campuran agregat yang tersimpan di peramban ini.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Download Templates */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={downloadTemplate2Fraksi}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-white transition-all shadow-none hover:shadow-sm"
              title="Unduh format spreadsheet untuk analisis 2 fraksi"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>Template 2F</span>
            </button>
            <div className="w-[1px] h-4 bg-slate-200" />
            <button
              onClick={downloadTemplate3Fraksi}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-white transition-all shadow-none hover:shadow-sm"
              title="Unduh format spreadsheet untuk analisis 3 fraksi"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Template 3F</span>
            </button>
          </div>

          {/* Backup & Restore */}
          <button
            onClick={handleExportJsonBackup}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all shadow-sm"
            title="Cadangkan seluruh riwayat ke file JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Cadangkan JSON</span>
          </button>

          <button
            onClick={handleTriggerImportJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all shadow-sm"
            title="Pulihkan riwayat dari file JSON cadangan"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Pulihkan JSON</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="flex items-center gap-3 flex-1 px-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama proyek, dokumen, metode, atau catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs outline-none text-slate-800 placeholder-slate-400"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mode Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0 text-xs font-semibold">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-md transition-all ${
              filterMode === 'all'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({historyList.length})
          </button>
          <button
            onClick={() => setFilterMode('2_fraksi')}
            className={`px-3 py-1 rounded-md transition-all ${
              filterMode === '2_fraksi'
                ? 'bg-white text-blue-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2 Fraksi ({historyList.filter((h) => h.mode === '2_fraksi').length})
          </button>
          <button
            onClick={() => setFilterMode('3_fraksi')}
            className={`px-3 py-1 rounded-md transition-all ${
              filterMode === '3_fraksi'
                ? 'bg-white text-emerald-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3 Fraksi ({historyList.filter((h) => h.mode === '3_fraksi').length})
          </button>
        </div>
      </div>

      {/* History Items List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400 text-sm">
            Tidak ada riwayat perhitungan yang sesuai dengan pencarian atau filter.
          </div>
        ) : (
          filtered.map((item) => {
            const is2F = item.mode === '2_fraksi';
            const methodLabel =
              item.method === 'bujur_sangkar_2f'
                ? 'Metode Bujur Sangkar 10x10'
                : item.method === 'rothfuchs_tipe_a'
                ? 'Rothfuchs Tipe A (Keseimbangan Jarak)'
                : item.method === 'rothfuchs_tipe_b'
                ? 'Rothfuchs Tipe B (Garis Aproksimasi)'
                : 'Optimasi Numerik';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-blue-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 group"
              >
                {/* Main Information */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        is2F
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {is2F ? <Layers2 className="w-3.5 h-3.5" /> : <Layers3 className="w-3.5 h-3.5" />}
                      <span>{methodLabel}</span>
                    </span>

                    {item.documentNo && (
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {item.documentNo}
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{item.timestamp}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.name}
                    </h3>
                    {item.projectName && item.projectName !== item.name && (
                      <p className="text-xs text-slate-600 font-medium">
                        Proyek: {item.projectName} {item.location ? `• Lokasi: ${item.location}` : ''}
                      </p>
                    )}
                  </div>

                  {item.notes && (
                    <p className="text-xs text-slate-500 leading-relaxed max-w-2xl bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                      {item.notes}
                    </p>
                  )}

                  {/* Proportions & Sieve specs */}
                  <div className="pt-1 flex flex-wrap items-center gap-3 font-mono text-xs">
                    <span className="text-slate-600 font-medium font-sans">Proporsi Terpilih:</span>
                    {is2F ? (
                      <span className="px-2.5 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200">
                        {item.proportions.fractionA}% Kasar (A) : {item.proportions.fractionB}% Halus (B)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                        {item.proportions.fractionA}% Kasar (A) : {item.proportions.fractionB}% Sedang (B) : {item.proportions.fractionC ?? 0}% Halus (C)
                      </span>
                    )}
                    <span className="text-slate-400 font-sans text-[11px]">
                      ({item.sieveData.length} Ukuran Saringan Input Tersimpan)
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* Edit Metadata */}
                  <button
                    onClick={() => setEditingItem(item)}
                    className="p-2 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 transition-colors"
                    title="Ubah identitas dan catatan proyek"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Duplicate Calculation */}
                  <button
                    onClick={() => handleDuplicate(item.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-purple-50 border border-slate-200 transition-colors"
                    title="Duplikasi perhitungan ini"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {/* Export Excel */}
                  <button
                    onClick={() => handleExportItemExcel(item)}
                    className="p-2 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors"
                    title="Ekspor ke spreadsheet Excel komprehensif (.xlsx)"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </button>

                  {/* Open in Report if callback exists */}
                  {onOpenReport && (
                    <button
                      onClick={() => onOpenReport(item)}
                      className="p-2 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 transition-colors"
                      title="Buka langsung di Format Laporan Resmi (Print / PDF)"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  )}

                  {/* Delete Item */}
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
                    title="Hapus riwayat perhitungan ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Primary Open Analysis Button */}
                  <button
                    onClick={() => onSelectHistory(item)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm ml-1"
                  >
                    <span>Buka Analisis</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Metadata Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm">Edit Data Identitas Perhitungan</h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Identitas Analisis / Kasus
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    Nama Proyek
                  </label>
                  <input
                    type="text"
                    value={editingItem.projectName || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, projectName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Penguji / Laboran
                  </label>
                  <input
                    type="text"
                    value={editingItem.engineerName || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, engineerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Lokasi Uji
                  </label>
                  <input
                    type="text"
                    value={editingItem.location || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    Nomor Dokumen
                  </label>
                  <input
                    type="text"
                    value={editingItem.documentNo || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, documentNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Catatan Teknis Rekayasa
                </label>
                <textarea
                  rows={3}
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-semibold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
