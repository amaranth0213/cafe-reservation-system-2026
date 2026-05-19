export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase/server';
import PrintButton from './PrintButton';

// 各メニューの予約済み情報：スロット時間ごとの個数
type OrderedDetail = { slot_time: string; quantity: number };

async function getStockData() {
  const supabase = createServerClient();

  // 今日の日付（JST）
  const today = new Date().toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\//g, '-');

  // 直近の営業日を取得（今日以降で最も近い open な日）
  const { data: businessDay } = await supabase
    .from('business_days')
    .select('id, date')
    .eq('is_open', true)
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(1)
    .maybeSingle();

  // 表示中かつ在庫あるメニューを全取得
  const { data: menus } = await supabase
    .from('menus')
    .select('id, name, stock, hold_count, price')
    .eq('is_available', true)
    .not('stock', 'is', null)
    .gt('stock', 0)
    .order('name');

  if (!menus?.length) return { menus: [], orderedDetails: {}, displayDate: businessDay?.date ?? today };

  // メニューごとの予約済み詳細（スロット時間別）
  const orderedDetails: Record<string, OrderedDetail[]> = {};

  if (businessDay) {
    const { data: slots } = await supabase
      .from('time_slots')
      .select('id, slot_time')
      .eq('business_day_id', businessDay.id)
      .order('slot_time', { ascending: true });

    const slotTimeMap: Record<string, string> = {};
    for (const slot of slots ?? []) {
      slotTimeMap[slot.id] = slot.slot_time;
    }

    const slotIds = Object.keys(slotTimeMap);

    if (slotIds.length > 0) {
      const { data: reservations } = await supabase
        .from('reservations')
        .select('id, time_slot_id')
        .in('time_slot_id', slotIds)
        .eq('status', 'confirmed');

      const reservationSlotMap: Record<string, string> = {};
      for (const res of reservations ?? []) {
        if (res.time_slot_id) {
          reservationSlotMap[res.id] = slotTimeMap[res.time_slot_id];
        }
      }

      const reservationIds = Object.keys(reservationSlotMap);

      if (reservationIds.length > 0) {
        const { data: items } = await supabase
          .from('reservation_items')
          .select('menu_id, quantity, reservation_id')
          .in('reservation_id', reservationIds);

        for (const item of items ?? []) {
          const slotTime = reservationSlotMap[item.reservation_id];
          if (!slotTime) continue;
          if (!orderedDetails[item.menu_id]) orderedDetails[item.menu_id] = [];
          const existing = orderedDetails[item.menu_id].find(e => e.slot_time === slotTime);
          if (existing) {
            existing.quantity += item.quantity;
          } else {
            orderedDetails[item.menu_id].push({ slot_time: slotTime, quantity: item.quantity });
          }
        }
      }
    }
  }

  return { menus, orderedDetails, displayDate: businessDay?.date ?? today };
}

// 時間を短縮表示（9:30 → 9:30）
function shortTime(slot_time: string): string {
  return slot_time.replace(':00', '').replace(/^0/, '');
}

export default async function PrintStockPage() {
  const { menus, orderedDetails, displayDate } = await getStockData();

  // 日付を日本語表示に変換
  const [y, mo, d] = displayDate.split('-').map(Number);
  const weekdayStr = new Date(`${displayDate}T12:00:00+09:00`).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', weekday: 'narrow' });
  const dateLabel = `${y}年${mo}月${d}日（${weekdayStr}）`;

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
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 14mm;
          height: 14mm;
          border: 1.5px solid #555;
          margin: 1.5mm;
          vertical-align: middle;
          border-radius: 2px;
          font-size: 10px;
          font-weight: bold;
          line-height: 1;
        }
        .box-filled {
          background-color: #888;
          border-color: #666;
          color: white;
        }
        .box-empty {
          background-color: white;
          color: transparent;
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
          ※ 灰色の□＝オンライン予約済み（時間入り）　白い□＝注文が入ったら塗る
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
            {dateLabel}　　灰色の□＝オンライン予約済み（時間入り）　白い□＝当日注文で塗る
          </p>
        </div>

        {/* メニューごとの行 */}
        {menus.length === 0 ? (
          <p style={{ color: '#888', fontSize: '14px' }}>本日のメニューがありません</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {menus.map((menu: { id: string; name: string; stock: number; hold_count: number | null; price: number }) => {
              const totalStock = menu.stock;
              const details = (orderedDetails[menu.id] ?? []).sort((a, b) => a.slot_time.localeCompare(b.slot_time));
              // 時間ごとの四角を展開
              const orderedSquares: string[] = [];
              for (const { slot_time, quantity } of details) {
                for (let i = 0; i < quantity; i++) orderedSquares.push(slot_time);
              }
              const onlineOrdered = orderedSquares.length;
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
                    {orderedSquares.map((slot_time, i) => (
                      <span key={i} className="box box-filled">
                        {shortTime(slot_time)}
                      </span>
                    ))}
                    {Array.from({ length: remaining }, (_, i) => (
                      <span key={`empty-${i}`} className="box box-empty">　</span>
                    ))}
                  </div>

                  {/* 凡例 */}
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
