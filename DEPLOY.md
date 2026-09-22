# Deploy ke Server

## Arsitektur

| Service | Port host | Keterangan |
|---|---|---|
| `setdit-frontend` | **80** | nginx: serve React + reverse proxy `/api` & `/uploads` ke backend |
| `setdit-backend` | 5100 | Node + Prisma |
| `setdit-db` | 5432 | PostgreSQL 15, data di `./postgres-data` (bind mount) |

Database **tidak** dibangun lewat `prisma migrate`. Baseline migration di repo ini
sengaja no-op (tabel dulu dibuat lewat `db push`), jadi skema dibawa lewat dump SQL.

## Di komputer lokal

Ambil data terbaru:

```powershell
.\dump-db.ps1
```

Hasilnya `db-init/01-restore.sql` (~218 KB, 37 tabel).

File ini **tidak ikut git** (ada di `.gitignore`) karena berisi data operasional
termasuk hash password. Kirim manual ke server:

```bash
scp db-init/01-restore.sql user@server:/path/setdit/db-init/
```

## Di server

```bash
git clone <repo> setdit && cd setdit
mkdir -p db-init
# salin 01-restore.sql ke db-init/ (lihat langkah di atas)

docker compose up -d --build
```

Saat container `setdit-db` start pertama kali dan `postgres-data/` masih kosong,
Postgres otomatis menjalankan `db-init/01-restore.sql`. Backend menunggu lewat
`depends_on: condition: service_healthy`, jadi urutannya aman.

Cek:

```bash
docker compose logs setdit-db | grep "init process complete"
docker compose exec setdit-db psql -U postgres -d setdit -c "\dt" | tail -3
```

Buka `http://<ip-server>` (port 80).

## PENTING: restore hanya jalan sekali

`docker-entrypoint-initdb.d` dieksekusi **hanya jika `postgres-data/` kosong**.
Kalau folder itu sudah terisi, file SQL diabaikan — ini yang melindungi data
produksi dari ketimpa saat restart biasa.

Untuk memuat ulang dump dari nol (menghapus data yang ada di server):

```bash
docker compose down
rm -rf postgres-data          # HATI-HATI: hapus seluruh data DB di server
docker compose up -d
```

## Sebelum go-live

- [ ] Ganti `JWT_SECRET` dan `JWT_REFRESH_SECRET` (sekarang masih default di compose)
- [ ] Ganti `ADMIN_PASSWORD` dari `Admin123!`
- [ ] Ganti password Postgres `PKPS@2020` — ubah di `POSTGRES_PASSWORD` **dan**
      `DATABASE_URL` (di URL, `@` harus ditulis `%40`)
- [ ] Pertimbangkan menutup port `5100` dan `5432` dari publik — frontend sudah
      proxy `/api`, jadi backend tak perlu diakses langsung dari luar
- [ ] Backup rutin: `docker compose exec setdit-db pg_dump -U postgres setdit > backup.sql`
