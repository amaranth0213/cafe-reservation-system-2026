'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Reservation } from '@/types';
import { RESERVATION_TYPE_LABELS, SEAT_LABELS, SLOT_TIME_LABELS } from '@/types';
import { formatDateJP } from '@/lib/business-days';

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('confirmed');
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [reopenSlot, setReopenSlot] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState('');

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterDate) params.set('date', filterDate);
    if (filterStatus) params.set('status', filterStatus);

    const res = await fetch(`/api/admin/reservations?${params}`);
    const data = await res.json();
    setReservations(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [filterDate, filterStatus]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);

    const res = await fetch(`/api/admin/reservations/${cancelTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', cancel_reason: cancelReason, reopen_slot: reopenSlot }),
    });

    if (res.ok) {
      setMessage('キャンセルしました');
      setCancelTarget(null);
      setCancelReason('');
      setReopenSlot(false);
      fetchReservations();
    } else {
      const data = await res.json();
      setMessage(data.error ?? 'キャンセルに失敗しました');
    }
    setCancelling(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif text-gray-800">予約一覧</h1>
        <a href="/api/admin/export" className="btn-secondary text-sm py-2 px-4">
          CSV出力
        </a>
      </div>

      {message && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {message}
          <button onClick={() => setMessage('')} className="ml-3 text-green-500 hover:text-green-700">×</button>
        </div>
      )}

      {/* フィルター */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-wrap gap-4">
        <div>
          <label className="label text-xs">日付</label>
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="input py-2 text-sm" />
        </div>
        <div>
          <label className="label text-xs">ステータス</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input py-2 text-sm">
            <option value="">すべて</option>
            <option value="confirmed">確定</option>
            <option value="cancelled">キャンセル</option>
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={() => { setFilterDate(''); setFilterStatus('confirmed'); }} className="btn-secondary py-2 text-sm">
            リセット
          </button>
        </div>
      </div>

      {/* お菓子の注文集計 */}
      {!loading && reservations.length > 0 && (() => {
        const totals: Record<string, { name: string; eatIn: number; takeout: number }> = {};
        reservations.filter(r => r.status === 'confirmed').forEach(r => {
          (r.reservation_items ?? []).forEach(item => {
            const name = item.menus?.name ?? '不明';
            if (!totals[name]) totals[name] = { name, eatIn: 0, takeout: 0 };
            if (item.is_takeout) totals[name].takeout += item.quantity;
            else totals[name].eatIn += item.quantity;
          });
        });
        const entries = Object.values(totals);
        if (entries.length === 0) return null;
        return (
          <div className="bg-matcha-50 rounded-xl border border-matcha-200 p-5">
            <h2 className="font-semibold text-matcha-800 mb-3">🍵 お菓子の注文集計（確定分）</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {entries.map(e => (
                <div key={e.name} className="bg-white rounded-lg px-4 py-2 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{e.name}</span>
                  <div className="flex gap-3 text-sm">
                    {e.eatIn > 0 && <span className="text-matcha-700">イートイン <strong>{e.eatIn}個</strong></span>}
                    {e.takeout > 0 && <span className="text-amber-700">テイクアウト <strong>{e.takeout}個</strong></span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* テーブル */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">読み込み中...</div>
        ) : reservations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">予約がありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">予約番号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">日程</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">お名前</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">電話番号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">タイプ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">席</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">注文お菓子</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">ステータス</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reservations.map((r) => {
                  const ts = r.time_slots as { slot_time: string; business_days?: { date: string } } | undefined;
                  return (
                    <tr key={r.id} className={r.status === 'cancelled' ? 'opacity-50' : ''}>
                      <td className="px-4 py-3 font-mono text-matcha-700 font-medium">{r.reservation_code}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {ts?.business_days?.date
                          ? `${ts.business_days.date} ${ts.slot_time}`
                          : 'お持ち帰り'}
                      </td>
                      <td className="px-4 py-3 font-medium">{r.customer_name}</td>
                      <td className="px-4 py-3 text-gray-600">{r.customer_phone}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 bg-matcha-50 text-matcha-700 rounded">
                          {RESERVATION_TYPE_LABELS[r.reservation_type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {r.seat_types ? `${SEAT_LABELS[r.seat_types.category]}・${r.party_size}名` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {(r.reservation_items ?? []).length === 0 ? (
                          <span className="text-gray-400 text-xs">なし</span>
                        ) : (
                          <div className="space-y-0.5">
                            {(r.reservation_items ?? []).map(item => (
                              <div key={item.id} className="text-xs text-gray-600">
                                {item.menus?.name} ×{item.quantity}
                                {item.is_takeout && <span className="ml-1 text-amber-600">（持帰）</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.status === 'confirmed' ? (
                          <span className="badge-available">確定</span>
                        ) : (
                          <span className="badge-cancelled">キャンセル</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.status === 'confirmed' && (
                          <button
                            onClick={() => setCancelTarget(r)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            キャンセル
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* キャンセル確認モーダル */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-2">予約をキャンセルしますか？</h3>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{cancelTarget.customer_name}</strong> 様の予約（{cancelTarget.reservation_code}）
            </p>
            <div className="mb-4">
              <label className="label">キャンセル理由（任意）</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="例: お客様からの連絡"
                className="input"
              />
            </div>
            {cancelTarget.time_slot_id && (
              <label className="flex items-center gap-2 mb-4 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={reopenSlot}
                  onChange={(e) => setReopenSlot(e.target.checked)}
                  className="accent-matcha-600"
                />
                この時間帯の受付を再開する（満席だった場合）
              </label>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setCancelTarget(null); setCancelReason(''); }} className="btn-secondary flex-1 py-2">
                戻る
              </button>
              <button onClick={handleCancel} disabled={cancelling} className="btn-danger flex-1">
                {cancelling ? '処理中...' : 'キャンセル確定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
