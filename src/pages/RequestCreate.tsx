import { useState } from 'react'

type RequestCreateProps = {
  activeRole: string
  onNavigate: (page: string, requestId?: string) => void
  setNotification: (notif: { type: 'success' | 'error'; message: string } | null) => void
}

export function RequestCreate({ activeRole, onNavigate, setNotification }: RequestCreateProps) {
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState('Fasilitas')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (activeRole !== 'Pelapor') {
      setNotification({
        type: 'error',
        message: 'Hanya pengguna dengan peran Pelapor yang dapat membuat laporan baru.',
      })
      return
    }

    if (!title.trim() || !location.trim() || !category.trim() || !description.trim()) {
      setNotification({
        type: 'error',
        message: 'Mohon isi semua kolom wajib (Judul, Lokasi, Kategori, Deskripsi).',
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          location: location.trim(),
          category: category,
          description: description.trim(),
          priority: priority,
        }),
      })

      if (!response.ok) {
        const errorData = (await response.json()) as { error: string }
        throw new Error(errorData.error || 'Gagal mengirim laporan.')
      }

      const data = (await response.json()) as { request: { id: string } }
      setNotification({
        type: 'success',
        message: 'Laporan berhasil dibuat dan disimpan!',
      })
      onNavigate('detail', data.request.id)
    } catch (error: unknown) {
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengirim laporan.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="form-card">
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 600 }}>Buat Laporan Baru</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Gunakan formulir ini untuk mengajukan perbaikan fasilitas atau layanan kampus.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="form-group">
          <label htmlFor="title">Judul Laporan *</label>
          <input
            id="title"
            type="text"
            className="form-control"
            placeholder="Contoh: AC Mati di Ruang Kelas Lab 3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label htmlFor="category">Kategori *</label>
            <select
              id="category"
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={submitting}
            >
              <option value="Fasilitas">Fasilitas & Gedung</option>
              <option value="IT">Layanan IT / Internet</option>
              <option value="Kebersihan">Kebersihan</option>
              <option value="Keamanan">Keamanan</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Prioritas (Opsional)</label>
            <select
              id="priority"
              className="form-control"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={submitting}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">Lokasi Spesifik *</label>
          <input
            id="location"
            type="text"
            className="form-control"
            placeholder="Contoh: Gedung FTI Lantai 2, Sebelah Lift"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Deskripsi Masalah *</label>
          <textarea
            id="description"
            className="form-control"
            placeholder="Jelaskan detail masalah agar teknisi dapat memahaminya dengan baik..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate('list')}
            disabled={submitting}
          >
            Batal
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || activeRole !== 'Pelapor'}
          >
            {submitting ? 'Mengirim...' : 'Kirim Laporan'}
          </button>
        </div>

        {activeRole !== 'Pelapor' && (
          <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', marginTop: '8px' }}>
            * Anda sedang masuk sebagai <strong>{activeRole}</strong>. Ganti peran menjadi <strong>Pelapor</strong> untuk mengirim laporan.
          </p>
        )}
      </form>
    </div>
  )
}
