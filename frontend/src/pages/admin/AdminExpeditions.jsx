import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE, authCfg } from './AdminApp'

const DESTINATIONS = ['Galápagos', 'Isla Malpelo', 'Islas Revillagigedo', 'Isla del Coco', 'Raja Ampat', 'Providencia']
const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }
const TH = { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.35)', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }
const TD = { padding: '12px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(255,255,255,0.04)' }
const INPUT = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '9px 12px', color: 'white', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' }
const BTN = { background: 'linear-gradient(135deg,#00b4d8,#48cae4)', border: 'none', borderRadius: '10px', padding: '9px 18px', color: '#040d18', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }
const LABEL = { display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }

function fmtDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`
}

function genCode(name, date) {
  const abbr = name.split(' ').map(w => w[0]).join('').toUpperCase().replace(/[^A-Z]/g,'').slice(0,5)
  const yr = date ? date.slice(2,4) : ''
  const mo = date ? ['','ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'][parseInt(date.split('-')[1])] : ''
  return `${abbr}-${mo}${yr}`
}

const EMPTY_FORM = { name: '', destination: 'Isla Malpelo', start_date: '', end_date: '', invite_code: '', prize_description: '' }

export default function AdminExpeditions({ token }) {
  const [expeditions, setExpeditions] = useState([])
  const [loading, setLoading]       = useState(true)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [editing, setEditing]       = useState(null)  // null | id
  const [showForm, setShowForm]     = useState(false)
  const [members, setMembers]       = useState(null)  // { expName, list }
  const [saving, setSaving]         = useState(false)
  const [err, setErr]               = useState('')
  const today = new Date().toISOString().split('T')[0]

  function load() {
    setLoading(true)
    axios.get(`${API_BASE}/admin/expeditions`, authCfg(token))
      .then(r => setExpeditions(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }
  useEffect(load, [token])

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditing(null)
    setShowForm(true)
    setErr('')
  }

  function openEdit(exp) {
    setForm({ name: exp.name, destination: exp.destination, start_date: exp.start_date, end_date: exp.end_date, invite_code: exp.invite_code, prize_description: exp.prize_description || '' })
    setEditing(exp.id)
    setShowForm(true)
    setErr('')
    setMembers(null)
  }

  function handleFormChange(field, val) {
    const next = { ...form, [field]: val }
    if ((field === 'name' || field === 'start_date') && !editing) {
      next.invite_code = genCode(next.name, next.start_date)
    }
    setForm(next)
  }

  async function handleSave() {
    setSaving(true)
    setErr('')
    try {
      if (editing) {
        const r = await axios.put(`${API_BASE}/admin/expeditions/${editing}`, form, authCfg(token))
        setExpeditions(prev => prev.map(e => e.id === editing ? { ...e, ...r.data } : e))
      } else {
        const r = await axios.post(`${API_BASE}/admin/expeditions`, form, authCfg(token))
        setExpeditions(prev => [{ ...r.data, member_count: 0, trips_count: 0 }, ...prev])
      }
      setShowForm(false)
    } catch (e) {
      setErr(e.response?.data?.error || 'Error guardando')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(exp) {
    if (!window.confirm(`¿Eliminar "${exp.name}"? Se desvinculará de todos los viajes.`)) return
    await axios.delete(`${API_BASE}/admin/expeditions/${exp.id}`, authCfg(token))
    setExpeditions(prev => prev.filter(e => e.id !== exp.id))
    if (members?.expId === exp.id) setMembers(null)
  }

  async function viewMembers(exp) {
    if (members?.expId === exp.id) { setMembers(null); return }
    const r = await axios.get(`${API_BASE}/admin/expeditions/${exp.id}/members`, authCfg(token))
    setMembers({ expId: exp.id, expName: exp.name, list: r.data })
  }

  const statusBadge = (exp) => {
    const active = exp.end_date >= today
    const started = exp.start_date <= today
    if (active && started) return { label: 'EN CURSO', color: '74,222,128' }
    if (active) return { label: 'PRÓXIMA', color: '251,191,36' }
    return { label: 'TERMINADA', color: '255,255,255' }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>Cargando...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Create / Edit form */}
      {showForm && (
        <div style={{ ...CARD, border: '1px solid rgba(167,139,250,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: '#c4b5fd', fontWeight: 700, fontSize: '16px', margin: 0 }}>{editing ? 'Editar Expedición' : 'Nueva Expedición'}</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '14px' }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={LABEL}>Nombre de la expedición</label>
              <input style={INPUT} value={form.name} onChange={e => handleFormChange('name', e.target.value)} placeholder="Ej: Malpelo Marzo 2026" />
            </div>
            <div>
              <label style={LABEL}>Destino</label>
              <select style={{ ...INPUT, appearance: 'none' }} value={form.destination} onChange={e => handleFormChange('destination', e.target.value)}>
                {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={LABEL}>Código de invitación</label>
              <input style={{ ...INPUT, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }} value={form.invite_code} onChange={e => handleFormChange('invite_code', e.target.value.toUpperCase())} placeholder="MALPELO-MAR26" />
            </div>
            <div>
              <label style={LABEL}>Fecha inicio</label>
              <input type="date" style={INPUT} value={form.start_date} onChange={e => handleFormChange('start_date', e.target.value)} />
            </div>
            <div>
              <label style={LABEL}>Fecha fin</label>
              <input type="date" style={INPUT} value={form.end_date} onChange={e => handleFormChange('end_date', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={LABEL}>Premio al ganador</label>
              <input style={INPUT} value={form.prize_description} onChange={e => handleFormChange('prize_description', e.target.value)} placeholder="Descripción del premio..." />
            </div>
          </div>
          {err && <p style={{ color: '#f87171', fontSize: '13px', marginTop: '12px' }}>{err}</p>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
            <button onClick={handleSave} disabled={saving} style={BTN}>{saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear expedición'}</button>
            <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '9px 16px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ color: 'white', fontWeight: 700, fontSize: '15px', margin: 0 }}>🏆 Expediciones ({expeditions.length})</h3>
          <button onClick={openCreate} style={BTN}>+ Nueva expedición</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr>
                <th style={TH}>Nombre</th>
                <th style={TH}>Destino</th>
                <th style={TH}>Fechas</th>
                <th style={TH}>Código</th>
                <th style={TH}>Miembros</th>
                <th style={TH}>Viajes</th>
                <th style={TH}>Estado</th>
                <th style={TH}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {expeditions.map(exp => {
                const { label, color } = statusBadge(exp)
                return (
                  <>
                    <tr key={exp.id} style={{ cursor: 'pointer' }}>
                      <td style={{ ...TD, fontWeight: 600 }}>
                        {exp.name}
                        {exp.prize_description && <p style={{ fontSize: '11px', color: 'rgba(253,230,138,0.5)', margin: '2px 0 0' }}>🏆 {exp.prize_description.slice(0, 40)}{exp.prize_description.length > 40 ? '…' : ''}</p>}
                      </td>
                      <td style={TD}>{exp.destination}</td>
                      <td style={{ ...TD, fontSize: '12px' }}>{fmtDate(exp.start_date)}<br />{fmtDate(exp.end_date)}</td>
                      <td style={{ ...TD, fontFamily: 'monospace', fontSize: '12px', color: '#a78bfa' }}>{exp.invite_code}</td>
                      <td style={{ ...TD, fontWeight: 700, color: '#48cae4' }}>{exp.member_count}</td>
                      <td style={{ ...TD, fontWeight: 700, color: '#a78bfa' }}>{exp.trips_count}</td>
                      <td style={TD}>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: `rgba(${color},0.1)`, color: `rgb(${color})`, border: `1px solid rgba(${color},0.3)` }}>
                          {label}
                        </span>
                      </td>
                      <td style={{ ...TD, whiteSpace: 'nowrap' }}>
                        <button onClick={() => viewMembers(exp)} style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: '8px', padding: '5px 10px', color: '#c4b5fd', cursor: 'pointer', fontSize: '12px', fontWeight: 600, marginRight: '6px' }}>
                          {members?.expId === exp.id ? 'Ocultar' : 'Miembros'}
                        </button>
                        <button onClick={() => openEdit(exp)} style={{ background: 'rgba(0,180,216,0.12)', border: '1px solid rgba(0,180,216,0.25)', borderRadius: '8px', padding: '5px 10px', color: '#48cae4', cursor: 'pointer', fontSize: '12px', fontWeight: 600, marginRight: '6px' }}>
                          Editar
                        </button>
                        <button onClick={() => handleDelete(exp)} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '8px', padding: '5px 10px', color: '#f87171', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                    {/* Members row */}
                    {members?.expId === exp.id && (
                      <tr key={`members-${exp.id}`}>
                        <td colSpan={8} style={{ padding: '0 14px 16px', background: 'rgba(167,139,250,0.04)' }}>
                          <div style={{ borderTop: '1px solid rgba(167,139,250,0.15)', paddingTop: '14px' }}>
                            <p style={{ color: '#c4b5fd', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>Miembros de {members.expName}</p>
                            {members.list.length === 0 ? (
                              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Sin miembros aún</p>
                            ) : (
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead><tr>
                                  <th style={{ ...TH, fontSize: '10px' }}>#</th>
                                  <th style={{ ...TH, fontSize: '10px' }}>Nombre</th>
                                  <th style={{ ...TH, fontSize: '10px' }}>Nivel</th>
                                  <th style={{ ...TH, fontSize: '10px' }}>Puntos exp.</th>
                                  <th style={{ ...TH, fontSize: '10px' }}>Viajes exp.</th>
                                  <th style={{ ...TH, fontSize: '10px' }}>Se unió</th>
                                </tr></thead>
                                <tbody>
                                  {members.list.map((m, i) => (
                                    <tr key={m.id}>
                                      <td style={{ ...TD, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>#{i + 1}</td>
                                      <td style={TD}><p style={{ margin: 0, fontWeight: 600, fontSize: '13px' }}>{m.name}</p><p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{m.email}</p></td>
                                      <td style={{ ...TD, fontSize: '12px' }}>{m.level}</td>
                                      <td style={{ ...TD, color: '#a78bfa', fontWeight: 700 }}>{m.expedition_points}</td>
                                      <td style={{ ...TD, color: '#48cae4', fontWeight: 700 }}>{m.trip_count}</td>
                                      <td style={{ ...TD, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{fmtDate(m.joined_at)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
              {!expeditions.length && (
                <tr><td colSpan={8} style={{ ...TD, textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '40px' }}>Sin expediciones</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
