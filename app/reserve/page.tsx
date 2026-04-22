'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReservationType, SeatCategory, SlotTime, OrderItem } from '@/types';
import { SEAT_LABELS, SLOT_TIME_LABELS, RESERVATION_TYPE_LABELS } from '@/types';
import { formatDateJP, isSweetsAvailable, isReservationOpen, getReservationOpenTimeLabel } from '@/lib/business-days';

interface BusinessDayData {
  id: string;
  date: string;
  is_open: boolean;
  note: string | null;
  time_slots: { id: string; slot_time: SlotTime; is_accepting: boolean }[];
}

interface SeatAvailData {
  seat_type_id: string;
  category: SeatCategory;
  capacity: number;
  total_count: number;
  remaining: number;
}

interface SlotAvailData {
  time_slot_id: string;
  slot_time: SlotTime;
  is_accepting: boolean;
  seats: SeatAvailData[];
  is_full: boolean;
}

interface MenuData {
  id: string;
  name: string;
  price: number;
  description: string | null;
  stock: number | null;
  remaining: number | null; // 当日の残り数（注文済みを引いた値）
  is_takeout_available: boolean;
}

interface SeatTypeData {
  id: string;
  category: SeatCategory;
  capacity: number;
  total_count: number;
}

type Step = 1 | 2 | 3;

