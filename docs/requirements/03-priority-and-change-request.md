# Requirement Priority and Change Request

## Prioritas FR

| ID | Prioritas | Alasan |
| --- | --- | --- |
| FR-01 | High | Titik awal seluruh alur laporan. |
| FR-02 | High | Semua aktor membutuhkan daftar sesuai hak akses. |
| FR-03 | Medium | Penting untuk efisiensi, tetapi bukan alur inti. |
| FR-04 | High | Dibutuhkan untuk pemeriksaan, penugasan, progres, dan konfirmasi. |
| FR-05 | High | Admin harus memeriksa laporan sebelum diproses. |
| FR-06 | High | Prioritas menentukan urutan penanganan. |
| FR-07 | High | Penugasan menghubungkan laporan dengan Teknisi. |
| FR-08 | High | Status progres adalah inti pemantauan. |
| FR-09 | Medium | Mendukung komunikasi dan dokumentasi. |
| FR-10 | High | Dibutuhkan untuk keterlacakan. |
| FR-11 | High | Menjadi syarat penutupan normal. |
| FR-12 | High | Memberikan akhir proses laporan. |
| FR-13 | Medium | Penting untuk tindak lanjut, tetapi bukan alur normal. |
| FR-14 | Medium | Penting untuk pemantauan manajemen. |

## Potensi Ambigu

1. Akses Manajer Fasilitas: dapat melihat dashboard dan detail, tetapi tidak mengubah status.
2. Prioritas sebelum penugasan: prioritas harus terisi sebelum laporan menjadi `Assigned`.
3. Penutupan laporan: alur normal membutuhkan status `Resolved` dan konfirmasi Pelapor.
4. Reopen: status setelah dibuka kembali adalah `Reopened`.
5. Komentar: pada fase awal semua komentar terlihat oleh aktor yang dapat melihat detail laporan.

## Change Request

**CR-01 - Perjelas aturan Reopened**

Alasan: requirement membuka kembali laporan perlu status eksplisit agar riwayat mudah dibaca.

Perubahan: saat Administrator membuka kembali laporan `Closed`, status berubah menjadi `Reopened`, konfirmasi sebelumnya dihapus, dan riwayat status mencatat perubahan.

Dampak: tidak menambah fitur di luar scope karena `Reopened` sudah termasuk status tambahan yang diperbolehkan.
