export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase/server';
import PrintButton from './PrintButton';

async function getStockData() {
  const supabase = createServerClient();

  // 今日の日付
  const today = new Date().toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\//g, '-');

  // 今日の営業日を取得
  const { data: businessDay } = await supabase
    .from('business_days')
    .select('id, date')
    .eq('date', today)
    .maybeSingle();

  // 表示中かつ在庫あるメニューを全取得
  const { data: menus } = await supabase
    .from('menus')
    .select('id, name, stock, hold_count, price')
    .eq('is_available', true)
    .not('stock', 'is', null)
    .gt('stock', 0)
    .order('name');

  if (!menus?.length) return { menus: [], orderedMap: {}, today };

  // 今日のオンライン注文済み数を集計
  const orderedMap: Record<string, number> = {};

  if (businessDay) {
    const { data: slots } = await supabase
      .from('time_slots')
      .select('id')
      .eq('business_day_id', businessDay.id);

    const slotIds = (slots ?? []).map((s: { id: string }) => s.id);

    if (slotIds.length > 0) {
      const { data: reservations } = await supabase
        .from('reservations')
        .select('id')
        .in('time_slot_id', slotIds)
        .eq('status', 'confirmed');

      const reservationIds = (reservations ?? []).map((r: { id: string }) => r.id);

      if (reservationIds.length > 0) {
        const { data: items } = await supabase
          .from('reservation_items')
          .select('menu_id, quantity')
          .in('reservation_id', reservationIds);

        for (const item of items ?? []) {
          orderedMap[item.menu_id] = (orderedMap[item.menu_id] ?? 0) + item.quantity;
        }
      }
    }
  }

  return { menus, orderedMap, today };
}

export default async function PrintStockPage() {
  const { menus, orderedMap, today } = await getStockData();

  // 日付を日本語表示に変換
  const dateObj = new Date(today + 'T00:00:00+09:00');
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const dateLabel = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日（${weekdays[dateObj.getDay()]}）`;

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm 10mm; }
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; background: white; }
        }
        body { font-family: 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif; }
        .box {
          display: inline-block;
          width: 14mm;
          height: 14mm;
          border: 1.5px solid #555;
          margin: 1.5mm;
          vertical-align: middle;
          border-radius: 2px;
        }
        .box-filled {
          background-color: #aaa;
          border-color: #888;
        }
        .box-empty {
          background-color: white;
        }
      `}</style>

      {/* 印刷ボタン */}
      <div className="no-print" style={{
        padding: '16px',
        textAlign: 'center',
        background: '#f8f6f0',
        borderBottom: '1px solid #e0d8cc',
      }}>
        <p style={{ color: '#5c3d2e', marginBottom: '4px', fontSize: '14px' }}>
          お菓子 在庫チェックシート（{dateLabel}）
        </p>
        <p style={{ color: '#888', marginBottom: '10px', fontSize: '12px' }}>
          ※ 灰色の□＝オンライン予約済み　白い□＝注文が入ったら塗る
        </p>
        <PrintButton />
      </div>

      {/* シート本体 */}
      <div style={{ padding: '0 4mm', background: 'white', minHeight: '100vh' }}>
        {/* ヘッダー */}
        <div style={{ borderBottom: '2px solid #333', paddingBottom: '6px', marginBottom: '12px', marginTop: '8px' }}>
          <h1 style={{ fontSize: '18px', margin: 0, fontWeight: 'bold', color: '#222' }}>
            お菓子 在庫チェックシート
          </h1>
          <p style={{ fontSize: '13px', margin: '2px 0 0', color: '#555' }}>
            {dateLabel}　　灰色の□＝オンライン予約済み　白い□＝当日注文で塗る
          </p>
        </div>

        {/* メニューごとの行 */}
        {menus.length === 0 ? (
          <p style={{ color: '#888', fontSize: '14px' }}>本日のメニューがありません</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {menus.map((menu: { id: string; name: string; stock: number; hold_count: number | null; price: number }) => {
              const totalStock = menu.stock;
              const onlineOrdered = orderedMap[menu.id] ?? 0;
              const remaining = totalStock - onlineOrdered;

              return (
                <div key={menu.id} style={{
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  background: '#fafafa',
                }}>
                  {/* 商品名と集計 */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#222' }}>
                      {menu.name}
                    </span>
                    <span style={{ fontSize: '13px', color: '#888' }}>
                      全{totalStock}個　オンライン済 {onlineOrdered}個　残り {remaining}個
                    </span>
                  </div>

                  {/* チェックボックス一覧 */}
                  <div style={{ lineHeight: 1 }}>
                    {Array.from({ length: totalStock }, (_, i) => (
                      <span
                        key={i}
                        className={`box ${i < onlineOrdered ? 'box-filled' : 'box-empty'}`}
                        title={i < onlineOrdered ? 'オンライン予約済み' : '空き'}
                      />
                    ))}
                  </div>

                  {/* 凡例（右下） */}
                  <div style={{ marginTop: '6px', fontSize: '11px', color: '#999' }}>
                    ← オンライン予約済み {onlineOrdered}個 ｜ 当日受付分 {remaining}個 →
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* フッター */}
        <div style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '8px' }}>
          <p style={{ fontSize: '12px', color: '#aaa', margin: 0 }}>
            印刷日時：{new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
          </p>
        </div>
      </div>
    </>
  );
}
