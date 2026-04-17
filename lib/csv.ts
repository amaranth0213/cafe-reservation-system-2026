import type { Reservation } from '@/types';
import { RESERVATION_TYPE_LABELS, SEAT_LABELS, SLOT_TIME_LABELS } from '@/types';
import { formatDateJP } from './business-days';

export function generateReservationCSV(reservations: Reservation[]): string {
  const headers = [
    '予約番号',
    '予約日',
    '時間帯',
    '予約タイプ',
    '席種',
    '人数',
    'お名前',
    '電話番号',
    '注文内容',
    'ステータス',
    '予約日時',
  ];

  const rows = reservations.map((r) => {
    const date = r.time_slots?.business_days?.date
      ? formatDateJP(r.time_slots.business_days.date)
      : 'お持ち帰りのみ';

    const slotTime = r.time_slots?.slot_time
      ? SLOT_TIME_LABELS[r.time_slots.slot_time]
      : '-';

    const seatLabel = r.seat_types?.category
      ? SEAT_LABELS[r.seat_types.category]
      : '-';

    const items = r.reservation_items
      ?.map((item) => `${item.menus?.name ?? ''}×${item.quantity}${item.is_takeout ? '(持帰)' : ''}`)
      .join(' / ') ?? '';

    const status = r.status === 'confirmed' ? '確定' : 'キャンセル済';

    const createdAt = new Date(r.created_at).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    return [
      r.reservation_code,
      date,
      slotTime,
      RESERVATION_TYPE_LABELS[r.reservation_type],
      seatLabel,
      r.party_size ?? '-',
      r.customer_name,
      r.customer_phone,
      items,
      status,
      createdAt,
    ].map(escapeCSV);
  });

  const lines = [headers.map(escapeCSV).join(','), ...rows.map((r) => r.join(','))];
  return '\uFEFF' + lines.join('\n'); // BOM付きUTF-8（Excelで文字化けしないように）
}

function escapeCSV(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
