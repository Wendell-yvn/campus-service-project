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

type RequestListProps = {
  activeRole: string
  onNavigate: (page: string, requestId?: string) => void
  setNotification: (notif: { type: 'success' | 'error'; message: string } | null) => void
}

export function RequestList({ activeRole, onNavigate, setNotification }: RequestListProps) {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    active: 0, // ASSIGNED + IN_PROGRESS
    resolved: 0,
    closed: 0,
  })

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('q', search)
      if (statusFilter) params.append('status', statusFilter)
      if (priorityFilter) params.append('priority', priorityFilter)
      if (categoryFilter) params.append('category', categoryFilter)

      const response = await fetch(`/api/requests?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Gagal memuat daftar laporan.')
      }

      const data = (await response.json()) as { requests: ServiceRequest[] }
      setRequests(data.requests)

      // Calculate stats based on all requests loaded (or we can calculate from database, but doing it in memory is simple and immediate for the list view)
      // Note: to get accurate general stats, we can fetch all requests once
      const allRes = await fetch('/api/requests')
      if (allRes.ok) {
        const allData = (await allRes.json()) as { requests: ServiceRequest[] }
        const rList = allData.requests
        const newStats = {
          total: rList.length,
          submitted: rList.filter((r) => r.status === 'SUBMITTED').length,
          active: rList.filter((r) => r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS').length,
          resolved: rList.filter((r) => r.status === 'RESOLVED').length,
          closed: rList.filter((r) => r.status === 'CLOSED').length,
        }
        setStats(newStats)
      }
    } catch (error: unknown) {
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [search, statusFilter, priorityFilter, categoryFilter])

  const getStatusPillClass = (status: string | null) => {
    switch (status?.toUpperCase()) {
      case 'SUBMITTED':
        return 'pill pill-submitted'
      case 'ASSIGNED':
        return 'pill pill-assigned'
      case 'IN_PROGRESS':
        return 'pill pill-inprogress'
      case 'RESOLVED':
        return 'pill pill-resolved'
      case 'CLOSED':
        return 'pill pill-closed'
      default:
        return 'pill'
    }
  }

  const getPriorityTagClass = (priority: string | null) => {
    switch (priority?.toUpperCase()) {
      case 'LOW':
        return 'priority-tag priority-low'
      case 'HIGH':
        return 'priority-tag priority-high'
      case 'MEDIUM':
      default:
        return 'priority-tag priority-medium'
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }

  return (
    <>
      {/* Dashboard Stats */}
      <section className="stats-grid" aria-label="Statistik Laporan">
        <div className="stat-card">
          <span className="stat-label">Total Laporan</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Baru (Submitted)</span>
          <span className="stat-value" style={{ color: '#60a5fa' }}>{stats.submitted}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Diproses (Active)</span>
          <span className="stat-value" style={{ color: '#c084fc' }}>{stats.active}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Selesai Kerja (Resolved)</span>
          <span className="stat-value" style={{ color: '#34d399' }}>{stats.resolved}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Ditutup (Closed)</span>
          <span className="stat-value" style={{ color: '#94a3b8' }}>{stats.closed}</span>
        </div>
      </section>

      {/* Main content header */}
      <div className="section-header">
        <h2>Daftar Laporan Layanan</h2>
        {activeRole === 'Pelapor' && (
          <button className="btn btn-primary" onClick={() => onNavigate('create')}>
            + Buat Laporan Baru
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <section className="filter-bar" aria-label="Pencarian dan Filter">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Cari kata kunci judul, deskripsi, lokasi, nomor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="select-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Semua Status</option>
          <option value="SUBMITTED">SUBMITTED (Baru)</option>
          <option value="ASSIGNED">ASSIGNED (Ditugaskan)</option>
          <option value="IN_PROGRESS">IN_PROGRESS (Dikerjakan)</option>
          <option value="RESOLVED">RESOLVED (Selesai Kerja)</option>
          <option value="CLOSED">CLOSED (Ditutup)</option>
        </select>

        <select
          className="select-filter"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">Semua Kategori</option>
          <option value="Fasilitas">Fasilitas</option>
          <option value="IT">IT / Internet</option>
          <option value="Kebersihan">Kebersihan</option>
          <option value="Keamanan">Keamanan</option>
          <option value="Lainnya">Lainnya</option>
        </select>

        <select
          className="select-filter"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">Semua Prioritas</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
        </select>
      </section>

      {/* List content */}
      <section className="requests-container" aria-label="Daftar laporan aduan">
        {loading ? (
          <div className="empty-state">
            <h3>Memuat Laporan...</h3>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <h3>Tidak Ada Laporan Ditemukan</h3>
            <p>Cobalah mengganti filter pencarian Anda atau buat laporan baru jika Anda seorang Pelapor.</p>
            {activeRole === 'Pelapor' && (
              <button className="btn btn-primary" onClick={() => onNavigate('create')}>
                Buat Laporan Sekarang
              </button>
            )}
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request.id}
              className="request-row-card"
              onClick={() => onNavigate('detail', request.id)}
            >
              <div className="request-info">
                <div className="request-info-header">
                  <span className="request-number">{request.request_number}</span>
                  <span className={getPriorityTagClass(request.priority)}>{request.priority || 'MEDIUM'}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>|</span>
                  <span style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 600 }}>{request.category}</span>
                </div>
                <h3 className="request-title">{request.title}</h3>
                <p className="request-desc-preview">{request.description}</p>
                <div className="request-meta-tags">
                  <div className="request-meta-item">
                    <span>📍</span>
                    <span>{request.location}</span>
                  </div>
                  <div className="request-meta-item">
                    <span>🕒</span>
                    <span>{formatDate(request.created_at)}</span>
                  </div>
                  {request.assigned_technician && (
                    <div className="request-meta-item">
                      <span>🔧</span>
                      <span>Teknisi: <strong>{request.assigned_technician}</strong></span>
                    </div>
                  )}
                </div>
              </div>
              <div className="request-actions-status">
                <span className={getStatusPillClass(request.status)}>{request.status || 'SUBMITTED'}</span>
              </div>
            </div>
          ))
        )}
      </section>
    </>
  )
}
