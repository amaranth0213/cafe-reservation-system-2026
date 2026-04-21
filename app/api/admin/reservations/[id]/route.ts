import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { reopenSlot } from '@/lib/availability';

// PATCH /api/admin/reservations/[id] - キャンセル or 編集
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { id } = await params;
  let body: {
    action: 'cancel' | 'edit';
    cancel_reason?: string;
    reopen_slot?: boolean;
    customer_name?: string;
    customer_phone?: string;
    party_size?: number;
    notes?: string;
    items?: { menu_id: string; menu_name: string; unit_price: number; quantity: number; is_takeout: boolean }[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '無効なリクエストです' }, { status: 400 });
  }

  if (body.action !== 'cancel' && body.action !== 'edit') {
    return NextResponse.json({ error: '無効な操作です' }, { status: 400 });
  }

  const supabase = createServerClient();

  // 予約を取得
  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, status, time_slot_id, reservation_type')
    .eq('id', id)
    .single();

  if (!reservation) {
    return NextResponse.json({ error: '予約が見つかりません' }, { status: 404 });
  }

  // 編集処理
  if (body.action === 'edit') {
    const updateData: Record<string, unknown> = {};
    if (body.customer_name?.trim()) updateData.customer_name = body.customer_name.trim();
    if (body.customer_phone?.trim()) updateData.customer_phone = body.customer_phone.trim();
    if (body.party_size !== undefined) updateData.party_size = body.party_size;
    updateData.notes = body.notes?.trim() ?? null;

    const { error } = await supabase.from('reservations').update(updateData).eq('id', id);
    if (error) return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });

    // お菓子注文の更新（既存を削除して再登録）
    if (body.items !== undefined) {
      await supabase.from('reservation_items').delete().eq('reservation_id', id);
      const itemsToInsert = body.items.filter(i => i.quantity > 0).map(i => ({
        reservation_id: id,
        menu_id: i.menu_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        is_takeout: i.is_takeout,
      }));
      if (itemsToInsert.length > 0) {
        await supabase.from('reservation_items').insert(itemsToInsert);
      }
    }

    return NextResponse.json({ success: true });
  }

  // キャンセル処理
  if (reservation.status === 'cancelled') {
    return NextResponse.json({ error: 'すでにキャンセル済みです' }, { status: 409 });
  }

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

  if (body.reopen_slot && reservation.time_slot_id) {
    await reopenSlot(reservation.time_slot_id);
  }

  return NextResponse.json({ success: true });
}
