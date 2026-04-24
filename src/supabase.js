import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = 'https://pcezoixshuxphzlmzscf.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjZXpvaXhzaHV4cGh6bG16c2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5Njg2NDAsImV4cCI6MjA5MjU0NDY0MH0.YUbCIcR2bqGnYN_1MtwWWErMuDe9XmImGuMCy7TXkHs'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)