import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { formatDateJP } from '@/lib/business-days';

export default async function AdminDashboardPage() {
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

  // 今週の月曜日
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
                        <span className="badge-available">{r.reservation_type === 'seat_only' ? '席のみ' : r.reservation_type === 'seat_with_food' ? '席+お菓子' : 'テイクアウト'}</span>
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
