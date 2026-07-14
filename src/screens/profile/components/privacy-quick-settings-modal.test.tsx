import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import React, { type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { ApiServices } from '../../../services';
import PrivacyQuickSettingsModal from './privacy-quick-settings-modal';

type ChildrenProps = { children?: ReactNode };
type TextProps = { text?: ReactNode };
type ButtonProps = TextProps & { onPress?: () => void };
type RippleProps = ChildrenProps & {
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityState?: { selected?: boolean; disabled?: boolean };
};
type SwitchProps = {
  value?: boolean;
  onValueChange?: (next: boolean) => void;
  disabled?: boolean;
  testID?: string;
};

let mockCurrentUser: any;
const mockUpdateCurrentUser = jest.fn();

jest.mock('react-native-material-ripple', () => {
  const ReactActual = jest.requireActual('react') as typeof React;
  const { View: MockView } = jest.requireActual('react-native') as {
    View: React.ComponentType<any>;
  };

  return ({
    children,
    style,
    testID,
    onPress,
    disabled,
    accessibilityState,
  }: RippleProps) =>
    ReactActual.createElement(
      MockView,
      {
        style,
        testID,
        accessibilityState,
        onPress: disabled ? undefined : onPress,
      },
      children
    );
});

jest.mock('react-native-switch', () => {
  const ReactActual = jest.requireActual('react') as typeof React;
  const { Pressable: MockPressable } = jest.requireActual('react-native') as {
    Pressable: React.ComponentType<any>;
  };

  return {
    Switch: ({ value, onValueChange, disabled, testID }: SwitchProps) =>
      ReactActual.createElement(MockPressable, {
        testID,
        accessibilityState: { checked: value, disabled },
        onPress: disabled ? undefined : () => onValueChange?.(!value),
      }),
  };
});

jest.mock('../../../components', () => {
  const ReactActual = jest.requireActual('react') as typeof React;
  const { Text: MockText, View: MockView } = jest.requireActual(
    'react-native'
  ) as { Text: React.ComponentType<any>; View: React.ComponentType<any> };

  const mockButton = ({ onPress, text }: ButtonProps) =>
    ReactActual.createElement(MockText, { onPress }, text);
  const mockTextComponent = ({
    children,
    style,
  }: ChildrenProps & { style?: unknown }) =>
    ReactActual.createElement(MockText, { style }, children);

  return { Button: mockButton, Text: mockTextComponent };
});

jest.mock('../../../languages', () => ({
  CheckRtl: () => false,
  LanguageKeys: {
    privacySettings: 'Privacy settings',
    privacyQuickSettingsIntro: 'privacyQuickSettingsIntro',
    invisibleMode: 'invisibleMode',
    invisibleModeDesc: 'invisibleModeDesc',
    chooseAnOption: 'chooseAnOption',
    profileVisibilityEveryone: 'profileVisibilityEveryone',
    profileVisibilityEveryoneDesc: 'profileVisibilityEveryoneDesc',
    profileVisibilityLiked: 'profileVisibilityLiked',
    profileVisibilityLikedDesc: 'profileVisibilityLikedDesc',
    profileVisibilityNobody: 'profileVisibilityNobody',
    profileVisibilityNobodyDesc: 'profileVisibilityNobodyDesc',
    understood: 'Understood',
  },
}));

jest.mock('../../../services', () => ({
  ApiServices: {
    updateProfilePrivacy: jest.fn(),
    updateUserInfo: jest.fn(),
  },
  StorageManager: {
    setData: jest.fn(),
    storageKeys: { USER: 'USER' },
  },
  useGlobalContext: () => ({
    currentUser: mockCurrentUser,
    updateCurrentUser: mockUpdateCurrentUser,
  }),
}));

describe('PrivacyQuickSettingsModal', () => {
  beforeEach(() => {
    mockCurrentUser = {
      search_visibility: 1,
      first_name: 'Amina',
      last_name: 'Yusuf',
      gender: 'female',
      date_of_birth: '01 Jan,1998',
      interface_language_id: 1,
      country: 'Pakistan',
      city: 'Islamabad',
      latitude: 33.6,
      longitude: 73.0,
      detail: { profile_visibility: 'everyone' },
    };
    mockUpdateCurrentUser.mockReset();
    (ApiServices.updateUserInfo as jest.Mock).mockReset().mockResolvedValue({});
    (ApiServices.updateProfilePrivacy as jest.Mock)
      .mockReset()
      .mockResolvedValue({ profile_visibility: 'nobody' });
  });

  it('turns Invisible mode on by sending search_visibility 0 with the current profile snapshot', async () => {
    render(<PrivacyQuickSettingsModal visible onClose={jest.fn()} />);

    fireEvent.press(screen.getByTestId('quick-privacy-invisible-mode-switch'));

    await waitFor(() =>
      expect(ApiServices.updateUserInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          search_visibility: 0,
          first_name: 'Amina',
          last_name: 'Yusuf',
          gender: 'female',
          country: 'Pakistan',
          city: 'Islamabad',
        })
      )
    );
    await waitFor(() =>
      expect(mockUpdateCurrentUser).toHaveBeenCalledWith(
        expect.objectContaining({ search_visibility: 0 })
      )
    );
  });

  it('selects "hide completely" by sending profile_visibility nobody', async () => {
    render(<PrivacyQuickSettingsModal visible onClose={jest.fn()} />);

    fireEvent.press(screen.getByTestId('quick-privacy-visibility-nobody'));

    await waitFor(() =>
      expect(ApiServices.updateProfilePrivacy).toHaveBeenCalledWith({
        profile_visibility: 'nobody',
      })
    );
    expect(
      screen.getByTestId('quick-privacy-visibility-nobody').props
        .accessibilityState.selected
    ).toBe(true);
  });

  it('reverts the selection if the API call fails', async () => {
    (ApiServices.updateProfilePrivacy as jest.Mock).mockRejectedValue(
      new Error('network')
    );

    render(<PrivacyQuickSettingsModal visible onClose={jest.fn()} />);

    fireEvent.press(screen.getByTestId('quick-privacy-visibility-nobody'));

    await waitFor(() =>
      expect(ApiServices.updateProfilePrivacy).toHaveBeenCalled()
    );
    await waitFor(() =>
      expect(
        screen.getByTestId('quick-privacy-visibility-nobody').props
          .accessibilityState.selected
      ).toBe(false)
    );
    expect(
      screen.getByTestId('quick-privacy-visibility-everyone').props
        .accessibilityState.selected
    ).toBe(true);
    expect(mockUpdateCurrentUser).not.toHaveBeenCalled();
  });
});
