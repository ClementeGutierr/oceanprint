import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE, authCfg } from './AdminApp'
import AdminSelect from './AdminSelect'
import {
  CalendarIcon, BrainIcon, CheckIcon, SparklesIcon, AwardIcon,
  PlusIcon, TrashIcon, PencilIcon, UsersIcon, TrophyIcon,
} from '../../components/OceanIcons'

const TYPES = [
  { value: 'kahoot',            label: 'Kahoot',            Icon: BrainIcon,    color: '#a78bfa' },
  { value: 'accion_verificada', label: 'Acción verificada', Icon: CheckIcon,    color: '#4ade80' },
  { value: 'bonus',             label: 'Bonus',             Icon: SparklesIcon, color: '#fbbf24' },
]

const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }
const INPUT = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '9px 12px', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box', colorScheme: 'dark', width: '100%' }
const TH = { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }
const TD = { padding: '12px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(255,255,255,0.04)' }

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function typeMeta(t) {
  return TYPES.find(x => x.value === t) || TYPES[2]
}

/* ─────────────────────────────────────────────
   FORM CREAR / EDITAR DINÁMICA
───────────────────────────────────────────── */
function DynamicForm({ token, expeditionId, dynamic, onClose, onSaved }) {
  const isEdit = !!dynamic
  const [form, setForm] = useState({
    name:        dynamic?.name        || '',
    description: dynamic?.description || '',
    points:      dynamic?.points ?? 50,
    type:        dynamic?.type        || 'bonus',
    date:        dynamic?.date        || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Nombre requerido')
    setSaving(true); setError('')
    try {
      const body = {
        name:        form.name.trim(),
        description: form.description.trim(),
        points:      parseInt(form.points) || 0,
        type:        form.type,
        date:        form.date || null,
      }
      if (isEdit) {
        await axios.put(`${API_BASE}/admin/dynamics/${dynamic.id}`, body, authCfg(token))
      } else {
        await axios.post(`${API_BASE}/admin/dynamics`, { ...body, expedition_id: expeditionId }, authCfg(token))
      }
      onSaved()
      onClose()
    } catch (e) {
      setError(e.response?.data?.error || 'Error guardando')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '20px' }}>
      <div style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '520px', marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: 'white', fontWeight: 800, fontSize: '18px', margin: 0 }}>
            {isEdit ? 'Editar dinámica' : 'Nueva dinámica'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '24px', lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'block' }}>Nombre</label>
            <input style={INPUT} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder='Ej: "Kahoot Noche 1"' required />
          </div>

          <div>
            <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'block' }}>Descripción</label>
            <textarea style={{ ...INPUT, minHeight: '60px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder='Detalles de la dinámica' />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'block' }}>Tipo</label>
              <AdminSelect
                value={form.type}
                onChange={v => setForm({ ...form, type: v })}
                options={TYPES.map(t => ({ value: t.value, label: t.label }))}
              />
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'block' }}>Puntos</label>
              <input type="number" min="0" style={INPUT} value={form.points} onChange={e => setForm({ ...form, points: e.target.value })} />
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'block' }}>Fecha</label>
              <input type="date" style={INPUT} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>

          {error && (
            <div style={{ color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '10px', padding: '8px 12px', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1 }}>
              {saving ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear dinámica')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   PANEL DE ASIGNACIÓN DE PUNTOS
───────────────────────────────────────────── */
function AssignmentPanel({ token, dynamic, onClose, onSaved }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    setLoading(true)
    axios.get(`${API_BASE}/admin/dynamics/${dynamic.id}/users`, authCfg(token))
      .then(r => setUsers(r.data.users.map(u => ({
        ...u,
        _participated: u.participated === 1,
        _points: u.points_awarded ?? (u.participated === 1 ? dynamic.points : 0),
        _notes: u.notes || '',
      }))))
      .catch(e => setError(e.response?.data?.error || 'Error cargando participantes'))
      .finally(() => setLoading(false))
  }, [token, dynamic.id])

  function updateUser(uid, patch) {
    setUsers(us => us.map(u => u.user_id === uid ? { ...u, ...patch } : u))
  }

  function fillAllParticipated(value) {
    setUsers(us => us.map(u => ({
      ...u,
      _participated: value,
      _points: value ? dynamic.points : 0,
    })))
  }

  async function handleSave() {
    setSaving(true); setError('')
    try {
      const assignments = users.map(u => ({
        user_id:      u.user_id,
        participated: u._participated,
        points:       u._participated ? (parseInt(u._points) || 0) : 0,
        notes:        u._notes,
      }))
      const r = await axios.post(`${API_BASE}/admin/dynamics/${dynamic.id}/assign`, { assignments }, authCfg(token))
      setUsers(r.data.users.map(u => ({
        ...u,
        _participated: u.participated === 1,
        _points: u.points_awarded ?? 0,
        _notes: u.notes || '',
      })))
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 1500)
      onSaved?.()
    } catch (e) {
      setError(e.response?.data?.error || 'Error guardando asignaciones')
    } finally {
      setSaving(false)
    }
  }

  const meta = typeMeta(dynamic.type)
  const Icon = meta.Icon

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '20px' }}>
      <div style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '760px', marginTop: '20px', marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${meta.color}20`, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={22} />
            </span>
            <div>
              <h3 style={{ color: 'white', fontWeight: 800, fontSize: '18px', margin: 0 }}>{dynamic.name}</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '2px 0 0' }}>
                {meta.label} · {dynamic.points} pts base · {fmtDate(dynamic.date)}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '24px', lineHeight: 1 }}>×</button>
        </div>

        {dynamic.description && (
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '16px', marginLeft: '52px' }}>{dynamic.description}</p>
        )}

        {/* Quick fill */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '6px' }}>
            Marcar todos:
          </span>
          <button onClick={() => fillAllParticipated(true)} style={{ padding: '5px 10px', borderRadius: '8px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            ✓ Participaron
          </button>
          <button onClick={() => fillAllParticipated(false)} style={{ padding: '5px 10px', borderRadius: '8px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            ✗ No participaron
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '20px' }}>Cargando participantes...</p>
        ) : users.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
            No hay miembros en esta expedición todavía.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={TH}>Participante</th>
                  <th style={{ ...TH, textAlign: 'center', width: '90px' }}>Participó</th>
                  <th style={{ ...TH, textAlign: 'center', width: '110px' }}>Puntos</th>
                  <th style={TH}>Notas</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.user_id}>
                    <td style={TD}>
                      <div style={{ fontWeight: 600 }}>{u.display_name || u.name}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{u.email}</div>
                    </td>
                    <td style={{ ...TD, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={u._participated}
                        onChange={e => updateUser(u.user_id, {
                          _participated: e.target.checked,
                          _points: e.target.checked ? (u._points || dynamic.points) : 0,
                        })}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ ...TD, textAlign: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        value={u._points}
                        disabled={!u._participated}
                        onChange={e => updateUser(u.user_id, { _points: e.target.value })}
                        style={{ ...INPUT, width: '90px', textAlign: 'center', opacity: u._participated ? 1 : 0.4 }}
                      />
                    </td>
                    <td style={TD}>
                      <input
                        type="text"
                        placeholder="Opcional"
                        value={u._notes}
                        onChange={e => updateUser(u.user_id, { _notes: e.target.value })}
                        style={{ ...INPUT, fontSize: '12px' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && (
          <div style={{ color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', marginTop: '14px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '18px', alignItems: 'center' }}>
          {savedFlash && <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: 600 }}>✓ Guardado</span>}
          <div style={{ flex: 1 }} />
          <button onClick={onClose}
            style={{ padding: '10px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            Cerrar
          </button>
          <button onClick={handleSave} disabled={saving || loading} className="btn-primary">
            {saving ? 'Guardando...' : 'Guardar asignaciones'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */
export default function AdminDynamics({ token }) {
  const [expeditions, setExpeditions] = useState([])
  const [expId, setExpId] = useState('')
  const [dynamics, setDynamics] = useState([])
  const [loading, setLoading] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [assigning, setAssigning] = useState(null)

  useEffect(() => {
    axios.get(`${API_BASE}/admin/expeditions`, authCfg(token))
      .then(r => {
        setExpeditions(r.data)
        if (r.data.length && !expId) setExpId(String(r.data[0].id))
      })
      .catch(console.error)
  }, [token])

  function reload() {
    if (!expId) return
    setLoading(true)
    axios.get(`${API_BASE}/admin/dynamics?expedition_id=${expId}`, authCfg(token))
      .then(r => setDynamics(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [expId])

  async function handleDelete(d) {
    if (!confirm(`¿Eliminar dinámica "${d.name}"?\n\nEsto revertirá los puntos otorgados a los usuarios.`)) return
    try {
      await axios.delete(`${API_BASE}/admin/dynamics/${d.id}`, authCfg(token))
      reload()
    } catch (e) {
      alert(e.response?.data?.error || 'Error al eliminar')
    }
  }

  const expedition = expeditions.find(e => String(e.id) === String(expId))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header / expedition selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'block' }}>
            Expedición
          </label>
          <AdminSelect
            value={expId}
            onChange={setExpId}
            options={expeditions.map(e => ({ value: String(e.id), label: `${e.name} · ${e.member_count || 0} miembros` }))}
          />
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          disabled={!expId}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <PlusIcon size={16} /> Nueva dinámica
        </button>
      </div>

      {/* Dynamics list */}
      {!expId ? (
        <div style={{ ...CARD, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
          Crea una expedición primero para añadir dinámicas.
        </div>
      ) : loading ? (
        <div style={{ ...CARD, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Cargando...</div>
      ) : dynamics.length === 0 ? (
        <div style={{ ...CARD, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
          Aún no hay dinámicas para "{expedition?.name}".
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {dynamics.map(d => {
            const meta = typeMeta(d.type)
            const Icon = meta.Icon
            return (
              <div key={d.id} style={{ ...CARD, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    background: `${meta.color}20`, color: meta.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={22} />
                  </div>

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h4 style={{ color: 'white', fontWeight: 700, fontSize: '15px', margin: 0 }}>{d.name}</h4>
                      <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 8px', borderRadius: '999px', background: `${meta.color}25`, color: meta.color }}>
                        {meta.label}
                      </span>
                    </div>
                    {d.description && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '4px 0 0' }}>{d.description}</p>}
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CalendarIcon size={11} /> {fmtDate(d.date || d.created_at)}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><AwardIcon size={11} /> {d.points} pts base</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><UsersIcon size={11} /> {d.participants_count || 0} participantes</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><TrophyIcon size={11} /> {d.total_points_awarded || 0} pts otorgados</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button onClick={() => setAssigning(d)}
                      style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(0,180,216,0.15)', border: '1px solid rgba(0,180,216,0.3)', color: '#48cae4', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                      Asignar puntos
                    </button>
                    <button onClick={() => { setEditing(d); setShowForm(true) }}
                      style={{ padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                      <PencilIcon size={14} />
                    </button>
                    <button onClick={() => handleDelete(d)}
                      style={{ padding: '8px', borderRadius: '10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', cursor: 'pointer' }}>
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <DynamicForm
          token={token}
          expeditionId={parseInt(expId)}
          dynamic={editing}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSaved={reload}
        />
      )}

      {assigning && (
        <AssignmentPanel
          token={token}
          dynamic={assigning}
          onClose={() => setAssigning(null)}
          onSaved={reload}
        />
      )}
    </div>
  )
}
