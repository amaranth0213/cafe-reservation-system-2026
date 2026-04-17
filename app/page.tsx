import Link from 'next/link';

export default function HomePage() {
  const menus = [
    '抹茶のテリーヌ',
    '低糖質の抹茶のシフォンケーキ',
    '抹茶のアフォガード',
    'オレンショコラケーキ',
    'ほうじ茶プリン',
    '苺大福',
    'パリパリもなか',
  ];

  return (
    <main className="min-h-screen">
      {/* ヒーローセクション */}
      <section className="bg-matcha-700 text-white py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-matcha-200 text-sm tracking-widest mb-3 font-sans">月曜日だけの、特別なひととき</p>
          <h1 className="text-4xl font-serif font-semibold mb-6 leading-tight">
            手作りお菓子カフェ
          </h1>
          <p className="text-matcha-100 text-lg mb-10 leading-relaxed">
            毎週月曜日、9:30〜14:00（3部制）<br />
            丁寧に作った和と洋のお菓子をどうぞ
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
              { label: '時間帯', value: '9:30 / 12:00 / 14:00' },
              { label: '席数', value: '11席（要予約）' },
            ].map((item) => (
              <div key={item.label} className="text-center p-5 rounded-xl bg-cream-50 border border-cream-200">
                <p className="text-sm text-matcha-600 font-medium mb-1">{item.label}</p>
                <p className="text-gray-800 font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 p-5 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
            <strong>キャンセルについて：</strong>ご予約のキャンセルは Instagram のメッセージよりご連絡ください。
          </div>
        </div>
      </section>

      {/* メニュー紹介 */}
      <section className="py-14 px-4 bg-cream-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-serif text-center text-matcha-800 mb-2">本日のお菓子</h2>
          <p className="text-center text-sm text-gray-500 mb-8">季節によってメニューが変わります</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {menus.map((name) => (
              <div key={name} className="bg-white rounded-lg p-4 border border-cream-200 text-center text-sm font-medium text-gray-700 shadow-sm">
                {name}
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
        <p className="mb-2">キャンセルは Instagram DMにてご連絡ください</p>
        <p className="text-matcha-400 text-xs">© 2026 手作りお菓子カフェ</p>
      </footer>
    </main>
  );
}
