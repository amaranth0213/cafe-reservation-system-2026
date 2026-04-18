import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSlotAvailability, getDayAvailability } from '@/lib/availability';
import { isReservationOpen } from '@/lib/business-days';

// GET /api/availability?date=2026-04-20 または ?slot_id=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const slotId = searchParams.get('slot_id');

  if (slotId) {
    const availability = await getSlotAvailability(slotId);
    if (!availability) {
      return NextResponse.json({ error: '指定のスロットが見つかりません' }, { status: 404 });
    }
    return NextResponse.json(availability);
  }

  if (date) {
    const supabase = createServerClient();
    const { data: businessDay } = await supabase
      .from('business_days')
      .select('id, date, is_open, note')
      .eq('date', date)
      .eq('is_open', true)
      .single();

    if (!businessDay) {
      return NextResponse.json({ error: 'この日は営業していません' }, { status: 404 });
    }

    const slots = await getDayAvailability(businessDay.id);
    return NextResponse.json({ date: businessDay, slots });
  }

  // 日付なしの場合: 今後8週分の営業日一覧
  const supabase = createServerClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: businessDays } = await supabase
    .from('business_days')
    .select(`
      id, date, is_open, note,
      time_slots (id, slot_time, is_accepting)
    `)
    .eq('is_open', true)
    .gte('date', today)
    .order('date')
    .limit(1);

  // 木曜日12時以降のみ受付開始
  const openDays = (businessDays ?? []).filter(bd => isReservationOpen(bd.date));
  return NextResponse.json(openDays);
}
