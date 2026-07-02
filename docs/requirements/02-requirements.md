# Requirements Specification

## Functional Requirements

**FR-01 - Membuat laporan baru**  
Sistem harus memungkinkan Pelapor membuat laporan dengan fasilitas/barang yang bermasalah sebagai teks, kategori lokasi, lokasi detail, dan deskripsi minimal 20 karakter. Sistem menyimpan nomor unik `request_number` serta tanggal dan jam laporan masuk.

**FR-02 - Melihat daftar laporan**  
Sistem harus menampilkan daftar laporan sesuai hak akses aktor.

**FR-03 - Mencari dan menyaring laporan**  
Sistem harus menyediakan pencarian dan filter berdasarkan kategori lokasi, status, atau lokasi.

**FR-04 - Melihat detail laporan**  
Sistem harus menampilkan deskripsi, lokasi, kategori lokasi, prioritas, status, tanggal/jam masuk, riwayat status, dan komentar.

**FR-05 - Memeriksa laporan**  
Administrator dapat mengubah status dari `Submitted` menjadi `Under Review`.

**FR-06 - Menentukan prioritas laporan**  
Administrator dapat menetapkan prioritas `Low`, `Medium`, `High`, atau `Urgent`.

**FR-07 - Menugaskan teknisi**  
Administrator dapat menugaskan laporan kepada Teknisi dan mengubah status menjadi `Assigned`.

**FR-08 - Mengubah status pekerjaan**  
Teknisi dapat mengubah status dari `Assigned` ke `In Progress`, lalu ke `Resolved`.

**FR-09 - Menambahkan komentar atau catatan**  
Pelapor, Administrator, dan Teknisi dapat menambahkan komentar pada laporan yang dapat mereka akses.

**FR-10 - Menyimpan riwayat status**  
Setiap perubahan status harus tercatat dengan status lama, status baru, aktor, catatan, dan timestamp.

**FR-11 - Konfirmasi penyelesaian oleh Pelapor**  
Pelapor dapat mengonfirmasi laporan setelah status `Resolved`.

**FR-12 - Menutup laporan**  
Administrator dapat menutup laporan menjadi `Closed` setelah laporan `Resolved` dan dikonfirmasi Pelapor.

**FR-13 - Membuka kembali laporan**  
Administrator dapat membuka kembali laporan `Closed` menjadi `Reopened`.

**FR-14 - Dashboard sederhana**  
Manajer Fasilitas dapat melihat jumlah laporan per status, kategori lokasi, prioritas, dan daftar laporan belum selesai.

## Non-Functional Requirements

**NFR-01:** Sistem menggunakan Cloudflare Workers, D1, dan React.  
**NFR-02:** Sistem dirancang untuk paket gratis Cloudflare.  
**NFR-03:** Hak akses dibatasi berdasarkan empat peran utama.  
**NFR-04:** UI harus mudah dipakai untuk laporan, detail, progres, komentar, dan dashboard.  
**NFR-05:** Proses laporan harus terlacak melalui riwayat status dan komentar.  
**NFR-06:** Alur utama harus dapat diuji dengan unit, integration, dan acceptance test.

## Business Rules

**BR-01:** Hanya Pelapor yang dapat membuat laporan.  
**BR-02:** Laporan baru selalu berstatus `Submitted`.  
**BR-03:** Hanya Administrator yang dapat menentukan prioritas dan menugaskan Teknisi.  
**BR-04:** Teknisi hanya dapat memperbarui laporan yang ditugaskan kepadanya.  
**BR-05:** Laporan hanya dapat ditutup oleh Administrator setelah `Resolved` dan dikonfirmasi Pelapor.

## User Stories

**US-01:** Sebagai Pelapor, saya ingin membuat laporan agar masalah segera ditangani.  
Acceptance criteria: laporan mendapat `request_number`; field wajib dan deskripsi minimal 20 karakter divalidasi.

**US-02:** Sebagai Pelapor, saya ingin melihat daftar laporan saya.  
Acceptance criteria: daftar menampilkan nomor, judul, lokasi, status; daftar diperbarui setelah laporan dibuat.

**US-03:** Sebagai Administrator, saya ingin mencari dan menyaring laporan.  
Acceptance criteria: hasil sesuai filter; filter dapat dikombinasikan.

**US-04:** Sebagai Pelapor atau Administrator, saya ingin melihat detail laporan.  
Acceptance criteria: detail menampilkan informasi lengkap; komentar kronologis.

**US-05:** Sebagai Administrator, saya ingin memeriksa dan menentukan prioritas laporan.  
Acceptance criteria: status dapat menjadi `Under Review`; prioritas tersimpan.

**US-06:** Sebagai Administrator, saya ingin menugaskan Teknisi.  
Acceptance criteria: status menjadi `Assigned`; Teknisi dapat melihat tugasnya.

**US-07:** Sebagai Teknisi, saya ingin memperbarui progres pekerjaan.  
Acceptance criteria: status menjadi `In Progress` lalu `Resolved`; riwayat status tersimpan.

**US-08:** Sebagai aktor terkait, saya ingin menambahkan komentar.  
Acceptance criteria: komentar muncul di detail; komentar menyimpan nama dan waktu.

**US-09:** Sebagai Pelapor/Admin, saya ingin konfirmasi, close, dan reopen berjalan benar.  
Acceptance criteria: `Closed` hanya setelah `Resolved` dan dikonfirmasi; reopen dicatat di riwayat.

**US-10:** Sebagai Manajer Fasilitas, saya ingin melihat dashboard.  
Acceptance criteria: dashboard menampilkan jumlah per status; ringkasan kategori lokasi/prioritas.
