-- カフェ予約システム 初期マイグレーション

-- 座席種別マスタ
CREATE TABLE seat_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT NOT NULL UNIQUE CHECK (category IN ('single', 'double', 'quad')),
  capacity    INTEGER NOT NULL,
  total_count INTEGER NOT NULL
);

-- 初期データ: 1人席×1, 2人席×3, 4人席×1
INSERT INTO seat_types (category, capacity, total_count) VALUES
  ('single', 1, 1),
  ('double', 2, 3),
  ('quad',   4, 1);

-- メニュー
CREATE TABLE menus (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  price        INTEGER NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 初期メニューデータ
INSERT INTO menus (name, description, price, is_available, sort_order) VALUES
  ('抹茶のテリーヌ', null, 600, true, 1),
  ('低糖質の抹茶のシフォンケーキ', null, 600, true, 2),
  ('抹茶のアフォガード', null, 650, true, 3),
  ('オレンショコラケーキ', null, 600, true, 4),
  ('苺大福', null, 400, true, 5),
  ('パリパリもなか', null, 400, true, 6),
  ('てん茶のおにぎりセット', 'おにぎり一つと卵焼きとほうじ茶付き', 500, true, 7);

-- 営業日（月曜日のみ）
CREATE TABLE business_days (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date       DATE NOT NULL UNIQUE,
  is_open    BOOLEAN NOT NULL DEFAULT true,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 時間帯スロット
CREATE TABLE time_slots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_day_id UUID NOT NULL REFERENCES business_days(id) ON DELETE CASCADE,
  slot_time       TEXT NOT NULL CHECK (slot_time IN ('09:30', '12:00', '14:00')),
  is_accepting    BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (business_day_id, slot_time)
);

-- 予約
CREATE TABLE reservations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_code TEXT NOT NULL UNIQUE,
  time_slot_id     UUID REFERENCES time_slots(id) ON DELETE SET NULL,
  reservation_type TEXT NOT NULL CHECK (reservation_type IN ('seat_only', 'seat_with_food', 'takeout')),
  status           TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  party_size       INTEGER,
  seat_type_id     UUID REFERENCES seat_types(id),
  notes            TEXT,
  cancelled_at     TIMESTAMPTZ,
  cancel_reason    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX idx_reservations_time_slot ON reservations(time_slot_id);
CREATE INDEX idx_reservations_status    ON reservations(status);
CREATE INDEX idx_reservations_code      ON reservations(reservation_code);

-- 予約内のお菓子注文
CREATE TABLE reservation_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  menu_id        UUID NOT NULL REFERENCES menus(id),
  quantity       INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price     INTEGER NOT NULL,
  is_takeout     BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 管理者セッション
CREATE TABLE admin_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- menus の updated_at 自動更新
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER menus_updated_at
  BEFORE UPDATE ON menus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS (Row Level Security) 設定
ALTER TABLE seat_types       ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus             ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_days     ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions    ENABLE ROW LEVEL SECURITY;

-- 公開読み取り可能なテーブル（空席確認・メニュー表示用）
CREATE POLICY "seat_types_public_read"   ON seat_types       FOR SELECT USING (true);
CREATE POLICY "menus_public_read"        ON menus             FOR SELECT USING (is_available = true);
CREATE POLICY "business_days_public_read" ON business_days   FOR SELECT USING (true);
CREATE POLICY "time_slots_public_read"   ON time_slots        FOR SELECT USING (true);

-- 予約は誰でも作成可能（匿名ユーザー）
CREATE POLICY "reservations_public_insert" ON reservations
  FOR INSERT WITH CHECK (true);

-- reservation_items も予約作成時に一緒に作成可能
CREATE POLICY "reservation_items_public_insert" ON reservation_items
  FOR INSERT WITH CHECK (true);

-- 管理者のみ全操作可能（service_role key 使用時）
-- ※ service_role は RLS をバイパスするため追加ポリシー不要
