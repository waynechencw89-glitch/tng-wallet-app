'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SUPABASE_URL = 'https://pyfjvmeuzrfjdzsurqan.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5Zmp2bWV1enJmamR6c3VycWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MjczNjgsImV4cCI6MjA5NzEwMzM2OH0.vKx111856E6mtRb7oM8Z1Upl1HicHumo6r2vtK1tteI';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setMessage('登入失败：' + error.message);
        else router.push('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) setMessage('注册失败：' + error.message);
        else { setMessage('注册成功！现在可以直接登入。'); setIsLogin(true); }
      }
    } catch (err: any) {
      setMessage('出错了：' + (err?.message || '请重试'));
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-600 to-blue-800">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-2">💳</div>
          <h1 className="text-2xl font-bold text-blue-600">TNG Wallet</h1>
          <p className="text-gray-500 text-sm">你的数字钱包</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="password" placeholder="密码（至少 6 位）" value={password}
            onChange={e => setPassword(e.target.value)} required minLength={6}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />

          {message && (
            <p className={`text-sm text-center ${message.includes('失败') || message.includes('出错') ? 'text-red-500' : 'text-green-500'}`}>
              {message}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50">
            {loading ? '处理中...' : (isLogin ? '登入' : '注册')}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-4">
          {isLogin ? '还没有账号？' : '已有账号？'}
          <button onClick={() => { setIsLogin(!isLogin); setMessage(''); }}
            className="text-blue-600 font-semibold ml-1 hover:underline">
            {isLogin ? '立即注册' : '去登入'}
          </button>
        </p>
      </div>
    </div>
  );
}
