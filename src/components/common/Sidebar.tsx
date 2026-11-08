import React from 'react';
import { 
  LayoutDashboard, 
  Layers2, 
  Layers3, 
  TableProperties, 
  History, 
  FileText, 
  Info,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { NavigationMenu } from '../../types';

interface SidebarProps {
  currentMenu: NavigationMenu;
  onSelectMenu: (menu: NavigationMenu) => void;
  savedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentMenu, onSelectMenu, savedCount }) => {
  const menuItems = [
    {
      id: 'dashboard' as NavigationMenu,
      label: 'Dashboard',
      icon: LayoutDashboard,
      desc: 'Ringkasan & status',
    },
    {
      id: 'fraksi2' as NavigationMenu,
      label: 'Pencampuran 2 Fraksi',
      subtitle: '(2-Fraction Blending)',
      icon: Layers2,
      desc: 'Bujur Sangkar 10x10',
    },
    {
      id: 'fraksi3' as NavigationMenu,
      label: 'Pencampuran 3 Fraksi',
      subtitle: '(3-Fraction Blending)',
      icon: Layers3,
      desc: 'Metode Rothfuchs A & B',
    },
    {
      id: 'saringan' as NavigationMenu,
      label: 'Data Saringan',
      subtitle: '(Sieve Reference)',
      icon: TableProperties,
      desc: 'Standar ASTM / SNI',
    },
    {
      id: 'history' as NavigationMenu,
      label: 'Riwayat Perhitungan',
      subtitle: '(Calculation History)',
      icon: History,
      badge: savedCount,
      desc: 'Hasil tersimpan lokal',
    },
    {
      id: 'laporan' as NavigationMenu,
      label: 'Laporan',
      subtitle: '(Engineering Report)',
      icon: FileText,
      desc: 'Cetak & ekspor dokumen',
    },
    {
      id: 'about' as NavigationMenu,
      label: 'Tentang Aplikasi',
      subtitle: '(About & Theory)',
      icon: Info,
      desc: 'Dokumentasi & referensi PDF',
    },
  ];

  return (
    <aside className="w-72 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800 select-none shadow-xl">
      {/* Brand & Logo Header */}
      <div className="p-6 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-md shadow-blue-900/40 border border-blue-400/30">
            <SlidersHorizontal className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-extrabold tracking-tight text-white text-lg flex items-center gap-1.5">
              <span>AGREGAT</span>
              <span className="text-blue-400">MIX</span>
            </div>
            <div className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">
              Aggregate Blending Calculator
            </div>
          </div>
        </div>
        <div className="mt-3.5 inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-950/60 border border-blue-800/40 text-[11px] text-blue-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Metode Grafis Rekayasa Sipil</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Menu Utama (Main Menu)
        </div>
        {menuItems.map((item) => {
          const isActive = currentMenu === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectMenu(item.id)}
              className={`w-full group flex items-center justify-between px-3.5 py-3 rounded-lg text-left transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-700/25 border border-blue-500/50'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  }`}
                />
                <div className="truncate">
                  <div className="text-sm font-semibold truncate leading-tight">
                    {item.label}
                  </div>
                  {item.subtitle && (
                    <div
                      className={`text-[11px] truncate leading-tight mt-0.5 ${
                        isActive ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {item.subtitle}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      isActive
                        ? 'bg-white text-blue-700'
                        : 'bg-slate-800 text-blue-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                <ChevronRight
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isActive
                      ? 'text-blue-200 translate-x-0.5'
                      : 'text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/30 text-xs text-slate-400">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="font-semibold text-slate-300">Versi 1.0 (Fondasi)</span>
          <span className="text-emerald-400 font-mono">Civil-v1</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Dirancang untuk Laboratorium Perkerasan Jalan & Bahan Konstruksi Teknik Sipil.
        </p>
      </div>
    </aside>
  );
};
