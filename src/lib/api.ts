export async function request<T>(action: string, data: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch('/api/entries', {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...data }),
  })
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('No se pudo acceder al registro. Recarga la página e inténtalo de nuevo.')
  }
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'No se pudo completar la operación.')
  return result as T
}
