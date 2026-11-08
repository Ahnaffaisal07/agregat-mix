import React from 'react';
import { NavigationMenu } from '../../types';
import { 
  FileSpreadsheet, 
  BookOpen, 
  Layers2, 
  Layers3, 
  Sparkles, 
  CheckCircle2 
} from 'lucide-react';

interface HeaderProps {
  currentMenu: NavigationMenu;
  onNavigate: (menu: NavigationMenu) => void;
  onLoadPreset2F?: () => void;
  onLoadPreset3F?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentMenu, 
  onNavigate,
  onLoadPreset2F,
  onLoadPreset3F 
}) => {
  const getMenuDetails = () => {
    switch (currentMenu) {
      case 'dashboard':
        return {
          title: 'Dashboard Utama (Main Dashboard)',
          subtitle: 'Sistem analisis pencampuran agregat berbasis metode grafis rekayasa sipil',
          badge: 'Sistem Aktif',
        };
      case 'fraksi2':
        return {
          title: 'Pencampuran 2 Fraksi Agregat (2-Fraction Blending)',
          subtitle: 'Metode grafis bujur sangkar 10x10 cm untuk Agregat Kasar (A) dan Agregat Halus (B)',
          badge: 'Metode Bujur Sangkar',
        };
      case 'fraksi3':
        return {
          title: 'Pencampuran 3 Fraksi Agregat (3-Fraction Blending)',
          subtitle: 'Metode grafis Rothfuchs Tipe A & B dengan transformasi sumbu diagonal',
          badge: 'Metode Rothfuchs',
        };
      case 'saringan':
        return {
          title: 'Data Saringan Standar (Sieve Size Reference)',
          subtitle: 'Tabel ukuran bukaan saringan menurut standar ASTM E11 dan SNI Bina Marga',
          badge: 'Standar ASTM / SNI',
        };
      case 'history':
        return {
          title: 'Riwayat Perhitungan (Calculation History)',
          subtitle: 'Daftar hasil perhitungan rancangan campuran yang tersimpan di Local Storage',
          badge: 'Penyimpanan Lokal',
        };
      case 'laporan':
        return {
          title: 'Laporan Rekayasa Campuran (Engineering Report)',
          subtitle: 'Ringkasan komprehensif, evaluasi spesifikasi, dan cetak dokumen teknis',
          badge: 'Siap Cetak',
        };
      case 'about':
        return {
          title: 'Tentang Aplikasi & Teori Dasar (About & Theory)',
          subtitle: 'Dokumentasi metodologi dari materi-pencampuran-agregat.pdf',
          badge: 'Referensi Akademik',
        };
    }
  };

  const details = getMenuDetails();

  return (
    <header className="h-20 bg-white border-b border-slate-200/90 px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
      {/* Title & Subtitle */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {details.title}
          </h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            {details.badge}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          {details.subtitle}
        </p>
      </div>

      {/* Quick Actions in Header */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => {
            onNavigate('fraksi2');
            if (onLoadPreset2F) onLoadPreset2F();
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300/80 transition-all shadow-sm active:scale-95"
          title="Buka Halaman 2 Fraksi dengan data contoh PDF"
        >
          <Layers2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Contoh 2 Fraksi</span>
        </button>

        <button
          onClick={() => {
            onNavigate('fraksi3');
            if (onLoadPreset3F) onLoadPreset3F();
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300/80 transition-all shadow-sm active:scale-95"
          title="Buka Halaman 3 Fraksi dengan data contoh PDF"
        >
          <Layers3 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Contoh 3 Fraksi</span>
        </button>

        <button
          onClick={() => onNavigate('about')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-sm active:scale-95 ml-1"
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span>Materi PDF</span>
        </button>
      </div>
    </header>
  );
};
