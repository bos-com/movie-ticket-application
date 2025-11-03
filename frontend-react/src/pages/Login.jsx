import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      nav('/')
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="auth-wrap d-flex align-items-center justify-content-center">
      <div className="auth-card card-glass">
        <div className="auth-header">
          <h2 className="m-0">Login</h2>
          <p className="auth-subtitle m-0">Welcome back to MovieFlex</p>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={onSubmit} className="auth-form">
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary w-100" type="submit">Login</button>
        </form>
      </div>
    </div>
  )
}
