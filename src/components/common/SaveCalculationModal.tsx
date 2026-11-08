import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  FileText, 
  Layers2, 
  Layers3, 
  CheckCircle2, 
  AlertTriangle,
  Building,
  User,
  MapPin,
  Hash
} from 'lucide-react';
import { BlendMethodType, CalculationHistoryItem } from '../../types';

interface SaveCalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    projectName: string;
    engineerName: string;
    location: string;
    documentNo: string;
    notes: string;
    isUpdateExisting?: boolean;
  }) => void;
  mode: '2_fraksi' | '3_fraksi';
  method: BlendMethodType;
  proportions: {
    fractionA: number;
    fractionB: number;
    fractionC?: number;
  };
  sieveCount: number;
  isAllPassing: boolean;
  existingItem?: CalculationHistoryItem | null;
}

export const SaveCalculationModal: React.FC<SaveCalculationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  mode,
  method,
  proportions,
  sieveCount,
  isAllPassing,
  existingItem,
}) => {
  const [name, setName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [engineerName, setEngineerName] = useState('Laboratorium Bahan Jalan');
  const [location, setLocation] = useState('Laboratorium Uji');
  const [documentNo, setDocumentNo] = useState('');
  const [notes, setNotes] = useState('');
  const [saveAsCopy, setSaveAsCopy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (existingItem) {
        setName(existingItem.name);
        setProjectName(existingItem.projectName || existingItem.name);
        setEngineerName(existingItem.engineerName || 'Laboratorium Bahan Jalan');
        setLocation(existingItem.location || 'Laboratorium Uji');
        setDocumentNo(existingItem.documentNo || `AMR-${Date.now().toString().slice(-6)}`);
        setNotes(existingItem.notes || '');
        setSaveAsCopy(false);
      } else {
        const defaultName =
          mode === '2_fraksi'
            ? `Pencampuran 2 Fraksi (${proportions.fractionA}% A : ${proportions.fractionB}% B)`
            : `Pencampuran 3 Fraksi (${proportions.fractionA}% : ${proportions.fractionB}% : ${proportions.fractionC ?? 0}%)`;
        setName(defaultName);
        setProjectName('Pekerjaan Lapis Perkerasan Aspal');
        setEngineerName('Laboratorium Bahan Jalan');
        setLocation('Seksi Uji Lapangan');
        setDocumentNo(`AMR-${Date.now().toString().slice(-6)}`);
        setNotes(
          mode === '2_fraksi'
            ? 'Hasil perhitungan metode grafis bujur sangkar 10x10 cm.'
            : method === 'rothfuchs_tipe_a'
            ? 'Hasil perhitungan metode Rothfuchs Tipe A (keseimbangan jarak).'
            : method === 'rothfuchs_tipe_b'
            ? 'Hasil perhitungan metode Rothfuchs Tipe B (garis aproksimasi).'
            : 'Hasil optimasi numerik least-squares.'
        );
        setSaveAsCopy(false);
      }
    }
  }, [isOpen, existingItem, mode, method, proportions]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      projectName: projectName.trim(),
      engineerName: engineerName.trim(),
      location: location.trim(),
      documentNo: documentNo.trim(),
      notes: notes.trim(),
      isUpdateExisting: Boolean(existingItem && !saveAsCopy),
    });
    onClose();
  };

  const getMethodLabel = (m: BlendMethodType) => {
    switch (m) {
      case 'bujur_sangkar_2f':
        return 'Bujur Sangkar 10x10 (2 Fraksi)';
      case 'rothfuchs_tipe_a':
        return 'Rothfuchs Tipe A (3 Fraksi)';
      case 'rothfuchs_tipe_b':
        return 'Rothfuchs Tipe B (3 Fraksi)';
      case 'optimasi_numerik_3f':
        return 'Optimasi Numerik (3 Fraksi)';
      default:
        return m;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Save className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {existingItem ? 'Simpan / Perbarui Perhitungan' : 'Simpan Perhitungan ke Riwayat'}
              </h3>
              <p className="text-xs text-slate-300">
                Data disimpan di Local Storage peramban bersama seluruh parameter input
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Summary Pill */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              {mode === '2_fraksi' ? (
                <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                  <Layers2 className="w-3.5 h-3.5" /> 2 Fraksi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                  <Layers3 className="w-3.5 h-3.5" /> 3 Fraksi
                </span>
              )}
              <span className="text-slate-600 font-medium">{getMethodLabel(method)}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                {mode === '2_fraksi'
                  ? `${proportions.fractionA}% A : ${proportions.fractionB}% B`
                  : `${proportions.fractionA}% : ${proportions.fractionB}% : ${proportions.fractionC ?? 0}%`}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                  isAllPassing ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isAllPassing ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" /> Lolos Spek
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" /> Perlu Tinjauan
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nama Perhitungan / Skenario <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Perancangan AC-WC Sta 14+200 (Variasi 1)"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  Nama Proyek / Paket Pekerjaan
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Contoh: Peningkatan Jalan Lintas Tengah"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Penguji / Laboran
                </label>
                <input
                  type="text"
                  value={engineerName}
                  onChange={(e) => setEngineerName(e.target.value)}
                  placeholder="Contoh: Tim Lab Bahan Jalan"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Lokasi Pengujian
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: Km 14+200 Ruas A"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  Nomor Dokumen Laporan
                </label>
                <input
                  type="text"
                  value={documentNo}
                  onChange={(e) => setDocumentNo(e.target.value)}
                  placeholder="Contoh: AMR-2026-001"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Catatan Teknis / Rekomendasi
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan hasil pengujian, justifikasi pemilihan proporsi, dll."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs resize-none"
              />
            </div>

            {existingItem && (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-blue-900">
                  <input
                    type="checkbox"
                    checked={saveAsCopy}
                    onChange={(e) => setSaveAsCopy(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span>Simpan sebagai perhitungan baru (duplikat), jangan menimpa yang lama</span>
                </label>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{existingItem && !saveAsCopy ? 'Perbarui Perhitungan' : 'Simpan Baru'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
