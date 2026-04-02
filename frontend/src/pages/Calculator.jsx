import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import {
  PlaneIcon, ShipIcon, BusIcon, CarIcon, SearchIcon, UsersIcon,
  ThermometerIcon, IslandIcon, MapIcon,
  DiveMaskIcon, SpeedboatIcon, XIcon, WalkingPersonIcon,
  OceanWaveIcon, TrophyIcon, LockIcon, PlusIcon,
} from '../components/OceanIcons'

const ORIGINS = ['Bogotá', 'Medellín', 'Cali', 'Miami', 'New York', 'Ciudad de México', 'Lima']
const DESTINATIONS = ['Galápagos', 'Isla Malpelo', 'Islas Revillagigedo', 'Isla del Coco', 'Raja Ampat', 'Providencia']

const SEA_OPTIONS = [
  { value: 'bote_buceo', label: 'Bote de buceo',        Icon: DiveMaskIcon   },
  { value: 'lancha',     label: 'Lancha rápida',         Icon: SpeedboatIcon  },
  { value: 'ferry',      label: 'Ferry',                 Icon: ShipIcon       },
  { value: 'none',       label: 'Sin transporte marino', Icon: XIcon          },
]

const LAND_OPTIONS = [
  { value: 'van',  label: 'Van / Minibus', Icon: BusIcon           },
  { value: 'bus',  label: 'Bus público',   Icon: BusIcon           },
  { value: 'taxi', label: 'Taxi / Uber',   Icon: CarIcon           },
  { value: 'suv',  label: 'SUV',           Icon: CarIcon           },
  { value: 'none', label: 'Caminando',     Icon: WalkingPersonIcon },
]

