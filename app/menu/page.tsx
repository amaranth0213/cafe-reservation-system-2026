import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';

export const revalidate = 3600; // 1時間キャッシュ

export default async function MenuPage() {
  const supabase = createServerClient();
  const { data: menus } = await supabase
    .from('menus')
    .select('id, name, description, price')
    .eq('is_available', true)
    .order('sort_order');

  return (
    <main className="min-h-screen bg-cream-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <Link href="/" className="text-matcha-600 text-sm hover:underline">← トップへ戻る</Link>
          <h1 className="text-3xl font-serif text-matcha-800 mt-4 mb-2">お菓子のメニュー</h1>
          <p className="text-sm text-gray-500">季節によってメニューが変わります</p>
        </div>

        {!menus || menus.length === 0 ? (
          <p className="text-center text-gray-500">現在メニューを準備中です</p>
        ) : (
          <div className="space-y-3">
            {menus.map((menu) => (
              <div key={menu.id} className="card flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{menu.name}</p>
                  {menu.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{menu.description}</p>
                  )}
                </div>
                <p className="text-matcha-700 font-semibold ml-4 shrink-0">
                  ¥{menu.price.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link href="/reserve" className="btn-primary inline-block">
            予約する →
          </Link>
        </div>
      </div>
    </main>
  );
}
