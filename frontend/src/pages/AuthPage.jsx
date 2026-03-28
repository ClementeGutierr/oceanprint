import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Bubbles from '../components/Bubbles'
import { OceanWaveIcon, DiveMaskIcon } from '../components/OceanIcons'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        await login(form.email, form.password)
      } else {
        await register(form.name, form.email, form.password)
      }
      navigate('/calculator')
    } catch (err) {
      setError(err.response?.data?.error || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-6 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at top, #0d2137 0%, #020c1b 70%)' }}
    >
      <Bubbles />

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="flex justify-center mb-3 text-ocean-cyan"
            style={{ filter: 'drop-shadow(0 0 20px rgba(0,180,216,0.4))' }}
          >
            <OceanWaveIcon size={56} />
          </div>
          <h1 className="text-3xl font-black">
            <span className="gradient-text">Ocean</span>
            <span className="text-white">Print</span>
          </h1>
          <p className="text-ocean-foam/50 text-xs mt-1 tracking-widest uppercase">Diving Life</p>
        </div>

        {/* Tab toggle */}
        <div className="flex mb-6 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {['Iniciar sesión', 'Registrarse'].map((tab, i) => (
            <button
              key={i}
              onClick={() => { setIsLogin(i === 0); setError('') }}
              className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200"
              style={
                (i === 0) === isLogin
                  ? { background: 'linear-gradient(135deg, #00b4d8, #48cae4)', color: '#020c1b' }
                  : { color: 'rgba(255,255,255,0.4)' }
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="text-xs text-ocean-foam/60 font-medium mb-1.5 block">Nombre</label>
              <input
                type="text"
                placeholder="Tu nombre de buceador"
                className="input-field"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required={!isLogin}
              />
            </div>
          )}
          <div>
            <label className="text-xs text-ocean-foam/60 font-medium mb-1.5 block">Email</label>
            <input
              type="email"
              placeholder="tu@email.com"
              className="input-field"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs text-ocean-foam/60 font-medium mb-1.5 block">Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              className="input-field"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="text-coral text-sm text-center py-2 px-4 rounded-xl"
              style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-ocean-deep/40 border-t-ocean-deep rounded-full animate-spin" />
            ) : isLogin ? (
              <><DiveMaskIcon size={18} /> Sumergirse</>
            ) : (
              <><OceanWaveIcon size={18} /> Unirse al océano</>
            )}
          </button>
        </form>

        <p className="text-center text-ocean-foam/30 text-xs mt-6">
          Mide tu impacto. Protege los océanos.
        </p>
      </div>
    </div>
  )
}
