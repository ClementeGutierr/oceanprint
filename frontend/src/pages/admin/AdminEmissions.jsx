import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE, authCfg } from './AdminApp'
import { ThermometerIcon, LeafIcon, TargetIcon, PlaneIcon, ShipIcon, BusIcon, TrophyIcon, MapPinIcon } from '../../components/OceanIcons'

const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }
const TH = { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.35)', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }
const TD = { padding: '12px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(255,255,255,0.04)' }

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Bar({ pct, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '6px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden', minWidth: '60px' }}>
        <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: '99px' }} />
      </div>
      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', minWidth: '36px', textAlign: 'right' }}>{Math.round(pct)}%</span>
    </div>
  )
}

const OVERVIEW_STATS = (overview, total_compensated, compPct, total) => [
  { Icon: ThermometerIcon, label: 'Total emitido',     value: `${total.toLocaleString()} kg`,                    color: '#f87171' },
  { Icon: LeafIcon,        label: 'Total compensado',  value: `${(total_compensated || 0).toLocaleString()} kg`, color: '#4ade80' },
  { Icon: TargetIcon,      label: 'Compensación global', value: `${compPct}%`,                                   color: compPct >= 75 ? '#4ade80' : compPct >= 40 ? '#fbbf24' : '#f87171' },
  { Icon: PlaneIcon,       label: 'CO₂ vuelos',        value: `${(overview.co2_flight || 0).toLocaleString()} kg`, color: '#48cae4' },
  { Icon: ShipIcon,        label: 'CO₂ marino',        value: `${(overview.co2_sea || 0).toLocaleString()} kg`,  color: '#a78bfa' },
  { Icon: BusIcon,         label: 'CO₂ terrestre',     value: `${(overview.co2_land || 0).toLocaleString()} kg`, color: '#fbbf24' },
]

export default function AdminEmissions({ token }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API_BASE}/admin/emissions`, authCfg(token))
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>Cargando...</div>
  if (!data) return null

  const { overview, total_compensated, by_destination, by_expedition, compensations } = data
  const total = overview.co2_total || 0
  const compPct = total > 0 ? Math.round((total_compensated / total) * 100) : 0

  const maxDest = Math.max(...by_destination.map(d => d.total_co2), 1)
  const maxExp = Math.max(...by_expedition.map(e => e.total_co2), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Overview cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '14px' }}>
        {OVERVIEW_STATS(overview, total_compensated, compPct, total).map(({ Icon, label, value, color }) => (
          <div key={label} style={{ ...CARD, textAlign: 'center', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px', color }}>
              <Icon size={24} />
            </div>
            <p style={{ color, fontSize: '20px', fontWeight: 900, margin: '0 0 4px', lineHeight: 1 }}>{value}</p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600, margin: 0 }}>Compensación global</p>
          <p style={{ fontSize: '20px', fontWeight: 900, margin: 0, color: compPct >= 75 ? '#4ade80' : compPct >= 40 ? '#fbbf24' : '#f87171' }}>{compPct}%</p>
        </div>
        <div style={{ height: '10px', borderRadius: '999px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '999px', width: `${Math.min(100, compPct)}%`,
            background: compPct >= 75 ? 'linear-gradient(90deg,#4ade80,#22d3ee)' : compPct >= 40 ? 'linear-gradient(90deg,#fbbf24,#4ade80)' : 'linear-gradient(90deg,#f87171,#fbbf24)',
          }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '14px' }}>
          {[
            { l: 'Vuelos',    v: overview.co2_flight || 0, pct: total > 0 ? Math.round(((overview.co2_flight||0)/total)*100) : 0, c: '#48cae4' },
            { l: 'Marino',    v: overview.co2_sea    || 0, pct: total > 0 ? Math.round(((overview.co2_sea||0)/total)*100)    : 0, c: '#a78bfa' },
            { l: 'Terrestre', v: overview.co2_land   || 0, pct: total > 0 ? Math.round(((overview.co2_land||0)/total)*100)   : 0, c: '#fbbf24' },
          ].map(s => (
            <div key={s.l} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <p style={{ color: s.c, fontSize: '15px', fontWeight: 700, margin: '0 0 2px' }}>{s.pct}%</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: 0 }}>{s.l}: {s.v.toLocaleString()} kg</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '20px' }}>
        {/* By destination */}
        <div style={CARD}>
          <h3 style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#48cae4' }}><MapPinIcon size={15} /></span>
            Por destino
          </h3>
          {by_destination.length === 0 ? <p style={{ color: 'rgba(255,255,255,0.3)' }}>Sin datos</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={TH}>Destino</th>
                <th style={TH}>Viajes</th>
                <th style={TH}>CO₂</th>
                <th style={{ ...TH, width: '120px' }}>%</th>
              </tr></thead>
              <tbody>
                {by_destination.map(d => (
                  <tr key={d.destination}>
                    <td style={{ ...TD, fontWeight: 600 }}>{d.destination}</td>
                    <td style={{ ...TD, color: '#a78bfa' }}>{d.trips}</td>
                    <td style={{ ...TD, color: '#f87171', fontWeight: 700, whiteSpace: 'nowrap' }}>{d.total_co2.toLocaleString()} kg</td>
                    <td style={TD}><Bar pct={(d.total_co2 / maxDest) * 100} color="#f87171" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* By expedition */}
        <div style={CARD}>
          <h3 style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#fbbf24' }}><TrophyIcon size={15} /></span>
            Por expedición
          </h3>
          {by_expedition.length === 0 ? <p style={{ color: 'rgba(255,255,255,0.3)' }}>Sin datos</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={TH}>Expedición</th>
                <th style={TH}>Viajes</th>
                <th style={TH}>CO₂</th>
                <th style={{ ...TH, width: '120px' }}>%</th>
              </tr></thead>
              <tbody>
                {by_expedition.map((e, i) => (
                  <tr key={i}>
                    <td style={{ ...TD, fontWeight: 600, fontSize: '12px' }}>{e.name}</td>
                    <td style={{ ...TD, color: '#a78bfa' }}>{e.trips}</td>
                    <td style={{ ...TD, color: '#f87171', fontWeight: 700, whiteSpace: 'nowrap' }}>{e.total_co2.toLocaleString()} kg</td>
                    <td style={TD}><Bar pct={(e.total_co2 / maxExp) * 100} color="#a78bfa" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Compensations list */}
      <div style={CARD}>
        <h3 style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#4ade80' }}><LeafIcon size={15} /></span>
          Historial de compensaciones ({compensations.length})
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead><tr>
              <th style={TH}>Usuario</th>
              <th style={TH}>Tipo</th>
              <th style={TH}>Organización</th>
              <th style={TH}>CO₂ compensado</th>
              <th style={TH}>Puntos</th>
              <th style={TH}>Fecha</th>
            </tr></thead>
            <tbody>
              {compensations.length === 0 ? (
                <tr><td colSpan={6} style={{ ...TD, textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '30px' }}>Sin compensaciones</td></tr>
              ) : compensations.map(c => (
                <tr key={c.id}>
                  <td style={{ ...TD, fontWeight: 600 }}>{c.user_name}</td>
                  <td style={TD}><span style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '6px', padding: '2px 8px', fontSize: '12px', color: '#4ade80' }}>{c.type}</span></td>
                  <td style={{ ...TD, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{c.organization}</td>
                  <td style={{ ...TD, color: '#4ade80', fontWeight: 700 }}>{c.co2_compensated} kg</td>
                  <td style={{ ...TD, color: '#48cae4', fontWeight: 700 }}>+{c.points_earned}</td>
                  <td style={{ ...TD, color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{fmtDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
