import { CalculationHistoryItem } from '../types';
import { PRESET_PDF_2_FRAKSI, PRESET_PDF_3_FRAKSI } from '../core/presets';

const STORAGE_KEY = 'agregat_mix_history_v1';
export const CURRENT_SCHEMA_VERSION = 1;

const DEFAULT_HISTORY: CalculationHistoryItem[] = [
  {
    schemaVersion: 1,
    id: 'hist-1',
    name: 'Kasus 2 Fraksi - Contoh Materi PDF (Tabel 3.1 & 3.2)',
    projectName: 'Peningkatan Jalan Ruas Lintas Tengah (AC-WC)',
    engineerName: 'Laboratorium Pengujian Bahan Jalan',
    location: 'Km 14+200',
    documentNo: 'AMR-2026-001',
    timestamp: '2026-11-03 10:15',
    mode: '2_fraksi',
    method: 'bujur_sangkar_2f',
    proportions: {
      fractionA: 46,
      fractionB: 54,
    },
    sieveData: PRESET_PDF_2_FRAKSI,
    notes: 'Perhitungan grafis bujur sangkar 10x10 cm. Menghasilkan 46% Agregat Kasar dan 54% Agregat Halus. Seluruh saringan memenuhi spesifikasi Bina Marga.',
  },
  {
    schemaVersion: 1,
    id: 'hist-2',
    name: 'Kasus 3 Fraksi - Rothfuchs Tipe A Penyesuaian (Tabel 3.10)',
    projectName: 'Preservasi Jalan Arteri Provinsi (AC-BC)',
    engineerName: 'Divisi Perkerasan Aspal',
    location: 'Ruas Jalur Pantura',
    documentNo: 'AMR-2026-002',
    timestamp: '2026-11-03 10:45',
    mode: '3_fraksi',
    method: 'rothfuchs_tipe_a',
    proportions: {
      fractionA: 30,
      fractionB: 30,
      fractionC: 40,
    },
    sieveData: PRESET_PDF_3_FRAKSI,
    notes: 'Hasil penyesuaian dari proporsi awal 31:35:34 menjadi 30:30:40 agar saringan No.100 lebih aman di atas batas minimum spesifikasi.',
  },
  {
    schemaVersion: 1,
    id: 'hist-3',
    name: 'Kasus 3 Fraksi - Rothfuchs Tipe B (Tabel 3.11)',
    projectName: 'Pembangunan Akses Logistik Bandara',
    engineerName: 'Konsultan Supervisi Jalan Raya',
    location: 'Seksi 2 Sta 08+500',
    documentNo: 'AMR-2026-003',
    timestamp: '2026-11-03 11:00',
    mode: '3_fraksi',
    method: 'rothfuchs_tipe_b',
    proportions: {
      fractionA: 20,
      fractionB: 49,
      fractionC: 31,
    },
    sieveData: PRESET_PDF_3_FRAKSI,
    notes: 'Metode Rothfuchs Tipe B dengan garis aproksimasi kompensasi luasan setara dan perpotongan garis hubung silang pada diagonal tengah.',
  },
];

/**
 * Memastikan item memiliki schemaVersion saat dimuat
 */
function migrateItem(item: any): CalculationHistoryItem {
  return {
    schemaVersion: item.schemaVersion ?? 1,
    id: item.id || 'calc_' + Date.now(),
    name: item.name || 'Perancangan Campuran',
    projectName: item.projectName || item.name || 'Proyek Campuran Agregat',
    engineerName: item.engineerName || 'Laboratorium Bahan Konstruksi',
    location: item.location || 'Laboratorium Uji',
    documentNo: item.documentNo || 'AMR-' + (item.id || 'DOC'),
    timestamp: item.timestamp || new Date().toLocaleString('id-ID'),
    updatedAt: item.updatedAt,
    mode: item.mode || '2_fraksi',
    method: item.method || (item.mode === '3_fraksi' ? 'rothfuchs_tipe_a' : 'bujur_sangkar_2f'),
    proportions: item.proportions || { fractionA: 50, fractionB: 50 },
    sieveData: item.sieveData || (item.mode === '3_fraksi' ? PRESET_PDF_3_FRAKSI : PRESET_PDF_2_FRAKSI),
    notes: item.notes || '',
    typeAPos: item.typeAPos,
    typeBPoints: item.typeBPoints,
  };
}

