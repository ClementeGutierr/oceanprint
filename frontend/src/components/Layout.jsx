import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import axios from 'axios'
import Bubbles from './Bubbles'
import { useAuth } from '../context/AuthContext'
import { LevelIcon } from './OceanIcons'

const navItems = [
  { to: '/calculator', icon: '🌡️', label: 'Huella' },
  { to: '/missions', icon: '🎯', label: 'Misiones' },
  { to: '/compensation', icon: '🌱', label: 'Compensar' },
  { to: '/leaderboard', icon: '🏆', label: 'Ranking' },
  { to: '/profile', icon: '🤿', label: 'Perfil' },
]

const RANK_MEDALS = ['🥇', '🥈', '🥉']

function DesktopRightSidebar() {
  const [leaders, setLeaders] = useState([])
  const { API, user } = useAuth()

  useEffect(() => {
    axios.get(`${API}/leaderboard`)
      .then(res => setLeaders(res.data?.leaders?.slice(0, 5) || []))
      .catch(() => {})
  }, [])

  return (
    <div className="p-5 flex flex-col gap-5 h-full">
      {/* Leaderboard widget */}
      <div>
        <p className="text-[10px] text-ocean-cyan/60 font-bold uppercase tracking-widest mb-3">
          🏆 Top Guardianes
        </p>
        <div className="space-y-1.5">
          {leaders.map((leader, i) => {
            const isMe = leader.is_me
            return (
              <div
                key={leader.id}
                className="flex items-center gap-2.5 py-2 px-3 rounded-xl"
                style={
                  isMe
                    ? { background: 'rgba(0,180,216,0.1)', border: '1px solid rgba(0,180,216,0.2)' }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }
                }
              >
                <span className="text-sm w-5 text-center flex-shrink-0">
                  {RANK_MEDALS[i] || `#${i + 1}`}
                </span>
                <span className="flex-shrink-0"><LevelIcon level={leader.level} size={18} /></span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${isMe ? 'text-ocean-cyan' : 'text-white/80'}`}>
                    {leader.name.split(' ')[0]}{isMe && ' (tú)'}
                  </p>
                  <p className="text-[10px] text-ocean-foam/30 truncate">{leader.level}</p>
                </div>
                <span className="text-xs font-black text-ocean-foam/50 flex-shrink-0">{leader.points}</span>
              </div>
            )
          })}
          {leaders.length === 0 && (
            <div className="text-center py-4 text-ocean-foam/20 text-xs">Cargando...</div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

      {/* User quick stats */}
      {user && (
        <div>
          <p className="text-[10px] text-ocean-cyan/60 font-bold uppercase tracking-widest mb-3">
            Tu progreso
          </p>
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(0,180,216,0.05)', border: '1px solid rgba(0,180,216,0.12)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div><LevelIcon level={user.level} size={30} /></div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">{user.name?.split(' ')[0]}</p>
                <p className="text-xs" style={{ color: '#48cae4' }}>{user.level}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl py-2.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-ocean-cyan font-black text-xl leading-none">{user.points ?? 0}</p>
                <p className="text-ocean-foam/40 text-[10px] mt-1">puntos</p>
              </div>
              <div className="rounded-xl py-2.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-green-400 font-black text-xl leading-none">{user.compensation_pct ?? 0}%</p>
                <p className="text-ocean-foam/40 text-[10px] mt-1">compensado</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ocean tip — pushed to bottom */}
      <div
        className="rounded-2xl p-4 mt-auto"
        style={{ background: 'rgba(72,202,228,0.04)', border: '1px solid rgba(72,202,228,0.08)' }}
      >
        <p className="text-ocean-foam/40 text-xs leading-relaxed">
          🌊 El océano absorbe el 30% del CO₂ que producimos. Cada viaje calculado es un paso hacia protegerlo.
        </p>
      </div>
    </div>
  )
}

export default function Layout() {
  const location = useLocation()

  const isActive = (to) =>
    location.pathname === to ||
    (to === '/calculator' && location.pathname === '/results')

  return (
    <div className="min-h-screen ocean-bg relative">
      <Bubbles />

      <div className="flex min-h-screen">

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            LEFT SIDEBAR — visible on md+ (≥768px)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <aside
          className="hidden md:flex flex-col flex-shrink-0 w-52 lg:w-60 sticky top-0 h-screen z-40 overflow-y-auto"
          style={{
            background: 'rgba(2,12,27,0.75)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(24px)',
          }}
        >
          {/* Brand */}
          <div className="px-5 pt-6 pb-4">
            <p className="text-ocean-cyan/50 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">
              Ocean
            </p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white leading-none">Print</span>
              <span className="text-xl">🌊</span>
            </div>
          </div>

          <div className="mx-4 mb-3" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

          {/* Nav links */}
          <nav className="flex-1 px-3 space-y-1 py-1">
            {navItems.map(({ to, icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200"
                style={
                  isActive(to)
                    ? {
                        background: 'rgba(0,180,216,0.14)',
                        border: '1px solid rgba(0,180,216,0.25)',
                        color: '#48cae4',
                      }
                    : { color: 'rgba(255,255,255,0.4)', border: '1px solid transparent' }
                }
              >
                <span className="text-xl">{icon}</span>
                <span className="text-sm font-semibold">{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-5 py-4">
            <p className="text-ocean-foam/20 text-[10px]">Guardianes del Océano · v1.0</p>
          </div>
        </aside>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            MAIN CONTENT — always visible
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <main className="flex-1 min-w-0 pb-24 md:pb-8 overflow-x-hidden">
          <Outlet />
        </main>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            RIGHT SIDEBAR — visible on xl+ (≥1280px)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <aside
          className="hidden xl:flex flex-col flex-shrink-0 w-64 sticky top-0 h-screen z-40 overflow-y-auto"
          style={{
            background: 'rgba(2,12,27,0.5)',
            borderLeft: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <DesktopRightSidebar />
        </aside>

      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BOTTOM NAV — mobile only (hidden on md+)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <nav
        className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 px-2 pb-safe"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(2,12,27,0.95) 20%, rgba(2,12,27,1) 100%)',
        }}
      >
        <div
          className="flex justify-around items-center py-3 px-2"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '24px',
            margin: '8px',
            backdropFilter: 'blur(20px)',
          }}
        >
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={`nav-tab ${isActive(to) ? 'active' : ''}`}
            >
              <span className="text-xl">{icon}</span>
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
