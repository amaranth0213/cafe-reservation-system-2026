// 月曜日のみの営業日計算ユーティリティ

// 日付が月曜日かどうか確認
export function isMonday(date: Date): boolean {
  return date.getDay() === 1;
}

// 指定日数以内の月曜日一覧を返す
export function getUpcomingMondays(weeksAhead: number = 8): Date[] {
  const mondays: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 今週の月曜日を計算
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? 1 : (1 - dayOfWeek + 7) % 7;
  const firstMonday = new Date(today);
  firstMonday.setDate(today.getDate() + daysToMonday);

  for (let i = 0; i < weeksAhead; i++) {
    const monday = new Date(firstMonday);
    monday.setDate(firstMonday.getDate() + i * 7);
    mondays.push(monday);
  }

  return mondays;
}

// Date を YYYY-MM-DD 形式の文字列に変換
export function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

// YYYY-MM-DD を表示用（例: 2026年4月20日（月））に変換
export function formatDateJP(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日（月）`;
}

// 予約コード生成（例: CA-00042）
let codeCounter = 0;
export function generateReservationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `CA-${code}`;
}
