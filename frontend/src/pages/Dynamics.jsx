import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import {
  CalendarIcon, AwardIcon, ZapIcon, BrainIcon, CheckIcon, TrophyIcon,
  OceanWaveIcon, SparklesIcon,
} from '../components/OceanIcons'

const TYPE_META = {
  kahoot:            { label: 'Kahoot',           Icon: BrainIcon,    color: '#a78bfa' },
  accion_verificada: { label: 'Acción verificada', Icon: CheckIcon,    color: '#4ade80' },
  bonus:             { label: 'Bonus',            Icon: SparklesIcon, color: '#fbbf24' },
}

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Dynamics() {
  const { API } = useAuth()
  const [data, setData] = useState({ has_active: false, expedition: null, dynamics: [], total_points: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    axios.get(`${API}/dynamics`)
      .then(r => { if (!cancelled) setData(r.data) })
      .catch(e => { if (!cancelled) setError(e.response?.data?.error || 'Error cargando dinámicas') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [API])

  if (loading) {
    return (
      <div className="px-5 py-6 max-w-2xl mx-auto">
        <p className="text-ocean-foam/40 text-sm">Cargando dinámicas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-5 py-6 max-w-2xl mx-auto">
        <div className="rounded-2xl p-4 text-coral text-sm" style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)' }}>
          {error}
        </div>
      </div>
    )
  }

  if (!data.has_active) {
    return (
      <div className="px-5 py-6 max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="flex justify-center text-ocean-cyan mb-3">
            <CalendarIcon size={40} />
          </div>
          <h1 className="text-white font-black text-2xl">Dinámicas</h1>
          <p className="text-ocean-foam/40 text-sm mt-1">Actividades de tu expedición</p>
        </div>
        <div
          className="rounded-3xl p-6 text-center"
          style={{ background: 'rgba(0,180,216,0.05)', border: '1px solid rgba(0,180,216,0.15)' }}
        >
          <div className="flex justify-center text-ocean-cyan/60 mb-3">
            <OceanWaveIcon size={36} />
          </div>
          <p className="text-white font-semibold text-base mb-2">Aún no tienes una expedición activa</p>
          <p className="text-ocean-foam/50 text-sm leading-relaxed">
            Únete a una expedición para participar en sus dinámicas (kahoots, acciones verificadas y bonus) y ganar puntos extra.
          </p>
        </div>
      </div>
    )
  }

  const { expedition, dynamics, total_points } = data

  return (
    <div className="px-5 py-6 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <p className="text-ocean-cyan/60 text-[11px] font-bold uppercase tracking-widest mb-1">Tu expedición</p>
        <h1 className="text-white font-black text-2xl flex items-center gap-2">
          <CalendarIcon size={24} /> Dinámicas
        </h1>
        <p className="text-ocean-foam/50 text-sm mt-1">
          {expedition.name} · {fmtDate(expedition.start_date)} → {fmtDate(expedition.end_date)}
        </p>
      </div>

      {/* Total points card */}
      <div
        className="rounded-3xl p-5 mb-5 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(167,139,250,0.08))', border: '1px solid rgba(251,191,36,0.2)' }}
      >
        <div>
          <p className="text-[11px] text-ocean-foam/50 font-bold uppercase tracking-widest mb-1">Puntos de dinámicas</p>
          <p className="text-white font-black text-3xl flex items-center gap-2">
            <TrophyIcon size={26} /> {total_points}
          </p>
        </div>
        <div className="text-yellow-300">
          <ZapIcon size={36} />
        </div>
      </div>

      {/* Dynamics list */}
      {dynamics.length === 0 ? (
        <div className="rounded-2xl p-5 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-ocean-foam/50 text-sm">
            Todavía no hay dinámicas registradas para esta expedición.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {dynamics.map(d => {
            const meta = TYPE_META[d.type] || TYPE_META.bonus
            const Icon = meta.Icon
            const participated = d.participated === 1
            const points = d.points_awarded || 0

            return (
              <div
                key={d.id}
                className="rounded-2xl p-4"
                style={{
                  background: participated ? `${meta.color}10` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${participated ? meta.color + '30' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${meta.color}20`, color: meta.color }}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="text-white font-bold text-sm leading-tight">{d.name}</h3>
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: `${meta.color}25`, color: meta.color }}
                      >
                        {meta.label}
                      </span>
                    </div>
                    {d.description && (
                      <p className="text-ocean-foam/50 text-xs mt-1.5 leading-relaxed">{d.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-ocean-foam/40">{fmtDate(d.date || d.created_at)}</span>
                    {participated ? (
                      <span className="flex items-center gap-1 font-semibold" style={{ color: meta.color }}>
                        <CheckIcon size={12} /> Participaste
                      </span>
                    ) : (
                      <span className="text-ocean-foam/30 italic">Sin participar</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AwardIcon size={14} className="text-yellow-300" />
                    <span className="font-black text-sm" style={{ color: points > 0 ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}>
                      {points > 0 ? `+${points}` : '0'} pts
                    </span>
                  </div>
                </div>

                {d.notes && (
                  <p className="text-[11px] text-ocean-foam/40 italic mt-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    “{d.notes}”
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
