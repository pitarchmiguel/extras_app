import { createClient } from 'npm:@supabase/supabase-js@2.112.4'
import { requireId, validateEntry } from './validation.mjs'
const KEY_HASH = 'e2050d1b786e7d85cf0d54ff29834a978be49bb5c9d59e5d3fa4ed2a4cd06344'
const BUCKET = 'overtime-sheets'
const COLUMNS = 'id,work_date,kind,duration_minutes,is_paid,is_signed,notes,attachment_path,attachment_name,created_at,deleted_at'
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })
async function authorized(key: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))
  const actual = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
  let difference = 0
  for (let i = 0; i < KEY_HASH.length; i++) difference |= actual.charCodeAt(i) ^ KEY_HASH.charCodeAt(i)
  return difference === 0
}
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)
  if (!(await authorized(req.headers.get('X-Extras-Key') || ''))) return json({ error: 'Acceso no autorizado.' }, 401)
  try {
    const text = await req.text()
    if (text.length > 65536) return json({ error: 'Petición demasiado grande.' }, 413)
    const input = JSON.parse(text)
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } })
    const table = () => db.from('overtime_entries')
    if (input.action === 'list') {
      const all = []
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await table().select(COLUMNS).is('deleted_at', null).order('work_date', { ascending: false }).order('id').range(offset, offset + 999)
        if (error) throw error
        all.push(...data)
        if (data.length < 1000) break
      }
      return json({ entries: all })
    }
    const id = requireId(input.id)
    if (input.action === 'prepareUpload') {
      const extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' } as Record<string,string>)[input.contentType]
      if (!extension || !Number.isInteger(input.size) || input.size < 1 || input.size > 10485760) throw new Error('Adjunta una imagen o PDF de hasta 10 MB.')
      const path = 'personal/' + id + '/' + crypto.randomUUID() + '.' + extension
      const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path)
      if (error) throw error
      return json(data)
    }
    if (input.action === 'save') {
      const values = validateEntry(input.values, id)
      const query = input.existing === true ? table().update(values).eq('id', id).is('deleted_at', null) : table().insert({ id, user_id: null, ...values })
      const { data, error } = await query.select(COLUMNS).single()
      if (error) throw error
      return json({ entry: data })
    }
    if (input.action === 'status') {
      if (!['is_paid', 'is_signed'].includes(input.key) || typeof input.value !== 'boolean') throw new Error('Estado no válido.')
      const { data, error } = await table().update({ [input.key]: input.value }).eq('id', id).is('deleted_at', null).select(COLUMNS).single()
      if (error) throw error
      return json({ entry: data })
    }
    if (input.action === 'archive') {
      const { data, error } = await table().update({ deleted_at: new Date().toISOString() }).eq('id', id).is('deleted_at', null).select('id').single()
      if (error) throw error
      return json(data)
    }
    if (input.action === 'preview') {
      const { data: entry, error: entryError } = await table().select('attachment_path,attachment_name').eq('id', id).is('deleted_at', null).single()
      if (entryError || !entry?.attachment_path) throw new Error('No se encuentra el justificante.')
      const { data, error } = await db.storage.from(BUCKET).createSignedUrl(entry.attachment_path, 300)
      if (error) throw error
      return json({ url: data.signedUrl, name: entry.attachment_name, pdf: entry.attachment_path.endsWith('.pdf') })
    }
    if (input.action === 'discardUpload') {
      const path = String(input.path)
      if (!path.startsWith('personal/' + id + '/') || path.includes('..')) throw new Error('Adjunto no válido.')
      const { count, error: queryError } = await table().select('id', { count: 'exact', head: true }).eq('attachment_path', path)
      if (queryError || count !== 0) throw new Error('No se puede quitar un adjunto guardado.')
      const { error } = await db.storage.from(BUCKET).remove([path])
      if (error) throw error
      return json({ ok: true })
    }
    return json({ error: 'Operación no permitida.' }, 400)
  } catch (error) {
    console.error('Personal ledger operation failed:', error instanceof Error ? error.message : 'Database error')
    return json({ error: error instanceof Error ? error.message : 'No se pudo completar la operación.' }, 400)
  }
})

