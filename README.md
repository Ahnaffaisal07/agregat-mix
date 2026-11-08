# AGREGAT MIX – Aggregate Blending Calculator

> **Aplikasi Rekayasa Teknik Sipil untuk Perancangan Campuran Agregat (Job Mix Formula / JMF)**  
> Berdasarkan Metode Grafis Resmi: Bujur Sangkar $10 \times 10\text{ cm}$ dan Metode Rothfuchs Tipe A & B.  
> Standar Acuan: *materi-pencampuran-agregat.pdf*, Spesifikasi Umum Bina Marga, SNI 03-1968, ASTM C136.

---

## 📋 Daftar Isi
1. [Tentang Aplikasi](#-tentang-aplikasi)
2. [Fitur Utama](#-fitur-utama)
3. [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
4. [Instalasi & Menjalankan di Komputer Lokal](#-instalasi--menjalankan-di-komputer-lokal)
5. [Panduan Deployment ke Vercel (Gratis)](#-panduan-deployment-ke-vercel-gratis)
6. [Struktur Proyek](#-struktur-proyek)
7. [Lisensi & Penulis](#-lisensi--penulis)

---

## 🎯 Tentang Aplikasi

**AGREGAT MIX** adalah perangkat lunak berbasis web yang dirancang khusus untuk mahasiswa, dosen, teknisi laboratorium, dan praktisi perkerasan jalan raya untuk melakukan analisis perancangan proporsi pencampuran fraksi agregat (*aggregate blending*).

Aplikasi ini mengonversi prosedur manual konvensional (menggambar di kertas milimeter blok) menjadi sistem komputasi digital interaktif berkecepatan tinggi tanpa mengubah prinsip geometris aslinya.

---

## ⚡ Fitur Utama

- **Pencampuran 2 Fraksi Agregat (Metode Bujur Sangkar $10 \times 10\text{ cm}$)**:
  - Analisis otomatis daerah arsiran kelayakan (*feasible range*).
  - Penentuan saringan pembatas kiri (misal: Saringan No. 4) dan pembatas kanan (misal: Saringan ¾ inci).
  - Garis rekomendasi proporsi tengah otomatis serta slider interaktif yang responsif.
  - Diagram bujur sangkar interaktif dengan tanda batas spesifikasi.

- **Pencampuran 3 Fraksi Agregat**:
  - **Rothfuchs Tipe A (Grafis Murni 31:35:34 & Penyesuaian 30:30:40)**: Berdasarkan garis diagonal dan prinsip keseimbangan jarak vertikal / luasan penyimpangan.
  - **Rothfuchs Tipe B (20:49:31)**: Berdasarkan garis aproksimasi kompensasi luasan setara dan perpotongan garis hubung silang pada diagonal.
  - **Optimasi Numerik Kuadrat Terkecil (*Least-Squares*)**: Fitur matematis komparatif yang meminimalkan $\sum (P_{\text{campuran}} - P_{\text{mid}})^2$.

- **Sistem Input Fleksibel**:
  - *Manual Input*: Edit sel, tambah/hapus baris saringan, validasi nilai $0-100\%$, dukungan koma/titik desimal.
  - *Excel Import*: Mendukung file `.xlsx`, `.xls`, dan `.csv` dengan fitur *drag and drop* serta pencocokan kolom otomatis (*auto-mapping*).
  - *Download Template*: Template Excel 2 Fraksi dan 3 Fraksi yang siap diisi.

- **Visualisasi Kurva Gradasi Standar (S-Curve)**:
  - Sumbu ukuran saringan logaritmik (mm).
  - Menampilkan kurva fraksi individual, kurva campuran gabungan, amplop spesifikasi (min & max), serta gradasi tengah.

- **Penyimpanan Lokal (Local Storage Ber-versioning)**:
  - Menyimpan seluruh parameter input, proporsi, geometri, dan metadata proyek (`schemaVersion: 1`).
  - Fitur buka, edit identitas, duplikasi, ekspor Excel, backup JSON, dan restore JSON.

- **Laporan Rekayasa Teknik Sipil Lengkap 13 Bagian (A s/d M)**:
  - Standar format pengesahan 3 pihak (Teknisi Lab, Quality Control, Kepala Laboratorium).
  - Tombol **Cetak / Simpan PDF** langsung via dialog browser.
  - Tombol **Unduh Excel** multi-sheet (Hasil Evaluasi, Data Awal, Metodologi).

---

## 💻 Teknologi yang Digunakan

- **Frontend**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 5](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Grafik & Diagram**: [Recharts](https://recharts.org/) & Vector SVG
- **Pemrosesan Excel**: [SheetJS (xlsx)](https://sheetjs.com/)
- **Ikon UI**: [Lucide React](https://lucide.dev/)

---

## 🚀 Instalasi & Menjalankan di Komputer Lokal

### Prasyarat
- Pastikan komputer Anda telah terinstal **Node.js** (versi 18 ke atas disarankan).  
  Unduh di: [https://nodejs.org/](https://nodejs.org/)

### Langkah Menjalankan:
1. Buka terminal (Command Prompt / PowerShell / Git Bash) di folder proyek ini.
2. Pasang seluruh dependensi:
   ```bash
   npm install
   ```
3. Jalankan development server:
   ```bash
   npm run dev
   ```
4. Buka peramban Anda di: `http://localhost:3000/`

---

## 🌐 Panduan Deployment ke Vercel (Gratis)

Aplikasi AGREGAT MIX telah dipersiapkan secara lengkap untuk deployment ke Vercel dengan konfigurasi file `vercel.json` dan optimasi chunking pada `vite.config.ts`.

### Metode 1: Menggunakan Git & GitHub (Direkomendasikan)

#### Langkah 1: Buat Repository Baru di GitHub
1. Buka [https://github.com/](https://github.com/) dan masuk ke akun GitHub Anda.
2. Klik tombol **New** (atau tanda `+` di kanan atas lalu pilih **New repository**).
3. Beri nama repository, misalnya: `agregat-mix`.
4. Pilih opsi **Public** (atau **Private**).
5. Jangan mencentang *"Initialize this repository with a README"*, lalu klik **Create repository**.

#### Langkah 2: Unggah Source Code ke GitHub
Buka terminal / PowerShell di folder proyek Anda, lalu jalankan perintah berikut secara berurutan:

```bash
# Inisialisasi git lokal
git init

# Tambahkan seluruh file proyek (file yang diabaikan oleh .gitignore tidak akan ikut terunggah)
git add .

# Buat commit pertama
git commit -m "Initial commit: AGREGAT MIX ready for Vercel deployment"

# Ubah branch utama menjadi main
git branch -M main

# Hubungkan ke repository GitHub Anda (ganti USERNAME dan REPO_NAME sesuai akun Anda)
git remote add origin https://github.com/USERNAME/agregat-mix.git

# Unggah kode ke GitHub
git push -u origin main
```

*(Catatan: Jika Anda belum menginstal Git CLI di komputer, Anda juga dapat mengunggah file langsung melalui tombol **"Upload files"** di halaman repository GitHub).*

#### Langkah 3: Hubungkan GitHub ke Vercel
1. Buka [https://vercel.com/](https://vercel.com/) dan buat akun gratis (*Hobby Tier*) menggunakan akun GitHub Anda.
2. Di halaman Dashboard Vercel, klik tombol **Add New...** $\rightarrow$ **Project**.
3. Pilih repository `agregat-mix` dari daftar repository GitHub Anda, lalu klik **Import**.
4. Pada halaman konfigurasi project:
   - **Framework Preset**: Vite (akan terdeteksi secara otomatis).
   - **Root Directory**: `./` (biarkan default).
   - **Build Command**: `npm run build` (sudah terkonfigurasi di `vercel.json`).
   - **Output Directory**: `dist` (sudah terkonfigurasi di `vercel.json`).
5. Klik tombol **Deploy**.

#### Langkah 4: Proses Deployment & Verifikasi URL
1. Tunggu 1–2 menit hingga proses build dan deployment Vercel selesai.
2. Setelah selesai, Vercel akan menampilkan animasi perayaan dan memberikan domain publik gratis, contohnya:  
   `https://agregat-mix.vercel.app` atau `https://agregat-mix-username.vercel.app`.
3. Buka URL tersebut di browser untuk memastikan seluruh fungsi berjalan sempurna di internet.

---

### Cara Memperbarui Website (Continuous Deployment)
Setiap kali Anda melakukan perbaikan kode di komputer lokal:
```bash
git add .
git commit -m "Update fitur atau perbaikan data"
git push origin main
```
Vercel akan secara otomatis mendeteksi perubahan tersebut dan melakukan build ulang secara otomatis dalam beberapa detik tanpa perlu konfigurasi manual lagi.

---

## 📁 Struktur Proyek

```text
AGREGAT-MIX/
├── dist/                      # Direktori output hasil build produksi
├── src/
│   ├── components/            # Komponen antarmuka pengguna (UI)
│   │   ├── common/            # Header, Sidebar, GradationChart, SaveModal
│   │   ├── dashboard/         # Dashboard ringkasan & navigasi
│   │   ├── fraksi2/           # Perhitungan 2 Fraksi & Bujur Sangkar SVG
│   │   ├── fraksi3/           # Perhitungan 3 Fraksi & Rothfuchs Plot
│   │   ├── history/           # Riwayat Local Storage & manajemen backup
│   │   ├── input/             # Manual Input Table & Excel Import Tab
│   │   ├── laporan/           # Dokumen Laporan Resmi Teknik Sipil 13 Bagian
│   │   └── saringan/          # Tabel standar ASTM / SNI / Bina Marga
│   ├── core/                  # Engine komputasi matematis & algoritma grafis
│   │   ├── blendingEngine.ts  # Rumus pembobotan campuran
│   │   ├── presets.ts         # Data contoh terverifikasi dari PDF
│   │   ├── twoFractionEngine.ts # Logika bujur sangkar 10x10 & feasible range
│   │   ├── threeFractionEngine.ts # Logika Rothfuchs A, B & Optimasi Numerik
│   │   └── validationEngine.ts# Parser angka & validasi batas spesifikasi
│   ├── services/              # Layanan eksternal (Storage, Excel, Template)
│   ├── types/                 # Definisi tipe data TypeScript
│   ├── App.tsx                # Komponen root aplikasi
│   ├── index.css              # Konfigurasi Tailwind CSS & print media
│   └── main.tsx               # Titik masuk React DOM
├── .gitignore                 # Daftar file/folder yang dikecualikan dari Git
├── package.json               # Konfigurasi dependensi & scripts
├── tsconfig.json              # Konfigurasi compiler TypeScript
├── vercel.json                # Konfigurasi deployment Vercel
├── vite.config.ts             # Konfigurasi Vite & modular chunking
└── README.md                  # Dokumentasi proyek & panduan deployment
```

---

## 📄 Lisensi
Dikembangkan untuk keperluan akademik dan praktikum Teknik Sipil – Rekayasa Transportasi & Perkerasan Jalan Raya.
