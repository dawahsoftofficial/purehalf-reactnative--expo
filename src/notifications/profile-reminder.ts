import notifee, { AndroidImportance, TriggerType } from '@notifee/react-native';
import i18next from 'i18next';

import { LanguageKeys } from '../languages';

const REMINDER_ID = 'profile-completion-reminder';
const DEFAULT_DELAY_MS = 6 * 60 * 60 * 1000; // 6 hours

// One-shot local reminder for users who bail on profile building. Uses the
// existing 'default' channel created in index.js. Safe to call repeatedly —
// the fixed id means a new schedule replaces the old one.
export const scheduleProfileReminder = async (
  delayMs: number = DEFAULT_DELAY_MS
): Promise<void> => {
  try {
    await notifee.requestPermission();
    await notifee.createTriggerNotification(
      {
        id: REMINDER_ID,
        title: i18next.t(LanguageKeys.profileReminderTitle) as string,
        body: i18next.t(LanguageKeys.profileReminderBody) as string,
        android: {
          channelId: 'default',
          importance: AndroidImportance.DEFAULT,
          pressAction: { id: 'default', launchActivity: 'default' },
          smallIcon: 'ic_launcher',
        },
      },
      { type: TriggerType.TIMESTAMP, timestamp: Date.now() + delayMs }
    );
  } catch (error) {
    console.error('Failed to schedule profile reminder:', error);
  }
};

export const cancelProfileReminder = async (): Promise<void> => {
  try {
    await notifee.cancelTriggerNotification(REMINDER_ID);
  } catch (error) {
    console.error('Failed to cancel profile reminder:', error);
  }
};
