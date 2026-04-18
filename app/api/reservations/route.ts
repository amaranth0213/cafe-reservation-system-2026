import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSlotAvailability, closeSlotIfFull } from '@/lib/availability';
import { generateReservationCode } from '@/lib/business-days';
import type { ReservationType, OrderItem } from '@/types';

interface CreateReservationBody {
  time_slot_id?: string;
  reservation_type: ReservationType;
  seat_type_id?: string;
  party_size?: number;
  customer_name: string;
  customer_phone: string;
  notes?: string;
  items?: OrderItem[];
}

export async function POST(request: NextRequest) {
  let body: CreateReservationBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '無効なリクエストです' }, { status: 400 });
  }

  const { reservation_type, customer_name, customer_phone, time_slot_id, seat_type_id, party_size, notes, items } = body;

  // バリデーション
  if (!reservation_type || !customer_name?.trim() || !customer_phone?.trim()) {
    return NextResponse.json({ error: '名前と電話番号は必須です' }, { status: 400 });
  }

  if (reservation_type !== 'takeout' && !time_slot_id) {
    return NextResponse.json({ error: '時間帯を選択してください' }, { status: 400 });
  }

  if (reservation_type !== 'takeout' && !seat_type_id) {
    return NextResponse.json({ error: '席種を選択してください' }, { status: 400 });
  }

  const supabase = createServerClient();

  // 空席確認（席予約の場合）
  if (time_slot_id && seat_type_id) {
    const availability = await getSlotAvailability(time_slot_id);
    if (!availability) {
      return NextResponse.json({ error: '指定の時間帯が見つかりません' }, { status: 404 });
    }

    if (!availability.is_accepting) {
      return NextResponse.json({ error: 'この時間帯は受付を終了しました' }, { status: 409 });
    }

    // 座席種別の残席確認
    const { data: seatType } = await supabase
      .from('seat_types')
      .select('capacity')
      .eq('id', seat_type_id)
      .single();

    const seatAvail = availability.seats.find(
      (s) => {
        // seat_type_idからcategoryを特定するために別途確認が必要
        return true; // 後続でチェック
      }
    );

    // 対象座席種別のremaining確認
    const { data: seatTypeData } = await supabase
      .from('seat_types')
      .select('category, capacity, total_count')
      .eq('id', seat_type_id)
      .single();

    if (seatTypeData) {
      const targetSeat = availability.seats.find((s) => s.category === seatTypeData.category);
      if (!targetSeat || targetSeat.remaining <= 0) {
        return NextResponse.json({ error: 'この席種は満席です。他の席種をお選びください' }, { status: 409 });
      }

      // 人数チェック
      if (party_size && party_size > seatTypeData.capacity) {
        return NextResponse.json(
          { error: `${seatTypeData.capacity}人席に${party_size}人は座れません` },
          { status: 400 }
        );
      }
    }
  }

  // お菓子の在庫チェック
  if (Array.isArray(order_items) && order_items.length > 0) {
    const menuIds = order_items.filter((i: { quantity: number }) => i.quantity > 0).map((i: { menu_id: string }) => i.menu_id);
    if (menuIds.length > 0) {
      const { data: menuStocks } = await supabase
        .from('menus')
        .select('id, name, stock')
        .in('id', menuIds);

      for (const menu of menuStocks ?? []) {
        if (menu.stock === null) continue; // 制限なし
        const requested = order_items
          .filter((i: { menu_id: string }) => i.menu_id === menu.id)
          .reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0);

        // 当日の注文済み数を取得
        let orderedCount = 0;
        if (time_slot_id) {
          const { data: tsData } = await supabase.from('time_slots').select('business_day_id').eq('id', time_slot_id).single();
          if (tsData) {
            const { data: daySlots } = await supabase.from('time_slots').select('id').eq('business_day_id', tsData.business_day_id);
            const slotIds = (daySlots ?? []).map((s: { id: string }) => s.id);
            if (slotIds.length > 0) {
              const { data: rIds } = await supabase.from('reservations').select('id').in('time_slot_id', slotIds).eq('status', 'confirmed');
              const reservationIds = (rIds ?? []).map((r: { id: string }) => r.id);
              if (reservationIds.length > 0) {
                const { data: items } = await supabase.from('reservation_items').select('quantity').in('reservation_id', reservationIds).eq('menu_id', menu.id);
                orderedCount = (items ?? []).reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0);
              }
            }
          }
        }

        if (orderedCount + requested > menu.stock) {
          const remaining = Math.max(0, menu.stock - orderedCount);
          return NextResponse.json(
            { error: `「${menu.name}」の残り数は${remaining}個です。数量を減らしてください。` },
            { status: 409 }
          );
        }
      }
    }
  }

  // 予約コード生成（重複チェック）
  let reservationCode = generateReservationCode();
  let attempts = 0;
  while (attempts < 5) {
    const { data: existing } = await supabase
      .from('reservations')
      .select('id')
      .eq('reservation_code', reservationCode)
      .single();
    if (!existing) break;
    reservationCode = generateReservationCode();
    attempts++;
  }

  // 予約作成
  const { data: reservation, error: insertError } = await supabase
    .from('reservations')
    .insert({
      reservation_code: reservationCode,
      time_slot_id: time_slot_id ?? null,
      reservation_type,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      party_size: party_size ?? null,
      seat_type_id: seat_type_id ?? null,
      notes: notes?.trim() ?? null,
    })
    .select()
    .single();

  if (insertError || !reservation) {
    console.error('予約作成エラー:', insertError);
    return NextResponse.json({ error: '予約の作成に失敗しました' }, { status: 500 });
  }

  // お菓子注文の保存
  if (items && items.length > 0) {
    const itemsToInsert = items
      .filter((item) => item.quantity > 0)
      .map((item) => ({
        reservation_id: reservation.id,
        menu_id: item.menu_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        is_takeout: item.is_takeout,
      }));

    if (itemsToInsert.length > 0) {
      const { error: itemsError } = await supabase
        .from('reservation_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('注文保存エラー:', itemsError);
      }
    }
  }

  // 満席の場合は受付自動締め切り
  if (time_slot_id) {
    await closeSlotIfFull(time_slot_id);
  }

  return NextResponse.json(
    { reservation_code: reservation.reservation_code, id: reservation.id },
    { status: 201 }
  );
}
