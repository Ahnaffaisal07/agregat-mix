import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Calendar, 
  FileSpreadsheet,
  Layers2,
  Layers3,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Download,
  Building,
  User,
  MapPin,
  Hash,
  ShieldCheck,
  Check,
  XCircle,
  TrendingUp,
  Sliders,
  Scale
} from 'lucide-react';
import { 
  CalculationHistoryItem, 
  SieveDataRow, 
  BlendResultRow, 
  BlendMethodType 
} from '../../types';
import { PRESET_PDF_2_FRAKSI, PRESET_PDF_3_FRAKSI } from '../../core/presets';
import { calculateBlendResults2F, analyzeTwoFractionFeasibleRange } from '../../core/twoFractionEngine';
import { calculateBlendResults3F, analyzeRothfuchsTypeA, analyzeRothfuchsTypeB } from '../../core/threeFractionEngine';
import { exportBlendToExcel } from '../../services/excelService';
import { downloadTemplate2Fraksi, downloadTemplate3Fraksi } from '../../services/templateService';
import { GradationChart } from '../common/GradationChart';
import { SquarePlotInteractive } from '../fraksi2/SquarePlotInteractive';
import { RothfuchsPlotInteractive } from '../fraksi3/RothfuchsPlotInteractive';

interface LaporanViewProps {
  loadedProject?: CalculationHistoryItem | null;
  historyList?: CalculationHistoryItem[];
  onSelectProject?: (item: CalculationHistoryItem) => void;
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  loadedProject,
  historyList = [],
  onSelectProject,
}) => {
  // Mode & Project Identity
  const [selectedProjectId, setSelectedProjectId] = useState<string>('preset_2f');
  const [reportMode, setReportMode] = useState<'2_fraksi' | '3_fraksi'>('2_fraksi');
  const [method, setMethod] = useState<BlendMethodType>('bujur_sangkar_2f');
  
  const [projectName, setProjectName] = useState('Peningkatan Jalan Lintas Wilayah (AC-WC)');
  const [engineerName, setEngineerName] = useState('Laboratorium Pengujian Bahan Jalan');
  const [location, setLocation] = useState('Sta 14+200 Ruas A');
  const [documentNo, setDocumentNo] = useState('AMR-2026-001');
  const [notes, setNotes] = useState('Perancangan proporsi campuran agregat berdasarkan kaidah metode grafis.');

  // Sieve Data & Proportions
  const [sieveData, setSieveData] = useState<SieveDataRow[]>(PRESET_PDF_2_FRAKSI);
  const [propA, setPropA] = useState<number>(46);
  const [propB, setPropB] = useState<number>(54);
  const [propC, setPropC] = useState<number>(0);

  // Geometric state for Rothfuchs
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

  // Load from props if provided
  useEffect(() => {
    if (loadedProject) {
      applyProjectData(loadedProject);
      setSelectedProjectId(loadedProject.id);
    }
  }, [loadedProject]);

  const applyProjectData = (item: CalculationHistoryItem) => {
    setReportMode(item.mode);
    setMethod(item.method);
    setProjectName(item.projectName || item.name);
    setEngineerName(item.engineerName || 'Laboratorium Pengujian Bahan Jalan');
    setLocation(item.location || 'Laboratorium Uji');
    setDocumentNo(item.documentNo || `AMR-${item.id}`);
    setNotes(item.notes || '');
    setSieveData(item.sieveData);
    setPropA(item.proportions.fractionA);
    setPropB(item.proportions.fractionB);
    setPropC(item.proportions.fractionC ?? 0);
    if (item.typeAPos) setTypeAPos(item.typeAPos);
    if (item.typeBPoints) setTypeBPoints(item.typeBPoints);
  };

  const handleSelectPresetOrHistory = (id: string) => {
    setSelectedProjectId(id);
    if (id === 'preset_2f') {
      setReportMode('2_fraksi');
      setMethod('bujur_sangkar_2f');
      setProjectName('Pencampuran 2 Fraksi Agregat - Contoh Materi PDF (Tabel 3.1 & 3.2)');
      setEngineerName('Laboratorium Perkerasan & Bahan Jalan');
      setLocation('Km 14+200');
      setDocumentNo('AMR-2026-PDF2F');
      setNotes('Perhitungan grafis bujur sangkar 10x10 cm. 46% Agregat Kasar dan 54% Agregat Halus.');
      setSieveData(PRESET_PDF_2_FRAKSI);
      setPropA(46);
      setPropB(54);
      setPropC(0);
    } else if (id === 'preset_3f_a') {
      setReportMode('3_fraksi');
      setMethod('rothfuchs_tipe_a');
      setProjectName('Pencampuran 3 Fraksi - Rothfuchs Tipe A Penyesuaian (Tabel 3.10 PDF)');
      setEngineerName('Laboratorium Perkerasan & Bahan Jalan');
      setLocation('Ruas Jalan Provinsi');
      setDocumentNo('AMR-2026-PDF3FA');
      setNotes('Penyesuaian teknis proporsi menjadi 30% Kasar : 30% Sedang : 40% Halus agar aman.');
      setSieveData(PRESET_PDF_3_FRAKSI);
      setPropA(30);
      setPropB(30);
      setPropC(40);
      setTypeAPos({ xCoarse: 69.0, xFine: 34.0 });
    } else if (id === 'preset_3f_b') {
      setReportMode('3_fraksi');
      setMethod('rothfuchs_tipe_b');
      setProjectName('Pencampuran 3 Fraksi - Rothfuchs Tipe B (Tabel 3.11 PDF)');
      setEngineerName('Laboratorium Perkerasan & Bahan Jalan');
      setLocation('Ruas Jalur Pantura');
      setDocumentNo('AMR-2026-PDF3FB');
      setNotes('Metode Rothfuchs Tipe B menghasilkan 20% Kasar : 49% Sedang : 31% Halus.');
      setSieveData(PRESET_PDF_3_FRAKSI);
      setPropA(20);
      setPropB(49);
      setPropC(31);
      setTypeBPoints({ fineEnd: 53.0, mediumStart: 21.0, mediumEnd: 84.0, coarseStart: 64.0 });
    } else {
      const found = historyList.find((h) => h.id === id);
      if (found) {
        applyProjectData(found);
        if (onSelectProject) onSelectProject(found);
      }
    }
  };

  // Perhitungan Hasil Gradasi Campuran Aktual (Bukan Statis)
  const results: BlendResultRow[] = useMemo(() => {
    if (reportMode === '2_fraksi') {
      return calculateBlendResults2F(sieveData, propA, propB);
    } else {
      return calculateBlendResults3F(sieveData, propA, propB, propC).results;
    }
  }, [reportMode, sieveData, propA, propB, propC]);

  // Analisis 2 Fraksi Feasible Range
  const analysis2F = useMemo(() => {
    return analyzeTwoFractionFeasibleRange(sieveData);
  }, [sieveData]);

  // Geometri Rothfuchs 3 Fraksi
  const geom3F_A = useMemo(() => {
    return analyzeRothfuchsTypeA(sieveData, typeAPos.xCoarse, typeAPos.xFine);
  }, [sieveData, typeAPos]);

  const geom3F_B = useMemo(() => {
    return analyzeRothfuchsTypeB(sieveData, typeBPoints);
  }, [sieveData, typeBPoints]);

  // Evaluasi Kelolosan & Statistik Deviasi
  const allPassing = results.every((r) => r.isPassingSpec);
  const failedCount = results.filter((r) => !r.isPassingSpec).length;

  let totalDev = 0;
  let maxDev = 0;
  let criticalSieve = results[0];
  let minMargin = 999;

  results.forEach((r) => {
    const dev = Math.abs(r.combinedPassing - r.specMid);
    totalDev += dev;
    if (dev > maxDev) maxDev = dev;

    const marginLower = r.combinedPassing - r.specMin;
    const marginUpper = r.specMax - r.combinedPassing;
    const currentMargin = Math.min(marginLower, marginUpper);
    if (currentMargin < minMargin) {
      minMargin = currentMargin;
      criticalSieve = r;
    }
  });

  const meanDev = results.length > 0 ? (totalDev / results.length).toFixed(1) : '0.0';

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportBlendToExcel({
      title: projectName,
      projectName,
      engineerName,
      location,
      documentNo,
      methodName:
        reportMode === '2_fraksi'
          ? 'Metode Grafis Bujur Sangkar 10x10 cm'
          : method === 'rothfuchs_tipe_a'
          ? 'Metode Rothfuchs Tipe A'
          : method === 'rothfuchs_tipe_b'
          ? 'Metode Rothfuchs Tipe B'
          : 'Optimasi Numerik Least-Squares',
      mode: reportMode,
      proportions:
        reportMode === '2_fraksi'
          ? { fractionA: propA, fractionB: propB }
          : { fractionA: propA, fractionB: propB, fractionC: propC },
      results,
      sieveData,
      notes,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* TOOLBAR CONTROLS (HIDDEN DURING PRINT) */}
      <div className="no-print bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>Format Laporan Resmi Teknik Sipil (SNI / Bina Marga / ASTM)</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Laporan Rekayasa Pencampuran Agregat (Aggregate Blending Report)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              13 bagian terstruktur (A s/d M) dengan kalkulasi aktual, tabel gradasi, kurva gradasi, dan diagram grafis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all shadow-xs"
              title="Unduh laporan lengkap dalam format Excel multi-sheet (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Unduh Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-md"
              title="Cetak langsung ke kertas fisik atau Simpan sebagai PDF"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>

        {/* Source Project Selector & Template Downloads */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <span className="font-semibold text-slate-600 whitespace-nowrap flex items-center gap-1">
              <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
              Pilih Data Proyek:
            </span>
            <select
              value={selectedProjectId}
              onChange={(e) => handleSelectPresetOrHistory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <optgroup label="Skenario Terverifikasi Contoh PDF">
                <option value="preset_2f">[PDF 2 Fraksi] Bujur Sangkar 10x10 (Tabel 3.1 &amp; 3.2)</option>
                <option value="preset_3f_a">[PDF 3 Fraksi] Rothfuchs Tipe A Penyesuaian (Tabel 3.10)</option>
                <option value="preset_3f_b">[PDF 3 Fraksi] Rothfuchs Tipe B (Tabel 3.11)</option>
              </optgroup>
              {historyList.length > 0 && (
                <optgroup label="Riwayat Perhitungan Local Storage">
                  {historyList.map((h) => (
                    <option key={h.id} value={h.id}>
                      [{h.mode === '2_fraksi' ? '2F' : '3F'}] {h.name} ({h.timestamp})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Download Template:</span>
            <button
              onClick={downloadTemplate2Fraksi}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
            >
              Template 2F
            </button>
            <button
              onClick={downloadTemplate3Fraksi}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              Template 3F
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PRINTABLE OFFICIAL REPORT DOCUMENT (A4 SHEET STYLING)
          ========================================================================= */}
      <div className="bg-white rounded-2xl p-8 md:p-12 border border-slate-300 shadow-xl print:shadow-none print:border-none print:p-0 space-y-8 font-sans text-slate-800 leading-normal">
        
        {/* =====================================================================
            BAGIAN A: HALAMAN JUDUL & KOP RESMI
            ===================================================================== */}
        <section className="report-section border-b-2 border-slate-900 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-black tracking-widest uppercase text-blue-700">
                LABORATORIUM PERKERASAN &amp; BAHAN TEKNIK SIPIL
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 mt-1 uppercase">
                LAPORAN RESMI REKAYASA PENCAMPURAN AGREGAT
              </h1>
              <div className="text-sm font-bold text-slate-600">
                AGGREGATE BLENDING ENGINEERING REPORT &bull; JOB MIX DESIGN (JMD)
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Standar Acuan Metodologi: Modul Analisa Saringan &amp; Metode Grafis (materi-pencampuran-agregat.pdf)
              </div>
            </div>

            <div className="text-right text-xs space-y-1.5 shrink-0">
              <div className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                NO. DOKUMEN: {documentNo}
              </div>
              <div className="text-slate-500 flex items-center justify-end gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {new Date().toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                    allPassing
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  STATUS: {allPassing ? 'TERVERIFIKASI MEMENUHI' : 'PERLU PENYESUAIAN'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            BAGIAN B: IDENTITAS PROYEK
            ===================================================================== */}
        <section className="report-section space-y-2">
          <div className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[10px]">B</span>
            <span>IDENTITAS PROYEK &amp; PENGUJIAN (PROJECT IDENTIFICATION)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                Nama Pekerjaan / Proyek:
              </span>
              <span className="font-bold text-slate-900 text-sm">{projectName}</span>
            </div>

            <div>
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                Penguji / Laboran:
              </span>
              <span className="font-bold text-slate-900 text-sm">{engineerName}</span>
            </div>

            <div>
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                Lokasi Pengujian:
              </span>
              <span className="font-medium text-slate-800">{location}</span>
            </div>

            <div>
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                Standar Spesifikasi Acuan:
              </span>
              <span className="font-medium text-slate-800">
                Spesifikasi Umum Bina Marga / SNI 03-1968 / ASTM C136
              </span>
            </div>
          </div>
        </section>

        {/* =====================================================================
            BAGIAN C: METODE YANG DIGUNAKAN
            ===================================================================== */}
        <section className="report-section space-y-2">
          <div className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[10px]">C</span>
            <span>METODE YANG DIGUNAKAN (APPLIED METHODOLOGY)</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">
                {reportMode === '2_fraksi'
                  ? 'Metode Grafis Bujur Sangkar 10 × 10 cm (2 Fraksi Agregat)'
                  : method === 'rothfuchs_tipe_a'
                  ? 'Metode Grafis Rothfuchs Tipe A (Keseimbangan Jarak Vertikal)'
                  : method === 'rothfuchs_tipe_b'
                  ? 'Metode Grafis Rothfuchs Tipe B (Garis Aproksimasi & Hubung Silang)'
                  : 'Metode Optimasi Numerik Kuadrat Terkecil (Least-Squares)'}
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[10px] font-bold">
                {reportMode === '2_fraksi' ? '2 Fraksi (Kasar & Halus)' : '3 Fraksi (Kasar, Sedang, Halus)'}
              </span>
            </div>

            <p className="text-slate-600 leading-relaxed text-[11px]">
              {reportMode === '2_fraksi'
                ? 'Konstruksi grafis bujur sangkar 10 × 10 cm menempatkan persen lolos Agregat A (Kasar) pada sumbu kanan dan Agregat B (Halus) pada sumbu kiri. Garis yang menghubungkan ukuran saringan yang sama dipotongkan dengan batas spesifikasi untuk mendefinisikan daerah kelayakan proporsi dan garis tengah terpilih.'
                : method === 'rothfuchs_tipe_a'
                ? 'Metode Rothfuchs Tipe A menggunakan bidang persegi panjang rasio 1:2 dengan garis diagonal sebagai gradasi tengah spesifikasi. Proporsi fraksi kasar dan halus ditentukan melalui garis tegak lurus dengan prinsip keseimbangan jarak / luasan terhadap kurva gradasi.'
                : 'Metode Rothfuchs Tipe B membuat garis aproksimasi lurus dengan kompensasi luasan setara untuk fraksi kasar dan halus, kemudian menghubungkan titik-titik ujung secara silang hingga memotong garis diagonal tengah untuk menentukan proporsi pembagian 3 fraksi.'}
            </p>
          </div>
        </section>

        {/* =====================================================================
            BAGIAN D: DATA HASIL ANALISIS SARINGAN AGREGAT AWAL
            ===================================================================== */}
        <section className="report-section space-y-2">
          <div className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[10px]">D</span>
            <span>DATA HASIL ANALISIS SARINGAN AGREGAT AWAL (INITIAL SIEVE DATA)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300">Nomor Saringan</th>
                  <th className="p-2 border-r border-slate-300 text-right">Ukuran (mm)</th>
                  <th className="p-2 border-r border-slate-300 text-right text-red-700 bg-red-50/50">
                    Lolos Agregat A (Kasar) (%)
                  </th>
                  <th className="p-2 border-r border-slate-300 text-right text-blue-700 bg-blue-50/50">
                    {reportMode === '2_fraksi' ? 'Lolos Agregat B (Halus) (%)' : 'Lolos Agregat B (Sedang) (%)'}
                  </th>
                  {reportMode === '3_fraksi' && (
                    <th className="p-2 border-r border-slate-300 text-right text-amber-700 bg-amber-50/50">
                      Lolos Agregat C (Halus) (%)
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {sieveData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2 border-r border-slate-200 font-sans font-medium text-slate-900">
                      {row.sieveName}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right">{row.sieveSizeMm}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-bold text-red-900">
                      {row.passingA.toFixed(1)}%
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-bold text-blue-900">
                      {row.passingB.toFixed(1)}%
                    </td>
                    {reportMode === '3_fraksi' && (
                      <td className="p-2 border-r border-slate-200 text-right font-bold text-amber-900">
                        {(row.passingC ?? 0).toFixed(1)}%
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* =====================================================================
            BAGIAN E: SPESIFIKASI AGREGAT
            ===================================================================== */}
        <section className="report-section space-y-2">
          <div className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[10px]">E</span>
            <span>AMPLOP SPESIFIKASI GRADASI CAMPURAN (AGGREGATE SPECIFICATIONS)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300">Nomor Saringan</th>
                  <th className="p-2 border-r border-slate-300 text-right">Ukuran (mm)</th>
                  <th className="p-2 border-r border-slate-300 text-right text-slate-700">
                    Batas Bawah Min (%)
                  </th>
                  <th className="p-2 border-r border-slate-300 text-right text-blue-700 bg-blue-50/40">
                    Gradasi Tengah Target (%)
                  </th>
                  <th className="p-2 border-r border-slate-300 text-right text-slate-700">
                    Batas Atas Max (%)
                  </th>
                  <th className="p-2 text-right">Rentang Toleransi (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {sieveData.map((row, idx) => {
                  const mid = row.specMid ?? Number(((row.specMin + row.specMax) / 2).toFixed(1));
                  const range = row.specMax - row.specMin;
                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 font-sans font-medium text-slate-900">
                        {row.sieveName}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right">{row.sieveSizeMm}</td>
                      <td className="p-2 border-r border-slate-200 text-right">{row.specMin}%</td>
                      <td className="p-2 border-r border-slate-200 text-right font-bold text-blue-900 bg-blue-50/20">
                        {mid.toFixed(1)}%
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right">{row.specMax}%</td>
                      <td className="p-2 text-right text-slate-500">&plusmn;{(range / 2).toFixed(1)}% ({range}%)</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* =====================================================================
            BAGIAN F: DASAR DAN RUMUS PERHITUNGAN
            ===================================================================== */}
        <section className="report-section space-y-2">
          <div className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[10px]">F</span>
            <span>DASAR DAN RUMUS PERHITUNGAN (MATHEMATICAL FOUNDATION)</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3 font-mono">
            <div className="font-sans font-bold text-slate-800 text-[11px]">
              1. Persamaan Pembobotan Gradasi Campuran:
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-900">
              {reportMode === '2_fraksi' ? (
                <div>
                  P_campuran = (a &times; P_A) + (b &times; P_B)<br />
                  <span className="text-slate-500 text-[10px] font-sans">
                    di mana a = proporsi Agregat Kasar (A), b = proporsi Agregat Halus (B), dengan syarat: a + b = 100%
                  </span>
                </div>
              ) : (
                <div>
                  P_campuran = (a &times; P_A) + (b &times; P_B) + (c &times; P_C)<br />
                  <span className="text-slate-500 text-[10px] font-sans">
                    di mana a = Kasar, b = Sedang, c = Halus, dengan syarat: a + b + c = 100%
                  </span>
                </div>
              )}
            </div>

            <div className="font-sans font-bold text-slate-800 text-[11px] pt-1">
              2. Kriteria Evaluasi Kelolosan Saringan (Specification Check):
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-700">
              Batas_Bawah &le; P_campuran &le; Batas_Atas &nbsp;&rArr;&nbsp; Status = MEMENUHI (PASS)
            </div>
          </div>
        </section>

        {/* =====================================================================
            BAGIAN G: TAHAPAN PERHITUNGAN
            ===================================================================== */}
        <section className="report-section space-y-2">
          <div className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[10px]">G</span>
            <span>TAHAPAN PERHITUNGAN METODE GRAFIS (STEP-BY-STEP PROCEDURE)</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2 text-[11px] leading-relaxed">
            {reportMode === '2_fraksi' ? (
              <ol className="list-decimal pl-5 space-y-1.5">
                <li>Melakukan uji analisis saringan laboratorium untuk Agregat Kasar (A) dan Agregat Halus (B).</li>
                <li>Membuat bidang bujur sangkar berskala proporsional 0–100% pada sumbu horizontal dan vertikal.</li>
                <li>Menempatkan persen lolos Agregat A pada sumbu vertikal kanan dan Agregat B pada sumbu vertikal kiri.</li>
                <li>Menghubungkan titik persen lolos kedua agregat dengan garis lurus untuk ukuran saringan yang sama.</li>
                <li>Menandai titik batas spesifikasi (bawah dan atas) pada setiap garis ukuran saringan.</li>
                <li>Menarik garis proyeksi vertikal untuk menentukan batas kiri dan kanan daerah proporsi yang memenuhi seluruh spesifikasi.</li>
                <li>Mengambil garis tengah (rekomendasi) sebagai proporsi rancangan pencampuran agregat.</li>
                <li>Menghitung gradasi campuran gabungan dan memeriksa kesesuaian terhadap amplop spesifikasi.</li>
              </ol>
            ) : (
              <ol className="list-decimal pl-5 space-y-1.5">
                <li>Melakukan uji saringan laboratorium untuk ketiga fraksi agregat: Kasar (A), Sedang (B), dan Halus (C).</li>
                <li>Membuat bidang persegi panjang dengan perbandingan sisi 1:2 sesuai kaidah metode Rothfuchs.</li>
                <li>Menggambar garis diagonal utama sebagai representasi gradasi tengah spesifikasi.</li>
                <li>Memplot kurva persen lolos kumulatif dari masing-masing fraksi agregat pada bidang grafis.</li>
                <li>
                  {method === 'rothfuchs_tipe_a'
                    ? 'Menarik garis vertikal pembatas dengan menyeimbangkan luas/jarak penyimpangan kurva agregat terhadap garis diagonal (Rothfuchs Tipe A).'
                    : 'Membuat garis lurus aproksimasi kompensasi luasan setara, menghubungkan titik-titik ujung secara silang hingga memotong garis diagonal (Rothfuchs Tipe B).'}
                </li>
                <li>Membaca nilai proporsi Fraksi A, Fraksi B, dan Fraksi C pada sumbu persen lolos kumulatif.</li>
                <li>Melakukan verifikasi perhitungan matematis dan penyesuaian rekayasa bila diperlukan.</li>
              </ol>
            )}
          </div>
        </section>

        {/* =====================================================================
            BAGIAN H: PROPORSI MASING-MASING FRAKSI
            ===================================================================== */}
        <section className="report-section space-y-2">
          <div className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[10px]">H</span>
            <span>PROPORSI MASING-MASING FRAKSI TERPILIH (SELECTED BLEND PROPORTIONS)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
            <div className="p-3 bg-red-50 rounded-xl border border-red-200">
              <div className="text-[10px] font-sans text-red-700 font-bold uppercase">
                Fraksi A (Kasar)
              </div>
              <div className="text-2xl font-black text-red-900 mt-1">{propA.toFixed(1)}%</div>
              <div className="text-[10px] font-sans text-red-600 mt-0.5">Proporsi Kasar</div>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-[10px] font-sans text-blue-700 font-bold uppercase">
                Fraksi B ({reportMode === '2_fraksi' ? 'Halus' : 'Sedang'})
              </div>
              <div className="text-2xl font-black text-blue-900 mt-1">{propB.toFixed(1)}%</div>
              <div className="text-[10px] font-sans text-blue-600 mt-0.5">
                {reportMode === '2_fraksi' ? 'Proporsi Halus' : 'Proporsi Sedang'}
              </div>
            </div>

            {reportMode === '3_fraksi' && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div className="text-[10px] font-sans text-amber-700 font-bold uppercase">
                  Fraksi C (Halus)
                </div>
                <div className="text-2xl font-black text-amber-900 mt-1">{propC.toFixed(1)}%</div>
                <div className="text-[10px] font-sans text-amber-600 mt-0.5">Proporsi Halus</div>
              </div>
            )}

            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
              <div className="text-[10px] font-sans text-slate-700 font-bold uppercase">
                Total Campuran
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {(propA + propB + (reportMode === '3_fraksi' ? propC : 0)).toFixed(1)}%
              </div>
              <div className="text-[10px] font-sans text-emerald-700 font-bold mt-0.5 flex items-center justify-center gap-1">
                <Check className="w-3 h-3" /> 100% Seimbang
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            BAGIAN I: TABEL GRADASI CAMPURAN
            ===================================================================== */}
        <section className="report-section space-y-2">
          <div className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[10px]">I</span>
            <span>TABEL GRADASI CAMPURAN &amp; EVALUASI TIAP SARINGAN (COMBINED GRADATION TABLE)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-300 text-[10px]">
                <tr>
                  <th className="p-2 border-r border-slate-300">Nomor Saringan</th>
                  <th className="p-2 border-r border-slate-300 text-right">Ukuran (mm)</th>
                  <th className="p-2 border-r border-slate-300 text-right">Kontribusi A ({propA}%)</th>
                  <th className="p-2 border-r border-slate-300 text-right">Kontribusi B ({propB}%)</th>
                  {reportMode === '3_fraksi' && (
                    <th className="p-2 border-r border-slate-300 text-right">Kontribusi C ({propC}%)</th>
                  )}
                  <th className="p-2 border-r border-slate-300 text-right bg-slate-200 font-black text-slate-950">
                    Campuran Terhitung (%)
                  </th>
                  <th className="p-2 border-r border-slate-300 text-right">Spek Min (%)</th>
                  <th className="p-2 border-r border-slate-300 text-right">Spek Tengah (%)</th>
                  <th className="p-2 border-r border-slate-300 text-right">Spek Max (%)</th>
                  <th className="p-2 border-r border-slate-300 text-right">Deviasi (%)</th>
                  <th className="p-2 text-center">Status Kelolosan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {results.map((r, idx) => {
                  const dev = Number((r.combinedPassing - r.specMid).toFixed(1));
                  const devStr = dev > 0 ? `+${dev}` : `${dev}`;
                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 font-sans font-medium text-slate-900">
                        {r.sieveName}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right">{r.sieveSizeMm}</td>
                      <td className="p-2 border-r border-slate-200 text-right text-slate-600">{r.contribA.toFixed(1)}%</td>
                      <td className="p-2 border-r border-slate-200 text-right text-slate-600">{r.contribB.toFixed(1)}%</td>
                      {reportMode === '3_fraksi' && (
                        <td className="p-2 border-r border-slate-200 text-right text-slate-600">{(r.contribC ?? 0).toFixed(1)}%</td>
                      )}
                      <td className="p-2 border-r border-slate-200 text-right font-bold text-slate-950 bg-slate-100">
                        {r.combinedPassing.toFixed(1)}%
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right text-slate-500">{r.specMin}%</td>
                      <td className="p-2 border-r border-slate-200 text-right text-slate-500">{r.specMid.toFixed(1)}%</td>
                      <td className="p-2 border-r border-slate-200 text-right text-slate-500">{r.specMax}%</td>
                      <td className="p-2 border-r border-slate-200 text-right font-medium">
                        <span className={Math.abs(dev) > 10 ? 'text-amber-700' : 'text-slate-700'}>{devStr}%</span>
                      </td>
                      <td className="p-2 text-center font-sans">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.isPassingSpec
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {r.isPassingSpec ? 'MEMENUHI' : 'DI LUAR SPESIFIKASI'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* =====================================================================
            BAGIAN J: GRAFIK GRADASI (S-CURVE)
            ===================================================================== */}
        <section className="report-section space-y-2 print-avoid-break">
          <div className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[10px]">J</span>
            <span>KURVA GRADASI STANDAR VS AMPLOP SPESIFIKASI (S-CURVE GRADATION CHART)</span>
          </div>

          <div className="border border-slate-300 rounded-xl p-4 bg-white shadow-sm">
            <GradationChart
              mode={reportMode}
              methodName={
                reportMode === '2_fraksi'
                  ? 'Metode Bujur Sangkar 10x10 cm'
                  : method === 'rothfuchs_tipe_a'
                  ? 'Rothfuchs Tipe A'
                  : 'Rothfuchs Tipe B'
              }
              sieveData={sieveData}
              blendResults={results}
              proportions={
                reportMode === '2_fraksi'
                  ? { fractionA: propA, fractionB: propB }
                  : { fractionA: propA, fractionB: propB, fractionC: propC }
              }
              showCardWrapper={false}
            />
          </div>
        </section>

        {/* =====================================================================
            BAGIAN K: DIAGRAM KONSTRUKSI METODE GRAFIS
            ===================================================================== */}
        <section className="report-section space-y-2 print-avoid-break">
          <div className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[10px]">K</span>
            <span>DIAGRAM REKAYASA KONSTRUKSI GRAFIS (ENGINEERING GRAPHICAL CONSTRUCTION PLOT)</span>
          </div>

          <div className="border border-slate-300 rounded-xl p-4 bg-white flex justify-center shadow-sm overflow-x-auto">
            {reportMode === '2_fraksi' ? (
              <SquarePlotInteractive
                sieveData={sieveData}
                analysis={analysis2F}
                selectedA={propA}
                onSelectA={setPropA}
              />
            ) : (
              <RothfuchsPlotInteractive
                sieveData={sieveData}
                method={method === 'rothfuchs_tipe_b' ? 'rothfuchs_tipe_b' : 'rothfuchs_tipe_a'}
                geomA={geom3F_A}
                geomB={geom3F_B}
                onUpdateTypeAPosition={(xCoarse, xFine) => {
                  setTypeAPos({ xCoarse, xFine });
                  const g = analyzeRothfuchsTypeA(sieveData, xCoarse, xFine);
                  setPropA(g.propCoarseA);
                  setPropB(g.propMediumB);
                  setPropC(g.propFineC);
                }}
                onUpdateTypeBPoints={(pts) => {
                  const updated = { ...typeBPoints, ...pts };
                  setTypeBPoints(updated);
                  const g = analyzeRothfuchsTypeB(sieveData, updated);
                  setPropA(g.propCoarseA);
                  setPropB(g.propMediumB);
                  setPropC(g.propFineC);
                }}
              />
            )}
          </div>
        </section>

        {/* =====================================================================
            BAGIAN L: EVALUASI HASIL & ANALISIS DEVIASI
            ===================================================================== */}
        <section className="report-section space-y-2 print-avoid-break">
          <div className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[10px]">L</span>
            <span>EVALUASI HASIL &amp; ANALISIS DEVIASI STATISTIK (RESULT EVALUATION)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                Rata-rata Deviasi Absolut (MAD):
              </span>
              <div className="text-xl font-mono font-bold text-slate-900 mt-1">{meanDev}%</div>
              <span className="text-[10px] text-slate-400">Jarak rata-rata ke garis tengah target</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                Deviasi Maksimum terhadap Target:
              </span>
              <div className="text-xl font-mono font-bold text-slate-900 mt-1">{maxDev.toFixed(1)}%</div>
              <span className="text-[10px] text-slate-400">Penyimpangan terjauh dari target</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                Saringan Paling Kritis:
              </span>
              <div className="text-sm font-sans font-bold text-blue-900 mt-1">
                {criticalSieve.sieveName} ({criticalSieve.sieveSizeMm} mm)
              </div>
              <span className="text-[10px] text-slate-400">
                Lolos: {criticalSieve.combinedPassing.toFixed(1)}% (Batas: {criticalSieve.specMin}% - {criticalSieve.specMax}%)
              </span>
            </div>
          </div>

          {notes && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              <strong>Catatan Teknis Rekayasa:</strong> {notes}
            </div>
          )}
        </section>

        {/* =====================================================================
            BAGIAN M: KESIMPULAN & LEMBAR PENGESAHAN
            ===================================================================== */}
        <section className="report-section space-y-4 print-avoid-break pt-2">
          <div className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[10px]">M</span>
            <span>KESIMPULAN REKAYASA &amp; LEMBAR PENGESAHAN (CONCLUSION &amp; APPROVAL)</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/70 text-xs text-slate-800 space-y-2">
            <div className="font-bold text-sm text-slate-900">
              Pernyataan Kelayakan Teknis Campuran:
            </div>
            <p className="leading-relaxed">
              Berdasarkan hasil perhitungan pencampuran agregat menggunakan{' '}
              <strong>
                {reportMode === '2_fraksi'
                  ? 'Metode Grafis Bujur Sangkar 10x10 cm'
                  : method === 'rothfuchs_tipe_a'
                  ? 'Metode Rothfuchs Tipe A'
                  : 'Metode Rothfuchs Tipe B'}
              </strong>
              , rancangan proporsi campuran terpilih yaitu:{' '}
              {reportMode === '2_fraksi' ? (
                <strong>{propA}% Agregat Kasar (A) dan {propB}% Agregat Halus (B)</strong>
              ) : (
                <strong>{propA}% Kasar (A), {propB}% Sedang (B), dan {propC}% Halus (C)</strong>
              )}
              {allPassing ? (
                <span className="text-emerald-800 font-bold">
                  {' '}dinyatakan MEMENUHI SELURUH PERSYARATAN SPESIFIKASI gradasi yang disyaratkan dan layak diajukan untuk Job Mix Formula (JMF).
                </span>
              ) : (
                <span className="text-red-800 font-bold">
                  {' '}memiliki {failedCount} ukuran saringan di luar batas spesifikasi sehingga memerlukan pengujian ulang atau substitusi fraksi agregat.
                </span>
              )}
            </p>
          </div>

          {/* 3-Party Engineering Signature Box */}
          <div className="pt-6 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-16">
              <div className="font-semibold text-slate-600">Dibuat Oleh (Prepared By):</div>
              <div>
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">
                  {engineerName}
                </div>
                <div className="text-[10px] text-slate-400">Teknisi / Praktikan Laboratorium</div>
              </div>
            </div>

            <div className="space-y-16">
              <div className="font-semibold text-slate-600">Diperiksa Oleh (Checked By):</div>
              <div>
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">
                  ( Koordinator QC / Asisten Lab )
                </div>
                <div className="text-[10px] text-slate-400">Quality Control / Verifikator</div>
              </div>
            </div>

            <div className="space-y-16">
              <div className="font-semibold text-slate-600">Disetujui Oleh (Approved By):</div>
              <div>
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">
                  ( Kepala Laboratorium / Dosen )
                </div>
                <div className="text-[10px] text-slate-400">Penanggung Jawab Teknis</div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
