import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const LEVEL_ICONS = { flight: '✈️', sea: '🚢', land: '🚗' }
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
  if (kg < 100) return { label: 'Huella muy baja 🌿', color: '#4ade80', desc: 'Equivale a cargar tu smartphone 12,000 veces' }
  if (kg < 300) return { label: 'Huella moderada 🟡', color: '#fbbf24', desc: `Equivale a ${Math.round(kg / 21)} días de conducir un auto promedio` }
  if (kg < 600) return { label: 'Huella alta ⚠️', color: '#fb923c', desc: `Equivale a ${Math.round(kg / 0.5)} bolsas plásticas en el océano` }
  return { label: 'Huella muy alta 🔴', color: '#f87171', desc: `Equivale a ${(kg / 1000 * 0.5).toFixed(1)} toneladas de coral dañado` }
}

export default function Results() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    if (!state?.result) navigate('/calculator')
    setTimeout(() => setAnimated(true), 100)
  }, [])

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
          {context.label}
        </div>
        <p className="text-ocean-foam/40 text-xs mt-2">{context.desc}</p>
      </div>

      {/* Breakdown */}
      <div className="card mb-5">
        <h3 className="text-sm font-bold text-ocean-foam/70 uppercase tracking-wider mb-4">Desglose de emisiones</h3>
        <div className="space-y-4">
          {bars.map(({ key, value, pct }) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{LEVEL_ICONS[key]}</span>
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
          ))}
        </div>
      </div>

      {/* Points earned */}
      <div
        className="rounded-2xl p-4 mb-5 flex items-center gap-3"
        style={{
          background: 'rgba(72,202,228,0.08)',
          border: '1px solid rgba(72,202,228,0.2)',
        }}
      >
        <div className="text-3xl animate-float">⭐</div>
        <div>
          <p className="text-ocean-cyan font-bold">+{points_earned} puntos ganados</p>
          <p className="text-ocean-foam/50 text-xs">Por calcular tu huella de carbono</p>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="space-y-3">
        <button onClick={() => navigate('/compensation')} className="btn-primary w-full">
          🌱 Compensar mi huella
        </button>
        <button onClick={() => navigate('/calculator')} className="btn-secondary w-full">
          🔄 Calcular otro viaje
        </button>
      </div>
    </div>
  )
}
