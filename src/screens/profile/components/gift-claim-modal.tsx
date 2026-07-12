import { t } from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text as ReactText, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Button, Text } from '../../../components';
import { hp, Typography, wp } from '../../../global';
import { LanguageKeys } from '../../../languages';
import { Colors, Fonts } from '../../../res';
import { flashErrorMessage } from '../../../services';
import type { ClaimResult } from '../gift-claim-outcome';
import Confetti from './confetti';

type GiftClaimModalProps = {
  visible: boolean;
  giftCredits: number;
  onClose: () => void;
  onClaimed: (result: ClaimResult) => void;
  claim: () => Promise<ClaimResult>;
};

// How long the confetti/success view holds before handing off to the parent
// (which updates currentUser and closes this modal).
const SUCCESS_HOLD_MS = 1800;

// Presented when the user taps an eligible GiftBadge. Owns the confirm/claim
// round trip and the brief celebratory view on a fresh claim; the parent
// decides what eligible/claimed mean and how to persist the result on
// currentUser.
const GiftClaimModal = ({
  visible,
  giftCredits,
  onClose,
  onClaimed,
  claim,
}: GiftClaimModalProps) => {
  const [claiming, setClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState<ClaimResult | null>(null);
  const handoffTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards re-entrancy synchronously. claiming (state) only takes effect on
  // the next render, so a second tap landing in the same tick as the first
  // (e.g. a fast double-tap) could otherwise slip through and fire a second
  // claim() before the button re-renders as disabled/loading.
  const claimingRef = useRef(false);

  useEffect(
    () => () => {
      if (handoffTimer.current) clearTimeout(handoffTimer.current);
    },
    []
  );

  const onClaimPress = () => {
    if (claimingRef.current) return;
    claimingRef.current = true;
    setClaiming(true);
    // Clear any previous run's success view before starting a new attempt —
    // in practice this modal isn't reachable again after a genuine claim
    // (the badge permanently switches to its claimed state), but this keeps
    // a repeat open/claim sequence honest regardless.
    setJustClaimed(null);
    claim()
      .then((result) => {
        claimingRef.current = false;
        setClaiming(false);
        if (result.status === 'claimed') {
          setJustClaimed(result);
          handoffTimer.current = setTimeout(
            () => onClaimed(result),
            SUCCESS_HOLD_MS
          );
        } else {
          onClaimed(result);
        }
      })
      .catch((error) => {
        claimingRef.current = false;
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
      statusBarTranslucent
      onRequestClose={claiming || justClaimed ? undefined : onClose}
    >
      <View style={Styles.wrapper}>
        <View style={Styles.card}>
          {justClaimed ? (
            <>
              <Confetti />
              <View style={[Styles.iconChip, Styles.iconChipSuccess]}>
                <Ionicons
                  name="checkmark"
                  size={wp(7)}
                  color={Colors.verified}
                />
              </View>
              <Text variant="display" style={Styles.title}>
                {LanguageKeys.youEarned}
              </Text>
              <ReactText style={Styles.body}>
                {`+${Math.floor(justClaimed.awarded / 50)} ${t(LanguageKeys.chatCredits)}`}
              </ReactText>
            </>
          ) : (
            <>
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
            </>
          )}
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
  iconChipSuccess: {
    backgroundColor: 'rgba(46,158,91,0.12)',
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
});
