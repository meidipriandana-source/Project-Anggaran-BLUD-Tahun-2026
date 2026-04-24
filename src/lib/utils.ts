import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID').format(value);
}

export const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const TRIWULAN_LABELS = ['Triwulan I', 'Triwulan II', 'Triwulan III', 'Triwulan IV'];

export const BUDGET_GROUPS = [
  {
    id: 'makan_minum',
    name: 'Belanja Makanan dan Minuman Rapat (5.1.02.01.01.0052)',
    planned: 47500000,
    items: [
      { id: 'nasi_kotak', desc: 'Nasi Kotak Biasa 500 Kotak', planned: 26500000, key: 'Nasi Kotak Biasa' },
      { id: 'snack_kotak', desc: 'Snack Ringan Kotak 1000 Kotak', planned: 21000000, key: 'Snack Ringan Kotak' }
    ]
  },
  {
    id: 'honorarium',
    name: 'Honorarium Narasumber/Pembahas, Moderator, Pembawa Acara, dan Panitia (5.1.02.02.01.0003)',
    planned: 10200000,
    items: [
      { id: 'hono_narsum', desc: 'Honorarium Narasumber/Pembahas 3 orang/keg', planned: 9000000, key: 'Honorarium Narasumber' },
      { id: 'hono_mc', desc: 'Honorarium Pembawa Acara 3 orang/keg', planned: 1200000, key: 'Honorarium Pembawa Acara' }
    ]
  },
  {
    id: 'kursus',
    name: 'Belanja Kursus Singkat/Pelatihan (5.1.02.02.12.0001)',
    planned: 945000000,
    items: [
      { id: 'kontri_akred', desc: 'Belanja Kontribusi Untuk Akreditasi/Prognas 1 Tahun', planned: 680000000, key: 'Kontribusi Untuk Akreditasi/Prognas' },
      { id: 'kontri_dr', desc: 'Belanja Kontribusi Untuk Dokter Spesialis, Fellow dan Konsultan (53 Orang) 1 Tahun', planned: 265000000, key: 'Kontribusi Untuk Dokter Spesialis' }
    ]
  },
  {
    id: 'perjadin',
    name: 'Belanja Perjalanan Dinas Biasa (5.1.02.04.01.0001)',
    planned: 1465000000,
    items: [
      { id: 'perjadin_narsum_dalam', desc: 'Perjalanan Dinas Narasumber Dalam Daerah 5 Orang', planned: 15000000, key: 'Perjadin Narasumber Dalam Daerah' },
      { id: 'perjadin_narsum_luar', desc: 'Perjalanan Dinas Narasumber Luar Daerah 5 Orang', planned: 50000000, key: 'Perjadin Narasumber Luar Daerah' },
      { id: 'perjadin_akred', desc: 'Perjalanan Dinas Untuk Akreditasi/Prognas 1 Tahun', planned: 870000000, key: 'Perjalanan Dinas Untuk Akreditasi/Prognas' },
      { id: 'perjadin_dr', desc: 'Perjalanan Dinas Untuk Dokter Spesialis, Fellow dan Konsultan (53 Orang) 1 Tahun', planned: 530000000, key: 'Perjalanan Dinas Untuk Dokter Spesialis, Fellow dan Konsultan' }
    ]
  }
];

export const TOTAL_PAGU = 2467700000;
export const TRIWULAN_PLANS = [1229425000, 434425000, 434425000, 369425000];
