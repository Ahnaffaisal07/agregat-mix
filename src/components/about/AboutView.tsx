import React from 'react';
import { BookOpen, Layers2, Layers3, AlertTriangle } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 text-slate-800">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-sm space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Dokumentasi Rekayasa &amp; Teori Dasar</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Tentang AGREGAT MIX – Aggregate Blending Calculator
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          <strong>AGREGAT MIX</strong> dikembangkan secara khusus untuk mendigitalisasi metode grafis pencampuran agregat teknik sipil berdasarkan modul ajar <code className="bg-slate-100 px-2 py-0.5 rounded text-blue-700 font-mono text-xs">materi-pencampuran-agregat.pdf</code> (17 Halaman). Aplikasi ini membantu mahasiswa dan praktisi memahami konstruksi grafis geometri asli tanpa mengubah metode ilmiah yang diajarkan di perguruan tinggi.
        </p>
      </div>

      {/* 2 Fraksi Summary Section */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Layers2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              1. Pencampuran 2 Fraksi Agregat (Metode Bujur Sangkar 10 &times; 10 cm)
            </h3>
            <span className="text-xs text-slate-400 font-medium">Sumber: Halaman 1–6 Materi PDF</span>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            Digunakan bujur sangkar berukuran 10 cm &times; 10 cm dengan skala 0% – 100%:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li><strong>Sumbu Kiri:</strong> Persen lolos Fraksi B (agregat halus), skala 0% di bawah s.d. 100% di atas.</li>
            <li><strong>Sumbu Kanan:</strong> Persen lolos Fraksi A (agregat kasar), skala 0% di bawah s.d. 100% di atas.</li>
            <li><strong>Sumbu Bawah:</strong> Persen Fraksi A dalam campuran (0% di kiri s.d. 100% di kanan).</li>
            <li><strong>Sumbu Atas:</strong> Persen Fraksi B dalam campuran (100% di kiri s.d. 0% di kanan).</li>
          </ul>
          <p>
            Garis ukuran saringan menghubungkan titik persen lolos kedua fraksi untuk ukuran saringan yang sama. Pada setiap garis ukuran saringan diberikan tanda &times; untuk batas atas dan batas bawah spesifikasi. Garis vertikal ditarik dari titik-titik yang paling tengah dari batas atas dan bawah spesifikasi, dan garis tengah dari daerah arsiran tersebut menjadi nilai proporsi terpilih (pada contoh PDF diperoleh <strong>46% Fraksi A</strong> dan <strong>54% Fraksi B</strong>).
          </p>
        </div>
      </div>

      {/* 3 Fraksi Rothfuchs Section */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Layers3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              2. Pencampuran 3 Fraksi Agregat (Metode Grafis Rothfuchs Tipe A &amp; B)
            </h3>
            <span className="text-xs text-slate-400 font-medium">Sumber: Halaman 7–17 Materi PDF</span>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <p>
            Metode Rothfuchs menggunakan empat persegi panjang berukuran 10 cm &times; 20 cm (perbandingan 1 : 2). Sumbu datar digunakan untuk menunjukkan ukuran saringan, namun posisinya dipetakan sedemikian rupa sehingga <strong>garis diagonal dari sudut kiri bawah ke sudut kanan atas menjadi garis gradasi tengah spesifikasi agregat campuran</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">Rothfuchs Tipe A (Jarak Vertikal)</h4>
              <p>
                <strong>Proporsi Kasar (A):</strong> Ditarik garis vertikal sehingga jarak tepi bawah ke kurva kasar = jarak tepi atas ke kurva sedang (label a). Nilai proporsi kasar dibaca dari perpotongan garis ini dengan diagonal ke tepi atas (pada contoh PDF: 100% - 69% = <strong className="text-blue-700">31%</strong>).
              </p>
              <p>
                <strong>Proporsi Halus (C):</strong> Ditarik garis vertikal sehingga jarak tepi atas ke kurva halus = jarak bawah ke kasar + jarak bawah ke sedang (x = b + c). Nilai proporsi halus dibaca dari titik potong ke tepi bawah (pada contoh PDF: <strong className="text-emerald-700">34%</strong>).
              </p>
              <p>
                <strong>Proporsi Sedang (B):</strong> 100% - 31% - 34% = <strong className="text-indigo-700">35%</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">Rothfuchs Tipe B (Garis Aproksimasi)</h4>
              <p>
                <strong>Garis Aproksimasi:</strong> Tarik satu garis lurus untuk masing-masing fraksi sehingga luas daerah kiri dan kanan yang dibentuk garis dengan kurva aslinya kurang lebih sama (equal area compensation).
              </p>
              <p>
                <strong>Garis Hubung Silang:</strong> Hubungkan titik awal Sedang (0%) ke akhir Halus (100%), memotong diagonal di Y = 31% &rarr; <strong className="text-emerald-700">31% Halus</strong>. Hubungkan awal Kasar (0%) ke akhir Sedang (100%), memotong diagonal di Y = 80% &rarr; 100% - 80% = <strong className="text-blue-700">20% Kasar</strong>.
              </p>
              <p>
                <strong>Proporsi Sedang:</strong> 80% - 31% = <strong className="text-indigo-700">49%</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Discrepancy Note in PDF */}
      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 space-y-3 text-xs text-amber-900">
        <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <span>Catatan Penting Hasil Telaah Dokumen PDF</span>
        </div>
        <p className="leading-relaxed">
          Pada <strong>Tabel 3.8 s.d. 3.12</strong> materi PDF, terdapat ketidaksesuaian pengetikan antara kolom milimeter dan nomor saringan (misal: 63,00 mm tertulis ¾ inci, 37,5 mm tertulis ½ inci). Namun, pada grafik konstruksi <strong>Gambar 3.6 &amp; 3.7</strong>, sumbu saringan yang menjadi acuan penyusun modul adalah nomor saringan: <strong>No.200, No.100, No.50, No.30, No.8, No.4, 3/8", 1/2", 3/4"</strong>. Aplikasi AGREGAT MIX menyediakan data contoh yang 100% cocok dengan teks PDF sekaligus fleksibel untuk pengujian spesifikasi proyek riil lainnya.
        </p>
      </div>
    </div>
  );
};
