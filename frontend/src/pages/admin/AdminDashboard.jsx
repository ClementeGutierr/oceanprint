import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE, authCfg } from './AdminApp'

const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }
const TH = { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.35)', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }
const TD = { padding: '12px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(255,255,255,0.04)' }

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatCard({ label, value, sub, color = '#00b4d8', icon }) {
  return (
    <div style={{ ...CARD, textAlign: 'center' }}>
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
      <p style={{ color, fontSize: '28px', fontWeight: 900, margin: '0 0 4px', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ color, fontSize: '13px', fontWeight: 600, margin: '0 0 6px', opacity: 0.7 }}>{sub}</p>}
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{label}</p>
    </div>
  )
}

export default function AdminDashboard({ token }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API_BASE}/admin/dashboard`, authCfg(token))
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>Cargando...</div>
  if (!data) return null

  const { totals, recent_users, recent_trips } = data
  const pct = totals.compensation_pct ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
        <StatCard icon="👥" label="Usuarios" value={totals.users_count} color="#48cae4" />
        <StatCard icon="✈️" label="Viajes" value={totals.trips_count} color="#a78bfa" />
        <StatCard icon="🌡️" label="CO₂ Emitido" value={`${(totals.total_co2 || 0).toLocaleString()}`} sub="kg" color="#f87171" />
        <StatCard icon="🌱" label="CO₂ Compensado" value={`${(totals.total_compensated || 0).toLocaleString()}`} sub="kg" color="#4ade80" />
        <StatCard icon="📊" label="Compensación" value={`${pct}%`} color={pct >= 75 ? '#4ade80' : pct >= 40 ? '#fbbf24' : '#f87171'} />
      </div>

      {/* Progress bar */}
      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600, margin: 0 }}>Compensación global del grupo</p>
          <p style={{ fontSize: '20px', fontWeight: 900, margin: 0, color: pct >= 75 ? '#4ade80' : pct >= 40 ? '#fbbf24' : '#f87171' }}>{pct}%</p>
        </div>
        <div style={{ height: '10px', borderRadius: '999px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '999px', width: `${Math.min(100, pct)}%`,
            background: pct >= 75 ? 'linear-gradient(90deg,#4ade80,#22d3ee)' : pct >= 40 ? 'linear-gradient(90deg,#fbbf24,#4ade80)' : 'linear-gradient(90deg,#f87171,#fbbf24)',
            transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Emitido: {(totals.total_co2 || 0).toLocaleString()} kg</span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Compensado: {(totals.total_compensated || 0).toLocaleString()} kg</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Recent users */}
        <div style={CARD}>
          <h3 style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '14px' }}>👤 Últimos usuarios registrados</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={TH}>Nombre</th>
                  <th style={TH}>Nivel</th>
                  <th style={TH}>Pts</th>
                  <th style={TH}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recent_users.map(u => (
                  <tr key={u.id}>
                    <td style={TD}>
                      <p style={{ margin: 0, fontWeight: 600 }}>{u.name}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{u.email}</p>
                    </td>
                    <td style={TD}><span style={{ fontSize: '12px' }}>{u.level}</span></td>
                    <td style={{ ...TD, color: '#48cae4', fontWeight: 700 }}>{u.points}</td>
                    <td style={{ ...TD, color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{fmtDate(u.created_at)}</td>
                  </tr>
                ))}
                {!recent_users.length && <tr><td colSpan={4} style={{ ...TD, textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>Sin usuarios</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent trips */}
        <div style={CARD}>
          <h3 style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '14px' }}>✈️ Últimos viajes calculados</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={TH}>Usuario</th>
                  <th style={TH}>Ruta</th>
                  <th style={TH}>CO₂</th>
                  <th style={TH}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recent_trips.map(t => (
                  <tr key={t.id}>
                    <td style={{ ...TD, fontWeight: 600 }}>{t.user_name}</td>
                    <td style={TD}><span style={{ fontSize: '12px' }}>{t.origin} → {t.destination}</span></td>
                    <td style={{ ...TD, color: '#f87171', fontWeight: 700 }}>{t.co2_total} kg</td>
                    <td style={{ ...TD, color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{fmtDate(t.created_at)}</td>
                  </tr>
                ))}
                {!recent_trips.length && <tr><td colSpan={4} style={{ ...TD, textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>Sin viajes</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
