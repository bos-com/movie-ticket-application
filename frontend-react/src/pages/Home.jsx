import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../state/AuthContext'

export default function Home() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [movies, setMovies] = React.useState([])
  const [q, setQ] = React.useState('')
  const [genre, setGenre] = React.useState('')
  const [error, setError] = React.useState('')
  const WELCOME = 'Welcome to MovieFlex'
  const [typed, setTyped] = React.useState('')
  const [activeTab, setActiveTab] = React.useState('Browse')
  const [sort, setSort] = React.useState('Popular')
  const genreChips = ['Action','Horror','Classic','Marvel','Sci-Fi','Adventure']
  const [follows, setFollows] = React.useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('follows') || '[]')) } catch { return new Set() }
  })
  const [reactions, setReactions] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('reactions') || '{}') } catch { return {} }
  })
  const previewImages = React.useMemo(() => [
    'avengers.jpg',
    'inception.jpg',
    'interstellar.jpg',
    'avatar.jpg',
    'spiderman.webp',
    'frozen_ii.jpg'
  ], [])

  const imgUrl = (name) => `http://localhost:5000/images/${encodeURI(name)}`

  // Card actions: follow, like, reactions
  const saveFollows = (next) => {
    setFollows(new Set(next))
    try { localStorage.setItem('follows', JSON.stringify(Array.from(next))) } catch {}
  }
  const toggleFollow = (id) => {
    const next = new Set(follows)
    if (next.has(id)) next.delete(id); else next.add(id)
    saveFollows(next)
  }
  const cycleEmoji = (current) => {
    const set = ['😀','😍','😂','😮','😢']
    const idx = Math.max(0, set.indexOf(current))
    return set[(idx + 1) % set.length]
  }
  const setReaction = (id, emoji) => {
    const next = { ...reactions, [id]: emoji }
    setReactions(next)
    try { localStorage.setItem('reactions', JSON.stringify(next)) } catch {}
  }
  const toggleReaction = (id) => {
    const curr = reactions[id] || '😀'
    setReaction(id, cycleEmoji(curr))
  }
  const toggleLike = async (m) => {
    try {
      if (!user) { nav('/login'); return }
      const res = await api(`/movies/${m._id}/like`, { method: 'POST' })
      setMovies(ms => ms.map(x => x._id === m._id ? { ...x, likes: res.likes } : x))
    } catch {}
  }

  const Actions = ({ m }) => (
    <div className="card-actions">
      <button className="icon-btn" title="Like" onClick={()=>toggleLike(m)}>❤️</button>
      <button className={`icon-btn ${follows.has(m._id)?'active':''}`} title={follows.has(m._id)?'Unfollow':'Follow'} onClick={()=>toggleFollow(m._id)}>⭐</button>
      <button className="icon-btn" title="React" onClick={()=>toggleReaction(m._id)}>{reactions[m._id] || '😀'}</button>
    </div>
  )

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
    const text = `${m.title} ${m.poster} ${m.genre}`
    const hit = normalized(text).includes(normalized(q))
    const g = normalized(genre)
    const genreMatch = !g || normalized(m.genre).includes(g) || normalized(m.title).includes(g) || normalized(m.poster).includes(g)
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
    <div className="home-layout">
      {error && <div className="alert alert-danger">{error}</div>}
      {/* Sidebar */}
      <aside className="sidebar d-none d-md-flex">
        <div className="brand">N</div>
        <nav className="side-nav">
          <div className="side-section">News Feed</div>
          <a className={`side-link ${activeTab==='Browse'?'active':''}`} onClick={()=>setActiveTab('Browse')}>Browse</a>
          <a className={`side-link ${activeTab==='Trending'?'active':''}`} onClick={()=>setActiveTab('Trending')}>Trending</a>
          <a className={`side-link ${activeTab==='Following'?'active':''}`} onClick={()=>setActiveTab('Following')}>Following</a>
          <a className={`side-link ${activeTab==='Your Videos'?'active':''}`} onClick={()=>setActiveTab('Your Videos')}>Your Videos</a>
          <a className={`side-link ${activeTab==='Playlist'?'active':''}`} onClick={()=>setActiveTab('Playlist')}>Playlist</a>
          <div className="side-section mt-3">Following</div>
          <div className="side-follow">
            {previewImages.map((n)=> (
              <img key={n} src={imgUrl(n)} alt="avatar" />
            ))}
          </div>
          <div className="side-spacer" />
          <div className="side-section mt-3">Categories</div>
          <div className="side-categories">
            {genreChips.map(g => (
              <button
                key={g}
                className={`chip clickable ${genre===g ? 'active' : ''}`}
                onClick={()=> setGenre(prev => prev===g ? '' : g)}
              >{g}</button>
            ))}
          </div>
        </nav>
      </aside>

      <main className="content">
        {/* Top bar */}
        <div className="topbar">
          <button className="btn btn-ghost btn-sm">↩</button>
          <div className="search-wrap">
            <input className="search-all" placeholder="Search everything" value={q} onChange={(e)=>setQ(e.target.value)} />
          </div>
          <div className="topbar-right">
            <button className="btn btn-ghost btn-sm" aria-label="Notifications">🔔</button>
            {user ? (
              <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
            ) : (
              <div className="avatar-sm">👤</div>
            )}
          </div>
        </div>

        {/* Hero hidden for logged-in users */}
        {!user && (
          <div className="hero-wrap mb-4">
            <div className="hero-split">
              <div
                className="hero-left"
                style={{ backgroundImage: `url(${imgUrl(featured?.poster || 'avengers.jpg')})` }}
              />
              <div className="hero-right-pane">
                <div className="hero-content hero-right">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="live-badge">Live</span>
                    <span className="score-pill">7.8</span>
                    <span className="score-pill muted">English</span>
                  </div>
                  <h1 className="display-5 fw-bold mb-2 text-shadow anim-fade anim-delay-2">{featured?.title || 'Featured Movie'}</h1>
                  <div className="d-flex flex-wrap gap-2 mb-2 anim-fade anim-delay-3">
                    {(((featured && featured.genre) ? featured.genre.split(',') : ['Adventure','Fantasy','Action'])).map(g=> (
                      <span key={g} className="chip">{g.trim()}</span>
                    ))}
                  </div>
                  <div className="text-muted mb-3 anim-fade anim-delay-4">
                    <span>English · {(featured && featured.showTime) || 'Today'} · {(featured && featured.duration) || '2h'}</span>
                  </div>
                  <p className="hero-desc mb-3 text-shadow anim-fade anim-delay-5">Enjoy the latest blockbuster on MovieFlex with immersive visuals and sound.</p>
                  <div className="d-flex gap-2 anim-fade anim-delay-7">
                    {featured ? (
                      <>
                        <button
                          className="btn btn-pill"
                          onClick={() => {
                            if (!user) return nav('/login')
                            nav(`/movies/${featured._id}`)
                          }}
                        >
                          Watch
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => {
                            if (!user) return nav('/login')
                            nav(`/movies/${featured._id}`)
                          }}
                        >
                          Book
                        </button>
                      </>
                    ) : null}
                  </div>

                  {/* Preview thumbnails removed as requested */}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h5 m-0">{activeTab === 'Trending' ? 'Top 10 Trending' : 'Browse'}</h2>
          {user?.role === 'admin' ? (
            <div className="mb-0">
              <Link className="btn btn-success" to="/admin/add">➕ Add Movie</Link>
            </div>
          ) : null}
        </div>

        {/* Browse toolbar */}
        {activeTab === 'Browse' && (
          <>
            <div className="row g-2 mb-3">
              <div className="col-12 col-lg-8">
                <input
                  className="form-control search-input"
                  placeholder="Search by movie, actor, or genre..."
                  value={q}
                  onChange={e=>setQ(e.target.value)}
                />
              </div>
              <div className="col-12 col-lg-4">
                <select className="form-select" value={sort} onChange={e=>setSort(e.target.value)}>
                  <option value="Popular">Most Popular</option>
                  <option value="Newest">Newest</option>
                  <option value="Alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>
            <div className="row g-3">
              {([...filtered].sort((a,b)=>{
                if (sort==='Alphabetical') return String(a.title).localeCompare(String(b.title))
                if (sort==='Popular') return Number((b.bookedSeats||[]).length) - Number((a.bookedSeats||[]).length)
                return 0 // Newest fallback to original order
              })).map(m => (
                <div className="col-12 col-md-6 col-lg-4" key={m._id}>
                  <div className="card h-100 movie-card">
                    <div className="movie-thumb">
                    <Actions m={m} />
                    <img src={imgUrl(m.poster)} alt={m.title} onError={(e)=>{e.target.src=''}} />
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
          </>
        )}

        {/* Trending section */}
        {activeTab === 'Trending' && (
          <>
            <div className="tags-wrap mb-2">
              {['#Marvel','#OscarNominees','#RetroPosters'].map(tag => (
                <span key={tag} className="hashtag">{tag}</span>
              ))}
            </div>
            <div className="row g-3">
              {([...movies]
                .sort((a,b)=> Number((b.bookedSeats||[]).length) - Number((a.bookedSeats||[]).length))
                .slice(0,10)
              ).map(m => (
                <div className="col-12 col-md-6 col-lg-4" key={m._id}>
                  <div className="card h-100 movie-card">
                    <div className="movie-thumb">
                      <Actions m={m} />
                      <img src={imgUrl(m.poster)} alt={m.title} onError={(e)=>{e.target.src=''}} />
                    </div>
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{m.title}</h5>
                      <p className="card-text mb-1">Likes: {(m.bookedSeats||[]).length}</p>
                      <div className="mt-auto d-flex gap-2">
                        {user ? (
                          <Link className="btn btn-primary" to={`/movies/${m._id}`}>View & Book</Link>
                        ) : (
                          <Link className="btn btn-outline-primary" to="/login">BOOK NOW</Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
