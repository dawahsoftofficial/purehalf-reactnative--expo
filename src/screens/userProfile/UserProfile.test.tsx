import { render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { useGlobalContext } from '../../services';
import { Profile } from '../profile';
import UserProfile from './UserProfile';

jest.mock('../../services', () => ({
  useGlobalContext: jest.fn(),
}));

jest.mock('../profile', () => ({
  Profile: jest.fn(() => null),
}));

const mockUseGlobalContext = useGlobalContext as jest.Mock;
const mockProfile = Profile as jest.Mock;

describe('UserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects a self-target to the own-profile screen without fetching it as another member', async () => {
    mockUseGlobalContext.mockReturnValue({ currentUser: { id: 3306 } });
    const navigation = { replace: jest.fn() };

    render(
      <UserProfile
        navigation={navigation}
        route={{ params: { userData: { id: '3306' } } }}
      />
    );

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith('Profile')
    );
    expect(mockProfile).not.toHaveBeenCalled();
  });

  it('renders the other-member profile after both user ids are available', () => {
    mockUseGlobalContext.mockReturnValue({ currentUser: { id: 3306 } });
    const navigation = { replace: jest.fn() };
    const userData = { id: 3307 };

    render(
      <UserProfile navigation={navigation} route={{ params: { userData } }} />
    );

    expect(navigation.replace).not.toHaveBeenCalled();
    expect(mockProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        fromUserProfile: true,
        navigation,
        userData,
      }),
      undefined
    );
  });
});
