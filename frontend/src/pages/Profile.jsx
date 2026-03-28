import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { LevelIcon, LEVEL_COLORS } from '../components/OceanIcons'
import {
  DiveMaskIcon, TrashIcon, ThermometerIcon, LeafIcon, PlaneIcon, TargetIcon,
  PencilIcon, CameraIcon, MapPinIcon, AtSignIcon, PhoneIcon, CheckIcon,
  WhatsAppIcon, InstagramIcon,
} from '../components/OceanIcons'

/* ─────────────────────────────────────────────
   AVATAR HELPERS
───────────────────────────────────────────── */
const PRESET_AVATARS = [
  'Plancton', 'Caballito de Mar', 'Tortuga Marina', 'Mantarraya', 'Ballena Azul',
]

function ProfileAvatar({ avatar, level, size = 36, className = '' }) {
  if (avatar && avatar.startsWith('http')) {
    return (
      <img
        src={avatar}
        alt="avatar"
        className={className}
        style={{ width: size, height: size, borderRadius: '12px', objectFit: 'cover' }}
      />
    )
  }
  const displayLevel = (avatar && PRESET_AVATARS.includes(avatar)) ? avatar : level
  return <LevelIcon level={displayLevel} size={size} />
}

/* ─────────────────────────────────────────────
   EDIT PROFILE MODAL
───────────────────────────────────────────── */
function EditProfileModal({ profile, onClose, onSaved }) {
  const { API } = useAuth()
  const [form, setForm] = useState({
    name:        profile.name        || '',
    avatar:      profile.avatar      || profile.level || 'Plancton',
    origin_city: profile.origin_city || '',
    bio:         profile.bio         || '',
    instagram:   profile.instagram   || '',
    whatsapp:    profile.whatsapp    || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [saved, setSaved]   = useState(false)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function handleSave() {
    const name = form.name.trim()
    if (name.length < 2) return setError('El nombre debe tener al menos 2 caracteres')
    if (form.bio.length > 160) return setError('La bio no puede superar 160 caracteres')

    setSaving(true)
    setError('')
    try {
      const res = await axios.put(`${API}/profile`, {
        name,
        avatar:      form.avatar,
        origin_city: form.origin_city.trim(),
        bio:         form.bio.trim(),
        instagram:   form.instagram.trim().replace(/^@/, ''),
        whatsapp:    form.whatsapp.trim(),
      })
      setSaved(true)
      setTimeout(() => {
        onSaved(res.data)
        onClose()
      }, 900)
    } catch (e) {
      setError(e.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: 'rgba(2,12,27,0.92)', backdropFilter: 'blur(10px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-[480px] rounded-t-3xl overflow-y-auto animate-slide-up"
        style={{
          maxHeight: '92vh',
          background: 'linear-gradient(180deg,#0d2137 0%,#0a1628 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderBottom: 'none',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 pb-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-ocean-cyan/60 text-xs font-bold uppercase tracking-widest mb-0.5">Tu perfil</p>
              <h3 className="text-white font-black text-xl flex items-center gap-2">
                Editar perfil <PencilIcon size={18} />
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-ocean-foam/30 text-xs py-1.5 px-3 rounded-xl"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Cancelar
            </button>
          </div>

          {/* ── AVATAR PICKER ── */}
          <div className="mb-5">
            <label className="text-xs text-ocean-foam/50 font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CameraIcon size={13} /> Avatar
            </label>
            <div className="flex gap-2 mb-3">
              {PRESET_AVATARS.map(lvl => {
                const color = LEVEL_COLORS[lvl] || '#48cae4'
                const isSelected = form.avatar === lvl
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => set('avatar', lvl)}
                    className="flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-all duration-150"
                    style={
                      isSelected
                        ? { background: `${color}20`, border: `1.5px solid ${color}60` }
                        : { background: 'rgba(255,255,255,0.04)', border: '1.5px solid transparent' }
                    }
                    title={lvl}
                  >
                    <LevelIcon level={lvl} size={24} />
                    {isSelected && (
                      <span style={{ color, fontSize: 9, fontWeight: 700 }}>
                        <CheckIcon size={10} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <input
              className="input-field text-xs"
              placeholder="O pega una URL de imagen (https://...)"
              value={form.avatar.startsWith('http') ? form.avatar : ''}
              onChange={e => set('avatar', e.target.value || profile.level)}
            />
          </div>

          {/* ── NOMBRE ── */}
          <div className="mb-4">
            <label className="text-xs text-ocean-foam/50 font-semibold uppercase tracking-wider mb-1.5 block">
              Nombre completo
            </label>
            <input
              className="input-field"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              maxLength={60}
              placeholder="Tu nombre de buceador"
            />
          </div>

          {/* ── BIO ── */}
          <div className="mb-4">
            <label className="text-xs text-ocean-foam/50 font-semibold uppercase tracking-wider mb-1.5 flex justify-between">
              <span>Bio corta</span>
              <span className={form.bio.length > 140 ? 'text-coral' : 'text-ocean-foam/30'}>
                {form.bio.length}/160
              </span>
            </label>
            <textarea
              className="input-field resize-none"
              rows={2}
              value={form.bio}
              onChange={e => set('bio', e.target.value)}
              maxLength={160}
              placeholder='Ej: "Buzo certificado PADI, amante del océano"'
              style={{ height: '64px' }}
            />
          </div>

          {/* ── CIUDAD DE ORIGEN ── */}
          <div className="mb-4">
            <label className="text-xs text-ocean-foam/50 font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MapPinIcon size={13} /> Ciudad de origen
            </label>
            <input
              className="input-field"
              value={form.origin_city}
              onChange={e => set('origin_city', e.target.value)}
              maxLength={80}
              placeholder="Ej: Bogotá, Medellín..."
              list="origin-cities"
            />
            <datalist id="origin-cities">
              {['Bogotá','Medellín','Cali','Miami','New York','Ciudad de México','Lima'].map(c => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          {/* ── REDES SOCIALES ── */}
          <div className="mb-4">
            <label className="text-xs text-ocean-foam/50 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AtSignIcon size={13} /> Redes sociales
            </label>
            <div className="space-y-2">
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#e1306c' }}
                >
                  <InstagramIcon size={16} />
                </span>
                <input
                  className="input-field pl-9"
                  value={form.instagram}
                  onChange={e => set('instagram', e.target.value.replace(/^@/, ''))}
                  maxLength={60}
                  placeholder="usuario (sin @)"
                />
              </div>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#25d366' }}
                >
                  <WhatsAppIcon size={16} />
                </span>
                <input
                  className="input-field pl-9"
                  value={form.whatsapp}
                  onChange={e => set('whatsapp', e.target.value)}
                  maxLength={20}
                  placeholder="+57 300 123 4567"
                  type="tel"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-2xl p-3 mb-4 text-sm text-coral text-center"
              style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)' }}
            >
              {error}
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="btn-primary w-full flex items-center justify-center gap-2 transition-all duration-300"
            style={saved ? { background: 'linear-gradient(135deg,#4ade80,#22c55e)', borderColor: '#4ade80' } : {}}
          >
            {saving ? (
              <span className="inline-block w-5 h-5 border-2 border-ocean-deep/40 border-t-ocean-deep rounded-full animate-spin" />
            ) : saved ? (
              <><CheckIcon size={18} /> ¡Guardado!</>
            ) : (
              <><CheckIcon size={18} /> Guardar cambios</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   DELETE TRIP MODAL
───────────────────────────────────────────── */
function DeleteTripModal({ trip, onConfirm, onCancel, loading }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-5"
      style={{ background: 'rgba(2,12,27,0.92)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 animate-scale-in"
        style={{ background: 'linear-gradient(180deg,#0d2137,#0a1628)', border: '1px solid rgba(255,107,107,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-5">
          <div className="flex justify-center mb-3 text-coral">
            <TrashIcon size={40} />
          </div>
          <h3 className="text-white font-black text-lg mb-1">¿Eliminar este viaje?</h3>
          <p className="text-ocean-foam/50 text-sm">
            {trip.origin} → {trip.destination}
          </p>
          <p className="text-ocean-foam/40 text-xs mt-1">{Math.round(trip.co2_total)} kg CO₂</p>
        </div>
        <div
          className="rounded-2xl p-3 mb-5 text-xs text-ocean-foam/50 text-center"
          style={{ background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.15)' }}
        >
          Se revertirán los 10 puntos y el CO₂ de tu historial. Las compensaciones no se ven afectadas.
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1 py-2.5 text-sm">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 text-sm rounded-2xl font-bold transition-all active:scale-95"
            style={{ background: 'rgba(255,107,107,0.15)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)' }}
          >
            {loading ? '...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

const LEVELS = ['Plancton', 'Caballito de Mar', 'Tortuga Marina', 'Mantarraya', 'Ballena Azul']

function StatCard({ Icon, label, value, sub }) {
  return (
    <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex justify-center mb-1 text-ocean-cyan/60"><Icon size={20} /></div>
      <p className="text-white font-black text-xl">{value}</p>
      <p className="text-ocean-foam/60 text-xs font-medium">{label}</p>
      {sub && <p className="text-ocean-foam/30 text-[10px] mt-0.5">{sub}</p>}
    </div>
  )
}

/* ─────────────────────────────────────────────
   MAIN PROFILE PAGE
───────────────────────────────────────────── */
export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tripToDelete, setTripToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const { API, logout, refreshUser } = useAuth()

  function loadProfile() {
    axios.get(`${API}/profile`)
      .then(res => setProfile(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadProfile() }, [])

  async function handleDeleteTrip() {
    if (!tripToDelete) return
    setDeleting(true)
    try {
      await axios.delete(`${API}/trips/${tripToDelete.id}`)
      setTripToDelete(null)
      refreshUser()
      loadProfile()
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
    }
  }

  function handleProfileSaved(updated) {
    setProfile(prev => ({ ...prev, ...updated }))
    refreshUser()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-ocean-cyan animate-pulse"><DiveMaskIcon size={48} /></div>
    </div>
  )
  if (!profile) return null

  const levelColor = LEVEL_COLORS[profile.level] || '#48cae4'
  const levelIdx   = LEVELS.indexOf(profile.level)
  const avatarLevel = (profile.avatar && PRESET_AVATARS.includes(profile.avatar))
    ? profile.avatar
    : profile.level

  return (
    <div className="px-5 pt-8 pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-ocean-cyan/70 text-xs font-semibold uppercase tracking-widest mb-1">Tu perfil</p>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            Buceador <DiveMaskIcon size={28} />
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 text-ocean-cyan/70 text-xs py-1.5 px-3 rounded-xl transition-all hover:text-ocean-cyan"
            style={{ border: '1px solid rgba(0,180,216,0.2)', background: 'rgba(0,180,216,0.06)' }}
          >
            <PencilIcon size={12} /> Editar
          </button>
          <button
            onClick={logout}
            className="text-ocean-foam/30 text-xs py-1.5 px-3 rounded-xl"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Salir
          </button>
        </div>
      </div>

      {/* Profile card */}
      <div className="rounded-3xl p-5 mb-5 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${levelColor}15 0%, rgba(2,12,27,0.8) 100%)`,
          border: `1px solid ${levelColor}30`,
          boxShadow: `0 8px 32px ${levelColor}10`,
        }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center animate-float flex-shrink-0"
            style={{ background: `${levelColor}15`, border: `1px solid ${levelColor}30` }}
          >
            <ProfileAvatar avatar={profile.avatar} level={profile.level} size={36} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-white">{profile.name}</h2>
            <p className="font-bold text-sm" style={{ color: levelColor }}>{profile.level}</p>
            {profile.bio ? (
              <p className="text-ocean-foam/50 text-xs mt-0.5 leading-relaxed">{profile.bio}</p>
            ) : (
              <p className="text-ocean-foam/30 text-xs mt-0.5 italic">
                Sin bio · <button className="underline" onClick={() => setShowEdit(true)}>agregar</button>
              </p>
            )}
          </div>
        </div>

        {/* City + social links */}
        {(profile.origin_city || profile.instagram || profile.whatsapp) && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {profile.origin_city && (
              <span className="inline-flex items-center gap-1 text-[11px] text-ocean-foam/50 px-2 py-1 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <MapPinIcon size={11} /> {profile.origin_city}
              </span>
            )}
            {profile.instagram && (
              <a
                href={`https://instagram.com/${profile.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: 'rgba(225,48,108,0.1)', color: '#e1306c' }}
              >
                <InstagramIcon size={11} /> @{profile.instagram}
              </a>
            )}
            {profile.whatsapp && (
              <a
                href={`https://wa.me/${profile.whatsapp.replace(/[^\d+]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: 'rgba(37,211,102,0.1)', color: '#25d366' }}
              >
                <WhatsAppIcon size={11} /> {profile.whatsapp}
              </a>
            )}
          </div>
        )}

        {/* Points & level progress */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-ocean-foam/50 font-medium">Progreso al siguiente nivel</span>
            <span className="text-sm font-black" style={{ color: levelColor }}>{profile.points} pts</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${profile.level_progress}%`,
                background: `linear-gradient(90deg, ${levelColor}80, ${levelColor})`,
                boxShadow: `0 0 12px ${levelColor}60`,
              }}
            />
          </div>
          {profile.next_level && (
            <p className="text-ocean-foam/30 text-[10px] mt-1 text-right flex items-center justify-end gap-1">
              Próximo nivel: {profile.next_level} <LevelIcon level={profile.next_level} size={12} />
            </p>
          )}
        </div>

        {/* Level journey */}
        <div className="flex items-center gap-1 mt-3">
          {LEVELS.map((l, i) => (
            <div key={l} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all"
                style={
                  i <= levelIdx
                    ? { background: levelColor, border: `1px solid ${levelColor}` }
                    : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {i <= levelIdx ? '✓' : <span className="text-[8px]">{i + 1}</span>}
              </div>
              {i < LEVELS.length - 1 && (
                <div className="w-full h-0.5 mt-2" style={{ background: i < levelIdx ? levelColor : 'rgba(255,255,255,0.08)' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard Icon={ThermometerIcon} label="CO₂ total"  value={`${Math.round(profile.total_co2)} kg`} />
        <StatCard Icon={LeafIcon}        label="Compensado" value={`${Math.round(profile.compensated_co2)} kg`} />
        <StatCard Icon={PlaneIcon}       label="Viajes"     value={profile.trips_count} />
        <StatCard Icon={TargetIcon}      label="Misiones"   value={profile.missions_count} sub="completadas" />
      </div>

      {/* CO2 balance card */}
      <div className="card-glow mb-5">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-bold text-white">Balance CO₂</p>
          <span className="text-sm font-black gradient-text">{profile.compensation_pct}%</span>
        </div>
        <div className="progress-bar h-4 mb-2">
          <div className="progress-fill" style={{ width: `${profile.compensation_pct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-ocean-foam/40">
          <span>0 kg</span>
          <span>{Math.round(profile.total_co2)} kg</span>
        </div>
      </div>

      {/* Recent missions */}
      {profile.completed_missions?.length > 0 && (
        <div>
          <h3 className="text-xs text-ocean-foam/50 font-semibold uppercase tracking-wider mb-3">
            Misiones completadas
          </h3>
          <div className="space-y-2">
            {profile.completed_missions.slice(0, 5).map((m, i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-lg">{m.icon}</span>
                <span className="text-sm text-white/70 flex-1">{m.name}</span>
                <span className="text-xs font-bold text-ocean-cyan">+{m.points}pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent trips */}
      {profile.recent_trips?.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs text-ocean-foam/50 font-semibold uppercase tracking-wider mb-3">
            Viajes recientes
          </h3>
          <div className="space-y-2">
            {profile.recent_trips.map((t, i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-ocean-cyan/50"><PlaneIcon size={14} /></span>
                <span className="text-xs text-white/60 flex-1">{t.origin} → {t.destination}</span>
                <span className="text-xs font-bold text-ocean-foam/60">{Math.round(t.co2_total)} kg CO₂</span>
                <button
                  onClick={() => setTripToDelete(t)}
                  className="text-ocean-foam/20 hover:text-coral transition-colors ml-1 flex-shrink-0"
                  title="Eliminar viaje"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {tripToDelete && (
        <DeleteTripModal
          trip={tripToDelete}
          loading={deleting}
          onConfirm={handleDeleteTrip}
          onCancel={() => setTripToDelete(null)}
        />
      )}

      {showEdit && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onSaved={handleProfileSaved}
        />
      )}
    </div>
  )
}
