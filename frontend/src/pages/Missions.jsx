import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import {
  TargetIcon, BrainIcon, XIcon, SparklesIcon, FrownIcon,
  LightbulbIcon, CheckIcon, MissionIcon, CONFETTI_ICONS,
  LockIcon, LeafIcon, ThermometerIcon, WhatsAppIcon, InstagramIcon,
} from '../components/OceanIcons'

function fmtDate(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Quiz modal (unchanged) ──────────────────────────────────────────────────
function QuizModal({ quiz, onClose, onAnswer }) {
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const { API } = useAuth()

  const options = [
    { key: 'A', label: quiz.option_a },
    { key: 'B', label: quiz.option_b },
    { key: 'C', label: quiz.option_c },
    { key: 'D', label: quiz.option_d },
  ]

  const handleSubmit = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const res = await axios.post(`${API}/quizzes/${quiz.id}/answer`, { answer: selected })
      setResult(res.data)
      onAnswer(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: 'rgba(2,12,27,0.9)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-[480px] rounded-t-3xl p-6 pb-10 animate-slide-up"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #0d2137 0%, #0a1628 100%)',
          border: '1px solid rgba(0,180,216,0.2)',
          borderBottom: 'none',
        }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="badge flex items-center gap-1" style={{ background: 'rgba(0,180,216,0.15)', color: '#48cae4' }}>
              <BrainIcon size={12} /> Quiz Marino
            </span>
            <p className="text-xs text-ocean-foam/40 mt-1">+{quiz.points} puntos si aciertas</p>
          </div>
          <button onClick={onClose} className="text-ocean-foam/40 flex items-center justify-center">
            <XIcon size={22} />
          </button>
        </div>

        <h3 className="text-white font-semibold text-base mb-5 leading-snug">{quiz.question}</h3>

        {!result ? (
          <>
            <div className="space-y-2 mb-5">
              {options.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSelected(opt.key)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all duration-150"
                  style={
                    selected === opt.key
                      ? { background: 'rgba(0,180,216,0.2)', border: '1px solid rgba(0,180,216,0.5)' }
                      : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }
                  }
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={
                      selected === opt.key
                        ? { background: 'rgba(0,180,216,0.4)', color: '#90e0ef' }
                        : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }
                    }
                  >
                    {opt.key}
                  </span>
                  <span className="text-sm text-white/80">{opt.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!selected || loading}
              className="btn-primary w-full"
            >
              {loading ? '...' : 'Confirmar respuesta'}
            </button>
          </>
        ) : (
          <div className="text-center">
            <div className="flex justify-center mb-3">
              {result.correct
                ? <SparklesIcon size={52} className="text-green-400" />
                : <FrownIcon size={52} className="text-coral" />
              }
            </div>
            <h4 className={`text-xl font-black mb-2 ${result.correct ? 'text-green-400' : 'text-coral'}`}>
              {result.correct ? '¡Correcto!' : 'Incorrecto'}
            </h4>
            {result.correct && (
              <div className="text-ocean-cyan font-bold mb-3">+{result.points_earned} puntos</div>
            )}
            {!result.correct && (
              <p className="text-ocean-foam/60 text-sm mb-2">
                La respuesta correcta era: <span className="text-ocean-cyan font-bold">{result.correct_answer}</span>
              </p>
            )}
            <p className="text-ocean-foam/50 text-xs leading-relaxed mb-4 text-left flex items-start gap-1.5"
              style={{ background: 'rgba(0,180,216,0.06)', borderRadius: '12px', padding: '12px' }}>
              <LightbulbIcon size={14} className="flex-shrink-0 mt-0.5 text-ocean-cyan/60" />
              {result.explanation}
            </p>
            <button onClick={onClose} className="btn-primary w-full">Continuar</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Locked mission modal (auto-complete missions) ───────────────────────────
function LockedModal({ mission, user, onClose }) {
  const isSocial       = mission.category === 'social'
  const isCompensacion = mission.category === 'compensacion'

  const current = isCompensacion ? (user?.compensated_co2 || 0) : mission.category === 'calculadora' ? (user?.trips_count || 0) : null
  const target  = isCompensacion ? 1000 : mission.category === 'calculadora' ? 5 : null
  const pct     = (current !== null && target) ? Math.min(100, Math.round((current / target) * 100)) : null
  const unit    = isCompensacion ? 'kg compensados' : 'viajes calculados'
  const Icon    = isCompensacion ? LeafIcon : ThermometerIcon
  const color   = isCompensacion ? '#4ade80' : isSocial ? '#a78bfa' : '#48cae4'
  const cta     = isCompensacion ? 'Compensar CO₂' : isSocial ? 'Ir a Compensar' : 'Calcular un viaje'
  const ctaHref = isCompensacion || isSocial ? '/compensar' : '/calcular'

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: 'rgba(2,12,27,0.9)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-[480px] rounded-t-3xl p-6 pb-10 animate-slide-up"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #0d2137 0%, #0a1628 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderBottom: 'none',
        }}
      >
        <div className="flex justify-between items-start mb-5">
          <span className="badge flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
            <LockIcon size={11} /> Misión automática
          </span>
          <button onClick={onClose} className="text-ocean-foam/40"><XIcon size={22} /></button>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)', color }}>
            <Icon size={24} />
          </div>
          <div>
            <h3 className="text-white font-bold text-base leading-tight">{mission.name}</h3>
            <p className="text-ocean-foam/40 text-xs mt-0.5">+{mission.points} puntos al completar</p>
          </div>
        </div>

        <p className="text-ocean-foam/60 text-sm leading-relaxed mb-5">{mission.description}</p>

        {pct !== null ? (
          <div className="mb-5">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-ocean-foam/40">Tu progreso</span>
              <span className="text-xs font-bold" style={{ color }}>{current.toLocaleString()} / {target.toLocaleString()} {unit}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <p className="text-xs text-ocean-foam/30 mt-1.5">
              {pct < 100
                ? `Faltan ${(target - current).toLocaleString()} ${unit} para desbloquear`
                : 'Condición cumplida — se desbloqueará automáticamente'}
            </p>
          </div>
        ) : (
          <div className="mb-5 rounded-2xl p-3" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)' }}>
            <p className="text-xs text-ocean-foam/50 leading-relaxed">
              Esta misión se desbloquea automáticamente cuando compartes tu compensación en WhatsApp o descargas la tarjeta para Instagram desde la sección <span className="text-purple-400 font-semibold">Compensar</span>.
            </p>
          </div>
        )}

        <a
          href={ctaHref}
          onClick={onClose}
          className="btn-primary w-full block text-center"
        >
          {cta}
        </a>
      </div>
    </div>
  )
}

