/**
 * TypeScript types for User API endpoints
 * Based on API response specifications
 */

/**
 * FCM Token object
 */
export type FcmToken = {
  id: number;
  tokenable_type: string;
  tokenable_id: number;
  fcm_token: string;
  app_version: string | null;
  device_type: number;
  status: number;
  is_tester: boolean;
  tester_can_view_private_media: boolean;
  tester_is_invisible: boolean;
  tester_force_recommendations: boolean;
  tester_show_all_badges: boolean;
  tester_show_testers_in_daily_recommendations: boolean;
  tester_show_testers_on_top: boolean;
  device_word: string;
};

/**
 * User Media object
 */
export type UserMedia = {
  id: number;
  user_id: number;
  primary_image: string;
  un_blur_primary_image: string;
  cover_image: string | null;
  intro_video: string | null;
  intro_video_status: IntroMediaStatus;
  intro_video_rejection_reason: string | null;
  intro_voice: string | null;
  intro_voice_status: IntroMediaStatus;
  intro_voice_rejection_reason: string | null;
  youtube_url: string | null;
  public_gallery: string[] | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  private_photo_count: number | null;
};

export type IntroMediaStatus = 'pending' | 'approved' | 'rejected' | null;

/**
 * User Detail object (can be null)
 */
export type UserDetail = {
  tagline?: string;
  family_plan_id?: number;
  marriage_plan_id?: number;
  relocation_plan_id?: number;
  personality_id?: number[];
  interest_id?: string[];
  height_scale?: string;
  height_display_scale?: string;
  height?: number;
  weight_scale?: string;
  weight?: number;
  personality_id_value?: unknown;
  interest_id_value?: unknown;
  [key: string]: unknown;
};

/**
 * Guardian object (can be null)
 */
export type Guardian = {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone_number: string;
  relationship: string;
  [key: string]: unknown;
};

/**
 * Latest Transaction object (can be null)
 */
export type LatestTransaction = {
  id: number;
  user_id: number;
  transaction_type: string;
  amount: number;
  status: string;
  created_at: string;
  [key: string]: unknown;
};

/**
 * Current User Detail object (from /auth/my/detail endpoint)
 */
export type CurrentUserDetail = {
  id: number;
  is_tester: boolean;
  tester_mode_enabled: boolean;
  tester_can_view_private_media: boolean;
  tester_is_invisible: boolean;
  tester_force_recommendations: boolean;
  tester_show_all_badges: boolean;
  tester_show_testers_in_daily_recommendations: boolean;
  tester_show_testers_on_top: boolean;
  is_approved: boolean | null;
  rejection_reason: string | null;
  recommend_api_hit_at: string;
  otp: string | null;
  otp_expired_at: string | null;
  otp_verified_at: string | null;
  agent_id: number | null;
  first_name: string;
  last_name: string;
  email: string;
  email_notification: number;
  sms_notification: number;
  fcm_subscribe: number;
  status: number;
  date_of_birth: string;
  phone_number: string;
  gender: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  interface_language_id: number;
  last_online_at: string;
  banned_at: string | null;
  purpose_of_leaving: string | null;
  membership_status: number | null;
  membership_priority: number;
  membership_expiry: string | null;
  membership_product_data: unknown | null;
  search_visibility: number;
  disallowed_phone_numbers: string | null;
  in_app_notifications: number;
  is_chat_reported: number;
  is_blur: number;
  chat_credits: number;
  daily_chat_credits_limit: number;
  daily_chat_credits_used: number;
  last_chat_credit_collected_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  email_otp: string | null;
  is_top_priority: number;
  reviewed_top_picks: unknown | null;
  full_name: string;
  age: number;
  match_percentage: number | null;
  user_unique_id: number;
  distance: number | null;
  unread_conversations_count: number;
  unread_messages_count: number;
  primary_image_to_show: string;
  detail: UserDetail | null;
  media: UserMedia;
  fcm_token: FcmToken[];
  guardian: Guardian | null;
  latest_transaction: LatestTransaction | null;
};

/**
 * Get Current User Detail API Response
 */
export type GetCurrentUserDetailResponse = {
  message: string;
  error: boolean;
  code: number;
  results: CurrentUserDetail;
};
