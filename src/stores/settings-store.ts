import { create } from 'zustand';

// Type definitions for the settings API response
type AuthenticationMethod = {
  is_phone: number;
  is_apple: number;
  is_google: number;
};

type QuestionCredits = {
  credits: number;
};

type SectionCredits = {
  totalCredits: number;
  questions: Record<string, QuestionCredits>;
};

type ChatCredits = {
  chatCreditsBySection: {
    signUp?: SectionCredits;
    passionsAndHobbies?: SectionCredits;
    appearanceAndHealth?: SectionCredits;
    familyBackground?: SectionCredits;
    lifeStyle?: SectionCredits;
    personalityAndRequirements?: SectionCredits;
    waliInformation?: SectionCredits;
    islamicValues?: SectionCredits;
    futurePlans?: SectionCredits;
  };
};

type MaxChatsPerDay = {
  gents: {
    free: number;
    paid: number;
  };
  ladies: {
    free: number;
    paid: number;
  };
};

type BadgeVisibility = {
  searchResults: boolean;
  singleProfile: boolean;
  chatList: boolean;
  chatThread: boolean;
  homeRecommended: boolean;
  profileIconPopup: boolean;
};

type PaymentWallVisibility = {
  singleChat?: boolean;
  chatThread?: boolean;
  profileIconPopup?: boolean;
  homeRecommended?: boolean;
  homeVisitedUs?: boolean;
  homeLikedUs?: boolean;
  homeTop?: boolean;
  conversationList?: boolean;
  singleConversation?: boolean;
};

type BadgeConfig = {
  enabled: boolean;
  visibility: BadgeVisibility;
};

type PaymentWallConfig = {
  enabled: boolean;
  visibility: PaymentWallVisibility;
};

type BadgesAndPayments = {
  badges: {
    completedProfile?: BadgeConfig;
    boosted?: BadgeConfig;
    vipMember?: BadgeConfig;
  };
  paymentWalls: {
    buyChatCredits?: PaymentWallConfig;
    buyBoostCredits?: PaymentWallConfig;
    buyVipMembership?: PaymentWallConfig;
  };
};

type SettingValue =
  | AuthenticationMethod
  | ChatCredits
  | boolean
  | MaxChatsPerDay
  | BadgesAndPayments;

type SettingItem = {
  title: string;
  key: string;
  value: SettingValue;
  type: 'json' | 'boolean' | 'string' | 'number';
};

type SettingsResponse = {
  message: string;
  error: boolean;
  code: number;
  results: SettingItem[];
};

type SettingsState = {
  settings: SettingsResponse | null;
  loaded: boolean;
  setSettings: (settings: SettingsResponse) => void;
  clearSettings: () => void;
  getAuthenticationMethod: () => AuthenticationMethod | null;
  getChatCredits: () => ChatCredits | null;
  getForceUpdate: () => boolean;
  getMaxChatsPerDay: () => MaxChatsPerDay | null;
  getBadgesAndPayments: () => BadgesAndPayments | null;
  getSettingByKey: <T extends SettingValue>(key: string) => T | null;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loaded: false,

  setSettings: (settings: SettingsResponse) => {
    set({ settings, loaded: true });
  },

  clearSettings: () => {
    set({ settings: null, loaded: false });
  },

  getAuthenticationMethod: () => {
    const state = get();
    return state.getSettingByKey<AuthenticationMethod>('authentication_method');
  },

  getChatCredits: () => {
    const state = get();
    return state.getSettingByKey<ChatCredits>('chat_credits');
  },

  getForceUpdate: () => {
    const state = get();
    return state.getSettingByKey<boolean>('forceUpdate') ?? false;
  },

  getMaxChatsPerDay: () => {
    const state = get();
    return state.getSettingByKey<MaxChatsPerDay>('maxChatsPerDay');
  },

  getBadgesAndPayments: () => {
    const state = get();
    return state.getSettingByKey<BadgesAndPayments>('badges_and_payments');
  },

  getSettingByKey: <T extends SettingValue>(key: string) => {
    const state = get();
    if (!state.settings) return null;

    const setting = state.settings.results.find((item) => item.key === key);
    if (!setting) return null;

    return (setting.value as T) ?? null;
  },
}));

// Export types for use in other files
export type {
  AuthenticationMethod,
  BadgeConfig,
  BadgesAndPayments,
  ChatCredits,
  MaxChatsPerDay,
  PaymentWallConfig,
  SettingItem,
  SettingsResponse,
};
