import { createServerClient } from '@/lib/supabase/server';
import PrintButton from '../stock/PrintButton';

const SLOT_LABELS: Record<string, string> = {
  '09:30': '9:30〜の部',
  '11:30': '11:30〜の部',
  '13:30': '13:30〜の部',
};

const SEAT_LABELS: Record<string, string> = {
  single: '1人席',
  double: '2人席',
  quad: '4人席',
};

async function getDayList(date: string) {
  const supabase = createServerClient();

  const { data: businessDay } = await supabase
    .from('business_days')
    .select('id, date')
    .eq('date', date)
    .maybeSingle();

  if (!businessDay) return { slots: [], takeouts: [], date };

  const { data: slots } = await supabase
    .from('time_slots')
    .select('id, slot_time')
    .eq('business_day_id', businessDay.id)
    .order('slot_time');

  const slotIds = (slots ?? []).map((s: { id: string }) => s.id);

  const { data: reservations } = await supabase
    .from('reservations')
    .select(`
      id, reservation_code, reservation_type, customer_name, customer_phone,
      party_size, notes, time_slot_id,
      seat_types (category),
      reservation_items (quantity, is_takeout, menus (name))
    `)
    .in('time_slot_id', slotIds)
    .eq('status', 'confirmed')
    .order('created_at');

  // テイクアウトは予約コードの日付部分（例: 0518）で絞り込む
  const dateParts = date.split('-');
  const mmdd = `${dateParts[1]}${dateParts[2]}`;

  const { data: takeouts } = await supabase
    .from('reservations')
    .select(`
      id, reservation_code, reservation_type, customer_name, customer_phone,
      notes,
      reservation_items (quantity, is_takeout, menus (name))
    `)
    .is('time_slot_id', null)
    .eq('status', 'confirmed')
    .like('reservation_code', `${mmdd}-%`)
    .order('created_at');

  const slotMap = (slots ?? []).map((slot: { id: string; slot_time: string }) => ({
    ...slot,
    reservations: (reservations ?? []).filter(r => r.time_slot_id === slot.id),
  }));

  return { slots: slotMap, takeouts: takeouts ?? [], date };
}

