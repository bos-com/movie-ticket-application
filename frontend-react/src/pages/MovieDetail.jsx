import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../state/AuthContext'

// initial of the moviedetails
export default function MovieDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user } = useAuth()
  const [movie, setMovie] = React.useState(null)
  const [seat, setSeat] = React.useState('')
  const [ticket, setTicket] = React.useState(null)
  const [msg, setMsg] = React.useState('')
  const [error, setError] = React.useState('')
  const imgUrl = (name) => `http://localhost:5000/images/${encodeURI(name || '')}`

  React.useEffect(() => {
    api(`/movies/${id}`).then(setMovie).catch(e => setError(e.message))
  }, [id])

  // Mark as Continue Watching in localStorage
  React.useEffect(() => {
    if (!movie?._id) return
    try {
      const key = 'cw'
      const max = 12
      const curr = JSON.parse(localStorage.getItem(key) || '[]')
      const idStr = String(movie._id)
      const next = [idStr, ...curr.filter(x => String(x) !== idStr)].slice(0, max)
      localStorage.setItem(key, JSON.stringify(next))
    } catch {}
  }, [movie])

  const seats = React.useMemo(() => {
    if (!movie) return []
    return Array.from({ length: Number(movie.totalSeats || 0) }, (_, i) => i + 1)
  }, [movie])

  const book = async () => {
    if (!user) { nav('/login'); return }
    if (!seat) { setError('Select a seat'); return }
    try {
      setError(''); setMsg('')
      const t = await api(`/movies/${id}/book`, { method: 'POST', body: { seat: Number(seat) } })
      setTicket(t)
      setMsg('Seat booked. Proceed to payment.')
    } catch (e) {
      setError(e.message)
      // If the seat got taken in the meantime, refresh movie to show latest booked seats
      if ((e?.message || '').toLowerCase().includes('already booked')) {
        try { const latest = await api(`/movies/${id}`); setMovie(latest) } catch {}
      }
    }
  }

  const pay = async () => {
    if (!ticket) return
    try {
      setError(''); setMsg('')
      const paid = await api(`/tickets/${ticket.id}/pay`, { method: 'POST' })
      setTicket(paid)
      setMsg('Payment successful')
    } catch (e) { setError(e.message) }
  }

  if (!movie) return (
    <div>
      {error ? <div className="alert alert-danger">{error}</div> : <div>Loading...</div>}
    </div>
  )

  return (
    <div className="row">
      <div className="col-12 col-lg-6">
        <img src={imgUrl(movie.poster)} alt={movie.title} className="img-fluid rounded mb-3" onError={(e)=>{e.target.src=''}} />
      </div>
      <div className="col-12 col-lg-6">
        <h2 className="h4">{movie.title}</h2>
        <p className="mb-1">Showtime: {movie.showTime}</p>
        <p className="mb-3">Seats: {movie.totalSeats}</p>

        {msg && <div className="alert alert-success">{msg}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="mb-3">
          <label className="form-label">Select Seat</label>
          <select className="form-select" value={seat} onChange={e=>setSeat(e.target.value)}>
            <option value="">Choose...</option>
            {seats.map(s => (
              <option key={s} value={s} disabled={movie.bookedSeats?.includes(s)}>
                Seat {s} {movie.bookedSeats?.includes(s) ? '(booked)' : ''}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary me-2" onClick={book} disabled={!seat || movie.bookedSeats?.includes(Number(seat))}>Book</button>
        <button className="btn btn-success" onClick={pay} disabled={!ticket || ticket.paid}>Pay</button>
        {ticket && (
          <div className="mt-3">
            <div>Ticket ID: {ticket.id}</div>
            <div>Seat: {ticket.seat}</div>
            <div>Status: {ticket.paid ? 'Paid' : 'Unpaid'}</div>
          </div>
        )}
      </div>
    </div>
  )
}
