import { createBrowserClient } from '@supabase/ssr';

// trim() 移除任何意外的换行或空白，防止 Vercel 贴 key 时出错
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\s/g, '');
const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').replace(/\s/g, '');

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseKey);
  }
  return client;
}
