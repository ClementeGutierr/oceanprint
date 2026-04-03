import { useState, useEffect } from 'react'
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
   CANVAS 2D HELPERS & GENERATORS
───────────────────────────────────────────── */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line); line = word
    } else { line = test }
  }
  if (line) lines.push(line)
  return lines
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y,     x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x,     y + h, r)
  ctx.arcTo(x,     y + h, x,     y,     r)
  ctx.arcTo(x,     y,     x + w, y,     r)
  ctx.closePath()
}

const CANVAS_STYLES = {
  corales:      { accent: '#f472b6', glow: 'rgba(244,114,182,0.22)', bgFrom: '#1a0818', bgTo: '#2d0f2f' },
  manglares:    { accent: '#34d399', glow: 'rgba(52,211,153,0.22)',  bgFrom: '#041a12', bgTo: '#082d1e' },
  limpieza:     { accent: '#60a5fa', glow: 'rgba(96,165,250,0.22)',  bgFrom: '#041228', bgTo: '#071d42' },
  voluntariado: { accent: '#a78bfa', glow: 'rgba(167,139,250,0.22)', bgFrom: '#0e0828', bgTo: '#170d42' },
}

// Build inline SVG data URL for each option icon (uses same paths as OceanIcons.jsx)
function getOptionIconDataUrl(id, color, size) {
  const c = color.replace('#', '%23')
  const attrs = `stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"`
  const inner = {
    corales: `
      <path d="M12 21 L12 15" ${attrs}/>
      <path d="M12 15 L8 10" ${attrs}/>
      <path d="M12 15 L16 10" ${attrs}/>
      <path d="M8 10 L6 6" ${attrs}/>
      <path d="M8 10 L10 6" ${attrs}/>
      <path d="M16 10 L14 6" ${attrs}/>
      <path d="M16 10 L18 6" ${attrs}/>
      <path d="M12 15 L12 11" ${attrs}/>
      <path d="M11 21 Q12 23 13 21" ${attrs}/>`,
    manglares: `
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" ${attrs}/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" ${attrs}/>`,
    limpieza: `
      <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" ${attrs}/>
      <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" ${attrs}/>
      <path d="m14 16-3 3 3 3" ${attrs}/>
      <path d="M8.293 13.596 7.196 9.5 3.1 10.598" ${attrs}/>
      <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843" ${attrs}/>
      <path d="m13.378 9.633 4.096 1.098 1.097-4.096" ${attrs}/>`,
    voluntariado: `
      <rect x="3" y="8" width="18" height="10" rx="3" ${attrs}/>
      <rect x="4" y="9" width="6" height="7" rx="2" ${attrs}/>
      <rect x="14" y="9" width="6" height="7" rx="2" ${attrs}/>
      <path d="M10 12.5 L14 12.5" ${attrs}/>
      <path d="M3 11 Q1 8 3 6 Q6 4 8 8" ${attrs}/>
      <path d="M21 11 Q23 8 21 6 Q18 4 16 8" ${attrs}/>`,
  }
  const paths = inner[id] || inner.corales
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">${paths}</svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

function loadOptionIcon(id, color, size) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null) // graceful fallback
    img.src = getOptionIconDataUrl(id, color, size)
  })
}

