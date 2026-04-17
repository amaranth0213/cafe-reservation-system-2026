import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { slot_id, is_accepting } = await request.json();
  if (!slot_id) return NextResponse.json({ error: 'slot_idが必要です' }, { status: 400 });

  const supabase = createServerClient();
  const { error } = await supabase
    .from('time_slots')
    .update({ is_accepting })
    .eq('id', slot_id);

  if (error) return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  return NextResponse.json({ success: true });
}
