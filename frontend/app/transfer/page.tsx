'use client';

// 转账页面：把钱转给另一个用户

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function TransferPage() {
  const [toEmail, setToEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/'); return; }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wallet/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        toEmail,
        amount: parseFloat(amount),
        description: description || undefined
      })
    });

    const data = await res.json();

    if (data.success) {
      setSuccess(true);
      setMessage(data.message + `\n新余额：RM ${data.newBalance}`);
    } else {
      setMessage('转账失败：' + data.error);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 px-6 pt-12 pb-8">
        <button onClick={() => router.back()} className="text-green-200 mb-4 block">← 返回</button>
        <h1 className="text-white text-2xl font-bold">转账</h1>
      </div>

      <div className="px-6 mt-6">
        <form onSubmit={handleTransfer} className="space-y-4">
          {/* 收款人 */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <label className="text-gray-500 text-sm">收款人 Email</label>
            <input
              type="email"
              placeholder="friend@email.com"
              value={toEmail}
              onChange={e => setToEmail(e.target.value)}
              required
              className="w-full mt-1 text-gray-800 text-lg focus:outline-none"
            />
          </div>

          {/* 金额 */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <label className="text-gray-500 text-sm">转账金额</label>
            <div className="flex items-center mt-1">
              <span className="text-gray-400 text-lg mr-2">RM</span>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="0.01"
                max="10000"
                step="0.01"
                required
                className="flex-1 text-2xl font-bold text-gray-800 focus:outline-none"
              />
            </div>
          </div>

          {/* 备注 */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <label className="text-gray-500 text-sm">备注（可选）</label>
            <input
              type="text"
              placeholder="例如：还午餐钱"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={100}
              className="w-full mt-1 text-gray-800 focus:outline-none"
            />
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-sm whitespace-pre-line ${
              success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
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
              disabled={loading || !toEmail || !amount}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition disabled:opacity-50"
            >
              {loading ? '转账中...' : `确认转账 RM ${parseFloat(amount || '0').toFixed(2)}`}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
