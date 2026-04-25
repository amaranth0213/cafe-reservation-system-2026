'use client';

import { useState, useEffect } from 'react';
import type { Reservation } from '@/types';
import { SEAT_LABELS, SLOT_TIME_LABELS } from '@/types';
import { formatDateJP } from '@/lib/business-days';

interface DayOption {
  id: string;
  date: string;
  is_open: boolean;
}

// 10件ずつのページに分割
function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export default function PrintCardsPage() {
  const [days, setDays] = useState<DayOption[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings/days')
      .then(r => r.json())
      .then(data => setDays(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    fetch(`/api/admin/reservations?date=${selectedDate}&status=confirmed`)
      .then(r => r.json())
      .then(data => {
        setReservations(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [selectedDate]);

  const getSlotTime = (r: Reservation) => {
    const ts = r.time_slots as { slot_time: string } | null | undefined;
    return ts?.slot_time ? SLOT_TIME_LABELS[ts.slot_time as keyof typeof SLOT_TIME_LABELS] : '';
  };

  const getSeatLabel = (r: Reservation) => {
    const st = r.seat_types as { category: string } | null | undefined;
    return st?.category ? SEAT_LABELS[st.category as keyof typeof SEAT_LABELS] : '';
  };

  const getItems = (r: Reservation) => {
    return (r.reservation_items ?? []).filter(i => i.quantity > 0);
  };

  const pages = chunkArray(reservations, 10);

  const renderCard = (r: Reservation) => {
    const items = getItems(r);
    return (
      <div key={r.id} className="res-card">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="card-code">{r.reservation_code}</span>
            <span className="card-time">{getSlotTime(r)}</span>
          </div>
          <div className="card-name">{r.customer_name}　様</div>
          <div className="card-seat">
            {getSeatLabel(r)}
            {r.party_size ? `　${r.party_size}名` : ''}
            {r.notes ? `　備考: ${r.notes}` : ''}
          </div>
        </div>
        <div>
          <div className="card-divider" />
          {items.length > 0 ? (
            <>
              <div className="card-items-title">お菓子注文</div>
              {items.map(item => (
                <div key={item.id} className="card-item">
                  {(item.menus as { name: string } | undefined)?.name ?? ''}　×{item.quantity}
                  {item.is_takeout ? '（TO）' : ''}
                </div>
              ))}
            </>
          ) : (
            <div className="card-no-food">お菓子注文なし</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        /* ===== 印刷専用スタイル ===== */
        @media print {
          /* ブラウザの余白を完全にゼロにする */
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html, body {
            margin: 0;
            padding: 0;
            background: white;
          }

          .no-print { display: none !important; }

          /* 1ページ = A4サイズの固定コンテナ */
          .print-page {
            width: 210mm;
            height: 297mm;
            overflow: hidden;
            page-break-inside: avoid;
            box-sizing: border-box;
            /* A-ONE 51691: 上13mm・左8.5mm のパディング */
            padding: 13mm 0 0 8.5mm;
          }

          /* 2枚目以降の前にだけ改ページを入れる（先頭に空白ページが生まれない） */
          .print-page + .print-page {
            page-break-before: always;
          }

          /* 2列×5行 = 10枚固定グリッド */
          .print-grid {
            display: grid;
            grid-template-columns: 91mm 91mm;
            grid-template-rows: repeat(5, 55mm);
            width: 182mm;
          }

          .res-card {
            width: 91mm;
            height: 55mm;
            box-sizing: border-box;
            padding: 3mm 4mm 2mm 4mm;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: white;
          }

          .card-code { font-size: 15pt; font-weight: bold; letter-spacing: 0.03em; }
          .card-time { font-size: 9pt; color: #444; }
          .card-name { font-size: 11pt; font-weight: bold; margin-top: 0.8mm; }
          .card-seat { font-size: 8.5pt; color: #444; margin-top: 0.5mm; }
          .card-divider { border: none; border-top: 0.3mm solid #bbb; margin: 1.5mm 0 1mm; }
          .card-items-title { font-size: 7.5pt; color: #666; margin-bottom: 0.5mm; }
          .card-item { font-size: 8pt; color: #222; line-height: 1.3; }
          .card-no-food { font-size: 7.5pt; color: #aaa; }
        }

        /* ===== 画面プレビュー用スタイル ===== */
        @media screen {
          .print-page {
            margin-bottom: 32px;
          }

          .print-grid {
            display: grid;
            grid-template-columns: repeat(2, 320px);
            gap: 10px;
            padding: 20px;
          }

          .res-card {
            width: 320px;
            height: 190px;
            box-sizing: border-box;
            padding: 12px 14px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .card-code { font-size: 20px; font-weight: bold; letter-spacing: 0.03em; color: #2d5a27; }
          .card-time { font-size: 12px; color: #6b7280; }
          .card-name { font-size: 14px; font-weight: bold; margin-top: 3px; color: #111; }
          .card-seat { font-size: 11px; color: #4b5563; margin-top: 2px; }
          .card-divider { border: none; border-top: 1px solid #e5e7eb; margin: 6px 0 4px; }
          .card-items-title { font-size: 10px; color: #9ca3af; margin-bottom: 2px; }
          .card-item { font-size: 11px; color: #374151; line-height: 1.4; }
          .card-no-food { font-size: 10px; color: #d1d5db; }
        }
      `}</style>

      {/* 操作パネル（印刷時は非表示） */}
      <div className="no-print min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-800">予約カード印刷</h1>
            <a href="/admin/reservations" className="text-sm text-gray-500 hover:text-gray-700">← 予約一覧に戻る</a>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">印刷する営業日を選択</label>
            <select
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="">日付を選んでください</option>
              {days.filter(d => d.is_open).map(d => (
                <option key={d.id} value={d.date}>{formatDateJP(d.date)}</option>
              ))}
            </select>
          </div>

          {loading && <p className="text-gray-500 text-sm">読み込み中...</p>}

          {!loading && selectedDate && reservations.length === 0 && (
            <p className="text-gray-400 text-sm">この日の確定予約はありません。</p>
          )}

          {reservations.length > 0 && (
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">
                {reservations.length}件 ／ {pages.length}枚のA4用紙（A-ONE 51691・10面）
              </p>
              <button
                onClick={() => window.print()}
                className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                🖨 印刷する
              </button>
            </div>
          )}
          {reservations.length > 0 && (
            <p className="text-xs text-amber-600 mb-4">
              ⚠️ 印刷ダイアログで「余白：なし」を選択してください
            </p>
          )}
        </div>
      </div>

      {/* 印刷エリア：10件ずつページ分割 */}
      {pages.map((pageReservations, pageIndex) => (
        <div key={pageIndex} className="print-page">
          <div className="print-grid">
            {pageReservations.map(r => renderCard(r))}
          </div>
        </div>
      ))}
    </>
  );
}
