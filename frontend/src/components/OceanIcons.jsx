/**
 * OceanIcons — custom SVG icons + lucide wrappers for the entire app.
 * All icons use currentColor so they inherit color from parent CSS.
 */

import {
  Plane, Ship, Car, Bus, Trophy, Star, Trash2, Lock, Target,
  Thermometer, Leaf, RefreshCw, CreditCard, Sparkles, Lightbulb,
  Brain, Users, X, Check, Search, Recycle, Globe, Frown, Map,
  Pencil, Camera, MapPin, AtSign, Phone, Plus,
} from 'lucide-react'

/* ─────────────────────────────────────────────
   LUCIDE-REACT WRAPPERS
   Normalises lucide to { size, className } interface
───────────────────────────────────────────── */
const lucide = (Comp) => ({ size = 24, className = '' }) => (
  <Comp size={size} strokeWidth={1.5} className={className} />
)

export const PlaneIcon        = lucide(Plane)
export const ShipIcon         = lucide(Ship)
export const CarIcon          = lucide(Car)
export const BusIcon          = lucide(Bus)
export const TrophyIcon       = lucide(Trophy)
export const StarIcon         = lucide(Star)
export const TrashIcon        = lucide(Trash2)
export const LockIcon         = lucide(Lock)
export const TargetIcon       = lucide(Target)
export const ThermometerIcon  = lucide(Thermometer)
export const LeafIcon         = lucide(Leaf)
export const RefreshIcon      = lucide(RefreshCw)
export const CreditCardIcon   = lucide(CreditCard)
export const SparklesIcon     = lucide(Sparkles)
export const LightbulbIcon    = lucide(Lightbulb)
export const BrainIcon        = lucide(Brain)
export const UsersIcon        = lucide(Users)
export const XIcon            = lucide(X)
export const CheckIcon        = lucide(Check)
export const SearchIcon       = lucide(Search)
export const RecycleIcon      = lucide(Recycle)
export const GlobeIcon        = lucide(Globe)
export const FrownIcon        = lucide(Frown)
export const MapIcon          = lucide(Map)
export const PencilIcon       = lucide(Pencil)
export const CameraIcon       = lucide(Camera)
export const MapPinIcon       = lucide(MapPin)
export const AtSignIcon       = lucide(AtSign)
export const PhoneIcon        = lucide(Phone)
export const PlusIcon         = lucide(Plus)

/* ─────────────────────────────────────────────
   LEVEL SYSTEM
───────────────────────────────────────────── */

export const LEVEL_COLORS = {
  'Plancton':          '#48cae4',
  'Caballito de Mar':  '#00b4d8',
  'Tortuga Marina':    '#4ade80',
  'Mantarraya':        '#f59e0b',
  'Ballena Azul':      '#a78bfa',
}

/** Plancton — radiolarian / diatom starburst */
function PlanktonIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <line x1="12" y1="12" x2="12" y2="1"    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="12" x2="12" y2="23"   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="12" x2="1"  y2="12"   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="12" x2="23" y2="12"   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="12" x2="4.2"  y2="4.2"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="12" x2="19.8" y2="19.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="12" x2="19.8" y2="4.2"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="12" x2="4.2"  y2="19.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  )
}

/** Caballito de Mar — stylised seahorse, right-facing */
function SeahorseIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.5 4.5L10 2.5M12.5 4L12.5 2M14.5 4.5L15 2.5" />
      <circle cx="12.5" cy="7" r="2.8" />
      <line x1="15.3" y1="7.2" x2="20" y2="7.8" />
      <line x1="12.5" y1="9.8" x2="11.5" y2="11" />
      <path d="M11.5 11C14 12 15 14 14 16C13 18 10.5 19 9.5 20.5" />
      <path d="M14 14C16 13.2 17 14.2 16 15.2" />
      <path d="M9.5 20.5C8 21.5 7 23 8.5 23.5C10 24 11.5 23 12 21.8C12.5 20.8 11.8 20.2 10.2 20.8" />
    </svg>
  )
}

/** Tortuga Marina — top-down sea turtle */
function TurtleIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="13" rx="5.5" ry="5" />
      <path d="M12 8L15 10.5L15 15.5L12 18L9 15.5L9 10.5Z" strokeWidth="1" strokeOpacity="0.5"/>
      <circle cx="12" cy="4" r="2" />
      <path d="M6.5 10C4.5 8.5 2 9 2.5 11C3 12.5 5.5 12 6.5 11" />
      <path d="M17.5 10C19.5 8.5 22 9 21.5 11C21 12.5 18.5 12 17.5 11" />
      <path d="M7 16.5C5 17 3 18.5 4.5 19.5C6 20.5 7.5 19 7.5 17.5" />
      <path d="M17 16.5C19 17 21 18.5 19.5 19.5C18 20.5 16.5 19 16.5 17.5" />
    </svg>
  )
}

/** Mantarraya — top-down manta ray with cephalic fins */
function MantaRayIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5C16 5.5 22 9.5 22 13C22 15.5 19 17 16 17.5C14 18 12 18 12 18C12 18 10 18 8 17.5C5 17 2 15.5 2 13C2 9.5 8 5.5 12 5Z" />
      <path d="M8 9C6.5 7 4 6 3 8" />
      <path d="M16 9C17.5 7 20 6 21 8" />
      <path d="M12 18C11.5 20 11.8 22.5 12 23.5" />
      <line x1="12" y1="7" x2="12" y2="17" strokeWidth="0.75" strokeOpacity="0.4"/>
    </svg>
  )
}

