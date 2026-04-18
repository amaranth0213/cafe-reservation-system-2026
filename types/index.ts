export type SeatCategory = 'single' | 'double' | 'quad';
export type ReservationType = 'seat_only' | 'seat_with_food' | 'takeout';
export type ReservationStatus = 'confirmed' | 'cancelled';
export type SlotTime = '09:30' | '12:00' | '14:00';

export interface SeatType {
  id: string;
  category: SeatCategory;
  capacity: number;
  total_count: number;
}

export interface Menu {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  sort_order: number;
  stock: number | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessDay {
  id: string;
  date: string;
  is_open: boolean;
  note: string | null;
  created_at: string;
}

export interface TimeSlot {
  id: string;
  business_day_id: string;
  slot_time: SlotTime;
  is_accepting: boolean;
  business_days?: BusinessDay;
}

export interface Reservation {
  id: string;
  reservation_code: string;
  time_slot_id: string | null;
  reservation_type: ReservationType;
  status: ReservationStatus;
  customer_name: string;
  customer_phone: string;
  party_size: number | null;
  seat_type_id: string | null;
  notes: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  time_slots?: TimeSlot & { business_days?: BusinessDay };
  seat_types?: SeatType;
  reservation_items?: ReservationItem[];
}

export interface ReservationItem {
  id: string;
  reservation_id: string;
  menu_id: string;
  quantity: number;
  unit_price: number;
  is_takeout: boolean;
  created_at: string;
  menus?: Menu;
}

// 空席状況
export interface SeatAvailability {
  category: SeatCategory;
  capacity: number;
  total_count: number;
  used_count: number;
  remaining: number;
}

export interface SlotAvailability {
  time_slot_id: string;
  slot_time: SlotTime;
  is_accepting: boolean;
  seats: SeatAvailability[];
  total_capacity: number;
  total_used: number;
  total_remaining: number;
  is_full: boolean;
}

// 予約フォームの状態
export interface ReservationFormData {
  date: string;
  time_slot_id: string;
  slot_time: SlotTime;
  reservation_type: ReservationType;
  seat_type_id: string;
  seat_category: SeatCategory;
  party_size: number;
  customer_name: string;
  customer_phone: string;
  notes: string;
  items: OrderItem[];
}

export interface OrderItem {
  menu_id: string;
  menu_name: string;
  unit_price: number;
  quantity: number;
  is_takeout: boolean;
}

// 座席カテゴリの表示名
export const SEAT_LABELS: Record<SeatCategory, string> = {
  single: '1人席',
  double: '2人席',
  quad: '4人席',
};

export const SLOT_TIME_LABELS: Record<SlotTime, string> = {
  '09:30': '9:30〜',
  '12:00': '12:00〜',
  '14:00': '14:00〜',
};

export const RESERVATION_TYPE_LABELS: Record<ReservationType, string> = {
  seat_only: '席のみ',
  seat_with_food: '席 + お菓子（イートイン）',
  takeout: 'お持ち帰りのみ',
};
