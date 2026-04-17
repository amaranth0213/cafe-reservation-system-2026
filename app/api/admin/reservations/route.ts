import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const slotTime = searchParams.get('slot_time');
  const status = searchParams.get('status');

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
    // 特定日付でフィルター
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

      const slotIds = slots?.map((s) => s.id) ?? [];
      if (slotIds.length > 0) {
        query = query.in('time_slot_id', slotIds);
      }
    }
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

  return NextResponse.json(data ?? []);
}
