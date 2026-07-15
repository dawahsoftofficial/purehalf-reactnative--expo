import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import React, { type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { ApiServices, flashSuccessMessage } from '../../services';
import EditProfileGroup from './EditProfileGroup';
import { updateDetails } from './Funtions';

type ChildrenProps = {
  children?: ReactNode;
};

type LabelProps = {
  label?: ReactNode;
};

type OuterLabelProps = {
  outerLabel?: ReactNode;
};

type TextProps = {
  text?: ReactNode;
};

type ButtonProps = TextProps & {
  disabled?: boolean;
  loading?: boolean;
  loadingMessage?: ReactNode;
  onPress?: () => void;
};

type TitleProps = {
  title?: ReactNode;
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

jest.mock('../../components', () => {
  const ReactActual = jest.requireActual('react') as typeof React;
  const { Text: MockText, View: MockView } = jest.requireActual(
    'react-native'
  ) as {
    Text: MockTextComponent;
    View: MockViewComponent;
  };

  const mockButton = ({
    disabled,
    loading,
    loadingMessage,
    onPress,
    text,
  }: ButtonProps) =>
    ReactActual.createElement(
      MockView,
      null,
      loading
        ? ReactActual.createElement(MockText, null, 'button-loader')
        : null,
      ReactActual.createElement(
        MockText,
        { onPress: disabled ? undefined : onPress },
        loading && loadingMessage ? loadingMessage : text
      )
    );
  const mockContainer = ({ children }: ChildrenProps) =>
    ReactActual.createElement(MockView, null, children);
  const mockHeader = ({ title }: TitleProps) =>
    ReactActual.createElement(MockText, null, title);
  const mockIconInput = ({ label }: LabelProps) =>
    ReactActual.createElement(MockText, null, label);
  const mockPickerButton = ({ outerLabel }: OuterLabelProps) =>
    ReactActual.createElement(MockText, null, outerLabel);
  const mockTextComponent = ({ children }: ChildrenProps) =>
    ReactActual.createElement(MockText, null, children);
  const mockNullComponent = () => null;

  return {
    Button: mockButton,
    Container: mockContainer,
    Header: mockHeader,
    HeightWeightPicker: mockNullComponent,
    IconInput: mockIconInput,
    Picker: mockNullComponent,
    PickerButton: mockPickerButton,
    Text: mockTextComponent,
  };
});

jest.mock('../../languages', () => ({
  CheckRtl: () => false,
  LanguageKeys: {
    back: 'Back',
    next: 'Next',
    skip: 'Skip',
    update: 'Update',
    updating: 'Updating',
    updated: 'Updated',
    notYetProvided: 'Not yet provided',
    none: 'None',
    visibleOnProfile: 'Shown on your profile',
    hiddenOnProfile: 'Hidden from your profile',
    hideField: 'Hide it',
    unhideField: 'Unhide it',
    fieldHiddenToast: 'fieldHiddenToast',
    fieldVisibleToast: 'fieldVisibleToast',
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../services', () => ({
  ApiServices: {
    getLanguages: jest.fn(),
    getNationality: jest.fn(),
    updateProfilePrivacy: jest.fn(),
  },
  flashSuccessMessage: jest.fn(),
  StorageManager: {
    setData: jest.fn(),
    storageKeys: { USER: 'USER' },
  },
  useGlobalContext: () => ({
    currentUser: {
      gender: 'female',
      detail: { profile_field_visibility: {} },
    },
    updateCurrentUser: jest.fn(),
  }),
}));

jest.mock('./Funtions', () => ({
  updateDetails: jest.fn(),
}));

describe('EditProfileGroup', () => {
  beforeEach(() => {
    (ApiServices.updateProfilePrivacy as jest.Mock).mockReset();
    (ApiServices.updateProfilePrivacy as jest.Mock).mockResolvedValue({
      profile_field_visibility: {},
    });
  });

  it('does not repeat the section title in the progress label', () => {
    render(
      <EditProfileGroup
        navigation={{ goBack: jest.fn() }}
        route={{
          params: {
            title: 'Family Background',
            data: [
              {
                title: 'Ethnicity',
                data: [
                  { id: 1, value: 'A' },
                  { id: 2, value: 'B' },
                  { id: 3, value: 'C' },
                  { id: 4, value: 'D' },
                  { id: 5, value: 'E' },
                  { id: 6, value: 'F' },
                ],
                type: 'dropDown',
                id: 'ethnicity-0',
                selected: {},
                category: 'family-0',
                apiKey: 'ethnicity_id',
              },
              { title: 'Language', type: 'dropDown', id: 'language' },
              { title: 'Nationality', type: 'dropDown', id: 'nationality' },
              { title: 'Caste', type: 'input', id: 'caste-0' },
            ],
          },
        }}
      />
    );

    expect(screen.queryByText('Family Background - 1 of 4')).toBeNull();
  });

  it('shows a picker question title only once', () => {
    render(
      <EditProfileGroup
        navigation={{ goBack: jest.fn() }}
        route={{
          params: {
            title: 'Family Background',
            data: [
              {
                title: 'Ethnicity',
                data: [
                  { id: 1, value: 'A' },
                  { id: 2, value: 'B' },
                  { id: 3, value: 'C' },
                  { id: 4, value: 'D' },
                  { id: 5, value: 'E' },
                  { id: 6, value: 'F' },
                ],
                type: 'dropDown',
                id: 'ethnicity-0',
                selected: {},
                category: 'family-0',
                apiKey: 'ethnicity_id',
              },
            ],
          },
        }}
      />
    );

    expect(screen.getAllByText('Ethnicity')).toHaveLength(1);
  });

  it('shows an input question title only once', () => {
    render(
      <EditProfileGroup
        navigation={{ goBack: jest.fn() }}
        route={{
          params: {
            title: 'Lifestyle',
            data: [
              {
                title: 'Profession',
                type: 'input',
                id: 'profession-0',
                selected: {},
                category: 'lifestyle-0',
                apiKey: 'profession',
              },
            ],
          },
        }}
      />
    );

    expect(screen.getAllByText('Profession')).toHaveLength(1);
  });

  it('shows a scale question title only once', () => {
    render(
      <EditProfileGroup
        navigation={{ goBack: jest.fn() }}
        route={{
          params: {
            title: 'Appearance & Health',
            data: [
              {
                title: 'Height',
                data: [{ scale: 'cm', values: [160, 170] }],
                type: 'scalling',
                id: 'height-0',
                selected: {},
                category: 'appearance-0',
                apiKey: 'height',
              },
            ],
          },
        }}
      />
    );

    expect(screen.getAllByText('Height')).toHaveLength(1);
  });

  it('updates field privacy from the Hide it pill beside Height', async () => {
    (ApiServices.updateProfilePrivacy as jest.Mock).mockResolvedValue({
      profile_field_visibility: { height: 'private' },
    });

    render(
      <EditProfileGroup
        navigation={{ goBack: jest.fn() }}
        route={{
          params: {
            title: 'Appearance & Health',
            data: [
              {
                title: 'Height',
                data: [{ scale: 'cm', values: [160, 170] }],
                type: 'scalling',
                id: 'height',
                selected: { scale: 'cm', value: 170 },
                category: 'appearance-0',
                apiKey: 'height',
              },
            ],
          },
        }}
      />
    );

    fireEvent.press(screen.getByTestId('profile-privacy-toggle-height'));

    await waitFor(() =>
      expect(ApiServices.updateProfilePrivacy).toHaveBeenCalledWith({
        visibility: { height: 'private' },
      })
    );
    // Feedback is the persistent inline status text next to the toggle, not
    // a toast -- a toast interpolating the raw (untranslated) field id was
    // confusing (tester note #25).
    expect(flashSuccessMessage).not.toHaveBeenCalled();
    expect(screen.getByText('Hidden from your profile')).toBeTruthy();
  });

  it('shows a tag question title only once', () => {
    render(
      <EditProfileGroup
        navigation={{ goBack: jest.fn() }}
        route={{
          params: {
            title: 'Appearance & Health',
            data: [
              {
                title: 'Disabilities',
                data: [
                  { id: 1, value: 'None' },
                  { id: 2, value: 'Deaf' },
                ],
                type: 'dropDown',
                id: 'dis-0',
                selected: { id: 1, value: 'None' },
                category: 'appearance-0',
                apiKey: 'disability_id',
              },
            ],
          },
        }}
      />
    );

    expect(screen.getAllByText('Disabilities')).toHaveLength(1);
  });

  it('shows a save status without using the button spinner', async () => {
    (updateDetails as jest.Mock).mockReturnValue(new Promise(() => undefined));

    render(
      <EditProfileGroup
        navigation={{ goBack: jest.fn() }}
        route={{
          params: {
            title: 'Appearance & Health',
            data: [
              {
                title: 'Disabilities',
                data: [
                  { id: 1, value: 'None' },
                  { id: 2, value: 'Deaf' },
                ],
                type: 'dropDown',
                id: 'dis-0',
                selected: { id: 1, value: 'None' },
                category: 'appearance-0',
                apiKey: 'disability_id',
              },
            ],
          },
        }}
      />
    );

    fireEvent.press(screen.getByText('Update'));

    expect((await screen.findAllByText('Updating')).length).toBeGreaterThan(0);
    expect(screen.queryByText('button-loader')).toBeNull();
  });
});
