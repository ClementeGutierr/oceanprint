import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('op_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [token])

  async function fetchProfile() {
    try {
      const res = await axios.get(`${API}/profile`)
      setUser(res.data)
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }

  async function login(email, password) {
    const res = await axios.post(`${API}/auth/login`, { email, password })
    const { token: t, user: u } = res.data
    localStorage.setItem('op_token', t)
    axios.defaults.headers.common['Authorization'] = `Bearer ${t}`
    setToken(t)
    setUser(u)
    return u
  }

  async function register(name, email, password) {
    const res = await axios.post(`${API}/auth/register`, { name, email, password })
    const { token: t, user: u } = res.data
    localStorage.setItem('op_token', t)
    axios.defaults.headers.common['Authorization'] = `Bearer ${t}`
    setToken(t)
    setUser(u)
    return u
  }

  function logout() {
    localStorage.removeItem('op_token')
    delete axios.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }

  function refreshUser() {
    fetchProfile()
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser, API }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
