import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pyfjvmeuzrfjdzsurqan.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5Zmp2bWV1enJmamR6c3VycWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MjczNjgsImV4cCI6MjA5NzEwMzM2OH0.vKx111856E6mtRb7oM8Z1Upl1HicHumo6r2vtK1tteI';

let client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return client;
}
