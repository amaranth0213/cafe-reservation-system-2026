import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'お茶と甘いもの あまらんす | ご予約',
  description: '毎週月曜日、９：３０〜１６：００（３部制）。手作りお菓子をゆっくりお楽しみください。',
  openGraph: {
    title: 'お茶と甘いもの あまらんす',
    description: '毎週月曜日、９：３０〜１６：００（３部制）。席のご予約はこちらから。',
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
