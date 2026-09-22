import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Kontak penerima notifikasi disposisi surat, per unit tujuan.
// nip diisi placeholder karena kolomnya required & unique, sedangkan
// kontak ini didaftarkan berdasarkan unit, bukan berdasarkan NIP kepegawaian.
const kontak = [
  {
    nip: 'DISPO-LUCKY',
    nama_lengkap: 'Lucky Rahadian',
    nama_panggilan: 'Lucky',
    unit_code: 'DITJEN_PS',
    jabatan: 'Sek Dirjen PS',
    nomor_wa: '+62 811-1899-237',
  },
  {
    nip: 'DISPO-NABILA',
    nama_lengkap: 'Nabila Agzalita',
    nama_panggilan: 'Nabila',
    unit_code: 'SESDIT_PS',
    jabatan: 'Sek Sesditjen PS',
    nomor_wa: '+62 858-9205-0216',
  },
  {
    nip: 'DISPO-SOFIA',
    nama_lengkap: 'Sofia Sri Maharani',
    nama_panggilan: 'Sofia',
    unit_code: 'SESDIT_PS',
    jabatan: 'TU - Admin',
    nomor_wa: '+62 812-4142-8458',
  },
  {
    nip: 'DISPO-TOMMY',
    nama_lengkap: 'Tommy Permana',
    nama_panggilan: 'Tommy',
    unit_code: 'DIT_PKPS',
    jabatan: 'Sek Dir. PKPS',
    nomor_wa: '+62 813-9893-9303',
  },
  {
    nip: 'DISPO-DIAN',
    nama_lengkap: 'Dian Nurlia',
    nama_panggilan: 'Dian',
    unit_code: 'DIT_PKTHA',
    jabatan: 'Sek Dir. PKTHA',
    nomor_wa: '+62 811-1102-822',
  },
  {
    nip: 'DISPO-IKAWATI',
    nama_lengkap: 'Ikawati',
    nama_panggilan: 'Ika',
    unit_code: 'DIT_PUPS',
    jabatan: 'Sek Dir. PUPS',
    nomor_wa: '+62 858-2332-9899',
  },
  {
    nip: 'DISPO-RIZMA',
    nama_lengkap: 'Rizma',
    nama_panggilan: 'Rizma',
    unit_code: 'DIT_PPS',
    jabatan: 'Sek Dir. PPS',
    nomor_wa: '+62 821-1438-0850',
  },
];

async function seedDisposisiKontak() {
  console.log('📇 Seeding kontak penerima disposisi surat...\n');

  for (const k of kontak) {
    const data = { ...k, is_disposisi_recipient: true, is_active: true };

    await prisma.mst_pegawai.upsert({
      where: { nip: k.nip },
      create: data,
      update: data,
    });

    console.log(`  ✓ ${k.nama_lengkap} (${k.unit_code}) - ${k.nomor_wa}`);
  }

  const total = await prisma.mst_pegawai.count({
    where: { is_disposisi_recipient: true },
  });

  console.log(`\n🎉 Selesai. Total penerima disposisi: ${total}\n`);
}

seedDisposisiKontak()
  .catch((e) => {
    console.error('Seed kontak disposisi gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
