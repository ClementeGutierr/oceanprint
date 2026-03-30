import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE, authCfg } from './AdminApp'

const LEVELS = ['Plancton', 'Caballito de Mar', 'Tortuga Marina', 'Mantarraya', 'Ballena Azul']
const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }
const TH = { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.35)', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }
const TD = { padding: '12px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(255,255,255,0.04)' }
const INPUT = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '9px 12px', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

function levelColor(level) {
  if (level === 'Ballena Azul')     return '#00b4d8'
  if (level === 'Mantarraya')       return '#a78bfa'
  if (level === 'Tortuga Marina')   return '#4ade80'
  if (level === 'Caballito de Mar') return '#fbbf24'
  return 'rgba(255,255,255,0.4)'
}

function CompPct({ pct }) {
  const c = pct >= 75 ? '#4ade80' : pct >= 40 ? '#fbbf24' : '#f87171'
  return <span style={{ color: c, fontWeight: 700 }}>{pct}%</span>
}

function UserModal({ user, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '20px' }}>
      <div style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '680px', marginTop: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ color: 'white', fontWeight: 800, fontSize: '20px', margin: '0 0 4px' }}>{user.name}</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>{user.email}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '24px', lineHeight: 1 }}>×</button>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Nivel', value: user.level, color: levelColor(user.level) },
            { label: 'Puntos', value: user.points, color: '#48cae4' },
            { label: 'Viajes', value: user.trips_count, color: '#a78bfa' },
            { label: 'CO₂ Emitido', value: `${user.total_co2 || 0} kg`, color: '#f87171' },
            { label: 'CO₂ Comp.', value: `${user.compensated_co2 || 0} kg`, color: '#4ade80' },
            { label: 'Comp. %', value: `${user.trips_count > 0 && user.total_co2 > 0 ? Math.round((user.compensated_co2/user.total_co2)*100) : 0}%`, color: '#fbbf24' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <p style={{ color: s.color, fontSize: '18px', fontWeight: 800, margin: '0 0 4px' }}>{s.value}</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {user.origin_city && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '4px' }}>📍 {user.origin_city}</p>}
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginBottom: '20px' }}>Registrado: {fmtDate(user.created_at)}</p>

        {/* Expeditions */}
        {user.expeditions?.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>🏆 Expediciones</h4>
            {user.expeditions.map(e => (
              <div key={e.id} style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: '10px', padding: '8px 12px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#c4b5fd', fontSize: '13px', fontWeight: 600 }}>{e.name}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{e.trip_count} viaje{e.trip_count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        )}

        {/* Trips */}
        {user.trips?.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>✈️ Últimos viajes</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={TH}>Ruta</th>
                  <th style={TH}>CO₂ total</th>
                  <th style={TH}>Fecha</th>
                </tr></thead>
                <tbody>
                  {user.trips.slice(0, 5).map(t => (
                    <tr key={t.id}>
                      <td style={TD}>{t.origin} → {t.destination}</td>
                      <td style={{ ...TD, color: '#f87171', fontWeight: 700 }}>{t.co2_total} kg</td>
                      <td style={{ ...TD, color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{fmtDate(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Compensations */}
        {user.compensations?.length > 0 && (
          <div>
            <h4 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>🌱 Compensaciones</h4>
            {user.compensations.map(c => (
              <div key={c.id} style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.12)', borderRadius: '10px', padding: '8px 12px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: 600 }}>{c.organization}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginLeft: '8px' }}>{c.co2_compensated} kg CO₂</span>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>{fmtDate(c.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminUsers({ token }) {
  const [users, setUsers]           = useState([])
  const [expeditions, setExpeditions] = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [level, setLevel]           = useState('')
  const [expFilter, setExpFilter]   = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    axios.get(`${API_BASE}/admin/expeditions`, authCfg(token)).then(r => setExpeditions(r.data)).catch(() => {})
  }, [token])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (level) params.set('level', level)
    if (expFilter) params.set('expedition_id', expFilter)
    axios.get(`${API_BASE}/admin/users?${params}`, authCfg(token))
      .then(r => setUsers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token, search, level, expFilter])

  async function openDetail(user) {
    setLoadingDetail(true)
    try {
      const r = await axios.get(`${API_BASE}/admin/users/${user.id}`, authCfg(token))
      setSelectedUser(r.data)
    } catch (e) { console.error(e) } finally { setLoadingDetail(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {selectedUser && <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} />}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input style={{ ...INPUT, flex: '1', minWidth: '180px', width: 'auto' }} placeholder="🔍 Buscar por nombre o email..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...INPUT, width: 'auto', minWidth: '150px', appearance: 'none', cursor: 'pointer' }} value={level} onChange={e => setLevel(e.target.value)}>
          <option value="">Todos los niveles</option>
          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select style={{ ...INPUT, width: 'auto', minWidth: '180px', appearance: 'none', cursor: 'pointer' }} value={expFilter} onChange={e => setExpFilter(e.target.value)}>
          <option value="">Todas las expediciones</option>
          {expeditions.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ ...CARD, padding: '0' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: 'white', fontWeight: 700, fontSize: '15px', margin: 0 }}>👥 Usuarios ({loading ? '…' : users.length})</h3>
          {loadingDetail && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Cargando perfil...</span>}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr>
                <th style={TH}>Usuario</th>
                <th style={TH}>Nivel</th>
                <th style={TH}>Puntos</th>
                <th style={TH}>Viajes</th>
                <th style={TH}>CO₂ Emit.</th>
                <th style={TH}>CO₂ Comp.</th>
                <th style={TH}>Comp. %</th>
                <th style={TH}>Registro</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ ...TD, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>Cargando...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} style={{ ...TD, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)' }}>Sin usuarios</td></tr>
              ) : users.map(u => (
                <tr key={u.id} onClick={() => openDetail(u)}
                  style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={TD}>
                    <p style={{ margin: 0, fontWeight: 600 }}>{u.name}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{u.email}</p>
                  </td>
                  <td style={{ ...TD }}>
                    <span style={{ color: levelColor(u.level), fontWeight: 600, fontSize: '12px' }}>{u.level}</span>
                  </td>
                  <td style={{ ...TD, color: '#48cae4', fontWeight: 700 }}>{u.points}</td>
                  <td style={{ ...TD, color: '#a78bfa' }}>{u.trips_count}</td>
                  <td style={{ ...TD, color: '#f87171' }}>{u.total_co2 || 0} kg</td>
                  <td style={{ ...TD, color: '#4ade80' }}>{u.compensated_co2 || 0} kg</td>
                  <td style={TD}><CompPct pct={u.compensation_pct ?? 0} /></td>
                  <td style={{ ...TD, color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{fmtDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
