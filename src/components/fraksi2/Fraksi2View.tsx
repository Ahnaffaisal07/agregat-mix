import React, { useState, useMemo, useEffect } from 'react';
import { 
  Layers2, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Sliders, 
  FileSpreadsheet, 
  Keyboard, 
  LineChart as ChartIcon, 
  TableProperties,
  ArrowRight,
  FolderOpen
} from 'lucide-react';
import { SieveDataRow, CalculationHistoryItem } from '../../types/index';
import { PRESET_PDF_2_FRAKSI } from '../../core/presets';
import { 
  analyzeTwoFractionFeasibleRange, 
  calculateBlendResults2F 
} from '../../core/twoFractionEngine';
import { exportBlendToExcel } from '../../services/excelService';
import { saveCalculation, updateCalculation } from '../../services/storageService';
import { DataInputManager } from '../input/DataInputManager';
import { SquarePlotInteractive } from './SquarePlotInteractive';
import { GradationChart } from '../common/GradationChart';
import { SaveCalculationModal } from '../common/SaveCalculationModal';

interface Fraksi2ViewProps {
  loadedItem?: CalculationHistoryItem | null;
  onClearLoaded?: () => void;
  onHistoryUpdate?: () => void;
}

export const Fraksi2View: React.FC<Fraksi2ViewProps> = ({
  loadedItem,
  onClearLoaded,
  onHistoryUpdate,
}) => {
  const [sieveData, setSieveData] = useState<SieveDataRow[]>(PRESET_PDF_2_FRAKSI);
  const [propA, setPropA] = useState<number>(46); // Default 46% sesuai contoh resmi PDF
  const propB = 100 - propA;
  const [activeTab, setActiveTab] = useState<'input_data' | 'grafis_bujursangkar' | 'hasil_tabel' | 'kurva_gradasi'>('grafis_bujursangkar');
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<CalculationHistoryItem | null>(loadedItem || null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Sync if loadedItem changes
  useEffect(() => {
    if (loadedItem && loadedItem.mode === '2_fraksi') {
      setSieveData(loadedItem.sieveData);
      setPropA(loadedItem.proportions.fractionA);
      setActiveProject(loadedItem);
      notify(`Berhasil memuat proyek "${loadedItem.name}"`);
    }
  }, [loadedItem]);

  // Analisis daerah kelayakan (Feasible Range) otomatis berdasar kaidah grafis PDF
  const feasibleAnalysis = useMemo(() => {
    return analyzeTwoFractionFeasibleRange(sieveData);
  }, [sieveData]);

  // Perhitungan hasil gradasi campuran P = (PA * a) + (PB * b)
  const blendResults = useMemo(() => {
    return calculateBlendResults2F(sieveData, propA, propB);
  }, [sieveData, propA, propB]);

  const allPassing = blendResults.every((r) => r.isPassingSpec);
  const failedCount = blendResults.filter((r) => !r.isPassingSpec).length;

  const handleResetToPDF = () => {
    setSieveData(PRESET_PDF_2_FRAKSI);
    setPropA(46);
    setActiveProject(null);
    if (onClearLoaded) onClearLoaded();
    notify('Data saringan dan proporsi direset ke contoh resmi terverifikasi PDF (Tabel 3.1 & 3.2)');
  };

  const handleApplyRecommended = () => {
    if (feasibleAnalysis.hasFeasibleSolution) {
      setPropA(feasibleAnalysis.recommendedA);
      notify(`Proporsi disetel ke titik tengah daerah layak: ${feasibleAnalysis.recommendedA}% Kasar : ${feasibleAnalysis.recommendedB}% Halus`);
    } else {
      notify('Peringatan: Tidak ada titik tengah kelayakan karena spesifikasi saling bertentangan.');
    }
  };

  const handleExportExcel = () => {
    exportBlendToExcel({
      title: activeProject?.name || 'Pencampuran 2 Fraksi Agregat',
      projectName: activeProject?.projectName || 'Pencampuran 2 Fraksi Agregat',
      engineerName: activeProject?.engineerName,
      location: activeProject?.location,
      documentNo: activeProject?.documentNo,
      methodName: 'Metode Bujur Sangkar 10x10 cm',
      mode: '2_fraksi',
      proportions: { fractionA: propA, fractionB: propB },
      results: blendResults,
      sieveData,
      notes: activeProject?.notes,
    });
    notify('Berhasil mengekspor hasil gradasi campuran ke file Excel');
  };

  const handleSaveFromModal = (data: {
    name: string;
    projectName: string;
    engineerName: string;
    location: string;
    documentNo: string;
    notes: string;
    isUpdateExisting?: boolean;
  }) => {
    if (data.isUpdateExisting && activeProject) {
      updateCalculation(activeProject.id, {
        name: data.name,
        projectName: data.projectName,
        engineerName: data.engineerName,
        location: data.location,
        documentNo: data.documentNo,
        notes: data.notes,
        proportions: { fractionA: propA, fractionB: propB },
        sieveData,
      });
      setActiveProject({
        ...activeProject,
        name: data.name,
        projectName: data.projectName,
        engineerName: data.engineerName,
        location: data.location,
        documentNo: data.documentNo,
        notes: data.notes,
        proportions: { fractionA: propA, fractionB: propB },
        sieveData,
      });
      notify(`Perhitungan "${data.name}" berhasil diperbarui!`);
    } else {
      const newItem = saveCalculation({
        name: data.name,
        projectName: data.projectName,
        engineerName: data.engineerName,
        location: data.location,
        documentNo: data.documentNo,
        notes: data.notes,
        mode: '2_fraksi',
        method: 'bujur_sangkar_2f',
        proportions: { fractionA: propA, fractionB: propB },
        sieveData,
      });
      setActiveProject(newItem);
      notify(`Perhitungan "${data.name}" berhasil disimpan ke riwayat!`);
    }
    if (onHistoryUpdate) onHistoryUpdate();
  };

  const notify = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(null), 3500);
  };

  // Recharts Kurva Gradasi Standar
  const chartData = useMemo(() => {
    return [...blendResults].reverse().map((r, i) => {
      const orig = [...sieveData].reverse()[i];
      return {
        name: r.sieveName,
        size: r.sieveSizeMm,
        FraksiA: orig ? orig.passingA : 0,
        FraksiB: orig ? orig.passingB : 0,
        Campuran: r.combinedPassing,
        SpekMin: r.specMin,
        SpekMax: r.specMax,
        GradasiTengah: r.specMid,
      };
    });
  }, [blendResults, sieveData]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{showNotification}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
            <Layers2 className="w-4 h-4" />
            <span>Mode Pencampuran 2 Fraksi (Agregat A &amp; B)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Pencampuran 2 Fraksi Agregat (Metode Bujur Sangkar 10 × 10 cm)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis konstruksi grafis dan pembobotan matematis P_campuran = (P_A &times; A) + (P_B &times; B) sesuai PDF Halaman 1–6.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleResetToPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300/80 transition-all shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
            <span>Reset Contoh PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300/80 transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Riwayat</span>
          </button>
        </div>
      </div>

      {/* Active Loaded Project Banner */}
      {activeProject && (
        <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-blue-950 flex items-center gap-2">
                <span>Proyek Aktif: {activeProject.name}</span>
                {activeProject.documentNo && (
                  <span className="font-mono text-[10px] bg-blue-100 px-1.5 py-0.5 rounded text-blue-800">
                    {activeProject.documentNo}
                  </span>
                )}
              </div>
              <div className="text-blue-700 text-[11px] mt-0.5">
                {activeProject.projectName ? `Proyek: ${activeProject.projectName} • ` : ''}
                Perubahan pada proporsi atau data saringan dapat diperbarui ke riwayat perhitungan dengan menekan tombol &quot;Simpan Riwayat&quot;.
              </div>
            </div>
          </div>
          <button
            onClick={handleResetToPDF}
            className="px-3 py-1.5 rounded-lg bg-white text-slate-700 hover:text-blue-700 border border-blue-200 font-semibold shadow-xs shrink-0 self-start md:self-auto"
          >
            Tutup Proyek &amp; Reset PDF
          </button>
        </div>
      )}

      {/* Global Infeasible Warning Banner (if no proportion can meet specs) */}
      {!feasibleAnalysis.hasFeasibleSolution && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 shadow-sm flex items-start gap-3.5 text-red-900">
          <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">
              Peringatan: Tidak Ditemukan Daerah Proporsi yang Memenuhi Spesifikasi!
            </h4>
            <p className="text-xs text-red-800 leading-relaxed">
              Berdasarkan evaluasi seluruh ukuran saringan, tidak ada kombinasi proporsi pencampuran 2 fraksi yang dapat meloloskan seluruh saringan sekaligus. Saringan yang saling bertentangan adalah: <strong>{feasibleAnalysis.conflictingSieves.join(' dengan ')}</strong>. Hasil campuran saat ini TIDAK dapat dinyatakan memenuhi spesifikasi teknis.
            </p>
          </div>
        </div>
      )}

      {/* Proporsi Campuran Slider & Controller */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Pengaturan Proporsi Campuran (Blend Proportions)</span>
              </label>

              <div className="text-xs font-mono font-bold flex items-center gap-2">
                <span className="text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 shadow-xs">
                  Agregat A (Kasar): {propA}% ({(propA / 100).toFixed(2)})
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200 shadow-xs">
                  Agregat B (Halus): {propB}% ({(propB / 100).toFixed(2)})
                </span>
              </div>
            </div>

            {/* Slider Bar */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max="100"
                value={propA}
                onChange={(e) => setPropA(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>0% Kasar (100% Halus)</span>
                {feasibleAnalysis.hasFeasibleSolution ? (
                  <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    Daerah Layak Grafis: {feasibleAnalysis.minA}% - {feasibleAnalysis.maxA}% Kasar
                  </span>
                ) : (
                  <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                    Tidak Ada Daerah Layak
                  </span>
                )}
                <span>100% Kasar (0% Halus)</span>
              </div>
            </div>
          </div>

          <div className="border-l border-slate-200 pl-6 shrink-0 flex flex-col justify-center space-y-2">
            <button
              onClick={handleApplyRecommended}
              disabled={!feasibleAnalysis.hasFeasibleSolution}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-2 shadow-xs ${
                feasibleAnalysis.hasFeasibleSolution
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Gunakan Nilai Tengah: {feasibleAnalysis.recommendedA}% A</span>
            </button>
            <div className="text-[11px] text-slate-500">
              Status Campuran:{' '}
              {allPassing ? (
                <span className="text-emerald-600 font-bold">Semua Saringan Lolos Spek (PASS)</span>
              ) : (
                <span className="text-red-600 font-bold">{failedCount} Saringan Di Luar Spek</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-6 pt-3 rounded-t-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('grafis_bujursangkar')}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'grafis_bujursangkar'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers2 className="w-4 h-4" />
          <span>Diagram Bujur Sangkar 10×10 (Metode Grafis Asli)</span>
        </button>

        <button
          onClick={() => setActiveTab('hasil_tabel')}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'hasil_tabel'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TableProperties className="w-4 h-4" />
          <span>Tabel Gradasi Campuran Terhitung</span>
        </button>

        <button
          onClick={() => setActiveTab('kurva_gradasi')}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'kurva_gradasi'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ChartIcon className="w-4 h-4" />
          <span>Kurva Gradasi Standar (S-Curve)</span>
        </button>

        <button
          onClick={() => setActiveTab('input_data')}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'input_data'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Keyboard className="w-4 h-4" />
          <span>Edit &amp; Import Data Saringan</span>
        </button>
      </div>

      {/* TAB CONTENT 1: DIAGRAM BUJUR SANGKAR 10x10 GRAFIS ASLI */}
      {activeTab === 'grafis_bujursangkar' && (
        <div className="bg-white rounded-b-2xl p-6 border border-t-0 border-slate-200/90 shadow-sm">
          <SquarePlotInteractive
            sieveData={sieveData}
            analysis={feasibleAnalysis}
            selectedA={propA}
            onSelectA={setPropA}
          />
        </div>
      )}

      {/* TAB CONTENT 2: TABEL GRADASI CAMPURAN TERHITUNG */}
      {activeTab === 'hasil_tabel' && (
        <div className="bg-white rounded-b-2xl p-6 border border-t-0 border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tabel Gradasi Campuran Agregat (Sesuai Tabel 3.2 Halaman 6 PDF)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rumus pembobotan desimal: P_campuran = ({(propA / 100).toFixed(2)} &times; P_A) + ({(propB / 100).toFixed(2)} &times; P_B)
              </p>
            </div>

            <div className="text-xs font-mono font-bold flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                Proporsi A: {propA}% (0,{(propA < 10 ? '0' : '') + propA})
              </span>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                Proporsi B: {propB}% (0,{(propB < 10 ? '0' : '') + propB})
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Nomor Saringan</th>
                  <th className="px-4 py-3">Ukuran (mm)</th>
                  <th className="px-4 py-3">Spek Min (%)</th>
                  <th className="px-4 py-3">Spek Max (%)</th>
                  <th className="px-4 py-3 bg-red-50 text-red-800">
                    {(propA / 100).toFixed(2)} &times; Fraksi A
                  </th>
                  <th className="px-4 py-3 bg-blue-50 text-blue-800">
                    {(propB / 100).toFixed(2)} &times; Fraksi B
                  </th>
                  <th className="px-4 py-3 bg-slate-200 font-extrabold text-slate-900">
                    Gradasi Campuran (%)
                  </th>
                  <th className="px-4 py-3">Gradasi Tengah</th>
                  <th className="px-4 py-3 text-center">Deviasi Spek</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
                {blendResults.map((r, idx) => {
                  const devFromMid = Number((r.combinedPassing - r.specMid).toFixed(1));
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 font-sans font-medium">{r.sieveName}</td>
                      <td className="px-4 py-2.5">{r.sieveSizeMm}</td>
                      <td className="px-4 py-2.5">{r.specMin}</td>
                      <td className="px-4 py-2.5">{r.specMax}</td>
                      <td className="px-4 py-2.5 bg-red-50/40 text-red-700 font-bold">
                        {r.contribA.toFixed(1)}
                      </td>
                      <td className="px-4 py-2.5 bg-blue-50/40 text-blue-700 font-bold">
                        {r.contribB.toFixed(1)}
                      </td>
                      <td className="px-4 py-2.5 bg-slate-100 font-extrabold text-slate-900 text-sm">
                        {r.combinedPassing.toFixed(1)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">{r.specMid.toFixed(1)}</td>
                      <td className="px-4 py-2.5 text-center text-slate-500">
                        {devFromMid > 0 ? `+${devFromMid}` : devFromMid}
                      </td>
                      <td className="px-4 py-2.5 text-center font-sans">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.isPassingSpec
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}
                        >
                          {r.isPassingSpec ? 'MEMENUHI' : 'OUT'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: KURVA GRADASI STANDAR RECHARTS */}
      {activeTab === 'kurva_gradasi' && (
        <div className="bg-white rounded-b-2xl p-6 border border-t-0 border-slate-200/90 shadow-sm">
          <GradationChart
            mode="2_fraksi"
            methodName="Metode Bujur Sangkar 10 × 10 cm (PDF Hal 1–5)"
            sieveData={sieveData}
            blendResults={blendResults}
            proportions={{ fractionA: propA, fractionB: propB }}
            title="Kurva Gradasi Campuran 2 Fraksi Agregat (S-Curve)"
            subtitle="Menampilkan kurva Fraksi Kasar (A), Fraksi Halus (B), Gradasi Campuran, Amplop Spesifikasi, dan Gradasi Tengah"
            showCardWrapper={false}
          />
        </div>
      )}

      {/* TAB CONTENT 4: INPUT DATA SARIANGAN */}
      {activeTab === 'input_data' && (
        <div className="bg-white rounded-b-2xl p-6 border border-t-0 border-slate-200/90 shadow-sm">
          <DataInputManager
            mode="2_fraksi"
            data={sieveData}
            onChange={setSieveData}
            onNotification={notify}
          />
        </div>
      )}
      {/* Save Modal */}
      <SaveCalculationModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveFromModal}
        mode="2_fraksi"
        method="bujur_sangkar_2f"
        proportions={{ fractionA: propA, fractionB: propB }}
        sieveCount={sieveData.length}
        isAllPassing={allPassing}
        existingItem={activeProject}
      />
    </div>
  );
};
