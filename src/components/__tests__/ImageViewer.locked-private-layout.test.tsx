import { render, waitFor } from '@testing-library/react-native';
import React from 'react';

jest.mock('react-native-linear-gradient', () => {
  const { View } = require('react-native');
  return View;
});
jest.mock('react-native-material-ripple', () => {
  const { View } = require('react-native');
  return View;
});
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
  useSafeAreaInsets: () => ({
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  }),
}));
jest.mock('react-native-swiper-flatlist', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SwiperFlatList: React.forwardRef(
      (
        props: {
          data: unknown[];
          renderItem: (params: {
            item: unknown;
            index: number;
          }) => React.ReactNode;
        },
        ref: React.Ref<unknown>
      ) => {
        React.useImperativeHandle(ref, () => ({
          scrollToIndex: jest.fn(),
        }));

        return (
          <View>
            {props.data.map((item, index) => (
              <React.Fragment key={index}>
                {props.renderItem({ item, index })}
              </React.Fragment>
            ))}
          </View>
        );
      }
    ),
  };
});
jest.mock('react-native-vector-icons/AntDesign', () => {
  const { Text } = require('react-native');
  return Text;
});
jest.mock('react-native-vector-icons/Ionicons', () => {
  const { Text } = require('react-native');
  return Text;
});
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));
jest.mock('../../global', () => ({
  Typography: {
    medium: 4.3,
    small: 3.3,
    small2: 3.8,
  },
  hp: (value: number) => value,
  wp: (value: number) => value,
}));
jest.mock('../../languages', () => ({
  CheckRtl: () => false,
  LanguageKeys: {
    loading: 'loading',
    photosAndVideos: 'photosAndVideos',
    privatePhotoAlreadyRequested: 'privatePhotoAlreadyRequested',
    privatePhotoDes: 'privatePhotoDes',
    privatePhotoDesTwo: 'privatePhotoDesTwo',
    privacyProtected: 'privacyProtected',
    requestAccess: 'requestAccess',
    sendingRequest: 'sendingRequest',
    tryAgain: 'tryAgain',
  },
}));
jest.mock('../../services', () => ({
  ApiServices: {
    privatePhotoAccessRequest: jest.fn(),
    viewPrivateMedia: jest.fn(),
  },
  useGlobalContext: () => ({
    currentUser: { id: 1 },
  }),
}));
jest.mock('../alerts', () => ({
  PrivacyProtectedAlert: () => null,
  RequestSentAlert: () => null,
}));
jest.mock('../loaders/ModalLoader', () => () => null);

import ImageViewer from '../ImageViewer';

const flattenStyle = (style: unknown) =>
  Array.isArray(style) ? Object.assign({}, ...style) : style;

describe('ImageViewer locked private photo layout', () => {
  it('centers the locked panel and single locked thumbnail rail', async () => {
    const screen = render(
      <ImageViewer
        navigation={{ goBack: jest.fn() }}
        route={{
          params: {
            userData: {
              id: 2,
              media: {
                private_photo_count: 1,
                public_gallery: [],
              },
              photo_access_action: 0,
            },
          },
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('locked-private-panel')).toBeTruthy();
    });

    expect(
      flattenStyle(screen.getByTestId('locked-private-panel').props.style)
    ).toMatchObject({
      alignItems: 'center',
      justifyContent: 'center',
    });
    expect(
      flattenStyle(screen.getByTestId('locked-private-title').props.style)
    ).toMatchObject({
      alignSelf: 'center',
      textAlign: 'center',
      width: '100%',
    });
    expect(
      flattenStyle(screen.getByTestId('thumbnail-rail').props.style)
    ).toMatchObject({
      alignSelf: 'center',
      left: undefined,
      right: undefined,
    });
    expect(
      flattenStyle(
        screen.getByTestId('thumbnail-list').props.contentContainerStyle
      )
    ).toMatchObject({
      justifyContent: 'center',
    });
  });
});
