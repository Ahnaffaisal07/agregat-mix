import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Layers3, 
  RotateCcw, 
  Download, 
  Save, 
  CheckCircle2, 
  Sliders, 
  FileSpreadsheet, 
  HelpCircle, 
  LineChart as ChartIcon, 
  Sparkles, 
  GitCompare,
  TrendingUp,
  Info,
  FolderOpen
} from 'lucide-react';
import { SieveDataRow, BlendResultRow, BlendMethodType, CalculationHistoryItem } from '../../types';
import { PRESET_PDF_3_FRAKSI } from '../../core/presets';
import { 
  calculateBlendResults3F,
  analyzeRothfuchsTypeA,
  analyzeRothfuchsTypeB,
  RothfuchsTypeAGeometry,
  RothfuchsTypeBGeometry
} from '../../core/threeFractionEngine';
import { exportBlendToExcel } from '../../services/excelService';
import { saveCalculation, updateCalculation } from '../../services/storageService';
import { DataInputManager } from '../input/DataInputManager';
import { RothfuchsPlotInteractive } from './RothfuchsPlotInteractive';
import { NumericalOptimizationView } from './NumericalOptimizationView';
import { GradationChart } from '../common/GradationChart';
import { SaveCalculationModal } from '../common/SaveCalculationModal';

interface Fraksi3ViewProps {
  loadedItem?: CalculationHistoryItem | null;
  onClearLoaded?: () => void;
  onHistoryUpdate?: () => void;
}

