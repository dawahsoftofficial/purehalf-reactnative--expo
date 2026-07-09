import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import { ProfileBadges } from './profile-badges';

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
    currentUser: null,
  }),
}));

jest.mock('../stores', () => ({
  usePremiumStore: (
    selector: (state: { isPremium: () => boolean }) => unknown
  ) => selector({ isPremium: () => false }),
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
  it('renders the detail header badge as a compact text pill', async () => {
    render(<ProfileBadges userData={completeUser} variant="pill" />);

    expect(await screen.findByText('Complete')).toBeTruthy();

    expect(screen.getByTestId('profile-badges-pill')).toBeTruthy();
  });

  it('keeps icon-only badges textless for profile list overlays', async () => {
    render(<ProfileBadges userData={completeUser} iconOnly vertical />);

    await waitFor(() => expect(screen.queryByText('Complete')).toBeNull());
  });
});
