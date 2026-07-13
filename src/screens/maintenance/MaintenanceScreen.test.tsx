import { render, screen } from '@testing-library/react-native';
import moment from 'moment';
import React from 'react';

import MaintenanceScreen from './MaintenanceScreen';

let mockMaintenanceMode: {
  enabled: boolean;
  message: string;
  start_at: string | null;
  end_at: string | null;
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

jest.mock('../../services', () => ({
  ApiServices: {
    getAppSettings: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('../../stores', () => ({
  useSettingsStore: (
    selector: (state: {
      getMaintenanceMode: () => unknown;
      setSettings: () => void;
    }) => unknown
  ) =>
    selector({
      getMaintenanceMode: () => mockMaintenanceMode,
      setSettings: jest.fn(),
    }),
}));

describe('MaintenanceScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockMaintenanceMode = {
      enabled: true,
      message: 'Upgrading servers.',
      start_at: '2026-07-13T22:00',
      end_at: '2026-07-14T02:00',
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the maintenance message', () => {
    render(<MaintenanceScreen />);
    expect(screen.getByText('Upgrading servers.')).toBeTruthy();
  });

  it('omits the message line when none is set', () => {
    mockMaintenanceMode = {
      enabled: true,
      message: '',
      start_at: null,
      end_at: null,
    };
    render(<MaintenanceScreen />);
    expect(screen.queryByText('Upgrading servers.')).toBeNull();
  });

  it('renders the translated title', () => {
    render(<MaintenanceScreen />);
    expect(screen.getByText('maintenanceTitle')).toBeTruthy();
  });

  it('renders the translated window text when both start and end are set', () => {
    render(<MaintenanceScreen />);

    const start = moment(mockMaintenanceMode.start_at).format('MMM D, h:mm A');
    const end = moment(mockMaintenanceMode.end_at).format('MMM D, h:mm A');

    expect(
      screen.getByText(`maintenanceWindow:${JSON.stringify({ start, end })}`)
    ).toBeTruthy();
  });

  it('omits the window line when start or end is missing', () => {
    mockMaintenanceMode = {
      enabled: true,
      message: 'Upgrading servers.',
      start_at: '2026-07-13T22:00',
      end_at: null,
    };
    render(<MaintenanceScreen />);
    expect(screen.queryByText(/^maintenanceWindow:/)).toBeNull();
  });
});
