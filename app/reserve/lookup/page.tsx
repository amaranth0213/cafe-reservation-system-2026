'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatDateJP } from '@/lib/business-days';
import { RESERVATION_TYPE_LABELS, SEAT_LABELS, SLOT_TIME_LABELS } from '@/types';
import type { SlotTime } from '@/types';

interface ReservationDetail {
  reservation_code: string;
  reservation_type: string;
  status: string;
  customer_name: string;
  party_size: number | null;
  notes: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  time_slots: { slot_time: string; business_days?: { date: string } } | null;
  seat_types: { category: string; capacity: number } | null;
  reservation_items: { quantity: number; unit_price: number; is_takeout: boolean; menus?: { name: string } }[];
}

function LookupContent() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') ?? '');
  const [result, setResult] = useState<ReservationDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchCode?: string) => {
    const target = (searchCode ?? code).trim().toUpperCase();
    if (!target) return;
    setLoading(true);
    setError('');
    setResult(null);
    const res = await fetch(`/api/reservations/lookup?code=${encodeURIComponent(target)}`);
    const data = await res.json();
    if (res.ok) {
      setResult(data);
    } else {
      setError(data.error ?? '予約が見つかりませんでした');
    }
    setLoading(false);
  };

  useEffect(() => {
    const c = searchParams.get('code');
    if (c) handleSearch(c);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalAmount = result?.reservation_items?.reduce(
    (sum, i) => sum + i.unit_price * i.quantity, 0
  ) ?? 0;

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <Link href="/" className="text-matcha-600 text-sm hover:underline">← トップへ戻る</Link>
        <h1 className="text-2xl font-serif text-matcha-800 mt-3">
          <span className="text-base text-matcha-600">お茶と甘いもの</span>　あまらんす
        </h1>
        <p className="text-gray-600 text-sm mt-1">予約内容の確認</p>
        <div className="mt-5 border-t border-cream-200" />
      </div>

      {/* 検索フォーム */}
      <div className="card mb-6">
        <h2 className="text-base font-serif text-matcha-700 mb-4">予約番号で検索</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="例：0428-1"
            className="input flex-1 font-mono tracking-wider"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading || !code.trim()}
            className="btn-primary px-5 py-3 whitespace-nowrap"
          >
            {loading ? '検索中...' : '確認する'}
          </button>
        </div>
      </div>

      {/* エラー */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-6">
          {error}
        </div>
      )}

      {/* 結果 */}
      {result && (
        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-matcha-700 text-lg tracking-wider font-light">
              {result.reservation_code}
            </span>
            {result.status === 'confirmed' ? (
              <span className="badge-available text-sm px-3 py-1">予約確定</span>
            ) : (
              <span className="badge-cancelled text-sm px-3 py-1">キャンセル済み</span>
            )}
          </div>

          <div className="border-t border-cream-200" />

          <dl className="space-y-3 text-sm">
            {result.time_slots?.business_days?.date && (
              <div className="flex justify-between">
                <dt className="text-gray-500">日時</dt>
                <dd className="font-medium text-gray-800">
                  {formatDateJP(result.time_slots.business_days.date)}
                  {' '}
                  {SLOT_TIME_LABELS[result.time_slots.slot_time as SlotTime] ?? result.time_slots.slot_time}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">予約タイプ</dt>
              <dd className="font-medium text-gray-800">
                {RESERVATION_TYPE_LABELS[result.reservation_type as keyof typeof RESERVATION_TYPE_LABELS] ?? result.reservation_type}
              </dd>
            </div>
            {result.seat_types && (
              <div className="flex justify-between">
                <dt className="text-gray-500">席種・人数</dt>
                <dd className="font-medium text-gray-800">
                  {SEAT_LABELS[result.seat_types.category as keyof typeof SEAT_LABELS]}・{result.party_size}名
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">お名前</dt>
              <dd className="font-medium text-gray-800">{result.customer_name} 様</dd>
            </div>
            {result.notes && (
              <div className="flex justify-between">
                <dt className="text-gray-500">備考</dt>
                <dd className="font-medium text-gray-800">{result.notes}</dd>
              </div>
            )}
          </dl>

          {result.reservation_items && result.reservation_items.length > 0 && (
            <>
              <div className="border-t border-cream-200" />
              <div>
                <p className="text-sm text-gray-500 mb-3">お菓子のご注文</p>
                <div className="space-y-2">
                  {result.reservation_items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.menus?.name}
                        {item.is_takeout && <span className="ml-1 text-matcha-500 text-xs">（お持ち帰り）</span>}
                        　×{item.quantity}
                      </span>
                      <span className="text-gray-600">¥{(item.unit_price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-medium pt-2 border-t border-cream-100">
                    <span className="text-gray-600">合計</span>
                    <span className="text-matcha-700">¥{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {result.status === 'cancelled' && (
            <>
              <div className="border-t border-cream-200" />
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
                {result.cancel_reason
                  ? `キャンセル理由：${result.cancel_reason}`
                  : 'この予約はキャンセルされています'}
              </div>
            </>
          )}

          {result.status === 'confirmed' && (
            <>
              <div className="border-t border-cream-200" />
              <p className="text-xs text-gray-400 text-center leading-relaxed">
                キャンセル・変更は Instagram のメッセージよりご連絡ください
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function LookupPage() {
  return (
    <main className="min-h-screen bg-cream-50">
      <Suspense fallback={<div className="min-h-screen bg-cream-50 flex items-center justify-center text-gray-400 text-sm">読み込み中...</div>}>
        <LookupContent />
      </Suspense>
    </main>
  );
}
