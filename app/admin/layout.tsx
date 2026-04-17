import Link from 'next/link';
import { LogoutButton } from '@/components/admin/LogoutButton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-matcha-800 text-white px-4 py-3 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-serif text-lg font-semibold hover:text-matcha-200 transition">
              管理ダッシュボード
            </Link>
            <Link href="/admin/reservations" className="text-sm text-matcha-200 hover:text-white transition">
              予約一覧
            </Link>
            <Link href="/admin/menu" className="text-sm text-matcha-200 hover:text-white transition">
              メニュー管理
            </Link>
            <Link href="/admin/settings" className="text-sm text-matcha-200 hover:text-white transition">
              営業日設定
            </Link>
          </div>
          <LogoutButton />
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
