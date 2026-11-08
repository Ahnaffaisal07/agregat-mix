import React, { useState, useRef, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { SieveDataRow, BlendResultRow } from '../../types';
import { 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  SlidersHorizontal 
} from 'lucide-react';

interface GradationChartProps {
  mode: '2_fraksi' | '3_fraksi';
  methodName: string;
  sieveData: SieveDataRow[];
  blendResults: BlendResultRow[];
  proportions: {
    fractionA: number;
    fractionB: number;
    fractionC?: number;
  };
  title?: string;
  subtitle?: string;
  showCardWrapper?: boolean;
}

export const GradationChart: React.FC<GradationChartProps> = ({
  mode,
  methodName,
  sieveData,
  blendResults,
  proportions,
  title = 'Kurva Gradasi Standar Teknik Sipil (S-Curve Gradation Chart)',
  subtitle = 'Hubungan Ukuran Bukaan Saringan (mm) terhadap Persen Lolos Kumulatif (%)',
  showCardWrapper = true,
}) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  // Pilihan Skala Sumbu X: Logaritmik (mm) vs Kategori (Nomor Saringan)
  const [scaleType, setScaleType] = useState<'log' | 'sieveName'>('log');
  // Zoom level domain Y (default [0, 100])
  const [zoomRange, setZoomRange] = useState<[number, number]>([0, 100]);

  const allPassing = blendResults.every((r) => r.isPassingSpec);
  const failedCount = blendResults.filter((r) => !r.isPassingSpec).length;

  // Siapkan data terurut dari bukaan saringan terkecil ke terbesar
  const chartData = useMemo(() => {
    const sorted = [...sieveData].sort((a, b) => a.sieveSizeMm - b.sieveSizeMm);

    return sorted.map((row) => {
      const res = blendResults.find((r) => r.sieveName === row.sieveName);
      const specMid = row.specMid ?? Number(((row.specMin + row.specMax) / 2).toFixed(1));
      const combined = res ? res.combinedPassing : 0;
      const isPassing = res ? res.isPassingSpec : true;

      return {
        sieveName: row.sieveName,
        sizeMm: row.sieveSizeMm,
        // Label gabungan nama + mm untuk sumbu X kategori
        labelX: `${row.sieveName} (${row.sieveSizeMm} mm)`,
        FraksiA: row.passingA,
        FraksiB: row.passingB,
        ...(mode === '3_fraksi' && row.passingC !== undefined
          ? { FraksiC: row.passingC }
          : {}),
        Campuran: combined,
        SpekMin: row.specMin,
        SpekMax: row.specMax,
        GradasiTengah: specMid,
        isPassing,
      };
    });
  }, [sieveData, blendResults, mode]);

  // Handler Zoom In / Zoom Out
  const handleZoomIn = () => {
    setZoomRange(([min, max]) => [Math.min(min + 10, 40), Math.max(max - 10, 60)]);
  };

  const handleZoomOut = () => {
    setZoomRange(([min, max]) => [Math.max(min - 10, 0), Math.min(max + 10, 100)]);
  };

  const handleResetZoom = () => {
    setZoomRange([0, 100]);
  };

  // Unduh Grafik sebagai Gambar PNG
  const handleDownloadPng = () => {
    if (!chartContainerRef.current) return;
    const svgEl = chartContainerRef.current.querySelector('svg');
    if (!svgEl) return;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);

    const canvas = document.createElement('canvas');
    canvas.width = 1800;
    canvas.height = 1000;
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
      a.download = `Kurva_Gradasi_${mode}_${methodName.replace(/\s+/g, '_')}.png`;
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // Custom Tooltip Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-4 rounded-xl shadow-2xl text-white text-xs max-w-xs space-y-2 select-none backdrop-blur-sm">
          <div className="border-b border-slate-700/80 pb-1.5 flex items-center justify-between">
            <span className="font-bold text-sm text-slate-100">{dataPoint.sieveName}</span>
            <span className="font-mono text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              {dataPoint.sizeMm} mm
            </span>
          </div>

          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between text-red-300">
              <span>Fraksi A (Kasar {proportions.fractionA}%):</span>
              <span className="font-bold">{dataPoint.FraksiA}%</span>
            </div>

            <div className="flex justify-between text-blue-300">
              <span>
                Fraksi B ({mode === '3_fraksi' ? 'Sedang' : 'Halus'} {proportions.fractionB}%):
              </span>
              <span className="font-bold">{dataPoint.FraksiB}%</span>
            </div>

            {mode === '3_fraksi' && dataPoint.FraksiC !== undefined && (
              <div className="flex justify-between text-amber-300">
                <span>Fraksi C (Halus {proportions.fractionC}%):</span>
                <span className="font-bold">{dataPoint.FraksiC}%</span>
              </div>
            )}

            <div className="pt-1.5 border-t border-slate-700/70 flex justify-between text-emerald-400 font-bold text-xs">
              <span>Gradasi Campuran:</span>
              <span>{dataPoint.Campuran.toFixed(1)}%</span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>Batas Spesifikasi:</span>
              <span>
                {dataPoint.SpekMin} – {dataPoint.SpekMax}%
              </span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>Gradasi Tengah (Mid):</span>
              <span>{dataPoint.GradasiTengah.toFixed(1)}%</span>
            </div>
          </div>

          <div className="pt-1">
            <span
              className={`inline-block w-full text-center py-1 rounded text-[10px] font-bold ${
                dataPoint.isPassing
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-red-500/20 text-red-300 border border-red-500/40'
              }`}
            >
              {dataPoint.isPassing ? 'MEMENUHI SPESIFIKASI' : 'DI LUAR SPESIFIKASI'}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const chartContent = (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900">{title}</h4>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Scale Switcher: Logarithmic vs Sieve Name */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setScaleType('log')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                scaleType === 'log'
                  ? 'bg-white text-emerald-800 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Sumbu X berskala Logaritmik kontinu berdasar bukaan mm"
            >
              Skala Logaritmik (mm)
            </button>
            <button
              onClick={() => setScaleType('sieveName')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                scaleType === 'sieveName'
                  ? 'bg-white text-emerald-800 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Sumbu X berurutan nomor saringan standar"
            >
              Nomor Saringan (ASTM)
            </button>
          </div>

          {/* Zoom Buttons */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={handleZoomIn}
              className="p-1 hover:bg-white rounded text-slate-700 transition-colors"
              title="Zoom In Vertikal"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1 hover:bg-white rounded text-slate-700 transition-colors"
              title="Zoom Out Vertikal"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            {(zoomRange[0] !== 0 || zoomRange[1] !== 100) && (
              <button
                onClick={handleResetZoom}
                className="p-1 hover:bg-white rounded text-blue-600 transition-colors"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Download PNG Button */}
          <button
            onClick={handleDownloadPng}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-all shadow-sm"
            title="Unduh grafik gradasi ini sebagai gambar PNG"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Unduh PNG</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div ref={chartContainerRef} className="h-96 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 15, right: 30, left: 10, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

            {/* Sumbu X: Logaritmik atau Kategori */}
            {scaleType === 'log' ? (
              <XAxis
                dataKey="sizeMm"
                type="number"
                scale="log"
                domain={['auto', 'auto']}
                stroke="#64748b"
                tick={{ fontSize: 11, fontFamily: 'monospace' }}
                tickFormatter={(val) => `${val}`}
                label={{
                  value: 'Ukuran Saringan (Bukaan mm) – Skala Logaritmik',
                  position: 'insideBottom',
                  offset: -15,
                  fontSize: 11,
                  fontWeight: 600,
                  fill: '#334155',
                }}
              />
            ) : (
              <XAxis
                dataKey="sieveName"
                type="category"
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                label={{
                  value: 'Nomor Saringan (Ukuran Terkecil s.d. Terbesar)',
                  position: 'insideBottom',
                  offset: -15,
                  fontSize: 11,
                  fontWeight: 600,
                  fill: '#334155',
                }}
              />
            )}

            {/* Sumbu Y: Persen Lolos */}
            <YAxis
              domain={zoomRange}
              stroke="#64748b"
              tick={{ fontSize: 11, fontFamily: 'monospace' }}
              label={{
                value: 'Persen Lolos Kumulatif (% Passing)',
                angle: -90,
                position: 'insideLeft',
                offset: 5,
                fontSize: 11,
                fontWeight: 600,
                fill: '#334155',
              }}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: '11px',
                paddingTop: '18px',
              }}
            />

            {/* Batas Atas Spesifikasi (Upper Limit) */}
            <Line
              type="monotone"
              dataKey="SpekMax"
              stroke="#94a3b8"
              strokeWidth={1.8}
              strokeDasharray="5 5"
              name="Batas Atas Spek (Max)"
              dot={{ r: 3, fill: '#94a3b8' }}
              activeDot={{ r: 5 }}
            />

            {/* Gradasi Tengah Spesifikasi (Midpoint) */}
            <Line
              type="monotone"
              dataKey="GradasiTengah"
              stroke="#10b981"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              name="Gradasi Tengah (Mid)"
              dot={{ r: 2, fill: '#10b981' }}
            />

            {/* Batas Bawah Spesifikasi (Lower Limit) */}
            <Line
              type="monotone"
              dataKey="SpekMin"
              stroke="#94a3b8"
              strokeWidth={1.8}
              strokeDasharray="5 5"
              name="Batas Bawah Spek (Min)"
              dot={{ r: 3, fill: '#94a3b8' }}
              activeDot={{ r: 5 }}
            />

            {/* Fraksi A (Kasar) */}
            <Line
              type="monotone"
              dataKey="FraksiA"
              stroke="#dc2626"
              strokeWidth={1.5}
              name={`Fraksi A (Kasar ${proportions.fractionA}%)`}
              dot={{ r: 3.5, fill: '#dc2626' }}
              activeDot={{ r: 6 }}
            />

            {/* Fraksi B (Sedang / Halus) */}
            <Line
              type="monotone"
              dataKey="FraksiB"
              stroke="#2563eb"
              strokeWidth={1.5}
              name={`Fraksi B (${mode === '3_fraksi' ? 'Sedang' : 'Halus'} ${proportions.fractionB}%)`}
              dot={{ r: 3.5, fill: '#2563eb' }}
              activeDot={{ r: 6 }}
            />

            {/* Fraksi C (Halus pada 3 fraksi) */}
            {mode === '3_fraksi' && (
              <Line
                type="monotone"
                dataKey="FraksiC"
                stroke="#d97706"
                strokeWidth={1.5}
                name={`Fraksi C (Halus ${proportions.fractionC}%)`}
                dot={{ r: 3.5, fill: '#d97706' }}
                activeDot={{ r: 6 }}
              />
            )}

            {/* Gradasi Campuran Gabungan (Combined Gradation) */}
            <Line
              type="monotone"
              dataKey="Campuran"
              stroke="#059669"
              strokeWidth={3.8}
              name={`Gradasi Campuran (${proportions.fractionA}% A : ${proportions.fractionB}% B${
                mode === '3_fraksi' ? ` : ${proportions.fractionC}% C` : ''
              })`}
              dot={{ r: 5, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
              activeDot={{ r: 8, fill: '#059669' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info & Calculation Status */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-700">
            Metode: <strong className="text-slate-900">{methodName}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-slate-700">
            Proporsi: {proportions.fractionA}% A : {proportions.fractionB}% B
            {mode === '3_fraksi' && ` : ${proportions.fractionC}% C`}
          </span>
        </div>

        <div>
          {allPassing ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Semua Ukuran Saringan Memenuhi Batas Spesifikasi</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Terdapat {failedCount} Saringan di Luar Batas Spesifikasi</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (!showCardWrapper) {
    return chartContent;
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      {chartContent}
    </div>
  );
};