const LOCAL_DISTANCES = {
  'Galápagos': 25, 'Isla Malpelo': 0, 'Isla del Coco': 0,
  'Islas Revillagigedo': 15, 'Raja Ampat': 30, 'Providencia': 20,
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`
}

/* ── Segment type selector ── */
function TypeSelector({ options, value, onChange, disabled }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {options.map(opt => (
        <button key={opt.value} type="button" disabled={disabled}
          onClick={() => onChange(opt.value)}
          className="flex items-center gap-2 p-2.5 rounded-xl text-left transition-all duration-150"
          style={
            value === opt.value
              ? { background: 'rgba(0,180,216,0.2)', border: '1px solid rgba(0,180,216,0.5)', color: '#90e0ef' }
              : disabled
              ? { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)', cursor: 'not-allowed' }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }
          }>
          <opt.Icon size={16} />
          <span className="text-xs font-medium leading-tight">{opt.label}</span>
        </button>
      ))}
    </div>
  )
}

/* ── Sea segment row ── */
function SeaSegmentRow({ seg, onChange, onRemove, canRemove, locked, destination }) {
  return (
    <div className="rounded-2xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-ocean-foam/40 font-semibold uppercase tracking-wider">Tramo marítimo</span>
        {canRemove && !locked && (
          <button type="button" onClick={onRemove} className="text-ocean-foam/30 hover:text-red-400 transition-colors">
            <XIcon size={14} />
          </button>
        )}
      </div>
      <TypeSelector options={SEA_OPTIONS} value={seg.type} onChange={t => onChange({ ...seg, type: t })} disabled={locked} />
      {seg.type !== 'none' && seg.type !== 'ferry' && (
        <div className="flex items-center gap-3 pt-1">
          <label className="text-xs text-ocean-foam/50 whitespace-nowrap">Horas en el mar:</label>
          {locked ? (
            <span className="text-ocean-cyan font-bold text-sm">{seg.hours}h</span>
          ) : (
            <>
              <input type="range" min="1" max="48" step="1" value={seg.hours || 6}
                onChange={e => onChange({ ...seg, hours: parseInt(e.target.value) })}
                className="flex-1" style={{ accentColor: '#00b4d8' }} />
              <span className="text-ocean-cyan font-bold text-sm w-8">{seg.hours || 6}h</span>
            </>
          )}
        </div>
      )}
      {seg.type === 'ferry' && destination && (
        <p className="text-xs text-ocean-foam/40">
          Distancia local: {LOCAL_DISTANCES[destination] ?? 20} km × 2 (ida y vuelta)
        </p>
      )}
    </div>
  )
}

/* ── Land segment row ── */
function LandSegmentRow({ seg, onChange, onRemove, canRemove, locked, destination }) {
  const defaultKm = LOCAL_DISTANCES[destination] ?? 20
  const displayKm = (seg.km != null && seg.km > 0) ? seg.km : defaultKm
  return (
    <div className="rounded-2xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-ocean-foam/40 font-semibold uppercase tracking-wider">Tramo terrestre</span>
        {canRemove && !locked && (
          <button type="button" onClick={onRemove} className="text-ocean-foam/30 hover:text-red-400 transition-colors">
            <XIcon size={14} />
          </button>
        )}
      </div>
      <TypeSelector options={LAND_OPTIONS} value={seg.type} onChange={t => onChange({ ...seg, type: t })} disabled={locked} />
      {seg.type !== 'none' && (
        <div className="flex items-center gap-3 pt-1">
          <label className="text-xs text-ocean-foam/50 whitespace-nowrap">Km de recorrido:</label>
          {locked ? (
            <span className="text-ocean-cyan font-bold text-sm">{displayKm} km</span>
          ) : (
            <input type="number" min="1" max="500"
              value={seg.km ?? ''} placeholder={String(defaultKm)}
              onChange={e => onChange({ ...seg, km: e.target.value ? parseInt(e.target.value) : null })}
              className="w-20 rounded-xl px-2 py-1 text-sm text-center font-bold text-ocean-cyan"
              style={{ background: 'rgba(0,180,216,0.08)', border: '1px solid rgba(0,180,216,0.25)', outline: 'none' }} />
          )}
          {!locked && <span className="text-ocean-foam/40 text-xs">km (por sentido)</span>}
        </div>
      )}
    </div>
  )
}

/* ── City autocomplete input ── */
function CityAutocomplete({ value, onChange, placeholder = 'Ciudad o aeropuerto...', apiBase }) {
  const [query, setQuery]           = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen]             = useState(false)
  const ref     = useRef(null)
  const timerRef = useRef(null)

  // Sync display when value changes externally
  useEffect(() => {
    setQuery(value ? `${value.city} (${value.iata})` : '')
  }, [value?.iata])

  // Outside-click closes dropdown
  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function handleChange(e) {
    const q = e.target.value
    setQuery(q)
    onChange(null) // deselect while user types
    clearTimeout(timerRef.current)
    if (q.length < 2) { setSuggestions([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      try {
        const r = await axios.get(`${apiBase}/trips/airports?q=${encodeURIComponent(q)}`)
        setSuggestions(r.data)
        setOpen(r.data.length > 0)
      } catch { setSuggestions([]) }
    }, 200)
  }

  function select(apt) {
    setQuery(`${apt.city} (${apt.iata})`)
    onChange(apt)
    setSuggestions([])
    setOpen(false)
  }

  function clear() {
    setQuery('')
    onChange(null)
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${value ? 'rgba(0,180,216,0.4)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: '10px',
            padding: '8px 30px 8px 10px',
            color: 'white', fontSize: '13px', outline: 'none',
          }}
        />
        {query && (
          <button type="button" onClick={clear}
            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '15px', lineHeight: 1, padding: 0 }}>
            ×
          </button>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#1a2332', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '10px', zIndex: 9999, maxHeight: '200px', overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
        }}>
          {suggestions.map(apt => (
            <button key={apt.iata} type="button" onClick={() => select(apt)}
              style={{ width: '100%', padding: '9px 12px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ color: '#48cae4', fontWeight: 700, fontSize: '12px', minWidth: '32px' }}>{apt.iata}</span>
              <span style={{ flex: 1, color: 'rgba(255,255,255,0.88)', fontSize: '13px' }}>{apt.city}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', whiteSpace: 'nowrap' }}>{apt.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Main Calculator ── */
export default function Calculator() {
  const { API, refreshUser, user } = useAuth()
  const navigate = useNavigate()

  const [origin, setOrigin]           = useState('')
  const [destination, setDestination] = useState('')
  const [routeStops, setRouteStops]   = useState([])   // array of airport objects | null (unresolved)
  const [seaSegments, setSeaSegments]   = useState([{ type: 'bote_buceo', hours: 6 }])
  const [landSegments, setLandSegments] = useState([{ type: 'van', km: null }])
  const [passengers, setPassengers]   = useState(1)
  const [expeditions, setExpeditions] = useState([])
  const [selectedExpId, setSelectedExpId] = useState(null)
  const [expeditionLocked, setExpeditionLocked] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  // Pre-select origin from user profile
  useEffect(() => {
    if (user?.origin_city && ORIGINS.includes(user.origin_city) && !origin) {
      setOrigin(user.origin_city)
    }
  }, [user?.origin_city])

  // Reset route stops when origin or destination changes
  useEffect(() => { setRouteStops([]) }, [origin, destination])

  // Fetch active expeditions when destination changes
  useEffect(() => {
    if (!destination) {
      setExpeditions([])
      setSelectedExpId(null)
      setExpeditionLocked(false)
      return
    }
    axios.get(`${API}/expeditions/active?destination=${encodeURIComponent(destination)}`)
      .then(res => {
        setExpeditions(res.data)
        const joined = res.data.find(e => e.is_member)
        if (joined) selectExpedition(joined)
        else { setSelectedExpId(null); setExpeditionLocked(false) }
      })
      .catch(() => setExpeditions([]))
  }, [destination])

  function selectExpedition(exp) {
    if (!exp) {
      setSelectedExpId(null)
      setExpeditionLocked(false)
      setSeaSegments([{ type: 'bote_buceo', hours: 6 }])
      setLandSegments([{ type: 'van', km: null }])
      setPassengers(1)
      return
    }
    setSelectedExpId(exp.id)
    try {
      const hasFixed = exp.sea_transports || exp.land_transports
      if (exp.sea_transports) setSeaSegments(JSON.parse(exp.sea_transports))
      if (exp.land_transports) setLandSegments(JSON.parse(exp.land_transports))
      if (exp.fixed_passengers) setPassengers(exp.fixed_passengers)
      setExpeditionLocked(!!hasFixed)
    } catch { setExpeditionLocked(false) }
  }

  function toggleExpedition(exp) {
    if (selectedExpId === exp.id) selectExpedition(null)
    else selectExpedition(exp)
  }

  // Sea helpers
  function updateSeaSeg(i, val) { setSeaSegments(s => s.map((x, idx) => idx === i ? val : x)) }
  function addSeaSeg()           { setSeaSegments(s => [...s, { type: 'bote_buceo', hours: 6 }]) }
  function removeSeaSeg(i)       { setSeaSegments(s => s.filter((_, idx) => idx !== i)) }

  // Land helpers
  function updateLandSeg(i, val) { setLandSegments(s => s.map((x, idx) => idx === i ? val : x)) }
  function addLandSeg()           { setLandSegments(s => [...s, { type: 'van', km: null }]) }
  function removeLandSeg(i)       { setLandSegments(s => s.filter((_, idx) => idx !== i)) }

  // Route stop helpers
  function addStop()          { setRouteStops(s => [...s, null]) }
  function removeStop(i)      { setRouteStops(s => s.filter((_, j) => j !== i)) }
  function updateStop(i, apt) { setRouteStops(s => s.map((x, j) => j === i ? apt : x)) }

  async function handleCalculate() {
    if (!origin || !destination) { setError('Selecciona origen y destino'); return }
    if (routeStops.some(s => s === null)) {
      setError('Completa todas las ciudades de escala o elimínalas')
      return
    }
    setError('')
    setLoading(true)
    const route_waypoints = routeStops.length > 0
      ? [origin, ...routeStops.map(s => s.iata), destination]
      : null
    try {
      const res = await axios.post(`${API}/trips/calculate`, {
        origin, destination,
        sea_segments: seaSegments,
        land_segments: landSegments,
        passengers,
        expedition_id: selectedExpId,
        route_waypoints,
      })
      refreshUser()
      navigate('/results', { state: { result: res.data, origin, destination } })
    } catch (err) {
      if (err.response?.status === 429) setError(err.response.data.error)
      else setError(err.response?.data?.error || 'Error calculando')
    } finally { setLoading(false) }
  }

  const selectedExp = expeditions.find(e => e.id === selectedExpId)

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
            {ORIGINS.map(o => (
              <button key={o} type="button" onClick={() => setOrigin(o)}
                className="py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-150"
                style={
                  origin === o
                    ? { background: 'linear-gradient(135deg,rgba(0,180,216,0.3),rgba(72,202,228,0.2))', border: '1px solid rgba(0,180,216,0.5)', color: '#90e0ef' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }
                }>{o}</button>
            ))}
          </div>
        </div>

        {/* Destination */}
        <div>
          <label className="text-xs text-ocean-foam/60 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <IslandIcon size={13} /> Destino de Buceo
            {expeditionLocked && <span className="ml-auto flex items-center gap-1 text-amber-400/70"><LockIcon size={11} /> bloqueado por expedición</span>}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DESTINATIONS.map(dest => (
              <button key={dest} type="button"
                onClick={() => !expeditionLocked && setDestination(dest)}
                className="py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-150"
                style={
                  destination === dest
                    ? { background: 'linear-gradient(135deg,rgba(0,180,216,0.3),rgba(72,202,228,0.2))', border: '1px solid rgba(0,180,216,0.5)', color: '#90e0ef' }
                    : expeditionLocked
                    ? { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }
                }>{dest}</button>
            ))}
          </div>
        </div>

        {/* ── Route builder ── */}
        {origin && destination && (
          <div className="card animate-fade-in">
            <p className="text-xs text-ocean-foam/60 font-semibold uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <PlaneIcon size={12} /> Ruta de vuelo
            </p>

            {/* Origin node */}
            <div className="flex items-center gap-2.5">
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#00b4d8', border: '2px solid #48cae4', flexShrink: 0 }} />
              <span className="text-sm font-bold text-ocean-cyan">{origin}</span>
            </div>

            {/* Stops */}
            {routeStops.map((stop, i) => (
              <div key={i}>
                {/* connector */}
                <div style={{ marginLeft: 5, width: 1, height: 14, background: 'rgba(255,255,255,0.1)', margin: '3px 0 3px 5px' }} />
                <div className="flex items-center gap-2">
                  {/* dot */}
                  <div style={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0, background: stop ? 'rgba(251,191,36,0.25)' : 'transparent', border: `2px solid ${stop ? '#fbbf24' : 'rgba(255,255,255,0.2)'}` }} />
                  <CityAutocomplete
                    apiBase={API}
                    value={stop}
                    onChange={apt => updateStop(i, apt)}
                    placeholder="Ciudad de escala..."
                  />
                  <button type="button" onClick={() => removeStop(i)}
                    style={{ flexShrink: 0, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '7px', padding: '5px 9px', color: '#f87171', cursor: 'pointer', fontSize: '13px', lineHeight: 1 }}>
                    ×
                  </button>
                </div>
              </div>
            ))}

            {/* Add stop */}
            <div style={{ marginLeft: 5, width: 1, height: 14, background: 'rgba(255,255,255,0.1)', margin: '3px 0 3px 5px' }} />
            <div className="flex items-center gap-2 mb-0.5">
              <div style={{ width: 12, flexShrink: 0 }} />
              <button type="button" onClick={addStop}
                style={{ background: 'rgba(0,180,216,0.06)', border: '1px dashed rgba(0,180,216,0.25)', borderRadius: '8px', padding: '5px 14px', color: 'rgba(0,180,216,0.65)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                + Agregar escala
              </button>
            </div>

            {/* Connector to destination */}
            <div style={{ marginLeft: 5, width: 1, height: 14, background: 'rgba(255,255,255,0.1)', margin: '3px 0 3px 5px' }} />

            {/* Destination node */}
            <div className="flex items-center gap-2.5">
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(167,139,250,0.3)', border: '2px solid #a78bfa', flexShrink: 0 }} />
              <span className="text-sm font-bold" style={{ color: '#c4b5fd' }}>{destination}</span>
              {expeditionLocked && <LockIcon size={11} style={{ color: 'rgba(167,139,250,0.5)' }} />}
            </div>

            {/* Summary */}
            {routeStops.length > 0 && (
              <p className="text-xs mt-3 pl-5" style={{ color: routeStops.some(s => !s) ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}>
                {routeStops.some(s => !s)
                  ? '⚠ Completa o elimina las escalas vacías'
                  : `${routeStops.length} escala${routeStops.length > 1 ? 's' : ''} · distancias calculadas por segmento`
                }
              </p>
            )}
            {routeStops.length === 0 && (
              <p className="text-[11px] mt-3 pl-5 text-ocean-foam/25">Vuelo directo — agrega escalas si tu ruta las tiene</p>
            )}
          </div>
        )}

        {/* Expedition selector */}
        {expeditions.length > 0 && (
          <div className="animate-fade-in">
            <label className="text-xs text-ocean-foam/60 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <TrophyIcon size={13} /> Expedición activa
            </label>
            <div className="space-y-2">
              {expeditions.map(exp => {
                const isSelected = selectedExpId === exp.id
                return (
                  <button key={exp.id} type="button"
                    onClick={() => toggleExpedition(exp)}
                    className="w-full text-left rounded-2xl p-3 transition-all duration-150"
                    style={isSelected
                      ? { background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.45)' }
                      : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
                    }>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span style={{ color: isSelected ? '#a78bfa' : 'rgba(255,255,255,0.5)' }}><TrophyIcon size={14} /></span>
                          <p className="text-sm font-bold" style={{ color: isSelected ? '#c4b5fd' : 'rgba(255,255,255,0.8)' }}>{exp.name}</p>
                        </div>
                        <p className="text-[11px] text-ocean-foam/40 mt-0.5 ml-5">
                          {formatDate(exp.start_date)} – {formatDate(exp.end_date)} · {exp.member_count} miembro{exp.member_count !== 1 ? 's' : ''}
                        </p>
                        {exp.prize_description && (
                          <p className="text-[11px] ml-5 mt-0.5" style={{ color: 'rgba(253,230,138,0.6)' }}>🏆 {exp.prize_description}</p>
                        )}
                        {isSelected && exp.sea_transports && (
                          <p className="text-[10px] ml-5 mt-1" style={{ color: 'rgba(167,139,250,0.6)' }}>🔒 Parámetros de transporte definidos por Diving Life</p>
                        )}
                      </div>
                      <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center"
                        style={isSelected ? { background: '#a78bfa', border: '2px solid #a78bfa' } : { background: 'transparent', border: '2px solid rgba(255,255,255,0.2)' }}>
                        {isSelected && <span className="text-[10px] text-white font-black">✓</span>}
                      </div>
                    </div>
                  </button>
                )
              })}
              {selectedExpId && (
                <button type="button" onClick={() => selectExpedition(null)}
                  className="w-full text-center text-xs text-ocean-foam/30 py-1.5">
                  Calcular sin expedición
                </button>
              )}
            </div>
          </div>
        )}

        {/* Expedition lock banner */}
        {expeditionLocked && selectedExp && (
          <div className="rounded-2xl px-4 py-3 animate-fade-in"
            style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.25)' }}>
            <div className="flex items-start gap-2.5">
              <LockIcon size={15} style={{ color: '#a78bfa', flexShrink: 0, marginTop: '1px' }} />
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(196,181,253,0.7)' }}>
                Los parámetros de transporte están definidos por <strong style={{ color: '#c4b5fd' }}>Diving Life</strong> para esta expedición.
                Tu ruta de vuelo personal es libre.
              </p>
            </div>
          </div>
        )}

        {/* Sea transport */}
        <div>
          <label className="text-xs text-ocean-foam/60 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShipIcon size={13} /> Transporte Marítimo
            {expeditionLocked && <LockIcon size={11} style={{ color: 'rgba(167,139,250,0.5)', marginLeft: 'auto' }} />}
          </label>
          <div className="space-y-2">
            {seaSegments.map((seg, i) => (
              <SeaSegmentRow key={i} seg={seg}
                onChange={val => updateSeaSeg(i, val)}
                onRemove={() => removeSeaSeg(i)}
                canRemove={seaSegments.length > 1}
                locked={expeditionLocked} destination={destination} />
            ))}
          </div>
          {!expeditionLocked && seaSegments.length < 3 && (
            <button type="button" onClick={addSeaSeg}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: 'rgba(0,180,216,0.05)', border: '1px dashed rgba(0,180,216,0.2)', color: 'rgba(0,180,216,0.5)' }}>
              <PlusIcon size={13} /> Añadir tramo marítimo
            </button>
          )}
        </div>

        {/* Land transport */}
        <div>
          <label className="text-xs text-ocean-foam/60 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MapIcon size={13} /> Transporte Terrestre
            {expeditionLocked && <LockIcon size={11} style={{ color: 'rgba(167,139,250,0.5)', marginLeft: 'auto' }} />}
          </label>
          <div className="space-y-2">
            {landSegments.map((seg, i) => (
              <LandSegmentRow key={i} seg={seg}
                onChange={val => updateLandSeg(i, val)}
                onRemove={() => removeLandSeg(i)}
                canRemove={landSegments.length > 1}
                locked={expeditionLocked} destination={destination} />
            ))}
          </div>
          {!expeditionLocked && landSegments.length < 3 && (
            <button type="button" onClick={addLandSeg}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: 'rgba(0,180,216,0.05)', border: '1px dashed rgba(0,180,216,0.2)', color: 'rgba(0,180,216,0.5)' }}>
              <PlusIcon size={13} /> Añadir tramo terrestre
            </button>
          )}
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
            {expeditionLocked && passengers > 1 ? (
              <span className="text-ocean-cyan font-black text-xl">{passengers}</span>
            ) : (
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setPassengers(p => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ background: 'rgba(0,180,216,0.15)', color: '#00b4d8' }}>−</button>
                <span className="text-xl font-bold text-ocean-cyan w-6 text-center">{passengers}</span>
                <button type="button" onClick={() => setPassengers(p => Math.min(20, p + 1))}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ background: 'rgba(0,180,216,0.15)', color: '#00b4d8' }}>+</button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="text-coral text-sm text-center py-2 px-4 rounded-xl"
            style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)' }}>
            {error}
          </div>
        )}

        <button onClick={handleCalculate} disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 text-base">
          {loading
            ? <span className="inline-block w-5 h-5 border-2 border-ocean-deep/40 border-t-ocean-deep rounded-full animate-spin" />
            : <><SearchIcon size={18} /> Calcular Huella de Carbono</>
          }
        </button>
      </div>
    </div>
  )
}
