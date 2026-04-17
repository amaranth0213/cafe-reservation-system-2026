import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'admin_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin/login はスキップ
  if (pathname === '/admin/login') return NextResponse.next();

  // /admin/* へのアクセスはCookieチェック
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    // トークンの有効性はAPIルート内で検証（middleware は軽量にする）
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
