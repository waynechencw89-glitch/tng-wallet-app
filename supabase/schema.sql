-- ============================================
-- TNG Wallet - Supabase 数据库设计
-- 在 Supabase Dashboard > SQL Editor 里执行这个
-- ============================================

-- 钱包表：每个用户有一个钱包，里面有余额
-- 为什么独立一张表？因为余额会一直变，分开放比较安全，也方便锁定
CREATE TABLE wallets (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance     NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  -- NUMERIC(12,2) = 最多12位数，小数点后2位（像 RM 9999999999.99）
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 交易记录表：每一笔钱的流向都记录下来，永远不删
-- 为什么不直接改余额就好？因为银行规定每笔交易都要有证据！
CREATE TABLE transactions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_wallet_id  UUID REFERENCES wallets(id),  -- 谁付钱（充值时是 NULL）
  to_wallet_id    UUID REFERENCES wallets(id),  -- 谁收钱（提款时是 NULL）
  amount          NUMERIC(12, 2) NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('topup', 'transfer', 'payment')),
  -- CHECK 就像守门员：只允许这三种类型进来
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 安全规则（Row Level Security）
-- 就像：每个人只能看自己的银行账单，不能看别人的
-- ============================================

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 用户只能看自己的钱包
CREATE POLICY "users can view own wallet"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

-- 用户只能看自己相关的交易（付出去的或收进来的）
CREATE POLICY "users can view own transactions"
  ON transactions FOR SELECT
  USING (
    from_wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid())
    OR
    to_wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid())
  );

-- ============================================
-- 自动建钱包：用户注册后自动给他一个钱包
-- 就像你开户之后银行自动给你一个账号
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 转账函数：在数据库层面保证原子性
-- "原子性" = 要嘛两件事都成功，要嘛都失败，不会有一半成功的情况
-- 就像转账：你的钱减少 + 对方的钱增加，这两件事必须同时发生！
-- ============================================

CREATE OR REPLACE FUNCTION transfer_funds(
  p_from_wallet_id  UUID,
  p_to_wallet_id    UUID,
  p_amount          NUMERIC,
  p_description     TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_from_balance NUMERIC;
BEGIN
  -- 先锁定这两个钱包，防止同时有人操作（银行用语叫"加锁"）
  SELECT balance INTO v_from_balance
  FROM wallets
  WHERE id = p_from_wallet_id
  FOR UPDATE; -- 这行很重要！别人这时候不能动这个钱包

  -- 检查余额够不够
  IF v_from_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- 扣钱
  UPDATE wallets SET balance = balance - p_amount
  WHERE id = p_from_wallet_id;

  -- 收钱
  UPDATE wallets SET balance = balance + p_amount
  WHERE id = p_to_wallet_id;

  -- 记录这笔交易
  INSERT INTO transactions (from_wallet_id, to_wallet_id, amount, type, description)
  VALUES (p_from_wallet_id, p_to_wallet_id, p_amount, 'transfer', p_description);

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