export const Fraksi3View: React.FC<Fraksi3ViewProps> = ({
  loadedItem,
  onClearLoaded,
  onHistoryUpdate,
}) => {
  const [sieveData, setSieveData] = useState<SieveDataRow[]>(PRESET_PDF_3_FRAKSI);
  const [method, setMethod] = useState<BlendMethodType>('rothfuchs_tipe_a');
  const [activeProject, setActiveProject] = useState<CalculationHistoryItem | null>(loadedItem || null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  
  // State Proporsi Campuran (A = Kasar, B = Sedang, C = Halus)
  // Default Tipe A Murni dari Gambar 3.6 & Tabel 3.9 PDF: 31% Kasar, 35% Sedang, 34% Halus
  const [propA, setPropA] = useState<number>(31);
  const [propB, setPropB] = useState<number>(35);
  const [propC, setPropC] = useState<number>(34);

  // State Geometri Grafis Interaktif
  const [typeAPos, setTypeAPos] = useState<{ xCoarse: number; xFine: number }>({
    xCoarse: 69.0,
    xFine: 34.0,
  });

  const [typeBPoints, setTypeBPoints] = useState<{
    fineEnd: number;
    mediumStart: number;
    mediumEnd: number;
    coarseStart: number;
  }>({
    fineEnd: 53.0,
    mediumStart: 21.0,
    mediumEnd: 84.0,
    coarseStart: 64.0,
  });

  const [activeTab, setActiveTab] = useState<
    'input_data' | 'grafis_rothfuchs' | 'tabel' | 'perbandingan' | 'kurva_gradasi' | 'optimasi_numerik'
  >('input_data');
  const [showNotification, setShowNotification] = useState<string | null>(null);

  const gradationChartRef = useRef<HTMLDivElement | null>(null);

  // Analisis Geometri Rothfuchs Tipe A
  const geomA: RothfuchsTypeAGeometry = useMemo(() => {
    return analyzeRothfuchsTypeA(sieveData, typeAPos.xCoarse, typeAPos.xFine);
  }, [sieveData, typeAPos]);

  // Analisis Geometri Rothfuchs Tipe B
  const geomB: RothfuchsTypeBGeometry = useMemo(() => {
    return analyzeRothfuchsTypeB(sieveData, typeBPoints);
  }, [sieveData, typeBPoints]);

  // Sync when loadedItem changes
  useEffect(() => {
    if (loadedItem && loadedItem.mode === '3_fraksi') {
      setSieveData(loadedItem.sieveData);
      setPropA(loadedItem.proportions.fractionA);
      setPropB(loadedItem.proportions.fractionB);
      setPropC(loadedItem.proportions.fractionC ?? 0);
      setMethod(loadedItem.method);
      if (loadedItem.typeAPos) setTypeAPos(loadedItem.typeAPos);
      if (loadedItem.typeBPoints) setTypeBPoints(loadedItem.typeBPoints);
      setActiveProject(loadedItem);
      notify(`Berhasil memuat proyek "${loadedItem.name}" dari riwayat`);
    }
  }, [loadedItem]);

  // Handler update interaktif Tipe A
  const handleUpdateTypeAPosition = (xCoarse: number, xFine: number) => {
    setTypeAPos({ xCoarse, xFine });
    const g = analyzeRothfuchsTypeA(sieveData, xCoarse, xFine);
    setPropA(g.propCoarseA);
    setPropB(g.propMediumB);
    setPropC(g.propFineC);
  };

  // Handler update interaktif Tipe B
  const handleUpdateTypeBPoints = (newPts: {
    fineEnd?: number;
    mediumStart?: number;
    mediumEnd?: number;
    coarseStart?: number;
  }) => {
    const updated = { ...typeBPoints, ...newPts };
    setTypeBPoints(updated);
    const g = analyzeRothfuchsTypeB(sieveData, updated);
    setPropA(g.propCoarseA);
    setPropB(g.propMediumB);
    setPropC(g.propFineC);
  };

  // Perhitungan gradasi campuran 3 fraksi
  const blendCalculation = useMemo(() => {
    return calculateBlendResults3F(sieveData, propA, propB, propC);
  }, [sieveData, propA, propB, propC]);

  const blendResults = blendCalculation.results;
  const allPassing = blendCalculation.allPassing;

  // Presets PDF
  const applyPresetRothfuchsA_Murni = () => {
    setMethod('rothfuchs_tipe_a');
    setTypeAPos({ xCoarse: 69.0, xFine: 34.0 });
    setPropA(31);
    setPropB(35);
    setPropC(34);
    notify('Diterapkan: Rothfuchs Tipe A Grafis Murni (31% Kasar : 35% Sedang : 34% Halus) - Tabel 3.9');
  };

  const applyPresetRothfuchsA_Penyesuaian = () => {
    setMethod('rothfuchs_tipe_a');
    setPropA(30);
    setPropB(30);
    setPropC(40);
    notify('Diterapkan: Rothfuchs Tipe A Penyesuaian Rekayasa (30% Kasar : 30% Sedang : 40% Halus) - Tabel 3.10');
  };

  const applyPresetRothfuchsB = () => {
    setMethod('rothfuchs_tipe_b');
    setTypeBPoints({
      fineEnd: 53.0,
      mediumStart: 21.0,
      mediumEnd: 84.0,
      coarseStart: 64.0,
    });
    setPropA(20);
    setPropB(49);
    setPropC(31);
    notify('Diterapkan: Rothfuchs Tipe B (20% Kasar : 49% Sedang : 31% Halus) - Tabel 3.11');
  };

  const handleResetToPDF = () => {
    setSieveData(PRESET_PDF_3_FRAKSI);
    applyPresetRothfuchsA_Murni();
    setActiveProject(null);
    if (onClearLoaded) onClearLoaded();
    notify('Data saringan dan proporsi direset ke standar contoh PDF');
  };

  const handleApplyNumericalOpt = (a: number, b: number, c: number) => {
    setMethod('optimasi_numerik_3f');
    setPropA(a);
    setPropB(b);
    setPropC(c);
    notify(`Diterapkan Hasil Optimasi Numerik: ${a}% Kasar : ${b}% Sedang : ${c}% Halus`);
  };

  const handleExportExcel = () => {
    exportBlendToExcel({
      title: activeProject?.name || `Pencampuran 3 Fraksi (${
        method === 'rothfuchs_tipe_a'
          ? 'Rothfuchs Tipe A'
          : method === 'rothfuchs_tipe_b'
          ? 'Rothfuchs Tipe B'
          : 'Optimasi Numerik'
      })`,
      projectName: activeProject?.projectName || 'Pencampuran 3 Fraksi Agregat',
      engineerName: activeProject?.engineerName,
      location: activeProject?.location,
      documentNo: activeProject?.documentNo,
      methodName:
        method === 'rothfuchs_tipe_a'
          ? 'Metode Rothfuchs Tipe A'
          : method === 'rothfuchs_tipe_b'
          ? 'Metode Rothfuchs Tipe B'
          : 'Optimasi Numerik Kuadrat Terkecil',
      mode: '3_fraksi',
      proportions: { fractionA: propA, fractionB: propB, fractionC: propC },
      results: blendResults,
      sieveData,
      notes: activeProject?.notes,
    });
    notify('Hasil perhitungan 3 fraksi berhasil diekspor ke Excel');
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
        method,
        proportions: { fractionA: propA, fractionB: propB, fractionC: propC },
        sieveData,
        typeAPos,
        typeBPoints,
      });
      setActiveProject({
        ...activeProject,
        name: data.name,
        projectName: data.projectName,
        engineerName: data.engineerName,
        location: data.location,
        documentNo: data.documentNo,
        notes: data.notes,
        method,
        proportions: { fractionA: propA, fractionB: propB, fractionC: propC },
        sieveData,
        typeAPos,
        typeBPoints,
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
        mode: '3_fraksi',
        method,
        proportions: { fractionA: propA, fractionB: propB, fractionC: propC },
        sieveData,
        typeAPos,
        typeBPoints,
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

  // Recharts Chart Data (Diurutkan dari bukaan saringan terkecil ke terbesar)
  const chartData = useMemo(() => {
    return [...sieveData]
      .sort((a, b) => a.sieveSizeMm - b.sieveSizeMm)
      .map((row) => {
        const res = blendResults.find((r) => r.sieveName === row.sieveName);
        return {
          name: row.sieveName,
          sizeMm: row.sieveSizeMm,
          FraksiA: row.passingA,
          FraksiB: row.passingB,
          FraksiC: row.passingC ?? 0,
          Campuran: res?.combinedPassing ?? 0,
          SpekMin: row.specMin,
          SpekMax: row.specMax,
          GradasiTengah: row.specMid ?? Number(((row.specMin + row.specMax) / 2).toFixed(1)),
        };
      });
  }, [sieveData, blendResults]);

  // Perbandingan Tipe A Penyesuaian vs Tipe B (Tabel 3.12 PDF)
  const comparisonResults = useMemo(() => {
    const resA = calculateBlendResults3F(sieveData, 30, 30, 40).results;
    const resB = calculateBlendResults3F(sieveData, 20, 49, 31).results;
    return sieveData.map((s, idx) => ({
      sieveName: s.sieveName,
      sieveSizeMm: s.sieveSizeMm,
      specMin: s.specMin,
      specMax: s.specMax,
      specMid: s.specMid ?? Number(((s.specMin + s.specMax) / 2).toFixed(1)),
      tipeAPassing: resA[idx]?.combinedPassing ?? 0,
      tipeBPassing: resB[idx]?.combinedPassing ?? 0,
    }));
  }, [sieveData]);

  // Unduh Grafik Gradasi PNG
  const handleDownloadGradationChartPng = () => {
    if (!gradationChartRef.current) return;
    const svgEl = gradationChartRef.current.querySelector('svg');
    if (!svgEl) return;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);

    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = 'Kurva_Gradasi_3_Fraksi.png';
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{showNotification}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
            <Layers3 className="w-4 h-4" />
            <span>Pencampuran 3 Fraksi Agregat (Aggregate Blending)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Pencampuran 3 Fraksi Agregat: Kasar (A), Sedang (B), Halus (C)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mencakup Metode Grafis Rothfuchs Tipe A &amp; B (PDF Hal 7–17) serta Optimasi Numerik Komparatif.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={applyPresetRothfuchsA_Murni}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all"
            title="Muat proporsi 31:35:34 (Tabel 3.9 PDF)"
          >
            <span>Tipe A Murni (31:35:34)</span>
          </button>

          <button
            onClick={applyPresetRothfuchsA_Penyesuaian}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all"
            title="Muat penyesuaian 30:30:40 (Tabel 3.10 PDF)"
          >
            <span>Tipe A Sesuaikan (30:30:40)</span>
          </button>

          <button
            onClick={applyPresetRothfuchsB}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all"
            title="Muat proporsi 20:49:31 (Tabel 3.11 PDF)"
          >
            <span>Tipe B (20:49:31)</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Riwayat</span>
          </button>
        </div>
      </div>

      {/* Active Loaded Project Banner */}
      {activeProject && (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-emerald-950 flex items-center gap-2">
                <span>Proyek Aktif: {activeProject.name}</span>
                {activeProject.documentNo && (
                  <span className="font-mono text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-800">
                    {activeProject.documentNo}
                  </span>
                )}
              </div>
              <div className="text-emerald-700 text-[11px] mt-0.5">
                {activeProject.projectName ? `Proyek: ${activeProject.projectName} • ` : ''}
                Perubahan pada data saringan, proporsi, atau geometri grafis dapat diperbarui ke riwayat dengan tombol &quot;Simpan Riwayat&quot;.
              </div>
            </div>
          </div>
          <button
            onClick={handleResetToPDF}
            className="px-3 py-1.5 rounded-lg bg-white text-slate-700 hover:text-emerald-700 border border-emerald-200 font-semibold shadow-xs shrink-0 self-start md:self-auto"
          >
            Tutup Proyek &amp; Reset PDF
          </button>
        </div>
      )}

      {/* 3 Main Method Choice Selector */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pilih Metode Perhitungan:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {/* Option 1: Rothfuchs Tipe A */}
              <button
                onClick={() => {
                  setMethod('rothfuchs_tipe_a');
                  setActiveTab('grafis_rothfuchs');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  method === 'rothfuchs_tipe_a'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 ring-2 ring-blue-600/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Layers3 className="w-3.5 h-3.5" />
                <span>1. Rothfuchs Tipe A (Jarak Vertikal)</span>
              </button>

              {/* Option 2: Rothfuchs Tipe B */}
              <button
                onClick={() => {
                  setMethod('rothfuchs_tipe_b');
                  setActiveTab('grafis_rothfuchs');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  method === 'rothfuchs_tipe_b'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-600/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Layers3 className="w-3.5 h-3.5" />
                <span>2. Rothfuchs Tipe B (Garis Aproksimasi)</span>
              </button>

              {/* Option 3: Optimasi Numerik (Fitur Tambahan) */}
              <button
                onClick={() => {
                  setMethod('optimasi_numerik_3f');
                  setActiveTab('optimasi_numerik');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  method === 'optimasi_numerik_3f'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 ring-2 ring-purple-600/20'
                    : 'bg-slate-100 text-purple-700 hover:bg-purple-50 border border-purple-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>3. Optimasi Numerik (Fitur Tambahan)</span>
              </button>
            </div>
          </div>

          {/* Current Proportions Badge */}
          <div className="text-xs font-mono font-bold flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-red-50 text-red-700 border border-red-200">
              A (Kasar): {propA}%
            </span>
            <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
              B (Sedang): {propB}%
            </span>
            <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
              C (Halus): {propC}%
            </span>
            <span
              className={`px-2.5 py-1 rounded text-white ${
                propA + propB + propC === 100 ? 'bg-slate-900' : 'bg-red-600'
              }`}
            >
              Total: {propA + propB + propC}%
            </span>
          </div>
        </div>

        {/* 3 Interactive Sliders (Untuk fine-tuning manual) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
          {/* Slider A */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span className="text-red-700 font-bold">Fraksi A (Kasar):</span>
              <span className="font-mono text-red-600 font-bold">{propA}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={propA}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPropA(val);
                const rem = 100 - val;
                const newB = Math.min(propB, rem);
                setPropB(newB);
                setPropC(rem - newB);
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
          </div>

          {/* Slider B */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span className="text-blue-700 font-bold">Fraksi B (Sedang):</span>
              <span className="font-mono text-blue-600 font-bold">{propB}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={propB}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPropB(val);
                const rem = 100 - val;
                const newA = Math.min(propA, rem);
                setPropA(newA);
                setPropC(rem - newA);
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Slider C */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span className="text-amber-700 font-bold">Fraksi C (Halus):</span>
              <span className="font-mono text-amber-600 font-bold">{propC}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={propC}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPropC(val);
                const rem = 100 - val;
                const newA = Math.min(propA, rem);
                setPropA(newA);
                setPropB(rem - newA);
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-6 pt-3 rounded-t-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('input_data')}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'input_data'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Input Data 3 Fraksi (Manual &amp; Excel Import)</span>
        </button>

        <button
          onClick={() => setActiveTab('grafis_rothfuchs')}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'grafis_rothfuchs'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers3 className="w-4 h-4" />
          <span>
            Diagram Grafis Rothfuchs (1:2) –{' '}
            {method === 'rothfuchs_tipe_a' ? 'Tipe A' : 'Tipe B'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('optimasi_numerik')}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'optimasi_numerik'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Optimasi Numerik (Fitur Tambahan)</span>
        </button>

        <button
          onClick={() => setActiveTab('tabel')}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'tabel'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Tabel Gradasi Campuran</span>
        </button>

        <button
          onClick={() => setActiveTab('perbandingan')}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'perbandingan'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GitCompare className="w-4 h-4" />
          <span>Perbandingan Tipe A vs Tipe B (Tabel 3.12)</span>
        </button>

        <button
          onClick={() => setActiveTab('kurva_gradasi')}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'kurva_gradasi'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ChartIcon className="w-4 h-4" />
          <span>Kurva Gradasi Gabungan (S-Curve)</span>
        </button>
      </div>

      {/* TAB CONTENT 0: INPUT DATA MANAGER 3 FRAKSI */}
      {activeTab === 'input_data' && (
        <div className="bg-white rounded-b-2xl p-6 border border-t-0 border-slate-200/90 shadow-sm">
          <DataInputManager
            mode="3_fraksi"
            data={sieveData}
            onChange={setSieveData}
            onNotification={notify}
          />
        </div>
      )}

      {/* TAB CONTENT 1: DIAGRAM ROTHFUCHS 1:2 (SVG INTERAKTIF DENGAN DRAGGING & KOMPENSASI LUAS) */}
      {activeTab === 'grafis_rothfuchs' && (
        <div className="bg-white rounded-b-2xl p-6 border border-t-0 border-slate-200/90 shadow-sm space-y-6">
          <RothfuchsPlotInteractive
            sieveData={sieveData}
            method={method === 'rothfuchs_tipe_b' ? 'rothfuchs_tipe_b' : 'rothfuchs_tipe_a'}
            geomA={geomA}
            geomB={geomB}
            onUpdateTypeAPosition={handleUpdateTypeAPosition}
            onUpdateTypeBPoints={handleUpdateTypeBPoints}
          />

          {/* Status Box */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
            <div className="font-bold text-emerald-900 text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Status Gradasi Campuran Saat Ini:</span>
              <span className="font-mono text-emerald-800 font-bold">
                {propA}% Kasar : {propB}% Sedang : {propC}% Halus
              </span>
            </div>
            <div className="text-xs">
              {allPassing ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Seluruh ukuran saringan (100%) memenuhi batas spesifikasi agregat campuran.
                </span>
              ) : (
                <span className="text-amber-700 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  Terdapat {blendCalculation.failedCount} ukuran saringan di luar batas spesifikasi. Silakan geser garis konstruksi untuk penyesuaian rekayasa (engineering adjustment).
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: OPTIMASI NUMERIK (FITUR TAMBAHAN - NON-ROTHFUCHS) */}
      {activeTab === 'optimasi_numerik' && (
        <div className="bg-white rounded-b-2xl p-6 border border-t-0 border-slate-200/90 shadow-sm">
          <NumericalOptimizationView
            sieveData={sieveData}
            currentPropA={propA}
            currentPropB={propB}
            currentPropC={propC}
            onApplyProportions={handleApplyNumericalOpt}
          />
        </div>
      )}

      {/* TAB CONTENT 3: TABEL HASIL GRADASI 3 FRAKSI */}
      {activeTab === 'tabel' && (
        <div className="bg-white rounded-b-2xl p-6 border border-t-0 border-slate-200/90 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tabel Gradasi Campuran 3 Fraksi Agregat
              </h3>
              <p className="text-xs text-slate-500">
                Rumus Pembobotan: P_campuran = (PA &times; A) + (PB &times; B) + (PC &times; C) dengan PA + PB + PC = 100%.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-3 py-1 bg-slate-100 rounded text-slate-700">
              Proporsi: {propA}% A (Kasar) | {propB}% B (Sedang) | {propC}% C (Halus)
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-3 py-3">Nomor Saringan</th>
                  <th className="px-3 py-3">Ukuran (mm)</th>
                  <th className="px-3 py-3">Spek Min</th>
                  <th className="px-3 py-3">Spek Max</th>
                  <th className="px-3 py-3">Gradasi Tengah</th>
                  <th className="px-3 py-3 bg-red-50 text-red-800">Fraksi A ({propA}%)</th>
                  <th className="px-3 py-3 bg-blue-50 text-blue-800">Fraksi B ({propB}%)</th>
                  <th className="px-3 py-3 bg-amber-50 text-amber-800">Fraksi C ({propC}%)</th>
                  <th className="px-4 py-3 bg-slate-200/90 font-extrabold text-slate-900">
                    Gradasi Campuran
                  </th>
                  <th className="px-3 py-3 text-center">Status Spesifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
                {sieveData.map((row, idx) => {
                  const res = blendResults[idx];
                  return (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2.5 font-sans font-medium">{row.sieveName}</td>
                      <td className="px-3 py-2.5">{row.sieveSizeMm}</td>
                      <td className="px-3 py-2.5">{row.specMin}%</td>
                      <td className="px-3 py-2.5">{row.specMax}%</td>
                      <td className="px-3 py-2.5 text-slate-500">{res?.specMid.toFixed(1)}%</td>
                      <td className="px-3 py-2.5 bg-red-50/40 text-red-700 font-bold">
                        {res?.contribA.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2.5 bg-blue-50/40 text-blue-700 font-bold">
                        {res?.contribB.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2.5 bg-amber-50/40 text-amber-700 font-bold">
                        {res?.contribC?.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2.5 bg-slate-100 font-extrabold text-slate-900 text-sm">
                        {res?.combinedPassing.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2.5 text-center font-sans">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            res?.isPassingSpec
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}
                        >
                          {res?.isPassingSpec ? 'MEMENUHI' : 'OUT'}
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

      {/* TAB CONTENT 4: TABEL PERBANDINGAN TIPE A VS TIPE B (TABEL 3.12 PDF) */}
      {activeTab === 'perbandingan' && (
        <div className="bg-white rounded-b-2xl p-6 border border-t-0 border-slate-200/90 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Perbandingan Hasil Metode Rothfuchs Tipe A dan B (Sesuai Tabel 3.12 PDF)
            </h3>
            <p className="text-xs text-slate-500">
              Membandingkan gradasi campuran Tipe A Penyesuaian (30:30:40) dengan Tipe B (20:49:31) terhadap spesifikasi agregat.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Ukuran Saringan (mm)</th>
                  <th className="px-4 py-3">Nomor Saringan</th>
                  <th className="px-4 py-3">Spesifikasi Agregat</th>
                  <th className="px-4 py-3">Gradasi Tengah Spesifik</th>
                  <th className="px-4 py-3 bg-blue-50 text-blue-800 font-extrabold">
                    Gradasi Campuran Tipe A (30:30:40)
                  </th>
                  <th className="px-4 py-3 bg-emerald-50 text-emerald-800 font-extrabold">
                    Gradasi Campuran Tipe B (20:49:31)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
                {comparisonResults.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">{c.sieveSizeMm}</td>
                    <td className="px-4 py-3 font-sans font-medium">{c.sieveName}</td>
                    <td className="px-4 py-3">
                      {c.specMin} – {c.specMax}%
                    </td>
                    <td className="px-4 py-3 text-slate-500">{c.specMid.toFixed(1)}%</td>
                    <td className="px-4 py-3 bg-blue-50/40 text-blue-800 font-bold">
                      {c.tipeAPassing.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 bg-emerald-50/40 text-emerald-800 font-bold">
                      {c.tipeBPassing.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: KURVA GRADASI STANDAR RECHARTS */}
      {activeTab === 'kurva_gradasi' && (
        <div className="bg-white rounded-b-2xl p-6 border border-t-0 border-slate-200/90 shadow-sm">
          <GradationChart
            mode="3_fraksi"
            methodName={
              method === 'rothfuchs_tipe_a'
                ? 'Rothfuchs Tipe A (Keseimbangan Jarak Vertikal)'
                : method === 'rothfuchs_tipe_b'
                ? 'Rothfuchs Tipe B (Garis Aproksimasi & Hubung Silang)'
                : 'Optimasi Numerik (Kuadrat Terkecil)'
            }
            sieveData={sieveData}
            blendResults={blendResults}
            proportions={{ fractionA: propA, fractionB: propB, fractionC: propC }}
            title="Kurva Gradasi Campuran 3 Fraksi Agregat (S-Curve)"
            subtitle="Menampilkan kurva Fraksi Kasar (A), Sedang (B), Halus (C), Gradasi Campuran, Amplop Spesifikasi, dan Gradasi Tengah"
            showCardWrapper={false}
          />
        </div>
      )}
      {/* Save Modal */}
      <SaveCalculationModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveFromModal}
        mode="3_fraksi"
        method={method}
        proportions={{ fractionA: propA, fractionB: propB, fractionC: propC }}
        sieveCount={sieveData.length}
        isAllPassing={allPassing}
        existingItem={activeProject}
      />
    </div>
  );
};