/** Ballena Azul — side-profile blue whale */
function WhaleIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12C5 8 8 6 12 6C17 6 22 8.5 22 12C22 14.5 19.5 16 16 16.5C12 17 8 16.5 5 12Z" />
      <path d="M14.5 6C15 4 17 3 17.5 5L17.5 6" />
      <path d="M10 16C13 17 16.5 16.5 18.5 15.5" strokeWidth="1" strokeOpacity="0.4"/>
      <path d="M5 12C3 10.5 1 10 2 8" />
      <path d="M5 12C3 13.5 1 14 2 16" />
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
   CUSTOM OCEANIC ICONS
───────────────────────────────────────────── */

/** CoralIcon — branching coral with rounded tips */
export function CoralIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21 L12 15" />
      <path d="M12 15 L8 10" />
      <path d="M12 15 L16 10" />
      <path d="M8 10 L6 6" />
      <path d="M8 10 L10 6" />
      <path d="M16 10 L14 6" />
      <path d="M16 10 L18 6" />
      <path d="M12 15 L12 11" />
      <path d="M11 21 Q12 23 13 21" />
    </svg>
  )
}

/** TropicalFishIcon — oval body with tail and stripe */
export function TropicalFishIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="12" rx="6" ry="4" />
      <path d="M6 12 L2 9 L2 15 Z" />
      <path d="M9 8 Q12 5 15 8" />
      <line x1="11" y1="8" x2="11" y2="16" strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="16" cy="11" r="1" fill="currentColor" />
    </svg>
  )
}

/** DiveMaskIcon — scuba diving mask with strap */
export function DiveMaskIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="8" width="18" height="10" rx="3" />
      <rect x="4" y="9" width="6" height="7" rx="2" />
      <rect x="14" y="9" width="6" height="7" rx="2" />
      <path d="M10 12.5 L14 12.5" />
      <path d="M3 11 Q1 8 3 6 Q6 4 8 8" />
      <path d="M21 11 Q23 8 21 6 Q18 4 16 8" />
    </svg>
  )
}

/** SpeedboatIcon — fast boat with windshield */
export function SpeedboatIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 16 Q6 13 12 13 Q18 13 22 16 L22 18 Q12 20 2 18 Z" />
      <path d="M8 13 L10 8 L16 8 L17 13" />
      <path d="M2 19 Q7 21 12 19 Q17 21 22 19" />
    </svg>
  )
}

/** OceanWaveIcon — stylised ocean wave */
export function OceanWaveIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 10 Q5 6 8 10 Q11 14 14 10 Q17 6 20 10 Q22 12 23 10" />
      <path d="M2 16 Q5 12 8 16 Q11 20 14 16 Q17 12 20 16 Q22 18 23 16" />
    </svg>
  )
}

/** WalkingPersonIcon — walking figure */
export function WalkingPersonIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="13" cy="4" r="2" />
      <path d="M12 7 L11 13" />
      <path d="M11 9 L16 11" />
      <path d="M11 13 L13 18 L16 22" />
      <path d="M11 13 L9 17 L7 22" />
    </svg>
  )
}

/** IslandIcon — tropical island with palm tree */
export function IslandIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 17 Q7 13 12 17 Q17 21 22 17" />
      <path d="M8 17 Q12 11 16 17" />
      <path d="M12 17 L12 9" />
      <path d="M12 9 Q8 6 5 8 Q7 11 12 10" />
      <path d="M12 9 Q16 6 19 8 Q17 11 12 10" />
    </svg>
  )
}

/** MedalIcon — podium medal component (rank 1/2/3) */
export function MedalIcon({ rank = 1, size = 24 }) {
  const COLORS = { 1: '#ffd700', 2: '#c0c0c0', 3: '#cd7f32' }
  const color = COLORS[rank] || 'rgba(255,255,255,0.4)'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: '50%',
      background: `${color}18`, border: `1.5px solid ${color}55`,
      fontSize: Math.round(size * 0.44), fontWeight: 900, color,
      lineHeight: 1, flexShrink: 0,
    }}>
      {rank}
    </span>
  )
}

/* ─────────────────────────────────────────────
   MISSION ICON MAPPER
   Maps emoji strings (stored in DB) → SVG components
───────────────────────────────────────────── */
const MISSION_ICON_MAP = {
  '🪸': CoralIcon,
  '🌊': OceanWaveIcon,
  '🐠': TropicalFishIcon,
  '🐡': TropicalFishIcon,
  '🌍': GlobeIcon,
  '🐋': WhaleIcon,
  '🌱': LeafIcon,
  '🌿': LeafIcon,
  '🤿': DiveMaskIcon,
  '♻️': RecycleIcon,
  '🎯': TargetIcon,
  '⭐': StarIcon,
}

/** MissionIcon — renders the correct SVG for a backend-provided emoji string */
export function MissionIcon({ icon, size = 24, color = 'currentColor' }) {
  const IconComp = MISSION_ICON_MAP[icon]
  if (!IconComp) return <span style={{ fontSize: Math.round(size * 0.8), lineHeight: 1 }}>{icon}</span>
  return (
    <span style={{ color, display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>
      <IconComp size={size} />
    </span>
  )
}

/** OptionIcon — maps compensation option ID → SVG icon */
const OPTION_ICON_MAP = {
  corales:      CoralIcon,
  manglares:    LeafIcon,
  limpieza:     RecycleIcon,
  voluntariado: DiveMaskIcon,
}

export function OptionIcon({ id, size = 24, color = 'currentColor' }) {
  const IconComp = OPTION_ICON_MAP[id] || CoralIcon
  return (
    <span style={{ color, display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>
      <IconComp size={size} />
    </span>
  )
}

/** CONFETTI_ICONS — for mission completion animation */
export const CONFETTI_ICONS = [CoralIcon, TropicalFishIcon, StarIcon, OceanWaveIcon, WhaleIcon]

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
