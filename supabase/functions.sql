-- 这个文件也要在 Supabase SQL Editor 里执行
-- 是 schema.sql 的补充

-- 充值函数（安全地增加余额 + 记录交易）
CREATE OR REPLACE FUNCTION topup_wallet(
  p_wallet_id  UUID,
  p_amount     NUMERIC
)
RETURNS VOID AS $$
BEGIN
  -- 加钱
  UPDATE wallets
  SET balance = balance + p_amount
  WHERE id = p_wallet_id;

  -- 记录交易（充值没有 from_wallet_id，因为钱从"外部"进来）
  INSERT INTO transactions (to_wallet_id, amount, type, description)
  VALUES (p_wallet_id, p_amount, 'topup', '钱包充值');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
