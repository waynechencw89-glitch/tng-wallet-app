// layout.tsx = 每一页都会套用的外框
// 就像每一页都有同样的顶部导航栏

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TNG Wallet',
  description: '你的数字钱包',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
