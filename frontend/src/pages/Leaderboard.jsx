import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import {
  LevelIcon, MedalIcon, TrophyIcon, OceanWaveIcon, ThermometerIcon,
} from '../components/OceanIcons'

const RANK_STYLES = [
  { bg: 'rgba(255,215,0,0.1)',   border: 'rgba(255,215,0,0.3)',   numColor: '#ffd700' },
  { bg: 'rgba(192,192,192,0.1)', border: 'rgba(192,192,192,0.3)', numColor: '#c0c0c0' },
  { bg: 'rgba(205,127,50,0.1)',  border: 'rgba(205,127,50,0.3)',  numColor: '#cd7f32' },
]

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`
}

function LeaderRow({ leader, rank, showComp = false }) {
  const isMe = leader.is_me
  const rankStyle = rank <= 3 ? RANK_STYLES[rank - 1] : null

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-2xl transition-all"
      style={
        isMe
          ? { background: 'rgba(0,180,216,0.12)', border: '1px solid rgba(0,180,216,0.3)' }
          : rankStyle
          ? { background: rankStyle.bg, border: `1px solid ${rankStyle.border}` }
          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }
      }
    >
      <div className="w-8 text-center flex-shrink-0 flex items-center justify-center">
        {rank <= 3
          ? <MedalIcon rank={rank} size={24} />
          : <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>#{rank}</span>
        }
      </div>
      <div className="flex-shrink-0"><LevelIcon level={leader.level} size={22} /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`font-semibold text-sm truncate ${isMe ? 'text-ocean-cyan' : 'text-white'}`}>
            {leader.name}{isMe && ' (tú)'}
          </p>
          {leader.is_demo && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)' }}>
              demo
            </span>
          )}
        </div>
        <p className="text-ocean-foam/40 text-xs">
          {leader.level}
          {(() => {
            const count = leader.trip_count ?? leader.trips_count
            return count > 0 ? ` · ${count} viaje${count !== 1 ? 's' : ''}` : null
          })()}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-black text-sm" style={{ color: isMe ? '#00b4d8' : rankStyle?.numColor || 'rgba(255,255,255,0.6)' }}>
          {leader.expedition_points ?? leader.points ?? 0}
        </p>
        <p className="text-[10px] text-ocean-foam/30">pts</p>
      </div>
      {showComp && leader.compensation_pct !== undefined && (
        <div className="text-right flex-shrink-0">
          <p className="text-xs font-semibold" style={{ color: '#4ade80' }}>{leader.compensation_pct}%</p>
          <p className="text-[10px] text-ocean-foam/30">comp.</p>
        </div>
      )}
    </div>
  )
}

/* ── GROUP STATS ────────────────────────────── */
function GroupStats({ stats }) {
  if (!stats) return null
  const pct = stats.compensation_pct ?? 0
  const emitted = stats.total_co2 ?? 0
  const compensated = stats.total_compensated ?? 0

  return (
    <div className="mb-5 animate-fade-in">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div
          className="rounded-2xl p-4 text-center"
          style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)' }}
        >
          <div className="flex justify-center mb-1.5" style={{ color: 'rgba(255,107,107,0.7)' }}>
            <ThermometerIcon size={20} />
          </div>
          <p className="text-2xl font-black text-white">{emitted.toLocaleString()}</p>
          <p className="text-[10px] font-semibold text-ocean-foam/40 uppercase tracking-wider mt-0.5">kg CO₂ emitidos</p>
        </div>
        <div
          className="rounded-2xl p-4 text-center"
          style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}
        >
          <div className="flex justify-center mb-1.5" style={{ color: 'rgba(74,222,128,0.7)' }}>
            <OceanWaveIcon size={20} />
          </div>
          <p className="text-2xl font-black" style={{ color: '#4ade80' }}>{compensated.toLocaleString()}</p>
          <p className="text-[10px] font-semibold text-ocean-foam/40 uppercase tracking-wider mt-0.5">kg CO₂ compensados</p>
        </div>
      </div>
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-ocean-foam/50">Compensación del grupo</p>
          <p className="text-lg font-black" style={{ color: pct >= 100 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171' }}>
            {pct}%
          </p>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, pct)}%`,
              background: pct >= 100
                ? 'linear-gradient(90deg, #4ade80, #22d3ee)'
                : pct >= 50
                ? 'linear-gradient(90deg, #fbbf24, #4ade80)'
                : 'linear-gradient(90deg, #f87171, #fbbf24)',
            }}
          />
        </div>
        <p className="text-[10px] text-ocean-foam/30 mt-1.5 text-center">
          {pct >= 100
            ? '¡Huella 100% compensada!'
            : `Falta ${Math.max(0, 100 - pct)}% para compensar toda la huella grupal`}
        </p>
      </div>
    </div>
  )
}

