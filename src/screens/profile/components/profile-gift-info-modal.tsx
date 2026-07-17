import { t } from 'i18next';
import React from 'react';
import { Modal, StyleSheet, Text as ReactText, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { Button, Text } from '../../../components';
import { hp, Typography, wp } from '../../../global';
import { LanguageKeys } from '../../../languages';
import { creditsToChats } from '../../../lib/utils/chat-credits';
import { Colors, Fonts } from '../../../res';

export type ProfileGiftInfoVariant = 'locked' | 'claimed';

type ProfileGiftInfoModalProps = {
  visible: boolean;
  variant: ProfileGiftInfoVariant;
  percent: number;
  /** Raw credits from the profile_completion_gift_credits setting. */
  credits: number;
  onClose: () => void;
  onStart: () => void;
};

// The two gift states that can't be claimed right now, which previously only
// flashed a toast. `locked` explains what the gift is and offers a route into
// the profile questions; `claimed` just confirms it's already spent. Claiming
// itself stays in GiftClaimModal — this modal holds no state and calls no API,
// so the caller decides what "start" means.
const ProfileGiftInfoModal = ({
  visible,
  variant,
  percent,
  credits,
  onClose,
  onStart,
}: ProfileGiftInfoModalProps) => {
  const claimed = variant === 'claimed';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={Styles.wrapper}>
        <View style={Styles.card}>
          <View style={[Styles.iconChip, claimed && Styles.iconChipClaimed]}>
            {claimed ? (
              // gift-open-outline is a MaterialCommunityIcons glyph; Ionicons
              // has no open-gift equivalent.
              <MaterialCommunityIcons
                name="gift-open-outline"
                size={wp(7)}
                color={Colors.verified}
              />
            ) : (
              <Ionicons name="gift" size={wp(7)} color={Colors.primary} />
            )}
          </View>
          <Text variant="display" style={Styles.title}>
            {claimed
              ? LanguageKeys.giftClaimedTitle
              : LanguageKeys.giftInfoTitle}
          </Text>
          <ReactText style={Styles.body}>
            {claimed
              ? t(LanguageKeys.giftClaimedBody, {
                  chats: creditsToChats(credits),
                })
              : t(LanguageKeys.giftInfoBody, {
                  percent,
                  chats: creditsToChats(credits),
                })}
          </ReactText>
          {claimed ? (
            <Button
              onPress={onClose}
              buttonStyle={Styles.singleButton}
              text={LanguageKeys.gotIt}
            />
          ) : (
            <View style={Styles.buttonRow}>
              <Button
                variant="outline"
                onPress={onClose}
                buttonStyle={Styles.button}
                text={LanguageKeys.maybeLater}
              />
              <Button
                onPress={onStart}
                buttonStyle={Styles.button}
                text={LanguageKeys.giftStartNow}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default ProfileGiftInfoModal;

// Mirrors gift-claim-modal.tsx so the two gift dialogs read as one family.
const Styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6),
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: wp(4),
    padding: wp(5),
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconChip: {
    width: wp(16),
    height: wp(16),
    borderRadius: wp(8),
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.5),
  },
  iconChipClaimed: {
    backgroundColor: 'rgba(46,158,91,0.12)',
  },
  title: {
    color: Colors.ink,
    fontSize: Typography.medium1,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  body: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    textAlign: 'center',
    alignSelf: 'stretch',
    marginTop: hp(1),
  },
  buttonRow: {
    flexDirection: 'row',
    gap: wp(3),
    marginTop: hp(2.5),
    width: '100%',
  },
  button: {
    flex: 1,
  },
  singleButton: {
    alignSelf: 'stretch',
    width: '100%',
    marginTop: hp(2.5),
  },
});