async function generateSocialCard(selected, units, result, user) {
  const W = 1080, H = 1920
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  const opt = CANVAS_STYLES[selected.id] || CANVAS_STYLES.corales
  const co2 = result?.co2_compensated ?? selected.co2_per_unit * units
  const pct = result?.compensation_pct ?? 0
  const treeMonths = Math.max(1, Math.round(co2 / 1.75))

  // Load SVG icon
  const iconImg = await loadOptionIcon(selected.id, opt.accent, 300)

  // ── Background: rich dark gradient with option-color tint ─────────
  const bg = ctx.createLinearGradient(0, 0, W * 0.6, H)
  bg.addColorStop(0, '#010c1e')
  bg.addColorStop(0.45, '#041e3a')
  bg.addColorStop(1, '#072f5a')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

  // Option-color ambient wash (top-left)
  const wash1 = ctx.createRadialGradient(-60, -80, 0, -60, -80, 780)
  wash1.addColorStop(0, opt.glow.replace('0.22', '0.14'))
  wash1.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = wash1; ctx.fillRect(0, 0, W, H)

  // Cyan ambient (bottom-right)
  const wash2 = ctx.createRadialGradient(W + 60, H * 0.65, 0, W + 60, H * 0.65, 700)
  wash2.addColorStop(0, 'rgba(0,180,216,0.10)')
  wash2.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = wash2; ctx.fillRect(0, 0, W, H)

  // ── Light rays behind icon ────────────────────────────────────────
  const iconCX = W / 2, iconCY = 430
  ctx.save()
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2
    const spread = Math.PI / 18
    const rayGrad = ctx.createRadialGradient(iconCX, iconCY, 80, iconCX, iconCY, 660)
    rayGrad.addColorStop(0, opt.glow.replace('0.22', '0.18'))
    rayGrad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = rayGrad
    ctx.beginPath()
    ctx.moveTo(iconCX, iconCY)
    ctx.arc(iconCX, iconCY, 660, angle - spread, angle + spread)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()

  // ── Bright radial glow at icon center ─────────────────────────────
  const iconGlow = ctx.createRadialGradient(iconCX, iconCY, 0, iconCX, iconCY, 380)
  iconGlow.addColorStop(0, opt.glow.replace('0.22', '0.42'))
  iconGlow.addColorStop(0.35, opt.glow.replace('0.22', '0.18'))
  iconGlow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = iconGlow; ctx.fillRect(0, 0, W, H)

  // ── Header ───────────────────────────────────────────────────────
  ctx.textAlign = 'center'
  ctx.letterSpacing = '14px'
  ctx.font = '800 32px Inter, system-ui, sans-serif'
  ctx.fillStyle = 'rgba(0,180,216,0.7)'
  ctx.fillText('OCEAN  PRINT', W / 2, 108)
  ctx.letterSpacing = '8px'
  ctx.font = '400 22px Inter, system-ui, sans-serif'
  ctx.fillStyle = 'rgba(144,224,239,0.34)'
  ctx.fillText('by Diving Life', W / 2, 156)
  ctx.letterSpacing = '0px'
  ctx.strokeStyle = 'rgba(0,180,216,0.32)'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(W/2 - 64, 188); ctx.lineTo(W/2 + 64, 188); ctx.stroke()

  // ── SVG Icon ─────────────────────────────────────────────────────
  const iconSize = 310
  if (iconImg) {
    ctx.drawImage(iconImg, (W - iconSize) / 2, iconCY - iconSize / 2, iconSize, iconSize)
  }

  // ── Action text ──────────────────────────────────────────────────
  ctx.font = '900 68px Inter, system-ui, sans-serif'
  ctx.fillStyle = '#ffffff'
  const actionLines = wrapText(ctx, getActionText(selected, units), W - 160)
  let ay = 628
  for (const line of actionLines) { ctx.fillText(line, W / 2, ay); ay += 86 }

  ctx.font = '400 34px Inter, system-ui, sans-serif'
  ctx.fillStyle = 'rgba(144,224,239,0.52)'
  ctx.fillText(`con ${selected.organization}`, W / 2, ay + 22)

  // ── CO₂ badge (fixed position, clears action text even at 3 lines) ─
  const badgeY = Math.max(920, ay + 80)
  const badgeW = 700, badgeH = 210, bx = (W - badgeW) / 2
  const badgeFill = ctx.createLinearGradient(bx, badgeY, bx + badgeW, badgeY + badgeH)
  badgeFill.addColorStop(0, 'rgba(0,180,216,0.16)')
  badgeFill.addColorStop(1, 'rgba(0,180,216,0.07)')
  ctx.fillStyle = badgeFill
  roundRect(ctx, bx, badgeY, badgeW, badgeH, 62); ctx.fill()
  ctx.strokeStyle = 'rgba(0,180,216,0.40)'; ctx.lineWidth = 2.5
  roundRect(ctx, bx, badgeY, badgeW, badgeH, 62); ctx.stroke()
  ctx.font = '900 118px Inter, system-ui, sans-serif'
  ctx.fillStyle = '#00d4ff'
  ctx.fillText(`-${co2} kg`, W / 2, badgeY + 143)
  ctx.letterSpacing = '7px'
  ctx.font = '600 28px Inter, system-ui, sans-serif'
  ctx.fillStyle = 'rgba(144,224,239,0.52)'
  ctx.fillText('CO₂  COMPENSADO', W / 2, badgeY + 195)
  ctx.letterSpacing = '0px'

  // ── User section ─────────────────────────────────────────────────
  const userY = badgeY + badgeH + 70
  ctx.font = '700 50px Inter, system-ui, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(user?.name || 'Guardián del Océano', W / 2, userY)

  const levelText = user?.level || 'Plancton'
  ctx.font = '600 30px Inter, system-ui, sans-serif'
  const lw = ctx.measureText(levelText).width + 88
  const lx = (W - lw) / 2
  const levelPillY = userY + 36
  ctx.fillStyle = 'rgba(0,180,216,0.14)'
  roundRect(ctx, lx, levelPillY, lw, 64, 32); ctx.fill()
  ctx.strokeStyle = 'rgba(0,180,216,0.35)'; ctx.lineWidth = 2
  roundRect(ctx, lx, levelPillY, lw, 64, 32); ctx.stroke()
  ctx.fillStyle = '#48cae4'
  ctx.fillText(levelText, W / 2, levelPillY + 44)

  // ── Stats section ────────────────────────────────────────────────
  const statsY = levelPillY + 64 + 60
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(W/2 - 300, statsY - 24); ctx.lineTo(W/2 + 300, statsY - 24); ctx.stroke()

  if (pct > 0) {
    // Two-column stats
    const col1X = W / 2 - 200, col2X = W / 2 + 200
    ctx.font = '700 44px Inter, system-ui, sans-serif'
    ctx.fillStyle = 'rgba(74,222,128,0.9)'
    ctx.fillText(`${pct}%`, col1X, statsY + 14)
    ctx.font = '400 24px Inter, system-ui, sans-serif'
    ctx.fillStyle = 'rgba(144,224,239,0.42)'
    ctx.fillText('de tu huella', col1X, statsY + 52)
    ctx.fillText('compensada', col1X, statsY + 82)

    ctx.font = '700 44px Inter, system-ui, sans-serif'
    ctx.fillStyle = 'rgba(248,196,113,0.9)'
    ctx.fillText(`≈ ${treeMonths}`, col2X, statsY + 14)
    ctx.font = '400 24px Inter, system-ui, sans-serif'
    ctx.fillStyle = 'rgba(144,224,239,0.42)'
    ctx.fillText(treeMonths === 1 ? 'mes de absorción' : 'meses de absorción', col2X, statsY + 52)
    ctx.fillText('de un árbol adulto', col2X, statsY + 82)

    // Divider between columns
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(W/2, statsY - 8); ctx.lineTo(W/2, statsY + 96); ctx.stroke()
  } else {
    // Single stat: tree months
    ctx.font = '700 48px Inter, system-ui, sans-serif'
    ctx.fillStyle = 'rgba(248,196,113,0.9)'
    ctx.fillText(`≈ ${treeMonths} ${treeMonths === 1 ? 'mes' : 'meses'}`, W / 2, statsY + 14)
    ctx.font = '400 28px Inter, system-ui, sans-serif'
    ctx.fillStyle = 'rgba(144,224,239,0.42)'
    ctx.fillText('de absorción de un árbol adulto', W / 2, statsY + 60)
  }

  if (user?.instagram) {
    const igY = statsY + 120
    ctx.font = '400 28px Inter, system-ui, sans-serif'
    ctx.fillStyle = 'rgba(225,48,108,0.65)'
    ctx.fillText(`@${user.instagram}`, W / 2, igY)
  }

  // ── Quote ────────────────────────────────────────────────────────
  const quoteY = statsY + (user?.instagram ? 186 : 156)
  ctx.strokeStyle = 'rgba(0,180,216,0.16)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(W/2 - 220, quoteY - 24); ctx.lineTo(W/2 + 220, quoteY - 24); ctx.stroke()
  ctx.font = 'italic 400 30px Inter, system-ui, sans-serif'
  ctx.fillStyle = 'rgba(144,224,239,0.38)'
  const qlines = wrapText(ctx, `"${QUOTES[selected.id]}"`, W - 200)
  let qy = quoteY + 8
  for (const line of qlines) { ctx.fillText(line, W / 2, qy); qy += 52 }

  // ── Footer ───────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(0,180,216,0.24)'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(W/2 - 64, H - 128); ctx.lineTo(W/2 + 64, H - 128); ctx.stroke()
  ctx.letterSpacing = '6px'
  ctx.font = '400 22px Inter, system-ui, sans-serif'
  ctx.fillStyle = 'rgba(144,224,239,0.26)'
  ctx.fillText('oceanprint.co  ·  divinglife.co', W / 2, H - 84)
  ctx.letterSpacing = '0px'

  return canvas.toDataURL('image/png')
}

