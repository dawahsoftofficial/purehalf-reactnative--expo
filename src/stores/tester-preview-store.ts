import { create } from 'zustand';

import type { DailyVipReward } from '@/screens/welcome/components/daily-vip-reward-modal';

// Sample reward used purely so testers can review the daily-gift ("gift
// calendar") popup on demand without waiting for a real eligible day.
export const TESTER_GIFT_CALENDAR_PREVIEW: DailyVipReward = {
  available: true,
  eligible_days: 3,
  daily_chats: 6,
  total_chats: 18,
  total_credits: 18,
  next_available_at: null,
};

type TesterPreviewState = {
  giftCalendarRequested: boolean;
  requestGiftCalendar: () => void;
  clearGiftCalendar: () => void;
};

export const useTesterPreviewStore = create<TesterPreviewState>((set) => ({
  giftCalendarRequested: false,
  requestGiftCalendar: () => set({ giftCalendarRequested: true }),
  clearGiftCalendar: () => set({ giftCalendarRequested: false }),
}));
