import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { Download } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  LevelIcon, WhatsAppIcon, InstagramIcon, OptionIcon,
  DiveMaskIcon, LockIcon, CreditCardIcon, SparklesIcon,
  OceanWaveIcon, LeafIcon, RefreshIcon, XIcon,
} from '../components/OceanIcons'

const OPTION_DETAILS = {
  corales:      { gradient: 'from-pink-500/20 to-rose-400/10',    border: 'rgba(244,114,182,0.3)', glow: 'rgba(244,114,182,0.15)', accent: '#f472b6' },
  manglares:    { gradient: 'from-emerald-500/20 to-green-400/10', border: 'rgba(52,211,153,0.3)',  glow: 'rgba(52,211,153,0.15)',  accent: '#34d399' },
  limpieza:     { gradient: 'from-blue-500/20 to-cyan-400/10',     border: 'rgba(96,165,250,0.3)',  glow: 'rgba(96,165,250,0.15)',  accent: '#60a5fa' },
  voluntariado: { gradient: 'from-purple-500/20 to-violet-400/10', border: 'rgba(167,139,250,0.3)', glow: 'rgba(167,139,250,0.15)', accent: '#a78bfa' },
}


const QUOTES = {
  corales:      'Cada coral es una vida. El océano te lo agradece.',
  manglares:    'Los manglares son los pulmones del litoral colombiano.',
  limpieza:     'Devolver lo que tomamos. Ese es el primer paso.',
  voluntariado: 'Los guardianes del mar actúan, no solo observan.',
}

function formatCOP(amount) {
  if (amount === 0) return 'Gratis'
  return `$${amount.toLocaleString('es-CO')} COP`
}

function formatCardNumber(v) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatExpiry(v) {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length >= 3 ? d.slice(0, 2) + '/' + d.slice(2) : d
}

function getActionText(selected, units) {
  const n = units
  const p = n > 1
  switch (selected.id) {
    case 'corales':      return `Planté ${n} coral${p ? 'es' : ''} en el Caribe`
    case 'manglares':    return `Sembré ${n} manglar${p ? 'es' : ''} en el litoral`
    case 'limpieza':     return `Patrociné ${n} jornada${p ? 's' : ''} de limpieza costera`
    case 'voluntariado': return `Me uní a ${n} expedición${p ? 'es' : ''} de voluntariado`
    default:             return `Compensé ${n} unidad${p ? 'es' : ''}`
  }
}

