import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'カフェ予約 | 月曜日のひとときを',
  description: '手作りのお菓子と緑茶でほっと一息。月曜日限定のカフェです。',
  openGraph: {
    title: 'カフェ予約',
    description: '月曜日限定の手作りお菓子カフェ。席のご予約はこちらから。',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-cream-50">
        {children}
      </body>
    </html>
  );
}
