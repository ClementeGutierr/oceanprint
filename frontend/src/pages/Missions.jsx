import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import {
  TargetIcon, BrainIcon, XIcon, SparklesIcon, FrownIcon,
  LightbulbIcon, CheckIcon, MissionIcon, CONFETTI_ICONS,
} from '../components/OceanIcons'

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

export default function Missions() {
  const [missions, setMissions] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confetti, setConfetti] = useState(false)
  const { API, refreshUser } = useAuth()

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

  async function completeMission(id) {
    try {
      await axios.post(`${API}/missions/${id}/complete`)
      setConfetti(true)
      setTimeout(() => setConfetti(false), 2000)
      refreshUser()
      fetchData()
    } catch (e) {
      if (e.response?.status !== 409) console.error(e)
    }
  }

  function handleMissionPress(mission) {
    if (mission.completed) return
    if (mission.quiz_id) {
      const quiz = quizzes.find(q => q.id === mission.quiz_id)
      if (quiz) setActiveQuiz({ quiz, missionId: mission.id })
    } else {
      completeMission(mission.id)
    }
  }

  function handleQuizAnswer(result) {
    if (result.correct && activeQuiz) {
      completeMission(activeQuiz.missionId)
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
        {missions.map(mission => (
          <button
            key={mission.id}
            onClick={() => handleMissionPress(mission)}
            className="w-full text-left transition-all duration-200 active:scale-[0.98]"
          >
            <div
              className="rounded-2xl p-4 flex items-center gap-4"
              style={
                mission.completed
                  ? {
                      background: 'rgba(72,202,228,0.08)',
                      border: '1px solid rgba(72,202,228,0.2)',
                      opacity: 0.7,
                    }
                  : {
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }
              }
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={
                  mission.completed
                    ? { background: 'rgba(72,202,228,0.15)', color: '#48cae4' }
                    : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }
                }
              >
                {mission.completed
                  ? <CheckIcon size={24} />
                  : <MissionIcon icon={mission.icon} size={24} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`font-semibold text-sm ${mission.completed ? 'text-ocean-foam/60 line-through' : 'text-white'}`}>
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
                {mission.quiz_id && !mission.completed && (
                  <span className="inline-flex items-center gap-1 text-xs text-ocean-cyan/60 mt-1">
                    <BrainIcon size={12} /> Requiere quiz marino
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {activeQuiz && (
        <QuizModal
          quiz={activeQuiz.quiz}
          onClose={() => setActiveQuiz(null)}
          onAnswer={handleQuizAnswer}
        />
      )}
    </div>
  )
}
