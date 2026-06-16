'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SUPABASE_URL = 'https://pyfjvmeuzrfjdzsurqan.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5Zmp2bWV1enJmamR6c3VycWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MjczNjgsImV4cCI6MjA5NzEwMzM2OH0.vKx111856E6mtRb7oM8Z1Upl1HicHumo6r2vtK1tteI';
const API_URL = 'https://tng-wallet-app.onrender.com';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  direction: 'in' | 'out';
  date: string;
}

export default function Dashboard() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    import('@supabase/supabase-js').then(({ createClient }) => {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) { router.push('/'); return; }
        setUserEmail(user.email || '');

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push('/'); return; }

        const headers = { Authorization: `Bearer ${session.access_token}` };
        try {
          const [balanceRes, txRes] = await Promise.all([
            fetch(`${API_URL}/wallet/balance`, { headers }),
            fetch(`${API_URL}/wallet/transactions`, { headers })
          ]);
          const balanceData = await balanceRes.json();
          const txData = await txRes.json();
          setBalance(balanceData.balance);
          setTransactions(txData.transactions || []);
        } catch (err) {
          console.error('载入失败', err);
        }
        setLoading(false);
      });
    });
  }, []);

  async function handleLogout() {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-blue-600 text-lg">载入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-b from-blue-600 to-blue-700 px-6 pt-12 pb-24">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-blue-200 text-sm">你好，</p>
            <p className="text-white font-semibold">{userEmail}</p>
          </div>
          <button onClick={handleLogout} className="text-blue-200 text-sm hover:text-white">登出</button>
        </div>
        <div className="text-center">
          <p className="text-blue-200 text-sm mb-1">钱包余额</p>
          <p className="text-white text-5xl font-bold">
            RM {balance !== null ? balance.toFixed(2) : '---'}
          </p>
        </div>
      </div>

      <div className="px-6 -mt-12">
        <div className="bg-white rounded-2xl shadow-lg p-6 grid grid-cols-2 gap-4">
          <Link href="/topup" className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition">
            <span className="text-3xl mb-2">💰</span>
            <span className="text-blue-700 font-semibold">充值</span>
          </Link>
          <Link href="/transfer" className="flex flex-col items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition">
            <span className="text-3xl mb-2">➡️</span>
            <span className="text-green-700 font-semibold">转账</span>
          </Link>
        </div>
      </div>

      <div className="px-6 mt-6">
        <h2 className="text-gray-700 font-bold mb-4">最近交易</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-400 text-center py-8">还没有交易记录</p>
        ) : (
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx.id} className="bg-white rounded-xl p-4 shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">
                    {tx.type === 'topup' ? '💰 充值' : tx.type === 'transfer' ? '➡️ 转账' : '💳 付款'}
                  </p>
                  <p className="text-gray-400 text-sm">{tx.description}</p>
                  <p className="text-gray-300 text-xs">{new Date(tx.date).toLocaleString('zh-MY')}</p>
                </div>
                <p className={`font-bold text-lg ${tx.direction === 'in' ? 'text-green-500' : 'text-red-500'}`}>
                  {tx.direction === 'in' ? '+' : '-'}RM {Number(tx.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="h-8" />
    </div>
  );
}
