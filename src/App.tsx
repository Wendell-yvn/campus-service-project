import { useEffect, useState } from 'react'
import { RequestList } from './pages/RequestList'
import { RequestCreate } from './pages/RequestCreate'
import { RequestDetail } from './pages/RequestDetail'

type Notification = {
  type: 'success' | 'error'
  message: string
}

function App() {
  const [activeRole, setActiveRole] = useState<'Pelapor' | 'Admin' | 'Teknisi'>('Pelapor')
  const [currentPage, setCurrentPage] = useState<'list' | 'create' | 'detail'>('list')
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [notification, setNotification] = useState<Notification | null>(null)

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Sync state with URL on mount
  useEffect(() => {
    const path = window.location.pathname
    const match = path.match(/^\/requests\/([^/]+)$/)
    if (match) {
      setCurrentPage('detail')
      setSelectedRequestId(decodeURIComponent(match[1]))
    } else if (path === '/create') {
      setCurrentPage('create')
      setSelectedRequestId(null)
    } else {
      setCurrentPage('list')
      setSelectedRequestId(null)
    }
  }, [])

  // Listen to popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      const match = path.match(/^\/requests\/([^/]+)$/)
      if (match) {
        setCurrentPage('detail')
        setSelectedRequestId(decodeURIComponent(match[1]))
      } else if (path === '/create') {
        setCurrentPage('create')
        setSelectedRequestId(null)
      } else {
        setCurrentPage('list')
        setSelectedRequestId(null)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleNavigate = (page: string, requestId?: string) => {
    setCurrentPage(page as 'list' | 'create' | 'detail')
    if (page === 'detail' && requestId) {
      setSelectedRequestId(requestId)
      window.history.pushState(null, '', `/requests/${encodeURIComponent(requestId)}`)
    } else if (page === 'create') {
      setSelectedRequestId(null)
      window.history.pushState(null, '', '/create')
    } else {
      setSelectedRequestId(null)
      window.history.pushState(null, '', '/')
    }
  }

  return (
    <>
      {/* App Header & Role Simulator */}
      <header className="app-header">
        <div className="brand" onClick={() => handleNavigate('list')}>
          <span style={{ fontSize: '24px' }}>🏫</span>
          <h1>Campus Service Portal</h1>
        </div>

        {/* Role Simulator */}
        <div className="role-switcher-container" aria-label="Simulator Peran">
          <span className="role-switcher-label">Peran Aktif:</span>
          <button
            className={`role-btn ${activeRole === 'Pelapor' ? 'active' : ''}`}
            onClick={() => {
              setActiveRole('Pelapor')
              setNotification({ type: 'success', message: 'Beralih ke peran Pelapor (Pelapor Aduan).' })
            }}
          >
            Pelapor
          </button>
          <button
            className={`role-btn ${activeRole === 'Admin' ? 'active' : ''}`}
            onClick={() => {
              setActiveRole('Admin')
              setNotification({ type: 'success', message: 'Beralih ke peran Admin (Pengelola Layanan).' })
            }}
          >
            Admin
          </button>
          <button
            className={`role-btn ${activeRole === 'Teknisi' ? 'active' : ''}`}
            onClick={() => {
              setActiveRole('Teknisi')
              setNotification({ type: 'success', message: 'Beralih ke peran Teknisi (Penyelesai Lapangan).' })
            }}
          >
            Teknisi
          </button>
        </div>
      </header>

      {/* Global Alerts Banner */}
      {notification && (
        <div
          className={`alert-banner ${notification.type === 'success' ? 'success' : ''}`}
          style={{ marginBottom: '24px' }}
        >
          <span>{notification.message}</span>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              marginLeft: '12px',
            }}
            onClick={() => setNotification(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Main Pages Router */}
      <main>
        {currentPage === 'list' && (
          <RequestList
            activeRole={activeRole}
            onNavigate={handleNavigate}
            setNotification={setNotification}
          />
        )}
        {currentPage === 'create' && (
          <RequestCreate
            activeRole={activeRole}
            onNavigate={handleNavigate}
            setNotification={setNotification}
          />
        )}
        {currentPage === 'detail' && selectedRequestId && (
          <RequestDetail
            activeRole={activeRole}
            requestId={selectedRequestId}
            onNavigate={handleNavigate}
            setNotification={setNotification}
          />
        )}
      </main>
    </>
  )
}

export default App
