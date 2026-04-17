import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { generateReservationCSV } from '@/lib/csv';

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get('from');
  const dateTo = searchParams.get('to');

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

  // 日付フィルター（business_days.dateでフィルタリング）
  // Supabaseのネストしたフィルターはサポートされていないため、アプリ側でフィルター
  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 });
  }

  let reservations = data ?? [];

  if (dateFrom || dateTo) {
    reservations = reservations.filter((r) => {
      const date = r.time_slots?.business_days?.date;
      if (!date) return true;
      if (dateFrom && date < dateFrom) return false;
      if (dateTo && date > dateTo) return false;
      return true;
    });
  }

  const csv = generateReservationCSV(reservations);

  const filename = `reservations_${new Date().toISOString().split('T')[0]}.csv`;
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
