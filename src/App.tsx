import { useEffect, useMemo, useState } from 'react'

type Role = 'REPORTER' | 'ADMIN' | 'TECHNICIAN' | 'FACILITY_MANAGER'
type Page = 'reports' | 'create' | 'detail' | 'dashboard'
type Status = 'SUBMITTED' | 'UNDER_REVIEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REOPENED'
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

type AppUser = {
  id: string
  name: string
  role: Role
}

type Report = {
  id: string
  request_number: string
  title: string
  reporter_id: string
  reporter_name: string | null
  assigned_technician_id: string | null
  technician_name: string | null
  category: string
  location: string
  description: string
  priority: Priority | null
  status: Status
  created_at: string
  updated_at: string
  comments?: CommentItem[]
  statusHistory?: StatusHistoryItem[]
  confirmation?: Confirmation | null
}

type CommentItem = {
  id: string
  authorId: string
  authorName: string
  body: string
  createdAt: string
}

type StatusHistoryItem = {
  id: string
  changedBy: string
  changedByName: string
  fromStatus: Status | null
  toStatus: Status
  note: string | null
  createdAt: string
}

type Confirmation = {
  id: string
  reporterId: string
  reporterName: string
  confirmed: number
  note: string | null
  createdAt: string
}

type Technician = {
  id: string
  name: string
}

type DashboardData = {
  byStatus: Array<{ status: Status; count: number }>
  byCategory: Array<{ category: string; count: number }>
  byPriority: Array<{ priority: string; count: number }>
  openReports: Report[]
}

const USERS: AppUser[] = [
  { id: 'usr_reporter_001', name: 'Pelapor Demo', role: 'REPORTER' },
  { id: 'usr_admin_001', name: 'Administrator Demo', role: 'ADMIN' },
  { id: 'usr_technician_001', name: 'Teknisi Fasilitas', role: 'TECHNICIAN' },
  { id: 'usr_manager_001', name: 'Manajer Fasilitas Demo', role: 'FACILITY_MANAGER' },
]

const STATUS_LABELS: Record<Status, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REOPENED: 'Reopened',
}

const LOCATION_CATEGORIES = ['Ruang Kelas', 'Laboratorium', 'Perpustakaan', 'Kantor', 'Aula', 'Koridor', 'Area Umum', 'Lainnya']

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function roleLabel(role: Role) {
  switch (role) {
    case 'REPORTER':
      return 'Pelapor'
    case 'ADMIN':
      return 'Administrator'
    case 'TECHNICIAN':
      return 'Teknisi'
    case 'FACILITY_MANAGER':
      return 'Manajer Fasilitas'
  }
}

function statusClass(status: Status) {
  return `pill pill-${status.toLowerCase().replace('_', '-')}`
}

function priorityClass(priority: Priority | null) {
  return `priority priority-${(priority || 'UNSET').toLowerCase()}`
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json() as { error?: { message?: string } } & T
  if (!response.ok) {
    const message = payload.error?.message || 'Permintaan gagal.'
    throw new Error(message)
  }
  return payload
}

