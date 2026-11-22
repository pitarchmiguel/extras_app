import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://mlxpvghndzuevytojwwf.supabase.co',
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_b_ND_A689ljQnvUKUmmoLg_4KzbHzyO',
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
)
export const BUCKET = 'overtime-sheets'
