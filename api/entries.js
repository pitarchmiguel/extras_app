// Inherits the project's existing Vercel Deployment Protection.
// The backend credential stays in Vercel environment variables.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Método no permitido.' })
  }
  const host = String(req.headers.host || '')
  // Custom domains are excluded from the current Vercel protection setting.
  // Refuse them rather than expose the ledger on an unprotected domain.
  if (process.env.VERCEL && !host.endsWith('.vercel.app')) {
    return res.status(403).json({ error: 'Utiliza la dirección privada de la aplicación.' })
  }
  if (req.headers.origin && req.headers.origin !== 'https://' + host && req.headers.origin !== 'http://' + host) {
    return res.status(403).json({ error: 'Origen no permitido.' })
  }
  if (!req.headers['content-type']?.includes('application/json')) return res.status(415).json({ error: 'Se requiere JSON.' })
  if (!process.env.EXTRAS_API_KEY) return res.status(503).json({ error: 'El registro no está configurado todavía.' })
  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
  if (!body || Buffer.byteLength(body) > 65536) return res.status(413).json({ error: 'La petición es demasiado grande.' })
  try {
    const response = await fetch('https://mlxpvghndzuevytojwwf.supabase.co/functions/v1/personal-ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Extras-Key': process.env.EXTRAS_API_KEY },
      body, signal: AbortSignal.timeout(25000),
    })
    if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Invalid upstream response')
    return res.status(response.status).json(await response.json())
  } catch {
    return res.status(502).json({ error: 'No se pudo conectar con el registro. Inténtalo de nuevo.' })
  }
}