export default async function PrintDayListPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const supabase = createServerClient();

  // 日付パラメータがなければ直近の営業日を使う
  let targetDate = searchParams.date ?? '';
  if (!targetDate) {
    const today = new Date().toLocaleDateString('ja-JP', {
      timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
    }).replace(/\//g, '-');
    const { data: nextDay } = await supabase
      .from('business_days')
      .select('date')
      .eq('is_open', true)
      .gte('date', today)
      .order('date')
      .limit(1)
      .maybeSingle();
    targetDate = nextDay?.date ?? today;
  }

  const { slots, takeouts, date } = await getDayList(targetDate);

  const [y, mo, d] = date.split('-').map(Number);
  const weekdayStr = new Date(`${date}T12:00:00+09:00`).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', weekday: 'narrow' });
  const dateLabel = `${y}年${mo}月${d}日（${weekdayStr}）`;

  const totalCount = slots.reduce((sum: number, s: { reservations: unknown[] }) => sum + s.reservations.length, 0) + takeouts.length;

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm 10mm; }
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; background: white; font-size: 10pt; }
          .print-body { padding: 0 !important; }
          .page-header h1 { font-size: 13pt !important; }
          .page-header span { font-size: 10pt !important; }
          .check-row { padding: 3px 0 !important; gap: 6px !important; }
          .check-box { width: 12px !important; height: 12px !important; margin-top: 1px !important; }
          .check-row > div { font-size: 9pt !important; }
          .slot-header { font-size: 10pt !important; padding: 2px 8px !important; margin: 6px 0 2px !important; }
          .takeout-header { font-size: 10pt !important; padding: 2px 8px !important; margin: 6px 0 2px !important; }
          .no-reservation { font-size: 8pt !important; padding: 2px 0 !important; }
          .footer-text { font-size: 7pt !important; margin-top: 6px !important; }
        }
        body { font-family: 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif; }
        .check-row { display: flex; align-items: flex-start; gap: 10px; padding: 6px 0; border-bottom: 1px solid #eee; }
        .check-box { width: 16px; height: 16px; border: 1.5px solid #555; border-radius: 2px; flex-shrink: 0; margin-top: 2px; }
        .slot-header { background: #2d5a27; color: white; padding: 4px 10px; border-radius: 4px; font-size: 14px; font-weight: bold; margin: 12px 0 4px; }
        .takeout-header { background: #b45309; color: white; padding: 4px 10px; border-radius: 4px; font-size: 14px; font-weight: bold; margin: 12px 0 4px; }
      `}</style>

      {/* 印刷ボタン */}
      <div className="no-print" style={{ padding: '16px', textAlign: 'center', background: '#f8f6f0', borderBottom: '1px solid #e0d8cc' }}>
        <p style={{ color: '#5c3d2e', marginBottom: '4px', fontSize: '14px' }}>
          当日お客様一覧表 — {dateLabel}
        </p>
        <p style={{ color: '#888', marginBottom: '10px', fontSize: '12px' }}>合計 {totalCount} 組</p>
        <PrintButton />
      </div>

      {/* 印刷本体 */}
      <div className="print-body" style={{ padding: '0 4mm', background: 'white', minHeight: '100vh' }}>

        {/* ヘッダー */}
        <div className="page-header" style={{ borderBottom: '2px solid #333', paddingBottom: '6px', marginBottom: '4px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h1 style={{ fontSize: '18px', margin: 0, fontWeight: 'bold' }}>当日お客様一覧</h1>
          <span style={{ fontSize: '14px', color: '#444' }}>{dateLabel}　全{totalCount}組</span>
        </div>

        {/* 時間帯ごと */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {slots.map((slot: any) => (
          <div key={slot.id}>
            <div className="slot-header">
              {SLOT_LABELS[slot.slot_time] ?? slot.slot_time}　{slot.reservations.length}組
            </div>
            {slot.reservations.length === 0 ? (
              <p className="no-reservation" style={{ fontSize: '12px', color: '#aaa', padding: '4px 0' }}>予約なし</p>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              slot.reservations.map((r: any, idx: number) => {
                const seatCategory = Array.isArray(r.seat_types) ? r.seat_types[0]?.category : r.seat_types?.category;
                const seatLabel = seatCategory ? SEAT_LABELS[seatCategory] ?? seatCategory : '';
                const items = (r.reservation_items ?? []).filter((i: any) => i.quantity > 0);
                return (
                  <div key={r.id} className="check-row">
                    <div className="check-box" />
                    <div style={{ flex: 1, fontSize: '13px' }}>
                      <span style={{ fontWeight: 'bold', marginRight: '8px' }}>{idx + 1}.</span>
                      <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{r.customer_name}　様</span>
                      <span style={{ color: '#666', marginLeft: '8px' }}>{r.reservation_code}</span>
                      <span style={{ color: '#555', marginLeft: '8px' }}>
                        {seatLabel}{r.party_size ? `・${r.party_size}名` : ''}
                      </span>
                      {items.length > 0 && (
                        <span style={{ marginLeft: '8px', color: '#92400e' }}>
                          🍡 {items.map((i: any) => `${i.menus?.name ?? ''}×${i.quantity}${i.is_takeout ? '(TO)' : ''}`).join('、')}
                        </span>
                      )}
                      {r.notes && (
                        <span style={{ marginLeft: '8px', color: '#dc2626' }}>⚠ {r.notes}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ))}

        {/* テイクアウト */}
        {takeouts.length > 0 && (
          <div>
            <div className="takeout-header">お持ち帰り　{takeouts.length}件</div>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {takeouts.map((r: any, idx: number) => {
              const items = (r.reservation_items ?? []).filter((i: any) => i.quantity > 0);
              return (
                <div key={r.id} className="check-row">
                  <div className="check-box" />
                  <div style={{ flex: 1, fontSize: '13px' }}>
                    <span style={{ fontWeight: 'bold', marginRight: '8px' }}>{idx + 1}.</span>
                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{r.customer_name}　様</span>
                    <span style={{ color: '#666', marginLeft: '8px' }}>{r.reservation_code}</span>
                    {items.length > 0 && (
                      <span style={{ marginLeft: '8px', color: '#92400e' }}>
                        🍡 {items.map((i: any) => `${i.menus?.name ?? ''}×${i.quantity}`).join('、')}
                      </span>
                    )}
                    {r.notes && (
                      <span style={{ marginLeft: '8px', color: '#dc2626' }}>⚠ {r.notes}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="footer-text" style={{ marginTop: '16px', borderTop: '1px solid #ddd', paddingTop: '6px' }}>
          <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>
            印刷日時：{new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
          </p>
        </div>
      </div>
    </>
  );
}
