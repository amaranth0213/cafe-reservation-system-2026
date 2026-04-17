-- 今後8週分の月曜日を自動生成する関数
CREATE OR REPLACE FUNCTION generate_upcoming_mondays(weeks_ahead INTEGER DEFAULT 8)
RETURNS void AS $$
DECLARE
  current_monday DATE;
  target_date DATE;
  i INTEGER;
BEGIN
  -- 直近の月曜日を計算（今日が月曜なら今日）
  current_monday := date_trunc('week', CURRENT_DATE)::DATE + INTERVAL '0 day';
  -- ISO weekの月曜は date_trunc('week', ...) で取得
  current_monday := (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 1)::DATE;
  IF EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN
    current_monday := current_monday - 6; -- 日曜の場合は先週月曜
  END IF;

  FOR i IN 0..weeks_ahead-1 LOOP
    target_date := current_monday + (i * 7);

    -- 重複を無視して挿入
    INSERT INTO business_days (date, is_open)
    VALUES (target_date, true)
    ON CONFLICT (date) DO NOTHING;

    -- 各日付に3つのタイムスロットを生成
    INSERT INTO time_slots (business_day_id, slot_time, is_accepting)
    SELECT id, slot_time, true
    FROM business_days
    CROSS JOIN (VALUES ('09:30'), ('12:00'), ('14:00')) AS slots(slot_time)
    WHERE date = target_date
    ON CONFLICT (business_day_id, slot_time) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 初回実行
SELECT generate_upcoming_mondays(12);
