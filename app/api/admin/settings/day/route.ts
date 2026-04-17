import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { day_id, is_open, note } = await request.json();
  if (!day_id) return NextResponse.json({ error: 'day_idが必要です' }, { status: 400 });

  const supabase = createServerClient();
  const { error } = await supabase
    .from('business_days')
    .update({ is_open, ...(note !== undefined ? { note } : {}) })
    .eq('id', day_id);

  if (error) return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  return NextResponse.json({ success: true });
}
