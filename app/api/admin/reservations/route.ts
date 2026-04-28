import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { generateReservationCode } from '@/lib/business-days';
import { getSlotAvailability, closeSlotIfFull } from '@/lib/availability';
import type { ReservationType, OrderItem } from '@/types';

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const slotTime = searchParams.get('slot_time');
  const status = searchParams.get('status');
  const takeoutOnly = searchParams.get('takeout_only') === 'true';
  const createdAfter = searchParams.get('created_after'); // YYYY-MM-DD

  const supabase = createServerClient();

  let query = supabase
    .from('reservations')
    .select(`
      *,
      time_slots (
        id, slot_time,
        business_days (id, date)
      ),
      seat_types (id, category, capacity),
      reservation_items (
        id, quantity, unit_price, is_takeout,
        menus (id, name)
      )
    `)
    .order('created_at', { ascending: false });

  if (date) {
    // 特定日付でフィルター（席予約 + テイクアウト両方を含む）
    const dateParts = date.split('-');
    const mmdd = `${dateParts[1]}${dateParts[2]}`; // 例: "0427"

    const supabaseInner = createServerClient();
    const { data: businessDay } = await supabaseInner
      .from('business_days')
      .select('id')
      .eq('date', date)
      .single();

    if (businessDay) {
      const { data: slots } = await supabaseInner
        .from('time_slots')
        .select('id')
        .eq('business_day_id', businessDay.id);

      const slotIds = (slots ?? []).map((s: { id: string }) => s.id);
      if (slotIds.length > 0) {
        // 席予約（time_slot_idが一致）OR テイクアウト（reservation_codeがMMDD-で始まる）
        query = query.or(
          `time_slot_id.in.(${slotIds.join(',')}),reservation_code.like.${mmdd}-%`
        );
      } else {
        // スロットなし（テイクアウトのみ）
        query = query.like('reservation_code', `${mmdd}-%`);
      }
    } else {
      // 営業日が見つからない場合もテイクアウトをコードで検索
      query = query.like('reservation_code', `${mmdd}-%`);
    }
  }

  // テイクアウトのみ取得（time_slot_idがnullの予約）
  if (takeoutOnly) {
    query = query.is('time_slot_id', null);
  }

  // 作成日時の絞り込み（YYYY-MM-DD以降）
  if (createdAfter) {
    query = query.gte('created_at', `${createdAfter}T00:00:00+09:00`);
  }

  if (slotTime) {
    query = query.eq('time_slots.slot_time', slotTime);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 });
  }

  // 日付・時間の早い順に並び替え（テイクアウト等スロットなしは末尾）
  const sorted = (data ?? []).sort((a, b) => {
    const aTs = a.time_slots as { slot_time: string; business_days?: { date: string } } | null | undefined;
    const bTs = b.time_slots as { slot_time: string; business_days?: { date: string } } | null | undefined;
    const aKey = aTs?.business_days?.date ? `${aTs.business_days.date} ${aTs.slot_time}` : 'zzzz';
    const bKey = bTs?.business_days?.date ? `${bTs.business_days.date} ${bTs.slot_time}` : 'zzzz';
    if (aKey !== bKey) return aKey.localeCompare(bKey);
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return NextResponse.json(sorted);
}

// 管理者による手動予約作成（木曜・土曜の制限なし）
export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  let body: {
    time_slot_id?: string;
    reservation_type: ReservationType;
    seat_type_id?: string;
    party_size?: number;
    customer_name: string;
    customer_phone: string;
    notes?: string;
    items?: OrderItem[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '無効なリクエストです' }, { status: 400 });
  }

  const { reservation_type, customer_name, customer_phone, time_slot_id, seat_type_id, party_size, notes, items } = body;

  if (!reservation_type || !customer_name?.trim() || !customer_phone?.trim()) {
    return NextResponse.json({ error: '名前と電話番号は必須です' }, { status: 400 });
  }

  const supabase = createServerClient();

  // 空席確認
  if (time_slot_id && seat_type_id) {
    const availability = await getSlotAvailability(time_slot_id);
    if (!availability) {
      return NextResponse.json({ error: '指定の時間帯が見つかりません' }, { status: 404 });
    }
    const { data: seatTypeData } = await supabase
      .from('seat_types')
      .select('category, capacity')
      .eq('id', seat_type_id)
      .single();

    if (seatTypeData) {
      const targetSeat = availability.seats.find((s) => s.category === seatTypeData.category);
      if (!targetSeat || targetSeat.remaining <= 0) {
        return NextResponse.json({ error: 'この席種は満席です' }, { status: 409 });
      }
      if (party_size && party_size > seatTypeData.capacity) {
        return NextResponse.json({ error: `${seatTypeData.capacity}人席に${party_size}人は座れません` }, { status: 400 });
      }
    }
  }

  // 予約コード生成（日付＋連番方式: 例 0428-1）
  let reservationDate = new Date().toISOString().split('T')[0];
  if (time_slot_id) {
    const { data: tsForCode } = await supabase
      .from('time_slots')
      .select('business_days(date)')
      .eq('id', time_slot_id)
      .single();
    const d = (tsForCode?.business_days as unknown as { date: string } | null)?.date;
    if (d) reservationDate = d;
  }
  const dateParts = reservationDate.split('-');
  const mmdd = `${dateParts[1]}${dateParts[2]}`;
  const { count: existingCount } = await supabase
    .from('reservations')
    .select('id', { count: 'exact', head: true })
    .like('reservation_code', `${mmdd}-%`);
  const seq = (existingCount ?? 0) + 1;
  const reservationCode = generateReservationCode(reservationDate, seq);

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
    return NextResponse.json({ error: '予約の作成に失敗しました' }, { status: 500 });
  }

  // お菓子注文の保存
  if (items && items.length > 0) {
    const itemsToInsert = items.filter((i) => i.quantity > 0).map((i) => ({
      reservation_id: reservation.id,
      menu_id: i.menu_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
      is_takeout: i.is_takeout,
    }));
    if (itemsToInsert.length > 0) {
      await supabase.from('reservation_items').insert(itemsToInsert);
    }
  }

  if (time_slot_id) {
    await closeSlotIfFull(time_slot_id);
  }

  return NextResponse.json({ reservation_code: reservation.reservation_code, id: reservation.id }, { status: 201 });
}
