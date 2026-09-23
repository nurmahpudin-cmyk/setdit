# Deploy ke Server

## Arsitektur

| Service | Port host | Keterangan |
|---|---|---|
| `setdit-frontend` | **80**, **443** | nginx: serve React + reverse proxy `/api` & `/uploads` ke backend. 443 pakai TLS self-signed (lihat catatan di bawah) |
| `setdit-backend` | 5100 | Node + Prisma |
| `setdit-db` | 5433 → 5432 | PostgreSQL 15, data di `./data-trace` (bind mount) |

Database **tidak** dibangun lewat `prisma migrate`. Baseline migration di repo ini
sengaja no-op (tabel dulu dibuat lewat `db push`), jadi skema dibawa lewat dump SQL.

Port db di host sengaja `5433` (bukan `5432` default) supaya tidak bentrok kalau
server juga punya Postgres lain terpasang. Koneksi backend→db tidak terpengaruh
(pakai `setdit-db:5432` di dalam network Docker, bukan port host ini). Kalau server
kosong dan tidak ada Postgres lain, boleh diganti balik ke `"5432:5432"`.

## File yang TIDAK ikut git

Sengaja di-`.gitignore` karena berisi data sensitif — `git clone` di server
saja **tidak cukup**, keduanya harus ada sebelum `docker compose up`:

| File | Isi | Dari mana |
|---|---|---|
| `db-init/01-restore.sql` | Dump database (data + skema) | Dibuat di lokal (`.\dump-db.ps1`), lalu di-`scp` ke server — tidak bisa dibuat di server karena datanya ada di lokal |
| `frontend/certs/selfsigned.crt` + `.key` | Sertifikat TLS | **Bisa langsung dibuat di server** (lebih simpel, lihat Langkah 2) — tidak perlu dari lokal |

Tanpa `db-init/01-restore.sql`, `setdit-db` start dengan database kosong.
Tanpa `frontend/certs/*`, `setdit-frontend` gagal start karena `nginx.conf`
mengacu ke cert yang tidak ada.

## Langkah 1 — di komputer lokal: siapkan dump database

```powershell
.\dump-db.ps1
```

Hasilnya `db-init/01-restore.sql` (~218 KB, 37 tabel). Kirim ke server:

```bash
scp db-init/01-restore.sql user@server:/path/setdit/db-init/
```

## Langkah 2 — di server: clone + generate cert TLS

```bash
git clone <repo> setdit && cd setdit
mkdir -p db-init frontend/certs
# pastikan db-init/01-restore.sql dari Langkah 1 sudah ada di sini

openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
  -keyout frontend/certs/selfsigned.key \
  -out frontend/certs/selfsigned.crt \
  -subj "/C=ID/ST=Local/L=Local/O=Setdit/CN=<domain-atau-IP-server>"

docker compose up -d --build
```

Cert self-signed dibuat langsung di server — lebih simpel, tidak perlu
transfer file `.crt`/`.key` dari lokal. Ganti `<domain-atau-IP-server>` dengan
alamat yang dipakai mengakses server (boleh dibiarkan `localhost` kalau tidak
penting, TLS tetap berfungsi baik untuk validitas `CN` hanya kosmetik pada
sertifikat self-signed).

Urutan yang terjadi otomatis:

1. `setdit-db` start, `data-trace/` masih kosong → Postgres jalankan `initdb`,
   buat database `setdit` (dari `POSTGRES_DB`), lalu eksekusi semua file di
   `db-init/` (yakni `01-restore.sql`) — skema + data ter-restore.
2. `setdit-backend` menunggu `setdit-db` **healthy** (`depends_on: condition:
   service_healthy`) baru start.
3. `setdit-frontend` menunggu `setdit-backend` start, lalu nginx serve React +
   proxy `/api` & `/uploads` ke backend, di port 80 (HTTP) dan 443 (HTTPS).

Cek semua jalan:

```bash
docker compose ps
docker compose logs setdit-db | grep "init process complete"
docker compose exec setdit-db psql -U postgres -d setdit -c "\dt" | tail -3
```

Buka `http://<ip-server>` atau `https://<ip-server>`.

## Catatan: sertifikat TLS masih self-signed

Browser akan menampilkan peringatan "Not Secure" di `https://` karena cert-nya
self-signed, bukan dari CA publik. Enkripsinya tetap jalan penuh — ini hanya
soal kepercayaan browser terhadap identitas sertifikat.

Untuk produksi dengan domain publik, ganti ke Let's Encrypt (gratis via certbot):
cukup timpa `frontend/certs/selfsigned.crt` dan `.key` dengan cert asli (nama file
boleh disesuaikan asal juga diubah di `frontend/nginx.conf` →
`ssl_certificate`/`ssl_certificate_key`), lalu:

```bash
docker compose restart setdit-frontend
```

Tidak perlu rebuild image karena cert di-mount sebagai volume, bukan di-`COPY`
saat build.

## PENTING: restore database hanya jalan sekali

`docker-entrypoint-initdb.d` dieksekusi **hanya jika `data-trace/` masih
kosong** saat container pertama kali start. Kalau folder itu sudah terisi
(server sudah pernah jalan sebelumnya), file SQL diabaikan sepenuhnya — ini
yang melindungi data produksi dari ketimpa saat restart/redeploy biasa.

Untuk memuat ulang dump dari nol (**menghapus semua data yang ada di server**):

```bash
docker compose down
rm -rf data-trace
docker compose up -d
```

## Sebelum go-live

- [ ] Ganti `JWT_SECRET` dan `JWT_REFRESH_SECRET` (sekarang masih default di compose)
- [ ] Ganti `ADMIN_PASSWORD` dari `Admin123!`
- [ ] Ganti password Postgres `PKPS@2020` — ubah di `POSTGRES_PASSWORD` **dan**
      `DATABASE_URL` (di URL, `@` harus ditulis `%40`)
- [ ] Pertimbangkan menutup port `5100` dan `5433` dari akses publik (firewall) —
      frontend sudah proxy `/api`, jadi backend & db tak perlu diakses langsung dari luar
- [ ] Cert masih self-signed (dibuat saat Langkah 2) — ganti ke Let's Encrypt kalau sudah punya domain publik
- [ ] Backup rutin: `docker compose exec setdit-db pg_dump -U postgres setdit > backup.sql`
