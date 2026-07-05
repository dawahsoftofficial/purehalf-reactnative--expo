import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Button, Text } from '@/components';
import { hp, wp } from '@/global';
import { LanguageKeys } from '@/languages';
import { requestRateApp } from '@/lib/utils/rate-app';
import { Colors, Fonts } from '@/res';
import { ApiServices, flashSuccessMessage, useGlobalContext } from '@/services';
import {
  markCompleted,
  markPromptShown,
} from '@/services/rating/ratingEngagement';
import { useRatingStore, useSettingsStore } from '@/stores';

const STAR_COUNT = 5;

const RatingPromptModal = () => {
  const { t } = useTranslation();
  const { visible, trigger, hide } = useRatingStore();
  const { currentUser } = useGlobalContext();
  const getRatingPrompt = useSettingsStore((s) => s.getRatingPrompt);

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setStars(0);
    setComment('');
    setSubmitting(false);
  };

  const closeAndReset = () => {
    hide();
    reset();
  };

  const onDismiss = () => {
    markPromptShown();
    closeAndReset();
  };

  const onSubmit = async () => {
    if (stars < 1 || submitting) return;
    setSubmitting(true);

    const config = getRatingPrompt();
    const goesToStore = stars >= config.storeMinStars;

    markPromptShown();

    try {
      await ApiServices.storeRating({
        stars,
        comment: comment.trim() || null,
        trigger_event: trigger,
        platform: Platform.OS,
        app_version: DeviceInfo.getVersion(),
      });
      markCompleted();
      closeAndReset();
      flashSuccessMessage(LanguageKeys.ratingThankYou);

      if (goesToStore) {
        await requestRateApp();
      }
    } catch (_error) {
      // Service layer logs the failure; dismiss without marking completed so a
      // genuine submission can be retried after the cooldown.
      closeAndReset();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{t(LanguageKeys.ratingPromptTitle)}</Text>
          <Text style={styles.subtitle}>
            {t(LanguageKeys.ratingPromptSubtitle)}
          </Text>

          <View style={styles.starsRow}>
            {Array.from({ length: STAR_COUNT }).map((_, i) => {
              const index = i + 1;
              const filled = index <= stars;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setStars(index)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={filled ? 'star' : 'star-outline'}
                    size={wp(9)}
                    color={filled ? Colors.primary : Colors.color1}
                    style={styles.star}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={styles.input}
            placeholder={t(LanguageKeys.ratingCommentPlaceholder)}
            placeholderTextColor={Colors.color1}
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={1000}
          />

          <Button
            buttonStyle={styles.submitBtn}
            onPress={onSubmit}
            text={t(LanguageKeys.ratingSubmit)}
            disabled={stars < 1 || submitting}
          />
          <TouchableOpacity onPress={onDismiss} style={styles.notNowBtn}>
            <Text style={styles.notNowText}>
              {t(LanguageKeys.ratingNotNow)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default RatingPromptModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: wp(6),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: wp(6),
    alignItems: 'center',
  },
  title: {
    color: Colors.theme,
    fontFamily: Fonts.APPFONT_B,
    fontSize: wp(5.5),
    textAlign: 'center',
    includeFontPadding: false,
  },
  subtitle: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_R,
    fontSize: wp(3.8),
    textAlign: 'center',
    marginTop: wp(2),
  },
  starsRow: {
    flexDirection: 'row',
    marginVertical: wp(5),
  },
  star: {
    marginHorizontal: wp(1.5),
  },
  input: {
    width: '100%',
    minHeight: hp(10),
    borderWidth: 1,
    borderColor: Colors.primaryLite,
    borderRadius: 12,
    padding: wp(3),
    textAlignVertical: 'top',
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_R,
    fontSize: wp(3.8),
  },
  submitBtn: {
    marginTop: wp(5),
    borderRadius: 30,
    paddingVertical: hp(0.3),
    paddingHorizontal: wp(2.2),
    width: '100%',
  },
  notNowBtn: {
    marginTop: wp(3),
    paddingVertical: wp(2),
  },
  notNowText: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_R,
    fontSize: wp(3.8),
  },
});
