import React, { useState, useEffect } from 'react';
import { NavigationMenu, CalculationHistoryItem } from './types';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { Fraksi2View } from './components/fraksi2/Fraksi2View';
import { Fraksi3View } from './components/fraksi3/Fraksi3View';
import { SaringanView } from './components/saringan/SaringanView';
import { HistoryView } from './components/history/HistoryView';
import { LaporanView } from './components/laporan/LaporanView';
import { AboutView } from './components/about/AboutView';
import { getStoredCalculations } from './services/storageService';

export const App: React.FC = () => {
  const [currentMenu, setCurrentMenu] = useState<NavigationMenu>('dashboard');
  const [historyList, setHistoryList] = useState<CalculationHistoryItem[]>([]);
  const [loadedProject, setLoadedProject] = useState<CalculationHistoryItem | null>(null);

  // Load history from local storage on mount
  useEffect(() => {
    const list = getStoredCalculations();
    setHistoryList(list);
  }, []);

  const handleRefreshHistory = () => {
    setHistoryList(getStoredCalculations());
  };

  const handleSelectHistory = (item: CalculationHistoryItem) => {
    setLoadedProject(item);
    if (item.mode === '2_fraksi') {
      setCurrentMenu('fraksi2');
    } else {
      setCurrentMenu('fraksi3');
    }
  };

  const handleOpenReport = (item: CalculationHistoryItem) => {
    setLoadedProject(item);
    setCurrentMenu('laporan');
  };

  const handleClearLoaded = () => {
    setLoadedProject(null);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* Left Sidebar (Navy Blue) */}
      <Sidebar
        currentMenu={currentMenu}
        onSelectMenu={setCurrentMenu}
        savedCount={historyList.length}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentMenu={currentMenu}
          onNavigate={setCurrentMenu}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto px-8 py-8">
          {currentMenu === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentMenu}
              historyList={historyList}
              onSelectHistory={handleSelectHistory}
            />
          )}

          {currentMenu === 'fraksi2' && (
            <Fraksi2View
              loadedItem={loadedProject}
              onClearLoaded={handleClearLoaded}
              onHistoryUpdate={handleRefreshHistory}
            />
          )}

          {currentMenu === 'fraksi3' && (
            <Fraksi3View
              loadedItem={loadedProject}
              onClearLoaded={handleClearLoaded}
              onHistoryUpdate={handleRefreshHistory}
            />
          )}

          {currentMenu === 'saringan' && <SaringanView />}

          {currentMenu === 'history' && (
            <HistoryView
              historyList={historyList}
              onHistoryUpdate={setHistoryList}
              onSelectHistory={handleSelectHistory}
              onOpenReport={handleOpenReport}
            />
          )}

          {currentMenu === 'laporan' && (
            <LaporanView
              loadedProject={loadedProject}
              historyList={historyList}
              onSelectProject={setLoadedProject}
            />
          )}

          {currentMenu === 'about' && <AboutView />}
        </main>
      </div>
    </div>
  );
};

export default App;
