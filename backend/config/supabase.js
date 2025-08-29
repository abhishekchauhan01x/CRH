import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🚀 Supabase initialized')
console.log('📋 Supabase Config:', {
  url: supabaseUrl,
  key: supabaseKey ? '***' + supabaseKey.slice(-4) : 'NOT_SET'
})

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase configuration incomplete. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.')
}

