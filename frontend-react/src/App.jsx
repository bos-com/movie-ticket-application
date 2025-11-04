import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import MovieDetail from './pages/MovieDetail'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import AddEditMovie from './pages/AddEditMovie'
import { useAuth } from './state/AuthContext'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function NavBar() {
  const { user, logout } = useAuth()
  const [light, setLight] = React.useState(() => {
    try { return localStorage.getItem('theme') === 'light' } catch { return false }
  })
  React.useEffect(() => {
    if (light) {
      document.body.classList.add('theme-light')
      try { localStorage.setItem('theme','light') } catch {}
    } else {
      document.body.classList.remove('theme-light')
      try { localStorage.setItem('theme','dark') } catch {}
    }
  }, [light])
  const navClass = `navbar navbar-expand ${light ? 'navbar-light' : 'navbar-dark'} app-navbar mb-3`
  const themeBtnClass = `btn btn-sm ${light ? 'btn-outline-dark' : 'btn-outline-light'} me-2`
  const logoutBtnClass = `btn btn-sm ${light ? 'btn-outline-dark' : 'btn-outline-light'} ms-2`
  return (
    <nav className={navClass}>
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">MovieFlex Java</Link>
        <div className="navbar-nav ms-auto">
          <button aria-label="Toggle theme" className={themeBtnClass} onClick={()=>setLight(v=>!v)}>{light ? '☀️' : '🌙'}</button>
          {!user && (
            <>
              <Link className="nav-link" to="/login">Login</Link>
              <Link className="nav-link" to="/register">Register</Link>
            </>
          )}
          {user && (
            <>
              {user.role === 'admin' && (
                <Link className="nav-link" to="/admin">Admin</Link>
              )}
              <Link className="nav-link" to="/dashboard">My Tickets</Link>
              <button className={logoutBtnClass} onClick={logout}>Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <div className="container">
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/movies/:id" element={<MovieDetail />} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/admin" element={<AdminOnly><Admin /></AdminOnly>} />
        <Route path="/admin/add" element={<AdminOnly><AddEditMovie mode="add" /></AdminOnly>} />
        <Route path="/admin/edit/:id" element={<AdminOnly><AddEditMovie mode="edit" /></AdminOnly>} />
      </Routes>
    </div>
  )
}
