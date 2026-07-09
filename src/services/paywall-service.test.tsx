const mockNavigate = jest.fn();
const mockIsReady = jest.fn();

jest.mock('../navigation/RootNavigation', () => ({
  navigationRef: {
    isReady: () => mockIsReady(),
    navigate: (...args: unknown[]) => mockNavigate(...args),
  },
}));

jest.mock('react-native-purchases', () => ({
  getOfferings: jest.fn(),
}));

jest.mock('react-native-purchases-ui', () => ({
  PAYWALL_RESULT: {
    PURCHASED: 'PURCHASED',
  },
  presentPaywall: jest.fn(),
}));

import { presentChatCreditsPaywall } from './paywall-service';

describe('presentChatCreditsPaywall', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsReady.mockReturnValue(true);
  });

  it('resolves with success when the native paywall completes a purchase', async () => {
    const resultPromise = presentChatCreditsPaywall();

    expect(mockNavigate).toHaveBeenCalledWith(
      'ChatCreditsPaywall',
      expect.objectContaining({
        onComplete: expect.any(Function),
      })
    );

    const [, params] = mockNavigate.mock.calls[0];
    params.onComplete({ success: true });

    await expect(resultPromise).resolves.toEqual({ success: true });
  });

  it('resolves with cancellation when the native paywall closes without purchase', async () => {
    const resultPromise = presentChatCreditsPaywall();
    const [, params] = mockNavigate.mock.calls[0];

    params.onComplete({
      success: false,
      error: 'Purchase cancelled by user',
    });

    await expect(resultPromise).resolves.toEqual({
      success: false,
      error: 'Purchase cancelled by user',
    });
  });

  it('returns a failed result when navigation is not ready', async () => {
    mockIsReady.mockReturnValue(false);

    await expect(presentChatCreditsPaywall()).resolves.toEqual({
      success: false,
      error: 'Navigation is not ready',
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
