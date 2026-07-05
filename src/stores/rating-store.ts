import { create } from 'zustand';

type RatingState = {
  visible: boolean;
  trigger: string | null;
  show: (trigger: string) => void;
  hide: () => void;
};

export const useRatingStore = create<RatingState>((set) => ({
  visible: false,
  trigger: null,
  show: (trigger: string) => set({ visible: true, trigger }),
  hide: () => set({ visible: false }),
}));
