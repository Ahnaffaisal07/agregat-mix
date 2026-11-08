import React, { useState, useRef } from 'react';
import { SieveDataRow } from '../../types/index';
import { 
  RothfuchsTypeAGeometry, 
  RothfuchsTypeBGeometry 
} from '../../core/threeFractionEngine';
import { 
  Layers3, 
  RotateCcw, 
  Info, 
  Sliders, 
  Download,
  Eye,
  Crosshair
} from 'lucide-react';

interface RothfuchsPlotInteractiveProps {
  sieveData: SieveDataRow[];
  method: 'rothfuchs_tipe_a' | 'rothfuchs_tipe_b';
  geomA: RothfuchsTypeAGeometry;
  geomB: RothfuchsTypeBGeometry;
  onUpdateTypeAPosition: (xCoarse: number, xFine: number) => void;
  onUpdateTypeBPoints: (points: {
    fineEnd?: number;
    mediumStart?: number;
    mediumEnd?: number;
    coarseStart?: number;
  }) => void;
}

export const RothfuchsPlotInteractive: React.FC<RothfuchsPlotInteractiveProps> = ({
  sieveData,
  method,
  geomA,
  geomB,
  onUpdateTypeAPosition,
  onUpdateTypeBPoints,
}) => {
  const isTypeA = method === 'rothfuchs_tipe_a';
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Dragging state
  const [activeDrag, setActiveDrag] = useState<
    'coarseLine' | 'fineLine' | 'fineEnd' | 'medStart' | 'medEnd' | 'coarseStart' | null
  >(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);
  const [showAreaShading, setShowAreaShading] = useState<boolean>(true);

  // Dimensi Kanvas Persegi Panjang Rasio 1:2 (Sesuai PDF Hal 7: 10 x 20 cm)
  const padX = 65;
  const padY = 40;
  const widthBox = 600;
  const heightBox = 300;

  // Konversi % ke koordinat SVG
  const toSvgX = (percentX: number) => padX + (percentX / 100) * widthBox;
  const toSvgY = (passingPercent: number) => padY + heightBox - (passingPercent / 100) * heightBox;

  // Konversi koordinat SVG ke %
  const fromSvgX = (svgX: number) => {
    const raw = ((svgX - padX) / widthBox) * 100;
    return Math.max(0, Math.min(100, Number(raw.toFixed(1))));
  };

  // Pointer event handlers untuk drag interaktif langsung pada SVG
  const handlePointerDown = (
    type: 'coarseLine' | 'fineLine' | 'fineEnd' | 'medStart' | 'medEnd' | 'coarseStart',
    e: React.PointerEvent
  ) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setActiveDrag(type);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const pctX = fromSvgX(clientX);
    const pctY = Math.max(0, Math.min(100, 100 - ((clientY - padY) / heightBox) * 100));

    setHoverCoords({ x: Number(pctX.toFixed(1)), y: Number(pctY.toFixed(1)) });

    if (!activeDrag) return;

    if (isTypeA) {
      if (activeDrag === 'coarseLine') {
        const clamped = Math.max(50, Math.min(95, pctX));
        onUpdateTypeAPosition(clamped, geomA.xFine);
      } else if (activeDrag === 'fineLine') {
        const clamped = Math.max(10, Math.min(50, pctX));
        onUpdateTypeAPosition(geomA.xCoarse, clamped);
      }
    } else {
      if (activeDrag === 'fineEnd') {
        const clamped = Math.max(35, Math.min(70, pctX));
        onUpdateTypeBPoints({ fineEnd: clamped });
      } else if (activeDrag === 'medStart') {
        const clamped = Math.max(5, Math.min(40, pctX));
        onUpdateTypeBPoints({ mediumStart: clamped });
      } else if (activeDrag === 'medEnd') {
        const clamped = Math.max(65, Math.min(95, pctX));
        onUpdateTypeBPoints({ mediumEnd: clamped });
      } else if (activeDrag === 'coarseStart') {
        const clamped = Math.max(45, Math.min(80, pctX));
        onUpdateTypeBPoints({ coarseStart: clamped });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeDrag) {
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture already released
      }
      setActiveDrag(null);
    }
  };

  // Unduh Diagram sebagai PNG
  const handleDownloadPng = () => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);

    const canvas = document.createElement('canvas');
    canvas.width = 1440;
    canvas.height = 800;
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
      a.download = `Diagram_Rothfuchs_${isTypeA ? 'Tipe_A' : 'Tipe_B'}.png`;
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // Helper membuat path kurva
  const buildCurvePath = (fraction: 'passingA' | 'passingB' | 'passingC') => {
    return sieveData
      .map((row, idx) => {
        const pMid = row.specMid ?? (row.specMin + row.specMax) / 2;
        const x = toSvgX(pMid);
        const yVal = fraction === 'passingC' ? (row.passingC ?? 0) : row[fraction];
        const y = toSvgY(yVal);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  // Helper area polygon antara garis aproksimasi dan kurva
  const buildAreaPolygon = (
    xStart: number,
    yStart: number,
    xEnd: number,
    yEnd: number,
    fraction: 'passingA' | 'passingB' | 'passingC'
  ) => {
    const xMin = Math.min(xStart, xEnd);
    const xMax = Math.max(xStart, xEnd);

    // Ambil titik-titik saringan dalam rentang
    const pts = sieveData
      .filter((s) => {
        const mid = s.specMid ?? (s.specMin + s.specMax) / 2;
        return mid >= xMin - 1 && mid <= xMax + 1;
      })
      .map((s) => {
        const mid = s.specMid ?? (s.specMin + s.specMax) / 2;
        const yVal = fraction === 'passingC' ? (s.passingC ?? 0) : s[fraction];
        return `${toSvgX(mid)},${toSvgY(yVal)}`;
      });

    if (pts.length === 0) return '';
    return `M ${toSvgX(xStart)},${toSvgY(yStart)} L ${toSvgX(xEnd)},${toSvgY(yEnd)} L ${pts.reverse().join(' L ')} Z`;
  };

  return (
    <div className="space-y-6">
      {/* Top Graphic Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
        <div>
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Layers3 className="w-4 h-4 text-emerald-600" />
            <span>
              Diagram Konstruksi Bidang Rothfuchs (Rasio 1 : 2) –{' '}
              {isTypeA ? 'Tipe A (Keseimbangan Jarak Vertikal)' : 'Tipe B (Garis Aproksimasi & Hubung Silang)'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Bidang 10 &times; 20 cm sesuai PDF Halaman 7. Garis diagonal hijau zamrud adalah Gradasi Tengah Spesifikasi (Y = X).
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isTypeA && (
            <button
              onClick={() => setShowAreaShading(!showAreaShading)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                showAreaShading
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showAreaShading ? 'Sembunyikan Arsiran Luas' : 'Tampilkan Arsiran Luas'}</span>
            </button>
          )}

          {isTypeA ? (
            <button
              onClick={() => onUpdateTypeAPosition(69.0, 34.0)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors shadow-sm"
              title="Reset ke posisi gambar asli PDF Halaman 12 (31% Kasar : 35% Sedang : 34% Halus)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
              <span>Reset Posisi PDF (31:35:34)</span>
            </button>
          ) : (
            <button
              onClick={() =>
                onUpdateTypeBPoints({
                  fineEnd: 53.0,
                  mediumStart: 21.0,
                  mediumEnd: 84.0,
                  coarseStart: 64.0,
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors shadow-sm"
              title="Reset ke posisi gambar asli PDF Halaman 15 (20% Kasar : 49% Sedang : 31% Halus)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
              <span>Reset Posisi PDF (20:49:31)</span>
            </button>
          )}

          <button
            onClick={handleDownloadPng}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm"
            title="Unduh diagram ini sebagai file gambar PNG beresolusi tinggi"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unduh Diagram PNG</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* SVG Canvas Container */}
        <div className="w-full xl:w-[740px] bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col items-center">
          <div className="relative select-none overflow-x-auto w-full flex justify-center">
            <svg
              ref={svgRef}
              width="730"
              height="390"
              viewBox="0 0 730 390"
              className="overflow-visible font-sans select-none cursor-crosshair"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={() => setHoverCoords(null)}
            >
              <defs>
                <marker
                  id="rothArrow"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#0284c7" />
                </marker>
              </defs>

              {/* Grid Horizontal 10% */}
              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((v) => (
                <g key={v}>
                  <line
                    x1={padX}
                    y1={toSvgY(v)}
                    x2={padX + widthBox}
                    y2={toSvgY(v)}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x={padX - 8}
                    y={toSvgY(v) + 3}
                    textAnchor="end"
                    fontSize="9"
                    fill="#64748b"
                    fontFamily="monospace"
                  >
                    {v}
                  </text>
                </g>
              ))}

              {/* Bingkai Luar Rasio 1:2 */}
              <rect
                x={padX}
                y={padY}
                width={widthBox}
                height={heightBox}
                fill="#ffffff"
                stroke="#0f172a"
                strokeWidth="2"
              />

              {/* Garis Diagonal Utama (Hijau Zamrud) - Gradasi Tengah Spesifikasi (Y = X) */}
              <line
                x1={padX}
                y1={padY + heightBox}
                x2={padX + widthBox}
                y2={padY}
                stroke="#10b981"
                strokeWidth="2.5"
              />
              <text
                x={padX + widthBox - 15}
                y={padY + 18}
                textAnchor="end"
                fontSize="9"
                fontWeight="bold"
                fill="#059669"
              >
                Garis Gradasi Tengah Spesifikasi (Y = X)
              </text>

              {/* Garis Saringan Vertikal Terpetakan Berdasarkan P_mid (Step 4 PDF) */}
              {sieveData.map((row) => {
                const pMid = row.specMid ?? (row.specMin + row.specMax) / 2;
                const svgX = toSvgX(pMid);

                return (
                  <g key={row.id}>
                    <line
                      x1={svgX}
                      y1={padY}
                      x2={svgX}
                      y2={padY + heightBox}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    {/* Label Saringan di Sumbu Atas */}
                    <text
                      x={svgX}
                      y={padY - 8}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill="#334155"
                    >
                      {row.sieveName}
                    </text>
                  </g>
                );
              })}

              {/* ARSIRAN KOMPENSASI LUAS PADA TIPE B */}
              {!isTypeA && showAreaShading && (
                <g>
                  {/* Arsiran Fraksi Halus (C) */}
                  <path
                    d={buildAreaPolygon(
                      0,
                      0,
                      geomB.lineFine.xEnd,
                      100,
                      'passingC'
                    )}
                    fill="rgba(217, 119, 6, 0.12)"
                    stroke="none"
                  />
                  {/* Arsiran Fraksi Sedang (B) */}
                  <path
                    d={buildAreaPolygon(
                      geomB.lineMedium.xStart,
                      0,
                      geomB.lineMedium.xEnd,
                      100,
                      'passingB'
                    )}
                    fill="rgba(37, 99, 235, 0.12)"
                    stroke="none"
                  />
                  {/* Arsiran Fraksi Kasar (A) */}
                  <path
                    d={buildAreaPolygon(
                      geomB.lineCoarse.xStart,
                      0,
                      100,
                      100,
                      'passingA'
                    )}
                    fill="rgba(220, 38, 38, 0.12)"
                    stroke="none"
                  />
                </g>
              )}

              {/* Kurva Fraksi Kasar (A) - Merah */}
              <path
                d={buildCurvePath('passingA')}
                fill="none"
                stroke="#dc2626"
                strokeWidth="2.2"
              />

              {/* Kurva Fraksi Sedang (B) - Biru */}
              <path
                d={buildCurvePath('passingB')}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.2"
              />

              {/* Kurva Fraksi Halus (C) - Oranye/Emas */}
              <path
                d={buildCurvePath('passingC')}
                fill="none"
                stroke="#d97706"
                strokeWidth="2.2"
              />

              {/* ========================================================= */}
              {/* KONSTRUKSI KHUSUS ROTHFUCHS TIPE A (Gambar 3.6 PDF)       */}
              {/* ========================================================= */}
              {isTypeA && (
                <g>
                  {/* Garis Vertikal Penentu Kasar */}
                  <line
                    x1={toSvgX(geomA.xCoarse)}
                    y1={padY}
                    x2={toSvgX(geomA.xCoarse)}
                    y2={padY + heightBox}
                    stroke="#7c3aed"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                  />
                  {/* Titik potong diagonal Kasar */}
                  <circle
                    cx={toSvgX(geomA.xCoarse)}
                    cy={toSvgY(geomA.yCoarseIntersect)}
                    r="5"
                    fill="#7c3aed"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  {/* Draggable Handle Kasar di Tepi Atas */}
                  <g
                    className="cursor-ew-resize"
                    onPointerDown={(e) => handlePointerDown('coarseLine', e)}
                  >
                    <rect
                      x={toSvgX(geomA.xCoarse) - 16}
                      y={padY - 2}
                      width="32"
                      height="16"
                      rx="4"
                      fill="#7c3aed"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <text
                      x={toSvgX(geomA.xCoarse)}
                      y={padY + 10}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill="#ffffff"
                    >
                      {geomA.xCoarse}%
                    </text>
                  </g>
                  <text
                    x={toSvgX(geomA.xCoarse) - 8}
                    y={padY + 45}
                    textAnchor="end"
                    fontSize="10"
                    fontWeight="bold"
                    fill="#7c3aed"
                  >
                    Jarak a ({geomA.distBottomToCoarse}% = {geomA.distTopToMedium}%)
                  </text>

                  {/* Garis Vertikal Penentu Halus */}
                  <line
                    x1={toSvgX(geomA.xFine)}
                    y1={padY}
                    x2={toSvgX(geomA.xFine)}
                    y2={padY + heightBox}
                    stroke="#059669"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                  />
                  {/* Titik potong diagonal Halus */}
                  <circle
                    cx={toSvgX(geomA.xFine)}
                    cy={toSvgY(geomA.yFineIntersect)}
                    r="5"
                    fill="#059669"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  {/* Draggable Handle Halus di Tepi Bawah */}
                  <g
                    className="cursor-ew-resize"
                    onPointerDown={(e) => handlePointerDown('fineLine', e)}
                  >
                    <rect
                      x={toSvgX(geomA.xFine) - 16}
                      y={padY + heightBox - 14}
                      width="32"
                      height="16"
                      rx="4"
                      fill="#059669"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <text
                      x={toSvgX(geomA.xFine)}
                      y={padY + heightBox - 2}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill="#ffffff"
                    >
                      {geomA.xFine}%
                    </text>
                  </g>
                  <text
                    x={toSvgX(geomA.xFine) + 8}
                    y={padY + heightBox - 25}
                    textAnchor="start"
                    fontSize="10"
                    fontWeight="bold"
                    fill="#059669"
                  >
                    x = b + c ({geomA.distTopToFine}% = {geomA.distBottomSum}%)
                  </text>

                  {/* Bracket Proporsi di Sisi Kanan (Sesuai Gambar 3.6 PDF) */}
                  {/* Kasar: 100% s.d. yCoarseIntersect */}
                  <line
                    x1={padX + widthBox + 15}
                    y1={padY}
                    x2={padX + widthBox + 15}
                    y2={toSvgY(geomA.yCoarseIntersect)}
                    stroke="#dc2626"
                    strokeWidth="3.5"
                  />
                  <text
                    x={padX + widthBox + 24}
                    y={(padY + toSvgY(geomA.yCoarseIntersect)) / 2 + 4}
                    fontSize="11"
                    fontWeight="bold"
                    fill="#dc2626"
                  >
                    {geomA.propCoarseA}% F. Kasar
                  </text>

                  {/* Sedang: yCoarseIntersect s.d. yFineIntersect */}
                  <line
                    x1={padX + widthBox + 15}
                    y1={toSvgY(geomA.yCoarseIntersect)}
                    x2={padX + widthBox + 15}
                    y2={toSvgY(geomA.yFineIntersect)}
                    stroke="#2563eb"
                    strokeWidth="3.5"
                  />
                  <text
                    x={padX + widthBox + 24}
                    y={(toSvgY(geomA.yCoarseIntersect) + toSvgY(geomA.yFineIntersect)) / 2 + 4}
                    fontSize="11"
                    fontWeight="bold"
                    fill="#2563eb"
                  >
                    {geomA.propMediumB}% F. Sedang
                  </text>

                  {/* Halus: yFineIntersect s.d. 0% */}
                  <line
                    x1={padX + widthBox + 15}
                    y1={toSvgY(geomA.yFineIntersect)}
                    x2={padX + widthBox + 15}
                    y2={padY + heightBox}
                    stroke="#d97706"
                    strokeWidth="3.5"
                  />
                  <text
                    x={padX + widthBox + 24}
                    y={(toSvgY(geomA.yFineIntersect) + padY + heightBox) / 2 + 4}
                    fontSize="11"
                    fontWeight="bold"
                    fill="#d97706"
                  >
                    {geomA.propFineC}% F. Halus
                  </text>
                </g>
              )}

              {/* ========================================================= */}
              {/* KONSTRUKSI KHUSUS ROTHFUCHS TIPE B (Gambar 3.7 PDF)       */}
              {/* ========================================================= */}
              {!isTypeA && (
                <g>
                  {/* Garis Aproksimasi Halus (C) */}
                  <line
                    x1={toSvgX(geomB.lineFine.xStart)}
                    y1={toSvgY(geomB.lineFine.yStart)}
                    x2={toSvgX(geomB.lineFine.xEnd)}
                    y2={toSvgY(geomB.lineFine.yEnd)}
                    stroke="#d97706"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  {/* Handle Titik Akhir Halus (Y=100) */}
                  <circle
                    cx={toSvgX(geomB.lineFine.xEnd)}
                    cy={toSvgY(geomB.lineFine.yEnd)}
                    r="6"
                    fill="#d97706"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="cursor-ew-resize"
                    onPointerDown={(e) => handlePointerDown('fineEnd', e)}
                  />

                  {/* Garis Aproksimasi Sedang (B) */}
                  <line
                    x1={toSvgX(geomB.lineMedium.xStart)}
                    y1={toSvgY(geomB.lineMedium.yStart)}
                    x2={toSvgX(geomB.lineMedium.xEnd)}
                    y2={toSvgY(geomB.lineMedium.yEnd)}
                    stroke="#2563eb"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  {/* Handle Titik Awal Sedang (Y=0) */}
                  <circle
                    cx={toSvgX(geomB.lineMedium.xStart)}
                    cy={toSvgY(geomB.lineMedium.yStart)}
                    r="6"
                    fill="#2563eb"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="cursor-ew-resize"
                    onPointerDown={(e) => handlePointerDown('medStart', e)}
                  />
                  {/* Handle Titik Akhir Sedang (Y=100) */}
                  <circle
                    cx={toSvgX(geomB.lineMedium.xEnd)}
                    cy={toSvgY(geomB.lineMedium.yEnd)}
                    r="6"
                    fill="#2563eb"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="cursor-ew-resize"
                    onPointerDown={(e) => handlePointerDown('medEnd', e)}
                  />

                  {/* Garis Aproksimasi Kasar (A) */}
                  <line
                    x1={toSvgX(geomB.lineCoarse.xStart)}
                    y1={toSvgY(geomB.lineCoarse.yStart)}
                    x2={toSvgX(geomB.lineCoarse.xEnd)}
                    y2={toSvgY(geomB.lineCoarse.yEnd)}
                    stroke="#dc2626"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  {/* Handle Titik Awal Kasar (Y=0) */}
                  <circle
                    cx={toSvgX(geomB.lineCoarse.xStart)}
                    cy={toSvgY(geomB.lineCoarse.yStart)}
                    r="6"
                    fill="#dc2626"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="cursor-ew-resize"
                    onPointerDown={(e) => handlePointerDown('coarseStart', e)}
                  />

                  {/* Garis Hubung 1 (Awal Sedang ke Akhir Halus) -> Memotong diagonal di Y1 */}
                  <line
                    x1={toSvgX(geomB.crossLine1.xStart)}
                    y1={toSvgY(geomB.crossLine1.yStart)}
                    x2={toSvgX(geomB.crossLine1.xEnd)}
                    y2={toSvgY(geomB.crossLine1.yEnd)}
                    stroke="#0284c7"
                    strokeWidth="2.5"
                  />
                  {/* Titik Potong 1 (31% Halus) */}
                  <circle
                    cx={toSvgX(geomB.crossLine1.xIntersect)}
                    cy={toSvgY(geomB.crossLine1.yIntersect)}
                    r="6"
                    fill="#0284c7"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <text
                    x={toSvgX(geomB.crossLine1.xIntersect) + 10}
                    y={toSvgY(geomB.crossLine1.yIntersect) + 4}
                    fontSize="10"
                    fontWeight="bold"
                    fill="#0284c7"
                  >
                    Titik Potong Halus: ({geomB.crossLine1.xIntersect}%, {geomB.crossLine1.yIntersect}%) &rarr; {geomB.propFineC}%
                  </text>

                  {/* Garis Hubung 2 (Awal Kasar ke Akhir Sedang) -> Memotong diagonal di Y2 */}
                  <line
                    x1={toSvgX(geomB.crossLine2.xStart)}
                    y1={toSvgY(geomB.crossLine2.yStart)}
                    x2={toSvgX(geomB.crossLine2.xEnd)}
                    y2={toSvgY(geomB.crossLine2.yEnd)}
                    stroke="#0284c7"
                    strokeWidth="2.5"
                  />
                  {/* Titik Potong 2 (80% -> 20% Kasar) */}
                  <circle
                    cx={toSvgX(geomB.crossLine2.xIntersect)}
                    cy={toSvgY(geomB.crossLine2.yIntersect)}
                    r="6"
                    fill="#0284c7"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <text
                    x={toSvgX(geomB.crossLine2.xIntersect) - 10}
                    y={toSvgY(geomB.crossLine2.yIntersect) - 8}
                    textAnchor="end"
                    fontSize="10"
                    fontWeight="bold"
                    fill="#0284c7"
                  >
                    Titik Potong Kasar: 100% - {geomB.crossLine2.yIntersect}% = {geomB.propCoarseA}%
                  </text>

                  {/* Bracket Proporsi Tipe B di Sisi Kanan */}
                  <line
                    x1={padX + widthBox + 15}
                    y1={padY}
                    x2={padX + widthBox + 15}
                    y2={toSvgY(geomB.crossLine2.yIntersect)}
                    stroke="#dc2626"
                    strokeWidth="3.5"
                  />
                  <text
                    x={padX + widthBox + 24}
                    y={(padY + toSvgY(geomB.crossLine2.yIntersect)) / 2 + 4}
                    fontSize="11"
                    fontWeight="bold"
                    fill="#dc2626"
                  >
                    {geomB.propCoarseA}% F. Kasar
                  </text>

                  <line
                    x1={padX + widthBox + 15}
                    y1={toSvgY(geomB.crossLine2.yIntersect)}
                    x2={padX + widthBox + 15}
                    y2={toSvgY(geomB.crossLine1.yIntersect)}
                    stroke="#2563eb"
                    strokeWidth="3.5"
                  />
                  <text
                    x={padX + widthBox + 24}
                    y={(toSvgY(geomB.crossLine2.yIntersect) + toSvgY(geomB.crossLine1.yIntersect)) / 2 + 4}
                    fontSize="11"
                    fontWeight="bold"
                    fill="#2563eb"
                  >
                    {geomB.propMediumB}% F. Sedang
                  </text>

                  <line
                    x1={padX + widthBox + 15}
                    y1={toSvgY(geomB.crossLine1.yIntersect)}
                    x2={padX + widthBox + 15}
                    y2={padY + heightBox}
                    stroke="#d97706"
                    strokeWidth="3.5"
                  />
                  <text
                    x={padX + widthBox + 24}
                    y={(toSvgY(geomB.crossLine1.yIntersect) + padY + heightBox) / 2 + 4}
                    fontSize="11"
                    fontWeight="bold"
                    fill="#d97706"
                  >
                    {geomB.propFineC}% F. Halus
                  </text>
                </g>
              )}

              {/* Sumbu Label */}
              <text
                x={padX + widthBox / 2}
                y={padY + heightBox + 32}
                textAnchor="middle"
                fontSize="11"
                fontWeight="bold"
                fill="#1e293b"
              >
                Ukuran Bukaan Saringan (Dipetakan Berdasarkan % Lolos Gradasi Tengah Spesifikasi)
              </text>
              <text
                x={-(padY + heightBox / 2)}
                y={padX - 44}
                transform="rotate(-90)"
                textAnchor="middle"
                fontSize="11"
                fontWeight="bold"
                fill="#1e293b"
              >
                % Lolos Saringan
              </text>
            </svg>
          </div>

          {/* Coordinates readout badge on mouse movement */}
          <div className="w-full mt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Koordinat Kursor:{' '}
                {hoverCoords ? `X = ${hoverCoords.x}%, Y = ${hoverCoords.y}%` : 'Arahkan kursor ke bidang'}
              </span>
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              Tips: Titik bulat dan handle garis dapat digeser langsung dengan mouse
            </span>
          </div>

          {/* Legend Warna Kurva */}
          <div className="w-full mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-3 h-3 bg-red-600 rounded-sm"></span>
                <span>Fraksi A (Kasar)</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-3 h-3 bg-blue-600 rounded-sm"></span>
                <span>Fraksi B (Sedang)</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-3 h-3 bg-amber-600 rounded-sm"></span>
                <span>Fraksi C (Halus)</span>
              </span>
              <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span>
                <span>Diagonal Spesifikasi Tengah</span>
              </span>
            </div>

            <span className="text-[11px] text-slate-400 font-mono">
              Rasio Sumbu 1 : 2
            </span>
          </div>
        </div>

        {/* Kontrol Interaktif & Penjelasan Langkah Konstruksi */}
        <div className="flex-1 space-y-4 text-xs text-slate-700 w-full">
          {/* Box Kontrol Interaktif */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>Kontrol Geometris Interaktif ({isTypeA ? 'Tipe A' : 'Tipe B'})</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Live Update
              </span>
            </div>

            {isTypeA ? (
              <div className="space-y-4">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Geser garis vertikal secara langsung di canvas atau gunakan slider di bawah untuk menyelaraskan jarak grafis sesuai Gambar 3.6 PDF:
                </p>

                {/* Slider Garis Kasar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-purple-900">
                      Garis Vertikal Kasar (Jarak a): Absis {geomA.xCoarse}%
                    </span>
                    <span className="font-mono text-purple-700 font-bold">
                      {geomA.propCoarseA}% Kasar
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="0.5"
                    value={geomA.xCoarse}
                    onChange={(e) => onUpdateTypeAPosition(Number(e.target.value), geomA.xFine)}
                    className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>Bawah ke Kasar: {geomA.distBottomToCoarse}%</span>
                    <span>Atas ke Sedang: {geomA.distTopToMedium}%</span>
                    <span className="font-semibold text-purple-700">
                      Selisih: {Math.abs(geomA.distBottomToCoarse - geomA.distTopToMedium).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Slider Garis Halus */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-emerald-900">
                      Garis Vertikal Halus (x = b + c): Absis {geomA.xFine}%
                    </span>
                    <span className="font-mono text-emerald-700 font-bold">
                      {geomA.propFineC}% Halus
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="50"
                    step="0.5"
                    value={geomA.xFine}
                    onChange={(e) => onUpdateTypeAPosition(geomA.xCoarse, Number(e.target.value))}
                    className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>Atas ke Halus (x): {geomA.distTopToFine}%</span>
                    <span>Bawah (b + c): {geomA.distBottomSum}%</span>
                    <span className="font-semibold text-emerald-700">
                      Selisih: {Math.abs(geomA.distTopToFine - geomA.distBottomSum).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Geser titik awal dan akhir garis aproksimasi kompensasi luas setara (equal area) sesuai Gambar 3.7 PDF:
                </p>

                {/* Area Compensation Summary Box */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Evaluasi Keseimbangan Luas (Area Balance):</span>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold">Prinsip Kompensasi</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                    <div className="p-1.5 bg-amber-50 rounded border border-amber-200">
                      <span className="font-bold text-amber-900 block">Fraksi C (Halus):</span>
                      <span>Kiri: {geomB.lineFine.areaLeft}</span> | <span>Kanan: {geomB.lineFine.areaRight}</span>
                    </div>
                    <div className="p-1.5 bg-blue-50 rounded border border-blue-200">
                      <span className="font-bold text-blue-900 block">Fraksi B (Sedang):</span>
                      <span>Kiri: {geomB.lineMedium.areaLeft}</span> | <span>Kanan: {geomB.lineMedium.areaRight}</span>
                    </div>
                    <div className="p-1.5 bg-red-50 rounded border border-red-200">
                      <span className="font-bold text-red-900 block">Fraksi A (Kasar):</span>
                      <span>Kiri: {geomB.lineCoarse.areaLeft}</span> | <span>Kanan: {geomB.lineCoarse.areaRight}</span>
                    </div>
                  </div>
                </div>

                {/* Slider Garis Sedang Start */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Titik Awal Garis Sedang (Start Y=0):</span>
                    <span className="font-mono text-blue-600 font-bold">{geomB.crossLine1.xStart}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    step="0.5"
                    value={geomB.crossLine1.xStart}
                    onChange={(e) => onUpdateTypeBPoints({ mediumStart: Number(e.target.value) })}
                    className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                {/* Slider Garis Halus End */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Titik Akhir Garis Halus (End Y=100):</span>
                    <span className="font-mono text-amber-600 font-bold">{geomB.crossLine1.xEnd}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="70"
                    step="0.5"
                    value={geomB.crossLine1.xEnd}
                    onChange={(e) => onUpdateTypeBPoints({ fineEnd: Number(e.target.value) })}
                    className="w-full h-2 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                </div>

                {/* Slider Garis Kasar Start */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Titik Awal Garis Kasar (Start Y=0):</span>
                    <span className="font-mono text-red-600 font-bold">{geomB.crossLine2.xStart}%</span>
                  </div>
                  <input
                    type="range"
                    min="45"
                    max="80"
                    step="0.5"
                    value={geomB.crossLine2.xStart}
                    onChange={(e) => onUpdateTypeBPoints({ coarseStart: Number(e.target.value) })}
                    className="w-full h-2 bg-red-100 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                </div>

                {/* Slider Garis Sedang End */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Titik Akhir Garis Sedang (End Y=100):</span>
                    <span className="font-mono text-blue-600 font-bold">{geomB.crossLine2.xEnd}%</span>
                  </div>
                  <input
                    type="range"
                    min="65"
                    max="95"
                    step="0.5"
                    value={geomB.crossLine2.xEnd}
                    onChange={(e) => onUpdateTypeBPoints({ mediumEnd: Number(e.target.value) })}
                    className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Panduan Langkah Konstruksi (PDF Hal 8 & 9) */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <div className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Panduan Langkah Konstruksi Grafis Manual (PDF Hal 7–9)</span>
            </div>

            {isTypeA ? (
              <ol className="list-decimal list-inside space-y-2 text-[11px] text-slate-600 leading-relaxed">
                <li>
                  <strong>Tentukan Proporsi Kasar (A):</strong> Cari garis vertikal di mana jarak dari tepi bawah ke kurva kasar sama dengan jarak tepi atas ke kurva sedang (label <em>a</em>). Jarak dari titik potong garis ini pada diagonal ke tepi atas menunjukkan proporsi kasar: <strong className="text-purple-700">100% - {geomA.yCoarseIntersect}% = {geomA.propCoarseA}%</strong>.
                </li>
                <li>
                  <strong>Tentukan Proporsi Halus (C):</strong> Cari garis vertikal di mana jarak tepi atas ke kurva halus sama dengan jumlah jarak bawah ke kasar dan sedang (<em>x = b + c</em>). Jarak dari titik potong ke tepi bawah menunjukkan proporsi halus: <strong className="text-emerald-700">{geomA.propFineC}%</strong>.
                </li>
                <li>
                  <strong>Tentukan Proporsi Sedang (B):</strong> Proporsi sedang adalah sisa terhadap 100%: 100% - {geomA.propCoarseA}% - {geomA.propFineC}% = <strong className="text-blue-700">{geomA.propMediumB}%</strong>.
                </li>
              </ol>
            ) : (
              <ol className="list-decimal list-inside space-y-2 text-[11px] text-slate-600 leading-relaxed">
                <li>
                  <strong>Tarik Garis Aproksimasi:</strong> Buat satu garis lurus untuk masing-masing fraksi dengan luas daerah kiri dan kanan terhadap kurva seimbang (kompensasi luas).
                </li>
                <li>
                  <strong>Garis Hubung 1 (Penentu Halus):</strong> Hubungkan titik awal garis Sedang (Y=0) ke akhir Halus (Y=100). Perpotongan dengan diagonal menentukan proporsi halus: <strong className="text-emerald-700">{geomB.propFineC}% Halus</strong>.
                </li>
                <li>
                  <strong>Garis Hubung 2 (Penentu Kasar):</strong> Hubungkan awal Kasar (Y=0) ke akhir Sedang (Y=100). Perpotongan dengan diagonal diukur dari tepi atas: 100% - {geomB.crossLine2.yIntersect}% = <strong className="text-red-700">{geomB.propCoarseA}% Kasar</strong>.
                </li>
                <li>
                  <strong>Proporsi Sedang (B):</strong> Selisih kedua titik potong: {geomB.crossLine2.yIntersect}% - {geomB.crossLine1.yIntersect}% = <strong className="text-blue-700">{geomB.propMediumB}% Sedang</strong>.
                </li>
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
