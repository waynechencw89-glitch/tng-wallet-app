'use client'; // 这行告诉 Next.js 这个组件在浏览器运行（不是服务器）

// 这是登入/注册页面
// 为什么用 Supabase 的 auth 而不是自己写？
// 因为自己写登入系统很容易有安全漏洞，Supabase 帮你处理好了！

import { useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); // true=登入, false=注册
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const router = useRouter();

  // 用 ref 延迟初始化，避免 Next.js build 时在服务端执行
  const supabaseRef = useRef<ReturnType<typeof createBrowserClient> | null>(null);
  function getSupabase() {
    if (!supabaseRef.current) {
      supabaseRef.current = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    return supabaseRef.current;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        const { error } = await getSupabase().auth.signInWithPassword({ email, password });
        if (error) {
          setMessage('登入失败：' + error.message);
        } else {
          router.push('/dashboard');
        }
      } else {
        const { error } = await getSupabase().auth.signUp({ email, password });
        if (error) {
          setMessage('注册失败：' + error.message);
        } else {
          setMessage('注册成功！请检查邮箱验证你的账号，然后登入。');
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setMessage('出错了：' + (err?.message || '请重试'));
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-600 to-blue-800">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-2">💳</div>
          <h1 className="text-2xl font-bold text-blue-600">TNG Wallet</h1>
          <p className="text-gray-500 text-sm">你的数字钱包</p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="密码（至少 6 位）"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {message && (
            <p className={`text-sm text-center ${message.includes('失败') ? 'text-red-500' : 'text-green-500'}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? '处理中...' : (isLogin ? '登入' : '注册')}
          </button>
        </form>

        {/* 切换登入/注册 */}
        <p className="text-center text-gray-500 text-sm mt-4">
          {isLogin ? '还没有账号？' : '已有账号？'}
          <button
            onClick={() => { setIsLogin(!isLogin); setMessage(''); }}
            className="text-blue-600 font-semibold ml-1 hover:underline"
          >
            {isLogin ? '立即注册' : '去登入'}
          </button>
        </p>
      </div>
    </div>
  );
}
