import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE, authCfg } from './AdminApp'
import AdminSelect from './AdminSelect'
import { DESTINATION_ICONS_LIST, DestinationIcon } from '../../components/OceanIcons'

const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }
const TH = { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.35)', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }
const TD = { padding: '11px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(255,255,255,0.04)' }
const INPUT = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '9px 12px', color: 'white', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' }
const LABEL = { display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }
const BTN = { background: 'linear-gradient(135deg,#00b4d8,#48cae4)', border: 'none', borderRadius: '10px', padding: '8px 16px', color: '#040d18', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }
const BTN_DANGER = { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '8px', padding: '5px 10px', color: '#f87171', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }
const BTN_EDIT = { background: 'rgba(0,180,216,0.12)', border: '1px solid rgba(0,180,216,0.25)', borderRadius: '8px', padding: '5px 10px', color: '#48cae4', cursor: 'pointer', fontSize: '12px', fontWeight: 600, marginRight: '6px' }

const TABS = ['Destinos']

// ── DESTINATIONS ────────────────────────────────────────────────────────────
const EMPTY_DEST = { name: '', country: '', icon: 'shark', local_km: '', dive_hours: '6', sort_order: '0', lat: '', lng: '' }

function DestinosPanel({ token }) {
  const [items, setItems]     = useState([])
  const [form, setForm]       = useState(EMPTY_DEST)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')

  useEffect(() => {
    axios.get(`${API_BASE}/admin/destinations`, authCfg(token)).then(r => setItems(r.data)).catch(console.error)
  }, [token])

  function openCreate() { setForm(EMPTY_DEST); setEditing(null); setShowForm(true); setErr('') }
  function openEdit(item) {
    setForm({ name: item.name, country: item.country, icon: item.icon, local_km: String(item.local_km), dive_hours: String(item.dive_hours), sort_order: String(item.sort_order), lat: item.lat ?? '', lng: item.lng ?? '' })
    setEditing(item.id); setShowForm(true); setErr('')
  }

  async function save() {
    setSaving(true); setErr('')
    try {
      const payload = { ...form, local_km: parseFloat(form.local_km) || 0, dive_hours: parseFloat(form.dive_hours) || 6, sort_order: parseInt(form.sort_order) || 0, lat: form.lat !== '' ? parseFloat(form.lat) : null, lng: form.lng !== '' ? parseFloat(form.lng) : null }
      if (editing) {
        const r = await axios.put(`${API_BASE}/admin/destinations/${editing}`, payload, authCfg(token))
        setItems(prev => prev.map(x => x.id === editing ? r.data : x))
      } else {
        const r = await axios.post(`${API_BASE}/admin/destinations`, payload, authCfg(token))
        setItems(prev => [...prev, r.data])
      }
      setShowForm(false)
    } catch (e) { setErr(e.response?.data?.error || 'Error') } finally { setSaving(false) }
  }

  async function del(item) {
    if (!window.confirm(`¿Eliminar "${item.name}"?`)) return
    await axios.delete(`${API_BASE}/admin/destinations/${item.id}`, authCfg(token))
    setItems(prev => prev.filter(x => x.id !== item.id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {showForm && (
        <div style={{ ...CARD, border: '1px solid rgba(0,180,216,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ color: '#48cae4', fontWeight: 700, fontSize: '14px', margin: 0 }}>{editing ? 'Editar destino' : 'Nuevo destino'}</h4>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '20px' }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '12px' }}>
            <div style={{ gridColumn: '1/-1' }}><label style={LABEL}>Nombre *</label><input style={INPUT} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Isla Malpelo" /></div>
            <div><label style={LABEL}>País</label><input style={INPUT} value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="Colombia" /></div>
            <div>
              <label style={LABEL}>Latitud <span style={{ color: '#48cae4' }}>*</span></label>
              <input type="number" step="any" style={INPUT} value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} placeholder="Ej: 4.003 (positivo=N, negativo=S)" />
            </div>
            <div>
              <label style={LABEL}>Longitud <span style={{ color: '#48cae4' }}>*</span></label>
              <input type="number" step="any" style={INPUT} value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} placeholder="Ej: -81.600 (positivo=E, negativo=O)" />
            </div>
            <div style={{ gridColumn: '1/-1', background: 'rgba(72,202,228,0.06)', border: '1px solid rgba(72,202,228,0.15)', borderRadius: '8px', padding: '8px 12px' }}>
              <p style={{ color: 'rgba(72,202,228,0.7)', fontSize: '11px', margin: 0 }}>
                Las coordenadas permiten calcular la distancia de vuelo con precisión (Haversine). Sin ellas se usa una distancia por defecto de 2 000 km.
                Búscalas en Google Maps: clic derecho sobre el punto → aparecen lat, lng.
              </p>
            </div>
            <div><label style={LABEL}>Distancia local (km)</label><input type="number" min="0" style={INPUT} value={form.local_km} onChange={e => setForm({ ...form, local_km: e.target.value })} placeholder="0" /></div>
            <div><label style={LABEL}>Horas de buceo típicas</label><input type="number" min="0" style={INPUT} value={form.dive_hours} onChange={e => setForm({ ...form, dive_hours: e.target.value })} placeholder="6" /></div>
            <div><label style={LABEL}>Orden</label><input type="number" min="0" style={INPUT} value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} /></div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={LABEL}>Ícono — selecciona el animal del destino</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(68px,1fr))', gap: '8px', marginTop: '8px' }}>
                {DESTINATION_ICONS_LIST.map(({ id, label, Icon }) => (
                  <button key={id} type="button" onClick={() => setForm({ ...form, icon: id })} title={label}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', padding: '10px 4px', borderRadius: '10px', cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                      background: form.icon === id ? 'rgba(0,180,216,0.18)' : 'rgba(255,255,255,0.04)',
                      borderColor: form.icon === id ? '#00b4d8' : 'rgba(255,255,255,0.08)',
                      color: form.icon === id ? '#48cae4' : 'rgba(255,255,255,0.45)',
                    }}>
                    <Icon size={24} />
                    <span style={{ fontSize: '9px', textAlign: 'center', lineHeight: 1.2, fontWeight: form.icon === id ? 700 : 400 }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          {err && <p style={{ color: '#f87171', fontSize: '13px', margin: '10px 0 0' }}>{err}</p>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
            <button onClick={save} disabled={saving} style={BTN}>{saving ? 'Guardando...' : editing ? 'Guardar' : 'Crear destino'}</button>
            <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '12px' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h4 style={{ color: 'white', fontWeight: 700, fontSize: '14px', margin: 0 }}>Destinos de buceo ({items.length})</h4>
          <button onClick={openCreate} style={BTN}>+ Nuevo destino</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
            <thead><tr>
              <th style={TH}>Destino</th>
              <th style={TH}>País</th>
              <th style={TH}>Dist. local</th>
              <th style={TH}>Horas buceo</th>
              <th style={TH}>Orden</th>
              <th style={TH}>Acciones</th>
            </tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={TD}>
                    <span style={{ marginRight: '8px', display: 'inline-flex', verticalAlign: 'middle', color: '#48cae4' }}><DestinationIcon icon={item.icon} size={18} /></span>
                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                  </td>
                  <td style={{ ...TD, color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>{item.country}</td>
                  <td style={{ ...TD, color: '#48cae4' }}>{item.local_km} km</td>
                  <td style={{ ...TD, color: '#a78bfa' }}>{item.dive_hours}h</td>
                  <td style={{ ...TD, color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{item.sort_order}</td>
                  <td style={{ ...TD, whiteSpace: 'nowrap' }}>
                    <button onClick={() => openEdit(item)} style={BTN_EDIT}>Editar</button>
                    <button onClick={() => del(item)} style={BTN_DANGER}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan={6} style={{ ...TD, textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '30px' }}>Sin destinos</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── ORIGINS ─────────────────────────────────────────────────────────────────
const EMPTY_ORIG = { name: '', country: '', sort_order: '0' }

function OrigenesPanel({ token }) {
  const [items, setItems]     = useState([])
  const [form, setForm]       = useState(EMPTY_ORIG)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')

  useEffect(() => {
    axios.get(`${API_BASE}/admin/origins`, authCfg(token)).then(r => setItems(r.data)).catch(console.error)
  }, [token])

  function openCreate() { setForm(EMPTY_ORIG); setEditing(null); setShowForm(true); setErr('') }
  function openEdit(item) {
    setForm({ name: item.name, country: item.country, sort_order: String(item.sort_order) })
    setEditing(item.id); setShowForm(true); setErr('')
  }

  async function save() {
    setSaving(true); setErr('')
    try {
      const payload = { ...form, sort_order: parseInt(form.sort_order) || 0 }
      if (editing) {
        const r = await axios.put(`${API_BASE}/admin/origins/${editing}`, payload, authCfg(token))
        setItems(prev => prev.map(x => x.id === editing ? r.data : x))
      } else {
        const r = await axios.post(`${API_BASE}/admin/origins`, payload, authCfg(token))
        setItems(prev => [...prev, r.data])
      }
      setShowForm(false)
    } catch (e) { setErr(e.response?.data?.error || 'Error') } finally { setSaving(false) }
  }

  async function del(item) {
    if (!window.confirm(`¿Eliminar "${item.name}"?`)) return
    await axios.delete(`${API_BASE}/admin/origins/${item.id}`, authCfg(token))
    setItems(prev => prev.filter(x => x.id !== item.id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {showForm && (
        <div style={{ ...CARD, border: '1px solid rgba(167,139,250,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ color: '#c4b5fd', fontWeight: 700, fontSize: '14px', margin: 0 }}>{editing ? 'Editar origen' : 'Nuevo origen'}</h4>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '20px' }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '12px' }}>
            <div><label style={LABEL}>Ciudad *</label><input style={INPUT} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Bogotá" /></div>
            <div><label style={LABEL}>País</label><input style={INPUT} value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="Colombia" /></div>
            <div><label style={LABEL}>Orden</label><input type="number" min="0" style={INPUT} value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} /></div>
          </div>
          {err && <p style={{ color: '#f87171', fontSize: '13px', margin: '10px 0 0' }}>{err}</p>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
            <button onClick={save} disabled={saving} style={BTN}>{saving ? 'Guardando...' : editing ? 'Guardar' : 'Crear origen'}</button>
            <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '12px' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h4 style={{ color: 'white', fontWeight: 700, fontSize: '14px', margin: 0 }}>Ciudades de origen ({items.length})</h4>
          <button onClick={openCreate} style={BTN}>+ Nuevo origen</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
            <thead><tr>
              <th style={TH}>Ciudad</th>
              <th style={TH}>País</th>
              <th style={TH}>Orden</th>
              <th style={TH}>Acciones</th>
            </tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ ...TD, fontWeight: 600 }}>{item.name}</td>
                  <td style={{ ...TD, color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>{item.country}</td>
                  <td style={{ ...TD, color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{item.sort_order}</td>
                  <td style={{ ...TD, whiteSpace: 'nowrap' }}>
                    <button onClick={() => openEdit(item)} style={BTN_EDIT}>Editar</button>
                    <button onClick={() => del(item)} style={BTN_DANGER}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan={4} style={{ ...TD, textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '30px' }}>Sin orígenes</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── STOPOVERS ───────────────────────────────────────────────────────────────
const EMPTY_STOP = { origin: '', destination: '', stopover_city: '', dist_origin_stopover: '', dist_stopover_dest: '' }

function EscalasPanel({ token }) {
  const [items, setItems]     = useState([])
  const [origins, setOrigins] = useState([])
  const [dests, setDests]     = useState([])
  const [form, setForm]       = useState(EMPTY_STOP)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')

  useEffect(() => {
    axios.get(`${API_BASE}/admin/stopovers`,    authCfg(token)).then(r => setItems(r.data)).catch(console.error)
    axios.get(`${API_BASE}/admin/origins`,      authCfg(token)).then(r => setOrigins(r.data.map(o => o.name))).catch(() => {})
    axios.get(`${API_BASE}/admin/destinations`, authCfg(token)).then(r => setDests(r.data.map(d => d.name))).catch(() => {})
  }, [token])

  function openCreate() { setForm(EMPTY_STOP); setEditing(null); setShowForm(true); setErr('') }
  function openEdit(item) {
    setForm({ origin: item.origin, destination: item.destination, stopover_city: item.stopover_city, dist_origin_stopover: String(item.dist_origin_stopover), dist_stopover_dest: String(item.dist_stopover_dest) })
    setEditing(item.id); setShowForm(true); setErr('')
  }

  async function save() {
    if (!form.origin || !form.destination || !form.stopover_city || !form.dist_origin_stopover || !form.dist_stopover_dest)
      return setErr('Todos los campos son requeridos')
    setSaving(true); setErr('')
    try {
      const payload = { ...form, dist_origin_stopover: parseFloat(form.dist_origin_stopover), dist_stopover_dest: parseFloat(form.dist_stopover_dest) }
      if (editing) {
        const r = await axios.put(`${API_BASE}/admin/stopovers/${editing}`, payload, authCfg(token))
        setItems(prev => prev.map(x => x.id === editing ? r.data : x))
      } else {
        const r = await axios.post(`${API_BASE}/admin/stopovers`, payload, authCfg(token))
        setItems(prev => [...prev, r.data])
      }
      setShowForm(false)
    } catch (e) { setErr(e.response?.data?.error || 'Error') } finally { setSaving(false) }
  }

  async function del(item) {
    if (!window.confirm(`¿Eliminar escala "${item.stopover_city}" en ${item.origin} → ${item.destination}?`)) return
    await axios.delete(`${API_BASE}/admin/stopovers/${item.id}`, authCfg(token))
    setItems(prev => prev.filter(x => x.id !== item.id))
  }

  const originOpts = [{ value: '', label: 'Seleccionar origen...' }, ...origins.map(o => ({ value: o, label: o }))]
  const destOpts   = [{ value: '', label: 'Seleccionar destino...' }, ...dests.map(d => ({ value: d, label: d }))]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ ...CARD, border: '1px solid rgba(74,222,128,0.2)' }}>
        <p style={{ color: '#4ade80', fontSize: '13px', margin: 0, fontWeight: 600 }}>Escalas de vuelo</p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '4px 0 0' }}>
          Define las ciudades de escala por ruta con distancias reales. Cuando el usuario selecciona una escala, el CO₂ de vuelo se calcula por segmentos en lugar del 20% genérico.
        </p>
      </div>

      {showForm && (
        <div style={{ ...CARD, border: '1px solid rgba(74,222,128,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ color: '#4ade80', fontWeight: 700, fontSize: '14px', margin: 0 }}>{editing ? 'Editar escala' : 'Nueva escala'}</h4>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '20px' }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '12px' }}>
            <div>
              <label style={LABEL}>Origen *</label>
              <AdminSelect value={form.origin} onChange={v => setForm({ ...form, origin: v })} options={originOpts} />
            </div>
            <div>
              <label style={LABEL}>Destino *</label>
              <AdminSelect value={form.destination} onChange={v => setForm({ ...form, destination: v })} options={destOpts} />
            </div>
            <div><label style={LABEL}>Ciudad de escala *</label><input style={INPUT} value={form.stopover_city} onChange={e => setForm({ ...form, stopover_city: e.target.value })} placeholder="Ej: Guayaquil" /></div>
            <div>
              <label style={LABEL}>Origen → Escala (km) *</label>
              <input type="number" min="0" style={INPUT} value={form.dist_origin_stopover} onChange={e => setForm({ ...form, dist_origin_stopover: e.target.value })} placeholder="780" />
            </div>
            <div>
              <label style={LABEL}>Escala → Destino (km) *</label>
              <input type="number" min="0" style={INPUT} value={form.dist_stopover_dest} onChange={e => setForm({ ...form, dist_stopover_dest: e.target.value })} placeholder="1400" />
            </div>
            {form.dist_origin_stopover && form.dist_stopover_dest && (
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>
                  Total: <strong style={{ color: '#48cae4' }}>{(parseFloat(form.dist_origin_stopover || 0) + parseFloat(form.dist_stopover_dest || 0)).toLocaleString()} km</strong> × 2 (ida y vuelta)
                </p>
              </div>
            )}
          </div>
          {err && <p style={{ color: '#f87171', fontSize: '13px', margin: '10px 0 0' }}>{err}</p>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
            <button onClick={save} disabled={saving} style={BTN}>{saving ? 'Guardando...' : editing ? 'Guardar' : 'Crear escala'}</button>
            <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '12px' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h4 style={{ color: 'white', fontWeight: 700, fontSize: '14px', margin: 0 }}>Escalas configuradas ({items.length})</h4>
          <button onClick={openCreate} style={BTN}>+ Nueva escala</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px' }}>
            <thead><tr>
              <th style={TH}>Ruta</th>
              <th style={TH}>Escala</th>
              <th style={TH}>Seg. 1 (km)</th>
              <th style={TH}>Seg. 2 (km)</th>
              <th style={TH}>Total</th>
              <th style={TH}>Acciones</th>
            </tr></thead>
            <tbody>
              {items.map(item => {
                const total = item.dist_origin_stopover + item.dist_stopover_dest
                return (
                  <tr key={item.id}>
                    <td style={TD}>
                      <span style={{ fontWeight: 600 }}>{item.origin}</span>
                      <span style={{ color: 'rgba(255,255,255,0.35)', margin: '0 6px' }}>→</span>
                      <span style={{ fontWeight: 600 }}>{item.destination}</span>
                    </td>
                    <td style={{ ...TD, color: '#fbbf24', fontWeight: 600 }}>{item.stopover_city}</td>
                    <td style={{ ...TD, color: '#48cae4' }}>{item.dist_origin_stopover.toLocaleString()}</td>
                    <td style={{ ...TD, color: '#48cae4' }}>{item.dist_stopover_dest.toLocaleString()}</td>
                    <td style={{ ...TD, color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{total.toLocaleString()}</td>
                    <td style={{ ...TD, whiteSpace: 'nowrap' }}>
                      <button onClick={() => openEdit(item)} style={BTN_EDIT}>Editar</button>
                      <button onClick={() => del(item)} style={BTN_DANGER}>Eliminar</button>
                    </td>
                  </tr>
                )
              })}
              {!items.length && <tr><td colSpan={6} style={{ ...TD, textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '30px' }}>Sin escalas configuradas</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── MAIN ─────────────────────────────────────────────────
export default function AdminRoutes({ token }) {
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

      {tab === 0 && <DestinosPanel token={token} />}
    </div>
  )
}
