import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function Register() {
  const nav = useNavigate()
  const { register, login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault(); setError(''); setMsg('')
    try {
      await register({ name, email, password, isAdmin, adminCode: isAdmin ? adminCode : undefined })
      await login(email, password)
      nav('/')
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="auth-wrap d-flex align-items-center justify-content-center">
      <div className="auth-card card-glass">
        <div className="auth-header">
          <h2 className="m-0">Create account</h2>
          <p className="auth-subtitle m-0">Join MovieFlex</p>
        </div>
        {msg && <div className="alert alert-success">{msg}</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={onSubmit} className="auth-form">
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input className="form-control" value={name} onChange={e=>setName(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <div className="form-check mb-2">
            <input className="form-check-input" type="checkbox" id="isAdmin" checked={isAdmin} onChange={e=>setIsAdmin(e.target.checked)} />
            <label className="form-check-label" htmlFor="isAdmin">Register as admin</label>
          </div>
          {isAdmin && (
            <div className="mb-3">
              <label className="form-label">Admin Code</label>
              <input className="form-control" value={adminCode} onChange={e=>setAdminCode(e.target.value)} />
            </div>
          )}
          <button className="btn btn-primary w-100" type="submit">Register</button>
        </form>
      </div>
    </div>
  )
}
