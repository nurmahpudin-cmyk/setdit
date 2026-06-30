saya mau buat workflow dan bisnis proses seperti ini :
Role / Cek DB
Nama	Code	Deskripsi	Super Admin	Users	Permission	Aksi
Admin TU	ADMIN_TU	Agenda surat, penomoran, tata naskah	Tidak	0	11	
Approver	APPROVER	Persetujuan/TTD dokumen	Tidak	0	5	
Arsiparis	ARSIPARIS	Salinan, scan, arsip dokumen	Tidak	0	5	
Aspri Dirjen	ASPRI_DIRJEN	Aspirasi Dirjen - mengelola jadwal pimpinan	Tidak	0	11	
Monitoring	MONITORING	Hanya melihat laporan dan progres	Tidak	0	4	
Operator	OPERATOR	Input draft, upload dokumen, revisi	Tidak	0	6	
Reviewer	REVIEWER	Telaah substansi dan hukum	Tidak	0	5	
Super Admin	SUPER_ADMIN	Kelola seluruh sistem	Ya	1	45	
Verifikator	VERIFIKATOR	Verifikasi administrasi dan disposisi	Tidak	0	6	


Jabatan :
Nama	Code	Role	Users	Aksi
Anggota Pokja Hukum	ANGGOTA_POKJA_HUKUM	-	0	
Aspirasi Dirjen	ASPRI_DIRJEN	-	0	
Dirjen PS	DIRJEN_PS	-	0	
Kabag PEHKT	KABAG_PEHKT	-	0	
Ketua Pokja Hukum	KETUA_POKJA_HUKUM	-	0	
Koordinator PKPS	KOOR_PKPS	-	0	
Petugas Arsip	PETUGAS_ARSIP	-	0	
Sekditjen PS	SEKDITJEN_PS	-	0	
Staf PKPS / PKTHA	STAF_PKPS	-	0	
TU Setditjen	TU_SETDITJEN



Workflow SK
1. Admin_TU input :
Nomor Surat :
Tanggal Surat :
Tanggal Terima :
Tanggal Deadline otomatis 14 hari kerja dari tanggal terima
Unit Pengusul : Direktorat PKPS/ Direktorat PKTHA
Perihal Surat : 
Tujuan Surat :
Konseptor :
Penandatangan : 
setelah input dikirim ke SEKDITJEN_PS 

2. Setditjen PS : menerima dan mendisposisikan isinya
Tanggal Auto
Pemeriksa : Setditjen PS
Catatan Disposisi : 
Disposisi ke Jabatan Kabag PEHK

3. Kabag PEHK : menerima dan mendisposisikan isinya
Tanggal Auto
Pemeriksa : Kabag PEHK 
Catatan Disposisi : 
Disposisi Ke Jabatan KETUA_POKJA_HUKUM 

4  KETUA_POKJA_HUKUM : menerima dan mendistribusikan ke ANGGOTA_POKJA_HUKUM/KETUA_POKJA_HUKUM 
Tanggal Auto
Pemeriksa : KETUA_POKJA_HUKUM 
Catatan Disposisi : 
Disposisi Ke Jabatan ANGGOTA_POKJA_HUKUM/KETUA_POKJA_HUKUM

5. ANGGOTA_POKJA_HUKUM/KETUA_POKJA_HUKUM : menerima dan mengerjakan SK tersebut lalu telaah 
Jika tidak sesuai dikembalikan Unit Pengusul, Jika Sesuai dikirim Ke KETUA_POKJA_HUKUM 

6. KETUA_POKJA_HUKUM : menerima lalu memeriksa isinya :
Tanggal Auto
Pemeriksa : KETUA_POKJA_HUKUM 
Catatan Perbaikan :
Kesimpulan : Perbaikan/Disetujui
Jika Disetujui  ke Kabag PEHK, Jika Perbaikan Ke ANGGOTA_POKJA_HUKUM

7. Kabag PEHK : menerima dan telaah dan Koreksi Subtansi mengisi
Tanggal Auto
Pemeriksa : Kabag PEHK
Catatan Perbaikan:
Kesimpulan : Perbaikan/Disetujui
Jika Disetujui ke TU_SETDITJEN Jika Perbaikan Ke ANGGOTA_POKJA_HUKUM

8.  TU_SETDITJEN  : menerima dan Koreksi Tata Naskah mengisi
Tanggal Auto
Pemeriksa : TU_SETDITJEN  
Catatan Perbaikan:
Kesimpulan : Perbaikan/Disetujui
Jika Disetujui  ke SEKDITJEN_PS Jika Perbaikan Ke ANGGOTA_POKJA_HUKUM

9. Admin_TU : menerima dan Penomoran ND SK Isinya 
No ND SK :
Tanggal  ND SK 
Lalu Dikirim Ke DIRJEN_PS	

10. DIRJEN_PS	 : menerima dan Koreksi Tata Naskah mengisi
Tanggal Auto
Pemeriksa : DIRJEN_PS	 
Catatan Perbaikan:
Kesimpulan : Perbaikan/Disetujui
Jika Disetujui  ke Admin_TU untuk penomoran SK Jika Perbaikan Ke ANGGOTA_POKJA_HUKUM

11. Admin_TU  : menerima dan penomoran SK isinya :
No SK :
Tanggal SK :
Perihal :
lalu dikirim ke KETUA_POKJA_HUKUM	

12. KETUA_POKJA_HUKUM	: menerima dan mendistribusikan ANGGOTA_POKJA_HUKUM untuk finalisasi/disalin
13. ANGGOTA_POKJA_HUKUM Menyalin/Finalisasi setelah selesai dikirim ke Kabag PEHKT
14. Kabag PEHKT : TTD Salinan SK dan dikirim ke KETUA_POKJA_HUKUM	
15. KETUA_POKJA_HUKUM	: Mendistribuskan, Arsip dan SCAN SK PS

Alur ketika Perbaikan mengikuti alur seperti awal :

satu siklus workflow ini harus selesai dalam 14 hari
jadi ada notification whatsapp setiap hari ke ANGGOTA_POKJA_HUKUM/KETUA_POKJA_HUKUM/Kabag PEHKT/SETDITJEN PS ada berapa yang belum di tindaklanjuti


