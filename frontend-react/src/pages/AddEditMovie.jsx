import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

export default function AddEditMovie({ mode }) {
  const isEdit = mode === 'edit'
  const { id } = useParams()
  const nav = useNavigate()

  const [form, setForm] = React.useState({ title: '', poster: '', totalSeats: '', showTime: '', genre: '', duration: '', price: '' })
  const [error, setError] = React.useState('')
  const [msg, setMsg] = React.useState('')

  React.useEffect(() => {
    if (isEdit && id) {
      api(`/movies/${id}`).then(m => {
        setForm({
          title: m.title || '',
          poster: m.poster || '',
          totalSeats: m.totalSeats || '',
          showTime: m.showTime || '',
          genre: m.genre || '',
          duration: m.duration || '',
          price: m.price || ''
        })
      }).catch(e => setError(e.message))
    }
  }, [isEdit, id])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault(); setError(''); setMsg('')
    try {
      const payload = {
        title: form.title,
        poster: form.poster,
        totalSeats: Number(form.totalSeats),
        showTime: form.showTime,
        genre: form.genre || undefined,
        duration: form.duration || undefined,
        price: form.price !== '' ? Number(form.price) : undefined
      }
      if (isEdit) {
        await api(`/movies/${id}`, { method: 'PUT', body: payload })
        setMsg('Movie updated')
      } else {
        await api('/movies', { method: 'POST', body: payload })
        setMsg('Movie created')
        setForm({ title: '', poster: '', totalSeats: '', showTime: '', genre: '', duration: '', price: '' })
      }
      setTimeout(() => nav('/admin'), 600)
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="auth-wrap d-flex align-items-center justify-content-center">
      <div className="auth-card card-glass" style={{maxWidth: '720px', width: '100%'}}>
        <div className="auth-header">
          <h2 className="m-0">{isEdit ? 'Edit Movie' : 'Add Movie'}</h2>
          <p className="auth-subtitle m-0">Configure details for your screening</p>
        </div>
        {msg && <div className="alert alert-success">{msg}</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={onSubmit} className="auth-form">
          <div className="mb-3">
            <label className="form-label">Title</label>
            <input className="form-control" name="title" value={form.title} onChange={onChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Poster filename (e.g., avatar.jpg)</label>
            <input className="form-control" name="poster" value={form.poster} onChange={onChange} required />
            <div className="form-text">Files must exist under backend `public/images/`.</div>
          </div>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label">Total Seats</label>
              <input className="form-control" type="number" name="totalSeats" value={form.totalSeats} onChange={onChange} required />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Showtime (e.g., 6:00 PM)</label>
              <input className="form-control" name="showTime" value={form.showTime} onChange={onChange} required />
            </div>
          </div>
          <div className="row g-3 mt-1">
            <div className="col-12 col-md-6">
              <label className="form-label">Genre</label>
              <input className="form-control" name="genre" value={form.genre} onChange={onChange} />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Duration</label>
              <input className="form-control" name="duration" value={form.duration} onChange={onChange} />
            </div>
          </div>
          <div className="mt-3 mb-3">
            <label className="form-label">Price</label>
            <input className="form-control" type="number" step="0.01" name="price" value={form.price} onChange={onChange} />
          </div>
          <button className="btn btn-primary w-100" type="submit">{isEdit ? 'Update' : 'Create'}</button>
        </form>
      </div>
    </div>
  )
}
