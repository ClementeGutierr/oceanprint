import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE, authCfg } from './AdminApp'
import { LeafIcon, StarIcon, BrainIcon, CreditCardIcon, MissionIcon, OptionIcon } from '../../components/OceanIcons'
import AdminSelect from './AdminSelect'

const TABS = ['Misiones', 'Quizzes', 'Compensaciones']
const CATEGORIES_MISSION = ['conservacion', 'sostenibilidad', 'ciencia', 'comunidad', 'educacion', 'compensacion', 'voluntariado', 'calculadora', 'social']
const CATEGORIES_QUIZ = ['conservacion', 'sostenibilidad', 'fauna', 'emisiones', 'buceo']
const CORRECT_OPTIONS = ['A', 'B', 'C', 'D']

const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }
const TH = { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.35)', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }
const TD = { padding: '11px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(255,255,255,0.04)' }
const INPUT = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '9px 12px', color: 'white', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box', colorScheme: 'dark' }
const LABEL = { display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }
const BTN = { background: 'linear-gradient(135deg,#00b4d8,#48cae4)', border: 'none', borderRadius: '10px', padding: '8px 16px', color: '#040d18', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }
const BTN_DANGER = { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '8px', padding: '5px 10px', color: '#f87171', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }
const BTN_EDIT = { background: 'rgba(0,180,216,0.12)', border: '1px solid rgba(0,180,216,0.25)', borderRadius: '8px', padding: '5px 10px', color: '#48cae4', cursor: 'pointer', fontSize: '12px', fontWeight: 600, marginRight: '6px' }