function generateReceiptCard(selected, units, result, user) {
  return new Promise(resolve => {
    const W = 1200, H = 1800, PAD = 80
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')
    const co2 = result?.co2_compensated ?? selected.co2_per_unit * units
    const cost = selected.cost_per_unit * units
    const pts = result?.points_earned ?? selected.points_per_unit * units
    const txId = result?.id ? `OP-${String(result.id).padStart(6,'0')}` : 'OP-000000'
    const dateStr = new Date().toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' })

    // Background gradient + glow
    const bg = ctx.createLinearGradient(0, 0, W * 0.7, H)
    bg.addColorStop(0, '#020c1b'); bg.addColorStop(0.5, '#0a1628'); bg.addColorStop(1, '#0d3357')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
    const gl = ctx.createRadialGradient(W + 80, -80, 0, W + 80, -80, 480)
    gl.addColorStop(0, 'rgba(74,222,128,0.07)'); gl.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H)

    let y = PAD + 50
    ctx.textAlign = 'center'

    // OCEAN PRINT + title + sub
    ctx.letterSpacing = '14px'; ctx.font = '800 36px Inter, system-ui, sans-serif'
    ctx.fillStyle = 'rgba(0,180,216,0.60)'; ctx.fillText('OCEAN  PRINT', W / 2, y)
    ctx.letterSpacing = '0px'; ctx.font = '900 50px Inter, system-ui, sans-serif'
    ctx.fillStyle = '#ffffff'; y += 70; ctx.fillText('Comprobante de Compensación', W / 2, y)
    ctx.letterSpacing = '8px'; ctx.font = '400 24px Inter, system-ui, sans-serif'
    ctx.fillStyle = 'rgba(144,224,239,0.32)'; y += 52; ctx.fillText('by Diving Life', W / 2, y)
    ctx.letterSpacing = '0px'

    // Divider
    y += 42; ctx.strokeStyle = 'rgba(0,180,216,0.22)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke()
    y += 42

    // TX row box
    const txH = 118
    ctx.fillStyle = 'rgba(0,180,216,0.07)'
    roundRect(ctx, PAD, y, W - PAD*2, txH, 18); ctx.fill()
    ctx.strokeStyle = 'rgba(0,180,216,0.22)'; ctx.lineWidth = 1.5
    roundRect(ctx, PAD, y, W - PAD*2, txH, 18); ctx.stroke()
    // Left: ID
    ctx.textAlign = 'left'; ctx.letterSpacing = '2px'
    ctx.font = '600 18px Inter, system-ui, sans-serif'; ctx.fillStyle = 'rgba(144,224,239,0.42)'
    ctx.fillText('ID TRANSACCIÓN', PAD + 26, y + 34)
    ctx.letterSpacing = '0px'; ctx.font = "700 30px 'Courier New', monospace"
    ctx.fillStyle = '#48cae4'; ctx.fillText(txId, PAD + 26, y + 82)
    // Right: date
    ctx.textAlign = 'right'; ctx.letterSpacing = '2px'
    ctx.font = '600 18px Inter, system-ui, sans-serif'; ctx.fillStyle = 'rgba(144,224,239,0.42)'
    ctx.fillText('FECHA', W - PAD - 26, y + 34)
    ctx.letterSpacing = '0px'; ctx.font = '600 24px Inter, system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.72)'; ctx.fillText(dateStr, W - PAD - 26, y + 82)
    y += txH + 48

    // Detail rows
    const rows = [
      { label: 'Opción',         value: selected.name,                  color: null },
      { label: 'Organización',   value: selected.organization,          color: null },
      { label: 'Unidades',       value: `${units} ${selected.unit}(s)`, color: null },
      { label: 'CO₂ compensado', value: `-${co2} kg CO₂`,              color: '#4ade80' },
      { label: 'Valor pagado',   value: formatCOP(cost),                color: cost === 0 ? '#4ade80' : '#fbbf24' },
      { label: 'Puntos ganados', value: `+${pts} pts`,                  color: '#a78bfa' },
    ]
    const rowH = 106
    for (const row of rows) {
      ctx.textAlign = 'left'; ctx.font = '400 26px Inter, system-ui, sans-serif'
      ctx.fillStyle = 'rgba(144,224,239,0.52)'
      ctx.fillText(row.label, PAD, y + rowH / 2 + 9)
      ctx.textAlign = 'right'; ctx.font = '700 28px Inter, system-ui, sans-serif'
      ctx.fillStyle = row.color || 'rgba(255,255,255,0.88)'
      ctx.fillText(row.value, W - PAD, y + rowH / 2 + 9)
      y += rowH
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke()
    }
    y += 48

    // User block
    const ubH = 132
    ctx.fillStyle = 'rgba(0,180,216,0.07)'
    roundRect(ctx, PAD, y, W - PAD*2, ubH, 20); ctx.fill()
    ctx.strokeStyle = 'rgba(0,180,216,0.18)'; ctx.lineWidth = 1.5
    roundRect(ctx, PAD, y, W - PAD*2, ubH, 20); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.font = '700 34px Inter, system-ui, sans-serif'; ctx.fillStyle = '#ffffff'
    ctx.fillText(user?.name || 'Guardián del Océano', W / 2, y + 52)
    ctx.font = '400 26px Inter, system-ui, sans-serif'; ctx.fillStyle = '#48cae4'
    ctx.fillText(user?.level || 'Plancton', W / 2, y + 96)
    y += ubH + 48

    // Verification badge
    ctx.letterSpacing = '2px'; ctx.font = '700 26px Inter, system-ui, sans-serif'
    const verText = '✓  VERIFICADO · OCEANPRINT'
    const verW = ctx.measureText(verText).width + 80
    const vx = (W - verW) / 2
    ctx.fillStyle = 'rgba(74,222,128,0.10)'
    roundRect(ctx, vx, y, verW, 64, 32); ctx.fill()
    ctx.strokeStyle = 'rgba(74,222,128,0.30)'; ctx.lineWidth = 1.5
    roundRect(ctx, vx, y, verW, 64, 32); ctx.stroke()
    ctx.fillStyle = '#4ade80'; ctx.textAlign = 'center'
    ctx.fillText(verText, W / 2, y + 43)
    y += 64 + 32; ctx.letterSpacing = '0px'

    // Footer URL
    ctx.letterSpacing = '4px'; ctx.font = '400 20px Inter, system-ui, sans-serif'
    ctx.fillStyle = 'rgba(144,224,239,0.22)'
    ctx.fillText('oceanprint.co  ·  divinglife.co', W / 2, y + 28)
    ctx.letterSpacing = '0px'

    resolve(canvas.toDataURL('image/png'))
  })
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
  const [socialDataUrl,  setSocialDataUrl]  = useState(null)
  const [receiptDataUrl, setReceiptDataUrl] = useState(null)

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
      const [su, ru] = await Promise.all([
        generateSocialCard(selected, units, res.data, user),
        generateReceiptCard(selected, units, res.data, user),
      ])
      setSocialDataUrl(su)
      setReceiptDataUrl(ru)
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

  async function downloadReceipt() {
    if (!receiptDataUrl || shareLoading) return
    setShareLoading('receipt')
    const a = document.createElement('a')
    a.href = receiptDataUrl
    a.download = 'oceanprint-comprobante.png'
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    setShareLoading(null)
  }

  async function downloadCard() {
    if (!socialDataUrl || shareLoading) return
    setShareLoading('dl')
    const a = document.createElement('a')
    a.href = socialDataUrl
    a.download = 'oceanprint-compensacion.png'
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    markShared()
    setShareLoading(null)
  }

  async function copyToClipboard() {
    if (!socialDataUrl || shareLoading) return
    setShareLoading('copy')
    try {
      const blob = await fetch(socialDataUrl).then(r => r.blob())
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      showToast('✅ Imagen copiada al portapapeles')
      markShared()
    } catch {
      const a = document.createElement('a')
      a.href = socialDataUrl; a.download = 'oceanprint-compensacion.png'
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      showToast('Imagen descargada')
    }
    setShareLoading(null)
  }

  async function shareWhatsApp() {
    if (!socialDataUrl || shareLoading) return
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
        const blob = await fetch(socialDataUrl).then(r => r.blob())
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
      } else {
        const a = document.createElement('a')
        a.href = socialDataUrl; a.download = 'oceanprint-compensacion.png'
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
      }
      markShared()
    } catch (e) { console.error(e) }
    finally { setShareLoading(null) }
  }

  async function shareInstagram() {
    if (!socialDataUrl || shareLoading) return
    setShareLoading('ig')
    try {
      const blob = await fetch(socialDataUrl).then(r => r.blob())
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    } catch {}
    setShareLoading(null)

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

              {/* Social card preview */}
              {socialDataUrl ? (
                <div style={{ width: '220px', margin: '0 auto', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
                  <img src={socialDataUrl} alt="Tarjeta de compensación" style={{ width: '100%', display: 'block' }} />
                </div>
              ) : (
                <div className="rounded-2xl mb-5 flex items-center justify-center"
                  style={{ height: '200px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-ocean-foam/30 text-sm">Generando tarjeta…</span>
                </div>
              )}

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
