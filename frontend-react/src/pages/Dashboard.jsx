import React from 'react'
import { api } from '../api'

export default function Dashboard() {
  const [tickets, setTickets] = React.useState([])
  const [error, setError] = React.useState('')
  const [msg, setMsg] = React.useState('')

  const load = React.useCallback(() => {
    setError(''); setMsg('')
    api('/tickets/me').then(setTickets).catch(e => setError(e.message))
  }, [])

  React.useEffect(() => { load() }, [load])

  const pay = async (id) => {
    try {
      setError(''); setMsg('')
      await api(`/tickets/${id}/pay`, { method: 'POST' })
      setMsg('Payment successful')
      load()
    } catch (e) { setError(e.message) }
  }

  return (
    <div>
      <h2 className="h4 mb-3">My Tickets</h2>
      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Movie</th>
              <th>Seat</th>
              <th>Booked At</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(t => (
              <tr key={t.id}>
                <td>{t.movieTitle || t.movieId}</td>
                <td>{t.seat}</td>
                <td>{new Date(t.bookedAt).toLocaleString()}</td>
                <td>{t.paid ? 'Paid' : 'Unpaid'}</td>
                <td>
                  {!t.paid && (
                    <button className="btn btn-sm btn-success" onClick={() => pay(t.id)}>Pay</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
