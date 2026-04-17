import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const supabase = createServerClient();
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('business_days')
    .select(`
      id, date, is_open, note,
      time_slots (id, slot_time, is_accepting)
    `)
    .gte('date', today)
    .order('date')
    .limit(16);

  return NextResponse.json(data ?? []);
}
