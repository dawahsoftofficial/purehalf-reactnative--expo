// Raw chat_credits are stored at 50 per chat (the backend's
// CHAT_CREDIT_MULTIPLIER). Everything the user sees is expressed in chats, so
// every raw balance or grant has to come through here — a hardcoded /50 in one
// place and a raw value in another is what made the completion gift read as
// "150 free chats" on the confirm step and "+3 Chats" on the success step.
export const CREDITS_PER_CHAT = 50;

export const creditsToChats = (credits: number | null | undefined): number =>
  Math.max(0, Math.floor((credits ?? 0) / CREDITS_PER_CHAT));
