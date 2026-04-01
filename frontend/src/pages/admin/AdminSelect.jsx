import { useState, useRef, useEffect } from 'react'

/**
 * Custom dark-themed dropdown.
 * props:
 *   value      — current value (string)
 *   onChange   — (string) => void
 *   options    — string[] | {value, label}[]
 *   placeholder — shown when value is '' and no matching option
 *   style      — applied to outer wrapper (for sizing: flex, width, minWidth…)
 *   disabled
 */
export default function AdminSelect({ value, onChange, options = [], placeholder = 'Seleccionar...', style = {}, disabled = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onMouseDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const normalized = options.map(o => typeof o === 'string' ? { value: o, label: o } : o)
  const selected = normalized.find(o => o.value === value)

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${open ? 'rgba(0,180,216,0.4)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '10px',
          padding: '9px 12px',
          color: selected ? 'white' : 'rgba(255,255,255,0.35)',
          fontSize: '13px',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          textAlign: 'left',
          boxSizing: 'border-box',
          opacity: disabled ? 0.5 : 1,
          transition: 'border-color 0.15s',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          width="11" height="11" viewBox="0 0 12 12" fill="none"
          style={{ flexShrink: 0, color: 'rgba(255,255,255,0.3)', transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown list */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: '#1a2332',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '10px',
          zIndex: 9999,
          maxHeight: '220px',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
        }}>
          {normalized.map((opt, idx) => {
            const isActive = opt.value === value
            return (
              <button
                key={`${opt.value}-${idx}`}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: isActive ? 'rgba(0,180,216,0.15)' : 'transparent',
                  color: isActive ? '#48cae4' : 'rgba(255,255,255,0.88)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textAlign: 'left',
                  display: 'block',
                  fontWeight: isActive ? 600 : 400,
                  borderRadius: idx === 0 ? '10px 10px 0 0' : idx === normalized.length - 1 ? '0 0 10px 10px' : '0',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
