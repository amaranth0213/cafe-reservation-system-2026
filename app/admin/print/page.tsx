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
    const items = r.reservation_items ?? [];
    return items.filter(i => i.quantity > 0);
  };

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; background: white; }

          /* A-ONE 51691: A4・10面（2列×5行）91mm×55mm */
          .print-area {
            display: grid;
            grid-template-columns: 91mm 91mm;
            grid-auto-rows: 55mm;
            column-gap: 0;
            row-gap: 0;
            margin: 13mm 8.5mm 0 8.5mm;
            width: 182mm;
          }

          .res-card {
            width: 91mm;
            height: 55mm;
            box-sizing: border-box;
            padding: 3mm 4mm;
            border: none;
            background: white;
            page-break-inside: avoid;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .card-code { font-size: 16pt; font-weight: bold; letter-spacing: 0.05em; }
          .card-time { font-size: 10pt; color: #555; }
          .card-name { font-size: 12pt; font-weight: bold; margin-top: 1mm; }
          .card-seat { font-size: 9pt; color: #444; margin-top: 0.5mm; }
          .card-divider { border-top: 0.3mm solid #ccc; margin: 1.5mm 0; }
          .card-items-title { font-size: 8pt; color: #666; }
          .card-item { font-size: 8.5pt; color: #333; }
          .card-no-food { font-size: 8pt; color: #999; }
        }

        @media screen {
          .print-area {
            display: grid;
            grid-template-columns: repeat(2, 340px);
            gap: 12px;
            padding: 24px;
          }

          .res-card {
            width: 340px;
            height: 205px;
            box-sizing: border-box;
            padding: 12px 16px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .card-code { font-size: 22px; font-weight: bold; letter-spacing: 0.05em; color: #2d5a27; }
          .card-time { font-size: 13px; color: #6b7280; }
          .card-name { font-size: 16px; font-weight: bold; margin-top: 4px; color: #111; }
          .card-seat { font-size: 12px; color: #4b5563; margin-top: 2px; }
          .card-divider { border-top: 1px solid #e5e7eb; margin: 8px 0; }
          .card-items-title { font-size: 11px; color: #9ca3af; }
          .card-item { font-size: 12px; color: #374151; }
          .card-no-food { font-size: 11px; color: #d1d5db; }
        }
      `}</style>

      {/* 操作パネル（印刷時非表示） */}
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
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">{reservations.length}件の予約　/ A-ONE 51691（名刺サイズ10面）</p>
                <button
                  onClick={() => window.print()}
                  className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  🖨 印刷する
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-4">※ 初回は「用紙サイズ：A4・余白：なし」に設定して印刷してください</p>
            </>
          )}
        </div>
      </div>

      {/* 印刷カードエリア */}
      {reservations.length > 0 && (
        <div className="print-area">
          {reservations.map(r => {
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
                    {r.notes ? `　📝 ${r.notes}` : ''}
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
                          {item.is_takeout ? '（テイクアウト）' : ''}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="card-no-food">お菓子注文なし</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