/* ─────────────────────────────────────────────
   SOCIAL CARD (captured by html2canvas)
───────────────────────────────────────────── */
function SocialCard({ selected, units, user, result, cardRef }) {
  const co2 = result?.co2_compensated ?? selected.co2_per_unit * units
  const pct = result?.compensation_pct ?? 0
  const style = OPTION_DETAILS[selected.id] || OPTION_DETAILS.corales

  return (
    <div ref={cardRef} style={{
      width: '360px', height: '640px',
      background: 'linear-gradient(160deg,#020c1b 0%,#0a1628 45%,#0d3357 100%)',
      fontFamily: "'Inter',system-ui,sans-serif",
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '36px 28px 28px',
      boxSizing: 'border-box',
    }}>
      {/* Decorative glow blobs */}
      <div style={{ position:'absolute', width:'320px', height:'320px', borderRadius:'50%',
        background:'radial-gradient(circle,rgba(0,180,216,0.07) 0%,transparent 70%)',
        top:'-100px', left:'-80px', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:'220px', height:'220px', borderRadius:'50%',
        background:`radial-gradient(circle,${style.glow} 0%,transparent 70%)`,
        bottom:'100px', right:'-50px', pointerEvents:'none' }} />

      {/* Brand */}
      <div style={{ textAlign:'center', marginBottom:'20px' }}>
        <div style={{ fontSize:'10px', letterSpacing:'4px', color:'rgba(0,180,216,0.55)',
          fontWeight:'800', textTransform:'uppercase', marginBottom:'3px' }}>OCEAN PRINT</div>
        <div style={{ fontSize:'8px', color:'rgba(144,224,239,0.25)', letterSpacing:'3px',
          textTransform:'uppercase' }}>by Diving Life</div>
      </div>

      <div style={{ width:'32px', height:'1px', background:'rgba(0,180,216,0.25)', marginBottom:'26px' }} />

      {/* Hero icon */}
      <div style={{ marginBottom:'18px', textAlign:'center', lineHeight:'1', color: style.accent }}>
        <OptionIcon id={selected.id} size={80} color={style.accent} />
      </div>

      {/* Action */}
      <div style={{ textAlign:'center', marginBottom:'22px' }}>
        <p style={{ fontSize:'21px', fontWeight:'900', color:'#ffffff', lineHeight:'1.2', margin:'0 0 8px' }}>
          {getActionText(selected, units)}
        </p>
        <p style={{ fontSize:'11px', color:'rgba(144,224,239,0.45)', fontWeight:'500', margin:0 }}>
          con {selected.organization}
        </p>
      </div>

      {/* CO2 badge */}
      <div style={{
        background:'rgba(0,180,216,0.1)', border:'1px solid rgba(0,180,216,0.28)',
        borderRadius:'18px', padding:'12px 28px', textAlign:'center', marginBottom:'26px',
      }}>
        <div style={{ fontSize:'38px', fontWeight:'900', color:'#00b4d8', lineHeight:'1' }}>
          -{co2} kg
        </div>
        <div style={{ fontSize:'10px', color:'rgba(144,224,239,0.45)', marginTop:'4px',
          letterSpacing:'1.5px', textTransform:'uppercase' }}>CO₂ compensado</div>
      </div>

      {/* User */}
      <div style={{ textAlign:'center', marginBottom:'20px' }}>
        <div style={{ fontSize:'15px', fontWeight:'700', color:'#ffffff', marginBottom:'6px' }}>
          {user?.name || 'Guardián del Océano'}
        </div>
        <div style={{
          display:'inline-block', background:'rgba(0,180,216,0.12)',
          border:'1px solid rgba(0,180,216,0.28)', borderRadius:'20px',
          padding:'3px 14px', fontSize:'11px', color:'#48cae4', fontWeight:'600',
        }}>
          <LevelIcon level={user?.level || 'Plancton'} size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
          {user?.level || 'Guardián'}
        </div>
        {pct > 0 && (
          <div style={{ fontSize:'10px', color:'rgba(74,222,128,0.65)', marginTop:'7px' }}>
            {pct}% de huella compensada
          </div>
        )}
        {user?.instagram && (
          <div style={{ fontSize:'10px', color:'rgba(225,48,108,0.55)', marginTop:'5px', letterSpacing:'0.5px' }}>
            @{user.instagram}
          </div>
        )}
      </div>

      {/* Quote */}
      <div style={{ flex:1 }} />
      <p style={{ fontSize:'11px', color:'rgba(144,224,239,0.35)', fontStyle:'italic',
        lineHeight:'1.55', textAlign:'center', marginBottom:'14px',
        padding:'0 8px', margin:'0 0 14px' }}>
        "{QUOTES[selected.id]}"
      </p>

      <div style={{ width:'32px', height:'1px', background:'rgba(0,180,216,0.18)', marginBottom:'10px' }} />
      <div style={{ fontSize:'8px', color:'rgba(144,224,239,0.2)', letterSpacing:'2px', textTransform:'uppercase' }}>
        oceanprint.co · divinglife.co
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MULTI-STEP FLOW MODAL
───────────────────────────────────────────── */
function CompensationFlowModal({ selected, units, user, API, onClose, onSuccess }) {
  const [step, setStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('tarjeta')
  const [cardForm, setCardForm] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const [volunteerForm, setVolunteerForm] = useState({
    name: user?.name || '', email: user?.email || '', date: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const socialCardRef = useRef(null)

  const isVolunteer = selected.id === 'voluntariado'
  const co2 = selected.co2_per_unit * units
  const cost = selected.cost_per_unit * units
  const pts = selected.points_per_unit * units
  const style = OPTION_DETAILS[selected.id] || OPTION_DETAILS.corales

  async function handleConfirm() {
    setSubmitting(true)
    try {
      const res = await axios.post(`${API}/compensations`, { type: selected.id, units })
      setResult(res.data)
      onSuccess(res.data)
      setStep(3)
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  async function downloadCard() {
    if (!socialCardRef.current || downloading) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(socialCardRef.current, {
        backgroundColor: null, useCORS: true, scale: 2, logging: false,
      })
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = 'oceanprint-compensacion.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e) {
      console.error(e)
    } finally {
      setDownloading(false)
    }
  }

  function shareWhatsApp() {
    const co2n = result?.co2_compensated ?? co2
    const pct  = result?.compensation_pct ?? 0
    const text = [
      `🌊 *Acabo de compensar ${co2n} kg de CO₂*`,
      ``,
      `${selected.icon} ${getActionText(selected, units)}`,
      `con ${selected.organization}`,
      ``,
      `📊 Soy *${user?.level || 'Guardián'}* y llevo el *${pct}%* de mi huella compensada.`,
      ``,
      `🐠 ¡Únete y protege el océano!`,
      `👉 oceanprint.co`,
    ].join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  async function shareInstagram() {
    // Download the image — Instagram requires manual upload from camera roll
    await downloadCard()
  }

  const STEPS = isVolunteer ? ['Resumen', 'Inscripción', '¡Listo!'] : ['Resumen', 'Pago', '¡Listo!']

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(2,12,27,0.92)', backdropFilter: 'blur(10px)' }}
      onClick={e => step < 3 && e.target === e.currentTarget && onClose()}
    >
      {/* Hidden full-size card for html2canvas */}
      <div style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -1 }}>
        <SocialCard
          cardRef={socialCardRef}
          selected={selected}
          units={units}
          user={user}
          result={result}
        />
      </div>

      <div
        className="w-full max-w-[480px] rounded-3xl overflow-y-auto animate-slide-up"
        style={{
          maxHeight: '90vh',
          background: 'linear-gradient(180deg,#0d2137 0%,#0a1628 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 pb-10">
          {/* Header with X button */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <OptionIcon id={selected.id} size={18} color={(OPTION_DETAILS[selected.id] || OPTION_DETAILS.corales).accent} />
              <span className="text-sm font-bold text-white">{selected.name}</span>
            </div>
            {step < 3 && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
              >
                <XIcon size={16} />
              </button>
            )}
          </div>

          {/* Step indicator */}
          <div className="flex items-center mb-6">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={
                      step > i + 1
                        ? { background: '#00b4d8', color: '#020c1b' }
                        : step === i + 1
                        ? { background: 'rgba(0,180,216,0.18)', border: '1px solid rgba(0,180,216,0.5)', color: '#00b4d8' }
                        : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)' }
                    }
                  >
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                  <span className="text-[9px] font-semibold whitespace-nowrap"
                    style={{ color: step === i + 1 ? '#48cae4' : 'rgba(255,255,255,0.25)' }}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-2 mb-4"
                    style={{ background: step > i + 1 ? 'rgba(0,180,216,0.4)' : 'rgba(255,255,255,0.08)' }} />
                )}
              </div>
            ))}
          </div>

          {/* ── STEP 1: RESUMEN ── */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div
                className="rounded-3xl p-5 mb-5"
                style={{ background: `linear-gradient(135deg, ${style.glow}, rgba(2,12,27,0.6))`, border: `1px solid ${style.border}` }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div style={{ color: style.accent }}><OptionIcon id={selected.id} size={44} color={style.accent} /></div>
                  <div>
                    <p className="text-white font-black text-lg leading-tight">{selected.name}</p>
                    <p className="text-ocean-foam/50 text-xs mt-0.5">{selected.organization}</p>
                  </div>
                </div>
                <p className="text-ocean-foam/50 text-sm leading-relaxed mb-4">{selected.description}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl py-3" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <p className="text-white font-black text-xl">{units}</p>
                    <p className="text-ocean-foam/40 text-[10px] mt-0.5">{selected.unit}(s)</p>
                  </div>
                  <div className="rounded-2xl py-3" style={{ background: 'rgba(0,180,216,0.1)' }}>
                    <p className="text-ocean-cyan font-black text-xl">-{co2}</p>
                    <p className="text-ocean-foam/40 text-[10px] mt-0.5">kg CO₂</p>
                  </div>
                  <div className="rounded-2xl py-3" style={{ background: 'rgba(255,209,102,0.08)' }}>
                    <p className="text-sand font-black text-xl">+{pts}</p>
                    <p className="text-ocean-foam/40 text-[10px] mt-0.5">puntos</p>
                  </div>
                </div>
                {cost > 0 && (
                  <div className="mt-3 text-center">
                    <p className="text-white font-bold text-lg">{formatCOP(cost)}</p>
                    <p className="text-ocean-foam/30 text-xs">Valor total</p>
                  </div>
                )}
              </div>
              <button onClick={() => setStep(2)} className="btn-primary w-full">
                Continuar →
              </button>
              <button onClick={onClose} className="w-full text-center text-xs text-ocean-foam/30 mt-3 py-2">
                Cancelar
              </button>
            </div>
          )}

          {/* ── STEP 2: PAGO o INSCRIPCIÓN ── */}
          {step === 2 && (
            <div className="animate-fade-in">
              {isVolunteer ? (
                /* Volunteer registration form */
                <div>
                  <h3 className="text-white font-black text-lg mb-1">Inscripción</h3>
                  <p className="text-ocean-foam/50 text-sm mb-5">
                    Completa tus datos para reservar tu cupo en la expedición marina
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-ocean-foam/50 font-semibold uppercase tracking-wider mb-1.5 block">
                        Nombre completo
                      </label>
                      <input
                        className="input-field"
                        value={volunteerForm.name}
                        onChange={e => setVolunteerForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-ocean-foam/50 font-semibold uppercase tracking-wider mb-1.5 block">
                        Email de contacto
                      </label>
                      <input
                        className="input-field"
                        type="email"
                        value={volunteerForm.email}
                        onChange={e => setVolunteerForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="tu@email.com"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-ocean-foam/50 font-semibold uppercase tracking-wider mb-1.5 block">
                        Fecha preferida de expedición
                      </label>
                      <input
                        className="input-field"
                        type="date"
                        value={volunteerForm.date}
                        onChange={e => setVolunteerForm(f => ({ ...f, date: e.target.value }))}
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>
                  <div
                    className="rounded-2xl p-3 flex gap-2 mt-4"
                    style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)' }}
                  >
                    <span className="flex-shrink-0 text-purple-400"><DiveMaskIcon size={18} /></span>
                    <p className="text-ocean-foam/40 text-xs leading-relaxed">
                      Te contactaremos por email para confirmar tu cupo y darte los detalles de la expedición.
                    </p>
                  </div>
                </div>
              ) : (
                /* Payment form */
                <div>
                  <h3 className="text-white font-black text-lg mb-1">Método de pago</h3>
                  <p className="text-ocean-foam/50 text-sm mb-4">
                    Total a pagar: <span className="text-ocean-cyan font-bold">{formatCOP(cost)}</span>
                  </p>

                  {/* Payment method tabs */}
                  <div
                    className="grid grid-cols-3 gap-1 p-1 rounded-2xl mb-5"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    {[
                      { id: 'tarjeta',       Icon: CreditCardIcon, label: 'Tarjeta' },
                      { id: 'transferencia', Icon: RefreshIcon,     label: 'Transf.' },
                      { id: 'pse',           Icon: LockIcon,        label: 'PSE'     },
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className="py-2 rounded-xl text-xs font-semibold transition-all"
                        style={
                          paymentMethod === m.id
                            ? { background: 'rgba(0,180,216,0.18)', color: '#48cae4', border: '1px solid rgba(0,180,216,0.35)' }
                            : { color: 'rgba(255,255,255,0.35)', border: '1px solid transparent' }
                        }
                      >
                        <span className="flex items-center justify-center gap-1"><m.Icon size={13} /> {m.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Credit card */}
                  {paymentMethod === 'tarjeta' && (
                    <div>
                      {/* Visual card */}
                      <div
                        className="relative rounded-2xl p-5 mb-4 overflow-hidden"
                        style={{
                          background: 'linear-gradient(135deg,#0077b6 0%,#00b4d8 60%,#48cae4 100%)',
                          height: '160px',
                          boxShadow: '0 8px 32px rgba(0,119,182,0.45)',
                        }}
                      >
                        <div style={{ position:'absolute', width:'180px', height:'180px', borderRadius:'50%',
                          background:'rgba(255,255,255,0.06)', top:'-60px', right:'-40px' }} />
                        <div style={{ position:'absolute', width:'120px', height:'120px', borderRadius:'50%',
                          background:'rgba(255,255,255,0.04)', bottom:'-40px', left:'20px' }} />
                        <div className="absolute top-4 right-5 flex gap-[-6px]">
                          <div className="w-7 h-7 rounded-full" style={{ background: 'rgba(255,130,0,0.85)' }} />
                          <div className="w-7 h-7 rounded-full -ml-3" style={{ background: 'rgba(220,0,0,0.6)' }} />
                        </div>
                        <div className="absolute top-4 left-5 text-white/30 text-[9px] font-bold tracking-widest uppercase">
                          Ocean Print
                        </div>
                        <div className="absolute top-10 left-5 text-white font-mono text-base tracking-widest drop-shadow">
                          {formatCardNumber(cardForm.number) || '•••• •••• •••• ••••'}
                        </div>
                        <div className="absolute bottom-4 left-5">
                          <div className="text-white/40 text-[9px] uppercase tracking-wider">Titular</div>
                          <div className="text-white text-sm font-mono uppercase truncate max-w-[160px]">
                            {cardForm.name || 'NOMBRE APELLIDO'}
                          </div>
                        </div>
                        <div className="absolute bottom-4 right-5 text-right">
                          <div className="text-white/40 text-[9px] uppercase tracking-wider">Vence</div>
                          <div className="text-white text-sm font-mono">{cardForm.expiry || 'MM/AA'}</div>
                        </div>
                      </div>

                      {/* Card inputs */}
                      <div className="space-y-3">
                        <input
                          className="input-field font-mono"
                          placeholder="0000 0000 0000 0000"
                          value={cardForm.number}
                          onChange={e => setCardForm(f => ({ ...f, number: formatCardNumber(e.target.value) }))}
                          maxLength={19}
                        />
                        <input
                          className="input-field"
                          placeholder="Nombre como aparece en la tarjeta"
                          value={cardForm.name}
                          onChange={e => setCardForm(f => ({ ...f, name: e.target.value.toUpperCase() }))}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            className="input-field font-mono"
                            placeholder="MM/AA"
                            value={cardForm.expiry}
                            onChange={e => setCardForm(f => ({ ...f, expiry: formatExpiry(e.target.value) }))}
                            maxLength={5}
                          />
                          <input
                            className="input-field font-mono"
                            placeholder="CVV"
                            value={cardForm.cvv}
                            onChange={e => setCardForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                            maxLength={4}
                            type="password"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bank transfer */}
                  {paymentMethod === 'transferencia' && (
                    <div
                      className="rounded-2xl p-4 space-y-2.5"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <p className="text-[10px] text-ocean-cyan/60 font-bold uppercase tracking-widest mb-3">
                        Datos para transferencia
                      </p>
                      {[
                        ['Banco',           'Bancolombia'],
                        ['Tipo',            'Cuenta de Ahorros'],
                        ['Número',          '236-123456-78'],
                        ['A nombre de',     'Diving Life SAS'],
                        ['NIT',             '900.123.456-7'],
                        ['Valor',           formatCOP(cost)],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-ocean-foam/40 text-xs">{label}</span>
                          <span className="text-white text-xs font-semibold font-mono">{value}</span>
                        </div>
                      ))}
                      <p className="text-ocean-foam/25 text-[10px] pt-1 border-t border-white/5">
                        Envía el comprobante a pagos@divinglife.co indicando tu nombre
                      </p>
                    </div>
                  )}

                  {/* PSE */}
                  {paymentMethod === 'pse' && (
                    <div className="space-y-3">
                      <select
                        className="input-field"
                        style={{ colorScheme: 'dark' }}
                        defaultValue=""
                      >
                        <option value="" disabled>Selecciona tu banco</option>
                        {['Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA Colombia',
                          'Banco Popular', 'Colpatria', 'Banco de Occidente', 'Nequi'].map(b => (
                          <option key={b}>{b}</option>
                        ))}
                      </select>
                      <input className="input-field" placeholder="Número de cédula o NIT" />
                      <select className="input-field" style={{ colorScheme: 'dark' }}>
                        <option>Persona Natural</option>
                        <option>Persona Jurídica</option>
                      </select>
                    </div>
                  )}

                  {/* Demo banner */}
                  <div
                    className="rounded-2xl p-3 flex gap-2.5 mt-4"
                    style={{ background: 'rgba(255,209,102,0.06)', border: '1px solid rgba(255,209,102,0.18)' }}
                  >
                    <span className="flex-shrink-0" style={{ color: '#ffd166' }}><LockIcon size={18} /></span>
                    <div>
                      <p className="text-sand text-xs font-semibold mb-0.5">Modo Demo</p>
                      <p className="text-ocean-foam/35 text-xs leading-relaxed">
                        En producción se conectará la pasarela de pagos certificada de Diving Life.
                        Ningún dato es procesado ni almacenado.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-5"
              >
                {submitting ? (
                  <span className="inline-block w-5 h-5 border-2 border-ocean-deep/40 border-t-ocean-deep rounded-full animate-spin" />
                ) : isVolunteer ? (
                  <><DiveMaskIcon size={18} /> Confirmar inscripción</>
                ) : (
                  <><CreditCardIcon size={18} /> Confirmar pago</>
                )}
              </button>
              <button onClick={() => setStep(1)} className="w-full text-center text-xs text-ocean-foam/30 mt-3 py-2">
                ← Volver al resumen
              </button>
            </div>
          )}

          {/* ── STEP 3: ÉXITO + TARJETA SOCIAL ── */}
          {step === 3 && result && (
            <div className="animate-fade-in">
              {/* Celebration header */}
              <div className="text-center mb-6">
                <div className="mb-3 animate-float flex justify-center text-green-400"><SparklesIcon size={52} /></div>
                <h3 className="text-white font-black text-2xl mb-1">¡Compensación lista!</h3>
                <p className="text-ocean-foam/50 text-sm">
                  +{result.points_earned} pts · -{result.co2_compensated} kg CO₂
                </p>
                {result.compensation_pct > 0 && (
                  <div
                    className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }}
                  >
                    <span className="inline-flex items-center gap-1"><OceanWaveIcon size={13} /> {result.compensation_pct}% de tu huella compensada</span>
                  </div>
                )}
              </div>

              {/* Social card preview (scaled) */}
              <div
                className="rounded-2xl overflow-hidden mb-5"
                style={{ height: '352px', position: 'relative' }}
              >
                <div style={{ transform: 'scale(0.55)', transformOrigin: 'top center', pointerEvents: 'none' }}>
                  <SocialCard
                    selected={selected} units={units} user={user} result={result}
                    cardRef={null}
                  />
                </div>
              </div>

              {/* Share label */}
              <p className="text-[10px] text-ocean-cyan/50 font-bold uppercase tracking-widest text-center mb-3 flex items-center justify-center gap-1">
                Comparte tu impacto <OceanWaveIcon size={12} />
              </p>

              {/* Share buttons */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={downloadCard}
                  disabled={downloading}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95 text-xs font-semibold"
                  style={{ background: 'rgba(0,180,216,0.1)', border: '1px solid rgba(0,180,216,0.25)', color: '#48cae4' }}
                >
                  {downloading
                    ? <span className="text-xl">⏳</span>
                    : <Download size={20} />}
                  {downloading ? 'Generando…' : 'Descargar'}
                </button>
                <button
                  onClick={shareWhatsApp}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95 text-xs font-semibold"
                  style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', color: '#25d366' }}
                >
                  <WhatsAppIcon size={20} />
                  WhatsApp
                </button>
                <button
                  onClick={shareInstagram}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95 text-xs font-semibold"
                  style={{ background: 'rgba(225,48,108,0.1)', border: '1px solid rgba(225,48,108,0.25)', color: '#e1306c' }}
                >
                  <InstagramIcon size={20} />
                  Instagram
                </button>
              </div>

              <p className="text-ocean-foam/25 text-[10px] text-center mb-4">
                Instagram: descarga la imagen y compártela desde tu galería
              </p>

              <button onClick={onClose} className="btn-primary w-full">
                Continuar →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ─────────────────────────────────────────────
   PÁGINA PRINCIPAL DE COMPENSACIÓN
───────────────────────────────────────────── */
export default function Compensation() {
  const [options, setOptions] = useState([])
  const [selected, setSelected] = useState(null)
  const [units, setUnits] = useState(1)
  const [stats, setStats] = useState(null)
  const [showFlow, setShowFlow] = useState(false)
  const { API, user, refreshUser } = useAuth()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [optRes, profRes] = await Promise.all([
        axios.get(`${API}/compensations/options`),
        axios.get(`${API}/profile`),
      ])
      setOptions(optRes.data)
      setStats(profRes.data)
    } catch (e) {
      console.error(e)
    }
  }

  function handleSuccess() {
    refreshUser()
    fetchData()
  }

  const compensationPct = stats
    ? (stats.total_co2 > 0 ? Math.min(100, Math.round((stats.compensated_co2 / stats.total_co2) * 100)) : 0)
    : 0

  const co2ToCompensate = selected ? selected.co2_per_unit * units : 0
  const cost = selected ? selected.cost_per_unit * units : 0
  const pts  = selected ? selected.points_per_unit * units : 0

  return (
    <div className="px-5 pt-8 pb-6 animate-fade-in">
      <div className="mb-6">
        <p className="text-ocean-cyan/70 text-xs font-semibold uppercase tracking-widest mb-1">Restaura el balance</p>
        <h1 className="text-3xl font-black text-white flex items-center gap-2">Compensar <LeafIcon size={28} /></h1>
      </div>

      {/* Progress */}
      <div className="card-glow mb-5">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="font-bold text-white">Tu progreso de compensación</p>
            <p className="text-ocean-foam/40 text-xs mt-0.5">
              {stats ? `${Math.round(stats.compensated_co2)} kg compensados de ${Math.round(stats.total_co2)} kg totales` : '—'}
            </p>
          </div>
          <p className="text-3xl font-black gradient-text">{compensationPct}%</p>
        </div>
        <div className="progress-bar h-4">
          <div className="progress-fill h-full" style={{ width: `${compensationPct}%` }} />
        </div>
        {compensationPct >= 100 && (
          <div className="text-center mt-3 text-green-400 font-bold text-sm animate-pulse-glow">
            <span className="inline-flex items-center gap-1.5"><OceanWaveIcon size={16} /> ¡Huella completamente compensada! ¡Eres un guardián del océano!</span>
          </div>
        )}
      </div>

      {/* Options */}
      <h3 className="text-xs text-ocean-foam/50 font-semibold uppercase tracking-wider mb-3">Elige cómo compensar</h3>
      <div className="space-y-3 mb-5">
        {options.map(opt => {
          const style = OPTION_DETAILS[opt.id] || OPTION_DETAILS.corales
          const isSelected = selected?.id === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => { setSelected(opt); setUnits(1) }}
              className="w-full text-left rounded-2xl p-4 transition-all duration-200 active:scale-[0.98]"
              style={
                isSelected
                  ? { background: `linear-gradient(135deg, ${style.glow}, rgba(2,12,27,0.4))`, border: `1px solid ${style.border}`, boxShadow: `0 4px 20px ${style.glow}` }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }
              }
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5" style={{ color: (OPTION_DETAILS[opt.id] || OPTION_DETAILS.corales).accent }}><OptionIcon id={opt.id} size={26} color={(OPTION_DETAILS[opt.id] || OPTION_DETAILS.corales).accent} /></span>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-white text-sm">{opt.name}</p>
                    <span className="badge text-xs flex-shrink-0" style={{ background: 'rgba(255,209,102,0.1)', color: '#ffd166' }}>
                      +{opt.points_per_unit}pts/{opt.unit}
                    </span>
                  </div>
                  <p className="text-ocean-foam/50 text-xs mt-0.5">{opt.organization}</p>
                  <p className="text-ocean-foam/40 text-xs mt-1 leading-relaxed">{opt.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs" style={{ color: '#4ade80' }}>-{opt.co2_per_unit} kg CO₂/{opt.unit}</span>
                    <span className="text-xs text-ocean-foam/50">{formatCOP(opt.cost_per_unit)}/{opt.unit}</span>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Units + CTA */}
      {selected && (
        <div className="card-glow space-y-4 animate-scale-in">
          <div>
            <p className="text-sm font-semibold text-white mb-2">
              ¿Cuántos {selected.unit}s quieres {selected.id === 'voluntariado' ? 'reservar' : 'apoyar'}?
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setUnits(Math.max(1, units - 1))}
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold"
                style={{ background: 'rgba(0,180,216,0.15)', color: '#00b4d8' }}
              >−</button>
              <div className="flex-1 text-center">
                <span className="text-3xl font-black gradient-text">{units}</span>
                <p className="text-ocean-foam/40 text-xs">{selected.unit}(s)</p>
              </div>
              <button
                onClick={() => setUnits(Math.min(100, units + 1))}
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold"
                style={{ background: 'rgba(0,180,216,0.15)', color: '#00b4d8' }}
              >+</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl py-2" style={{ background: 'rgba(0,180,216,0.08)' }}>
              <p className="text-ocean-cyan font-bold text-sm">-{co2ToCompensate} kg</p>
              <p className="text-ocean-foam/40 text-xs">CO₂</p>
            </div>
            <div className="rounded-xl py-2" style={{ background: 'rgba(255,209,102,0.08)' }}>
              <p className="text-sand font-bold text-sm">+{pts} pts</p>
              <p className="text-ocean-foam/40 text-xs">Puntos</p>
            </div>
            <div className="rounded-xl py-2" style={{ background: 'rgba(52,211,153,0.08)' }}>
              <p className="text-green-400 font-bold text-sm">{formatCOP(cost)}</p>
              <p className="text-ocean-foam/40 text-xs">Costo</p>
            </div>
          </div>

          <button onClick={() => setShowFlow(true)} className="btn-primary w-full flex items-center justify-center gap-2">
            <OptionIcon id={selected.id} size={18} color="currentColor" /> Continuar con la compensación →
          </button>
        </div>
      )}

      {showFlow && selected && (
        <CompensationFlowModal
          selected={selected}
          units={units}
          user={user}
          API={API}
          onClose={() => { setShowFlow(false); setSelected(null); setUnits(1) }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
