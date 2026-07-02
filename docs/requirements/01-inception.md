# Inception Document: Campus Service Request and Maintenance System

## Latar Belakang

Aplikasi ini digunakan mahasiswa atau dosen untuk melaporkan masalah fasilitas kampus, seperti proyektor rusak, internet bermasalah, AC tidak dingin, kursi rusak, alat laboratorium bermasalah, atau ruangan kotor. Laporan perlu dikelola secara terpusat agar status, prioritas, penugasan teknisi, komentar, dan riwayat penanganan dapat dilacak.

## Tujuan Proyek

1. Menyediakan kanal resmi untuk membuat laporan fasilitas kampus.
2. Membantu Administrator memeriksa laporan, menentukan prioritas, dan menugaskan Teknisi.
3. Membantu Teknisi memperbarui progres pekerjaan sampai selesai.
4. Memungkinkan Pelapor melihat progres dan mengonfirmasi penyelesaian.
5. Membantu Manajer Fasilitas memantau laporan melalui dashboard sederhana.

## Stakeholder

1. Pelapor: membuat laporan, melihat daftar/detail laporan, menambahkan komentar, dan mengonfirmasi penyelesaian.
2. Administrator: memeriksa laporan, menentukan prioritas, menugaskan teknisi, menutup laporan, dan membuka kembali laporan.
3. Teknisi: melihat tugas, memperbarui status pekerjaan, dan menambahkan catatan progres.
4. Manajer Fasilitas: melihat dashboard dan laporan untuk pemantauan.

## Scope

Yang termasuk scope:

1. Empat aktor: Pelapor, Administrator, Teknisi, Manajer Fasilitas.
2. Membuat laporan baru.
3. Melihat daftar laporan.
4. Mencari dan menyaring laporan.
5. Melihat detail laporan.
6. Memeriksa laporan.
7. Menentukan prioritas.
8. Menugaskan teknisi.
9. Mengubah status pekerjaan.
10. Menambahkan komentar/catatan.
11. Menyimpan riwayat status.
12. Menutup dan membuka kembali laporan.
13. Dashboard sederhana.
14. Stack teknis: Cloudflare Workers, D1, React, paket gratis Cloudflare.

Alur status utama:

`Submitted -> Under Review -> Assigned -> In Progress -> Resolved -> Closed`

Status tambahan:

`Reopened`, untuk laporan yang sudah ditutup tetapi perlu tindak lanjut.

Yang di luar scope tahap awal:

1. Upload foto.
2. Email notification.
3. Login via akun Google.
4. QR code ruangan.
5. AI untuk menentukan kategori otomatis.
6. Inventory spare part.
7. Vendor management.

## Asumsi

**Asumsi:** Sistem memakai pengguna demo berbasis peran untuk tahap awal, bukan login Google.

**Asumsi:** Prioritas minimal terdiri dari `Low`, `Medium`, `High`, dan `Urgent`.

**Asumsi:** Komentar terlihat oleh aktor yang berwenang melihat laporan.

**Asumsi:** Penutupan normal dilakukan setelah laporan `Resolved` dan dikonfirmasi Pelapor.

## Pertanyaan Terbuka

1. Apakah lokasi laporan akan memakai daftar ruangan tetap atau input bebas?
2. Apakah kategori laporan perlu dibatasi ke daftar tetap?
3. Apakah ada batas waktu sebelum Admin boleh menutup laporan tanpa konfirmasi?
4. Apakah komentar internal Admin/Teknisi dibutuhkan pada fase berikutnya?
