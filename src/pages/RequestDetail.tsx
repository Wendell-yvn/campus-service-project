import { useEffect, useState } from 'react'

type ServiceRequest = {
  id: string
  request_number: string
  title: string
  description: string
  location: string
  category: string
  priority: string | null
  status: string | null
  assigned_technician: string | null
  created_at: string | null
}

type RequestDetailProps = {
  activeRole: string
  requestId: string
  onNavigate: (page: string, requestId?: string) => void
  setNotification: (notif: { type: 'success' | 'error'; message: string } | null) => void
}

function formatDate(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function RequestDetail({ activeRole, requestId, onNavigate, setNotification }: RequestDetailProps) {
  const [request, setRequest] = useState<ServiceRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Admin form states
  const [adminPriority, setAdminPriority] = useState('MEDIUM')
  const [adminCategory, setAdminCategory] = useState('Fasilitas')
  const [adminTechnician, setAdminTechnician] = useState('')

  const fetchDetail = async () => {
    if (!requestId) return
    setLoading(true)
    try {
      const response = await fetch(`/api/requests/${encodeURIComponent(requestId)}`)
      if (response.status === 404) {
        setRequest(null)
        return
      }

      if (!response.ok) {
        throw new Error('Detail laporan gagal dimuat.')
      }

      const data = (await response.json()) as { request: ServiceRequest }
      setRequest(data.request)
      setAdminPriority(data.request.priority || 'MEDIUM')
      setAdminCategory(data.request.category || 'Fasilitas')
      setAdminTechnician(data.request.assigned_technician || '')
    } catch (error: unknown) {
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Gagal memuat detail laporan.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [requestId])

  const handleUpdate = async (updatedFields: Partial<ServiceRequest>) => {
    if (!request) return
    setUpdating(true)
    try {
      const response = await fetch(`/api/requests/${encodeURIComponent(request.id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFields),
      })

      if (!response.ok) {
        const errorData = (await response.json()) as { error: string }
        throw new Error(errorData.error || 'Gagal memperbarui status laporan.')
      }

      const data = (await response.json()) as { request: ServiceRequest }
      setRequest(data.request)
      setAdminPriority(data.request.priority || 'MEDIUM')
      setAdminCategory(data.request.category || 'Fasilitas')
      setAdminTechnician(data.request.assigned_technician || '')
      
      setNotification({
        type: 'success',
        message: 'Laporan berhasil diperbarui!',
      })
    } catch (error: unknown) {
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat memperbarui laporan.',
      })
    } finally {
      setUpdating(false)
    }
  }

  const getStatusPillClass = (status: string | null) => {
    switch (status?.toUpperCase()) {
      case 'SUBMITTED': return 'pill pill-submitted'
      case 'ASSIGNED': return 'pill pill-assigned'
      case 'IN_PROGRESS': return 'pill pill-inprogress'
      case 'RESOLVED': return 'pill pill-resolved'
      case 'CLOSED': return 'pill pill-closed'
      default: return 'pill'
    }
  }

  const getPriorityTagClass = (priority: string | null) => {
    switch (priority?.toUpperCase()) {
      case 'LOW': return 'priority-tag priority-low'
      case 'HIGH': return 'priority-tag priority-high'
      case 'MEDIUM':
      default: return 'priority-tag priority-medium'
    }
  }

  if (loading) {
    return (
      <div className="empty-state">
        <h3>Memuat detail laporan...</h3>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="empty-state">
        <h3>Laporan Tidak Ditemukan</h3>
        <p>Laporan yang Anda cari mungkin tidak ada atau telah dihapus.</p>
        <button className="btn btn-secondary" onClick={() => onNavigate('list')}>
          Kembali ke Daftar
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back navigation */}
      <div style={{ textAlign: 'left' }}>
        <button className="btn btn-secondary" onClick={() => onNavigate('list')}>
          ← Kembali ke Daftar Laporan
        </button>
      </div>

      <div className="detail-grid">
        {/* Main Details Panel */}
        <section className="detail-main" aria-label="Detail utama aduan">
          <div className="detail-header">
            <div className="detail-title-row">
              <h2>{request.title}</h2>
              <span className={getStatusPillClass(request.status)}>{request.status || 'SUBMITTED'}</span>
            </div>
            <div className="detail-meta-horizontal">
              <span>No: <strong>{request.request_number}</strong></span>
              <span>•</span>
              <span>Kategori: <strong style={{ color: 'var(--accent)' }}>{request.category}</strong></span>
              <span>•</span>
              <span>Dibuat: <strong>{formatDate(request.created_at)}</strong></span>
            </div>
          </div>

          <div className="detail-body">
            <h3>Deskripsi Masalah</h3>
            <p>{request.description}</p>
          </div>

          {/* Action Control Panel based on activeRole */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', marginTop: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
              Kontrol Aksi Peran ({activeRole})
            </h3>
            
            {activeRole === 'Pelapor' && (
              <div className="action-panel">
                {request.status === 'RESOLVED' ? (
                  <div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      Teknisi telah menyelesaikan pekerjaan perbaikan. Mohon konfirmasi jika masalah telah teratasi dengan benar.
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleUpdate({ status: 'CLOSED' })}
                      disabled={updating}
                    >
                      {updating ? 'Memproses...' : 'Ya, Konfirmasi Laporan Selesai'}
                    </button>
                  </div>
                ) : request.status === 'CLOSED' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
                    <span style={{ fontSize: '20px' }}>✓</span>
                    <span>Laporan telah selesai dan ditutup secara resmi. Terima kasih atas konfirmasi Anda.</span>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>
                    Menunggu laporan ditindaklanjuti oleh Admin dan Teknisi. Tombol konfirmasi penyelesaian akan muncul setelah teknisi menandai pekerjaan selesai.
                  </p>
                )}
              </div>
            )}

            {activeRole === 'Admin' && (
              <div className="action-panel">
                <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Sebagai Admin, Anda dapat mengedit prioritas, kategori, dan menugaskan teknisi untuk laporan ini.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label htmlFor="admin-priority">Prioritas</label>
                    <select
                      id="admin-priority"
                      className="form-control"
                      value={adminPriority}
                      onChange={(e) => setAdminPriority(e.target.value)}
                      disabled={updating}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="admin-category">Kategori</label>
                    <select
                      id="admin-category"
                      className="form-control"
                      value={adminCategory}
                      onChange={(e) => setAdminCategory(e.target.value)}
                      disabled={updating}
                    >
                      <option value="Fasilitas">Fasilitas</option>
                      <option value="IT">IT / Internet</option>
                      <option value="Kebersihan">Kebersihan</option>
                      <option value="Keamanan">Keamanan</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="admin-tech">Tugaskan Teknisi</label>
                  <select
                    id="admin-tech"
                    className="form-control"
                    value={adminTechnician}
                    onChange={(e) => setAdminTechnician(e.target.value)}
                    disabled={updating}
                  >
                    <option value="">-- Belum Ditugaskan --</option>
                    <option value="Budi (Fasilitas)">Budi (Fasilitas)</option>
                    <option value="Siti (IT)">Siti (IT)</option>
                    <option value="Joko (Kebersihan)">Joko (Kebersihan)</option>
                    <option value="Dewi (Keamanan)">Dewi (Keamanan)</option>
                  </select>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() =>
                    handleUpdate({
                      priority: adminPriority,
                      category: adminCategory,
                      assigned_technician: adminTechnician || null,
                    })
                  }
                  disabled={updating}
                >
                  {updating ? 'Menyimpan...' : 'Simpan & Terapkan Perubahan'}
                </button>
              </div>
            )}

            {activeRole === 'Teknisi' && (
              <div className="action-panel">
                {!request.assigned_technician ? (
                  <p style={{ color: 'var(--text-muted)' }}>
                    Laporan ini belum ditugaskan kepada teknisi mana pun. Admin harus menugaskan Anda terlebih dahulu.
                  </p>
                ) : (
                  <div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      Ditugaskan kepada: <strong>{request.assigned_technician}</strong>
                    </p>
                    
                    {request.status === 'ASSIGNED' && (
                      <div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                          Laporan telah ditugaskan kepada Anda. Silakan mulai pengerjaan saat Anda siap.
                        </p>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleUpdate({ status: 'IN_PROGRESS' })}
                          disabled={updating}
                        >
                          {updating ? 'Memproses...' : 'Mulai Pengerjaan'}
                        </button>
                      </div>
                    )}

                    {request.status === 'IN_PROGRESS' && (
                      <div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                          Pekerjaan sedang aktif dalam proses perbaikan. Setelah selesai, tandai laporan ini sebagai Resolved.
                        </p>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleUpdate({ status: 'RESOLVED' })}
                          disabled={updating}
                        >
                          {updating ? 'Memproses...' : 'Tandai Selesai (Resolved)'}
                        </button>
                      </div>
                    )}

                    {request.status === 'RESOLVED' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24' }}>
                        <span style={{ fontSize: '18px' }}>⚡</span>
                        <span>Anda telah menyelesaikan pekerjaan ini. Menunggu konfirmasi penutupan dari Pelapor.</span>
                      </div>
                    )}

                    {request.status === 'CLOSED' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
                        <span style={{ fontSize: '20px' }}>✓</span>
                        <span>Laporan telah selesai dikonfirmasi dan ditutup secara resmi. Pekerjaan selesai!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Sidebar Metadata Widget */}
        <section className="detail-sidebar" aria-label="Informasi metadata aduan">
          <div className="sidebar-widget">
            <h3>Informasi Aduan</h3>
            <div className="widget-details">
              <div className="widget-row">
                <span>Status</span>
                <span className={getStatusPillClass(request.status)} style={{ scale: '0.9' }}>
                  {request.status || 'SUBMITTED'}
                </span>
              </div>
              <div className="widget-row">
                <span>Prioritas</span>
                <span className={getPriorityTagClass(request.priority)}>{request.priority || 'MEDIUM'}</span>
              </div>
              <div className="widget-row">
                <span>Lokasi</span>
                <strong>{request.location}</strong>
              </div>
              <div className="widget-row">
                <span>Ditugaskan ke</span>
                <strong>{request.assigned_technician || 'Belum ada'}</strong>
              </div>
              <div className="widget-row">
                <span>Kategori</span>
                <strong>{request.category}</strong>
              </div>
              <div className="widget-row">
                <span>Tanggal Lapor</span>
                <strong>{formatDate(request.created_at)}</strong>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
