export type FieldVisibilityLevel = 'public' | 'private';
export type ProfileFieldVisibility = Record<string, FieldVisibilityLevel>;
export type ProfileVisibility = 'everyone' | 'active_chat' | 'liked' | 'nobody';

const PROFILE_FIELD_ALIASES: Record<string, string> = {
  language: 'language_id',
  nationality: 'nationality_id',
};

export const normalizeProfilePrivacyKey = (apiKey?: string) =>
  apiKey ? (PROFILE_FIELD_ALIASES[apiKey] ?? apiKey) : '';

export type ProfilePrivacyUpdate = {
  visibility?: ProfileFieldVisibility;
  profile_visibility?: ProfileVisibility;
};

export type ProfilePrivacyResponse = {
  profile_field_visibility?: ProfileFieldVisibility;
  profile_visibility?: ProfileVisibility;
};
