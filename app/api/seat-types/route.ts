import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('seat_types')
    .select('id, category, capacity, total_count')
    .order('capacity');

  return NextResponse.json(data ?? []);
}
