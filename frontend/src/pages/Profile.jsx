import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { LevelIcon, LEVEL_COLORS } from '../components/OceanIcons'

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
          <div className="text-4xl mb-3">🗑️</div>
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

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="text-xl mb-1">{icon}</div>
      <p className="text-white font-black text-xl">{value}</p>
      <p className="text-ocean-foam/60 text-xs font-medium">{label}</p>
      {sub && <p className="text-ocean-foam/30 text-[10px] mt-0.5">{sub}</p>}
    </div>
  )
}

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tripToDelete, setTripToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
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

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-ocean-cyan animate-pulse text-4xl">🤿</div>
    </div>
  )
  if (!profile) return null

  const levelColor = LEVEL_COLORS[profile.level] || '#48cae4'
  const levelIdx = LEVELS.indexOf(profile.level)

  return (
    <div className="px-5 pt-8 pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-ocean-cyan/70 text-xs font-semibold uppercase tracking-widest mb-1">Tu perfil</p>
          <h1 className="text-3xl font-black text-white">Buceador <span className="text-2xl">🤿</span></h1>
        </div>
        <button
          onClick={logout}
          className="text-ocean-foam/30 text-xs py-1.5 px-3 rounded-xl"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          Salir
        </button>
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
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl animate-float"
            style={{ background: `${levelColor}15`, border: `1px solid ${levelColor}30` }}
          >
            <LevelIcon level={profile.level} size={36} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">{profile.name}</h2>
            <p className="font-bold text-sm" style={{ color: levelColor }}>{profile.level}</p>
            <p className="text-ocean-foam/40 text-xs">{profile.email}</p>
          </div>
        </div>

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
            <p className="text-ocean-foam/30 text-[10px] mt-1 text-right">
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
        <StatCard icon="🌡️" label="CO₂ total" value={`${Math.round(profile.total_co2)} kg`} />
        <StatCard icon="🌱" label="Compensado" value={`${Math.round(profile.compensated_co2)} kg`} />
        <StatCard icon="✈️" label="Viajes" value={profile.trips_count} />
        <StatCard icon="🎯" label="Misiones" value={profile.missions_count} sub="completadas" />
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
                <span className="text-sm">✈️</span>
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

      {tripToDelete && (
        <DeleteTripModal
          trip={tripToDelete}
          loading={deleting}
          onConfirm={handleDeleteTrip}
          onCancel={() => setTripToDelete(null)}
        />
      )}
    </div>
  )
}