const EMPTY_MISSION = { name: '', description: '', icon: '🌊', points: 50, category: 'conservacion', quiz_id: '' }
const EMPTY_QUIZ = { question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', explanation: '', category: 'conservacion', points: 20 }

// ── MISSIONS ─────────────────────────────────────────────
function MissionsPanel({ token }) {
  const [items, setItems]     = useState([])
  const [form, setForm]       = useState(EMPTY_MISSION)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')

  useEffect(() => {
    axios.get(`${API_BASE}/admin/missions`, authCfg(token)).then(r => setItems(r.data)).catch(console.error)
  }, [token])

  function openCreate() { setForm(EMPTY_MISSION); setEditing(null); setShowForm(true); setErr('') }
  function openEdit(item) { setForm({ name: item.name, description: item.description, icon: item.icon, points: item.points, category: item.category, quiz_id: item.quiz_id ?? '' }); setEditing(item.id); setShowForm(true); setErr('') }

  async function save() {
    setSaving(true); setErr('')
    try {
      const payload = { ...form, points: parseInt(form.points), quiz_id: form.quiz_id || null }
      if (editing) {
        const r = await axios.put(`${API_BASE}/admin/missions/${editing}`, payload, authCfg(token))
        setItems(prev => prev.map(x => x.id === editing ? { ...x, ...r.data } : x))
      } else {
        const r = await axios.post(`${API_BASE}/admin/missions`, payload, authCfg(token))
        setItems(prev => [...prev, { ...r.data, completion_count: 0 }])
      }
      setShowForm(false)
    } catch (e) { setErr(e.response?.data?.error || 'Error') } finally { setSaving(false) }
  }

  async function del(item) {
    if (!window.confirm(`¿Eliminar "${item.name}"?`)) return
    await axios.delete(`${API_BASE}/admin/missions/${item.id}`, authCfg(token))
    setItems(prev => prev.filter(x => x.id !== item.id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {showForm && (
        <div style={{ ...CARD, border: '1px solid rgba(0,180,216,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ color: '#48cae4', fontWeight: 700, fontSize: '14px', margin: 0 }}>{editing ? 'Editar misión' : 'Nueva misión'}</h4>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '20px' }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '12px' }}>
            <div><label style={LABEL}>Nombre</label><input style={INPUT} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label style={LABEL}>Ícono (emoji)</label><input style={INPUT} value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} /></div>
            <div><label style={LABEL}>Puntos</label><input type="number" style={INPUT} value={form.points} onChange={e => setForm({ ...form, points: e.target.value })} /></div>
            <div>
              <label style={LABEL}>Categoría</label>
              <AdminSelect value={form.category} onChange={v => setForm({ ...form, category: v })} options={CATEGORIES_MISSION} />
            </div>
            <div><label style={LABEL}>Quiz ID (opcional)</label><input type="number" style={INPUT} value={form.quiz_id} onChange={e => setForm({ ...form, quiz_id: e.target.value })} placeholder="ID del quiz asociado" /></div>
            <div style={{ gridColumn: '1/-1' }}><label style={LABEL}>Descripción</label><input style={INPUT} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          {err && <p style={{ color: '#f87171', fontSize: '13px', margin: '10px 0 0' }}>{err}</p>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
            <button onClick={save} disabled={saving} style={BTN}>{saving ? 'Guardando...' : editing ? 'Guardar' : 'Crear misión'}</button>
            <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '12px' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h4 style={{ color: 'white', fontWeight: 700, fontSize: '14px', margin: 0 }}>Misiones ({items.length})</h4>
          <button onClick={openCreate} style={BTN}>+ Nueva</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
            <thead><tr>
              <th style={TH}>Misión</th>
              <th style={TH}>Cat.</th>
              <th style={TH}>Puntos</th>
              <th style={TH}>Completados</th>
              <th style={TH}>Quiz</th>
              <th style={TH}>Acciones</th>
            </tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={TD}>
                    <span style={{ marginRight: '8px', display: 'inline-flex', verticalAlign: 'middle' }}>
                      <MissionIcon icon={item.icon} size={16} color="#48cae4" />
                    </span>
                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                  </td>
                  <td style={{ ...TD, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{item.category}</td>
                  <td style={{ ...TD, color: '#48cae4', fontWeight: 700 }}>{item.points}</td>
                  <td style={{ ...TD, color: '#4ade80' }}>{item.completion_count}</td>
                  <td style={{ ...TD, color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{item.quiz_id ?? '—'}</td>
                  <td style={{ ...TD, whiteSpace: 'nowrap' }}>
                    <button onClick={() => openEdit(item)} style={BTN_EDIT}>Editar</button>
                    <button onClick={() => del(item)} style={BTN_DANGER}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── QUIZZES ───────────────────────────────────────────────
function QuizzesPanel({ token }) {
  const [items, setItems]     = useState([])
  const [form, setForm]       = useState(EMPTY_QUIZ)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')

  useEffect(() => {
    axios.get(`${API_BASE}/admin/quizzes`, authCfg(token)).then(r => setItems(r.data)).catch(console.error)
  }, [token])

  function openCreate() { setForm(EMPTY_QUIZ); setEditing(null); setShowForm(true); setErr('') }
  function openEdit(item) { setForm({ question: item.question, option_a: item.option_a, option_b: item.option_b, option_c: item.option_c, option_d: item.option_d, correct_answer: item.correct_answer, explanation: item.explanation, category: item.category, points: item.points }); setEditing(item.id); setShowForm(true); setErr('') }

  async function save() {
    setSaving(true); setErr('')
    try {
      const payload = { ...form, points: parseInt(form.points) }
      if (editing) {
        const r = await axios.put(`${API_BASE}/admin/quizzes/${editing}`, payload, authCfg(token))
        setItems(prev => prev.map(x => x.id === editing ? r.data : x))
      } else {
        const r = await axios.post(`${API_BASE}/admin/quizzes`, payload, authCfg(token))
        setItems(prev => [...prev, r.data])
      }
      setShowForm(false)
    } catch (e) { setErr(e.response?.data?.error || 'Error') } finally { setSaving(false) }
  }

  async function del(item) {
    if (!window.confirm(`¿Eliminar este quiz?`)) return
    await axios.delete(`${API_BASE}/admin/quizzes/${item.id}`, authCfg(token))
    setItems(prev => prev.filter(x => x.id !== item.id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {showForm && (
        <div style={{ ...CARD, border: '1px solid rgba(167,139,250,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ color: '#c4b5fd', fontWeight: 700, fontSize: '14px', margin: 0 }}>{editing ? 'Editar quiz' : 'Nuevo quiz'}</h4>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '20px' }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '12px' }}>
            <div style={{ gridColumn: '1/-1' }}><label style={LABEL}>Pregunta</label><input style={INPUT} value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} /></div>
            <div><label style={LABEL}>Opción A</label><input style={INPUT} value={form.option_a} onChange={e => setForm({ ...form, option_a: e.target.value })} /></div>
            <div><label style={LABEL}>Opción B</label><input style={INPUT} value={form.option_b} onChange={e => setForm({ ...form, option_b: e.target.value })} /></div>
            <div><label style={LABEL}>Opción C</label><input style={INPUT} value={form.option_c} onChange={e => setForm({ ...form, option_c: e.target.value })} /></div>
            <div><label style={LABEL}>Opción D</label><input style={INPUT} value={form.option_d} onChange={e => setForm({ ...form, option_d: e.target.value })} /></div>
            <div>
              <label style={LABEL}>Respuesta correcta</label>
              <AdminSelect value={form.correct_answer} onChange={v => setForm({ ...form, correct_answer: v })} options={CORRECT_OPTIONS.map(o => ({ value: o, label: `Opción ${o}` }))} />
            </div>
            <div>
              <label style={LABEL}>Categoría</label>
              <AdminSelect value={form.category} onChange={v => setForm({ ...form, category: v })} options={CATEGORIES_QUIZ} />
            </div>
            <div><label style={LABEL}>Puntos</label><input type="number" style={INPUT} value={form.points} onChange={e => setForm({ ...form, points: e.target.value })} /></div>
            <div style={{ gridColumn: '1/-1' }}><label style={LABEL}>Explicación</label><textarea style={{ ...INPUT, height: '80px', resize: 'vertical' }} value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} /></div>
          </div>
          {err && <p style={{ color: '#f87171', fontSize: '13px', margin: '10px 0 0' }}>{err}</p>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
            <button onClick={save} disabled={saving} style={BTN}>{saving ? 'Guardando...' : editing ? 'Guardar' : 'Crear quiz'}</button>
            <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '12px' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h4 style={{ color: 'white', fontWeight: 700, fontSize: '14px', margin: 0 }}>Quizzes ({items.length})</h4>
          <button onClick={openCreate} style={BTN}>+ Nuevo</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {items.map(item => (
            <div key={item.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', cursor: 'pointer' }} onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: 700, minWidth: '24px' }}>#{item.id}</span>
                <p style={{ flex: 1, color: 'white', fontSize: '13px', fontWeight: 600, margin: 0 }}>{item.question.slice(0, 80)}{item.question.length > 80 ? '…' : ''}</p>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', whiteSpace: 'nowrap' }}>{item.category} · {item.points}pts</span>
                <span style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', color: '#4ade80', fontWeight: 700 }}>{item.correct_answer}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={e => { e.stopPropagation(); openEdit(item) }} style={BTN_EDIT}>Editar</button>
                  <button onClick={e => { e.stopPropagation(); del(item) }} style={BTN_DANGER}>✕</button>
                </div>
              </div>
              {expanded === item.id && (
                <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '12px 0 8px' }}>{item.question}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                    {['A', 'B', 'C', 'D'].map(opt => (
                      <div key={opt} style={{ background: item.correct_answer === opt ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${item.correct_answer === opt ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '8px', padding: '7px 10px', fontSize: '12px' }}>
                        <span style={{ color: item.correct_answer === opt ? '#4ade80' : 'rgba(255,255,255,0.4)', fontWeight: 700, marginRight: '6px' }}>{opt}.</span>
                        <span style={{ color: item.correct_answer === opt ? '#4ade80' : 'rgba(255,255,255,0.7)' }}>{item[`option_${opt.toLowerCase()}`]}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#a78bfa', display: 'inline-flex' }}><BrainIcon size={13} /></span>
                    {item.explanation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── COMPENSATION OPTIONS ──────────────────────────────────
function CompOptionsPanel({ token }) {
  const [items, setItems]     = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState({})
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')

  useEffect(() => {
    axios.get(`${API_BASE}/admin/compensation-options`, authCfg(token)).then(r => setItems(r.data)).catch(console.error)
  }, [token])

  function openEdit(item) {
    setForm({ name: item.name, organization: item.organization, description: item.description, co2_per_unit: item.co2_per_unit, cost_per_unit: item.cost_per_unit, unit: item.unit, icon: item.icon, points_per_unit: item.points_per_unit })
    setEditing(item.id)
    setErr('')
  }

  async function save() {
    setSaving(true); setErr('')
    try {
      const r = await axios.put(`${API_BASE}/admin/compensation-options/${editing}`, form, authCfg(token))
      setItems(prev => prev.map(x => x.id === editing ? r.data : x))
      setEditing(null)
    } catch (e) { setErr(e.response?.data?.error || 'Error') } finally { setSaving(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ ...CARD, border: '1px solid rgba(74,222,128,0.2)' }}>
        <p style={{ color: '#4ade80', fontSize: '13px', margin: '0 0 4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LeafIcon size={14} /> Opciones de compensación
        </p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>Edita el precio, kg de CO₂, organización y descripción de cada opción de compensación disponible en la app.</p>
      </div>

      {items.map(item => (
        <div key={item.id} style={CARD}>
          {editing === item.id ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h4 style={{ color: '#4ade80', fontWeight: 700, fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <OptionIcon id={item.id} size={16} color="#4ade80" /> Editando: {item.name}
                </h4>
                <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '20px' }}>×</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '12px' }}>
                <div><label style={LABEL}>Nombre</label><input style={INPUT} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><label style={LABEL}>Ícono</label><input style={INPUT} value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} /></div>
                <div><label style={LABEL}>Organización</label><input style={INPUT} value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} /></div>
                <div><label style={LABEL}>Unidad</label><input style={INPUT} value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></div>
                <div><label style={LABEL}>kg CO₂ por unidad</label><input type="number" step="0.1" style={INPUT} value={form.co2_per_unit} onChange={e => setForm({ ...form, co2_per_unit: e.target.value })} /></div>
                <div><label style={LABEL}>Costo por unidad (COP)</label><input type="number" style={INPUT} value={form.cost_per_unit} onChange={e => setForm({ ...form, cost_per_unit: e.target.value })} /></div>
                <div><label style={LABEL}>Puntos por unidad</label><input type="number" style={INPUT} value={form.points_per_unit} onChange={e => setForm({ ...form, points_per_unit: e.target.value })} /></div>
                <div style={{ gridColumn: '1/-1' }}><label style={LABEL}>Descripción</label><textarea style={{ ...INPUT, height: '70px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              </div>
              {err && <p style={{ color: '#f87171', fontSize: '13px', margin: '10px 0 0' }}>{err}</p>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button onClick={save} disabled={saving} style={BTN}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
                <button onClick={() => setEditing(null)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '12px' }}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ flexShrink: 0, color: '#4ade80' }}>
                <OptionIcon id={item.id} size={32} color="#4ade80" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                  <div>
                    <h4 style={{ color: 'white', fontWeight: 700, fontSize: '15px', margin: '0 0 2px' }}>{item.name}</h4>
                    <p style={{ color: '#4ade80', fontSize: '12px', fontWeight: 600, margin: '0 0 6px' }}>{item.organization}</p>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', margin: 0 }}>{item.description}</p>
                  </div>
                  <button onClick={() => openEdit(item)} style={BTN_EDIT}>Editar</button>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ color: '#4ade80', display: 'inline-flex' }}><LeafIcon size={13} /></span>
                    <b style={{ color: '#4ade80' }}>{item.co2_per_unit} kg</b> CO₂ / {item.unit}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ color: '#fbbf24', display: 'inline-flex' }}><CreditCardIcon size={13} /></span>
                    <b style={{ color: '#fbbf24' }}>{item.cost_per_unit === 0 ? 'Gratis' : `$${Number(item.cost_per_unit).toLocaleString()} COP`}</b> / {item.unit}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ color: '#48cae4', display: 'inline-flex' }}><StarIcon size={13} /></span>
                    <b style={{ color: '#48cae4' }}>{item.points_per_unit} pts</b> / {item.unit}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── MAIN ─────────────────────────────────────────────────
export default function AdminContent({ token }) {
  const [tab, setTab] = useState(0)

  return (
    <div>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: '8px 18px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.15s',
              background: tab === i ? 'rgba(0,180,216,0.18)' : 'transparent',
              color: tab === i ? '#48cae4' : 'rgba(255,255,255,0.4)',
            }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && <MissionsPanel token={token} />}
      {tab === 1 && <QuizzesPanel token={token} />}
      {tab === 2 && <CompOptionsPanel token={token} />}
    </div>
  )
}
