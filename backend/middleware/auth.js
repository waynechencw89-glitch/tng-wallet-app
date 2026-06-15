// 这个"守卫"检查每个 API 请求是否来自真正登入的用户
// 原理：用户登入后 Supabase 会给他一个 JWT token（像临时通行证）
// 每次请求都要带着这个 token，守卫检查它是否有效

const { createClient } = require('@supabase/supabase-js');

async function requireAuth(req, res, next) {
  // 从请求头拿 token（格式："Bearer eyJhbGci..."）
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '没有登入，请先登入' });
  }

  const token = authHeader.split(' ')[1];

  // 用 ANON KEY 验证 token（这把钥匙只能验证，不能做敏感操作）
  const supabaseAuth = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Token 无效或已过期' });
  }

  // 把用户信息贴到 req 上，之后的路由可以用
  req.user = user;
  next(); // 放行！继续执行下一步
}

module.exports = { requireAuth };
