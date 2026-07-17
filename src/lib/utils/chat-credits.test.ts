import { CREDITS_PER_CHAT, creditsToChats } from './chat-credits';

describe('creditsToChats', () => {
  it('converts the default completion gift to the chats it actually buys', () => {
    // The profile_completion_gift_credits setting is 150 raw credits. The
    // claim modal used to interpolate that raw 150 into "Claim {{amount}} free
    // chats", advertising fifty times what the gift is worth.
    expect(creditsToChats(150)).toBe(3);
  });

  it('rounds down — a partial chat is not a chat', () => {
    expect(creditsToChats(149)).toBe(2);
    expect(creditsToChats(49)).toBe(0);
  });

  it('never reports a negative balance', () => {
    expect(creditsToChats(-50)).toBe(0);
  });

  it('treats a missing balance as zero', () => {
    expect(creditsToChats(null)).toBe(0);
    expect(creditsToChats(undefined)).toBe(0);
  });

  it('matches the backend CHAT_CREDIT_MULTIPLIER', () => {
    expect(CREDITS_PER_CHAT).toBe(50);
  });
});
