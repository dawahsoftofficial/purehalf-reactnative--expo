import { fireEvent, render, screen } from '@testing-library/react-native';
import React, { type ReactNode } from 'react';

import ProfileGiftInfoModal from './profile-gift-info-modal';

type ChildrenProps = { children?: ReactNode };
type ButtonProps = { text?: ReactNode; onPress?: () => void };

jest.mock('i18next', () => ({
  t: (key: string, opts?: Record<string, unknown>) =>
    opts
      ? `${key}|${Object.entries(opts)
          .map(([k, v]) => `${k}=${v}`)
          .join(',')}`
      : key,
}));

jest.mock('../../../components', () => {
  const ReactActual = jest.requireActual('react') as typeof React;
  const { Text: MockText } = jest.requireActual('react-native') as {
    Text: React.ComponentType<any>;
  };

  return {
    Button: ({ onPress, text }: ButtonProps) =>
      ReactActual.createElement(MockText, { onPress }, text),
    Text: ({ children, style }: ChildrenProps & { style?: unknown }) =>
      ReactActual.createElement(MockText, { style }, children),
  };
});

// '../../../global' (Constants.tsx) requires '../services', whose barrel
// pulls in session.ts -> react-native-purchases. Under jest that resolves to
// react-native-purchases' browser bundle, which ships syntax jest's transform
// can't parse. Stubbing the services barrel here (same fix
// privacy-quick-settings-modal.test.tsx uses) keeps that unrelated chain from
// ever loading; Constants.tsx only reads the (now-undefined, falsy) isIOS.
jest.mock('../../../services', () => ({}));

jest.mock('../../../languages', () => ({
  LanguageKeys: {
    giftInfoTitle: 'giftInfoTitle',
    giftInfoBody: 'giftInfoBody',
    giftStartNow: 'giftStartNow',
    giftClaimedTitle: 'giftClaimedTitle',
    giftClaimedBody: 'giftClaimedBody',
    maybeLater: 'maybeLater',
    gotIt: 'gotIt',
  },
}));

describe('ProfileGiftInfoModal', () => {
  const baseProps = {
    visible: true,
    percent: 90,
    credits: 150,
    onClose: jest.fn(),
    onStart: jest.fn(),
  };

  beforeEach(() => {
    baseProps.onClose.mockReset();
    baseProps.onStart.mockReset();
  });

  describe('locked variant', () => {
    it('explains the gift, passing the threshold and credits to the copy', () => {
      render(<ProfileGiftInfoModal {...baseProps} variant="locked" />);

      expect(screen.getByText('giftInfoTitle')).toBeTruthy();
      expect(
        screen.getByText('giftInfoBody|percent=90,credits=150')
      ).toBeTruthy();
    });

    it('starts the profile flow via onStart, not onClose', () => {
      render(<ProfileGiftInfoModal {...baseProps} variant="locked" />);

      fireEvent.press(screen.getByText('giftStartNow'));

      expect(baseProps.onStart).toHaveBeenCalledTimes(1);
      expect(baseProps.onClose).not.toHaveBeenCalled();
    });

    it('dismisses via Maybe Later without starting the flow', () => {
      render(<ProfileGiftInfoModal {...baseProps} variant="locked" />);

      fireEvent.press(screen.getByText('maybeLater'));

      expect(baseProps.onClose).toHaveBeenCalledTimes(1);
      expect(baseProps.onStart).not.toHaveBeenCalled();
    });
  });

  describe('claimed variant', () => {
    it('confirms the claim and offers no way to restart the flow', () => {
      render(<ProfileGiftInfoModal {...baseProps} variant="claimed" />);

      expect(screen.getByText('giftClaimedTitle')).toBeTruthy();
      expect(screen.getByText('giftClaimedBody|credits=150')).toBeTruthy();
      expect(screen.queryByText('giftStartNow')).toBeNull();
      expect(screen.queryByText('maybeLater')).toBeNull();
    });

    it('dismisses via Got it', () => {
      render(<ProfileGiftInfoModal {...baseProps} variant="claimed" />);

      fireEvent.press(screen.getByText('gotIt'));

      expect(baseProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('renders nothing while not visible', () => {
    render(
      <ProfileGiftInfoModal {...baseProps} variant="locked" visible={false} />
    );

    expect(screen.queryByText('giftInfoTitle')).toBeNull();
  });
});
