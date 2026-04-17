import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .order('sort_order');

  if (error) return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, price, is_available, sort_order } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'メニュー名は必須です' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('menus')
    .insert({ name: name.trim(), description: description ?? null, price: price ?? 0, is_available: is_available ?? true, sort_order: sort_order ?? 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: '作成に失敗しました' }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: 'IDが必要です' }, { status: 400 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('menus')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'IDが必要です' }, { status: 400 });

  const supabase = createServerClient();
  const { error } = await supabase.from('menus').delete().eq('id', id);
  if (error) return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });
  return NextResponse.json({ success: true });
}