/**
 * Membaca seluruh riwayat perhitungan dari LocalStorage
 */
export function getStoredCalculations(): CalculationHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_HISTORY));
      return DEFAULT_HISTORY;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return DEFAULT_HISTORY;
    }
    return parsed.map(migrateItem);
  } catch (error) {
    console.error('Gagal membaca data riwayat dari LocalStorage:', error);
    return DEFAULT_HISTORY;
  }
}

/**
 * Menyimpan perhitungan baru ke LocalStorage
 */
export function saveCalculation(
  item: Omit<CalculationHistoryItem, 'id' | 'timestamp' | 'schemaVersion'>
): CalculationHistoryItem {
  const current = getStoredCalculations();
  const nowStr = new Date().toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const newItem: CalculationHistoryItem = {
    ...item,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: 'calc_' + Date.now(),
    timestamp: nowStr,
    updatedAt: nowStr,
    projectName: item.projectName || item.name,
    engineerName: item.engineerName || 'Laboratorium Bahan Jalan',
    location: item.location || 'Laboratorium',
    documentNo: item.documentNo || `AMR-${Date.now().toString().slice(-6)}`,
  };

  const updated = [newItem, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Gagal menyimpan riwayat ke LocalStorage:', error);
  }

  return newItem;
}

/**
 * Mengupdate data perhitungan yang sudah ada
 */
export function updateCalculation(
  id: string,
  updates: Partial<Omit<CalculationHistoryItem, 'id'>>
): CalculationHistoryItem[] {
  const current = getStoredCalculations();
  const nowStr = new Date().toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updated = current.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        ...updates,
        updatedAt: nowStr,
      };
    }
    return item;
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Gagal mengupdate riwayat di LocalStorage:', error);
  }

  return updated;
}

/**
 * Menduplikasi perhitungan menjadi salinan baru
 */
export function duplicateCalculation(id: string): CalculationHistoryItem | null {
  const current = getStoredCalculations();
  const target = current.find((item) => item.id === id);
  if (!target) return null;

  const nowStr = new Date().toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const duplicated: CalculationHistoryItem = {
    ...target,
    id: 'calc_' + Date.now(),
    name: `${target.name} (Salinan)`,
    projectName: target.projectName ? `${target.projectName} (Salinan)` : `${target.name} (Salinan)`,
    documentNo: `AMR-${Date.now().toString().slice(-6)}`,
    timestamp: nowStr,
    updatedAt: nowStr,
  };

  const updated = [duplicated, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Gagal menduplikasi riwayat di LocalStorage:', error);
  }

  return duplicated;
}

/**
 * Menghapus perhitungan dari LocalStorage berdasarkan ID
 */
export function deleteCalculation(id: string): CalculationHistoryItem[] {
  const current = getStoredCalculations();
  const updated = current.filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Gagal menghapus riwayat dari LocalStorage:', error);
  }
  return updated;
}

/**
 * Mengosongkan seluruh riwayat perhitungan
 */
export function clearAllCalculations(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Gagal mengosongkan riwayat:', error);
  }
}

/**
 * Mengekspor seluruh data riwayat ke file string JSON
 */
export function exportHistoryToJson(): string {
  const data = getStoredCalculations();
  return JSON.stringify(
    {
      app: 'AGREGAT MIX',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      calculations: data,
    },
    null,
    2
  );
}

/**
 * Mengimpor riwayat dari file JSON
 */
export function importHistoryFromJson(jsonStr: string): {
  success: boolean;
  count: number;
  items: CalculationHistoryItem[];
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonStr);
    let items: any[] = [];
    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (parsed && Array.isArray(parsed.calculations)) {
      items = parsed.calculations;
    } else {
      return { success: false, count: 0, items: [], error: 'Format JSON tidak valid (harus berisi array perhitungan).' };
    }

    const current = getStoredCalculations();
    const migrated = items.map(migrateItem);
    // Gabungkan dengan deduplikasi berdasarkan id
    const existingIds = new Set(current.map((c) => c.id));
    const newItems = migrated.filter((m) => !existingIds.has(m.id));
    const merged = [...newItems, ...current];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return { success: true, count: newItems.length, items: merged };
  } catch (err: any) {
    return { success: false, count: 0, items: [], error: err.message || 'Gagal memproses file JSON' };
  }
}
