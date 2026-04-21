import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = createServerClient();
  const { data: menus } = await supabase
    .from('menus')
    .select('id, name')
    .eq('is_available', true)
    .order('sort_order');

  return (
    <main className="min-h-screen">
      {/* ヒーローセクション */}
      <section className="bg-matcha-700 text-white py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-serif font-semibold mb-4 leading-snug">
            <span className="block text-2xl">お茶とあまいもの</span>
            <span className="block">あまらんす</span>
          </h1>
          <p className="text-matcha-100 text-lg mb-2 leading-relaxed">
            毎週月曜日、９：３０〜１５：３０（３部制）
          </p>
          <p className="text-matcha-100 text-base mb-10 leading-relaxed">
            手作りお菓子をゆっくりお楽しみください
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/reserve" className="bg-white text-matcha-700 font-semibold px-8 py-4 rounded-xl hover:bg-cream-100 transition-colors text-center shadow-md">
              席を予約する
            </Link>
            <Link href="/menu" className="border-2 border-white text-white font-medium px-8 py-4 rounded-xl hover:bg-matcha-600 transition-colors text-center">
              メニューを見る
            </Link>
          </div>
        </div>
      </section>

      {/* 営業情報 */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-serif text-center text-matcha-800 mb-8">営業のご案内</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: '営業日', value: '毎週月曜日' },
              { label: '時間帯', value: '9:30 / 11:30 / 13:30' },
              { label: '席数', value: '11席（要予約）' },
            ].map((item) => (
              <div key={item.label} className="text-center p-5 rounded-xl bg-cream-50 border border-cream-200">
                <p className="text-sm text-matcha-600 font-medium mb-1">{item.label}</p>
                <p className="text-gray-800 font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 p-5 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
            <strong>キャンセル・注文変更について：</strong>キャンセルや注文変更は Instagram のメッセージよりご連絡ください。
          </div>
        </div>
      </section>

      {/* メニュー紹介 */}
      <section className="py-14 px-4 bg-cream-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-serif text-center text-matcha-800 mb-2">お菓子のメニュー（都合により変更されることがあります）</h2>
          <p className="text-center text-sm text-gray-500 mb-8">季節によってメニューが変わります</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(menus ?? []).map((menu) => (
              <div key={menu.id} className="bg-white rounded-lg p-4 border border-cream-200 text-center text-sm font-medium text-gray-700 shadow-sm">
                {menu.name}
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/reserve" className="btn-primary inline-block">
              ご予約はこちら →
            </Link>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-matcha-900 text-matcha-200 py-8 px-4 text-center text-sm">
        <p className="mb-2">キャンセル・注文変更は Instagram DMにてご連絡ください</p>
        <p className="text-matcha-400 text-xs">© 2026 お茶とあまいもの　あまらんす</p>
      </footer>
    </main>
  );
}
