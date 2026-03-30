import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import {
  PlaneIcon, ShipIcon, BusIcon, CarIcon, SearchIcon, UsersIcon,
  ThermometerIcon, IslandIcon, MapIcon,
  DiveMaskIcon, SpeedboatIcon, XIcon, WalkingPersonIcon,
  OceanWaveIcon, TrophyIcon,
} from '../components/OceanIcons'

const ORIGINS = ['Bogotá', 'Medellín', 'Cali', 'Miami', 'New York', 'Ciudad de México', 'Lima']
const DESTINATIONS = ['Galápagos', 'Isla Malpelo', 'Islas Revillagigedo', 'Isla del Coco', 'Raja Ampat', 'Providencia']

const SEA_OPTIONS = [
  { value: 'bote_buceo', label: 'Bote de buceo',          Icon: DiveMaskIcon   },
  { value: 'lancha',     label: 'Lancha rápida',           Icon: SpeedboatIcon  },
  { value: 'ferry',      label: 'Ferry',                   Icon: ShipIcon       },
  { value: 'none',       label: 'Sin transporte marino',   Icon: XIcon          },
]

const LAND_OPTIONS = [
  { value: 'van',  label: 'Van / Minibus', Icon: BusIcon           },
  { value: 'bus',  label: 'Bus público',   Icon: BusIcon           },
  { value: 'taxi', label: 'Taxi / Uber',   Icon: CarIcon           },
  { value: 'suv',  label: 'SUV',           Icon: CarIcon           },
  { value: 'none', label: 'Caminando',     Icon: WalkingPersonIcon },
]

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`
}

export default function Calculator() {
  const { API, refreshUser, user } = useAuth()

  const [form, setForm] = useState({
    origin: '',
    destination: '',
    transport_sea: 'bote_buceo',
    transport_land: 'van',
    sea_hours: 6,
    passengers: 1,
    expedition_id: null,
  })

  const [expeditions, setExpeditions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Pre-select origin city from user profile on first load
  useEffect(() => {
    if (user?.origin_city && ORIGINS.includes(user.origin_city)) {
      setForm(f => f.origin ? f : { ...f, origin: user.origin_city })
    }
  }, [user?.origin_city])

  // Fetch active expeditions when destination changes
  useEffect(() => {
    if (!form.destination) {
      setExpeditions([])
      setForm(f => ({ ...f, expedition_id: null }))
      return
    }
    axios.get(`${API}/expeditions/active?destination=${encodeURIComponent(form.destination)}`)
      .then(res => {
        setExpeditions(res.data)
        // Auto-select if user is already a member of one
        const joined = res.data.find(e => e.is_member)
        if (joined) setForm(f => ({ ...f, expedition_id: joined.id }))
        else setForm(f => ({ ...f, expedition_id: null }))
      })
      .catch(() => setExpeditions([]))
  }, [form.destination])

  const handleCalculate = async () => {
    if (!form.origin || !form.destination) {
      setError('Selecciona origen y destino')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await axios.post(`${API}/trips/calculate`, form)
      refreshUser()
      navigate('/results', { state: { result: res.data, form } })
    } catch (err) {
      setError(err.response?.data?.error || 'Error calculando')
    } finally {
      setLoading(false)
    }
  }

  const OptionGrid = ({ options, value, onChange }) => (
    <div className="grid grid-cols-2 gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="flex items-center gap-2 p-3 rounded-2xl text-left transition-all duration-150"
          style={
            value === opt.value
              ? { background: 'rgba(0,180,216,0.2)', border: '1px solid rgba(0,180,216,0.5)', color: '#90e0ef' }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }
          }
        >
          <opt.Icon size={18} />
          <span className="text-xs font-medium leading-tight">{opt.label}</span>
        </button>
      ))}
    </div>
  )

  return (
    <div className="px-5 pt-8 pb-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <p className="text-ocean-cyan/70 text-xs font-semibold uppercase tracking-widest mb-1">Calcula tu</p>
        <h1 className="text-3xl font-black text-white flex items-center gap-2">
          Huella de Carbono <ThermometerIcon size={28} />
        </h1>
        <p className="text-ocean-foam/40 text-sm mt-1">Tu aventura marina, sin rastro en el planeta</p>
      </div>

      <div className="space-y-5">
        {/* Origin */}
        <div>
          <label className="text-xs text-ocean-foam/60 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <PlaneIcon size={13} /> Ciudad de Origen
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ORIGINS.map(origin => (
              <button
                key={origin}
                type="button"
                onClick={() => setForm({ ...form, origin })}
                className="py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-150"
                style={
                  form.origin === origin
                    ? { background: 'linear-gradient(135deg, rgba(0,180,216,0.3), rgba(72,202,228,0.2))', border: '1px solid rgba(0,180,216,0.5)', color: '#90e0ef' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }
                }
              >
                {origin}
              </button>
            ))}
          </div>
        </div>

        {/* Destination */}
        <div>
          <label className="text-xs text-ocean-foam/60 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <IslandIcon size={13} /> Destino de Buceo
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DESTINATIONS.map(dest => (
              <button
                key={dest}
                type="button"
                onClick={() => setForm(f => ({ ...f, destination: dest }))}
                className="py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-150"
                style={
                  form.destination === dest
                    ? { background: 'linear-gradient(135deg, rgba(0,180,216,0.3), rgba(72,202,228,0.2))', border: '1px solid rgba(0,180,216,0.5)', color: '#90e0ef' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }
                }
              >
                {dest}
              </button>
            ))}
          </div>
        </div>

        {/* Expedition selector — only when there are active expeditions for this destination */}
        {expeditions.length > 0 && (
          <div className="animate-fade-in">
            <label className="text-xs text-ocean-foam/60 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <TrophyIcon size={13} /> Expedición activa
            </label>
            <div className="space-y-2">
              {expeditions.map(exp => {
                const isSelected = form.expedition_id === exp.id
                return (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, expedition_id: isSelected ? null : exp.id }))}
                    className="w-full text-left rounded-2xl p-3 transition-all duration-150"
                    style={
                      isSelected
                        ? { background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.45)' }
                        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span style={{ color: isSelected ? '#a78bfa' : 'rgba(255,255,255,0.5)' }}>
                            <TrophyIcon size={14} />
                          </span>
                          <p className="text-sm font-bold" style={{ color: isSelected ? '#c4b5fd' : 'rgba(255,255,255,0.8)' }}>
                            {exp.name}
                          </p>
                        </div>
                        <p className="text-[11px] text-ocean-foam/40 mt-0.5 ml-5">
                          {formatDate(exp.start_date)} – {formatDate(exp.end_date)} · {exp.member_count} miembro{exp.member_count !== 1 ? 's' : ''}
                        </p>
                        {exp.prize_description && (
                          <p className="text-[11px] ml-5 mt-0.5" style={{ color: 'rgba(253,230,138,0.6)' }}>
                            🏆 {exp.prize_description}
                          </p>
                        )}
                      </div>
                      <div
                        className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center"
                        style={
                          isSelected
                            ? { background: '#a78bfa', border: '2px solid #a78bfa' }
                            : { background: 'transparent', border: '2px solid rgba(255,255,255,0.2)' }
                        }
                      >
                        {isSelected && <span className="text-[10px] text-white font-black">✓</span>}
                      </div>
                    </div>
                  </button>
                )
              })}
              {form.expedition_id && (
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, expedition_id: null }))}
                  className="w-full text-center text-xs text-ocean-foam/30 py-1.5"
                >
                  Calcular sin expedición
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sea transport */}
        <div>
          <label className="text-xs text-ocean-foam/60 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShipIcon size={13} /> Transporte Marítimo
          </label>
          <OptionGrid
            options={SEA_OPTIONS}
            value={form.transport_sea}
            onChange={v => setForm({ ...form, transport_sea: v })}
          />
          {form.transport_sea !== 'none' && form.transport_sea !== 'ferry' && (
            <div className="mt-3 flex items-center gap-3">
              <label className="text-xs text-ocean-foam/50 whitespace-nowrap">Horas en el mar:</label>
              <input
                type="range"
                min="1" max="24" step="1"
                value={form.sea_hours}
                onChange={e => setForm({ ...form, sea_hours: parseInt(e.target.value) })}
                className="flex-1"
                style={{ accentColor: '#00b4d8' }}
              />
              <span className="text-ocean-cyan font-bold text-sm w-8">{form.sea_hours}h</span>
            </div>
          )}
        </div>

        {/* Land transport */}
        <div>
          <label className="text-xs text-ocean-foam/60 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MapIcon size={13} /> Transporte Terrestre
          </label>
          <OptionGrid
            options={LAND_OPTIONS}
            value={form.transport_land}
            onChange={v => setForm({ ...form, transport_land: v })}
          />
        </div>

        {/* Passengers */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                <UsersIcon size={15} /> Pasajeros en el grupo
              </p>
              <p className="text-xs text-ocean-foam/40 mt-0.5">Divide la huella entre todos</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, passengers: Math.max(1, form.passengers - 1) })}
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ background: 'rgba(0,180,216,0.15)', color: '#00b4d8' }}
              >−</button>
              <span className="text-xl font-bold text-ocean-cyan w-6 text-center">{form.passengers}</span>
              <button
                type="button"
                onClick={() => setForm({ ...form, passengers: Math.min(20, form.passengers + 1) })}
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ background: 'rgba(0,180,216,0.15)', color: '#00b4d8' }}
              >+</button>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-coral text-sm text-center py-2 px-4 rounded-xl"
            style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleCalculate}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 text-base"
        >
          {loading ? (
            <span className="inline-block w-5 h-5 border-2 border-ocean-deep/40 border-t-ocean-deep rounded-full animate-spin" />
          ) : (
            <><SearchIcon size={18} /> Calcular Huella de Carbono</>
          )}
        </button>
      </div>
    </div>
  )
}
