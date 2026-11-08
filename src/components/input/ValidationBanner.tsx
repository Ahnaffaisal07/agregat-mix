import React, { useState } from 'react';
import { ValidationResult } from '../../types/inputValidation';
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface ValidationBannerProps {
  validation: ValidationResult;
  totalRows: number;
}

export const ValidationBanner: React.FC<ValidationBannerProps> = ({ validation, totalRows }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (validation.isValid && validation.warningCount === 0) {
    return (
      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">
            Data Valid: Seluruh {totalRows} baris saringan memenuhi kriteria teknis dan siap digunakan untuk perhitungan blending.
          </span>
        </div>
        <span className="font-mono text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
          0 Error
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border shadow-sm text-xs transition-all ${
      validation.errorCount > 0
        ? 'bg-red-50 border-red-200 text-red-900'
        : 'bg-amber-50 border-amber-200 text-amber-900'
    }`}>
      {/* Header Bar */}
      <div className="p-3.5 flex items-center justify-between cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2.5">
          {validation.errorCount > 0 ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <div>
            <span className="font-bold">
              {validation.errorCount > 0
                ? `Ditemukan ${validation.errorCount} kesalahan data yang perlu diperbaiki sebelum perhitungan.`
                : `Terdapat ${validation.warningCount} peringatan pada data saringan.`}
            </span>
            <span className="text-[11px] block text-slate-500 font-normal mt-0.5">
              Klik untuk melihat rincian lokasi baris dan kolom yang bermasalah.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {validation.errorCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-200 text-red-900">
              {validation.errorCount} Error
            </span>
          )}
          {validation.warningCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-200 text-amber-900">
              {validation.warningCount} Peringatan
            </span>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </div>

      {/* Expanded Error Details List */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-red-200/60 divide-y divide-red-200/40 text-xs font-mono max-h-56 overflow-y-auto">
          {validation.errors.map((err, idx) => (
            <div key={`err_${idx}`} className="py-1.5 flex items-start gap-2">
              <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold shrink-0">
                {err.rowNumber > 0 ? `Baris ${err.rowNumber}` : 'Global'}
              </span>
              <span className="font-semibold text-red-800 shrink-0">[{err.columnName}]:</span>
              <span className="text-slate-700 font-sans">{err.message}</span>
            </div>
          ))}

          {validation.warnings.map((warn, idx) => (
            <div key={`warn_${idx}`} className="py-1.5 flex items-start gap-2">
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold shrink-0">
                {warn.rowNumber > 0 ? `Baris ${warn.rowNumber}` : 'Global'}
              </span>
              <span className="font-semibold text-amber-800 shrink-0">[{warn.columnName}]:</span>
              <span className="text-slate-700 font-sans">{warn.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
