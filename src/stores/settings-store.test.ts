import { useSettingsStore } from './settings-store';

describe('getMaintenanceMode', () => {
  afterEach(() => {
    useSettingsStore.getState().clearSettings();
  });

  it('defaults to disabled when no settings have loaded', () => {
    expect(useSettingsStore.getState().getMaintenanceMode()).toEqual({
      enabled: false,
      message: '',
      start_at: null,
      end_at: null,
    });
  });

  it('reflects an enabled maintenance window from the settings payload', () => {
    useSettingsStore.getState().setSettings({
      message: 'ok',
      error: false,
      code: 200,
      results: [
        {
          title: 'Maintenance Mode',
          key: 'maintenance_mode',
          type: 'json',
          value: {
            enabled: true,
            message: 'Upgrading servers.',
            start_at: '2026-07-13T22:00',
            end_at: '2026-07-14T02:00',
          },
        },
      ],
    });

    expect(useSettingsStore.getState().getMaintenanceMode()).toEqual({
      enabled: true,
      message: 'Upgrading servers.',
      start_at: '2026-07-13T22:00',
      end_at: '2026-07-14T02:00',
    });
  });

  it('falls back to defaults when the setting is missing entirely', () => {
    useSettingsStore.getState().setSettings({
      message: 'ok',
      error: false,
      code: 200,
      results: [],
    });

    expect(useSettingsStore.getState().getMaintenanceMode().enabled).toBe(
      false
    );
  });
});
