export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include'
  })
  if (!res.ok) {
    let msg = 'Request failed'
    try { const j = await res.json(); msg = j.message || msg } catch {}
    throw new Error(msg)
  }
  const ct = res.headers.get('content-type') || ''
  return ct.includes('application/json') ? res.json() : res.text()
}

export async function upload(file) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: fd, credentials: 'include' })
  if (!res.ok) {
    let msg = 'Upload failed'
    try { const j = await res.json(); msg = j.message || msg } catch {}
    throw new Error(msg)
  }
  return res.json()
}
