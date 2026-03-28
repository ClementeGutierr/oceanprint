import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { LevelIcon } from '../components/OceanIcons'

const RANK_STYLES = [
  { bg: 'rgba(255,215,0,0.1)', border: 'rgba(255,215,0,0.3)', numColor: '#ffd700', medal: '🥇' },
  { bg: 'rgba(192,192,192,0.1)', border: 'rgba(192,192,192,0.3)', numColor: '#c0c0c0', medal: '🥈' },
  { bg: 'rgba(205,127,50,0.1)', border: 'rgba(205,127,50,0.3)', numColor: '#cd7f32', medal: '🥉' },
]

export default function Leaderboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { API, user } = useAuth()

  useEffect(() => {
    axios.get(`${API}/leaderboard`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-ocean-cyan animate-pulse text-4xl">🏆</div>
    </div>
  )

  return (
    <div className="px-5 pt-8 pb-6 animate-fade-in">
      <div className="mb-6">
        <p className="text-ocean-cyan/70 text-xs font-semibold uppercase tracking-widest mb-1">Guardianes del océano</p>
        <h1 className="text-3xl font-black text-white">Ranking <span className="text-2xl">🏆</span></h1>
        {data?.my_rank && (
          <p className="text-ocean-foam/50 text-sm mt-1">
            Tu posición: <span className="text-ocean-cyan font-bold">#{data.my_rank}</span>
          </p>
        )}
      </div>

      {/* Top 3 podium */}
      {data?.leaders?.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-6 px-2">
          {/* 2nd */}
          <div className="flex-1 text-center">
            <div
              className="rounded-t-2xl py-4 px-2"
              style={{ background: 'rgba(192,192,192,0.08)', border: '1px solid rgba(192,192,192,0.2)', borderBottom: 'none', minHeight: '80px' }}
            >
              <div className="mb-1"><LevelIcon level={data.leaders[1].level} size={24} /></div>
              <p className="text-white font-bold text-xs truncate">{data.leaders[1].name.split(' ')[0]}</p>
              <p className="text-silver font-black text-sm" style={{ color: '#c0c0c0' }}>{data.leaders[1].points}</p>
              <p className="text-silver/60 text-[10px]">pts</p>
            </div>
            <div className="text-2xl -mt-1">🥈</div>
          </div>
          {/* 1st */}
          <div className="flex-1 text-center">
            <div
              className="rounded-t-2xl py-4 px-2"
              style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)', borderBottom: 'none', minHeight: '100px' }}
            >
              <div className="mb-1"><LevelIcon level={data.leaders[0].level} size={30} /></div>
              <p className="text-white font-bold text-xs truncate">{data.leaders[0].name.split(' ')[0]}</p>
              <p className="font-black text-lg" style={{ color: '#ffd700' }}>{data.leaders[0].points}</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,215,0,0.5)' }}>pts</p>
            </div>
            <div className="text-2xl -mt-1">🥇</div>
          </div>
          {/* 3rd */}
          <div className="flex-1 text-center">
            <div
              className="rounded-t-2xl py-4 px-2"
              style={{ background: 'rgba(205,127,50,0.08)', border: '1px solid rgba(205,127,50,0.2)', borderBottom: 'none', minHeight: '65px' }}
            >
              <div className="mb-1"><LevelIcon level={data.leaders[2].level} size={20} /></div>
              <p className="text-white font-bold text-xs truncate">{data.leaders[2].name.split(' ')[0]}</p>
              <p className="font-black text-sm" style={{ color: '#cd7f32' }}>{data.leaders[2].points}</p>
              <p className="text-[10px]" style={{ color: 'rgba(205,127,50,0.5)' }}>pts</p>
            </div>
            <div className="text-2xl -mt-1">🥉</div>
          </div>
        </div>
      )}

      {/* Full list */}
      <div className="space-y-2">
        {data?.leaders?.map((leader, i) => {
          const isMe = leader.is_me
          const rankStyle = i < 3 ? RANK_STYLES[i] : null

          return (
            <div
              key={leader.id}
              className="flex items-center gap-3 p-3 rounded-2xl transition-all"
              style={
                isMe
                  ? { background: 'rgba(0,180,216,0.12)', border: '1px solid rgba(0,180,216,0.3)' }
                  : rankStyle
                  ? { background: rankStyle.bg, border: `1px solid ${rankStyle.border}` }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }
              }
            >
              <div className="w-8 text-center flex-shrink-0">
                {rankStyle ? (
                  <span className="text-lg">{rankStyle.medal}</span>
                ) : (
                  <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>#{i + 1}</span>
                )}
              </div>

              <div className="flex-shrink-0"><LevelIcon level={leader.level} size={22} /></div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`font-semibold text-sm truncate ${isMe ? 'text-ocean-cyan' : 'text-white'}`}>
                    {leader.name} {isMe && '(tú)'}
                  </p>
                  {leader.is_demo && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)' }}>
                      demo
                    </span>
                  )}
                </div>
                <p className="text-ocean-foam/40 text-xs">{leader.level} · {leader.trips_count} viajes</p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-black text-sm" style={{ color: isMe ? '#00b4d8' : rankStyle?.numColor || 'rgba(255,255,255,0.6)' }}>
                  {leader.points}
                </p>
                <p className="text-[10px] text-ocean-foam/30">pts</p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-xs font-semibold" style={{ color: '#4ade80' }}>{leader.compensation_pct}%</p>
                <p className="text-[10px] text-ocean-foam/30">comp.</p>
              </div>
            </div>
          )
        })}
      </div>

      {!data?.leaders?.length && (
        <div className="text-center py-12 text-ocean-foam/30">
          <p className="text-4xl mb-3">🌊</p>
          <p>Sé el primero en el ranking</p>
        </div>
      )}
    </div>
  )
}
