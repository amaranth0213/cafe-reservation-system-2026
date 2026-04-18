import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('menus')
    .select('id, name, description, price, stock, is_takeout_available')
    .eq('is_available', true)
    .order('sort_order');

  return NextResponse.json(data ?? []);
}
