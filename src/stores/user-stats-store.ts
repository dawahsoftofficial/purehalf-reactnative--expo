import { create } from 'zustand';

type UserStatsState = {
  like_count: number;
  visit_count: number;
  photo_request_count: number;
  setUserStats: (
    like_count: number,
    visit_count: number,
    photo_request_count: number
  ) => void;
  reset: () => void;
};

export const useUserStatsStore = create<UserStatsState>((set) => ({
  like_count: 0,
  visit_count: 0,
  photo_request_count: 0,

  setUserStats: (like_count, visit_count, photo_request_count) => {
    set({ like_count, visit_count, photo_request_count });
  },

  reset: () => {
    set({ like_count: 0, visit_count: 0, photo_request_count: 0 });
  },
}));
