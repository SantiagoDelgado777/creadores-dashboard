import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ikejdclgfyrvxrhshtju.supabase.co'
const supabaseAnonKey = 'sb_publishable_dNiPyR244gjFvKngr-cQ5Q_S7sr8xGgM6N5VpX7n' // Tu llave pública

export const supabase = createClient(supabaseUrl, supabaseAnonKey)