import React, { useState, useMemo } from 'react';
import { SieveDataRow } from '../../types';
import { ManualInputTable } from './ManualInputTable';
import { ExcelImportTab } from './ExcelImportTab';
import { ValidationBanner } from './ValidationBanner';
import { validateSieveDataset } from '../../core/validationEngine';
import { 
  Keyboard, 
  FileSpreadsheet, 
  Download, 
  Layers2, 
  Layers3, 
  CheckCircle2 
} from 'lucide-react';
import { downloadTemplate2Fraksi, downloadTemplate3Fraksi } from '../../services/templateService';

interface DataInputManagerProps {
  mode: '2_fraksi' | '3_fraksi';
  data: SieveDataRow[];
  onChange: (updated: SieveDataRow[]) => void;
  onNotification?: (msg: string) => void;
}

export const DataInputManager: React.FC<DataInputManagerProps> = ({
  mode,
  data,
  onChange,
  onNotification,
}) => {
  const is2F = mode === '2_fraksi';
  const [activeTab, setActiveTab] = useState<'manual' | 'excel'>('manual');

  // Validasi real-time untuk data aktif
  const validation = useMemo(() => {
    return validateSieveDataset(data, mode);
  }, [data, mode]);

  const handleImportSuccess = (importedRows: SieveDataRow[]) => {
    onChange(importedRows);
    setActiveTab('manual'); // Pindah otomatis ke tab manual agar pengguna dapat langsung melihat dan mengedit
    if (onNotification) {
      onNotification(`Berhasil mengimpor ${importedRows.length} data saringan dari Excel! Data kini dapat diedit.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'manual'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-4 h-4 text-blue-600" />
            <span>TAB 1: INPUT MANUAL</span>
          </button>

          <button
            onClick={() => setActiveTab('excel')}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'excel'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>TAB 2: EXCEL IMPORT (.xlsx, .xls, .csv)</span>
          </button>
        </div>

        {/* Quick Template Download Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => (is2F ? downloadTemplate2Fraksi() : downloadTemplate3Fraksi())}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download Template {is2F ? '2 Fraksi' : '3 Fraksi'}</span>
          </button>
        </div>
      </div>

      {/* Validation Banner (Always visible in Tab 1) */}
      {activeTab === 'manual' && (
        <ValidationBanner validation={validation} totalRows={data.length} />
      )}

      {/* TAB 1: INPUT MANUAL */}
      {activeTab === 'manual' && (
        <ManualInputTable
          mode={mode}
          data={data}
          onChange={onChange}
          validation={validation}
          onNotification={onNotification}
        />
      )}

      {/* TAB 2: EXCEL IMPORT */}
      {activeTab === 'excel' && (
        <ExcelImportTab
          mode={mode}
          onImportSuccess={handleImportSuccess}
          onNotification={onNotification}
        />
      )}
    </div>
  );
};
