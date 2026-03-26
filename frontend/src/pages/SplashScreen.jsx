import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Bubbles from '../components/Bubbles'

export default function SplashScreen() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    setTimeout(() => {
      setFadeOut(true)
      setTimeout(() => navigate('/auth'), 600)
    }, 3200)
  }, [])

  return (
    <div
      className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center bottom, #0d2137 0%, #0a1628 40%, #020c1b 100%)',
        transition: 'opacity 0.6s ease',
        opacity: fadeOut ? 0 : 1,
      }}
    >
      <Bubbles />

      {/* Glow effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(0,180,216,0.12) 0%, transparent 70%)',
        }}
      />

      <div
        className="relative z-10 flex flex-col items-center"
        style={{
          transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.8)',
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Logo */}
        <div
          className="text-8xl mb-6 animate-float"
          style={{ filter: 'drop-shadow(0 0 30px rgba(0,180,216,0.5))' }}
        >
          🌊
        </div>

        <h1 className="text-5xl font-black tracking-tight mb-2">
          <span className="gradient-text">Ocean</span>
          <span className="text-white">Print</span>
        </h1>

        <p className="text-ocean-foam/70 text-sm font-medium tracking-widest uppercase mb-1">
          by Diving Life
        </p>

        <p className="text-ocean-cyan/60 text-xs mt-4 max-w-[240px] text-center leading-relaxed">
          Mide y compensa la huella de carbono de tus aventuras marinas
        </p>
      </div>

      {/* Wave bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 480 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 40 Q120 0 240 40 Q360 80 480 40 L480 80 L0 80 Z" fill="rgba(0,180,216,0.08)" />
          <path d="M0 55 Q120 15 240 55 Q360 95 480 55 L480 80 L0 80 Z" fill="rgba(0,180,216,0.05)" />
        </svg>
      </div>

      {/* Loading dots */}
      <div
        className="absolute bottom-16 flex gap-2"
        style={{
          transition: 'opacity 0.6s ease',
          opacity: visible ? 1 : 0,
          transitionDelay: '0.4s',
        }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-ocean-cyan/50"
            style={{
              animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}
