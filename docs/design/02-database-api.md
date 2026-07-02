# Database and API Design

## Skema D1

Tabel utama:

1. `users`: menyimpan Pelapor, Administrator, Teknisi, dan Manajer Fasilitas.
2. `reports`: menyimpan laporan fasilitas, status, prioritas, pelapor, dan teknisi.
3. `report_comments`: menyimpan komentar/catatan laporan.
4. `report_status_history`: menyimpan riwayat perubahan status.
5. `report_confirmations`: menyimpan konfirmasi Pelapor setelah `Resolved`.

Relasi:

1. `reports.reporter_id -> users.id`.
2. `reports.assigned_technician_id -> users.id`.
3. `report_comments.report_id -> reports.id`.
4. `report_comments.author_id -> users.id`.
5. `report_status_history.report_id -> reports.id`.
6. `report_status_history.changed_by -> users.id`.
7. `report_confirmations.report_id -> reports.id`.
8. `report_confirmations.reporter_id -> users.id`.

## Endpoint API

| FR | Method | Path | Fungsi |
| --- | --- | --- | --- |
| FR-01 | POST | `/api/reports` | Membuat laporan baru dan `request_number`. |
| FR-02 | GET | `/api/reports` | Melihat daftar laporan sesuai hak akses. |
| FR-03 | GET | `/api/reports?q=&status=&category=&location=` | Pencarian dan filter laporan. |
| FR-04 | GET | `/api/reports/{id}` | Melihat detail, komentar, konfirmasi, dan riwayat. |
| FR-05 | PATCH | `/api/reports/{id}/review` | Mengubah status menjadi `UNDER_REVIEW`. |
| FR-06 | PATCH | `/api/reports/{id}/priority` | Menentukan prioritas. |
| FR-07 | PATCH | `/api/reports/{id}/assignment` | Menugaskan Teknisi dan status `ASSIGNED`. |
| FR-08 | PATCH | `/api/reports/{id}/work-status` | Status `IN_PROGRESS` atau `RESOLVED`. |
| FR-09 | POST | `/api/reports/{id}/comments` | Menambahkan komentar. |
| FR-10 | GET | `/api/reports/{id}/status-history` | Membaca riwayat status. |
| FR-11 | POST | `/api/reports/{id}/confirmation` | Konfirmasi Pelapor setelah `RESOLVED`. |
| FR-12 | PATCH | `/api/reports/{id}/close` | Menutup laporan menjadi `CLOSED`. |
| FR-13 | PATCH | `/api/reports/{id}/reopen` | Membuka kembali laporan menjadi `REOPENED`. |
| FR-14 | GET | `/api/dashboard` | Ringkasan dashboard. |

Endpoint pendukung:

1. `GET /api/users/technicians`: daftar teknisi untuk penugasan.

Hak akses disimulasikan dengan header `X-User-Id` pada tahap awal.
