/**
 * OceanIcons — custom SVG icons for marine level system + brand social icons.
 * All icons use currentColor so they inherit color from their parent element.
 */

export const LEVEL_COLORS = {
  'Plancton':          '#48cae4',
  'Caballito de Mar':  '#00b4d8',
  'Tortuga Marina':    '#4ade80',
  'Mantarraya':        '#f59e0b',
  'Ballena Azul':      '#a78bfa',
}

/* ─────────────────────────────────────────────
   LEVEL ICONS
───────────────────────────────────────────── */

/** Plancton — radiolarian / diatom starburst */
function PlanktonIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {/* 8 radiating spikes */}
      <line x1="12" y1="12" x2="12" y2="1"    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="12" x2="12" y2="23"   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="12" x2="1"  y2="12"   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="12" x2="23" y2="12"   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="12" x2="4.2"  y2="4.2"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="12" x2="19.8" y2="19.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="12" x2="19.8" y2="4.2"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="12" x2="4.2"  y2="19.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Center body */}
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  )
}

/** Caballito de Mar — stylised seahorse, right-facing */
function SeahorseIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Crown */}
      <path d="M10.5 4.5L10 2.5M12.5 4L12.5 2M14.5 4.5L15 2.5" />
      {/* Head */}
      <circle cx="12.5" cy="7" r="2.8" />
      {/* Snout — horizontal, pointing right */}
      <line x1="15.3" y1="7.2" x2="20" y2="7.8" />
      {/* Neck */}
      <line x1="12.5" y1="9.8" x2="11.5" y2="11" />
      {/* Body S-curve */}
      <path d="M11.5 11C14 12 15 14 14 16C13 18 10.5 19 9.5 20.5" />
      {/* Dorsal fin */}
      <path d="M14 14C16 13.2 17 14.2 16 15.2" />
      {/* Tail curl */}
      <path d="M9.5 20.5C8 21.5 7 23 8.5 23.5C10 24 11.5 23 12 21.8C12.5 20.8 11.8 20.2 10.2 20.8" />
    </svg>
  )
}

/** Tortuga Marina — top-down sea turtle */
function TurtleIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Shell */}
      <ellipse cx="12" cy="13" rx="5.5" ry="5" />
      {/* Shell scute pattern */}
      <path d="M12 8L15 10.5L15 15.5L12 18L9 15.5L9 10.5Z" strokeWidth="1" strokeOpacity="0.5"/>
      {/* Head */}
      <circle cx="12" cy="4" r="2" />
      {/* Front-left flipper */}
      <path d="M6.5 10C4.5 8.5 2 9 2.5 11C3 12.5 5.5 12 6.5 11" />
      {/* Front-right flipper */}
      <path d="M17.5 10C19.5 8.5 22 9 21.5 11C21 12.5 18.5 12 17.5 11" />
      {/* Rear-left flipper */}
      <path d="M7 16.5C5 17 3 18.5 4.5 19.5C6 20.5 7.5 19 7.5 17.5" />
      {/* Rear-right flipper */}
      <path d="M17 16.5C19 17 21 18.5 19.5 19.5C18 20.5 16.5 19 16.5 17.5" />
    </svg>
  )
}

/** Mantarraya — top-down manta ray with cephalic fins */
function MantaRayIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Main body / wings */}
      <path d="M12 5C16 5.5 22 9.5 22 13C22 15.5 19 17 16 17.5C14 18 12 18 12 18C12 18 10 18 8 17.5C5 17 2 15.5 2 13C2 9.5 8 5.5 12 5Z" />
      {/* Left cephalic horn (curls forward) */}
      <path d="M8 9C6.5 7 4 6 3 8" />
      {/* Right cephalic horn */}
      <path d="M16 9C17.5 7 20 6 21 8" />
      {/* Thin tail */}
      <path d="M12 18C11.5 20 11.8 22.5 12 23.5" />
      {/* Spine line */}
      <line x1="12" y1="7" x2="12" y2="17" strokeWidth="0.75" strokeOpacity="0.4"/>
    </svg>
  )
}

/** Ballena Azul — side-profile blue whale */
function WhaleIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Main body */}
      <path d="M5 12C5 8 8 6 12 6C17 6 22 8.5 22 12C22 14.5 19.5 16 16 16.5C12 17 8 16.5 5 12Z" />
      {/* Dorsal fin */}
      <path d="M14.5 6C15 4 17 3 17.5 5L17.5 6" />
      {/* Belly */}
      <path d="M10 16C13 17 16.5 16.5 18.5 15.5" strokeWidth="1" strokeOpacity="0.4"/>
      {/* Tail flukes — upper */}
      <path d="M5 12C3 10.5 1 10 2 8" />
      {/* Tail flukes — lower */}
      <path d="M5 12C3 13.5 1 14 2 16" />
      {/* Eye */}
      <circle cx="19.5" cy="10" r="0.9" fill="currentColor" />
    </svg>
  )
}

const LEVEL_ICON_MAP = {
  'Plancton':          PlanktonIcon,
  'Caballito de Mar':  SeahorseIcon,
  'Tortuga Marina':    TurtleIcon,
  'Mantarraya':        MantaRayIcon,
  'Ballena Azul':      WhaleIcon,
}

/**
 * LevelIcon — renders the correct marine SVG icon for a given level.
 * Automatically applies the level's color via currentColor.
 */
export function LevelIcon({ level, size = 24, style = {} }) {
  const color = LEVEL_COLORS[level] || '#48cae4'
  const IconComp = LEVEL_ICON_MAP[level] || PlanktonIcon
  return (
    <span style={{ color, display: 'inline-flex', alignItems: 'center', lineHeight: 1, ...style }}>
      <IconComp size={size} />
    </span>
  )
}

/* ─────────────────────────────────────────────
   SOCIAL / BRAND ICONS
───────────────────────────────────────────── */

/** Official WhatsApp logo */
export function WhatsAppIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

/** Official Instagram logo */
export function InstagramIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}
