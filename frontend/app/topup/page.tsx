'use client';

// 充值页面

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

const QUICK_AMOUNTS = [10, 30, 50, 100, 200, 500];

export default function TopupPage() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleTopup(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    setMessage('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/'); return; }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wallet/topup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ amount: parseFloat(amount) })
    });

    const data = await res.json();

    if (data.success) {
      setSuccess(true);
      setMessage(`${data.message}！新余额：RM ${data.newBalance}`);
    } else {
      setMessage('充值失败：' + data.error);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部 */}
      <div className="bg-blue-600 px-6 pt-12 pb-8">
        <button onClick={() => router.back()} className="text-blue-200 mb-4 block">← 返回</button>
        <h1 className="text-white text-2xl font-bold">充值</h1>
      </div>

      <div className="px-6 mt-6">
        {/* 快捷金额 */}
        <p className="text-gray-600 font-medium mb-3">快速选择金额</p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {QUICK_AMOUNTS.map(a => (
            <button
              key={a}
              onClick={() => setAmount(String(a))}
              className={`py-3 rounded-xl font-semibold transition ${
                amount === String(a)
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              RM {a}
            </button>
          ))}
        </div>

        {/* 自定义金额 */}
        <form onSubmit={handleTopup} className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <label className="text-gray-500 text-sm">或输入金额</label>
            <div className="flex items-center mt-1">
              <span className="text-gray-400 text-lg mr-2">RM</span>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="0.01"
                max="5000"
                step="0.01"
                className="flex-1 text-2xl font-bold text-gray-800 focus:outline-none"
              />
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-sm ${success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          {success ? (
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full bg-green-500 text-white font-bold py-4 rounded-xl"
            >
              回到主页 ✓
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading || !amount}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition disabled:opacity-50"
            >
              {loading ? '处理中...' : `充值 RM ${parseFloat(amount || '0').toFixed(2)}`}
            </button>
          )}
        </form>

        {/* 说明 */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-700 text-sm">
            ⚠️ 这是模拟充值（演示版）。真实的 Touch & Go 会跳转到 FPX 或信用卡付款页面。
          </p>
        </div>
      </div>
    </div>
  );
}
