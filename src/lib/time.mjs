export function parseDuration(hours, minutes) {
  const h = Number(hours), m = Number(minutes)
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || m < 0 || m > 59 || h * 60 + m < 1 || h * 60 + m > 1440) throw new Error('Introduce una duración de entre 1 minuto y 24 horas.')
  return h * 60 + m
}
export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60), m = minutes % 60
  return `${h} h${m ? ` ${m} min` : ''}`
}
export function summarize(entries) {
  return entries.reduce((a, e) => ({total:a.total+e.duration_minutes, unpaid:a.unpaid+(!e.is_paid?e.duration_minutes:0), unsigned:a.unsigned+(!e.is_signed?e.duration_minutes:0), holiday:a.holiday+(e.kind==='holiday'?e.duration_minutes:0)}),{total:0,unpaid:0,unsigned:0,holiday:0})
}
export function csvCell(value) {
  let s = String(value ?? '')
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
  return '"' + s.replaceAll('"', '""') + '"'
}
