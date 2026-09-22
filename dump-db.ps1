# Ambil dump database lokal -> db-init/01-restore.sql
# File hasilnya di-restore otomatis oleh container setdit-db saat init pertama.
# Jalankan ulang script ini setiap kali mau membawa data lokal terbaru ke server.

$ErrorActionPreference = "Stop"

$PgBin  = "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe"
$DbHost = "localhost"
$DbPort = "5432"
$DbUser = "postgres"
$DbPass = "PKPS@2020"
$DbName = "setdit"
$OutFile = Join-Path $PSScriptRoot "db-init\01-restore.sql"

if (-not (Test-Path $PgBin)) {
    throw "pg_dump tidak ditemukan di $PgBin - sesuaikan variabel `$PgBin"
}

New-Item -ItemType Directory -Force -Path (Split-Path $OutFile) | Out-Null

$env:PGPASSWORD = $DbPass
try {
    & $PgBin -h $DbHost -p $DbPort -U $DbUser -d $DbName `
        --no-owner --no-privileges --clean --if-exists -f $OutFile
    if ($LASTEXITCODE -ne 0) { throw "pg_dump gagal (exit $LASTEXITCODE)" }
}
finally {
    $env:PGPASSWORD = ""
}

$size = (Get-Item $OutFile).Length / 1KB
$tables = (Select-String -Path $OutFile -Pattern '^CREATE TABLE' -AllMatches).Count
Write-Host ("OK -> {0}" -f $OutFile)
Write-Host ("   {0:N0} KB, {1} tabel" -f $size, $tables)
