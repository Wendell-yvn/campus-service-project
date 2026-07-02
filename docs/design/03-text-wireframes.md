# Text Wireframes

## Navigasi Umum

Navigasi atas menampilkan nama aplikasi, menu Daftar Laporan, Buat Laporan untuk Pelapor, Dashboard untuk Manajer/Admin, dan pemilih peran demo.

## Daftar Laporan

Elemen:

1. Judul halaman.
2. Tombol Buat Laporan untuk Pelapor.
3. Pencarian kata kunci.
4. Filter kategori, status, dan lokasi.
5. Tabel nomor laporan, judul, lokasi, status, prioritas, dan aksi Lihat Detail.

Perilaku:

1. Pelapor melihat laporan miliknya.
2. Teknisi melihat laporan yang ditugaskan.
3. Admin dan Manajer dapat memantau semua laporan.

## Form Buat Laporan

Field:

1. Judul laporan.
2. Kategori.
3. Lokasi.
4. Deskripsi minimal 20 karakter.

Aksi:

1. Batal.
2. Simpan Laporan.

Validasi:

1. Field wajib tidak boleh kosong.
2. Deskripsi kurang dari 20 karakter ditolak.
3. Setelah sukses, sistem menampilkan `request_number`.

## Detail Laporan

Informasi:

1. Nomor laporan.
2. Judul.
3. Status.
4. Prioritas.
5. Lokasi.
6. Kategori.
7. Pelapor.
8. Teknisi.
9. Deskripsi.

Aksi:

1. Admin: Under Review, simpan prioritas, tugaskan teknisi, Close, Reopen.
2. Teknisi: In Progress dan Resolved.
3. Pelapor: konfirmasi selesai.
4. Semua aktor terkait: komentar.

Bagian tambahan:

1. Komentar kronologis.
2. Riwayat status dengan timestamp dan aktor.

## Dashboard

Elemen:

1. Jumlah laporan per status: Submitted, Under Review, Assigned, In Progress, Resolved, Closed.
2. Ringkasan berdasarkan kategori.
3. Ringkasan berdasarkan prioritas.
4. Daftar laporan belum selesai.
