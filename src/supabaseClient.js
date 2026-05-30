import { createClient } from '@supabase/supabase-js'

// Aquí le decimos a Vite que busque las variables en el archivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)