import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { formatDateJP } from '@/lib/business-days';

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');

  const supabase = createServerClient();
  const today = new Date().toISOString().split('T')[0];

  // 今日以降の予約を取得
  const { data: upcomingReservations } = await supabase
    .from('reservations')
    .select(`
      id, reservation_code, reservation_type, status, customer_name, party_size,
      time_slots (
        slot_time,
        business_days (date)
      ),
      seat_types (category)
    `)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(10);

  // 今後の営業日
  const { data: businessDays } = await supabase
    .from('business_days')
    .select(`
      id, date, is_open,
      time_slots (id, slot_time, is_accepting)
    `)
    .gte('date', today)
    .order('date')
    .limit(4);

  // 統計
  const { count: totalReservations } = await supabase
    .from('reservations')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'confirmed');

  const { count: cancelledReservations } = await supabase
    .from('reservations')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'cancelled');

  // ── 当日在庫確認 ──
  const openDays = (businessDays ?? []).filter(d => d.is_open);
  // 表示対象日：URLパラメータ優先、なければ最初の営業日
  const targetDate = searchParams.date && openDays.find(d => d.date === searchParams.date)
    ? searchParams.date
    : openDays[0]?.date ?? null;

  const targetDay = openDays.find(d => d.date === targetDate) ?? null;

  type StockRow = {
    menu_id: string;
    menu_name: string;
    stock: number | null;
    ordered: number;
  };
  let stockRows: StockRow[] = [];

  if (targetDay) {
    // メニュー一覧
    const { data: menus } = await supabase
      .from('menus')
      .select('id, name, stock')
      .eq('is_available', true)
      .order('sort_order');

    // その日のスロットID
    const slotIds = (targetDay.time_slots as { id: string }[]).map(s => s.id);
    const dateParts = targetDay.date.split('-');
    const mmdd = `${dateParts[1]}${dateParts[2]}`;

    // 確定席予約の ID
    let reservationIds: string[] = [];
    if (slotIds.length > 0) {
      const { data: seatRes } = await supabase
        .from('reservations')
        .select('id')
        .eq('status', 'confirmed')
        .in('time_slot_id', slotIds);
      reservationIds.push(...(seatRes ?? []).map((r: { id: string }) => r.id));
    }

    // テイクアウト予約の ID（予約コードの日付がMMDD）
    const { data: toRes } = await supabase
      .from('reservations')
      .select('id')
      .eq('status', 'confirmed')
      .like('reservation_code', `${mmdd}-%`);
    reservationIds.push(...(toRes ?? []).map((r: { id: string }) => r.id));
    reservationIds = Array.from(new Set(reservationIds));

    // reservation_items 集計
    const orderedByMenu: Record<string, number> = {};
    if (reservationIds.length > 0) {
      const { data: items } = await supabase
        .from('reservation_items')
        .select('menu_id, quantity')
        .in('reservation_id', reservationIds);
      for (const item of items ?? []) {
        orderedByMenu[item.menu_id] = (orderedByMenu[item.menu_id] ?? 0) + item.quantity;
      }
    }

    stockRows = (menus ?? []).map(m => ({
      menu_id: m.id,
      menu_name: m.name,
      stock: m.stock as number | null,
      ordered: orderedByMenu[m.id] ?? 0,
    }));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif text-gray-800">ダッシュボード</h1>

      {/* 統計カード */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500 mb-1">確定予約</p>
          <p className="text-3xl font-bold text-matcha-600">{totalReservations ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500 mb-1">キャンセル</p>
          <p className="text-3xl font-bold text-red-500">{cancelledReservations ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 text-center col-span-2 sm:col-span-1">
          <p className="text-sm text-gray-500 mb-1">今後の営業日</p>
          <p className="text-3xl font-bold text-gray-700">{businessDays?.length ?? 0}</p>
        </div>
      </div>

      {/* ── 当日在庫確認 ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-700 mb-3">当日在庫確認</h2>

        {openDays.length === 0 ? (
          <p className="text-gray-400 text-sm">営業日が登録されていません</p>
        ) : (
          <>
            {/* 日付タブ */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {openDays.map(d => (
                <Link
                  key={d.id}
                  href={`/admin?date=${d.date}`}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    d.date === targetDate
                      ? 'bg-matcha-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {formatDateJP(d.date)}
                </Link>
              ))}
            </div>

            {stockRows.length === 0 ? (
              <p className="text-gray-400 text-sm">メニューデータがありません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-left">
                      <th className="pb-2 font-medium">メニュー</th>
                      <th className="pb-2 font-medium text-right">在庫</th>
                      <th className="pb-2 font-medium text-right">予約済み</th>
                      <th className="pb-2 font-medium text-right">当日残り</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stockRows.map(row => {
                      const remaining = row.stock == null ? null : row.stock - row.ordered;
                      const isSoldOut = remaining !== null && remaining <= 0;
                      const isLow = remaining !== null && remaining > 0 && remaining <= 2;

                      return (
                        <tr key={row.menu_id}>
                          <td className="py-2 text-gray-800">{row.menu_name}</td>
                          <td className="py-2 text-right text-gray-500">
                            {row.stock == null ? '—' : `${row.stock}個`}
                          </td>
                          <td className="py-2 text-right text-gray-600">
                            {row.ordered > 0 ? `${row.ordered}個` : '—'}
                          </td>
                          <td className="py-2 text-right font-semibold">
                            {row.stock == null ? (
                              <span className="text-gray-400">制限なし</span>
                            ) : isSoldOut ? (
                              <span className="text-red-600">完売</span>
                            ) : isLow ? (
                              <span className="text-amber-600">★ {remaining}個</span>
                            ) : (
                              <span className="text-matcha-600">★ {remaining}個</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="text-xs text-gray-400 mt-3">
                  ※「当日残り」＝在庫 − 事前予約済み数。席のみ予約の方の当日注文分は含みません。
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* 今後の営業日 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-700 mb-4">今後の営業日</h2>
        {!businessDays || businessDays.length === 0 ? (
          <p className="text-gray-500 text-sm">営業日データがありません</p>
        ) : (
          <div className="space-y-3">
            {businessDays.map((bd) => (
              <div key={bd.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-sm">{formatDateJP(bd.date)}</span>
                <div className="flex gap-2">
                  {(bd.time_slots as { id: string; slot_time: string; is_accepting: boolean }[]).map((slot) => (
                    <span
                      key={slot.id}
                      className={`text-xs px-2 py-1 rounded-full ${
                        slot.is_accepting ? 'bg-matcha-100 text-matcha-700' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {slot.slot_time}
                      {!slot.is_accepting && ' 満席'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 最近の予約 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">最近の予約</h2>
          <Link href="/admin/reservations" className="text-sm text-matcha-600 hover:underline">
            すべて見る →
          </Link>
        </div>

        {!upcomingReservations || upcomingReservations.length === 0 ? (
          <p className="text-gray-500 text-sm">予約がありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-left">
                  <th className="pb-2 font-medium">予約番号</th>
                  <th className="pb-2 font-medium">日程</th>
                  <th className="pb-2 font-medium">お名前</th>
                  <th className="pb-2 font-medium">タイプ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {upcomingReservations.map((r) => {
                  const ts = r.time_slots as unknown as { slot_time: string; business_days: { date: string } } | null;
                  return (
                    <tr key={r.id}>
                      <td className="py-2 font-mono text-matcha-700">{r.reservation_code}</td>
                      <td className="py-2 text-gray-600">
                        {ts?.business_days?.date ? `${ts.business_days.date} ${ts.slot_time}` : 'お持ち帰り'}
                      </td>
                      <td className="py-2">{r.customer_name}</td>
                      <td className="py-2">
                        <span className="badge-available">
                          {r.reservation_type === 'seat_only' ? '席のみ' : r.reservation_type === 'seat_with_food' ? '席+お菓子' : 'テイクアウト'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* クイックアクション */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Link href="/admin/reservations" className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-matcha-300 transition text-center">
          <p className="text-matcha-600 text-2xl mb-1">📋</p>
          <p className="text-sm font-medium">予約管理</p>
        </Link>
        <Link href="/admin/menu" className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-matcha-300 transition text-center">
          <p className="text-matcha-600 text-2xl mb-1">🍵</p>
          <p className="text-sm font-medium">メニュー管理</p>
        </Link>
        <a href="/api/admin/export" className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-matcha-300 transition text-center">
          <p className="text-matcha-600 text-2xl mb-1">📥</p>
          <p className="text-sm font-medium">CSVダウンロード</p>
        </a>
      </div>
    </div>
  );
}
