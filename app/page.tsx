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
      <section className="bg-cream-100 text-matcha-800 py-20 px-4 border-b border-cream-200">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-serif font-light mb-4 leading-snug tracking-wide text-matcha-800">
            <span className="block text-2xl text-matcha-600 mb-1">お茶と甘いもの</span>
            <span className="block">あまらんす</span>
          </h1>
          <p className="text-matcha-600 text-base mb-2 leading-relaxed">
            毎週月曜日、９：３０〜１５：３０（３部制）
          </p>
          <p className="text-matcha-500 text-sm mb-10 leading-relaxed">
            手作りお菓子をゆっくりお楽しみください
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/reserve" className="bg-matcha-500 text-white font-light px-8 py-4 rounded-xl hover:bg-matcha-600 transition-colors text-center">
              席を予約する
            </Link>
            <Link href="/menu" className="border border-matcha-400 text-matcha-700 font-light px-8 py-4 rounded-xl hover:bg-cream-200 transition-colors text-center">
              メニューを見る
            </Link>
          </div>
          <div className="mt-5">
            <Link href="/reserve/lookup" className="text-matcha-600 text-sm underline underline-offset-4 hover:text-matcha-800 transition-colors">
              予約内容の確認はこちら
            </Link>
          </div>
        </div>
      </section>

      {/* 営業情報 */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-serif font-light text-center text-matcha-700 mb-8 tracking-wide">営業のご案内</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: '営業日', value: '毎週月曜日' },
              { label: '時間帯', value: '9:30 / 11:30 / 13:30' },
              { label: '席数', value: '9席（要予約）' },
            ].map((item) => (
              <div key={item.label} className="text-center p-5 rounded-xl bg-cream-50 border border-cream-200">
                <p className="text-sm text-matcha-600 mb-1">{item.label}</p>
                <p className="text-gray-700 font-normal">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 p-5 rounded-xl bg-cream-50 border border-cream-200 text-sm text-matcha-700">
            <strong className="font-normal">キャンセル・注文変更について：</strong>instagram のメッセージよりご連絡ください。また、当日お菓子も少しご用意しています。
          </div>
        </div>
      </section>

      {/* メニュー紹介 */}
      <section className="py-14 px-4 bg-cream-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-serif font-light text-center text-matcha-700 mb-2 tracking-wide">お菓子のメニュー（都合により変更されることがあります）</h2>
          <p className="text-center text-sm text-matcha-500 mb-8">季節によってメニューが変わります</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(menus ?? []).map((menu) => (
              <div key={menu.id} className="bg-white rounded-lg p-4 border border-cream-200 text-center text-sm text-gray-700 font-light">
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
      <footer className="bg-cream-100 text-matcha-600 py-8 px-4 text-center text-sm border-t border-cream-200">
        <p className="mb-2">キャンセル・注文変更は Instagram DM にてご連絡ください</p>
        <Link href="/reserve/lookup" className="text-matcha-500 text-xs underline underline-offset-4 hover:text-matcha-700 transition-colors">
          予約内容の確認
        </Link>
        <p className="text-matcha-500 text-xs mt-4">愛知県豊田市千石町3丁目５０９</p>
        <p className="text-matcha-400 text-xs mt-2">© 2026 お茶と甘いもの　あまらんす</p>
      </footer>
    </main>
  );
}
