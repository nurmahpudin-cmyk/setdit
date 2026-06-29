# FOUNDATION PROJECT

## React JS + Node JS + PostgreSQL + WhatsApp Baileys

---

# 1. Tujuan

Membangun fondasi aplikasi yang dapat digunakan kembali untuk berbagai sistem informasi dengan fitur standar:

* Manajemen Pengguna
* Role & Permission
* Jabatan dan Unit Kerja
* Website Setting
* Approval User
* OTP Verification
* Forgot Password
* WhatsApp Gateway (Baileys)
* Audit Log
* API Security
* Dashboard

---

# 2. Arsitektur Sistem

```text
Frontend (ReactJS)
        │
        │ REST API (HTTPS)
        ▼
Backend (NodeJS + ExpressJS)
        │
        ├── PostgreSQL
        ├── Redis (Cache & OTP)
        ├── WhatsApp Baileys
        └── File Storage

Frontend menggunakan tempalte C:\laragon\www\setdit\Source Frontend\src\app\App.tsx
```

---

# 3. Struktur Menu

## Dashboard

* Ringkasan Sistem
* Statistik User
* Statistik Aktivitas
* Status WhatsApp Gateway

---

## Master Data

### User

* Registrasi User
* Approval User
* Aktivasi User
* Nonaktifkan User

### Jabatan

Contoh:

* Kepala Balai
* Ketua Pokja
* Verifikatorrole
* Operator
* Administrator

### Unit Kerja

Contoh:

* Direktorat
* Balai
* Fakultas
* Program Studi
* Divisi

### Role

Contoh:

* Super Admin
* Admin
* Reviewer
* Approver
* User

### Permission

Contoh:

* user.view

* user.create

* user.update

* user.delete

* role.manage

* setting.manage

---

## Pengaturan

### Identitas Website

* Nama Aplikasi (Singkat)
* Nama Aplikasi (Lengkap)
* Tagline
* Deskripsi
* Logo Institusi
* Inisial Logo
* Email
* Telepon
* Alamat

### WhatsApp Gateway

* QR Login
* Status Koneksi
* Reconnect
* Log Pengiriman

---

## Utilitas

* Activity Log
* Login History
* OTP Log
* WhatsApp Log
* System Log

---

# 4. Struktur Database

## mst_setting

Menyimpan konfigurasi aplikasi.

| Field         |
| ------------- |
| app_name      |
| app_full_name |
| tagline       |
| description   |
| logo          |
| logo_initial  |
| email         |
| phone         |
| address       |

---

## mst_users

| Field       |
| ----------- |
| id          |
| fullname    |
| username    |
| email       |
| phone       |
| password    |
| position_id |
| unit_id     |
| status      |
| is_verified |

---

## mst_positions

Menyimpan jabatan organisasi.

Contoh:

* Kepala Balai
* Ketua Pokja
* Operator

---

## mst_units

Menyimpan unit kerja.

Contoh:

* Direktorat PKPS
* Balai PSKL
* Fakultas Teknik

---

## mst_roles

Menyimpan role sistem.

Contoh:

* Super Admin
* Admin
* Reviewer
* User

---

## mst_permissions

Menyimpan daftar hak akses.

---

## tr_user_roles

Relasi banyak role untuk satu user.

---

## tr_role_permissions

Relasi role dan permission.

---

## tr_otp

Menyimpan OTP.

---

## tr_user_approval

Menyimpan riwayat approval user.

---

## wa_sessions

Menyimpan session Baileys.

---

## wa_logs

Menyimpan log pengiriman WhatsApp.

---

## activity_logs

Menyimpan audit trail aktivitas sistem.

---

# 5. Alur Registrasi User

```text
Registrasi
     │
     ▼
Kirim OTP WA
     │
     ▼
Verifikasi OTP
     │
     ▼
Status Pending
     │
     ▼
Approval Admin
     │
     ▼
Aktif
```

---

