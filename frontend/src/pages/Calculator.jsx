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
function SeaSegmentRow({ seg, onChange, onRemove, canRemove, locked }) {
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
    </div>
  )
}

/* ── Land segment row ── */
function LandSegmentRow({ seg, onChange, onRemove, canRemove, locked }) {
  const defaultKm = 20
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
  const [query, setQuery]             = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen]               = useState(false)
  const ref      = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    setQuery(value ? `${value.city} (${value.iata})` : '')
  }, [value?.iata])

  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function handleChange(e) {
    const q = e.target.value
    setQuery(q)
    onChange(null)
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
    setQuery(''); onChange(null); setSuggestions([]); setOpen(false)
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

/* ── Section divider ── */
function SectionDivider({ label, color = 'rgba(0,180,216,0.5)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
      <span style={{ color, fontSize: '10px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
    </div>
  )
}

/* ── Segment summary (read-only) ── */
function SegmentSummary({ seaSegs, landSegs }) {
  const seaLabels = { bote_buceo: 'Bote de buceo', lancha: 'Lancha rápida', ferry: 'Ferry', none: 'Sin marítimo' }
  const landLabels = { van: 'Van / Minibus', bus: 'Bus público', taxi: 'Taxi / Uber', suv: 'SUV', none: 'Caminando' }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
      {seaSegs.map((s, i) => (
        <span key={i} style={{ background: 'rgba(0,180,216,0.1)', border: '1px solid rgba(0,180,216,0.2)', borderRadius: '8px', padding: '3px 8px', fontSize: '11px', color: '#90e0ef' }}>
          <ShipIcon size={10} style={{ display: 'inline', marginRight: '4px' }} />{seaLabels[s.type] || s.type}{s.hours ? ` · ${s.hours}h` : ''}
        </span>
      ))}
      {landSegs.map((s, i) => (
        <span key={i} style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '8px', padding: '3px 8px', fontSize: '11px', color: '#fde68a' }}>
          <CarIcon size={10} style={{ display: 'inline', marginRight: '4px' }} />{landLabels[s.type] || s.type}{s.km ? ` · ${s.km}km` : ''}
        </span>
      ))}
    </div>
  )
}

