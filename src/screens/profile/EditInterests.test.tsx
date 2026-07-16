import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import React, { type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { ApiServices } from '../../services';
import EditInterests from './EditInterests';

type ChildrenProps = { children?: ReactNode };
type TextProps = { text?: ReactNode };
type TitleProps = { title?: ReactNode };
type ButtonProps = TextProps & {
  disabled?: boolean;
  loading?: boolean;
  loadingMessage?: ReactNode;
  onPress?: () => void;
};
type RippleProps = ChildrenProps & {
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};
type MockTextComponent = React.ComponentType<
  ChildrenProps & { onPress?: () => void }
>;
type MockViewComponent = React.ComponentType<
  ChildrenProps & {
    style?: StyleProp<ViewStyle>;
    testID?: string;
    onPress?: () => void;
  }
>;

// Stable spy so the test can assert exactly what gets written back to context.
const mockUpdateCurrentUser = jest.fn();

jest.mock('react-native-material-ripple', () => {
  const ReactActual = jest.requireActual('react') as typeof React;
  const { View: MockView } = jest.requireActual('react-native') as {
    View: MockViewComponent;
  };
  return ({ children, style, testID, onPress, disabled }: RippleProps) =>
    ReactActual.createElement(
      MockView,
      { style, testID, onPress: disabled ? undefined : onPress },
      children
    );
});

jest.mock('react-native-vector-icons/Entypo', () => () => null);

jest.mock('../../components', () => {
  const ReactActual = jest.requireActual('react') as typeof React;
  const { Text: MockText, View: MockView } = jest.requireActual(
    'react-native'
  ) as { Text: MockTextComponent; View: MockViewComponent };

  const mockButton = ({ disabled, onPress, text }: ButtonProps) =>
    ReactActual.createElement(
      MockText,
      { onPress: disabled ? undefined : onPress },
      text
    );
  const mockContainer = ({ children }: ChildrenProps) =>
    ReactActual.createElement(MockView, null, children);
  const mockHeader = ({ title }: TitleProps) =>
    ReactActual.createElement(MockText, null, title);
  const mockText = ({ children }: ChildrenProps) =>
    ReactActual.createElement(MockText, null, children);

  return {
    Button: mockButton,
    Container: mockContainer,
    Header: mockHeader,
    Text: mockText,
  };
});

jest.mock('../../global', () => ({
  hp: () => 1,
  wp: () => 1,
  Typography: {},
}));

jest.mock('../../res', () => ({ Colors: {}, Fonts: {} }));

jest.mock('../../lib/utils/profile-utils', () => ({
  stripLeadingEmoji: (value: string) => value,
}));

jest.mock('../../languages', () => ({
  CheckRtl: () => false,
  LanguageKeys: {
    myInterestAndHobbies: 'Passions and hobbies',
    interestAndHobbiesLimit: 'Up to 10 items are allowed',
    update: 'Update',
    updating: 'Updating',
    hideField: 'Hide it',
    unhideField: 'Unhide it',
  },
}));

jest.mock('./Funtions', () => ({ updateDetails: jest.fn() }));

jest.mock('../../services', () => ({
  ApiServices: { updateProfilePrivacy: jest.fn() },
  flashErrorMessage: jest.fn(),
  flashSuccessMessage: jest.fn(),
  StorageManager: { setData: jest.fn(), storageKeys: { USER: 'USER' } },
  useGlobalContext: () => ({
    currentUser: {
      detail: { profile_field_visibility: { height: 'private' } },
    },
    updateCurrentUser: mockUpdateCurrentUser,
  }),
}));

describe('EditInterests privacy toggle', () => {
  beforeEach(() => {
    mockUpdateCurrentUser.mockReset();
    (ApiServices.updateProfilePrivacy as jest.Mock).mockReset();
  });

  const renderScreen = () =>
    render(
      <EditInterests
        navigation={{ goBack: jest.fn() }}
        route={{ params: { data: [{ id: 'a', value: 'Reading' }] } }}
      />
    );

  it('keeps interest_id private in context even when the API omits it from the returned map', async () => {
    // Reproduces the reported bug: the endpoint returns 200 but its
    // profile_field_visibility map does NOT echo interest_id, so a blind
    // replace of the local map dropped the change and re-opening the screen
    // showed "Hide it" again.
    (ApiServices.updateProfilePrivacy as jest.Mock).mockResolvedValue({
      profile_field_visibility: { height: 'private' },
    });

    renderScreen();
    fireEvent.press(screen.getByTestId('profile-privacy-toggle-interest_id'));

    await waitFor(() =>
      expect(ApiServices.updateProfilePrivacy).toHaveBeenCalledWith({
        visibility: { interest_id: 'private' },
      })
    );
    await waitFor(() => expect(mockUpdateCurrentUser).toHaveBeenCalled());

    const written = mockUpdateCurrentUser.mock.calls[0][0];
    expect(written.detail.profile_field_visibility).toEqual({
      height: 'private',
      interest_id: 'private',
    });
  });

  it('shows the Unhide it label after hiding', async () => {
    (ApiServices.updateProfilePrivacy as jest.Mock).mockResolvedValue({
      profile_field_visibility: {},
    });

    renderScreen();
    expect(screen.getByText('Hide it')).toBeTruthy();

    fireEvent.press(screen.getByTestId('profile-privacy-toggle-interest_id'));

    expect(await screen.findByText('Unhide it')).toBeTruthy();
  });
});
