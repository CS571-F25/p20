import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mvwciuycfipctsnkduhl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12d2NpdXljZmlwY3RzbmtkdWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDI3ODcsImV4cCI6MjA3ODI3ODc4N30.3rn3XNRRK7-9xfXKNo759Mrt74U1PeUAgZ3TKpnxHc8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)