/* ── Main Calculator ── */
export default function Calculator() {
  const { API, refreshUser, user } = useAuth()
  const navigate = useNavigate()

  // Destinations
  const [destList, setDestList] = useState([])

  // ── Outbound (IDA) ───────────────────────────────────────
  const [originApt, setOriginApt]     = useState(null)
  const [destination, setDestination] = useState('')
  const [routeStops, setRouteStops]   = useState([])
  const [seaSegments, setSeaSegments]   = useState([{ type: 'bote_buceo', hours: 6 }])
  const [landSegments, setLandSegments] = useState([{ type: 'van', km: null }])

  // ── Return (VUELTA) ─────────────────────────────────────
  const [returnSameAsOutbound, setReturnSameAsOutbound] = useState(null) // null | true | false
  const [returnDepartureApt, setReturnDepartureApt]     = useState(null) // airport at destination for return flight
  const [returnRouteStops, setReturnRouteStops]         = useState([])
  const [returnSeaSegments, setReturnSeaSegments]       = useState([{ type: 'bote_buceo', hours: 6 }])
  const [returnLandSegments, setReturnLandSegments]     = useState([{ type: 'van', km: null }])

  // ── Shared ──────────────────────────────────────────────
  const [passengers, setPassengers]         = useState(1)
  const [expeditions, setExpeditions]       = useState([])
  const [selectedExpId, setSelectedExpId]   = useState(null)
  const [expeditionLocked, setExpeditionLocked] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // Fetch destinations on mount
  useEffect(() => {
    axios.get(`${API}/trips/destinations`).then(r => setDestList(r.data)).catch(() => {})
  }, [])

  // Pre-select origin from user profile city
  useEffect(() => {
    if (user?.origin_city && !originApt) {
      axios.get(`${API}/trips/airports?q=${encodeURIComponent(user.origin_city)}`)
        .then(res => { if (res.data.length > 0) setOriginApt(res.data[0]) })
        .catch(() => {})
    }
  }, [user?.origin_city])

  // Reset route / return state when origin or destination changes
  useEffect(() => {
    setRouteStops([])
    setReturnSameAsOutbound(null)
    setReturnDepartureApt(null)
    setReturnRouteStops([])
  }, [originApt?.iata, destination])

  // Fetch active expeditions when destination changes
  useEffect(() => {
    if (!destination) {
      setExpeditions([]); setSelectedExpId(null); setExpeditionLocked(false); return
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
      setSelectedExpId(null); setExpeditionLocked(false)
      setSeaSegments([{ type: 'bote_buceo', hours: 6 }])
      setLandSegments([{ type: 'van', km: null }])
      setReturnSeaSegments([{ type: 'bote_buceo', hours: 6 }])
      setReturnLandSegments([{ type: 'van', km: null }])
      setPassengers(1); return
    }
    setSelectedExpId(exp.id)
    try {
      const hasFixed = exp.sea_transports || exp.land_transports
      if (exp.sea_transports) {
        const segs = JSON.parse(exp.sea_transports)
        setSeaSegments(segs)
        setReturnSeaSegments(segs)
      }
      if (exp.land_transports) {
        const segs = JSON.parse(exp.land_transports)
        setLandSegments(segs)
        setReturnLandSegments(segs)
      }
      if (exp.fixed_passengers) setPassengers(exp.fixed_passengers)
      setExpeditionLocked(!!hasFixed)
    } catch { setExpeditionLocked(false) }
  }

  function toggleExpedition(exp) {
    if (selectedExpId === exp.id) selectExpedition(null)
    else selectExpedition(exp)
  }

  // ── Outbound helpers ────────────────────────────────────
  function updateSeaSeg(i, val)  { setSeaSegments(s => s.map((x, idx) => idx === i ? val : x)) }
  function addSeaSeg()            { setSeaSegments(s => [...s, { type: 'bote_buceo', hours: 6 }]) }
  function removeSeaSeg(i)        { setSeaSegments(s => s.filter((_, idx) => idx !== i)) }

  function updateLandSeg(i, val) { setLandSegments(s => s.map((x, idx) => idx === i ? val : x)) }
  function addLandSeg()           { setLandSegments(s => [...s, { type: 'van', km: null }]) }
  function removeLandSeg(i)       { setLandSegments(s => s.filter((_, idx) => idx !== i)) }

  function addStop()          { setRouteStops(s => [...s, null]) }
  function removeStop(i)      { setRouteStops(s => s.filter((_, j) => j !== i)) }
  function updateStop(i, apt) { setRouteStops(s => s.map((x, j) => j === i ? apt : x)) }

  // ── Return helpers ──────────────────────────────────────
  function updateReturnSeaSeg(i, val)  { setReturnSeaSegments(s => s.map((x, idx) => idx === i ? val : x)) }
  function addReturnSeaSeg()            { setReturnSeaSegments(s => [...s, { type: 'bote_buceo', hours: 6 }]) }
  function removeReturnSeaSeg(i)        { setReturnSeaSegments(s => s.filter((_, idx) => idx !== i)) }

  function updateReturnLandSeg(i, val) { setReturnLandSegments(s => s.map((x, idx) => idx === i ? val : x)) }
  function addReturnLandSeg()           { setReturnLandSegments(s => [...s, { type: 'van', km: null }]) }
  function removeReturnLandSeg(i)       { setReturnLandSegments(s => s.filter((_, idx) => idx !== i)) }

  function addReturnStop()          { setReturnRouteStops(s => [...s, null]) }
  function removeReturnStop(i)      { setReturnRouteStops(s => s.filter((_, j) => j !== i)) }
  function updateReturnStop(i, apt) { setReturnRouteStops(s => s.map((x, j) => j === i ? apt : x)) }

  async function handleCalculate() {
    if (!originApt || !destination) { setError('Selecciona origen y destino'); return }
    if (routeStops.some(s => s === null)) {
      setError('Completa todas las escalas de ida o elimínalas'); return
    }
    if (returnSameAsOutbound === null) {
      setError('Indica si tu viaje de vuelta es igual o diferente al de ida'); return
    }
    if (!returnSameAsOutbound && returnRouteStops.some(s => s === null)) {
      setError('Completa todas las escalas de vuelta o elimínalas'); return
    }

    setError(''); setLoading(true)

    const outbound = {
      route_waypoints: [originApt.iata, ...routeStops.map(s => s.iata)],
      sea_segments: seaSegments,
      land_segments: landSegments,
    }

    const return_trip = returnSameAsOutbound
      ? { same_as_outbound: true }
      : {
          same_as_outbound: false,
          route_waypoints: returnDepartureApt
            ? [returnDepartureApt.iata, ...returnRouteStops.map(s => s.iata), originApt.iata]
            : [],
          sea_segments:  expeditionLocked ? seaSegments  : returnSeaSegments,
          land_segments: expeditionLocked ? landSegments : returnLandSegments,
        }

    try {
      const res = await axios.post(`${API}/trips/calculate`, {
        origin: originApt.city,
        destination,
        outbound,
        return_trip,
        passengers,
        expedition_id: selectedExpId,
      })
      refreshUser()
      navigate('/results', { state: { result: res.data, origin: originApt.city, destination } })
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
            <PlaneIcon size={13} /> ¿De dónde vuelas?
          </label>
          <CityAutocomplete
            apiBase={API}
            value={originApt}
            onChange={apt => setOriginApt(apt)}
            placeholder="Ciudad o aeropuerto de origen..."
          />
        </div>

        {/* Destination */}
        <div>
          <label className="text-xs text-ocean-foam/60 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <IslandIcon size={13} /> Destino de Buceo
            {expeditionLocked && <span className="ml-auto flex items-center gap-1 text-amber-400/70"><LockIcon size={11} /> bloqueado por expedición</span>}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {destList.length === 0
              ? <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px', gridColumn: '1/-1', textAlign: 'center', padding: '12px 0' }}>Cargando destinos…</p>
              : destList.map(dest => (
                <button key={dest.name} type="button"
                  onClick={() => !expeditionLocked && setDestination(dest.name)}
                  className="py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-150"
                  style={
                    destination === dest.name
                      ? { background: 'linear-gradient(135deg,rgba(0,180,216,0.3),rgba(72,202,228,0.2))', border: '1px solid rgba(0,180,216,0.5)', color: '#90e0ef' }
                      : expeditionLocked
                      ? { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' }
                      : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }
                  }>{dest.name}</button>
              ))
            }
          </div>
        </div>

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
                          <p className="text-[11px] ml-5 mt-0.5 flex items-center gap-1" style={{ color: 'rgba(253,230,138,0.6)' }}><TrophyIcon size={11} />{exp.prize_description}</p>
                        )}
                        {isSelected && exp.sea_transports && (
                          <p className="text-[10px] ml-5 mt-1 flex items-center gap-1" style={{ color: 'rgba(167,139,250,0.6)' }}><LockIcon size={10} />Transporte marítimo y terrestre definidos por Diving Life</p>
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

        {/* ════════════════ IDA ════════════════ */}
        {originApt && destination && (
          <>
            <SectionDivider label="Tramo de ida" color="rgba(0,180,216,0.6)" />

            {/* Expedition lock banner */}
            {expeditionLocked && selectedExp && (
              <div className="rounded-2xl px-4 py-3 animate-fade-in"
                style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.25)' }}>
                <div className="flex items-start gap-2.5">
                  <LockIcon size={15} style={{ color: '#a78bfa', flexShrink: 0, marginTop: '1px' }} />
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(196,181,253,0.7)' }}>
                    Los parámetros de transporte están definidos por <strong style={{ color: '#c4b5fd' }}>Diving Life</strong>.
                    Tu ruta de vuelo personal es libre.
                  </p>
                </div>
              </div>
            )}

            {/* Route builder — IDA */}
            <div className="card animate-fade-in">
              <p className="text-xs text-ocean-foam/60 font-semibold uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <PlaneIcon size={12} /> Ruta de vuelo — Ida
              </p>

              <div className="flex items-center gap-2.5">
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#00b4d8', border: '2px solid #48cae4', flexShrink: 0 }} />
                <span className="text-sm font-bold text-ocean-cyan">{originApt.city} <span style={{ color: 'rgba(0,180,216,0.45)', fontSize: '11px', fontWeight: 400 }}>({originApt.iata})</span></span>
              </div>

              {routeStops.map((stop, i) => (
                <div key={i}>
                  <div style={{ marginLeft: 5, width: 1, height: 14, background: 'rgba(255,255,255,0.1)', margin: '3px 0 3px 5px' }} />
                  <div className="flex items-center gap-2">
                    <div style={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0, background: stop ? 'rgba(251,191,36,0.25)' : 'transparent', border: `2px solid ${stop ? '#fbbf24' : 'rgba(255,255,255,0.2)'}` }} />
                    <CityAutocomplete apiBase={API} value={stop} onChange={apt => updateStop(i, apt)} placeholder="Ciudad de escala..." />
                    <button type="button" onClick={() => removeStop(i)}
                      style={{ flexShrink: 0, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '7px', padding: '5px 9px', color: '#f87171', cursor: 'pointer', fontSize: '13px', lineHeight: 1 }}>
                      ×
                    </button>
                  </div>
                </div>
              ))}

              <div style={{ marginLeft: 5, width: 1, height: 14, background: 'rgba(255,255,255,0.1)', margin: '3px 0 3px 5px' }} />
              <div className="flex items-center gap-2 mb-0.5">
                <div style={{ width: 12, flexShrink: 0 }} />
                <button type="button" onClick={addStop}
                  style={{ background: 'rgba(0,180,216,0.06)', border: '1px dashed rgba(0,180,216,0.25)', borderRadius: '8px', padding: '5px 14px', color: 'rgba(0,180,216,0.65)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                  + Agregar escala
                </button>
              </div>

              <div style={{ marginLeft: 5, width: 1, height: 14, background: 'rgba(255,255,255,0.1)', margin: '3px 0 3px 5px' }} />
              <div className="flex items-center gap-2.5">
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(167,139,250,0.3)', border: '2px solid #a78bfa', flexShrink: 0 }} />
                <span className="text-sm font-bold" style={{ color: '#c4b5fd' }}>{destination}</span>
                {expeditionLocked && <LockIcon size={11} style={{ color: 'rgba(167,139,250,0.5)' }} />}
              </div>

              {routeStops.length > 0 && (
                <p className="text-xs mt-3 pl-5" style={{ color: routeStops.some(s => !s) ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}>
                  {routeStops.some(s => !s) ? '⚠ Completa o elimina las escalas vacías' : `${routeStops.length} escala${routeStops.length > 1 ? 's' : ''}`}
                </p>
              )}
              {routeStops.length === 0 && (
                <p className="text-[11px] mt-3 pl-5 text-ocean-foam/25">Vuelo directo — agrega escalas si tu ruta las tiene</p>
              )}
            </div>

            {/* Sea transport — IDA */}
            <div>
              <label className="text-xs text-ocean-foam/60 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShipIcon size={13} /> Transporte Marítimo — Ida
                {expeditionLocked && <LockIcon size={11} style={{ color: 'rgba(167,139,250,0.5)', marginLeft: 'auto' }} />}
              </label>
              <div className="space-y-2">
                {seaSegments.map((seg, i) => (
                  <SeaSegmentRow key={i} seg={seg}
                    onChange={val => updateSeaSeg(i, val)}
                    onRemove={() => removeSeaSeg(i)}
                    canRemove={seaSegments.length > 1}
                    locked={expeditionLocked} />
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

            {/* Land transport — IDA */}
            <div>
              <label className="text-xs text-ocean-foam/60 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapIcon size={13} /> Transporte Terrestre — Ida
                {expeditionLocked && <LockIcon size={11} style={{ color: 'rgba(167,139,250,0.5)', marginLeft: 'auto' }} />}
              </label>
              <div className="space-y-2">
                {landSegments.map((seg, i) => (
                  <LandSegmentRow key={i} seg={seg}
                    onChange={val => updateLandSeg(i, val)}
                    onRemove={() => removeLandSeg(i)}
                    canRemove={landSegments.length > 1}
                    locked={expeditionLocked} />
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
          </>
        )}

        {/* ════════════════ VUELTA ════════════════ */}
        {originApt && destination && (
          <>
            <SectionDivider label="Tramo de vuelta" color="rgba(167,139,250,0.7)" />

            {/* Same / different toggle */}
            <div className="card animate-fade-in">
              <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <PlaneIcon size={15} /> ¿Tu viaje de vuelta es igual al de ida?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setReturnSameAsOutbound(true)}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all"
                  style={returnSameAsOutbound === true
                    ? { background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.5)', color: '#86efac' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }
                  }>
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>✓</span> Sí, misma ruta
                </button>
                <button type="button" onClick={() => setReturnSameAsOutbound(false)}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all"
                  style={returnSameAsOutbound === false
                    ? { background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.5)', color: '#c4b5fd' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }
                  }>
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>~</span> No, es diferente
                </button>
              </div>
            </div>

            {/* ── Same as outbound: summary ── */}
            {returnSameAsOutbound === true && (
              <div className="rounded-2xl p-4 animate-fade-in"
                style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.2)' }}>
                <p className="text-xs font-bold text-green-400 mb-2 flex items-center gap-1.5">
                  <span style={{ fontSize: '13px' }}>✓</span> Vuelta idéntica a la ida
                </p>
                <p className="text-[11px] mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Ruta: {destination} → {routeStops.length > 0 ? routeStops.filter(Boolean).map(s => s.city).join(' → ') + ' → ' : ''}{originApt.city} ({originApt.iata})
                </p>
                <SegmentSummary seaSegs={seaSegments} landSegs={landSegments} />
              </div>
            )}

            {/* ── Different return: full form ── */}
            {returnSameAsOutbound === false && (
              <div className="space-y-5 animate-fade-in">

                {/* Return route builder */}
                <div className="card">
                  <p className="text-xs text-ocean-foam/60 font-semibold uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <PlaneIcon size={12} /> Ruta de vuelo — Vuelta
                  </p>

                  {/* Departure airport at destination */}
                  <div className="flex items-center gap-2.5 mb-1">
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(167,139,250,0.3)', border: '2px solid #a78bfa', flexShrink: 0 }} />
                    <span className="text-sm font-bold" style={{ color: '#c4b5fd' }}>{destination}</span>
                  </div>
                  <div style={{ marginLeft: 5, width: 1, height: 10, background: 'rgba(255,255,255,0.1)', margin: '3px 0 3px 5px' }} />
                  <div className="flex items-center gap-2">
                    <div style={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0, background: returnDepartureApt ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.05)', border: `2px solid ${returnDepartureApt ? '#fbbf24' : 'rgba(255,255,255,0.2)'}` }} />
                    <CityAutocomplete
                      apiBase={API}
                      value={returnDepartureApt}
                      onChange={apt => setReturnDepartureApt(apt)}
                      placeholder="Aeropuerto de salida (cerca al destino)..."
                    />
                  </div>

                  {returnRouteStops.map((stop, i) => (
                    <div key={i}>
                      <div style={{ marginLeft: 5, width: 1, height: 14, background: 'rgba(255,255,255,0.1)', margin: '3px 0 3px 5px' }} />
                      <div className="flex items-center gap-2">
                        <div style={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0, background: stop ? 'rgba(251,191,36,0.25)' : 'transparent', border: `2px solid ${stop ? '#fbbf24' : 'rgba(255,255,255,0.2)'}` }} />
                        <CityAutocomplete apiBase={API} value={stop} onChange={apt => updateReturnStop(i, apt)} placeholder="Ciudad de escala..." />
                        <button type="button" onClick={() => removeReturnStop(i)}
                          style={{ flexShrink: 0, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '7px', padding: '5px 9px', color: '#f87171', cursor: 'pointer', fontSize: '13px', lineHeight: 1 }}>
                          ×
                        </button>
                      </div>
                    </div>
                  ))}

                  <div style={{ marginLeft: 5, width: 1, height: 14, background: 'rgba(255,255,255,0.1)', margin: '3px 0 3px 5px' }} />
                  <div className="flex items-center gap-2 mb-0.5">
                    <div style={{ width: 12, flexShrink: 0 }} />
                    <button type="button" onClick={addReturnStop}
                      style={{ background: 'rgba(167,139,250,0.06)', border: '1px dashed rgba(167,139,250,0.25)', borderRadius: '8px', padding: '5px 14px', color: 'rgba(167,139,250,0.65)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                      + Agregar escala
                    </button>
                  </div>

                  <div style={{ marginLeft: 5, width: 1, height: 14, background: 'rgba(255,255,255,0.1)', margin: '3px 0 3px 5px' }} />
                  <div className="flex items-center gap-2.5">
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#00b4d8', border: '2px solid #48cae4', flexShrink: 0 }} />
                    <span className="text-sm font-bold text-ocean-cyan">{originApt.city} <span style={{ color: 'rgba(0,180,216,0.45)', fontSize: '11px', fontWeight: 400 }}>({originApt.iata})</span></span>
                  </div>

                  {!returnDepartureApt && (
                    <p className="text-[11px] mt-3 pl-5" style={{ color: 'rgba(251,191,36,0.5)' }}>
                      Selecciona el aeropuerto desde donde sales en el regreso
                    </p>
                  )}
                </div>

                {/* Return sea transport — only if not expedition locked */}
                {expeditionLocked ? (
                  <div className="rounded-2xl px-4 py-3"
                    style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)' }}>
                    <p className="text-xs flex items-center gap-2" style={{ color: 'rgba(196,181,253,0.6)' }}>
                      <LockIcon size={12} /> Transporte marítimo y terrestre de vuelta: definidos por Diving Life (igual que la ida)
                    </p>
                    <SegmentSummary seaSegs={seaSegments} landSegs={landSegments} />
                  </div>
                ) : (
                  <>
                    {/* Return sea */}
                    <div>
                      <label className="text-xs text-ocean-foam/60 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <ShipIcon size={13} /> Transporte Marítimo — Vuelta
                      </label>
                      <div className="space-y-2">
                        {returnSeaSegments.map((seg, i) => (
                          <SeaSegmentRow key={i} seg={seg}
                            onChange={val => updateReturnSeaSeg(i, val)}
                            onRemove={() => removeReturnSeaSeg(i)}
                            canRemove={returnSeaSegments.length > 1}
                            locked={false} />
                        ))}
                      </div>
                      {returnSeaSegments.length < 3 && (
                        <button type="button" onClick={addReturnSeaSeg}
                          className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
                          style={{ background: 'rgba(167,139,250,0.05)', border: '1px dashed rgba(167,139,250,0.2)', color: 'rgba(167,139,250,0.5)' }}>
                          <PlusIcon size={13} /> Añadir tramo marítimo
                        </button>
                      )}
                    </div>

                    {/* Return land */}
                    <div>
                      <label className="text-xs text-ocean-foam/60 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <MapIcon size={13} /> Transporte Terrestre — Vuelta
                      </label>
                      <div className="space-y-2">
                        {returnLandSegments.map((seg, i) => (
                          <LandSegmentRow key={i} seg={seg}
                            onChange={val => updateReturnLandSeg(i, val)}
                            onRemove={() => removeReturnLandSeg(i)}
                            canRemove={returnLandSegments.length > 1}
                            locked={false} />
                        ))}
                      </div>
                      {returnLandSegments.length < 3 && (
                        <button type="button" onClick={addReturnLandSeg}
                          className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
                          style={{ background: 'rgba(167,139,250,0.05)', border: '1px dashed rgba(167,139,250,0.2)', color: 'rgba(167,139,250,0.5)' }}>
                          <PlusIcon size={13} /> Añadir tramo terrestre
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

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
