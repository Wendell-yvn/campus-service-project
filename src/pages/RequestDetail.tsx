import { useEffect, useMemo, useState } from 'react'

type ServiceRequest = {
  id: string
  request_number: string
  title: string
  description: string
  location: string
  category: string
  priority: string | null
  status: string | null
  created_at: string | null
}

type RequestDetailState =
  | { status: 'loading' }
  | { status: 'loaded'; request: ServiceRequest }
  | { status: 'not-found' }
  | { status: 'error'; message: string }

function formatDate(value: string | null) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function RequestDetail() {
  const requestId = useMemo(() => {
    const [, id = ''] = window.location.pathname.match(/^\/requests\/([^/]+)$/) ?? []

    return decodeURIComponent(id)
  }, [])
  const [detailState, setDetailState] = useState<RequestDetailState>({ status: 'loading' })

  useEffect(() => {
    if (!requestId) {
      setDetailState({ status: 'not-found' })
      return
    }

    const controller = new AbortController()

    fetch(`/api/requests/${encodeURIComponent(requestId)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 404) {
          setDetailState({ status: 'not-found' })
          return
        }

        if (!response.ok) {
          throw new Error('Detail laporan belum bisa dimuat.')
        }

        const data = (await response.json()) as { request: ServiceRequest }
        setDetailState({ status: 'loaded', request: data.request })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setDetailState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Detail laporan belum bisa dimuat.',
        })
      })

    return () => controller.abort()
  }, [requestId])

  if (detailState.status === 'loading') {
    return (
      <main className="request-detail">
        <p className="eyebrow">Detail laporan</p>
        <h1>Memuat laporan</h1>
      </main>
    )
  }

  if (detailState.status === 'not-found') {
    return (
      <main className="request-detail">
        <p className="eyebrow">Detail laporan</p>
        <h1>Laporan tidak ditemukan</h1>
        <p className="muted">Periksa kembali nomor atau tautan laporan yang dibuka.</p>
      </main>
    )
  }

  if (detailState.status === 'error') {
    return (
      <main className="request-detail">
        <p className="eyebrow">Detail laporan</p>
        <h1>Gagal memuat laporan</h1>
        <p className="muted">{detailState.message}</p>
      </main>
    )
  }

  const request = detailState.request

  return (
    <main className="request-detail">
      <section className="request-detail__header">
        <div>
          <p className="eyebrow">Detail laporan</p>
          <h1>{request.title}</h1>
          <p className="muted">{request.request_number}</p>
        </div>
        <div className="status-pill">{request.status ?? 'SUBMITTED'}</div>
      </section>

      <section className="request-detail__summary" aria-label="Ringkasan laporan">
        <div>
          <span>Kategori</span>
          <strong>{request.category}</strong>
        </div>
        <div>
          <span>Prioritas</span>
          <strong>{request.priority ?? 'MEDIUM'}</strong>
        </div>
        <div>
          <span>Lokasi</span>
          <strong>{request.location}</strong>
        </div>
        <div>
          <span>Dibuat</span>
          <strong>{formatDate(request.created_at)}</strong>
        </div>
      </section>

      <section className="request-detail__description">
        <h2>Deskripsi</h2>
        <p>{request.description}</p>
      </section>
    </main>
  )
}
