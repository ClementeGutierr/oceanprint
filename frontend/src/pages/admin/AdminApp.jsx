import { useState } from 'react'
import axios from 'axios'
import {
  OceanWaveIcon, TrophyIcon, UsersIcon, LeafIcon, PencilIcon, ThermometerIcon, RefreshIcon,
} from '../../components/OceanIcons'
import AdminDashboard   from './AdminDashboard'
import AdminExpeditions from './AdminExpeditions'
import AdminUsers       from './AdminUsers'
import AdminEmissions   from './AdminEmissions'
import AdminContent     from './AdminContent'
import AdminImport      from './AdminImport'

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
export function authCfg(token) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

const NAV = [
  { id: 'dashboard',   label: 'Dashboard',      Icon: OceanWaveIcon  },
  { id: 'expeditions', label: 'Expediciones',   Icon: TrophyIcon     },
  { id: 'users',       label: 'Usuarios',       Icon: UsersIcon      },
  { id: 'emissions',   label: 'Emisiones',      Icon: LeafIcon       },
  { id: 'content',     label: 'Contenido',      Icon: PencilIcon     },
  { id: 'import',      label: 'Importar Datos', Icon: RefreshIcon    },
]

export default function AdminApp() {
  const [token,     setToken]     = useState(() => localStorage.getItem('admin_token'))
  const [section,   setSection]   = useState('dashboard')
  const [form,      setForm]      = useState({ email: 'admin@divinglife.co', password: '' })
  const [loginErr,  setLoginErr]  = useState('')
  const [loginLoad, setLoginLoad] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoginLoad(true); setLoginErr('')
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, form)
      if (res.data.user?.role !== 'admin') {
        setLoginErr('Esta cuenta no tiene permisos de administrador'); return
      }
      localStorage.setItem('admin_token', res.data.token)
      setToken(res.data.token)
    } catch (err) {
      setLoginErr(err.response?.data?.error || 'Error de autenticación')
    } finally { setLoginLoad(false) }
  }

  function logout() {
    localStorage.removeItem('admin_token')
    setToken(null)
  }

  /* ── LOGIN ── */
  if (!token) {
    return (
      <div className="min-h-screen ocean-bg flex items-center justify-center p-5">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3 text-ocean-cyan">
              <OceanWaveIcon size={44} />
            </div>
            <h1 className="text-3xl font-black text-white">Diving Life</h1>
            <p className="text-ocean-cyan text-xs font-bold uppercase tracking-widest mt-1">Panel de Administración</p>
          </div>

          <div className="rounded-3xl p-8"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(20px)' }}>
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-ocean-foam/50 text-xs font-bold uppercase tracking-wider mb-2">Email</label>
                <input type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="input-field w-full" required />
              </div>
              <div>
                <label className="block text-ocean-foam/50 text-xs font-bold uppercase tracking-wider mb-2">Contraseña</label>
                <input type="password" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-field w-full" required />
              </div>
              {loginErr && (
                <div className="rounded-xl px-4 py-3 text-sm"
                  style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>
                  {loginErr}
                </div>
              )}
              <button type="submit" disabled={loginLoad} className="btn-primary w-full text-base">
                {loginLoad ? 'Verificando...' : 'Ingresar al panel'}
              </button>
            </form>
          </div>

          <p className="text-center mt-5">
            <a href="/" className="text-ocean-foam/30 text-xs hover:text-ocean-foam/50 transition-colors">
              ← Volver a la app
            </a>
          </p>
        </div>
      </div>
    )
  }

  const currentNav = NAV.find(n => n.id === section)

  /* ── LAYOUT ── */
  return (
    <div className="flex min-h-screen ocean-bg">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 h-screen z-50 md:z-auto
        flex-shrink-0 w-56 flex flex-col
        transition-transform duration-200 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `} style={{
        background: 'rgba(4,13,24,0.92)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}>

        {/* Brand */}
        <div className="px-5 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <span className="text-ocean-cyan"><OceanWaveIcon size={22} /></span>
            <div>
              <p className="text-white font-black text-sm leading-none">OceanPrint</p>
              <p className="text-ocean-cyan/70 text-[10px] font-bold uppercase tracking-widest mt-0.5">Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {NAV.map(({ id, label, Icon }) => {
            const active = section === id
            return (
              <button key={id} onClick={() => { setSection(id); setSidebarOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-150 text-left"
                style={active
                  ? { background: 'rgba(0,180,216,0.15)', color: '#48cae4', borderLeft: '3px solid #00b4d8' }
                  : { color: 'rgba(255,255,255,0.4)', borderLeft: '3px solid transparent' }
                }>
                <Icon size={18} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesión
          </button>
          <a href="/"
            className="block text-center text-[11px] font-medium transition-colors"
            style={{ color: 'rgba(255,255,255,0.2)' }}>
            ← Ir a la app
          </a>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-4 px-6 py-4"
          style={{ background: 'rgba(4,13,24,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setSidebarOpen(o => !o)}
            className="md:hidden p-1.5 rounded-xl text-ocean-foam/50 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="text-ocean-cyan/60"><currentNav.Icon size={18} /></span>
          <h2 className="text-white font-bold text-lg">{currentNav?.label}</h2>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-7 lg:px-10">
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {section === 'dashboard'   && <AdminDashboard   token={token} />}
            {section === 'expeditions' && <AdminExpeditions token={token} />}
            {section === 'users'       && <AdminUsers       token={token} />}
            {section === 'emissions'   && <AdminEmissions   token={token} />}
            {section === 'content'     && <AdminContent     token={token} />}
            {section === 'import'      && <AdminImport      token={token} />}
          </div>
        </main>
      </div>
    </div>
  )
}
