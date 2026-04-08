import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import {
  PlaneIcon, ShipIcon, CarIcon, StarIcon, LeafIcon, RefreshIcon, ThermometerIcon, TrophyIcon,
} from '../components/OceanIcons'

const BREAKDOWN_ICONS = { flight: PlaneIcon, sea: ShipIcon, land: CarIcon }
const LEVEL_LABELS = { flight: 'Vuelo (ida y vuelta)', sea: 'Transporte marítimo', land: 'Transporte terrestre' }
const LEVEL_COLORS = {
  flight: 'from-blue-500 to-cyan-400',
  sea: 'from-teal-500 to-emerald-400',
  land: 'from-amber-500 to-orange-400',
}

function formatCO2(kg) {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} t`
  return `${Math.round(kg)} kg`
}

function getCarbonContext(kg) {
  if (kg < 100) return { label: 'Huella muy baja', Icon: LeafIcon, color: '#4ade80', desc: 'Equivale a cargar tu smartphone 12,000 veces' }
  if (kg < 300) return { label: 'Huella moderada', Icon: ThermometerIcon, color: '#fbbf24', desc: `Equivale a ${Math.round(kg / 21)} días de conducir un auto promedio` }
  if (kg < 600) return { label: 'Huella alta', Icon: ThermometerIcon, color: '#fb923c', desc: `Equivale a ${Math.round(kg / 0.5)} bolsas plásticas en el océano` }
  return { label: 'Huella muy alta', Icon: ThermometerIcon, color: '#f87171', desc: `Equivale a ${(kg / 1000 * 0.5).toFixed(1)} toneladas de coral dañado` }
}

export default function Results() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [animated, setAnimated] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { API, refreshUser } = useAuth()

  useEffect(() => {
    if (!state?.result) navigate('/calculator')
    setTimeout(() => setAnimated(true), 100)
  }, [])

  async function handleDeleteTrip() {
    setDeleting(true)
    try {
      await axios.delete(`${API}/trips/${state.result.trip_id}`)
      refreshUser()
      navigate('/calculator')
    } catch (e) {
      console.error(e)
      setDeleting(false)
    }
  }

  if (!state?.result) return null

  const { result } = state
  const { co2, breakdown_pct, flight_distance_km, points_earned } = result
  const context = getCarbonContext(co2.total)

  const bars = [
    { key: 'flight', value: co2.flight, pct: breakdown_pct.flight },
    { key: 'sea', value: co2.sea, pct: breakdown_pct.sea },
    { key: 'land', value: co2.land, pct: breakdown_pct.land },
  ].filter(b => b.value > 0)

  return (
    <div className="px-5 pt-8 pb-6 animate-fade-in">
      {/* Header */}
      <button onClick={() => navigate('/calculator')} className="flex items-center gap-2 text-ocean-cyan/60 text-sm mb-6">
        ← Nuevo cálculo
      </button>

      <div className="text-center mb-6">
        <p className="text-ocean-cyan/70 text-xs font-semibold uppercase tracking-widest mb-2">Tu huella en</p>
        <h2 className="text-2xl font-black text-white mb-1">
          {result.origin} → {result.destination}
        </h2>
        <p className="text-ocean-foam/40 text-xs">{flight_distance_km?.toLocaleString()} km de vuelo (ida y vuelta)</p>
      </div>

      {/* Total CO2 - Hero card */}
      <div
        className="rounded-3xl p-6 mb-5 text-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(0,119,182,0.3) 0%, rgba(0,180,216,0.2) 100%)',
          border: '1px solid rgba(0,180,216,0.3)',
          boxShadow: '0 8px 40px rgba(0,180,216,0.15)',
        }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,180,216,0.5), transparent)' }} />

        <p className="text-ocean-foam/60 text-xs font-semibold uppercase tracking-widest mb-2">Total CO₂ emitido</p>
        <div
          className="text-6xl font-black gradient-text mb-1"
          style={{ transition: 'all 1s ease', transform: animated ? 'scale(1)' : 'scale(0.5)', opacity: animated ? 1 : 0 }}
        >
          {formatCO2(co2.total)}
        </div>

        <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: `${context.color}20`, color: context.color, border: `1px solid ${context.color}40` }}>
          <context.Icon size={13} /> {context.label}
        </div>
        <p className="text-ocean-foam/40 text-xs mt-2">{context.desc}</p>
      </div>

      {/* Breakdown */}
      <div className="card mb-5">
        <h3 className="text-sm font-bold text-ocean-foam/70 uppercase tracking-wider mb-4">Desglose de emisiones</h3>
        <div className="space-y-4">
          {bars.map(({ key, value, pct }) => {
            const BarIcon = BREAKDOWN_ICONS[key]
            return (
              <div key={key}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <BarIcon size={18} className="text-ocean-cyan/70" />
                    <span className="text-sm text-white/80">{LEVEL_LABELS[key]}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-ocean-cyan">{formatCO2(value)}</span>
                    <span className="text-xs text-ocean-foam/40 ml-1">({pct}%)</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: animated ? `${pct}%` : '0%',
                      transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Points earned */}
      <div
        className="rounded-2xl p-4 mb-3 flex items-center gap-3"
        style={{
          background: 'rgba(72,202,228,0.08)',
          border: '1px solid rgba(72,202,228,0.2)',
        }}
      >
        <div className="animate-float text-yellow-400">
          <StarIcon size={32} />
        </div>
        <div>
          <p className="text-ocean-cyan font-bold">+{points_earned} puntos ganados</p>
          <p className="text-ocean-foam/50 text-xs">Por calcular tu huella de carbono</p>
        </div>
      </div>

      {/* Mission completion banner */}
      {result.mission_completed && (
        <div
          className="rounded-2xl p-4 mb-5 flex items-center gap-3 animate-scale-in"
          style={{
            background: 'rgba(167,139,250,0.1)',
            border: '1px solid rgba(167,139,250,0.3)',
          }}
        >
          <div className="flex-shrink-0" style={{ color: '#c4b5fd', display: 'inline-flex' }}><TrophyIcon size={28} /></div>
          <div>
            <p className="text-purple-300 font-bold text-sm">¡Misión completada!</p>
            <p className="text-white font-semibold text-sm">{result.mission_completed.name}</p>
            <p className="text-ocean-foam/50 text-xs">+{result.mission_completed.points} puntos de bonificación</p>
          </div>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="space-y-3">
        <button onClick={() => navigate('/compensation')} className="btn-primary w-full flex items-center justify-center gap-2">
          <LeafIcon size={18} /> Compensar mi huella
        </button>
        <button onClick={() => navigate('/calculator')} className="btn-secondary w-full flex items-center justify-center gap-2">
          <RefreshIcon size={18} /> Calcular otro viaje
        </button>

        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="w-full text-center text-xs py-2 transition-colors"
            style={{ color: 'rgba(144,224,239,0.25)' }}
          >
            Eliminar este registro
          </button>
        ) : (
          <div
            className="rounded-2xl p-4 animate-scale-in"
            style={{ background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.2)' }}
          >
            <p className="text-white text-sm font-semibold text-center mb-1">¿Eliminar este viaje?</p>
            <p className="text-ocean-foam/40 text-xs text-center mb-4">
              Se revertirán los puntos y el CO₂ de tu historial
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="btn-secondary flex-1 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteTrip}
                disabled={deleting}
                className="flex-1 py-2 text-sm rounded-2xl font-bold active:scale-95 transition-all"
                style={{ background: 'rgba(255,107,107,0.15)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)' }}
              >
                {deleting ? '...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
