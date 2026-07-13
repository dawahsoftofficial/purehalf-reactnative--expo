import { render, screen } from '@testing-library/react-native';
import React from 'react';

import MaintenanceScreen from './MaintenanceScreen';

let mockMaintenanceMode: {
  enabled: boolean;
  message: string;
  start_at: string | null;
  end_at: string | null;
};

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
});
