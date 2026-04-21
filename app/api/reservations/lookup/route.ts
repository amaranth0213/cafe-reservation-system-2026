import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET /api/reservations/lookup?code=CA-XXXXX
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ error: '予約番号を入力してください' }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data } = await supabase
    .from('reservations')
    .select(`
      id,
      reservation_code,
      reservation_type,
      status,
      customer_name,
      party_size,
      notes,
      cancelled_at,
      cancel_reason,
      created_at,
      time_slots (
        slot_time,
        business_days (date)
      ),
      seat_types (category, capacity),
      reservation_items (
        quantity,
        unit_price,
        is_takeout,
        menus (name)
      )
    `)
    .eq('reservation_code', code)
    .single();

  if (!data) {
    return NextResponse.json({ error: '予約が見つかりませんでした' }, { status: 404 });
  }

  return NextResponse.json(data);
}
