import React from 'react';
import { StyleSheet } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { wp } from '../../../global';
import { Colors } from '../../../res';
import Wiggle from './wiggle';

type GiftBadgeProps = {
  eligible: boolean;
  claimed: boolean;
  onPress: () => void;
};

// Three states, all tappable — the caller (which already knows
// strengthPct/giftThreshold) decides what onPress does for each: locked
// (muted, below the completion threshold) shows an explanatory hint,
// eligible (solid primary, wiggling to draw the eye) opens the claim modal,
// claimed (solid, verified-green — "opened") shows an already-claimed hint.
// Used identically in the OnboardingProfile header and the ME profile
// header so the gift reads the same wherever the user reaches it.
const GiftBadge = ({ eligible, claimed, onPress }: GiftBadgeProps) => {
  if (claimed) {
    return (
      <Ripple style={[Styles.chip, Styles.chipClaimed]} onPress={onPress}>
        <MaterialCommunityIcons
          name="gift-open-outline"
          size={wp(4.8)}
          color={Colors.verified}
        />
      </Ripple>
    );
  }

  if (!eligible) {
    return (
      <Ripple style={[Styles.chip, Styles.chipLocked]} onPress={onPress}>
        <Ionicons name="gift-outline" size={wp(4.2)} color={Colors.muted} />
      </Ripple>
    );
  }

  return (
    <Ripple style={[Styles.chip, Styles.chipEligible]} onPress={onPress}>
      <Wiggle active>
        <Ionicons name="gift" size={wp(4.2)} color={Colors.color2} />
      </Wiggle>
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
    backgroundColor: Colors.attention,
  },
  chipClaimed: {
    backgroundColor: 'rgba(46,158,91,0.12)',
  },
});
