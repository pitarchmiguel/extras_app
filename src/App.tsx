import { useEffect, useState } from 'react'
import { CalendarDays, Check, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, Clock3, FileImage, Pencil, Plus, RefreshCw, Search, X } from 'lucide-react'
import { EntryForm, Modal } from './components/EntryForm'
import { request } from './lib/api'
import { supabase, BUCKET } from './lib/supabase'
import { formatDuration } from './lib/time.mjs'
import type { Entry } from './types'

const currentMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }
const monthLabel = (value: string) => new Date(value + '-15T12:00:00').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
const dateLabel = (value: string) => new Date(value + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'No se ha podido completar la operación.'

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [month, setMonth] = useState('all')
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<Entry | null | undefined>(undefined)
  const [preview, setPreview] = useState<{ url: string; name: string; pdf: boolean } | null>(null)

  async function loadEntries() {
    setLoading(true)
    setError('')
    try { setEntries((await request<{ entries: Entry[] }>('list')).entries) }
    catch (e) { setError(errorMessage(e)) }
    finally { setLoading(false) }
  }
  useEffect(() => { void loadEntries() }, [])
  useEffect(() => { setPage(1) }, [month, status, search])
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 4500)
    return () => clearTimeout(timer)
  }, [notice])

  const months = Array.from(new Set([currentMonth(), ...entries.map(e => e.work_date.slice(0, 7))])).sort().reverse()
  const filtered = entries.filter(e =>
    (month === 'all' || e.work_date.startsWith(month)) &&
    (status === 'all' || status === 'unpaid' && !e.is_paid || status === 'unsigned' && !e.is_signed) &&
    (!search || `${e.notes} ${e.work_date} ${e.kind === 'holiday' ? 'festivas' : 'extras'}`.toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => b.work_date.localeCompare(a.work_date) || b.created_at.localeCompare(a.created_at))
  const totalMinutes = filtered.reduce((sum, entry) => sum + entry.duration_minutes, 0)
  const pages = Math.max(1, Math.ceil(filtered.length / 12))
  const currentPage = Math.min(page, pages)
  const visible = filtered.slice((currentPage - 1) * 12, currentPage * 12)

  async function save(values: Partial<Entry>, file: File | null, remove: boolean) {
    setBusy(true)
    const existing = form
    const id = existing?.id || crypto.randomUUID()
    let newPath: string | null = null
    try {
      let attachmentPath = remove ? null : existing?.attachment_path || null
      let attachmentName = remove ? null : existing?.attachment_name || null
      if (file) {
        const upload = await request<{ path: string; token: string }>('prepareUpload', { id, contentType: file.type, size: file.size })
        newPath = upload.path
        const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type })
        if (error) throw error
        attachmentPath = upload.path
        attachmentName = file.name
      }
      const { entry } = await request<{ entry: Entry }>('save', {
        id, existing: !!existing, values: { ...values, attachment_path: attachmentPath, attachment_name: attachmentName },
      })
      setEntries(rows => [entry, ...rows.filter(e => e.id !== id)])
      setMonth('all'); setStatus('all'); setSearch(''); setPage(1)
      setForm(undefined)
      setNotice(existing ? 'Cambios guardados.' : 'Horas guardadas.')
    } catch (e) {
      if (newPath) await request('discardUpload', { id, path: newPath }).catch(() => {})
      throw e
    } finally { setBusy(false) }
  }

  async function archive(entry: Entry) {
    setBusy(true)
    try {
      await request('archive', { id: entry.id })
      setEntries(rows => rows.filter(e => e.id !== entry.id))
      setForm(undefined)
      setNotice('Registro archivado.')
    } finally { setBusy(false) }
  }

  async function toggle(entry: Entry, key: 'is_paid' | 'is_signed') {
    if (busy) return
    setBusy(true)
    try {
      const result = await request<{ entry: Entry }>('status', { id: entry.id, key, value: !entry[key] })
      setEntries(rows => rows.map(e => e.id === entry.id ? result.entry : e))
    } catch (e) { setError(errorMessage(e)) }
    finally { setBusy(false) }
  }

  async function openFile(entry: Entry) {
    try { setPreview(await request('preview', { id: entry.id })) }
    catch (e) { setError(errorMessage(e)) }
  }

  const closeForm = () => { if (!busy) setForm(undefined) }
  return <div className="ledger-app">
    <header className="app-header"><div className="header-inner"><a className="brand" href="/" aria-label="Extras, inicio"><span className="brand-symbol"><i /><i /><i /></span>extras<span>.</span></a><span className="header-caption">CONTROL DE HORAS</span></div></header>
    <main className="ledger-main">
      <div className="page-heading"><div><h1>Registro de horas</h1><p>Tus horas extras y festivas, al día.</p></div><button className="button primary" onClick={() => setForm(null)}><Plus size={18} />Añadir horas</button></div>
      {error && <div className="error-banner" role="alert"><span>{error}</span><button className="retry-button" disabled={loading} onClick={() => void loadEntries()}><RefreshCw size={15} />Reintentar</button><button className="icon-button" aria-label="Cerrar aviso" onClick={() => setError('')}><X size={17} /></button></div>}
      <section className="records-panel" aria-label="Horas registradas">
        <div className="table-toolbar"><div className="table-tabs" aria-label="Filtrar por estado">{[{ value: 'all', label: 'Todas' }, { value: 'unpaid', label: 'Sin pagar' }, { value: 'unsigned', label: 'Sin firmar' }].map(tab => <button key={tab.value} className={status === tab.value ? 'active' : ''} aria-pressed={status === tab.value} onClick={() => setStatus(tab.value)}>{tab.label}</button>)}</div><div className="table-tools"><label className="search-box"><Search size={16} /><input aria-label="Buscar horas" placeholder="Buscar…" value={search} onChange={e => setSearch(e.target.value)} /></label><label className="month-select"><CalendarDays size={16} /><select aria-label="Seleccionar mes" value={month} onChange={e => setMonth(e.target.value)}><option value="all">Todos los meses</option>{months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}</select><ChevronDown size={14} /></label></div></div>
        {loading ? <div className="empty-state" role="status"><Clock3 className="spin" size={24} /><p>Cargando tus horas…</p></div> : !filtered.length ? <div className="empty-state"><span className="empty-icon"><Clock3 size={28} /></span><h2>{entries.length ? 'No hay horas con estos filtros' : error ? 'No se ha podido cargar el registro' : 'Todavía no hay horas registradas'}</h2><p>{entries.length ? 'Prueba con otro mes o cambia los filtros.' : error ? 'Pulsa Reintentar para volver a cargar tus horas.' : 'Añade tu primer registro para empezar.'}</p>{!entries.length && !error && <button className="button secondary" onClick={() => setForm(null)}><Plus size={17} />Añadir horas</button>}</div> : <div className="table-scroll"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Horas</th><th>Pago</th><th>Firma del jefe</th><th>Hoja</th><th><span className="sr-only">Editar</span></th></tr></thead><tbody>{visible.map(entry => <tr key={entry.id}>
          <td className="date-cell" data-label="Fecha"><strong>{dateLabel(entry.work_date)}</strong>{entry.notes && <span title={entry.notes}>{entry.notes}</span>}</td>
          <td data-label="Tipo"><span className={`type-tag ${entry.kind}`}><i />{entry.kind === 'holiday' ? 'Festivas' : 'Extras'}</span></td>
          <td className="duration-cell" data-label="Horas">{formatDuration(entry.duration_minutes)}</td>
          <td data-label="Pago"><button disabled={busy} className={`status ${entry.is_paid ? 'done' : 'pending'}`} onClick={() => void toggle(entry, 'is_paid')} aria-label={`${dateLabel(entry.work_date)}: ${entry.is_paid ? 'pagadas' : 'sin pagar'}. Cambiar pago.`}>{entry.is_paid ? <Check size={14} /> : <Clock3 size={14} />}{entry.is_paid ? 'Pagadas' : 'Sin pagar'}</button></td>
          <td data-label="Firma"><button disabled={busy} className={`status ${entry.is_signed ? 'signed' : 'unsigned'}`} onClick={() => void toggle(entry, 'is_signed')} aria-label={`${dateLabel(entry.work_date)}: ${entry.is_signed ? 'firmada' : 'sin firmar'}. Cambiar firma.`}>{entry.is_signed ? <CheckCheck size={15} /> : <Clock3 size={14} />}{entry.is_signed ? 'Firmada' : 'Sin firmar'}</button></td>
          <td data-label="Hoja">{entry.attachment_path ? <button className="attachment-button" onClick={() => void openFile(entry)}><FileImage size={17} />Ver hoja</button> : <button className="no-attachment" onClick={() => setForm(entry)}><Plus size={15} />Adjuntar</button>}</td>
          <td className="edit-cell"><button className="icon-button" aria-label={`Editar registro del ${entry.work_date}`} title="Editar registro" onClick={() => setForm(entry)}><Pencil size={17} /></button></td>
        </tr>)}</tbody></table></div>}
        {!loading && !error && <div className="table-footer"><span>{filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}<i /> <strong>{formatDuration(totalMinutes)}</strong></span>{pages > 1 && <div className="pagination"><button className="icon-button" aria-label="Página anterior" disabled={currentPage === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={17} /></button><span>{currentPage} / {pages}</span><button className="icon-button" aria-label="Página siguiente" disabled={currentPage === pages} onClick={() => setPage(p => p + 1)}><ChevronRight size={17} /></button></div>}</div>}
      </section>
    </main>
    {form !== undefined && <Modal title={form ? 'Editar horas' : 'Añadir horas'} onClose={closeForm}><EntryForm entry={form} onSave={save} onDelete={archive} onClose={closeForm} busy={busy} /></Modal>}
    {preview && <Modal title="Hoja adjunta" subtitle={preview.name} onClose={() => setPreview(null)} wide>{preview.pdf ? <iframe title={preview.name} src={preview.url} className="document-preview" /> : <img src={preview.url} alt={preview.name} className="image-preview" />}</Modal>}
    {notice && <div className="toast" role="status"><Check size={17} />{notice}<button className="icon-button" aria-label="Cerrar notificación" onClick={() => setNotice('')}><X size={16} /></button></div>}
  </div>
}
