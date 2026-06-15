// 这里连接 Supabase
// 注意：后端用 SERVICE_ROLE_KEY（超级管理员钥匙），可以绕过 RLS 安全规则
// 因为后端是我们自己的程序，我们信任它！
// 但这把钥匙绝对不能给前端用户看到！

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;
