import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import { ProfileBadges } from './profile-badges';

let mockBadgeSettings: any = null;
let mockCurrentUser: any = null;

jest.mock('../assets/svgs/badges/new-badge.svg', () => 'NewBadgeIcon');
jest.mock('../assets/svgs/badges/popular-badge.svg', () => 'PopularBadgeIcon');
jest.mock(
  '../assets/svgs/badges/profile-complete-badge.svg',
  () => 'ProfileCompleteBadgeIcon'
);
jest.mock('../assets/svgs/badges/vip-badge.svg', () => 'VipBadgeIcon');

jest.mock('../services', () => ({
  StorageManager: {
    getData: jest.fn(),
    storageKeys: {
      PROFILE_DETAIL_LOCAL: 'PROFILE_DETAIL_LOCAL',
    },
  },
  useGlobalContext: () => ({
    currentUser: mockCurrentUser,
  }),
}));

jest.mock('../stores', () => ({
  usePremiumStore: (
    selector: (state: { isPremium: () => boolean }) => unknown
  ) => selector({ isPremium: () => false }),
  useSettingsStore: (
    selector: (state: {
      settings: unknown;
      getBadgesAndPayments: () => unknown;
    }) => unknown
  ) =>
    selector({
      settings: mockBadgeSettings
        ? {
            results: [{ key: 'badges_and_payments', value: mockBadgeSettings }],
          }
        : null,
      getBadgesAndPayments: () => mockBadgeSettings,
    }),
}));

const completeUser = {
  id: 1,
  primary_image_to_show: 'https://example.com/photo.jpg',
  media: {
    primary_image_to_show: 'https://example.com/photo.jpg',
  },
  detail: {
    tagline: 'RN dev',
    family_plan_id: 1,
    marriage_plan_id: 1,
    relocation_plan_id: 1,
    personality_id: [1],
  },
};

describe('ProfileBadges', () => {
  beforeEach(() => {
    mockBadgeSettings = null;
    mockCurrentUser = null;
  });

  it('renders the detail header badge as a compact text pill', async () => {
    render(<ProfileBadges userData={completeUser} variant="pill" />);

    expect(await screen.findByText('Complete')).toBeTruthy();

    expect(screen.getByTestId('profile-badges-pill')).toBeTruthy();
  });

  it('keeps icon-only badges textless for profile list overlays', async () => {
    render(<ProfileBadges userData={completeUser} iconOnly vertical />);

    await waitFor(() => expect(screen.queryByText('Complete')).toBeNull());
  });

  it('honors the global badge enabled control', async () => {
    mockBadgeSettings = {
      badges: {
        completedProfile: {
          enabled: false,
          visibility: { singleProfile: true },
        },
      },
    };

    render(<ProfileBadges userData={completeUser} variant="pill" />);

    await waitFor(() => expect(screen.queryByText('Complete')).toBeNull());
  });

  it('honors the visibility control for the current surface', async () => {
    mockBadgeSettings = {
      badges: {
        completedProfile: {
          enabled: true,
          visibility: { homeRecommended: false },
        },
      },
    };

    render(
      <ProfileBadges
        userData={completeUser}
        variant="pill"
        surface="homeRecommended"
      />
    );

    await waitFor(() => expect(screen.queryByText('Complete')).toBeNull());
  });

  it('shows New for an account inside the configured age window', async () => {
    mockBadgeSettings = {
      badges: {
        newMember: {
          enabled: true,
          maxAccountAgeDays: 7,
          visibility: { singleProfile: true },
        },
      },
    };

    render(
      <ProfileBadges
        userData={{
          id: 2,
          created_at: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
        }}
        variant="pill"
      />
    );

    expect(await screen.findByText('New')).toBeTruthy();
  });

  it('forces every badge on tester profiles for an authorized tester', async () => {
    mockCurrentUser = {
      id: 99,
      is_tester: true,
      tester_mode_enabled: true,
      tester_show_all_badges: true,
    };
    mockBadgeSettings = {
      badges: {
        vipMember: { enabled: false, visibility: { singleProfile: false } },
        boosted: { enabled: false, visibility: { singleProfile: false } },
        completedProfile: {
          enabled: false,
          visibility: { singleProfile: false },
        },
        newMember: { enabled: false, visibility: { singleProfile: false } },
      },
    };

    render(
      <ProfileBadges userData={{ id: 2, is_tester: true }} variant="pill" />
    );

    expect(await screen.findByText('VIP')).toBeTruthy();
    expect(screen.getByText('Boosted')).toBeTruthy();
    expect(screen.getByText('Complete')).toBeTruthy();
    expect(screen.getByText('New')).toBeTruthy();
  });

  it('does not force badges when server tester mode is disabled', async () => {
    mockCurrentUser = {
      id: 99,
      is_tester: true,
      tester_mode_enabled: false,
      tester_show_all_badges: true,
    };
    mockBadgeSettings = {
      badges: {
        vipMember: { enabled: false, visibility: { singleProfile: false } },
        boosted: { enabled: false, visibility: { singleProfile: false } },
        completedProfile: {
          enabled: false,
          visibility: { singleProfile: false },
        },
        newMember: { enabled: false, visibility: { singleProfile: false } },
      },
    };

    render(
      <ProfileBadges userData={{ id: 2, is_tester: true }} variant="pill" />
    );

    await waitFor(() => expect(screen.queryByText('VIP')).toBeNull());
    expect(screen.queryByText('Boosted')).toBeNull();
    expect(screen.queryByText('Complete')).toBeNull();
    expect(screen.queryByText('New')).toBeNull();
  });
});
