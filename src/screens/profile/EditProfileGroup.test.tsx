import { fireEvent, render, screen } from '@testing-library/react-native';
import React, { type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

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
};

type MockTextComponent = React.ComponentType<
  ChildrenProps & { onPress?: () => void }
>;
type MockViewComponent = React.ComponentType<
  ChildrenProps & { style?: StyleProp<ViewStyle> }
>;

jest.mock('react-native-material-ripple', () => {
  const ReactActual = jest.requireActual('react') as typeof React;
  const { View: MockView } = jest.requireActual('react-native') as {
    View: MockViewComponent;
  };

  return ({ children, style }: RippleProps) =>
    ReactActual.createElement(MockView, { style }, children);
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
    notYetProvided: 'Not yet provided',
    none: 'None',
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../services', () => ({
  ApiServices: {
    getLanguages: jest.fn(),
    getNationality: jest.fn(),
  },
  flashSuccessMessage: jest.fn(),
  StorageManager: {
    setData: jest.fn(),
    storageKeys: { USER: 'USER' },
  },
  useGlobalContext: () => ({
    currentUser: { gender: 'female' },
    updateCurrentUser: jest.fn(),
  }),
}));

jest.mock('./Funtions', () => ({
  updateDetails: jest.fn(),
}));

describe('EditProfileGroup', () => {
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
                selected: {},
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
                selected: {},
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
