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

type DailyRecommendations = {
  status: string; //"1" or "0" for enabled or disabled
  start: string;
  end: string;
};

type SubscriptionPackage = {
  revenueCatProductId: string;
  iosProductId: string;
  androidProductId: string;
  bonusChatsOnPurchase: number;
  dailyChats: number;
  defaultSelected?: boolean;
};

type ChatPack = {
  revenueCatProductId: string;
  iosProductId: string;
  androidProductId: string;
  chats: number;
};

type BoostPack = {
  revenueCatProductId: string;
  iosProductId: string;
  androidProductId: string;
  boosts: number;
};

type PackagesAndEntitlements = {
  subscriptionsMonthly: SubscriptionPackage[];
  chatPacks: ChatPack[];
  boostPacks: BoostPack[];
};

type AppLink = {
  url: string;
  icon: string;
  label: string;
};

type RatingPromptConfig = {
  enabled: boolean;
  minAccountAgeDays: number;
  minSentMessages: number;
  cooldownDays: number;
  maxPrompts: number;
  storeMinStars: number;
};

const RATING_PROMPT_DEFAULTS: RatingPromptConfig = {
  enabled: true,
  minAccountAgeDays: 7,
  minSentMessages: 15,
  cooldownDays: 60,
  maxPrompts: 3,
  storeMinStars: 4,
};

type SettingValue =
  | AuthenticationMethod
  | ChatCredits
  | boolean
  | MaxChatsPerDay
  | BadgesAndPayments
  | DailyRecommendations
  | PackagesAndEntitlements
  | RatingPromptConfig
  | AppLink[];

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
  getDailyRecommendations: () => DailyRecommendations | null;
  getPackagesAndEntitlements: () => PackagesAndEntitlements | null;
  getAppLinks: () => AppLink[] | null;
  getRatingPrompt: () => RatingPromptConfig;
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

  getDailyRecommendations: () => {
    const state = get();
    return state.getSettingByKey<DailyRecommendations>('daily_recommendations');
  },

  getPackagesAndEntitlements: () => {
    const state = get();
    return state.getSettingByKey<PackagesAndEntitlements>(
      'packages_and_entitlements'
    );
  },

  getAppLinks: () => {
    const state = get();
    return state.getSettingByKey<AppLink[]>('app_links');
  },

  getRatingPrompt: () => {
    const state = get();
    const value = state.getSettingByKey<RatingPromptConfig>('rating_prompt');
    return { ...RATING_PROMPT_DEFAULTS, ...(value ?? {}) };
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
  AppLink,
  AuthenticationMethod,
  BadgeConfig,
  BadgesAndPayments,
  BoostPack,
  ChatCredits,
  ChatPack,
  DailyRecommendations,
  MaxChatsPerDay,
  PackagesAndEntitlements,
  PaymentWallConfig,
  RatingPromptConfig,
  SettingItem,
  SettingsResponse,
  SubscriptionPackage,
};