function App() {
  const [activeUser, setActiveUser] = useState<AppUser | null>(null)
  const [page, setPage] = useState<Page>('reports')
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [filters, setFilters] = useState({ q: '', status: '', category: '', location: '' })

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    'X-User-Id': activeUser?.id || '',
  }), [activeUser?.id])

  const notify = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(null), 4500)
  }

  const loadReports = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.q) params.set('q', filters.q)
      if (filters.status) params.set('status', filters.status)
      if (filters.category) params.set('category', filters.category)
      if (filters.location) params.set('location', filters.location)
      const response = await fetch(`/api/reports?${params.toString()}`, { headers })
      const payload = await parseResponse<{ data: Report[] }>(response)
      setReports(payload.data)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Gagal memuat laporan.')
    } finally {
      setLoading(false)
    }
  }

  const loadTechnicians = async () => {
    try {
      const response = await fetch('/api/users/technicians', { headers })
      const payload = await parseResponse<{ data: Technician[] }>(response)
      setTechnicians(payload.data)
    } catch {
      setTechnicians([])
    }
  }

  const loadDetail = async (reportId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reports/${encodeURIComponent(reportId)}`, { headers })
      const payload = await parseResponse<{ data: Report }>(response)
      setSelectedReport(payload.data)
      setPage('detail')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Gagal memuat detail laporan.')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/dashboard', { headers })
      const payload = await parseResponse<{ data: DashboardData }>(response)
      setDashboard(payload.data)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Gagal memuat dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!activeUser) return
    if (page === 'dashboard') {
      loadDashboard()
    } else {
      loadReports()
    }
    loadTechnicians()
  }, [activeUser, page, filters])

  const login = (user: AppUser) => {
    setActiveUser(user)
    setSelectedReport(null)
    setPage(user.role === 'FACILITY_MANAGER' ? 'dashboard' : 'reports')
    notify(`Masuk sebagai ${roleLabel(user.role)}.`)
  }

  const logout = () => {
    setActiveUser(null)
    setSelectedReport(null)
    setReports([])
    setDashboard(null)
    setPage('reports')
  }

  const refreshDetail = async () => {
    if (selectedReport) await loadDetail(selectedReport.id)
    await loadReports()
  }

  const apiAction = async (path: string, method: 'POST' | 'PATCH', body: Record<string, unknown>) => {
    const response = await fetch(path, {
      method,
      headers,
      body: JSON.stringify(body),
    })
    const payload = await parseResponse<{ data: Report }>(response)
    setSelectedReport(payload.data)
    await loadReports()
    notify('Perubahan tersimpan.')
  }

  if (!activeUser) {
    return <LoginScreen onLogin={login} />
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setPage(activeUser.role === 'FACILITY_MANAGER' ? 'dashboard' : 'reports')}>
          <span className="brand-mark">CS</span>
          <span>
            <strong>Campus Service</strong>
            <small>Request and Maintenance</small>
          </span>
        </button>
        <nav className="nav-actions">
          <button className={page === 'reports' ? 'nav active' : 'nav'} onClick={() => setPage('reports')}>
            Daftar Laporan
          </button>
          {activeUser.role === 'REPORTER' && (
            <button className={page === 'create' ? 'nav active' : 'nav'} onClick={() => setPage('create')}>
              Buat Laporan
            </button>
          )}
          {(activeUser.role === 'FACILITY_MANAGER' || activeUser.role === 'ADMIN') && (
            <button className={page === 'dashboard' ? 'nav active' : 'nav'} onClick={() => setPage('dashboard')}>
              Dashboard
            </button>
          )}
        </nav>
        <button className="btn ghost" onClick={logout}>Keluar</button>
      </header>

      <section className="current-user">
        <span>{activeUser.name}</span>
        <strong>{roleLabel(activeUser.role)}</strong>
      </section>

      {message && <div className="toast">{message}</div>}

      <main>
        {page === 'reports' && (
          <ReportList
            activeUser={activeUser}
            filters={filters}
            loading={loading}
            reports={reports}
            setFilters={setFilters}
            onCreate={() => setPage('create')}
            onOpen={loadDetail}
          />
        )}
        {page === 'create' && (
          <CreateReport
            headers={headers}
            onCancel={() => setPage('reports')}
            onCreated={(report) => {
              setSelectedReport(report)
              setPage('detail')
              loadReports()
              notify(`Laporan ${report.request_number} berhasil dibuat.`)
            }}
            onError={notify}
          />
        )}
        {page === 'detail' && selectedReport && (
          <ReportDetail
            activeUser={activeUser}
            headers={headers}
            report={selectedReport}
            technicians={technicians}
            onBack={() => setPage('reports')}
            onAction={apiAction}
            onRefresh={refreshDetail}
            onError={notify}
          />
        )}
        {page === 'dashboard' && (
          <DashboardView
            dashboard={dashboard}
            loading={loading}
            onOpen={loadDetail}
          />
        )}
      </main>
    </div>
  )
}

function LoginScreen(props: { onLogin: (user: AppUser) => void }) {
  const [role, setRole] = useState<Role>('REPORTER')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Email dan password wajib diisi.')
      return
    }
    const user = USERS.find((item) => item.role === role)
    if (user) props.onLogin(user)
  }

  return (
    <main className="login-page">
      <section className="login-hero">
        <span className="login-kicker">Campus Service Request</span>
        <h1>Sistem Pelaporan dan Pemeliharaan Fasilitas Kampus</h1>
        <p>
          Masuk sebagai Pelapor, Administrator, Teknisi, atau Manajer Fasilitas untuk mengelola alur laporan dari
          Submitted sampai Closed.
        </p>
        <div className="login-highlights">
          <span>Laporan fasilitas</span>
          <span>Riwayat status</span>
          <span>Dashboard fasilitas</span>
        </div>
      </section>

      <section className="login-card">
        <div>
          <h2>Masuk ke Sistem</h2>
          <p>Form login ini bersifat formalitas untuk simulasi hak akses.</p>
        </div>
        <form className="form" onSubmit={submit}>
          <label>
            Peran
            <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
              <option value="REPORTER">Pelapor</option>
              <option value="ADMIN">Administrator</option>
              <option value="TECHNICIAN">Teknisi</option>
              <option value="FACILITY_MANAGER">Manajer Fasilitas</option>
            </select>
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={role === 'ADMIN' ? 'admin@kampus.ac.id' : 'nama@kampus.ac.id'}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan password"
            />
          </label>
          {role === 'ADMIN' && (
            <p className="form-note">Administrator dapat memakai email kampus. Validasi domain belum diterapkan pada tahap ini.</p>
          )}
          {error && <p className="form-error">{error}</p>}
          <button className="btn primary" type="submit">Masuk</button>
        </form>
      </section>
    </main>
  )
}

function ReportList(props: {
  activeUser: AppUser
  filters: { q: string; status: string; category: string; location: string }
  loading: boolean
  reports: Report[]
  setFilters: (filters: { q: string; status: string; category: string; location: string }) => void
  onCreate: () => void
  onOpen: (reportId: string) => void
}) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h1>{props.activeUser.role === 'TECHNICIAN' ? 'Daftar Tugas Teknisi' : 'Daftar Laporan'}</h1>
          <p>Nomor, judul, lokasi, status, prioritas, dan penanggung jawab laporan.</p>
        </div>
        {props.activeUser.role === 'REPORTER' && (
          <button className="btn primary" onClick={props.onCreate}>Buat Laporan</button>
        )}
      </div>

      <div className="filter-grid">
        <input
          value={props.filters.q}
          onChange={(event) => props.setFilters({ ...props.filters, q: event.target.value })}
          placeholder="Cari nomor, judul, lokasi, atau deskripsi"
        />
        <select value={props.filters.category} onChange={(event) => props.setFilters({ ...props.filters, category: event.target.value })}>
          <option value="">Semua kategori lokasi</option>
          {LOCATION_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <select value={props.filters.status} onChange={(event) => props.setFilters({ ...props.filters, status: event.target.value })}>
          <option value="">Semua status</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input
          value={props.filters.location}
          onChange={(event) => props.setFilters({ ...props.filters, location: event.target.value })}
          placeholder="Filter lokasi"
        />
      </div>

      {props.loading ? (
        <div className="empty">Memuat laporan...</div>
      ) : props.reports.length === 0 ? (
        <div className="empty">Belum ada laporan yang sesuai.</div>
      ) : (
        <div className="table">
          <div className="table-head">
            <span>Nomor</span>
            <span>Judul</span>
            <span>Lokasi</span>
            <span>Waktu Masuk</span>
            <span>Status</span>
            <span>Prioritas</span>
            <span>Aksi</span>
          </div>
          {props.reports.map((report) => (
            <button className="table-row" key={report.id} onClick={() => props.onOpen(report.id)}>
              <span className="mono">{report.request_number}</span>
              <span>{report.title}</span>
              <span>{report.location}</span>
              <span>{formatDate(report.created_at)}</span>
              <span><span className={statusClass(report.status)}>{STATUS_LABELS[report.status]}</span></span>
              <span><span className={priorityClass(report.priority)}>{report.priority || '-'}</span></span>
              <span className="link">Lihat Detail</span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function CreateReport(props: {
  headers: HeadersInit
  onCancel: () => void
  onCreated: (report: Report) => void
  onError: (message: string) => void
}) {
  const [form, setForm] = useState({ title: '', category: 'Ruang Kelas', location: '', description: '' })
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.title.trim() || !form.category.trim() || !form.location.trim() || !form.description.trim()) {
      props.onError('Semua field wajib harus diisi.')
      return
    }
    if (form.description.trim().length < 20) {
      props.onError('Deskripsi minimal 20 karakter.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: props.headers,
        body: JSON.stringify(form),
      })
      const payload = await parseResponse<{ data: Report }>(response)
      props.onCreated(payload.data)
    } catch (error) {
      props.onError(error instanceof Error ? error.message : 'Gagal membuat laporan.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="panel narrow">
      <div className="section-heading">
        <div>
          <h1>Buat Laporan Baru</h1>
          <p>Isi lokasi dan fasilitas yang bermasalah. Tanggal dan jam laporan masuk akan dicatat otomatis.</p>
        </div>
      </div>
      <form className="form" onSubmit={submit}>
        <label>
          Fasilitas/barang yang bermasalah *
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Contoh: AC ruang kelas tidak dingin" />
        </label>
        <label>
          Kategori lokasi *
          <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
            {LOCATION_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label>
          Lokasi *
          <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Contoh: Ruang 301" />
        </label>
        <div className="notice">Tanggal dan jam masuk: otomatis saat laporan disimpan.</div>
        <label>
          Deskripsi masalah *
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Jelaskan masalah fasilitas secara jelas." />
          <small>{form.description.length}/20 karakter minimum</small>
        </label>
        <div className="actions">
          <button type="button" className="btn ghost" onClick={props.onCancel}>Batal</button>
          <button type="submit" className="btn primary" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Laporan'}</button>
        </div>
      </form>
    </section>
  )
}

function ReportDetail(props: {
  activeUser: AppUser
  headers: HeadersInit
  report: Report
  technicians: Technician[]
  onBack: () => void
  onAction: (path: string, method: 'POST' | 'PATCH', body: Record<string, unknown>) => Promise<void>
  onRefresh: () => Promise<void>
  onError: (message: string) => void
}) {
  const [priority, setPriority] = useState<Priority>(props.report.priority || 'MEDIUM')
  const [technicianId, setTechnicianId] = useState(props.report.assigned_technician_id || '')
  const [note, setNote] = useState('')
  const [comment, setComment] = useState('')

  useEffect(() => {
    setPriority(props.report.priority || 'MEDIUM')
    setTechnicianId(props.report.assigned_technician_id || '')
  }, [props.report])

  const action = async (path: string, method: 'POST' | 'PATCH', body: Record<string, unknown>) => {
    await props.onAction(path, method, body)
    setNote('')
  }

  const submitComment = async () => {
    if (!comment.trim()) {
      props.onError('Komentar wajib diisi.')
      return
    }
    try {
      await action(`/api/reports/${props.report.id}/comments`, 'POST', { body: comment })
      setComment('')
    } catch (error) {
      props.onError(error instanceof Error ? error.message : 'Gagal menyimpan komentar.')
    }
  }

  const canClose = props.report.status === 'RESOLVED' && props.report.confirmation?.confirmed === 1

  return (
    <section className="detail-layout">
      <div className="panel">
        <button className="btn ghost" onClick={props.onBack}>Kembali ke Daftar</button>
        <div className="detail-title">
          <div>
            <span className="mono">{props.report.request_number}</span>
            <h1>{props.report.title}</h1>
          </div>
          <span className={statusClass(props.report.status)}>{STATUS_LABELS[props.report.status]}</span>
        </div>
        <div className="meta-grid">
          <Info label="Lokasi" value={props.report.location} />
          <Info label="Kategori Lokasi" value={props.report.category} />
          <Info label="Prioritas" value={props.report.priority || '-'} />
          <Info label="Pelapor" value={props.report.reporter_name || props.report.reporter_id} />
          <Info label="Teknisi" value={props.report.technician_name || 'Belum ditugaskan'} />
          <Info label="Tanggal/Jam Masuk" value={formatDate(props.report.created_at)} />
        </div>
        <article className="description">
          <h2>Deskripsi</h2>
          <p>{props.report.description}</p>
        </article>

        <section className="subsection">
          <h2>Komentar</h2>
          <div className="comment-list">
            {(props.report.comments || []).length === 0 ? (
              <p className="muted">Belum ada komentar.</p>
            ) : (
              props.report.comments?.map((item) => (
                <div className="comment" key={item.id}>
                  <strong>{item.authorName}</strong>
                  <span>{formatDate(item.createdAt)}</span>
                  <p>{item.body}</p>
                </div>
              ))
            )}
          </div>
          <div className="inline-form">
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Tambahkan komentar atau catatan" />
            <button className="btn secondary" onClick={submitComment}>Kirim Komentar</button>
          </div>
        </section>

        <section className="subsection">
          <h2>Riwayat Status</h2>
          <div className="timeline">
            {(props.report.statusHistory || []).map((item) => (
              <div className="timeline-item" key={item.id}>
                <strong>{item.fromStatus ? STATUS_LABELS[item.fromStatus] : '-'} {'->'} {STATUS_LABELS[item.toStatus]}</strong>
                <span>{item.changedByName} - {formatDate(item.createdAt)}</span>
                {item.note && <p>{item.note}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="panel side">
        <h2>Aksi {roleLabel(props.activeUser.role)}</h2>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Catatan aksi (opsional)" />

        {props.activeUser.role === 'ADMIN' && (
          <div className="stack">
            {(props.report.status === 'SUBMITTED' || props.report.status === 'REOPENED') && (
              <button className="btn primary" onClick={() => action(`/api/reports/${props.report.id}/review`, 'PATCH', { note })}>
                Ubah ke Under Review
              </button>
            )}
            <label>
              Prioritas
              <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </label>
            <button className="btn secondary" onClick={() => action(`/api/reports/${props.report.id}/priority`, 'PATCH', { priority, note })}>
              Simpan Prioritas
            </button>
            <label>
              Teknisi
              <select value={technicianId} onChange={(event) => setTechnicianId(event.target.value)}>
                <option value="">Pilih teknisi</option>
                {props.technicians.map((technician) => (
                  <option key={technician.id} value={technician.id}>{technician.name}</option>
                ))}
              </select>
            </label>
            <button className="btn secondary" onClick={() => action(`/api/reports/${props.report.id}/assignment`, 'PATCH', { technicianId, priority, note })}>
              Tugaskan Teknisi
            </button>
            <button className="btn primary" disabled={!canClose} onClick={() => action(`/api/reports/${props.report.id}/close`, 'PATCH', { note })}>
              Tutup Laporan
            </button>
            <button className="btn danger" disabled={props.report.status !== 'CLOSED'} onClick={() => action(`/api/reports/${props.report.id}/reopen`, 'PATCH', { note })}>
              Reopen
            </button>
          </div>
        )}

        {props.activeUser.role === 'TECHNICIAN' && (
          <div className="stack">
            <button className="btn primary" disabled={props.report.status !== 'ASSIGNED'} onClick={() => action(`/api/reports/${props.report.id}/work-status`, 'PATCH', { status: 'IN_PROGRESS', note })}>
              Mulai Pekerjaan
            </button>
            <button className="btn primary" disabled={props.report.status !== 'IN_PROGRESS'} onClick={() => action(`/api/reports/${props.report.id}/work-status`, 'PATCH', { status: 'RESOLVED', note })}>
              Tandai Resolved
            </button>
          </div>
        )}

        {props.activeUser.role === 'REPORTER' && (
          <div className="stack">
            <button className="btn primary" disabled={props.report.status !== 'RESOLVED'} onClick={() => action(`/api/reports/${props.report.id}/confirmation`, 'POST', { confirmed: true, note })}>
              Konfirmasi Selesai
            </button>
            {props.report.confirmation && <p className="muted">Laporan sudah dikonfirmasi oleh Pelapor.</p>}
          </div>
        )}

        {props.activeUser.role === 'FACILITY_MANAGER' && (
          <p className="muted">Manajer Fasilitas dapat memantau laporan dan dashboard, tanpa mengubah proses operasional.</p>
        )}
      </aside>
    </section>
  )
}

function Info(props: { label: string; value: string }) {
  return (
    <div className="info">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  )
}

function DashboardView(props: {
  dashboard: DashboardData | null
  loading: boolean
  onOpen: (reportId: string) => void
}) {
  const statusCounts = new Map((props.dashboard?.byStatus || []).map((item) => [item.status, item.count]))

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h1>Dashboard Fasilitas</h1>
          <p>Ringkasan jumlah laporan berdasarkan status, kategori lokasi, prioritas, dan laporan belum selesai.</p>
        </div>
      </div>
      {props.loading ? (
        <div className="empty">Memuat dashboard...</div>
      ) : (
        <>
          <div className="stats-grid">
            {(Object.keys(STATUS_LABELS) as Status[]).filter((status) => status !== 'REOPENED').map((status) => (
              <div className="stat" key={status}>
                <span>{STATUS_LABELS[status]}</span>
                <strong>{statusCounts.get(status) || 0}</strong>
              </div>
            ))}
          </div>
          <div className="dashboard-grid">
            <Summary title="Kategori Lokasi" rows={(props.dashboard?.byCategory || []).map((item) => ({ label: item.category, count: item.count }))} />
            <Summary title="Prioritas" rows={(props.dashboard?.byPriority || []).map((item) => ({ label: item.priority, count: item.count }))} />
          </div>
          <h2>Laporan Belum Selesai</h2>
          <div className="table compact">
            {(props.dashboard?.openReports || []).map((report) => (
              <button className="table-row" key={report.id} onClick={() => props.onOpen(report.id)}>
                <span className="mono">{report.request_number}</span>
                <span>{report.title}</span>
                <span>{report.location}</span>
                <span><span className={statusClass(report.status)}>{STATUS_LABELS[report.status]}</span></span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function Summary(props: { title: string; rows: Array<{ label: string; count: number }> }) {
  return (
    <section className="summary">
      <h2>{props.title}</h2>
      {props.rows.length === 0 ? (
        <p className="muted">Belum ada data.</p>
      ) : (
        props.rows.map((row) => (
          <div className="summary-row" key={row.label}>
            <span>{row.label}</span>
            <strong>{row.count}</strong>
          </div>
        ))
      )}
    </section>
  )
}

export default App
