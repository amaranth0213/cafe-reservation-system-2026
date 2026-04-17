import bcrypt from 'bcryptjs';
import { createServerClient } from './supabase/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'admin_session';
const SESSION_HOURS = 24;

// パスワード検証
export async function verifyPassword(password: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

// セッション作成（ログイン成功時）
export async function createSession(): Promise<string> {
  const supabase = createServerClient();
  const token = crypto.randomUUID() + '-' + crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);

  await supabase.from('admin_sessions').insert({
    token,
    expires_at: expiresAt.toISOString(),
  });

  return token;
}

// セッション検証
export async function validateSession(token: string): Promise<boolean> {
  if (!token) return false;
  const supabase = createServerClient();

  const { data } = await supabase
    .from('admin_sessions')
    .select('expires_at')
    .eq('token', token)
    .single();

  if (!data) return false;
  return new Date(data.expires_at) > new Date();
}

// Cookieからセッションを取得して検証
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return validateSession(token);
}

// セッション削除（ログアウト）
export async function deleteSession(token: string): Promise<void> {
  const supabase = createServerClient();
  await supabase.from('admin_sessions').delete().eq('token', token);
}

export { SESSION_COOKIE };
