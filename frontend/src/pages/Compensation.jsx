import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const OPTION_DETAILS = {
  corales: { gradient: 'from-pink-500/20 to-rose-400/10', border: 'rgba(244,114,182,0.3)', glow: 'rgba(244,114,182,0.15)' },
  manglares: { gradient: 'from-emerald-500/20 to-green-400/10', border: 'rgba(52,211,153,0.3)', glow: 'rgba(52,211,153,0.15)' },
  limpieza: { gradient: 'from-blue-500/20 to-cyan-400/10', border: 'rgba(96,165,250,0.3)', glow: 'rgba(96,165,250,0.15)' },
  voluntariado: { gradient: 'from-purple-500/20 to-violet-400/10', border: 'rgba(167,139,250,0.3)', glow: 'rgba(167,139,250,0.15)' },
}

function formatCOP(amount) {
  if (amount === 0) return 'Gratis'
  return `$${amount.toLocaleString('es-CO')} COP`
}

export default function Compensation() {
  const [options, setOptions] = useState([])
  const [selected, setSelected] = useState(null)
  const [units, setUnits] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [stats, setStats] = useState(null)
  const { API, user, refreshUser } = useAuth()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [optRes, profRes] = await Promise.all([
        axios.get(`${API}/compensations/options`),
        axios.get(`${API}/profile`),
      ])
      setOptions(optRes.data)
      setStats(profRes.data)
    } catch (e) {
      console.error(e)
    }
  }

  async function handleCompensate() {
    if (!selected) return
    setLoading(true)
    try {
      const res = await axios.post(`${API}/compensations`, { type: selected.id, units })
      setSuccess(res.data)
      refreshUser()
      fetchData()
      setTimeout(() => setSuccess(null), 4000)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const compensationPct = stats
    ? (stats.total_co2 > 0 ? Math.min(100, Math.round((stats.compensated_co2 / stats.total_co2) * 100)) : 0)
    : 0

  const co2ToCompensate = selected ? selected.co2_per_unit * units : 0
  const cost = selected ? selected.cost_per_unit * units : 0
  const pts = selected ? selected.points_per_unit * units : 0

  return (
    <div className="px-5 pt-8 pb-6 animate-fade-in">
      <div className="mb-6">
        <p className="text-ocean-cyan/70 text-xs font-semibold uppercase tracking-widest mb-1">Restaura el balance</p>
        <h1 className="text-3xl font-black text-white">Compensar <span className="text-2xl">🌱</span></h1>
      </div>

      {/* Progress toward 100% */}
      <div className="card-glow mb-5">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="font-bold text-white">Tu progreso de compensación</p>
            <p className="text-ocean-foam/40 text-xs mt-0.5">
              {stats ? `${Math.round(stats.compensated_co2)} kg compensados de ${Math.round(stats.total_co2)} kg totales` : '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black gradient-text">{compensationPct}%</p>
          </div>
        </div>
        <div className="progress-bar h-4">
          <div
            className="progress-fill h-full"
            style={{ width: `${compensationPct}%` }}
          />
        </div>
        {compensationPct >= 100 && (
          <div className="text-center mt-3 text-green-400 font-bold text-sm animate-pulse-glow">
            🌊 ¡Huella completamente compensada! ¡Eres un guardián del océano!
          </div>
        )}
      </div>

      {/* Success toast */}
      {success && (
        <div
          className="rounded-2xl p-4 mb-4 flex items-center gap-3 animate-scale-in"
          style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' }}
        >
          <span className="text-2xl">🎉</span>
          <div>
            <p className="text-green-400 font-bold text-sm">¡Compensación registrada!</p>
            <p className="text-ocean-foam/60 text-xs">
              +{success.points_earned} pts · -{success.co2_compensated} kg CO₂ · Nuevo progreso: {success.compensation_pct}%
            </p>
          </div>
        </div>
      )}

      {/* Options */}
      <h3 className="text-xs text-ocean-foam/50 font-semibold uppercase tracking-wider mb-3">Elige cómo compensar</h3>
      <div className="space-y-3 mb-5">
        {options.map(opt => {
          const style = OPTION_DETAILS[opt.id] || OPTION_DETAILS.corales
          const isSelected = selected?.id === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => { setSelected(opt); setUnits(1) }}
              className="w-full text-left rounded-2xl p-4 transition-all duration-200 active:scale-[0.98]"
              style={
                isSelected
                  ? { background: `linear-gradient(135deg, ${style.gradient})`, border: `1px solid ${style.border}`, boxShadow: `0 4px 20px ${style.glow}` }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }
              }
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{opt.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-white text-sm">{opt.name}</p>
                    <span className="badge text-xs" style={{ background: 'rgba(255,209,102,0.1)', color: '#ffd166' }}>
                      +{opt.points_per_unit}pts/{opt.unit}
                    </span>
                  </div>
                  <p className="text-ocean-foam/50 text-xs mt-0.5">{opt.organization}</p>
                  <p className="text-ocean-foam/40 text-xs mt-1 leading-relaxed">{opt.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs" style={{ color: '#4ade80' }}>
                      -{opt.co2_per_unit} kg CO₂/{opt.unit}
                    </span>
                    <span className="text-xs text-ocean-foam/50">
                      {formatCOP(opt.cost_per_unit)}/{opt.unit}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Units selector & CTA */}
      {selected && (
        <div className="card-glow space-y-4 animate-scale-in">
          <div>
            <p className="text-sm font-semibold text-white mb-2">
              ¿Cuántos {selected.unit}s quieres {selected.id === 'voluntariado' ? 'participar' : 'plantar/apoyar'}?
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setUnits(Math.max(1, units - 1))}
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold"
                style={{ background: 'rgba(0,180,216,0.15)', color: '#00b4d8' }}
              >−</button>
              <div className="flex-1 text-center">
                <span className="text-3xl font-black gradient-text">{units}</span>
                <p className="text-ocean-foam/40 text-xs">{selected.unit}(s)</p>
              </div>
              <button
                onClick={() => setUnits(Math.min(100, units + 1))}
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold"
                style={{ background: 'rgba(0,180,216,0.15)', color: '#00b4d8' }}
              >+</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl py-2" style={{ background: 'rgba(0,180,216,0.08)' }}>
              <p className="text-ocean-cyan font-bold text-sm">-{co2ToCompensate} kg</p>
              <p className="text-ocean-foam/40 text-xs">CO₂</p>
            </div>
            <div className="rounded-xl py-2" style={{ background: 'rgba(255,209,102,0.08)' }}>
              <p className="text-sand font-bold text-sm">+{pts} pts</p>
              <p className="text-ocean-foam/40 text-xs">Puntos</p>
            </div>
            <div className="rounded-xl py-2" style={{ background: 'rgba(52,211,153,0.08)' }}>
              <p className="text-green-400 font-bold text-sm">{formatCOP(cost)}</p>
              <p className="text-ocean-foam/40 text-xs">Costo</p>
            </div>
          </div>

          <button
            onClick={handleCompensate}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-ocean-deep/40 border-t-ocean-deep rounded-full animate-spin" />
            ) : (
              <>{selected.icon} Confirmar compensación</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
