import { createServerClient } from './supabase/server';
import type { SeatAvailability, SlotAvailability, SeatCategory } from '@/types';

// 時間帯の空席状況を取得
export async function getSlotAvailability(timeSlotId: string): Promise<SlotAvailability | null> {
  const supabase = createServerClient();

  // タイムスロット情報を取得
  const { data: slot, error: slotError } = await supabase
    .from('time_slots')
    .select('id, slot_time, is_accepting')
    .eq('id', timeSlotId)
    .single();

  if (slotError || !slot) return null;

  // 座席種別マスタを取得
  const { data: seatTypes } = await supabase
    .from('seat_types')
    .select('*')
    .order('capacity');

  if (!seatTypes) return null;

  // その時間帯の確定済み予約を取得（席予約のみ）
  const { data: reservations } = await supabase
    .from('reservations')
    .select('seat_type_id')
    .eq('time_slot_id', timeSlotId)
    .eq('status', 'confirmed')
    .not('seat_type_id', 'is', null);

  // 座席種別ごとの使用卓数を集計
  const usedByTypeId: Record<string, number> = {};
  for (const r of reservations ?? []) {
    if (r.seat_type_id) {
      usedByTypeId[r.seat_type_id] = (usedByTypeId[r.seat_type_id] ?? 0) + 1;
    }
  }

  const seats: SeatAvailability[] = seatTypes.map((st) => {
    const used = usedByTypeId[st.id] ?? 0;
    return {
      category: st.category as SeatCategory,
      capacity: st.capacity,
      total_count: st.total_count,
      used_count: used,
      remaining: st.total_count - used,
    };
  });

  const totalCapacity = seatTypes.reduce((sum, st) => sum + st.capacity * st.total_count, 0);
  const totalUsed = seatTypes.reduce((sum, st) => {
    const used = usedByTypeId[st.id] ?? 0;
    return sum + st.capacity * used;
  }, 0);

  return {
    time_slot_id: timeSlotId,
    slot_time: slot.slot_time,
    is_accepting: slot.is_accepting,
    seats,
    total_capacity: totalCapacity,
    total_used: totalUsed,
    total_remaining: totalCapacity - totalUsed,
    is_full: !slot.is_accepting || totalUsed >= totalCapacity,
  };
}

// 日付の全タイムスロットの空席状況を取得
export async function getDayAvailability(businessDayId: string): Promise<SlotAvailability[]> {
  const supabase = createServerClient();

  const { data: slots } = await supabase
    .from('time_slots')
    .select('id')
    .eq('business_day_id', businessDayId)
    .order('slot_time');

  if (!slots) return [];

  const results = await Promise.all(
    slots.map((s) => getSlotAvailability(s.id))
  );

  return results.filter((r): r is SlotAvailability => r !== null);
}

// 予約作成後に満席なら自動締め切り
export async function closeSlotIfFull(timeSlotId: string): Promise<void> {
  const supabase = createServerClient();
  const availability = await getSlotAvailability(timeSlotId);

  if (!availability) return;

  // 全座席種別が0になった場合（全卓埋まり）に締め切り
  const allFull = availability.seats.every((s) => s.remaining === 0);
  if (allFull) {
    await supabase
      .from('time_slots')
      .update({ is_accepting: false })
      .eq('id', timeSlotId);
  }
}

// キャンセル後に受付を再開する（管理者用）
export async function reopenSlot(timeSlotId: string): Promise<void> {
  const supabase = createServerClient();
  await supabase
    .from('time_slots')
    .update({ is_accepting: true })
    .eq('id', timeSlotId);
}
