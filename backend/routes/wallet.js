// 钱包相关的 API：查余额、充值、转账
// 这些操作都要先登入才能用（requireAuth 守卫保护）

const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const { requireAuth } = require('../middleware/auth');

// ============================================
// GET /wallet/balance
// 查询自己的钱包余额
// ============================================
router.get('/balance', requireAuth, async (req, res) => {
  const { data: wallet, error } = await supabase
    .from('wallets')
    .select('balance, id')
    .eq('user_id', req.user.id)
    .single(); // 只拿一筆（每人只有一个钱包）

  if (error) return res.status(500).json({ error: '找不到钱包' });

  res.json({
    balance: wallet.balance,
    walletId: wallet.id
  });
});

// ============================================
// POST /wallet/topup
// 充值（模拟，真实需要接 FPX / 信用卡 API）
// ============================================
router.post('/topup', requireAuth, async (req, res) => {
  const { amount } = req.body;

  // 基本检查：金额必须是正数
  if (!amount || amount <= 0 || amount > 5000) {
    return res.status(400).json({ error: '金额必须在 RM 0.01 到 RM 5000 之间' });
  }

  // 先找到用户的钱包
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('id')
    .eq('user_id', req.user.id)
    .single();

  if (walletError) return res.status(500).json({ error: '找不到钱包' });

  // 调用 functions.sql 里定义的充值函数（原子操作：加余额 + 记录交易）
  const { error: updateError } = await supabase.rpc('topup_wallet', {
    p_wallet_id: wallet.id,
    p_amount: parseFloat(amount)
  });

  if (updateError) {
    // RPC 不可用时 fallback：直接 UPDATE + INSERT（开发/测试用）
    const { data: current } = await supabase
      .from('wallets').select('balance').eq('id', wallet.id).single();

    const { error: fallbackErr } = await supabase
      .from('wallets')
      .update({ balance: Number(current.balance) + parseFloat(amount) })
      .eq('id', wallet.id);

    if (fallbackErr) return res.status(500).json({ error: '充值失败：' + fallbackErr.message });

    await supabase.from('transactions').insert({
      to_wallet_id: wallet.id,
      amount: parseFloat(amount),
      type: 'topup',
      description: 'topup'
    });
  }

  // 拿最新余额回传
  const { data: updated } = await supabase
    .from('wallets')
    .select('balance')
    .eq('id', wallet.id)
    .single();

  res.json({
    success: true,
    message: `成功充值 RM ${parseFloat(amount).toFixed(2)}`,
    newBalance: updated.balance
  });
});

// ============================================
// POST /wallet/transfer
// 转账给另一个用户（用他们的 email）
// ============================================
router.post('/transfer', requireAuth, async (req, res) => {
  const { toEmail, amount, description } = req.body;

  if (!toEmail || !amount || amount <= 0) {
    return res.status(400).json({ error: '请填写收款人 email 和金额' });
  }

  if (amount > 10000) {
    return res.status(400).json({ error: '单次转账上限 RM 10,000' });
  }

  // 不能转给自己
  if (toEmail.toLowerCase() === req.user.email.toLowerCase()) {
    return res.status(400).json({ error: '不能转钱给自己' });
  }

  // 找付款人的钱包
  const { data: fromWallet } = await supabase
    .from('wallets')
    .select('id, balance')
    .eq('user_id', req.user.id)
    .single();

  if (!fromWallet) return res.status(500).json({ error: '找不到你的钱包' });

  // 找收款人（通过 email 找 user id）
  const { data: toUserData, error: userError } = await supabase.auth.admin.listUsers();
  const toUser = toUserData?.users?.find(u => u.email?.toLowerCase() === toEmail.toLowerCase());

  if (!toUser) {
    return res.status(404).json({ error: `找不到用户 ${toEmail}` });
  }

  // 找收款人的钱包
  const { data: toWallet } = await supabase
    .from('wallets')
    .select('id')
    .eq('user_id', toUser.id)
    .single();

  if (!toWallet) return res.status(404).json({ error: '收款人没有钱包' });

  // 调用数据库的转账函数（在 schema.sql 里定义的，确保原子性）
  const { data: result, error: transferError } = await supabase.rpc('transfer_funds', {
    p_from_wallet_id: fromWallet.id,
    p_to_wallet_id: toWallet.id,
    p_amount: parseFloat(amount),
    p_description: description || `转账给 ${toEmail}`
  });

  if (transferError || !result?.success) {
    return res.status(400).json({ error: result?.error || '转账失败' });
  }

  // 拿最新余额
  const { data: updated } = await supabase
    .from('wallets')
    .select('balance')
    .eq('id', fromWallet.id)
    .single();

  res.json({
    success: true,
    message: `成功转账 RM ${parseFloat(amount).toFixed(2)} 给 ${toEmail}`,
    newBalance: updated.balance
  });
});

// ============================================
// GET /wallet/transactions
// 查交易记录（最近 20 笔）
// ============================================
router.get('/transactions', requireAuth, async (req, res) => {
  const { data: wallet } = await supabase
    .from('wallets')
    .select('id')
    .eq('user_id', req.user.id)
    .single();

  if (!wallet) return res.status(500).json({ error: '找不到钱包' });

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .or(`from_wallet_id.eq.${wallet.id},to_wallet_id.eq.${wallet.id}`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ error: '无法读取交易记录' });

  // 整理数据，让前端好用
  const formatted = transactions.map(tx => ({
    id: tx.id,
    amount: tx.amount,
    type: tx.type,
    description: tx.description,
    direction: tx.to_wallet_id === wallet.id ? 'in' : 'out', // 进来还是出去
    date: tx.created_at
  }));

  res.json({ transactions: formatted });
});

module.exports = router;