export default function ReservePage() {
  const router = useRouter();

  // ステップ管理
  const [step, setStep] = useState<Step>(1);

  // フォームデータ
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedSlotTime, setSelectedSlotTime] = useState<SlotTime | ''>('');
  const [reservationType, setReservationType] = useState<ReservationType | ''>('');
  const [selectedSeatTypeId, setSelectedSeatTypeId] = useState('');
  const [selectedSeatCategory, setSelectedSeatCategory] = useState<SeatCategory | ''>('');
  const [partySize, setPartySize] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // データ取得
  const [businessDays, setBusinessDays] = useState<BusinessDayData[]>([]);
  const [slotAvailability, setSlotAvailability] = useState<SlotAvailData[]>([]);
  const [menus, setMenus] = useState<MenuData[]>([]);
  const [seatTypes, setSeatTypes] = useState<SeatTypeData[]>([]);

  // UI状態
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 営業日データ取得
  useEffect(() => {
    fetch('/api/availability')
      .then((r) => r.json())
      .then((data) => setBusinessDays(data))
      .catch(() => setError('日程データの取得に失敗しました'));
  }, []);

  // 座席種別データ取得
  useEffect(() => {
    fetch('/api/seat-types').then((r) => r.json()).then(setSeatTypes).catch(() => {});
  }, []);

  // メニュー取得：日付が確定したら残り数付きで再取得
  useEffect(() => {
    const url = selectedDate ? `/api/menus?date=${selectedDate}` : '/api/menus';
    fetch(url).then((r) => r.json()).then(setMenus).catch(() => {});
  }, [selectedDate]);

  // 日付選択時に空席情報を取得
  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    setSelectedSlotId('');
    setSelectedSlotTime('');
    fetch(`/api/availability?date=${selectedDate}`)
      .then((r) => r.json())
      .then((data) => {
        setSlotAvailability(data.slots ?? []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [selectedDate]);

  const selectedSeatType = seatTypes.find((s) => s.id === selectedSeatTypeId);
  const maxPartySize = selectedSeatType?.capacity ?? 4;

  // 選択日が実際に予約可能か
  const selectedDayData = businessDays.find(d => d.date === selectedDate);
  const isSelectedDateBookable = selectedDayData
    ? selectedDayData.is_open && isReservationOpen(selectedDayData.date)
    : false;

  // STEP1の送信
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedDate) return setError('日付を選択してください');
    if (reservationType !== 'takeout' && !selectedSlotId) return setError('時間帯を選択してください');
    if (!reservationType) return setError('予約タイプを選択してください');
    if (reservationType !== 'takeout' && !selectedSeatTypeId) return setError('席種を選択してください');
    if (!customerName.trim()) return setError('お名前を入力してください');
    if (!customerPhone.trim()) return setError('電話番号を入力してください');
    if (reservationType !== 'seat_only') {
      setStep(2);
    } else {
      setStep(3);
    }
  };

  // STEP2の送信（お菓子選択）
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  // 最終確定
  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    const body = {
      time_slot_id: selectedSlotId || undefined,
      reservation_type: reservationType,
      seat_type_id: selectedSeatTypeId || undefined,
      party_size: reservationType !== 'takeout' ? partySize : undefined,
      customer_name: customerName,
      customer_phone: customerPhone,
      notes: notes || undefined,
      items: orderItems.filter((i) => i.quantity > 0),
    };

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? '予約に失敗しました');
        setSubmitting(false);
        return;
      }

      router.push(`/reserve/complete?code=${data.reservation_code}`);
    } catch {
      setError('通信エラーが発生しました。もう一度お試しください');
      setSubmitting(false);
    }
  };

  const updateItemQuantity = (menuId: string, menuName: string, unitPrice: number, quantity: number, isTakeout: boolean) => {
    setOrderItems((prev) => {
      const key = `${menuId}-${isTakeout}`;
      const filtered = prev.filter((i) => !(i.menu_id === menuId && i.is_takeout === isTakeout));
      if (quantity > 0) {
        return [...filtered, { menu_id: menuId, menu_name: menuName, unit_price: unitPrice, quantity, is_takeout: isTakeout }];
      }
      return filtered;
    });
  };

  const getItemQuantity = (menuId: string, isTakeout: boolean) =>
    orderItems.find((i) => i.menu_id === menuId && i.is_takeout === isTakeout)?.quantity ?? 0;

  const totalAmount = orderItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  return (
    <main className="min-h-screen bg-cream-50">
      <div className="max-w-xl mx-auto px-4 py-10">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-matcha-600 text-sm hover:underline">← トップへ戻る</Link>
            <Link href="/reserve/lookup" className="text-matcha-500 text-xs underline underline-offset-4 hover:text-matcha-700">ご予約の確認はこちら</Link>
          </div>
          <h1 className="text-3xl font-serif text-matcha-800 mt-3"><span className="text-lg text-matcha-600">お茶と甘いもの</span>　あまらんす</h1>
          <p className="text-gray-600 text-base mt-2">毎週月曜日、９：３０〜１５：３０（３部制）</p>
          <p className="text-gray-600 text-sm">手作りお菓子をゆっくりお楽しみください</p>
          <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-xl text-xs text-amber-900 text-left">
            🗓 予約受付は営業日の<strong className="font-semibold">4日前（木曜日）正午12時</strong>からとなります
          </div>
          <div className="mt-4 border-t border-matcha-100" />
        </div>

        {/* ステップ表示 */}
        <div className="flex justify-center mb-8">
          {[
            { n: 1, label: '日程・席' },
            { n: 2, label: 'お菓子選択' },
            { n: 3, label: '内容確認' },
          ].map(({ n, label }) => (
            <div key={n} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === n ? 'bg-matcha-600 text-white' : step > n ? 'bg-matcha-300 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {n}
              </div>
              <span className={`ml-1.5 text-xs ${step === n ? 'text-matcha-700 font-medium' : 'text-gray-400'}`}>{label}</span>
              {n < 3 && <div className="w-8 h-px bg-gray-300 mx-2" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* STEP 1: 日程・席・お客様情報 */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-6">
            {/* 日付選択 */}
            <div className="card">
              <h2 className="text-lg font-semibold text-matcha-800 mb-4">日程を選んでください</h2>
              {businessDays.length === 0 ? (
                <p className="text-gray-500 text-sm">日程を読み込み中...</p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {businessDays.map((bd) => {
                    const isClosed = !bd.is_open;
                    const isBeforeOpen = bd.is_open && !isReservationOpen(bd.date);
                    const isSelected = selectedDate === bd.date;
                    return (
                      <button
                        key={bd.id}
                        type="button"
                        onClick={() => {
                          setSelectedDate(bd.date);
                          setSelectedSlotId('');
                          setSelectedSlotTime('');
                        }}
                        className={`p-3 rounded-lg border text-sm text-left transition-all ${
                          isSelected
                            ? 'border-matcha-400 bg-matcha-50 text-matcha-700'
                            : isClosed
                            ? 'border-cream-200 bg-cream-50 text-gray-400 cursor-pointer'
                            : isBeforeOpen
                            ? 'border-cream-200 bg-cream-50 text-gray-500 cursor-pointer'
                            : 'border-gray-200 hover:border-matcha-300 text-gray-700'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={isClosed ? 'line-through text-gray-400' : ''}>{formatDateJP(bd.date)}</span>
                          {isClosed && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">休業日</span>}
                          {isBeforeOpen && <span className="text-xs text-matcha-400 bg-cream-100 px-2 py-0.5 rounded-full">受付前</span>}
                          {!isClosed && !isBeforeOpen && <span className="text-xs text-matcha-500 bg-matcha-100 px-2 py-0.5 rounded-full">受付中</span>}
                        </div>
                        {isClosed && bd.note && (
                          <p className="text-xs text-gray-400 mt-1">{bd.note}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 選択日のステータスメッセージ */}
              {selectedDate && (() => {
                const bd = businessDays.find(d => d.date === selectedDate);
                if (!bd) return null;
                if (!bd.is_open) return (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
                    この日は休業日です。{bd.note ? `（${bd.note}）` : ''}
                  </div>
                );
                if (!isReservationOpen(bd.date)) return (
                  <div className="mt-3 p-3 bg-cream-50 border border-cream-200 rounded-lg text-sm text-matcha-600">
                    まだ予約受付期間前です。<br />
                    予約受付開始：<span className="font-medium">{getReservationOpenTimeLabel(bd.date)}</span>
                  </div>
                );
                return null;
              })()}
            </div>

            {/* 予約タイプ以降は予約可能な日付が選ばれたときのみ表示 */}
            {isSelectedDateBookable && <div className="card">
              <h2 className="text-lg font-semibold text-matcha-800 mb-4">予約タイプ</h2>
              {selectedDate && !isSweetsAvailable(selectedDate) && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  🍡 お菓子の受付は土曜日で締め切りました。席のみのご予約となります。
                </div>
              )}
              <div className="space-y-2">
                {(['seat_only', 'seat_with_food', 'takeout'] as ReservationType[])
                  .filter(type => {
                    if (!selectedDate) return true;
                    if (!isSweetsAvailable(selectedDate) && type !== 'seat_only') return false;
                    return true;
                  })
                  .map((type) => (
                  <label key={type} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:border-matcha-300 transition-all">
                    <input
                      type="radio"
                      name="reservation_type"
                      value={type}
                      checked={reservationType === type}
                      onChange={() => setReservationType(type)}
                      className="accent-matcha-600"
                    />
                    <span className="text-sm font-medium">{RESERVATION_TYPE_LABELS[type]}</span>
                  </label>
                ))}
              </div>
            </div>}

            {/* 時間帯選択（テイクアウトのみ以外） */}
            {reservationType && reservationType !== 'takeout' && selectedDate && (
              <div className="card">
                <h2 className="text-lg font-semibold text-matcha-800 mb-4">時間帯を選んでください</h2>
                {loading ? (
                  <p className="text-gray-500 text-sm">読み込み中...</p>
                ) : (
                  <div className="space-y-2">
                    {slotAvailability.map((slot) => (
                      <button
                        key={slot.time_slot_id}
                        type="button"
                        disabled={!slot.is_accepting || slot.is_full}
                        onClick={() => {
                          setSelectedSlotId(slot.time_slot_id);
                          setSelectedSlotTime(slot.slot_time);
                          setSelectedSeatTypeId('');
                        }}
                        className={`w-full p-4 rounded-lg border text-left transition-all ${
                          selectedSlotId === slot.time_slot_id
                            ? 'border-matcha-500 bg-matcha-50'
                            : slot.is_full || !slot.is_accepting
                            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 hover:border-matcha-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-matcha-700">{SLOT_TIME_LABELS[slot.slot_time]}</span>
                          {slot.is_full || !slot.is_accepting ? (
                            <span className="badge-full">満席</span>
                          ) : (
                            <span className="badge-available">受付中</span>
                          )}
                        </div>
                        <div className="mt-2 flex gap-3 text-xs text-gray-500">
                          {slot.seats.map((s) => (
                            <span key={s.category}>
                              {SEAT_LABELS[s.category]}: 残{s.remaining}/{s.total_count}卓
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 席種・人数（席予約の場合） */}
            {reservationType && reservationType !== 'takeout' && selectedSlotId && (
              <div className="card">
                <h2 className="text-lg font-semibold text-matcha-800 mb-4">席種と人数</h2>
                <div className="space-y-2 mb-4">
                  {slotAvailability
                    .find((s) => s.time_slot_id === selectedSlotId)
                    ?.seats.map((seat) => {
                      return (
                        <button
                          key={seat.category}
                          type="button"
                          disabled={seat.remaining === 0}
                          onClick={() => {
                            setSelectedSeatTypeId(seat.seat_type_id);
                            setSelectedSeatCategory(seat.category);
                            setPartySize(1);
                          }}
                          className={`w-full p-4 rounded-lg border text-left transition-all ${
                            selectedSeatCategory === seat.category
                              ? 'border-matcha-500 bg-matcha-50'
                              : seat.remaining === 0
                              ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                              : 'border-gray-200 hover:border-matcha-300'
                          }`}
                        >
                          <div className="flex justify-between">
                            <span className="font-medium">{SEAT_LABELS[seat.category]}</span>
                            <span className="text-sm text-gray-500">残{seat.remaining}卓 / {seat.capacity}人用</span>
                          </div>
                        </button>
                      );
                    })}
                </div>
                {selectedSeatTypeId && (
                  <div>
                    <label className="label">人数</label>
                    {maxPartySize === 1 ? (
                      <p className="input bg-gray-50 text-gray-600 cursor-default">1名</p>
                    ) : (
                    <select
                      value={partySize}
                      onChange={(e) => setPartySize(Number(e.target.value))}
                      className="input"
                    >
                      {Array.from({ length: maxPartySize }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n}名</option>
                      ))}
                    </select>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* お客様情報 */}
            <div className="card">
              <h2 className="text-lg font-semibold text-matcha-800 mb-4">お客様情報</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">お名前 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="山田 花子"
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">電話番号 <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="090-1234-5678"
                    className="input"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 未入力項目チェックリスト */}
            {(() => {
              const missing = [];
              if (!selectedDate || !isSelectedDateBookable) missing.push('日程');
              if (reservationType !== 'takeout' && !selectedSlotId) missing.push('時間帯');
              if (!reservationType) missing.push('予約タイプ');
              if (reservationType !== 'takeout' && reservationType && !selectedSeatTypeId) missing.push('席種');
              if (!customerName.trim()) missing.push('お名前');
              if (!customerPhone.trim()) missing.push('電話番号');
              if (missing.length === 0) return null;
              return (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                  <p className="font-semibold mb-2">⚠️ 以下の項目を入力してください</p>
                  <ul className="space-y-1">
                    {missing.map(item => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-amber-400 inline-block flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            <button type="submit" className="btn-primary w-full text-lg py-4">
              {reservationType === 'seat_only' ? '内容を確認する' : 'お菓子を選ぶ →'}
            </button>
          </form>
        )}

        {/* STEP 2: お菓子選択 */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-matcha-800 mb-2">お菓子のメニュー（都合により変更されることがあります）</h2>
              <p className="text-sm text-gray-500 mb-4">イートイン・お持ち帰りを選べます</p>

              {menus.length === 0 ? (
                <p className="text-gray-500 text-sm">メニューを読み込み中...</p>
              ) : (
                <div className="space-y-4">
                  {menus.map((menu) => {
                    const soldOut = menu.remaining === 0;
                    return (
                    <div key={menu.id} className={`border rounded-lg p-4 ${soldOut ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{menu.name}</p>
                            {soldOut && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">完売</span>
                            )}
                            {!soldOut && menu.remaining !== null && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                                残り{menu.remaining}個
                              </span>
                            )}
                            {!menu.is_takeout_available && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-medium">イートインのみ</span>
                            )}
                          </div>
                          {menu.description && <p className="text-xs text-gray-500 mt-0.5">{menu.description}</p>}
                        </div>
                        <p className="text-matcha-700 font-semibold ml-4">¥{menu.price.toLocaleString()}</p>
                      </div>

                      {!soldOut && reservationType === 'seat_with_food' && (
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm text-gray-600 w-24">イートイン</span>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => updateItemQuantity(menu.id, menu.name, menu.price, Math.max(0, getItemQuantity(menu.id, false) - 1), false)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-matcha-400">−</button>
                            <span className="w-6 text-center font-medium">{getItemQuantity(menu.id, false)}</span>
                            <button type="button" onClick={() => updateItemQuantity(menu.id, menu.name, menu.price, getItemQuantity(menu.id, false) + 1, false)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-matcha-400">＋</button>
                          </div>
                        </div>
                      )}

                      {!soldOut && menu.is_takeout_available && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 w-24">お持ち帰り</span>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => updateItemQuantity(menu.id, menu.name, menu.price, Math.max(0, getItemQuantity(menu.id, true) - 1), true)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-matcha-400">−</button>
                            <span className="w-6 text-center font-medium">{getItemQuantity(menu.id, true)}</span>
                            <button type="button" onClick={() => updateItemQuantity(menu.id, menu.name, menu.price, getItemQuantity(menu.id, true) + 1, true)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-matcha-400">＋</button>
                          </div>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}

              {totalAmount > 0 && (
                <div className="mt-4 p-3 bg-matcha-50 rounded-lg flex justify-between items-center">
                  <span className="text-sm font-medium text-matcha-700">合計</span>
                  <span className="font-bold text-matcha-700">¥{totalAmount.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">← 戻る</button>
              <button type="submit" className="btn-primary flex-1">内容を確認する →</button>
            </div>
          </form>
        )}

        {/* STEP 3: 確認 */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-matcha-800 mb-4">予約内容の確認</h2>
              <dl className="space-y-3 text-sm">
                {selectedDate && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">日程</dt>
                    <dd className="font-medium">{formatDateJP(selectedDate)}</dd>
                  </div>
                )}
                {selectedSlotTime && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">時間帯</dt>
                    <dd className="font-medium">{SLOT_TIME_LABELS[selectedSlotTime as SlotTime]}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-500">予約タイプ</dt>
                  <dd className="font-medium">{RESERVATION_TYPE_LABELS[reservationType as ReservationType]}</dd>
                </div>
                {selectedSeatCategory && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">席種</dt>
                    <dd className="font-medium">{SEAT_LABELS[selectedSeatCategory as SeatCategory]}・{partySize}名</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-500">お名前</dt>
                  <dd className="font-medium">{customerName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">電話番号</dt>
                  <dd className="font-medium">{customerPhone}</dd>
                </div>
                {notes && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">備考</dt>
                    <dd className="font-medium">{notes}</dd>
                  </div>
                )}
              </dl>

              {orderItems.length > 0 && (
                <>
                  <hr className="my-4 border-cream-200" />
                  <h3 className="font-medium text-matcha-700 mb-3">お菓子の注文</h3>
                  <ul className="space-y-2 text-sm">
                    {orderItems.map((item, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{item.menu_name}×{item.quantity} {item.is_takeout ? '（お持ち帰り）' : '（イートイン）'}</span>
                        <span>¥{(item.unit_price * item.quantity).toLocaleString()}</span>
                      </li>
                    ))}
                    <li className="flex justify-between font-semibold border-t border-cream-200 pt-2">
                      <span>合計</span>
                      <span>¥{totalAmount.toLocaleString()}</span>
                    </li>
                  </ul>
                </>
              )}
            </div>

            {reservationType === 'seat_only' && (
              <div className="p-5 bg-amber-50 border-l-4 border-amber-400 rounded-xl text-sm text-amber-900">
                <p className="font-semibold mb-1">🍡 お菓子について</p>
                <p className="leading-relaxed">席のみのご予約の場合、当日分として用意しておりますお菓子よりお選びいただくことができます。しかしながら状況によりお菓子をご用意できない場合があります。あらかじめご了承ください。</p>
              </div>
            )}

            <div className="p-4 bg-cream-50 border border-cream-200 rounded-xl text-sm text-gray-600">
              <p><span className="font-normal text-matcha-700">キャンセル・注文変更について：</span>大変お手数ではございますが、InstagramのDMよりご連絡ください。</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(reservationType === 'seat_only' ? 1 : 2)}
                className="btn-secondary flex-1"
              >
                ← 戻る
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary flex-1"
              >
                {submitting ? '送信中...' : '予約を確定する'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