# 6. Alur Forgot Password

```text
Input Email / WhatsApp
          │
          ▼
Kirim OTP
          │
          ▼
Verifikasi OTP
          │
          ▼
Reset Password
```

---

# 7. Role Based Access Control (RBAC)

```text
User
 │
 ├── Unit Kerja
 ├── Jabatan
 ├── Role
 └── Permission
```

Contoh:

Nama : Budi

Unit Kerja :
Direktorat PKPS

Jabatan :
Ketua Pokja

Role :
Reviewer

Permission :

* proposal.view
* proposal.review
* proposal.approve

---

# 8. Struktur Backend

```text
backend/
├── src/
│   ├── config/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── permissions/
│   │   ├── positions/
│   │   ├── units/
│   │   ├── settings/
│   │   ├── whatsapp/
│   │   └── logs/
│   ├── middleware/
│   ├── services/
│   ├── routes/
│   ├── controllers/
│   └── utils/
├── uploads/
└── prisma/
```

---

# 9. Struktur Frontend

```text
frontend/
├── src/
│   ├── pages/
│   ├── layouts/
│   ├── routes/
│   ├── store/
│   ├── api/
│   ├── hooks/
│   ├── components/
│   └── utils/
```

---

# 10. Standar Keamanan

## Authentication

* JWT Access Token
* Refresh Token
* Logout Token Revocation
* OTP Verification

---

## Password Security

* bcrypt hash
* Minimal 8 karakter
* Kombinasi huruf dan angka
* Password tidak disimpan dalam bentuk plain text

---

## API Security

* HTTPS Only
* Helmet Middleware
* CORS Restriction
* API Rate Limiter
* Request Validation

---

## Session Security

* Refresh Token Rotation
* Session Expiration
* Multi Device Management

---

## User Security

* Login Attempt Limit
* Account Lockout
* Email Verification
* WhatsApp Verification

---

## Upload Security

* Validasi MIME Type
* Maksimal Ukuran File
* Rename File Otomatis
* Antivirus Scanning (Opsional)

---

## Audit Trail

Catat:

* Login
* Logout
* Tambah Data
* Ubah Data
* Hapus Data
* Approval Data

---

## Database Security

* Parameterized Query
* Prisma ORM
* Backup Harian
* Backup Mingguan
* Database Encryption

---

## Logging

* Activity Log
* Error Log
* Login History
* WhatsApp Log

---

# 11. Teknologi yang Digunakan

## Frontend

* React 19
* Vite
* React Router
* Redux Toolkit
* Axios
* Ant Design

## Backend

* NodeJS
* ExpressJS
* Prisma ORM

## Database

* PostgreSQL

## Cache

* Redis

## Authentication

* JWT
* Bcrypt

## WhatsApp

* Baileys

## Deployment

* Docker
* Nginx
* SSL HTTPS

---

# 12. Roadmap Pengembangan

Phase 1

* Authentication
* User Management
* Role Permission
* Website Setting

Phase 2

* WhatsApp Gateway
* OTP
* Forgot Password
* Approval User

Phase 3

* Notification Center
* Audit Log
* Dashboard Analytics

Phase 4

* Multi Tenant
* SSO
* LDAP / Active Directory
* Mobile App

```
```


# Role Based Access Control (RBAC)

## Konsep

Sistem menggunakan RBAC (Role Based Access Control) dengan dukungan:

* Multi Role per User
* Multi Permission per Role
* Direct Permission per User (Override)
* Jabatan Organisasi
* Unit Kerja Organisasi

Struktur:

```text
User
 │
 ├── Unit Kerja
 ├── Jabatan
 │
 ├── Role 1
 ├── Role 2
 ├── Role 3
 │
 └── Direct Permission
```

---

# Hierarki Hak Akses

```text
User
 │
 ├── Jabatan
 ├── Unit Kerja
 │
 ├── Role
 │     └── Permission
 │
 └── Direct Permission
```

