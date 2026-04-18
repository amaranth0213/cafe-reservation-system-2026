import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date'); // 日付指定で残り数を計算

  const supabase = createServerClient();
  const { data: menus } = await supabase
    .from('menus')
    .select('id, name, description, price, stock, is_takeout_available')
    .eq('is_available', true)
    .order('sort_order');

  if (!menus) return NextResponse.json([]);

  // 日付が指定された場合、当日の注文済み数を計算して remaining を付与
  if (date) {
    // その日の確定予約のオーダー数を取得
    const { data: businessDay } = await supabase
      .from('business_days')
      .select('id')
      .eq('date', date)
      .single();

    let orderedMap: Record<string, number> = {};

    if (businessDay) {
      const { data: slots } = await supabase
        .from('time_slots')
        .select('id')
        .eq('business_day_id', businessDay.id);

      const slotIds = (slots ?? []).map((s) => s.id);

      if (slotIds.length > 0) {
        const { data: reservationIds } = await supabase
          .from('reservations')
          .select('id')
          .in('time_slot_id', slotIds)
          .eq('status', 'confirmed');

        const rIds = (reservationIds ?? []).map((r) => r.id);

        if (rIds.length > 0) {
          const { data: items } = await supabase
            .from('reservation_items')
            .select('menu_id, quantity')
            .in('reservation_id', rIds);

          for (const item of items ?? []) {
            orderedMap[item.menu_id] = (orderedMap[item.menu_id] ?? 0) + item.quantity;
          }
        }
      }
    }

    // テイクアウトのみ予約（time_slot_id が null）の分も集計
    const { data: takeoutReservations } = await supabase
      .from('reservations')
      .select('id')
      .is('time_slot_id', null)
      .eq('status', 'confirmed');

    if ((takeoutReservations ?? []).length > 0) {
      const tIds = takeoutReservations!.map((r) => r.id);
      const { data: tItems } = await supabase
        .from('reservation_items')
        .select('menu_id, quantity')
        .in('reservation_id', tIds);
      for (const item of tItems ?? []) {
        orderedMap[item.menu_id] = (orderedMap[item.menu_id] ?? 0) + item.quantity;
      }
    }

    const result = menus.map((menu) => {
      const ordered = orderedMap[menu.id] ?? 0;
      const remaining = menu.stock !== null ? Math.max(0, menu.stock - ordered) : null;
      return { ...menu, remaining, ordered };
    });

    return NextResponse.json(result);
  }

  // 日付なし：stockをそのままremainingとして返す
  return NextResponse.json(menus.map((m) => ({ ...m, remaining: m.stock })));
}