/* ── JOIN FORM ──────────────────────────────── */
function JoinExpeditionForm({ API, onJoined }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleJoin() {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await axios.post(`${API}/expeditions/join`, { invite_code: code.trim() })
      setSuccess(`¡Unido a ${res.data.expedition.name}!`)
      setCode('')
      setTimeout(() => onJoined(res.data.expedition), 800)
    } catch (e) {
      setError(e.response?.data?.error || 'Código inválido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-3xl p-5"
      style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)' }}
    >
      <div className="text-center mb-4">
        <div className="flex justify-center mb-2" style={{ color: '#a78bfa' }}>
          <TrophyIcon size={36} />
        </div>
        <h3 className="text-white font-black text-lg mb-1">Únete a una Expedición</h3>
        <p className="text-ocean-foam/50 text-sm leading-relaxed">
          Ingresa el código que te compartió Diving Life para ver el ranking exclusivo de tu expedición.
        </p>
      </div>
      <div className="space-y-3">
        <input
          className="input-field font-mono text-center tracking-widest uppercase"
          placeholder="MALPELO-MAR26"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); setSuccess('') }}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          maxLength={20}
        />
        {error && <p className="text-coral text-xs text-center">{error}</p>}
        {success && <p className="text-green-400 text-xs text-center font-semibold">{success}</p>}
        <button
          onClick={handleJoin}
          disabled={loading || !code.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2"
          style={{ opacity: !code.trim() ? 0.5 : 1 }}
        >
          {loading
            ? <span className="inline-block w-5 h-5 border-2 border-ocean-deep/40 border-t-ocean-deep rounded-full animate-spin" />
            : <><TrophyIcon size={16} /> Unirse</>
          }
        </button>
      </div>
    </div>
  )
}

