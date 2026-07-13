import moment from 'moment';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, Text as RNText, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { hp, wp } from '../../global';
import { Colors, Fonts } from '../../res';
import { ApiServices } from '../../services';
import { useSettingsStore } from '../../stores';
import type { SettingsResponse } from '../../stores/settings-store';

const POLL_INTERVAL_MS = 30000;

const formatWindow = (value: string | null): string | null => {
  if (!value) return null;
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format('MMM D, h:mm A') : value;
};

const MaintenanceScreen = () => {
  const { t } = useTranslation();
  const {
    message,
    start_at: startAt,
    end_at: endAt,
  } = useSettingsStore(useShallow((state) => state.getMaintenanceMode()));
  const setSettings = useSettingsStore((state) => state.setSettings);

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const response =
          (await ApiServices.getAppSettings()) as SettingsResponse;
        if (response) {
          setSettings(response);
        }
      } catch (error) {
        console.error('Failed to re-check maintenance status.', error);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(poll);
  }, [setSettings]);

  const start = formatWindow(startAt);
  const end = formatWindow(endAt);

  return (
    <Modal visible transparent onRequestClose={() => {}} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <RNText style={styles.title}>{t('maintenanceTitle')}</RNText>
          {message ? <RNText style={styles.message}>{message}</RNText> : null}
          {start && end ? (
            <RNText style={styles.window}>
              {t('maintenanceWindow', { start, end })}
            </RNText>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

export default MaintenanceScreen;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6),
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: wp(6),
  },
  title: {
    color: Colors.theme,
    fontFamily: Fonts.APPFONT_B,
    fontSize: wp(6),
    textAlign: 'center',
  },
  message: {
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color1,
    fontSize: wp(4),
    marginTop: hp(2),
    textAlign: 'center',
  },
  window: {
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color60,
    fontSize: wp(3.5),
    marginTop: hp(1.5),
    textAlign: 'center',
  },
});
