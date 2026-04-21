'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Reservation } from '@/types';
import { RESERVATION_TYPE_LABELS, SEAT_LABELS, SLOT_TIME_LABELS } from '@/types';
import { formatDateJP } from '@/lib/business-days';

interface SlotOption { id: string; slot_time: string; }
interface SeatOption { seat_type_id: string; category: string; capacity: number; remaining: number; }
interface DayOption { id: string; date: string; time_slots: SlotOption[]; }

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

  // 編集モーダル
  const [editTarget, setEditTarget] = useState<Reservation | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPartySize, setEditPartySize] = useState(1);
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<{menu_id:string;menu_name:string;unit_price:number;quantity:number;is_takeout:boolean}[]>([]);
  const [menus, setMenus] = useState<{id:string;name:string;price:number;is_takeout_available:boolean}[]>([]);
  const [saving, setSaving] = useState(false);

  // 手動予約フォーム
  const [showNewForm, setShowNewForm] = useState(false);
  const [days, setDays] = useState<DayOption[]>([]);
  const [newDate, setNewDate] = useState('');
  const [newSlotId, setNewSlotId] = useState('');
  const [newSeatTypeId, setNewSeatTypeId] = useState('');
  const [newPartySize, setNewPartySize] = useState(1);
  const [newType, setNewType] = useState<'seat_only'|'seat_with_food'|'takeout'>('seat_only');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [seatOptions, setSeatOptions] = useState<SeatOption[]>([]);
  const [creating, setCreating] = useState(false);

  // 管理者用：全営業日を取得（木曜制限なし）
  const fetchDays = useCallback(async () => {
    const res = await fetch('/api/admin/settings/days');
    const data = await res.json();
    setDays(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { if (showNewForm) fetchDays(); }, [showNewForm, fetchDays]);

  // 日付・スロット選択時に空席情報を取得
  useEffect(() => {
    if (!newSlotId) { setSeatOptions([]); return; }
    fetch(`/api/availability?slot_id=${newSlotId}`)
      .then(r => r.json())
      .then(data => {
        setSeatOptions(data.seats ?? []);
      }).catch(() => {});
  }, [newSlotId]);

  const handleCreateReservation = async () => {
    if (!newName.trim() || !newPhone.trim()) return;
    setCreating(true);
    const body: Record<string, unknown> = {
      reservation_type: newType,
      customer_name: newName,
      customer_phone: newPhone,
      notes: newNotes || undefined,
    };
    if (newType !== 'takeout') {
      body.time_slot_id = newSlotId;
      body.seat_type_id = newSeatTypeId;
      body.party_size = newPartySize;
    }
    const res = await fetch('/api/admin/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(`予約を作成しました（予約番号: ${data.reservation_code}）`);
      setShowNewForm(false);
      setNewDate(''); setNewSlotId(''); setNewSeatTypeId(''); setNewName(''); setNewPhone(''); setNewNotes(''); setNewPartySize(1); setNewType('seat_only');
      fetchReservations();
    } else {
      setMessage(data.error ?? '作成に失敗しました');
    }
    setCreating(false);
  };

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

  // 編集モーダルを開く
  const openEdit = (r: Reservation) => {
    setEditTarget(r);
    setEditName(r.customer_name);
    setEditPhone(r.customer_phone);
    setEditPartySize(r.party_size ?? 1);
    setEditNotes(r.notes ?? '');
    setEditItems((r.reservation_items ?? []).map(i => ({
      menu_id: i.menu_id,
      menu_name: i.menus?.name ?? '',
      unit_price: i.unit_price,
      quantity: i.quantity,
      is_takeout: i.is_takeout,
    })));
    // メニュー一覧を取得
    fetch('/api/menus').then(r => r.json()).then(setMenus).catch(() => {});
  };

  const updateEditItem = (menuId: string, menuName: string, price: number, qty: number, isTakeout: boolean) => {
    setEditItems(prev => {
      const filtered = prev.filter(i => !(i.menu_id === menuId && i.is_takeout === isTakeout));
      if (qty > 0) return [...filtered, { menu_id: menuId, menu_name: menuName, unit_price: price, quantity: qty, is_takeout: isTakeout }];
      return filtered;
    });
  };

  const getEditQty = (menuId: string, isTakeout: boolean) =>
    editItems.find(i => i.menu_id === menuId && i.is_takeout === isTakeout)?.quantity ?? 0;

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    const res = await fetch(`/api/admin/reservations/${editTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'edit',
        customer_name: editName,
        customer_phone: editPhone,
        party_size: editPartySize,
        notes: editNotes,
        items: editItems,
      }),
    });
    if (res.ok) {
      setMessage('変更を保存しました');
      setEditTarget(null);
      fetchReservations();
    } else {
      const data = await res.json();
      setMessage(data.error ?? '保存に失敗しました');
    }
    setSaving(false);
  };

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
        <div className="flex gap-2">
          <button onClick={() => setShowNewForm(true)} className="btn-primary text-sm py-2 px-4">
            ＋ 予約を手動登録
          </button>
          <a href="/api/admin/export" className="btn-secondary text-sm py-2 px-4">
            CSV出力
          </a>
        </div>
      </div>

      {/* 手動予約フォーム */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl my-4">
            <h3 className="text-lg font-semibold mb-4">予約を手動登録</h3>
            <p className="text-xs text-matcha-600 bg-matcha-50 rounded-lg px-3 py-2 mb-4">受付期間前でも登録できます（管理者専用）</p>
            <div className="space-y-4">
              <div>
                <label className="label">予約タイプ</label>
                <select value={newType} onChange={e => { setNewType(e.target.value as typeof newType); setNewSlotId(''); setNewSeatTypeId(''); }} className="input">
                  <option value="seat_only">席のみ</option>
                  <option value="seat_with_food">席＋お菓子</option>
                  <option value="takeout">お持ち帰りのみ</option>
                </select>
              </div>
              {newType !== 'takeout' && (
                <>
                  <div>
                    <label className="label">日程</label>
                    <select value={newDate} onChange={e => { setNewDate(e.target.value); setNewSlotId(''); setNewSeatTypeId(''); }} className="input">
                      <option value="">選択してください</option>
                      {days.map(d => <option key={d.id} value={d.date}>{formatDateJP(d.date)}</option>)}
                    </select>
                  </div>
                  {newDate && (
                    <div>
                      <label className="label">時間帯</label>
                      <select value={newSlotId} onChange={e => { setNewSlotId(e.target.value); setNewSeatTypeId(''); }} className="input">
                        <option value="">選択してください</option>
                        {days.find(d => d.date === newDate)?.time_slots.map(s => (
                          <option key={s.id} value={s.id}>{SLOT_TIME_LABELS[s.slot_time as keyof typeof SLOT_TIME_LABELS] ?? s.slot_time}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {newSlotId && seatOptions.length > 0 && (
                    <div>
                      <label className="label">席種</label>
                      <select value={newSeatTypeId} onChange={e => { setNewSeatTypeId(e.target.value); setNewPartySize(1); }} className="input">
                        <option value="">選択してください</option>
                        {seatOptions.map(s => (
                          <option key={s.seat_type_id} value={s.seat_type_id} disabled={s.remaining === 0}>
                            {SEAT_LABELS[s.category as keyof typeof SEAT_LABELS]}（残{s.remaining}卓）
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {newSeatTypeId && (
                    <div>
                      <label className="label">人数</label>
                      <select value={newPartySize} onChange={e => setNewPartySize(Number(e.target.value))} className="input">
                        {[1,2,3,4].map(n => <option key={n} value={n}>{n}名</option>)}
                      </select>
                    </div>
                  )}
                </>
              )}
              <div>
                <label className="label">お名前 *</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="input" placeholder="山田 花子" />
              </div>
              <div>
                <label className="label">電話番号 *</label>
                <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="input" placeholder="090-1234-5678" />
              </div>
              <div>
                <label className="label">備考</label>
                <input type="text" value={newNotes} onChange={e => setNewNotes(e.target.value)} className="input" placeholder="アレルギーなど" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewForm(false)} className="btn-secondary flex-1 py-2">キャンセル</button>
              <button onClick={handleCreateReservation} disabled={creating || !newName.trim() || !newPhone.trim()} className="btn-primary flex-1 py-2">
                {creating ? '登録中...' : '予約を登録'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                          <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(r)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => setCancelTarget(r)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            キャンセル
                          </button>
                          </div>
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

      {/* 編集モーダル */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl my-4">
            <h3 className="text-lg font-semibold mb-1">予約を編集</h3>
            <p className="text-sm text-gray-500 mb-4">{editTarget.reservation_code}</p>
            <div className="space-y-4">
              <div>
                <label className="label">お名前</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">電話番号</label>
                <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="input" />
              </div>
              {editTarget.seat_type_id && (
                <div>
                  <label className="label">人数</label>
                  <select value={editPartySize} onChange={e => setEditPartySize(Number(e.target.value))} className="input">
                    {[1,2,3,4].map(n => <option key={n} value={n}>{n}名</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="label">備考</label>
                <input type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)} className="input" placeholder="アレルギーなど" />
              </div>
              {(editTarget.reservation_type === 'seat_with_food' || editTarget.reservation_type === 'takeout') && menus.length > 0 && (
                <div>
                  <label className="label">お菓子の注文</label>
                  <div className="space-y-3 mt-2">
                    {menus.map(menu => (
                      <div key={menu.id} className="border rounded-lg p-3">
                        <p className="text-sm font-medium mb-2">{menu.name} <span className="text-gray-500">¥{menu.price}</span></p>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-600 w-20">イートイン</span>
                          <button type="button" onClick={() => updateEditItem(menu.id, menu.name, menu.price, Math.max(0, getEditQty(menu.id, false)-1), false)} className="w-7 h-7 rounded-full border flex items-center justify-center">−</button>
                          <span className="w-5 text-center">{getEditQty(menu.id, false)}</span>
                          <button type="button" onClick={() => updateEditItem(menu.id, menu.name, menu.price, getEditQty(menu.id, false)+1, false)} className="w-7 h-7 rounded-full border flex items-center justify-center">＋</button>
                        </div>
                        {menu.is_takeout_available && (
                          <div className="flex items-center gap-3 text-sm mt-1">
                            <span className="text-gray-600 w-20">お持ち帰り</span>
                            <button type="button" onClick={() => updateEditItem(menu.id, menu.name, menu.price, Math.max(0, getEditQty(menu.id, true)-1), true)} className="w-7 h-7 rounded-full border flex items-center justify-center">−</button>
                            <span className="w-5 text-center">{getEditQty(menu.id, true)}</span>
                            <button type="button" onClick={() => updateEditItem(menu.id, menu.name, menu.price, getEditQty(menu.id, true)+1, true)} className="w-7 h-7 rounded-full border flex items-center justify-center">＋</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditTarget(null)} className="btn-secondary flex-1 py-2">戻る</button>
              <button onClick={handleSaveEdit} disabled={saving || !editName.trim() || !editPhone.trim()} className="btn-primary flex-1 py-2">
                {saving ? '保存中...' : '保存する'}
              </button>
            </div>
          </div>
        </div>
      )}

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
