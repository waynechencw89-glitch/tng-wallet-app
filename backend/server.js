// 这是后端服务器的入口点
// 就像一家餐厅的前台：接待客人（请求），指引到对的部门处理

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const walletRoutes = require('./routes/wallet');

const app = express();

// ============================================
// 基础设置
// ============================================

// CORS：允许前端（Vercel）来访问这个后端（Railway）
// 没有这个，浏览器会因为"跨域"而拒绝请求
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // 部署时改成你的 Vercel 网址
  credentials: true
}));

// 解析 JSON 请求体（让我们能读取前端发来的数据）
app.use(express.json());

// ============================================
// 限流：防止有人疯狂发请求（攻击或乱用）
// 就像便利店规定每人每天最多买10瓶酒
// ============================================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100,                   // 每个 IP 最多 100 次请求
  message: { error: '请求太频繁，请稍后再试' }
});

app.use(limiter);

// ============================================
// 路由：不同的 URL 去不同的地方处理
// /wallet/* → wallet.js 处理
// ============================================
app.use('/wallet', walletRoutes);

// 健康检查：Railway 用来确认服务器还活着
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 处理：访问了不存在的路由
app.use((req, res) => {
  res.status(404).json({ error: '这个 API 不存在' });
});

// 全局错误处理：任何没被抓到的错误都到这里
app.use((err, req, res, next) => {
  console.error('未处理的错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// ============================================
// 启动服务器
// process.env.PORT 是 Railway 自动给的端口
// ============================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`收银员上班了！监听端口 ${PORT}`);
});
