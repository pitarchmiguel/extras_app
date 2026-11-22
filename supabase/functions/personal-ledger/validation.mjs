export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function requireId(value) {
  if (typeof value !== 'string' || !UUID.test(value)) throw new Error('Registro no válido.')
  return value
}
export function validateEntry(input, id) {
  requireId(id)
  if (!input || typeof input !== 'object') throw new Error('Registro no válido.')
  const { work_date, kind, duration_minutes, is_paid, is_signed, notes, attachment_path, attachment_name } = input
  if (typeof work_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(work_date) || !Number.isFinite(Date.parse(work_date)) || new Date(work_date).toISOString().slice(0, 10) !== work_date) throw new Error('La fecha no es válida.')
  if (!['extra', 'holiday'].includes(kind)) throw new Error('El tipo de horas no es válido.')
  if (!Number.isInteger(duration_minutes) || duration_minutes < 1 || duration_minutes > 1440) throw new Error('La duración debe estar entre 1 minuto y 24 horas.')
  if (typeof is_paid !== 'boolean' || typeof is_signed !== 'boolean') throw new Error('Los estados no son válidos.')
  if (typeof notes !== 'string' || notes.length > 2000) throw new Error('Las notas deben tener un máximo de 2000 caracteres.')
  if (attachment_path !== null && (typeof attachment_path !== 'string' || !attachment_path.startsWith('personal/' + id + '/') || !/^personal\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/i.test(attachment_path))) throw new Error('El adjunto no pertenece a este registro.')
  if (attachment_name !== null && (typeof attachment_name !== 'string' || attachment_name.length > 255)) throw new Error('El nombre del adjunto no es válido.')
  if (!!attachment_path !== !!attachment_name) throw new Error('El adjunto no está completo.')
  return { work_date, kind, duration_minutes, is_paid, is_signed, notes, attachment_path, attachment_name }
}
