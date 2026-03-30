import { useState } from 'react'
import axios from 'axios'
import AdminDashboard from './AdminDashboard'
import AdminExpeditions from './AdminExpeditions'
import AdminUsers from './AdminUsers'
import AdminEmissions from './AdminEmissions'
import AdminContent from './AdminContent'

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export function authCfg(token) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

const NAV = [
  { id: 'dashboard',   label: 'Dashboard',   icon: '📊' },
  { id: 'expeditions', label: 'Expediciones', icon: '🏆' },
  { id: 'users',       label: 'Usuarios',     icon: '👥' },
  { id: 'emissions',   label: 'Emisiones',    icon: '🌿' },
  { id: 'content',     label: 'Contenido',    icon: '✏️' },
]

const BG = '#080e1a'
const SIDEBAR_BG = '#0c1829'
const BORDER = 'rgba(255,255,255,0.07)'
const TEXT_DIM = 'rgba(255,255,255,0.45)'

export default function AdminApp() {
  const [token, setToken]       = useState(() => localStorage.getItem('admin_token'))
  const [section, setSection]   = useState('dashboard')
  const [form, setForm]         = useState({ email: 'admin@divinglife.co', password: '' })
  const [loginErr, setLoginErr] = useState('')
  const [loginLoad, setLoginLoad] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 900)

  async function handleLogin(e) {
    e.preventDefault()
    setLoginLoad(true)
    setLoginErr('')
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, form)
      if (res.data.user?.role !== 'admin') {
        setLoginErr('Esta cuenta no tiene permisos de administrador')
        return
      }
      localStorage.setItem('admin_token', res.data.token)
      setToken(res.data.token)
    } catch (err) {
      setLoginErr(err.response?.data?.error || 'Error de autenticación')
    } finally {
      setLoginLoad(false)
    }
  }

  function logout() {
    localStorage.removeItem('admin_token')
    setToken(null)
  }

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${BG} 0%, #0c1829 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui,sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌊</div>
            <h1 style={{ color: 'white', fontSize: '26px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>Diving Life</h1>
            <p style={{ color: '#00b4d8', fontSize: '13px', margin: '4px 0 0', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Panel de Administración</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: '24px', padding: '32px' }}>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', color: TEXT_DIM, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '12px 16px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', color: TEXT_DIM, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Contraseña</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '12px 16px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              {loginErr && <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>{loginErr}</div>}
              <button type="submit" disabled={loginLoad}
                style={{ width: '100%', background: 'linear-gradient(135deg,#00b4d8,#48cae4)', border: 'none', borderRadius: '12px', padding: '14px', color: '#040d18', fontWeight: 800, fontSize: '15px', cursor: loginLoad ? 'not-allowed' : 'pointer', opacity: loginLoad ? 0.7 : 1 }}>
                {loginLoad ? 'Verificando...' : 'Ingresar al panel'}
              </button>
            </form>
          </div>
          <p style={{ textAlign: 'center', marginTop: '20px' }}>
            <a href="/" style={{ color: TEXT_DIM, fontSize: '12px', textDecoration: 'none' }}>← Volver a la app</a>
          </p>
        </div>
      </div>
    )
  }

  const sectionProps = { token }
  const currentNav = NAV.find(n => n.id === section)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: 'system-ui,sans-serif', color: 'white' }}>
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && window.innerWidth < 900 && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} />
      )}

      {/* Sidebar */}
      <aside style={{
        width: '220px', flexShrink: 0,
        background: SIDEBAR_BG, borderRight: `1px solid ${BORDER}`,
        display: 'flex', flexDirection: 'column',
        position: window.innerWidth < 900 ? 'fixed' : 'sticky',
        top: 0, left: sidebarOpen ? 0 : '-220px',
        height: '100vh',
        zIndex: 50, transition: 'left 0.22s ease',
      }}>
        <div style={{ padding: '20px 16px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '26px' }}>🌊</span>
            <div>
              <p style={{ color: 'white', fontWeight: 800, fontSize: '14px', margin: 0 }}>Diving Life</p>
              <p style={{ color: '#00b4d8', fontSize: '10px', margin: 0, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Admin Panel</p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV.map(item => {
            const active = section === item.id
            return (
              <button key={item.id} onClick={() => { setSection(item.id); if (window.innerWidth < 900) setSidebarOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                  borderRadius: '12px', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                  background: active ? 'rgba(0,180,216,0.15)' : 'transparent',
                  color: active ? '#48cae4' : TEXT_DIM,
                  fontWeight: active ? 700 : 500, fontSize: '14px',
                  borderLeft: active ? '3px solid #00b4d8' : '3px solid transparent',
                }}>
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </nav>

        <div style={{ padding: '12px 10px', borderTop: `1px solid ${BORDER}` }}>
          <button onClick={logout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '10px', border: 'none', background: 'rgba(248,113,113,0.1)', color: '#f87171', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            🚪 Cerrar sesión
          </button>
          <a href="/" style={{ display: 'block', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '11px', marginTop: '10px', textDecoration: 'none' }}>← Ir a la app</a>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: window.innerWidth >= 900 ? '220px' : 0 }}>
        <header style={{ background: SIDEBAR_BG, borderBottom: `1px solid ${BORDER}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '14px', position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => setSidebarOpen(o => !o)}
            style={{ background: 'none', border: 'none', color: TEXT_DIM, cursor: 'pointer', fontSize: '20px', padding: '2px 4px', lineHeight: 1 }}>
            ☰
          </button>
          <h2 style={{ color: 'white', margin: 0, fontSize: '17px', fontWeight: 700 }}>
            {currentNav?.icon} {currentNav?.label}
          </h2>
        </header>

        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {section === 'dashboard'   && <AdminDashboard   {...sectionProps} />}
          {section === 'expeditions' && <AdminExpeditions {...sectionProps} />}
          {section === 'users'       && <AdminUsers       {...sectionProps} />}
          {section === 'emissions'   && <AdminEmissions   {...sectionProps} />}
          {section === 'content'     && <AdminContent     {...sectionProps} />}
        </main>
      </div>
    </div>
  )
}
