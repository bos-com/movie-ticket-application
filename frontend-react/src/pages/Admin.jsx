import React from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../state/AuthContext'

export default function Admin() {
  const { user } = useAuth()
  const [movies, setMovies] = React.useState([])
  const [error, setError] = React.useState('')

  const load = React.useCallback(() => {
    api('/movies').then(setMovies).catch(e=>setError(e.message))
  }, [])

  React.useEffect(() => { load() }, [load])

  const onDelete = async (id) => {
    if (!window.confirm('Delete this movie?')) return
    try {
      await api(`/movies/${id}`, { method: 'DELETE' })
      load()
    } catch (e) { alert(e.message) }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 m-0">Admin Panel</h2>
        <Link className="btn btn-primary" to="/admin/add">Add Movie</Link>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="table-responsive">
        <table className="table table-dark table-striped">
          <thead>
            <tr>
              <th>Title</th>
              <th>Showtime</th>
              <th>Seats</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {movies.map(m => (
              <tr key={m._id}>
                <td>{m.title}</td>
                <td>{m.showTime}</td>
                <td>{m.totalSeats}</td>
                <td className="d-flex gap-2">
                  <Link className="btn btn-sm btn-warning" to={`/admin/edit/${m._id}`}>Edit</Link>
                  <button className="btn btn-sm btn-danger" onClick={()=>onDelete(m._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
