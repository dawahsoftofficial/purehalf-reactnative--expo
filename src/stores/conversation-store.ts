import { create } from 'zustand';

type ConversationState = {
  unreadConversationsCount: number;
  unreadMessagesCount: number;
  setUnreadCounts: (
    unreadConversationsCount: number,
    unreadMessagesCount: number
  ) => void;
  reset: () => void;
};

export const useConversationStore = create<ConversationState>((set) => ({
  unreadConversationsCount: 0,
  unreadMessagesCount: 0,

  setUnreadCounts: (unreadConversationsCount, unreadMessagesCount) => {
    set({ unreadConversationsCount, unreadMessagesCount });
  },

  reset: () => {
    set({ unreadConversationsCount: 0, unreadMessagesCount: 0 });
  },
}));

