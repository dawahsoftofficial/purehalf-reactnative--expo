import { t } from 'i18next';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text as ReactText, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Button, Text } from '../../../components';
import { hp, Typography, wp } from '../../../global';
import { LanguageKeys } from '../../../languages';
import { Colors, Fonts } from '../../../res';
import { flashErrorMessage } from '../../../services';
import type { ClaimResult } from '../gift-claim-outcome';

type GiftClaimModalProps = {
  visible: boolean;
  giftCredits: number;
  onClose: () => void;
  onClaimed: (result: ClaimResult) => void;
  claim: () => Promise<ClaimResult>;
};

// Presented when the user taps an eligible GiftBadge. Owns only the
// confirm/claim round trip; the parent decides what eligible/claimed mean
// and how to persist the result on currentUser.
const GiftClaimModal = ({
  visible,
  giftCredits,
  onClose,
  onClaimed,
  claim,
}: GiftClaimModalProps) => {
  const [claiming, setClaiming] = useState(false);

  const onClaimPress = () => {
    if (claiming) return;
    setClaiming(true);
    claim()
      .then((result) => {
        setClaiming(false);
        onClaimed(result);
      })
      .catch((error) => {
        setClaiming(false);
        flashErrorMessage(
          typeof error === 'string' ? error : 'Failed to claim gift'
        );
      });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={claiming ? undefined : onClose}
    >
      <View style={Styles.wrapper}>
        <View style={Styles.card}>
          <View style={Styles.iconChip}>
            <Ionicons name="gift" size={wp(7)} color={Colors.primary} />
          </View>
          <Text variant="display" style={Styles.title}>
            {LanguageKeys.giftClaimTitle}
          </Text>
          <ReactText style={Styles.body}>
            {t(LanguageKeys.giftClaimBody, { amount: giftCredits })}
          </ReactText>
          <View style={Styles.buttonRow}>
            <Button
              variant="outline"
              onPress={claiming ? undefined : onClose}
              buttonStyle={Styles.button}
              text={LanguageKeys.maybeLater}
              disabled={claiming}
            />
            <Button
              onPress={onClaimPress}
              buttonStyle={Styles.button}
              text={LanguageKeys.claimGift}
              disabled={claiming}
              loading={claiming}
              loadingMessage={LanguageKeys.updating}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default GiftClaimModal;

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
  title: {
    color: Colors.ink,
    fontSize: Typography.medium1,
    textAlign: 'center',
  },
  body: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    textAlign: 'center',
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
});
