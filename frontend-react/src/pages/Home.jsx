import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { API_BASE } from '../api'
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
  const [notifOpen, setNotifOpen] = React.useState(false)
  const [profileOpen, setProfileOpen] = React.useState(false)
  const genreChips = ['Action','Horror','Classic','Marvel','Sci-Fi','Adventure']
  const [follows, setFollows] = React.useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('follows') || '[]')) } catch { return new Set() }
  })
  const [reactions, setReactions] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('reactions') || '{}') } catch { return {} }
  })
  const [liked, setLiked] = React.useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('liked') || '[]')) } catch { return new Set() }
  })
  const previewImages = React.useMemo(() => [
    'avengers.jpg',
    'inception.jpg',
    'interstellar.jpg',
    'spiderman.webp',
    'frozen.jpg',
    'frozen_ii.jpg',
    'batman.jpg'
  ], [])

  const [slide, setSlide] = React.useState(0)

  const IMG_BASE = React.useMemo(() => {
    try {
      const base = (API_BASE || '').replace(/\/?api\/?$/, '')
      return base || 'http://localhost:5000'
    } catch { return 'http://localhost:5000' }
  }, [])
  const imgUrl = (name) => `${IMG_BASE}/images/${encodeURI(name)}`

  // Card actions: follow, like, reactions
  const saveFollows = (next) => {
    setFollows(new Set(next))
    try { localStorage.setItem('follows', JSON.stringify(Array.from(next))) } catch {}
  }
  const saveLiked = (next) => {
    setLiked(new Set(next))
    try { localStorage.setItem('liked', JSON.stringify(Array.from(next))) } catch {}
  }
  const toggleFollow = async (id) => {
    try {
      if (!user) { nav('/login'); return }
      const res = await api(`/movies/${id}/follow`, { method: 'POST' })
      const arr = Array.isArray(res.following) ? res.following : []
      saveFollows(new Set(arr))
    } catch {}
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
      const next = new Set(liked)
      if (next.has(m._id)) next.delete(m._id); else next.add(m._id)
      saveLiked(next)
    } catch {}
  }

  const Actions = ({ m }) => (
    <div className="card-actions">
      <button className={`icon-btn ${liked.has(m._id)?'active':''}`} title="Like" onClick={()=>toggleLike(m)}>❤️</button>
      <button className={`icon-btn ${follows.has(m._id)?'active':''}`} title={follows.has(m._id)?'Unfollow':'Follow'} onClick={()=>toggleFollow(m._id)}>⭐</button>
      <button className="icon-btn" title="React" onClick={()=>toggleReaction(m._id)}>{reactions[m._id] || '😀'}</button>
    </div>
  )

  React.useEffect(() => {
    api('/movies').then(setMovies).catch(e => setError(e.message))
  }, [])

  // Load following for logged-in user
  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!user) return
      try {
        const r = await api('/me/following')
        if (!cancelled) saveFollows(new Set(Array.isArray(r.following) ? r.following : []))
      } catch {}
    }
    load()
    return () => { cancelled = true }
  }, [user])

  // When on Trending tab, refresh movies periodically to keep like counts fresh
  React.useEffect(() => {
    if (activeTab !== 'Trending') return
    let stop = false
    const load = async () => {
      try {
        const list = await api('/movies')
        if (!stop) setMovies(list)
      } catch {}
    }
    load()
    const t = setInterval(load, 10000)
    return () => { stop = true; clearInterval(t) }
  }, [activeTab])

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

  const slides = React.useMemo(() => {
    const map = new Map(movies.map(m => [String(m.poster||'').toLowerCase(), m]))
    const list = previewImages
      .filter(n => !!n)
      .map(n => {
        const key = String(n).toLowerCase()
        const m = map.get(key) || movies.find(x => String(x.poster||'').toLowerCase().includes(key.split('.')[0])) || null
        return m ? { poster: m.poster, title: m.title, genre: m.genre, showTime: m.showTime, duration: m.duration, id: m._id }
                 : { poster: n, title: n.split('.')[0].replaceAll('_',' ').replaceAll('-',' '), genre: 'Adventure, Action', showTime: 'Today', duration: '2h', id: null }
      })
    return list.length ? list : (featured ? [{ poster: featured.poster, title: featured.title, genre: featured.genre, showTime: featured.showTime, duration: featured.duration, id: featured._id }] : [])
  }, [movies, previewImages, featured])

  const prevSlide = React.useCallback(() => {
    const len = Math.max(1, slides.length)
    setSlide(s => (s - 1 + len) % len)
  }, [slides.length])
  const nextSlide = React.useCallback(() => {
    const len = Math.max(1, slides.length)
    setSlide(s => (s + 1) % len)
  }, [slides.length])

  React.useEffect(() => {
    if (!slides.length) return
    const t = setInterval(nextSlide, 5000)
    return () => clearInterval(t)
  }, [slides.length, nextSlide])

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
          <a className={`side-link ${activeTab==='Following'?'active':''}`} onClick={()=>setActiveTab('Following')}>
            Following {follows.size ? `(${follows.size})` : ''}
          </a>
          <a className={`side-link ${activeTab==='Your Videos'?'active':''}`} onClick={()=>setActiveTab('Your Videos')}>Your Videos</a>
          <a className={`side-link ${activeTab==='Playlist'?'active':''}`} onClick={()=>setActiveTab('Playlist')}>Playlist</a>
          <div className="side-section mt-3">Following</div>
          <div className="side-follow">
            {(movies.filter(m => follows.has(m._id)).slice(0,10)).map(m => (
              <img key={m._id} src={imgUrl(m.poster)} alt="avatar" />
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
            <button
              className={`btn btn-ghost btn-sm icon-circle ${notifOpen ? 'active' : ''}`}
              aria-label="Notifications"
              onClick={()=>{ setNotifOpen(v=>!v); setProfileOpen(false) }}
            >🔔</button>
            <div className="profile-wrap">
              <button
                className={`btn btn-ghost btn-sm icon-circle ${profileOpen ? 'active' : ''}`}
                aria-label="Profile"
                onClick={()=>{ setProfileOpen(v=>!v); setNotifOpen(false) }}
              >{user ? (user.name?.[0] || '👤') : '👤'}</button>
              {profileOpen && (
                <div className="dropdown-panel">
                  {user ? (
                    <>
                      <div className="dropdown-item text-muted">Signed in as <strong>{user.name}</strong></div>
                      <button className="dropdown-item" onClick={logout}>Logout</button>
                    </>
                  ) : (
                    <>
                      <Link className="dropdown-item" to="/login">Login</Link>
                      <Link className="dropdown-item" to="/register">Register</Link>
                    </>
                  )}
                </div>
              )}
            </div>
            {notifOpen && (
              <div className="dropdown-panel">
                <div className="dropdown-item text-muted">No new notifications</div>
              </div>
            )}
          </div>
        </div>

        {/* Hero section (shown for all users) */}
          {!user && (
          <div className="hero-wrap mb-4">
            <div className="hero-split">
              <div className="hero-left">
                <img
                  key={(slides[slide]?.poster) || 'avengers.jpg'}
                  className="slide-img"
                  src={imgUrl((slides[slide]?.poster) || 'avengers.jpg')}
                  alt="slide"
                  onError={(e)=>{
                    const cur = (slides[slide]?.poster) || 'avengers.jpg'
                    if (!e.target.dataset.fallback){
                      e.target.dataset.fallback = '1'
                      e.target.src = `http://localhost:5000/images/${encodeURI(cur)}`
                    }
                  }}
                />
                {slides.length > 1 && (
                  <>
                    <button className="slide-nav prev" aria-label="Previous" onClick={prevSlide}>‹</button>
                    <button className="slide-nav next" aria-label="Next" onClick={nextSlide}>›</button>
                  </>
                )}
              </div>
              <div className="hero-right-pane">
                <div className="hero-content hero-right">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="live-badge">Live</span>
                    <span className="score-pill">7.8</span>
                    <span className="score-pill muted">English</span>
                  </div>
                  <h1 className="display-5 fw-bold mb-2 text-shadow anim-fade anim-delay-2">{(slides[slide]?.title) || featured?.title || 'Featured Movie'}</h1>
                  <div className="d-flex flex-wrap gap-2 mb-2 anim-fade anim-delay-3">
                    {(((slides[slide] && slides[slide].genre) ? String(slides[slide].genre).split(',') : ((featured && featured.genre) ? featured.genre.split(',') : ['Adventure','Fantasy','Action']))).map(g=> (
                      <span key={g} className="chip">{g.trim()}</span>
                    ))}
                  </div>
                  <div className="text-muted mb-3 anim-fade anim-delay-4">
                    <span>English · {(slides[slide] && slides[slide].showTime) || (featured && featured.showTime) || 'Today'} · {(slides[slide] && slides[slide].duration) || (featured && featured.duration) || '2h'}</span>
                  </div>
                  <p className="hero-desc mb-3 text-shadow anim-fade anim-delay-5">Enjoy the latest blockbuster on MovieFlex with immersive visuals and sound.</p>
                  <div className="d-flex gap-2 anim-fade anim-delay-7">
                    {(slides[slide] && slides[slide].id) || featured ? (
                      <>
                        <button
                          className="btn btn-pill"
                          onClick={() => {
                            if (!user) return nav('/login')
                            const id = slides[slide]?.id || featured?._id
                            if (id) nav(`/movies/${id}`)
                          }}
                        >
                          Watch
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => {
                            if (!user) return nav('/login')
                            const id = slides[slide]?.id || featured?._id
                            if (id) nav(`/movies/${id}`)
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
                    {(user && (liked.has(m._id) || follows.has(m._id))) && (
                      <div className="user-tag">{user.name}</div>
                    )}
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

        {activeTab === 'Following' && (
          <>
            <div className="row g-3">
              {(movies.filter(m => follows.has(m._id))).map(m => (
                <div className="col-12 col-md-6 col-lg-4" key={m._id}>
                  <div className="card h-100 movie-card">
                    <div className="movie-thumb">
                      <Actions m={m} />
                      {(user && (liked.has(m._id) || follows.has(m._id))) && (
                        <div className="user-tag">{user.name}</div>
                      )}
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
                .sort((a,b)=> Number(b.likes || 0) - Number(a.likes || 0))
                .slice(0,10)
              ).map(m => (
                <div className="col-12 col-md-6 col-lg-4" key={m._id}>
                  <div className="card h-100 movie-card">
                    <div className="movie-thumb">
                      <Actions m={m} />
                      {(user && (liked.has(m._id) || follows.has(m._id))) && (
                        <div className="user-tag">{user.name}</div>
                      )}
                      <img src={imgUrl(m.poster)} alt={m.title} onError={(e)=>{e.target.src=''}} />
                    </div>
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{m.title}</h5>
                      <p className="card-text mb-1">Likes: {Number(m.likes || 0)}</p>
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
