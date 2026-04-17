import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { reopenSlot } from '@/lib/availability';

// PATCH /api/admin/reservations/[id] - キャンセル処理
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { id } = await params;
  let body: { action: 'cancel'; cancel_reason?: string; reopen_slot?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '無効なリクエストです' }, { status: 400 });
  }

  if (body.action !== 'cancel') {
    return NextResponse.json({ error: '無効な操作です' }, { status: 400 });
  }

  const supabase = createServerClient();

  // 予約を取得
  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, status, time_slot_id')
    .eq('id', id)
    .single();

  if (!reservation) {
    return NextResponse.json({ error: '予約が見つかりません' }, { status: 404 });
  }

  if (reservation.status === 'cancelled') {
    return NextResponse.json({ error: 'すでにキャンセル済みです' }, { status: 409 });
  }

  // キャンセル処理
  const { error } = await supabase
    .from('reservations')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason: body.cancel_reason ?? null,
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'キャンセルに失敗しました' }, { status: 500 });
  }

  // 受付再開（オプション）
  if (body.reopen_slot && reservation.time_slot_id) {
    await reopenSlot(reservation.time_slot_id);
  }

  return NextResponse.json({ success: true });
}
