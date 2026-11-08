import React, { useState, useRef } from 'react';
import { SieveDataRow } from '../../types/index';
import { TwoFractionAnalysisResult } from '../../core/twoFractionEngine';
import { 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  Layers2, 
  Eye, 
  EyeOff, 
  Download,
  Crosshair,
  Sliders
} from 'lucide-react';

interface SquarePlotInteractiveProps {
  sieveData: SieveDataRow[];
  analysis: TwoFractionAnalysisResult;
  selectedA: number;
  onSelectA: (val: number) => void;
}

export const SquarePlotInteractive: React.FC<SquarePlotInteractiveProps> = ({
  sieveData,
  analysis,
  selectedA,
  onSelectA,
}) => {
  const [hoveredSieve, setHoveredSieve] = useState<string | null>(null);
  const [showAllLabels, setShowAllLabels] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [isDraggingA, setIsDraggingA] = useState(false);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Dimensi SVG: Box 400x400 dengan padding 60px
  // Sumbu X: 60 s.d. 460 (lebar 400)
  // Sumbu Y: 60 s.d. 460 (tinggi 400)
  const pad = 60;
  const boxSize = 400;

  // Konversi % ke koordinat SVG
  // X: 0% di pad, 100% di pad + boxSize
  const toSvgX = (percentA: number) => pad + (percentA / 100) * boxSize;
  // Y: 0% di pad + boxSize (bawah), 100% di pad (atas)
  const toSvgY = (passingPercent: number) => pad + boxSize - (passingPercent / 100) * boxSize;

  const handlePointerDownA = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setIsDraggingA(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scale = 520 / rect.width;
    const clientX = (e.clientX - rect.left) * scale;
    const clientY = (e.clientY - rect.top) * scale;

    const pctX = Math.round(((clientX - pad) / boxSize) * 100);
    const pctY = Math.round(((pad + boxSize - clientY) / boxSize) * 100);

    const clampedX = Math.max(0, Math.min(100, pctX));
    const clampedY = Math.max(0, Math.min(100, pctY));
    setHoverCoords({ x: clampedX, y: clampedY });

    if (isDraggingA) {
      onSelectA(clampedX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingA) {
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {
        // release
      }
      setIsDraggingA(false);
    }
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scale = 520 / rect.width;
    const svgClickX = (e.clientX - rect.left) * scale;

    if (svgClickX >= pad && svgClickX <= pad + boxSize) {
      const clickedPercent = Math.round(((svgClickX - pad) / boxSize) * 100);
      onSelectA(Math.min(100, Math.max(0, clickedPercent)));
    }
  };

  const handleDownloadPng = () => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1200;
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
      a.download = `Diagram_Bujur_Sangkar_2_Fraksi_${selectedA}A_${100 - selectedA}B.png`;
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* SVG Canvas Container */}
      <div className="w-full lg:w-[580px] bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col items-center">
        {/* Toolbar Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
          <div>
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers2 className="w-4 h-4 text-blue-600" />
              <span>Diagram Bujur Sangkar 10 × 10 cm</span>
            </div>
            <span className="text-[11px] text-slate-400">
              Sesuai kaidah konstruksi grafis manual pada materi PDF Halaman 1–5
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setShowMarkers(!showMarkers)}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                showMarkers ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
              title="Tampilkan / Sembunyikan tanda 'x' batas spesifikasi"
            >
              <span className="font-bold text-[11px]">&times;</span>
              <span className="text-[10px]">Tanda &times;</span>
            </button>

            <button
              onClick={() => setShowAllLabels(!showAllLabels)}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                showAllLabels ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
              title="Tampilkan / Sembunyikan label nama saringan"
            >
              {showAllLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="text-[10px]">Label</span>
            </button>

            <button
              onClick={handleDownloadPng}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-all shadow-sm"
              title="Unduh diagram bujur sangkar ini sebagai gambar PNG"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[10px]">PNG</span>
            </button>
          </div>
        </div>

        {/* SVG Drawing Canvas */}
        <div className="relative select-none">
          <svg
            ref={svgRef}
            width="520"
            height="520"
            viewBox="0 0 520 520"
            onClick={handleSvgClick}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={() => setHoverCoords(null)}
            className="overflow-visible font-sans cursor-crosshair"
          >
            <defs>
              {/* Pattern Arsiran Daerah Layak Feasible */}
              <linearGradient id="feasibleAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#64748b" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#475569" stopOpacity="0.45" />
              </linearGradient>

              {/* Pattern Peringatan Jika Tidak Ada Feasible */}
              <pattern id="conflictHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" stroke="#fca5a5" strokeWidth="2" />
              </pattern>
            </defs>

            {/* Grid Garis Tipis 10% */}
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((v) => {
              const xPos = toSvgX(v);
              const yPos = toSvgY(v);
              return (
                <g key={v}>
                  <line x1={pad} y1={yPos} x2={pad + boxSize} y2={yPos} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1={xPos} y1={pad} x2={xPos} y2={pad + boxSize} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2 2" />
                </g>
              );
            })}

            {/* DAERAH ARSIRAN LAYAK (FEASIBLE REGION) - Step 7 PDF */}
            {analysis.hasFeasibleSolution ? (
              <g>
                <rect
                  x={toSvgX(analysis.minA)}
                  y={pad}
                  width={toSvgX(analysis.maxA) - toSvgX(analysis.minA)}
                  height={boxSize}
                  fill="url(#feasibleAreaGradient)"
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />

                {/* Garis Vertikal Batas Kiri */}
                <line
                  x1={toSvgX(analysis.minA)}
                  y1={pad}
                  x2={toSvgX(analysis.minA)}
                  y2={pad + boxSize}
                  stroke="#1e293b"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />

                {/* Garis Vertikal Batas Kanan */}
                <line
                  x1={toSvgX(analysis.maxA)}
                  y1={pad}
                  x2={toSvgX(analysis.maxA)}
                  y2={pad + boxSize}
                  stroke="#1e293b"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />

                {/* Label Batas Kiri & Kanan */}
                <text x={toSvgX(analysis.minA)} y={pad - 12} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">
                  {analysis.minA}%
                </text>
                <text x={toSvgX(analysis.maxA)} y={pad - 12} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">
                  {analysis.maxA}%
                </text>
              </g>
            ) : (
              /* Indikator Konflik (Tidak Ada Daerah Kelayakan) */
              <rect
                x={pad}
                y={pad}
                width={boxSize}
                height={boxSize}
                fill="url(#conflictHatch)"
                opacity="0.3"
              />
            )}

            {/* GARIS TENGAH PROPORSI TERPILIH - Step 8 PDF */}
            <g
              className="cursor-ew-resize"
              onPointerDown={handlePointerDownA}
            >
              <line
                x1={toSvgX(selectedA)}
                y1={pad}
                x2={toSvgX(selectedA)}
                y2={pad + boxSize}
                stroke="#2563eb"
                strokeWidth="3.5"
              />
              <circle cx={toSvgX(selectedA)} cy={pad} r="6" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
              <circle cx={toSvgX(selectedA)} cy={pad + boxSize} r="6" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />

              {/* Badge Nilai Proporsi Terpilih */}
              <rect
                x={toSvgX(selectedA) - 26}
                y={pad - 28}
                width="52"
                height="20"
                rx="5"
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <text
                x={toSvgX(selectedA)}
                y={pad - 14}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#ffffff"
                fontFamily="monospace"
              >
                {selectedA}% A
              </text>
            </g>

            {/* BINGKAI BUJUR SANGKAR UTAMA (10x10 cm) */}
            <rect
              x={pad}
              y={pad}
              width={boxSize}
              height={boxSize}
              fill="none"
              stroke="#0f172a"
              strokeWidth="2.5"
            />

            {/* GARIS-GARIS UKURAN SARINGAN (Step 4 & 5 PDF) */}
            {sieveData.map((row, idx) => {
              const yLeft = toSvgY(row.passingB);   // Sumbu Kiri: % Lolos Fraksi B
              const yRight = toSvgY(row.passingA);  // Sumbu Kanan: % Lolos Fraksi A
              const isHovered = hoveredSieve === row.sieveName;

              const bound = analysis.sieveBounds[idx];
              const markLower = bound?.markLowerSpec;
              const markUpper = bound?.markUpperSpec;

              return (
                <g
                  key={row.id}
                  onMouseEnter={() => setHoveredSieve(row.sieveName)}
                  onMouseLeave={() => setHoveredSieve(null)}
                  className="transition-opacity"
                >
                  {/* Garis Saringan */}
                  <line
                    x1={pad}
                    y1={yLeft}
                    x2={pad + boxSize}
                    y2={yRight}
                    stroke={isHovered ? '#2563eb' : '#334155'}
                    strokeWidth={isHovered ? 3 : 1.5}
                    className="cursor-pointer"
                  />

                  {/* TANDA 'x' BATAS ATAS SPESIFIKASI (Step 5 & 6 PDF) */}
                  {showMarkers && markUpper && (
                    <g transform={`translate(${toSvgX(markUpper.xPercent)}, ${toSvgY(markUpper.yPercent)})`}>
                      <circle cx="0" cy="0" r="4" fill="#ffffff" />
                      <line x1="-4" y1="-4" x2="4" y2="4" stroke="#16a34a" strokeWidth="2.5" />
                      <line x1="-4" y1="4" x2="4" y2="-4" stroke="#16a34a" strokeWidth="2.5" />
                    </g>
                  )}

                  {/* TANDA 'x' BATAS BAWAH SPESIFIKASI (Step 5 & 6 PDF) */}
                  {showMarkers && markLower && (
                    <g transform={`translate(${toSvgX(markLower.xPercent)}, ${toSvgY(markLower.yPercent)})`}>
                      <circle cx="0" cy="0" r="4" fill="#ffffff" />
                      <line x1="-4" y1="-4" x2="4" y2="4" stroke="#dc2626" strokeWidth="2.5" />
                      <line x1="-4" y1="4" x2="4" y2="-4" stroke="#dc2626" strokeWidth="2.5" />
                    </g>
                  )}

                  {/* Label Nama Saringan */}
                  {(showAllLabels || isHovered) && (
                    <text
                      x={pad + boxSize - 35 - (idx % 2 === 0 ? 0 : 25)}
                      y={yRight - 6}
                      fill={isHovered ? '#1d4ed8' : '#475569'}
                      fontSize={isHovered ? '10' : '9'}
                      fontWeight="bold"
                      className="cursor-pointer select-none"
                    >
                      {row.sieveName}
                    </text>
                  )}
                </g>
              );
            })}

            {/* SUMBU DAN LABEL SKALA (Sesuai PDF Hal 1–5) */}
            {/* 1. Sumbu Kiri: % Lolos Agregat B (0 s.d. 100) */}
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((v) => (
              <g key={`left_tick_${v}`}>
                <line x1={pad - 5} y1={toSvgY(v)} x2={pad} y2={toSvgY(v)} stroke="#64748b" strokeWidth="1.5" />
                <text x={pad - 9} y={toSvgY(v) + 3} textAnchor="end" fontSize="10" fill="#475569" fontFamily="monospace">
                  {v}
                </text>
              </g>
            ))}
            <text
              x={-(pad + boxSize / 2)}
              y={pad - 40}
              transform="rotate(-90)"
              textAnchor="middle"
              fontSize="11"
              fontWeight="bold"
              fill="#1e293b"
            >
              % Lolos Fraksi B (Agregat Halus)
            </text>

            {/* 2. Sumbu Kanan: % Lolos Agregat A (0 s.d. 100) */}
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((v) => (
              <g key={`right_tick_${v}`}>
                <line x1={pad + boxSize} y1={toSvgY(v)} x2={pad + boxSize + 5} y2={toSvgY(v)} stroke="#64748b" strokeWidth="1.5" />
                <text x={pad + boxSize + 9} y={toSvgY(v) + 3} textAnchor="start" fontSize="10" fill="#475569" fontFamily="monospace">
                  {v}
                </text>
              </g>
            ))}
            <text
              x={pad + boxSize / 2}
              y={-(pad + boxSize + 40)}
              transform="rotate(90)"
              textAnchor="middle"
              fontSize="11"
              fontWeight="bold"
              fill="#1e293b"
            >
              % Lolos Fraksi A (Agregat Kasar)
            </text>

            {/* 3. Sumbu Bawah: % Fraksi A dalam Campuran (0 di kiri, 100 di kanan) */}
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((v) => (
              <g key={`bottom_tick_${v}`}>
                <line x1={toSvgX(v)} y1={pad + boxSize} x2={toSvgX(v)} y2={pad + boxSize + 5} stroke="#64748b" strokeWidth="1.5" />
                <text x={toSvgX(v)} y={pad + boxSize + 18} textAnchor="middle" fontSize="10" fill="#475569" fontFamily="monospace">
                  {v}
                </text>
              </g>
            ))}
            <text
              x={pad + boxSize / 2}
              y={pad + boxSize + 40}
              textAnchor="middle"
              fontSize="11"
              fontWeight="bold"
              fill="#1e293b"
            >
              % Fraksi A (Agregat Kasar) dalam Campuran
            </text>

            {/* 4. Sumbu Atas: % Fraksi B dalam Campuran (100 di kiri, 0 di kanan) */}
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((v) => (
              <g key={`top_tick_${v}`}>
                <line x1={toSvgX(100 - v)} y1={pad - 5} x2={toSvgX(100 - v)} y2={pad} stroke="#64748b" strokeWidth="1.5" />
                <text x={toSvgX(100 - v)} y={pad - 12} textAnchor="middle" fontSize="10" fill="#475569" fontFamily="monospace">
                  {v}
                </text>
              </g>
            ))}
            <text
              x={pad + boxSize / 2}
              y={pad - 38}
              textAnchor="middle"
              fontSize="11"
              fontWeight="bold"
              fill="#1e293b"
            >
              % Fraksi B (Agregat Halus) dalam Campuran
            </text>
          </svg>
        </div>

        {/* Coordinates readout badge */}
        <div className="w-full mt-2.5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span className="flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {hoverCoords
                ? `Posisi: %A = ${hoverCoords.x}%, %B = ${100 - hoverCoords.x}% | Lolos = ${hoverCoords.y}%`
                : 'Arahkan kursor atau drag garis proporsi'}
            </span>
          </span>
          <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-bold">
            Klik / Drag Garis Biru
          </span>
        </div>

        {/* Method and Status Footer */}
        <div className="w-full mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="text-slate-600">
            Metode: <strong className="text-slate-900">Bujur Sangkar 10 &times; 10 cm (PDF Hal 1–5)</strong>
          </div>
          <div>
            {analysis.hasFeasibleSolution ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Rentang Layak: {analysis.minA}% – {analysis.maxA}% A
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-red-700 font-bold bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200 text-[10px]">
                <AlertTriangle className="w-3.5 h-3.5" />
                Tidak Ada Rentang yang Memenuhi 100% Saringan
              </span>
            )}
          </div>
        </div>

        {/* Legend Toolbar Bawah */}
        <div className="w-full mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-slate-400 rounded-sm inline-block opacity-60"></span>
              <span>Daerah Layak</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <span>&times;</span>
              <span>Batas Atas Spek</span>
            </span>
            <span className="flex items-center gap-1.5 text-red-700 font-bold">
              <span>&times;</span>
              <span>Batas Bawah Spek</span>
            </span>
          </div>

          <span className="text-[11px] text-blue-600 font-medium">
            Klik bidang grafik untuk memilih proporsi langsung
          </span>
        </div>
      </div>

      {/* Explanation & Numerical Bounds Verification Panel */}
      <div className="flex-1 space-y-4 text-xs text-slate-700 w-full">
        {/* Feasibility Alert */}
        {analysis.hasFeasibleSolution ? (
          <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Daerah Kelayakan Grafis Ditemukan</span>
            </div>
            <p className="text-emerald-800 leading-relaxed text-xs">
              {analysis.methodExplanation}
            </p>
            <div className="pt-2 flex items-center gap-3 font-mono text-xs">
              <span className="px-2.5 py-1 rounded bg-white font-bold text-slate-800 border border-emerald-200">
                Rentang Layak: {analysis.minA}% s.d. {analysis.maxA}% Kasar
              </span>
              <span className="px-2.5 py-1 rounded bg-emerald-600 font-bold text-white shadow-sm">
                Rekomendasi: {analysis.recommendedA}% A : {analysis.recommendedB}% B
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 rounded-2xl p-5 border border-red-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>Peringatan: Tidak Ada Daerah Kelayakan yang Memenuhi Spesifikasi!</span>
            </div>
            <p className="text-red-800 leading-relaxed text-xs">
              {analysis.methodExplanation}
            </p>
            <div className="p-2.5 bg-white/80 rounded-lg border border-red-200 text-[11px] text-red-900 font-mono">
              Saringan penyebab konflik:{' '}
              <strong>{analysis.conflictingSieves.join(' dengan ')}</strong>. Tidak ada proporsi pencampuran 2 fraksi yang dapat meloloskan kedua saringan tersebut sekaligus.
            </div>
          </div>
        )}

        {/* Tabel Analitis Penentuan Batas Kelayakan per Saringan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Pemeriksaan Numerik Batas Garis Saringan</span>
            </div>
            <span className="text-[11px] text-slate-400">
              Derivasi Analitis Batas Grafik
            </span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Perhitungan numerik berikut berfungsi sebagai alat verifikasi koordinat tanda &times; dan pembatas daerah arsiran pada grafik bujur sangkar:
          </p>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-[11px] font-mono">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 font-sans">Saringan</th>
                  <th className="px-2 py-2">P_A</th>
                  <th className="px-2 py-2">P_B</th>
                  <th className="px-2 py-2">Spek</th>
                  <th className="px-2 py-2 text-red-700">Min %A (Bawah)</th>
                  <th className="px-2 py-2 text-emerald-700">Max %A (Atas)</th>
                  <th className="px-2 py-2 font-sans">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {analysis.sieveBounds.map((sb) => (
                  <tr
                    key={sb.sieveName}
                    className={`hover:bg-slate-50 transition-colors ${
                      sb.isGoverningLower ? 'bg-amber-50/60 font-bold' : ''
                    } ${sb.isGoverningUpper ? 'bg-blue-50/60 font-bold' : ''}`}
                  >
                    <td className="px-3 py-1.5 font-sans font-medium text-slate-900">
                      {sb.sieveName}
                    </td>
                    <td className="px-2 py-1.5 text-slate-600">{sb.passingA}</td>
                    <td className="px-2 py-1.5 text-slate-600">{sb.passingB}</td>
                    <td className="px-2 py-1.5 text-slate-500">{sb.specMin}-{sb.specMax}</td>
                    <td className="px-2 py-1.5 text-red-700 font-bold">
                      {sb.aMinPercent}%
                    </td>
                    <td className="px-2 py-1.5 text-emerald-700 font-bold">
                      {sb.aMaxPercent}%
                    </td>
                    <td className="px-2 py-1.5 font-sans text-[10px]">
                      {sb.isGoverningLower && (
                        <span className="text-amber-800 font-bold">Batas Kiri (Governing Lower)</span>
                      )}
                      {sb.isGoverningUpper && (
                        <span className="text-blue-800 font-bold">Batas Kanan (Governing Upper)</span>
                      )}
                      {!sb.isGoverningLower && !sb.isGoverningUpper && (
                        <span className="text-slate-400">Memenuhi</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kaidah Teknis PDF Box */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-600" />
            <span>Kaidah Penentuan Proporsi Campuran (PDF Halaman 2 Butir 6 &amp; 7)</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            Tarik garis vertikal dari titik-titik yang paling tengah dari batas atas dan bawah spesifikasi agregat campuran. Garis tengah dari daerah yang dibatasi oleh kedua garis vertikal tersebut menjadi nilai proporsi untuk pencampuran kedua fraksi.
          </p>
        </div>
      </div>
    </div>
  );
};
