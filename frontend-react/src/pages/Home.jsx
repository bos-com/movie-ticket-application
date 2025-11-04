import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../state/AuthContext'

export default function Home() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [movies, setMovies] = React.useState([])
  const [q, setQ] = React.useState('')
  const [genre, setGenre] = React.useState('')
  const [error, setError] = React.useState('')
  const WELCOME = 'Welcome to MovieFlex'
  const [typed, setTyped] = React.useState('')

  React.useEffect(() => {
    api('/movies').then(setMovies).catch(e => setError(e.message))
  }, [])

  React.useEffect(() => {
    let i = 0
    let dir = 1 // 1 = typing, -1 = deleting
    let t
    const step = () => {
      setTyped(WELCOME.slice(0, Math.max(0, i)))
      i += dir
      // reached end -> short pause then delete
      if (i > WELCOME.length) {
        dir = -1
        t = setTimeout(step, 700) // pause at full text
        return
      }
      // fully deleted -> short pause then type again
      if (i < 0) {
        dir = 1
        t = setTimeout(step, 450) // pause at empty
        return
      }
      // speed variation: typing slower, deleting faster
      t = setTimeout(step, dir > 0 ? 65 : 35)
    }
    t = setTimeout(step, 120)
    return () => clearTimeout(t)
  }, [])

  const normalized = (s) => (s || '').toLowerCase()
  const filtered = movies.filter(m => {
    const hit = normalized(m.title).includes(normalized(q)) || normalized(m.poster).includes(normalized(q))
    const genreMatch = !genre || normalized(m.genre).includes(normalized(genre))
    return hit && genreMatch
  })
  const genreOptions = ['Action','Sci-Fi','Horror','Adventure']

  const onDelete = async (id) => {
    if (!window.confirm('Delete this movie?')) return
    try {
      await api(`/movies/${id}`, { method: 'DELETE' })
      setMovies(movies.filter(m => m._id !== id))
    } catch (e) { alert(e.message) }
  }

  // Prefer an Avengers feature if available; otherwise use first filtered movie
  const featured = React.useMemo(() => {
    const avengerByPoster = filtered.find(m => (m.poster || '').toLowerCase().includes('avengers'))
    const avengerByTitle = filtered.find(m => (m.title || '').toLowerCase().includes('avengers'))
    return avengerByPoster || avengerByTitle || filtered[0] || null
  }, [filtered])

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Hero section */}
      {/* 50/50 split hero: left image, right gradient content */}
      <div className="hero-wrap mb-4">
        <div className="hero-split">
          <div
            className="hero-left"
            style={{ backgroundImage: `url(http://localhost:5000/images/avengers.jpg)` }}
          />
          <div className="hero-right-pane">
            <div className="hero-content hero-right">
              <div className="welcome typing anim-fade welcome-run" aria-label={WELCOME}>{typed}</div>
              <div className="hero-head d-none d-md-flex gap-4 text-uppercase small text-muted mb-2 anim-fade anim-delay-1">
                <span>Theatres</span>
                <span>Movies</span>
                <span>Events</span>
                <span>Sports</span>
                <span>Offers</span>
                <span>Gift Cards</span>
              </div>
              <h1 className="display-5 fw-bold mb-2 text-shadow anim-fade anim-delay-2">{featured?.title || 'Avengers: Infinity War'}</h1>
              <div className="d-flex flex-wrap gap-2 mb-2 anim-fade anim-delay-3">
                {(((featured && featured.genre) ? featured.genre.split(',') : ['Adventure','Fantasy','Action'])).map(g=> (
                  <span key={g} className="chip">{g.trim()}</span>
                ))}
              </div>
              <div className="text-muted mb-3 anim-fade anim-delay-4">
                <span>English · {(featured && featured.showTime) || 'April 27, 2018 (USA)'} · {(featured && featured.duration) || '2h 36m'}</span>
              </div>
              <p className="hero-desc mb-3 text-shadow anim-fade anim-delay-5">The Avengers and their allies must be willing to sacrifice all in an attempt to defeat the powerful Thanos before his blitz of devastation and ruin puts an end to the universe.</p>
              <div className="d-flex align-items-center gap-3 mb-4 anim-fade anim-delay-6">
                <div className="want-pill">♡ 99% want to see</div>
              </div>
              <div className="d-flex gap-2 anim-fade anim-delay-7">
                {featured ? (
                  <button
                    className="btn btn-pill"
                    onClick={() => {
                      if (!user) return nav('/login')
                      nav(`/movies/${featured._id}`)
                    }}
                  >
                    Book Tickets
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 m-0">Now Showing</h2>
        {user?.role === 'admin' ? (
          <div className="mb-0">
            <Link className="btn btn-success" to="/admin/add">➕ Add Movie</Link>
          </div>
        ) : null}
      </div>

      {user && (
        <div className="row g-2 mb-3">
          <div className="col-12 col-md-8">
            <input
              className="form-control search-input"
              placeholder="Search by title or poster..."
              value={q}
              onChange={e=>setQ(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-4">
            <select className="form-select" value={genre} onChange={e=>setGenre(e.target.value)}>
              <option value="">All genres</option>
              {genreOptions.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      <div className="row g-3">
        {filtered.map(m => (
          <div className="col-12 col-md-6 col-lg-4" key={m._id}>
            <div className="card h-100 movie-card">
              <div className="movie-thumb">
                <img src={`http://localhost:5000/images/${m.poster}`} alt={m.title} onError={(e)=>{e.target.src=''}} />
              </div>
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{m.title}</h5>
                <p className="card-text mb-1">Showtime: {m.showTime}</p>
                <p className="card-text mb-3">Seats: {m.totalSeats}</p>
                <div className="mt-auto d-flex gap-2">
                  {user ? (
                    <Link className="btn btn-primary" to={`/movies/${m._id}`}>View & Book</Link>
                  ) : (
                    <Link className="btn btn-outline-primary" to="/login">BOOK NOW</Link>
                  )}
                  {user?.role === 'admin' && (
                    <>
                      <Link className="btn btn-warning" to={`/admin/edit/${m._id}`}>✏️ Edit</Link>
                      <button className="btn btn-danger" onClick={() => onDelete(m._id)}>🗑 Delete</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