Contoh:

Nama :
Budi Santoso

Unit Kerja :
Direktorat PKPS

Jabatan :
Ketua Pokja

Role :

* Reviewer
* Approver

Permission Efektif :

* proposal.view
* proposal.review
* proposal.approve
* laporan.view

---

# Struktur Database

## mst_users

Data pengguna sistem.

| Field       |
| ----------- |
| id          |
| fullname    |
| username    |
| email       |
| phone       |
| password    |
| status      |
| is_verified |

---

## mst_units

Unit kerja organisasi.

Contoh:

* Direktorat PKPS
* Balai PSKL
* Fakultas Teknik
* Program Studi

---

## mst_positions

Jabatan organisasi.

Contoh:

* Kepala Balai
* Ketua Pokja
* Verifikator
* Operator
* Administrator

---

## mst_roles

Role sistem.

Contoh:

* Super Admin
* Admin
* Reviewer
* Approver
* User

---

## mst_permissions

Daftar seluruh hak akses.

Contoh:

* dashboard.view
* user.view
* user.create
* user.update
* user.delete
* user.approve
* role.manage
* permission.manage
* setting.manage
* wa.manage

---

# Relasi User dan Role

Satu user dapat memiliki banyak role.

Contoh:

Budi

* Reviewer
* Approver

Siti

* Admin

Tabel:

```sql
CREATE TABLE tr_user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    created_at TIMESTAMP,

    PRIMARY KEY(user_id, role_id)
);
```

---

# Relasi Role dan Permission

Satu role dapat memiliki banyak permission.

Contoh:

Role Admin

* user.view
* user.create
* user.update
* user.delete
* role.manage

Role Reviewer

* proposal.view
* proposal.review

Tabel:

```sql
CREATE TABLE tr_role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    created_at TIMESTAMP,

    PRIMARY KEY(role_id, permission_id)
);
```

---

# Direct Permission User

Digunakan untuk memberikan hak akses khusus tanpa menambah role baru.

Contoh:

Role Reviewer

Permission:

* proposal.view
* proposal.review

Tambahan Khusus untuk Budi:

* proposal.approve

Tabel:

```sql
CREATE TABLE tr_user_permissions (
    user_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    created_at TIMESTAMP,

    PRIMARY KEY(user_id, permission_id)
);
```

---

# Permission Naming Convention

Gunakan format:

```text
module.action
```

Contoh:

```text
dashboard.view

user.view
user.create
user.update
user.delete
user.approve

role.view
role.create
role.update
role.delete

permission.view
permission.create
permission.update
permission.delete

setting.view
setting.update

wa.view
wa.send
wa.manage

report.view
report.export
```

---

# Mekanisme Pemeriksaan Hak Akses

Urutan pengecekan:

1. User Login
2. Ambil seluruh Role User
3. Ambil seluruh Permission dari Role
4. Ambil Direct Permission User
5. Gabungkan seluruh Permission
6. Simpan ke JWT Session
7. Middleware memeriksa Permission setiap request

Flow:

```text
User Login
      │
      ▼
Load Roles
      │
      ▼
Load Permissions
      │
      ▼
Load Direct Permissions
      │
      ▼
Generate JWT
      │
      ▼
Access API
```

---

# Super Admin

Role khusus:

Super Admin

Karakteristik:

* Tidak perlu Permission Mapping
* Memiliki seluruh hak akses sistem
* Tidak dapat dihapus oleh user biasa
* Tidak dapat dinonaktifkan oleh user biasa

---

# Audit Log Hak Akses

Setiap perubahan harus dicatat:

* Tambah Role
* Ubah Role
* Hapus Role
* Tambah Permission
* Ubah Permission
* Hapus Permission
* Assign Role User
* Revoke Role User
* Assign Permission User

Tabel:

```sql
activity_logs
```

Field:

* user_id
* module
* action
* old_data
* new_data
* ip_address
* user_agent
* created_at

```
```
