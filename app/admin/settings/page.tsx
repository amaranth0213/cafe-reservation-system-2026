'use client';

import { useState, useEffect } from 'react';
import { formatDateJP } from '@/lib/business-days';
import type { SlotTime } from '@/types';

interface BusinessDay {
  id: string;
  date: string;
  is_open: boolean;
  note: string | null;
  time_slots: { id: string; slot_time: SlotTime; is_accepting: boolean }[];
}

export default function AdminSettingsPage() {
  const [businessDays, setBusinessDays] = useState<BusinessDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchDays = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/settings/days');
    const data = await res.json();
    setBusinessDays(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchDays(); }, []);

  const toggleSlotAccepting = async (slotId: string, currentValue: boolean) => {
    const res = await fetch('/api/admin/settings/slot', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot_id: slotId, is_accepting: !currentValue }),
    });
    if (res.ok) { setMessage('更新しました'); fetchDays(); }
    else setMessage('更新に失敗しました');
  };

  const toggleDayOpen = async (dayId: string, currentValue: boolean) => {
    const res = await fetch('/api/admin/settings/day', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day_id: dayId, is_open: !currentValue }),
    });
    if (res.ok) { setMessage('更新しました'); fetchDays(); }
    else setMessage('更新に失敗しました');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif text-gray-800">営業日・時間帯設定</h1>

      {message && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex justify-between">
          {message}
          <button onClick={() => setMessage('')}>×</button>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>ご注意：</strong>「受付中止」にすると新規予約ができなくなります。臨時休業の場合は「休業」を設定してください。
      </div>

      {loading ? (
        <p className="text-gray-500">読み込み中...</p>
      ) : (
        <div className="space-y-4">
          {businessDays.map((bd) => (
            <div key={bd.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-medium text-gray-800">{formatDateJP(bd.date)}</h2>
                <button
                  onClick={() => toggleDayOpen(bd.id, bd.is_open)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                    bd.is_open
                      ? 'bg-matcha-100 text-matcha-700 hover:bg-matcha-200'
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                >
                  {bd.is_open ? '営業中' : '休業'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {bd.time_slots.map((slot) => (
                  <div key={slot.id} className="border border-gray-200 rounded-lg p-3 text-center">
                    <p className="font-semibold text-matcha-700 mb-2">{slot.slot_time}</p>
                    <button
                      onClick={() => toggleSlotAccepting(slot.id, slot.is_accepting)}
                      className={`text-xs px-3 py-1 rounded-full font-medium w-full transition ${
                        slot.is_accepting
                          ? 'bg-matcha-100 text-matcha-700 hover:bg-matcha-200'
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`}
                    >
                      {slot.is_accepting ? '受付中' : '受付中止'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
