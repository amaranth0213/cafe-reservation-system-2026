import Link from 'next/link';

interface Props {
  searchParams: Promise<{ code?: string }>;
}

export default async function CompletePage({ searchParams }: Props) {
  const params = await searchParams;
  const code = params.code ?? '---';

  return (
    <main className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="card py-12 px-8">
          <div className="w-16 h-16 bg-matcha-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-matcha-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-serif text-matcha-800 mb-2">ご予約が完了しました</h1>
          <p className="text-gray-500 text-sm mb-8">当日お気をつけてお越しください</p>

          <div className="bg-matcha-50 rounded-xl p-6 mb-8">
            <p className="text-xs text-matcha-600 mb-1">予約番号</p>
            <p className="text-3xl font-mono font-bold text-matcha-700 tracking-wider">{code}</p>
          </div>

          <div className="text-sm text-gray-600 space-y-2 mb-8 text-left bg-gray-50 rounded-lg p-4">
            <p className="font-medium text-gray-700 mb-2">ご確認ください</p>
            <p>・この画面のスクリーンショットを保存してください</p>
            <p>・キャンセルの場合は Instagram のメッセージよりご連絡ください</p>
            <p>・当日は予約番号をお伝えいただけるとスムーズです</p>
          </div>

          <div className="space-y-3">
            <Link href={`/reserve/lookup?code=${code}`} className="btn-primary w-full block">
              予約内容を確認する
            </Link>
            <Link href="/" className="btn-secondary w-full block">
              トップページへ戻る
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
