import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/auth/me').then(({ user }) => {
      setUser(user)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const res = await api('/auth/login', { method: 'POST', body: { email, password } })
    setUser(res.user)
    return res
  }

  const register = async (payload) => {
    return api('/auth/register', { method: 'POST', body: payload })
  }

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' })
    setUser(null)
  }

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() { return useContext(Ctx) }