// ── Action modal (manual missions that require evidence) ────────────────────
function ActionModal({ mission, onClose, onComplete }) {
  const [evidence, setEvidence] = useState('')
  const [species, setSpecies] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isCiencia    = mission.category === 'ciencia'
  const isComunidad  = mission.category === 'comunidad'
  const shareText    = encodeURIComponent(`Acabo de completar la misión "${mission.name}" en OceanPrint 🌊`)
  const waUrl        = `https://wa.me/?text=${shareText}`
  const igUrl        = `https://instagram.com`

  const canSubmit = isCiencia
    ? species.trim().length >= 2 && location.trim().length >= 2
    : isComunidad
      ? evidence.trim().length >= 5
      : evidence.trim().length >= 10

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      const evidenceText = isCiencia
        ? `Especie: ${species.trim()} | Lugar: ${location.trim()}`
        : evidence.trim()
      await onComplete(mission.id, evidenceText)
      onClose()
    } catch (e) {
      setError(e.response?.data?.error || 'Error al completar la misión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: 'rgba(2,12,27,0.9)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-[480px] rounded-t-3xl p-6 pb-10 animate-slide-up"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #0d2137 0%, #0a1628 100%)',
          border: '1px solid rgba(0,180,216,0.15)',
          borderBottom: 'none',
        }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="badge flex items-center gap-1" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>
              <MissionIcon icon={mission.icon} size={12} /> {mission.name}
            </span>
            <p className="text-xs text-ocean-foam/40 mt-1">+{mission.points} puntos</p>
          </div>
          <button onClick={onClose} className="text-ocean-foam/40"><XIcon size={22} /></button>
        </div>

        <p className="text-ocean-foam/60 text-sm leading-relaxed mb-5">{mission.description}</p>

        {/* ciencia: two fields */}
        {isCiencia && (
          <div className="space-y-3 mb-5">
            <div>
              <label className="text-xs text-ocean-foam/40 font-semibold uppercase tracking-wide block mb-1.5">Especie observada</label>
              <input
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                placeholder="ej. Tortuga careta (Caretta caretta)"
                value={species}
                onChange={e => setSpecies(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-ocean-foam/40 font-semibold uppercase tracking-wide block mb-1.5">Lugar de observación</label>
              <input
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                placeholder="ej. Bahía de Nenguange, Tayrona"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* comunidad: URL + share buttons */}
        {isComunidad && (
          <div className="mb-5">
            <label className="text-xs text-ocean-foam/40 font-semibold uppercase tracking-wide block mb-1.5">Enlace o prueba de participación</label>
            <input
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none mb-3"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              placeholder="https://... o describe tu participación"
              value={evidence}
              onChange={e => setEvidence(e.target.value)}
            />
            <p className="text-xs text-ocean-foam/30 mb-3">Comparte tu logro en redes:</p>
            <div className="flex gap-2">
              <a href={waUrl} target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.2)', color: '#25d366' }}>
                <WhatsAppIcon size={16} /> WhatsApp
              </a>
              <a href={igUrl} target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(193,53,132,0.12)', border: '1px solid rgba(193,53,132,0.2)', color: '#e1306c' }}>
                <InstagramIcon size={16} /> Instagram
              </a>
            </div>
          </div>
        )}

        {/* conservacion / sostenibilidad: textarea */}
        {!isCiencia && !isComunidad && (
          <div className="mb-5">
            <label className="text-xs text-ocean-foam/40 font-semibold uppercase tracking-wide block mb-1.5">Describe tu acción</label>
            <textarea
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', minHeight: '100px' }}
              placeholder="Describe brevemente qué hiciste (mínimo 10 caracteres)…"
              value={evidence}
              onChange={e => setEvidence(e.target.value)}
            />
            <p className="text-right text-xs text-ocean-foam/30 mt-1">{evidence.length} / 10 mín.</p>
          </div>
        )}

        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="btn-primary w-full"
        >
          {loading ? '...' : 'Completar misión'}
        </button>
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function Missions() {
  const [missions, setMissions] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [actionMission, setActionMission] = useState(null)
  const [lockedMission, setLockedMission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confetti, setConfetti] = useState(false)
  const { API, refreshUser, user } = useAuth()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [mRes, qRes] = await Promise.all([
        axios.get(`${API}/missions`),
        axios.get(`${API}/quizzes`),
      ])
      setMissions(mRes.data)
      setQuizzes(qRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function completeMission(id, evidence = null) {
    await axios.post(`${API}/missions/${id}/complete`, { evidence })
    setConfetti(true)
    setTimeout(() => setConfetti(false), 2000)
    refreshUser()
    fetchData()
  }

  function handleMissionPress(mission) {
    if (mission.completed) return

    // Auto-complete missions — show locked/progress modal
    if (['compensacion', 'calculadora', 'social'].includes(mission.category)) {
      setLockedMission(mission)
      return
    }

    // Quiz missions
    if (mission.quiz_id) {
      const quiz = quizzes.find(q => q.id === mission.quiz_id)
      if (quiz) setActiveQuiz({ quiz, missionId: mission.id })
      return
    }

    // Manual missions — require evidence
    setActionMission(mission)
  }

  function handleQuizAnswer(result) {
    if (result.correct && activeQuiz) {
      completeMission(activeQuiz.missionId).catch(console.error)
    }
  }

  const completed = missions.filter(m => m.completed).length

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <TargetIcon size={48} className="text-ocean-cyan animate-pulse" />
    </div>
  )

  return (
    <div className="px-5 pt-8 pb-6 animate-fade-in">
      {/* Confetti */}
      {confetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          {[...Array(20)].map((_, i) => {
            const ConfettiComp = CONFETTI_ICONS[Math.floor(Math.random() * CONFETTI_ICONS.length)]
            return (
              <div
                key={i}
                className="absolute animate-confetti text-ocean-cyan"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  color: ['#48cae4', '#4ade80', '#fbbf24', '#f472b6', '#a78bfa'][Math.floor(Math.random() * 5)],
                }}
              >
                <ConfettiComp size={24} />
              </div>
            )
          })}
        </div>
      )}

      <div className="mb-6">
        <p className="text-ocean-cyan/70 text-xs font-semibold uppercase tracking-widest mb-1">Desafíos</p>
        <h1 className="text-3xl font-black text-white flex items-center gap-2">
          Misiones <TargetIcon size={28} />
        </h1>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 progress-bar">
            <div className="progress-fill" style={{ width: `${missions.length > 0 ? (completed / missions.length) * 100 : 0}%` }} />
          </div>
          <span className="text-ocean-cyan font-bold text-sm whitespace-nowrap">{completed}/{missions.length}</span>
        </div>
      </div>

      <div className="space-y-3">
        {missions.map(mission => {
          const isAuto = mission.category === 'compensacion' || mission.category === 'calculadora'
          const progressHint = !mission.completed && isAuto && mission.category !== 'social'
            ? mission.category === 'compensacion'
              ? `${Math.min(1000, user?.compensated_co2 || 0).toLocaleString()} / 1 000 kg compensados`
              : `${Math.min(5, user?.trips_count || 0)} / 5 viajes calculados`
            : null

          return (
            <button
              key={mission.id}
              onClick={() => handleMissionPress(mission)}
              className="w-full text-left transition-all duration-200 active:scale-[0.98]"
            >
              <div
                className="rounded-2xl p-4 flex items-center gap-4"
                style={
                  mission.completed
                    ? { background: 'rgba(72,202,228,0.08)', border: '1px solid rgba(72,202,228,0.2)', opacity: 0.7 }
                    : isAuto
                      ? { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }
                      : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }
                }
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={
                    mission.completed
                      ? { background: 'rgba(72,202,228,0.15)', color: '#48cae4' }
                      : isAuto
                        ? { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }
                        : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }
                  }
                >
                  {mission.completed
                    ? <CheckIcon size={24} />
                    : isAuto
                      ? <LockIcon size={22} />
                      : <MissionIcon icon={mission.icon} size={24} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-semibold text-sm ${mission.completed ? 'text-ocean-foam/60 line-through' : isAuto ? 'text-white/40' : 'text-white'}`}>
                      {mission.name}
                    </p>
                    <span
                      className="badge flex-shrink-0"
                      style={
                        mission.completed
                          ? { background: 'rgba(72,202,228,0.1)', color: '#48cae4' }
                          : { background: 'rgba(255,209,102,0.1)', color: '#ffd166' }
                      }
                    >
                      {mission.completed ? '✓' : '+'}{mission.points}pts
                    </span>
                  </div>
                  <p className="text-ocean-foam/40 text-xs mt-0.5 leading-snug line-clamp-2">{mission.description}</p>

                  {/* Progress hint for auto missions */}
                  {progressHint && (
                    <span className="inline-flex items-center gap-1 text-xs text-ocean-foam/30 mt-1">
                      <LockIcon size={10} /> {progressHint}
                    </span>
                  )}

                  {/* Quiz badge */}
                  {!!mission.quiz_id && !mission.completed && (
                    <span className="inline-flex items-center gap-1 text-xs text-ocean-cyan/60 mt-1">
                      <BrainIcon size={12} /> Requiere quiz marino
                    </span>
                  )}

                  {/* Completed: date + evidence */}
                  {!!mission.completed && (
                    <div className="mt-1 space-y-0.5">
                      {mission.completed_at && (
                        <p className="text-xs text-ocean-cyan/50">{fmtDate(mission.completed_at)}</p>
                      )}
                      {mission.evidence && (
                        <p className="text-xs text-ocean-foam/30 truncate">{mission.evidence}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {activeQuiz && (
        <QuizModal
          quiz={activeQuiz.quiz}
          onClose={() => setActiveQuiz(null)}
          onAnswer={handleQuizAnswer}
        />
      )}

      {actionMission && (
        <ActionModal
          mission={actionMission}
          onClose={() => setActionMission(null)}
          onComplete={completeMission}
        />
      )}

      {lockedMission && (
        <LockedModal
          mission={lockedMission}
          user={user}
          onClose={() => setLockedMission(null)}
        />
      )}
    </div>
  )
}
