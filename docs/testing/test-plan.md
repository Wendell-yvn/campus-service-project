# Rencana Pengujian Campus Service

Catatan: dokumen ini disusun untuk FR-01 sampai FR-12 pada sistem campus service/request maintenance. Jika teks FR resmi berubah, kolom "FR Terkait" perlu disesuaikan pada traceability test.

## Unit Test

| ID | FR Terkait | Skenario | Hasil yang Diharapkan |
|---|---|---|---|
| UT-01 | FR-01 | Validasi payload pembuatan laporan dengan semua field wajib terisi. | Payload dinyatakan valid. |
| UT-02 | FR-01 | Validasi payload pembuatan laporan ketika title kosong. | Validasi gagal dan menghasilkan pesan error title wajib. |
| UT-03 | FR-01 | Validasi payload pembuatan laporan ketika description kosong. | Validasi gagal dan menghasilkan pesan error description wajib. |
| UT-04 | FR-01 | Validasi payload pembuatan laporan ketika location kosong. | Validasi gagal dan menghasilkan pesan error location wajib. |
| UT-05 | FR-01 | Validasi payload pembuatan laporan ketika category kosong. | Validasi gagal dan menghasilkan pesan error category wajib. |
| UT-06 | FR-01 | Generate request_number untuk laporan baru. | Nomor laporan unik dan mengikuti format yang ditentukan. |
| UT-07 | FR-01 | Set default priority saat priority tidak dikirim. | Priority bernilai `MEDIUM`. |
| UT-08 | FR-01 | Set default status saat laporan baru dibuat. | Status bernilai `SUBMITTED`. |
| UT-09 | FR-02 | Parse parameter filter daftar laporan. | Filter status, category, priority, dan keyword terbaca dengan benar. |
| UT-10 | FR-02 | Parse parameter pagination daftar laporan. | Page dan limit memiliki nilai default dan batas aman. |
| UT-11 | FR-03 | Validasi ID laporan pada endpoint detail. | ID kosong atau format tidak valid ditolak. |
| UT-12 | FR-03 | Mapping row database menjadi response detail laporan. | Response berisi id, request_number, title, description, location, category, priority, status, dan created_at. |
| UT-13 | FR-04 | Validasi transisi status laporan yang diperbolehkan. | Transisi valid diterima dan transisi tidak valid ditolak. |
| UT-14 | FR-05 | Validasi input update prioritas laporan. | Hanya nilai priority yang diperbolehkan yang diterima. |
| UT-15 | FR-06 | Validasi input update kategori laporan. | Kategori kosong atau tidak dikenal ditolak sesuai aturan. |
| UT-16 | FR-07 | Format tanggal laporan untuk tampilan. | Tanggal ditampilkan dalam format yang mudah dibaca. |
| UT-17 | FR-08 | Validasi response error API. | Error memiliki status code dan body JSON yang konsisten. |
| UT-18 | FR-09 | Validasi role/akses untuk aksi terbatas. | Aksi terbatas ditolak untuk user tanpa izin. |
| UT-19 | FR-10 | Validasi pencarian laporan berdasarkan keyword. | Keyword mencocokkan title, description, location, atau request_number sesuai aturan. |
| UT-20 | FR-11 | Validasi data ringkasan/dashboard. | Perhitungan total per status dan priority benar. |
| UT-21 | FR-12 | Validasi audit timestamp. | `created_at` atau timestamp perubahan tersimpan dalam format yang benar. |

## Integration Test

| ID | FR Terkait | Skenario | Hasil yang Diharapkan |
|---|---|---|---|
| IT-01 | FR-01 | POST pembuatan laporan menyimpan data ke tabel `service_requests`. | Data tersimpan dengan id, request_number unik, status `SUBMITTED`, priority `MEDIUM`, dan created_at. |
| IT-02 | FR-01 | POST pembuatan laporan dengan field wajib kosong. | API mengembalikan 400 dan data tidak tersimpan. |
| IT-03 | FR-02 | GET daftar laporan ketika database berisi beberapa laporan. | API mengembalikan daftar laporan dengan field ringkasan yang benar. |
| IT-04 | FR-02 | GET daftar laporan ketika database kosong. | API mengembalikan array kosong tanpa error. |
| IT-05 | FR-02 | GET daftar laporan dengan filter status. | API hanya mengembalikan laporan dengan status yang diminta. |
| IT-06 | FR-02 | GET daftar laporan dengan pagination. | API mengembalikan jumlah data sesuai limit dan metadata pagination. |
| IT-07 | FR-03 | GET `/api/requests/:id` untuk laporan yang ada. | API mengembalikan detail laporan sesuai data database. |
| IT-08 | FR-03 | GET `/api/requests/:id` untuk ID yang tidak ada. | API mengembalikan 404. |
| IT-09 | FR-04 | PATCH status laporan dari `SUBMITTED` ke status berikutnya yang valid. | Status berubah dan response menampilkan data terbaru. |
| IT-10 | FR-04 | PATCH status laporan dengan transisi tidak valid. | API mengembalikan 400 dan status database tidak berubah. |
| IT-11 | FR-05 | PATCH priority laporan. | Priority baru tersimpan dan bisa dibaca kembali melalui detail laporan. |
| IT-12 | FR-06 | PATCH category atau assignment unit penanganan. | Data baru tersimpan sesuai aturan FR terkait. |
| IT-13 | FR-07 | Halaman detail memanggil API detail laporan. | UI menampilkan title, request_number, status, category, priority, location, created_at, dan description. |
| IT-14 | FR-08 | API mengembalikan error saat database gagal diakses. | Response error tetap JSON dan tidak membocorkan detail internal. |
| IT-15 | FR-09 | User tanpa izin mencoba mengakses endpoint terbatas. | API mengembalikan 401 atau 403 sesuai mekanisme autentikasi. |
| IT-16 | FR-10 | GET daftar laporan dengan keyword pencarian. | Hasil pencarian sesuai keyword dan tidak mengembalikan data yang tidak cocok. |
| IT-17 | FR-11 | GET data ringkasan/dashboard. | Angka total laporan, status, dan prioritas sesuai isi database. |
| IT-18 | FR-12 | Migration database dijalankan pada D1 lokal. | Tabel dan constraint utama dibuat tanpa error. |

