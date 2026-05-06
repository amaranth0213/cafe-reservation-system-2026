import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';

export interface NotifyReservationParams {
  reservation_code: string;
  customer_name: string;
  customer_phone: string;
  reservation_type: string;
  date_label: string;   // 例: "2026-05-11 13:30" または "お持ち帰り"
  seat_label?: string;  // 例: "4人席・3名"
  notes?: string;
  items: { name: string; quantity: number; is_takeout: boolean }[];
}

const TYPE_LABELS: Record<string, string> = {
  seat_only: '席のみ',
  seat_with_food: '席＋お菓子',
  takeout: 'お持ち帰り',
};

export async function notifyNewReservation(params: NotifyReservationParams) {
  if (!ADMIN_EMAIL || !process.env.RESEND_API_KEY) return;

  const {
    reservation_code, customer_name, customer_phone,
    reservation_type, date_label, seat_label, notes, items,
  } = params;

  const itemsHtml = items.length > 0
    ? items.map(i => `<li>${i.name} ×${i.quantity}${i.is_takeout ? '（お持ち帰り）' : ''}</li>`).join('')
    : '<li>なし</li>';

  const html = `
<div style="font-family: sans-serif; max-width: 500px;">
  <h2 style="color: #2d5a27; border-bottom: 2px solid #2d5a27; padding-bottom: 8px;">
    🍵 新しい予約が入りました
  </h2>
  <table style="width:100%; border-collapse: collapse; margin-top: 12px;">
    <tr><td style="padding:6px 0; color:#666; width:120px;">予約番号</td><td style="padding:6px 0; font-weight:bold; color:#2d5a27;">${reservation_code}</td></tr>
    <tr><td style="padding:6px 0; color:#666;">お名前</td><td style="padding:6px 0;">${customer_name}　様</td></tr>
    <tr><td style="padding:6px 0; color:#666;">電話番号</td><td style="padding:6px 0;">${customer_phone}</td></tr>
    <tr><td style="padding:6px 0; color:#666;">日時</td><td style="padding:6px 0;">${date_label}</td></tr>
    <tr><td style="padding:6px 0; color:#666;">タイプ</td><td style="padding:6px 0;">${TYPE_LABELS[reservation_type] ?? reservation_type}</td></tr>
    ${seat_label ? `<tr><td style="padding:6px 0; color:#666;">席</td><td style="padding:6px 0;">${seat_label}</td></tr>` : ''}
    ${notes ? `<tr><td style="padding:6px 0; color:#666;">備考</td><td style="padding:6px 0;">${notes}</td></tr>` : ''}
  </table>
  <div style="margin-top:12px;">
    <p style="color:#666; margin-bottom:4px;">お菓子注文：</p>
    <ul style="margin:0; padding-left:20px;">${itemsHtml}</ul>
  </div>
</div>`;

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ADMIN_EMAIL,
      subject: `【あまらんす】新規予約 ${reservation_code}｜${customer_name} 様`,
      html,
    });
  } catch {
    // 通知失敗しても予約処理は続ける
  }
}
