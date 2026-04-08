import { useState, useRef, useCallback } from 'react'
import axios from 'axios'
import { API_BASE, authCfg } from './AdminApp'
import { LeafIcon, CheckIcon, XIcon, RefreshIcon, BarChartIcon } from '../../components/OceanIcons'

const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }
const TH   = { padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.35)', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }
const TD   = { padding: '7px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.75)', borderBottom: '1px solid rgba(255,255,255,0.04)' }

const ACCEPTED = ['.xlsx', '.xls', '.csv']
const ACCEPT_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv'

async function parseExcelPreview(file) {
  const XLSX = await import('xlsx')
  const data = await file.arrayBuffer()
  const wb = XLSX.read(data, { type: 'array' })
  return wb.SheetNames.map(name => {
    const ws = wb.Sheets[name]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
    const headers  = (rows[0] || []).map(String)
    const dataRows = rows.slice(1, 6)
    return { name, headers, dataRows, totalRows: Math.max(0, rows.length - 1) }
  })
}

export default function AdminImport({ token }) {
  const [file,      setFile]      = useState(null)
  const [sheets,    setSheets]    = useState(null)  // parsed preview
  const [importing, setImporting] = useState(false)
  const [result,    setResult]    = useState(null)
  const [error,     setError]     = useState('')
  const [dragging,  setDragging]  = useState(false)
  const [parsing,   setParsing]   = useState(false)
  const inputRef = useRef(null)

  async function handleFile(f) {
    if (!f) return
    const ext = '.' + f.name.split('.').pop().toLowerCase()
    if (!ACCEPTED.includes(ext)) {
      setError(`Formato no soportado. Usa ${ACCEPTED.join(', ')}`)
      return
    }
    setFile(f); setResult(null); setError(''); setSheets(null); setParsing(true)
    try {
      const parsed = await parseExcelPreview(f)
      setSheets(parsed)
    } catch {
      setError('No se pudo leer el archivo. Verifica que sea un Excel válido.')
      setFile(null)
    } finally { setParsing(false) }
  }

  const onDrop = useCallback(e => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [])

  const onDragOver = e => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  async function handleImport() {
    if (!file || importing) return
    setImporting(true); setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await axios.post(`${API_BASE}/admin/import-excel`, form, {
        headers: { ...authCfg(token).headers, 'Content-Type': 'multipart/form-data' },
      })
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.error || 'Error al importar el archivo')
    } finally { setImporting(false) }
  }

  function reset() {
    setFile(null); setSheets(null); setResult(null); setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: 0 }}>
        Importa rutas y distancias de emisión desde un archivo Excel. Los datos se usan para calcular la huella de carbono de los viajes.
      </p>

      {/* ── FORMAT GUIDE ── */}
      <div style={{ ...CARD, border: '1px solid rgba(0,180,216,0.2)', background: 'rgba(0,180,216,0.04)' }}>
        <h3 style={{ color: '#48cae4', fontWeight: 700, fontSize: '14px', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LeafIcon size={15} /> Formato esperado del Excel
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginBottom: '12px', lineHeight: '1.6' }}>
          El archivo puede tener una o varias hojas. Cada hoja debe contener las siguientes columnas (el nombre exacto no importa, se detecta automáticamente):
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
            <thead><tr>
              <th style={TH}>Columna</th>
              <th style={TH}>Aliases aceptados</th>
              <th style={TH}>Obligatoria</th>
              <th style={TH}>Descripción</th>
            </tr></thead>
            <tbody>
              {[
                ['origen',             'origen, origin, ciudad_origen, desde',              '✅ Sí',  'Ciudad de origen del viaje (ej: Bogotá)'],
                ['destino',            'destino, destination, ciudad_destino, hasta',        '✅ Sí',  'Destino de buceo (ej: Isla Malpelo)'],
                ['distancia_km',       'distancia_km, distancia, distance_km, km',           '✅ Sí',  'Distancia en km (solo ida)'],
                ['distancia_local_km', 'distancia_local_km, distancia_local, local_km',      '⬜ No', 'Km desde aeropuerto/puerto al destino (para ferries)'],
              ].map(([col, aliases, req, desc]) => (
                <tr key={col}>
                  <td style={{ ...TD, fontFamily: 'monospace', color: '#48cae4', fontWeight: 700 }}>{col}</td>
                  <td style={{ ...TD, color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{aliases}</td>
                  <td style={{ ...TD, color: req.startsWith('✅') ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>{req}</td>
                  <td style={{ ...TD, color: 'rgba(255,255,255,0.5)' }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0, lineHeight: '1.6' }}>
            <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Ejemplo de fila:</strong>{' '}
            Bogotá | Isla Malpelo | 500 | 0<br />
            <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Notas:</strong> Filas con datos vacíos o distancia ≤ 0 se omiten. Si la ruta ya existe, se actualiza. Formatos aceptados: .xlsx, .xls, .csv
          </p>
        </div>
      </div>

      {/* ── DROP ZONE ── */}
      {!file && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          style={{
            ...CARD,
            border: `2px dashed ${dragging ? 'rgba(0,180,216,0.6)' : 'rgba(255,255,255,0.12)'}`,
            background: dragging ? 'rgba(0,180,216,0.06)' : 'rgba(255,255,255,0.02)',
            textAlign: 'center', padding: '40px 20px', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <div style={{ marginBottom: '12px', color: '#48cae4', display: 'flex', justifyContent: 'center' }}><BarChartIcon size={40} /></div>
          <p style={{ color: 'white', fontWeight: 700, fontSize: '15px', margin: '0 0 6px' }}>
            {dragging ? 'Suelta el archivo aquí' : 'Arrastra tu archivo Excel aquí'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '0 0 16px' }}>
            o haz clic para seleccionar
          </p>
          <span style={{ display: 'inline-block', background: 'rgba(0,180,216,0.15)', border: '1px solid rgba(0,180,216,0.3)', borderRadius: '8px', padding: '7px 16px', color: '#48cae4', fontSize: '13px', fontWeight: 600 }}>
            Seleccionar archivo
          </span>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', marginTop: '12px' }}>
            Formatos: {ACCEPTED.join(', ')} · Máx. 10 MB
          </p>
          <input ref={inputRef} type="file" accept={ACCEPT_MIME} style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])} />
        </div>
      )}

      {/* ── PARSING INDICATOR ── */}
      {parsing && (
        <div style={{ ...CARD, textAlign: 'center', padding: '30px' }}>
          <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid rgba(0,180,216,0.2)', borderTop: '3px solid #48cae4', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '10px' }} />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>Analizando archivo…</p>
        </div>
      )}

      {/* ── FILE SELECTED + PREVIEW ── */}
      {file && sheets && !importing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* File info bar */}
          <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px' }}>
            <span style={{ fontSize: '24px' }}>📄</span>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', margin: 0 }}>{file.name}</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '2px 0 0' }}>
                {(file.size / 1024).toFixed(1)} KB · {sheets.length} hoja{sheets.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button onClick={reset} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 12px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '12px' }}>
              Cambiar archivo
            </button>
          </div>

          {/* Sheet previews */}
          {sheets.map(sheet => (
            <div key={sheet.name} style={CARD}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ color: 'white', fontWeight: 700, fontSize: '13px', margin: 0 }}>
                  📋 Hoja: <span style={{ color: '#48cae4' }}>{sheet.name}</span>
                </h4>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                  {sheet.totalRows} filas de datos
                  {sheet.totalRows > 5 ? ' · mostrando primeras 5' : ''}
                </span>
              </div>

              {sheet.headers.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>Hoja vacía</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '400px' }}>
                    <thead>
                      <tr>
                        {sheet.headers.map((h, i) => (
                          <th key={i} style={TH}>{h || `Col ${i + 1}`}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sheet.dataRows.length === 0 ? (
                        <tr><td colSpan={sheet.headers.length} style={{ ...TD, textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '16px' }}>Sin datos</td></tr>
                      ) : sheet.dataRows.map((row, ri) => (
                        <tr key={ri}>
                          {sheet.headers.map((_, ci) => (
                            <td key={ci} style={TD}>{String(row[ci] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Column detection hint */}
              {sheet.headers.length > 0 && (() => {
                const hl = sheet.headers.map(h => String(h).toLowerCase().trim())
                const hasOrigen  = hl.some(h => ['origen','origin','ciudad_origen','desde'].includes(h))
                const hasDestino = hl.some(h => ['destino','destination','ciudad_destino','hasta'].includes(h))
                const hasDist    = hl.some(h => ['distancia_km','distancia','distance_km','distance','km'].includes(h))
                const ok = hasOrigen && hasDestino && hasDist
                return (
                  <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '8px', background: ok ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.06)', border: `1px solid ${ok ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
                    <p style={{ margin: 0, fontSize: '11px', color: ok ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                      {ok
                        ? '✅ Columnas obligatorias detectadas correctamente'
                        : `❌ Faltan columnas: ${[!hasOrigen && 'origen', !hasDestino && 'destino', !hasDist && 'distancia_km'].filter(Boolean).join(', ')}`}
                    </p>
                  </div>
                )
              })()}
            </div>
          ))}

          {/* Import button */}
          <button
            onClick={handleImport}
            disabled={importing}
            style={{
              background: 'linear-gradient(135deg,#00b4d8,#48cae4)', border: 'none', borderRadius: '12px',
              padding: '13px 28px', color: '#020c1b', fontWeight: 800, fontSize: '14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', alignSelf: 'flex-start',
            }}
          >
            <RefreshIcon size={16} /> Importar datos
          </button>
        </div>
      )}

      {/* ── IMPORTING ── */}
      {importing && (
        <div style={{ ...CARD, textAlign: 'center', padding: '30px' }}>
          <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid rgba(0,180,216,0.2)', borderTop: '3px solid #48cae4', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '10px' }} />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>Importando datos al servidor…</p>
        </div>
      )}

      {/* ── ERROR ── */}
      {error && (
        <div style={{ ...CARD, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.25)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ color: '#f87171', flexShrink: 0, marginTop: '1px' }}><XIcon size={16} /></span>
          <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* ── RESULT ── */}
      {result && (
        <div style={{ ...CARD, background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ color: '#4ade80' }}><CheckIcon size={20} /></span>
            <h3 style={{ color: '#4ade80', fontWeight: 700, fontSize: '15px', margin: 0 }}>
              Importación completada
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: result.errors?.length ? '16px' : 0 }}>
            {[
              { label: 'Hojas procesadas', value: result.sheets_processed, color: '#48cae4' },
              { label: 'Rutas nuevas',     value: result.imported,         color: '#4ade80' },
              { label: 'Rutas actualizadas', value: result.updated,        color: '#fbbf24' },
              { label: 'Filas omitidas',   value: result.skipped,          color: 'rgba(255,255,255,0.4)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <p style={{ color, fontSize: '22px', fontWeight: 900, margin: '0 0 4px', lineHeight: 1 }}>{value}</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
              </div>
            ))}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: result.errors?.length ? '0 0 12px' : 0 }}>
            Total de rutas en la base de datos: <strong style={{ color: '#48cae4' }}>{result.total_routes}</strong>
          </p>
          {result.errors?.length > 0 && (
            <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '10px', padding: '12px' }}>
              <p style={{ color: '#f87171', fontSize: '12px', fontWeight: 600, margin: '0 0 6px' }}>Advertencias:</p>
              {result.errors.map((e, i) => (
                <p key={i} style={{ color: 'rgba(248,113,113,0.7)', fontSize: '11px', margin: '2px 0' }}>• {e}</p>
              ))}
            </div>
          )}
          <button onClick={reset} style={{ marginTop: '14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 16px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '12px' }}>
            Importar otro archivo
          </button>
        </div>
      )}
    </div>
  )
}
