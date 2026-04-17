import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createSession, SESSION_COOKIE } from '@/lib/auth';

export async function POST(request: NextRequest) {
  let body: { password: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '無効なリクエストです' }, { status: 400 });
  }

  const { password } = body;
  if (!password) {
    return NextResponse.json({ error: 'パスワードを入力してください' }, { status: 400 });
  }

  const valid = await verifyPassword(password);
  if (!valid) {
    return NextResponse.json({ error: 'パスワードが違います' }, { status: 401 });
  }

  const token = await createSession();

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24時間
    path: '/',
  });

  return response;
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const { deleteSession } = await import('@/lib/auth');
    await deleteSession(token);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
