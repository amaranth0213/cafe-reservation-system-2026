import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSlotAvailability, getDayAvailability } from '@/lib/availability';

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
      .single();

    if (!businessDay || !businessDay.is_open) {
      return NextResponse.json({ error: 'この日は営業していません' }, { status: 404 });
    }

    const slots = await getDayAvailability(businessDay.id);
    return NextResponse.json({ date: businessDay, slots });
  }

  // 日付なしの場合: 今後3週分の営業日一覧（休業日・受付前も含む）
  const supabase = createServerClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: businessDays } = await supabase
    .from('business_days')
    .select(`
      id, date, is_open, note,
      time_slots (id, slot_time, is_accepting)
    `)
    .gte('date', today)
    .order('date')
    .limit(3);

  return NextResponse.json(businessDays ?? []);
}
