import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

import BoostCoinIcon from '../../assets/svgs/coins/boost-coin.svg';
import { hp, wp } from '../../global';
import { Colors } from '../../res';

type BoostBadgeProps = {
  onPress?: () => void;
  disabled?: boolean;
};

function BoostBadge({ onPress, disabled = false }: BoostBadgeProps) {
  const badgeContent = (
    <View style={Styles.container}>
      <View style={Styles.iconContainer}>
        <BoostCoinIcon width={wp(6)} height={wp(6)} />
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Ripple
        style={Styles.rippleContainer}
        onPress={onPress}
        disabled={disabled}
      >
        {badgeContent}
      </Ripple>
    );
  }

  return <View style={Styles.rippleContainer}>{badgeContent}</View>;
}

export default BoostBadge;

const Styles = StyleSheet.create({
  rippleContainer: {
    borderRadius: wp(4),
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.theme,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: wp(4),
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
