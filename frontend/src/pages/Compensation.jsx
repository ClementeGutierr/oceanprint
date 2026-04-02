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

      {/* Quote + footer — pinned to bottom via absolute positioning */}
      <div style={{ position:'absolute', bottom:'28px', left:'28px', right:'28px', textAlign:'center' }}>
        <p style={{ fontSize:'11px', color:'rgba(144,224,239,0.35)', fontStyle:'italic',
          lineHeight:'1.55', margin:'0 0 12px', padding:'0 8px' }}>
          "{QUOTES[selected.id]}"
        </p>
        <div style={{ width:'32px', height:'1px', background:'rgba(0,180,216,0.18)', margin:'0 auto 10px' }} />
        <div style={{ fontSize:'8px', color:'rgba(144,224,239,0.2)', letterSpacing:'2px', textTransform:'uppercase' }}>
          oceanprint.co · divinglife.co
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   RECEIPT CARD (captured by html2canvas)
───────────────────────────────────────────── */
function ReceiptCard({ selected, units, user, result, cardRef }) {
  const co2 = result?.co2_compensated ?? selected.co2_per_unit * units
  const cost = selected.cost_per_unit * units
  const pts = result?.points_earned ?? selected.points_per_unit * units
  const txId = result?.id ? `OP-${String(result.id).padStart(6, '0')}` : 'OP-000000'
  const dateStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div ref={cardRef} style={{
      width: '360px', minHeight: '520px',
      background: 'linear-gradient(160deg,#020c1b 0%,#0a1628 50%,#0d3357 100%)',
      fontFamily: "'Inter',system-ui,sans-serif",
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      padding: '32px 28px',
      boxSizing: 'border-box',
    }}>
      {/* Glow */}
      <div style={{ position:'absolute', width:'260px', height:'260px', borderRadius:'50%',
        background:'radial-gradient(circle,rgba(74,222,128,0.06) 0%,transparent 70%)',
        top:'-80px', right:'-60px', pointerEvents:'none' }} />

      {/* Brand + title */}
      <div style={{ textAlign:'center', marginBottom:'24px' }}>
        <div style={{ fontSize:'10px', letterSpacing:'4px', color:'rgba(0,180,216,0.55)',
          fontWeight:'800', textTransform:'uppercase', marginBottom:'4px' }}>OCEAN PRINT</div>
        <div style={{ fontSize:'16px', fontWeight:'900', color:'#ffffff', marginBottom:'2px' }}>
          Comprobante de Compensación
        </div>
        <div style={{ fontSize:'9px', color:'rgba(144,224,239,0.3)', letterSpacing:'2px', textTransform:'uppercase' }}>
          by Diving Life
        </div>
      </div>

      {/* TX ID + date */}
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'20px',
        padding:'10px 14px', borderRadius:'12px',
        background:'rgba(0,180,216,0.07)', border:'1px solid rgba(0,180,216,0.2)' }}>
        <div>
          <div style={{ fontSize:'9px', color:'rgba(144,224,239,0.4)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'3px' }}>ID Transacción</div>
          <div style={{ fontSize:'13px', fontWeight:'700', color:'#48cae4', fontFamily:'monospace' }}>{txId}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:'9px', color:'rgba(144,224,239,0.4)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'3px' }}>Fecha</div>
          <div style={{ fontSize:'11px', fontWeight:'600', color:'rgba(255,255,255,0.7)' }}>{dateStr}</div>
        </div>
      </div>

      {/* Details rows */}
      {[
        { label: 'Opción',        value: selected.name },
        { label: 'Organización',  value: selected.organization },
        { label: 'Unidades',      value: `${units} ${selected.unit}(s)` },
        { label: 'CO₂ compensado',value: `-${co2} kg CO₂`, color: '#4ade80' },
        { label: 'Valor pagado',  value: formatCOP(cost), color: cost === 0 ? '#4ade80' : '#fbbf24' },
        { label: 'Puntos ganados',value: `+${pts} pts`, color: '#a78bfa' },
      ].map(({ label, value, color }) => (
        <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize:'11px', color:'rgba(144,224,239,0.45)' }}>{label}</span>
          <span style={{ fontSize:'12px', fontWeight:'700', color: color || 'rgba(255,255,255,0.85)' }}>{value}</span>
        </div>
      ))}

      {/* User */}
      <div style={{ textAlign:'center', marginTop:'20px', padding:'14px',
        borderRadius:'14px', background:'rgba(0,180,216,0.06)', border:'1px solid rgba(0,180,216,0.15)' }}>
        <div style={{ fontSize:'13px', fontWeight:'700', color:'#ffffff', marginBottom:'3px' }}>
          {user?.name || 'Guardián del Océano'}
        </div>
        <div style={{ fontSize:'11px', color:'#48cae4' }}>{user?.level || 'Plancton'}</div>
      </div>

      {/* Verification badge */}
      <div style={{ marginTop:'16px', textAlign:'center' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:'6px',
          padding:'6px 16px', borderRadius:'20px',
          background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.3)' }}>
          <span style={{ fontSize:'12px' }}>✓</span>
          <span style={{ fontSize:'10px', fontWeight:'700', color:'#4ade80', letterSpacing:'1px', textTransform:'uppercase' }}>Verificado · OceanPrint</span>
        </div>
        <div style={{ fontSize:'8px', color:'rgba(144,224,239,0.2)', marginTop:'8px', letterSpacing:'2px', textTransform:'uppercase' }}>
          oceanprint.co · divinglife.co
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   SOCIAL CARD EXPORT — 1080×1920, absolute positioning, no flexbox
   Captured by html2canvas at scale:1 → exact story dimensions
───────────────────────────────────────────── */
function SocialCardExport({ selected, units, user, result, cardRef }) {
  const co2  = result?.co2_compensated ?? selected.co2_per_unit * units
  const pct  = result?.compensation_pct ?? 0
  const st   = OPTION_DETAILS[selected.id] || OPTION_DETAILS.corales

  return (
    <div ref={cardRef} style={{
      width: '1080px', height: '1920px',
      background: 'linear-gradient(160deg,#020c1b 0%,#0a1628 45%,#0d3357 100%)',
      fontFamily: "'Inter',system-ui,sans-serif",
      position: 'relative', overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
      {/* Glow blobs */}
      <div style={{ position:'absolute', width:'700px', height:'700px', borderRadius:'50%',
        background:'radial-gradient(circle,rgba(0,180,216,0.07) 0%,transparent 70%)',
        top:'-160px', left:'-140px', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:'540px', height:'540px', borderRadius:'50%',
        background:`radial-gradient(circle,${st.glow} 0%,transparent 70%)`,
        bottom:'260px', right:'-100px', pointerEvents:'none' }} />

      {/* Brand */}
      <div style={{ position:'absolute', top:'108px', left:'0', right:'0', textAlign:'center' }}>
        <div style={{ fontSize:'30px', letterSpacing:'12px', color:'rgba(0,180,216,0.55)',
          fontWeight:'800', textTransform:'uppercase', marginBottom:'14px' }}>OCEAN PRINT</div>
        <div style={{ fontSize:'22px', color:'rgba(144,224,239,0.25)', letterSpacing:'8px',
          textTransform:'uppercase' }}>by Diving Life</div>
      </div>

      {/* Divider */}
      <div style={{ position:'absolute', top:'248px', left:'50%', marginLeft:'-48px',
        width:'96px', height:'2px', background:'rgba(0,180,216,0.25)' }} />

      {/* Icon */}
      <div style={{ position:'absolute', top:'292px', left:'0', right:'0', textAlign:'center',
        color: st.accent }}>
        <OptionIcon id={selected.id} size={220} color={st.accent} />
      </div>

      {/* Action text */}
      <div style={{ position:'absolute', top:'580px', left:'80px', right:'80px', textAlign:'center' }}>
        <div style={{ fontSize:'64px', fontWeight:'900', color:'#ffffff', lineHeight:'1.15',
          margin:'0 0 24px 0' }}>
          {getActionText(selected, units)}
        </div>
        <div style={{ fontSize:'32px', color:'rgba(144,224,239,0.45)', fontWeight:'500' }}>
          con {selected.organization}
        </div>
      </div>

      {/* CO₂ badge — centrado con inline-block */}
      <div style={{ position:'absolute', top:'880px', left:'0', right:'0', textAlign:'center' }}>
        <div style={{
          display:'inline-block',
          background:'rgba(0,180,216,0.1)', border:'3px solid rgba(0,180,216,0.28)',
          borderRadius:'56px', padding:'52px 100px', textAlign:'center',
          minWidth:'520px', boxSizing:'border-box',
        }}>
          <div style={{ fontSize:'110px', fontWeight:'900', color:'#00b4d8', lineHeight:'1',
            whiteSpace:'nowrap' }}>
            -{co2} kg
          </div>
          <div style={{ fontSize:'28px', color:'rgba(144,224,239,0.45)', marginTop:'18px',
            letterSpacing:'6px', textTransform:'uppercase', whiteSpace:'nowrap' }}>
            CO₂ COMPENSADO
          </div>
        </div>
      </div>

      {/* User */}
      <div style={{ position:'absolute', top:'1310px', left:'0', right:'0', textAlign:'center' }}>
        <div style={{ fontSize:'44px', fontWeight:'700', color:'#ffffff', marginBottom:'22px' }}>
          {user?.name || 'Guardián del Océano'}
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{
            display:'inline-block',
            background:'rgba(0,180,216,0.12)', border:'2px solid rgba(0,180,216,0.28)',
            borderRadius:'60px', padding:'14px 44px',
            fontSize:'30px', color:'#48cae4', fontWeight:'600',
          }}>
            {user?.level || 'Guardián'}
          </div>
        </div>
        {pct > 0 && (
          <div style={{ fontSize:'28px', color:'rgba(74,222,128,0.65)', marginTop:'22px' }}>
            {pct}% de huella compensada
          </div>
        )}
        {user?.instagram && (
          <div style={{ fontSize:'26px', color:'rgba(225,48,108,0.55)', marginTop:'16px',
            letterSpacing:'1px' }}>
            @{user.instagram}
          </div>
        )}
      </div>

      {/* Quote + footer */}
      <div style={{ position:'absolute', bottom:'90px', left:'80px', right:'80px',
        textAlign:'center' }}>
        <div style={{ fontSize:'30px', color:'rgba(144,224,239,0.35)', fontStyle:'italic',
          lineHeight:'1.55', margin:'0 0 36px 0' }}>
          "{QUOTES[selected.id]}"
        </div>
        <div style={{ width:'96px', height:'2px', background:'rgba(0,180,216,0.18)',
          margin:'0 auto 28px' }} />
        <div style={{ fontSize:'22px', color:'rgba(144,224,239,0.2)', letterSpacing:'6px',
          textTransform:'uppercase' }}>
          oceanprint.co · divinglife.co
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   RECEIPT CARD EXPORT — 600×900px, table rows for pixel-perfect alignment
───────────────────────────────────────────── */
function ReceiptCardExport({ selected, units, user, result, cardRef }) {
  const co2     = result?.co2_compensated ?? selected.co2_per_unit * units
  const cost    = selected.cost_per_unit * units
  const pts     = result?.points_earned ?? selected.points_per_unit * units
  const txId    = result?.id ? `OP-${String(result.id).padStart(6, '0')}` : 'OP-000000'
  const dateStr = new Date().toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' })

  const rows = [
    { label:'Opción',         value: selected.name },
    { label:'Organización',   value: selected.organization },
    { label:'Unidades',       value: `${units} ${selected.unit}(s)` },
    { label:'CO₂ compensado', value: `-${co2} kg CO₂`,  color:'#4ade80' },
    { label:'Valor pagado',   value: formatCOP(cost),    color: cost === 0 ? '#4ade80' : '#fbbf24' },
    { label:'Puntos ganados', value: `+${pts} pts`,      color:'#a78bfa' },
  ]

  return (
    <div ref={cardRef} style={{
      width:'600px', height:'900px',
      background:'linear-gradient(160deg,#020c1b 0%,#0a1628 50%,#0d3357 100%)',
      fontFamily:"'Inter',system-ui,sans-serif",
      position:'relative', overflow:'hidden',
      boxSizing:'border-box', padding:'40px',
    }}>
      {/* Glow */}
      <div style={{ position:'absolute', width:'300px', height:'300px', borderRadius:'50%',
        background:'radial-gradient(circle,rgba(74,222,128,0.06) 0%,transparent 70%)',
        top:'-60px', right:'-40px', pointerEvents:'none' }} />

      {/* Brand + title */}
      <div style={{ textAlign:'center', marginBottom:'26px' }}>
        <div style={{ fontSize:'18px', letterSpacing:'8px', color:'rgba(0,180,216,0.55)',
          fontWeight:'800', textTransform:'uppercase', marginBottom:'8px' }}>OCEAN PRINT</div>
        <div style={{ fontSize:'26px', fontWeight:'900', color:'#ffffff', marginBottom:'5px' }}>
          Comprobante de Compensación
        </div>
        <div style={{ fontSize:'12px', color:'rgba(144,224,239,0.3)', letterSpacing:'4px',
          textTransform:'uppercase' }}>by Diving Life</div>
      </div>

      {/* TX ID + date — floats inside fixed-height row */}
      <div style={{ marginBottom:'20px', padding:'14px 18px', borderRadius:'12px',
        background:'rgba(0,180,216,0.07)', border:'1px solid rgba(0,180,216,0.2)',
        overflow:'hidden' }}>
        <div style={{ float:'left' }}>
          <div style={{ fontSize:'10px', color:'rgba(144,224,239,0.4)', textTransform:'uppercase',
            letterSpacing:'1.5px', marginBottom:'4px' }}>ID Transacción</div>
          <div style={{ fontSize:'20px', fontWeight:'700', color:'#48cae4',
            fontFamily:'monospace', lineHeight:'1' }}>{txId}</div>
        </div>
        <div style={{ float:'right', textAlign:'right' }}>
          <div style={{ fontSize:'10px', color:'rgba(144,224,239,0.4)', textTransform:'uppercase',
            letterSpacing:'1.5px', marginBottom:'4px' }}>Fecha</div>
          <div style={{ fontSize:'13px', fontWeight:'600', color:'rgba(255,255,255,0.7)',
            lineHeight:'1' }}>{dateStr}</div>
        </div>
        <div style={{ clear:'both' }} />
      </div>

      {/* Detail rows — <table> guarantees column alignment */}
      <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:'20px' }}>
        <tbody>
          {rows.map(({ label, value, color }) => (
            <tr key={label}>
              <td style={{
                padding:'10px 0', fontSize:'13px', color:'rgba(144,224,239,0.5)',
                borderBottom:'1px solid rgba(255,255,255,0.05)',
                verticalAlign:'middle', width:'50%',
              }}>{label}</td>
              <td style={{
                padding:'10px 0', fontSize:'14px', fontWeight:'700',
                color: color || 'rgba(255,255,255,0.85)',
                borderBottom:'1px solid rgba(255,255,255,0.05)',
                verticalAlign:'middle', textAlign:'right',
              }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* User block — centered */}
      <div style={{
        textAlign:'center', padding:'16px 20px', marginBottom:'16px',
        borderRadius:'14px', background:'rgba(0,180,216,0.06)',
        border:'1px solid rgba(0,180,216,0.15)',
      }}>
        <div style={{ fontSize:'17px', fontWeight:'700', color:'#ffffff', marginBottom:'5px' }}>
          {user?.name || 'Guardián del Océano'}
        </div>
        <div style={{ fontSize:'13px', color:'#48cae4' }}>{user?.level || 'Plancton'}</div>
      </div>

      {/* Verification badge + footer */}
      <div style={{ textAlign:'center', paddingBottom:'8px' }}>
        <div style={{
          display:'inline-block', padding:'9px 22px', borderRadius:'40px', marginBottom:'14px',
          background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.3)',
        }}>
          <span style={{ fontSize:'13px', marginRight:'5px' }}>✓</span>
          <span style={{ fontSize:'12px', fontWeight:'700', color:'#4ade80',
            letterSpacing:'1.5px', textTransform:'uppercase' }}>Verificado · OceanPrint</span>
        </div>
        <div style={{ fontSize:'11px', color:'rgba(144,224,239,0.2)', letterSpacing:'3px',
          textTransform:'uppercase' }}>
          oceanprint.co · divinglife.co
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MULTI-STEP FLOW MODAL
───────────────────────────────────────────── */
function CompensationFlowModal({ selected, user, API, onClose, onSuccess }) {
  const [step, setStep] = useState(1)
  const [units, setUnits] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('tarjeta')
  const [cardForm, setCardForm] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const [volunteerForm, setVolunteerForm] = useState({
    name: user?.name || '', email: user?.email || '', date: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [shareLoading, setShareLoading] = useState(null) // 'wa' | 'ig' | 'copy' | 'dl' | 'receipt'
  const [toast, setToast] = useState(null)
  const socialCardRef  = useRef(null)   // preview only (unused for export)
  const receiptCardRef = useRef(null)   // legacy (unused for export)
  const socialExportRef  = useRef(null) // 1080×1920 export card
  const receiptExportRef = useRef(null) // 800×1200 export card

  function showToast(msg, duration = 3500) {
    setToast(msg)
    setTimeout(() => setToast(null), duration)
  }

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

  async function markShared() {
    try { await axios.post(`${API}/compensations/shared`) } catch {}
  }

  async function getCanvas() {
    const html2canvas = (await import('html2canvas')).default
    return html2canvas(socialExportRef.current, {
      backgroundColor: '#020c1b',
      useCORS: true,
      scale: 1,
      width: 1080,
      height: 1920,
      scrollX: 0,
      scrollY: 0,
      logging: false,
    })
  }

  async function downloadReceipt() {
    if (!receiptExportRef.current || shareLoading) return
    setShareLoading('receipt')
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(receiptExportRef.current, {
        backgroundColor: '#020c1b',
        useCORS: true,
        scale: 2,
        width: 600,
        height: 900,
        scrollX: 0,
        scrollY: 0,
        logging: false,
      })
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = 'oceanprint-comprobante.png'
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
    } catch (e) { console.error(e) }
    finally { setShareLoading(null) }
  }

  async function downloadCard() {
    if (!socialExportRef.current || shareLoading) return
    setShareLoading('dl')
    try {
      const canvas = await getCanvas()
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = 'oceanprint-compensacion.png'
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      markShared()
    } catch (e) { console.error(e) }
    finally { setShareLoading(null) }
  }

  async function copyToClipboard() {
    if (!socialExportRef.current || shareLoading) return
    setShareLoading('copy')
    try {
      const canvas = await getCanvas()
      await new Promise(resolve => canvas.toBlob(async blob => {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          showToast('✅ Imagen copiada al portapapeles')
          markShared()
        } catch {
          // Clipboard API blocked — fall back to download
          const url = canvas.toDataURL('image/png')
          const a = document.createElement('a')
          a.href = url; a.download = 'oceanprint-compensacion.png'
          document.body.appendChild(a); a.click(); document.body.removeChild(a)
          showToast('Imagen descargada')
        }
        resolve()
      }, 'image/png'))
    } catch (e) { console.error(e) }
    finally { setShareLoading(null) }
  }

  async function shareWhatsApp() {
    if (!socialExportRef.current || shareLoading) return
    setShareLoading('wa')
    const co2n = result?.co2_compensated ?? co2
    const pct  = result?.compensation_pct ?? 0
    const text = [
      `🌊 *Compensé ${co2n} kg de CO₂* con Diving Life`,
      ``,
      `${getActionText(selected, units)} con ${selected.organization}`,
      ``,
      `📊 Soy *${user?.level || 'Guardián'}* — llevo el *${pct}%* de mi huella compensada.`,
      ``,
      `🐠 ¡Únete y protege el océano! 👉 oceanprint.co`,
    ].join('\n')

    try {
      if (navigator.share) {
        // Mobile: Web Share API — try with image first
        const canvas = await getCanvas()
        await new Promise(resolve => canvas.toBlob(async blob => {
          const file = new File([blob], 'oceanprint-compensacion.png', { type: 'image/png' })
          try {
            await navigator.share({
              files: navigator.canShare?.({ files: [file] }) ? [file] : undefined,
              text: `Compensé ${co2n} kg de CO₂ con Diving Life 🌊 Calcula tu huella en oceanprint.co`,
            })
          } catch (e) {
            if (e.name !== 'AbortError') {
              try { await navigator.share({ text }) } catch {}
            }
          }
          resolve()
        }, 'image/png'))
      } else {
        // Desktop: download image + open WhatsApp Web
        const canvas = await getCanvas()
        const url = canvas.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = url; a.download = 'oceanprint-compensacion.png'
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
      }
      markShared()
    } catch (e) { console.error(e) }
    finally { setShareLoading(null) }
  }

  async function shareInstagram() {
    if (!socialExportRef.current || shareLoading) return
    setShareLoading('ig')
    try {
      const canvas = await getCanvas()
      await new Promise(resolve => canvas.toBlob(async blob => {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        } catch {}
        resolve()
      }, 'image/png'))
    } catch (e) { console.error(e) }
    finally { setShareLoading(null) }

    showToast('📋 Imagen copiada. Ábrela en Instagram y pégala en tu Story.', 4000)
    markShared()

    setTimeout(() => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile) {
        window.location.href = 'instagram://story-camera'
        setTimeout(() => window.open('https://www.instagram.com/', '_blank'), 1500)
      } else {
        window.open('https://www.instagram.com/', '_blank')
      }
    }, 2000)
  }

  const STEPS = isVolunteer ? ['Resumen', 'Inscripción', '¡Listo!'] : ['Resumen', 'Pago', '¡Listo!']

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(2,12,27,0.92)', backdropFilter: 'blur(10px)' }}
      onClick={e => step < 3 && e.target === e.currentTarget && onClose()}
    >
      {/* Hidden export cards for html2canvas — fixed pixel dimensions, off-screen */}
      <div style={{ position: 'fixed', top: 0, left: '-2200px', zIndex: -1, pointerEvents: 'none' }}>
        <SocialCardExport
          cardRef={socialExportRef}
          selected={selected}
          units={units}
          user={user}
          result={result}
        />
        <ReceiptCardExport
          cardRef={receiptExportRef}
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

              {/* Units selector */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-white mb-3">
                  ¿Cuántos {selected.unit}s quieres {selected.id === 'voluntariado' ? 'reservar' : 'apoyar'}?
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setUnits(Math.max(1, units - 1))}
                    className="w-11 h-11 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
                    style={{ background: 'rgba(0,180,216,0.15)', color: '#00b4d8' }}
                  >−</button>
                  <div className="flex-1 text-center">
                    <span className="text-3xl font-black gradient-text">{units}</span>
                    <p className="text-ocean-foam/40 text-xs mt-0.5">{selected.unit}(s)</p>
                  </div>
                  <button
                    onClick={() => setUnits(Math.min(100, units + 1))}
                    className="w-11 h-11 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
                    style={{ background: 'rgba(0,180,216,0.15)', color: '#00b4d8' }}
                  >+</button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mt-3">
                  <div className="rounded-xl py-2" style={{ background: 'rgba(0,180,216,0.08)' }}>
                    <p className="text-ocean-cyan font-bold text-sm">-{co2} kg</p>
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
                /* Volunteer registration + guarantee card form */
                <div>
                  <h3 className="text-white font-black text-lg mb-1">Inscripción al voluntariado</h3>
                  <p className="text-ocean-foam/50 text-sm mb-4">
                    Completa tus datos y agrega una tarjeta como garantía de asistencia
                  </p>

                  {/* Guarantee policy notice */}
                  <div
                    className="rounded-2xl p-4 mb-5"
                    style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.3)' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <DiveMaskIcon size={18} style={{ color: '#a78bfa', flexShrink: 0 }} />
                      <p className="text-purple-300 font-bold text-sm">Garantía de asistencia</p>
                    </div>
                    <p className="text-ocean-foam/60 text-xs leading-relaxed mb-3">
                      El voluntariado marino es <span className="text-green-400 font-bold">gratuito</span>, pero para garantizar tu asistencia y respetar el cupo que ocupas, se requiere una tarjeta como garantía:
                    </p>
                    <div className="space-y-2 mb-3">
                      {[
                        { icon: '✅', text: 'Si asistes al voluntariado: no se realiza ningún cobro', color: '#4ade80' },
                        { icon: '⚠️', text: 'Si cancelas con más de 7 días de anticipación: se cobra $100.000 COP', color: '#fbbf24' },
                        { icon: '❌', text: 'Si no cancelas o cancelas con menos de 7 días: se cobra $150.000 COP', color: '#f87171' },
                      ].map(({ icon, text, color }) => (
                        <div key={icon} className="flex items-start gap-2">
                          <span className="text-xs flex-shrink-0 mt-0.5">{icon}</span>
                          <p className="text-xs leading-relaxed" style={{ color }}>{text}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-ocean-foam/35 text-[10px] leading-relaxed border-t border-white/5 pt-2">
                      Esta política existe para proteger los cupos limitados del voluntariado y asegurar que las fundaciones aliadas puedan planificar sus actividades de conservación.
                    </p>
                  </div>

                  {/* Registration fields */}
                  <div className="space-y-3 mb-5">
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

                  {/* Guarantee card section */}
                  <p className="text-xs text-ocean-foam/50 font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <CreditCardIcon size={13} /> Tarjeta de garantía <span className="text-purple-400/60 normal-case font-normal">(no se realizará ningún cobro al inscribirte)</span>
                  </p>

                  {/* Visual card */}
                  <div
                    className="relative rounded-2xl p-5 mb-4 overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg,#4c1d95 0%,#7c3aed 60%,#a78bfa 100%)',
                      height: '160px',
                      boxShadow: '0 8px 32px rgba(124,58,237,0.35)',
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
                    <div className="absolute top-3 left-5 text-white/40 text-[9px] font-bold tracking-widest uppercase">Garantía · Ocean Print</div>
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

                  {/* Demo banner */}
                  <div
                    className="rounded-2xl p-3 flex gap-2.5 mt-4"
                    style={{ background: 'rgba(255,209,102,0.06)', border: '1px solid rgba(255,209,102,0.18)' }}
                  >
                    <span className="flex-shrink-0" style={{ color: '#ffd166' }}><LockIcon size={18} /></span>
                    <div>
                      <p className="text-sand text-xs font-semibold mb-0.5">Modo Demo — Solo garantía</p>
                      <p className="text-ocean-foam/35 text-xs leading-relaxed">
                        En producción se tokenizará la tarjeta de forma segura. No se realiza ningún cobro al inscribirte. Los datos no son almacenados.
                      </p>
                    </div>
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
                  <><DiveMaskIcon size={18} /> Confirmar inscripción (sin cobro)</>
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

              {/* Toast */}
              {toast && (
                <div
                  className="mb-3 px-4 py-2.5 rounded-2xl text-xs font-semibold text-center animate-fade-in"
                  style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80' }}
                >
                  {toast}
                </div>
              )}

              {/* Share label */}
              <p className="text-[10px] text-ocean-cyan/50 font-bold uppercase tracking-widest text-center mb-3 flex items-center justify-center gap-1">
                Comparte tu impacto <OceanWaveIcon size={12} />
              </p>

              {/* Share buttons — 3 cols */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <button
                  onClick={shareWhatsApp}
                  disabled={!!shareLoading}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95 text-xs font-semibold"
                  style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', color: '#25d366' }}
                >
                  {shareLoading === 'wa'
                    ? <span className="inline-block w-5 h-5 border-2 border-green-600/30 border-t-green-400 rounded-full animate-spin" />
                    : <WhatsAppIcon size={20} />}
                  WhatsApp
                </button>
                <button
                  onClick={shareInstagram}
                  disabled={!!shareLoading}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95 text-xs font-semibold"
                  style={{ background: 'rgba(225,48,108,0.1)', border: '1px solid rgba(225,48,108,0.25)', color: '#e1306c' }}
                >
                  {shareLoading === 'ig'
                    ? <span className="inline-block w-5 h-5 border-2 border-pink-600/30 border-t-pink-400 rounded-full animate-spin" />
                    : <InstagramIcon size={20} />}
                  Instagram
                </button>
                <button
                  onClick={copyToClipboard}
                  disabled={!!shareLoading}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95 text-xs font-semibold"
                  style={{ background: 'rgba(0,180,216,0.1)', border: '1px solid rgba(0,180,216,0.25)', color: '#48cae4' }}
                >
                  {shareLoading === 'copy'
                    ? <span className="inline-block w-5 h-5 border-2 border-cyan-600/30 border-t-cyan-400 rounded-full animate-spin" />
                    : <Download size={20} />}
                  Copiar
                </button>
              </div>

              {/* Instagram caption suggestion */}
              <div className="rounded-xl px-3 py-2 mb-3" style={{ background: 'rgba(225,48,108,0.05)', border: '1px solid rgba(225,48,108,0.12)' }}>
                <p className="text-[10px] text-ocean-foam/30 mb-1 font-semibold uppercase tracking-wide">Caption sugerido para Instagram</p>
                <p className="text-[11px] text-ocean-foam/50 leading-relaxed select-all">
                  Compensé {result?.co2_compensated ?? co2} kg de CO₂ con @divinglife.co 🌊🐢 #OceanPrint #ConservacionMarina
                </p>
              </div>

              {/* Download fallback link */}
              <button
                onClick={downloadCard}
                disabled={!!shareLoading}
                className="w-full text-center text-[11px] text-ocean-foam/30 hover:text-ocean-foam/50 transition-colors py-1 mb-2"
              >
                {shareLoading === 'dl' ? 'Descargando…' : '↓ Descargar imagen social'}
              </button>

              {/* Receipt download */}
              <button
                onClick={downloadReceipt}
                disabled={!!shareLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-semibold transition-all active:scale-95 mb-3"
                style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80' }}
              >
                {shareLoading === 'receipt'
                  ? <span className="inline-block w-4 h-4 border-2 border-green-600/30 border-t-green-400 rounded-full animate-spin" />
                  : <><Download size={14} /> Descargar comprobante oficial</>}
              </button>

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
  const [stats, setStats] = useState(null)
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
          return (
            <button
              key={opt.id}
              onClick={() => setSelected(opt)}
              className="w-full text-left rounded-2xl p-4 transition-all duration-200 active:scale-[0.98]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
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

      {selected && (
        <CompensationFlowModal
          selected={selected}
          user={user}
          API={API}
          onClose={() => setSelected(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
