# 部署指南（按顺序做）

## 第一步：Supabase 设置（数据库/账本）

1. 去 https://supabase.com 注册/登入
2. 点 "New Project"，取个名字（如 tng-wallet）
3. 记下：Project URL 和 API Keys（Settings > API）
4. 去 SQL Editor，把 `supabase/schema.sql` 的内容贴上去，点 Run
5. 再把 `supabase/functions.sql` 贴上去，点 Run
6. 去 Authentication > Settings，可以开启邮箱验证

---

## 第二步：Railway 部署（后端/收银员）

1. 去 https://railway.app 注册/登入
2. 点 "New Project" > "Deploy from GitHub repo"
3. 选你的 repo，root directory 选 `backend/`
4. 在 Variables（环境变量）里填：
   - `SUPABASE_URL` = 你的 Supabase URL
   - `SUPABASE_ANON_KEY` = anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key（要保密！）
5. 部署后会给你一个 URL，如 `https://xxx.railway.app`
6. 记下这个 URL！

---

## 第三步：Vercel 部署（前端/招牌）

1. 去 https://vercel.com 注册/登入
2. 点 "New Project" > 导入你的 GitHub repo
3. root directory 选 `frontend/`
4. 在 Environment Variables 里填：
   - `NEXT_PUBLIC_SUPABASE_URL` = 你的 Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key
   - `NEXT_PUBLIC_API_URL` = 你的 Railway URL（第二步拿到的）
5. 部署！会给你一个 `.vercel.app` 的网址

---

## 第四步：更新 Railway 的 CORS 设置

把你的 Vercel 网址填入 Railway 的环境变量：
- `FRONTEND_URL` = https://你的项目.vercel.app

---

## 本地开发

```bash
# 后端
cd backend
npm install
cp .env.example .env   # 填入真实的值
npm run dev            # 启动在 http://localhost:3001

# 前端（另一个终端）
cd frontend
npm install
cp .env.local.example .env.local   # 填入值（API_URL 用 http://localhost:3001）
npm run dev            # 启动在 http://localhost:3000
```
