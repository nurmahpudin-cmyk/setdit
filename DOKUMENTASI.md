# Dokumentasi Sistem Setdit - SK Perhutanan

## Daftar Isi
1. [Pengguna & Role Akses](#1-pengguna--role-akses)
2. [Workflow SK Perhutanan](#2-workflow-sk-perhutanan)
3. [Tugas per Role Akses](#3-tugas-per-role-akses)
4. [SLA (Service Level Agreement)](#4-sla-service-level-agreement)

---

## 1. Pengguna & Role Akses

### 1.1 Definisi Role

| Role Code | Role Name | Deskripsi | 
|-----------|-----------|------------|
| `SUPER_ADMIN` | Super Admin | Kelola seluruh sistem |
| `ADMIN_TU` | Admin TU | Agenda surat, penomoran, tata naskah |
| `ASPRI_DIRJEN` | Aspri Dirjen | Mengelola jadwal pimpinan |
| `OPERATOR` | Operator | Input draft, upload dokumen, revisi |
| `VERIFIKATOR` | Verifikator | Verifikasi administrasi dan disposisi |
| `REVIEWER` | Reviewer | Telaah substansi dan hukum |
| `APPROVER` | Approver | Persetujuan/TTD dokumen |
| `ARSIPARIS` | Arsiparis | Salinan, scan, arsip dokumen |
| `MONITORING` | Monitoring | Hanya melihat laporan dan progres |

### 1.2 Jabatan dalam Workflow SK

| Jabatan Code | Role Default | User |
|--------------|--------------|------|
| `TU_SETDITJEN` | ADMIN_TU | admin_tu |
| `SEKDITJEN_PS` | APPROVER | sekditjen_ps |
| `KABAG_PEHKT` | REVIEWER | kabag_pehkt |
| `KETUA_POKJA_HUKUM` | REVIEWER | ketua_pokja |
| `ANGGOTA_POKJA_HUKUM` | REVIEWER | anggota_pokja1-4 |
| `DIRJEN_PS` | APPROVER | dirjen_ps |
| `PETUGAS_ARSIP` | ARSIPARIS | petugas_arsip |
| `STAF_PKPS` | OPERATOR | - |
| `KOOR_PKPS` | VERIFIKATOR | - |
| `ASPRI_DIRJEN` | ASPRI_DIRJEN | - |

### 1.3 Struktur Akses

```
SUPER_ADMIN
├── Akses penuh ke semua fitur
│
├── ADMIN_TU (Admin TU)
│   ├── Input draft SK
│   ├── Upload dokumen
│   ├── Penomoran ND & SK
│   └── Proses arsip
│
├── APPROVER
│   ├── DIRJEN_PS (Dirjen)
│   └── SEKDITJEN_PS (Sekditjen)
│       └── Approval di level masing-masing
│
├── REVIEWER
│   ├── KABAG_PEHKT (Kabag)
│   ├── KETUA_POKJA_HUKUM (Ketua Pokja)
│   └── ANGGOTA_POKJA_HUKUM (Anggota)
│       └── Telaah dan approve substansi
│
├── ARSIPARIS
│   ├── Scan dokumen
│   └── Arsip SK
│
└── MONITORING
    └── View only (laporan & progres)
```

---

## 2. Workflow SK Perhutanan

### 2.1 Alur Kerja (17 Steps)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WORKFLOW SK PERHUTANAN                              │
└─────────────────────────────────────────────────────────────────────────────┘

Step 1  │ INPUT oleh Admin TU
        │ ┌──────────────────────────────────────────────────────────────┐
        │ │ Jabatan: TU_SETDITJEN (ADMIN_TU)                           │
        │ │ Action: INPUT - Input data SK baru                          │
        │ └──────────────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
Step 2  │ DISPOSISI Setditjen PS
        │ ┌──────────────────────────────────────────────────────────────┐
        │ │ Jabatan: SEKDITJEN_PS (APPROVER)                            │
        │ │ Action: DISPOSISI - Disposisi ke Kabag                       │
        │ └──────────────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
Step 3  │ DISPOSISI Kabag PEHKT
        │ ┌──────────────────────────────────────────────────────────────┐
        │ │ Jabatan: KABAG_PEHKT (REVIEWER)                              │
        │ │ Action: DISPOSISI - Distribusi ke Pokja                      │
        │ └──────────────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
Step 4  │ DISTRIBUSI ke Anggota
        │ ┌──────────────────────────────────────────────────────────────┐
        │ │ Jabatan: KETUA_POKJA_HUKUM (REVIEWER)                        │
        │ │ Action: DISTRIBUSI - Distribusi ke anggota pokja             │
        │ └──────────────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
Step 5  │ TELAAH Anggota ◄──[SLA Pause Point]
        │ ┌──────────────────────────────────────────────────────────────┐
        │ │ Jabatan: ANGGOTA_POKJA_HUKUM (REVIEWER)                      │
        │ │ Action: TELAAH - Telaah substansi                            │
        │ │ Catatan: Jika minta revisi, SLA di-pause                     │
        │ └──────────────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
Step 6  │ APPROVAL Ketua Pokja
        │ ┌──────────────────────────────────────────────────────────────┐
        │ │ Jabatan: KETUA_POKJA_HUKUM (REVIEWER)                        │
        │ │ Action: APPROVE                                             │
        │ └──────────────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
Step 7  │ APPROVAL Kabag PEHKT
        │ ┌──────────────────────────────────────────────────────────────┐
        │ │ Jabatan: KABAG_PEHKT (REVIEWER)                              │
        │ │ Action: APPROVE                                             │
        │ └──────────────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
Step 8  │ APPROVAL Kasubbag TU
        │ ┌──────────────────────────────────────────────────────────────┐
        │ │ Jabatan: KASUBBAG_TU                                        │
        │ │ Action: APPROVE                                             │
        │ └──────────────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
Step 9  │ APPROVAL Setditjen
        │ ┌──────────────────────────────────────────────────────────────┐
        │ │ Jabatan: SEKDITJEN_PS (APPROVER)                             │
        │ │ Action: APPROVE                                             │
        │ └──────────────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
Step 10 │ PENOMORAN ND Pengantar
        │ ┌──────────────────────────────────────────────────────────────┐
        │ │ Jabatan: TU_SETDITJEN (ADMIN_TU)                            │
        │ │ Action: PENOMORAN - Penomoran Nota Dinas Pengantar           │
        │ └──────────────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
Step 11 │ APPROVAL Dirjen PS ◄──[Final Approval]
        │ ┌──────────────────────────────────────────────────────────────┐
        │ │ Jabatan: DIRJEN_PS (APPROVER)                                │
        │ │ Action: APPROVE - Persetujuan TTD                            │
        │ └──────────────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
Step 12 │ PENOMORAN SK
        │ ┌──────────────────────────────────────────────────────────────┐
        │ │ Jabatan: TU_SETDITJEN (ADMIN_TU)                            │
        │ │ Action: NOMOR_SK - Penomoran Surat Keterangan               │
        │ └──────────────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
Step 13 │ DISTRIBUSI SK ke Anggota
        │ ┌──────────────────────────────────────────────────────────────┐
        │ │ Jabatan: KETUA_POKJA_HUKUM (REVIEWER)                       │
        │ │ Action: DISTRIBUSI                                          │
        │ └──────────────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
Step 14 │ PROSES SALIN SK
        │ ┌──────────────────────────────────────────────────────────────┐
        │ │ Jabatan: ANGGOTA_POKJA_HUKUM (REVIEWER)                     │
        │ │ Action: FINALIZE - Proses salin/penggandaan SK             │
        │ └──────────────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
Step 15 │ APPROVAL Salinan SK (Ketua Pokja)
        │ ┌──────────────────────────────────────────────────────────────┐
        │ │ Jabatan: KETUA_POKJA_HUKUM (REVIEWER)                       │
        │ │ Action: APPROVE                                             │
        │ └──────────────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
Step 16 │ APPROVAL Salinan SK (Kabag)
        │ ┌──────────────────────────────────────────────────────────────┐
        │ │ Jabatan: KABAG_PEHKT (REVIEWER)                             │
        │ │ Action: APPROVE                                             │
        │ └──────────────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
Step 17 │ ARSIP & SCAN ◄──[END]
        │ ┌──────────────────────────────────────────────────────────────┐
        │ │ Jabatan: KETUA_POKJA_HUKUM (REVIEWER)                       │
        │ │ Action: ARCHIVE - Scan & arsip dokumen final               │
        │ └──────────────────────────────────────────────────────────────┘
        │
        ▼
    COMPLETED ✓
```

### 2.2 Status SK

| Status | Deskripsi |
|--------|-----------|
| `DRAFT` | Status awal, SK baru dibuat |
| `IN_PROGRESS` | Sedang diproses di salah satu step |
| `WAITING_REVISION` | Menunggu revisi dari pemohon |
| `APPROVED` | Disetujui (setelah approval Dirjen) |
| `SIGNED` | Ditandatangani |
| `PROSES_SALINAN_SK` | Dalam proses salinan/penggandaan |
| `COMPLETED` | Workflow selesai, sudah diarsipkan |

### 2.3 Action Types

| Action | Deskripsi |
|--------|-----------|
| `INPUT` | Input data baru |
| `DISPOSISI` | Disposisi ke step berikutnya |
| `TELAAH` | Telaah substansi |
| `APPROVE` | Persetujuan/approval |
| `PENOMORAN` | Penomoran Nota Dinas |
| `NOMOR_SK` | Penomoran Surat Keterangan |
| `DISTRIBUSI` | Distribusi dokumen |
| `FINALIZE` | Proses akhir (salin) |
| `ARCHIVE` | Arsip dan scan |
| `REVISION` | Permintaan revisi |

---

## 3. Tugas per Role Akses

### 3.1 SUPER_ADMIN
```
Tugas:
├── Kelola seluruh data sistem
├── Kelola user & role
├── Akses penuh ke semua menu
└── Monitoring semua aktivitas

Halaman:
├── Dashboard
├── Kelola User
├── Kelola Role & Permission
└── Laporan Statistik
```

### 3.2 ADMIN_TU (TU_SETDITJEN)
```
Tugas:
├── Step 1:  Input data SK baru
├── Step 10: Penomoran Nota Dinas Pengantar
├── Step 12: Penomoran Surat Keterangan
├── Upload dokumen pendukung
└── Proses arsip final

Halaman:
├── Input SK Baru
├── Daftar SK
├── Penomoran
└── Statistik
```

### 3.3 APPROVER (SEKDITJEN_PS, DIRJEN_PS)
```
Tugas:
├── SEKDITJEN_PS (Step 2, 9):
│   ├── Disposisi SK masuk
│   └── Approval sebelum penomoran
│
├── DIRJEN_PS (Step 11):
│   └── Approval final / TTD
│
Halaman:
├── Daftar SK Menunggu Approval
├── Detail SK
└── Approval/Reject
```

### 3.4 REVIEWER (KABAG_PEHKT, KETUA_POKJA_HUKUM, ANGGOTA_POKJA_HUKUM)
```
Tugas:
├── KABAG_PEHKT (Step 3, 7, 16):
│   ├── Distribusi ke pokja
│   ├── Approval telaah
│   └── Approval salinan SK
│
├── KETUA_POKJA_HUKUM (Step 4, 6, 13, 15, 17):
│   ├── Distribusi ke anggota
│   ├── Approval hasil telaah
│   ├── Distribusi SK
│   ├── Approval salinan
│   └── Arsip & scan
│
├── ANGGOTA_POKJA_HUKUM (Step 5, 14):
│   ├── Telaah substansi SK
│   └── Proses salin SK
│
Halaman:
├── Daftar SK untuk Telaah
├── Form Telaah
├── Approval/Reject
└── Proses Salin
```

### 3.5 ARSIPARIS (PETUGAS_ARSIP)
```
Tugas:
├── Scan dokumen SK
├── Arsip dokumen fisik
└── Kelola arsip digital

Halaman:
├── Daftar SK untuk Arsip
├── Upload Scan
└── Kelola Arsip
```

### 3.6 VERIFIKATOR (KOOR_PKPS)
```
Tugas:
├── Verifikasi administrasi
├── Verifikasi kelengkapan dokumen
└── Disposisi verifikasi

Halaman:
├── Daftar SK untuk Verifikasi
├── Form Verifikasi
└── Laporan Verifikasi
```

### 3.7 OPERATOR (STAF_PKPS)
```
Tugas:
├── Input draft SK
├── Upload dokumen
├── Submit untuk proses
└── Handle revisi

Halaman:
├── Form Input SK
├── Upload Dokumen
└── Riwayat Revisi
```

### 3.8 ASPRI_DIRJEN
```
Tugas:
├── Kelola jadwal Dirjen
├── Koordinasi aspirasi
└── Monitoring disposisi

Halaman:
├── Dashboard Aspirasi
├── Kelola Jadwal
└── Laporan
```

### 3.9 MONITORING
```
Tugas:
├── Monitoring progress SK
├── View laporan statistik
└── Tidak dapat memproses/mengubah

Halaman:
├── Dashboard Monitoring
├── Statistik SK
└── Laporan Progress
```

---

## 4. SLA (Service Level Agreement)

### 4.1 Definisi SLA

```
┌─────────────────────────────────────────────────────────────────┐
│                    SLA SK PERHUTANAN                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Total Deadline: 14 HARI KERJA                                 │
│  (dari tanggal_terima)                                          │
│                                                                 │
│  ════════════════════════════════════════════════════════════  │
│                                                                 │
│  start_date: tanggal_terima                                     │
│       │                                                        │
│       ▼                                                        │
│  ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐     │
│  │ H1 │ H2 │ H3 │ H4 │ H5 │ H6 │ H7 │ H8 │ H9 │H10 │H11 │     │
│  └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘     │
│       │                                                        │
│       │         (Weekend dilewati)                             │
│       │         ┌────┬────┬────┐                               │
│       │         │ H8 │ H9 │H10 │ (senin-jumat)                 │
│       │         └────┴────┴────┘                               │
│       │                                                        │
│       ▼                                                        │
│  end_date: tanggal_deadline                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Aturan Perhitungan Hari Kerja

```
Hari Kerja = Senin - Jumat
             (Sabtu & Minggu TIDAK dihitung)

Contoh:
- SK diterima hari Jumat, +14 hari kerja = ... (Rabu 3 minggu kemudian)
```

### 4.3 Pause Deadline (Revisi)

```
┌─────────────────────────────────────────────────────────────────┐
│                 MEKANISME PAUSE DEADLINE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Kondisi: Revisi diminta saat Step 5 (Telaah Anggota)          │
│                                                                 │
│  Saat REVISION diajukan:                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ deadline_paused_at = tanggal_pengajuan_revisi          │   │
│  │ Sisa hari kerja = (deadline - paused_at) dalam hari     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Saat revisi selesai (re-submit):                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ tanggal_deadline_baru = tanggal_resubmit + sisa_hari    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Catatan:                                                      │
│  - Pause HANYA berlaku untuk Step 5 (Telaah Anggota)         │
│  - Step lain tidak memiliki pause mechanism                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Tracking Overdue

```
┌─────────────────────────────────────────────────────────────────┐
│                    OVERDUE DETECTION                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SK dianggap OVERDUE jika:                                      │
│                                                                 │
│  tanggal_deadline < tanggal_sekarang                            │
│  AND status != 'COMPLETED'                                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ SELECT * FROM tr_sk_perhutanan                         │   │
│  │ WHERE tanggal_deadline < NOW()                         │   │
│  │   AND status NOT IN ('COMPLETED')                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Aksi:                                                         │
│  - Muncul warning di dashboard                                 │
│  - Muncul notifikasi ke approver                               │
│  - Tampil di laporan statistik overdue                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.5 SLA Matrix

```
┌────────────────────────────────────────────────────────────────────────┐
│                          RINGKASAN SLA                                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Total Waktu        │ 14 Hari Kerja                                   │
│  dari tanggal_terima │                                                  │
│                     │                                                  │
│  Pause Deadline     │ Ya (Step 5 - Telaah Anggota)                   │
│                     │ SAAT revisi diminta                             │
│                     │                                                  │
│  Eksklusi Weekend   │ Ya (Sabtu & Minggu tidak dihitung)            │
│                     │                                                  │
│  Overdue Detection  │ Real-time (tanggal_deadline < now)            │
│                     │                                                  │
│  Notifikasi         │ Warning saat H-3                               │
│                     │ Alert saat overdue                             │
│                     │                                                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Lampiran: File Referensi

| Komponen | Lokasi File |
|----------|-------------|
| Schema Database | `backend/prisma/schema.prisma` |
| Middleware Auth | `backend/src/middleware/auth.ts` |
| Middleware RBAC | `backend/src/middleware/rbac.ts` |
| SK Service | `backend/src/modules/sk_perhutanan/service.ts` |
| SK Controller | `backend/src/modules/sk_perhutanan/controller.ts` |
| SK Routes | `backend/src/modules/sk_perhutanan/routes.ts` |
| Auth Service | `backend/src/modules/auth/service.ts` |
| Seed Data | `backend/prisma/seed.ts` |
| Halaman SK | `frontend/src/pages/sk/SkPerhutananPage.tsx` |
| Routes Config | `frontend/src/routes/index.tsx` |

---

*Document version: 1.0*
*Last updated: 2026-07-30*
