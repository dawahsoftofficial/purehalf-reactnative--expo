import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { wp } from '../../../global';
import { Colors } from '../../../res';

type GiftBadgeProps = {
  eligible: boolean;
  claimed: boolean;
  onPress: () => void;
};

// Three states: locked (muted, below the completion threshold), eligible
// (solid primary, tappable — opens the claim modal), claimed (checkmark,
// inert). Used identically in both the OnboardingProfile header and the ME
// profile header so the gift reads the same wherever the user reaches it.
const GiftBadge = ({ eligible, claimed, onPress }: GiftBadgeProps) => {
  if (claimed) {
    return (
      <View style={[Styles.chip, Styles.chipClaimed]}>
        <Ionicons name="checkmark" size={wp(4.2)} color={Colors.verified} />
      </View>
    );
  }

  if (!eligible) {
    return (
      <View style={[Styles.chip, Styles.chipLocked]}>
        <Ionicons name="gift-outline" size={wp(4.2)} color={Colors.muted} />
      </View>
    );
  }

  return (
    <Ripple style={[Styles.chip, Styles.chipEligible]} onPress={onPress}>
      <Ionicons name="gift" size={wp(4.2)} color={Colors.color2} />
    </Ripple>
  );
};

export default GiftBadge;

const Styles = StyleSheet.create({
  chip: {
    width: wp(8.5),
    height: wp(8.5),
    borderRadius: wp(4.25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLocked: {
    backgroundColor: Colors.lavender,
  },
  chipEligible: {
    backgroundColor: Colors.primary,
  },
  chipClaimed: {
    backgroundColor: 'rgba(46,158,91,0.12)',
  },
});
