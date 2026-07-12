import { t } from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text as ReactText,
  View,
} from 'react-native';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Button, Text } from '../../../components';
import { hp, Typography, wp } from '../../../global';
import { LanguageKeys } from '../../../languages';
import { Colors, Fonts } from '../../../res';
import { flashErrorMessage } from '../../../services';
import Confetti from '../../profile/components/confetti';

export type DailyVipReward = {
  available: boolean;
  eligible_days: number;
  daily_chats: number;
  total_chats: number;
  total_credits: number;
  next_available_at: string | null;
};

type ClaimResult = { user: any; reward: DailyVipReward };

type Props = {
  visible: boolean;
  reward: DailyVipReward | null;
  onClose: () => void;
  claim: () => Promise<ClaimResult>;
  onClaimed: (result: ClaimResult) => void;
};

const SUCCESS_HOLD_MS = 1700;

export default function DailyVipRewardModal({
  visible,
  reward,
  onClose,
  claim,
  onClaimed,
}: Props) {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const claimingRef = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  if (!reward) return null;

  const collect = () => {
    if (claimingRef.current || claimed) return;
    claimingRef.current = true;
    setClaiming(true);
    claim()
      .then((result) => {
        claimingRef.current = false;
        setClaiming(false);
        setClaimed(true);
        timer.current = setTimeout(() => {
          setClaimed(false);
          onClaimed(result);
        }, SUCCESS_HOLD_MS);
      })
      .catch((error) => {
        claimingRef.current = false;
        setClaiming(false);
        flashErrorMessage(
          typeof error === 'string' ? error : 'Failed to collect daily gift'
        );
      });
  };

  const shownDays = Array.from(
    { length: Math.min(reward.eligible_days, 7) },
    (_, index) => index + 1
  );
  const extraDays = Math.max(0, reward.eligible_days - shownDays.length);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={claiming || claimed ? undefined : onClose}
    >
      <View style={Styles.backdrop}>
        <View style={Styles.card}>
          {claimed ? (
            <View style={Styles.successWrap}>
              <Confetti />
              <View style={[Styles.heroIcon, Styles.successIcon]}>
                <Ionicons
                  name="checkmark"
                  size={wp(8)}
                  color={Colors.verified}
                />
              </View>
              <Text variant="display" style={Styles.title}>
                {LanguageKeys.youEarned}
              </Text>
              <ReactText style={Styles.total}>
                {t(LanguageKeys.vipDailyGiftSuccess, {
                  chats: reward.total_chats,
                })}
              </ReactText>
            </View>
          ) : (
            <>
              <View style={Styles.vipPill}>
                <Ionicons
                  name="diamond"
                  size={wp(3.5)}
                  color={Colors.surface}
                />
                <ReactText style={Styles.vipPillText}>VIP</ReactText>
              </View>
              <View style={Styles.heroIcon}>
                <Ionicons name="gift" size={wp(9)} color={Colors.primary} />
              </View>
              <Text variant="display" style={Styles.title}>
                {LanguageKeys.vipDailyGiftTitle}
              </Text>
              <ReactText style={Styles.subtitle}>
                {t(LanguageKeys.vipDailyGiftSubtitle, {
                  daily: reward.daily_chats,
                })}
              </ReactText>
              {reward.eligible_days > 1 ? (
                <ReactText style={Styles.catchUp}>
                  {t(LanguageKeys.vipDailyGiftCatchUp, {
                    days: reward.eligible_days,
                  })}
                </ReactText>
              ) : null}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={Styles.days}
              >
                {shownDays.map((day) => (
                  <Ripple
                    key={day}
                    style={Styles.dayGift}
                    onPress={collect}
                    disabled={claiming}
                  >
                    <Ionicons
                      name="gift"
                      size={wp(5.5)}
                      color={Colors.color2}
                    />
                    <ReactText style={Styles.dayLabel}>
                      {t(LanguageKeys.vipDailyGiftDay, { day })}
                    </ReactText>
                    <ReactText style={Styles.dayChats}>
                      +{reward.daily_chats}
                    </ReactText>
                  </Ripple>
                ))}
                {extraDays > 0 ? (
                  <Ripple
                    style={Styles.dayGift}
                    onPress={collect}
                    disabled={claiming}
                  >
                    <ReactText style={Styles.moreDays}>+{extraDays}</ReactText>
                    <ReactText style={Styles.dayLabel}>more</ReactText>
                  </Ripple>
                ) : null}
              </ScrollView>
              <ReactText style={Styles.tapHint}>
                {t(LanguageKeys.vipDailyGiftTap)}
              </ReactText>
              <View style={Styles.totalRow}>
                <ReactText style={Styles.totalLabel}>
                  {t(LanguageKeys.chatCredits)}
                </ReactText>
                <ReactText style={Styles.totalValue}>
                  +{reward.total_chats}
                </ReactText>
              </View>
              <View style={Styles.buttons}>
                <Button
                  variant="outline"
                  buttonStyle={Styles.button}
                  text={LanguageKeys.maybeLater}
                  onPress={claiming ? undefined : onClose}
                  disabled={claiming}
                />
                <Button
                  buttonStyle={Styles.button}
                  text={t(LanguageKeys.vipDailyGiftClaim, {
                    chats: reward.total_chats,
                  })}
                  onPress={collect}
                  disabled={claiming}
                  loading={claiming}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const Styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,12,28,0.64)',
    justifyContent: 'center',
    paddingHorizontal: wp(5),
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: wp(6),
    padding: wp(5),
    alignItems: 'center',
    overflow: 'hidden',
  },
  vipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    backgroundColor: Colors.primary,
    borderRadius: wp(5),
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.55),
    alignSelf: 'flex-start',
  },
  vipPillText: {
    color: Colors.surface,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.tiny,
  },
  heroIcon: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(9),
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(1),
    marginBottom: hp(1.4),
  },
  successIcon: { backgroundColor: 'rgba(46,158,91,0.12)' },
  title: {
    color: Colors.ink,
    fontSize: Typography.medium1,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    marginTop: hp(0.7),
    textAlign: 'center',
  },
  catchUp: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small3,
    textAlign: 'center',
    marginTop: hp(1.1),
  },
  days: { gap: wp(2.2), paddingVertical: hp(2), paddingHorizontal: wp(1) },
  dayGift: {
    width: wp(20),
    minHeight: hp(10),
    borderRadius: wp(4),
    backgroundColor: Colors.lavender,
    borderWidth: 1,
    borderColor: 'rgba(100,67,170,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(2),
  },
  dayLabel: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.tiny,
    marginTop: hp(0.35),
  },
  dayChats: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small2,
    marginTop: hp(0.25),
  },
  moreDays: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium1,
  },
  tapHint: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.tiny,
    marginBottom: hp(1.5),
  },
  totalRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.appBg,
    borderRadius: wp(3),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.4),
  },
  totalLabel: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
  },
  totalValue: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium1,
  },
  buttons: {
    flexDirection: 'row',
    gap: wp(3),
    width: '100%',
    marginTop: hp(2.2),
  },
  button: { flex: 1 },
  successWrap: {
    minHeight: hp(27),
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  total: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium1,
    textAlign: 'center',
    marginTop: hp(1),
  },
});