## Acceptance Test

| ID | FR Terkait | Skenario | Acceptance Criteria |
|---|---|---|---|
| AT-01 | FR-01 | Pengguna mengirim laporan layanan kampus dengan data valid. | Given pengguna mengisi title, description, location, dan category, when laporan dikirim, then sistem menyimpan laporan dan menampilkan nomor laporan. |
| AT-02 | FR-01 | Pengguna mengirim laporan dengan data wajib belum lengkap. | Given ada field wajib yang kosong, when pengguna mengirim laporan, then sistem menampilkan pesan validasi dan laporan tidak disimpan. |
| AT-03 | FR-02 | Pengguna melihat daftar laporan. | Given laporan sudah tersimpan, when pengguna membuka halaman daftar laporan, then sistem menampilkan daftar laporan dengan nomor, judul, lokasi, kategori, prioritas, status, dan tanggal dibuat. |
| AT-04 | FR-02 | Pengguna melihat daftar laporan kosong. | Given belum ada laporan, when pengguna membuka halaman daftar laporan, then sistem menampilkan empty state yang jelas. |
| AT-05 | FR-02 | Pengguna memfilter daftar laporan berdasarkan status. | Given laporan memiliki beberapa status, when pengguna memilih filter status, then hanya laporan dengan status tersebut yang ditampilkan. |
| AT-06 | FR-03 | Pengguna membuka detail laporan. | Given laporan tersedia, when pengguna membuka detail laporan, then sistem menampilkan detail lengkap laporan. |
| AT-07 | FR-03 | Pengguna membuka detail laporan yang tidak ada. | Given ID laporan tidak ditemukan, when pengguna membuka halaman detail, then sistem menampilkan pesan laporan tidak ditemukan. |
| AT-08 | FR-04 | Petugas memperbarui status laporan. | Given laporan valid tersedia, when petugas mengubah status, then sistem menyimpan status baru dan menampilkannya pada daftar serta detail. |
| AT-09 | FR-04 | Petugas mencoba transisi status yang tidak valid. | Given transisi status tidak diperbolehkan, when petugas menyimpan perubahan, then sistem menolak perubahan dan status lama tetap berlaku. |
| AT-10 | FR-05 | Petugas mengubah prioritas laporan. | Given laporan tersedia, when petugas memilih prioritas baru, then sistem menyimpan prioritas baru dan menampilkannya kembali. |
| AT-11 | FR-06 | Petugas mengubah kategori atau unit penanganan laporan. | Given laporan tersedia, when kategori atau unit diubah, then sistem menyimpan perubahan sesuai aturan validasi. |
| AT-12 | FR-07 | Pengguna melihat waktu pembuatan laporan. | Given laporan dibuat, when daftar atau detail laporan ditampilkan, then created_at terlihat dan mudah dipahami. |
| AT-13 | FR-08 | Sistem menampilkan pesan error API yang ramah. | Given terjadi error saat memuat data, when halaman meminta data laporan, then sistem menampilkan pesan gagal memuat tanpa detail teknis internal. |
| AT-14 | FR-09 | Pengguna tanpa izin membuka fitur terbatas. | Given user tidak memiliki role yang diperlukan, when user membuka fitur terbatas, then akses ditolak. |
| AT-15 | FR-10 | Pengguna mencari laporan dengan keyword. | Given ada laporan yang cocok dengan keyword, when pengguna melakukan pencarian, then sistem menampilkan laporan yang relevan. |
| AT-16 | FR-10 | Pengguna mencari laporan tanpa hasil. | Given tidak ada laporan yang cocok, when pengguna melakukan pencarian, then sistem menampilkan empty state pencarian. |
| AT-17 | FR-11 | Admin melihat ringkasan laporan. | Given data laporan tersedia, when admin membuka dashboard, then sistem menampilkan total laporan dan pengelompokan status/prioritas dengan benar. |
| AT-18 | FR-12 | Sistem berjalan setelah migration database diterapkan. | Given migration sudah dijalankan, when aplikasi mengakses tabel laporan, then operasi create, read list, dan read detail berjalan tanpa error struktur database. |

## Prioritas Eksekusi

| Prioritas | Test |
|---|---|
| Tinggi | UT-01 sampai UT-12, IT-01 sampai IT-08, AT-01 sampai AT-07 |
| Sedang | UT-13 sampai UT-18, IT-09 sampai IT-15, AT-08 sampai AT-14 |
| Rendah | UT-19 sampai UT-21, IT-16 sampai IT-18, AT-15 sampai AT-18 |

## Catatan Traceability

- Setiap FR minimal memiliki satu unit test, satu integration test, dan satu acceptance test.
- Test untuk FR yang menyentuh database harus dijalankan dengan Cloudflare D1 local terlebih dahulu sebelum remote.
- Acceptance test sebaiknya ditulis berdasarkan skenario pengguna dan acceptance criteria final dari GitHub Issue masing-masing FR.