/* ── EXPEDITION PANEL ───────────────────────── */
function ExpeditionPanel({ expeditionId, API }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setData(null)
    axios.get(`${API}/expeditions/${expeditionId}/leaderboard`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [expeditionId])

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="text-ocean-cyan animate-pulse"><TrophyIcon size={36} /></div>
    </div>
  )
  if (!data) return null

  const { expedition, leaders, my_rank, group_stats } = data
  const today = new Date().toISOString().split('T')[0]
  const isActive = expedition.end_date >= today
  const hasStarted = expedition.start_date <= today

  return (
    <div>
      <GroupStats stats={group_stats} />
      {/* Expedition header */}
      <div
        className="rounded-3xl p-5 mb-5"
        style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.25)' }}
      >
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)' }}
          >
            <TrophyIcon size={22} style={{ color: '#a78bfa' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="text-white font-black text-base leading-tight">{expedition.name}</h3>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                style={
                  isActive && hasStarted
                    ? { background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }
                    : isActive
                    ? { background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }
                    : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }
                }
              >
                {isActive && hasStarted ? 'EN CURSO' : isActive ? 'PRÓXIMA' : 'TERMINADA'}
              </span>
            </div>
            <p className="text-ocean-foam/50 text-xs">
              {formatDate(expedition.start_date)} – {formatDate(expedition.end_date)}
              {' · '}{leaders.length} participante{leaders.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {expedition.prize_description && (
          <div
            className="rounded-2xl px-3 py-2.5 flex items-start gap-2 mb-3"
            style={{ background: 'rgba(253,230,138,0.06)', border: '1px solid rgba(253,230,138,0.15)' }}
          >
            <span className="flex-shrink-0" style={{ color: 'rgba(253,230,138,0.8)', display: 'inline-flex' }}><TrophyIcon size={18} /></span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'rgba(253,230,138,0.5)' }}>
                Premio al ganador
              </p>
              <p className="text-sm font-semibold" style={{ color: 'rgba(253,230,138,0.9)' }}>
                {expedition.prize_description}
              </p>
            </div>
          </div>
        )}

        {my_rank && (
          <p className="text-ocean-foam/50 text-xs text-center">
            Tu posición actual: <span className="text-ocean-cyan font-bold">#{my_rank}</span>
          </p>
        )}
      </div>

      {/* Top 3 podium */}
      {leaders.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-5 px-2">
          {[
            { l: leaders[1], height: '80px',  rankN: 2, color: '#c0c0c0', rgba: '192,192,192' },
            { l: leaders[0], height: '105px', rankN: 1, color: '#ffd700', rgba: '255,215,0'   },
            { l: leaders[2], height: '65px',  rankN: 3, color: '#cd7f32', rgba: '205,127,50'  },
          ].map(({ l, height, rankN, color, rgba }) => (
            <div key={l.id} className="flex-1 text-center">
              <div
                className="rounded-t-2xl py-4 px-2"
                style={{
                  background: `rgba(${rgba},0.08)`,
                  border: `1px solid rgba(${rgba},0.2)`,
                  borderBottom: 'none',
                  minHeight: height,
                }}
              >
                <div className="mb-1 flex justify-center">
                  <LevelIcon level={l.level} size={rankN === 1 ? 30 : 22} />
                </div>
                <p className="text-white font-bold text-xs truncate">{l.name.split(' ')[0]}</p>
                <p className="font-black text-sm" style={{ color }}>{l.expedition_points}</p>
                <p className="text-[10px] text-ocean-foam/30">pts exp.</p>
              </div>
              <div className="flex justify-center mt-1">
                <MedalIcon rank={rankN} size={rankN === 1 ? 32 : 24} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full list */}
      <div className="space-y-2">
        {leaders.map(leader => (
          <LeaderRow key={leader.id} leader={leader} rank={leader.rank} showComp={false} />
        ))}
      </div>

      {leaders.length === 0 && (
        <div className="text-center py-10 text-ocean-foam/30">
          <div className="flex justify-center mb-2 opacity-30"><OceanWaveIcon size={40} /></div>
          <p className="text-sm">Aún no hay participantes activos</p>
        </div>
      )}
    </div>
  )
}

/* ── MAIN PAGE ──────────────────────────────── */
export default function Leaderboard() {
  const [tab, setTab] = useState('general')
  const [generalData, setGeneralData] = useState(null)
  const [generalOffset, setGeneralOffset] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [myExpeditions, setMyExpeditions] = useState([])
  const [selectedExpId, setSelectedExpId] = useState(null)
  const [loadingGeneral, setLoadingGeneral] = useState(true)
  const [loadingExp, setLoadingExp] = useState(true)
  const { API } = useAuth()

  async function loadMore() {
    setLoadingMore(true)
    try {
      const nextOffset = generalOffset + 20
      const res = await axios.get(`${API}/leaderboard?limit=20&offset=${nextOffset}`)
      setGeneralData(prev => ({
        ...res.data,
        leaders: [...(prev?.leaders || []), ...res.data.leaders],
      }))
      setGeneralOffset(nextOffset)
    } catch (e) { console.error(e) }
    finally { setLoadingMore(false) }
  }

  useEffect(() => {
    axios.get(`${API}/leaderboard?limit=20&offset=0`)
      .then(res => setGeneralData(res.data))
      .catch(console.error)
      .finally(() => setLoadingGeneral(false))

    axios.get(`${API}/expeditions/mine`)
      .then(res => {
        setMyExpeditions(res.data)
        if (res.data.length > 0) setSelectedExpId(res.data[0].id)
      })
      .catch(console.error)
      .finally(() => setLoadingExp(false))
  }, [])

  function handleJoined(expedition) {
    setMyExpeditions(prev => {
      const exists = prev.find(e => e.id === expedition.id)
      if (exists) return prev
      const today = new Date().toISOString().split('T')[0]
      return [{ ...expedition, is_active: expedition.end_date >= today ? 1 : 0 }, ...prev]
    })
    setSelectedExpId(expedition.id)
    setTab('expedition')
  }

  if (loadingGeneral && tab === 'general') return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-ocean-cyan animate-pulse"><TrophyIcon size={48} /></div>
    </div>
  )

  return (
    <div className="px-5 pt-8 pb-6 animate-fade-in">
      {/* Header */}
      <div className="mb-5">
        <p className="text-ocean-cyan/70 text-xs font-semibold uppercase tracking-widest mb-1">Guardianes del océano</p>
        <h1 className="text-3xl font-black text-white flex items-center gap-2">
          Ranking <TrophyIcon size={28} />
        </h1>
      </div>

      {/* Tabs */}
      <div
        className="grid grid-cols-2 gap-1 p-1 rounded-2xl mb-5"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      >
        <button
          onClick={() => setTab('general')}
          className="py-2 rounded-xl text-sm font-semibold transition-all"
          style={
            tab === 'general'
              ? { background: 'rgba(0,180,216,0.18)', color: '#48cae4', border: '1px solid rgba(0,180,216,0.35)' }
              : { color: 'rgba(255,255,255,0.35)', border: '1px solid transparent' }
          }
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><OceanWaveIcon size={13} />General</span>
        </button>
        <button
          onClick={() => setTab('expedition')}
          className="py-2 rounded-xl text-sm font-semibold transition-all relative"
          style={
            tab === 'expedition'
              ? { background: 'rgba(167,139,250,0.18)', color: '#c4b5fd', border: '1px solid rgba(167,139,250,0.35)' }
              : { color: 'rgba(255,255,255,0.35)', border: '1px solid transparent' }
          }
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><TrophyIcon size={13} />Mi Expedición</span>
          {myExpeditions.length > 0 && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
              style={{ background: '#a78bfa', color: '#fff' }}
            >
              {myExpeditions.length}
            </span>
          )}
        </button>
      </div>

      {/* ── TAB GENERAL ── */}
      {tab === 'general' && generalData && (
        <div>
          <GroupStats stats={generalData.group_stats} />
          {generalData.my_rank && (
            <p className="text-ocean-foam/50 text-sm mb-4">
              Tu posición: <span className="text-ocean-cyan font-bold">#{generalData.my_rank}</span>
            </p>
          )}
          {/* Top 3 podium */}
          {generalData.leaders?.length >= 3 && (
            <div className="flex items-end justify-center gap-3 mb-6 px-2">
              <div className="flex-1 text-center">
                <div className="rounded-t-2xl py-4 px-2"
                  style={{background:'rgba(192,192,192,0.08)',border:'1px solid rgba(192,192,192,0.2)',borderBottom:'none',minHeight:'80px'}}>
                  <div className="mb-1"><LevelIcon level={generalData.leaders[1].level} size={24} /></div>
                  <p className="text-white font-bold text-xs truncate">{generalData.leaders[1].name.split(' ')[0]}</p>
                  <p className="font-black text-sm" style={{color:'#c0c0c0'}}>{generalData.leaders[1].points}</p>
                  <p className="text-[10px]" style={{color:'rgba(192,192,192,0.5)'}}>pts</p>
                </div>
                <div className="flex justify-center mt-1"><MedalIcon rank={2} size={28} /></div>
              </div>
              <div className="flex-1 text-center">
                <div className="rounded-t-2xl py-4 px-2"
                  style={{background:'rgba(255,215,0,0.08)',border:'1px solid rgba(255,215,0,0.25)',borderBottom:'none',minHeight:'105px'}}>
                  <div className="mb-1"><LevelIcon level={generalData.leaders[0].level} size={30} /></div>
                  <p className="text-white font-bold text-xs truncate">{generalData.leaders[0].name.split(' ')[0]}</p>
                  <p className="font-black text-lg" style={{color:'#ffd700'}}>{generalData.leaders[0].points}</p>
                  <p className="text-[10px]" style={{color:'rgba(255,215,0,0.5)'}}>pts</p>
                </div>
                <div className="flex justify-center mt-1"><MedalIcon rank={1} size={32} /></div>
              </div>
              <div className="flex-1 text-center">
                <div className="rounded-t-2xl py-4 px-2"
                  style={{background:'rgba(205,127,50,0.08)',border:'1px solid rgba(205,127,50,0.2)',borderBottom:'none',minHeight:'65px'}}>
                  <div className="mb-1"><LevelIcon level={generalData.leaders[2].level} size={20} /></div>
                  <p className="text-white font-bold text-xs truncate">{generalData.leaders[2].name.split(' ')[0]}</p>
                  <p className="font-black text-sm" style={{color:'#cd7f32'}}>{generalData.leaders[2].points}</p>
                  <p className="text-[10px]" style={{color:'rgba(205,127,50,0.5)'}}>pts</p>
                </div>
                <div className="flex justify-center mt-1"><MedalIcon rank={3} size={24} /></div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {generalData.leaders?.map((leader, i) => (
              <LeaderRow key={leader.id} leader={leader} rank={i + 1} showComp />
            ))}
          </div>
          {!generalData.leaders?.length && (
            <div className="text-center py-12 text-ocean-foam/30">
              <div className="flex justify-center mb-3 opacity-30"><OceanWaveIcon size={48} /></div>
              <p>Sé el primero en el ranking</p>
            </div>
          )}
          {generalData.has_more && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full mt-4 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-98"
              style={{ background: 'rgba(0,180,216,0.08)', border: '1px solid rgba(0,180,216,0.18)', color: '#48cae4' }}
            >
              {loadingMore
                ? <span className="inline-block w-4 h-4 border-2 border-cyan-600/30 border-t-cyan-400 rounded-full animate-spin" />
                : `Ver más (${generalData.total - (generalData.leaders?.length || 0)} restantes)`}
            </button>
          )}
        </div>
      )}

      {/* ── TAB MI EXPEDICIÓN ── */}
      {tab === 'expedition' && (
        <div>
          {loadingExp && (
            <div className="flex items-center justify-center py-16">
              <div className="text-ocean-cyan animate-pulse"><TrophyIcon size={36} /></div>
            </div>
          )}

          {!loadingExp && myExpeditions.length > 0 && (
            <div>
              {/* Multi-expedition selector */}
              {myExpeditions.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
                  {myExpeditions.map(exp => (
                    <button
                      key={exp.id}
                      onClick={() => setSelectedExpId(exp.id)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
                      style={
                        selectedExpId === exp.id
                          ? { background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)', color: '#c4b5fd' }
                          : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }
                      }
                    >
                      {exp.name}
                    </button>
                  ))}
                </div>
              )}

              {selectedExpId && <ExpeditionPanel expeditionId={selectedExpId} API={API} />}

              <div className="mt-6">
                <p className="text-[10px] text-ocean-foam/30 font-semibold uppercase tracking-wider text-center mb-3">
                  ¿Tienes otro código?
                </p>
                <JoinExpeditionForm API={API} onJoined={handleJoined} />
              </div>
            </div>
          )}

          {!loadingExp && myExpeditions.length === 0 && (
            <JoinExpeditionForm API={API} onJoined={handleJoined} />
          )}
        </div>
      )}
    </div>
  )
}
